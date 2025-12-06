/*
  # Add Achievement and Gamification System

  1. New Tables
    - `achievements`
      - `id` (uuid, primary key)
      - `code` (text, unique) - achievement identifier
      - `title` (text) - achievement name
      - `description` (text) - what you need to do
      - `icon` (text) - icon name
      - `category` (text) - cooking, social, explorer, etc
      - `points` (integer) - XP points awarded
      - `created_at` (timestamptz)

    - `user_achievements`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `achievement_id` (uuid, references achievements)
      - `unlocked_at` (timestamptz)

    - `user_stats`
      - `user_id` (uuid, primary key, references user_profiles)
      - `total_xp` (integer) - total experience points
      - `level` (integer) - current chef level
      - `recipes_cooked` (integer) - total recipes made
      - `cooking_streak` (integer) - consecutive days cooking
      - `last_cooked_date` (date) - last day they cooked
      - `cuisines_tried` (text[]) - array of cuisine types
      - `ingredients_used` (text[]) - unique ingredients
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Public read access for achievements
    - Users can only view their own stats and achievements
*/

CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  category text NOT NULL,
  points integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id uuid REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS user_stats (
  user_id uuid PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  total_xp integer DEFAULT 0,
  level integer DEFAULT 1,
  recipes_cooked integer DEFAULT 0,
  cooking_streak integer DEFAULT 0,
  last_cooked_date date,
  cuisines_tried text[] DEFAULT '{}',
  ingredients_used text[] DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view achievements"
  ON achievements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert achievements"
  ON user_achievements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own stats"
  ON user_stats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
  ON user_stats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats"
  ON user_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_achievements_category ON achievements(category);

INSERT INTO achievements (code, title, description, icon, category, points) VALUES
  ('first_recipe', 'First Recipe', 'Create your first recipe', 'BookOpen', 'cooking', 10),
  ('early_bird', 'Early Bird', 'Cook a breakfast recipe', 'Sunrise', 'cooking', 5),
  ('night_owl', 'Night Owl', 'Cook a dinner recipe after 8pm', 'Moon', 'cooking', 5),
  ('week_warrior', 'Week Warrior', 'Cook 7 days in a row', 'Flame', 'cooking', 50),
  ('social_butterfly', 'Social Butterfly', 'Follow 10 other chefs', 'Users', 'social', 15),
  ('reviewer', 'Helpful Reviewer', 'Leave 10 recipe reviews', 'Star', 'social', 20),
  ('fork_master', 'Fork Master', 'Fork 5 recipes', 'GitFork', 'social', 25),
  ('globe_trotter', 'Globe Trotter', 'Try recipes from 5 different cuisines', 'Globe', 'explorer', 30),
  ('ingredient_explorer', 'Ingredient Explorer', 'Use 50 unique ingredients', 'ShoppingCart', 'explorer', 40),
  ('master_chef', 'Master Chef', 'Cook 100 recipes', 'ChefHat', 'cooking', 100),
  ('speed_cook', 'Speed Cook', 'Complete a recipe in under 15 minutes', 'Zap', 'cooking', 15),
  ('meal_planner_pro', 'Meal Planner Pro', 'Plan a full week of meals', 'Calendar', 'planner', 20),
  ('zero_waste', 'Zero Waste Chef', 'Use all ingredients from shopping list', 'Leaf', 'planner', 25)
ON CONFLICT (code) DO NOTHING;
