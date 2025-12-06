/*
  # Meal Plan Activity Tracking and Enhanced Notifications

  ## Overview
  This migration adds comprehensive activity tracking for meal plans and enhances the notification
  system to notify recipe creators when their recipes are used, forked, or receive pull requests.

  ## New Tables

  ### 1. `meal_plan_activity`
  Tracks when users add recipes to their meal plans for notification and analytics purposes.
  - `id` (uuid, primary key)
  - `recipe_id` (uuid, references recipes) - The recipe being added
  - `recipe_owner_id` (uuid, references user_profiles) - Owner of the recipe
  - `planner_user_id` (uuid, references user_profiles) - User adding to meal plan
  - `meal_plan_id` (uuid, references meal_plans) - The meal plan entry
  - `date` (date) - Date planned for
  - `meal_type` (text) - breakfast, lunch, dinner, snack
  - `notified` (boolean) - Whether owner was notified
  - `created_at` (timestamptz)

  ### 2. `recipe_usage_stats`
  Aggregate statistics showing recipe popularity and usage patterns.
  - `recipe_id` (uuid, primary key, references recipes)
  - `total_meal_plans` (integer) - Times added to meal plans
  - `total_cooks` (integer) - Times marked as cooked
  - `last_used_date` (timestamptz) - Most recent meal plan add
  - `trending_score` (integer) - Calculated popularity score
  - `this_week_plans` (integer) - Plans added this week
  - `updated_at` (timestamptz)

  ### 3. `notification_preferences`
  User preferences for different notification types.
  - `user_id` (uuid, primary key, references user_profiles)
  - `meal_plan_notifications` (boolean) - Notify when recipe added to plans
  - `pull_request_notifications` (boolean) - Notify on PR activity
  - `fork_notifications` (boolean) - Notify when recipes are forked
  - `comment_notifications` (boolean) - Notify on comments
  - `digest_frequency` (text) - instant, daily, weekly
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Table Updates

  ### Update `notifications` table
  - Fix column name from `read` to `is_read` for consistency
  - Add `actor_user_id` field to track who triggered the notification
  - Add `recipe_id` field for quick recipe references
  - Add `metadata` jsonb field for additional context

  ## Functions and Triggers

  ### Function: `notify_recipe_owner_on_meal_plan()`
  Automatically creates notification when someone adds recipe to meal plan.

  ### Function: `update_recipe_usage_stats()`
  Updates aggregate statistics when meal plans are modified.

  ## Security
  - Enable RLS on all new tables
  - Users can only view their own meal plan activity
  - Recipe usage stats are publicly readable
  - Notification preferences are private to each user
  - Respect privacy settings when creating notifications

  ## Indexes
  - Index on meal_plan_activity for recipe_owner queries
  - Index on notification timestamps and read status
  - Index on recipe_usage_stats for trending queries
*/

-- First, let's fix the notifications table column name inconsistency
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'read'
  ) THEN
    ALTER TABLE notifications RENAME COLUMN "read" TO is_read;
  END IF;
END $$;

-- Add new fields to notifications table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'actor_user_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN actor_user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'recipe_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE notifications ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create meal_plan_activity table
CREATE TABLE IF NOT EXISTS meal_plan_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  recipe_owner_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  planner_user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  meal_plan_id uuid NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  date date NOT NULL,
  meal_type text NOT NULL,
  notified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meal_plan_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view meal plan activity for their recipes"
  ON meal_plan_activity FOR SELECT
  TO authenticated
  USING (auth.uid() = recipe_owner_id OR auth.uid() = planner_user_id);

CREATE POLICY "System can insert meal plan activity"
  ON meal_plan_activity FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = planner_user_id);

-- Create recipe_usage_stats table
CREATE TABLE IF NOT EXISTS recipe_usage_stats (
  recipe_id uuid PRIMARY KEY REFERENCES recipes(id) ON DELETE CASCADE,
  total_meal_plans integer DEFAULT 0,
  total_cooks integer DEFAULT 0,
  last_used_date timestamptz,
  trending_score integer DEFAULT 0,
  this_week_plans integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE recipe_usage_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view recipe usage stats"
  ON recipe_usage_stats FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can update recipe usage stats"
  ON recipe_usage_stats FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can modify recipe usage stats"
  ON recipe_usage_stats FOR UPDATE
  TO authenticated
  USING (true);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  meal_plan_notifications boolean DEFAULT true,
  pull_request_notifications boolean DEFAULT true,
  fork_notifications boolean DEFAULT true,
  comment_notifications boolean DEFAULT true,
  digest_frequency text DEFAULT 'instant',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_meal_plan_activity_recipe_owner ON meal_plan_activity(recipe_owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meal_plan_activity_recipe ON meal_plan_activity(recipe_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_activity_notified ON meal_plan_activity(notified, recipe_owner_id);
CREATE INDEX IF NOT EXISTS idx_notifications_actor ON notifications(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipe ON notifications(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_usage_trending ON recipe_usage_stats(trending_score DESC, this_week_plans DESC);

-- Function to create notification for recipe owner when added to meal plan
CREATE OR REPLACE FUNCTION notify_recipe_owner_on_meal_plan()
RETURNS TRIGGER AS $$
DECLARE
  v_recipe RECORD;
  v_planner RECORD;
  v_preferences RECORD;
BEGIN
  -- Get recipe details
  SELECT r.*, u.id as owner_id, u.username as owner_username
  INTO v_recipe
  FROM recipes r
  JOIN user_profiles u ON r.created_by = u.id
  WHERE r.id = NEW.recipe_id;

  -- Don't notify if user is adding their own recipe
  IF v_recipe.owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Get planner details
  SELECT username INTO v_planner
  FROM user_profiles
  WHERE id = NEW.user_id;

  -- Check notification preferences
  SELECT * INTO v_preferences
  FROM notification_preferences
  WHERE user_id = v_recipe.owner_id;

  -- If no preferences exist, use defaults (notifications enabled)
  IF v_preferences IS NULL OR v_preferences.meal_plan_notifications = true THEN
    -- Create notification
    INSERT INTO notifications (
      user_id,
      actor_user_id,
      recipe_id,
      type,
      title,
      message,
      link,
      is_read,
      metadata
    ) VALUES (
      v_recipe.owner_id,
      NEW.user_id,
      NEW.recipe_id,
      'meal_plan_added',
      'Recipe Added to Meal Plan',
      v_planner.username || ' added your recipe "' || v_recipe.title || '" to their meal plan',
      '/recipe/' || NEW.recipe_id,
      false,
      jsonb_build_object(
        'meal_date', NEW.date,
        'meal_type', NEW.meal_type,
        'planner_username', v_planner.username
      )
    );

    -- Track in meal_plan_activity
    INSERT INTO meal_plan_activity (
      recipe_id,
      recipe_owner_id,
      planner_user_id,
      meal_plan_id,
      date,
      meal_type,
      notified
    ) VALUES (
      NEW.recipe_id,
      v_recipe.owner_id,
      NEW.user_id,
      NEW.id,
      NEW.date,
      NEW.meal_type,
      true
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update recipe usage statistics
CREATE OR REPLACE FUNCTION update_recipe_usage_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_week_start date;
BEGIN
  v_week_start := date_trunc('week', CURRENT_DATE)::date;

  -- Insert or update stats
  INSERT INTO recipe_usage_stats (
    recipe_id,
    total_meal_plans,
    last_used_date,
    this_week_plans,
    trending_score,
    updated_at
  ) VALUES (
    NEW.recipe_id,
    1,
    now(),
    CASE WHEN NEW.date >= v_week_start THEN 1 ELSE 0 END,
    1,
    now()
  )
  ON CONFLICT (recipe_id) DO UPDATE SET
    total_meal_plans = recipe_usage_stats.total_meal_plans + 1,
    last_used_date = now(),
    this_week_plans = recipe_usage_stats.this_week_plans + 
      CASE WHEN NEW.date >= v_week_start THEN 1 ELSE 0 END,
    trending_score = (recipe_usage_stats.this_week_plans + 1) * 2 + recipe_usage_stats.total_meal_plans,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_notify_recipe_owner ON meal_plans;
CREATE TRIGGER trigger_notify_recipe_owner
  AFTER INSERT ON meal_plans
  FOR EACH ROW
  EXECUTE FUNCTION notify_recipe_owner_on_meal_plan();

DROP TRIGGER IF EXISTS trigger_update_recipe_stats ON meal_plans;
CREATE TRIGGER trigger_update_recipe_stats
  AFTER INSERT ON meal_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_recipe_usage_stats();
