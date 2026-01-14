export enum FitnessGoal {
  STRENGTH = 'Strength',
  HYPERTROPHY = 'Muscle Building',
  WEIGHT_LOSS = 'Weight Loss',
  ENDURANCE = 'Endurance',
  GENERAL_HEALTH = 'General Health'
}

export enum FitnessLevel {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced'
}

export interface UserProfile {
  name: string;
  age: number;
  weight: number; // kg
  height: number; // cm
  goal: FitnessGoal;
  level: FitnessLevel;
  daysPerWeek: number;
  equipment: string;
  constraints: string;
  currentFormat: string; // e.g. "PPL", "Upper/Lower", "Full Body"
  hasPlan: boolean;
}

export interface ExerciseSet {
  reps: number;
  weight: number; // kg
  completed: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string; 
  targetSets: number;
  targetReps: string; 
  restTime: number; 
  actualSets: ExerciseSet[];
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  dayNumber: number; 
  name: string; 
  exercises: Exercise[];
  isRestDay: boolean;
  scheduledDate?: string; 
  completedDate?: string; 
}

export interface WorkoutPlan {
  id: string;
  title: string;
  durationWeeks: number;
  sessions: WorkoutSession[]; 
  startDate: string;
}

export interface NutritionLog {
  id: string;
  date: string; 
  mealName: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  imageUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastModified: string;
}

export enum AppView {
  ONBOARDING = 'ONBOARDING',
  DASHBOARD = 'DASHBOARD',
  WORKOUT = 'WORKOUT',
  NUTRITION = 'NUTRITION',
  ANALYTICS = 'ANALYTICS',
  COACH = 'COACH'
}