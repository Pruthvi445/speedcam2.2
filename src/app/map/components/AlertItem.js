import React from 'react';
import { Camera, X } from 'lucide-react';

export const AlertItem = ({ alert, onRemove, theme }) => {
  const getAlertConfig = (type) => {
    if (theme === 'night') {
      switch(type) {
        case 'CRITICAL': return { bar: 'bg-red-500', bg: 'bg-red-950/95', border: 'border-red-500', glow: 'shadow-[0_0_30px_rgba(239,68,68,0.5)]', pulse: 'animate-pulse' };
        case 'OVERSPEED': return { bar: 'bg-orange-500', bg: 'bg-orange-950/95', border: 'border-orange-500', glow: 'shadow-[0_0_30px_rgba(249,115,22,0.5)]', pulse: 'animate-pulse' };
        case 'REDLIGHT': return { bar: 'bg-red-600', bg: 'bg-red-950/95', border: 'border-red-400', glow: 'shadow-[0_0_25px_rgba(220,38,38,0.6)]', pulse: 'animate-pulse' };
        case 'WARNING': return { bar: 'bg-yellow-500', bg: 'bg-yellow-950/95', border: 'border-yellow-500', glow: 'shadow-[0_0_20px_rgba(234,179,8,0.4)]', pulse: '' };
        case 'INFO': default: return { bar: 'bg-cyan-500', bg: 'bg-cyan-950/95', border: 'border-cyan-500', glow: 'shadow-[0_0_15px_rgba(6,182,212,0.3)]', pulse: '' };
      }
    } else {
      switch(type) {
        case 'CRITICAL': return { bar: 'bg-red-600', bg: 'bg-white', border: 'border-red-200', glow: 'shadow-lg', pulse: 'animate-pulse' };
        case 'OVERSPEED': return { bar: 'bg-orange-600', bg: 'bg-white', border: 'border-orange-200', glow: 'shadow-lg', pulse: 'animate-pulse' };
        case 'REDLIGHT': return { bar: 'bg-red-700', bg: 'bg-white', border: 'border-red-200', glow: 'shadow-lg', pulse: 'animate-pulse' };
        case 'WARNING': return { bar: 'bg-amber-600', bg: 'bg-white', border: 'border-amber-200', glow: 'shadow-md', pulse: '' };
        case 'INFO': default: return { bar: 'bg-blue-600', bg: 'bg-white', border: 'border-blue-200', glow: 'shadow-md', pulse: '' };
      }
    }
  };
  const cfg = getAlertConfig(alert.type);
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${cfg.border} ${cfg.bg} ${cfg.glow} ${cfg.pulse} max-w-sm w-full mx-4 cursor-pointer backdrop-blur-xl transition-all duration-300 hover:scale-[1.02]`}
      onClick={() => onRemove(alert.id)}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.bar}`} />
      <div className="flex items-center gap-3 px-5 py-3">
        <Camera size={18} className={`shrink-0 opacity-90 ${theme === 'night' ? 'text-white' : 'text-zinc-700'}`} />
        <div className="flex-1 min-w-0">
          <div className={`text-[9px] font-black uppercase tracking-[2px] opacity-60 mb-0.5 ${theme === 'night' ? 'text-white' : 'text-zinc-500'}`}>{alert.type}</div>
          <div className={`text-sm font-bold leading-tight truncate ${theme === 'night' ? 'text-white' : 'text-zinc-900'}`}>{alert.message}</div>
        </div>
        <X size={14} className={`shrink-0 opacity-40 ${theme === 'night' ? 'text-white' : 'text-zinc-400'}`} />
      </div>
    </div>
  );
};
