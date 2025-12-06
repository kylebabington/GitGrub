import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { supabase } from '../lib/supabase';

export function NewPullRequest({ recipeId }: { recipeId: string }) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [recipe, setRecipe] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [changes, setChanges] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRecipe();
  }, [recipeId]);

  const loadRecipe = async () => {
    const { data } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', recipeId)
      .maybeSingle();

    setRecipe(data);
    setLoading(false);
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!recipe) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Recipe Not Found</h1>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </Layout>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const { error: prError } = await supabase
        .from('pull_requests')
        .insert({
          recipe_id: recipeId,
          author_id: user.id,
          title,
          description,
          changes: JSON.parse(changes || '{}'),
          status: 'open',
        });

      if (prError) throw prError;

      navigate(`/recipe/${recipeId}/pull-requests`);
    } catch (err: any) {
      setError(err.message || 'Failed to create pull request');
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">New Pull Request</h1>
        <p className="text-gray-600 mb-8">
          Propose changes to "{recipe.title}"
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief summary of your changes"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain what you changed and why..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows={6}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proposed Changes (JSON)
            </label>
            <textarea
              value={changes}
              onChange={(e) => setChanges(e.target.value)}
              placeholder={'{\n  "ingredients": [...],\n  "steps": [...]\n}'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
              rows={10}
            />
            <p className="mt-1 text-sm text-gray-600">
              Enter the modified recipe data as JSON. Leave empty to propose other changes.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Tips for Good Pull Requests</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Clearly explain what you changed and why</li>
              <li>Reference specific ingredients or steps being modified</li>
              <li>Include any testing you did (did you cook it?)</li>
              <li>Be respectful and constructive</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Pull Request'}
            </Button>
          <div className="flex gap-4">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Pull Request'}
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
      </div>
    </Layout>
  );
}
