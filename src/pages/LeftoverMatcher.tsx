import { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { Clock, ChefHat, TrendingUp, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { matchRecipesWithInventory, suggestSubstitutions } from '../lib/recipeMatcher';

interface MatchResult {
  recipe: any;
  matchScore: number;
  matchedIngredients: string[];
  missingIngredients: string[];
  totalIngredients: number;
}

export function LeftoverMatcher() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [fridgeItems, setFridgeItems] = useState<any[]>([]);
  const [expiringItems, setExpiringItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const { data: inventory } = await supabase
      .from('fridge_inventory')
      .select('*')
      .eq('user_id', user.id);

    setFridgeItems(inventory || []);

    const today = new Date();
    const in7Days = new Date();
    in7Days.setDate(today.getDate() + 7);

    const expiring = (inventory || []).filter((item) => {
      if (!item.expiration_date) return false;
      const expDate = new Date(item.expiration_date);
      return expDate <= in7Days;
    });

    setExpiringItems(expiring);

    const { data: recipes } = await supabase
      .from('recipes')
      .select('*')
      .eq('is_public', true)
      .limit(100);

    if (recipes && inventory) {
      const matchResults = matchRecipesWithInventory(recipes, inventory);
      setMatches(matchResults.filter((m) => m.matchScore > 0));
    }

    setLoading(false);
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-700 border-green-200';
    if (score >= 50) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-orange-100 text-orange-700 border-orange-200';
  };

  const getMatchLabel = (score: number) => {
    if (score === 100) return 'Perfect Match';
    if (score >= 80) return 'Great Match';
    if (score >= 50) return 'Good Match';
    return 'Partial Match';
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

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Recipe Matcher</h1>
              <p className="text-gray-600">
                Find recipes you can make with ingredients you have
              </p>
            </div>
            <Button onClick={loadData} variant="secondary">
              <RefreshCw size={20} className="mr-2" />
              Refresh
            </Button>
          </div>

          {fridgeItems.length === 0 ? (
            <Card className="border-blue-200 bg-blue-50">
              <CardBody>
                  <p className="text-blue-800">
                    <AlertCircle size={20} className="inline mr-2" />
                    Add ingredients to your{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/fridge')}
                      className="font-semibold underline"
                    >
                      fridge inventory
                    </button>{' '}
                    to see recipe matches.
                  </p>
              </CardBody>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardBody>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Ingredients Available</p>
                    <p className="text-3xl font-bold text-gray-900">{fridgeItems.length}</p>
                  </div>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Recipe Matches</p>
                    <p className="text-3xl font-bold text-gray-900">{matches.length}</p>
                  </div>
                </CardBody>
              </Card>
              <Card className={expiringItems.length > 0 ? 'border-orange-200 bg-orange-50' : ''}>
                <CardBody>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Expiring Soon</p>
                    <p className="text-3xl font-bold text-orange-600">{expiringItems.length}</p>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}
        </div>

        {expiringItems.length > 0 && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardBody>
              <h3 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                <AlertCircle size={20} />
                Use These Ingredients Soon
              </h3>
              <div className="flex flex-wrap gap-2">
                {expiringItems.map((item) => (
                  <span
                    key={item.id}
                    className="px-3 py-1 bg-white border border-orange-200 rounded-full text-sm text-orange-700"
                  >
                    {item.ingredient_name}
                    {item.expiration_date && (
                      <span className="ml-2 text-xs">
                        (expires{' '}
                        {new Date(item.expiration_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })})
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {matches.map((match) => (
            <Card
              key={match.recipe.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedMatch(match)}
            >
              <CardBody>
                <div className="mb-3">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {match.recipe.title}
                    </h3>
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full border ${getMatchColor(
                        match.matchScore
                      )}`}
                    >
                      {match.matchScore}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{getMatchLabel(match.matchScore)}</p>
                </div>

                {match.recipe.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {match.recipe.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  {match.recipe.prep_time && (
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {match.recipe.prep_time + (match.recipe.cooking_time || 0)}m
                    </span>
                  )}
                  {match.recipe.skill_level && (
                    <span className="flex items-center gap-1">
                      <ChefHat size={14} />
                      {match.recipe.skill_level}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Ingredients</span>
                    <span className="font-medium text-gray-900">
                      {match.matchedIngredients.length} / {match.totalIngredients}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-emerald-600 h-2 rounded-full transition-all"
                      style={{ width: `${match.matchScore}%` }}
                    />
                  </div>

                  {match.missingIngredients.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 mb-1">Missing:</p>
                      <div className="flex flex-wrap gap-1">
                        {match.missingIngredients.slice(0, 3).map((ing, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded"
                          >
                            {ing}
                          </span>
                        ))}
                        {match.missingIngredients.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{match.missingIngredients.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/recipe/${match.recipe.id}`);
                    }}
                  >
                    View Recipe
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {matches.length === 0 && fridgeItems.length > 0 && (
          <Card>
            <CardBody className="text-center py-12">
              <TrendingUp className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Matches Found</h3>
              <p className="text-gray-600 mb-6">
                Try adding more ingredients to your fridge inventory
              </p>
              <Button onClick={() => navigate('/fridge')}>
                Go to Fridge Inventory
              </Button>
            </CardBody>
          </Card>
        )}

        {selectedMatch && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedMatch(null)}
          >
            <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <CardBody>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {selectedMatch.recipe.title}
                </h2>

                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-4 ${getMatchColor(
                    selectedMatch.matchScore
                  )}`}
                >
                  <TrendingUp size={16} />
                  <span className="font-semibold">
                    {selectedMatch.matchScore}% Match - {getMatchLabel(selectedMatch.matchScore)}
                  </span>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-600" />
                    You Have ({selectedMatch.matchedIngredients.length})
                  </h3>
                  <div className="space-y-1">
                    {selectedMatch.matchedIngredients.map((ing, idx) => (
                      <p key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                        <CheckCircle size={14} className="text-green-600" />
                        {ing}
                      </p>
                    ))}
                  </div>
                </div>

                {selectedMatch.missingIngredients.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <AlertCircle size={18} className="text-orange-600" />
                      You Need ({selectedMatch.missingIngredients.length})
                    </h3>
                    <div className="space-y-3">
                      {selectedMatch.missingIngredients.map((ing, idx) => {
                        const subs = suggestSubstitutions(ing);
                        return (
                          <div key={idx} className="text-sm">
                            <p className="text-gray-700 font-medium">{ing}</p>
                            {subs.length > 0 && (
                              <p className="text-xs text-gray-500 mt-1">
                                Substitutes: {subs.join(', ')}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                <div className="flex gap-3">
                  <Button
                    onClick={() => navigate(`/recipe/${selectedMatch.recipe.id}`)}
                    variant="primary"
                    className="flex-1"
                  >
                    View Full Recipe
                  </Button>
                  <Button
                    onClick={() => setSelectedMatch(null)}
                    variant="ghost"
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
