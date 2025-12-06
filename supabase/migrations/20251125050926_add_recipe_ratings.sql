/*
  # Add Recipe Ratings System

  1. New Table
    - `recipe_ratings`
      - `id` (uuid, primary key)
      - `recipe_id` (uuid, references recipes)
      - `user_id` (uuid, references user_profiles)
      - `rating` (integer) - 1-5 stars
      - `review_text` (text) - optional review
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Add Columns to recipes
    - `average_rating` (numeric) - calculated average
    - `rating_count` (integer) - number of ratings

  3. Security
    - Enable RLS
    - Anyone can view ratings
    - Only logged-in users can rate
    - Users can only have one rating per recipe
    - Users can update/delete their own ratings

  4. Important Notes
    - One rating per user per recipe (UNIQUE constraint)
    - Rating must be between 1-5
*/

CREATE TABLE IF NOT EXISTS recipe_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(recipe_id, user_id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'average_rating'
  ) THEN
    ALTER TABLE recipes ADD COLUMN average_rating numeric(3,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'rating_count'
  ) THEN
    ALTER TABLE recipes ADD COLUMN rating_count integer DEFAULT 0;
  END IF;
END $$;

ALTER TABLE recipe_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view recipe ratings"
  ON recipe_ratings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own ratings"
  ON recipe_ratings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings"
  ON recipe_ratings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings"
  ON recipe_ratings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_recipe_ratings_recipe ON recipe_ratings(recipe_id);
CREATE INDEX idx_recipe_ratings_user ON recipe_ratings(user_id);

CREATE OR REPLACE FUNCTION update_recipe_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE recipes
  SET
    average_rating = (
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM recipe_ratings
      WHERE recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id)
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM recipe_ratings
      WHERE recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id)
    )
  WHERE id = COALESCE(NEW.recipe_id, OLD.recipe_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS recipe_rating_stats_trigger ON recipe_ratings;

CREATE TRIGGER recipe_rating_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON recipe_ratings
FOR EACH ROW
EXECUTE FUNCTION update_recipe_rating_stats();
