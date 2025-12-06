import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { Plus, Trash2, Check, ShoppingCart, Printer } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ShoppingListItem {
  id: string;
  item: string;
  quantity: string;
  recipe_title?: string;
  checked: boolean;
}

export function ShoppingList() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddRecipes, setShowAddRecipes] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const { data: starredRecipes } = await supabase
      .from('stars')
      .select('recipe_id, recipes(*)')
      .eq('user_id', user.id);

    const recipesList = (starredRecipes || [])
      .map((s: any) => s.recipes)
      .filter(Boolean);

    setRecipes(recipesList);
    setLoading(false);
  };

  const addRecipesToList = () => {
    const newItems: ShoppingListItem[] = [];

    selectedRecipes.forEach(recipeId => {
      const recipe = recipes.find(r => r.id === recipeId);
      if (recipe && recipe.ingredients) {
        recipe.ingredients.forEach((ing: any) => {
          newItems.push({
            id: `${recipeId}-${Math.random()}`,
            item: ing.item,
            quantity: ing.quantity,
            recipe_title: recipe.title,
            checked: false,
          });
        });
      }
    });

    setItems([...items, ...newItems]);
    setSelectedRecipes([]);
    setShowAddRecipes(false);
  };

  const toggleItem = (id: string) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const clearChecked = () => {
    setItems(items.filter(item => !item.checked));
  };

  const clearAll = () => {
    if (confirm('Clear entire shopping list?')) {
      setItems([]);
    }
  };

  const printList = () => {
    window.print();
  };

  const groupedItems = items.reduce((acc, item) => {
    const recipe = item.recipe_title || 'Other';
    if (!acc[recipe]) {
      acc[recipe] = [];
    }
    acc[recipe].push(item);
    return acc;
  }, {} as Record<string, ShoppingListItem[]>);

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Shopping List</h1>
            <p className="text-gray-600">
              {items.length} item{items.length !== 1 ? 's' : ''} ({items.filter(i => i.checked).length} checked)
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={printList}
            >
              <Printer size={16} className="mr-2" />
              Print
            </Button>
            <Button
              size="sm"
              onClick={() => setShowAddRecipes(true)}
            >
              <Plus size={16} className="mr-2" />
              Add Recipes
            </Button>
          </div>
        </div>

        {showAddRecipes && (
          <Card className="mb-6">
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Add Recipes to Shopping List
                </h2>
                <button
                  onClick={() => setShowAddRecipes(false)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
              </div>

              {recipes.length === 0 ? (
                <p className="text-gray-600 text-center py-4">
                  Star some recipes to add them to your shopping list
                </p>
              ) : (
                <>
                  <div className="space-y-2 mb-4">
                    {recipes.map(recipe => (
                      <label
                        key={recipe.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedRecipes.includes(recipe.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRecipes([...selectedRecipes, recipe.id]);
                            } else {
                              setSelectedRecipes(selectedRecipes.filter(id => id !== recipe.id));
                            }
                          }}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="flex-1 text-gray-900 font-medium">
                          {recipe.title}
                        </span>
                        <span className="text-sm text-gray-600">
                          {recipe.ingredients?.length || 0} ingredients
                        </span>
                      </label>
                    ))}
                  </div>

                  <Button
                    onClick={addRecipesToList}
                    disabled={selectedRecipes.length === 0}
                    className="w-full"
                  >
                    Add {selectedRecipes.length} Recipe{selectedRecipes.length !== 1 ? 's' : ''}
                  </Button>
                </>
              )}
            </CardBody>
          </Card>
        )}

        {items.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <ShoppingCart size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">Your shopping list is empty</p>
            <Button onClick={() => setShowAddRecipes(true)}>
              <Plus size={16} className="mr-2" />
              Add Recipes
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex gap-2">
              {items.filter(i => i.checked).length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearChecked}>
                  <Check size={16} className="mr-2" />
                  Clear Checked
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={clearAll}>
                <Trash2 size={16} className="mr-2" />
                Clear All
              </Button>
            </div>

            <div className="space-y-6">
              {Object.entries(groupedItems).map(([recipeTitle, recipeItems]) => (
                <Card key={recipeTitle}>
                  <CardBody>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {recipeTitle}
                    </h3>
                    <div className="space-y-2">
                      {recipeItems.map(item => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => toggleItem(item.id)}
                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span
                            className={`flex-1 ${
                              item.checked ? 'line-through text-gray-400' : 'text-gray-900'
                            }`}
                          >
                            <span className="font-medium">{item.quantity}</span> {item.item}
                          </span>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`
        @media print {
          header, button, .no-print {
            display: none !important;
          }
        }
      `}</style>
    </Layout>
  );
}
