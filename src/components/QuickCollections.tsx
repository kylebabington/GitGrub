import { useState, useEffect } from 'react';
import { Bookmark, Plus, X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from './Modal';

interface Collection {
  id: string;
  name: string;
  color: string;
  recipe_count: number;
  is_in_collection?: boolean;
}

interface QuickCollectionsProps {
  recipeId: string;
}

export function QuickCollections({ recipeId }: QuickCollectionsProps) {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);

  const defaultCollections = [
    { name: 'Weeknight Dinners', color: '#10b981', icon: 'Calendar' },
    { name: 'Date Night', color: '#ef4444', icon: 'Heart' },
    { name: 'Kids Love', color: '#f59e0b', icon: 'Smile' },
    { name: 'Meal Prep', color: '#3b82f6', icon: 'Package' },
    { name: 'Quick & Easy', color: '#8b5cf6', icon: 'Zap' },
  ];

  useEffect(() => {
    if (showModal && user) {
      loadCollections();
    }
  }, [showModal, user]);

  const loadCollections = async () => {
    if (!user) return;

    setLoading(true);

    const { data: userCollections } = await supabase
      .from('recipe_collections')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const { data: recipeCollections } = await supabase
      .from('collection_recipes')
      .select('collection_id')
      .eq('recipe_id', recipeId);

    const inCollectionIds = new Set(recipeCollections?.map(rc => rc.collection_id) || []);

    const collectionsWithStatus = (userCollections || []).map(col => ({
      ...col,
      is_in_collection: inCollectionIds.has(col.id),
    }));

    setCollections(collectionsWithStatus);
    setLoading(false);
  };

  const createDefaultCollections = async () => {
    if (!user) return;

    const existingNames = new Set(collections.map(c => c.name));
    const toCreate = defaultCollections.filter(dc => !existingNames.has(dc.name));

    if (toCreate.length === 0) return;

    await supabase
      .from('recipe_collections')
      .insert(
        toCreate.map(dc => ({
          user_id: user.id,
          name: dc.name,
          color: dc.color,
          icon: dc.icon,
          is_default: true,
        }))
      );

    await loadCollections();
  };

  const createCollection = async () => {
    if (!user || !newCollectionName.trim()) return;

    const { data } = await supabase
      .from('recipe_collections')
      .insert({
        user_id: user.id,
        name: newCollectionName.trim(),
        color: '#10b981',
      })
      .select()
      .single();

    if (data) {
      await toggleCollection(data.id, false);
    }

    setNewCollectionName('');
    setShowNewForm(false);
    await loadCollections();
  };

  const toggleCollection = async (collectionId: string, isCurrentlyIn: boolean) => {
    if (!user) return;

    if (isCurrentlyIn) {
      await supabase
        .from('collection_recipes')
        .delete()
        .eq('collection_id', collectionId)
        .eq('recipe_id', recipeId);
    } else {
      await supabase
        .from('collection_recipes')
        .insert({
          collection_id: collectionId,
          recipe_id: recipeId,
          added_by: user.id,
        });
    }

    await loadCollections();
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200 transition-all hover:scale-105 font-medium"
        title="Save to collection"
      >
        <Bookmark size={16} />
        Save
      </button>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Save to Collection"
        size="md"
      >
        <div className="space-y-4">
          {loading ? (
            <div className="py-8 text-center text-gray-600">
              Loading collections...
            </div>
          ) : (
            <>
              {collections.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No collections yet!</p>
                  <button
                    onClick={createDefaultCollections}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                  >
                    Create Starter Collections
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
                  {collections.map(collection => (
                    <button
                      key={collection.id}
                      onClick={() =>
                        toggleCollection(collection.id, collection.is_in_collection || false)
                      }
                      className={`p-4 rounded-lg border-2 transition-all text-left hover:scale-105 ${
                        collection.is_in_collection
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: collection.color }}
                        />
                        {collection.is_in_collection && (
                          <Check size={16} className="text-emerald-600" />
                        )}
                      </div>
                      <p className="font-semibold text-gray-900 mb-1">{collection.name}</p>
                      <p className="text-xs text-gray-500">
                        {collection.recipe_count} recipe{collection.recipe_count !== 1 ? 's' : ''}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                {showNewForm ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && createCollection()}
                      placeholder="Collection name..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      autoFocus
                    />
                    <button
                      onClick={createCollection}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setShowNewForm(false);
                        setNewCollectionName('');
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewForm(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-emerald-500 hover:text-emerald-600 transition-colors"
                  >
                    <Plus size={16} />
                    New Collection
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
