'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, AlertTriangle, ShieldAlert, Navigation, ChevronDown, CheckCircle, Flag } from 'lucide-react';
import { setSelectedCamera } from '@/store/slices/cameraSlice';
import { SecureDataService } from '@/services/secureDataService';

export default function CameraDetailsSheet() {
  const dispatch = useDispatch();
  const selectedCamera = useSelector(state => state.camera.selectedCamera);
  const user = useSelector(state => state.auth.user);
  
  const [reportReason, setReportReason] = useState('Fake Camera');
  const [otherReason, setOtherReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const closeSheet = () => {
    dispatch(setSelectedCamera(null));
    setTimeout(() => {
      setReportReason('Fake Camera');
      setOtherReason('');
      setSubmitSuccess(false);
    }, 300);
  };

  const handleReport = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please login to report cameras.");
      return;
    }

    setIsSubmitting(true);
    const finalReason = reportReason === 'Other' ? otherReason : reportReason;

    const success = await SecureDataService.reportCamera(selectedCamera, user, finalReason);
    setIsSubmitting(false);

    if (success) {
      setSubmitSuccess(true);
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(200);
      }
      setTimeout(() => {
        closeSheet();
      }, 2000);
    } else {
      alert("Failed to report camera. Please try again.");
    }
  };

  // Prevent closing when clicking inside the sheet
  const handleSheetClick = (e) => {
    e.stopPropagation();
  };

  const isHighReport = selectedCamera && (selectedCamera.reports || 0) >= 3;

  return (
    <AnimatePresence>
      {selectedCamera && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSheet}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000]"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, info) => {
              if (info.offset.y > 100) {
                closeSheet();
              }
            }}
            onClick={handleSheetClick}
            className="fixed bottom-0 left-0 right-0 z-[2001] bg-gradient-to-b from-zinc-900 to-black border-t border-white/10 rounded-t-[2.5rem] p-6 pb-SAFE drop-shadow-2xl overflow-hidden touch-none"
            style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
          >
            {/* Drag Handle */}
            <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-6 cursor-grab active:cursor-grabbing" />

            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Camera Details</h2>
                <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase mt-1">
                  ID: {selectedCamera.id?.substring(0, 8) || 'Unknown'}
                </p>
              </div>
              <button onClick={closeSheet} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {submitSuccess ? (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center justify-center py-10"
              >
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 relative">
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute inset-0 border-2 border-emerald-500/50 rounded-full" />
                  <CheckCircle size={40} className="text-emerald-500" />
                </div>
                <h3 className="text-xl font-black text-emerald-400 uppercase tracking-tight">Report Received</h3>
                <p className="text-xs text-zinc-400 mt-2 text-center max-w-xs">Thank you for contributing to the network. Your report has been logged.</p>
              </motion.div>
            ) : (
              <>
                {/* Info Cards */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-black/50 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-1.5 rounded-lg ${selectedCamera.type === 'red' || selectedCamera.type === 'redlight' ? 'bg-red-500/20 text-red-500' : 'bg-cyan-500/20 text-cyan-400'}`}>
                        <Camera size={16} />
                      </div>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Type</span>
                    </div>
                    <span className="font-black text-white text-lg tracking-tight uppercase">
                      {selectedCamera.type === 'red' || selectedCamera.type === 'redlight' ? 'Red Light' : 'Speed'}
                    </span>
                  </div>

                  <div className="bg-black/50 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                     <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg bg-yellow-500/20 text-yellow-500">
                        <AlertTriangle size={16} />
                      </div>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Limit</span>
                    </div>
                    <span className="font-black text-white text-lg tracking-tight">
                      {selectedCamera.speedLimit} <span className="text-[10px] text-zinc-500">KM/H</span>
                    </span>
                  </div>

                  <div className={`col-span-2 border rounded-2xl p-4 flex items-center justify-between ${isHighReport ? 'bg-red-500/10 border-red-500/30' : 'bg-black/50 border-white/5'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${isHighReport ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse' : 'bg-zinc-800 text-zinc-400'}`}>
                        <ShieldAlert size={20} />
                      </div>
                      <div>
                        <div className={`font-black tracking-tight ${isHighReport ? 'text-red-400' : 'text-white'}`}>Active Reports</div>
                        <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">User Submissions</div>
                      </div>
                    </div>
                    <div className={`text-3xl font-black italic ${isHighReport ? 'text-red-500' : 'text-zinc-300'}`}>
                      {selectedCamera.reports || 0}
                    </div>
                  </div>
                </div>

                {/* Report Form */}
                <div className="border-t border-white/10 pt-6">
                  <h3 className="text-sm font-black uppercase tracking-tight text-white mb-4 flex items-center gap-2">
                    <Flag size={16} className="text-orange-500" /> File a Report
                  </h3>
                  <form onSubmit={handleReport} className="flex flex-col gap-3">
                    <div className="relative">
                      <select 
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 text-white text-sm rounded-xl p-4 appearance-none outline-none focus:border-cyan-500/50 transition-colors"
                      >
                        <option value="Fake Camera">Fake Camera</option>
                        <option value="Removed / Not Working">Removed / Not Working</option>
                        <option value="Wrong Speed Limit">Wrong Speed Limit</option>
                        <option value="Other">Other</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                    </div>

                    {reportReason === 'Other' && (
                      <motion.textarea
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        placeholder="Please specify details..."
                        value={otherReason}
                        onChange={(e) => setOtherReason(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 text-white text-sm rounded-xl p-4 outline-none focus:border-cyan-500/50 transition-colors resize-none min-h-[80px]"
                        required
                      />
                    )}

                    <button 
                      type="submit" 
                      disabled={isSubmitting || !user}
                      className="mt-2 w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest text-sm py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_5px_20px_rgba(220,38,38,0.2)] active:scale-95"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Report'}
                    </button>
                    {!user && <p className="text-[10px] text-red-400 text-center uppercase tracking-widest font-bold">You must be logged in to report.</p>}
                  </form>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
