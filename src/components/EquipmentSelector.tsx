import { useState, useEffect } from 'react';
import { Search, Plus, X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from './Button';
import { Input } from './Input';

interface Equipment {
  id: string;
  name: string;
  category: string;
  description: string;
  is_common: boolean;
}

interface SelectedEquipment {
  equipment_id: string;
  equipment?: Equipment;
  is_required: boolean;
  notes: string;
}

interface EquipmentSelectorProps {
  selectedEquipment: SelectedEquipment[];
  onChange: (equipment: SelectedEquipment[]) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  appliances: 'Appliances',
  cookware: 'Cookware',
  bakeware: 'Bakeware',
  tools: 'Tools',
  utensils: 'Utensils',
};

export function EquipmentSelector({ selectedEquipment, onChange }: EquipmentSelectorProps) {
  const [allEquipment, setAllEquipment] = useState<Equipment[]>([]);
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEquipmentName, setNewEquipmentName] = useState('');
  const [newEquipmentCategory, setNewEquipmentCategory] = useState('tools');

  useEffect(() => {
    loadEquipment();
  }, []);

  useEffect(() => {
    filterEquipment();
  }, [searchQuery, selectedCategory, allEquipment]);

  const loadEquipment = async () => {
    const { data } = await supabase
      .from('kitchen_equipment')
      .select('*')
      .order('name');

    if (data) {
      setAllEquipment(data);
    }
  };

  const filterEquipment = () => {
    let filtered = allEquipment;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(e => e.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.name.toLowerCase().includes(query) ||
        e.description.toLowerCase().includes(query)
      );
    }

    setFilteredEquipment(filtered);
  };

  const toggleEquipment = (equipment: Equipment) => {
    const existing = selectedEquipment.find(e => e.equipment_id === equipment.id);

    if (existing) {
      onChange(selectedEquipment.filter(e => e.equipment_id !== equipment.id));
    } else {
      onChange([
        ...selectedEquipment,
        {
          equipment_id: equipment.id,
          equipment: equipment,
          is_required: true,
          notes: '',
        },
      ]);
    }
  };

  const updateEquipmentRequired = (equipmentId: string, isRequired: boolean) => {
    onChange(
      selectedEquipment.map(e =>
        e.equipment_id === equipmentId ? { ...e, is_required: isRequired } : e
      )
    );
  };

  const updateEquipmentNotes = (equipmentId: string, notes: string) => {
    onChange(
      selectedEquipment.map(e =>
        e.equipment_id === equipmentId ? { ...e, notes } : e
      )
    );
  };

  const addCustomEquipment = async () => {
    if (!newEquipmentName.trim()) return;

    const { data, error } = await supabase
      .from('kitchen_equipment')
      .insert({
        name: newEquipmentName.trim(),
        category: newEquipmentCategory,
        description: 'Custom equipment',
        is_common: false,
      })
      .select()
      .single();

    if (!error && data) {
      setAllEquipment([...allEquipment, data]);
      toggleEquipment(data);
      setNewEquipmentName('');
      setShowAddModal(false);
    }
  };

  const categories = Object.keys(CATEGORY_LABELS);
  const selectedIds = selectedEquipment.map(e => e.equipment_id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Kitchen Equipment</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={16} className="mr-1" />
          Add Custom
        </Button>
      </div>

      <p className="text-sm text-gray-600">
        Select the equipment needed for this recipe. Mark items as required or optional.
      </p>

      {selectedEquipment.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-emerald-900 mb-3">
            Selected Equipment ({selectedEquipment.length})
          </h4>
          <div className="space-y-3">
            {selectedEquipment.map(item => (
              <div key={item.equipment_id} className="bg-white rounded-lg p-3 border border-emerald-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {item.equipment?.name}
                      </span>
                      <button
                        onClick={() => toggleEquipment(item.equipment!)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <span className="text-xs text-gray-500 capitalize">
                      {item.equipment?.category}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateEquipmentRequired(item.equipment_id, true)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        item.is_required
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Required
                    </button>
                    <button
                      onClick={() => updateEquipmentRequired(item.equipment_id, false)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        !item.is_required
                          ? 'bg-gray-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Optional
                    </button>
                  </div>
                </div>
                <Input
                  type="text"
                  placeholder="Notes (e.g., 'or similar 6-quart pot')"
                  value={item.notes}
                  onChange={e => updateEquipmentNotes(item.equipment_id, e.target.value)}
                  className="text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border border-gray-200 rounded-lg p-4">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              type="text"
              placeholder="Search equipment..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {CATEGORY_LABELS[category]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
          {filteredEquipment.map(equipment => {
            const isSelected = selectedIds.includes(equipment.id);
            return (
              <button
                key={equipment.id}
                onClick={() => toggleEquipment(equipment)}
                className={`text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${isSelected ? 'text-emerald-900' : 'text-gray-900'}`}>
                        {equipment.name}
                      </span>
                      {equipment.is_common && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                          Common
                        </span>
                      )}
                    </div>
                    {equipment.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {equipment.description}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <Check size={20} className="text-emerald-600 flex-shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {filteredEquipment.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No equipment found</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Custom Equipment</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Equipment Name
                </label>
                <Input
                  type="text"
                  value={newEquipmentName}
                  onChange={e => setNewEquipmentName(e.target.value)}
                  placeholder="e.g., Bamboo Steamer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={newEquipmentCategory}
                  onChange={e => setNewEquipmentCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {CATEGORY_LABELS[category]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="primary"
                onClick={addCustomEquipment}
                disabled={!newEquipmentName.trim()}
                className="flex-1"
              >
                Add Equipment
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowAddModal(false);
                  setNewEquipmentName('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
