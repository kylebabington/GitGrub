import { useState, useEffect } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface RecipeProgressTrackerProps {
  recipeId: string;
  totalSteps: number;
  onStepComplete?: (stepNumber: number) => void;
}

export function RecipeProgressTracker({
  recipeId,
  totalSteps,
  onStepComplete,
}: RecipeProgressTrackerProps) {
  const { user } = useAuth();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (user) {
      loadProgress();
    } else {
      setLoading(false);
    }
  }, [user, recipeId]);

  const loadProgress = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('recipe_progress')
      .select('completed_steps')
      .eq('user_id', user.id)
      .eq('recipe_id', recipeId)
      .maybeSingle();

    if (data) {
      setCompletedSteps(data.completed_steps || []);
    }
    setLoading(false);
  };

  const toggleStep = async (stepNumber: number) => {
    if (!user) return;

    const isCompleted = completedSteps.includes(stepNumber);
    let newCompletedSteps: number[];

    if (isCompleted) {
      newCompletedSteps = completedSteps.filter(s => s !== stepNumber);
    } else {
      newCompletedSteps = [...completedSteps, stepNumber].sort((a, b) => a - b);

      if (newCompletedSteps.length === totalSteps) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }

      if (onStepComplete) {
        onStepComplete(stepNumber);
      }
    }

    setCompletedSteps(newCompletedSteps);

    const isFullyComplete = newCompletedSteps.length === totalSteps;

    await supabase
      .from('recipe_progress')
      .upsert({
        user_id: user.id,
        recipe_id: recipeId,
        completed_steps: newCompletedSteps,
        current_step: Math.max(...newCompletedSteps, 0),
        last_updated: new Date().toISOString(),
        completed_at: isFullyComplete ? new Date().toISOString() : null,
      });
  };

  const progressPercentage = (completedSteps.length / totalSteps) * 100;

  if (loading) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="bg-white border border-gray-200 rounded-lg p-4 sticky top-20 z-10 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Your Progress</h3>
          <span className="text-sm text-gray-600">
            {completedSteps.length} of {totalSteps} steps
          </span>
        </div>

        <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {completedSteps.length === totalSteps && (
          <div className="text-center">
            <p className="text-emerald-600 font-semibold animate-bounce">
              🎉 Recipe Complete! Great job!
            </p>
          </div>
        )}

        {completedSteps.length > 0 && completedSteps.length < totalSteps && (
          <p className="text-sm text-gray-600 text-center">
            {totalSteps - completedSteps.length === 1
              ? 'Almost done! Just 1 step left'
              : `Keep going! ${totalSteps - completedSteps.length} steps to go`}
          </p>
        )}
      </div>

      {showConfetti && <Confetti />}
    </div>
  );
}

interface StepIndicatorProps {
  stepNumber: number;
  isCompleted: boolean;
  onClick: () => void;
}

export function StepIndicator({ stepNumber, isCompleted, onClick }: StepIndicatorProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 transform hover:scale-110 ${
        isCompleted
          ? 'bg-emerald-600 text-white shadow-lg'
          : 'bg-gray-200 text-gray-700 hover:bg-emerald-100'
      }`}
      title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
    >
      {isCompleted ? (
        <CheckCircle2 size={20} className="animate-in zoom-in duration-300" />
      ) : (
        <span>{stepNumber}</span>
      )}
    </button>
  );
}

function Confetti() {
  const confettiColors = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];
  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 1,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confettiPieces.map(piece => (
        <div
          key={piece.id}
          className="absolute w-3 h-3 animate-confetti"
          style={{
            backgroundColor: piece.color,
            left: `${piece.left}%`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
