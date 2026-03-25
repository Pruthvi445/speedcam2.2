import React from 'react';

export const MapStats = ({ tripDistance, relevantCamerasCount, crossedCount, theme }) => {
  const stats = [
    { label: 'TRIP', value: `${(tripDistance / 1000).toFixed(2)}`, unit: 'km', color: theme === 'night' ? 'text-cyan-400' : 'text-blue-600', glow: theme === 'night' ? 'shadow-[inset_0_0_20px_rgba(0,242,255,0.05)] bg-zinc-900/80' : 'bg-white shadow-sm border-zinc-100' },
    { label: 'CAMS', value: relevantCamerasCount, unit: '', color: theme === 'night' ? 'text-yellow-400' : 'text-amber-600', glow: theme === 'night' ? 'shadow-[inset_0_0_20px_rgba(250,204,21,0.05)] bg-zinc-900/80' : 'bg-white shadow-sm border-zinc-100' },
    { label: 'PASSED', value: crossedCount, unit: '', color: theme === 'night' ? 'text-emerald-400' : 'text-emerald-600', glow: theme === 'night' ? 'shadow-[inset_0_0_20px_rgba(52,211,153,0.05)] bg-zinc-900/80' : 'bg-white shadow-sm border-zinc-100' },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 mb-4">
      {stats.map(s => (
        <div key={s.label} className={`border border-white/5 rounded-xl p-2.5 text-center transition-colors duration-300 ${s.glow}`}>
          <div className="text-[8px] text-zinc-500 uppercase tracking-[2px] mb-1">{s.label}</div>
          <div className={`text-base font-black tabular-nums ${s.color}`}>
            {s.value}
            <span className="text-[10px] opacity-60 ml-0.5">{s.unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
