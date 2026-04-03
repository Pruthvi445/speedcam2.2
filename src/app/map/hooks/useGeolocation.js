import { useState, useEffect, useRef, useCallback } from 'react';

// 1. Haversine formula to calculate accurate distance in meters
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
            
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in meters
};

// 7. Calculate heading from previously known point to current point in degrees
const calculateHeading = (lat1, lon1, lat2, lon2) => {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const toDegrees = (radians) => (radians * 180) / Math.PI;
  
  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaLambda = toRadians(lon2 - lon1);
  
  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) -
            Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
            
  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
};

export function useGeolocation(onUpdate, onError, options = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
    accuracyThreshold = 100, // 4. Set accurate threshold 50-100m for proper GPS rejection
    noiseThreshold = 5,      
    throttleMs = 2000,       
    cacheKey = 'speedcam_location_cache',
    enableCaching = true,
    fallbackFetchInterval = 60000, 
    maxSpeedKmh = 120,       // 1. Ignore calculates > 120km/h (prevents jump spikes)
    maxJumpDistance = 200,   // 2. Ignore single update distance jump > 200m
    cacheMaxAgeMs = 5 * 60 * 1000 // 5. 5-minute cache expiration
  } = options;

  const [myLoc, setMyLoc] = useState(null);
  const [speed, setSpeed] = useState(0);
  const [heading, setHeading] = useState(0);

  // 10. Optimized refs strictly maintaining prior state correctly
  const prevLocationRef = useRef(null);
  const lastValidGpsRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);
  const watchIdRef = useRef(null);
  const isUsingFallbackRef = useRef(false);
  
  // 6. Ref used exclusively for smoothing moving averages
  const speedHistoryRef = useRef([]);
  const KMH_CONVERSION = 3.6; 

  const fetchNetworkLocation = useCallback(async () => {
    // 8. Prevent interference: Only attempt network location if the fallback flag is active
    if (!isUsingFallbackRef.current) return;

    try {
      const response = await fetch('https://ipapi.co/json/');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      
      const now = Date.now();
      const newLat = parseFloat(data.latitude);
      const newLon = parseFloat(data.longitude);
      
      // 3. Network fallback hardening: Ignore if it varies insanely from last known good GPS
      if (lastValidGpsRef.current) {
         const distFromGps = calculateDistance(lastValidGpsRef.current.latitude, lastValidGpsRef.current.longitude, newLat, newLon);
         if (distFromGps > 1000) {
            console.warn(`[Geo] Ignored Network IP Fallback. Differed by ${distFromGps.toFixed(0)}m from last valid GPS.`);
            return;
         }
      }

      processNewLocation({
        latitude: newLat,
        longitude: newLon,
        accuracy: 1000, 
        timestamp: now,
        source: 'network'
      });
    } catch (err) {
      if (onError) onError('Network fallback failed: ' + err.message, 'NETWORK_ERROR');
    }
  }, [onError]);

  const processNewLocation = useCallback((newRawLocation) => {
    const { latitude, longitude, accuracy, timestamp, source } = newRawLocation;
    const now = Date.now();
    
    // 4. Tight accuracy filtering (GPS must be better than X meters)
    if (accuracy > accuracyThreshold && source !== 'network' && source !== 'cache') {
      console.warn(`[Geo] Ignored GPS Update due to bad accuracy: ${Math.round(accuracy)}m (Threshold: ${accuracyThreshold}m)`);
      return; 
    }
    
    // Throttle block (bypass throttle for cache loader)
    if (now - lastUpdateTimeRef.current < throttleMs && source !== 'cache') {
      return; 
    }

    const prevLoc = prevLocationRef.current;
    let distance = 0;
    let currentSpeedKmh = 0;
    let currentHeading = heading; // Persistent valid heading logic
    
    if (prevLoc) {
      distance = calculateDistance(prevLoc.latitude, prevLoc.longitude, latitude, longitude);
      
      if (distance < noiseThreshold) {
        return; 
      }
      
      // 2. Max distance jump filter (Blocks gigantic phantom leaps)
      if (distance > maxJumpDistance && source !== 'network' && source !== 'cache') {
         console.warn(`[Geo] Ignored GPS Update: Teleportation distance jump spike of ${Math.round(distance)}m > ${maxJumpDistance}m`);
         return;
      }
      
      // 6. Stable speed calculations
      const timeDiffSeconds = (timestamp - prevLoc.timestamp) / 1000;
      if (timeDiffSeconds > 0) {
        const speedMs = distance / timeDiffSeconds;
        currentSpeedKmh = speedMs * KMH_CONVERSION;
        
        // 1. Max Fake-Speed filter (Blocks jumps creating 500km/h speeds)
        if (currentSpeedKmh > maxSpeedKmh) {
           console.warn(`[Geo] Ignored GPS Update: Calculation created fake speed spike of ${Math.round(currentSpeedKmh)} km/h.`);
           return;
        }
      }
      
      // 7. Ensure heading is calculated only when significant clean movement is passed 
      if (distance >= noiseThreshold) {
         currentHeading = Math.round(calculateHeading(prevLoc.latitude, prevLoc.longitude, latitude, longitude));
      }
    }

    // 6. Smoothing logic (average out the last 3 valid calculations to completely remove sharp spikes)
    speedHistoryRef.current.push(currentSpeedKmh);
    if (speedHistoryRef.current.length > 3) speedHistoryRef.current.shift();
    const smoothedSpeedKmh = Math.round(speedHistoryRef.current.reduce((a, b) => a + b, 0) / speedHistoryRef.current.length);

    const newLocationData = {
      latitude,
      longitude,
      speed: smoothedSpeedKmh,
      heading: currentHeading,
      accuracy,
      timestamp,
      source
    };

    // Keep memory of the last true valid GPS
    if (source === 'gps') {
       lastValidGpsRef.current = newLocationData;
    }

    // 8. Maintain progression
    prevLocationRef.current = newLocationData;
    lastUpdateTimeRef.current = now;

    setMyLoc([latitude, longitude]);
    setSpeed(smoothedSpeedKmh);
    setHeading(currentHeading);

    if (onUpdate && source !== 'cache') {
      onUpdate({
        latitude,
        longitude,
        speed: smoothedSpeedKmh,
        heading: currentHeading,
        prevPos: prevLoc ? [prevLoc.latitude, prevLoc.longitude] : null
      });
    }

    if (enableCaching && source !== 'cache') {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(newLocationData));
      } catch (err) {
        console.warn('Failed to cache location', err);
      }
    }
  }, [accuracyThreshold, noiseThreshold, throttleMs, maxJumpDistance, maxSpeedKmh, heading, onUpdate, enableCaching, cacheKey]);

  useEffect(() => {
    let fallbackIntervalId;

    const handleGeolocationSuccess = (position) => {
      // 8. Clean separation check: if we got GPS signal, completely disable the fallback mechanism
      if (isUsingFallbackRef.current) {
         isUsingFallbackRef.current = false;
         if (fallbackIntervalId) clearInterval(fallbackIntervalId);
      }

      const { latitude, longitude, accuracy } = position.coords;
      const timestamp = position.timestamp || Date.now();
      
      processNewLocation({
        latitude,
        longitude,
        accuracy,
        timestamp,
        source: 'gps'
      });
    };

    const handleGeolocationError = (error) => {
      // 8. Trigger fallback only when actual explicit consistent failure occurs
      if (!isUsingFallbackRef.current) {
        isUsingFallbackRef.current = true;
        fetchNetworkLocation();
        fallbackIntervalId = setInterval(fetchNetworkLocation, fallbackFetchInterval);
      }
      
      let errorMsg = 'Unknown location error';
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMsg = 'User denied the request for Geolocation.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMsg = 'Location information is unavailable.';
          break;
        case error.TIMEOUT:
          errorMsg = 'The request to get user location timed out.';
          break;
      }
      if (onError) onError(errorMsg, error.code);
    };

    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        handleGeolocationSuccess,
        handleGeolocationError,
        { enableHighAccuracy, timeout, maximumAge }
      );
    } else {
      isUsingFallbackRef.current = true;
      fetchNetworkLocation();
      fallbackIntervalId = setInterval(fetchNetworkLocation, fallbackFetchInterval);
      if (onError) onError('Geolocation is not supported by this browser.', 'UNSUPPORTED');
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (fallbackIntervalId) {
        clearInterval(fallbackIntervalId);
      }
    };
  }, [enableHighAccuracy, timeout, maximumAge, fetchNetworkLocation, processNewLocation, fallbackFetchInterval, onError]);

  useEffect(() => {
    if (enableCaching) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsedCache = JSON.parse(cached);
          
          // 5. Expiry Logic verification
          if (parsedCache && parsedCache.timestamp) {
             const ageInMs = Date.now() - parsedCache.timestamp;
             
             if (ageInMs <= cacheMaxAgeMs) {
                if (!prevLocationRef.current) {
                   parsedCache.source = 'cache';
                   processNewLocation(parsedCache);
                }
             } else {
                console.warn(`[Geo] Ignored Cache: Older than 5 minutes (Age: ${Math.round(ageInMs / 60000)} mins)`);
                localStorage.removeItem(cacheKey);
             }
          }
        }
      } catch (e) {
        console.warn('Failed to load initial cache', e);
      }
    }
  }, [cacheKey, enableCaching, cacheMaxAgeMs, processNewLocation]);

  return { myLoc, speed, heading };
}
