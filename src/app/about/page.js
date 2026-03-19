'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Shield, ChevronLeft, Globe, Camera, Zap, Users, 
  Cpu, Navigation, Activity, Radar, Target,
  Instagram, MessageCircle, Lock, Network, MapPin,
  AlertTriangle, CheckCircle2, Milestone, ArrowRight
} from 'lucide-react';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#000] text-[#eee] font-mono selection:bg-cyan-500 selection:text-black">
      
      {/* 1. TOP DYNAMIC NAV */}
      <nav className="fixed top-0 w-full z-[100] border-b border-white/10 bg-black/80 backdrop-blur-md px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 hover:text-cyan-400 transition-colors">
            <ChevronLeft size={18} />
            <span className="text-[10px] font-bold uppercase tracking-tighter italic">v0.2 Release</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <a href="https://wa.me/yourlink" className="p-2 border border-white/10 rounded-lg hover:bg-emerald-500 hover:text-black transition-all">
            <MessageCircle size={18} />
          </a>
          <a href="https://instagram.com/yourlink" className="p-2 border border-white/10 rounded-lg hover:bg-pink-500 hover:text-black transition-all">
            <Instagram size={18} />
          </a>
          <div className="bg-zinc-900 px-3 py-1 rounded border border-white/5 hidden md:flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-bold tracking-tighter italic">PUNE • MUMBAI ACTIVE</span>
          </div>
        </div>
      </nav>

      <div className="relative pt-32 px-6 max-w-[1400px] mx-auto pb-20">
        
        {/* 2. HERO SECTION */}
        <header className="mb-32 border-l-4 border-cyan-500 pl-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-[10vw] md:text-[8vw] font-black leading-[0.8] tracking-tighter uppercase mb-6 italic">
              SPEED<span className="text-zinc-800">CAM</span>
            </h1>
            <p className="text-cyan-400 text-xs md:text-sm font-black uppercase tracking-[0.4em] mb-8">
              Community‑powered real‑time speed camera alerts
            </p>
            <div className="max-w-2xl">
              <p className="text-zinc-400 text-lg leading-relaxed lowercase italic">
                "SpeedCam is a community-driven platform that alerts drivers about speed cameras and red-light cameras in real-time. No fines. No surprises. Only pure data."
              </p>
            </div>
          </motion.div>
        </header>

        {/* 3. CORE SPECS BENTO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-32">
          {/* Mission */}
          <div className="p-8 bg-zinc-900/30 border border-white/5 rounded-[2.5rem]">
             <Target className="text-cyan-500 mb-6" size={32} />
             <h3 className="text-xl font-black uppercase italic mb-4">Mission</h3>
             <ul className="space-y-3 text-xs text-zinc-500 font-bold uppercase tracking-tight">
                <li className="flex gap-2"> <CheckCircle2 size={14} className="text-cyan-500"/> Avoid Speeding Fines</li>
                <li className="flex gap-2"> <CheckCircle2 size={14} className="text-cyan-500"/> Community-Driven Accuracy</li>
                <li className="flex gap-2"> <CheckCircle2 size={14} className="text-cyan-500"/> Zero Personal Data Storage</li>
             </ul>
          </div>

          {/* Coverage */}
          <div className="p-8 bg-zinc-900/30 border border-white/5 rounded-[2.5rem]">
             <Globe className="text-blue-500 mb-6" size={32} />
             <h3 className="text-xl font-black uppercase italic mb-4">Active Coverage</h3>
             <p className="text-4xl font-black mb-2 italic">0.2v</p>
             <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Pune & Mumbai Urban Areas + Expressways</p>
          </div>

          {/* Privacy */}
          <div className="p-8 bg-zinc-900/30 border border-white/5 rounded-[2.5rem]">
             <Lock className="text-emerald-500 mb-6" size={32} />
             <h3 className="text-xl font-black uppercase italic mb-4">Security</h3>
             <p className="text-xs text-zinc-400 leading-relaxed italic lowercase">
               "Your privacy matters. We never store your location. All camera data is fetched live and never cached."
             </p>
          </div>
        </div>

        {/* 4. HOW IT WORKS (STEP-BY-STEP) */}
        <section className="mb-32">
          <h2 className="text-2xl font-black uppercase italic mb-12 flex items-center gap-4">
            <Zap className="text-yellow-500" /> Operational Protocol
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Submit", desc: "Users pin cameras via live map." },
              { step: "02", title: "Verify", desc: "Admins cross-check for accuracy." },
              { step: "03", title: "Alert", desc: "Real-time notifications on approach." },
              { step: "04", title: "Purge", desc: "Community flags & removes fake pins." }
            ].map((item, i) => (
              <div key={i} className="relative p-6 border-t border-white/10">
                <span className="text-cyan-500 text-xs font-black mb-2 block tracking-widest">{item.step}</span>
                <h4 className="text-lg font-black uppercase italic mb-2">{item.title}</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 5. DATA SPECIFICATIONS */}
        <div className="grid md:grid-cols-2 gap-6 mb-32">
           <div className="bg-zinc-900/50 p-10 rounded-[3rem] border border-white/5">
              <h3 className="text-xl font-black uppercase italic mb-8">Supported Units</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-6 p-4 bg-black/40 rounded-2xl border border-white/5">
                   <Camera className="text-red-500" />
                   <div>
                      <p className="text-sm font-black uppercase">Speed Cameras</p>
                      <p className="text-[10px] text-zinc-500 font-bold">FIXED ENFORCEMENT</p>
                   </div>
                </div>
                <div className="flex items-center gap-6 p-4 bg-black/40 rounded-2xl border border-white/5">
                   <Activity className="text-orange-500" />
                   <div>
                      <p className="text-sm font-black uppercase">Red Light Cameras</p>
                      <p className="text-[10px] text-zinc-500 font-bold">SIGNAL VIOLATION SENSORS</p>
                   </div>
                </div>
              </div>
           </div>

           <div className="bg-zinc-900/50 p-10 rounded-[3rem] border border-white/5">
              <h3 className="text-xl font-black uppercase italic mb-8">Future Roadmap</h3>
              <div className="space-y-4">
                {[
                  "Pan‑India Expansion",
                  "iOS & Android Native Apps",
                  "Accident Zone Alerts",
                  "Highway-Specific Logic"
                ].map((task, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs text-zinc-400 italic">
                    <Milestone size={14} className="text-cyan-500" /> {task}
                  </div>
                ))}
              </div>
           </div>
        </div>

        {/* 6. LEGAL & CTA */}
        <section className="bg-white text-black p-12 md:p-20 rounded-[4rem] text-center mb-20 relative overflow-hidden">
           <AlertTriangle className="absolute -top-10 -left-10 text-black/5" size={300} />
           <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-8">Safe Velocity. <br /> Smart Data.</h2>
              <p className="text-xs md:text-sm font-bold uppercase tracking-widest max-w-2xl mx-auto mb-12 opacity-70">
                Disclaimer: SpeedCam is a community tool. Not an official government service. Always obey local traffic laws. Not responsible for fines.
              </p>
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                 <Link href="/map" className="bg-black text-white px-12 py-6 rounded-full font-black uppercase tracking-tighter hover:scale-105 transition-transform flex items-center justify-center gap-2">
                    Open Live Map <ArrowRight size={20} />
                 </Link>
                 <button className="bg-transparent border-2 border-black px-12 py-6 rounded-full font-black uppercase tracking-tighter hover:bg-black hover:text-white transition-all">
                    Join Community
                 </button>
              </div>
           </div>
        </section>

        {/* FOOTER */}
        <footer className="flex justify-between items-center text-[10px] font-black text-zinc-600 uppercase tracking-widest px-4">
           <span>© 2026 SPEEDCAM PROTOCOL</span>
           <div className="flex gap-6">
              <span className="text-white">Github</span>
              <span className="text-white">Docs</span>
           </div>
        </footer>

      </div>
    </main>
  );
}