/*
  # Fork Ancestry Tree Functions
  
  Creates functions to fetch the complete ancestry tree for a recipe,
  including ancestors (where it came from) and descendants (forks of it).
  
  ## Functions
  
  1. `get_recipe_ancestors` - Get all parent recipes up to the original
  2. `get_recipe_descendants` - Get all forks/children recursively  
  3. `get_recipe_ancestry_tree` - Combined view for visualization
*/

-- ============================================
-- Get all ancestors of a recipe (parents up to root)
-- ============================================
CREATE OR REPLACE FUNCTION get_recipe_ancestors(p_recipe_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  original_recipe_id uuid,
  created_by uuid,
  author_username text,
  star_count integer,
  fork_count integer,
  created_at timestamptz,
  depth integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE ancestors AS (
    -- Base case: start with the given recipe
    SELECT 
      r.id,
      r.title,
      r.original_recipe_id,
      r.created_by,
      up.username as author_username,
      r.star_count,
      r.fork_count,
      r.created_at,
      0 as depth
    FROM recipes r
    LEFT JOIN user_profiles up ON up.id = r.created_by
    WHERE r.id = p_recipe_id
    
    UNION ALL
    
    -- Recursive case: get parent recipes
    SELECT 
      r.id,
      r.title,
      r.original_recipe_id,
      r.created_by,
      up.username as author_username,
      r.star_count,
      r.fork_count,
      r.created_at,
      a.depth - 1
    FROM recipes r
    LEFT JOIN user_profiles up ON up.id = r.created_by
    INNER JOIN ancestors a ON r.id = a.original_recipe_id
    WHERE a.depth > -10  -- Prevent infinite loops, max 10 levels up
  )
  SELECT * FROM ancestors
  WHERE ancestors.id != p_recipe_id  -- Exclude the starting recipe
  ORDER BY depth ASC;
END;
$$;

-- ============================================
-- Get all descendants of a recipe (forks, recursively)
-- ============================================
CREATE OR REPLACE FUNCTION get_recipe_descendants(p_recipe_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  original_recipe_id uuid,
  created_by uuid,
  author_username text,
  star_count integer,
  fork_count integer,
  created_at timestamptz,
  depth integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE descendants AS (
    -- Base case: direct children of the given recipe
    SELECT 
      r.id,
      r.title,
      r.original_recipe_id,
      r.created_by,
      up.username as author_username,
      r.star_count,
      r.fork_count,
      r.created_at,
      1 as depth
    FROM recipes r
    LEFT JOIN user_profiles up ON up.id = r.created_by
    WHERE r.original_recipe_id = p_recipe_id
    
    UNION ALL
    
    -- Recursive case: get children of children
    SELECT 
      r.id,
      r.title,
      r.original_recipe_id,
      r.created_by,
      up.username as author_username,
      r.star_count,
      r.fork_count,
      r.created_at,
      d.depth + 1
    FROM recipes r
    LEFT JOIN user_profiles up ON up.id = r.created_by
    INNER JOIN descendants d ON r.original_recipe_id = d.id
    WHERE d.depth < 10  -- Prevent infinite loops, max 10 levels deep
  )
  SELECT * FROM descendants
  ORDER BY depth ASC, star_count DESC;
END;
$$;

-- ============================================
-- Get complete ancestry tree (ancestors + self + descendants)
-- ============================================
CREATE OR REPLACE FUNCTION get_recipe_ancestry_tree(p_recipe_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  original_recipe_id uuid,
  created_by uuid,
  author_username text,
  star_count integer,
  fork_count integer,
  created_at timestamptz,
  depth integer,
  is_current boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  -- Ancestors (negative depth)
  SELECT 
    a.id, a.title, a.original_recipe_id, a.created_by, 
    a.author_username, a.star_count, a.fork_count, a.created_at,
    a.depth,
    false as is_current
  FROM get_recipe_ancestors(p_recipe_id) a
  
  UNION ALL
  
  -- Current recipe (depth 0)
  SELECT 
    r.id, r.title, r.original_recipe_id, r.created_by,
    up.username as author_username, r.star_count, r.fork_count, r.created_at,
    0 as depth,
    true as is_current
  FROM recipes r
  LEFT JOIN user_profiles up ON up.id = r.created_by
  WHERE r.id = p_recipe_id
  
  UNION ALL
  
  -- Descendants (positive depth)
  SELECT 
    d.id, d.title, d.original_recipe_id, d.created_by,
    d.author_username, d.star_count, d.fork_count, d.created_at,
    d.depth,
    false as is_current
  FROM get_recipe_descendants(p_recipe_id) d
  
  ORDER BY depth ASC, star_count DESC;
END;
$$;

-- ============================================
-- Get the root ancestor of a recipe
-- ============================================
CREATE OR REPLACE FUNCTION get_recipe_root(p_recipe_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  author_username text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE ancestors AS (
    SELECT 
      r.id,
      r.title,
      r.original_recipe_id,
      up.username as author_username,
      r.created_at
    FROM recipes r
    LEFT JOIN user_profiles up ON up.id = r.created_by
    WHERE r.id = p_recipe_id
    
    UNION ALL
    
    SELECT 
      r.id,
      r.title,
      r.original_recipe_id,
      up.username as author_username,
      r.created_at
    FROM recipes r
    LEFT JOIN user_profiles up ON up.id = r.created_by
    INNER JOIN ancestors a ON r.id = a.original_recipe_id
  )
  SELECT a.id, a.title, a.author_username, a.created_at
  FROM ancestors a
  WHERE a.original_recipe_id IS NULL
  LIMIT 1;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_recipe_ancestors(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_recipe_descendants(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_recipe_ancestry_tree(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_recipe_root(uuid) TO authenticated, anon;

