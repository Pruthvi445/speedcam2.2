'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Globe, Camera, Zap, Users, 
  Radar, Target, Instagram, MessageCircle, 
  Lock, AlertTriangle, ArrowRight, Database, 
  Cpu, Terminal, Radio, Share2, Shield
} from 'lucide-react';

// Animation Variants
const containerVars = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.3 }
  }
};

const itemVars = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#020202] text-[#eee] font-mono selection:bg-cyan-500 selection:text-black overflow-x-hidden">
      
      {/* 1. CYBER BACKGROUND & SCAN LINE */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#161616_1px,transparent_1px),linear-gradient(to_bottom,#161616_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute inset-0 bg-radial-at-t from-cyan-500/10 via-transparent to-transparent" />
        {/* Moving Scan Line */}
        <motion.div 
          initial={{ top: '-10%' }}
          animate={{ top: '110%' }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-x-0 h-[2px] bg-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.5)] z-10"
        />
      </div>

      {/* 2. TOP TACTICAL NAV */}
      <nav className="fixed top-0 w-full z-[100] border-b border-white/5 bg-black/60 backdrop-blur-md px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
            <Link href="/" className="group flex items-center gap-3 border border-cyan-500/30 px-4 py-1.5 rounded-sm hover:bg-cyan-500 hover:text-black transition-all">
              <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Exit_Protocol</span>
            </Link>
          </motion.div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end border-r border-white/10 pr-6">
              <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Global Uplink</span>
              <span className="text-[10px] text-emerald-500 font-black animate-pulse">● STABLE_ENCRYPTION</span>
            </div>
            <div className="flex gap-4">
              <Share2 size={18} className="text-zinc-500 hover:text-cyan-500 cursor-pointer transition-colors" />
              <Instagram size={18} className="text-zinc-500 hover:text-pink-500 cursor-pointer transition-colors" />
            </div>
          </div>
        </div>
      </nav>

      <motion.div 
        variants={containerVars}
        initial="hidden"
        animate="visible"
        className="relative z-10 pt-32 px-6 max-w-[1400px] mx-auto pb-20"
      >
        {/* 3. HERO SECTION */}
        <header className="mb-32">
          <motion.div variants={itemVars} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/5 mb-6">
            <Radio size={12} className="text-cyan-500 animate-pulse" />
            <span className="text-[9px] font-black text-cyan-500 uppercase tracking-[0.3em]">Direct Data Feed v2.2.0_LIVE</span>
          </motion.div>
          
          <motion.h1 variants={itemVars} className="text-[12vw] md:text-[9vw] font-black leading-[0.8] tracking-tighter uppercase italic mb-8">
            SPEED<span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-800">CAM</span>
          </motion.h1>

          <motion.div variants={itemVars} className="grid md:grid-cols-2 gap-12">
            <p className="text-zinc-400 text-xl md:text-2xl leading-tight font-light italic border-l-2 border-cyan-500 pl-8">
              "We monitor the sensors. A high-fidelity tactical network built to identify every speed trap, interceptor, and red-light node in real-time."
            </p>
            <div className="flex flex-col justify-end">
                <div className="flex items-center gap-4 text-zinc-600 text-[10px] font-black uppercase tracking-[0.5em] mb-2">
                    <Terminal size={14} /> System_Capabilities
                </div>
                <p className="text-zinc-500 text-xs leading-relaxed uppercase">
                    3000M Detection Range. Sub-second Latency. Admin-Verified Nodes. Optimized for Pune-Mumbai High-Speed Corridors.
                </p>
            </div>
          </motion.div>
        </header>

        {/* 4. SYSTEM SPECS (STYLIZED BENTO) */}
        <motion.section variants={itemVars} className="mb-32 group">
          <div className="bg-gradient-to-br from-zinc-900/40 to-black border border-white/5 rounded-3xl p-8 md:p-16 relative overflow-hidden transition-all duration-700 hover:border-cyan-500/30">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[100px] group-hover:bg-cyan-500/10 transition-all" />
            
            <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
              <div>
                <h3 className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                    <Database size={14}/> Operation_Center
                </h3>
                <h2 className="text-4xl font-black uppercase italic mb-6">Live Tactical <br/>Dashboard</h2>
                <p className="text-zinc-400 text-sm leading-relaxed mb-8">
                  SpeedCam utilizes a dual-engine architecture (2D/3D) to provide sub-meter accuracy for upcoming hazards. Our **LIVE_HUD** technology synchronizes telemetry data with OSM vector tiles to predict safe speeds and identify mobile interceptors before you see them.
                </p>
                <div className="flex flex-wrap gap-4">
                    {['3KM_Scannner', 'Voice_Synthesis_Alerts', 'Night_Mode_Tactical', 'Triangulated_GPS'].map((tag) => (
                        <span key={tag} className="text-[9px] font-bold border border-white/10 px-3 py-1 rounded text-zinc-500 hover:text-white hover:border-white transition-all cursor-default uppercase italic">
                            {tag}
                        </span>
                    ))}
                </div>
              </div>

              <div className="relative aspect-square md:aspect-video rounded-2xl border border-white/10 bg-zinc-950 flex items-center justify-center overflow-hidden shadow-2xl shadow-cyan-500/10">
                <div className="absolute inset-0 bg-[url('https://www.openstreetmap.org/assets/graph-0081d09e5b4.png')] opacity-10 grayscale group-hover:scale-110 transition-transform duration-1000" />
                <div className="relative z-20 flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full border-4 border-cyan-500/30 flex items-center justify-center mb-4 relative">
                        <div className="absolute inset-0 border-2 border-cyan-500 rounded-full animate-ping opacity-20"></div>
                        <Radar className="text-cyan-400 animate-spin-slow" size={40} />
                    </div>
                    <div className="text-[10px] font-black tracking-widest text-cyan-500 animate-pulse">SYSTEM: LIVE_ACTIVE</div>
                </div>
                <div className="absolute bottom-4 left-4 font-mono text-[9px] text-zinc-500 uppercase tracking-tighter bg-black/80 p-2">
                    Sector: MH_West_Uplink<br/>
                    Coordinates: 18.5204, 73.8567
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* 5. TACTICAL GRID (BENTO) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
          {[
            { 
              icon: <Zap className="text-cyan-400" />, 
              title: "3KM Detection", 
              desc: "Deep-scanning radius identifying red-light and speed nodes up to 3000 meters away." 
            },
            { 
              icon: <Shield className="text-emerald-500" />, 
              title: "Verified Only", 
              desc: "Multi-stage verification protocol ensuring 100% data fidelity across the network." 
            },
            { 
              icon: <Cpu className="text-purple-500" />, 
              title: "Auto-Odometer", 
              desc: "Real-time trip tracking and speed limit oversight for safer high-speed transit." 
            }
          ].map((card, i) => (
            <motion.div 
              key={i}
              variants={itemVars}
              whileHover={{ y: -10 }}
              className="p-10 border border-white/5 bg-zinc-900/20 rounded-[2.5rem] relative group overflow-hidden"
            >
              <div className="absolute -bottom-8 -right-8 opacity-5 group-hover:scale-125 transition-transform">
                {card.icon}
              </div>
              <div className="mb-6 p-4 w-fit rounded-2xl bg-white/5 border border-white/5 group-hover:border-cyan-500/30 transition-all">
                {React.cloneElement(card.icon, { size: 24 })}
              </div>
              <h4 className="text-xl font-black uppercase italic mb-4">{card.title}</h4>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-tight italic leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* 6. CALL TO ACTION - THE "COMMAND CENTER" */}
        <motion.section 
          variants={itemVars}
          className="bg-zinc-100 rounded-[3rem] p-12 md:p-24 text-black relative overflow-hidden group hover:shadow-[0_0_50px_rgba(255,255,255,0.1)] transition-all duration-700"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
            <Radar size={400} />
          </div>
          
          <div className="relative z-10 max-w-3xl">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-6">Uplink_Initiation</h3>
            <h2 className="text-5xl md:text-8xl font-black uppercase italic leading-[0.8] tracking-tighter mb-10">
              Command <br/> The Road.
            </h2>
            <p className="text-sm font-black uppercase tracking-widest mb-12 opacity-80 max-w-lg leading-relaxed">
              Activate the SpeedCam Protocol. Access real-time sensor data, voice alerts, and spatial analytics for the ultimate transit experience.
            </p>
            
            <div className="flex flex-col md:flex-row gap-6">
              <Link href="/map" className="bg-black text-white px-12 py-6 rounded-2xl font-black uppercase italic flex items-center justify-center gap-3 hover:scale-105 transition-transform shadow-2xl">
                ACCESS SYSTEM <ArrowRight size={20} />
              </Link>
              <button className="border-2 border-black px-12 py-6 rounded-2xl font-black uppercase italic hover:bg-black hover:text-white transition-all">
                Submit Sensor Node
              </button>
            </div>
          </div>
        </motion.section>

        {/* 7. FOOTER */}
        <footer className="mt-32 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em]">
          <div className="flex flex-col gap-2">
            <span>© 2026 SPEEDCAM COMMAND PROTOCOL</span>
            <span className="text-zinc-800">BASE_OF_OPERATIONS: PUNE_HUB</span>
          </div>
          <div className="flex gap-10">
            <span className="text-white hover:text-cyan-500 cursor-pointer transition-colors underline decoration-white/10 underline-offset-4">Core_Code</span>
            <span className="text-white hover:text-cyan-500 cursor-pointer transition-colors underline decoration-white/10 underline-offset-4">Security_Ops</span>
            <span className="text-white hover:text-cyan-500 cursor-pointer transition-colors underline decoration-white/10 underline-offset-4">Privacy_Root</span>
          </div>
        </footer>

      </motion.div>

      {/* GLOBAL CUSTOM ANIMATIONS */}
      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
        .bg-radial-at-t {
          background-image: radial-gradient(at top, var(--tw-gradient-from), var(--tw-gradient-to));
        }
      `}</style>
    </main>
  );
}