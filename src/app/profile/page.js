'use client';

import { useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { dbGet, dbOnValue, auth, signOut } from '@/lib/firebase';
import { Camera, CheckCircle, Clock, AlertTriangle, LogOut, Edit2, User, Mail, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user } = useSelector(state => state.auth);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [reports, setReports] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }

    const loadProfile = async () => {
      const prof = await dbGet(`users/${user.uid}/profile`);
      setProfile(prof || { username: user.username || 'User' });
    };
    loadProfile();

    const unsubPending = dbOnValue('cameras/pending', (data) => {
      if (!data) return setPending([]);
      const userPending = Object.entries(data)
        .filter(([_, cam]) => cam.userId === user.uid)
        .map(([id, val]) => ({ ...val, id }));
      setPending(userPending);
    });

    const unsubApproved = dbOnValue('cameras/approved', (data) => {
      if (!data) return setApproved([]);
      const userApproved = Object.entries(data)
        .filter(([_, cam]) => cam.userId === user.uid)
        .map(([id, val]) => ({ ...val, id }));
      setApproved(userApproved);
    });

    const unsubReports = dbOnValue('cameras/reports', (data) => {
      if (!data) return setReports([]);
      const userReports = Object.entries(data)
        .filter(([_, rep]) => rep.userId === user.uid)
        .map(([id, val]) => ({ ...val, id }));
      setReports(userReports);
    });

    setLoading(false);

    return () => {
      unsubPending();
      unsubApproved();
      unsubReports();
    };
  }, [user, router]);

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black italic">PROFILE</h1>
          <Link href="/map" className="text-cyan-400 hover:underline text-sm">← Back to map</Link>
        </div>

        {/* User Info Card */}
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-cyan-600 flex items-center justify-center">
              <User size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{profile?.username || 'User'}</h2>
              <p className="text-zinc-400 text-sm flex items-center gap-1"><Mail size={14} /> {user?.email}</p>
              <p className="text-zinc-500 text-xs mt-1 flex items-center gap-1">
                <Calendar size={12} /> Joined {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <button className="ml-auto bg-cyan-600/20 hover:bg-cyan-600/40 p-3 rounded-full">
              <Edit2 size={18} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6 text-center">
            <div className="bg-black/50 p-3 rounded-xl">
              <div className="text-2xl font-black text-cyan-400">{approved.length}</div>
              <div className="text-xs text-zinc-400">Approved</div>
            </div>
            <div className="bg-black/50 p-3 rounded-xl">
              <div className="text-2xl font-black text-yellow-400">{pending.length}</div>
              <div className="text-xs text-zinc-400">Pending</div>
            </div>
            <div className="bg-black/50 p-3 rounded-xl">
              <div className="text-2xl font-black text-red-400">{reports.length}</div>
              <div className="text-xs text-zinc-400">Reports</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 mb-6">
          {['overview', 'pending', 'approved', 'reports'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-bold uppercase tracking-wider ${
                activeTab === tab ? 'border-b-2 border-cyan-500 text-cyan-400' : 'text-zinc-500'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {activeTab === 'overview' && (
            <div className="bg-zinc-900/50 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Camera size={18} /> Contribution Summary</h3>
              <p>Total approved: {approved.length}</p>
              <p>Pending approval: {pending.length}</p>
              <p>Reports made: {reports.length}</p>
            </div>
          )}

          {activeTab === 'pending' && (
            <div className="space-y-3">
              {pending.length === 0 ? (
                <p className="text-zinc-500">No pending submissions.</p>
              ) : (
                pending.map(cam => (
                  <div key={cam.id} className="bg-zinc-900/70 border border-white/5 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <p className="font-bold">{cam.name}</p>
                      <p className="text-xs text-zinc-400">Speed: {cam.speedLimit} km/h • Type: {cam.type}</p>
                      <p className="text-xs text-yellow-400">Status: {cam.status}</p>
                    </div>
                    <div className="flex gap-2">
                      {cam.status === 'pending' && (
                        <>
                          <button className="px-3 py-1 bg-cyan-600 rounded-lg text-xs font-bold">Edit</button>
                          <button className="px-3 py-1 bg-red-600 rounded-lg text-xs font-bold">Delete</button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'approved' && (
            <div className="space-y-3">
              {approved.length === 0 ? (
                <p className="text-zinc-500">No approved cameras.</p>
              ) : (
                approved.map(cam => (
                  <div key={cam.id} className="bg-zinc-900/70 border border-white/5 rounded-xl p-4">
                    <p className="font-bold">{cam.name}</p>
                    <p className="text-xs text-zinc-400">Speed: {cam.speedLimit} km/h • Type: {cam.type}</p>
                    <p className="text-xs text-green-400">Approved: {new Date(cam.approvedAt).toLocaleDateString()}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-3">
              {reports.length === 0 ? (
                <p className="text-zinc-500">No reports made.</p>
              ) : (
                reports.map(rep => (
                  <div key={rep.id} className="bg-zinc-900/70 border border-white/5 rounded-xl p-4">
                    <p className="font-bold">Report on {rep.cameraName}</p>
                    <p className="text-xs text-zinc-400">Reason: {rep.reason || 'No reason'}</p>
                    <p className="text-xs text-red-400">Reported: {new Date(rep.timestamp).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Logout */}
        <div className="mt-8 text-center">
          <button
            onClick={async () => {
              await signOut(auth);
              router.push('/');
            }}
            className="inline-flex items-center gap-2 text-red-400 hover:text-red-300"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}