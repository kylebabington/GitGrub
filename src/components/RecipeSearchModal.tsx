import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';
import { Search, Clock, ChefHat, TrendingUp, Star, X, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Recipe {
  id: string;
  title: string;
  description: string;
  cooking_time: number;
  prep_time: number;
  skill_level: string;
  tags: string[];
  hero_image_url: string;
  star_count: number;
  created_by: string;
  repo_id: string;
  user_profiles: { username: string };
  repos: { title: string };
  usage_stats?: { total_meal_plans: number; this_week_plans: number };
}

interface RecipeSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRecipe: (recipeId: string) => void;
  dateInfo?: { date: string; mealType: string };
}

export function RecipeSearchModal({
  isOpen,
  onClose,
  onSelectRecipe,
  dateInfo,
}: RecipeSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'trending' | 'starred'>('all');

  const [filters, setFilters] = useState({
    maxCookTime: '',
    skillLevel: '',
    tags: [] as string[],
  });

  useEffect(() => {
    if (isOpen) {
      loadRecipes();
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, recipes, filters]);

  const loadRecipes = async () => {
    setLoading(true);

    let query = supabase
      .from('recipes')
      .select(`
        *,
        user_profiles!recipes_created_by_fkey(username),
        repos!recipes_repo_id_fkey(title),
        usage_stats:recipe_usage_stats(total_meal_plans, this_week_plans)
      `)
      .eq('is_public', true);

    if (activeTab === 'trending') {
      const { data: trendingData } = await supabase
        .from('recipe_usage_stats')
        .select('recipe_id')
        .order('trending_score', { ascending: false })
        .limit(50);

      if (trendingData && trendingData.length > 0) {
        const trendingIds = trendingData.map((t) => t.recipe_id);
        query = query.in('id', trendingIds);
      }
    } else if (activeTab === 'starred') {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: starredData } = await supabase
          .from('stars')
          .select('recipe_id')
          .eq('user_id', user.id);

        if (starredData && starredData.length > 0) {
          const starredIds = starredData.map((s) => s.recipe_id);
          query = query.in('id', starredIds);
        } else {
          setRecipes([]);
          setLoading(false);
          return;
        }
      }
    }

    const { data } = await query.limit(100);
    setRecipes(data || []);
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...recipes];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (recipe) =>
          recipe.title.toLowerCase().includes(query) ||
          recipe.description?.toLowerCase().includes(query) ||
          recipe.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    if (filters.maxCookTime) {
      const maxTime = parseInt(filters.maxCookTime);
      filtered = filtered.filter(
        (recipe) =>
          (recipe.cooking_time || 0) + (recipe.prep_time || 0) <= maxTime
      );
    }

    if (filters.skillLevel) {
      filtered = filtered.filter(
        (recipe) =>
          recipe.skill_level?.toLowerCase() === filters.skillLevel.toLowerCase()
      );
    }

    if (filters.tags.length > 0) {
      filtered = filtered.filter((recipe) =>
        filters.tags.some((tag) => recipe.tags?.includes(tag))
      );
    }

    setFilteredRecipes(filtered);
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
  };

  const confirmSelection = () => {
    if (selectedRecipe) {
      onSelectRecipe(selectedRecipe.id);
      onClose();
      setSelectedRecipe(null);
      setSearchQuery('');
    }
  };

  const totalTime = (recipe: Recipe) =>
    (recipe.cooking_time || 0) + (recipe.prep_time || 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        dateInfo
          ? `Add ${dateInfo.mealType} for ${new Date(dateInfo.date).toLocaleDateString(
              'en-US',
              { month: 'short', day: 'numeric' }
            )}`
          : 'Search Recipes'
      }
      size="large"
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <Input
              type="text"
              placeholder="Search recipes, ingredients, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={showFilters ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} className="mr-2" />
            Filters
          </Button>
        </div>

        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            All Recipes
          </button>
          <button
            onClick={() => setActiveTab('trending')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-1 ${
              activeTab === 'trending'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <TrendingUp size={16} />
            Trending
          </button>
          <button
            onClick={() => setActiveTab('starred')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-1 ${
              activeTab === 'starred'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Star size={16} />
            Starred
          </button>
        </div>

        {showFilters && (
          <div className="p-4 bg-gray-50 rounded-lg grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Cook Time
              </label>
              <Input
                type="number"
                placeholder="Minutes"
                value={filters.maxCookTime}
                onChange={(e) =>
                  setFilters({ ...filters, maxCookTime: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Skill Level
              </label>
              <select
                value={filters.skillLevel}
                onChange={(e) =>
                  setFilters({ ...filters, skillLevel: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Any</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setFilters({ maxCookTime: '', skillLevel: '', tags: [] })
                }
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        )}

        <div className="text-sm text-gray-600">
          {loading ? (
            'Loading recipes...'
          ) : (
            <>
              {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''}{' '}
              found
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
          {filteredRecipes.map((recipe) => (
            <button
              key={recipe.id}
              onClick={() => handleSelectRecipe(recipe)}
              className={`text-left p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                selectedRecipe?.id === recipe.id
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-emerald-300'
              }`}
            >
              {recipe.hero_image_url && (
                <img
                  src={recipe.hero_image_url}
                  alt={recipe.title}
                  className="w-full h-32 object-cover rounded-lg mb-3"
                />
              )}
              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                {recipe.title}
              </h3>
              {recipe.description && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {recipe.description}
                </p>
              )}
              <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                {totalTime(recipe) > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {totalTime(recipe)}m
                  </span>
                )}
                {recipe.skill_level && (
                  <span className="flex items-center gap-1">
                    <ChefHat size={12} />
                    {recipe.skill_level}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  by {recipe.user_profiles?.username}
                </span>
                {recipe.usage_stats && recipe.usage_stats.this_week_plans > 0 && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                    <TrendingUp size={10} className="inline mr-1" />
                    {recipe.usage_stats.this_week_plans} this week
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {filteredRecipes.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            <p>No recipes found. Try adjusting your search or filters.</p>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={confirmSelection}
            disabled={!selectedRecipe}
            variant="primary"
            className="flex-1"
          >
            Add to Meal Plan
          </Button>
          <Button onClick={onClose} variant="ghost" className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
