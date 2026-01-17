import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Onboarding from './components/Onboarding';
import WorkoutView from './components/WorkoutView';
import NutritionView from './components/NutritionView';
import AnalyticsView from './components/AnalyticsView';
import CoachView from './components/CoachView';
import ProfileView from './components/ProfileView';
import { AppView, UserProfile, WorkoutPlan, NutritionLog } from './types';
import { getProfile, saveProfile, getWorkoutPlan, saveWorkoutPlan, getNutritionLogs, saveNutritionLogs } from './services/storageService';
import { generateWorkoutPlanAI } from './services/geminiService';
import { LogOut, Activity, Flame, Trophy, Zap, ArrowRight, Star, Dumbbell } from 'lucide-react';
import { auth } from './src/firebase-config';
import { signOut, onAuthStateChanged } from 'firebase/auth';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.ONBOARDING);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Listener for Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadData();
      } else {
        // Clear state on logout
        setProfile(null);
        setWorkoutPlan(null);
        setNutritionLogs([]);
        setView(AppView.ONBOARDING);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadData = async () => {
    try {
      const savedProfile = await getProfile();
      // Only proceed if a profile actually exists
      if (savedProfile) {
        const savedPlan = await getWorkoutPlan();
        const savedLogs = await getNutritionLogs();

        setProfile(savedProfile);
        setNutritionLogs(savedLogs);
        
        if (savedProfile.hasPlan && savedPlan) {
          setWorkoutPlan(savedPlan);
          setView(AppView.DASHBOARD);
        } else {
          setView(AppView.ONBOARDING);
        }
      } else {
        // No profile found, ensure we stay on onboarding
        setView(AppView.ONBOARDING);
      }
    } catch (error) {
      console.error("Firebase fetch failed, staying on onboarding:", error);
      setView(AppView.ONBOARDING); // Force onboarding view even if fetch fails
    }
  };

  const handleOnboardingComplete = async (newProfile: UserProfile) => {
    setIsGenerating(true);
    try {
      const sessions = await generateWorkoutPlanAI(newProfile);
      const newPlan: WorkoutPlan = {
        id: crypto.randomUUID(),
        title: `${newProfile.goal} Plan`,
        durationWeeks: 4,
        sessions: sessions,
        startDate: new Date().toISOString()
      };

      await saveWorkoutPlan(newPlan);
      const updatedProfile = { ...newProfile, hasPlan: true };
      await saveProfile(updatedProfile);

      setWorkoutPlan(newPlan);
      setProfile(updatedProfile);
      setView(AppView.DASHBOARD);
    } catch (error) {
      console.error("AI/Firebase Error:", error);
      alert("Failed to initialize your plan. Please check your connection.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // State is cleared by the onAuthStateChanged listener above
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleUpdatePlan = async (updatedPlan: WorkoutPlan) => {
    setWorkoutPlan(updatedPlan);
    await saveWorkoutPlan(updatedPlan);
  };

  const handleAddNutritionLog = async (log: NutritionLog) => {
    const newLogs = [log, ...nutritionLogs];
    setNutritionLogs(newLogs);
    await saveNutritionLogs(newLogs);
  };

  const Dashboard = () => {
    if (!profile || !workoutPlan) return null;

    const completedWorkouts = workoutPlan.sessions.filter(s => s.completedDate).length;
    const nextWorkout = workoutPlan.sessions.find(s => !s.completedDate);
    const todayLog = nutritionLogs.filter(l => l.date.startsWith(new Date().toISOString().split('T')[0]));
    const caloriesToday = todayLog.reduce((acc, curr) => acc + curr.calories, 0);

    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-10">
        <header className="flex justify-between items-start">
          <div className="flex items-center gap-6">
            <img src="/logo.png" alt="ZenithFit Logo" className="w-24 h-24 rounded-2xl border border-white/10 shadow-2xl" />
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white mb-1">
                Hey, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">{profile.name}</span>
              </h1>
              <p className="text-slate-400 font-medium">Your goal: {profile.goal}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Logout Button */}
            <button 
              onClick={handleLogout}
              className="p-3 bg-slate-900/50 hover:bg-red-500/10 border border-white/5 rounded-2xl text-slate-500 hover:text-red-400 transition-all group"
              title="Sign Out"
            >
              <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            </button>

            {/* <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800 shadow-2xl">
                <Trophy className="text-amber-400 w-7 h-7" />
              </div>
            </div> */}
          </div>
        </header>

        {/* Dynamic Metric Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card p-6 rounded-3xl group">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">Consistency</span>
            </div>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-black text-white">{completedWorkouts}</p>
              <p className="text-slate-500 text-sm font-bold">/ {workoutPlan.sessions.length}</p>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-indigo-300 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                style={{ width: `${(completedWorkouts / workoutPlan.sessions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-3xl group">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-2xl bg-fuchsia-500/10 text-fuchsia-400 group-hover:bg-fuchsia-500 group-hover:text-white transition-all duration-300">
                <Flame className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">Energy</span>
            </div>
            <p className="text-3xl font-black text-white">{caloriesToday.toLocaleString()}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">kcal burned today</p>
          </div>
        </div>

        {/* Hero Workout Card */}
        <div className="relative glass-card rounded-[2.5rem] p-8 overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] scale-150 rotate-12 transition-transform duration-700 group-hover:scale-[1.7] group-hover:rotate-[20deg]">
            <Dumbbell size={200} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/20">
                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Today's Focus</span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">• Schedule</span>
            </div>

            {nextWorkout ? (
              <>
                <h2 className="text-4xl font-black text-white mb-2 leading-tight">
                  {nextWorkout.name}
                </h2>
                <div className="flex flex-wrap gap-2 mb-8">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 backdrop-blur-md">
                    <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-bold text-slate-300">{nextWorkout.exercises.length} Exercises</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 backdrop-blur-md">
                    <Star className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
                    <span className="text-xs font-bold text-slate-300">{profile.level}</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => setView(AppView.WORKOUT)}
                  className="w-full bg-white text-slate-950 font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-3 group transition-all duration-300 hover:bg-indigo-400 hover:text-white"
                >
                  START SESSION <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </>
            ) : (
              <div className="py-10 text-center">
                <Trophy className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-400 font-bold">Week Complete! New plan coming soon.</p>
              </div>
            )}
          </div>
        </div>

        {/* Motivational Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 to-indigo-950 border border-indigo-500/10 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                 <Zap className="fill-current" />
              </div>
              <div>
                 <p className="text-white font-black text-sm uppercase italic tracking-widest">Growth Mindset</p>
                 <p className="text-slate-500 text-xs">"Consistency beats intensity."</p>
              </div>
           </div>
        </div>
      </div>
    );
  };

  if (!profile || !profile.hasPlan || view === AppView.ONBOARDING) {
    return <Onboarding onComplete={handleOnboardingComplete} isGenerating={isGenerating} />;
  }

  return (
    <Layout currentView={view} onChangeView={setView}>
      {view === AppView.DASHBOARD && <Dashboard />}
      {view === AppView.WORKOUT && workoutPlan && <WorkoutView plan={workoutPlan} onUpdatePlan={handleUpdatePlan} />}
      {view === AppView.COACH && <CoachView profile={profile} />}
      {view === AppView.ANALYTICS && workoutPlan && <AnalyticsView plan={workoutPlan} />}
      {view === AppView.PROFILE && <ProfileView profile={profile} onLogout={handleLogout} />}
      {view === AppView.NUTRITION && profile && (<NutritionView logs={nutritionLogs} profile={profile} onAddLog={handleAddNutritionLog} />)}
    </Layout>
  );
};

export default App;