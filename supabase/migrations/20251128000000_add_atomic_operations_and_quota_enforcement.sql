/*
  # Atomic Operations and Server-Side Quota Enforcement
  
  ## Changes
  
  ### 1. Atomic Star Toggle Function
  - Prevents race conditions when multiple users star simultaneously
  - Uses a transaction to ensure star count stays in sync
  
  ### 2. Atomic Fork Function  
  - Handles recipe forking atomically
  - Updates fork_count in the same transaction
  
  ### 3. Recipe Quota Enforcement Trigger
  - Enforces 10 recipe limit for free users on the SERVER
  - Cannot be bypassed by malicious clients
  
  ### 4. Repo Quota Enforcement Trigger
  - Enforces 3 repo limit for free users on the SERVER
*/

-- ============================================
-- 1. Atomic Star Toggle for Recipes
-- ============================================

CREATE OR REPLACE FUNCTION toggle_recipe_star(p_user_id uuid, p_recipe_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists boolean;
  v_new_count integer;
BEGIN
  -- Check if star already exists
  SELECT EXISTS(
    SELECT 1 FROM stars 
    WHERE user_id = p_user_id AND recipe_id = p_recipe_id
  ) INTO v_exists;

  IF v_exists THEN
    -- Remove star
    DELETE FROM stars WHERE user_id = p_user_id AND recipe_id = p_recipe_id;
    
    -- Decrement count atomically
    UPDATE recipes 
    SET star_count = GREATEST(0, star_count - 1)
    WHERE id = p_recipe_id
    RETURNING star_count INTO v_new_count;
    
    RETURN jsonb_build_object('starred', false, 'star_count', v_new_count);
  ELSE
    -- Add star
    INSERT INTO stars (user_id, recipe_id) VALUES (p_user_id, p_recipe_id);
    
    -- Increment count atomically
    UPDATE recipes 
    SET star_count = star_count + 1
    WHERE id = p_recipe_id
    RETURNING star_count INTO v_new_count;
    
    RETURN jsonb_build_object('starred', true, 'star_count', v_new_count);
  END IF;
END;
$$;

-- ============================================
-- 2. Atomic Star Toggle for Repos
-- ============================================

CREATE OR REPLACE FUNCTION toggle_repo_star(p_user_id uuid, p_repo_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists boolean;
  v_new_count integer;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM stars 
    WHERE user_id = p_user_id AND repo_id = p_repo_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM stars WHERE user_id = p_user_id AND repo_id = p_repo_id;
    
    UPDATE repos 
    SET star_count = GREATEST(0, star_count - 1)
    WHERE id = p_repo_id
    RETURNING star_count INTO v_new_count;
    
    RETURN jsonb_build_object('starred', false, 'star_count', v_new_count);
  ELSE
    INSERT INTO stars (user_id, repo_id) VALUES (p_user_id, p_repo_id);
    
    UPDATE repos 
    SET star_count = star_count + 1
    WHERE id = p_repo_id
    RETURNING star_count INTO v_new_count;
    
    RETURN jsonb_build_object('starred', true, 'star_count', v_new_count);
  END IF;
END;
$$;

-- ============================================
-- 3. Atomic Fork Recipe Function
-- ============================================

CREATE OR REPLACE FUNCTION fork_recipe(
  p_user_id uuid,
  p_original_recipe_id uuid,
  p_target_repo_id uuid,
  p_commit_message text DEFAULT 'Forked recipe'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_original recipes%ROWTYPE;
  v_new_recipe_id uuid;
  v_user_is_pro boolean;
  v_recipe_count integer;
BEGIN
  -- Check user quota
  SELECT is_pro INTO v_user_is_pro FROM user_profiles WHERE id = p_user_id;
  
  IF NOT COALESCE(v_user_is_pro, false) THEN
    SELECT COUNT(*) INTO v_recipe_count FROM recipes WHERE created_by = p_user_id;
    IF v_recipe_count >= 10 THEN
      RAISE EXCEPTION 'Free accounts are limited to 10 recipes. Upgrade to Pro for unlimited recipes.';
    END IF;
  END IF;

  -- Get original recipe
  SELECT * INTO v_original FROM recipes WHERE id = p_original_recipe_id;
  
  IF v_original IS NULL THEN
    RAISE EXCEPTION 'Original recipe not found';
  END IF;

  -- Create new recipe
  INSERT INTO recipes (
    repo_id, title, ingredients, steps, tags, cooking_time, prep_time,
    skill_level, yield_amount, notes, hero_image_url, original_recipe_id, created_by
  ) VALUES (
    p_target_repo_id, v_original.title, v_original.ingredients, v_original.steps,
    v_original.tags, v_original.cooking_time, v_original.prep_time,
    v_original.skill_level, v_original.yield_amount, v_original.notes,
    v_original.hero_image_url, p_original_recipe_id, p_user_id
  ) RETURNING id INTO v_new_recipe_id;

  -- Create initial version
  INSERT INTO recipe_versions (recipe_id, version_number, recipe_data, author_id)
  VALUES (
    v_new_recipe_id, 1,
    jsonb_build_object(
      'title', v_original.title,
      'ingredients', v_original.ingredients,
      'steps', v_original.steps,
      'tags', v_original.tags,
      'cooking_time', v_original.cooking_time,
      'prep_time', v_original.prep_time,
      'skill_level', v_original.skill_level,
      'yield_amount', v_original.yield_amount,
      'notes', v_original.notes
    ),
    p_user_id
  );

  -- Create commit
  INSERT INTO commits (recipe_id, version_id, author_id, message)
  VALUES (v_new_recipe_id, v_new_recipe_id, p_user_id, p_commit_message);

  -- Create fork record
  INSERT INTO forks (original_recipe_id, forked_recipe_id, user_id)
  VALUES (p_original_recipe_id, v_new_recipe_id, p_user_id);

  -- Update original recipe fork count atomically
  UPDATE recipes SET fork_count = fork_count + 1 WHERE id = p_original_recipe_id;

  -- Update repo recipe count
  UPDATE repos SET recipe_count = recipe_count + 1 WHERE id = p_target_repo_id;

  RETURN jsonb_build_object('recipe_id', v_new_recipe_id);
END;
$$;

-- ============================================
-- 4. Recipe Quota Enforcement Trigger
-- ============================================

CREATE OR REPLACE FUNCTION enforce_recipe_quota()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_is_pro boolean;
  v_recipe_count integer;
BEGIN
  -- Get user pro status
  SELECT is_pro INTO v_user_is_pro 
  FROM user_profiles 
  WHERE id = NEW.created_by;
  
  -- Pro users have no limit
  IF COALESCE(v_user_is_pro, false) THEN
    RETURN NEW;
  END IF;
  
  -- Count existing recipes
  SELECT COUNT(*) INTO v_recipe_count 
  FROM recipes 
  WHERE created_by = NEW.created_by;
  
  -- Enforce limit
  IF v_recipe_count >= 10 THEN
    RAISE EXCEPTION 'Free accounts are limited to 10 recipes. Upgrade to Pro for unlimited recipes.'
      USING ERRCODE = 'P0001';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS check_recipe_quota ON recipes;
CREATE TRIGGER check_recipe_quota
  BEFORE INSERT ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION enforce_recipe_quota();

-- ============================================
-- 5. Repo Quota Enforcement Trigger
-- ============================================

CREATE OR REPLACE FUNCTION enforce_repo_quota()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_is_pro boolean;
  v_repo_count integer;
BEGIN
  -- Get user pro status
  SELECT is_pro INTO v_user_is_pro 
  FROM user_profiles 
  WHERE id = NEW.owner_id;
  
  -- Pro users have no limit
  IF COALESCE(v_user_is_pro, false) THEN
    RETURN NEW;
  END IF;
  
  -- Count existing repos
  SELECT COUNT(*) INTO v_repo_count 
  FROM repos 
  WHERE owner_id = NEW.owner_id;
  
  -- Enforce limit (3 repos for free users)
  IF v_repo_count >= 3 THEN
    RAISE EXCEPTION 'Free accounts are limited to 3 repositories. Upgrade to Pro for unlimited repos.'
      USING ERRCODE = 'P0001';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS check_repo_quota ON repos;
CREATE TRIGGER check_repo_quota
  BEFORE INSERT ON repos
  FOR EACH ROW
  EXECUTE FUNCTION enforce_repo_quota();

-- ============================================
-- 6. Grant execute permissions to authenticated users
-- ============================================

GRANT EXECUTE ON FUNCTION toggle_recipe_star(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_repo_star(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION fork_recipe(uuid, uuid, uuid, text) TO authenticated;

