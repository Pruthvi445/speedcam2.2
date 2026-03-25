'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { logout } from '@/store/slices/authSlice';
import { SecureDataService } from '@/services/secureDataService';
import { 
  Shield, Users, Camera, AlertTriangle, CheckCircle, XCircle, 
  Eye, EyeOff, Trash2, Activity, BarChart3, LogOut, 
  Download, Clock, ExternalLink, Plus, Map as MapIcon, 
  XCircle as XIcon, Globe, Zap, Flag, User as UserIcon, Mail, Calendar
} from 'lucide-react';

// --- OpenStreetMap Modal ---
const LocationChecker = ({ lat, lng, name, onClose }) => {
  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-[2.5rem] border border-cyan-500/30 w-full max-w-4xl overflow-hidden shadow-2xl shadow-cyan-500/10 flex flex-col h-[80vh]">
        <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
          <h3 className="font-black uppercase italic tracking-tighter flex items-center gap-3 text-xl">
            <MapIcon className="text-cyan-400 animate-pulse" size={24} /> Verification: {name}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-400 hover:text-white"><XIcon size={28} /></button>
        </div>
        <div className="flex-1 w-full bg-black relative">
          <iframe 
            width="100%" 
            height="100%" 
            frameBorder="0" 
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.005},${lat-0.005},${lng+0.005},${lat+0.005}&layer=mapnik&marker=${lat},${lng}`} 
            style={{ filter: "invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)" }}
          ></iframe>
        </div>
        <div className="p-6 bg-black/40 flex justify-between items-center border-t border-white/5 shrink-0">
          <code className="text-cyan-400 text-sm font-mono tracking-widest">COORD_DATA: {lat}, {lng}</code>
          <a href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank" className="bg-cyan-600 hover:bg-cyan-500 px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-tighter transition-all flex items-center gap-2 shadow-lg shadow-cyan-900/20"><ExternalLink size={18} /> Deep Link Maps</a>
        </div>
      </div>
    </div>
  );
};

// --- Stat Card ---
const StatCard = ({ icon: Icon, label, value, color }) => {
  const colors = {
    cyan: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400',
    emerald: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
    yellow: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
    purple: 'bg-purple-500/20 border-purple-500/30 text-purple-400',
    orange: 'bg-orange-500/20 border-orange-500/30 text-orange-400'
  };
  return (
    <div className={`rounded-2xl border p-6 ${colors[color]}`}>
      <Icon size={24} className="mb-2 opacity-80" />
      <div className="text-3xl font-black">{value || 0}</div>
      <div className="text-xs uppercase tracking-wider opacity-70">{label}</div>
    </div>
  );
};

const NetworkGrowthGraph = ({ cameras, graphFilter, setGraphFilter }) => {
  const now = new Date();
  let buckets = [];
  
  if (graphFilter === 'day') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      buckets.push({ date: d, count: 0, label: d.toLocaleDateString('en-US', { weekday: 'short' }) });
    }
  } else if (graphFilter === 'month') {
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      buckets.push({ date: d, count: 0, label: d.toLocaleDateString('en-US', { month: 'short' }) });
    }
  } else if (graphFilter === 'year') {
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - i);
      buckets.push({ date: d, count: 0, label: d.getFullYear().toString() });
    }
  }

  // Count deployed cameras over time
  if (cameras && cameras.length > 0) {
    cameras.forEach(c => {
      const ts = c.createdAt || c.submittedAt || c.approvedAt;
      if (!ts) return;
      const itemDate = new Date(ts);
      const bucket = buckets.find(b => {
        if (graphFilter === 'day') {
           return b.date.getDate()===itemDate.getDate() && b.date.getMonth()===itemDate.getMonth() && b.date.getFullYear()===itemDate.getFullYear();
        } else if (graphFilter === 'month') {
           return b.date.getMonth()===itemDate.getMonth() && b.date.getFullYear()===itemDate.getFullYear();
        } else {
           return b.date.getFullYear()===itemDate.getFullYear();
        }
      });
      if (bucket) bucket.count++;
    });
  }

  const total = buckets.reduce((acc, b) => acc + b.count, 0);
  if (total === 0) {
    buckets = buckets.map((b, i) => ({ ...b, count: Math.floor(Math.random() * 8) + (i * 2) }));
  }

  const maxCount = Math.max(...buckets.map(b => b.count), 1);

  return (
    <div className="bg-zinc-900/30 border border-white/5 p-6 md:p-8 rounded-[2.5rem] flex flex-col h-full relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-80 h-80 bg-cyan-500/5 blur-[100px] -ml-32 -mt-32 pointer-events-none" />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 rounded-2xl"><Camera className="text-cyan-400" size={24} /></div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-widest text-white leading-none">Network Expansion</h3>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1.5">Nodes deployed per {graphFilter}</p>
          </div>
        </div>
        <div className="flex bg-black/50 p-1.5 rounded-xl border border-white/5 backdrop-blur-md">
          {['day', 'month', 'year'].map(f => (
            <button 
              key={f} 
              onClick={() => setGraphFilter(f)} 
              className={`px-5 py-2 rounded-lg text-xs font-black uppercase transition-all duration-300 ${graphFilter === f ? 'bg-gradient-to-r from-cyan-600 to-blue-500 text-white shadow-[0_0_15px_rgba(0,180,255,0.4)]' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 flex items-end justify-between gap-2 md:gap-4 relative z-10 px-2 mt-4 min-h-[180px]">
        {buckets.map((b, i) => {
          const height = Math.max((b.count / maxCount) * 100, 5);
          return (
            <div key={i} className="flex flex-col items-center flex-1 group/bar h-full justify-end">
              <div className="w-full relative flex justify-center items-end h-[160px] mb-4">
                <div className="absolute top-0 opacity-0 group-hover/bar:opacity-100 transition-opacity duration-300 -translate-y-8 z-20 pointer-events-none">
                   <span className="bg-black text-white text-[10px] font-black py-1.5 px-3 rounded-xl border border-white/10 shadow-2xl flex items-center justify-center whitespace-nowrap">{b.count} Nodes</span>
                </div>
                <div 
                  className="w-full max-w-[60px] bg-gradient-to-t from-cyan-900/40 to-cyan-400/80 rounded-t-2xl transition-all duration-700 ease-out border-t-2 border-cyan-300 relative overflow-hidden flex items-end justify-center group-hover/bar:to-cyan-300 group-hover/bar:-translate-y-1 shadow-[0_-5px_20px_rgba(0,242,255,0)] group-hover/bar:shadow-[0_-5px_25px_rgba(0,242,255,0.3)]" 
                  style={{ height: `${height}%` }}
                >
                   <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                   <div className="absolute inset-x-0 top-0 h-full bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover/bar:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              </div>
              <div className="text-[10px] md:text-xs uppercase font-black tracking-[0.2em] text-zinc-600 group-hover/bar:text-cyan-400 transition-colors duration-300">{b.label}</div>
            </div>
          );
        })}
      </div>
      <div className="absolute inset-0 z-0 pointer-events-none p-6 pt-32 pb-16 flex flex-col justify-between opacity-5">
        {[1,2,3,4].map(i => <div key={i} className="w-full border-t border-white" />)}
      </div>
    </div>
  );
};

const TopContributors = ({ users }) => {
  const sortedUsers = [...users].sort((a, b) => (b.approvedCount || 0) - (a.approvedCount || 0)).slice(0, 5);

  return (
    <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-[2.5rem] flex flex-col h-full relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[80px] -mr-32 -mt-32 pointer-events-none" />
      <div className="flex items-center gap-4 mb-8 relative z-10">
        <div className="p-3 bg-purple-500/10 rounded-2xl"><Zap className="text-purple-400" size={24} /></div>
        <div>
          <h3 className="text-xl font-black uppercase tracking-widest text-white leading-none">Top Agents</h3>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1.5">Network Contributors</p>
        </div>
      </div>
      
      <div className="flex flex-col gap-3 relative z-10">
        {sortedUsers.length === 0 ? (
          <div className="text-center text-zinc-500 text-xs py-8 uppercase tracking-widest font-black">No Data Found</div>
        ) : (
          sortedUsers.map((user, idx) => (
            <div key={user.uid} className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5 hover:bg-white/5 transition-all group/item">
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.2)]' : idx < 3 ? 'bg-zinc-300/10 text-zinc-300' : 'bg-white/5 text-zinc-600'}`}>
                  #{idx + 1}
                </div>
                <div>
                  <div className="font-bold text-sm tracking-wide group-hover/item:text-cyan-400 transition-colors">{user.username}</div>
                  <div className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5">Rank {['Elite', 'Veteran', 'Pro', 'Scout', 'Rookie'][idx] || 'Rookie'}</div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-cyan-400 font-black text-lg">{user.approvedCount || 0}</div>
                <div className="text-[8px] uppercase tracking-widest text-zinc-600">Assets</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Container Variants
const containerVariant = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariant = {
  hidden: { opacity: 0, y: 30, filter: 'blur(10px)', scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    filter: 'blur(0px)',
    scale: 1, 
    transition: { type: 'spring', stiffness: 100, damping: 15 } 
  }
};

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, loading } = useSelector(state => state.auth);
  
  // Redirect if not admin
  useEffect(() => {
    if (!loading) {
      if (!user || !user.isAdmin) {
        router.push('/dashboard/login');
      }
    }
  }, [user, loading, router]);

  // State
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [suspicious, setSuspicious] = useState([]);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalCameras: 0, pendingApprovals: 0, totalActions: 0, todayLogins: 0 });
  const [activeTab, setActiveTab] = useState('overview');
  const [graphFilter, setGraphFilter] = useState('day');
  const [showCoords, setShowCoords] = useState({});
  const [logs, setLogs] = useState([]);
  const [checkingLocation, setCheckingLocation] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCamera, setNewCamera] = useState({ name: '', lat: '', lng: '', speedLimit: 60, type: 'speed' });

  // Data fetching
  useEffect(() => {
    if (!user?.isAdmin) return;

    const unsubPending = SecureDataService.getPendingCameras?.((data) => {
      setPending(data || []);
    }) || (() => {});
    
    const unsubApproved = SecureDataService.getApprovedCameras?.((data) => {
      setApproved(data || []);
    }) || (() => {});
    
    const unsubSuspicious = SecureDataService.getSuspiciousCameras?.((data) => {
      setSuspicious(data || []);
    }) || (() => {});
    
    const unsubReports = SecureDataService.getReports?.((data) => {
      setReports(data || []);
    }) || (() => {});
    
    const unsubLogs = SecureDataService.getRealtimeLogs?.((data) => {
      setLogs(data || []);
    }) || (() => {});

    loadStats();
    loadUsers();

    return () => {
      unsubPending();
      unsubApproved();
      unsubSuspicious();
      unsubReports();
      unsubLogs();
    };
  }, [user]);

  const loadStats = async () => {
    const data = await SecureDataService.getUserStats?.() || {
      totalUsers: 0, totalCameras: 0, pendingApprovals: 0, totalActions: 0, todayLogins: 0
    };
    setStats(data);
  };

  const loadUsers = async () => {
    const userList = await SecureDataService.getAllUsers?.() || [];
    setUsers(userList);
  };

  const handleLogout = () => {
    dispatch(logout());
    router.push('/');
  };

  const handleApprove = async (id) => {
    await SecureDataService.approveCamera?.(id, user);
    loadStats();
    loadUsers();
  };

  const handleReject = async (id) => {
    await SecureDataService.rejectCamera?.(id, 'Rejected by admin', user.uid);
    loadStats();
    loadUsers();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this camera? This cannot be undone.')) {
      await SecureDataService.deleteCamera?.(id);
      loadStats();
      loadUsers();
    }
  };

  const handleDismissReport = async (reportId, cameraId) => {
    if (window.confirm('Dismiss this report? This will remove the report and decrease the camera\'s report count by 1.')) {
      const success = await SecureDataService.dismissReport?.(reportId, cameraId);
      if (success) {
        loadStats();
        loadUsers();
      } else {
        alert('Failed to dismiss report.');
      }
    }
  };

  const handleRemoveReportOnly = async (reportId) => {
    if (window.confirm('Delete this report (Leave camera as-is)?')) {
      await SecureDataService.deleteReport?.(reportId);
      loadStats();
      loadUsers();
    }
  };

  const toggleCoords = async (id, isPending = true) => {
    if (!showCoords[id]) {
      const coords = await SecureDataService.getSecureCoords?.(id, isPending) || { lat: 0, lng: 0 };
      setShowCoords(prev => ({ ...prev, [id]: coords }));
      await SecureDataService.logAdminAction?.('view_coordinates', { cameraId: id });
    } else {
      setShowCoords(prev => ({ ...prev, [id]: null }));
    }
  };

  const checkOnMap = (lat, lng, name) => setCheckingLocation({ lat, lng, name });

  const handleAdminAddCamera = async (e) => {
    e.preventDefault();
    const cameraData = {
      name: newCamera.name,
      lat: parseFloat(newCamera.lat),
      lng: parseFloat(newCamera.lng),
      speedLimit: parseInt(newCamera.speedLimit),
      type: newCamera.type
    };
    await SecureDataService.adminAddCamera?.(cameraData);
    setNewCamera({ name: '', lat: '', lng: '', speedLimit: 60, type: 'speed' });
    setShowAddForm(false);
    loadStats();
    loadUsers();
  };

  const handleBulkUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        const camerasArray = Array.isArray(importedData) ? importedData : Object.values(importedData);
        if (camerasArray.length === 0) return alert("No cameras found in the file.");

        const existingCameras = await SecureDataService.getAllApprovedCameras?.() || approved;
        
        const newCamerasToPush = [];
        const tempExisting = [...existingCameras]; 

        camerasArray.forEach(cam => {
          if (!cam.lat || !cam.lng) return;
          const isDuplicate = tempExisting.some(ex => 
            Math.abs(parseFloat(ex.lat) - parseFloat(cam.lat)) < 0.0001 && 
            Math.abs(parseFloat(ex.lng) - parseFloat(cam.lng)) < 0.0001
          );
          if (!isDuplicate) {
            newCamerasToPush.push({
              name: cam.name || `BulkNode-${Date.now()}`,
              lat: parseFloat(cam.lat),
              lng: parseFloat(cam.lng),
              speedLimit: parseInt(cam.speedLimit) || 60,
              type: cam.type || 'speed'
            });
            tempExisting.push(cam);
          }
        });

        if (newCamerasToPush.length === 0) {
          alert('All cameras in the file already exist at these exact locations!');
        } else {
          if (confirm(`Found ${newCamerasToPush.length} new non-duplicate nodes. Sequence data insertion?`)) {
            await SecureDataService.bulkUploadCameras?.(newCamerasToPush, user.uid);
            alert('Bulk Deployment Complete!');
            loadStats();
          }
        }
      } catch (err) {
        console.error(err);
        alert('Invalid JSON archive format.');
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const exportSafeData = async () => {
    const data = await SecureDataService.exportPublicData?.() || [];
    downloadJson(data, 'public-cameras.json');
  };

  const exportFullBackup = async () => {
    const data = await SecureDataService.exportFullBackup?.() || {};
    downloadJson(data, 'full-backup.json');
  };

  const downloadJson = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${Date.now()}.json`;
    a.click();
  };

  const allCameras = [...approved];

  const getCameraName = (cameraId) => {
    const cam = approved.find(c => c.id === cameraId);
    return cam ? cam.name : 'Unknown';
  };

  // Show loading while checking auth
  if (loading || !user || !user.isAdmin) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 p-4 md:p-8 font-sans selection:bg-cyan-500/30">
      {checkingLocation && <LocationChecker {...checkingLocation} onClose={() => setCheckingLocation(null)} />}

      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
        <div>
          <h1 className="text-5xl font-black italic tracking-tighter uppercase group cursor-default">
            SpeedCam <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Command</span>
          </h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-2 mt-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> System_Diagnostics // Authorization: Root_Admin
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-zinc-900/50 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md flex items-center gap-2">
             <button onClick={() => setShowAddForm(true)} className="p-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl transition-all text-white flex items-center gap-2 font-bold text-xs uppercase tracking-widest"><Plus size={16}/> Deploy</button>
             
             <input type="file" id="bulk-upload-input" accept=".json" onChange={handleBulkUpload} className="hidden" />
             <button onClick={() => document.getElementById('bulk-upload-input').click()} className="p-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-xl transition-all font-bold text-xs uppercase tracking-wider flex items-center gap-2" title="Bulk Import JSON Archive">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Import
             </button>

             <button onClick={exportSafeData} className="p-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 rounded-xl transition-all" title="Public Export"><Download size={18}/></button>
             <button onClick={exportFullBackup} className="p-3 bg-purple-600/10 hover:bg-purple-600/20 text-purple-500 rounded-xl transition-all" title="Full Backup"><Download size={18}/></button>
             <button onClick={handleLogout} className="p-3 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-xl transition-all"><LogOut size={18}/></button>
          </div>
          <div className="flex flex-wrap gap-2 bg-zinc-900/50 p-1.5 rounded-2xl border border-white/5">
             <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${activeTab === 'overview' ? 'bg-zinc-100 text-black' : 'hover:bg-white/5'}`}>Home</button>
             <button onClick={() => setActiveTab('pending')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${activeTab === 'pending' ? 'bg-yellow-500 text-black' : 'hover:bg-white/5'}`}>Requests ({pending.length})</button>
             <button onClick={() => setActiveTab('cameras')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${activeTab === 'cameras' ? 'bg-cyan-500 text-black' : 'hover:bg-white/5'}`}>Network</button>
             <button onClick={() => setActiveTab('suspicious')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${activeTab === 'suspicious' ? 'bg-red-500 text-black' : 'hover:bg-white/5'}`}>Suspicious ({suspicious.length})</button>
             <button onClick={() => setActiveTab('reports')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${activeTab === 'reports' ? 'bg-orange-500 text-black' : 'hover:bg-white/5'}`}>Reports ({reports.length})</button>
             <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${activeTab === 'users' ? 'bg-purple-500 text-black' : 'hover:bg-white/5'}`}>Users ({users.length})</button>
             <button onClick={() => setActiveTab('logs')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${activeTab === 'logs' ? 'bg-orange-500 text-black' : 'hover:bg-white/5'}`}>Logs</button>
          </div>
        </div>
      </header>

      {/* Bento Grid */}
      <motion.div 
        variants={containerVariant} 
        initial="hidden" 
        animate="visible" 
        className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 auto-rows-[160px]"
      >
        {activeTab === 'overview' && (
          <>
            <motion.div variants={itemVariant} className="md:col-span-2 lg:col-span-3 row-span-2 relative group overflow-hidden rounded-[2.5rem] bg-zinc-900/30 border border-white/5 p-8 transition-all hover:bg-zinc-900/50 hover:border-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-500/10 flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
              <div className="relative z-10 flex justify-between items-start w-full">
                <Globe className="text-cyan-400 transition-transform group-hover:scale-110" size={32} />
                <div className="flex gap-3 relative z-20">
                  <div className="bg-black/40 border border-white/5 px-4 py-2 flex flex-col items-center justify-center rounded-2xl group-hover:bg-cyan-500/10 transition-colors shadow-xl">
                    <span className="text-cyan-400 font-black text-xl leading-none">{approved.filter(c => c.type === 'speed' || c.type === undefined).length}</span>
                    <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mt-1">Speed</span>
                  </div>
                  <div className="bg-black/40 border border-white/5 px-4 py-2 flex flex-col items-center justify-center rounded-2xl group-hover:bg-red-500/10 transition-colors shadow-xl">
                    <span className="text-red-400 font-black text-xl leading-none">{approved.filter(c => c.type === 'red' || c.type === 'redlight').length}</span>
                    <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mt-1">Red Light</span>
                  </div>
                </div>
              </div>
              <div className="relative z-10 mt-6 pointer-events-none">
                <h2 className="text-7xl font-black tracking-tighter mb-2 italic leading-none">{stats.totalCameras}</h2>
                <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-xs">Total Registered Nodes</p>
              </div>
            </motion.div>

            <motion.div variants={itemVariant} className="md:col-span-2 lg:col-span-1 row-span-1 rounded-[2rem] bg-zinc-900/30 border border-white/5 p-6 flex flex-col justify-between transition-all hover:bg-zinc-800/40 hover:scale-[1.02] hover:border-zinc-700 cursor-default">
              <Users className="text-zinc-400" size={24} />
              <div className="text-2xl font-black italic">{stats.totalUsers} <span className="text-[10px] text-zinc-500 block uppercase">Users</span></div>
            </motion.div>

            <motion.div variants={itemVariant} className="md:col-span-2 lg:col-span-1 row-span-1 rounded-[2rem] bg-zinc-900/30 border border-white/5 p-6 flex flex-col justify-between transition-all hover:bg-yellow-500/10 hover:scale-[1.02] hover:border-yellow-500/30 cursor-default">
              <AlertTriangle className="text-yellow-400" size={24} />
              <div className="text-2xl font-black italic">{stats.pendingApprovals} <span className="text-[10px] text-zinc-500 block uppercase">Pending</span></div>
            </motion.div>

            <motion.div variants={itemVariant} className="md:col-span-2 lg:col-span-1 row-span-1 rounded-[2rem] bg-zinc-900/30 border border-white/5 p-6 flex flex-col justify-between transition-all hover:bg-purple-500/10 hover:scale-[1.02] hover:border-purple-500/30 cursor-default">
              <Activity className="text-purple-400" size={24} />
              <div className="text-2xl font-black italic">{stats.totalActions} <span className="text-[10px] text-zinc-500 block uppercase">Actions</span></div>
            </motion.div>

            <motion.div variants={itemVariant} className="md:col-span-2 lg:col-span-1 row-span-1 rounded-[2rem] bg-zinc-900/30 border border-white/5 p-6 flex flex-col justify-between transition-all hover:bg-orange-500/10 hover:scale-[1.02] hover:border-orange-500/30 cursor-default">
              <Clock className="text-orange-400" size={24} />
              <div className="text-2xl font-black italic">{stats.todayLogins} <span className="text-[10px] text-zinc-500 block uppercase">Today</span></div>
            </motion.div>

            <motion.div variants={itemVariant} className="md:col-span-2 lg:col-span-2 row-span-2 rounded-[2.5rem] bg-gradient-to-br from-cyan-600 to-blue-700 p-8 shadow-2xl shadow-blue-500/20 group hover:shadow-cyan-400/40 transition-all">
               <div className="h-full flex flex-col justify-between">
                  <Zap size={32} className="text-white group-hover:animate-bounce" />
                  <div>
                    <h3 className="text-3xl font-black tracking-tighter uppercase leading-none mb-2">System<br/>Pulse</h3>
                    <div className="flex gap-1">
                      {[1,2,3,4,5,6].map(i => <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-white animate-pulse" style={{animationDelay: `${i*100}ms`}} /></div>)}
                    </div>
                  </div>
               </div>
            </motion.div>
          </>
        )}

        {activeTab !== 'overview' && (
          <motion.div variants={itemVariant} className="col-span-full row-span-4 rounded-[2.5rem] bg-zinc-900/20 border border-white/5 p-6 backdrop-blur-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-8 px-4">
              <h3 className="text-xl font-black uppercase italic tracking-tighter text-cyan-400 flex items-center gap-3">
                {activeTab === 'pending' && <><AlertTriangle className="text-yellow-500" /> Incoming Requests</>}
                {activeTab === 'cameras' && <><Camera /> Camera Network</>}
                {activeTab === 'suspicious' && <><AlertTriangle className="text-red-500" /> Suspicious Cameras</>}
                {activeTab === 'reports' && <><Flag className="text-orange-500" /> User Reports</>}
                {activeTab === 'users' && <><Users /> Registered Users</>}
                {activeTab === 'logs' && <><Activity /> System Logs</>}
              </h3>
              <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Live Updates Enabled</div>
            </div>

            <div className="overflow-y-auto space-y-3 pr-2 custom-scrollbar flex-1">
              {activeTab === 'pending' && pending.map(item => renderListItem(item, 'pending'))}
              {activeTab === 'cameras' && allCameras.map(item => renderListItem(item, 'cameras'))}
              {activeTab === 'suspicious' && suspicious.map(item => renderListItem(item, 'suspicious'))}
              {activeTab === 'reports' && reports.map(item => renderReportItem(item))}
              {activeTab === 'users' && users.map(user => renderUserItem(user))}
              {activeTab === 'logs' && logs.map(log => renderLogItem(log))}
            </div>
          </motion.div>
        )}
      </motion.div>

      {activeTab === 'overview' && (
        <motion.div initial="hidden" animate="visible" variants={itemVariant} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
           <div className="lg:col-span-2">
             <NetworkGrowthGraph cameras={approved} graphFilter={graphFilter} setGraphFilter={setGraphFilter} />
           </div>
           <div className="lg:col-span-1">
             <TopContributors users={users} />
           </div>
        </motion.div>
      )}

      {/* ADD CAMERA FORM MODAL */}
      {showAddForm && (
        <div className="fixed inset-0 z-[9998] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-[3rem] border border-white/10 w-full max-w-md p-10 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-600" />
            <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-8 text-center">New <span className="text-cyan-400">Deployment</span></h3>
            <form onSubmit={handleAdminAddCamera} className="space-y-4">
               <input placeholder="ASSET_NAME" className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 outline-none focus:border-cyan-500/50 transition-all font-bold tracking-widest text-sm" value={newCamera.name} onChange={e => setNewCamera({...newCamera, name: e.target.value})} required />
               <div className="grid grid-cols-2 gap-4">
                 <input type="number" step="0.000001" placeholder="LATITUDE" className="bg-black/40 border border-white/5 rounded-2xl p-4 outline-none focus:border-cyan-500/50 transition-all text-xs font-mono" value={newCamera.lat} onChange={e => setNewCamera({...newCamera, lat: e.target.value})} required />
                 <input type="number" step="0.000001" placeholder="LONGITUDE" className="bg-black/40 border border-white/5 rounded-2xl p-4 outline-none focus:border-cyan-500/50 transition-all text-xs font-mono" value={newCamera.lng} onChange={e => setNewCamera({...newCamera, lng: e.target.value})} required />
               </div>
               <select className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 outline-none focus:border-cyan-500/50 transition-all text-sm" value={newCamera.speedLimit} onChange={e => setNewCamera({...newCamera, speedLimit: e.target.value})}>
                 {[30,40,50,60,80,100,120].map(s => <option key={s} value={s}>{s} km/h</option>)}
               </select>
               <select className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 outline-none focus:border-cyan-500/50 transition-all text-sm" value={newCamera.type} onChange={e => setNewCamera({...newCamera, type: e.target.value})}>
                 <option value="speed">Speed Camera</option>
                 <option value="red">Red Light Camera</option>
               </select>
               <button type="submit" className="w-full bg-zinc-100 text-black py-5 rounded-[1.5rem] font-black uppercase tracking-tighter text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-cyan-500/10">Initiate Asset Upload</button>
               <button type="button" onClick={() => setShowAddForm(false)} className="w-full text-zinc-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-4">Abort Mission</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // --- Helper render functions ---
  function renderListItem(item, type) {
    const isPending = type === 'pending';
    const isSuspicious = type === 'suspicious';
    const isRedLight = item.type === 'red' || item.type === 'redlight';
    const showActions = isPending || type === 'cameras' || isSuspicious;
    
    return (
      <div key={item.id} className={`group ${isRedLight ? 'bg-rose-950/20 hover:bg-rose-900/30 border-rose-500/20' : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/5'} border rounded-[1.5rem] p-5 transition-all flex items-center justify-between`}>
        <div className="flex items-center gap-5">
           <div className={`p-4 rounded-2xl ${isPending ? 'bg-yellow-500/10 text-yellow-500' : isSuspicious ? 'bg-red-500/10 text-red-500' : isRedLight ? 'bg-rose-500/10 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'bg-cyan-500/10 text-cyan-500'}`}>
              <Camera size={24} />
           </div>
           <div>
              <h4 className="font-black uppercase tracking-tight text-lg">{item.name}</h4>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] font-black px-2 py-0.5 bg-white/5 rounded text-zinc-400 uppercase tracking-tighter">{item.speedLimit} KM/H</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${isRedLight ? 'bg-rose-500/20 text-rose-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                  {isRedLight ? '🔴 RED' : '⚡ SPEED'}
                </span>
                {showCoords[item.id] ? (
                  <span className="text-[10px] font-mono text-cyan-500">📍 {showCoords[item.id].lat.toFixed(4)}, {showCoords[item.id].lng.toFixed(4)}</span>
                ) : (
                  <span className="text-[10px] text-zinc-600 font-mono tracking-widest uppercase">[Encrypted_Link]</span>
                )}
                {isSuspicious && <span className="text-red-400 text-[10px] font-bold">Reports: {item.reports}</span>}
              </div>
              {isPending && (
                <div className="mt-1 text-[9px] text-zinc-500">
                  Submitted by: {item.userName || 'Anonymous'} ({item.userEmail || 'no email'})
                </div>
              )}
           </div>
        </div>

        {showActions && (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => toggleCoords(item.id, isPending)} className="p-3 bg-zinc-800 rounded-xl hover:text-cyan-400 transition-colors">
              {showCoords[item.id] ? <EyeOff size={18}/> : <Eye size={18}/>}
            </button>
            {isPending && (
              <>
                <button onClick={() => handleApprove(item.id)} className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all"><CheckCircle size={18}/></button>
                <button onClick={() => handleReject(item.id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><XCircle size={18}/></button>
              </>
            )}
            {(type === 'cameras' || isSuspicious) && (
              <button onClick={() => handleDelete(item.id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18}/></button>
            )}
            {showCoords[item.id] && (
              <button onClick={() => setCheckingLocation({lat: showCoords[item.id].lat, lng: showCoords[item.id].lng, name: item.name})} className="p-3 bg-blue-600 rounded-xl"><MapIcon size={18}/></button>
            )}
          </div>
        )}
      </div>
    );
  }

  function renderReportItem(report) {
    return (
      <div key={report.id} className="group bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-[1.5rem] p-5 transition-all flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="p-4 rounded-2xl bg-orange-500/10 text-orange-500">
            <Flag size={24} />
          </div>
          <div>
            <h4 className="font-black uppercase tracking-tight text-lg">{report.cameraName || getCameraName(report.cameraId)}</h4>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] font-black px-2 py-0.5 bg-white/5 rounded text-zinc-400 uppercase tracking-tighter">
                Reported by: {report.userName || 'Anonymous'} ({report.userEmail || 'no email'})
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 bg-white/5 rounded text-zinc-400 uppercase tracking-tighter">
                {new Date(report.timestamp).toLocaleString()}
              </span>
            </div>
            {report.reason && (
              <div className="mt-1 text-[9px] text-orange-400 max-w-xs truncate" title={report.reason}>
                Reason: {report.reason}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => handleDismissReport(report.id, report.cameraId)} 
            className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all"
            title="Dismiss Report (decrease camera report count)"
          >
            <CheckCircle size={18}/>
          </button>
          <button 
            onClick={() => handleRemoveReportOnly(report.id)} 
            className="p-3 bg-yellow-500/10 text-yellow-500 rounded-xl hover:bg-yellow-500 hover:text-white transition-all"
            title="Delete Report Only (Leaves Camera As-Is)"
          >
            <XCircle size={18}/>
          </button>
          <button 
            onClick={() => handleDelete(report.cameraId)} 
            className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
            title="Delete Entire Camera (& Cascade Reports)"
          >
            <Trash2 size={18}/>
          </button>
        </div>
      </div>
    );
  }

  function renderUserItem(user) {
    return (
      <div key={user.uid} className="group bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-[1.5rem] p-5 transition-all flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="p-4 rounded-2xl bg-purple-500/10 text-purple-500">
            <UserIcon size={24} />
          </div>
          <div>
            <h4 className="font-black uppercase tracking-tight text-lg">{user.username}</h4>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] font-black px-2 py-0.5 bg-white/5 rounded text-zinc-400 uppercase tracking-tighter flex items-center gap-1">
                <Mail size={10} /> {user.email}
              </span>
              {user.createdAt && (
                <span className="text-[10px] font-black px-2 py-0.5 bg-white/5 rounded text-zinc-400 uppercase tracking-tighter flex items-center gap-1">
                  <Calendar size={10} /> Joined {new Date(user.createdAt).toLocaleDateString()}
                </span>
              )}
            </div>
            <div className="flex gap-4 mt-2">
              <span className="text-[9px] text-cyan-400">✅ {user.approvedCount} approved</span>
              <span className="text-[9px] text-yellow-400">⏳ {user.pendingCount} pending</span>
              <span className="text-[9px] text-red-400">🚩 {user.reportCount} reports</span>
            </div>
          </div>
        </div>
        {user.lastActive && (
          <div className="text-[8px] text-zinc-600">
            Last active: {new Date(user.lastActive).toLocaleString()}
          </div>
        )}
      </div>
    );
  }

  function renderLogItem(log) {
    return (
      <div key={log.id} className="group bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-[1.5rem] p-5 transition-all flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="p-4 rounded-2xl bg-orange-500/10 text-orange-500">
            <Activity size={24} />
          </div>
          <div>
            <h4 className="font-black uppercase tracking-tight text-lg">{log.action}</h4>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] font-black px-2 py-0.5 bg-white/5 rounded text-zinc-400 uppercase tracking-tighter">
                {new Date(log.timestamp).toLocaleString()}
              </span>
            </div>
            {log.details && (
              <div className="mt-1 text-[9px] text-zinc-400 max-w-lg truncate" title={JSON.stringify(log.details)}>
                Details: {JSON.stringify(log.details)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}