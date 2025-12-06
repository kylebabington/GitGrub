import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Card, CardBody } from '../components/Card';
import { Button } from '../components/Button';
import { Star, GitFork, Plus, Book, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function RepoView({ repoId }: { repoId: string }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [repo, setRepo] = useState<any>(null);
  const [owner, setOwner] = useState<any>(null);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStarred, setIsStarred] = useState(false);

  useEffect(() => {
    loadRepo();
  }, [repoId]);

  const loadRepo = async () => {
    const { data: repoData } = await supabase
      .from('repos')
      .select('*')
      .eq('id', repoId)
      .maybeSingle();

    if (!repoData) {
      setLoading(false);
      return;
    }

    const { data: ownerData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', repoData.owner_id)
      .single();

    const { data: recipesData } = await supabase
      .from('recipes')
      .select('*')
      .eq('repo_id', repoId)
      .order('updated_at', { ascending: false });

    if (user) {
      const { data: starData } = await supabase
        .from('stars')
        .select('*')
        .eq('user_id', user.id)
        .eq('repo_id', repoId)
        .maybeSingle();

      setIsStarred(!!starData);
    }

    setRepo(repoData);
    setOwner(ownerData);
    setRecipes(recipesData || []);
    setLoading(false);
  };

  const toggleStar = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (isStarred) {
      await supabase
        .from('stars')
        .delete()
        .eq('user_id', user.id)
        .eq('repo_id', repoId);

      await supabase
        .from('repos')
        .update({ star_count: Math.max(0, repo.star_count - 1) })
        .eq('id', repoId);

      setIsStarred(false);
      setRepo({ ...repo, star_count: Math.max(0, repo.star_count - 1) });
    } else {
      await supabase
        .from('stars')
        .insert({ user_id: user.id, repo_id: repoId });

      await supabase
        .from('repos')
        .update({ star_count: repo.star_count + 1 })
        .eq('id', repoId);

      setIsStarred(true);
      setRepo({ ...repo, star_count: repo.star_count + 1 });
    }
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

  if (!repo) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Repository Not Found</h1>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </Layout>
    );
  }

  const isOwner = user?.id === repo.owner_id;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Link to={owner ? `/${owner.username}` : '#'} className="hover:text-emerald-600">
                  {owner?.username}
                </Link>
                <span>/</span>
                <span className="font-semibold text-gray-900">{repo.title}</span>
                {repo.is_private && (
                  <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded">
                    Private
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{repo.title}</h1>
              {repo.description && (
                <p className="text-gray-600">{repo.description}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant={isStarred ? 'primary' : 'secondary'}
                size="sm"
                onClick={toggleStar}
              >
                <Star size={16} className="inline mr-1" fill={isStarred ? 'currentColor' : 'none'} />
                {isStarred ? 'Starred' : 'Star'} {repo.star_count}
              </Button>

              {isOwner && (
                <Button
                  size="sm"
                  onClick={() => navigate(`/repo/${repoId}/new-recipe`)}
                >
                  <Plus size={16} className="inline mr-1" />
                  New Recipe
                </Button>
              )}
            </div>
          </div>

          {repo.tags && repo.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {repo.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-8 mb-8 text-sm">
          <span className="flex items-center gap-2 text-gray-600">
            <Book size={16} />
            {repo.recipe_count} recipes
          </span>
          <span className="flex items-center gap-2 text-gray-600">
            <GitFork size={16} />
            {repo.fork_count} forks
          </span>
        </div>

        {recipes.length === 0 ? (
          <Card>
            <CardBody className="text-center py-16">
              <Book className="mx-auto text-gray-400 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No recipes yet</h3>
              <p className="text-gray-600 mb-6">
                {isOwner ? 'Add your first recipe to this repository' : 'This repository is empty'}
              </p>
              {isOwner && (
                <Button onClick={() => navigate(`/repo/${repoId}/new-recipe`)}>
                  Create First Recipe
                </Button>
              )}
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <Card key={recipe.id} onClick={() => navigate(`/recipe/${recipe.id}`)}>
                {recipe.hero_image_url && (
                  <img
                    src={recipe.hero_image_url}
                    alt={recipe.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                )}
                <CardBody>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{recipe.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    {recipe.prep_time && (
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {recipe.prep_time + (recipe.cooking_time || 0)} min
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                      {recipe.skill_level}
                    </span>
                  </div>
                  {recipe.tags && recipe.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {recipe.tags.slice(0, 3).map((tag: string) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded"
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
