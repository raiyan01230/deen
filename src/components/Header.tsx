import React, { useState, useEffect } from 'react';
import { Moon, Sun, Settings, User, Database, ShieldCheck, Flame, Bell } from 'lucide-react';
import { AppUser } from '../services/authService';
import { UserSettings } from '../types';
import { InAppNotification } from '../types/ayyam';
import { NotificationCenter } from './NotificationCenter';
import { getApproximateHijriDate, toBengaliNumber } from '../utils/hijriCalendar';
import { isFirebaseConfigured } from '../lib/firebase';
import { subscribeToSyncState, SyncStateInfo } from '../services/dataService';

interface HeaderProps {
  user: AppUser | null;
  settings: UserSettings;
  unreadNotificationsCount?: number;
  onToggleNotifications?: () => void;
  showNotifications?: boolean;
  notifications?: InAppNotification[];
  onMarkNotificationRead?: (id: string) => void;
  onCloseNotifications?: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onOpenFirebaseGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  settings,
  unreadNotificationsCount = 0,
  onToggleNotifications,
  showNotifications = false,
  notifications = [],
  onMarkNotificationRead,
  onCloseNotifications,
  onOpenSettings,
  onOpenAuth,
  onOpenFirebaseGuide,
}) => {
  const [syncInfo, setSyncInfo] = useState<SyncStateInfo>({
    status: 'idle',
    message: 'প্রস্তুত',
  });

  useEffect(() => {
    const unsub = subscribeToSyncState((info) => {
      setSyncInfo(info);
    });
    return () => unsub();
  }, []);

  const today = new Date();
  const hijri = getApproximateHijriDate(today);
  const isFbLive = isFirebaseConfigured() && !user?.isOfflineMock;

  // Gregorian format in Bengali
  const gregorianStr = today.toLocaleDateString('bn-BD', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E6E0D6] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Greeting */}
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0F4C3A] to-[#0A3327] flex items-center justify-center text-amber-300 shadow-md border border-emerald-800/40">
            <span className="font-arabic text-xl font-bold leading-none select-none">ﷲ</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#0F4C3A] font-bengali">
                MY DEEN &amp; LIFE
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                ব্যক্তিগত ড্যাশবোর্ড
              </span>
            </div>
            <p className="text-xs text-[#8A7043] font-medium">
              Become Better Every Day, For The Sake of Allah.
            </p>
          </div>
        </div>

        {/* Date & Hijri Display */}
        <div className="hidden md:flex flex-col items-center bg-white/80 px-4 py-1.5 rounded-xl border border-stone-200/80 shadow-2xs">
          <div className="text-xs font-semibold text-emerald-950 flex items-center gap-1.5">
            <span>
              {toBengaliNumber(hijri.day)} {hijri.monthNameBn} {toBengaliNumber(hijri.year)} হিজরি
            </span>
            <span
              className="text-[10px] text-amber-700 bg-amber-50 px-1 rounded font-normal"
              title="চাঁদ দেখার ওপর নির্ভরশীল - আনুমানিক রূপান্তর"
            >
              *আনুমানিক
            </span>
          </div>
          <div className="text-[11px] text-stone-500 font-medium">
            {gregorianStr} • এশিয়া/ঢাকা
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* In-app Notification Bell */}
          <div className="relative">
            <button
              onClick={onToggleNotifications}
              className="p-2 rounded-xl bg-white text-stone-600 hover:text-emerald-800 hover:bg-stone-50 border border-stone-200 transition shadow-2xs relative cursor-pointer"
              title="ইন-অ্যাপ নোটিফিকেশন"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <NotificationCenter
                notifications={notifications}
                onMarkRead={(id) => onMarkNotificationRead?.(id)}
                onClose={() => onCloseNotifications?.()}
              />
            )}
          </div>

          {/* Real-time Cloud Sync Status Indicator */}
          <div className="hidden sm:flex items-center">
            {syncInfo.status === 'saving' && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>সংরক্ষণ হচ্ছে...</span>
              </span>
            )}
            {syncInfo.status === 'saved' && (
              <span
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
                title={syncInfo.lastSavedAt ? `সর্বশেষ সেভ: ${new Date(syncInfo.lastSavedAt).toLocaleTimeString('bn-BD')}` : 'ক্লাউডে সংরক্ষিত'}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>সংরক্ষিত ✓</span>
              </span>
            )}
            {syncInfo.status === 'error' && (
              <button
                onClick={() => syncInfo.retryFn?.()}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100 transition cursor-pointer"
                title={`${syncInfo.errorMessage || 'পুনরায় চেষ্টা করতে ক্লিক করুন'}`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>সংরক্ষণে ত্রুটি (পুনরায় চেষ্টা)</span>
              </button>
            )}
          </div>

          {/* User Profile / Auth Button */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-stone-700 border border-stone-200 text-xs font-medium hover:bg-stone-50 transition shadow-2xs"
            title="ইউজার প্রোফাইল ও অ্যাকাউন্ট"
          >
            <User className="w-3.5 h-3.5 text-emerald-700" />
            <span className="max-w-[120px] truncate font-semibold text-stone-900">
              {settings.displayName || user?.displayName || 'মুসাফির'}
            </span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-white text-stone-600 hover:text-emerald-800 hover:bg-stone-50 border border-stone-200 transition shadow-2xs cursor-pointer"
            title="সেটিংস ও ডাটা ব্যবস্থাপনা"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
