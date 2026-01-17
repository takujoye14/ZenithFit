import React from 'react';
import { AppView } from '../types';
import { LayoutGrid, Dumbbell, MessageSquare, Utensils, BarChart2, User } from 'lucide-react'; // Add User

interface LayoutProps {
  children: React.ReactNode;
  currentView: AppView;
  onChangeView: (view: AppView) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView }) => {
  const navItems = [
    { view: AppView.DASHBOARD, icon: LayoutGrid, label: 'FEED' },
    { view: AppView.WORKOUT, icon: Dumbbell, label: 'TRAIN' },
    { view: AppView.COACH, icon: MessageSquare, label: 'COACH' },
    { view: AppView.NUTRITION, icon: Utensils, label: 'FUEL' },
    { view: AppView.ANALYTICS, icon: BarChart2, label: 'DATA' },
    { view: AppView.PROFILE, icon: User, label: 'PROFILE' }, // Add this line
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      <main className="pb-32 pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {children}
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div className="glass px-4 py-3 rounded-[2.5rem] flex items-center gap-1 border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => onChangeView(item.view)}
                className={`relative flex flex-col items-center gap-1 px-5 py-2 rounded-2xl transition-all duration-500 ${
                  isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-indigo-500/20 rounded-2xl animate-in fade-in zoom-in duration-300"></div>
                )}
                <Icon size={20} className={`relative z-10 transition-transform duration-500 ${isActive ? 'scale-110' : ''}`} />
                <span className="text-[8px] font-black tracking-[0.2em] relative z-10 uppercase">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;