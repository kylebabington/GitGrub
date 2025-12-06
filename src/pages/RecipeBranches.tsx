import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { GitBranch, Plus, GitMerge, Archive, Eye, Edit, Trash2, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Branch {
  id: string;
  branch_name: string;
  description: string;
  is_default: boolean;
  status: string;
  created_at: string;
  branch_data: any;
  created_by: string;
}

export function RecipeBranches({ recipeId }: { recipeId: string }) {
  const { user } = useAuth();
  const [recipe, setRecipe] = useState<any>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [compareBranch, setCompareBranch] = useState<Branch | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newBranch, setNewBranch] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    loadData();
  }, [recipeId]);

  const loadData = async () => {
    const { data: recipeData } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', recipeId)
      .maybeSingle();

    setRecipe(recipeData);

    const { data: branchData } = await supabase
      .from('recipe_branches')
      .select('*')
      .eq('recipe_id', recipeId)
      .eq('status', 'active')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    setBranches(branchData || []);

    const defaultBranch = branchData?.find(b => b.is_default);
    if (defaultBranch) {
      setSelectedBranch(defaultBranch);
    }

    setLoading(false);
  };

  const createBranch = async () => {
    if (!user || !recipe || !newBranch.name) return;

    const isFirstBranch = branches.length === 0;

    const { error } = await supabase
      .from('recipe_branches')
      .insert({
        recipe_id: recipeId,
        branch_name: newBranch.name,
        description: newBranch.description,
        is_default: isFirstBranch,
        branch_data: {
          title: recipe.title,
          ingredients: recipe.ingredients,
          steps: recipe.steps,
          cooking_time: recipe.cooking_time,
          prep_time: recipe.prep_time,
          skill_level: recipe.skill_level,
          yield_amount: recipe.yield_amount,
          notes: recipe.notes,
        },
        created_by: user.id,
        status: 'active',
      });

    if (!error) {
      setShowCreateModal(false);
      setNewBranch({ name: '', description: '' });
      loadData();
    } else {
      alert('Failed to create branch');
    }
  };

  const deleteBranch = async (branchId: string) => {
    if (!confirm('Delete this branch? This cannot be undone.')) return;

    const { error } = await supabase
      .from('recipe_branches')
      .delete()
      .eq('id', branchId);

    if (!error) {
      loadData();
    }
  };

  const archiveBranch = async (branchId: string) => {
    const { error } = await supabase
      .from('recipe_branches')
      .update({ status: 'archived' })
      .eq('id', branchId);

    if (!error) {
      loadData();
    }
  };

  const mergeBranch = async (branch: Branch) => {
    if (!confirm(`Merge "${branch.branch_name}" into main recipe? This will update the recipe.`)) {
      return;
    }

    const { error } = await supabase
      .from('recipes')
      .update({
        ...branch.branch_data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recipeId);

    if (!error) {
      await supabase
        .from('recipe_branches')
        .update({ status: 'merged' })
        .eq('id', branch.id);

      alert('Branch merged successfully!');
      loadData();
    } else {
      alert('Failed to merge branch');
    }
  };

  const setAsDefault = async (branchId: string) => {
    await supabase
      .from('recipe_branches')
      .update({ is_default: false })
      .eq('recipe_id', recipeId);

    await supabase
      .from('recipe_branches')
      .update({ is_default: true })
      .eq('id', branchId);

    loadData();
  };

  const isOwner = user && recipe && user.id === recipe.created_by;

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <p className="text-gray-600">Loading branches...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Link to={`/recipe/${recipeId}`} className="hover:text-emerald-600">
              {recipe?.title}
            </Link>
            <span>/</span>
            <span>Branches</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Recipe Branches</h1>
              <p className="text-gray-600 mt-2">
                Create and manage recipe variations and experiments
              </p>
            </div>
            {isOwner && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus size={20} className="mr-2" />
                New Branch
              </Button>
            )}
          </div>
        </div>

        {branches.length === 0 ? (
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <GitBranch size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No branches yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Create branches to experiment with recipe variations without affecting the main recipe
                </p>
                {isOwner && (
                  <Button onClick={() => setShowCreateModal(true)}>
                    Create First Branch
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="space-y-3">
                {branches.map((branch) => (
                  <Card
                    key={branch.id}
                    className={`cursor-pointer transition-all ${
                      selectedBranch?.id === branch.id
                        ? 'ring-2 ring-emerald-500'
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedBranch(branch)}
                  >
                    <CardBody>
                      <div className="flex items-start gap-3">
                        <GitBranch size={20} className="text-emerald-600 flex-shrink-0 mt-1" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {branch.branch_name}
                            </h3>
                            {branch.is_default && (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">
                                Default
                              </span>
                            )}
                          </div>
                          {branch.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {branch.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            Created {new Date(branch.created_at).toLocaleDateString()}
                          </p>

                          {isOwner && (
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCompareBranch(branch);
                                }}
                              >
                                <Eye size={14} className="mr-1" />
                                Compare
                              </Button>
                              {!branch.is_default && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      mergeBranch(branch);
                                    }}
                                  >
                                    <GitMerge size={14} className="mr-1" />
                                    Merge
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteBranch(branch.id);
                                    }}
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              {!selectedBranch ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <GitBranch size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Select a branch to view details</p>
                </div>
              ) : (
                <Card>
                  <CardBody>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          {selectedBranch.branch_name}
                        </h2>
                        {selectedBranch.description && (
                          <p className="text-gray-600">{selectedBranch.description}</p>
                        )}
                      </div>
                      {isOwner && !selectedBranch.is_default && (
                        <Button
                          size="sm"
                          onClick={() => setAsDefault(selectedBranch.id)}
                        >
                          <Check size={16} className="mr-1" />
                          Set as Default
                        </Button>
                      )}
                    </div>

                    {compareBranch && compareBranch.id !== selectedBranch.id && (
                      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-blue-900 mb-1">
                              Comparing with: {compareBranch.branch_name}
                            </h3>
                            <p className="text-sm text-blue-800">
                              Differences are highlighted below
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setCompareBranch(null)}
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          Ingredients
                        </h3>
                        <div className="space-y-2">
                          {(selectedBranch.branch_data.ingredients || []).map((ing: any, i: number) => {
                            const isChanged = compareBranch &&
                              JSON.stringify(compareBranch.branch_data.ingredients?.[i]) !==
                              JSON.stringify(ing);

                            return (
                              <div
                                key={i}
                                className={`p-2 rounded ${
                                  isChanged ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
                                }`}
                              >
                                <span className="font-medium">{ing.quantity}</span> {ing.item}
                                {ing.notes && (
                                  <span className="text-sm text-gray-600"> - {ing.notes}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          Instructions
                        </h3>
                        <div className="space-y-3">
                          {(selectedBranch.branch_data.steps || []).map((step: any, i: number) => {
                            const isChanged = compareBranch &&
                              compareBranch.branch_data.steps?.[i]?.instruction !== step.instruction;

                            return (
                              <div
                                key={i}
                                className={`p-3 rounded ${
                                  isChanged ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
                                }`}
                              >
                                <div className="flex gap-3">
                                  <span className="font-semibold text-gray-700 flex-shrink-0">
                                    {i + 1}.
                                  </span>
                                  <p className="text-gray-900">{step.instruction}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                        <div>
                          <p className="text-sm text-gray-600">Cooking Time</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {selectedBranch.branch_data.cooking_time} min
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Prep Time</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {selectedBranch.branch_data.prep_time} min
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>
          </div>
        )}

        {showCreateModal && (
          <Modal onClose={() => setShowCreateModal(false)}>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Branch</h2>
            <p className="text-gray-600 mb-6">
              Create a new branch to experiment with recipe variations
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch Name
                </label>
                <Input
                  value={newBranch.name}
                  onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                  placeholder="e.g., vegan-version, low-carb, spicy-variant"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use lowercase with hyphens (no spaces)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newBranch.description}
                  onChange={(e) => setNewBranch({ ...newBranch, description: e.target.value })}
                  placeholder="What makes this branch different?"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={createBranch} disabled={!newBranch.name}>
                  Create Branch
                </Button>
                <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  );
}
