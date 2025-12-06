import { useState } from 'react';
import { Calendar, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface CookTonightButtonProps {
  recipeId: string;
}

export function CookTonightButton({ recipeId }: CookTonightButtonProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  const addToTonight = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    setLoading(true);

    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase
      .from('meal_plans')
      .insert({
        user_id: user.id,
        recipe_id: recipeId,
        date: today,
        meal_type: 'dinner',
      });

    if (!error) {
      setAdded(true);
      setTimeout(() => setAdded(false), 3000);
    }

    setLoading(false);
  };

  return (
    <button
      onClick={addToTonight}
      disabled={loading || added}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-all transform hover:scale-105 ${
        added
          ? 'bg-green-100 text-green-700'
          : 'bg-emerald-600 text-white hover:bg-emerald-700'
      }`}
      title="Add to tonight's dinner"
    >
      {added ? (
        <>
          <Check size={18} className="animate-in zoom-in" />
          Added to Tonight!
        </>
      ) : (
        <>
          <Calendar size={18} />
          {loading ? 'Adding...' : 'Cook Tonight'}
        </>
      )}
    </button>
  );
}
