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

  // Submit camera request - accepts user object with uid, username, email
  submitCameraRequest: async (cameraData, user) => {
    console.log('📝 Submitting camera by user:', user);
    try {
      if (!user?.uid) {
        console.error('❌ No user UID');
        throw new Error('User not authenticated');
      }
      const obfuscate = (str) => {
        return btoa(str.split('').map((c, i) => 
          String.fromCharCode(c.charCodeAt(0) ^ (i % 5 + 1))
        ).join(''));
      };

      const encryptedLat = obfuscate(cameraData.lat.toString());
      const encryptedLng = obfuscate(cameraData.lng.toString());

      const submission = {
        userId: user.uid,
        userName: user.username || 'Anonymous',
        userEmail: user.email || '',
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
      await SecureDataService.trackUserActivity(user.uid, { type: 'submit_camera', cameraId: key });
      console.log('✅ Camera submitted successfully, key:', key);
      return key;
    } catch (e) {
      console.error('❌ Submit error:', e);
      throw e;
    }
  },

  // Get pending cameras (real-time)
  getPendingCameras: (callback) => {
    return dbOnValue('cameras/pending', (data) => {
      if (!data) return callback([]);
      const list = Object.entries(data).map(([id, val]) => ({ ...val, id }));
      callback(list);
    });
  },

  // Get approved cameras (real-time)
  getApprovedCameras: (callback) => {
    return dbOnValue('cameras/approved', (data) => {
      if (!data) return callback([]);
      // Filter out nulls and convert to array with IDs
      const list = Object.entries(data)
        .filter(([_, val]) => val && typeof val === 'object')
        .map(([id, val]) => ({
          ...val,
          id,
          isSuspicious: (val.reports || 0) >= 5
        }));
      callback(list);
    });
  },

  // Get suspicious cameras (real-time)
  getSuspiciousCameras: (callback) => {
    return dbOnValue('cameras/approved', (data) => {
      if (!data) return callback([]);
      const list = Object.entries(data)
        .filter(([_, val]) => (val.reports || 0) >= 5)
        .map(([id, val]) => ({ ...val, id }));
      callback(list);
    });
  },

  // Get all reports (real-time)
  getReports: (callback) => {
    return dbOnValue('cameras/reports', (data) => {
      if (!data) return callback([]);
      const list = Object.entries(data).map(([id, val]) => ({
        ...val,
        id
      }));
      callback(list);
    });
  },

  // Approve a camera
  approveCamera: async (cameraId, adminUser) => {
    try {
      if (!adminUser?.isAdmin) {
        throw new Error('Unauthorized: Admin rights required');
      }
      const camera = await dbGet(`cameras/pending/${cameraId}`);
      if (!camera) throw new Error('Camera not found');

      const deobfuscate = (str) => {
        if (!str) return "0";
        try {
          return atob(str).split('').map((c, i) => 
            String.fromCharCode(c.charCodeAt(0) ^ (i % 5 + 1))
          ).join('');
        } catch (e) {
          console.error('❌ SECURE_AUTH: Deobfuscation crash in approval loop:', e);
          return "0";
        }
      };

      const latStr = deobfuscate(camera.encryptedLat);
      const lngStr = deobfuscate(camera.encryptedLng);
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);

      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
        throw new Error(`MALFORMED_LOCATION: Invalid data extracted (Lat: ${lat}, Lng: ${lng})`);
      }

      const approved = {
        ...camera,
        lat,
        lng,
        approvedAt: Date.now(),
        approvedBy: adminUser.uid,
        status: 'approved',
        reports: 0,
        isSuspicious: false
      };
      delete approved.encryptedLat;
      delete approved.encryptedLng;

      const key = await dbPush('cameras/approved', approved);
      await dbUpdate(`cameras/approved/${key}`, { id: key });
      await dbRemove(`cameras/pending/${cameraId}`);
      await SecureDataService.logAdminAction('approve_camera', { cameraId, adminId: adminUser.uid });

      // Notify the user who submitted
      if (camera.userId) {
        await SecureDataService.addNotification(camera.userId, {
          type: 'camera_approved',
          cameraId: key,
          cameraName: camera.name,
          message: `Your camera "${camera.name}" has been approved.`
        });
      }
    } catch (e) {
      console.error('Approve error:', e);
    }
  },

  // Reject a camera
  rejectCamera: async (cameraId, reason, adminId) => {
    try {
      const snapshot = await dbGet(`cameras/pending/${cameraId}`);
      const camera = snapshot;
      if (!camera) throw new Error('Camera not found');

      await dbUpdate(`cameras/pending/${cameraId}`, { status: 'rejected', rejectedAt: Date.now(), reason });
      await dbPush('cameras/rejected', { ...camera, reason, rejectedAt: Date.now() });
      await dbRemove(`cameras/pending/${cameraId}`);
      await SecureDataService.logAdminAction('reject_camera', { cameraId, reason, adminId });

      if (camera.userId) {
        await SecureDataService.addNotification(camera.userId, {
          type: 'camera_rejected',
          cameraId,
          cameraName: camera.name,
          message: `Your camera "${camera.name}" was rejected. Reason: ${reason || 'Not specified'}`
        });
      }
    } catch (e) {
      console.error('Reject error:', e);
    }
  },

  // Delete a camera (approved)
  deleteCamera: async (cameraId) => {
    try {
      await dbRemove(`cameras/approved/${cameraId}`);
      const reportsSnap = await dbGet('cameras/reports');
      if (reportsSnap) {
        Object.entries(reportsSnap).forEach(async ([rId, r]) => {
          if (r.cameraId === cameraId) {
            await dbRemove(`cameras/reports/${rId}`);
          }
        });
      }
    } catch (e) {
      console.error('Delete error:', e);
    }
  },

  // Update camera details (approved)
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

  getAllApprovedCameras: async () => {
    try {
      const snap = await dbGet('cameras/approved');
      if (!snap) return [];
      return Object.entries(snap).map(([id, val]) => ({ ...val, id }));
    } catch(e) {
      return [];
    }
  },

  bulkUploadCameras: async (camerasArray, adminUid) => {
    try {
      const now = Date.now();
      
      const uploadPromises = camerasArray.map(async (cam, index) => {
        const payload = {
          ...cam,
          approvedAt: now + index,
          status: 'approved',
          reports: 0,
          isSuspicious: false,
          approvedBy: 'Admin Bulk Archive'
        };
        // Use the same push method AdminAddCamera uses
        return await dbPush('cameras/approved', payload);
      });

      await Promise.all(uploadPromises);
      await SecureDataService.logAdminAction?.('bulk_upload', { count: camerasArray.length, adminUid });
      return true;
    } catch (e) {
      console.error('Bulk upload error:', e);
      return false;
    }
  },

  // Get decrypted coordinates
  getSecureCoords: async (cameraId, isPending = true) => {
    try {
      const path = isPending ? `cameras/pending/${cameraId}` : `cameras/approved/${cameraId}`;
      const data = await dbGet(path);
      if (!data) return null;
      
      if (isPending) {
        const deobfuscate = (str) => {
          if (!str) return "0";
          try {
            return atob(str).split('').map((c, i) => 
              String.fromCharCode(c.charCodeAt(0) ^ (i % 5 + 1))
            ).join('');
          } catch (e) {
            console.warn('Deobfuscation failure for field:', str);
            return "0";
          }
        };
        
        const latStr = deobfuscate(data.encryptedLat);
        const lngStr = deobfuscate(data.encryptedLng);
        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);
        
        if (isNaN(lat) || isNaN(lng)) return null;
        return { lat, lng };
      } else {
        return { 
          lat: parseFloat(data.lat || 0), 
          lng: parseFloat(data.lng || 0) 
        };
      }
    } catch (e) {
      console.error('🛰️ SECURE_AUTH: Critical decryption failure:', e);
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
      const list = Object.entries(data).map(([id, val]) => ({ ...val, id }));
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

  // Get all users with their profiles and contribution counts
  getAllUsers: async () => {
    try {
      const usersSnap = await dbGet('users');
      if (!usersSnap) return [];

      const users = await Promise.all(
        Object.entries(usersSnap).map(async ([uid, data]) => {
          // Get user's cameras (approved)
          const approvedCameras = await dbGet('cameras/approved');
          const userApproved = approvedCameras 
            ? Object.values(approvedCameras).filter(cam => cam.userId === uid).length 
            : 0;

          // Get user's pending cameras
          const pendingCameras = await dbGet('cameras/pending');
          const userPending = pendingCameras 
            ? Object.values(pendingCameras).filter(cam => cam.userId === uid).length 
            : 0;

          // Get user's reports
          const reports = await dbGet('cameras/reports');
          const userReports = reports 
            ? Object.values(reports).filter(rep => rep.userId === uid).length 
            : 0;

          return {
            uid,
            email: data.profile?.email || 'unknown',
            username: data.profile?.username || 'Anonymous',
            createdAt: data.profile?.createdAt,
            approvedCount: userApproved,
            pendingCount: userPending,
            reportCount: userReports,
            lastActive: data.activity ? Math.max(...Object.values(data.activity).map(a => a.timestamp)) : null
          };
        })
      );

      return users.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } catch (e) {
      console.error('Get all users error:', e);
      return [];
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
      const [approved, pending, logs, users, reports] = await Promise.all([
        dbGet('cameras/approved'),
        dbGet('cameras/pending'),
        dbGet('admin/logs'),
        dbGet('users'),
        dbGet('cameras/reports')
      ]);
      return { approved, pending, logs, users, reports };
    } catch (e) {
      console.error('Backup error:', e);
      return {};
    }
  },

  /**
   * Report a camera as fake/suspicious - accepts user object
   */
  reportCamera: async (camera, user, reason = '') => {
    console.log('📝 Reporting camera:', camera?.id, 'by user:', user);
    try {
      if (!camera?.id || !user?.uid) {
        console.error('❌ Missing camera.id or user.uid', { camera, user });
        return false;
      }

      const cameraId = camera.id;
      const cameraName = camera.name || 'Unknown';

      // 1. Check for duplicate report
      const snapshot = await dbGet(`users/${user.uid}/reports/${cameraId}`);
      if (snapshot) {
        console.warn('⚠️ User already reported this camera');
        return 'already_reported';
      }

      // 2. Save the report with camera name and user info
      const reportData = {
        cameraId,
        cameraName,
        userId: user.uid,
        userName: user.username || 'Anonymous',
        userEmail: user.email || '',
        reason,
        timestamp: Date.now(),
        status: 'pending'
      };
      
      console.log('Saving report:', reportData);
      const reportId = await dbPush('cameras/reports', reportData);

      // Save to user's personal report history to prevent duplicates
      await dbUpdate(`users/${user.uid}/reports/${cameraId}`, { 
        reportId, 
        timestamp: Date.now() 
      });

      // Save to user activity log
      await SecureDataService.trackUserActivity(user.uid, {
        type: 'report_camera',
        cameraId,
        cameraName,
        reason,
        timestamp: Date.now()
      });

      console.log('✅ Report submitted successfully');
      return true;

    } catch (error) {
      console.error('❌ Fatal error in reportCamera:', error);
      return false;
    }
  },

  /**
   * Confirm a report (admin action) - increments camera report count
   */
  confirmReport: async (reportId, cameraId, adminUser) => {
    try {
      if (!adminUser?.isAdmin) throw new Error('Unauthorized');

      const report = await dbGet(`cameras/reports/${reportId}`);
      if (!report) throw new Error('Report not found');

      // 1. Update camera's report count
      const cameraRef = dbRefFunc(db, `cameras/approved/${cameraId}`);
      const cameraSnap = await get(cameraRef);
      if (cameraSnap.exists()) {
        const currentReports = cameraSnap.val().reports || 0;
        const newReports = currentReports + 1;
        
        const updates = { reports: newReports };
        if (newReports >= 5) {
          updates.isSuspicious = true;
        }
        await update(cameraRef, updates);
      }

      // 2. Mark report as confirmed
      await dbUpdate(`cameras/reports/${reportId}`, { status: 'confirmed' });
      await SecureDataService.logAdminAction('confirm_report', { reportId, cameraId, adminId: adminUser.uid });
      
      return true;
    } catch (e) {
      console.error('Confirm report error:', e);
      return false;
    }
  },

  /**
   * Dismiss a report (admin action)
   */
  dismissReport: async (reportId, cameraId) => {
    try {
      const report = await dbGet(`cameras/reports/${reportId}`);
      const wasConfirmed = report?.status === 'confirmed';
      
      await dbRemove(`cameras/reports/${reportId}`);

      if (wasConfirmed) {
        const cameraRef = dbRefFunc(db, `cameras/approved/${cameraId}`);
        const cameraSnap = await get(cameraRef);
        if (cameraSnap.exists()) {
          const currentReports = cameraSnap.val().reports || 0;
          const newReports = Math.max(0, currentReports - 1);
          await update(cameraRef, { reports: newReports });
          if (newReports < 5) {
            await update(cameraRef, { isSuspicious: false });
          }
        }
      }

      await SecureDataService.logAdminAction('dismiss_report', { reportId, cameraId, wasConfirmed });
      return true;
    } catch (e) {
      console.error('Dismiss report error:', e);
      return false;
    }
  },

  /**
   * Delete a report without affecting camera count
   */
  deleteReport: async (reportId) => {
    try {
      await dbRemove(`cameras/reports/${reportId}`);
      return true;
    } catch (e) {
      console.error('Delete report error:', e);
      return false;
    }
  },

  /**
   * Update a pending camera (allowed fields: name, speedLimit, type)
   */
  updatePendingCamera: async (cameraId, updates, userId) => {
    try {
      // First verify ownership
      const snapshot = await dbGet(`cameras/pending/${cameraId}`);
      if (!snapshot || snapshot.userId !== userId) {
        throw new Error('Not authorized to edit this camera');
      }
      const allowed = { name: 1, speedLimit: 1, type: 1 };
      const filtered = Object.keys(updates)
        .filter(key => allowed[key])
        .reduce((obj, key) => ({ ...obj, [key]: updates[key] }), {});
      if (Object.keys(filtered).length === 0) return false;
      await dbUpdate(`cameras/pending/${cameraId}`, filtered);
      return true;
    } catch (e) {
      console.error('Update pending error:', e);
      return false;
    }
  },

  /**
   * Add a notification for a user
   */
  addNotification: async (userId, notification) => {
    try {
      await dbPush(`users/${userId}/notifications`, {
        ...notification,
        read: false,
        timestamp: Date.now()
      });
    } catch (e) {
      console.error('Add notification error:', e);
    }
  },

  /**
   * Mark a notification as read
   */
  markNotificationRead: async (userId, notificationId) => {
    try {
      await dbUpdate(`users/${userId}/notifications/${notificationId}`, { read: true });
    } catch (e) {
      console.error('Mark notification error:', e);
    }
  },

  /**
   * Get user notifications (real-time)
   */
  getUserNotifications: (userId, callback) => {
    return dbOnValue(`users/${userId}/notifications`, (data) => {
      if (!data) return callback([]);
      const list = Object.entries(data).map(([id, val]) => ({ ...val, id }));
      callback(list);
    });
  }
};