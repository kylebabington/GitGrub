import { useState, useEffect, useRef } from 'react';
import { Clock, Play, Pause, RotateCcw, X } from 'lucide-react';

interface RecipeTimerProps {
  duration: number;
  label?: string;
  stepNumber?: number;
  onComplete?: () => void;
}

export function RecipeTimer({
  duration,
  label = 'Timer',
  stepNumber,
  onComplete,
}: RecipeTimerProps) {
  const [showTimer, setShowTimer] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeRemaining]);

  const handleComplete = () => {
    setIsRunning(false);
    setIsComplete(true);

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Timer Complete!', {
        body: `${label} - Time to check your food!`,
        icon: '/favicon.ico',
      });
    }

    playSound();

    if (onComplete) {
      onComplete();
    }
  };

  const playSound = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS56+mlVxELTqXh8LllHQc5kdXzzn0vBSl+zPLaizsIHGu76+WSUAIKWLnp6qVVEQJGnt7xwXMhBSh+zPLZiToIHmu56+ScURoPTqPh77FhHQU4kdXy0YU2BCl/zPDXgDkHGWq45+ONRwoSXrTn6qZWEQpEnt3xvXIhBCuBzvLYijYIGWS56+imVhEKTqXh77RjHgU4ktXyzoI1BCp/zPDYhDkHGGq45+ONRwoSXrPn6aVWEQlEntvxvXIhBCt/zvLYijYIGWS36+imVhEKTqXh77RjHgU4kdXyzoI1BCp/zPDYgzwHGmu45+SNRwoTXrPn6aVWEQlEntvxvHMhBCuBzvLYiTYIGGS46+mnVhEKTqPg77RjHgU4kdXyzoI1BCp/y/DYgzwHGmu45+SNRwoTXrPn6KRWEQlEntvxvHMhBCuAzvLYiTYIGGS36+imVhEKTqPg77RjHQU4kdXyzoI1BCp/y/DYgzwHGmq45+SNRwoTXrPn6KRWEgpEndzxvHIhBCuAzvLYiTYIGGS36+imVREKTqPg77RjHQU4kdXyzoI1BCp/y/DYgzwHGmq45+SNRwoTXrPn6KRWEgpEndzxvHIhBCuAzvLXiTYIGGS36+imVREKTqPg77FjHQU4kdXyzoI1BCp/y/DYgzwHGmq45+SNRwoTXrLn6KRWEgpEndzxvHIhBCuAzvLXiTYIGGS36+imVREKTqLg77FjHQU4kdXyz4M1BCp/y/DYgzwHGmq45+ONRwoTXrLn6KRWEgpEndzxvHIhBCuAzvLXiTYIG');
    }
    audioRef.current?.play();
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    if (!showTimer) {
      setShowTimer(true);
      requestNotificationPermission();
    } else {
      setIsRunning(!isRunning);
    }
  };

  const resetTimer = () => {
    setTimeRemaining(duration);
    setIsRunning(false);
    setIsComplete(false);
  };

  const closeTimer = () => {
    setShowTimer(false);
    resetTimer();
  };

  const getProgressPercentage = () => {
    return ((duration - timeRemaining) / duration) * 100;
  };

  return (
    <>
      <button
        onClick={toggleTimer}
        className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200 transition-colors text-sm font-medium"
        title="Start timer"
      >
        <Clock size={14} />
        {formatTime(duration)}
      </button>

      {showTimer && (
        <div className="fixed bottom-4 right-4 z-50 w-72 bg-white rounded-lg shadow-2xl border-2 border-emerald-500 overflow-hidden">
          <div
            className="absolute bottom-0 left-0 h-1 bg-emerald-500 transition-all duration-1000 ease-linear"
            style={{ width: `${getProgressPercentage()}%` }}
          />

          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Clock size={18} className="text-emerald-600" />
                {label}
                {stepNumber && (
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                    Step {stepNumber}
                  </span>
                )}
              </h4>
              <button
                onClick={closeTimer}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="text-center mb-4">
              <div
                className={`text-5xl font-bold mb-2 transition-colors ${
                  isComplete
                    ? 'text-red-600 animate-pulse'
                    : isRunning
                    ? 'text-emerald-600'
                    : 'text-gray-600'
                }`}
              >
                {formatTime(timeRemaining)}
              </div>
              {isComplete && (
                <p className="text-red-600 font-semibold animate-bounce">
                  Time's up!
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={toggleTimer}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                  isRunning
                    ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause size={16} />
                    Pause
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    Start
                  </>
                )}
              </button>

              <button
                onClick={resetTimer}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                title="Reset"
              >
                <RotateCcw size={16} />
              </button>
            </div>

            {timeRemaining <= 10 && timeRemaining > 0 && isRunning && (
              <div className="mt-3 text-center text-sm text-orange-600 font-medium">
                Almost done! {timeRemaining} seconds left
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export function parseTimeFromText(text: string): number | null {
  const minutesMatch = text.match(/(\d+)\s*(?:minute|min|mins)/i);
  const hoursMatch = text.match(/(\d+)\s*(?:hour|hr|hrs)/i);
  const secondsMatch = text.match(/(\d+)\s*(?:second|sec|secs)/i);

  let totalSeconds = 0;

  if (hoursMatch) {
    totalSeconds += parseInt(hoursMatch[1]) * 3600;
  }
  if (minutesMatch) {
    totalSeconds += parseInt(minutesMatch[1]) * 60;
  }
  if (secondsMatch) {
    totalSeconds += parseInt(secondsMatch[1]);
  }

  return totalSeconds > 0 ? totalSeconds : null;
}
