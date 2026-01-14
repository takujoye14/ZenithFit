import { UserProfile, WorkoutPlan, NutritionLog, ChatSession } from "../types";

const KEYS = {
  PROFILE: 'zenith_profile',
  WORKOUT_PLAN: 'zenith_workout_plan',
  NUTRITION_LOGS: 'zenith_nutrition_logs',
  EXERCISE_HISTORY: 'zenith_exercise_history',
  CHAT_SESSIONS: 'zenith_chat_sessions'
};

export const saveProfile = (profile: UserProfile) => {
  localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
};

export const getProfile = (): UserProfile | null => {
  const data = localStorage.getItem(KEYS.PROFILE);
  return data ? JSON.parse(data) : null;
};

export const saveWorkoutPlan = (plan: WorkoutPlan) => {
  localStorage.setItem(KEYS.WORKOUT_PLAN, JSON.stringify(plan));
};

export const getWorkoutPlan = (): WorkoutPlan | null => {
  const data = localStorage.getItem(KEYS.WORKOUT_PLAN);
  return data ? JSON.parse(data) : null;
};

export const saveNutritionLogs = (logs: NutritionLog[]) => {
  localStorage.setItem(KEYS.NUTRITION_LOGS, JSON.stringify(logs));
};

export const getNutritionLogs = (): NutritionLog[] => {
  const data = localStorage.getItem(KEYS.NUTRITION_LOGS);
  return data ? JSON.parse(data) : [];
};

export const saveExerciseHistory = (name: string, weight: number, reps: number) => {
  const history = getExerciseHistoryMap();
  history[name] = { weight, reps };
  localStorage.setItem(KEYS.EXERCISE_HISTORY, JSON.stringify(history));
};

export const getExerciseHistoryMap = (): Record<string, {weight: number, reps: number}> => {
  const data = localStorage.getItem(KEYS.EXERCISE_HISTORY);
  return data ? JSON.parse(data) : {};
};

export const saveChatSessions = (sessions: ChatSession[]) => {
  localStorage.setItem(KEYS.CHAT_SESSIONS, JSON.stringify(sessions));
};

export const getChatSessions = (): ChatSession[] => {
  const data = localStorage.getItem(KEYS.CHAT_SESSIONS);
  return data ? JSON.parse(data) : [];
};
