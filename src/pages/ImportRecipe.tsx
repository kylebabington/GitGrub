import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { Input } from '../components/Input';
import { Download, Link, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function ImportRecipe() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [url, setUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [recipeId, setRecipeId] = useState('');

  const importRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    setImporting(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch(url);
      const html = await response.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      let recipe = extractRecipeData(doc, url);

      if (!recipe.title) {
        setError('Could not extract recipe data from this URL. Try copying and pasting the recipe manually.');
        setImporting(false);
        return;
      }

      const { data: repoData } = await supabase
        .from('repos')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1)
        .maybeSingle();

      let repoId = repoData?.id;

      if (!repoId) {
        const { data: newRepo } = await supabase
          .from('repos')
          .insert({
            owner_id: user.id,
            title: 'My Imported Recipes',
            description: 'Recipes imported from various sources',
            is_private: false,
          })
          .select()
          .single();

        repoId = newRepo?.id;
      }

      const { data: newRecipe, error: insertError } = await supabase
        .from('recipes')
        .insert({
          repo_id: repoId,
          title: recipe.title,
          description: recipe.description || '',
          ingredients: recipe.ingredients,
          steps: recipe.steps,
          prep_time: recipe.prepTime || 0,
          cooking_time: recipe.cookTime || 0,
          yield_amount: recipe.yield || '',
          created_by: user.id,
          is_public: true,
          source_url: url,
          imported_at: new Date().toISOString(),
          import_source: new URL(url).hostname.replace('www.', ''),
        })
        .select()
        .single();

      if (insertError) {
        setError('Failed to save recipe: ' + insertError.message);
        setImporting(false);
        return;
      }

      await supabase.from('commits').insert({
        recipe_id: newRecipe.id,
        author_id: user.id,
        message: `Imported recipe from ${new URL(url).hostname}`,
        diff_data: { type: 'import', source: url },
      });

      setSuccess(true);
      setRecipeId(newRecipe.id);
    } catch (err: any) {
      setError('Failed to import recipe: ' + err.message);
    }

    setImporting(false);
  };

  const extractRecipeData = (doc: Document, sourceUrl: string) => {
    let recipe: any = {
      title: '',
      description: '',
      ingredients: [],
      steps: [],
      prepTime: 0,
      cookTime: 0,
      yield: '',
    };

    const jsonLd = doc.querySelector('script[type="application/ld+json"]');
    if (jsonLd) {
      try {
        const data = JSON.parse(jsonLd.textContent || '');
        const recipeData = Array.isArray(data)
          ? data.find(item => item['@type'] === 'Recipe')
          : data['@type'] === 'Recipe' ? data : null;

        if (recipeData) {
          recipe.title = recipeData.name || '';
          recipe.description = recipeData.description || '';

          if (recipeData.recipeIngredient) {
            recipe.ingredients = recipeData.recipeIngredient.map((ing: string) => ({
              item: ing,
              quantity: '',
              notes: '',
            }));
          }

          if (recipeData.recipeInstructions) {
            const instructions = Array.isArray(recipeData.recipeInstructions)
              ? recipeData.recipeInstructions
              : [recipeData.recipeInstructions];

            recipe.steps = instructions.map((step: any) => {
              if (typeof step === 'string') {
                return { instruction: step };
              }
              return { instruction: step.text || step.name || '' };
            }).filter((step: any) => step.instruction);
          }

          if (recipeData.prepTime) {
            recipe.prepTime = parseIsoDuration(recipeData.prepTime);
          }

          if (recipeData.cookTime) {
            recipe.cookTime = parseIsoDuration(recipeData.cookTime);
          }

          if (recipeData.recipeYield) {
            recipe.yield = Array.isArray(recipeData.recipeYield)
              ? recipeData.recipeYield[0]
              : recipeData.recipeYield;
          }

          return recipe;
        }
      } catch (e) {
        console.error('Failed to parse JSON-LD', e);
      }
    }

    recipe.title =
      doc.querySelector('h1[itemprop="name"]')?.textContent ||
      doc.querySelector('h1.recipe-title')?.textContent ||
      doc.querySelector('h1')?.textContent ||
      '';

    recipe.description =
      doc.querySelector('[itemprop="description"]')?.textContent ||
      doc.querySelector('.recipe-description')?.textContent ||
      '';

    const ingredientSelectors = [
      '[itemprop="recipeIngredient"]',
      '.ingredient',
      '.recipe-ingredient',
      'li[class*="ingredient"]',
    ];

    for (const selector of ingredientSelectors) {
      const ingredients = Array.from(doc.querySelectorAll(selector));
      if (ingredients.length > 0) {
        recipe.ingredients = ingredients.map((el) => ({
          item: el.textContent?.trim() || '',
          quantity: '',
          notes: '',
        }));
        break;
      }
    }

    const stepSelectors = [
      '[itemprop="recipeInstructions"] li',
      '.instruction',
      '.recipe-step',
      'ol[class*="instruction"] li',
    ];

    for (const selector of stepSelectors) {
      const steps = Array.from(doc.querySelectorAll(selector));
      if (steps.length > 0) {
        recipe.steps = steps.map((el) => ({
          instruction: el.textContent?.trim() || '',
        }));
        break;
      }
    }

    return recipe;
  };

  const parseIsoDuration = (duration: string): number => {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    return hours * 60 + minutes;
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Import Recipe</h1>
          <p className="text-gray-600">
            Import recipes from popular recipe websites automatically
          </p>
        </div>

        {success ? (
          <Card>
            <CardBody>
              <div className="text-center py-8">
                <CheckCircle size={64} className="mx-auto text-green-600 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Recipe Imported Successfully!
                </h2>
                <p className="text-gray-600 mb-6">
                  Your recipe has been imported and saved to your collection
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => navigate(`/recipe/${recipeId}`)}>
                    View Recipe
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setUrl('');
                      setSuccess(false);
                      setRecipeId('');
                    }}
                  >
                    Import Another
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        ) : (
          <>
            <Card className="mb-6">
              <CardBody>
                <form onSubmit={importRecipe} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recipe URL
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          type="url"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          placeholder="https://www.example.com/recipe-name"
                          required
                        />
                      </div>
                      <Button type="submit" disabled={importing}>
                        <Download size={16} className="mr-2" />
                        {importing ? 'Importing...' : 'Import'}
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Paste the URL of any recipe from popular recipe sites
                    </p>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                      <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-red-900">Import Failed</p>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                      </div>
                    </div>
                  )}
                </form>
              </CardBody>
            </Card>

            <Card className="mb-6">
              <CardBody>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Supported Websites
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    'AllRecipes',
                    'Food Network',
                    'Bon Appétit',
                    'Serious Eats',
                    'NYT Cooking',
                    'Tasty',
                    'Epicurious',
                    'BBC Good Food',
                  ].map((site) => (
                    <div
                      key={site}
                      className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
                    >
                      <CheckCircle size={16} className="text-green-600" />
                      <span className="text-sm text-gray-700">{site}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Most recipe websites that use standard recipe markup are supported
                </p>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  How It Works
                </h2>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Find a recipe online</p>
                      <p className="text-sm text-gray-600">
                        Browse your favorite recipe websites
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Copy the URL</p>
                      <p className="text-sm text-gray-600">
                        Copy the full URL from your browser's address bar
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Paste and import</p>
                      <p className="text-sm text-gray-600">
                        We'll automatically extract the recipe details
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                      4
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Edit and customize</p>
                      <p className="text-sm text-gray-600">
                        Review and make any adjustments to your imported recipe
                      </p>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}
