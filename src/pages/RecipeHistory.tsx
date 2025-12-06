import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { RecipeDiff } from '../components/RecipeDiff';
import { GitCommit, GitBranch, User, Clock, Eye, RotateCcw, GitCompare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Version {
  id: string;
  version_number: number;
  recipe_data: any;
  author: any;
  created_at: string;
  commit_message?: string;
}

export function RecipeHistory({ recipeId }: { recipeId: string }) {
  const { user } = useAuth();
  const [recipe, setRecipe] = useState<any>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [compareVersion, setCompareVersion] = useState<Version | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [recipeId]);

  const loadHistory = async () => {
    const { data: recipeData } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', recipeId)
      .maybeSingle();

    setRecipe(recipeData);

    const { data: versionsData } = await supabase
      .from('recipe_versions')
      .select('*, author:user_profiles!recipe_versions_author_id_fkey(*), commits!commits_version_id_fkey(*)')
      .eq('recipe_id', recipeId)
      .order('version_number', { ascending: false });

    const formattedVersions = (versionsData || []).map((v: any) => ({
      id: v.id,
      version_number: v.version_number,
      recipe_data: v.recipe_data,
      author: v.author,
      created_at: v.created_at,
      commit_message: v.commits?.[0]?.message,
    }));

    setVersions(formattedVersions);
    setLoading(false);
  };

  const revertToVersion = async (version: Version) => {
    if (!user || !recipe || user.id !== recipe.created_by) {
      alert('Only the recipe owner can revert versions');
      return;
    }

    if (!confirm(`Revert to version ${version.version_number}? This will create a new version.`)) {
      return;
    }

    const newVersionNumber = (recipe.current_version || 0) + 1;

    const { error: versionError } = await supabase
      .from('recipe_versions')
      .insert({
        recipe_id: recipeId,
        version_number: newVersionNumber,
        recipe_data: version.recipe_data,
        author_id: user.id,
      });

    if (versionError) {
      alert('Failed to create version');
      return;
    }

    const { error: recipeError } = await supabase
      .from('recipes')
      .update({
        ...version.recipe_data,
        current_version: newVersionNumber,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recipeId);

    if (recipeError) {
      alert('Failed to update recipe');
      return;
    }

    alert('Recipe reverted successfully!');
    window.location.reload();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <p className="text-gray-600">Loading history...</p>
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
            <span>History</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Version History</h1>
          <p className="text-gray-600 mt-2">
            {versions.length} version{versions.length !== 1 ? 's' : ''} • Track changes and revert to any point
          </p>
        </div>

        {compareVersion && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch className="text-blue-600" size={20} />
              <span className="text-blue-900 font-medium">
                Comparing version {compareVersion.version_number}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCompareVersion(null)}
            >
              Clear
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="space-y-3">
              {versions.map((version, index) => (
                <Card
                  key={version.id}
                  className={`cursor-pointer transition-all ${
                    selectedVersion?.id === version.id
                      ? 'ring-2 ring-emerald-500'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedVersion(version)}
                >
                  <CardBody>
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <GitCommit size={20} className="text-emerald-600" />
                        </div>
                        {index < versions.length - 1 && (
                          <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-gray-300" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">
                            v{version.version_number}
                          </span>
                          {version.version_number === recipe?.current_version && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">
                              Current
                            </span>
                          )}
                        </div>

                        {version.commit_message && (
                          <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                            {version.commit_message}
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <User size={12} />
                            <span>{version.author?.username}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={12} />
                            <span>{formatDate(version.created_at)}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCompareVersion(version);
                            }}
                          >
                            <Eye size={14} className="mr-1" />
                            Compare
                          </Button>
                          {version.version_number !== recipe?.current_version && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                revertToVersion(version);
                              }}
                            >
                              <RotateCcw size={14} className="mr-1" />
                              Revert
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            {!selectedVersion ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                <GitCommit size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Select a version to view details</p>
              </div>
            ) : (
              <Card>
                <CardBody>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Version {selectedVersion.version_number}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User size={16} />
                        <Link
                          to={`/${selectedVersion.author?.username}`}
                          className="text-emerald-600 hover:underline"
                        >
                          {selectedVersion.author?.username}
                        </Link>
                      </div>
                      <span>•</span>
                      <span>{formatDate(selectedVersion.created_at)}</span>
                    </div>
                  </div>

                  {compareVersion && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-4">
                        <GitCompare size={20} className="text-blue-600" />
                        <h3 className="font-semibold text-gray-900">
                          Changes from v{compareVersion.version_number} to v{selectedVersion.version_number}
                        </h3>
                      </div>
                      <RecipeDiff oldVersion={compareVersion} newVersion={selectedVersion} />
                    </div>
                  )}

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Ingredients
                      </h3>
                      <div className="space-y-2">
                        {(selectedVersion.recipe_data.ingredients || []).map((ing: any, i: number) => {
                          const isChanged = compareVersion &&
                            JSON.stringify(compareVersion.recipe_data.ingredients?.[i]) !==
                            JSON.stringify(ing);

                          return (
                            <div
                              key={i}
                              className={`p-2 rounded ${
                                isChanged ? 'bg-yellow-50 border border-yellow-200' : ''
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
                        {(selectedVersion.recipe_data.steps || []).map((step: any, i: number) => {
                          const isChanged = compareVersion &&
                            compareVersion.recipe_data.steps?.[i]?.instruction !== step.instruction;

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

                    {selectedVersion.recipe_data.notes && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          Notes
                        </h3>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {selectedVersion.recipe_data.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
