const Meal = require('../models/Meal');
const User = require('../models/User');
const { GoogleGenAI } = require('@google/genai');

exports.getDailyData = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const meals = await Meal.find({ userId: req.user.id }).sort({ createdAt: -1 });

    res.json({
      meals,
      goals: {
        calories: user.targetCalories || 2000,
        protein: user.targetProtein || 150,
        carbs: user.targetCarbs || 200,
        fat: user.targetFat || 70
      }
    });
  } catch (err) {
    console.error('getDailyData error:', err);
    res.status(500).send(err.message);
  }
};

exports.logMeal = async (req, res) => {
  try {
    const { name, calories, protein, carbs, fat } = req.body;
    const newMeal = new Meal({
      userId: req.user.id,
      name,
      calories,
      protein,
      carbs,
      fat
    });
    await newMeal.save();
    res.json(newMeal);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.updateGoals = async (req, res) => {
  try {
    const { calories, protein, carbs, fat } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, {
      targetCalories: calories,
      targetProtein: protein,
      targetCarbs: carbs,
      targetFat: fat
    }, { new: true });
    res.json({
      calories: user.targetCalories,
      protein: user.targetProtein,
      carbs: user.targetCarbs,
      fat: user.targetFat
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.aiParseMeal = async (req, res) => {
  try {
    const { dishName } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).send('GEMINI_API_KEY not configured');
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `The user wants to know the calories (kcal) and nutritional information (protein, carbs, fat) for this dish: "${dishName}". 
    Please estimate the values and return ONLY a JSON object with these exact keys: calories, protein, carbs, fat. 
    Use numbers (integers) for values (kcal for calories, grams for others). 
    If you're unsure, give a reasonable average.
    Example: {"calories": 450, "protein": 25, "carbs": 40, "fat": 15}`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });
    const text = result.text;
    
    // Extract JSON from response (sometimes Gemini wraps it in markdown)
    const jsonMatch = text.match(/\{.*\}/s);
    if (!jsonMatch) throw new Error('Failed to parse AI response');
    
    const nutrition = JSON.parse(jsonMatch[0]);
    
    // Save it automatically
    const newMeal = new Meal({
      userId: req.user.id,
      name: dishName,
      ...nutrition
    });
    await newMeal.save();
    
    res.json(newMeal);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
};

exports.aiSuggestGoals = async (req, res) => {
  try {
    const { weight, height, age, gender, bodyFat, activityLevel, goal } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).send('GEMINI_API_KEY not configured');
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `Calculate the daily nutritional requirements for a person with the following metrics:
    - Weight: ${weight} kg
    - Height: ${height} cm
    - Age: ${age} years
    - Gender: ${gender}
    - Body Fat %: ${bodyFat || 'not provided'}
    - Activity Level: ${activityLevel} (e.g., sedentary, lightly active, moderately active, very active, extra active)
    - Primary Goal: ${goal || 'maintain weight'} (e.g., lose weight, gain muscle, maintain)

    Provide a scientific estimate for their Total Daily Energy Expenditure (TDEE) and suggest a daily macronutrient breakdown (protein, carbs, fat).
    
    Return ONLY a JSON object with these exact keys: calories, protein, carbs, fat.
    - calories: Total daily calories (kcal)
    - protein: Daily protein (grams)
    - carbs: Daily carbohydrates (grams)
    - fat: Daily fats (grams)
    
    Use integers for all values. 
    Example: {"calories": 2500, "protein": 180, "carbs": 250, "fat": 80}`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });
    const text = result.text;
    
    const jsonMatch = text.match(/\{.*\}/s);
    if (!jsonMatch) throw new Error('Failed to parse AI response');
    
    const suggestedGoals = JSON.parse(jsonMatch[0]);
    res.json(suggestedGoals);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
};
