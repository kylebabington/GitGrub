import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Card, CardBody } from '../components/Card';
import { Button } from '../components/Button';
import { BookOpen, Star, Award, TrendingUp, GitFork, Users, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
impoexport function UserProfile({ username }: { username: string }) {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [repos, setRepos] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'repos' | 'recipes'>('repos');

  useEffect(() => {
    loadUserProfile();
  }, [username]);

  const loadUserProfile = async () => {
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (!profileData) {
      setLoading(false);
      return;
    }

    setProfile(profileData);

    const { data: reposData } = await supabase
      .from('repos')
      .select('*')
      .eq('owner_id', profileData.id)
      .eq('is_private', false)
      .order('created_at', { ascending: false });

    setRepos(reposData || []);

    const { data: recipesData } = await supabase
      .from('recipes')
      .select('*')
      .eq('created_by', profileData.id)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(12);

    setRecipes(recipesData || []);

    await loadStats(profileData.id);
    setLoading(false);
  };

  const loadStats = async (userId: string) => {
    const { count: totalRecipes } = await supabase
      .from('recipes')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', userId);

    const { count: totalForks } = await supabase
      .from('forks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { data: achievementsData } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId);

    const { data: recipesWithStars } = await supabase
      .from('recipes')
      .select('star_count')
      .eq('created_by', userId);

    const totalStars = recipesWithStars?.reduce((sum, r) => sum + (r.star_count || 0), 0) || 0;

    const { count: cookAlongSessions } = await supabase
      .from('cook_along_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('host_id', userId);

    setStats({
      totalRecipes: totalRecipes || 0,
      totalForks: totalForks || 0,
      totalStars,
      achievements: achievementsData?.length || 0,
      cookAlongSessions: cookAlongSessions || 0,
    });
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

  if (!profile) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">User Not Found</h1>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </Layout>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-white">
                  {(profile.display_name || profile.username).charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {profile.display_name || profile.username}
                </h1>
                <p className="text-gray-600">@{profile.username}</p>
                {profile.is_pro && (
                  <span className="inline-block mt-2 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm rounded-full font-semibold">
                    PRO
                  </span>
                )}
              </div>
            </div>
            {isOwnProfile && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/settings')}
              >
                Edit Profile
              </Button>
            )}
          </div>

          {profile.bio && (
            <p className="mt-4 text-gray-700">{profile.bio}</p>
          )}

          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <BookOpen size={20} className="text-emerald-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalRecipes}</div>
                <div className="text-xs text-gray-600">Recipes</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <Star size={20} className="text-yellow-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalStars}</div>
                <div className="text-xs text-gray-600">Stars</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <GitFork size={20} className="text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalForks}</div>
                <div className="text-xs text-gray-600">Forks</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <Award size={20} className="text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.achievements}</div>
                <div className="text-xs text-gray-600">Achievements</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <Users size={20} className="text-red-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.cookAlongSessions}</div>
                <div className="text-xs text-gray-600">Cook-Alongs</div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('repos')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'repos'
                ? 'text-emerald-600 border-b-2 border-emerald-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Repositories ({repos.length})
          </button>
          <button
            onClick={() => setActiveTab('recipes')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'recipes'
                ? 'text-emerald-600 border-b-2 border-emerald-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Recipes ({recipes.length})
          </button>
        </div>

        {activeTab === 'repos' ? (
          repos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No public repositories yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {repos.map((repo) => (
                <Card key={repo.id} onClick={() => navigate(`/repo/${repo.id}`)}>
                  <CardBody>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {repo.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {repo.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <BookOpen size={16} />
                        <span>{repo.recipe_count || 0} recipes</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star size={16} />
                        <span>{repo.star_count || 0}</span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )
        ) : (
          recipes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No public recipes yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map((recipe) => (
                <Card key={recipe.id} onClick={() => navigate(`/recipe/${recipe.id}`)}>
                  {recipe.hero_image_url && (
                    <img
                      src={recipe.hero_image_url}
                      alt={recipe.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <CardBody>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {recipe.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Star size={16} className="text-yellow-500" />
                        <span>{recipe.star_count || 0}</span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )
        )}
      </div>
    </Layout>
  );
}
