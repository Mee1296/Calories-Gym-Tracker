import { num } from './format';

export const EMPTY_TOTALS = { calories: 0, protein: 0, carbs: 0, fat: 0 };

export const emptyIngredient = () => ({ name: '', calories: '', protein: '', carbs: '', fat: '' });

export const emptyDraft = () => ({ name: '', ingredients: [], totals: { calories: '', protein: '', carbs: '', fat: '' } });

/** Atwater factors: 4 kcal/g protein and carbs, 9 kcal/g fat. */
export const caloriesFromMacros = ({ protein, carbs, fat }) =>
  Math.round(num(protein) * 4 + num(carbs) * 4 + num(fat) * 9);

const sumIngredients = (ingredients) =>
  ingredients.reduce((acc, i) => ({
    calories: acc.calories + num(i.calories),
    protein: acc.protein + num(i.protein),
    carbs: acc.carbs + num(i.carbs),
    fat: acc.fat + num(i.fat),
  }), { ...EMPTY_TOTALS });

const hasMacros = (ingredients) =>
  ingredients.some((i) => num(i.calories) || num(i.protein) || num(i.carbs) || num(i.fat));

/**
 * Resolves a draft to final numbers.
 * Ingredients win when they carry macros; otherwise the typed totals are used,
 * with calories derived from the macros when left blank.
 */
export const resolveDraft = (draft) => {
  const named = draft.ingredients.filter((i) => i.name.trim());

  if (hasMacros(draft.ingredients)) {
    const totals = sumIngredients(draft.ingredients);
    return {
      fromIngredients: true,
      calories: Math.round(totals.calories),
      protein: Math.round(totals.protein),
      carbs: Math.round(totals.carbs),
      fat: Math.round(totals.fat),
      ingredients: named,
    };
  }

  const { totals } = draft;
  const derived = caloriesFromMacros(totals);
  return {
    fromIngredients: false,
    calories: totals.calories === '' ? derived : Math.round(num(totals.calories)),
    protein: Math.round(num(totals.protein)),
    carbs: Math.round(num(totals.carbs)),
    fat: Math.round(num(totals.fat)),
    ingredients: named,
  };
};

/** Turns an API meal or dish into an editable draft. */
export const draftFromMeal = (meal) => ({
  name: meal.name || '',
  ingredients: (meal.ingredients || []).map((i) =>
    (typeof i === 'string'
      ? { ...emptyIngredient(), name: i }
      : {
        name: i.name || '',
        calories: String(i.calories ?? ''),
        protein: String(i.protein ?? ''),
        carbs: String(i.carbs ?? ''),
        fat: String(i.fat ?? ''),
      })),
  totals: {
    calories: String(meal.calories ?? ''),
    protein: String(meal.protein ?? ''),
    carbs: String(meal.carbs ?? ''),
    fat: String(meal.fat ?? ''),
  },
});

export const macroLine = (m) => `${m.protein}p · ${m.carbs}c · ${m.fat}f`;
