import React, { useState } from 'react';
import {
  X,
  User,
  Lock,
  Mail,
  ShieldCheck,
  LogOut,
  Sparkles,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import {
  AppUser,
  loginWithEmail,
  registerWithEmail,
  loginAnonymously,
  logoutUser,
} from '../services/authService';
import { isFirebaseConfigured } from '../lib/firebase';

interface AuthModalProps {
  user: AppUser | null;
  onUserChanged: (u: AppUser | null) => void;
  onClose: () => void;
  onOpenFirebaseGuide: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  user,
  onUserChanged,
  onClose,
  onOpenFirebaseGuide,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const u = await loginWithEmail(email, password);
        onUserChanged(u);
        onClose();
      } else {
        const u = await registerWithEmail(email, password, name);
        onUserChanged(u);
        onClose();
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMsg(err.message || 'লগইন বা রেজিস্ট্রেশনে সমস্যা হয়েছে। দয়া করে পুনরায় চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      const u = await loginAnonymously();
      onUserChanged(u);
      onClose();
    } catch (err: any) {
      setErrorMsg('গেস্ট লগইনে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    onUserChanged(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="clay-card bg-white max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-stone-900 text-sm font-bengali">
              প্রাইভেট অ্যাকাউন্ট ও নিরাপত্তা
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* If user is already logged in */}
          {user && !user.isOfflineMock && !user.isAnonymous ? (
            <div className="space-y-4 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                <User className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-bold text-stone-900">{user.displayName || 'সম্মানিত ব্যবহারকারী'}</h4>
                <p className="text-xs text-stone-500 mt-0.5">{user.email}</p>
              </div>
              <p className="text-xs text-stone-600 font-bengali">
                আপনার সমস্ত আমল ও সালাতের রেকর্ড আপনার নিজস্ব UID-এর অধীনে ক্লাউড ফায়ারস্টোরে নিরাপদে সংরক্ষিত রয়েছে।
              </p>
              <button
                onClick={handleLogout}
                className="w-full py-2.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>লগআউট করুন</span>
              </button>
            </div>
          ) : (
            <>
              <div className="flex border-b border-stone-200 gap-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`pb-2 border-b-2 transition cursor-pointer ${
                    mode === 'login'
                      ? 'border-emerald-700 text-emerald-900'
                      : 'border-transparent text-stone-400 hover:text-stone-700'
                  }`}
                >
                  সাইন ইন
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={`pb-2 border-b-2 transition cursor-pointer ${
                    mode === 'register'
                      ? 'border-emerald-700 text-emerald-900'
                      : 'border-transparent text-stone-400 hover:text-stone-700'
                  }`}
                >
                  নতুন অ্যাকাউন্ট খুলুন
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">আপনার নাম</label>
                    <input
                      type="text"
                      required
                      placeholder="মুসাফির"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">ইমেইল</label>
                  <input
                    type="email"
                    required
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">পাসওয়ার্ড</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs mt-2"
                >
                  {loading ? 'প্রক্রিয়াকরণ হচ্ছে...' : mode === 'login' ? 'সাইন ইন করুন' : 'অ্যাকাউন্ট তৈরি করুন'}
                </button>
              </form>

              {/* Private Guest Access */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-stone-400">অথবা</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGuestLogin}
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition"
              >
                প্রাইভেট গেস্ট মোডে চালিয়ে যান (ইমেইল ছাড়া)
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
