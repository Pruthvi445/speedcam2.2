import React from 'react';
import { Navigation, Clock, Map as MapIcon, Flag } from 'lucide-react';

export const RouteInfo = ({ routeDistance, routeDuration, theme }) => {
  if (!routeDistance || !routeDuration) return null;

  return (
    <div className={`relative rounded-3xl p-5 mb-4 border overflow-hidden transition-all duration-500 hover:scale-[1.02] ${theme === 'night' ? 'bg-black/95 border-cyan-500/30' : 'bg-white border-zinc-200'} shadow-2xl`}>
      {/* Decorative background glow */}
      {theme === 'night' && <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[40px] rounded-full -mr-16 -mt-16" />}
      
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-xl ${theme === 'night' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-600 text-white'}`}>
          <Navigation size={18} />
        </div>
        <div>
          <div className={`text-[10px] font-black uppercase tracking-[3px] ${theme === 'night' ? 'text-zinc-500' : 'text-zinc-400'}`}>Navigation Active</div>
          <div className={`text-xs font-bold ${theme === 'night' ? 'text-white' : 'text-zinc-900'}`}>Optimal Route Calculated</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className={`p-3 rounded-2xl ${theme === 'night' ? 'bg-white/5' : 'bg-zinc-50 border border-zinc-100'}`}>
          <div className="flex items-center gap-2 mb-1.5 opacity-60">
            <MapIcon size={12} className={theme === 'night' ? 'text-cyan-400' : 'text-blue-600'} />
            <span className={`text-[9px] font-black uppercase tracking-wider ${theme === 'night' ? 'text-zinc-400' : 'text-zinc-500'}`}>Distance</span>
          </div>
          <div className={`text-2xl font-black tabular-nums tracking-tighter ${theme === 'night' ? 'text-white' : 'text-zinc-900'}`}>
            {routeDistance}<span className="text-xs ml-1 opacity-40">KM</span>
          </div>
          <div className="h-1 w-full bg-zinc-800 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-cyan-500 w-[70%]" /> {/* Fake progress for now */}
          </div>
        </div>

        <div className={`p-3 rounded-2xl ${theme === 'night' ? 'bg-white/5' : 'bg-zinc-50 border border-zinc-100'}`}>
          <div className="flex items-center gap-2 mb-1.5 opacity-60">
            <Clock size={12} className={theme === 'night' ? 'text-yellow-400' : 'text-amber-600'} />
            <span className={`text-[9px] font-black uppercase tracking-wider ${theme === 'night' ? 'text-zinc-400' : 'text-zinc-500'}`}>Rem. Time</span>
          </div>
          <div className={`text-2xl font-black tabular-nums tracking-tighter ${theme === 'night' ? 'text-white' : 'text-zinc-900'}`}>
            {routeDuration}<span className="text-xs ml-1 opacity-40">MIN</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Flag size={10} className="text-zinc-600" />
            <div className="text-[8px] font-bold text-zinc-500 uppercase">Est. Arrival Logic Active</div>
          </div>
        </div>
      </div>
    </div>
  );
};
