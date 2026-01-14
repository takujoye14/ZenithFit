import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, WorkoutSession, NutritionLog } from "../types";

// gemini-2.0-flash is the current supported model for v1beta
const MODEL_NAME = 'gemini-2.0-flash';

export const generateWorkoutPlanAI = async (profile: UserProfile): Promise<WorkoutSession[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Create a highly personalized weekly workout routine for a user with the following profile:
    - Name: ${profile.name}
    - Level: ${profile.level}
    - Goal: ${profile.goal}
    - Training Format Preference: ${profile.currentFormat}
    - Frequency: ${profile.daysPerWeek} days per week
    - Equipment: ${profile.equipment}
    - Constraints: ${profile.constraints || 'None'}

    The output should be a list of daily sessions for one week (7 days).
    Mark rest days explicitly based on the user's frequency.
    For exercise days, provide specific exercises tailored to their format (${profile.currentFormat}).
    IMPORTANT: For each exercise, strictly categorize the 'muscleGroup' into one of: 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio'.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        description: "A list of 7 daily sessions representing a weekly schedule.",
        items: {
          type: Type.OBJECT,
          properties: {
            dayNumber: { type: Type.INTEGER },
            name: { type: Type.STRING },
            isRestDay: { type: Type.BOOLEAN },
            exercises: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  muscleGroup: { type: Type.STRING },
                  targetSets: { type: Type.INTEGER },
                  targetReps: { type: Type.STRING },
                  restTime: { type: Type.INTEGER },
                }
              }
            }
          },
          required: ["dayNumber", "name", "isRestDay", "exercises"]
        }
      }
    }
  });

  if (response.text) {
    const rawSessions = JSON.parse(response.text);
    return rawSessions.map((session: any) => ({
      ...session,
      id: crypto.randomUUID(),
      exercises: (session.exercises || []).map((ex: any) => ({
        ...ex,
        id: crypto.randomUUID(),
        actualSets: []
      }))
    }));
  }
  
  throw new Error("Failed to generate workout plan");
};

export const analyzeFoodImageAI = async (base64Image: string): Promise<Partial<NutritionLog>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");
  const prompt = "Analyze this food image. Identify the meal name and estimate total calories, protein (g), fat (g), and carbs (g).";

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
        { text: prompt }
      ]
    }],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          mealName: { type: Type.STRING },
          calories: { type: Type.INTEGER },
          protein: { type: Type.INTEGER },
          fat: { type: Type.INTEGER },
          carbs: { type: Type.INTEGER },
        },
        required: ["mealName", "calories", "protein", "fat", "carbs"]
      }
    }
  });

  if (response.text) {
    return JSON.parse(response.text);
  }
  throw new Error("Failed to analyze food image");
};

export const generateFoodImageAI = async (mealName: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash', // Use 2.0 Flash for image reasoning
    contents: [{
      role: 'user',
      parts: [
        { text: `A realistic, high-quality photograph of a delicious plate of ${mealName} on a clean table.` },
      ],
    }]
  });
  
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return '';
};

export const getCoachAdviceAIStream = async (
  profile: UserProfile, 
  message: string,
  history: {role: 'user' | 'model', text: string}[] = []
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const systemPrompt = `You are Zenith, a world-class personal trainer and holistic coach. 
Talk like a human, not a robot. Be concise, direct, and supportive. Use natural language, contractions, and occasionally casual fillers like "Listen," "Look," or "Got it." 
Avoid robotic lists unless requested. Focus on science-based, practical advice. 
The user's goal is ${profile.goal} and they are at the ${profile.level} level. 
Their current training format is ${profile.currentFormat}.
Respond as if we're in a real conversation.`;

  return ai.models.generateContentStream({
    model: MODEL_NAME,
    contents: [
      { role: 'user', parts: [{ text: systemPrompt }] },
      ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
      { role: 'user', parts: [{ text: message }] }
    ]
  });
};