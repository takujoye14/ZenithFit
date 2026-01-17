import React, { useState } from 'react';
import { UserProfile, FitnessGoal, FitnessLevel, DietGoal } from '../types';
import { auth, googleProvider } from '../src/firebase-config';
import { 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  Loader2, ArrowRight, Sparkles, User, Target, Zap, Waves, 
  LogIn, CheckCircle2, Mail, Lock, Ruler, ChevronRight
} from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
  isGenerating: boolean;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, isGenerating }) => {
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(auth.currentUser);
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [formData, setFormData] = useState<Partial<UserProfile>>({
    goal: FitnessGoal.GENERAL_HEALTH,
    level: FitnessLevel.BEGINNER,
    dietGoal: DietGoal.MAINTAIN,
    daysPerWeek: 3,
    equipment: 'Gym Access',
    constraints: '',
    currentFormat: 'Full Body',
    hasPlan: false
  });

  const calculateMacros = (data: Partial<UserProfile>) => {
    const { weight, height, age, dietGoal } = data;
    if (!weight || !height || !age || !dietGoal) return null;

    // Mifflin-St Jeor Equation
    const bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    let calories = bmr * 1.55; // Moderate activity multiplier

    if (dietGoal === DietGoal.CUT) calories -= 500;
    if (dietGoal === DietGoal.BULK) calories += 500;

    const protein = weight * 2.2; // 2.2g per kg
    const fat = (calories * 0.25) / 9; // 25% of calories from fat
    const carbs = (calories - (protein * 4) - (fat * 9)) / 4;

    return {
      caloriesTarget: Math.round(calories),
      proteinTarget: Math.round(protein),
      carbsTarget: Math.round(carbs),
      fatTarget: Math.round(fat)
    };
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp && password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    try {
      const result = isSignUp 
        ? await createUserWithEmailAndPassword(auth, email, password)
        : await signInWithEmailAndPassword(auth, email, password);
      setUser(result.user);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      alert("Enter your email address first.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Reset link sent! Check your spam folder.");
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      if (result.user.displayName) handleChange('name', result.user.displayName);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = () => {
    if (!formData.name || !formData.age || !formData.weight || !formData.height) return;
    const targets = calculateMacros(formData);
    onComplete({ ...formData, ...targets } as UserProfile);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-10">
      <div className="w-full max-w-lg glass-card rounded-[3rem] p-10 sm:p-12 relative overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
        
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
            {step === 1 && (isSignUp ? "Join" : "Access")}
            {step === 2 && "Ambition"}
            {step === 3 && "Structure"}
            {step === 4 && "Environment"}
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">Neural Link v2.8</p>
        </div>

        {/* STEP 1: IDENTITY & BIOMETRICS */}
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            {!user ? (
              <div className="space-y-4">
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-4 text-slate-500" size={18} />
                    <input type="email" placeholder="Email Address" className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 pl-12 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-4 text-slate-500" size={18} />
                    <input type="password" placeholder="Password" className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 pl-12 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  {isSignUp && (
                    <div className="relative">
                      <Lock className="absolute left-4 top-4 text-slate-500" size={18} />
                      <input type="password" placeholder="Confirm Password" className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 pl-12 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    </div>
                  )}
                  {!isSignUp && (
                    <div className="flex justify-end">
                      <button type="button" onClick={handleResetPassword} className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Forgot Password?</button>
                    </div>
                  )}
                  <button type="submit" className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-900/20">
                    {isSignUp ? 'INITIALIZE ACCOUNT' : 'SECURE LOGIN'}
                  </button>
                </form>

                <div className="relative flex items-center gap-4 py-2">
                  <div className="flex-1 h-px bg-white/5 text-slate-800"></div>
                  <span className="text-[10px] font-black text-slate-700 uppercase">OR</span>
                  <div className="flex-1 h-px bg-white/5 text-slate-800"></div>
                </div>

                <button onClick={handleGoogleLogin} className="w-full bg-white text-slate-950 font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all hover:bg-indigo-400 hover:text-white">
                  <LogIn size={20} /> GOOGLE LINK
                </button>

                <button onClick={() => setIsSignUp(!isSignUp)} className="w-full text-slate-500 font-bold text-[10px] uppercase tracking-widest hover:text-indigo-400 transition-colors">
                  {isSignUp ? 'Back to Login' : 'New User? Create Account'}
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mb-4">
                  <CheckCircle2 className="text-emerald-500" size={18} />
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">Identity Verified</span>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-2"><User size={12} /> Full Name</label>
                  <input type="text" className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-white font-bold focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Name Lastname" value={formData.name || ''} onChange={(e) => handleChange('name', e.target.value)} />
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Age</label>
                    <input type="number" className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-white font-mono font-bold" value={formData.age || ''} onChange={(e) => handleChange('age', parseInt(e.target.value))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Wt (kg)</label>
                    <input type="number" className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-white font-mono font-bold" value={formData.weight || ''} onChange={(e) => handleChange('weight', parseInt(e.target.value))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Ht (cm)</label>
                    <input type="number" className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-white font-mono font-bold" value={formData.height || ''} onChange={(e) => handleChange('height', parseInt(e.target.value))} />
                  </div>
                </div>
                
                <button onClick={nextStep} disabled={!formData.name || !formData.age || !formData.weight || !formData.height} className="w-full bg-white text-slate-950 font-black py-5 rounded-[1.5rem] mt-4 flex items-center justify-center gap-2 group hover:bg-indigo-400 hover:text-white transition-all disabled:opacity-30">
                  CONTINUE <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                </button>
              </>
            )}
          </div>
        )}

        {/* STEP 2: AMBITION & DIET */}
        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-2"><Target size={12} /> Primary Goal</label>
              <select className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-white font-bold appearance-none outline-none focus:ring-2 focus:ring-indigo-500" value={formData.goal} onChange={(e) => handleChange('goal', e.target.value)}>
                {Object.values(FitnessGoal).map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 mb-3 block">Dietary Objective</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.values(DietGoal).map(g => (
                  <button 
                    key={g} 
                    onClick={() => handleChange('dietGoal', g)} 
                    className={`p-3 rounded-2xl text-[10px] font-black uppercase transition-all border ${
                      formData.dietGoal === g 
                      ? 'bg-fuchsia-600 border-fuchsia-400 text-white shadow-lg' 
                      : 'bg-slate-950 border-white/5 text-slate-500'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
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

        {/* STEP 3: STRUCTURE */}
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

        {/* STEP 4: ENVIRONMENT */}
        {step === 4 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-2"><Waves size={12} /> Tactical Constraints</label>
              <textarea 
                className="w-full bg-slate-950 border border-white/5 rounded-[1.5rem] p-5 text-white font-bold h-32 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" 
                placeholder="Describe injuries, equipment limitations, or specific focus areas..." 
                value={formData.constraints}
                onChange={(e) => handleChange('constraints', e.target.value)} 
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
      <p className="mt-8 text-slate-600 font-bold uppercase text-[9px] tracking-[0.5em] text-center">Zenith Neural Core v2.8.0</p>
    </div>
  );
};

export default Onboarding;