import { useState, FormEvent } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { supabase } from '../lib/supabase';

export function NewRepo() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (authLoading) {
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!profile?.is_pro && isPrivate) {
      setError('Private repos are a Pro feature. Upgrade to Pro to create private repos.');
      setLoading(false);
      return;
    }

    const { count: repoCount } = await supabase
      .from('repos')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', user.id);

    if (!profile?.is_pro && repoCount && repoCount >= 3) {
      setError('Free accounts are limited to 3 repos. Upgrade to Pro for unlimited repos.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: insertError } = await supabase
        .from('repos')
        .insert({
          owner_id: user.id,
          title,
          description,
          tags: tags.split(',').map(t => t.trim()).filter(t => t),
          is_private: isPrivate,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      navigate(`/repo/${data.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create repo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create a New Recipe Repo</h1>
        <p className="text-gray-600 mb-8">
          A repository is a collection of recipes. Think of it as a themed cookbook.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Repository Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My Awesome Recipes"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A collection of my favorite recipes..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows={4}
            />
          </div>

          <Input
            label="Tags (comma-separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="italian, vegetarian, comfort-food"
          />

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPrivate"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
            />
            <label htmlFor="isPrivate" className="text-sm text-gray-700">
              Make this repo private
              {!profile?.is_pro && (
                <span className="ml-2 px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs rounded font-semibold">
                  PRO
                </span>
              )}
            </label>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Repository'}
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
