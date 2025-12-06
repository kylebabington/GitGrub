import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Card, CardBody } from '../components/Card';
import { Award, Lock, TrendingUp, Flame, Star as StarIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import * as Icons from 'lucide-react';

interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  unlocked?: boolean;
  unlocked_at?: string;
}

interface UserStats {
  total_xp: number;
  level: number;
  recipes_cooked: number;
  cooking_streak: number;
  cuisines_tried: string[];
  ingredients_used: string[];
}

export function Achievements() {
  const { user, loading: authLoading } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const categories = ['all', 'cooking', 'social', 'explorer', 'planner'];

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const { data: allAchievements } = await supabase
      .from('achievements')
      .select('*')
      .order('points', { ascending: false });

    const { data: userAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_id, unlocked_at')
      .eq('user_id', user.id);

    const unlockedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);
    const unlockedMap = new Map(
      userAchievements?.map(ua => [ua.achievement_id, ua.unlocked_at]) || []
    );

    const achievementsWithStatus = (allAchievements || []).map(achievement => ({
      ...achievement,
      unlocked: unlockedIds.has(achievement.id),
      unlocked_at: unlockedMap.get(achievement.id),
    }));

    setAchievements(achievementsWithStatus);

    let { data: userStats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!userStats) {
      const { data: newStats } = await supabase
        .from('user_stats')
        .insert({ user_id: user.id })
        .select()
        .single();
      userStats = newStats;
    }

    setStats(userStats);
    setLoading(false);
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Award;
  };

  const calculateLevelProgress = () => {
    if (!stats) return 0;
    const xpForCurrentLevel = stats.level * 100;
    const xpForNextLevel = (stats.level + 1) * 100;
    const xpInCurrentLevel = stats.total_xp - (stats.level - 1) * 100;
    return (xpInCurrentLevel / (xpForNextLevel - xpForCurrentLevel)) * 100;
  };

  const getNextLevelXP = () => {
    if (!stats) return 0;
    return (stats.level + 1) * 100;
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
    window.location.href = '/login';
    return null;
  }

  const filteredAchievements =
    filter === 'all'
      ? achievements
      : achievements.filter(a => a.category === filter);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalPoints = achievements
    .filter(a => a.unlocked)
    .reduce((sum, a) => sum + a.points, 0);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Achievements</h1>
          <p className="text-gray-600">
            Track your culinary journey and unlock rewards
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="text-emerald-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Level</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.level}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>{stats?.total_xp} XP</span>
                  <span>{getNextLevelXP()} XP</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-300"
                    style={{ width: `${calculateLevelProgress()}%` }}
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Award className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Achievements</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {unlockedCount}/{achievements.length}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Flame className="text-orange-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cooking Streak</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.cooking_streak} days
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <StarIcon className="text-purple-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Points</p>
                  <p className="text-2xl font-bold text-gray-900">{totalPoints}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setFilter(category)}
                className={`px-4 py-2 rounded-lg font-medium capitalize whitespace-nowrap transition-colors ${
                  filter === category
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.map(achievement => {
            const IconComponent = getIconComponent(achievement.icon);
            return (
              <Card
                key={achievement.id}
                className={achievement.unlocked ? 'border-emerald-200 bg-emerald-50' : 'opacity-75'}
              >
                <CardBody>
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 ${
                        achievement.unlocked
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      {achievement.unlocked ? (
                        <IconComponent size={32} />
                      ) : (
                        <Lock size={32} />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3
                          className={`font-semibold ${
                            achievement.unlocked ? 'text-gray-900' : 'text-gray-600'
                          }`}
                        >
                          {achievement.title}
                        </h3>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            achievement.unlocked
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {achievement.points} XP
                        </span>
                      </div>

                      <p
                        className={`text-sm ${
                          achievement.unlocked ? 'text-gray-700' : 'text-gray-500'
                        }`}
                      >
                        {achievement.description}
                      </p>

                      {achievement.unlocked && achievement.unlocked_at && (
                        <p className="text-xs text-emerald-600 mt-2">
                          Unlocked{' '}
                          {new Date(achievement.unlocked_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      )}

                      {!achievement.unlocked && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-600 font-medium">
                            Keep cooking to unlock!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
