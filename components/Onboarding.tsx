import React, { useState } from 'react';
import { UserProfile, FitnessGoal, FitnessLevel } from '../types';
import { Loader2, ArrowRight, Sparkles, User, Target, Zap, Waves } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
  isGenerating: boolean;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, isGenerating }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    goal: FitnessGoal.GENERAL_HEALTH,
    level: FitnessLevel.BEGINNER,
    daysPerWeek: 3,
    equipment: 'Gym Access',
    constraints: '',
    currentFormat: 'Full Body',
    hasPlan: false
  });

  const handleChange = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = () => {
    if (!formData.name || !formData.age || !formData.weight) return;
    onComplete(formData as UserProfile);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-10">
      <div className="w-full max-w-lg glass-card rounded-[3rem] p-10 sm:p-12 relative overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
        
        {/* Animated Accent */}
        <div className="absolute top-0 right-0 p-8 opacity-20 animate-pulse">
           <Sparkles className="text-indigo-500 w-12 h-12" />
        </div>

        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${step >= s ? 'w-8 bg-indigo-500' : 'w-4 bg-slate-800'}`}></div>
            ))}
          </div>
          <h1 className="text-4xl font-black text-white leading-tight">
            {step === 1 && "Identity"}
            {step === 2 && "Ambition"}
            {step === 3 && "Structure"}
            {step === 4 && "Environment"}
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">Initialize Profile v1.0</p>
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-2">
                <User size={12} /> Full Name
              </label>
              <input 
                type="text" 
                className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-white font-bold focus:ring-2 focus:ring-indigo-500 outline-none" 
                placeholder="Atlas Prime"
                value={formData.name || ''} 
                onChange={(e) => handleChange('name', e.target.value)} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Age</label>
                <input type="number" className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-white font-mono font-bold" value={formData.age || ''} onChange={(e) => handleChange('age', parseInt(e.target.value))} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Weight (kg)</label>
                <input type="number" className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-white font-mono font-bold" value={formData.weight || ''} onChange={(e) => handleChange('weight', parseInt(e.target.value))} />
              </div>
            </div>
            <button 
              onClick={nextStep} 
              disabled={!formData.name || !formData.age}
              className="w-full bg-white text-slate-950 font-black py-5 rounded-[1.5rem] mt-4 flex items-center justify-center gap-2 group hover:bg-indigo-400 hover:text-white transition-all disabled:opacity-30"
            >
              CONTINUE <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-2"><Target size={12} /> Primary Goal</label>
              <select className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-white font-bold appearance-none outline-none focus:ring-2 focus:ring-indigo-500" value={formData.goal} onChange={(e) => handleChange('goal', e.target.value)}>
                {Object.values(FitnessGoal).map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 mb-3 block">Training Level</label>
              <div className="grid grid-cols-3 gap-3">
                {Object.values(FitnessLevel).map(l => (
                  <button 
                    key={l} 
                    onClick={() => handleChange('level', l)} 
                    className={`p-3 rounded-2xl text-[10px] font-black uppercase transition-all border ${
                      formData.level === l 
                      ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg' 
                      : 'bg-slate-950 border-white/5 text-slate-500'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={prevStep} className="flex-1 bg-slate-900 text-slate-500 font-black py-5 rounded-2xl">BACK</button>
              <button onClick={nextStep} className="flex-1 bg-white text-slate-950 font-black py-5 rounded-2xl hover:bg-indigo-400 hover:text-white transition-all">NEXT</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-2"><Zap size={12} /> Commitment ({formData.daysPerWeek} days)</label>
              <input type="range" min="1" max="7" className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-500" value={formData.daysPerWeek} onChange={(e) => handleChange('daysPerWeek', parseInt(e.target.value))} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 mb-2 block">Tactical Format</label>
              <div className="grid grid-cols-1 gap-2">
                 {["Full Body", "Push/Pull/Legs (PPL)", "Upper/Lower", "Bro Split", "Cardio"].map(f => (
                   <button 
                    key={f} 
                    onClick={() => handleChange('currentFormat', f)}
                    className={`w-full p-4 rounded-2xl text-xs font-bold transition-all text-left flex justify-between items-center border ${
                      formData.currentFormat === f 
                      ? 'bg-indigo-500/10 border-indigo-500 text-white' 
                      : 'bg-slate-950 border-white/5 text-slate-500'
                    }`}
                   >
                     {f}
                     {formData.currentFormat === f && <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>}
                   </button>
                 ))}
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <button onClick={prevStep} className="flex-1 bg-slate-900 text-slate-500 font-black py-5 rounded-2xl">BACK</button>
              <button onClick={nextStep} className="flex-1 bg-white text-slate-950 font-black py-5 rounded-2xl">NEXT</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-2"><Waves size={12} /> Tactical Constraints</label>
              <textarea 
                className="w-full bg-slate-950 border border-white/5 rounded-[1.5rem] p-5 text-white font-bold h-32 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" 
                placeholder="Describe injuries, equipment limitations, or specific focus areas..." 
                onChange={(e) => handleChange('equipment', e.target.value)} 
              />
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={prevStep} className="flex-1 bg-slate-900 text-slate-500 font-black py-5 rounded-2xl">BACK</button>
              <button 
                onClick={handleSubmit} 
                disabled={isGenerating} 
                className="flex-1 bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-900/30 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {isGenerating ? <Loader2 className="animate-spin w-6 h-6" /> : 'GENERATE AI PLAN'}
              </button>
            </div>
          </div>
        )}
      </div>
      <p className="mt-8 text-slate-600 font-bold uppercase text-[9px] tracking-[0.5em] text-center">Zenith Neural Core v2.5.0</p>
    </div>
  );
};

export default Onboarding;