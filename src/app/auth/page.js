'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from '@/lib/firebase';
import { setUser } from '@/store/slices/authSlice';
import { dbPush } from '@/lib/firebase';
import Link from 'next/link';
import { Shield, Mail, Lock, User, ArrowLeft } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const router = useRouter();
  const dispatch = useDispatch();

  const validatePassword = (pwd) => {
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongRegex.test(pwd);
  };

  const getFriendlyError = (code) => {
    const map = {
      'auth/email-already-in-use': 'This email is already registered.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/weak-password': 'Password is too weak.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password.',
    };
    return map[code] || code;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPasswordError('');

    if (!isLogin && !validatePassword(password)) {
      setPasswordError('Password must be at least 8 chars, include uppercase, lowercase, number, and special character.');
      return;
    }

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        router.push('/map');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await sendEmailVerification(user);
        await dbPush(`users/${user.uid}/profile`, {
          username,
          email: user.email,
          createdAt: Date.now(),
        });
        dispatch(setUser({ uid: user.uid, email: user.email, username }));
        router.push('/map');
      }
    } catch (err) {
      setError(getFriendlyError(err.code));
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-cyan-500/30 rounded-3xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Shield className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
          <h2 className="text-3xl font-black italic">{isLogin ? 'LOGIN' : 'SIGN UP'}</h2>
          <p className="text-zinc-500 text-xs mt-2">Access your SpeedCam profile</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-cyan-500"
                required={!isLogin}
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-cyan-500"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (!isLogin && e.target.value && !validatePassword(e.target.value)) {
                  setPasswordError('Password must be at least 8 chars, include uppercase, lowercase, number, and special character.');
                } else {
                  setPasswordError('');
                }
              }}
              className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-cyan-500"
              required
            />
          </div>
          {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {isLogin && (
            <Link href="/auth/reset" className="block text-center text-sm text-cyan-400 hover:underline mt-2">
              Forgot password?
            </Link>
          )}

          <button
            type="submit"
            className="w-full bg-cyan-600 hover:bg-cyan-500 py-3 rounded-xl font-black uppercase tracking-wider transition"
          >
            {isLogin ? 'LOGIN' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-cyan-400 hover:underline ml-2"
          >
            {isLogin ? 'Sign up' : 'Login'}
          </button>
        </p>

        <Link href="/" className="block text-center text-zinc-600 text-xs mt-8 hover:text-zinc-400">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}