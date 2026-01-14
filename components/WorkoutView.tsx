import React, { useState, useEffect } from 'react';
import { WorkoutPlan, WorkoutSession, Exercise } from '../types';
import { saveExerciseHistory, getExerciseHistoryMap } from '../services/storageService';
import { ChevronLeft, CheckCircle, Circle, Calendar, Dumbbell, Save, Lock, Zap, Clock, Info } from 'lucide-react';

interface WorkoutViewProps {
  plan: WorkoutPlan;
  onUpdatePlan: (plan: WorkoutPlan) => void;
}

const WorkoutView: React.FC<WorkoutViewProps> = ({ plan, onUpdatePlan }) => {
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);

  const currentSession = plan.sessions.find(s => s.dayNumber === selectedDay);
  
  const isDayLocked = (dayNumber: number) => {
    const startDate = new Date(plan.startDate);
    const targetDate = new Date(startDate);
    targetDate.setDate(targetDate.getDate() + (dayNumber - 1));
    targetDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today < targetDate;
  };

  const handleStartWorkout = () => {
    if (currentSession && !currentSession.isRestDay && !isDayLocked(currentSession.dayNumber)) {
      const history = getExerciseHistoryMap();
      const hydratedExercises = currentSession.exercises.map(ex => {
        if (ex.actualSets.length === 0 && history[ex.name]) {
          const { weight, reps } = history[ex.name];
          const sets = Array.from({ length: ex.targetSets }).map(() => ({
            weight,
            reps,
            completed: false
          }));
          return { ...ex, actualSets: sets };
        }
        return ex;
      });
      setActiveSession({ ...currentSession, exercises: hydratedExercises });
    }
  };

  const updateSet = (exerciseId: string, setIndex: number, field: 'reps' | 'weight' | 'completed', value: any) => {
    if (!activeSession) return;
    const updatedExercises = activeSession.exercises.map(ex => {
      if (ex.id !== exerciseId) return ex;
      const newSets = [...ex.actualSets];
      if (!newSets[setIndex]) newSets[setIndex] = { reps: 0, weight: 0, completed: false };
      newSets[setIndex] = { ...newSets[setIndex], [field]: value };
      return { ...ex, actualSets: newSets };
    });
    setActiveSession({ ...activeSession, exercises: updatedExercises });
  };

  const finishWorkout = () => {
    if (!activeSession) return;
    activeSession.exercises.forEach(ex => {
      const lastSet = ex.actualSets[ex.actualSets.length - 1];
      if (lastSet && lastSet.completed) {
        saveExerciseHistory(ex.name, lastSet.weight, lastSet.reps);
      }
    });
    const updatedSessions = plan.sessions.map(s => 
      s.id === activeSession.id ? { ...activeSession, completedDate: new Date().toISOString() } : s
    );
    onUpdatePlan({ ...plan, sessions: updatedSessions });
    setActiveSession(null);
  };

  if (activeSession) {
    return (
      <div className="max-w-2xl mx-auto animate-in fade-in duration-500 pb-20">
        <div className="flex items-center justify-between mb-8 sticky top-0 glass py-6 z-20 px-4 -mx-4 border-b border-white/5">
          <button onClick={() => setActiveSession(null)} className="p-2 rounded-xl bg-slate-900 text-slate-400"><ChevronLeft className="w-6 h-6" /></button>
          <div className="text-center">
            <h2 className="text-xl font-black text-white">{activeSession.name}</h2>
            <p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em]">In Progress</p>
          </div>
          <button onClick={finishWorkout} className="px-5 py-2 rounded-xl bg-indigo-500 text-white font-black text-xs hover:bg-indigo-400">FINISH</button>
        </div>

        <div className="space-y-8 px-2">
          {activeSession.exercises.map((exercise) => (
            <div key={exercise.id} className="glass-card rounded-[2rem] p-6 group">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-black text-xl text-white mb-1 group-hover:text-indigo-300 transition-colors">{exercise.name}</h3>
                  <div className="flex items-center gap-2">
                     <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded tracking-widest uppercase">{exercise.muscleGroup}</span>
                     <div className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span className="text-[9px] font-bold uppercase">{exercise.restTime}s rest</span>
                     </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Target</p>
                  <p className="font-mono text-white text-sm font-bold">{exercise.targetSets} × {exercise.targetReps}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-10 gap-2 text-[9px] text-slate-500 uppercase font-black text-center tracking-tighter mb-2">
                  <div className="col-span-2">Set</div>
                  <div className="col-span-3">KG</div>
                  <div className="col-span-3">REPS</div>
                  <div className="col-span-2">STATUS</div>
                </div>
                {Array.from({ length: exercise.targetSets }).map((_, idx) => {
                  const set = exercise.actualSets[idx] || { weight: 0, reps: 0, completed: false };
                  return (
                    <div key={idx} className={`grid grid-cols-10 gap-3 items-center p-2 rounded-2xl transition-all duration-300 ${set.completed ? 'bg-indigo-500/5 opacity-40 grayscale' : 'bg-slate-900/40 border border-white/5'}`}>
                      <div className="col-span-2 flex justify-center">
                        <span className="font-mono text-xs font-black text-slate-500">{idx + 1}</span>
                      </div>
                      <div className="col-span-3">
                        <input 
                          type="number" 
                          className="w-full bg-slate-950/50 border-none rounded-xl p-2 text-center text-white font-mono font-bold focus:ring-1 focus:ring-indigo-500 outline-none text-sm" 
                          value={set.weight || ''} 
                          placeholder="0"
                          onChange={(e) => updateSet(exercise.id, idx, 'weight', parseFloat(e.target.value))} 
                        />
                      </div>
                      <div className="col-span-3">
                        <input 
                          type="number" 
                          className="w-full bg-slate-950/50 border-none rounded-xl p-2 text-center text-white font-mono font-bold focus:ring-1 focus:ring-indigo-500 outline-none text-sm" 
                          value={set.reps || ''} 
                          placeholder="0"
                          onChange={(e) => updateSet(exercise.id, idx, 'reps', parseFloat(e.target.value))} 
                        />
                      </div>
                      <div className="col-span-2 flex justify-center">
                        <button 
                          onClick={() => updateSet(exercise.id, idx, 'completed', !set.completed)} 
                          className={`p-1.5 rounded-lg transition-all ${set.completed ? 'text-indigo-400 scale-110' : 'text-slate-700 hover:text-slate-500'}`}
                        >
                          {set.completed ? <CheckCircle className="w-6 h-6 fill-indigo-500/20" /> : <Circle className="w-6 h-6" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <button 
          onClick={finishWorkout} 
          className="w-[calc(100%-2rem)] mx-4 mt-12 bg-indigo-500 text-white font-black py-5 rounded-3xl flex items-center justify-center gap-3 shadow-[0_15px_30px_rgba(99,102,241,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Save className="w-6 h-6" /> COMPLETE SESSION
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto h-full flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-black text-white flex items-center gap-3">
          <Calendar className="text-indigo-500" /> Training Plan
        </h2>
        <div className="flex items-center gap-2 text-slate-500 bg-slate-900/50 px-3 py-1.5 rounded-2xl border border-white/5">
           <Zap className="w-4 h-4 text-amber-400" />
           <span className="text-[10px] font-black uppercase tracking-wider">Week 01</span>
        </div>
      </div>

      <div className="flex overflow-x-auto pb-4 gap-3 no-scrollbar mb-8">
        {plan.sessions.map((session) => {
          const locked = isDayLocked(session.dayNumber);
          const isSelected = selectedDay === session.dayNumber;
          return (
            <button 
              key={session.dayNumber} 
              onClick={() => setSelectedDay(session.dayNumber)} 
              className={`flex flex-col items-center justify-center min-w-[4.5rem] h-20 rounded-[1.5rem] transition-all duration-300 border ${
                isSelected 
                  ? 'bg-indigo-500 border-indigo-400 text-white shadow-[0_10px_20px_rgba(99,102,241,0.3)] scale-105' 
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
              }`}
            >
              <span className={`text-[9px] font-black uppercase mb-1 tracking-widest ${isSelected ? 'text-indigo-200' : 'text-slate-600'}`}>Day</span>
              <span className="text-2xl font-black font-mono flex items-center gap-1">
                {session.dayNumber.toString().padStart(2, '0')} 
                {locked && <Lock className={`w-3 h-3 ${isSelected ? 'text-white' : 'opacity-30'}`} />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto pb-10">
        {currentSession && (
          <div className="relative glass-card p-8 rounded-[2.5rem] overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-[0.05] -rotate-12">
               <Info size={120} />
            </div>

            <div className="relative z-10">
              <h3 className="text-3xl font-black text-white mb-2 leading-tight">{currentSession.name}</h3>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mb-8">
                {currentSession.isRestDay ? 'Recovery Focus' : 'Strength Session'}
              </p>

              {isDayLocked(currentSession.dayNumber) ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-600 space-y-4">
                  <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center border border-white/5">
                    <Lock className="w-10 h-10 opacity-20" />
                  </div>
                  <div className="text-center">
                    <p className="font-black text-white uppercase text-sm">Session Locked</p>
                    <p className="text-xs">Unlocks at midnight tomorrow</p>
                  </div>
                </div>
              ) : currentSession.isRestDay ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Zap className="w-10 h-10 text-indigo-400" />
                  </div>
                  <p className="text-slate-400 font-bold max-w-[200px] mx-auto leading-relaxed italic">"Rest is not idleness, and to lie sometimes on the grass under trees is not waste of time."</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-600 tracking-widest px-1">
                    <span>Exercise List</span>
                    <span>Volume</span>
                  </div>
                  <div className="space-y-3">
                    {currentSession.exercises.map((ex, i) => (
                      <div key={ex.id} className="p-4 bg-slate-950/50 border border-white/5 rounded-2xl flex justify-between items-center group transition-all hover:border-indigo-500/20">
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-slate-700 font-bold text-xs">{ (i+1).toString().padStart(2, '0') }</span>
                          <div>
                            <p className="text-white font-black group-hover:text-indigo-400 transition-colors">{ex.name}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{ex.muscleGroup}</p>
                          </div>
                        </div>
                        <div className="text-right">
                           <p className="font-mono text-indigo-400 text-xs font-bold">{ex.targetSets}×{ex.targetReps}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={handleStartWorkout} 
                    disabled={!!currentSession.completedDate} 
                    className={`w-full mt-10 font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-3 transition-all duration-300 ${
                      currentSession.completedDate 
                      ? 'bg-slate-800 text-slate-500' 
                      : 'bg-indigo-500 text-white shadow-[0_10px_30px_rgba(99,102,241,0.3)] hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                  >
                    {currentSession.completedDate ? 'SESSION COMPLETED' : 'ENGAGE TRAINING'} 
                    <Dumbbell className={`w-6 h-6 ${currentSession.completedDate ? 'opacity-20' : ''}`} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutView;