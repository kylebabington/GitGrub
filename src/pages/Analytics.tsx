import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Card, CardBody } from '../components/Card';
import { TrendingUp, ChefHat, Clock, Star, Globe, ShoppingCart, Calendar as CalendarIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AnalyticsData {
  totalRecipes: number;
  totalStars: number;
  totalForks: number;
  avgCookingTime: number;
  cuisineBreakdown: { [key: string]: number };
  topIngredients: { [key: string]: number };
  skillLevelBreakdown: { [key: string]: number };
  monthlyActivity: { [key: string]: number };
  recentRecipes: any[];
}

export function Analytics() {
  const { user, profile, loading: authLoading } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('month');

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user, timeRange]);

  const loadAnalytics = async () => {
    if (!user) return;

    const dateFilter = getDateFilter();

    const { data: recipes } = await supabase
      .from('recipes')
      .select('*')
      .eq('created_by', user.id)
      .gte('created_at', dateFilter);

    const { count: starCount } = await supabase
      .from('stars')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', dateFilter);

    const { data: forkedRecipes } = await supabase
      .from('recipes')
      .select('fork_count')
      .eq('created_by', user.id);

    const totalForks = forkedRecipes?.reduce((sum, r) => sum + (r.fork_count || 0), 0) || 0;

    const cuisineBreakdown: { [key: string]: number } = {};
    const ingredientCount: { [key: string]: number } = {};
    const skillBreakdown: { [key: string]: number } = {};
    const monthlyActivity: { [key: string]: number } = {};
    let totalTime = 0;
    let recipeCount = 0;

    (recipes || []).forEach(recipe => {
      if (recipe.tags) {
        recipe.tags.forEach((tag: string) => {
          cuisineBreakdown[tag] = (cuisineBreakdown[tag] || 0) + 1;
        });
      }

      if (recipe.ingredients) {
        recipe.ingredients.forEach((ing: any) => {
          const item = ing.item.toLowerCase();
          ingredientCount[item] = (ingredientCount[item] || 0) + 1;
        });
      }

      if (recipe.skill_level) {
        skillBreakdown[recipe.skill_level] = (skillBreakdown[recipe.skill_level] || 0) + 1;
      }

      if (recipe.cooking_time) {
        totalTime += recipe.cooking_time;
        recipeCount++;
      }

      const month = new Date(recipe.created_at).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });
      monthlyActivity[month] = (monthlyActivity[month] || 0) + 1;
    });

    const topIngredients = Object.entries(ingredientCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

    setData({
      totalRecipes: recipes?.length || 0,
      totalStars: starCount || 0,
      totalForks,
      avgCookingTime: recipeCount > 0 ? Math.round(totalTime / recipeCount) : 0,
      cuisineBreakdown,
      topIngredients,
      skillLevelBreakdown: skillBreakdown,
      monthlyActivity,
      recentRecipes: recipes?.slice(0, 5) || [],
    });

    setLoading(false);
  };

  const getDateFilter = () => {
    const now = new Date();
    switch (timeRange) {
      case 'week':
        now.setDate(now.getDate() - 7);
        break;
      case 'month':
        now.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        now.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        return '2000-01-01';
    }
    return now.toISOString();
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </Layout>
    );
  }

  if (!user) {
    window.location.href = '/login';
    return null;
  }

  const cuisines = Object.entries(data?.cuisineBreakdown || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const topIngredients = Object.entries(data?.topIngredients || {});

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Cooking Analytics</h1>
          <p className="text-gray-600">
            Track your culinary journey with detailed insights
          </p>
        </div>

        <div className="mb-6">
          <div className="flex gap-2">
            {(['week', 'month', 'year', 'all'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                  timeRange === range
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {range === 'all' ? 'All Time' : `Past ${range}`}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <ChefHat className="text-emerald-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Recipes Created</p>
                  <p className="text-2xl font-bold text-gray-900">{data?.totalRecipes}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Star className="text-yellow-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Stars Earned</p>
                  <p className="text-2xl font-bold text-gray-900">{data?.totalStars}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Forks</p>
                  <p className="text-2xl font-bold text-gray-900">{data?.totalForks}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Clock className="text-purple-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Cook Time</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data?.avgCookingTime}m
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardBody>
              <div className="flex items-center gap-2 mb-4">
                <Globe className="text-emerald-600" size={20} />
                <h2 className="text-xl font-semibold text-gray-900">
                  Cuisine Diversity
                </h2>
              </div>

              {cuisines.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  No cuisine data yet. Start creating recipes!
                </p>
              ) : (
                <div className="space-y-3">
                  {cuisines.map(([cuisine, count]) => {
                    const maxCount = cuisines[0][1];
                    const percentage = (count / maxCount) * 100;

                    return (
                      <div key={cuisine}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-900 capitalize">
                            {cuisine}
                          </span>
                          <span className="text-gray-600">{count} recipes</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart className="text-emerald-600" size={20} />
                <h2 className="text-xl font-semibold text-gray-900">
                  Top Ingredients
                </h2>
              </div>

              {topIngredients.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  No ingredient data yet
                </p>
              ) : (
                <div className="space-y-2">
                  {topIngredients.map(([ingredient, count]) => (
                    <div
                      key={ingredient}
                      className="flex justify-between items-center p-2 bg-gray-50 rounded"
                    >
                      <span className="text-gray-900 capitalize">{ingredient}</span>
                      <span className="text-sm text-gray-600">{count}x</span>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardBody>
              <div className="flex items-center gap-2 mb-4">
                <CalendarIcon className="text-emerald-600" size={20} />
                <h2 className="text-xl font-semibold text-gray-900">
                  Monthly Activity
                </h2>
              </div>

              {Object.keys(data?.monthlyActivity || {}).length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  No activity data yet
                </p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(data?.monthlyActivity || {})
                    .slice(-6)
                    .map(([month, count]) => (
                      <div key={month} className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700 w-24">
                          {month}
                        </span>
                        <div className="flex-1 flex items-center gap-2">
                          <div className="flex-1 h-8 bg-emerald-100 rounded overflow-hidden">
                            <div
                              className="h-full bg-emerald-600 flex items-center justify-center text-white text-sm font-medium"
                              style={{
                                width: `${(count / Math.max(...Object.values(data?.monthlyActivity || {}))) * 100}%`,
                                minWidth: '40px',
                              }}
                            >
                              {count}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-2 mb-4">
                <ChefHat className="text-emerald-600" size={20} />
                <h2 className="text-xl font-semibold text-gray-900">
                  Skill Level Distribution
                </h2>
              </div>

              {Object.keys(data?.skillLevelBreakdown || {}).length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  No skill level data yet
                </p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(data?.skillLevelBreakdown || {}).map(([level, count]) => {
                    const total = Object.values(data?.skillLevelBreakdown || {}).reduce(
                      (sum, val) => sum + val,
                      0
                    );
                    const percentage = Math.round((count / total) * 100);

                    return (
                      <div key={level}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-900 capitalize">
                            {level}
                          </span>
                          <span className="text-sm text-gray-600">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              level === 'beginner'
                                ? 'bg-green-500'
                                : level === 'intermediate'
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
