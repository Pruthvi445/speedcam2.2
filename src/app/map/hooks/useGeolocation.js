import { useEffect, useRef, useState } from 'react';
import { GEO } from '../utils/config';

export function useGeolocation(onUpdate, onError) {
  const [myLoc, setMyLoc] = useState([18.5204, 73.8567]); // Default Pune
  const [speed, setSpeed] = useState(0);
  const [heading, setHeading] = useState(0);
  
  const watchId = useRef(null);
  
  useEffect(() => {
    if (!navigator.geolocation) {
      if (onError) onError('Geolocation is not supported by this browser', null);
      return;
    }

    let lastUpdateTime = Date.now();
    let firstFix = true;
    let prevPos = null;

    watchId.current = navigator.geolocation.watchPosition((pos) => {
      const now = Date.now();
      if (now - lastUpdateTime < GEO.MIN_UPDATE_INTERVAL) return;
      lastUpdateTime = now;

      const { latitude, longitude, speed: s, heading: h } = pos.coords;
      const kmh = s ? Math.round(s * GEO.KMH_CONVERSION) : 0;
      
      const newPos = [latitude, longitude];

      setMyLoc(newPos);
      setSpeed(kmh);
      setHeading(h || 0);

      if (onUpdate) {
        onUpdate({
          latitude,
          longitude,
          speed: kmh,
          heading: h || 0,
          prevPos: firstFix ? null : prevPos
        });
      }

      firstFix = false;
      prevPos = newPos;

    }, (error) => {
      console.warn("Geolocation Error:", error.message);
      if (onError) onError(error.message, error.code);
    }, { enableHighAccuracy: true, maximumAge: 0, timeout: GEO.TIMEOUT });

    return () => {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [onUpdate, onError]);

  return { myLoc, speed, heading };
}
