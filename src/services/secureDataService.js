import { db, dbPush, dbOnValue, dbUpdate, dbRemove, dbGet } from '@/lib/firebase';
import { ref as dbRefFunc, get, update, remove } from 'firebase/database';

export const SecureDataService = {
  // Track user activity
  trackUserActivity: async (userId, activity) => {
    try {
      await dbPush(`users/${userId}/activity`, {
        ...activity,
        timestamp: Date.now()
      });
    } catch (e) {
      console.warn('Activity tracking failed:', e);
    }
  },

  // Submit camera request
  submitCameraRequest: async (cameraData, userId) => {
    try {
      const encryptedLat = btoa(cameraData.lat.toString());
      const encryptedLng = btoa(cameraData.lng.toString());

      const submission = {
        userId,
        name: cameraData.name || `Camera-${Date.now()}`,
        speedLimit: cameraData.speedLimit,
        type: cameraData.type || 'speed',
        encryptedLat,
        encryptedLng,
        submittedAt: Date.now(),
        status: 'pending'
      };

      const key = await dbPush('cameras/pending', submission);
      await dbUpdate(`cameras/pending/${key}`, { id: key });
      await SecureDataService.trackUserActivity(userId, { type: 'submit_camera', cameraId: key });
      return key;
    } catch (e) {
      console.error('Submit error:', e);
      throw e;
    }
  },

  // Get pending cameras
  getPendingCameras: (callback) => {
    return dbOnValue('cameras/pending', (data) => {
      if (!data) return callback([]);
      const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      callback(list);
    });
  },

  // Get approved cameras
  getApprovedCameras: (callback) => {
    return dbOnValue('cameras/approved', (data) => {
      if (!data) return callback([]);
      const list = Object.entries(data).map(([id, val]) => ({
        id,
        ...val,
        isSuspicious: (val.reports || 0) >= 5
      }));
      callback(list);
    });
  },

  // Get suspicious cameras
  getSuspiciousCameras: (callback) => {
    return dbOnValue('cameras/approved', (data) => {
      if (!data) return callback([]);
      const list = Object.entries(data)
        .filter(([_, val]) => (val.reports || 0) >= 5)
        .map(([id, val]) => ({ id, ...val }));
      callback(list);
    });
  },

  // Get all reports (real-time)
  getReports: (callback) => {
    return dbOnValue('cameras/reports', (data) => {
      if (!data) return callback([]);
      const list = Object.entries(data).map(([id, val]) => ({
        id,
        ...val
      }));
      callback(list);
    });
  },

  // Approve a camera
  approveCamera: async (cameraId, adminId) => {
    try {
      const snapshot = await dbGet(`cameras/pending/${cameraId}`);
      const camera = snapshot;
      if (!camera) throw new Error('Camera not found');

      const lat = parseFloat(atob(camera.encryptedLat));
      const lng = parseFloat(atob(camera.encryptedLng));

      const approved = {
        ...camera,
        lat,
        lng,
        approvedAt: Date.now(),
        approvedBy: adminId,
        status: 'approved',
        reports: 0,
        isSuspicious: false
      };
      delete approved.encryptedLat;
      delete approved.encryptedLng;

      await dbPush('cameras/approved', approved);
      await dbRemove(`cameras/pending/${cameraId}`);
      await SecureDataService.logAdminAction('approve_camera', { cameraId, adminId });
    } catch (e) {
      console.error('Approve error:', e);
    }
  },

  // Reject a camera
  rejectCamera: async (cameraId, reason) => {
    try {
      await dbUpdate(`cameras/pending/${cameraId}`, { status: 'rejected', rejectedAt: Date.now(), reason });
      const snapshot = await dbGet(`cameras/pending/${cameraId}`);
      const camera = snapshot;
      if (camera) {
        await dbPush('cameras/rejected', camera);
        await dbRemove(`cameras/pending/${cameraId}`);
      }
    } catch (e) {
      console.error('Reject error:', e);
    }
  },

  // Delete a camera (approved)
  deleteCamera: async (cameraId) => {
    try {
      await dbRemove(`cameras/approved/${cameraId}`);
    } catch (e) {
      console.error('Delete error:', e);
    }
  },

  // Update camera details
  updateCamera: async (cameraId, updates) => {
    try {
      await dbUpdate(`cameras/approved/${cameraId}`, updates);
    } catch (e) {
      console.error('Update error:', e);
    }
  },

  // Admin directly add camera
  adminAddCamera: async (cameraData) => {
    try {
      const approved = {
        ...cameraData,
        approvedAt: Date.now(),
        status: 'approved',
        reports: 0,
        isSuspicious: false
      };
      await dbPush('cameras/approved', approved);
    } catch (e) {
      console.error('Admin add error:', e);
    }
  },

  // Get decrypted coordinates
  getSecureCoords: async (cameraId, isPending = true) => {
    try {
      const path = isPending ? `cameras/pending/${cameraId}` : `cameras/approved/${cameraId}`;
      const snapshot = await dbGet(path);
      const data = snapshot;
      if (!data) return null;
      if (isPending) {
        return {
          lat: parseFloat(atob(data.encryptedLat)),
          lng: parseFloat(atob(data.encryptedLng))
        };
      } else {
        return { lat: data.lat, lng: data.lng };
      }
    } catch (e) {
      console.error('Get coords error:', e);
      return null;
    }
  },

  // Log admin actions
  logAdminAction: async (action, details) => {
    try {
      await dbPush('admin/logs', {
        action,
        details,
        timestamp: Date.now()
      });
    } catch (e) {
      console.warn('Log error:', e);
    }
  },

  // Get real‑time logs
  getRealtimeLogs: (callback) => {
    return dbOnValue('admin/logs', (data) => {
      if (!data) return callback([]);
      const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      callback(list);
    });
  },

  // Get user stats
  getUserStats: async () => {
    try {
      const usersSnap = await dbGet('users');
      const users = usersSnap ? Object.keys(usersSnap).length : 0;
      const approvedSnap = await dbGet('cameras/approved');
      const approved = approvedSnap ? Object.keys(approvedSnap).length : 0;
      const pendingSnap = await dbGet('cameras/pending');
      const pending = pendingSnap ? Object.keys(pendingSnap).length : 0;
      const logsSnap = await dbGet('admin/logs');
      const logs = logsSnap ? Object.keys(logsSnap).length : 0;

      return {
        totalUsers: users,
        totalCameras: approved,
        pendingApprovals: pending,
        totalActions: logs,
        todayLogins: 0
      };
    } catch (e) {
      console.error('Stats error:', e);
      return null;
    }
  },

  // Export public data
  exportPublicData: async () => {
    try {
      const approvedSnap = await dbGet('cameras/approved');
      if (!approvedSnap) return [];
      return Object.entries(approvedSnap).map(([id, cam]) => ({
        id,
        name: cam.name,
        speedLimit: cam.speedLimit,
        type: cam.type || 'speed',
        reports: cam.reports || 0,
        isSuspicious: (cam.reports || 0) >= 5
      }));
    } catch (e) {
      console.error('Export error:', e);
      return [];
    }
  },

  // Full backup
  exportFullBackup: async () => {
    try {
      const [approved, pending, logs] = await Promise.all([
        dbGet('cameras/approved'),
        dbGet('cameras/pending'),
        dbGet('admin/logs')
      ]);
      return { approved, pending, logs };
    } catch (e) {
      console.error('Backup error:', e);
      return {};
    }
  },

  /**
   * Report a camera as fake/suspicious
   */
  reportCamera: async (cameraId, userId, reason = '') => {
    console.log('📝 Reporting camera:', cameraId, 'by user:', userId);
    try {
      if (!cameraId || !userId) {
        console.error('❌ Missing cameraId or userId');
        return false;
      }

      // Fetch camera name to store in report
      const cameraRef = dbRefFunc(db, `cameras/approved/${cameraId}`);
      const cameraSnap = await get(cameraRef);
      let cameraName = 'Unknown';
      if (cameraSnap.exists()) {
        cameraName = cameraSnap.val().name || 'Unknown';
      } else {
        console.error('❌ Camera not found in approved list');
        return false;
      }

      // 1. Save the report with camera name
      const reportData = {
        cameraId,
        cameraName,
        userId,
        reason,
        timestamp: Date.now()
      };
      await dbPush('cameras/reports', reportData);

      // 2. Update the camera's report count
      const currentReports = cameraSnap.val().reports || 0;
      const newReports = currentReports + 1;
      await update(cameraRef, { reports: newReports });
      if (newReports >= 5) {
        await update(cameraRef, { isSuspicious: true });
      }
      console.log('✅ Reports counter updated');
      return true;

    } catch (error) {
      console.error('❌ Fatal error in reportCamera:', error);
      return false;
    }
  },

  /**
   * Dismiss a report (admin action)
   * Deletes the report and decrements the camera's report count.
   */
  dismissReport: async (reportId, cameraId) => {
    try {
      // 1. Delete the report
      await dbRemove(`cameras/reports/${reportId}`);

      // 2. Decrement camera's report count
      const cameraRef = dbRefFunc(db, `cameras/approved/${cameraId}`);
      const cameraSnap = await get(cameraRef);
      if (cameraSnap.exists()) {
        const currentReports = cameraSnap.val().reports || 0;
        const newReports = Math.max(0, currentReports - 1);
        await update(cameraRef, { reports: newReports });
        if (newReports < 5) {
          // Optionally update isSuspicious flag if it falls below threshold
          await update(cameraRef, { isSuspicious: false });
        }
      }

      await SecureDataService.logAdminAction('dismiss_report', { reportId, cameraId });
      return true;
    } catch (e) {
      console.error('Dismiss report error:', e);
      return false;
    }
  },

  /**
   * Delete a report without affecting camera count (if needed)
   */
  deleteReport: async (reportId) => {
    try {
      await dbRemove(`cameras/reports/${reportId}`);
      return true;
    } catch (e) {
      console.error('Delete report error:', e);
      return false;
    }
  }
};