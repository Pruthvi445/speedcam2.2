import { useState, useCallback, useRef } from 'react';
import { ALERTS } from '../utils/config';

export function useAlerts() {
  const [alerts, setAlerts] = useState([]);
  const alertTimeouts = useRef({});

  const addLocalAlert = useCallback((type, message, cameraId = null) => {
    const id = Date.now() + Math.random();
    const newAlert = { id, type, message, cameraId, timestamp: Date.now() };
    setAlerts(prev => [newAlert, ...prev].slice(0, 5));

    if (alertTimeouts.current[id]) clearTimeout(alertTimeouts.current[id]);
    alertTimeouts.current[id] = setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== id));
      delete alertTimeouts.current[id];
    }, ALERTS.DEFAULT_DURATION);

    if (type === 'CRITICAL' && typeof navigator !== 'undefined' && navigator.vibrate) {
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

  return { alerts, addLocalAlert, removeAlert };
}
