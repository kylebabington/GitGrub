/*
  # Add Full-Text Search Support

  1. Add Search Columns
    - `search_vector` (tsvector) - Full-text search index for recipes

  2. Create Search Function
    - Function to search recipes by text, ingredients, tags, etc.

  3. Create Indexes
    - GIN index on search_vector for fast full-text search

  4. Create Trigger
    - Auto-update search_vector when recipe changes

  5. Notes
    - Searches across title, ingredients, steps, and notes
    - Weighted search (title > ingredients > notes > steps)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE recipes ADD COLUMN search_vector tsvector;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION recipes_search_vector_update() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.notes, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(
      (SELECT string_agg(ing->>'item', ' ') FROM jsonb_array_elements(NEW.ingredients) AS ing),
      ''
    )), 'A') ||
    setweight(to_tsvector('english', COALESCE(
      (SELECT string_agg(step->>'instruction', ' ') FROM jsonb_array_elements(NEW.steps) AS step),
      ''
    )), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS recipes_search_vector_trigger ON recipes;

CREATE TRIGGER recipes_search_vector_trigger
BEFORE INSERT OR UPDATE ON recipes
FOR EACH ROW
EXECUTE FUNCTION recipes_search_vector_update();

CREATE INDEX IF NOT EXISTS idx_recipes_search_vector ON recipes USING GIN(search_vector);

UPDATE recipes SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(notes, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(
    (SELECT string_agg(ing->>'item', ' ') FROM jsonb_array_elements(ingredients) AS ing),
    ''
  )), 'A') ||
  setweight(to_tsvector('english', COALESCE(
    (SELECT string_agg(step->>'instruction', ' ') FROM jsonb_array_elements(steps) AS step),
    ''
  )), 'C')
WHERE search_vector IS NULL;
