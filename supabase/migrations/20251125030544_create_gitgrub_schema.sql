/*
  # GitGrub Database Schema - Complete Platform Setup

  ## Overview
  This migration creates the entire database schema for GitGrub, a GitHub-style collaborative recipe platform.
  It includes version control, forking, pull requests, social features, and freemium tiers.

  ## New Tables

  ### Authentication & User Management
  1. `user_profiles` - Extended user profile data
     - `id` (uuid, references auth.users)
     - `username` (text, unique)
     - `full_name` (text)
     - `avatar_url` (text)
     - `bio` (text)
     - `location` (text)
     - `cooking_specialty` (text)
     - `dietary_tags` (text[])
     - `is_pro` (boolean)
     - `follower_count` (integer)
     - `following_count` (integer)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  2. `user_settings` - User preferences and configuration
     - `user_id` (uuid, references user_profiles)
     - `email_notifications` (boolean)
     - `theme` (text)
     - `privacy_level` (text)

  ### Repository System
  3. `repos` - Recipe collections (like GitHub repos)
     - `id` (uuid)
     - `owner_id` (uuid, references user_profiles)
     - `title` (text)
     - `description` (text)
     - `tags` (text[])
     - `is_private` (boolean)
     - `star_count` (integer)
     - `fork_count` (integer)
     - `recipe_count` (integer)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  ### Recipe System
  4. `recipes` - Core recipe data
     - `id` (uuid)
     - `repo_id` (uuid, references repos)
     - `title` (text)
     - `ingredients` (jsonb)
     - `steps` (jsonb)
     - `tags` (text[])
     - `cooking_time` (integer, minutes)
     - `prep_time` (integer, minutes)
     - `skill_level` (text)
     - `yield_amount` (text)
     - `notes` (text)
     - `nutrition` (jsonb)
     - `hero_image_url` (text)
     - `star_count` (integer)
     - `fork_count` (integer)
     - `current_version` (integer)
     - `original_recipe_id` (uuid, references recipes - for forks)
     - `created_by` (uuid, references user_profiles)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  5. `recipe_versions` - Version history for recipes
     - `id` (uuid)
     - `recipe_id` (uuid, references recipes)
     - `version_number` (integer)
     - `parent_version_id` (uuid, references recipe_versions)
     - `recipe_data` (jsonb) - full snapshot
     - `author_id` (uuid, references user_profiles)
     - `created_at` (timestamptz)

  6. `commits` - Commit records for changes
     - `id` (uuid)
     - `recipe_id` (uuid, references recipes)
     - `version_id` (uuid, references recipe_versions)
     - `author_id` (uuid, references user_profiles)
     - `message` (text)
     - `diff_data` (jsonb)
     - `created_at` (timestamptz)

  ### Fork System
  7. `forks` - Fork relationships
     - `id` (uuid)
     - `original_recipe_id` (uuid, references recipes)
     - `forked_recipe_id` (uuid, references recipes)
     - `user_id` (uuid, references user_profiles)
     - `created_at` (timestamptz)

  ### Pull Request System
  8. `pull_requests` - Recipe improvement proposals
     - `id` (uuid)
     - `source_recipe_id` (uuid, references recipes)
     - `target_recipe_id` (uuid, references recipes)
     - `author_id` (uuid, references user_profiles)
     - `title` (text)
     - `description` (text)
     - `status` (text) - open, merged, closed
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)
     - `merged_at` (timestamptz)

  9. `pr_comments` - Comments on pull requests
     - `id` (uuid)
     - `pr_id` (uuid, references pull_requests)
     - `author_id` (uuid, references user_profiles)
     - `content` (text)
     - `created_at` (timestamptz)

  ### Social Features
  10. `recipe_comments` - Comments on recipes
      - `id` (uuid)
      - `recipe_id` (uuid, references recipes)
      - `author_id` (uuid, references user_profiles)
      - `content` (text)
      - `parent_comment_id` (uuid, references recipe_comments)
      - `created_at` (timestamptz)

  11. `issues` - Discussions within repos
      - `id` (uuid)
      - `repo_id` (uuid, references repos)
      - `author_id` (uuid, references user_profiles)
      - `title` (text)
      - `description` (text)
      - `status` (text) - open, closed
      - `labels` (text[])
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  12. `issue_comments` - Comments on issues
      - `id` (uuid)
      - `issue_id` (uuid, references issues)
      - `author_id` (uuid, references user_profiles)
      - `content` (text)
      - `created_at` (timestamptz)

  13. `follows` - User follow relationships
      - `follower_id` (uuid, references user_profiles)
      - `following_id` (uuid, references user_profiles)
      - `created_at` (timestamptz)

  14. `stars` - Recipe/repo likes
      - `user_id` (uuid, references user_profiles)
      - `recipe_id` (uuid, references recipes, nullable)
      - `repo_id` (uuid, references repos, nullable)
      - `created_at` (timestamptz)

  15. `notifications` - Activity feed and alerts
      - `id` (uuid)
      - `user_id` (uuid, references user_profiles)
      - `type` (text)
      - `title` (text)
      - `message` (text)
      - `link` (text)
      - `read` (boolean)
      - `created_at` (timestamptz)

  ### Payments & Subscriptions
  16. `subscription_plans` - Free vs Pro tier definitions
      - `id` (uuid)
      - `name` (text)
      - `price` (integer)
      - `features` (jsonb)

  17. `payments` - Transaction records
      - `id` (uuid)
      - `user_id` (uuid, references user_profiles)
      - `amount` (integer)
      - `stripe_payment_id` (text)
      - `status` (text)
      - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated user access
  - Implement ownership checks for write operations
  - Public read access for non-private content
  - Secure write access based on ownership and permissions

  ## Indexes
  - Index on frequently queried foreign keys
  - Index on timestamps for sorting
  - Index on search fields (title, tags)
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  bio text,
  location text,
  cooking_specialty text,
  dietary_tags text[] DEFAULT '{}',
  is_pro boolean DEFAULT false,
  follower_count integer DEFAULT 0,
  following_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Settings Table
CREATE TABLE IF NOT EXISTS user_settings (
  user_id uuid PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  email_notifications boolean DEFAULT true,
  theme text DEFAULT 'light',
  privacy_level text DEFAULT 'public'
);

-- Repos Table
CREATE TABLE IF NOT EXISTS repos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  tags text[] DEFAULT '{}',
  is_private boolean DEFAULT false,
  star_count integer DEFAULT 0,
  fork_count integer DEFAULT 0,
  recipe_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Recipes Table
CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  repo_id uuid REFERENCES repos(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  ingredients jsonb DEFAULT '[]',
  steps jsonb DEFAULT '[]',
  tags text[] DEFAULT '{}',
  cooking_time integer,
  prep_time integer,
  skill_level text DEFAULT 'beginner',
  yield_amount text,
  notes text,
  nutrition jsonb,
  hero_image_url text,
  star_count integer DEFAULT 0,
  fork_count integer DEFAULT 0,
  current_version integer DEFAULT 1,
  original_recipe_id uuid REFERENCES recipes(id),
  created_by uuid REFERENCES user_profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Recipe Versions Table
CREATE TABLE IF NOT EXISTS recipe_versions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  version_number integer NOT NULL,
  parent_version_id uuid REFERENCES recipe_versions(id),
  recipe_data jsonb NOT NULL,
  author_id uuid REFERENCES user_profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(recipe_id, version_number)
);

-- Commits Table
CREATE TABLE IF NOT EXISTS commits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  version_id uuid REFERENCES recipe_versions(id) NOT NULL,
  author_id uuid REFERENCES user_profiles(id) NOT NULL,
  message text NOT NULL,
  diff_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Forks Table
CREATE TABLE IF NOT EXISTS forks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  forked_recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES user_profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Pull Requests Table
CREATE TABLE IF NOT EXISTS pull_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  target_recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES user_profiles(id) NOT NULL,
  title text NOT NULL,
  description text,
  status text DEFAULT 'open' CHECK (status IN ('open', 'merged', 'closed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  merged_at timestamptz
);

-- PR Comments Table
CREATE TABLE IF NOT EXISTS pr_comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pr_id uuid REFERENCES pull_requests(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES user_profiles(id) NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Recipe Comments Table
CREATE TABLE IF NOT EXISTS recipe_comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES user_profiles(id) NOT NULL,
  content text NOT NULL,
  parent_comment_id uuid REFERENCES recipe_comments(id),
  created_at timestamptz DEFAULT now()
);

-- Issues Table
CREATE TABLE IF NOT EXISTS issues (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  repo_id uuid REFERENCES repos(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES user_profiles(id) NOT NULL,
  title text NOT NULL,
  description text,
  status text DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  labels text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Issue Comments Table
CREATE TABLE IF NOT EXISTS issue_comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id uuid REFERENCES issues(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES user_profiles(id) NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Follows Table
CREATE TABLE IF NOT EXISTS follows (
  follower_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  following_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Stars Table
CREATE TABLE IF NOT EXISTS stars (
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE,
  repo_id uuid REFERENCES repos(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CHECK (
    (recipe_id IS NOT NULL AND repo_id IS NULL) OR
    (recipe_id IS NULL AND repo_id IS NOT NULL)
  ),
  UNIQUE(user_id, recipe_id),
  UNIQUE(user_id, repo_id)
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  link text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Subscription Plans Table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL,
  price integer NOT NULL,
  features jsonb DEFAULT '{}'
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  amount integer NOT NULL,
  stripe_payment_id text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_repos_owner ON repos(owner_id);
CREATE INDEX IF NOT EXISTS idx_repos_created ON repos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_repo ON recipes(repo_id);
CREATE INDEX IF NOT EXISTS idx_recipes_created_by ON recipes(created_by);
CREATE INDEX IF NOT EXISTS idx_recipes_created ON recipes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipe_versions_recipe ON recipe_versions(recipe_id);
CREATE INDEX IF NOT EXISTS idx_commits_recipe ON commits(recipe_id);
CREATE INDEX IF NOT EXISTS idx_commits_author ON commits(author_id);
CREATE INDEX IF NOT EXISTS idx_forks_original ON forks(original_recipe_id);
CREATE INDEX IF NOT EXISTS idx_forks_user ON forks(user_id);
CREATE INDEX IF NOT EXISTS idx_pull_requests_target ON pull_requests(target_recipe_id);
CREATE INDEX IF NOT EXISTS idx_pull_requests_author ON pull_requests(author_id);
CREATE INDEX IF NOT EXISTS idx_pull_requests_status ON pull_requests(status);
CREATE INDEX IF NOT EXISTS idx_recipe_comments_recipe ON recipe_comments(recipe_id);
CREATE INDEX IF NOT EXISTS idx_issues_repo ON issues(repo_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_stars_user ON stars(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE repos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commits ENABLE ROW LEVEL SECURITY;
ALTER TABLE forks ENABLE ROW LEVEL SECURITY;
ALTER TABLE pull_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE pr_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE stars ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_settings
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for repos
CREATE POLICY "Public repos are viewable by everyone"
  ON repos FOR SELECT
  USING (NOT is_private OR owner_id = auth.uid());

CREATE POLICY "Users can create repos"
  ON repos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own repos"
  ON repos FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own repos"
  ON repos FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- RLS Policies for recipes
CREATE POLICY "Public recipes are viewable by everyone"
  ON recipes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM repos
      WHERE repos.id = recipes.repo_id
      AND (NOT repos.is_private OR repos.owner_id = auth.uid())
    )
  );

CREATE POLICY "Users can create recipes in their repos"
  ON recipes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM repos
      WHERE repos.id = repo_id
      AND repos.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update recipes in their repos"
  ON recipes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM repos
      WHERE repos.id = recipes.repo_id
      AND repos.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM repos
      WHERE repos.id = recipes.repo_id
      AND repos.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete recipes in their repos"
  ON recipes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM repos
      WHERE repos.id = recipes.repo_id
      AND repos.owner_id = auth.uid()
    )
  );

-- RLS Policies for recipe_versions
CREATE POLICY "Recipe versions viewable if recipe is viewable"
  ON recipe_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      JOIN repos ON repos.id = recipes.repo_id
      WHERE recipes.id = recipe_versions.recipe_id
      AND (NOT repos.is_private OR repos.owner_id = auth.uid())
    )
  );

CREATE POLICY "Users can create versions in their recipes"
  ON recipe_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes
      JOIN repos ON repos.id = recipes.repo_id
      WHERE recipes.id = recipe_id
      AND repos.owner_id = auth.uid()
    )
  );

-- RLS Policies for commits
CREATE POLICY "Commits viewable if recipe is viewable"
  ON commits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      JOIN repos ON repos.id = recipes.repo_id
      WHERE recipes.id = commits.recipe_id
      AND (NOT repos.is_private OR repos.owner_id = auth.uid())
    )
  );

CREATE POLICY "Users can create commits in their recipes"
  ON commits FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes
      JOIN repos ON repos.id = recipes.repo_id
      WHERE recipes.id = recipe_id
      AND repos.owner_id = auth.uid()
    )
  );

-- RLS Policies for forks
CREATE POLICY "Forks are viewable by everyone"
  ON forks FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create forks"
  ON forks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for pull_requests
CREATE POLICY "PRs viewable if target recipe is viewable"
  ON pull_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      JOIN repos ON repos.id = recipes.repo_id
      WHERE recipes.id = pull_requests.target_recipe_id
      AND (NOT repos.is_private OR repos.owner_id = auth.uid())
    )
  );

CREATE POLICY "Users can create PRs"
  ON pull_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "PR authors and target owners can update PRs"
  ON pull_requests FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = author_id OR
    EXISTS (
      SELECT 1 FROM recipes
      JOIN repos ON repos.id = recipes.repo_id
      WHERE recipes.id = pull_requests.target_recipe_id
      AND repos.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = author_id OR
    EXISTS (
      SELECT 1 FROM recipes
      JOIN repos ON repos.id = recipes.repo_id
      WHERE recipes.id = pull_requests.target_recipe_id
      AND repos.owner_id = auth.uid()
    )
  );

-- RLS Policies for pr_comments
CREATE POLICY "PR comments viewable if PR is viewable"
  ON pr_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pull_requests
      JOIN recipes ON recipes.id = pull_requests.target_recipe_id
      JOIN repos ON repos.id = recipes.repo_id
      WHERE pull_requests.id = pr_comments.pr_id
      AND (NOT repos.is_private OR repos.owner_id = auth.uid())
    )
  );

CREATE POLICY "Authenticated users can create PR comments"
  ON pr_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- RLS Policies for recipe_comments
CREATE POLICY "Recipe comments viewable if recipe is viewable"
  ON recipe_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      JOIN repos ON repos.id = recipes.repo_id
      WHERE recipes.id = recipe_comments.recipe_id
      AND (NOT repos.is_private OR repos.owner_id = auth.uid())
    )
  );

CREATE POLICY "Authenticated users can create recipe comments"
  ON recipe_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own comments"
  ON recipe_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete own comments"
  ON recipe_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- RLS Policies for issues
CREATE POLICY "Issues viewable if repo is viewable"
  ON issues FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM repos
      WHERE repos.id = issues.repo_id
      AND (NOT repos.is_private OR repos.owner_id = auth.uid())
    )
  );

CREATE POLICY "Authenticated users can create issues"
  ON issues FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Issue authors and repo owners can update issues"
  ON issues FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = author_id OR
    EXISTS (
      SELECT 1 FROM repos
      WHERE repos.id = issues.repo_id
      AND repos.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = author_id OR
    EXISTS (
      SELECT 1 FROM repos
      WHERE repos.id = issues.repo_id
      AND repos.owner_id = auth.uid()
    )
  );

-- RLS Policies for issue_comments
CREATE POLICY "Issue comments viewable if issue is viewable"
  ON issue_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM issues
      JOIN repos ON repos.id = issues.repo_id
      WHERE issues.id = issue_comments.issue_id
      AND (NOT repos.is_private OR repos.owner_id = auth.uid())
    )
  );

CREATE POLICY "Authenticated users can create issue comments"
  ON issue_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- RLS Policies for follows
CREATE POLICY "Follows are viewable by everyone"
  ON follows FOR SELECT
  USING (true);

CREATE POLICY "Users can follow others"
  ON follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

-- RLS Policies for stars
CREATE POLICY "Stars are viewable by everyone"
  ON stars FOR SELECT
  USING (true);

CREATE POLICY "Users can star items"
  ON stars FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unstar items"
  ON stars FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for subscription_plans
CREATE POLICY "Subscription plans are viewable by everyone"
  ON subscription_plans FOR SELECT
  USING (true);

-- RLS Policies for payments
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, price, features)
VALUES 
  ('free', 0, '{"max_recipes": 10, "max_repos": 3, "analytics": false, "private_repos": false, "monetization": false}'::jsonb),
  ('pro', 999, '{"max_recipes": -1, "max_repos": -1, "analytics": true, "private_repos": true, "monetization": true, "custom_branding": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;