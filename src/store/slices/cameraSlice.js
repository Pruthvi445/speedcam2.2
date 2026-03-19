import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  allCameras: [],          // all approved cameras from Firebase
  relevantCameras: [],      // cameras within 3km, not passed, sorted by distance
  crossedCount: 0,          // number of cameras passed during current session
  tripDistance: 0,          // total distance traveled in meters
  overspeedAlert: false,    // whether overspeed alert is active
};

const cameraSlice = createSlice({
  name: 'camera',
  initialState,
  reducers: {
    // Set all cameras from Firebase
    setAllCameras: (state, action) => {
      state.allCameras = action.payload;
    },

    // Update relevant cameras list (called from GPS effect)
    setRelevant: (state, action) => {
      const { cameras } = action.payload;
      state.relevantCameras = cameras;
    },

    // Update camera logic based on current location and speed
    updateCameraLogic: (state, action) => {
      const { currentLoc, currentSpeed, allCameras, getDist } = action.payload;
      
      // Calculate distance for each camera
      const withDist = allCameras.map(cam => ({
        ...cam,
        distance: getDist(currentLoc[0], currentLoc[1], cam.lat, cam.lng)
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