import { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Card, CardBody } from '../components/Card';
import { Button } from '../components/Button';
import { Book, GitFork, Clock, ArrowRight, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function SelectRepository() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadRepos();
    }
  }, [user]);

  const loadRepos = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('repos')
      .select('*')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false });

    setRepos(data || []);
    setLoading(false);
  };

  const selectRepo = (repoId: string) => {
    navigate(`/recipe/new?repo=${repoId}`);
  };

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

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Select a Repository
          </h1>
          <p className="text-gray-600">
            Choose which repository you'd like to add your recipe to
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading repositories...</p>
          </div>
        ) : repos.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <Book className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No repositories yet
              </h3>
              <p className="text-gray-600 mb-6">
                You need to create a repository first before adding recipes
              </p>
              <Button onClick={() => navigate('/repo/new')}>
                <Plus size={16} className="inline mr-2" />
                Create Your First Repo
              </Button>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {repos.map((repo) => (
              <Card
                key={repo.id}
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => selectRepo(repo.id)}
              >
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Book className="text-emerald-600" size={24} />
                        <h3 className="text-xl font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                          {repo.name}
                        </h3>
                        {repo.is_private && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            Private
                          </span>
                        )}
                      </div>

                      {repo.description && (
                        <p className="text-gray-600 mb-3">{repo.description}</p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <GitFork size={16} />
                          <span>{repo.recipe_count || 0} recipes</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={16} />
                          <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="ml-4">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectRepo(repo.id);
                        }}
                      >
                        Select
                        <ArrowRight size={16} className="ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Layout>
  );
}
