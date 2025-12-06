import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Refrigerator, Plus, Trash2, AlertCircle, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FridgeItem {
  id: string;
  ingredient_name: string;
  quantity: number;
  unit: string;
  expiration_date: string | null;
  location: string;
  notes: string;
}

export function FridgeInventory() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<FridgeItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState({
    ingredient_name: '',
    quantity: 1,
    unit: '',
    expiration_date: '',
    location: 'fridge',
    notes: '',
  });

  useEffect(() => {
    if (user) {
      loadInventory();
    }
  }, [user]);

  useEffect(() => {
    if (searchQuery) {
      setFilteredItems(
        items.filter((item) =>
          item.ingredient_name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredItems(items);
    }
  }, [searchQuery, items]);

  const loadInventory = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('fridge_inventory')
      .select('*')
      .eq('user_id', user.id)
      .order('expiration_date', { ascending: true, nullsFirst: false });

    setItems(data || []);
    setLoading(false);
  };

  const addItem = async () => {
    if (!user || !newItem.ingredient_name) return;

    const { error } = await supabase.from('fridge_inventory').insert({
      user_id: user.id,
      ...newItem,
    });

    if (!error) {
      setShowAddModal(false);
      setNewItem({
        ingredient_name: '',
        quantity: 1,
        unit: '',
        expiration_date: '',
        location: 'fridge',
        notes: '',
      });
      loadInventory();
    }
  };

  const deleteItem = async (id: string) => {
    await supabase.from('fridge_inventory').delete().eq('id', id);
    loadInventory();
  };

  const getDaysUntilExpiration = (date: string | null): number | null => {
    if (!date) return null;
    const exp = new Date(date);
    const now = new Date();
    const diff = exp.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getExpirationColor = (days: number | null) => {
    if (days === null) return 'bg-gray-100 text-gray-700';
    if (days < 0) return 'bg-red-100 text-red-700';
    if (days <= 3) return 'bg-orange-100 text-orange-700';
    if (days <= 7) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  const groupedItems = {
    fridge: filteredItems.filter((i) => i.location === 'fridge'),
    freezer: filteredItems.filter((i) => i.location === 'freezer'),
    pantry: filteredItems.filter((i) => i.location === 'pantry'),
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

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Fridge Inventory</h1>
            <p className="text-gray-600">Track what you have and when it expires</p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={20} className="mr-2" />
            Add Item
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Search ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Object.entries(groupedItems).map(([location, locationItems]) => (
            <Card key={location}>
              <CardBody>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 capitalize flex items-center gap-2">
                  <Refrigerator size={20} className="text-emerald-600" />
                  {location}
                  <span className="text-sm font-normal text-gray-500">
                    ({locationItems.length})
                  </span>
                </h2>

                {locationItems.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No items</p>
                ) : (
                  <div className="space-y-3">
                    {locationItems.map((item) => {
                      const daysLeft = getDaysUntilExpiration(item.expiration_date);
                      return (
                        <div
                          key={item.id}
                          className="p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {item.ingredient_name}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                {item.quantity} {item.unit}
                              </div>
                              {item.notes && (
                                <div className="text-xs text-gray-500 mt-1">{item.notes}</div>
                              )}
                            </div>
                            <button
                              onClick={() => deleteItem(item.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          {item.expiration_date && (
                            <div className="mt-2">
                              <span
                                className={`text-xs px-2 py-1 rounded ${getExpirationColor(
                                  daysLeft
                                )}`}
                              >
                                {daysLeft !== null && daysLeft < 0 ? (
                                  <>
                                    <AlertCircle size={12} className="inline mr-1" />
                                    Expired {Math.abs(daysLeft)}d ago
                                  </>
                                ) : daysLeft !== null && daysLeft === 0 ? (
                                  <>Expires today</>
                                ) : (
                                  <>Expires in {daysLeft}d</>
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>

        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Ingredient">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ingredient Name *
              </label>
              <Input
                type="text"
                value={newItem.ingredient_name}
                onChange={(e) => setNewItem({ ...newItem, ingredient_name: e.target.value })}
                placeholder="e.g., Chicken Breast"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <Input
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) })}
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <Input
                  type="text"
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  placeholder="lbs, cups, etc."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <select
                value={newItem.location}
                onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="fridge">Fridge</option>
                <option value="freezer">Freezer</option>
                <option value="pantry">Pantry</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiration Date
              </label>
              <Input
                type="date"
                value={newItem.expiration_date}
                onChange={(e) => setNewItem({ ...newItem, expiration_date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={newItem.notes}
                onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                rows={2}
                placeholder="Optional notes..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={addItem} variant="primary" className="flex-1">
                Add to Inventory
              </Button>
              <Button onClick={() => setShowAddModal(false)} variant="ghost" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}
