import React, { useState, useMemo } from 'react';
import { WorkoutPlan } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { TrendingUp, Activity, Filter, Scale, Target } from 'lucide-react';

interface AnalyticsViewProps {
  plan: WorkoutPlan;
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ plan }) => {
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>([]);

  const completedSessions = useMemo(() => plan.sessions.filter(s => s.completedDate), [plan]);
  
  const { muscleGroupVolume, allMuscleGroups } = useMemo(() => {
    const volume: Record<string, number> = {};
    const groups = new Set<string>();
    completedSessions.forEach(session => {
      session.exercises.forEach(ex => {
        const vol = ex.actualSets.reduce((acc, set) => acc + (set.completed ? (set.weight * set.reps) : 0), 0);
        const group = ex.muscleGroup || 'Other';
        volume[group] = (volume[group] || 0) + vol;
        groups.add(group);
      });
    });
    return { 
      muscleGroupVolume: volume, 
      allMuscleGroups: Array.from(groups).sort() 
    };
  }, [completedSessions]);

  const toggleMuscleGroup = (group: string) => {
    setSelectedMuscleGroups(prev => 
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };

  const muscleData = useMemo(() => {
    return Object.keys(muscleGroupVolume)
      .filter(key => selectedMuscleGroups.length === 0 || selectedMuscleGroups.includes(key))
      .map(key => ({ name: key, volume: muscleGroupVolume[key] }))
      .sort((a, b) => b.volume - a.volume);
  }, [muscleGroupVolume, selectedMuscleGroups]);

  const weightData = [
    { date: 'W1', weight: 80 }, { date: 'W2', weight: 79.5 }, { date: 'W3', weight: 79.2 }, { date: 'W4', weight: 78.8 },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass p-3 rounded-2xl border-white/5 shadow-2xl">
          <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">{label}</p>
          <p className="text-white font-black text-base">{payload[0].value.toLocaleString()} <span className="text-[10px] text-indigo-400">KG</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-2xl mx-auto h-full pb-20 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-black text-white flex items-center gap-3">
          <TrendingUp className="text-indigo-500" /> Evolution
        </h2>
      </div>

      <div className="grid gap-8">
        {/* Volume Chart */}
        <div className="glass-card p-8 rounded-[2.5rem]">
          <div className="flex items-center justify-between mb-8">
             <div>
                <h3 className="font-black text-xl text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-400" /> Volume Distribution
                </h3>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Total work per group</p>
             </div>
             <Target className="w-10 h-10 text-slate-800" />
          </div>
          
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setSelectedMuscleGroups([])}
              className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                selectedMuscleGroups.length === 0 ? 'bg-indigo-500 text-white' : 'bg-slate-900 text-slate-500 border border-white/5'
              }`}
            >
              All Groups
            </button>
            {allMuscleGroups.map(group => (
              <button
                key={group}
                onClick={() => toggleMuscleGroup(group)}
                className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  selectedMuscleGroups.includes(group) ? 'bg-indigo-500 text-white' : 'bg-slate-900 text-slate-500 border border-white/5'
                }`}
              >
                {group}
              </button>
            ))}
          </div>
          
          <div className="h-72 w-full pr-4">
            {muscleData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={muscleData} layout="vertical" margin={{ left: -10 }}>
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="#475569" 
                    fontSize={11} 
                    fontWeight={800}
                    tickLine={false} 
                    axisLine={false} 
                    width={90} 
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.03)'}} />
                  <Bar 
                    dataKey="volume" 
                    fill="url(#barGradient)"
                    radius={[0, 10, 10, 0]} 
                    barSize={20}
                  />
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-700">
                <Activity className="w-12 h-12 mb-4 opacity-10" />
                <p className="font-black uppercase tracking-widest text-xs">Awaiting Progress Data</p>
              </div>
            )}
          </div>
        </div>

        {/* Body Weight Chart */}
        <div className="glass-card p-8 rounded-[2.5rem]">
          <div className="flex items-center justify-between mb-10">
            <h3 className="font-black text-xl text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-fuchsia-400" /> Mass Trajectory
            </h3>
            <span className="text-fuchsia-400/50 font-black text-4xl">KG</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightData}>
                 <CartesianGrid strokeDasharray="5 5" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#475569" fontSize={11} fontWeight={800} tickLine={false} axisLine={false} />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke="#475569" fontSize={11} fontWeight={800} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="stepAfter" 
                  dataKey="weight" 
                  stroke="#a855f7" 
                  strokeWidth={4} 
                  dot={{fill: '#a855f7', strokeWidth: 0, r: 5}} 
                  activeDot={{ r: 8, stroke: '#fff', strokeWidth: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;