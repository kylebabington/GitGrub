/*
  # Pull Request Notification System

  ## Overview
  Adds automatic notifications for pull request events so recipe creators know when someone
  suggests edits or when their suggestions are merged.

  ## Functions and Triggers

  ### Function: `notify_on_pull_request_opened()`
  Notifies recipe owner when someone opens a PR to their recipe.

  ### Function: `notify_on_pull_request_merged()`
  Notifies PR author when their suggestion is accepted and merged.

  ### Function: `notify_on_pull_request_commented()`
  Notifies relevant parties when comments are added to PRs.

  ## Security
  - Respects user notification preferences
  - No self-notifications
  - Includes context in notification metadata
*/

-- Function to notify recipe owner when PR is opened
CREATE OR REPLACE FUNCTION notify_on_pull_request_opened()
RETURNS TRIGGER AS $$
DECLARE
  v_target_recipe RECORD;
  v_source_recipe RECORD;
  v_author RECORD;
  v_target_owner RECORD;
  v_preferences RECORD;
BEGIN
  -- Get source recipe details
  SELECT * INTO v_source_recipe
  FROM recipes
  WHERE id = NEW.source_recipe_id;

  -- Get target recipe details with owner info
  SELECT r.*, u.id as owner_id, u.username as owner_username
  INTO v_target_recipe
  FROM recipes r
  JOIN user_profiles u ON r.created_by = u.id
  WHERE r.id = NEW.target_recipe_id;

  -- Get PR author
  SELECT username INTO v_author
  FROM user_profiles
  WHERE id = NEW.author_id;

  -- Don't notify if author is opening PR to their own recipe
  IF v_target_recipe.owner_id = NEW.author_id THEN
    RETURN NEW;
  END IF;

  -- Check notification preferences
  SELECT * INTO v_preferences
  FROM notification_preferences
  WHERE user_id = v_target_recipe.owner_id;

  -- If no preferences exist or PRs are enabled, send notification
  IF v_preferences IS NULL OR v_preferences.pull_request_notifications = true THEN
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
      v_target_recipe.owner_id,
      NEW.author_id,
      NEW.target_recipe_id,
      'pull_request_opened',
      'New Pull Request',
      v_author.username || ' suggested an edit to your recipe "' || v_target_recipe.title || '"',
      '/recipe/' || NEW.target_recipe_id || '/pull-requests',
      false,
      jsonb_build_object(
        'pr_id', NEW.id,
        'pr_title', NEW.title,
        'author_username', v_author.username
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify PR author when their PR is merged
CREATE OR REPLACE FUNCTION notify_on_pull_request_merged()
RETURNS TRIGGER AS $$
DECLARE
  v_recipe RECORD;
  v_author RECORD;
  v_merger RECORD;
  v_preferences RECORD;
BEGIN
  -- Only proceed if status changed to merged
  IF NEW.status = 'merged' AND (OLD.status IS NULL OR OLD.status != 'merged') THEN
    -- Get recipe details
    SELECT * INTO v_recipe
    FROM recipes
    WHERE id = NEW.target_recipe_id;

    -- Get PR author
    SELECT username INTO v_author
    FROM user_profiles
    WHERE id = NEW.author_id;

    -- Don't notify if author merged their own PR
    IF NEW.author_id = NEW.merged_by THEN
      RETURN NEW;
    END IF;

    -- Get merger username
    SELECT username INTO v_merger
    FROM user_profiles
    WHERE id = NEW.merged_by;

    -- Check notification preferences
    SELECT * INTO v_preferences
    FROM notification_preferences
    WHERE user_id = NEW.author_id;

    -- If no preferences exist or PRs are enabled, send notification
    IF v_preferences IS NULL OR v_preferences.pull_request_notifications = true THEN
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
        NEW.author_id,
        NEW.merged_by,
        NEW.target_recipe_id,
        'pull_request_merged',
        'Pull Request Merged',
        v_merger.username || ' merged your pull request "' || NEW.title || '" into "' || v_recipe.title || '"',
        '/recipe/' || NEW.target_recipe_id,
        false,
        jsonb_build_object(
          'pr_id', NEW.id,
          'pr_title', NEW.title,
          'merger_username', v_merger.username
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify on PR comments
CREATE OR REPLACE FUNCTION notify_on_pr_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_pr RECORD;
  v_commenter RECORD;
  v_recipe RECORD;
  v_preferences RECORD;
  v_notify_user_id uuid;
BEGIN
  -- Get PR details
  SELECT * INTO v_pr
  FROM pull_requests
  WHERE id = NEW.pr_id;

  -- Get recipe details
  SELECT * INTO v_recipe
  FROM recipes
  WHERE id = v_pr.target_recipe_id;

  -- Get commenter
  SELECT username INTO v_commenter
  FROM user_profiles
  WHERE id = NEW.author_id;

  -- Notify PR author if someone else commented
  IF v_pr.author_id != NEW.author_id THEN
    v_notify_user_id := v_pr.author_id;
    
    SELECT * INTO v_preferences
    FROM notification_preferences
    WHERE user_id = v_notify_user_id;

    IF v_preferences IS NULL OR v_preferences.comment_notifications = true THEN
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
        v_notify_user_id,
        NEW.author_id,
        v_pr.target_recipe_id,
        'pull_request_commented',
        'New Comment on Your Pull Request',
        v_commenter.username || ' commented on your pull request "' || v_pr.title || '"',
        '/recipe/' || v_pr.target_recipe_id || '/pull-requests',
        false,
        jsonb_build_object(
          'pr_id', v_pr.id,
          'comment', substring(NEW.content from 1 for 100)
        )
      );
    END IF;
  END IF;

  -- Notify recipe owner if they're not the commenter
  IF v_recipe.created_by != NEW.author_id AND v_recipe.created_by != v_pr.author_id THEN
    v_notify_user_id := v_recipe.created_by;
    
    SELECT * INTO v_preferences
    FROM notification_preferences
    WHERE user_id = v_notify_user_id;

    IF v_preferences IS NULL OR v_preferences.comment_notifications = true THEN
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
        v_notify_user_id,
        NEW.author_id,
        v_pr.target_recipe_id,
        'pull_request_commented',
        'New Comment on Pull Request',
        v_commenter.username || ' commented on a pull request to your recipe "' || v_recipe.title || '"',
        '/recipe/' || v_pr.target_recipe_id || '/pull-requests',
        false,
        jsonb_build_object(
          'pr_id', v_pr.id,
          'comment', substring(NEW.content from 1 for 100)
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_notify_pr_opened ON pull_requests;
CREATE TRIGGER trigger_notify_pr_opened
  AFTER INSERT ON pull_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_pull_request_opened();

DROP TRIGGER IF EXISTS trigger_notify_pr_merged ON pull_requests;
CREATE TRIGGER trigger_notify_pr_merged
  AFTER UPDATE ON pull_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_pull_request_merged();

DROP TRIGGER IF EXISTS trigger_notify_pr_comment ON pr_comments;
CREATE TRIGGER trigger_notify_pr_comment
  AFTER INSERT ON pr_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_pr_comment();
