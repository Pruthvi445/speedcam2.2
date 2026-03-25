import React from 'react';

export const NextCameraInfo = ({ nextCam, speed, theme }) => {
  if (!nextCam) return null;

  return (
    <div className={`relative overflow-hidden border rounded-2xl p-3 transition-all duration-300 ${theme === 'night' ? 'bg-zinc-900/60 border-white/8 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]' : 'bg-white border-zinc-200 shadow-sm'}`}>
      {theme === 'night' && <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />}
      <div className="flex justify-between items-center">
        <div className="flex-1 min-w-0">
          <div className={`text-[9px] uppercase tracking-[2px] mb-0.5 ${theme === 'night' ? 'text-zinc-500' : 'text-zinc-400'}`}>Next Camera</div>
          <div className={`text-sm font-black truncate ${theme === 'night' ? 'text-white' : 'text-zinc-900'}`}>{nextCam.name}</div>
          <div className={`text-[11px] mt-0.5 font-bold ${theme === 'night' ? 'text-cyan-400' : 'text-blue-500'}`}>
            {Math.round(nextCam.d)}m away &bull; {nextCam.type === 'red' ? '\ud83d\udd34 Red Light' : `\u26a1 ${nextCam.speedLimit} km/h limit`}
          </div>
        </div>
        {nextCam.type !== 'red' && (
          <div className={`ml-3 px-3 py-1.5 rounded-xl text-xs font-black tracking-wider shrink-0 shadow-sm ${
            speed > nextCam.speedLimit
              ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
              : (theme === 'night' ? 'bg-emerald-700/80 text-emerald-200' : 'bg-emerald-100 text-emerald-700')
          }`}>
            {speed > nextCam.speedLimit ? 'OVER' : 'SAFE'}
          </div>
        )}
      </div>
    </div>
  );
};
