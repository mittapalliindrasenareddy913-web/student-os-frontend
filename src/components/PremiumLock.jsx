import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, HelpCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PremiumLock({ moduleName }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-dark-bg min-h-[70vh] text-center space-y-6 animate-fade-in relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-secondary/10 blur-3xl" />

      <div className="glass-card max-w-md p-8 border border-white/5 space-y-6 flex flex-col items-center z-10">
        <div className="w-16 h-16 rounded-2xl bg-purple-950/40 border border-purple-900/30 flex items-center justify-center text-purple-400 shadow-xl shadow-purple-900/10 animate-pulse">
          <Lock size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-black text-white uppercase tracking-wider">{moduleName} Locked</h2>
          <p className="text-xs text-purple-400 font-bold uppercase tracking-wide">Link College Account Required</p>
          <p className="text-[11px] text-text-secondary leading-relaxed pt-2">
            Link your College Account to access academic features like attendance tracking, timetables, study materials, and notifications.
          </p>
        </div>

        <button
          onClick={() => navigate('/settings?tab=connections')}
          className="h-10 px-5 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 whitespace-nowrap cursor-pointer"
        >
          <span>Link College Account</span>
          <ArrowRight size={14} />
        </button>

        <div className="w-full h-px bg-white/5" />
        <p className="text-[9px] text-text-secondary uppercase tracking-widest font-black flex items-center gap-1.5 justify-center">
          <HelpCircle size={12} className="text-purple-400" />
          Access restricted to college-linked student profiles
        </p>
      </div>
    </div>
  );
}
