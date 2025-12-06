import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Card, CardBody } from '../components/Card';
import { Star, Clock, ChefHat } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Trending() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('week');

  useEffect(() => {
    loadTrendingRecipes();
  }, [timeframe]);

  const loadTrendingRecipes = async () => {
    setLoading(true);

    const now = new Date();
    let startDate = new Date();

    if (timeframe === 'day') {
      startDate.setDate(now.getDate() - 1);
    } else if (timeframe === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setMonth(now.getMonth() - 1);
    }

    const { data } = await supabase
      .from('recipes')
      .select('*')
      .eq('is_public', true)
      .gte('created_at', startDate.toISOString())
      .order('star_count', { ascending: false })
      .order('fork_count', { ascending: false })
      .limit(24);

    setRecipes(data || []);
    setLoading(false);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Trending Recipes</h1>
            <p className="text-gray-600">
              Popular recipes that are gaining traction
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setTimeframe('day')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeframe === 'day'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeframe('week')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeframe === 'week'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setTimeframe('month')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeframe === 'month'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              This Month
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading trending recipes...</p>
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No trending recipes found for this timeframe.</p>
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

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Star size={16} className="text-yellow-500" />
                      <span>{recipe.star_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ChefHat size={16} />
                      <span className="capitalize">{recipe.skill_level || 'beginner'}</span>
                    </div>
                    {recipe.cooking_time && (
                      <div className="flex items-center gap-1">
                        <Clock size={16} />
                        <span>{recipe.cooking_time}m</span>
                      </div>
                    )}
                  </div>

                  {recipe.tags && recipe.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {recipe.tags.slice(0, 3).map((tag: string) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full"
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
