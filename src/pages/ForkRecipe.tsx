import { useState, useEffect, FormEvent, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { supabase } from '../lib/supabase';
import type { Recipe, Repo } from '../lib/database.types';

export function ForkRecipe({ recipeId }: { recipeId: string }) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [originalRecipe, setOriginalRecipe] = useState<Recipe | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    const { data: recipe } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', recipeId)
      .maybeSingle();

    if (!recipe) {
      setError('Recipe not found');
      setLoading(false);
      return;
    }

    setOriginalRecipe(recipe);
    setCommitMessage(`Forked from: ${recipe.title}`);

    if (user) {
      const { data: userRepos } = await supabase
        .from('repos')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      setRepos(userRepos || []);
    }

    setLoading(false);
  }, [recipeId, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </Layout>
    );
  }

  // Auth is handled by ProtectedRoute wrapper
  if (!user) {
    return null;
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{error}</h1>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </Layout>
    );
  }

  const handleFork = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (!selectedRepoId) {
      setError('Please select a repository');
      setSubmitting(false);
      return;
    }

    try {
      // Use atomic fork function - handles quota enforcement server-side
      const { data, error: forkError } = await supabase.rpc('fork_recipe', {
        p_user_id: user.id,
        p_original_recipe_id: recipeId,
        p_target_repo_id: selectedRepoId,
        p_commit_message: commitMessage || 'Forked recipe',
      });

      if (forkError) {
        // Handle quota error with user-friendly message
        if (forkError.message.includes('limited to 10 recipes')) {
      setError('Free accounts are limited to 10 recipes. Upgrade to Pro for unlimited recipes.');
        } else {
          throw forkError;
        }
      setSubmitting(false);
      return;
    }

      // Navigate to the new forked recipe
      navigate(`/recipe/${data.recipe_id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to fork recipe');
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Fork Recipe</h1>
        <p className="text-gray-600 mb-8">
          Create your own copy of "{originalRecipe?.title}"
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {repos.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Repositories Found</h3>
            <p className="text-gray-600 mb-6">
              You need to create a repository before you can fork recipes.
            </p>
            <Button onClick={() => navigate('/repo/new')}>
              Create Repository
            </Button>
          </div>
        ) : (
          <form onSubmit={handleFork} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Repository
              </label>
              <select
                value={selectedRepoId}
                onChange={(e) => setSelectedRepoId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">Choose a repository...</option>
                {repos.map((repo) => (
                  <option key={repo.id} value={repo.id}>
                    {repo.title}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Commit Message"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Describe your fork..."
              required
            />

            <div className="flex gap-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Forking...' : 'Fork Recipe'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}
