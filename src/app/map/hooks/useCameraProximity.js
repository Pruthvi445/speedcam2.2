import { useRef, useCallback } from 'react';
import { getDist, getAlertType } from '../utils/mathUtils';
import { ALERTS } from '../utils/config';
import { updateCameraLogic, incrementCrossed, setTripDistance } from '@/store/slices/cameraSlice';

export function useCameraProximity(dispatch, allCameras, crossedSet, alertDistance, addLocalAlert, speakMultiple) {
  
  const processLocationUpdate = useCallback(({ latitude, longitude, speed, heading, prevPos }) => {
    // Distance tracking
    if (prevPos) {
      const d = getDist(prevPos[0], prevPos[1], latitude, longitude);
      if (d > 0.1) {
        dispatch(setTripDistance(d)); // Note: Depending on Redux setup, this might need to increment inside the slice
      }
    }

    let nearestCam = null;
    let minDistance = Infinity;
    
    const camerasWithDistance = allCameras.map(cam => {
      const dist = getDist(latitude, longitude, cam.lat, cam.lng);
      if (dist < minDistance) {
        minDistance = dist;
        nearestCam = cam;
      }
      return { ...cam, distance: dist };
    });

    // 1. Cameras in immediate range (100m) for speech
    const inRange = camerasWithDistance
      .filter(c => c.distance <= 100)
      .sort((a, b) => a.distance - b.distance);
    
    if (inRange.length > 0) {
      speakMultiple(inRange, speed);
    }

    // 2. Proximity Alerts & Crossed logic
    camerasWithDistance.forEach(cam => {
      // Crossed check
      if (cam.distance < ALERTS.CROSSED_THRESHOLD && !crossedSet.current.has(cam.id)) {
        crossedSet.current.add(cam.id);
        dispatch(incrementCrossed());
        addLocalAlert('INFO', `Passed ${cam.name}`, cam.id);
      }

      // Red light alert
      if (cam.type === 'red' && cam.distance < ALERTS.CRITICAL_DIST && !crossedSet.current.has(cam.id)) {
        addLocalAlert('REDLIGHT', `Red light camera ahead at ${cam.name}. Obey traffic signal!`, cam.id);
      }
    });

    // 3. Nearest Camera Alert (Overspeed/Warning)
    if (nearestCam && nearestCam.type !== 'red' && minDistance < alertDistance) {
      const alertType = getAlertType(minDistance, speed, nearestCam.speedLimit);
      if (alertType) {
        const alertMessage = `${nearestCam.name} ${Math.round(minDistance)}m ahead. Speed: ${speed} km/h, Limit: ${nearestCam.speedLimit}.`;
        addLocalAlert(alertType, alertMessage, nearestCam.id);
      }
    }

    // 4. Update Redux Logic
    dispatch(updateCameraLogic({
      currentLoc: [latitude, longitude],
      currentSpeed: speed,
      allCameras: allCameras,
      distances: camerasWithDistance.reduce((acc, c) => ({ ...acc, [c.id]: c.distance }), {})
    }));
      
  }, [dispatch, allCameras, crossedSet, alertDistance, addLocalAlert, speakMultiple]);

  return { processLocationUpdate };
}
