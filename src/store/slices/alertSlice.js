import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  alerts: [],
  history: [],
};

const alertSlice = createSlice({
  name: 'alert',
  initialState,
  reducers: {
    addAlert: (state, action) => {
      state.alerts.push(action.payload);
    },
    clearAlert: (state, action) => {
      state.alerts = state.alerts.filter(a => a.id !== action.payload);
    },
    loadHistory: (state) => {},
  },
});

export const { addAlert, clearAlert, loadHistory } = alertSlice.actions;
export default alertSlice.reducer;  