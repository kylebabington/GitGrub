import { useState, useEffect } from 'react';
import { Button } from './Button';
import { X, ChevronLeft, ChevronRight, Timer, Check, PlayCircle, PauseCircle } from 'lucide-react';

interface Ingredient {
  item: string;
  quantity: string;
  notes: string;
}

interface Step {
  instruction: string;
}

interface CookingModeProps {
  recipe: any;
  onClose: () => void;
}

export function CookingMode({ recipe, onClose }: CookingModeProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [checkedIngredients, setCheckedIngredients] = useState<boolean[]>([]);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([]);
  const [timer, setTimer] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  const steps = (recipe.steps || []) as Step[];
  const ingredients = (recipe.ingredients || []) as Ingredient[];

  useEffect(() => {
    setCheckedIngredients(new Array(ingredients.length).fill(false));
    setCompletedSteps(new Array(steps.length).fill(false));
  }, [recipe]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setTimerActive(false);
            playTimerSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  const playTimerSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDGH0fPTgjMGHm7A7+OZURE=');
    audio.play().catch(() => {});
  };

  const toggleIngredient = (index: number) => {
    const newChecked = [...checkedIngredients];
    newChecked[index] = !newChecked[index];
    setCheckedIngredients(newChecked);
  };

  const toggleStepComplete = (index: number) => {
    const newCompleted = [...completedSteps];
    newCompleted[index] = !newCompleted[index];
    setCompletedSteps(newCompleted);
  };

  const startTimer = (minutes: number) => {
    setTimerSeconds(minutes * 60);
    setTimerActive(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const extractTimerFromStep = (instruction: string): number | null => {
    const patterns = [
      /(\d+)\s*minutes?/i,
      /(\d+)\s*mins?/i,
      /(\d+)\s*min/i,
    ];

    for (const pattern of patterns) {
      const match = instruction.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }
    return null;
  };

  const suggestedTimer = extractTimerFromStep(steps[currentStep]?.instruction || '');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-white">{recipe.title}</h1>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6">
          {currentStep === -1 ? (
            <div className="bg-gray-800 rounded-lg p-8">
              <h2 className="text-3xl font-bold text-white mb-6">Ingredients</h2>
              <div className="space-y-3">
                {ingredients.map((ingredient, index) => (
                  <label
                    key={index}
                    className="flex items-start gap-4 p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={checkedIngredients[index]}
                      onChange={() => toggleIngredient(index)}
                      className="mt-1 w-5 h-5 rounded border-gray-500 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex-1">
                      <p className={`text-lg ${checkedIngredients[index] ? 'line-through text-gray-400' : 'text-white'}`}>
                        <span className="font-semibold">{ingredient.quantity}</span> {ingredient.item}
                      </p>
                      {ingredient.notes && (
                        <p className="text-sm text-gray-400 mt-1">{ingredient.notes}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              <Button
                onClick={() => setCurrentStep(0)}
                className="mt-8 w-full py-4 text-lg"
              >
                Start Cooking
              </Button>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleStepComplete(currentStep)}
                    className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors ${
                      completedSteps[currentStep]
                        ? 'bg-emerald-600 border-emerald-600'
                        : 'border-gray-500 hover:border-emerald-500'
                    }`}
                  >
                    {completedSteps[currentStep] && <Check size={24} className="text-white" />}
                  </button>
                  <div>
                    <p className="text-sm text-gray-400">Step {currentStep + 1} of {steps.length}</p>
                    <div className="flex gap-1 mt-1">
                      {steps.map((_, index) => (
                        <div
                          key={index}
                          className={`h-1 w-8 rounded-full ${
                            completedSteps[index]
                              ? 'bg-emerald-600'
                              : index === currentStep
                              ? 'bg-emerald-400'
                              : 'bg-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {timer !== null && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setTimer(null)}
                  >
                    Clear Timer
                  </Button>
                )}
              </div>

              <p className="text-3xl text-white leading-relaxed mb-8">
                {steps[currentStep]?.instruction}
              </p>

              {timerActive ? (
                <div className="bg-gray-700 rounded-lg p-6 mb-8 text-center">
                  <div className="text-6xl font-bold text-emerald-400 mb-4">
                    {formatTime(timerSeconds)}
                  </div>
                  <div className="flex gap-4 justify-center">
                    <Button
                      variant="secondary"
                      onClick={() => setTimerActive(false)}
                    >
                      <PauseCircle size={20} className="mr-2" />
                      Pause
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setTimerActive(false);
                        setTimerSeconds(0);
                      }}
                    >
                      Stop
                    </Button>
                  </div>
                </div>
              ) : suggestedTimer && timerSeconds === 0 ? (
                <div className="bg-gray-700 rounded-lg p-6 mb-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Timer size={24} className="text-emerald-400" />
                      <span className="text-white text-lg">
                        This step mentions {suggestedTimer} minutes
                      </span>
                    </div>
                    <Button onClick={() => startTimer(suggestedTimer)}>
                      <PlayCircle size={20} className="mr-2" />
                      Start Timer
                    </Button>
                  </div>
                </div>
              ) : timerSeconds > 0 && !timerActive ? (
                <div className="bg-gray-700 rounded-lg p-6 mb-8 text-center">
                  <div className="text-6xl font-bold text-gray-400 mb-4">
                    {formatTime(timerSeconds)}
                  </div>
                  <Button onClick={() => setTimerActive(true)}>
                    <PlayCircle size={20} className="mr-2" />
                    Resume
                  </Button>
                </div>
              ) : null}

              <div className="bg-gray-700 rounded-lg p-4 mb-8">
                <h3 className="text-sm font-semibold text-gray-400 mb-3">Set Custom Timer</h3>
                <div className="flex gap-2">
                  {[1, 5, 10, 15, 20, 30].map((minutes) => (
                    <button
                      key={minutes}
                      onClick={() => startTimer(minutes)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                    >
                      {minutes}m
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-900 border-t border-gray-700 p-4">
        <div className="max-w-6xl mx-auto flex justify-between">
          <Button
            variant="secondary"
            onClick={currentStep === -1 ? onClose : prevStep}
            disabled={currentStep === 0}
          >
            <ChevronLeft size={20} className="mr-2" />
            {currentStep === -1 ? 'Back' : currentStep === 0 ? 'Ingredients' : 'Previous'}
          </Button>

          {currentStep === -1 ? (
            <Button onClick={() => setCurrentStep(0)}>
              Start Cooking
            </Button>
          ) : currentStep === steps.length - 1 ? (
            <Button onClick={onClose}>
              Finish Cooking
            </Button>
          ) : (
            <Button onClick={nextStep}>
              Next Step
              <ChevronRight size={20} className="ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
