interface UnitConversion {
  [key: string]: { [key: string]: number };
}

const volumeConversions: UnitConversion = {
  'cup': { 'cup': 1, 'tbsp': 16, 'tsp': 48, 'ml': 236.588, 'l': 0.236588, 'fl oz': 8 },
  'tbsp': { 'cup': 1/16, 'tbsp': 1, 'tsp': 3, 'ml': 14.7868, 'fl oz': 0.5 },
  'tsp': { 'cup': 1/48, 'tbsp': 1/3, 'tsp': 1, 'ml': 4.92892 },
  'ml': { 'cup': 1/236.588, 'tbsp': 1/14.7868, 'tsp': 1/4.92892, 'ml': 1, 'l': 0.001 },
  'l': { 'cup': 4.22675, 'ml': 1000, 'l': 1 },
  'fl oz': { 'cup': 1/8, 'tbsp': 2, 'fl oz': 1, 'ml': 29.5735 },
};

const weightConversions: UnitConversion = {
  'lb': { 'lb': 1, 'oz': 16, 'g': 453.592, 'kg': 0.453592 },
  'oz': { 'lb': 1/16, 'oz': 1, 'g': 28.3495 },
  'g': { 'lb': 1/453.592, 'oz': 1/28.3495, 'g': 1, 'kg': 0.001 },
  'kg': { 'lb': 2.20462, 'g': 1000, 'kg': 1 },
};

const countUnits = ['count', 'whole', 'piece', 'item', 'clove', 'can', 'package', 'pkg'];

export function parseQuantity(quantity: string): { amount: number; unit: string; original: string } {
  const normalized = quantity.trim().toLowerCase();

  const fractionMap: { [key: string]: number } = {
    '¼': 0.25, '½': 0.5, '¾': 0.75,
    '⅓': 0.333, '⅔': 0.667,
    '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8,
    '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
  };

  let amount = 0;
  let remaining = normalized;

  for (const [symbol, value] of Object.entries(fractionMap)) {
    if (remaining.includes(symbol)) {
      amount += value;
      remaining = remaining.replace(symbol, '');
    }
  }

  const fractionMatch = remaining.match(/(\d+)\/(\d+)/);
  if (fractionMatch) {
    amount += parseInt(fractionMatch[1]) / parseInt(fractionMatch[2]);
    remaining = remaining.replace(fractionMatch[0], '');
  }

  const numberMatch = remaining.match(/(\d+\.?\d*)/);
  if (numberMatch) {
    amount += parseFloat(numberMatch[1]);
    remaining = remaining.replace(numberMatch[1], '');
  }

  if (amount === 0) amount = 1;

  const unit = remaining.trim()
    .replace(/cups?/i, 'cup')
    .replace(/tablespoons?|tbsps?/i, 'tbsp')
    .replace(/teaspoons?|tsps?/i, 'tsp')
    .replace(/pounds?|lbs?/i, 'lb')
    .replace(/ounces?|oz/i, 'oz')
    .replace(/grams?|g/i, 'g')
    .replace(/kilograms?|kg/i, 'kg')
    .replace(/milliliters?|ml/i, 'ml')
    .replace(/liters?|l/i, 'l')
    .replace(/fluid\s*ounces?|fl\s*oz/i, 'fl oz')
    .replace(/cloves?/i, 'clove')
    .replace(/cans?/i, 'can')
    .replace(/packages?|pkgs?/i, 'package')
    .trim() || 'count';

  return { amount, unit, original: quantity };
}

export function formatQuantity(amount: number, unit: string): string {
  if (amount === 0) return '0';

  const tolerance = 0.01;
  const fractions = [
    { value: 0.125, display: '⅛' },
    { value: 0.166, display: '⅙' },
    { value: 0.2, display: '⅕' },
    { value: 0.25, display: '¼' },
    { value: 0.333, display: '⅓' },
    { value: 0.375, display: '⅜' },
    { value: 0.4, display: '⅖' },
    { value: 0.5, display: '½' },
    { value: 0.6, display: '⅗' },
    { value: 0.625, display: '⅝' },
    { value: 0.666, display: '⅔' },
    { value: 0.75, display: '¾' },
    { value: 0.8, display: '⅘' },
    { value: 0.875, display: '⅞' },
  ];

  const wholeNumber = Math.floor(amount);
  const decimal = amount - wholeNumber;

  if (decimal < tolerance) {
    return wholeNumber > 0 ? `${wholeNumber}` : '';
  }

  for (const frac of fractions) {
    if (Math.abs(decimal - frac.value) < tolerance) {
      return wholeNumber > 0
        ? `${wholeNumber} ${frac.display}`
        : frac.display;
    }
  }

  return amount.toFixed(2).replace(/\.?0+$/, '');
}

export function convertUnit(amount: number, fromUnit: string, toUnit: string): number | null {
  const from = fromUnit.toLowerCase().trim();
  const to = toUnit.toLowerCase().trim();

  if (from === to) return amount;

  if (volumeConversions[from] && volumeConversions[from][to]) {
    return amount * volumeConversions[from][to];
  }

  if (weightConversions[from] && weightConversions[from][to]) {
    return amount * weightConversions[from][to];
  }

  return null;
}

export function smartConvertForDisplay(amount: number, unit: string): { amount: number; unit: string } {
  const u = unit.toLowerCase().trim();

  if (u === 'cup' && amount < 0.5) {
    const tbsp = convertUnit(amount, 'cup', 'tbsp');
    if (tbsp && tbsp >= 1) {
      return { amount: tbsp, unit: 'tbsp' };
    }
    const tsp = convertUnit(amount, 'cup', 'tsp');
    if (tsp) {
      return { amount: tsp, unit: 'tsp' };
    }
  }

  if (u === 'tbsp' && amount < 1) {
    const tsp = convertUnit(amount, 'tbsp', 'tsp');
    if (tsp) {
      return { amount: tsp, unit: 'tsp' };
    }
  }

  if (u === 'tbsp' && amount >= 16) {
    const cups = convertUnit(amount, 'tbsp', 'cup');
    if (cups) {
      return { amount: cups, unit: 'cup' };
    }
  }

  if (u === 'tsp' && amount >= 3) {
    const tbsp = convertUnit(amount, 'tsp', 'tbsp');
    if (tbsp && tbsp < 16) {
      return { amount: tbsp, unit: 'tbsp' };
    }
  }

  return { amount, unit };
}

export function scaleIngredient(quantity: string, scaleFactor: number): string {
  const parsed = parseQuantity(quantity);
  const scaledAmount = parsed.amount * scaleFactor;

  if (countUnits.includes(parsed.unit)) {
    const rounded = Math.round(scaledAmount * 2) / 2;

    if (parsed.unit === 'count' && Math.abs(scaledAmount - Math.floor(scaledAmount)) > 0.4) {
      const whole = Math.floor(scaledAmount);
      const fraction = scaledAmount - whole;
      if (fraction > 0.4 && fraction < 0.6) {
        return whole > 0 ? `${whole} ${parsed.unit} + half` : 'half';
      }
    }

    return `${formatQuantity(rounded, parsed.unit)} ${parsed.unit}`.trim();
  }

  const converted = smartConvertForDisplay(scaledAmount, parsed.unit);
  return `${formatQuantity(converted.amount, converted.unit)} ${converted.unit}`.trim();
}

export function adjustCookingTime(originalTime: number, scaleFactor: number): number {
  if (scaleFactor === 1) return originalTime;

  if (scaleFactor > 1) {
    const increase = Math.sqrt(scaleFactor);
    return Math.round(originalTime * (1 + (increase - 1) * 0.3));
  } else {
    const decrease = Math.sqrt(scaleFactor);
    return Math.round(originalTime * (0.85 + decrease * 0.15));
  }
}

export function adjustTemperature(originalTemp: number, scaleFactor: number): number {
  if (scaleFactor === 1 || scaleFactor < 0.5 || scaleFactor > 2) return originalTemp;

  if (scaleFactor > 1.5) {
    return Math.max(300, originalTemp - 25);
  } else if (scaleFactor < 0.75) {
    return Math.min(450, originalTemp + 25);
  }

  return originalTemp;
}

export function getServingSizes(originalServings: string): number[] {
  const match = originalServings.match(/(\d+)/);
  const base = match ? parseInt(match[1]) : 4;

  const sizes = [1, 2, 4, 6, 8, 12, 16, 20, 24];

  if (!sizes.includes(base)) {
    sizes.push(base);
    sizes.sort((a, b) => a - b);
  }

  return sizes;
}
