import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Card, CardBody } from '../components/Card';
import { Button } from '../components/Button';
import { Search, X, Star, Clock, ChefHat } from 'lucide-react';
import { supabase } from '../lib/supabase';

const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced'];

export function AdvancedSearch() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [includeIngredients, setIncludeIngredients] = useState('');
  const [excludeIngredients, setExcludeIngredients] = useState('');
  const [selectedSkillLevel, setSelectedSkillLevel] = useState<string[]>([]);
  const [maxTime, setMaxTime] = useState<number | null>(null);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    const { data } = await supabase
      .from('tags')
      .select('*')
      .order('name');
    setAvailableTags(data || []);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  };

  const toggleDietary = (tag: string) => {
    setSelectedDietary(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const toggleSkillLevel = (level: string) => {
    setSelectedSkillLevel(prev =>
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    );
  };

  const handleSearch = async () => {
    setLoading(true);
    setHasSearched(true);

    let query = supabase
      .from('recipes')
      .select('*, recipe_tags!inner(tag_id)')
      .eq('is_public', true);

    if (searchQuery) {
      query = query.textSearch('search_vector', searchQuery, {
        type: 'websearch',
        config: 'english',
      });
    }

    if (selectedSkillLevel.length > 0) {
      query = query.in('skill_level', selectedSkillLevel);
    }

    if (maxTime) {
      query = query.lte('cooking_time', maxTime);
    }

    if (selectedTags.length > 0) {
      query = query.in('recipe_tags.tag_id', selectedTags);
    }

    const { data } = await query.order('created_at', { ascending: false }).limit(50);

    let filteredRecipes = data || [];

    if (includeIngredients) {
      const includeTerms = includeIngredients.toLowerCase().split(',').map(s => s.trim());
      filteredRecipes = filteredRecipes.filter(recipe => {
        const ingredients = (recipe.ingredients || []) as Array<{ item: string }>;
        const ingredientText = ingredients.map(i => i.item.toLowerCase()).join(' ');
        return includeTerms.every(term => ingredientText.includes(term));
      });
    }

    if (excludeIngredients) {
      const excludeTerms = excludeIngredients.toLowerCase().split(',').map(s => s.trim());
      filteredRecipes = filteredRecipes.filter(recipe => {
        const ingredients = (recipe.ingredients || []) as Array<{ item: string }>;
        const ingredientText = ingredients.map(i => i.item.toLowerCase()).join(' ');
        return !excludeTerms.some(term => ingredientText.includes(term));
      });
    }

    setRecipes(filteredRecipes);
    setLoading(false);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setIncludeIngredients('');
    setExcludeIngredients('');
    setSelectedSkillLevel([]);
    setSelectedTags([]);
    setMaxTime(null);
    setRecipes([]);
    setHasSearched(false);
  };

  const cuisineTags = availableTags.filter(t => t.category === 'cuisine');
  const dietaryTags = availableTags.filter(t => t.category === 'dietary');
  const mealTags = availableTags.filter(t => t.category === 'meal');

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Recipe Search</h1>
          <p className="text-gray-600">
            Find the perfect recipe with powerful filters
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-20">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Recipe name or tag..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Include Ingredients
                  </label>
                  <input
                    type="text"
                    value={includeIngredients}
                    onChange={(e) => setIncludeIngredients(e.target.value)}
                    placeholder="chicken, garlic, tomato"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Comma separated</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exclude Ingredients
                  </label>
                  <input
                    type="text"
                    value={excludeIngredients}
                    onChange={(e) => setExcludeIngredients(e.target.value)}
                    placeholder="nuts, dairy"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Comma separated</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cuisine Type
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {cuisineTags.map(tag => (
                      <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag.id)}
                          onChange={() => toggleTag(tag.id)}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm text-gray-700 capitalize">{tag.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dietary Preferences
                  </label>
                  <div className="space-y-2">
                    {dietaryTags.map(tag => (
                      <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag.id)}
                          onChange={() => toggleTag(tag.id)}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm text-gray-700 capitalize">{tag.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meal Type
                  </label>
                  <div className="space-y-2">
                    {mealTags.map(tag => (
                      <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag.id)}
                          onChange={() => toggleTag(tag.id)}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm text-gray-700 capitalize">{tag.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skill Level
                  </label>
                  <div className="space-y-2">
                    {SKILL_LEVELS.map(level => (
                      <label key={level} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedSkillLevel.includes(level)}
                          onChange={() => toggleSkillLevel(level)}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm text-gray-700 capitalize">{level}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Cooking Time
                  </label>
                  <div className="flex gap-2">
                    {[15, 30, 45, 60].map(time => (
                      <button
                        key={time}
                        onClick={() => setMaxTime(maxTime === time ? null : time)}
                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                          maxTime === time
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {time}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <Button
                  onClick={handleSearch}
                  className="w-full"
                  disabled={loading}
                >
                  <Search size={16} className="mr-2" />
                  {loading ? 'Searching...' : 'Search'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="w-full"
                >
                  <X size={16} className="mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            {!hasSearched ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                <Search size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Use the filters to find recipes</p>
              </div>
            ) : loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Searching...</p>
              </div>
            ) : recipes.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-600">No recipes found matching your criteria</p>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <p className="text-gray-600">
                    Found {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {recipes.map(recipe => (
                    <Card
                      key={recipe.id}
                      onClick={() => navigate(`/recipe/${recipe.id}`)}
                    >
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
                          {recipe.cooking_time && (
                            <div className="flex items-center gap-1">
                              <Clock size={16} />
                              <span>{recipe.cooking_time}m</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <ChefHat size={16} />
                            <span className="capitalize">{recipe.skill_level}</span>
                          </div>
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
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
