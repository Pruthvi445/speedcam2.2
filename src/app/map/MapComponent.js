'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Search, Navigation, AlertTriangle, Target, Activity, LocateFixed,
  Plus, MapPin, BarChart3, Volume2, VolumeX, Gauge, Camera, X, Menu,
  Shield, Zap, Radio, CheckCircle, Info, Clock,
  User, LogOut, Edit2, Sun, Moon, Box
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { 
  setAllCameras, 
  updateCameraLogic, 
  setTripDistance, 
  loadFromStorage,
  setSelectedCamera
} from '@/store/slices/cameraSlice';
import { loadHistory } from '@/store/slices/alertSlice';
import { updateProfile, logout } from '@/store/slices/authSlice';
import { auth, dbGet, dbOnValue, signOut, dbUpdate } from '@/lib/firebase';
import { SecureDataService } from '@/services/secureDataService';
import Map2D from './Map2D';
import Mappa3D from '@/app/components/Mappa3D';
import { AlertItem } from './components/AlertItem';
import { useGeolocation } from './hooks/useGeolocation';
import { useSpeech } from './hooks/useSpeech';
import { useAlerts } from './hooks/useAlerts';
import { useCameraProximity } from './hooks/useCameraProximity';
import { getDist } from './utils/mathUtils';
import { Speedometer } from './components/Speedometer';
import { MapStats } from './components/MapStats';
import { RouteInfo } from './components/RouteInfo';
import { NextCameraInfo } from './components/NextCameraInfo';
import CameraDetailsSheet from './components/CameraDetailsSheet';
import { SearchBar } from './components/SearchBar';


// --- Speedcam HUD ---
export default function SpeedcamHUD() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { allCameras, relevantCameras, crossedCount, overspeedAlert, tripDistance, selectedCamera } = useSelector(state => state.camera);

  const { user } = useSelector(state => state.auth); // from Redux

  const [odo, setOdo] = useState(0);

  const [theme, setTheme] = useState('night');
  const [route, setRoute] = useState([]);
  const [routeBounds, setRouteBounds] = useState(null);
  const [targetCoords, setTargetCoords] = useState(null);
  const [routeDistance, setRouteDistance] = useState(null);
  const [routeDuration, setRouteDuration] = useState(null);
  const [isLocked, setIsLocked] = useState(true);
  const [activeTab, setActiveTab] = useState('hud');
  const [sheetHeight, setSheetHeight] = useState('30%');
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSwapped, setIsSwapped] = useState(false);
  const [is3DActive, setIs3DActive] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Privacy notice
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  useEffect(() => {
    const accepted = localStorage.getItem('privacyAccepted') === 'true';
    setPrivacyAccepted(accepted);
  }, []);
  const acceptPrivacy = () => {
    localStorage.setItem('privacyAccepted', 'true');
    setPrivacyAccepted(true);
  };

  // Camera submission
  const [newCam, setNewCam] = useState({ speedLimit: 60, type: 'speed' });
  const [pinMode, setPinMode] = useState(false);
  const [tempPin, setTempPin] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Audio & Language
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [language, setLanguage] = useState('english');
  const [voiceType, setVoiceType] = useState('male');
  const [alertDistance, setAlertDistance] = useState(3000);


  // Camera and Report states now managed tightly via Redux & CameraDetailsSheet
  const crossedSet = useRef(new Set());
  const allCamerasRef = useRef(allCameras);

  // Keep allCamerasRef updated
  useEffect(() => {
    allCamerasRef.current = allCameras;
  }, [allCameras]);

  // Hook Initialization
  const { alerts, addLocalAlert, removeAlert } = useAlerts();
  const { speechBlocked, speakMultiple, enableAudioManually, getMessage } = useSpeech(language, voiceType, audioEnabled);
  const { processLocationUpdate } = useCameraProximity(
    dispatch, 
    allCameras, 
    crossedSet, 
    alertDistance, 
    addLocalAlert, 
    speakMultiple
  );

  const { myLoc, speed, heading } = useGeolocation(processLocationUpdate, (err, code) => {
    let errorMsg = getMessage('gps_signal_lost');
    if (code === 1) errorMsg = getMessage('gps_permission_denied');
    addLocalAlert('ERROR', errorMsg);
  });



  useEffect(() => {
    dispatch(loadFromStorage());
    dispatch(loadHistory());
  }, [dispatch]);

  // Real‑time listener for approved cameras
  useEffect(() => {
    console.log('🚀 INITIALIZING REAL-TIME CAMERA FETCH...');
    
    // 1. Approved Cameras
    const unsubscribe = SecureDataService.getApprovedCameras((cameras) => {
      console.log(`📡 FIREBASE_SYNC: Received ${cameras.length} items from cameras/approved`);
      dispatch(setAllCameras(cameras));
    });

    return () => {
      console.log('🧹 RELEASING CAMERA LISTENER');
      unsubscribe();
    };
  }, [dispatch]);

  // 2. Pending Cameras (Visibility for Admin OR Owner)
  const [pendingCameras, setPendingCameras] = useState([]);
  useEffect(() => {
    if (!user) {
      setPendingCameras([]);
      return;
    }
    console.log(`👀 Listening for pending submissions (UID: ${user.uid})...`);
    const unsubscribe = SecureDataService.getPendingCameras(async (pendingList) => {
      // Logic: If admin, show all pending. If not admin, show only OWN pending.
      const filteredList = user.isAdmin 
        ? pendingList 
        : pendingList.filter(pc => pc.userId === user.uid);

      // Decrypt coordinates for display
      const decryptedList = await Promise.all(filteredList.map(async (pc) => {
        if (pc.lat && pc.lng) return pc;
        const coords = await SecureDataService.getSecureCoords(pc.id, true);
        return { ...pc, ...coords, status: 'pending' };
      }));
      
      const validPending = decryptedList.filter(c => c.lat && c.lng);
      console.log(`⏳ PENDING_SYNC: Displaying ${validPending.length} nodes to current user`);
      setPendingCameras(validPending);
    });
    return unsubscribe;
  }, [user]);

  // Combine both for map rendering
  const displayCameras = useMemo(() => {
    // Only show approved cameras (allCameras) on the main map.
    // Use pendingCameras only if needed for specific admin views or if we want to show 'requests'.
    // User request: Don't show requests, only show confirmed network cameras.
    return allCameras;
  }, [allCameras]);

  // Debug check for store state
  useEffect(() => {
    console.log('🧪 CURRENT REDUX STATE - Cameras count:', allCameras.length);
  }, [allCameras]);

  // Notifications listener for unread count
  useEffect(() => {
    if (!user?.uid) return;
    const notifRef = `users/${user.uid}/notifications`;
    const unsubscribe = dbOnValue(notifRef, (data) => {
      if (!data) return setUnreadCount(0);
      const unread = Object.values(data).filter(n => !n.read).length;
      setUnreadCount(unread);
    });
    return unsubscribe;
  }, [user]);

  // Clean up stale selections
  useEffect(() => {
    if (selectedCamera && !allCameras.some(c => c.id === selectedCamera.id)) {
      dispatch(setSelectedCamera(null));
    }
  }, [allCameras, selectedCamera, dispatch]);



  // --- HANDLERS ---
  const handleUpdateProfile = async () => {
    if (!editUsername.trim() || !user?.uid) return;
    await dbUpdate(`users/${user.uid}/profile`, { username: editUsername });
    dispatch(updateProfile({ username: editUsername }));
    setIsEditing(false);
  };

  const handleSelectLocation = useCallback(async (coords, label) => {
    if (!coords) {
      setTargetCoords(null);
      setRoute([]);
      setRouteBounds(null);
      setRouteDistance(null);
      setRouteDuration(null);
      setIsLocked(true);
      return;
    }

    const [lat, lng] = coords;
    setTargetCoords([lat, lng]);
    setIsLocked(false); // Zoom to location

    const KEY = process.env.NEXT_PUBLIC_ORS_API_KEY;
    if (!KEY) {
      addLocalAlert('ERROR', 'OpenRouteService API key missing');
      return;
    }

    try {
      if (!myLoc) throw new Error('Wait for GPS signal before routing');
      const routeRes = await fetch(`https://api.openrouteservice.org/v2/directions/driving-car?api_key=${KEY}&start=${myLoc[1]},${myLoc[0]}&end=${lng},${lat}`);
      if (!routeRes.ok) throw new Error('Routing failed');
      const routeData = await routeRes.json();
      const path = routeData.features[0].geometry.coordinates.map(c => [c[1], c[0]]);
      
      const summary = routeData.features[0].properties.summary;
      setRouteDistance((summary.distance / 1000).toFixed(1));
      setRouteDuration(Math.ceil(summary.duration / 60));
      
      setRoute(path);

      const bounds = path.reduce((acc, coord) => {
        return [
          [Math.min(acc[0][0], coord[0]), Math.min(acc[0][1], coord[1])],
          [Math.max(acc[1][0], coord[0]), Math.max(acc[1][1], coord[1])]
        ];
      }, [[90, 180], [-90, -180]]);
      
      setRouteBounds(bounds);
      setIsLocked(false);
    } catch (err) {
      console.error(err);
      addLocalAlert('ERROR', getMessage('search_failed', { error: err.message }));
    }
  }, [myLoc, addLocalAlert, language]);

  const handleMapClick = useCallback((latlng) => {
    dispatch(setSelectedCamera(null)); // Deselect on map click
    if (pinMode) {
      setTempPin([latlng.lat, latlng.lng]);
      setPinMode(false);
      setSheetHeight('70%');
      setActiveTab('add');
    }
  }, [pinMode]);

  const handleAddCamera = useCallback(async (e) => {
    e.preventDefault();
    if (!user?.uid) {
      alert('Please login to add a camera');
      router.push('/auth');
      return;
    }
    // Email verification check removed for easier testing
    // if (!user.emailVerified) {
    //   alert('Please verify your email before adding cameras.');
    //   return;
    // }
    if (!tempPin) {
      alert('Please pin a location on map first.');
      return;
    }

    setSubmitLoading(true);

    try {
      const cameraData = {
        lat: parseFloat(tempPin[0].toFixed(6)),
        lng: parseFloat(tempPin[1].toFixed(6)),
        speedLimit: parseInt(newCam.speedLimit) || 60,
        type: newCam.type || 'speed'
      };

      console.log('📤 Transmitting camera data through SecureDataService...', cameraData);
      const key = await SecureDataService.submitCameraRequest(cameraData, user);
      
      if (!key) throw new Error('Network failure: Key not received');
      console.log('🛰️ Camera added to Firebase with key:', key);

      setSubmitSuccess(true);
      setNewCam({ speedLimit: 60, type: 'speed' });
      setTempPin(null);
      setActiveTab('hud');
      setSheetHeight('30%');
      
      // Success Alert
      addLocalAlert('SUCCESS', getMessage('camera_submitted'));

      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Submit error:', err);
      addLocalAlert('ERROR', getMessage('submit_failed', { error: err.message }));
    } finally {
      setSubmitLoading(false);
    }
  }, [tempPin, newCam, user, router, language, addLocalAlert]);

  const cycleSheetHeight = useCallback(() => {
    if (sheetHeight === '30%') setSheetHeight('70%');
    else if (sheetHeight === '70%') setSheetHeight('100%');
    else setSheetHeight('30%');
  }, [sheetHeight]);

  const nextCam = useMemo(() => {
    if (!myLoc) return null;
    return allCameras
      .map(c => ({ ...c, d: getDist(myLoc[0], myLoc[1], c.lat, c.lng) }))
      .filter(c => !crossedSet.current.has(c.id) && c.d < 3000)
      .sort((a, b) => a.d - b.d)[0] || null;
  }, [allCameras, myLoc, getDist]);

  const handleMarkerClick = useCallback((cam) => {
    dispatch(setSelectedCamera(cam));
  }, [dispatch]);


  // --- RENDER ---
  return (
    <div className="relative h-[100dvh] w-screen bg-black text-white font-sans overflow-hidden">
      <style>{`
        @keyframes radar-scan {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .radar-node-premium, .red-light-marker-premium {
          border: none !important;
          background: none !important;
        }
      `}</style>

      {/* Privacy Notice (unchanged) */}
      {!privacyAccepted && (
        <div className="absolute inset-0 z-[3000] bg-black/95 flex items-center justify-center p-6">
          <div className="bg-zinc-900 border-2 border-cyan-500 rounded-3xl p-8 max-w-md text-center">
            <Shield className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
            <h2 className="text-2xl font-black mb-4">Your Privacy Matters</h2>
            <p className="text-zinc-300 mb-6">
              We <span className="text-cyan-400 font-bold">never store</span> camera locations or your coordinates on this device.<br />
              All camera data is fetched live and never cached. Your settings (audio, language) are saved locally.
            </p>
            <button onClick={acceptPrivacy} className="bg-cyan-600 hover:bg-cyan-500 px-8 py-4 rounded-xl font-black text-lg w-full">
              I Understand, Continue
            </button>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className={`absolute top-0 inset-x-0 z-[1000] px-2 pt-2 md:px-3 md:pt-3 pb-2 flex items-center gap-1.5 md:gap-2 transition-all duration-500 ${theme==='night' ? '' : 'bg-white/40 shadow-sm'}`} style={{background: theme==='night' ? 'linear-gradient(to bottom, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 60%, transparent 100%)' : undefined, backdropFilter: theme==='night' ? 'blur(0px)' : 'blur(20px)'}}>
        {/* Brand + Lock */}
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          <div className={`flex items-center gap-1.5 border rounded-xl px-2 md:px-3 py-1 md:py-1.5 shadow-lg transition-all ${theme==='night' ? 'bg-black/60 border-cyan-500/40' : 'bg-white border-zinc-200'}`}>
            <img src="/icon.png" alt="Navzy" className="w-6 h-6 rounded-md object-cover" />
            <span className={`text-[10px] md:text-[11px] font-black tracking-[1px] md:tracking-[2px] ${theme==='night'?'text-cyan-400':'text-zinc-900'} hidden xs:block uppercase`}>NAVZY</span>
          </div>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setTheme(theme==='night'?'day':'night')} 
              className={`p-2 rounded-xl border transition-all duration-300 ${theme==='night' ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' : 'bg-white border-zinc-200 text-blue-600'}`}
            >
              {theme==='night' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            
            <button
              onClick={() => setIsLocked(!isLocked)}
              className={`p-2 rounded-xl border transition-all duration-300 ${isLocked ? (theme==='night' ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-400' : 'bg-blue-50 border-blue-200 text-blue-600') : (theme==='night' ? 'bg-black/40 border-white/10 text-zinc-500' : 'bg-white border-zinc-100 text-zinc-400')}`}
            >
              <LocateFixed size={16} />
            </button>
          </div>
        </div>
        {/* Search */}
        <SearchBar 
          theme={theme}
          language={language}
          myLoc={myLoc}
          onSelectLocation={handleSelectLocation}
          addLocalAlert={addLocalAlert}
          getMessage={getMessage}
        />
        {/* Profile/Actions */}
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          <button 
            onClick={() => setIs3DActive(!is3DActive)}
            className={`p-2 rounded-xl border transition-all duration-300 ${is3DActive ? (theme==='night' ? 'bg-cyan-500/30 border-cyan-400 text-cyan-400' : 'bg-blue-600 border-blue-600 text-white') : (theme==='night' ? 'bg-black/40 border-white/10 text-zinc-500' : 'bg-white border-zinc-100 text-zinc-400')}`}
          >
            <Box size={16} />
          </button>
          
          <button onClick={() => setShowProfile(!showProfile)} className={`relative p-2 rounded-xl border transition-all ${theme==='night' ? 'bg-black/60 border-white/10' : 'bg-white/90 border-zinc-200 shadow-md'}`}>
            <User size={17} className={user ? (theme==='night'?'text-cyan-400':'text-blue-600') : 'text-zinc-500'} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-black">
                {unreadCount}
              </span>
            )}
          </button>
          
          <button onClick={() => setShowMenu(!showMenu)} className={`p-2 rounded-xl border transition-all ${theme==='night' ? 'bg-black/60 border-white/10' : 'bg-white/90 border-zinc-200 shadow-md'}`}>
            <Menu size={17} className={theme==='night'?'text-white':'text-zinc-900'} />
          </button>
        </div>
      </div>

      {/* User Profile Panel */}
      {showProfile && (
        <div className={`absolute top-16 right-3 z-[1001] border rounded-xl p-4 w-64 backdrop-blur-xl transition-all shadow-2xl ${theme==='night' ? 'bg-black/95 border-white/10' : 'bg-white/95 border-zinc-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme==='night' ? 'bg-cyan-600' : 'bg-blue-600'} text-white`}>
              <User size={20} />
            </div>
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className={`border rounded px-2 py-1 text-sm w-full outline-none ${theme==='night' ? 'bg-black border-cyan-500 text-white' : 'bg-white border-blue-500 text-zinc-900'}`}
                  autoFocus
                />
              ) : (
                <p className={`font-bold ${theme==='night' ? 'text-white' : 'text-zinc-900'}`}>{user?.username || 'User'}</p>
              )}
              <p className="text-xs text-zinc-500">{user?.email || 'Not logged in'}</p>
            </div>
            {user && !isEditing && (
              <button onClick={() => { setEditUsername(user?.username || ''); setIsEditing(true); }}>
                <Edit2 size={16} className="text-zinc-400 hover:text-cyan-500 transition-colors" />
              </button>
            )}
          </div>
          {isEditing && (
            <div className="flex gap-2">
              <button
                onClick={handleUpdateProfile}
                className="flex-1 bg-cyan-600 py-2 rounded text-sm font-bold"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 bg-zinc-700 py-2 rounded text-sm"
              >
                Cancel
              </button>
            </div>
          )}
          {!isEditing && user && (
            <>
              <div className="border-t border-white/10 my-2"></div>
              <button
                onClick={() => router.push('/profile')}
                className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg text-sm flex items-center gap-2"
              >
                <User size={16} /> View Profile
              </button>
              <button
                onClick={async () => {
                  await signOut(auth);
                  dispatch(logout());
                  setShowProfile(false);
                  router.push('/auth');
                }}
                className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg text-sm flex items-center gap-2 text-red-400"
              >
                <LogOut size={16} /> Logout
              </button>
            </>
          )}
          {!user && (
            <button
              onClick={() => router.push('/auth')}
              className="w-full bg-cyan-600 py-2 rounded text-sm font-bold"
            >
              Login / Sign Up
            </button>
          )}
        </div>
      )}

      {/* 3-dot Menu */}
      {showMenu && (
        <div className={`absolute top-16 right-16 z-[1001] border rounded-xl p-2 w-48 backdrop-blur-xl shadow-2xl transition-all ${theme==='night' ? 'bg-black/95 border-white/10' : 'bg-white/95 border-zinc-200'}`}>
          <button onClick={() => { setActiveTab('hud'); setShowMenu(false); }} className={`w-full text-left px-4 py-3 rounded-lg text-sm flex items-center gap-3 transition-colors ${theme==='night' ? 'hover:bg-white/10 text-white' : 'hover:bg-zinc-100 text-zinc-900'}`}><Target size={16} className={theme==='night'?'text-cyan-400':'text-blue-600'} /> HUD</button>
          <button onClick={() => { setIs3DActive(!is3DActive); setShowMenu(false); }} className={`w-full text-left px-4 py-3 rounded-lg text-sm flex items-center gap-3 transition-colors ${theme==='night' ? 'hover:bg-white/10 text-white' : 'hover:bg-zinc-100 text-zinc-900'}`}>
            <Box size={16} className={is3DActive ? 'text-cyan-400' : 'text-zinc-500'} /> 
            3D Map {is3DActive ? <span className="text-[8px] bg-cyan-500/20 px-1 rounded text-cyan-400 ml-auto">ON</span> : <span className="text-[8px] bg-zinc-500/20 px-1 rounded text-zinc-500 ml-auto">OFF</span>}
          </button>
          <button onClick={() => { setPinMode(true); setActiveTab('add'); setShowMenu(false); }} className={`w-full text-left px-4 py-3 rounded-lg text-sm flex items-center gap-3 transition-colors ${theme==='night' ? 'hover:bg-white/10 text-white' : 'hover:bg-zinc-100 text-zinc-900'}`}><Plus size={16} className={theme==='night'?'text-emerald-400':'text-emerald-600'} /> Add Camera</button>
          <button onClick={() => { setShowSettings(true); setShowMenu(false); }} className={`w-full text-left px-4 py-3 rounded-lg text-sm flex items-center gap-3 transition-colors ${theme==='night' ? 'hover:bg-white/10 text-white' : 'hover:bg-zinc-100 text-zinc-900'}`}><Gauge size={16} className={theme==='night'?'text-cyan-400':'text-blue-600'} /> Settings</button>
          <button onClick={() => { router.push('/about'); setShowMenu(false); }} className={`w-full text-left px-4 py-3 rounded-lg text-sm flex items-center gap-3 transition-colors ${theme==='night' ? 'hover:bg-white/10 text-white' : 'hover:bg-zinc-100 text-zinc-900'}`}><Info size={16} className={theme==='night'?'text-blue-400':'text-indigo-600'} /> About</button>
        </div>
      )}

      {/* Settings Panel (unchanged) */}
      {showSettings && (
        <div className="absolute top-16 right-16 z-[1001] bg-black/95 border border-white/10 rounded-xl p-4 w-64 backdrop-blur-xl">
          <h3 className="text-sm font-black mb-3 flex items-center gap-2"><Gauge size={16} className="text-cyan-400" /> Settings <button onClick={() => setShowSettings(false)} className="ml-auto text-zinc-400"><X size={16} /></button></h3>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-zinc-400 block mb-1">Alert Distance</label>
              <input type="range" min="100" max="2000" step="50" value={alertDistance} onChange={(e) => setAlertDistance(parseInt(e.target.value))} className="w-full" />
              <div className="flex justify-between text-[10px] mt-1"><span>{alertDistance}m</span><span className="text-cyan-400">{Math.round(alertDistance/1000 * 10)/10}km</span></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">3D Map</span>
              <button 
                onClick={() => setIs3DActive(!is3DActive)} 
                className={`px-3 py-1 rounded-full text-xs transition-all ${is3DActive ? 'bg-cyan-500 text-black font-bold' : 'bg-white/10 text-white'}`}
              >
                {is3DActive ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="flex items-center justify-between"><span className="text-xs">Audio</span><button onClick={() => setAudioEnabled(!audioEnabled)} className={`p-2 rounded-full ${audioEnabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}</button></div>
            <div className="flex items-center justify-between"><span className="text-xs">Language</span><button onClick={() => setLanguage(prev => prev === 'english' ? 'hindi' : 'english')} className="px-3 py-1 bg-white/10 rounded-full text-xs">{language === 'english' ? 'EN' : 'हि'}</button></div>
          </div>
        </div>
      )}

      {/* Main Map Area */}
      <div className="absolute inset-0 z-0">
        {/* Primary Map */}
        <div className="absolute inset-0">
          {!is3DActive ? (
            <Map2D 
              key={`${displayCameras.length}_${theme}_${isLocked}`}
              coords={myLoc || [18.5204, 73.8567]} 
              zoom={speed > 80 ? 14 : 17} 
              theme={theme} 
              cameras={displayCameras} 
              route={route} 
              heading={heading} 
              nextCam={nextCam}
              overspeedAlert={overspeedAlert}
              isLocked={isLocked}
              routeBounds={routeBounds}
              onMapClick={handleMapClick}
              destination={targetCoords}
              routeDistance={routeDistance}
              routeDuration={routeDuration}
              pinMode={pinMode}
              tempPin={tempPin}
              selectedCamera={selectedCamera}
              crossedSet={crossedSet}
              language={language}
              onMarkerClick={handleMarkerClick}
            />
          ) : (
            <Mappa3D 
              coords={myLoc || [18.5204, 73.8567]} 
              zoom={17} 
              theme={theme} 
              cameras={displayCameras} 
              route={route} 
              heading={heading} 
              nextCam={nextCam}
              overspeedAlert={overspeedAlert}
              destination={targetCoords}
              onMapClick={handleMapClick}
              pinMode={pinMode}
              tempPin={tempPin}
              routeDistance={routeDistance}
              routeDuration={routeDuration}
              isLocked={isLocked}
              onMarkerClick={handleMarkerClick}
            />
          )}
        </div>
      </div>

      {/* Alerts Stack (unchanged) */}
      <div className="absolute top-20 left-0 right-0 z-[2000] flex flex-col items-center gap-2 pointer-events-none">
        {alerts.map(alert => <AlertItem key={alert.id} alert={alert} onRemove={removeAlert} theme={theme} />)}
      </div>

      {/* Pin Mode Indicator (unchanged) */}
      {pinMode && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[2000] bg-cyan-600/90 text-white px-6 py-3 rounded-full border-2 border-white shadow-2xl animate-pulse">
          <div className="flex items-center gap-3"><MapPin size={20} /><span className="font-bold">{language === 'hindi' ? 'कैमरा लगाने के लिए मैप पर टैप करें' : 'Tap map to place camera'}</span></div>
        </div>
      )}

      {/* Bottom Sheet */}
      <div 
        className={`absolute bottom-0 inset-x-0 z-[1000] backdrop-blur-xl border-t transition-all duration-500 ease-in-out overflow-hidden rounded-t-[2.5rem] ${theme === 'night' ? 'border-cyan-500/20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]' : 'border-zinc-200 shadow-[0_-10px_30px_rgba(0,0,0,0.1)]'}`} 
        style={{ 
          height: sheetHeight, 
          background: theme === 'night' 
            ? 'linear-gradient(to bottom, rgba(5,7,12,0.98) 0%, rgba(0,0,0,1) 100%)' 
            : 'linear-gradient(to bottom, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.98) 100%)' 
        }}
      >
        {/* Top inset glow line */}
        {theme === 'night' && <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />}
        <div className="flex justify-center pt-3 pb-1">
          <button 
            onClick={cycleSheetHeight} 
            className={`w-12 h-1.5 rounded-full transition-all duration-300 ${theme === 'night' ? 'bg-cyan-500/30 hover:bg-cyan-500/60' : 'bg-zinc-300 hover:bg-zinc-400'}`} 
          />
        </div>
        <div className="overflow-y-auto h-full px-4 pb-4 scrollbar-none">
          {activeTab === 'add' && !submitSuccess ? (
            <div className="py-2">
              <h2 className="text-xl font-black mb-4 flex items-center gap-3">
                <Camera className="text-cyan-400" />
                {language === 'hindi' ? 'कैमरा जोड़ें' : 'CONTRIBUTE DATA'}
              </h2>
              
              <div className={`p-5 rounded-2xl border-2 transition-all duration-300 ${tempPin ? 'bg-emerald-500/10 border-emerald-500' : 'bg-yellow-500/10 border-yellow-500 animate-pulse'}`}>
                {tempPin ? (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="text-emerald-400" size={18} />
                      <span className="text-emerald-400 font-black uppercase text-xs">{language === 'hindi' ? 'स्थान चयनित!' : 'LOCATION LOCKED'}</span>
                    </div>
                    <span className="text-[9px] text-zinc-500 font-mono italic">COORD: {tempPin[0].toFixed(4)}, {tempPin[1].toFixed(4)}</span>
                    <button 
                      onClick={() => setPinMode(true)} 
                      className="mt-3 py-2 px-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-300 w-fit transition-all"
                    >
                      {language === 'hindi' ? 'स्थान बदलें' : 'Change Location'}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <MapPin className="text-yellow-400" size={32} />
                    <div className="text-center">
                      <span className="text-yellow-400 font-black block uppercase text-xs mb-1">{language === 'hindi' ? 'स्थान चुनें' : 'SELECT POINT'}</span>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{language === 'hindi' ? 'कैमरा लगाने के लिए मैप पर टैप करें' : 'Tap anywhere on map to pin radar'}</p>
                    </div>
                    <button 
                      onClick={() => setPinMode(true)}
                      className={`px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${pinMode ? 'bg-cyan-500 text-black animate-pulse' : 'bg-white text-black hover:scale-105'}`}
                    >
                      {pinMode ? (language === 'hindi' ? 'मैप पर टैप करें...' : 'TAP MAP NOW...') : (language === 'hindi' ? 'अंक लगाना शुरू करें' : 'ACTIVATE PIN MODE')}
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-4 mb-6">
                <label className="text-[10px] text-zinc-500 uppercase tracking-[2px] font-black">Select Camera Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setNewCam({ ...newCam, type: 'speed' })}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 ${newCam.type === 'speed' ? 'bg-cyan-500/20 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)]' : 'bg-black/40 border-white/5 opacity-50'}`}
                  >
                    <div className={`p-2 rounded-full ${newCam.type === 'speed' ? 'bg-cyan-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                      <Zap size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase">Speed Camera</span>
                  </button>
                  <button 
                    onClick={() => setNewCam({ ...newCam, type: 'red' })}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 ${newCam.type === 'red' ? 'bg-red-500/20 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'bg-black/40 border-white/5 opacity-50'}`}
                  >
                    <div className={`p-2 rounded-full ${newCam.type === 'red' ? 'bg-red-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                      <Radio size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase text-center">Red Light Camera</span>
                  </button>
                </div>
              </div>

              {newCam.type === 'speed' && (
                <div className="space-y-2 mb-6 animate-in slide-in-from-top-4 duration-300">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-[2px] font-black">Set Speed Limit (km/h)</label>
                  <div className="relative">
                    <Gauge className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500" size={18} />
                    <select 
                      className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 pl-12 text-sm focus:border-cyan-500 outline-none appearance-none backdrop-blur-md font-bold" 
                      value={newCam.speedLimit} 
                      onChange={e => setNewCam({ ...newCam, speedLimit: parseInt(e.target.value) })}
                    >
                      {[30,40,50,60,70,80,90,100,110,120].map(s => <option key={s} value={s}>{s} km/h</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <button 
                  onClick={handleAddCamera} 
                  disabled={submitLoading || !user || !tempPin} 
                  className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all duration-500 overflow-hidden relative group ${tempPin ? 'bg-cyan-500 text-black shadow-[0_0_30px_rgba(6,182,212,0.4)]' : 'bg-zinc-800 text-zinc-500 border border-white/5 cursor-not-allowed opacity-50'}`}
                >
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                  {submitLoading ? (
                    <Activity className="animate-spin" size={18} />
                  ) : (
                    <CheckCircle size={18} />
                  )}
                  {submitLoading ? 'Transmitting Data...' : 'Confirm Submission'}
                </button>
                
                <button 
                  onClick={() => { setActiveTab('hud'); setTempPin(null); setPinMode(false); setSheetHeight('30%'); }} 
                  className="w-full py-4 rounded-2xl text-zinc-400 font-bold uppercase tracking-wider text-[10px] bg-white/5 border border-white/5 hover:bg-white/10 hover:text-white transition-all duration-300"
                >
                  Abnormal Reset / Cancel
                </button>
              </div>

            </div>
          ) : (
            // Premium HUD content
            <>
              <Speedometer speed={speed} heading={heading} overspeedAlert={overspeedAlert} theme={theme} />
              
              <MapStats 
                tripDistance={tripDistance} 
                relevantCamerasCount={relevantCameras.length} 
                crossedCount={crossedCount} 
                theme={theme} 
              />
              
              <RouteInfo 
                routeDistance={routeDistance} 
                routeDuration={routeDuration} 
                theme={theme} 
              />

              <NextCameraInfo 
                nextCam={nextCam} 
                speed={speed} 
                theme={theme} 
              />
            </>
          )}
        </div>
      </div>

      {/* Camera Info Modal (Removed in favor of Popups) */}

      {/* Overspeed Overlay (unchanged) */}
      {overspeedAlert && (
        <div className="absolute inset-0 z-[2000] border-[10px] border-red-600/30 pointer-events-none animate-pulse flex items-center justify-center">
          <div className="bg-red-600 text-white px-6 py-4 skew-x-[-15deg] shadow-[0_0_100px_red] border-2 border-white flex items-center gap-3"><AlertTriangle size={24} /><span className="text-xl font-black italic">{language === 'hindi' ? 'खतरनाक गति' : 'CRITICAL SPEED'}</span></div>
        </div>
      )}

      {/* Success Message (unchanged) */}
      {submitSuccess && (
        <div className="absolute inset-0 z-[2000] bg-black/95 flex items-center justify-center p-4">
          <div className="bg-green-600/90 text-white p-8 rounded-3xl border-2 border-white text-center">
            <CheckCircle size={48} className="mx-auto mb-4" />
            <h2 className="text-2xl font-black mb-2">{language === 'hindi' ? 'कैमरा सबमिट!' : 'Camera Submitted!'}</h2>
            <p className="text-sm opacity-90">{language === 'hindi' ? 'समुदाय की मदद के लिए धन्यवाद' : 'Thank you for contributing'}</p>
          </div>
        </div>
      )}

      {/* Audio Protection Button */}
      {speechBlocked && audioEnabled && (
        <div className="absolute top-16 right-3 z-[1500] animate-in fade-in zoom-in duration-500">
          <button 
            onClick={enableAudioManually}
            className="bg-red-600 hover:bg-red-500 text-white px-4 py-3 rounded-2xl border-2 border-white shadow-[0_0_30px_rgba(239,68,68,0.5)] flex items-center gap-3 active:scale-95 transition-all"
          >
            <Volume2 className="animate-bounce" size={20} />
            <div className="text-left">
              <div className="text-[10px] font-black uppercase tracking-tighter leading-none">Audio Restricted</div>
              <div className="text-[8px] font-bold opacity-80 uppercase tracking-widest mt-0.5">Tap to Enable Alerts</div>
            </div>
          </button>
        </div>
      )}

      {/* DEBUG INDICATOR */}
      <div className="absolute top-16 md:top-20 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-3 z-[1500] pointer-events-none w-[95%] md:w-auto">
        <div className="bg-black/90 px-3 py-1.5 rounded-xl text-[9px] border border-white/10 font-mono flex items-center gap-1.5 md:gap-3 backdrop-blur-xl shadow-2xl justify-center md:justify-start">
          <div className="flex items-center gap-1.5">
             <Activity size={10} className={allCameras.length > 0 ? "text-cyan-400" : "text-red-500 animate-pulse"} />
             <span className={allCameras.length > 0 ? "text-cyan-400/90" : "text-red-500"}>ACTIVE: {allCameras.length}</span>
          </div>
          {pendingCameras.length > 0 && (
            <>
              <div className="h-2 w-px bg-white/10" />
              <div className="flex items-center gap-1.5">
                <Clock size={10} className="text-yellow-500 animate-pulse" />
                <span className="text-yellow-500/90 shrink-0">{user?.isAdmin ? 'ALL' : 'MY'}: {pendingCameras.length}</span>
              </div>
            </>
          )}
          <div className="h-2 w-px bg-white/10 hidden sm:block" />
          <div className="items-center gap-1.5 hidden sm:flex">
             <LocateFixed size={10} className={myLoc ? 'text-emerald-500' : 'text-orange-500 animate-bounce'} />
             <span className="text-zinc-400">GPS: {myLoc ? `${myLoc[0].toFixed(2)},${myLoc[1].toFixed(2)}` : 'Wait...'}</span>
          </div>
          <div className="h-2 w-px bg-white/10 ml-1" />
          <div className="flex items-center gap-1.5 ml-1">
             <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_red]" />
             <span className="text-[8px] font-black text-white/70 uppercase">LIVE_HUD</span>
          </div>
        </div>
      </div>

      {/* Camera Reporting UX */}
      <CameraDetailsSheet />

      <style jsx global>{`
        /* === Map Base === */
        .map-engine-night { filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%) saturate(80%) !important; }
        .map-engine-day { filter: brightness(105%) contrast(100%) saturate(110%) !important; }
        .leaflet-container { background: transparent !important; }
        .leaflet-control-zoom { display: none !important; }
        .leaflet-control-attribution { display: none !important; }

        /* === Car Icon === */
        .car-body { width: 0; height: 0; border-left: 14px solid transparent; border-right: 14px solid transparent; border-bottom: 40px solid; filter: drop-shadow(0 0 18px currentColor) drop-shadow(0 0 4px rgba(255,255,255,0.5)); }
        .scanner-ring { position: absolute; inset: -20px; border: 2px solid; border-radius: 50%; animation: spin 4s linear infinite; }
        .ring-cyan { border-color: rgba(0,242,255,0.08); border-top-color: rgba(0,242,255,0.9); border-right-color: rgba(0,242,255,0.4); }
        .ring-danger { border-color: rgba(255,0,51,0.3); border-top-color: #ff0033; animation: spin 0.8s linear infinite; box-shadow: 0 0 20px rgba(255,0,51,0.5); }

        /* === Camera Nodes === */
        .tactical-node { width: 36px; height: 36px; background: #000; border: 2px solid #facc15; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; color: white; font-size: 11px; box-shadow: 0 0 25px rgba(250,204,21,0.5); position: relative; }
        .node-passed { opacity: 0.12; filter: grayscale(1) blur(0.5px); scale: 0.75; }
        .node-near { border-color: #fff; background: #ff0033; scale: 1.4; box-shadow: 0 0 50px #ff0033, 0 0 20px rgba(255,0,0,0.8); z-index: 999; }
        .node-suspicious { border-color: #ff0033; background: #220000; }
        .node-red { border-color: #ff3333; background: #1a0000; box-shadow: 0 0 20px rgba(255,51,51,0.5); }
        .node-red .traffic-light { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; margin-left: 2px; }
        .node-red .traffic-light span { width: 6px; height: 6px; border-radius: 50%; display: block; }
        .traffic-light .red-dot { background: #ff3333; box-shadow: 0 0 6px #ff0000; }
        .traffic-light .yellow-dot { background: #ffff33; box-shadow: 0 0 6px #ffff00; }
        .traffic-light .green-dot { background: #33ff33; box-shadow: 0 0 6px #00ff00; }
        .suspicious-mark { position: absolute; top: -8px; right: -8px; font-size: 12px; }

        /* === Pin Marker === */
        .pin-container { position: relative; width: 40px; height: 40px; cursor: pointer; }
        .pin-outer { position: absolute; width: 100%; height: 100%; background: radial-gradient(circle at 30% 30%, #facc15, #ca8a04); border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 0 20px #facc15; animation: pin-pulse 1.5s ease-in-out infinite; }
        .pin-inner { position: absolute; top: 25%; left: 25%; width: 50%; height: 50%; background: rgba(255,255,255,0.95); border-radius: 50%; }
        .pin-shadow { position: absolute; bottom: -8px; left: 10px; width: 20px; height: 8px; background: rgba(0,0,0,0.35); border-radius: 50%; filter: blur(3px); }
        .pin-selected .pin-outer { background: radial-gradient(circle at 30% 30%, #00f2ff, #006688); box-shadow: 0 0 30px #00f2ff; }

        /* === Bottom Sheet Handle === */
        .bottom-sheet-handle { background: linear-gradient(to right, transparent, rgba(0,242,255,0.4), transparent); }

        /* === Scrollbar === */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,242,255,0.2); border-radius: 2px; }

        /* === Keyframes === */
        @keyframes pin-pulse { 0%,100% { transform: rotate(-45deg) scale(1); } 50% { transform: rotate(-45deg) scale(1.15); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes ping { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(3); opacity: 0; } }
        @keyframes slideUp { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        /* === Mobile === */
        @media (max-width: 768px) {
          .tactical-node { width: 28px; height: 28px; font-size: 9px; }
          .car-body { border-left-width: 10px; border-right-width: 10px; border-bottom-width: 30px; }
          .scanner-ring { inset: -14px; }
        }
      `}</style>
    </div>
  );
}
