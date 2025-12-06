import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Card, CardBody } from '../components/Card';
import { Button } from '../components/Button';
import { Plus, GitFork, Star, Book } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Repo } from '../lib/database.types';

interface DashboardStats {
  repos: number;
  recipes: number;
  stars: number;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { profile, user, loading: authLoading } = useAuth();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ repos: 0, recipes: 0, stars: 0 });
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    if (!user) return;

    // Parallel fetching for better performance
    const [reposResult, recipeCountResult, starCountResult] = await Promise.all([
      supabase
      .from('repos')
      .select('*')
      .eq('owner_id', user.id)
        .order('updated_at', { ascending: false }),
      supabase
      .from('recipes')
      .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id),
      supabase
      .from('stars')
      .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
    ]);

    setRepos(reposResult.data || []);
    setStats({
      repos: reposResult.data?.length || 0,
      recipes: recipeCountResult.count || 0,
      stars: starCountResult.count || 0,
    });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, loadDashboardData]);

  if (authLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </Layout>
    );
  }

  // Auth is handled by ProtectedRoute, but keep this as a fallback
  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile?.username}!
          </h1>
          <p className="text-gray-600">Here's what's cooking in your kitchen</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Recipe Repos</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.repos}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Book className="text-emerald-600" size={24} />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Recipes</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.recipes}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <GitFork className="text-blue-600" size={24} />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Starred Recipes</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.stars}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Star className="text-yellow-600" size={24} />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="mb-6">
          <div className="flex gap-4">
            <Button
              variant="secondary"
              onClick={() => navigate('/analytics')}
            >
              View Analytics
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate('/achievements')}
            >
              View Achievements
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Recipe Repos</h2>
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={() => navigate('/recipe/select-repo')}
            >
              <Plus size={16} className="inline mr-2" />
              New Recipe
            </Button>
            <Button onClick={() => navigate('/repo/new')}>
              <Plus size={16} className="inline mr-2" />
              New Repo
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : repos.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <Book className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No recipe repos yet</h3>
              <p className="text-gray-600 mb-6">Create your first recipe repository to get started</p>
              <Button onClick={() => navigate('/repo/new')}>
                Create Your First Repo
              </Button>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repos.map((repo) => (
              <Card key={repo.id} onClick={() => navigate(`/repo/${repo.id}`)}>
                <CardBody>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{repo.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {repo.description || 'No description'}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <GitFork size={16} />
                      {repo.recipe_count} recipes
                    </span>
                    <span className="flex items-center gap-1">
                      <Star size={16} />
                      {repo.star_count}
                    </span>
                  </div>
                  {repo.tags && repo.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {repo.tags.slice(0, 3).map((tag: string) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
