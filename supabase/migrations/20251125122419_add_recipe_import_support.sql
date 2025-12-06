/*
  # Add Recipe Import Support

  1. Add Columns to recipes table
    - `source_url` (text) - Original URL if imported
    - `imported_at` (timestamptz) - When it was imported
    - `import_source` (text) - Source site name (e.g., 'allrecipes', 'foodnetwork')

  2. Add Tags System
    - `tags` table for recipe categorization
      - `id` (uuid, primary key)
      - `name` (text, unique) - tag name (e.g., 'italian', 'vegetarian', 'quick')
      - `category` (text) - tag category (cuisine, dietary, time, difficulty)
      - `created_at` (timestamptz)

    - `recipe_tags` junction table
      - `recipe_id` (uuid, references recipes)
      - `tag_id` (uuid, references tags)
      - Primary key on (recipe_id, tag_id)

  3. Security
    - Enable RLS on tags and recipe_tags
    - Anyone can view tags
    - Only authenticated users can create tags
    - Recipe owners can tag their recipes

  4. Notes
    - Tags will help with search and filtering
    - Source tracking for imported recipes
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'source_url'
  ) THEN
    ALTER TABLE recipes ADD COLUMN source_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'imported_at'
  ) THEN
    ALTER TABLE recipes ADD COLUMN imported_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'import_source'
  ) THEN
    ALTER TABLE recipes ADD COLUMN import_source text;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  category text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recipe_tags (
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (recipe_id, tag_id)
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tags"
  ON tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create tags"
  ON tags FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view recipe tags"
  ON recipe_tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Recipe owners can tag recipes"
  ON recipe_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_tags.recipe_id
      AND recipes.created_by = auth.uid()
    )
  );

CREATE POLICY "Recipe owners can remove tags"
  ON recipe_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_tags.recipe_id
      AND recipes.created_by = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_recipe_tags_recipe ON recipe_tags(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_tags_tag ON recipe_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_tags_category ON tags(category);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

INSERT INTO tags (name, category) VALUES
  ('italian', 'cuisine'),
  ('mexican', 'cuisine'),
  ('chinese', 'cuisine'),
  ('indian', 'cuisine'),
  ('american', 'cuisine'),
  ('french', 'cuisine'),
  ('japanese', 'cuisine'),
  ('thai', 'cuisine'),
  ('mediterranean', 'cuisine'),
  ('vegetarian', 'dietary'),
  ('vegan', 'dietary'),
  ('gluten-free', 'dietary'),
  ('dairy-free', 'dietary'),
  ('keto', 'dietary'),
  ('paleo', 'dietary'),
  ('low-carb', 'dietary'),
  ('under-30-min', 'time'),
  ('quick', 'time'),
  ('slow-cooker', 'time'),
  ('make-ahead', 'time'),
  ('beginner-friendly', 'difficulty'),
  ('advanced', 'difficulty'),
  ('breakfast', 'meal'),
  ('lunch', 'meal'),
  ('dinner', 'meal'),
  ('dessert', 'meal'),
  ('snack', 'meal'),
  ('appetizer', 'meal')
ON CONFLICT (name) DO NOTHING;
