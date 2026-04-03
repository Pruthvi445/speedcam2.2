import { useState, useEffect, useRef, useCallback } from 'react';

// 1. Haversine formula to calculate accurate distance in meters
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const toRadians = degrees => (degrees * Math.PI) / 180;
  
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
            
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in meters
};

// 4. Calculate heading from previously known point to current point in degrees
const calculateHeading = (lat1, lon1, lat2, lon2) => {
  const toRadians = degrees => (degrees * Math.PI) / 180;
  const toDegrees = radians => (radians * 180) / Math.PI;
  
  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaLambda = toRadians(lon2 - lon1);
  
  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) -
            Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
            
  const heading = (toDegrees(Math.atan2(y, x)) + 360) % 360;
  return heading;
};

export function useGeolocation(onUpdate, onError, options = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
    accuracyThreshold = 2000, // Relaxed to 2000m to allow location on desktop and indoors
    noiseThreshold = 2,       // Relaxed to 2m for more sensitive responsiveness
    throttleMs = 2000,      // 7. Update every 2 seconds max
    cacheKey = 'speedcam_location_cache',
    enableCaching = true,   // 10. Optional localStorage caching
    fallbackFetchInterval = 60000 // If using network fallback, fetch interval
  } = options;

  const [myLoc, setMyLoc] = useState(null);
  const [speed, setSpeed] = useState(0);
  const [heading, setHeading] = useState(0);

  // 8. Maintain previous position using refs
  const prevLocationRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);
  const watchIdRef = useRef(null);
  const isUsingFallbackRef = useRef(false);
  
  const KMH_CONVERSION = 3.6; // m/s to km/h

  // 2. Implement fallback using network-based location
  const fetchNetworkLocation = useCallback(async () => {
    try {
      // Free network IP location fetch
      const response = await fetch('https://ipapi.co/json/');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      
      const now = Date.now();
      const newLat = parseFloat(data.latitude);
      const newLon = parseFloat(data.longitude);
      
      processNewLocation({
        latitude: newLat,
        longitude: newLon,
        accuracy: 1000, // Network location accuracy is typically low
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
    
    // 5. Implement accuracy filtering
    if (accuracy > accuracyThreshold && source !== 'network') {
      console.warn(`[Geo] Skipped update due to poor accuracy: ${Math.round(accuracy)}m (Threshold: ${accuracyThreshold}m). Go outdoors or use a real GPS device.`);
      return; 
    }
    
    // 7. Add throttling
    if (now - lastUpdateTimeRef.current < throttleMs) {
      return; 
    }

    const prevLoc = prevLocationRef.current;
    let distance = 0;
    let calculatedSpeedKmh = 0;
    let calculatedHeading = 0;

    if (prevLoc) {
      distance = calculateDistance(prevLoc.latitude, prevLoc.longitude, latitude, longitude);
      
      // 6. Implement noise filtering
      if (distance < noiseThreshold) {
        return; 
      }
      
      // 3. Add manual speed calculation
      const timeDiffSeconds = (timestamp - prevLoc.timestamp) / 1000;
      if (timeDiffSeconds > 0) {
        const speedMs = distance / timeDiffSeconds;
        calculatedSpeedKmh = Math.round(speedMs * KMH_CONVERSION);
      }
      
      // 4. Add manual heading calculation
      calculatedHeading = Math.round(calculateHeading(prevLoc.latitude, prevLoc.longitude, latitude, longitude));
    }

    const newLocationData = {
      latitude,
      longitude,
      speed: calculatedSpeedKmh,
      heading: calculatedHeading,
      accuracy,
      timestamp,
      source
    };

    // 8. Maintain previous position
    prevLocationRef.current = newLocationData;
    lastUpdateTimeRef.current = now;

    setMyLoc([latitude, longitude]);
    setSpeed(calculatedSpeedKmh);
    setHeading(calculatedHeading);

    // 9. Provide callback with lat, lon, speed, heading, and prev position
    if (onUpdate) {
      onUpdate({
        latitude,
        longitude,
        speed: calculatedSpeedKmh,
        heading: calculatedHeading,
        prevPos: prevLoc ? [prevLoc.latitude, prevLoc.longitude] : null
      });
    }

    // 10. Add localStorage caching when significant location change occurs
    if (enableCaching) {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(newLocationData));
      } catch (err) {
        console.warn('Failed to cache location', err);
      }
    }
  }, [accuracyThreshold, noiseThreshold, throttleMs, onUpdate, enableCaching, cacheKey]);

  useEffect(() => {
    let fallbackIntervalId;

    const handleGeolocationSuccess = (position) => {
      isUsingFallbackRef.current = false;
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
      // 2. Implement fallback using network-based location
      if (!isUsingFallbackRef.current) {
        isUsingFallbackRef.current = true;
        fetchNetworkLocation();
        fallbackIntervalId = setInterval(fetchNetworkLocation, fallbackFetchInterval);
      }
      
      // 11. Ensure proper error handling and permission handling
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

    // 1. Use browser Geolocation API as primary source
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

  // Load from cache initially
  useEffect(() => {
    if (enableCaching) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsedCache = JSON.parse(cached);
          if (parsedCache && !prevLocationRef.current) {
            prevLocationRef.current = parsedCache;
            // Provide a fast cold-start location based on stored data
            setMyLoc([parsedCache.latitude, parsedCache.longitude]);
          }
        }
      } catch (e) {
        console.warn('Failed to load initial location from cache', e);
      }
    }
  }, [cacheKey, enableCaching]);

  return { myLoc, speed, heading };
}
