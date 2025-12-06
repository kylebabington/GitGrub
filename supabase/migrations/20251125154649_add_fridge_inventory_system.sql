/*
  # Fridge Inventory & Leftover Tracking System

  ## Overview
  This migration adds a comprehensive fridge inventory management system with leftover tracking,
  ingredient expiration dates, and recipe matching capabilities.

  ## New Tables

  ### 1. `fridge_inventory`
  Tracks ingredients users have at home with quantities and expiration dates.
  - `id` (uuid, primary key)
  - `user_id` (uuid, references user_profiles) - Owner of the inventory
  - `ingredient_name` (text) - Name of the ingredient
  - `quantity` (numeric) - Amount available
  - `unit` (text) - Unit of measurement
  - `expiration_date` (date) - When it expires
  - `location` (text) - fridge, freezer, pantry
  - `notes` (text) - Optional notes
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `leftovers`
  Tracks leftover meals from completed recipes.
  - `id` (uuid, primary key)
  - `user_id` (uuid, references user_profiles)
  - `recipe_id` (uuid, references recipes) - Original recipe
  - `meal_plan_id` (uuid, references meal_plans, nullable) - Associated meal plan
  - `servings_remaining` (integer) - How many servings left
  - `cooked_date` (date) - When it was made
  - `expiration_date` (date) - When to use by
  - `location` (text) - fridge or freezer
  - `notes` (text)
  - `is_consumed` (boolean) - Whether it's been eaten
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `recipe_ingredient_mappings`
  Maps common ingredient names to standardized names for matching.
  - `id` (uuid, primary key)
  - `ingredient_name` (text) - Standardized name
  - `aliases` (text[]) - Common variations
  - `category` (text) - produce, dairy, meat, etc.
  - `default_unit` (text) - Standard unit of measurement

  ## Security
  - Enable RLS on all tables
  - Users can only access their own inventory and leftovers
  - Ingredient mappings are public (read-only for users)
*/

-- Fridge Inventory Table
CREATE TABLE IF NOT EXISTS fridge_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  ingredient_name text NOT NULL,
  quantity numeric DEFAULT 0,
  unit text DEFAULT '',
  expiration_date date,
  location text DEFAULT 'fridge',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE fridge_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inventory"
  ON fridge_inventory FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inventory"
  ON fridge_inventory FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory"
  ON fridge_inventory FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own inventory"
  ON fridge_inventory FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Leftovers Table
CREATE TABLE IF NOT EXISTS leftovers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  recipe_id uuid REFERENCES recipes(id) ON DELETE SET NULL,
  meal_plan_id uuid REFERENCES meal_plans(id) ON DELETE SET NULL,
  servings_remaining integer DEFAULT 1,
  cooked_date date DEFAULT CURRENT_DATE,
  expiration_date date,
  location text DEFAULT 'fridge',
  notes text DEFAULT '',
  is_consumed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE leftovers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own leftovers"
  ON leftovers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leftovers"
  ON leftovers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leftovers"
  ON leftovers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own leftovers"
  ON leftovers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Recipe Ingredient Mappings Table
CREATE TABLE IF NOT EXISTS recipe_ingredient_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_name text UNIQUE NOT NULL,
  aliases text[] DEFAULT ARRAY[]::text[],
  category text DEFAULT 'other',
  default_unit text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recipe_ingredient_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view ingredient mappings"
  ON recipe_ingredient_mappings FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fridge_inventory_user_id ON fridge_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_fridge_inventory_expiration ON fridge_inventory(expiration_date);
CREATE INDEX IF NOT EXISTS idx_leftovers_user_id ON leftovers(user_id);
CREATE INDEX IF NOT EXISTS idx_leftovers_expiration ON leftovers(expiration_date);
CREATE INDEX IF NOT EXISTS idx_leftovers_consumed ON leftovers(is_consumed);
CREATE INDEX IF NOT EXISTS idx_ingredient_mappings_name ON recipe_ingredient_mappings(ingredient_name);

-- Insert some common ingredient mappings
INSERT INTO recipe_ingredient_mappings (ingredient_name, aliases, category, default_unit) VALUES
  ('chicken breast', ARRAY['chicken', 'chicken breasts', 'boneless chicken'], 'meat', 'lb'),
  ('ground beef', ARRAY['beef', 'hamburger', 'ground chuck'], 'meat', 'lb'),
  ('butter', ARRAY['unsalted butter', 'salted butter'], 'dairy', 'cup'),
  ('milk', ARRAY['whole milk', '2% milk', 'skim milk'], 'dairy', 'cup'),
  ('eggs', ARRAY['egg', 'large eggs'], 'dairy', 'count'),
  ('flour', ARRAY['all-purpose flour', 'white flour'], 'pantry', 'cup'),
  ('sugar', ARRAY['white sugar', 'granulated sugar'], 'pantry', 'cup'),
  ('salt', ARRAY['table salt', 'sea salt', 'kosher salt'], 'pantry', 'tsp'),
  ('olive oil', ARRAY['oil', 'extra virgin olive oil', 'evoo'], 'pantry', 'tbsp'),
  ('onion', ARRAY['onions', 'yellow onion', 'white onion'], 'produce', 'count'),
  ('garlic', ARRAY['garlic cloves', 'fresh garlic'], 'produce', 'clove'),
  ('tomato', ARRAY['tomatoes', 'fresh tomatoes'], 'produce', 'count'),
  ('bell pepper', ARRAY['bell peppers', 'sweet pepper'], 'produce', 'count'),
  ('cheese', ARRAY['shredded cheese', 'cheddar', 'mozzarella'], 'dairy', 'cup')
ON CONFLICT (ingredient_name) DO NOTHING;
