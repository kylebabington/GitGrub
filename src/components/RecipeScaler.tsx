import { useState } from 'react';
import { ChefHat, Clock, Thermometer } from 'lucide-react';
import {
  scaleIngredient,
  adjustCookingTime,
  adjustTemperature,
  getServingSizes,
  parseQuantity,
} from '../lib/recipeScaler';

interface Ingredient {
  item: string;
  quantity: string;
  notes?: string;
}

interface RecipeScalerProps {
  originalServings: string;
  ingredients: Ingredient[];
  prepTime?: number;
  cookingTime?: number;
  temperature?: number;
  onScaleChange?: (scaleFactor: number) => void;
}

export function RecipeScaler({
  originalServings,
  ingredients,
  prepTime,
  cookingTime,
  temperature,
  onScaleChange,
}: RecipeScalerProps) {
  const servingSizes = getServingSizes(originalServings);
  const originalMatch = originalServings.match(/(\d+)/);
  const originalCount = originalMatch ? parseInt(originalMatch[1]) : 4;

  const [selectedServings, setSelectedServings] = useState(originalCount);
  const scaleFactor = selectedServings / originalCount;

  const handleServingChange = (servings: number) => {
    setSelectedServings(servings);
    const factor = servings / originalCount;
    onScaleChange?.(factor);
  };

  const scaledIngredients = ingredients.map((ing) => ({
    ...ing,
    quantity: scaleIngredient(ing.quantity, scaleFactor),
  }));

  const scaledPrepTime = prepTime ? adjustCookingTime(prepTime, scaleFactor) : null;
  const scaledCookTime = cookingTime ? adjustCookingTime(cookingTime, scaleFactor) : null;
  const scaledTemp = temperature ? adjustTemperature(temperature, scaleFactor) : null;

  const getIngredientBar = (quantity: string) => {
    const parsed = parseQuantity(quantity);
    const percentage = Math.min(100, (parsed.amount / 4) * 100);
    return percentage;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ChefHat size={20} className="text-emerald-600" />
          Scale Recipe
        </h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Servings
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={servingSizes[0]}
              max={servingSizes[servingSizes.length - 1]}
              value={selectedServings}
              onChange={(e) => handleServingChange(parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              step={1}
            />
            <span className="text-2xl font-bold text-emerald-600 min-w-[60px] text-center">
              {selectedServings}
            </span>
          </div>

          <div className="flex justify-between mt-2 text-xs text-gray-500">
            {servingSizes.map((size) => (
              <button
                key={size}
                onClick={() => handleServingChange(size)}
                className={`px-2 py-1 rounded transition-colors ${
                  selectedServings === size
                    ? 'bg-emerald-100 text-emerald-700 font-medium'
                    : 'hover:bg-gray-100'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {scaleFactor !== 1 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-emerald-800">
              <strong>Scaling by {scaleFactor.toFixed(2)}x</strong>
              {scaleFactor > 1 ? ' (larger batch)' : ' (smaller batch)'}
            </p>
          </div>
        )}

        {(scaledPrepTime || scaledCookTime || scaledTemp) && (
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            {scaledPrepTime && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mb-1">
                  <Clock size={14} />
                  <span>Prep</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {scaledPrepTime}
                  <span className="text-sm text-gray-600 ml-1">min</span>
                </p>
                {scaledPrepTime !== prepTime && (
                  <p className="text-xs text-gray-500">(was {prepTime}m)</p>
                )}
              </div>
            )}

            {scaledCookTime && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mb-1">
                  <Clock size={14} />
                  <span>Cook</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {scaledCookTime}
                  <span className="text-sm text-gray-600 ml-1">min</span>
                </p>
                {scaledCookTime !== cookingTime && (
                  <p className="text-xs text-gray-500">(was {cookingTime}m)</p>
                )}
              </div>
            )}

            {scaledTemp && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mb-1">
                  <Thermometer size={14} />
                  <span>Temp</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {scaledTemp}
                  <span className="text-sm text-gray-600 ml-1">°F</span>
                </p>
                {scaledTemp !== temperature && (
                  <p className="text-xs text-gray-500">(was {temperature}°F)</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <h4 className="text-md font-semibold text-gray-900 mb-3">Scaled Ingredients</h4>
        <div className="space-y-3">
          {scaledIngredients.map((ing, index) => {
            const percentage = getIngredientBar(ing.quantity);
            const originalQty = ingredients[index].quantity;
            const changed = ing.quantity !== originalQty;

            return (
              <div key={index} className="group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span
                        className={`font-medium ${
                          changed ? 'text-emerald-700' : 'text-gray-900'
                        }`}
                      >
                        {ing.quantity}
                      </span>
                      <span className="text-gray-700">{ing.item}</span>
                    </div>
                    {ing.notes && (
                      <p className="text-sm text-gray-600 mt-1">{ing.notes}</p>
                    )}
                    {changed && (
                      <p className="text-xs text-gray-500 mt-1">
                        Originally: {originalQty}
                      </p>
                    )}
                  </div>
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        changed ? 'bg-emerald-500' : 'bg-gray-400'
                      }`}
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {scaleFactor > 1.5 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Tip for larger batches:</strong> Consider using a larger pan and
            lowering the temperature slightly for more even cooking.
          </p>
        </div>
      )}

      {scaleFactor < 0.75 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Tip for smaller batches:</strong> Watch cooking time carefully as
            smaller portions may cook faster than expected.
          </p>
        </div>
      )}
    </div>
  );
}
