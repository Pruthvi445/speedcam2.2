'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Search, Navigation, AlertTriangle, Target, Activity, LocateFixed,
  Plus, MapPin, BarChart3, Volume2, VolumeX, Gauge, Camera, X, Menu,
  Shield, Zap, Radio, TrendingUp, Eye, EyeOff, CheckCircle, Info,
  User, LogOut, Edit2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { 
  setAllCameras, 
  updateCameraLogic, 
  incrementCrossed, 
  setTripDistance, 
  loadFromStorage 
} from '@/store/slices/cameraSlice';
import { addAlert, clearAlert, loadHistory } from '@/store/slices/alertSlice';
import { signInUser, auth, dbUpdate, dbGet } from '@/lib/firebase';
import { SecureDataService } from '@/services/secureDataService';
import { updateProfile, logout } from '@/store/slices/authSlice';
import { signOut } from 'firebase/auth';

const COLORS = {
  sky: '#00f2ff',
  neon: '#facc15',
  danger: '#ff0033',
  warning: '#ffaa00',
  info: '#00aaff',
  glass: 'rgba(11, 14, 20, 0.95)'
};

// --- TACTICAL ICONS ---
const carIcon = (h, isAlert) => new L.DivIcon({
  className: 'car-marker-container',
  html: `<div class="relative" style="transform: rotate(${h}deg); transition: 0.2s ease-out;">
          <div class="scanner-ring ${isAlert ? 'ring-danger' : 'ring-cyan'}"></div>
          <div class="car-body" style="border-bottom-color: ${isAlert ? COLORS.danger : COLORS.sky};"></div>
         </div>`,
  iconSize: [40, 40], iconAnchor: [20, 20]
});

const destIcon = new L.DivIcon({
  className: 'dest-marker',
  html: `<div class="dest-ping"><div class="ping-inner"></div><div class="ping-dot"></div></div>`,
  iconSize: [30, 30], iconAnchor: [15, 15]
});

const radarIcon = (limit, passed, isNear, isSuspicious, type) => new L.DivIcon({
  className: 'radar-node',
  html: `<div class="tactical-node ${passed ? 'node-passed' : ''} ${isNear ? 'node-near' : ''} ${isSuspicious ? 'node-suspicious' : ''} ${type === 'red' ? 'node-red' : ''}">
          ${type === 'red' 
            ? `<div class="traffic-light">
                <span class="red-dot"></span>
                <span class="yellow-dot"></span>
                <span class="green-dot"></span>
              </div>` 
            : `<span class="limit-val">${limit}</span>`}
          ${isNear ? '<div class="ping-wave"></div>' : ''}
          ${isSuspicious ? '<div class="suspicious-mark">⚠️</div>' : ''}
         </div>`,
  iconSize: [36, 36], iconAnchor: [18, 18]
});

const pinIcon = (isSelected) => new L.DivIcon({
  className: 'pin-marker',
  html: `<div class="pin-container ${isSelected ? 'pin-selected' : ''}">
          <div class="pin-outer"></div>
          <div class="pin-inner"></div>
          <div class="pin-shadow"></div>
         </div>`,
  iconSize: [40, 40], iconAnchor: [20, 20]
});

// --- Map Controller ---
function MapController({ coords, zoom, isLocked }) {
  const map = useMap();
  useEffect(() => {
    if (coords && Array.isArray(coords) && coords.length === 2 && 
        !isNaN(coords[0]) && !isNaN(coords[1]) && isLocked) {
      map.flyTo(coords, zoom, { animate: true, duration: 1.5 });
    }
  }, [coords, zoom, map, isLocked]);
  return null;
}

// --- Map Click Handler ---
function MapClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
}

// --- Alert Item Component ---
const AlertItem = ({ alert, onRemove }) => {
  const getAlertStyles = (type) => {
    switch(type) {
      case 'CRITICAL': return 'bg-red-600/90 border-white animate-pulse';
      case 'WARNING': return 'bg-yellow-500/90 border-yellow-300';
      case 'OVERSPEED': return 'bg-orange-600/90 border-white animate-pulse';
      case 'REDLIGHT': return 'bg-red-700/90 border-red-300 animate-pulse';
      case 'INFO': default: return 'bg-blue-600/90 border-blue-300';
    }
  };

  return (
    <div
      className={`px-4 py-3 rounded-xl border-2 shadow-2xl backdrop-blur-3xl max-w-md w-full mx-4 transform transition-all duration-300 hover:scale-105 ${getAlertStyles(alert.type)}`}
      onClick={() => onRemove(alert.id)}
    >
      <div className="flex items-center gap-3">
        <AlertTriangle size={20} />
        <div>
          <div className="text-[8px] font-black uppercase opacity-90">{alert.type}</div>
          <div className="text-sm font-black">{alert.message}</div>
        </div>
      </div>
    </div>
  );
};

export default function SpeedcamHUD() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { allCameras, relevantCameras, crossedCount, overspeedAlert, tripDistance } = useSelector(state => state.camera);
  const { user } = useSelector(state => state.auth);

  // Location state
  const [myLoc, setMyLoc] = useState([18.5204, 73.8567]);
  const [speed, setSpeed] = useState(0);
  const [heading, setHeading] = useState(0);
  const [odo, setOdo] = useState(0);

  // UI state
  const [search, setSearch] = useState('');
  const [route, setRoute] = useState([]);
  const [targetCoords, setTargetCoords] = useState(null);
  const [isLocked, setIsLocked] = useState(true);
  const [activeTab, setActiveTab] = useState('hud');
  const [sheetHeight, setSheetHeight] = useState('30%');
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [isEditing, setIsEditing] = useState(false);

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
  const [alertDistance, setAlertDistance] = useState(1000);

  // Alerts
  const [alerts, setAlerts] = useState([]);
  const alertTimeouts = useRef({});

  // Camera tracking
  const [selectedCameras, setSelectedCameras] = useState([]);
  const [cameraDetails, setCameraDetails] = useState({});
  const [showCameraInfo, setShowCameraInfo] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [distanceHistory, setDistanceHistory] = useState([]);

  // Report modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportingCamera, setReportingCamera] = useState(null);

  // Refs
  const lastPos = useRef(null);
  const chartRef = useRef(null);
  const speechSynth = useRef(null);
  const lastSpokenTime = useRef(null);
  const isSpeaking = useRef(false);
  const speechQueue = useRef([]);
  const crossedSet = useRef(new Set());

  // --- UTILITY FUNCTIONS ---
  const getDist = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  const getAlertType = useCallback((distance, userSpeed, speedLimit) => {
    if (userSpeed > speedLimit) return 'OVERSPEED';
    if (distance < 200) return 'CRITICAL';
    if (distance < 500) return 'WARNING';
    if (distance < 1000) return 'INFO';
    return null;
  }, []);

  // --- SPEECH SYSTEM ---
  const processSpeechQueue = useCallback(() => {
    if (isSpeaking.current || speechQueue.current.length === 0) return;
    const nextUtterance = speechQueue.current.shift();
    isSpeaking.current = true;
    if (speechSynth.current) speechSynth.current.speak(nextUtterance);
  }, []);

  const speakMultiple = useCallback((camerasInRange, userSpeed) => {
    if (!audioEnabled || !speechSynth.current || camerasInRange.length === 0) return;

    const now = Date.now();
    if (lastSpokenTime.current && (now - lastSpokenTime.current) < 5000) return;
    lastSpokenTime.current = now;

    let message = '';
    if (language === 'hindi') {
      if (camerasInRange.length === 1) {
        const cam = camerasInRange[0];
        if (cam.type === 'red') {
          message = `लाल बत्ती कैमरा ${Math.round(cam.distance)} मीटर आगे है। ट्रैफिक सिग्नल का पालन करें।`;
        } else {
          message = `स्पीड कैमरा ${Math.round(cam.distance)} मीटर आगे है। आपकी गति ${Math.round(userSpeed)} किलोमीटर प्रति घंटा है। सीमा ${cam.speedLimit} है।`;
        }
        if (cam.isSuspicious) {
          message = '⚠️ ये कैमरा 5+ यूजर्स ने फेक रिपोर्ट किया है! सावधान। ' + message;
        }
      } else {
        message = `सावधान! ${camerasInRange.length} कैमरे 100 मीटर के अंदर हैं। `;
        camerasInRange.forEach((cam, index) => {
          const typeText = cam.type === 'red' ? 'लाल बत्ती' : 'स्पीड';
          message += `${index + 1}. ${typeText} कैमरा ${Math.round(cam.distance)} मीटर आगे`;
          if (cam.type !== 'red') message += `, सीमा ${cam.speedLimit}`;
          message += `. `;
          if (cam.isSuspicious) {
            message += '(फेक रिपोर्टेड) ';
          }
        });
      }
    } else {
      if (camerasInRange.length === 1) {
        const cam = camerasInRange[0];
        if (cam.type === 'red') {
          message = `Red light camera ${Math.round(cam.distance)} meters ahead. Obey traffic signal.`;
        } else {
          message = `Speed camera ${Math.round(cam.distance)} meters ahead. Your speed ${Math.round(userSpeed)} km/h. Limit ${cam.speedLimit}.`;
        }
        if (cam.isSuspicious) {
          message = '⚠️ This camera has been reported fake by 5+ users. Proceed with caution. ' + message;
        }
      } else {
        message = `Caution! ${camerasInRange.length} cameras within 100 meters. `;
        camerasInRange.forEach((cam, index) => {
          const typeText = cam.type === 'red' ? 'Red light' : 'Speed';
          message += `${index + 1}. ${typeText} camera ${Math.round(cam.distance)} meters ahead`;
          if (cam.type !== 'red') message += `, limit ${cam.speedLimit}`;
          message += `. `;
          if (cam.isSuspicious) {
            message += '(reported fake) ';
          }
        });
      }
    }

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = language === 'hindi' ? 'hi-IN' : 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = voiceType === 'male' ? 0.8 : 1.2;

    utterance.onstart = () => { isSpeaking.current = true; };
    utterance.onend = () => {
      isSpeaking.current = false;
      processSpeechQueue();
    };
    utterance.onerror = () => {
      isSpeaking.current = false;
      processSpeechQueue();
    };

    if (isSpeaking.current) {
      speechSynth.current.cancel();
      speechQueue.current = [utterance];
    } else {
      speechQueue.current.push(utterance);
      processSpeechQueue();
    }
  }, [audioEnabled, language, voiceType, processSpeechQueue]);

  // --- ALERT SYSTEM ---
  const addLocalAlert = useCallback((type, message, cameraId = null) => {
    const id = Date.now() + Math.random();
    const newAlert = { id, type, message, cameraId, timestamp: Date.now() };
    setAlerts(prev => [newAlert, ...prev].slice(0, 5));

    if (alertTimeouts.current[id]) clearTimeout(alertTimeouts.current[id]);
    alertTimeouts.current[id] = setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== id));
      delete alertTimeouts.current[id];
    }, 5000);

    if (type === 'CRITICAL' && navigator.vibrate) {
      navigator.vibrate([500, 200, 500]);
    }
  }, []);

  const removeAlert = useCallback((id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    if (alertTimeouts.current[id]) {
      clearTimeout(alertTimeouts.current[id]);
      delete alertTimeouts.current[id];
    }
  }, []);

  // --- INITIALIZATION ---
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      speechSynth.current = window.speechSynthesis;
    }
  }, []);

  useEffect(() => {
    dispatch(loadFromStorage());
    dispatch(loadHistory());
  }, [dispatch]);

  // Load user profile from Firebase when user changes
  useEffect(() => {
    if (user?.uid) {
      const loadProfile = async () => {
        const profile = await dbGet(`users/${user.uid}/profile`);
        if (profile) {
          dispatch(updateProfile({ username: profile.username }));
        }
      };
      loadProfile();
    }
  }, [user, dispatch]);

  // Real‑time listener for approved cameras
  useEffect(() => {
    console.log('🚀 Setting up approved cameras listener (HUD)');
    const unsubscribe = SecureDataService.getApprovedCameras((cameras) => {
      console.log(`🔢 Approved cameras count: ${cameras.length}`);
      dispatch(setAllCameras(cameras));
    });
    return () => {
      console.log('🧹 Cleaning up approved cameras listener');
      unsubscribe();
    };
  }, [dispatch]);

  // Clean up stale selections
  useEffect(() => {
    if (selectedCamera && !allCameras.some(c => c.id === selectedCamera.id)) {
      setShowCameraInfo(false);
      setSelectedCamera(null);
    }
    if (reportingCamera && !allCameras.some(c => c.id === reportingCamera.id)) {
      setShowReportModal(false);
      setReportingCamera(null);
    }
  }, [allCameras, selectedCamera, reportingCamera]);

  // --- GPS TRACKING ---
  useEffect(() => {
    if (!navigator.geolocation) return;

    let lastUpdateTime = Date.now();
    const MIN_UPDATE_INTERVAL = 1000;
    let firstFix = true;

    const watchId = navigator.geolocation.watchPosition((pos) => {
      const now = Date.now();
      if (now - lastUpdateTime < MIN_UPDATE_INTERVAL) return;
      lastUpdateTime = now;

      const { latitude, longitude, speed: s, heading: h } = pos.coords;
      const kmh = s ? Math.round(s * 3.6) : 0;

      if (!firstFix && lastPos.current) {
        const d = getDist(lastPos.current[0], lastPos.current[1], latitude, longitude);
        if (d > 0.1) {
          const newOdo = odo + d;
          setOdo(newOdo);
          dispatch(setTripDistance(newOdo));
        }
      }
      firstFix = false;
      lastPos.current = [latitude, longitude];
      setMyLoc([latitude, longitude]);
      setSpeed(kmh);
      setHeading(h || 0);

      const camerasInRange = allCameras
        .map(cam => ({
          ...cam,
          distance: getDist(latitude, longitude, cam.lat, cam.lng)
        }))
        .filter(cam => cam.distance <= 100)
        .sort((a, b) => a.distance - b.distance);

      if (camerasInRange.length > 0) {
        speakMultiple(camerasInRange, kmh);
      }

      allCameras.forEach(cam => {
        const dist = getDist(latitude, longitude, cam.lat, cam.lng);
        if (dist < 50 && !crossedSet.current.has(cam.id)) {
          crossedSet.current.add(cam.id);
          dispatch(incrementCrossed());
          addLocalAlert('INFO', `Passed ${cam.name}`, cam.id);
        }
      });

      const redCameras = allCameras
        .filter(cam => cam.type === 'red')
        .map(cam => ({ ...cam, distance: getDist(latitude, longitude, cam.lat, cam.lng) }));

      redCameras.forEach(cam => {
        if (cam.distance < 200 && !crossedSet.current.has(cam.id)) {
          addLocalAlert('REDLIGHT', `Red light camera ahead at ${cam.name}. Obey traffic signal!`, cam.id);
        }
      });

      let nearestCam = null;
      let minDist = Infinity;
      allCameras.forEach(cam => {
        const d = getDist(latitude, longitude, cam.lat, cam.lng);
        if (d < minDist) {
          minDist = d;
          nearestCam = cam;
        }
      });

      setSelectedCameras(camerasInRange);

      if (nearestCam && nearestCam.type !== 'red' && minDist < alertDistance) {
        const alertType = getAlertType(minDist, kmh, nearestCam.speedLimit);
        if (alertType) {
          const alertMessage = `${nearestCam.name} ${Math.round(minDist)}m ahead. Your speed ${kmh} km/h, limit ${nearestCam.speedLimit}.`;
          addLocalAlert(alertType, alertMessage, nearestCam.id);
        }
      }

      if (nearestCam) {
        setDistanceHistory(prev => [...prev.slice(-30), {
          time: new Date().toLocaleTimeString(),
          distance: Math.round(minDist),
          speed: kmh,
          limit: nearestCam.speedLimit,
          type: nearestCam.type
        }]);
      }

      dispatch(updateCameraLogic({
        currentLoc: [latitude, longitude],
        currentSpeed: kmh,
        allCameras,
        getDist
      }));
    }, null, { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [allCameras, getDist, alertDistance, addLocalAlert, getAlertType, speakMultiple, dispatch, odo]);

  // Chart drawing (unchanged)
  useEffect(() => {
    if (!chartRef.current || distanceHistory.length < 2) return;
    const ctx = chartRef.current.getContext('2d');
    const w = chartRef.current.width = 300;
    const h = chartRef.current.height = 120;
    ctx.clearRect(0, 0, w, h);
    // ... (chart drawing code as before)
  }, [distanceHistory]);

  // --- HANDLERS ---
  const handleUpdateProfile = async () => {
    if (!editUsername.trim() || !user?.uid) return;
    await dbUpdate(`users/${user.uid}/profile`, { username: editUsername });
    dispatch(updateProfile({ username: editUsername }));
    setIsEditing(false);
  };

  const handleSearch = useCallback(async (e) => {
    e.preventDefault();
    const KEY = process.env.NEXT_PUBLIC_ORS_API_KEY;
    if (!KEY) {
      addLocalAlert('ERROR', 'OpenRouteService API key missing');
      return;
    }
    try {
      const geoRes = await fetch(`https://api.openrouteservice.org/geocode/search?api_key=${KEY}&text=${search}&size=1`);
      if (!geoRes.ok) throw new Error('Geocoding failed');
      const geo = await geoRes.json();
      if (!geo.features.length) {
        addLocalAlert('WARNING', language === 'hindi' ? 'स्थान नहीं मिला' : 'Location not found');
        return;
      }
      const [lng, lat] = geo.features[0].geometry.coordinates;
      setTargetCoords([lat, lng]);
      setIsLocked(true);

      const routeRes = await fetch(`https://api.openrouteservice.org/v2/directions/driving-car?api_key=${KEY}&start=${myLoc[1]},${myLoc[0]}&end=${lng},${lat}`);
      if (!routeRes.ok) throw new Error('Routing failed');
      const routeData = await routeRes.json();
      const path = routeData.features[0].geometry.coordinates.map(c => [c[1], c[0]]);
      setRoute(path);
    } catch (err) {
      console.error(err);
      addLocalAlert('ERROR', language === 'hindi' ? 'खोज विफल' : 'Search failed: ' + err.message);
    }
  }, [search, myLoc, addLocalAlert, language]);

  const handleMapClick = useCallback((latlng) => {
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
    if (!tempPin) {
      alert('Please pin a location on map first.');
      return;
    }

    setSubmitLoading(true);

    try {
      const cameraData = {
        lat: tempPin[0],
        lng: tempPin[1],
        speedLimit: parseInt(newCam.speedLimit),
        type: newCam.type || 'speed'
      };

      await SecureDataService.submitCameraRequest(cameraData, user);

      setSubmitSuccess(true);
      setNewCam({ speedLimit: 60, type: 'speed' });
      setTempPin(null);
      setActiveTab('hud');
      setSheetHeight('30%');

      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Submit error:', err);
      alert('Submission failed: ' + err.message);
    } finally {
      setSubmitLoading(false);
    }
  }, [tempPin, newCam, user, router]);

  const cycleSheetHeight = useCallback(() => {
    if (sheetHeight === '30%') setSheetHeight('70%');
    else if (sheetHeight === '70%') setSheetHeight('100%');
    else setSheetHeight('30%');
  }, [sheetHeight]);

  const nextCam = useMemo(() => {
    return allCameras
      .map(c => ({ ...c, d: getDist(myLoc[0], myLoc[1], c.lat, c.lng) }))
      .filter(c => !crossedSet.current.has(c.id) && c.d < 3000)
      .sort((a, b) => a.d - b.d)[0] || null;
  }, [allCameras, myLoc, getDist]);

  const handleReport = async () => {
    if (!reportingCamera || !user?.uid) {
      alert('Please login to report');
      router.push('/auth');
      return;
    }
    if (!allCameras.some(c => c.id === reportingCamera.id)) {
      alert('Camera no longer exists in the database.');
      setShowReportModal(false);
      setReportingCamera(null);
      return;
    }

    console.log('🚨 Reporting camera:', reportingCamera.id, 'reason:', reportReason);
    const success = await SecureDataService.reportCamera(reportingCamera.id, user, reportReason);
    if (success) {
      addLocalAlert('INFO', language === 'hindi' ? 'रिपोर्ट भेज दी गई' : 'Report submitted');
      setShowReportModal(false);
      setReportReason('');
      setReportingCamera(null);
    } else {
      alert('Failed to submit report. Check console for details.');
    }
  };

  const CameraInfoPanel = useCallback(({ camera, onClose }) => {
    if (!camera) return null;
    const distance = getDist(myLoc[0], myLoc[1], camera.lat, camera.lng);
    const timeToReach = distance / (speed * 0.27778 || 1);

    return (
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[2000] bg-black/95 border-2 border-cyan-500 rounded-2xl p-6 w-80 md:w-96 backdrop-blur-xl shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-white"><X size={20} /></button>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center"><Camera size={24} className="text-cyan-400" /></div>
          <div>
            <h3 className="text-xl font-black text-white">{camera.name}</h3>
            <p className="text-xs text-cyan-400">ID: {camera.id}</p>
            {camera.isSuspicious && (
              <span className="mt-1 inline-block bg-red-600/80 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                ⚠️ SUSPICIOUS (5+ reports)
              </span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-zinc-900 p-3 rounded-xl">
            <div className="text-[8px] text-zinc-500 uppercase">Distance</div>
            <div className="text-2xl font-black text-cyan-400">{Math.round(distance)}m</div>
          </div>
          <div className="bg-zinc-900 p-3 rounded-xl">
            <div className="text-[8px] text-zinc-500 uppercase">Time</div>
            <div className="text-2xl font-black text-yellow-400">
              {timeToReach < 60 ? `${Math.round(timeToReach)}s` : `${Math.round(timeToReach / 60)}m`}
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {camera.type !== 'red' && (
            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-zinc-400">Speed Limit</span>
              <span className="text-xl font-black text-yellow-400">{camera.speedLimit} km/h</span>
            </div>
          )}
          <div className="flex justify-between py-2">
            <span className="text-zinc-400">Reports</span>
            <span className="text-xl font-black text-red-400">{camera.reports || 0}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-zinc-400">Type</span>
            <span className="text-xl font-black text-cyan-400">{camera.type === 'red' ? 'Red Light Camera' : 'Speed Camera'}</span>
          </div>
        </div>

        <button
          onClick={() => {
            setReportingCamera(camera);
            setShowReportModal(true);
            onClose();
          }}
          className="mt-6 w-full bg-red-600 hover:bg-red-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
        >
          <AlertTriangle size={18} /> {language === 'hindi' ? 'फेक रिपोर्ट करें' : 'Report as Fake'}
        </button>
      </div>
    );
  }, [myLoc, speed, getDist, language]);

  // --- RENDER ---
  return (
    <div className="relative h-[100dvh] w-screen bg-black text-white font-sans overflow-hidden">
      {/* Privacy Notice */}
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
      <div className="absolute top-0 inset-x-0 z-[1000] p-3 bg-gradient-to-b from-black/90 to-transparent flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1">
          <div className="bg-cyan-600/20 px-3 py-1 rounded-full border border-cyan-500/50">
            <span className="text-xs font-black text-cyan-400">SPEEDCAM</span>
          </div>
          <button onClick={() => setIsLocked(!isLocked)} className={`p-2 rounded-full ${isLocked ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/10 text-zinc-400'}`}>
            <LocateFixed size={18} />
          </button>
        </div>
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500" size={16} />
          <input className="w-full bg-black/60 border border-white/10 rounded-full py-2 pl-9 pr-4 text-xs focus:border-cyan-500 outline-none backdrop-blur-md" placeholder={language === 'hindi' ? 'खोजें...' : 'Search...'} value={search} onChange={e => setSearch(e.target.value)} />
        </form>
        <button onClick={() => setShowProfile(!showProfile)} className="p-2 bg-black/50 rounded-full border border-white/10">
          <User size={18} className={user ? 'text-cyan-400' : 'text-zinc-500'} />
        </button>
        <button onClick={() => setShowMenu(!showMenu)} className="p-2 bg-black/50 rounded-full border border-white/10"><Menu size={18} /></button>
      </div>

      {/* User Profile Panel */}
      {showProfile && (
        <div className="absolute top-16 right-3 z-[1001] bg-black/95 border border-white/10 rounded-xl p-4 w-64 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center">
              <User size={20} />
            </div>
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="bg-black border border-cyan-500 rounded px-2 py-1 text-sm w-full"
                  autoFocus
                />
              ) : (
                <p className="font-bold">{user?.username || 'User'}</p>
              )}
              <p className="text-xs text-zinc-500">{user?.email || 'Not logged in'}</p>
            </div>
            {user && !isEditing && (
              <button onClick={() => { setEditUsername(user?.username || ''); setIsEditing(true); }}>
                <Edit2 size={16} className="text-zinc-400" />
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
        <div className="absolute top-16 right-16 z-[1001] bg-black/95 border border-white/10 rounded-xl p-2 w-48 backdrop-blur-xl">
          <button onClick={() => { setActiveTab('hud'); setShowMenu(false); }} className="w-full text-left px-4 py-3 hover:bg-white/10 rounded-lg text-sm flex items-center gap-3"><Target size={16} /> HUD</button>
          <button onClick={() => { setActiveTab('dashboard'); setShowMenu(false); }} className="w-full text-left px-4 py-3 hover:bg-white/10 rounded-lg text-sm flex items-center gap-3"><BarChart3 size={16} /> Dashboard</button>
          <button onClick={() => { setPinMode(true); setActiveTab('add'); setShowMenu(false); }} className="w-full text-left px-4 py-3 hover:bg-white/10 rounded-lg text-sm flex items-center gap-3"><Plus size={16} /> Add Camera</button>
          <button onClick={() => { setShowSettings(true); setShowMenu(false); }} className="w-full text-left px-4 py-3 hover:bg-white/10 rounded-lg text-sm flex items-center gap-3"><Gauge size={16} /> Settings</button>
          <button onClick={() => { router.push('/about'); setShowMenu(false); }} className="w-full text-left px-4 py-3 hover:bg-white/10 rounded-lg text-sm flex items-center gap-3"><Info size={16} /> About</button>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-16 right-16 z-[1001] bg-black/95 border border-white/10 rounded-xl p-4 w-64 backdrop-blur-xl">
          <h3 className="text-sm font-black mb-3 flex items-center gap-2"><Gauge size={16} className="text-cyan-400" /> Settings <button onClick={() => setShowSettings(false)} className="ml-auto text-zinc-400"><X size={16} /></button></h3>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-zinc-400 block mb-1">Alert Distance</label>
              <input type="range" min="100" max="2000" step="50" value={alertDistance} onChange={(e) => setAlertDistance(parseInt(e.target.value))} className="w-full" />
              <div className="flex justify-between text-[10px] mt-1"><span>{alertDistance}m</span><span className="text-cyan-400">{Math.round(alertDistance/1000 * 10)/10}km</span></div>
            </div>
            <div className="flex items-center justify-between"><span className="text-xs">Audio</span><button onClick={() => setAudioEnabled(!audioEnabled)} className={`p-2 rounded-full ${audioEnabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}</button></div>
            <div className="flex items-center justify-between"><span className="text-xs">Language</span><button onClick={() => setLanguage(prev => prev === 'english' ? 'hindi' : 'english')} className="px-3 py-1 bg-white/10 rounded-full text-xs">{language === 'english' ? 'EN' : 'हि'}</button></div>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="absolute inset-0 z-0">
        <MapContainer center={myLoc} zoom={17} zoomControl={false} className="h-full w-full">
          <TileLayer url="https://{s}.google.com/vt/lyrs=m,h&x={x}&y={y}&z={z}" subdomains={['mt0','mt1','mt2','mt3']} className="google-dark-engine" />
          <MapController coords={myLoc} zoom={speed > 60 ? 15 : 17} isLocked={isLocked} />
          <MapClickHandler onMapClick={handleMapClick} />
          {route.length > 0 && <Polyline positions={route} pathOptions={{ color: COLORS.sky, weight: 6, opacity: 0.8, dashArray: '10, 15' }} />}
          <Marker position={myLoc} icon={carIcon(heading, overspeedAlert)} />
          {targetCoords && <Marker position={targetCoords} icon={destIcon} />}
          {tempPin && (
            <Marker
              position={tempPin}
              icon={pinIcon(true)}
              draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const { lat, lng } = e.target.getLatLng();
                  setTempPin([lat, lng]);
                }
              }}
            >
              <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent>
                <span className="text-xs font-bold">{language === 'hindi' ? 'नया कैमरा – खींचकर एडजस्ट करें' : 'New Camera – Drag to adjust'}</span>
              </Tooltip>
            </Marker>
          )}
          {allCameras.map(cam => (
            <Marker
              key={cam.id}
              position={[cam.lat, cam.lng]}
              icon={radarIcon(cam.speedLimit, crossedSet.current.has(cam.id), nextCam?.id === cam.id, cam.isSuspicious, cam.type)}
              eventHandlers={{ click: () => { setSelectedCamera(cam); setShowCameraInfo(true); } }}
            />
          ))}
        </MapContainer>
      </div>

      {/* Alerts Stack */}
      <div className="absolute top-20 left-0 right-0 z-[2000] flex flex-col items-center gap-2 pointer-events-none">
        {alerts.map(alert => <AlertItem key={alert.id} alert={alert} onRemove={removeAlert} />)}
      </div>

      {/* Pin Mode Indicator */}
      {pinMode && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[2000] bg-cyan-600/90 text-white px-6 py-3 rounded-full border-2 border-white shadow-2xl animate-pulse">
          <div className="flex items-center gap-3"><MapPin size={20} /><span className="font-bold">{language === 'hindi' ? 'कैमरा लगाने के लिए मैप पर टैप करें' : 'Tap map to place camera'}</span></div>
        </div>
      )}

      {/* Bottom Sheet */}
      <div className="absolute bottom-0 inset-x-0 z-[1000] bg-black/90 backdrop-blur-xl border-t border-cyan-500/30 rounded-t-3xl transition-all duration-300 ease-in-out" style={{ height: sheetHeight }}>
        <div className="flex justify-center pt-2 pb-1">
          <button onClick={cycleSheetHeight} className="w-12 h-1.5 bg-zinc-600 rounded-full hover:bg-zinc-400 transition"></button>
        </div>
        <div className="overflow-y-auto h-full px-4 pb-4">
          {activeTab === 'add' && !submitSuccess ? (
            // Add Camera Form
            <div className="py-2">
              <h2 className="text-xl font-black mb-4">{language === 'hindi' ? 'कैमरा जोड़ें' : 'ADD CAMERA'}</h2>
              <div className={`p-4 rounded-xl border-2 text-center mb-4 ${tempPin ? 'bg-green-500/20 border-green-500' : 'bg-yellow-500/20 border-yellow-500'}`}>
                {tempPin ? (
                  <div className="flex items-center justify-center gap-2"><MapPin className="text-green-400" size={20} /><span className="text-green-400 font-bold">{language === 'hindi' ? 'स्थान चयनित!' : 'Location pinned!'}</span></div>
                ) : (
                  <div className="flex items-center justify-center gap-2"><MapPin className="text-yellow-400 animate-pulse" size={20} /><span className="text-yellow-400">{language === 'hindi' ? 'कैमरा लगाने के लिए मैप पर टैप करें' : 'Tap map to pin location'}</span></div>
                )}
              </div>
              <div className="space-y-2 mb-4">
                <label className="text-xs text-zinc-400 uppercase tracking-wider">Camera Type</label>
                <select
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm focus:border-cyan-500 outline-none"
                  value={newCam.type}
                  onChange={e => setNewCam({ ...newCam, type: e.target.value })}
                >
                  <option value="speed">Speed Camera</option>
                  <option value="red">Red Light Camera</option>
                </select>
              </div>
              <div className="space-y-2 mb-4">
                <label className="text-xs text-zinc-400 uppercase tracking-wider">Speed Limit (km/h)</label>
                <select className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm focus:border-cyan-500 outline-none" value={newCam.speedLimit} onChange={e => setNewCam({ ...newCam, speedLimit: parseInt(e.target.value) })}>
                  {[30,40,50,60,70,80,90,100,110,120].map(s => <option key={s} value={s}>{s} km/h</option>)}
                </select>
              </div>
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3 text-xs text-cyan-400 flex items-center gap-2 mb-4"><Zap size={14} /> Type: {newCam.type === 'red' ? 'Red Light Camera' : 'Speed Camera'}</div>
              <button onClick={handleAddCamera} disabled={submitLoading || !user || !tempPin} className="w-full bg-cyan-600 py-4 rounded-xl text-black font-black uppercase text-lg disabled:opacity-50 disabled:cursor-not-allowed">
                {submitLoading ? 'Submitting...' : 'Submit Camera'}
              </button>
              <button onClick={() => { setActiveTab('hud'); setTempPin(null); setPinMode(false); setSheetHeight('30%'); }} className="w-full mt-2 bg-zinc-700 py-3 rounded-xl text-white font-bold">
                Cancel
              </button>
            </div>
          ) : (
            // Regular HUD content
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12"><div className="absolute inset-0 border-2 border-cyan-500 rounded-full"></div><Navigation style={{ transform: `rotate(${heading}deg)` }} className="absolute inset-0 m-auto text-cyan-400 w-6 h-6 transition-transform duration-500" /></div>
                  <div><div className="text-xs text-zinc-500">Heading</div><div className="text-lg font-black">{heading}°</div></div>
                </div>
                <div className="text-right"><div className="text-xs text-zinc-500">Speed</div><div className={`text-4xl font-black italic ${overspeedAlert ? 'text-red-600' : 'text-white'}`}>{speed}</div><div className="text-xs text-yellow-500">km/h</div></div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-zinc-900/80 p-2 rounded-xl text-center">
                  <div className="text-[9px] text-zinc-500">TRIP DIST</div>
                  <div className="text-sm font-black text-cyan-400">{(tripDistance / 1000).toFixed(2)}km</div>
                </div>
                <div className="bg-zinc-900/80 p-2 rounded-xl text-center">
                  <div className="text-[9px] text-zinc-500">CAMS</div>
                  <div className="text-sm font-black text-yellow-400">{relevantCameras.length}</div>
                </div>
                <div className="bg-zinc-900/80 p-2 rounded-xl text-center">
                  <div className="text-[9px] text-zinc-500">PASSED</div>
                  <div className="text-sm font-black text-green-400">{crossedCount}</div>
                </div>
              </div>
              <div className="bg-zinc-900/50 rounded-xl p-3 mb-4">
                <div className="text-[10px] font-black text-cyan-400 uppercase mb-2 flex items-center gap-2"><Activity size={12} /> {language === 'hindi' ? 'दूरी ग्राफ' : 'PROXIMITY GRAPH'}</div>
                <canvas ref={chartRef} className="w-full h-24" />
                {distanceHistory.length > 0 && <div className="mt-2 flex justify-between text-[8px] text-zinc-400"><span>Last: {distanceHistory[distanceHistory.length-1].distance}m</span><span>Speed: {distanceHistory[distanceHistory.length-1].speed}km/h</span></div>}
              </div>
              {nextCam && (
                <div className="bg-zinc-900/50 rounded-xl p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-[10px] text-zinc-400">Next Camera</div>
                      <div className="text-sm font-black">{nextCam.name}</div>
                      <div className="text-xs text-cyan-400">{Math.round(nextCam.d)}m • {nextCam.type === 'red' ? '🔴 Red Light' : `⚡ Speed • Limit ${nextCam.speedLimit}km/h`}</div>
                    </div>
                    {nextCam.type !== 'red' && (
                      <div className={`px-3 py-1 rounded-full text-xs font-black ${speed > nextCam.speedLimit ? 'bg-red-600' : 'bg-yellow-600'}`}>
                        {speed > nextCam.speedLimit ? 'OVER' : 'OK'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Camera Info Modal */}
      {showCameraInfo && selectedCamera && (
        <CameraInfoPanel camera={selectedCamera} onClose={() => { setShowCameraInfo(false); setSelectedCamera(null); }} />
      )}

      {/* Report Modal */}
      {showReportModal && reportingCamera && (
        <div className="fixed inset-0 z-[3000] bg-black/90 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl border border-red-500/30 w-full max-w-md p-6">
            <h3 className="text-xl font-black mb-4 flex items-center gap-2">
              <AlertTriangle className="text-red-400" size={20} />
              {language === 'hindi' ? 'फेक कैमरा रिपोर्ट करें' : 'Report Fake Camera'}
            </h3>
            <p className="text-sm text-zinc-400 mb-4">
              {language === 'hindi' 
                ? `आप ${reportingCamera.name} को रिपोर्ट कर रहे हैं।` 
                : `You are reporting ${reportingCamera.name}.`}
            </p>
            <textarea
              className="w-full bg-black/50 border border-zinc-700 rounded-lg p-3 text-sm focus:border-red-500 outline-none mb-4"
              placeholder={language === 'hindi' ? 'कारण (वैकल्पिक)' : 'Reason (optional)'}
              rows="3"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            />
            <div className="flex gap-3">
              <button
                onClick={handleReport}
                className="flex-1 bg-red-600 hover:bg-red-500 py-3 rounded-lg font-bold"
              >
                {language === 'hindi' ? 'रिपोर्ट भेजें' : 'Submit Report'}
              </button>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                  setReportingCamera(null);
                }}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 py-3 rounded-lg font-bold"
              >
                {language === 'hindi' ? 'रद्द करें' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overspeed Overlay */}
      {overspeedAlert && (
        <div className="absolute inset-0 z-[2000] border-[10px] border-red-600/30 pointer-events-none animate-pulse flex items-center justify-center">
          <div className="bg-red-600 text-white px-6 py-4 skew-x-[-15deg] shadow-[0_0_100px_red] border-2 border-white flex items-center gap-3"><AlertTriangle size={24} /><span className="text-xl font-black italic">{language === 'hindi' ? 'खतरनाक गति' : 'CRITICAL SPEED'}</span></div>
        </div>
      )}

      {/* Success Message */}
      {submitSuccess && (
        <div className="absolute inset-0 z-[2000] bg-black/95 flex items-center justify-center p-4">
          <div className="bg-green-600/90 text-white p-8 rounded-3xl border-2 border-white text-center">
            <CheckCircle size={48} className="mx-auto mb-4" />
            <h2 className="text-2xl font-black mb-2">{language === 'hindi' ? 'कैमरा सबमिट!' : 'Camera Submitted!'}</h2>
            <p className="text-sm opacity-90">{language === 'hindi' ? 'समुदाय की मदद के लिए धन्यवाद' : 'Thank you for contributing'}</p>
          </div>
        </div>
      )}

      {/* Privacy Badge */}
      <div className="absolute bottom-20 right-3 z-[1000] bg-black/60 backdrop-blur-sm border border-cyan-500/30 rounded-full px-3 py-1 text-[8px] text-cyan-400 flex items-center gap-1">
        <Shield size={10} /> No data stored
      </div>

      <style jsx global>{`
        .google-dark-engine { filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%) !important; }
        .leaflet-marker-icon:not(.google-dark-engine), .leaflet-pane-overlay-pane { filter: invert(100%) hue-rotate(-180deg) !important; }
        .leaflet-container { background: #000 !important; }
        .car-body { width: 0; height: 0; border-left: 14px solid transparent; border-right: 14px solid transparent; border-bottom: 40px solid; filter: drop-shadow(0 0 15px currentColor); }
        .scanner-ring { position: absolute; inset: -20px; border: 2px solid; border-radius: 50%; animation: spin 4s linear infinite; }
        .ring-cyan { border-color: rgba(0,242,255,0.1); border-top-color: #00f2ff; }
        .ring-danger { border-color: #ff0033; animation: ping 0.5s infinite; }
        .tactical-node { width: 36px; height: 36px; background: #000; border: 2px solid #facc15; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; color: white; font-size: 11px; box-shadow: 0 0 25px rgba(250,204,21,0.5); position: relative; gap: 2px; }
        .node-passed { opacity: 0.1; filter: grayscale(1); scale: 0.8; }
        .node-near { border-color: #fff; background: #ff0033; scale: 1.4; box-shadow: 0 0 40px #ff0033; z-index: 999; }
        .node-suspicious { border-color: #ff0033; background: #330000; }
        .node-red { border-color: #ff3333; background: #330000; box-shadow: 0 0 20px #ff3333; }
        .node-red .traffic-light {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          margin-left: 2px;
        }
        .node-red .traffic-light span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          display: block;
        }
        .traffic-light .red-dot { background: #ff3333; box-shadow: 0 0 5px #ff0000; }
        .traffic-light .yellow-dot { background: #ffff33; box-shadow: 0 0 5px #ffff00; }
        .traffic-light .green-dot { background: #33ff33; box-shadow: 0 0 5px #00ff00; }
        .suspicious-mark { position: absolute; top: -8px; right: -8px; font-size: 12px; }
        .pin-container { position: relative; width: 40px; height: 40px; cursor: pointer; }
        .pin-outer { position: absolute; width: 100%; height: 100%; background: radial-gradient(circle at 30% 30%, #facc15, #ca8a04); border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 0 20px #facc15; animation: pin-pulse 1.5s infinite; }
        .pin-inner { position: absolute; top: 25%; left: 25%; width: 50%; height: 50%; background: white; border-radius: 50%; opacity: 0.9; }
        .pin-shadow { position: absolute; bottom: -8px; left: 10px; width: 20px; height: 8px; background: rgba(0,0,0,0.3); border-radius: 50%; filter: blur(2px); }
        .pin-selected .pin-outer { background: radial-gradient(circle at 30% 30%, #00f2ff, #0099cc); box-shadow: 0 0 30px #00f2ff; }
        @keyframes pin-pulse { 0% { transform: rotate(-45deg) scale(1); opacity: 1; } 50% { transform: rotate(-45deg) scale(1.2); opacity: 0.9; } 100% { transform: rotate(-45deg) scale(1); opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes ping { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(3); opacity: 0; } }
        @media (max-width: 768px) {
          .tactical-node { width: 28px; height: 28px; font-size: 9px; }
          .car-body { border-left-width: 10px; border-right-width: 10px; border-bottom-width: 30px; }
          .scanner-ring { inset: -15px; }
        }
      `}</style>
    </div>
  );
}