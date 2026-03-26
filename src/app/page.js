'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Radar, Navigation, Activity, Zap, Target, Globe, Cpu, Lock, ChevronRight, Camera } from 'lucide-react';
import { SecureDataService } from '@/services/secureDataService';
import { setAllCameras } from '@/store/slices/cameraSlice';

const HUDMetric = ({ label, value, color }) => (
  <div className="flex flex-col min-w-[80px]">
    <span className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-0.5 md:mb-1">{label}</span>
    <div className="flex items-baseline gap-1.5 md:gap-2">
      <span className={`text-base md:text-xl font-mono font-black ${color}`}>{value}</span>
      <div className={`w-0.5 md:w-1 h-2 md:h-3 ${color.replace('text-', 'bg-')}/20 rounded-full animate-pulse`} />
    </div>
  </div>
);

export default function StartPage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const dispatch = useDispatch();
  const { allCameras, speedCameras, redLightCameras } = useSelector(state => state.camera);

  useEffect(() => {
    setIsLoaded(true);
    
    // Fetch real-time camera data
    const unsubscribe = SecureDataService.getApprovedCameras?.((data) => {
      dispatch(setAllCameras(data));
    }) || (() => {});

    const handleMouseMove = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <main className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-start md:justify-center p-4 md:p-6 relative overflow-x-hidden overflow-y-auto font-sans selection:bg-cyan-500/30">
      
      {/* --- ADVANCED BACKGROUND SYSTEM --- */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Animated Grid */}
        <div 
          className="absolute inset-0 opacity-[0.1] md:opacity-[0.15]"
          style={{
            backgroundImage: `linear-gradient(to right, #1a1a1a 1px, transparent 1px), linear-gradient(to bottom, #1a1a1a 1px, transparent 1px)`,
            backgroundSize: '30px 30px',
            transform: `perspective(1000px) rotateX(60deg) translateY(${mousePos.y * 0.3}px) translateZ(0)`,
            transition: 'transform 0.2s ease-out'
          }}
        />
        
        {/* Radial Glows */}
        <div className="absolute top-1/4 md:top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[800px] h-[300px] md:h-[800px] bg-cyan-500/10 blur-[60px] md:blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[250px] md:w-[500px] h-[250px] md:h-[500px] bg-blue-600/5 blur-[50px] md:blur-[100px] rounded-full" />

        {/* Moving Particles */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-0.5 md:w-1 h-0.5 md:h-1 bg-cyan-500/30 rounded-full"
            initial={{ 
              x: Math.random() * 100 + "%", 
              y: Math.random() * 100 + "%",
              opacity: 0 
            }}
            animate={{ 
              y: [null, "-20%"],
              opacity: [0, 0.8, 0]
            }}
            transition={{ 
              duration: Math.random() * 5 + 5, 
              repeat: Infinity, 
              ease: "linear",
              delay: Math.random() * 5
            }}
          />
        ))}
      </div>

      <AnimatePresence>
        {isLoaded && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl w-full z-10 flex flex-col gap-8 md:gap-12 py-8 md:py-0"
          >
            
            {/* --- TOP HUD BAR --- */}
            <div className="flex flex-col md:flex-row justify-between items-center md:items-start border-b border-white/5 pb-6 md:pb-8 mb-2 md:mb-4 gap-6 md:gap-0">
              <div className="flex gap-4 md:gap-8 overflow-x-auto no-scrollbar w-full md:w-auto justify-center md:justify-start px-2 md:px-0">
                <HUDMetric label="System Core" value="v2.2" color="text-cyan-400" />
                <HUDMetric label="Total Active Nodes" value={allCameras?.length || 0} color="text-blue-400" />
              </div>

              
              <div className="text-right w-full md:w-auto flex justify-center md:justify-end">
                <div className="flex items-center gap-3 bg-zinc-900/40 backdrop-blur-md border border-white/5 px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl">
                   <div className="flex flex-col items-end">
                      <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest">Network Speed</span>
                      <span className="text-[10px] md:text-xs font-mono font-bold text-emerald-400">1.2 GB/S</span>
                   </div>
                   <Activity className="text-emerald-500 animate-pulse" size={14} />
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:grid lg:grid-cols-12 gap-10 md:gap-16 items-center">
              
              {/* --- LEFT: BRANDING & CALL TO ACTION --- */}
              <div className="lg:col-span-7 space-y-8 md:space-y-10 text-center lg:text-left order-2 lg:order-1">
                <motion.div
                  initial={{ x: -30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[9px] font-black tracking-[0.3em] uppercase mb-4 md:mb-6">
                    Next-Gen Tactical Awareness
                  </div>
                  <h1 className="text-[14vw] sm:text-7xl md:text-8xl lg:text-9xl font-[1000] tracking-tighter uppercase italic leading-[0.8] mb-4 md:mb-6">
                    <span className="text-white block">NAVZY</span>
                    <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 bg-clip-text text-transparent">AI</span>
                  </h1>
                  <p className="text-base md:text-lg text-zinc-400 max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium">
                    The world's most advanced tactical driving HUD for mobile. Real-time radar intelligence, AI-driven scanning, and encrypted network synchronization.
                  </p>
                </motion.div>

                {/* Main Action Buttons - Larger for touch */}
                <motion.div 
                  className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center lg:justify-start"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Link href="/map" className="group relative w-full sm:w-auto">
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl md:rounded-2xl blur opacity-30 group-hover:opacity-75 transition duration-500" />
                    <button className="relative w-full sm:w-auto px-8 md:px-12 py-5 bg-white text-black rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 active:scale-95 transition-all">
                      Initialise System <Zap size={20} fill="black" />
                    </button>
                  </Link>

                  <Link href="/about" className="group w-full sm:w-auto">
                    <button className="w-full sm:w-auto px-8 md:px-12 py-5 bg-zinc-900 border border-white/10 text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-zinc-800 active:scale-95 transition-all">
                      Protocol Intel
                    </button>
                  </Link>
                </motion.div>

                {/* Micro-Features - Visible but subtle on mobile */}
                <div className="grid grid-cols-3 gap-4 md:gap-6 pt-6 md:pt-8 border-t border-white/5">
                  {[
                    { icon: <Radar size={14} />, label: "Radar" },
                    { icon: <Target size={14} />, label: "AutoScan" },
                    { icon: <Lock size={14} />, label: "Secure" }
                  ].map((f, i) => (
                    <div key={i} className="flex flex-col md:flex-row items-center justify-center lg:justify-start gap-1 md:gap-3 text-zinc-500">
                      <div className="text-cyan-500">{f.icon}</div>
                      <span className="text-[7px] md:text-[9px] font-bold uppercase tracking-widest">{f.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* --- RIGHT/TOP: TACTICAL HUD VISUAL --- */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="lg:col-span-5 relative w-full max-w-[400px] lg:max-w-none mx-auto order-1 lg:order-2"
                style={{ 
                  perspective: '1000px'
                }}
              >
                <div className="relative z-10 rounded-[2rem] md:rounded-[3rem] p-2 md:p-4 bg-gradient-to-br from-white/10 to-transparent border border-white/20 backdrop-blur-3xl overflow-hidden group shadow-[0_0_50px_rgba(6,182,212,0.1)]">
                  <div className="absolute inset-0 bg-cyan-500/5 mix-blend-overlay" />
                  <img 
                    src="/tactical_radar_hero.png" 
                    alt="Tactical Radar"
                    className="w-full h-auto rounded-[1.8rem] md:rounded-[2.5rem] opacity-90 group-hover:scale-105 transition-transform duration-1000"
                  />
                  
                  {/* Digital Overlays - Resized for mobile */}
                  <div className="absolute top-4 left-4 md:top-10 md:left-10 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-cyan-500/30">
                    <div className="w-1.5 md:w-2 h-1.5 md:h-2 bg-cyan-500 rounded-full animate-ping" />
                    <span className="text-[8px] md:text-[10px] font-mono font-black uppercase tracking-tighter italic">Navzy_Scanning...</span>
                  </div>

                  <div className="absolute bottom-4 right-4 md:bottom-10 md:right-10 p-4 md:p-6 bg-black/80 backdrop-blur-xl rounded-2xl md:rounded-3xl border border-white/10 max-w-[140px] md:max-w-[200px]">
                    <div className="text-[8px] md:text-xs font-black text-cyan-500 mb-1 md:mb-2 uppercase tracking-widest">Target Acquired</div>
                    <div className="text-xl md:text-3xl font-mono font-black">0.8km</div>
                    <div className="h-0.5 md:h-1 bg-zinc-800 mt-2 md:mt-3 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-cyan-500"
                        initial={{ width: "0%" }}
                        animate={{ width: "65%" }}
                        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Mobile Floating Orbs */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }} 
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-5 -right-5 w-20 h-20 bg-cyan-500/10 rounded-full blur-2xl block lg:hidden" 
                />
              </motion.div>

            </div>

            {/* --- FOOTER LIVE FEED --- */}
            <div className="mt-8 md:mt-auto pt-8 md:pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center md:items-end gap-8 md:gap-10 pb-6 md:pb-0">
              <div className="flex gap-10 md:gap-16 justify-center w-full md:w-auto">
                <div className="space-y-0.5 md:space-y-1 text-center md:text-left">
                  <div className="text-[8px] md:text-[9px] text-zinc-600 font-black uppercase tracking-[0.3em]">Network Nodes</div>
                  <div className="text-lg md:text-2xl font-mono font-black bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent italic">12.4k ACTIVE</div>
                </div>
                <div className="space-y-0.5 md:space-y-1 text-center md:text-left border-l border-white/5 pl-10 md:pl-0 md:border-0">
                  <div className="text-[8px] md:text-[9px] text-zinc-600 font-black uppercase tracking-[0.3em]">Encryption</div>
                  <div className="text-lg md:text-2xl font-mono font-black text-emerald-500 italic uppercase">AES-256</div>
                </div>
              </div>

              <div className="flex items-center gap-4 md:gap-6 bg-zinc-900/30 p-4 rounded-2xl border border-white/5 w-full md:w-auto">
                 <div className="flex -space-x-2">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-[#050505] bg-zinc-800 flex items-center justify-center shrink-0">
                        <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800" />
                      </div>
                    ))}
                 </div>
                 <div className="text-[8px] md:text-[10px] text-zinc-500 font-bold leading-tight uppercase tracking-wider">
                   Join <span className="text-white">45,219 drivers</span> <br /> connected to the swarm
                 </div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* CRT Overlay Effect - Refined for mobile */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%),linear-gradient(90deg,rgba(255,0,0,0.01),rgba(0,255,0,0.005),rgba(0,0,128,0.01))] z-[100] bg-[length:100%_4px,4px_100%] opacity-50 md:opacity-100" />

    </main>
  );
}