import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  allCameras: [],
  speedCameras: [],
  redLightCameras: [],
  relevantCameras: [],
  crossedCount: 0,
  tripDistance: 0,
  overspeedAlert: false,
};

const cameraSlice = createSlice({
  name: 'camera',
  initialState,
  reducers: {
    setAllCameras: (state, action) => {
      const valid = (action.payload || []).filter(c => c && c.lat !== undefined && c.lng !== undefined);
      state.allCameras = valid;
      state.speedCameras = valid.filter(c => c.type === 'speed' || c.type === undefined);
      state.redLightCameras = valid.filter(c => c.type === 'red' || c.type === 'redlight');
    },

    setRelevant: (state, action) => {
      const { cameras } = action.payload;
      state.relevantCameras = cameras;
    },

    // Update camera logic based on current location and speed
    updateCameraLogic: (state, action) => {
      const { currentLoc, currentSpeed, allCameras } = action.payload;
      
      const getDistHelper = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      };

      // Calculate distance for each camera
      const withDist = (allCameras || []).map(cam => ({
        ...cam,
        distance: getDistHelper(currentLoc[0], currentLoc[1], cam.lat, cam.lng)
      }));

      // Filter cameras within 3km that are not passed
      const relevant = withDist
        .filter(cam => !cam.passed && cam.distance < 3000)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 20); // keep only nearest 20

      state.relevantCameras = relevant;

      // Overspeed alert if nearest camera within 500m and speed > limit
      const nearest = relevant[0];
      if (nearest && nearest.distance < 500 && currentSpeed > nearest.speedLimit) {
        state.overspeedAlert = true;
      } else {
        state.overspeedAlert = false;
      }
    },

    // Increment crossed count when a camera is passed
    incrementCrossed: (state) => {
      state.crossedCount += 1;
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('crossedCount', state.crossedCount.toString());
      }
    },

    // Set trip distance (updated from GPS)
    setTripDistance: (state, action) => {
      state.tripDistance = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('tripDistance', state.tripDistance.toString());
      }
    },

    // Load saved data from localStorage
    loadFromStorage: (state) => {
      if (typeof window !== 'undefined') {
        const savedCrossed = localStorage.getItem('crossedCount');
        if (savedCrossed) state.crossedCount = parseInt(savedCrossed, 10);
        const savedTrip = localStorage.getItem('tripDistance');
        if (savedTrip) state.tripDistance = parseFloat(savedTrip);
      }
    },
  },
});

export const {
  setAllCameras,
  setRelevant,
  updateCameraLogic,
  incrementCrossed,
  setTripDistance,
  loadFromStorage,
} = cameraSlice.actions;
export default cameraSlice.reducer;