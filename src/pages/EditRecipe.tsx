import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { Input } from '../components/Input';
import { Plus, Trash2, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ImageUpload } from '../components/ImageUpload';
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

export function EditRecipe({ recipeId }: { recipeId: string }) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    prep_time: 0,
    cooking_time: 0,
    skill_level: 'beginner',
    yield_amount: '',
    notes: '',
  });

  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { item: '', quantity: '', notes: '' },
  ]);

  const [steps, setSteps] = useState<Step[]>([{ instruction: '' }]);
  const [images, setImages] = useState<any[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<SelectedEquipment[]>([]);

  useEffect(() => {
    if (user) {
      loadRecipe();
    }
  }, [user, recipeId]);

  const loadRecipe = async () => {
    const { data: recipe } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', recipeId)
      .maybeSingle();


    if (recipe.created_by !== user?.id) {
      alert('You can only edit your own recipes');
      navigate(`/recipe/${recipeId}`);
      return;
    }

    setFormData({
      title: recipe.title,
      description: recipe.description || '',
      prep_time: recipe.prep_time || 0,
      cooking_time: recipe.cooking_time || 0,
      skill_level: recipe.skill_level || 'beginner',
      yield_amount: recipe.yield_amount || '',
      notes: recipe.notes || '',
    });

    setIngredients(recipe.ingredients && recipe.ingredients.length > 0
      ? recipe.ingredients
      : [{ item: '', quantity: '', notes: '' }]
    );

    setSteps(recipe.steps && recipe.steps.length > 0
      ? recipe.steps
      : [{ instruction: '' }]
    );

    loadImages();
    loadEquipment();
    setLoading(false);
  };

  const loadImages = async () => {
    const { data } = await supabase
      .from('recipe_images')
      .select('*')
      .eq('recipe_id', recipeId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    setImages(data || []);
  };

  const loadEquipment = async () => {
    const { data } = await supabase
      .from('recipe_equipment')
      .select('*, equipment:kitchen_equipment(*)')
      .eq('recipe_id', recipeId);

    if (data) {
      setSelectedEquipment(
        data.map(item => ({
          equipment_id: item.equipment_id,
          equipment: item.equipment,
          is_required: item.is_required,
          notes: item.notes || '',
        }))
      );
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { item: '', quantity: '', notes: '' }]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
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
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const updateStep = (index: number, value: string) => {
    const updated = [...steps];
    updated[index].instruction = value;
    setSteps(updated);
  };

  const saveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const validIngredients = ingredients.filter(
      (ing) => ing.item.trim() !== ''
    );

    const validSteps = steps.filter((step) => step.instruction.trim() !== '');

    if (validIngredients.length === 0) {
      alert('Please add at least one ingredient');
      setSaving(false);
      return;
    }

    if (validSteps.length === 0) {
      alert('Please add at least one step');
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from('recipes')
      .update({
        title: formData.title,
        description: formData.description,
        prep_time: formData.prep_time,
        cooking_time: formData.cooking_time,
        skill_level: formData.skill_level,
        yield_amount: formData.yield_amount,
        notes: formData.notes,
        ingredients: validIngredients,
        steps: validSteps,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recipeId);

    if (!error) {
      await supabase.from('recipe_equipment').delete().eq('recipe_id', recipeId);

      if (selectedEquipment.length > 0) {
        const equipmentData = selectedEquipment.map(eq => ({
          recipe_id: recipeId,
          equipment_id: eq.equipment_id,
          is_required: eq.is_required,
          notes: eq.notes,
        }));

        await supabase.from('recipe_equipment').insert(equipmentData);
      }

      await supabase.from('commits').insert({
        recipe_id: recipeId,
        author_id: user?.id,
        message: 'Updated recipe',
        diff_data: { type: 'edit', timestamp: new Date().toISOString() },
      });

      alert('Recipe updated successfully!');
      navigate(`/recipe/${recipeId}`);
    } else {
      alert('Failed to update recipe');
      setSaving(false);
    }
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

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Recipe</h1>
          <p className="text-gray-600">Update your recipe details</p>
        </div>

        <form onSubmit={saveRecipe}>
          <Card className="mb-6">
            <CardBody>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipe Title
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g., Grandma's Famous Chocolate Chip Cookies"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="A brief description of your recipe..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prep Time (minutes)
                    </label>
                    <Input
                      type="number"
                      value={formData.prep_time}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          prep_time: parseInt(e.target.value) || 0,
                        })
                      }
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cooking Time (minutes)
                    </label>
                    <Input
                      type="number"
                      value={formData.cooking_time}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cooking_time: parseInt(e.target.value) || 0,
                        })
                      }
                      min="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Skill Level
                    </label>
                    <select
                      value={formData.skill_level}
                      onChange={(e) =>
                        setFormData({ ...formData, skill_level: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Yield
                    </label>
                    <Input
                      value={formData.yield_amount}
                      onChange={(e) =>
                        setFormData({ ...formData, yield_amount: e.target.value })
                      }
                      placeholder="e.g., 4 servings, 24 cookies"
                    />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="mb-6">
            <CardBody>
              <ImageUpload
                recipeId={recipeId}
                currentImages={images}
                onImagesUpdate={loadImages}
              />
            </CardBody>
          </Card>

          <Card className="mb-6">
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Ingredients</h2>
                <Button type="button" size="sm" onClick={addIngredient}>
                  <Plus size={16} className="mr-1" />
                  Add
                </Button>
              </div>

              <div className="space-y-3">
                {ingredients.map((ingredient, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Quantity"
                      value={ingredient.quantity}
                      onChange={(e) =>
                        updateIngredient(index, 'quantity', e.target.value)
                      }
                      className="w-32"
                    />
                    <Input
                      placeholder="Ingredient"
                      value={ingredient.item}
                      onChange={(e) =>
                        updateIngredient(index, 'item', e.target.value)
                      }
                      className="flex-1"
                    />
                    <Input
                      placeholder="Notes (optional)"
                      value={ingredient.notes}
                      onChange={(e) =>
                        updateIngredient(index, 'notes', e.target.value)
                      }
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeIngredient(index)}
                      disabled={ingredients.length === 1}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card className="mb-6">
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Instructions</h2>
                <Button type="button" size="sm" onClick={addStep}>
                  <Plus size={16} className="mr-1" />
                  Add
                </Button>
              </div>

              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                      {index + 1}
                    </div>
                    <textarea
                      value={step.instruction}
                      onChange={(e) => updateStep(index, e.target.value)}
                      placeholder="Describe this step..."
                      rows={2}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStep(index)}
                      disabled={steps.length === 1}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card className="mb-6">
            <CardBody>
              <EquipmentSelector
                selectedEquipment={selectedEquipment}
                onChange={setSelectedEquipment}
              />
            </CardBody>
          </Card>

          <Card className="mb-6">
            <CardBody>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Additional Notes
              </h2>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Any tips, substitutions, or additional notes..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </CardBody>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>
              <Save size={16} className="mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(`/recipe/${recipeId}`)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
