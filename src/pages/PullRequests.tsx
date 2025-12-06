import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { GitPullRequest, Check, X, MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function PullRequests({ recipeId }: { recipeId: string }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState<any>(null);
  const [pullRequests, setPullRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'open' | 'closed' | 'all'>('open');

  useEffect(() => {
    loadData();
  }, [recipeId, filter]);

  const loadData = async () => {
    const { data: recipeData } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', recipeId)
      .maybeSingle();

    setRecipe(recipeData);

    let query = supabase
      .from('pull_requests')
      .select('*, author:user_profiles!pull_requests_author_id_fkey(*)')
      .eq('recipe_id', recipeId)
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data } = await query;
    setPullRequests(data || []);
    setLoading(false);
  };

  const updatePRStatus = async (prId: string, status: 'merged' | 'rejected') => {
    await supabase
      .from('pull_requests')
      .update({ status })
      .eq('id', prId);

    loadData();
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Pull Requests</h1>
            <p className="text-gray-600">
              Proposed changes for {recipe?.title}
            </p>
          </div>

          <Button
            onClick={() => navigate(`/recipe/${recipeId}/new-pr`)}
          >
            <GitPullRequest size={20} className="mr-2" />
            New Pull Request
          </Button>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setFilter('open')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'open'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Open
          </button>
          <button
            onClick={() => setFilter('closed')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'closed'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Closed
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All
          </button>
        </div>

        {pullRequests.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <GitPullRequest size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">
              No {filter !== 'all' ? filter : ''} pull requests yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pullRequests.map((pr) => (
              <Card key={pr.id}>
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <GitPullRequest
                          size={20}
                          className={
                            pr.status === 'open'
                              ? 'text-green-600'
                              : pr.status === 'merged'
                              ? 'text-purple-600'
                              : 'text-red-600'
                          }
                        />
                        <h3 className="text-xl font-semibold text-gray-900">
                          {pr.title}
                        </h3>
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            pr.status === 'open'
                              ? 'bg-green-100 text-green-800'
                              : pr.status === 'merged'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {pr.status}
                        </span>
                      </div>

                      <p className="text-gray-700 mb-3">{pr.description}</p>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>
                          by{' '}
                          <Link
                            to={`/${pr.author.username}`}
                            className="text-emerald-600 hover:underline"
                          >
                            {pr.author.username}
                          </Link>
                        </span>
                        <span>
                          {new Date(pr.created_at).toLocaleDateString()}
                        </span>
                        {pr.comment_count > 0 && (
                          <span className="flex items-center gap-1">
                            <MessageCircle size={14} />
                            {pr.comment_count} comments
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      {pr.status === 'open' && user?.id === recipe?.created_by && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => updatePRStatus(pr.id, 'merged')}
                          >
                            <Check size={16} className="mr-1" />
                            Merge
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updatePRStatus(pr.id, 'rejected')}
                          >
                            <X size={16} className="mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate(`/recipe/${recipeId}/pr/${pr.id}`)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
