import React from 'react';
import { Navigation } from 'lucide-react';

export const Speedometer = ({ speed, heading, overspeedAlert, theme }) => {
  return (
    <div className="flex items-center justify-between mb-4">
      {/* Compass */}
      <div className="flex items-center gap-3">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border border-cyan-500/20" />
          <div className="absolute inset-1 rounded-full border border-cyan-500/10" />
          <div className="absolute inset-0 rounded-full" style={{background:'conic-gradient(from 0deg, transparent 0deg, rgba(0,242,255,0.08) 60deg, transparent 120deg)'}} />
          <Navigation
            style={{ transform: `rotate(${heading}deg)` }}
            className="absolute inset-0 m-auto text-cyan-400 w-7 h-7 transition-transform duration-500 drop-shadow-[0_0_6px_rgba(0,242,255,0.8)]"
          />
        </div>
        <div>
          <div className={`text-[9px] uppercase tracking-widest ${theme === 'night' ? 'text-zinc-500' : 'text-zinc-400'}`}>Heading</div>
          <div className={`text-xl font-black tabular-nums ${theme === 'night' ? 'text-white' : 'text-zinc-900'}`}>{heading}°</div>
        </div>
      </div>
      {/* Speed */}
      <div className="text-right">
        <div className={`text-[9px] uppercase tracking-widest ${theme === 'night' ? 'text-zinc-500' : 'text-zinc-400'}`}>Speed</div>
        <div className={`text-5xl font-black tabular-nums leading-none transition-colors duration-300 ${overspeedAlert ? 'text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]' : (theme === 'night' ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]' : 'text-zinc-900')}`}>
          {speed}
        </div>
        <div className={`text-[10px] font-bold tracking-widest ${theme === 'night' ? 'text-yellow-500' : 'text-blue-600'}`}>KM/H</div>
      </div>
    </div>
  );
};
