import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Card, CardBody } from '../components/Card';
import { Input } from '../components/Input';
import { Search, TrendingUp, Clock, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Explore() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const popularTags = [
    'vegetarian', 'vegan', 'gluten-free', 'keto', 'dessert',
    'breakfast', 'lunch', 'dinner', 'snack', 'comfort-food',
    'quick', 'healthy', 'spicy', 'italian', 'mexican', 'asian'
  ];

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    let query = supabase
      .from('recipes')
      .select(`
        *,
        repos!inner(is_private)
      `)
      .eq('repos.is_private', false)
      .order('star_count', { ascending: false })
      .limit(24);

    const { data, error } = await query;

    if (!error && data) {
      setRecipes(data);
    }
    setLoading(false);
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = !searchQuery ||
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (recipe.tags || []).some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTags = selectedTags.length === 0 ||
      selectedTags.every(tag => (recipe.tags || []).includes(tag));

    return matchesSearch && matchesTags;
  });

  return (
    <Layout>
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Explore Recipes</h1>
          <p className="text-xl text-gray-600 mb-8">
            Discover amazing recipes from our community of chefs
          </p>

          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recipes, ingredients, or tags..."
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter by Tags</h2>
          <div className="flex flex-wrap gap-2">
            {popularTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedTags.includes(tag)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading recipes...</p>
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="text-center py-12">
            <Search className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No recipes found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                {filteredRecipes.length} {filteredRecipes.length === 1 ? 'recipe' : 'recipes'} found
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <TrendingUp size={16} />
                Sorted by popularity
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecipes.map((recipe) => (
                <Card key={recipe.id} onClick={() => navigate(`/recipe/${recipe.id}`)}>
                  {recipe.hero_image_url && (
                    <img
                      src={recipe.hero_image_url}
                      alt={recipe.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  )}
                  <CardBody>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                      {recipe.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      {(recipe.prep_time || recipe.cooking_time) && (
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {(recipe.prep_time || 0) + (recipe.cooking_time || 0)} min
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Star size={14} />
                        {recipe.star_count}
                      </span>
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
          </>
        )}
      </div>
    </Layout>
  );
}
