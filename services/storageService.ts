import { auth, db } from "../src/firebase-config";
import { doc, setDoc, getDoc, updateDoc, arrayUnion, collection, getDocs, query, orderBy } from "firebase/firestore";
import { UserProfile, WorkoutPlan, NutritionLog, ChatSession, ChatMessage } from "../types";

// Helper to get the current identifier (Email based)
const getAuthUserId = () => {
  const user = auth.currentUser;
  if (!user) {
    console.warn("No authenticated user found, falling back to default_user");
    return "default_user"; 
  }
  return user.email || user.uid;
};

/**
 * PROFILE & BIOMETRICS
 */
export const saveProfile = async (profile: UserProfile) => {
  const identifier = getAuthUserId();
  await setDoc(doc(db, "users", identifier), profile);
};

export const getProfile = async (): Promise<UserProfile | null> => {
  const identifier = getAuthUserId();
  const docSnap = await getDoc(doc(db, "users", identifier));
  return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
};

/**
 * WORKOUT DATA
 */
export const saveWorkoutPlan = async (plan: WorkoutPlan) => {
  const identifier = getAuthUserId();
  await setDoc(doc(db, "users", identifier, "data", "workout_plan"), plan);
};

export const getWorkoutPlan = async (): Promise<WorkoutPlan | null> => {
  const identifier = getAuthUserId();
  const docSnap = await getDoc(doc(db, "users", identifier, "data", "workout_plan"));
  return docSnap.exists() ? (docSnap.data() as WorkoutPlan) : null;
};

/**
 * NUTRITION DATA
 */
export const saveNutritionLogs = async (logs: NutritionLog[]) => {
  const identifier = getAuthUserId();
  await setDoc(doc(db, "users", identifier, "data", "nutrition"), { logs });
};

export const getNutritionLogs = async (): Promise<NutritionLog[]> => {
  const identifier = getAuthUserId();
  const docSnap = await getDoc(doc(db, "users", identifier, "data", "nutrition"));
  return docSnap.exists() ? (docSnap.data().logs as NutritionLog[]) : [];
};

/**
 * EXERCISE HISTORY
 */
export const saveExerciseHistory = async (name: string, weight: number, reps: number) => {
  const identifier = getAuthUserId();
  const docRef = doc(db, "users", identifier, "data", "exercise_history");
  try {
    await setDoc(docRef, {
      [name]: { weight, reps }
    }, { merge: true }); 
  } catch (error) {
    console.error("Error saving exercise history:", error);
  }
};

export const getExerciseHistoryMap = async (): Promise<Record<string, {weight: number, reps: number}>> => {
  const identifier = getAuthUserId();
  const docSnap = await getDoc(doc(db, "users", identifier, "data", "exercise_history"));
  return docSnap.exists() ? docSnap.data() as Record<string, {weight: number, reps: number}> : {};
};

/**
 * MULTI-SESSION COACH CHAT
 * Restructured to support a collection of separate conversations
 */

// 1. Fetch all previous sessions for the sidebar
export const getChatSessions = async (): Promise<ChatSession[]> => {
  const identifier = getAuthUserId();
  const sessionsCol = collection(db, "users", identifier, "chat_sessions");
  
  try {
    const q = query(sessionsCol, orderBy("lastModified", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as ChatSession);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return [];
  }
};

// 2. Initialize a brand new session document
export const saveChatSessionMetadata = async (session: ChatSession) => {
  const identifier = getAuthUserId();
  const sessionRef = doc(db, "users", identifier, "chat_sessions", session.id);
  await setDoc(sessionRef, session);
};

// 3. Append messages to a specific session
export const appendMessageToSession = async (sessionId: string, userText: string, aiText: string) => {
  const identifier = getAuthUserId();
  const sessionRef = doc(db, "users", identifier, "chat_sessions", sessionId);

  const newMessages = [
    { 
      id: crypto.randomUUID(), 
      role: 'user', 
      text: userText, 
      timestamp: new Date().toISOString() 
    },
    { 
      id: crypto.randomUUID(), 
      role: 'model', 
      text: aiText, 
      timestamp: new Date().toISOString() 
    }
  ];

  try {
    await updateDoc(sessionRef, {
      messages: arrayUnion(...newMessages),
      lastModified: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error updating session messages:", error);
  }
};