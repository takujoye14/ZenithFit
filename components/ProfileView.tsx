import React from 'react';
import { UserProfile } from '../types';
import { auth } from '../src/firebase-config';
import { User, Mail, Hash, Weight, Target, ShieldCheck, LogOut } from 'lucide-react';

interface ProfileViewProps {
  profile: UserProfile;
  onLogout: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ profile, onLogout }) => {
  const user = auth.currentUser;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-10">
        <div className="relative inline-block">
          <div className="w-24 h-24 bg-gradient-to-tr from-indigo-600 to-fuchsia-600 rounded-[2rem] flex items-center justify-center mb-4 shadow-2xl rotate-3">
            <User size={40} className="text-white -rotate-3" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-emerald-500 p-1.5 rounded-full border-4 border-slate-950">
            <ShieldCheck size={14} className="text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-black text-white">{profile.name}</h2>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">Neural Link Active</p>
      </div>

      <div className="grid gap-4">
        {/* Account Section */}
        <div className="glass-card p-6 rounded-[2rem] border-white/5">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Mail size={12} /> Account Identity
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400 font-medium">Verified Email</span>
              <span className="text-sm text-white font-mono">{user?.email || 'Guest Session'}</span>
            </div>
          </div>
        </div>

        {/* Physical Metrics Section */}
        <div className="glass-card p-6 rounded-[2rem] border-white/5">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Target size={12} /> Biometric Data
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-[10px] text-slate-500 font-black uppercase">Weight</p>
              <p className="text-xl font-bold text-white">{profile.weight} <span className="text-xs text-slate-500">KG</span></p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-slate-500 font-black uppercase">Age</p>
              <p className="text-xl font-bold text-white">{profile.age} <span className="text-xs text-slate-500">YRS</span></p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-slate-500 font-black uppercase">Level</p>
              <p className="text-xl font-bold text-indigo-400">{profile.level}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-slate-500 font-black uppercase">Goal</p>
              <p className="text-xl font-bold text-fuchsia-400">{profile.goal}</p>
            </div>
          </div>
        </div>

        <button 
          onClick={onLogout}
          className="w-full bg-red-500/10 border border-red-500/20 text-red-500 font-black py-5 rounded-[1.5rem] mt-4 flex items-center justify-center gap-3 hover:bg-red-500 hover:text-white transition-all group"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          TERMINATE SESSION
        </button>
      </div>
    </div>
  );
};

export default ProfileView;