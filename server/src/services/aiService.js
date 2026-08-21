const { GoogleGenAI, Type } = require('@google/genai');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { toPositive } = require('../utils/numbers');

let client = null;
const getClient = () => {
  if (!env.hasAI) throw ApiError.unavailable('AI estimates are not configured on this server');
  if (!client) client = new GoogleGenAI({ apiKey: env.geminiApiKey });
  return client;
};

const NUMBER = { type: Type.NUMBER };

const MACRO_SCHEMA = {
  type: Type.OBJECT,
  properties: { calories: NUMBER, protein: NUMBER, carbs: NUMBER, fat: NUMBER },
  required: ['calories', 'protein', 'carbs', 'fat'],
};

const MEAL_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    calories: NUMBER,
    protein: NUMBER,
    carbs: NUMBER,
    fat: NUMBER,
    ingredients: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { name: { type: Type.STRING }, calories: NUMBER, protein: NUMBER, carbs: NUMBER, fat: NUMBER },
        required: ['name', 'calories', 'protein', 'carbs', 'fat'],
      },
    },
  },
  required: ['name', 'calories', 'protein', 'carbs', 'fat', 'ingredients'],
};

/** Asks Gemini for a JSON object matching `schema` and parses it. */
const generateJSON = async ({ prompt, schema, systemInstruction }) => {
  const ai = getClient();
  let response;
  try {
    response = await ai.models.generateContent({
      model: env.geminiModel,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        ...(systemInstruction ? { systemInstruction } : {}),
      },
    });
  } catch (err) {
    console.error('Gemini request failed:', err);
    throw ApiError.unavailable('The AI estimate service is unavailable right now');
  }

  try {
    return JSON.parse(response.text);
  } catch {
    throw ApiError.unavailable('Could not read the AI response');
  }
};

const roundMacros = (raw) => ({
  calories: Math.round(toPositive(raw.calories, 0)),
  protein: Math.round(toPositive(raw.protein, 0)),
  carbs: Math.round(toPositive(raw.carbs, 0)),
  fat: Math.round(toPositive(raw.fat, 0)),
});

/** Estimates a meal's macros, broken down by ingredient where it can. */
const estimateMeal = async (description) => {
  if (!description?.trim()) throw ApiError.badRequest('Describe the meal first');

  const raw = await generateJSON({
    systemInstruction:
      'You are a nutrition estimator. Return realistic per-serving values for a single meal. '
      + 'Use kcal for calories and grams for macros. Prefer typical home or restaurant portions when none is given.',
    prompt: `Estimate the nutrition for this meal: "${description.trim()}".
Break it into its main ingredients with per-ingredient values that add up to the meal totals.
Give the meal a short, tidy display name.`,
    schema: MEAL_SCHEMA,
  });

  return {
    name: raw.name?.trim() || description.trim(),
    ...roundMacros(raw),
    ingredients: (raw.ingredients || [])
      .filter((i) => i?.name?.trim())
      .map((i) => ({ name: i.name.trim(), ...roundMacros(i) })),
  };
};

/** Suggests daily calorie and macro targets from the user's metrics. */
const suggestGoals = async (metrics) => {
  const { weightKg, heightCm, age, gender, bodyFat, activityLevel, goal } = metrics;
  if (!weightKg || !heightCm || !age) {
    throw ApiError.badRequest('Weight, height and age are needed for a suggestion');
  }

  const raw = await generateJSON({
    systemInstruction:
      'You are a sports nutritionist. Estimate TDEE with the Mifflin-St Jeor equation '
      + '(or Katch-McArdle when body fat is known), apply the activity multiplier, then adjust for the goal. '
      + 'Return whole numbers only.',
    prompt: `Metrics:
- Weight: ${weightKg} kg
- Height: ${heightCm} cm
- Age: ${age}
- Gender: ${gender || 'unspecified'}
- Body fat: ${bodyFat ? `${bodyFat}%` : 'unknown'}
- Activity level: ${activityLevel || 'moderately active'}
- Goal: ${goal || 'maintain'}

Give daily calories and a protein/carb/fat split that supports the goal.`,
    schema: MACRO_SCHEMA,
  });

  return roundMacros(raw);
};

module.exports = { estimateMeal, suggestGoals, isConfigured: () => env.hasAI };
