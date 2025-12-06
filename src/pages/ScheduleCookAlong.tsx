import { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { Input } from '../components/Input';
import { Calendar, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function ScheduleCookAlong() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [myRecipes, setMyRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    recipe_id: '',
    title: '',
    description: '',
    scheduled_date: '',
    scheduled_time: '',
    is_public: true,
    max_participants: 20,
  });

  useEffect(() => {
    if (user) {
      loadMyRecipes();
    }
  }, [user]);

  const loadMyRecipes = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('recipes')
      .select('id, title')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    setMyRecipes(data || []);
    setLoading(false);
  };

  const scheduleSession = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    const scheduledStart = new Date(
      `${formData.scheduled_date}T${formData.scheduled_time}`
    ).toISOString();

    const { error } = await supabase
      .from('cook_along_sessions')
      .insert({
        host_id: user.id,
        recipe_id: formData.recipe_id,
        title: formData.title,
        description: formData.description,
        scheduled_start: scheduledStart,
        is_public: formData.is_public,
        max_participants: formData.max_participants,
        status: 'scheduled',
      });

    if (!error) {
      alert('Session scheduled successfully!');
      navigate('/cook-along');
    } else {
      alert('Failed to schedule session');
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

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Schedule Cook-Along Session</h1>
          <p className="text-gray-600">
            Host a live cooking session and cook together with the community
          </p>
        </div>

        <Card>
          <CardBody>
            <form onSubmit={scheduleSession} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Recipe
                </label>
                {myRecipes.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 mb-4">You need to create a recipe first</p>
                    <Button onClick={() => window.location.href = '/dashboard'}>
                      Go to Dashboard
                    </Button>
                  </div>
                ) : (
                  <select
                    value={formData.recipe_id}
                    onChange={(e) =>
                      setFormData({ ...formData, recipe_id: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Choose a recipe...</option>
                    {myRecipes.map((recipe) => (
                      <option key={recipe.id} value={recipe.id}>
                        {recipe.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Title
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Live Pasta Making Class"
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
                  placeholder="Tell participants what to expect..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar size={16} className="inline mr-1" />
                    Date
                  </label>
                  <Input
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) =>
                      setFormData({ ...formData, scheduled_date: e.target.value })
                    }
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <Input
                    type="time"
                    value={formData.scheduled_time}
                    onChange={(e) =>
                      setFormData({ ...formData, scheduled_time: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users size={16} className="inline mr-1" />
                  Max Participants
                </label>
                <Input
                  type="number"
                  value={formData.max_participants}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_participants: parseInt(e.target.value) || 20,
                    })
                  }
                  min={1}
                  max={100}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Limit the number of participants (1-100)
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_public}
                    onChange={(e) =>
                      setFormData({ ...formData, is_public: e.target.checked })
                    }
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Public session (visible to everyone)
                  </span>
                </label>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex gap-3">
                  <Button type="submit" disabled={!formData.recipe_id}>
                    Schedule Session
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => window.location.href = '/cook-along'}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          </CardBody>
        </Card>

        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Tips for hosting</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Schedule your session at least 24 hours in advance</li>
            <li>• Prepare all ingredients before the session starts</li>
            <li>• Test your setup and ensure you have a stable internet connection</li>
            <li>• Start the session 5 minutes early for late joiners</li>
            <li>• Engage with participants through chat</li>
            <li>• Take your time and explain each step clearly</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
