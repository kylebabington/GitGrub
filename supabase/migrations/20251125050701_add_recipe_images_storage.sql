/*
  # Add Recipe Images Support

  1. New Table
    - `recipe_images`
      - `id` (uuid, primary key)
      - `recipe_id` (uuid, references recipes)
      - `image_url` (text) - URL to the image
      - `is_primary` (boolean) - whether this is the main image
      - `uploaded_by` (uuid, references user_profiles)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on recipe_images
    - Anyone can view images of accessible recipes
    - Only recipe owner can upload images

  3. Notes
    - Images will be stored as URLs (can be from external sources like Pexels or uploaded to storage)
    - Each recipe can have multiple images
    - One image should be marked as primary (hero image)
*/

CREATE TABLE IF NOT EXISTS recipe_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  is_primary boolean DEFAULT false,
  uploaded_by uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recipe_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view recipe images"
  ON recipe_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_images.recipe_id
    )
  );

CREATE POLICY "Recipe owner can manage images"
  ON recipe_images FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_images.recipe_id
      AND recipes.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_images.recipe_id
      AND recipes.created_by = auth.uid()
    )
  );

CREATE INDEX idx_recipe_images_recipe ON recipe_images(recipe_id);
CREATE INDEX idx_recipe_images_primary ON recipe_images(recipe_id, is_primary);
