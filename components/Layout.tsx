import React from 'react';
import { AppView } from '../types';
import { LayoutDashboard, Dumbbell, Utensils, BarChart2, MessageSquare } from 'lucide-react';

interface LayoutProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentView, onChangeView, children }) => {
  const navItems = [
    { view: AppView.DASHBOARD, label: 'Feed', icon: LayoutDashboard },
    { view: AppView.WORKOUT, label: 'Train', icon: Dumbbell },
    { view: AppView.COACH, label: 'Coach', icon: MessageSquare },
    { view: AppView.NUTRITION, label: 'Fuel', icon: Utensils },
    { view: AppView.ANALYTICS, label: 'Stats', icon: BarChart2 },
  ];

  return (
    <div className="flex flex-col h-screen bg-transparent overflow-hidden">
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pt-4 pb-28 scroll-smooth px-4 sm:px-6">
        {children}
      </main>

      {/* Modern Floating Dock Navigation */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none">
        <nav className="glass w-[92%] max-w-md h-18 rounded-[2rem] flex justify-around items-center px-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto ring-1 ring-white/10">
          {navItems.map((item) => {
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => onChangeView(item.view)}
                className={`group relative flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-500 ease-out ${
                  isActive ? 'scale-110' : 'hover:scale-105'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full scale-150 animate-pulse"></div>
                )}
                <div className={`p-2.5 rounded-full transition-all duration-300 ${
                  isActive ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]' : 'text-slate-400 group-hover:text-slate-200'
                }`}>
                  <item.icon className={`w-5 h-5 transition-transform duration-500 ${isActive ? 'rotate-[360deg]' : ''}`} />
                </div>
                <span className={`text-[9px] mt-1 font-bold uppercase tracking-wider transition-opacity duration-300 ${
                  isActive ? 'opacity-100 text-indigo-400' : 'opacity-0 group-hover:opacity-100 text-slate-500'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Layout;