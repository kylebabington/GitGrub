import { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { RecipeSearchModal } from '../components/RecipeSearchModal';
import { Calendar, Plus, ShoppingCart, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MealPlan {
  id?: string;
  user_id: string;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipe_id: string;
  recipe?: any;
}

export function MealPlanner() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [showRecipeSelector, setShowRecipeSelector] = useState<{
    date: string;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const mealTypes: Array<'breakfast' | 'lunch' | 'dinner' | 'snack'> = ['breakfast', 'lunch', 'dinner', 'snack'];

  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  function getDaysOfWeek(weekStart: Date): Date[] {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      days.push(day);
    }
    return days;
  }

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, currentWeekStart]);

  const loadData = async () => {
    if (!user) return;

    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const { data: plans } = await supabase
      .from('meal_plans')
      .select('*, recipe:recipes(*)')
      .eq('user_id', user.id)
      .gte('date', formatDate(currentWeekStart))
      .lt('date', formatDate(weekEnd));

    setMealPlans(plans || []);
    setLoading(false);
  };

  const addMealPlan = async (recipeId: string) => {
    if (!user || !showRecipeSelector) return;

    const { date, mealType } = showRecipeSelector;

    const { error } = await supabase
      .from('meal_plans')
      .insert({
        user_id: user.id,
        date,
        meal_type: mealType,
        recipe_id: recipeId,
      });

    if (!error) {
      setShowRecipeSelector(null);
      loadData();
    }
  };

  const removeMealPlan = async (planId: string) => {
    await supabase
      .from('meal_plans')
      .delete()
      .eq('id', planId);

    loadData();
  };

  const generateShoppingList = () => {
    const allIngredients: any[] = [];
    mealPlans.forEach(plan => {
      if (plan.recipe?.ingredients) {
        plan.recipe.ingredients.forEach((ing: any) => {
          allIngredients.push({
            ...ing,
            recipe_title: plan.recipe.title,
          });
        });
      }
    });

    localStorage.setItem('temp_shopping_list', JSON.stringify(allIngredients));
    navigate('/shopping-list');
  };

  const previousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const nextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
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

  const daysOfWeek = getDaysOfWeek(currentWeekStart);
  const weekEndDate = new Date(currentWeekStart);
  weekEndDate.setDate(weekEndDate.getDate() + 6);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Meal Planner</h1>
            <p className="text-gray-600">
              Plan your weekly meals and generate shopping lists
            </p>
          </div>

          <Button onClick={generateShoppingList}>
            <ShoppingCart size={20} className="mr-2" />
            Generate Shopping List
          </Button>
        </div>

        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={previousWeek}>
            <ChevronLeft size={20} />
          </Button>

          <h2 className="text-xl font-semibold text-gray-900">
            {currentWeekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            {' - '}
            {weekEndDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </h2>

          <Button variant="ghost" onClick={nextWeek}>
            <ChevronRight size={20} />
          </Button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-8 border-b border-gray-200">
            <div className="p-4 bg-gray-50 border-r border-gray-200">
              <span className="text-sm font-semibold text-gray-600">Meal</span>
            </div>
            {daysOfWeek.map((day, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 border-r border-gray-200 last:border-r-0"
              >
                <div className="text-center">
                  <div className="text-sm font-semibold text-gray-900">
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-xs text-gray-600">
                    {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {mealTypes.map((mealType) => (
            <div key={mealType} className="grid grid-cols-8 border-b border-gray-200 last:border-b-0">
              <div className="p-4 bg-gray-50 border-r border-gray-200 flex items-center">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {mealType}
                </span>
              </div>

              {daysOfWeek.map((day, dayIndex) => {
                const dateStr = formatDate(day);
                const plan = mealPlans.find(
                  p => p.date === dateStr && p.meal_type === mealType
                );

                return (
                  <div
                    key={dayIndex}
                    className="p-3 border-r border-gray-200 last:border-r-0 min-h-[120px] hover:bg-gray-50 transition-colors"
                  >
                    {plan ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 relative group">
                        <button
                          onClick={() => removeMealPlan(plan.id!)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">
                          {plan.recipe?.title}
                        </p>
                        {plan.recipe?.cooking_time && (
                          <p className="text-xs text-gray-600 mt-1">
                            {plan.recipe.cooking_time}m
                          </p>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowRecipeSelector({ date: dateStr, mealType })}
                        className="w-full h-full flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <Plus size={24} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <RecipeSearchModal
          isOpen={!!showRecipeSelector}
          onClose={() => setShowRecipeSelector(null)}
          onSelectRecipe={addMealPlan}
          dateInfo={showRecipeSelector ? {
            date: showRecipeSelector.date,
            mealType: showRecipeSelector.mealType
          } : undefined}
        />
      </div>
    </Layout>
  );
}
