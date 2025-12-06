import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { Input } from '../components/Input';
import {
  Play,
  Pause,
  SkipForward,
  Users,
  MessageCircle,
  Send,
  Radio,
  CheckCircle,
  Clock,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LiveSession {
  id: string;
  title: string;
  status: string;
  current_step: number;
  recipe: any;
  host: any;
}

interface Participant {
  id: string;
  user: any;
  current_step: number;
  status: string;
}

interface ChatMessage {
  id: string;
  user: any;
  message: string;
  message_type: string;
  created_at: string;
}

export function LiveCookAlong({ sessionId }: { sessionId: string }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState<LiveSession | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [myParticipation, setMyParticipation] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [timer, setTimer] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    if (user) {
      loadSession();
      subscribeToUpdates();
    }
  }, [user, sessionId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadSession = async () => {
    const { data: sessionData } = await supabase
      .from('cook_along_sessions')
      .select('*, recipe:recipes(*), host:user_profiles!cook_along_sessions_host_id_fkey(*)')
      .eq('id', sessionId)
      .maybeSingle();

    setSession(sessionData);

    const { data: participantData } = await supabase
      .from('cook_along_participants')
      .select('*, user:user_profiles(*)')
      .eq('session_id', sessionId);

    setParticipants(participantData || []);

    const myPart = participantData?.find((p) => p.user_id === user?.id);
    setMyParticipation(myPart);

    const { data: chatData } = await supabase
      .from('cook_along_chat')
      .select('*, user:user_profiles(*)')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(100);

    setChatMessages(chatData || []);
    setLoading(false);
  };

  const subscribeToUpdates = () => {
    const sessionChannel = supabase
      .channel(`session_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cook_along_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setSession((prev) => (prev ? { ...prev, ...payload.new } : null));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cook_along_chat',
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('cook_along_chat')
              .select('*, user:user_profiles(*)')
              .eq('id', payload.new.id)
              .maybeSingle();

            if (data) {
              setChatMessages((prev) => [...prev, data]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionChannel);
    };
  };

  const startSession = async () => {
    if (session?.host.id !== user?.id) return;

    await supabase
      .from('cook_along_sessions')
      .update({
        status: 'live',
        actual_start: new Date().toISOString(),
      })
      .eq('id', sessionId);

    setIsTimerRunning(true);
  };

  const endSession = async () => {
    if (session?.host.id !== user?.id) return;

    if (!confirm('End this session? All participants will be notified.')) return;

    await supabase
      .from('cook_along_sessions')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    setIsTimerRunning(false);
    alert('Session ended!');
    navigate('/cook-along');
  };

  const nextStep = async () => {
    if (session?.host.id !== user?.id) return;

    const newStep = (session.current_step || 0) + 1;
    const maxSteps = session.recipe?.steps?.length || 0;

    if (newStep <= maxSteps) {
      await supabase
        .from('cook_along_sessions')
        .update({ current_step: newStep })
        .eq('id', sessionId);
    }
  };

  const updateMyStep = async (step: number) => {
    if (!myParticipation) return;

    await supabase
      .from('cook_along_participants')
      .update({
        current_step: step,
        updated_at: new Date().toISOString(),
      })
      .eq('id', myParticipation.id);

    loadSession();
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    await supabase.from('cook_along_chat').insert({
      session_id: sessionId,
      user_id: user.id,
      message: newMessage,
      message_type: 'chat',
    });

    setNewMessage('');
  };

  const leaveSession = () => {
    if (confirm('Leave this session?')) {
      navigate('/cook-along');
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading || !session) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <p className="text-gray-600">Loading session...</p>
        </div>
      </Layout>
    );
  }

  const isHost = user?.id === session.host.id;
  const currentStep = session.recipe?.steps?.[session.current_step];
  const totalSteps = session.recipe?.steps?.length || 0;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {session.status === 'live' && (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full">
                  <Radio size={16} className="animate-pulse" />
                  <span className="font-semibold text-sm">LIVE</span>
                </div>
              )}
              <h1 className="text-2xl font-bold text-gray-900">{session.title}</h1>
            </div>
            <p className="text-gray-600">
              Cooking: {session.recipe?.title} • Host: {session.host.username}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {isHost ? (
              <>
                {session.status === 'scheduled' && (
                  <Button onClick={startSession}>
                    <Play size={16} className="mr-2" />
                    Start Session
                  </Button>
                )}
                {session.status === 'live' && (
                  <Button onClick={endSession} variant="secondary">
                    End Session
                  </Button>
                )}
              </>
            ) : (
              <Button variant="ghost" onClick={leaveSession}>
                <X size={16} className="mr-2" />
                Leave
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardBody>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Current Step</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {session.current_step} / {totalSteps}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock size={20} />
                      <span className="text-xl font-mono">{formatTimer(timer)}</span>
                    </div>
                    {isHost && session.status === 'live' && (
                      <Button
                        onClick={nextStep}
                        disabled={session.current_step >= totalSteps}
                      >
                        <SkipForward size={16} className="mr-2" />
                        Next Step
                      </Button>
                    )}
                  </div>
                </div>

                {currentStep ? (
                  <div className="p-6 bg-emerald-50 rounded-lg border-2 border-emerald-200">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0">
                        {session.current_step}
                      </div>
                      <div className="flex-1">
                        <p className="text-lg text-gray-900 leading-relaxed">
                          {currentStep.instruction}
                        </p>
                        {!isHost && (
                          <Button
                            size="sm"
                            className="mt-4"
                            onClick={() => updateMyStep(session.current_step)}
                            disabled={myParticipation?.current_step === session.current_step}
                          >
                            {myParticipation?.current_step === session.current_step ? (
                              <>
                                <CheckCircle size={16} className="mr-1" />
                                Completed
                              </>
                            ) : (
                              'Mark Complete'
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-600">
                    {session.status === 'scheduled'
                      ? 'Waiting for host to start...'
                      : 'All steps completed!'}
                  </div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <h3 className="font-semibold text-gray-900 mb-4">All Steps</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {session.recipe?.steps?.map((step: any, index: number) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        index === session.current_step
                          ? 'border-emerald-500 bg-emerald-50'
                          : index < session.current_step
                          ? 'border-gray-200 bg-gray-50 opacity-60'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex gap-3">
                        <span className="font-semibold text-gray-700">{index + 1}.</span>
                        <p className="text-gray-900 text-sm">{step.instruction}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardBody>
                <div className="flex items-center gap-2 mb-4">
                  <Users size={20} className="text-emerald-600" />
                  <h3 className="font-semibold text-gray-900">
                    Participants ({participants.length})
                  </h3>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-emerald-700">
                            {participant.user?.username?.[0]?.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {participant.user?.username}
                          {participant.user_id === session.host.id && (
                            <span className="ml-2 text-xs text-emerald-600">(Host)</span>
                          )}
                        </span>
                      </div>
                      <span className="text-xs text-gray-600">
                        Step {participant.current_step}/{totalSteps}
                      </span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center gap-2 mb-4">
                  <MessageCircle size={20} className="text-emerald-600" />
                  <h3 className="font-semibold text-gray-900">Chat</h3>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className="text-sm">
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold text-gray-900">
                          {msg.user?.username}:
                        </span>
                        <span className="text-gray-700">{msg.message}</span>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={sendMessage} className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Send a message..."
                    className="flex-1"
                  />
                  <Button type="submit" size="sm">
                    <Send size={16} />
                  </Button>
                </form>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
