/**
 * Shared Tactical Icons for 2D and 3D Maps
 * Ensures 100% visual parity across different map engines.
 */

export const getRadarHTML = (limit, isNear, isSuspicious, theme, reports = 0) => {
  const isHighReport = reports > 3;
  const badgeHTML = reports > 0 
    ? `<div class="absolute -top-2 -right-2 ${isHighReport ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse' : 'bg-orange-500 shadow-md'} text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center z-[100] border border-black">${reports}</div>`
    : '';
    
  return `
  <div class="relative flex items-center justify-center transition-all duration-300 ${isHighReport ? 'drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]' : ''}" style="width: 44px; height: 44px; pointer-events: auto;">
    ${isNear ? `<div class="absolute inset-0 rounded-full border border-cyan-500/30 animate-ping" style="border-width: 2px;"></div>` : ''}
    <div class="absolute inset-1 rounded-full ${theme === 'night' ? 'bg-zinc-900/90' : 'bg-white'} backdrop-blur-md border border-white/20 shadow-[0_0_15px_rgba(0,242,255,0.3)] flex items-center justify-center overflow-hidden" 
         style="box-shadow: 0 0 15px ${theme === 'night' ? 'rgba(0,242,255,0.4)' : 'rgba(0,100,255,0.2)'}; border: 1px solid rgba(255,255,255,0.2);">
      <div class="absolute inset-0 ${theme === 'night' ? 'bg-cyan-400/20' : 'bg-blue-400/10'}" style="width: 100%; height: 100%; transform-origin: center; animation: radar-scan 3s linear infinite;"></div>
      <span class="relative z-10 font-mono font-black text-lg ${theme === 'night' ? 'text-white' : 'text-zinc-900'} tracking-tighter" style="text-shadow: 0 0 10px ${theme === 'night' ? 'rgba(0,255,255,0.5)' : 'transparent'};">${limit}</span>
    </div>
    <div class="absolute -inset-1 border-t-2 border-l-2 ${theme === 'night' ? 'border-cyan-400/40' : 'border-blue-400/40'} w-3 h-3 rounded-tl-sm" style="border-color: ${theme === 'night' ? '#22d3ee' : '#3b82f6'};"></div>
    <div class="absolute -inset-1 border-b-2 border-r-2 ${theme === 'night' ? 'border-cyan-400/40' : 'border-blue-400/40'} w-3 h-3 rounded-br-sm ml-auto mt-auto" style="border-color: ${theme === 'night' ? '#22d3ee' : '#3b82f6'};"></div>
    ${isSuspicious ? '<div class="absolute -top-4 -left-2 text-lg drop-shadow-md z-50">⚠️</div>' : ''}
    ${badgeHTML}
  </div>
`;};

export const getRedLightHTML = (isNear, isSuspicious, theme, reports = 0) => {
  const isHighReport = reports > 3;
  const badgeHTML = reports > 0 
    ? `<div class="absolute -top-2 -right-4 ${isHighReport ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse' : 'bg-orange-500 shadow-md'} text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center z-[100] border border-black">${reports}</div>`
    : '';

  return `
  <div class="relative flex flex-col items-center ${isHighReport ? 'drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]' : ''}" 
       style="width: 32px; height: 64px; pointer-events: auto;">
    <div class="relative ${theme === 'night' ? 'bg-zinc-900 border-zinc-700' : 'bg-zinc-800 border-zinc-900'} border-2 shadow-xl rounded-xl w-full h-full p-1.5 flex flex-col justify-between overflow-hidden"
         style="background: ${theme === 'night' ? '#111' : '#222'}; border: 2px solid ${theme === 'night' ? '#333' : '#000'}; box-shadow: 0 0 20px rgba(0,0,0,0.5);">
      <div class="w-full aspect-square rounded-full border border-black/40 bg-red-500 shadow-[0_0_15px_red] animate-pulse" 
           style="background-color: #ef4444; box-shadow: 0 0 15px #f00;"></div>
      <div class="w-full aspect-square rounded-full border border-black/40 bg-yellow-500 shadow-[0_0_8px_yellow]"
           style="background-color: #eab308; box-shadow: 0 0 8px #ff0;"></div>
      <div class="w-full aspect-square rounded-full border border-black/40 bg-green-500/30"
           style="background-color: rgba(34,197,94,0.3);"></div>
    </div>
    ${isSuspicious ? '<div class="absolute -top-4 -left-4 text-lg z-50">⚠️</div>' : ''}
    ${badgeHTML}
  </div>
`};

export const getCarHTML = (heading, isOverspeed, theme) => `
  <div class="relative flex items-center justify-center transition-all duration-300" style="transform: rotate(${heading}deg); width: 44px; height: 44px;">
    <div class="absolute inset-0 rounded-full border-2 ${isOverspeed ? 'border-red-500 shadow-[0_0_20px_red]' : (theme === 'night' ? 'border-cyan-500 shadow-[0_0_15px_cyan]' : 'border-blue-600 shadow-md')} animate-ping opacity-50"></div>
    <div class="relative z-10 w-0 h-0 border-l-[14px] border-r-[14px] border-b-[40px] border-l-transparent border-r-transparent ${isOverspeed ? 'border-b-red-600' : (theme === 'night' ? 'border-b-cyan-400' : 'border-b-blue-600')} drop-shadow-xl flex justify-center">
      <div class="absolute top-[20px] w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
    </div>
  </div>
`;

export const getDestinationHTML = (theme) => `
  <div class="relative flex items-center justify-center" style="width: 40px; height: 40px;">
    <div class="absolute w-8 h-8 rounded-full ${theme === 'night' ? 'bg-cyan-500/30' : 'bg-blue-500/20'} animate-ping"></div>
    <div class="w-4 h-4 rounded-full ${theme === 'night' ? 'bg-cyan-400 shadow-[0_0_10px_cyan]' : 'bg-blue-600 shadow-md'} border-2 border-white"></div>
  </div>
`;

export const getPinHTML = (isSelected) => `
  <div class="pin-container ${isSelected ? 'pin-selected' : ''}">
    <div class="pin-outer"></div>
    <div class="pin-inner"></div>
    <div class="pin-shadow"></div>
  </div>
`;

export const getRouteTargetHTML = (distanceKm, durationMin, theme) => `
  <div class="flex flex-col items-center" style="transform:translateY(-100%);">
    <div class="flex items-center gap-2 px-4 py-1.5 border-2 rounded-xl font-black backdrop-blur-md shadow-xl whitespace-nowrap mb-2 
      ${theme === 'night' ? 'bg-zinc-900/90 border-cyan-500 text-cyan-400' : 'bg-white/95 border-blue-600 text-blue-700'}">
      <span class="${theme === 'night' ? 'text-white' : 'text-zinc-900'}">📍 ${distanceKm}km</span>
      <span class="opacity-30">|</span>
      <span>⏳ ${durationMin}min</span>
    </div>
    <div class="w-7 h-7 rounded-full rounded-br-none -rotate-45 border-2 border-white shadow-lg 
      ${theme === 'night' ? 'bg-gradient-to-br from-cyan-400 to-blue-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}"></div>
  </div>
`;

export const SHARED_MAP_STYLES = `
  @keyframes radar-scan {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .car-marker-container, .radar-node-premium, .red-light-marker-premium, .dest-marker, .pin-marker {
    background: none !important;
    border: none !important;
  }
`;
