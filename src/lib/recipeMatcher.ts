interface FridgeItem {
  ingredient_name: string;
  quantity: number;
  unit: string;
}

interface Recipe {
  id: string;
  title: string;
  ingredients: Array<{
    item: string;
    quantity: string;
  }>;
  cooking_time?: number;
  prep_time?: number;
}

interface MatchResult {
  recipe: Recipe;
  matchScore: number;
  matchedIngredients: string[];
  missingIngredients: string[];
  totalIngredients: number;
}

export function normalizeIngredient(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/s$/, '')
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ');
}

export function ingredientsMatch(recipeIng: string, fridgeIng: string): boolean {
  const normalized1 = normalizeIngredient(recipeIng);
  const normalized2 = normalizeIngredient(fridgeIng);

  if (normalized1 === normalized2) return true;

  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) return true;

  const commonAliases: { [key: string]: string[] } = {
    chicken: ['chicken breast', 'chicken thigh', 'poultry'],
    beef: ['ground beef', 'steak', 'chuck'],
    tomato: ['tomatoes', 'cherry tomatoes', 'roma tomatoes'],
    onion: ['onions', 'yellow onion', 'white onion', 'red onion'],
    garlic: ['garlic clove', 'fresh garlic', 'minced garlic'],
    butter: ['unsalted butter', 'salted butter'],
    milk: ['whole milk', '2% milk', 'skim milk'],
    cheese: ['cheddar', 'mozzarella', 'parmesan'],
  };

  for (const [base, aliases] of Object.entries(commonAliases)) {
    if (
      (normalized1.includes(base) || aliases.some((a) => normalized1.includes(a))) &&
      (normalized2.includes(base) || aliases.some((a) => normalized2.includes(a)))
    ) {
      return true;
    }
  }

  return false;
}

export function calculateMatchScore(
  recipe: Recipe,
  fridgeItems: FridgeItem[]
): MatchResult {
  const recipeIngredients = recipe.ingredients || [];
  const totalIngredients = recipeIngredients.length;

  if (totalIngredients === 0) {
    return {
      recipe,
      matchScore: 0,
      matchedIngredients: [],
      missingIngredients: [],
      totalIngredients: 0,
    };
  }

  const matchedIngredients: string[] = [];
  const missingIngredients: string[] = [];

  for (const recipeIng of recipeIngredients) {
    const ingName = recipeIng.item;
    let matched = false;

    for (const fridgeItem of fridgeItems) {
      if (ingredientsMatch(ingName, fridgeItem.ingredient_name)) {
        matchedIngredients.push(ingName);
        matched = true;
        break;
      }
    }

    if (!matched) {
      missingIngredients.push(ingName);
    }
  }

  const matchScore = Math.round((matchedIngredients.length / totalIngredients) * 100);

  return {
    recipe,
    matchScore,
    matchedIngredients,
    missingIngredients,
    totalIngredients,
  };
}

export function matchRecipesWithInventory(
  recipes: Recipe[],
  fridgeItems: FridgeItem[]
): MatchResult[] {
  const results = recipes.map((recipe) => calculateMatchScore(recipe, fridgeItems));

  return results.sort((a, b) => b.matchScore - a.matchScore);
}

export function suggestSubstitutions(missingIngredient: string): string[] {
  const substitutions: { [key: string]: string[] } = {
    butter: ['coconut oil', 'vegetable oil', 'margarine'],
    milk: ['almond milk', 'soy milk', 'coconut milk', 'oat milk'],
    egg: ['flax egg', 'chia egg', 'applesauce', 'banana'],
    'sour cream': ['greek yogurt', 'plain yogurt'],
    'heavy cream': ['half and half', 'evaporated milk'],
    sugar: ['honey', 'maple syrup', 'agave nectar'],
    'all-purpose flour': ['whole wheat flour', 'almond flour', 'oat flour'],
    'chicken breast': ['chicken thigh', 'turkey breast', 'tofu'],
    'ground beef': ['ground turkey', 'ground chicken', 'plant-based meat'],
  };

  const normalized = normalizeIngredient(missingIngredient);

  for (const [key, subs] of Object.entries(substitutions)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return subs;
    }
  }

  return [];
}
