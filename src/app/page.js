'use client'; // Yeh line error fix karegi

import Link from 'next/link';
import { Shield, Map, Info, Radar, Navigation, Activity, Zap, Target } from 'lucide-react';

export default function StartPage() {
  return (
    <main className="min-h-screen bg-[#020202] text-zinc-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* BACKGROUND TECH EFFECT */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.05),transparent_70%)]" />
        <div className="absolute w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
        
        {/* Scanline Animation using Tailwind */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.5)] animate-[scanline_8s_linear_infinite]" />
      </div>

      <div className="max-w-6xl w-full z-10">
        
        {/* LOGO & TITLE SECTION */}
        <header className="text-center mb-16 relative">
          <div className="inline-flex items-center justify-center p-3 mb-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 shadow-2xl shadow-cyan-500/10">
            <Shield className="w-12 h-12 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          </div>
          
          <h1 className="text-6xl md:text-9xl font-[1000] tracking-tighter uppercase italic leading-none">
            <span className="text-white">SPEED</span>
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 bg-clip-text text-transparent">CAM</span>
          </h1>
          
          <div className="flex items-center justify-center gap-4 mt-6 text-[10px] font-bold tracking-[0.5em] text-cyan-500/60 uppercase">
            <span className="h-[1px] w-12 bg-cyan-900" />
            Tactical HUD System
            <span className="h-[1px] w-12 bg-cyan-900" />
          </div>
        </header>

        <div className="grid lg:grid-cols-12 gap-8 items-stretch">
          
          {/* LEFT COLUMN: HERO IMAGE & STATUS */}
          <div className="lg:col-span-7 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-[2rem] blur opacity-10 group-hover:opacity-30 transition duration-1000" />
            <div className="relative h-full min-h-[350px] bg-zinc-900 border border-white/10 rounded-[1.8rem] overflow-hidden">
              <img 
                src="favicon.ico" 
                alt="Radar Tech"
                className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-transparent to-transparent" />
              
              <div className="absolute top-6 left-6 flex flex-col gap-2">
                <div className="bg-black/60 backdrop-blur-md border border-cyan-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_8px_cyan]" />
                  <span className="text-[10px] font-mono font-bold tracking-widest uppercase">System Online</span>
                </div>
                <div className="bg-black/60 backdrop-blur-md border border-red-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <Target className="w-3 h-3 text-red-500" />
                  <span className="text-[10px] font-mono font-bold tracking-widest uppercase">Live Tracking</span>
                </div>
              </div>

              <div className="absolute bottom-8 left-8 right-8">
                <h3 className="text-2xl font-bold mb-2 tracking-tight">Detection Unit Alpha</h3>
                <p className="text-zinc-400 text-sm max-w-md leading-relaxed">Advanced laser & GPS sensors calibrated for speed trap detection within a 5km tactical radius.</p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: NAVIGATION CARDS */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            <Link href="/map" className="flex-1 group">
              <div className="h-full bg-zinc-900/50 hover:bg-zinc-800/80 backdrop-blur-xl border border-white/5 hover:border-cyan-500/50 rounded-[1.8rem] p-8 transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                  <Radar className="w-24 h-24" />
                </div>
                <div>
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Navigation className="text-cyan-400 w-6 h-6" />
                  </div>
                  <h2 className="text-3xl font-bold mb-2 tracking-tight">Launch Map</h2>
                  <p className="text-zinc-500 text-sm leading-relaxed">Access real-time navigation and tactical radar alerts.</p>
                </div>
                <div className="mt-4 flex items-center text-cyan-400 text-[10px] font-bold gap-2 tracking-[0.2em]">
                  ESTABLISH CONNECTION <Zap className="w-3 h-3" />
                </div>
              </div>
            </Link>

            <Link href="/about" className="flex-1 group">
              <div className="h-full bg-zinc-900/50 hover:bg-zinc-800/80 backdrop-blur-xl border border-white/5 hover:border-yellow-500/50 rounded-[1.8rem] p-8 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Info className="text-yellow-400 w-6 h-6" />
                  </div>
                  <h2 className="text-3xl font-bold mb-2 tracking-tight">Intelligence</h2>
                  <p className="text-zinc-500 text-sm leading-relaxed">Learn about the algorithms protecting your driving record.</p>
                </div>
                <div className="mt-4 flex items-center text-yellow-500 text-[10px] font-bold gap-2 tracking-[0.2em]">
                  READ PROTOCOLS <Activity className="w-3 h-3" />
                </div>
              </div>
            </Link>

          </div>
        </div>

        {/* FOOTER STATS */}
        <footer className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex gap-12">
            <div>
              <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em] mb-1">Active Nodes</div>
              <div className="text-xl font-mono text-cyan-500">12,840</div>
            </div>
            <div className="border-l border-white/10 pl-12">
              <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em] mb-1">Fleet Online</div>
              <div className="text-xl font-mono text-white">45,219</div>
            </div>
          </div>
          <div className="text-[10px] font-mono text-zinc-600 tracking-widest bg-zinc-900/50 px-4 py-2 rounded-full border border-white/5">
            SECURE_LINK // SPEEDCAM_CORE_v4.0
          </div>
        </footer>
      </div>
    </main>
  );
}