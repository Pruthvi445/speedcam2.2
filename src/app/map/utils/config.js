export const COLORS = {
  sky: '#00f2ff',
  neon: '#facc15',
  danger: '#ff0033',
  warning: '#ffaa00',
  info: '#00aaff',
  glass: 'rgba(11, 14, 20, 0.95)'
};

export const ALERTS = {
  CRITICAL_DIST: 200,
  WARNING_DIST: 500,
  INFO_DIST: 1000,
  DEFAULT_DURATION: 5000,
  CROSSED_THRESHOLD: 50
};

export const GEO = {
  MIN_UPDATE_INTERVAL: 1000,
  TIMEOUT: 5000,
  KMH_CONVERSION: 3.6,
  MS_CONVERSION: 0.27778
};

export const THEME_STYLES = {
  night: {
    bgOverlay: 'linear-gradient(to bottom, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 60%, transparent 100%)',
    blur: 'blur(0px)'
  },
  day: {
    bgOverlay: undefined,
    blur: 'blur(20px)'
  }
};
