import { useState, useEffect } from 'react';
import { Info, ThumbsUp, ThumbsDown, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Substitution {
  id: string;
  substitute_ingredient: string;
  substitute_quantity_ratio: number;
  category: string;
  dietary_tags: string[];
  confidence_score: number;
  notes: string;
  use_count: number;
}

interface IngredientSubstitutionProps {
  ingredient: string;
  quantity: string;
  onSubstitute?: (newIngredient: string, newQuantity: string) => void;
}

export function IngredientSubstitution({
  ingredient,
  quantity,
  onSubstitute,
}: IngredientSubstitutionProps) {
  const { user } = useAuth();
  const [showTooltip, setShowTooltip] = useState(false);
  const [substitutions, setSubstitutions] = useState<Substitution[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  useEffect(() => {
    if (showTooltip) {
      loadSubstitutions();
    }
  }, [showTooltip, ingredient]);

  const loadSubstitutions = async () => {
    setLoading(true);

    const ingredientName = ingredient.toLowerCase().trim();

    const { data } = await supabase
      .from('ingredient_substitutions')
      .select('*')
      .ilike('original_ingredient', `%${ingredientName}%`)
      .order('confidence_score', { ascending: false })
      .limit(10);

    setSubstitutions(data || []);
    setLoading(false);
  };

  const handleSubstitute = (sub: Substitution) => {
    if (onSubstitute) {
      const originalQty = parseFloat(quantity) || 1;
      const newQty = originalQty * sub.substitute_quantity_ratio;
      const quantityUnit = quantity.replace(/[\d.]/g, '').trim();
      const newQuantity = `${newQty}${quantityUnit ? ' ' + quantityUnit : ''}`;

      onSubstitute(sub.substitute_ingredient, newQuantity);
      setShowTooltip(false);

      supabase
        .from('ingredient_substitutions')
        .update({ use_count: sub.use_count + 1 })
        .eq('id', sub.id)
        .then();
    }
  };

  const voteOnSubstitution = async (substitutionId: string, vote: number) => {
    if (!user) return;

    await supabase
      .from('substitution_votes')
      .upsert({
        substitution_id: substitutionId,
        user_id: user.id,
        vote,
      });

    loadSubstitutions();
  };

  const filteredSubs = selectedFilter === 'all'
    ? substitutions
    : substitutions.filter(s => s.dietary_tags.includes(selectedFilter));

  const availableTags = Array.from(
    new Set(substitutions.flatMap(s => s.dietary_tags))
  );

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowTooltip(!showTooltip)}
        className="ml-1 text-emerald-600 hover:text-emerald-700 transition-colors"
        title="View substitutions"
      >
        <Info size={14} className="inline" />
      </button>

      {showTooltip && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowTooltip(false)}
          />

          <div className="absolute left-0 top-6 z-50 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 max-h-[500px] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">
                Substitutions for {ingredient}
              </h3>
              <button
                onClick={() => setShowTooltip(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            {availableTags.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedFilter('all')}
                  className={`px-2 py-1 text-xs rounded-full transition-colors ${
                    selectedFilter === 'all'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedFilter(tag)}
                    className={`px-2 py-1 text-xs rounded-full transition-colors ${
                      selectedFilter === tag
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="py-8 text-center text-gray-600">
                Loading substitutions...
              </div>
            ) : filteredSubs.length === 0 ? (
              <div className="py-8 text-center text-gray-600">
                <p className="mb-2">No substitutions found</p>
                <p className="text-sm">Try checking a different dietary filter</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSubs.map(sub => (
                  <div
                    key={sub.id}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">
                            {sub.substitute_ingredient}
                          </span>
                          {sub.substitute_quantity_ratio !== 1 && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              {sub.substitute_quantity_ratio}x ratio
                            </span>
                          )}
                        </div>

                        {sub.dietary_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {sub.dietary_tags.map(tag => (
                              <span
                                key={tag}
                                className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {sub.notes && (
                          <p className="text-sm text-gray-600 mb-2">{sub.notes}</p>
                        )}

                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <span
                              className={`inline-block w-2 h-2 rounded-full ${
                                sub.confidence_score >= 80
                                  ? 'bg-green-500'
                                  : sub.confidence_score >= 60
                                  ? 'bg-yellow-500'
                                  : 'bg-orange-500'
                              }`}
                            />
                            {sub.confidence_score}% confidence
                          </span>
                          {sub.use_count > 0 && (
                            <span>{sub.use_count} times used</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 ml-2">
                        <button
                          onClick={() => voteOnSubstitution(sub.id, 1)}
                          className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                          title="Helpful"
                        >
                          <ThumbsUp size={14} />
                        </button>
                        <button
                          onClick={() => voteOnSubstitution(sub.id, -1)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Not helpful"
                        >
                          <ThumbsDown size={14} />
                        </button>
                      </div>
                    </div>

                    {onSubstitute && (
                      <button
                        onClick={() => handleSubstitute(sub)}
                        className="w-full py-1.5 px-3 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 transition-colors"
                      >
                        Use this substitution
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
              <p>
                Substitutions are community-sourced. Results may vary based on your recipe.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
