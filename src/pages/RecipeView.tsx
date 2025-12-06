import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { CookingMode } from '../components/CookingMode';
import { RecipeComments } from '../components/RecipeComments';
import { RecipeRatings } from '../components/RecipeRatings';
import { RecipeScaler } from '../components/RecipeScaler';
import { IngredientSubstitution } from '../components/IngredientSubstitution';
import { RecipeTimer, parseTimeFromText } from '../components/RecipeTimer';
import { RecipeProgressTracker, StepIndicator } from '../components/RecipeProgressTracker';
import { QuickCollections } from '../components/QuickCollections';
import { CookTonightButton } from '../components/CookTonightButton';
import { Star, GitFork, Clock, ChefHat, Users, MessageCircle, Play, GitPullRequest, History, GitBranch, Edit, Calendar, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { 
  Recipe, 
  Repo, 
  UserProfile, 
  Ingredient, 
  Step, 
  RecipeEquipmentJoin, 
  RecipeUsageStats 
} from '../lib/database.types';

export function RecipeView({ recipeId }: { recipeId: string }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [repo, setRepo] = useState<Repo | null>(null);
  const [author, setAuthor] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStarred, setIsStarred] = useState(false);
  const [starLoading, setStarLoading] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<boolean[]>([]);
  const [cookingMode, setCookingMode] = useState(false);
  const [equipment, setEquipment] = useState<RecipeEquipmentJoin[]>([]);
  const [usageStats, setUsageStats] = useState<RecipeUsageStats | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  // Parallel data loading for better performance
  const loadAllData = useCallback(async () => {
    setLoading(true);
    
    // First, fetch the recipe (needed for subsequent queries)
    const { data: recipeData, error: recipeError } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', recipeId)
      .maybeSingle();

    if (recipeError || !recipeData) {
      setLoading(false);
      return;
    }

    // Now fetch all related data in PARALLEL
    const [repoResult, authorResult, starResult, equipmentResult, statsResult] = await Promise.all([
      // Repo data
      supabase
        .from('repos')
        .select('*')
        .eq('id', recipeData.repo_id)
        .single(),
      // Author data
      supabase
        .from('user_profiles')
        .select('*')
        .eq('id', recipeData.created_by)
        .single(),
      // Star status (only if user is logged in)
      user 
        ? supabase
            .from('stars')
            .select('*')
            .eq('user_id', user.id)
            .eq('recipe_id', recipeId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      // Equipment
      supabase
        .from('recipe_equipment')
        .select('*, equipment:kitchen_equipment(*)')
        .eq('recipe_id', recipeId)
        .order('is_required', { ascending: false }),
      // Usage stats
      supabase
        .from('recipe_usage_stats')
        .select('*')
        .eq('recipe_id', recipeId)
        .maybeSingle(),
    ]);

    // Set all state at once
    setRecipe(recipeData);
    setRepo(repoResult.data);
    setAuthor(authorResult.data);
    setIsStarred(!!starResult.data);
    setEquipment((equipmentResult.data as RecipeEquipmentJoin[]) || []);
    setUsageStats(statsResult.data);
    
    const recipeIngredients = (recipeData.ingredients as Ingredient[]) || [];
    setIngredients(recipeIngredients);
    setCheckedIngredients(new Array(recipeIngredients.length).fill(false));
    setLoading(false);
  }, [recipeId, user]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Atomic star toggle using RPC function (prevents race conditions)
  const toggleStar = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!recipe || starLoading) return;
    
    setStarLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('toggle_recipe_star', {
        p_user_id: user.id,
        p_recipe_id: recipeId,
      });

      if (error) throw error;

      // Update local state based on server response
      const newIsStarred = !isStarred;
      setIsStarred(newIsStarred);
      setRecipe({
        ...recipe,
        star_count: newIsStarred ? recipe.star_count + 1 : Math.max(0, recipe.star_count - 1),
      });
    } catch (err) {
      console.error('Failed to toggle star:', err);
      // Fallback to old behavior if RPC doesn't exist yet
      if (isStarred) {
        await supabase.from('stars').delete().eq('user_id', user.id).eq('recipe_id', recipeId);
        await supabase.from('recipes').update({ star_count: Math.max(0, recipe.star_count - 1) }).eq('id', recipeId);
        setIsStarred(false);
        setRecipe({ ...recipe, star_count: Math.max(0, recipe.star_count - 1) });
      } else {
        await supabase.from('stars').insert({ user_id: user.id, recipe_id: recipeId });
        await supabase.from('recipes').update({ star_count: recipe.star_count + 1 }).eq('id', recipeId);
        setIsStarred(true);
        setRecipe({ ...recipe, star_count: recipe.star_count + 1 });
      }
    } finally {
      setStarLoading(false);
    }
  };

  const handleFork = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    navigate(`/recipe/${recipeId}/fork`);
  };

  const handleIngredientSubstitution = (index: number, newIngredient: string, newQuantity: string) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      item: newIngredient,
      quantity: newQuantity,
    };
    setIngredients(updatedIngredients);
  };

  const handleStepComplete = (stepNumber: number) => {
    if (!completedSteps.includes(stepNumber)) {
      setCompletedSteps([...completedSteps, stepNumber]);
    }
  };

  const toggleStepCompletion = (stepNumber: number) => {
    if (completedSteps.includes(stepNumber)) {
      setCompletedSteps(completedSteps.filter(s => s !== stepNumber));
    } else {
      setCompletedSteps([...completedSteps, stepNumber]);
    }
  };

  const toggleIngredient = (index: number) => {
    const updated = [...checkedIngredients];
    updated[index] = !updated[index];
    setCheckedIngredients(updated);
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

  if (!recipe) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Recipe Not Found</h1>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </Layout>
    );
  }

  const steps = recipe.steps as Step[];
  const totalTime = (recipe.prep_time || 0) + (recipe.cooking_time || 0);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="mb-6">
              <div className="text-sm text-gray-600 mb-2">
                <button
                  type="button"
                  onClick={() => author && navigate(`/${author.username}`)}
                  className="hover:text-emerald-600"
                >
                  {author?.username}
                </button>
                {' / '}
                <button
                  type="button"
                  onClick={() => repo && navigate(`/repo/${repo.id}`)}
                  className="hover:text-emerald-600"
                >
                  {repo?.title}
                </button>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{recipe.title}</h1>

              {recipe.tags && recipe.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {recipe.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-emerald-50 text-emerald-700 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-6 text-sm text-gray-600 mb-6">
                {totalTime > 0 && (
                  <span className="flex items-center gap-2">
                    <Clock size={16} />
                    {totalTime} min
                  </span>
                )}
                <span className="flex items-center gap-2">
                  <ChefHat size={16} />
                  {recipe.skill_level}
                </span>
                {recipe.yield_amount && (
                  <span className="flex items-center gap-2">
                    <Users size={16} />
                    {recipe.yield_amount}
                  </span>
                )}
                {usageStats && usageStats.total_meal_plans > 0 && (
                  <span className="flex items-center gap-2 text-purple-600">
                    <Calendar size={16} />
                    {usageStats.total_meal_plans} meal plans
                  </span>
                )}
                {usageStats && usageStats.this_week_plans > 0 && (
                  <span className="flex items-center gap-2 text-orange-600">
                    <TrendingUp size={16} />
                    {usageStats.this_week_plans} this week
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 mb-8">
                <Button
                  variant="primary"
                  onClick={() => setCookingMode(true)}
                  className="font-semibold"
                >
                  <Play size={20} className="inline mr-2" />
                  Start Cooking
                </Button>

                <CookTonightButton recipeId={recipeId} />

                <QuickCollections recipeId={recipeId} />

                {user?.id === recipe.created_by && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/recipe/${recipeId}/edit`)}
                  >
                    <Edit size={16} className="inline mr-1" />
                    Edit
                  </Button>
                )}

                <Button
                  variant={isStarred ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={toggleStar}
                >
                  <Star size={16} className="inline mr-1" fill={isStarred ? 'currentColor' : 'none'} />
                  {isStarred ? 'Starred' : 'Star'} {recipe.star_count}
                </Button>

                <Button variant="secondary" size="sm" onClick={handleFork}>
                  <GitFork size={16} className="inline mr-1" />
                  Fork {recipe.fork_count}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/recipe/${recipeId}/pull-requests`)}
                >
                  <GitPullRequest size={16} className="inline mr-1" />
                  Pull Requests
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/recipe/${recipeId}/branches`)}
                >
                  <GitBranch size={16} className="inline mr-1" />
                  Branches
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/recipe/${recipeId}/history`)}
                >
                  <History size={16} className="inline mr-1" />
                  History
                </Button>

                <Button variant="ghost" size="sm">
                  <MessageCircle size={16} className="inline mr-1" />
                  Comment
                </Button>
              </div>
            </div>

            {recipe.hero_image_url && (
              <img
                src={recipe.hero_image_url}
                alt={recipe.title}
                className="w-full h-96 object-cover rounded-lg mb-8"
              />
            )}

            {user && (
              <RecipeProgressTracker
                recipeId={recipeId}
                totalSteps={steps.length}
                onStepComplete={handleStepComplete}
              />
            )}

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Instructions</h2>
              <div className="space-y-6">
                {steps.map((step, index) => {
                  const stepNumber = index + 1;
                  const timeInStep = parseTimeFromText(step.instruction);
                  const isStepComplete = completedSteps.includes(stepNumber);

                  return (
                    <div
                      key={index}
                      className={`flex gap-4 transition-opacity duration-300 ${
                        isStepComplete ? 'opacity-60' : 'opacity-100'
                      }`}
                    >
                      {user ? (
                        <StepIndicator
                          stepNumber={stepNumber}
                          isCompleted={isStepComplete}
                          onClick={() => toggleStepCompletion(stepNumber)}
                        />
                      ) : (
                        <div className="flex-shrink-0 w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">
                          {stepNumber}
                        </div>
                      )}
                      <div className="flex-1 pt-2">
                        <p className={`text-gray-700 leading-relaxed ${isStepComplete ? 'line-through' : ''}`}>
                          {step.instruction}
                        </p>
                        {timeInStep && (
                          <div className="mt-2">
                            <RecipeTimer
                              duration={timeInStep}
                              label={`Step ${stepNumber}`}
                              stepNumber={stepNumber}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {recipe.notes && (
              <Card className="mb-8">
                <CardBody>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Chef's Notes</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{recipe.notes}</p>
                </CardBody>
              </Card>
            )}

            {recipe.original_recipe_id && (
              <Card className="mb-8 border-emerald-200 bg-emerald-50">
                <CardBody>
                  <p className="text-sm text-emerald-700">
                    <GitFork size={14} className="inline mr-1" />
                    Forked from{' '}
                    <button
                      type="button"
                      onClick={() => navigate(`/recipe/${recipe.original_recipe_id}`)}
                      className="font-semibold hover:underline"
                    >
                      original recipe
                    </button>
                  </p>
                </CardBody>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card>
                <CardBody>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Ingredients</h3>
                  <div className="space-y-3">
                    {ingredients.map((ingredient, index) => (
                      <label
                        key={index}
                        className="flex items-start gap-3 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={checkedIngredients[index]}
                          onChange={() => toggleIngredient(index)}
                          className="mt-1 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        <div className="flex-1">
                          <p
                            className={`text-gray-900 ${
                              checkedIngredients[index] ? 'line-through text-gray-400' : ''
                            }`}
                          >
                            <span className="font-semibold">{ingredient.quantity}</span>{' '}
                            {ingredient.item}
                            <IngredientSubstitution
                              ingredient={ingredient.item}
                              quantity={ingredient.quantity}
                              onSubstitute={(newIngredient, newQuantity) =>
                                handleIngredientSubstitution(index, newIngredient, newQuantity)
                              }
                            />
                          </p>
                          {ingredient.notes && (
                            <p className="text-sm text-gray-500 mt-0.5">{ingredient.notes}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </CardBody>
              </Card>

              <div className="mt-6">
                <RecipeScaler
                  originalServings={recipe.yield_amount || '4 servings'}
                  ingredients={ingredients}
                  prepTime={recipe.prep_time}
                  cookingTime={recipe.cooking_time}
                  temperature={350}
                />
              </div>

              {equipment.length > 0 && (
                <Card className="mt-6">
                  <CardBody>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Kitchen Equipment</h3>
                    <div className="space-y-2">
                      {equipment.map((item) => (
                        <div
                          key={item.equipment_id}
                          className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-900">{item.equipment?.name}</span>
                              {item.is_required ? (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                                  Required
                                </span>
                              ) : (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                  Optional
                                </span>
                              )}
                            </div>
                            {item.notes && (
                              <p className="text-xs text-gray-600 mt-1">{item.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              )}

              <Card className="mt-6">
                <CardBody>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recipe Info</h3>
                  <div className="space-y-3 text-sm">
                    {recipe.prep_time && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Prep Time:</span>
                        <span className="font-semibold text-gray-900">{recipe.prep_time} min</span>
                      </div>
                    )}
                    {recipe.cooking_time && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cook Time:</span>
                        <span className="font-semibold text-gray-900">{recipe.cooking_time} min</span>
                      </div>
                    )}
                    {totalTime > 0 && (
                      <div className="flex justify-between border-t pt-3">
                        <span className="text-gray-600">Total Time:</span>
                        <span className="font-semibold text-gray-900">{totalTime} min</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Difficulty:</span>
                      <span className="font-semibold text-gray-900 capitalize">{recipe.skill_level}</span>
                    </div>
                    {recipe.yield_amount && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Yield:</span>
                        <span className="font-semibold text-gray-900">{recipe.yield_amount}</span>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <Card>
            <CardBody>
              <RecipeRatings
                recipeId={recipeId}
                averageRating={(recipe as any).average_rating || 0}
                ratingCount={(recipe as any).rating_count || 0}
                onRatingUpdate={loadAllData}
              />
            </CardBody>
          </Card>
        </div>

        <div className="mt-8">
          <RecipeComments recipeId={recipeId} />
        </div>
      </div>

      {cookingMode && (
        <CookingMode
          recipe={recipe}
          onClose={() => setCookingMode(false)}
        />
      )}
    </Layout>
  );
}
