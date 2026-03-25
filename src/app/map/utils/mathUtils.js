export const getDist = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const \u03C61 = lat1 * Math.PI / 180;
  const \u03C62 = lat2 * Math.PI / 180;
  const \u0394\u03C6 = (lat2 - lat1) * Math.PI / 180;
  const \u0394\u03BB = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(\u0394\u03C6 / 2) * Math.sin(\u0394\u03C6 / 2) +
            Math.cos(\u03C61) * Math.cos(\u03C62) *
            Math.sin(\u0394\u03BB / 2) * Math.sin(\u0394\u03BB / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const getAlertType = (distance, userSpeed, speedLimit) => {
  if (userSpeed > speedLimit) return 'OVERSPEED';
  if (distance < 200) return 'CRITICAL';
  if (distance < 500) return 'WARNING';
  if (distance < 1000) return 'INFO';
  return null;
};
