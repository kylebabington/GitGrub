/*
  # Add Live Cook-Along Sessions System

  1. New Tables
    - `cook_along_sessions`
      - `id` (uuid, primary key)
      - `host_id` (uuid, references user_profiles)
      - `recipe_id` (uuid, references recipes)
      - `title` (text) - session title
      - `description` (text) - what to expect
      - `scheduled_start` (timestamptz) - when session is scheduled
      - `actual_start` (timestamptz) - when session actually started
      - `ended_at` (timestamptz) - when session ended
      - `status` (text) - scheduled, live, ended, cancelled
      - `current_step` (integer) - current step host is on
      - `participant_count` (integer) - number of participants
      - `is_public` (boolean) - public or private session
      - `max_participants` (integer) - max number of participants
      - `created_at` (timestamptz)

    - `cook_along_participants`
      - `id` (uuid, primary key)
      - `session_id` (uuid, references cook_along_sessions)
      - `user_id` (uuid, references user_profiles)
      - `joined_at` (timestamptz)
      - `current_step` (integer) - where participant is
      - `status` (text) - active, completed, dropped
      - `updated_at` (timestamptz)

    - `cook_along_chat`
      - `id` (uuid, primary key)
      - `session_id` (uuid, references cook_along_sessions)
      - `user_id` (uuid, references user_profiles)
      - `message` (text)
      - `message_type` (text) - chat, question, tip, reaction
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Public can view scheduled public sessions
    - Participants can view and join sessions
    - Only host can control session (update current_step, end session)
    - Participants can send chat messages

  3. Indexes
    - Index on status for filtering sessions
    - Index on scheduled_start for upcoming sessions
    - Index on host_id and recipe_id for lookups
*/

CREATE TABLE IF NOT EXISTS cook_along_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  scheduled_start timestamptz NOT NULL,
  actual_start timestamptz,
  ended_at timestamptz,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
  current_step integer DEFAULT 0,
  participant_count integer DEFAULT 0,
  is_public boolean DEFAULT true,
  max_participants integer DEFAULT 50,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cook_along_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES cook_along_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at timestamptz DEFAULT now(),
  current_step integer DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(session_id, user_id)
);

CREATE TABLE IF NOT EXISTS cook_along_chat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES cook_along_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  message_type text DEFAULT 'chat' CHECK (message_type IN ('chat', 'question', 'tip', 'reaction')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cook_along_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cook_along_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE cook_along_chat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view public sessions"
  ON cook_along_sessions FOR SELECT
  TO authenticated
  USING (is_public = true OR host_id = auth.uid());

CREATE POLICY "Host can manage own sessions"
  ON cook_along_sessions FOR ALL
  TO authenticated
  USING (host_id = auth.uid())
  WITH CHECK (host_id = auth.uid());

CREATE POLICY "Users can view participant list"
  ON cook_along_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cook_along_sessions
      WHERE cook_along_sessions.id = cook_along_participants.session_id
      AND (cook_along_sessions.is_public = true OR cook_along_sessions.host_id = auth.uid())
    )
  );

CREATE POLICY "Users can join sessions"
  ON cook_along_participants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participation"
  ON cook_along_participants FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view session chat"
  ON cook_along_chat FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cook_along_participants
      WHERE cook_along_participants.session_id = cook_along_chat.session_id
      AND cook_along_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can send messages"
  ON cook_along_chat FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM cook_along_participants
      WHERE cook_along_participants.session_id = cook_along_chat.session_id
      AND cook_along_participants.user_id = auth.uid()
      AND cook_along_participants.status = 'active'
    )
  );

CREATE INDEX idx_cook_along_sessions_status ON cook_along_sessions(status);
CREATE INDEX idx_cook_along_sessions_scheduled ON cook_along_sessions(scheduled_start);
CREATE INDEX idx_cook_along_sessions_host ON cook_along_sessions(host_id);
CREATE INDEX idx_cook_along_sessions_recipe ON cook_along_sessions(recipe_id);
CREATE INDEX idx_cook_along_participants_session ON cook_along_participants(session_id);
CREATE INDEX idx_cook_along_participants_user ON cook_along_participants(user_id);
CREATE INDEX idx_cook_along_chat_session ON cook_along_chat(session_id);
