/*
  # Add Recipe Branches System

  1. New Tables
    - `recipe_branches`
      - `id` (uuid, primary key)
      - `recipe_id` (uuid, references recipes)
      - `branch_name` (text) - name like "vegan-version", "spicy-variant"
      - `parent_branch_id` (uuid, references recipe_branches) - for branch hierarchy
      - `is_default` (boolean) - indicates the main/master branch
      - `branch_data` (jsonb) - stores the variant recipe data (ingredients, steps, etc.)
      - `description` (text) - what makes this branch different
      - `created_by` (uuid, references user_profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `status` (text) - active, archived, merged

  2. Security
    - Enable RLS on `recipe_branches` table
    - Users can view branches of public recipes
    - Only recipe owner can create/update/delete branches
    - Branch data follows same privacy rules as recipe

  3. Indexes
    - Index on recipe_id for fast branch lookup
    - Index on status for filtering active branches
*/

CREATE TABLE IF NOT EXISTS recipe_branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  branch_name text NOT NULL,
  parent_branch_id uuid REFERENCES recipe_branches(id) ON DELETE SET NULL,
  is_default boolean DEFAULT false,
  branch_data jsonb NOT NULL,
  description text,
  created_by uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived', 'merged')),
  UNIQUE(recipe_id, branch_name)
);

ALTER TABLE recipe_branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view branches of accessible recipes"
  ON recipe_branches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_branches.recipe_id
    )
  );

CREATE POLICY "Recipe owner can insert branches"
  ON recipe_branches FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_branches.recipe_id
      AND recipes.created_by = auth.uid()
    )
  );

CREATE POLICY "Recipe owner can update branches"
  ON recipe_branches FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_branches.recipe_id
      AND recipes.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_branches.recipe_id
      AND recipes.created_by = auth.uid()
    )
  );

CREATE POLICY "Recipe owner can delete branches"
  ON recipe_branches FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_branches.recipe_id
      AND recipes.created_by = auth.uid()
    )
  );

CREATE INDEX idx_recipe_branches_recipe ON recipe_branches(recipe_id);
CREATE INDEX idx_recipe_branches_status ON recipe_branches(status);
CREATE INDEX idx_recipe_branches_default ON recipe_branches(recipe_id, is_default);
