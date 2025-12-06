import { useState, FormEvent } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { EquipmentSelector } from '../components/EquipmentSelector';

interface Ingredient {
  item: string;
  quantity: string;
  notes: string;
}

interface Step {
  instruction: string;
}

interface SelectedEquipment {
  equipment_id: string;
  equipment?: any;
  is_required: boolean;
  notes: string;
}

export function NewRecipe({ repoId }: { repoId: string }) {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ item: '', quantity: '', notes: '' }]);
  const [steps, setSteps] = useState<Step[]>([{ instruction: '' }]);
  const [tags, setTags] = useState('');
  const [cookingTime, setCookingTime] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [skillLevel, setSkillLevel] = useState('beginner');
  const [yieldAmount, setYieldAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<SelectedEquipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const addIngredient = () => {
    setIngredients([...ingredients, { item: '', quantity: '', notes: '' }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    setIngredients(updated);
  };

  const addStep = () => {
    setSteps([...steps, { instruction: '' }]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, value: string) => {
    const updated = [...steps];
    updated[index].instruction = value;
    setSteps(updated);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { count: recipeCount } = await supabase
      .from('recipes')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', user.id);

    if (!profile?.is_pro && recipeCount && recipeCount >= 10) {
      setError('Free accounts are limited to 10 recipes. Upgrade to Pro for unlimited recipes.');
      setLoading(false);
      return;
    }

    const validIngredients = ingredients.filter(i => i.item.trim());
    const validSteps = steps.filter(s => s.instruction.trim());

    if (validIngredients.length === 0) {
      setError('Please add at least one ingredient');
      setLoading(false);
      return;
    }

    if (validSteps.length === 0) {
      setError('Please add at least one step');
      setLoading(false);
      return;
    }

    try {
      const recipeData = {
        title,
        ingredients: validIngredients,
        steps: validSteps,
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        cooking_time: cookingTime ? parseInt(cookingTime) : null,
        prep_time: prepTime ? parseInt(prepTime) : null,
        skill_level: skillLevel,
        yield_amount: yieldAmount || null,
        notes: notes || null,
      };

      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          repo_id: repoId,
          created_by: user.id,
          ...recipeData,
        })
        .select()
        .single();

      if (recipeError) throw recipeError;

      await supabase
        .from('recipe_versions')
        .insert({
          recipe_id: recipe.id,
          version_number: 1,
          recipe_data: recipeData,
          author_id: user.id,
        });

      await supabase
        .from('commits')
        .insert({
          recipe_id: recipe.id,
          version_id: recipe.id,
          author_id: user.id,
          message: 'Initial commit',
        });

      const { error: rpcError } = await supabase.rpc('increment', {
        row_id: repoId,
        table_name: 'repos',
        column_name: 'recipe_count'
      });

      if (selectedEquipment.length > 0) {
        const equipmentData = selectedEquipment.map(eq => ({
          recipe_id: recipe.id,
          equipment_id: eq.equipment_id,
          is_required: eq.is_required,
          notes: eq.notes,
        }));

        await supabase.from('recipe_equipment').insert(equipmentData);
      }

      navigate(`/recipe/${recipe.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create recipe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Recipe</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <Input
            label="Recipe Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Grandma's Famous Chocolate Chip Cookies"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Ingredients
            </label>
            {ingredients.map((ingredient, index) => (
              <div key={index} className="flex gap-3 mb-3">
                <input
                  type="text"
                  value={ingredient.item}
                  onChange={(e) => updateIngredient(index, 'item', e.target.value)}
                  placeholder="Ingredient"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="text"
                  value={ingredient.quantity}
                  onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                  placeholder="Amount"
                  className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="text"
                  value={ingredient.notes}
                  onChange={(e) => updateIngredient(index, 'notes', e.target.value)}
                  placeholder="Notes"
                  className="w-40 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={addIngredient}>
              <Plus size={16} className="inline mr-1" />
              Add Ingredient
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Instructions
            </label>
            {steps.map((step, index) => (
              <div key={index} className="flex gap-3 mb-3">
                <span className="flex-shrink-0 w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-semibold text-sm">
                  {index + 1}
                </span>
                <textarea
                  value={step.instruction}
                  onChange={(e) => updateStep(index, e.target.value)}
                  placeholder="Describe this step..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={2}
                />
                {steps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={addStep}>
              <Plus size={16} className="inline mr-1" />
              Add Step
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Prep Time (minutes)"
              type="number"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              placeholder="15"
            />

            <Input
              label="Cooking Time (minutes)"
              type="number"
              value={cookingTime}
              onChange={(e) => setCookingTime(e.target.value)}
              placeholder="30"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Skill Level
              </label>
              <select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <Input
              label="Yield"
              value={yieldAmount}
              onChange={(e) => setYieldAmount(e.target.value)}
              placeholder="6 servings"
            />
          </div>

          <Input
            label="Tags (comma-separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="dessert, cookies, chocolate"
          />

          <EquipmentSelector
            selectedEquipment={selectedEquipment}
            onChange={setSelectedEquipment}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chef's Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any tips, tricks, or stories about this recipe..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows={4}
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Recipe'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
