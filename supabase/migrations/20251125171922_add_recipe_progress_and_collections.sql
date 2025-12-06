/*
  # Recipe Progress Tracking & Collections System

  ## Overview
  Adds intelligent UX features including recipe progress tracking, custom collections,
  and ingredient substitutions to make GitGrub intuitive and delightful.

  ## New Tables

  ### 1. `recipe_progress`
  Tracks user progress through recipe steps for resume functionality.
  - `id` (uuid, primary key)
  - `user_id` (uuid, references user_profiles) - Who's cooking
  - `recipe_id` (uuid, references recipes) - Which recipe
  - `completed_steps` (integer[]) - Array of step numbers completed
  - `current_step` (integer) - Current step index
  - `started_at` (timestamptz) - When they started cooking
  - `last_updated` (timestamptz) - Last progress update
  - `completed_at` (timestamptz) - When they finished (nullable)
  - `session_data` (jsonb) - Timer states, notes, etc.

  ### 2. `recipe_collections`
  User-created collections for organizing recipes.
  - `id` (uuid, primary key)
  - `user_id` (uuid, references user_profiles) - Collection owner
  - `name` (text) - Collection name ("Weeknight Dinners")
  - `description` (text) - Optional description
  - `color` (text) - Color tag for UI
  - `icon` (text) - Icon name for display
  - `is_default` (boolean) - System default collections
  - `recipe_count` (integer) - Cached count
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `collection_recipes`
  Many-to-many relationship between collections and recipes.
  - `id` (uuid, primary key)
  - `collection_id` (uuid, references recipe_collections)
  - `recipe_id` (uuid, references recipes)
  - `added_by` (uuid, references user_profiles)
  - `added_at` (timestamptz)
  - `sort_order` (integer) - Manual ordering
  - `notes` (text) - Personal notes about this recipe in collection

  ### 4. `ingredient_substitutions`
  Database of ingredient substitutions with community voting.
  - `id` (uuid, primary key)
  - `original_ingredient` (text) - Original ingredient name (normalized)
  - `substitute_ingredient` (text) - Substitute ingredient
  - `substitute_quantity_ratio` (decimal) - Conversion ratio (1.0 = 1:1)
  - `category` (text) - dietary, allergy, preference, availability
  - `dietary_tags` (text[]) - vegan, keto, gluten-free, etc.
  - `confidence_score` (integer) - Community confidence (0-100)
  - `use_count` (integer) - Times this substitution was used
  - `notes` (text) - Usage notes
  - `created_by` (uuid, references user_profiles)
  - `created_at` (timestamptz)

  ### 5. `substitution_votes`
  Community voting on substitution quality.
  - `id` (uuid, primary key)
  - `substitution_id` (uuid, references ingredient_substitutions)
  - `user_id` (uuid, references user_profiles)
  - `vote` (integer) - 1 (helpful) or -1 (not helpful)
  - `comment` (text) - Optional feedback
  - `created_at` (timestamptz)
  - UNIQUE(substitution_id, user_id)

  ### 6. `cooking_timers`
  Active timers for recipes being cooked.
  - `id` (uuid, primary key)
  - `user_id` (uuid, references user_profiles)
  - `recipe_id` (uuid, references recipes)
  - `step_number` (integer) - Which step this timer is for
  - `duration_seconds` (integer) - Original duration
  - `remaining_seconds` (integer) - Time remaining
  - `started_at` (timestamptz)
  - `ends_at` (timestamptz)
  - `is_active` (boolean)
  - `notification_sent` (boolean)

  ## Security
  - Enable RLS on all tables
  - Users can only manage their own progress and collections
  - Substitutions are publicly readable
  - Anyone can suggest substitutions (moderated)

  ## Indexes
  - recipe_progress: (user_id, recipe_id) for quick lookups
  - collection_recipes: (collection_id, recipe_id) for collections
  - ingredient_substitutions: (original_ingredient) for fast substitution lookup
  - cooking_timers: (user_id, is_active) for active timer queries
*/

-- Recipe Progress Tracking
CREATE TABLE IF NOT EXISTS recipe_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  completed_steps integer[] DEFAULT '{}',
  current_step integer DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  last_updated timestamptz DEFAULT now(),
  completed_at timestamptz,
  session_data jsonb DEFAULT '{}'::jsonb,
  UNIQUE(user_id, recipe_id)
);

ALTER TABLE recipe_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recipe progress"
  ON recipe_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recipe progress"
  ON recipe_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipe progress"
  ON recipe_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipe progress"
  ON recipe_progress FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Recipe Collections
CREATE TABLE IF NOT EXISTS recipe_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text DEFAULT '#10b981',
  icon text DEFAULT 'BookmarkIcon',
  is_default boolean DEFAULT false,
  recipe_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE recipe_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own collections"
  ON recipe_collections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own collections"
  ON recipe_collections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections"
  ON recipe_collections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
  ON recipe_collections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Collection Recipes (Junction Table)
CREATE TABLE IF NOT EXISTS collection_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES recipe_collections(id) ON DELETE CASCADE,
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  added_by uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  sort_order integer DEFAULT 0,
  notes text,
  UNIQUE(collection_id, recipe_id)
);

ALTER TABLE collection_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view recipes in their collections"
  ON collection_recipes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipe_collections
      WHERE recipe_collections.id = collection_recipes.collection_id
      AND recipe_collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add recipes to their collections"
  ON collection_recipes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipe_collections
      WHERE recipe_collections.id = collection_recipes.collection_id
      AND recipe_collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove recipes from their collections"
  ON collection_recipes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipe_collections
      WHERE recipe_collections.id = collection_recipes.collection_id
      AND recipe_collections.user_id = auth.uid()
    )
  );

-- Ingredient Substitutions
CREATE TABLE IF NOT EXISTS ingredient_substitutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_ingredient text NOT NULL,
  substitute_ingredient text NOT NULL,
  substitute_quantity_ratio decimal DEFAULT 1.0,
  category text DEFAULT 'general',
  dietary_tags text[] DEFAULT '{}',
  confidence_score integer DEFAULT 50,
  use_count integer DEFAULT 0,
  notes text,
  created_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ingredient_substitutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view ingredient substitutions"
  ON ingredient_substitutions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can suggest substitutions"
  ON ingredient_substitutions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Substitution Votes
CREATE TABLE IF NOT EXISTS substitution_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  substitution_id uuid NOT NULL REFERENCES ingredient_substitutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  vote integer NOT NULL CHECK (vote IN (-1, 1)),
  comment text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(substitution_id, user_id)
);

ALTER TABLE substitution_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view substitution votes"
  ON substitution_votes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can vote on substitutions"
  ON substitution_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their votes"
  ON substitution_votes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Cooking Timers
CREATE TABLE IF NOT EXISTS cooking_timers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  step_number integer NOT NULL,
  duration_seconds integer NOT NULL,
  remaining_seconds integer NOT NULL,
  started_at timestamptz DEFAULT now(),
  ends_at timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  notification_sent boolean DEFAULT false
);

ALTER TABLE cooking_timers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own timers"
  ON cooking_timers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own timers"
  ON cooking_timers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own timers"
  ON cooking_timers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own timers"
  ON cooking_timers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_recipe_progress_user_recipe ON recipe_progress(user_id, recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_progress_updated ON recipe_progress(last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_collections_user ON recipe_collections(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collection_recipes_collection ON collection_recipes(collection_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_collection_recipes_recipe ON collection_recipes(recipe_id);
CREATE INDEX IF NOT EXISTS idx_substitutions_ingredient ON ingredient_substitutions(original_ingredient);
CREATE INDEX IF NOT EXISTS idx_substitutions_category ON ingredient_substitutions(category, confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_timers_active ON cooking_timers(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_timers_ends_at ON cooking_timers(ends_at) WHERE is_active = true;

-- Function to update collection recipe count
CREATE OR REPLACE FUNCTION update_collection_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE recipe_collections
    SET recipe_count = recipe_count + 1,
        updated_at = now()
    WHERE id = NEW.collection_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE recipe_collections
    SET recipe_count = GREATEST(0, recipe_count - 1),
        updated_at = now()
    WHERE id = OLD.collection_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to maintain collection counts
DROP TRIGGER IF EXISTS trigger_update_collection_count ON collection_recipes;
CREATE TRIGGER trigger_update_collection_count
  AFTER INSERT OR DELETE ON collection_recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_count();

-- Function to update substitution confidence based on votes
CREATE OR REPLACE FUNCTION update_substitution_confidence()
RETURNS TRIGGER AS $$
DECLARE
  total_votes integer;
  positive_votes integer;
  new_confidence integer;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE vote = 1)
  INTO total_votes, positive_votes
  FROM substitution_votes
  WHERE substitution_id = COALESCE(NEW.substitution_id, OLD.substitution_id);
  
  IF total_votes > 0 THEN
    new_confidence := ROUND((positive_votes::decimal / total_votes) * 100);
    
    UPDATE ingredient_substitutions
    SET confidence_score = new_confidence
    WHERE id = COALESCE(NEW.substitution_id, OLD.substitution_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update confidence scores
DROP TRIGGER IF EXISTS trigger_update_confidence ON substitution_votes;
CREATE TRIGGER trigger_update_confidence
  AFTER INSERT OR UPDATE OR DELETE ON substitution_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_substitution_confidence();

-- Insert some common substitutions to get started
INSERT INTO ingredient_substitutions (original_ingredient, substitute_ingredient, substitute_quantity_ratio, category, dietary_tags, confidence_score, notes) VALUES
  ('butter', 'coconut oil', 1.0, 'dietary', ARRAY['vegan', 'dairy-free'], 85, 'Great for baking, adds slight coconut flavor'),
  ('butter', 'olive oil', 0.75, 'dietary', ARRAY['vegan', 'dairy-free'], 80, 'Use 3/4 cup oil per 1 cup butter'),
  ('butter', 'applesauce', 0.5, 'dietary', ARRAY['vegan', 'low-fat'], 70, 'Reduces fat content, works best in baked goods'),
  ('egg', 'flax egg', 1.0, 'dietary', ARRAY['vegan'], 85, '1 tbsp flax meal + 3 tbsp water = 1 egg'),
  ('egg', 'chia egg', 1.0, 'dietary', ARRAY['vegan'], 83, '1 tbsp chia seeds + 3 tbsp water = 1 egg'),
  ('milk', 'almond milk', 1.0, 'dietary', ARRAY['vegan', 'dairy-free', 'nut'], 90, 'Works 1:1 in most recipes'),
  ('milk', 'oat milk', 1.0, 'dietary', ARRAY['vegan', 'dairy-free'], 88, 'Creamy texture, works 1:1'),
  ('heavy cream', 'coconut cream', 1.0, 'dietary', ARRAY['vegan', 'dairy-free'], 85, 'Chill coconut milk overnight, use thick part'),
  ('sour cream', 'greek yogurt', 1.0, 'preference', ARRAY['protein'], 92, 'Higher protein, same tanginess'),
  ('all-purpose flour', 'almond flour', 1.0, 'dietary', ARRAY['gluten-free', 'keto', 'low-carb'], 75, 'Denser texture, may need adjustments'),
  ('sugar', 'honey', 0.75, 'preference', ARRAY['natural'], 80, 'Sweeter than sugar, reduce liquid slightly'),
  ('sugar', 'maple syrup', 0.75, 'preference', ARRAY['natural'], 82, 'Adds maple flavor, reduce liquid'),
  ('breadcrumbs', 'crushed cornflakes', 1.0, 'preference', ARRAY[]::text[], 75, 'Adds extra crunch'),
  ('mayonnaise', 'greek yogurt', 1.0, 'preference', ARRAY['protein', 'low-fat'], 88, 'Lower calorie, same creaminess'),
  ('white rice', 'cauliflower rice', 1.0, 'dietary', ARRAY['low-carb', 'keto'], 80, 'Much lower carbs, different texture')
ON CONFLICT DO NOTHING;
