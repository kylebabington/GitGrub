import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Play, Calendar, Users, Clock, Plus, Radio } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CookAlongSession {
  id: string;
  title: string;
  description: string;
  scheduled_start: string;
  status: string;
  participant_count: number;
  max_participants: number;
  is_public: boolean;
  recipe: any;
  host: any;
}

export function CookAlong() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<CookAlongSession[]>([]);
  const [filter, setFilter] = useState<'upcoming' | 'live' | 'past'>('upcoming');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, [filter]);

  const loadSessions = async () => {
    let query = supabase
      .from('cook_along_sessions')
      .select('*, recipe:recipes(*), host:user_profiles!cook_along_sessions_host_id_fkey(*)')
      .eq('is_public', true);

    if (filter === 'upcoming') {
      query = query
        .eq('status', 'scheduled')
        .gte('scheduled_start', new Date().toISOString())
        .order('scheduled_start', { ascending: true });
    } else if (filter === 'live') {
      query = query.eq('status', 'live');
    } else {
      query = query
        .in('status', ['ended', 'cancelled'])
        .order('scheduled_start', { ascending: false })
        .limit(20);
    }

    const { data } = await query;
    setSessions(data || []);
    setLoading(false);
  };

  const joinSession = async (sessionId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    const { error } = await supabase
      .from('cook_along_participants')
      .insert({
        session_id: sessionId,
        user_id: user.id,
      });

    if (!error) {
      navigate(`/cook-along/${sessionId}`);
    } else {
      if (error.message.includes('duplicate')) {
        navigate(`/cook-along/${sessionId}`);
      } else {
        alert('Failed to join session');
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    if (diffHours > 0) return `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    if (diffMins > 0) return `in ${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
    return 'starting soon';
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <p className="text-gray-600">Loading sessions...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Cook-Along Sessions</h1>
              <p className="text-gray-600">
                Join live cooking sessions and cook together with the community
              </p>
            </div>
            {user && (
              <Button onClick={() => navigate('/cook-along/schedule')}>
                <Plus size={20} className="mr-2" />
                Host Session
              </Button>
            )}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex gap-2">
            {(['upcoming', 'live', 'past'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                  filter === tab
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {sessions.length === 0 ? (
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No {filter} sessions
                </h3>
                <p className="text-gray-600 mb-6">
                  {filter === 'upcoming'
                    ? 'Be the first to schedule a cook-along session!'
                    : filter === 'live'
                    ? 'No sessions are currently live. Check back later!'
                    : 'No past sessions to show yet.'}
                </p>
                {user && filter === 'upcoming' && (
                  <Button onClick={() => navigate('/cook-along/schedule')}>
                    Host a Session
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <Card key={session.id} className="hover:shadow-lg transition-shadow">
                <CardBody>
                  {session.status === 'live' && (
                    <div className="flex items-center gap-2 mb-3 text-red-600">
                      <Radio size={16} className="animate-pulse" />
                      <span className="text-sm font-semibold uppercase">Live Now</span>
                    </div>
                  )}

                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {session.title}
                  </h3>

                  {session.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {session.description}
                    </p>
                  )}

                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">
                      {session.recipe?.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                      <Users size={12} />
                      <span>by {session.host?.username}</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={16} />
                        <span>{formatDate(session.scheduled_start)}</span>
                      </div>
                      {filter === 'upcoming' && (
                        <span className="text-emerald-600 font-medium">
                          {getRelativeTime(session.scheduled_start)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users size={16} />
                      <span>
                        {session.participant_count} / {session.max_participants} participants
                      </span>
                    </div>
                  </div>

                  {session.status === 'live' ? (
                    <Button
                      onClick={() => joinSession(session.id)}
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      <Play size={16} className="mr-2" />
                      Join Live Session
                    </Button>
                  ) : session.status === 'scheduled' ? (
                    <Button
                      onClick={() => joinSession(session.id)}
                      className="w-full"
                      disabled={session.participant_count >= session.max_participants}
                    >
                      {session.participant_count >= session.max_participants
                        ? 'Session Full'
                        : 'Join Session'}
                    </Button>
                  ) : (
                    <Button variant="secondary" className="w-full" disabled>
                      Session Ended
                    </Button>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
