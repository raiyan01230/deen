import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { Navigation, NavTabId } from './components/Navigation';
import { HomeDashboard } from './components/HomeDashboard';
import { SalahTracker } from './components/SalahTracker';
import { DailyDeeds } from './components/DailyDeeds';
import { DuaLibrary } from './components/DuaLibrary';
import { QuranTracker } from './components/QuranTracker';
import { RamadanPrep } from './components/RamadanPrep';
import { CharacterTracker } from './components/CharacterTracker';
import { PersonalHabits } from './components/PersonalHabits';
import { CalendarView } from './components/CalendarView';
import { AnalyticsReports } from './components/AnalyticsReports';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { FirebaseGuideModal } from './components/FirebaseGuideModal';
import { AyyamAlBidDashboard } from './components/AyyamAlBidDashboard';
import { HadithLibraryView } from './components/HadithLibraryView';
import { HadithAdminModal } from './components/HadithAdminModal';
import { ImprovementTracker } from './components/ImprovementTracker';


import { AppUser, subscribeToAuth } from './services/authService';
import {
  DailyPrayerLog,
  DailyDeedsLog,
  QuranLog,
  CharacterReflection,
  RamadanLog,
  PersonalHabit,
  UserSettings,
  DeedItem,
} from './types';
import { HadithRecord } from './types/hadith';
import { InAppNotification } from './types/ayyam';
import {
  DEFAULT_USER_SETTINGS,
  getPrayerLog,
  savePrayerLog,
  getDeedsLog,
  saveDeedsLog,
  getQuranLogs,
  saveQuranLog,
  deleteQuranLog,
  getCharacterReflection,
  saveCharacterReflection,
  getRamadanLog,
  saveRamadanLog,
  getPersonalHabits,
  savePersonalHabit,
  deletePersonalHabit,
  getFavoriteDuas,
  toggleFavoriteDua,
  getUserSettings,
  saveUserSettings,
  subscribeToDeedsLog,
  subscribeToPrayerLog,
  subscribeToUserSettings,
  subscribeToSyncState,
  SyncStateInfo,
} from './services/dataService';
import { getAllHadiths, getHadithOfTheDay } from './services/hadithService';
import {
  getInAppNotifications,
  markNotificationAsRead,
  getCurrentAyyamAlBidSchedule,
  getNotificationPreferences,
  triggerAyyamEmailAlert,
  saveInAppNotification,
} from './services/ayyamService';
import { generateAyyamAlBidNotifications } from './utils/ayyamCalculations';
import { getDhakaDateString } from './utils/hijriCalendar';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<NavTabId>('home');
  const [currentDate, setCurrentDate] = useState<string>(getDhakaDateString());

  // App Data States (Hydrated from Firestore)
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [prayerLog, setPrayerLog] = useState<DailyPrayerLog>({
    date: currentDate,
    fajr: { status: 'unrecorded' },
    dhuhr: { status: 'unrecorded' },
    asr: { status: 'unrecorded' },
    maghrib: { status: 'unrecorded' },
    isha: { status: 'unrecorded' },
    updatedAt: '',
  });
  const [deedsLog, setDeedsLog] = useState<DailyDeedsLog>({
    date: currentDate,
    completedDeedIds: [],
    updatedAt: '',
  });
  const [quranLogs, setQuranLogs] = useState<QuranLog[]>([]);
  const [characterReflection, setCharacterReflection] = useState<CharacterReflection>({
    id: `char_${currentDate}`,
    date: currentDate,
    avoidedGheebahIntention: false,
    updatedAt: '',
  });
  const [ramadanLog, setRamadanLog] = useState<RamadanLog>({
    date: currentDate,
    dayNumber: 1,
    fasted: false,
    updatedAt: '',
  });
  const [habits, setHabits] = useState<PersonalHabit[]>([]);
  const [customDeeds, setCustomDeeds] = useState<DeedItem[]>([]);
  const [favoriteDuaIds, setFavoriteDuaIds] = useState<string[]>([]);

  // Hadith & Notifications States
  const [hadiths, setHadiths] = useState<HadithRecord[]>([]);
  const [dailyHadith, setDailyHadith] = useState<HadithRecord | null>(null);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHadithAdmin, setShowHadithAdmin] = useState(false);

  // Sync state tracking
  const [syncState, setSyncState] = useState<SyncStateInfo>({ status: 'idle', message: 'প্রস্তুত' });

  // Cache of past prayer and deeds logs for monthly calendar & analytics
  const [prayerLogsCache, setPrayerLogsCache] = useState<Record<string, DailyPrayerLog>>({});
  const [deedsLogsCache, setDeedsLogsCache] = useState<Record<string, DailyDeedsLog>>({});

  // Modals
  const [showSettings, setShowSettings] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showFirebaseGuide, setShowFirebaseGuide] = useState(false);

  // Unsubscribe refs for Firestore real-time listeners
  const deedsUnsubRef = useRef<(() => void) | null>(null);
  const prayerUnsubRef = useRef<(() => void) | null>(null);
  const settingsUnsubRef = useRef<(() => void) | null>(null);

  // 1. Subscribe to Sync State
  useEffect(() => {
    const unsub = subscribeToSyncState((info) => setSyncState(info));
    return () => unsub();
  }, []);

  // 2. Load Hadith Library & Notifications
  useEffect(() => {
    getAllHadiths(user?.uid).then((all) => {
      setHadiths(all);
      setDailyHadith(getHadithOfTheDay(all, currentDate));
    });
    getInAppNotifications(user?.uid || 'guest').then((notifs) => {
      setNotifications(notifs);
    });
  }, [user?.uid, currentDate]);

  // 3. Subscribe to Auth State
  useEffect(() => {
    const unsub = subscribeToAuth((u, ready) => {
      setUser(u);
      setIsAuthReady(ready);
    });
    return () => unsub();
  }, []);

  // 4. Fetch all user records when authenticated user or date changes
  const loadUserData = useCallback(async () => {
    if (!user || !isAuthReady) return;

    try {
      // 1. Fetch User Profile & Settings
      const userSettings = await getUserSettings(user.uid);
      setSettings(userSettings);

      // Clean up previous real-time listeners
      if (deedsUnsubRef.current) deedsUnsubRef.current();
      if (prayerUnsubRef.current) prayerUnsubRef.current();
      if (settingsUnsubRef.current) settingsUnsubRef.current();

      // Set up real-time listener for Settings
      settingsUnsubRef.current = subscribeToUserSettings(user.uid, (updatedSettings) => {
        setSettings(updatedSettings);
      });

      // 2. Fetch and Subscribe to Today's Prayer Log
      const pLog = await getPrayerLog(user.uid, currentDate);
      setPrayerLog(pLog);
      setPrayerLogsCache((prev) => ({ ...prev, [currentDate]: pLog }));

      prayerUnsubRef.current = subscribeToPrayerLog(user.uid, currentDate, (livePrayer) => {
        setPrayerLog(livePrayer);
        setPrayerLogsCache((prev) => ({ ...prev, [currentDate]: livePrayer }));
      });

      // 3. Fetch and Subscribe to Today's Deeds Log
      const dLog = await getDeedsLog(user.uid, currentDate);
      setDeedsLog(dLog);
      setDeedsLogsCache((prev) => ({ ...prev, [currentDate]: dLog }));

      deedsUnsubRef.current = subscribeToDeedsLog(user.uid, currentDate, (liveDeeds) => {
        setDeedsLog(liveDeeds);
        setDeedsLogsCache((prev) => ({ ...prev, [currentDate]: liveDeeds }));
      });

      // 4. Quran, Character, Ramadan, Habits, Favorites
      const [qLogs, cRef, rLog, hList, fList] = await Promise.all([
        getQuranLogs(user.uid),
        getCharacterReflection(user.uid, currentDate),
        getRamadanLog(user.uid, currentDate),
        getPersonalHabits(user.uid),
        getFavoriteDuas(user.uid),
      ]);

      setQuranLogs(qLogs);
      setCharacterReflection(cRef);
      setRamadanLog(rLog);
      setHabits(hList);
      setFavoriteDuaIds(fList);

      // Preload previous 7 days logs for charts and calendar in background
      for (let i = 1; i <= 7; i++) {
        const d = new Date(currentDate);
        d.setDate(d.getDate() - i);
        const pastDate = d.toISOString().split('T')[0];
        getPrayerLog(user.uid, pastDate).then((p) => {
          setPrayerLogsCache((prev) => ({ ...prev, [pastDate]: p }));
        });
        getDeedsLog(user.uid, pastDate).then((d) => {
          setDeedsLogsCache((prev) => ({ ...prev, [pastDate]: d }));
        });
      }
    } catch (err) {
      console.error('Error hydrating user data from Firestore:', err);
    } finally {
      setIsHydrated(true);
    }
  }, [user, isAuthReady, currentDate]);

  useEffect(() => {
    loadUserData();
    return () => {
      if (deedsUnsubRef.current) deedsUnsubRef.current();
      if (prayerUnsubRef.current) prayerUnsubRef.current();
      if (settingsUnsubRef.current) settingsUnsubRef.current();
    };
  }, [loadUserData]);

  // 5. Initialize Ayyam Al-Bid Notifications & Reminders
  useEffect(() => {
    if (!isHydrated) return;

    const initAyyamNotifications = async () => {
      try {
        const prefs = await getNotificationPreferences(user?.uid || 'guest');
        const schedule = await getCurrentAyyamAlBidSchedule(prefs.district || 'ঢাকা (Dhaka)');
        
        // Generate in-app notifications
        const newNotifs = generateAyyamAlBidNotifications(schedule, prefs);
        for (const notif of newNotifs) {
          await saveInAppNotification(user?.uid || 'guest', notif);
        }
        
        // Refresh local notifications state
        const updatedNotifs = await getInAppNotifications(user?.uid || 'guest');
        setNotifications(updatedNotifs);

        // Handle Browser Notifications
        if (prefs.browserPush && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            // Only show one active reminder for the current/next Ayyam Al-Bid
            const d13 = new Date(`${schedule.day13.gregorianDate}T09:00:00+06:00`);
            const now = new Date();
            const diffDays = Math.ceil((d13.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            
            if (diffDays >= 0 && diffDays <= 3) {
              const storageKey = `ayyam_browser_notif_${schedule.hijriYear}_${schedule.hijriMonth}`;
              if (!localStorage.getItem(storageKey)) {
                new Notification('আইয়ামে বীজের নফল সিয়াম রিমাইন্ডার', {
                  body: `${schedule.hijriMonthNameBn} মাসের ১৩, ১৪ ও ১৫ তারিখের রোজা শুরু হতে যাচ্ছে। প্রস্তুত হোন।`,
                  icon: '/favicon.ico'
                });
                localStorage.setItem(storageKey, 'true');
              }
            }
          }
        }

        // Handle Email Reminders (Server-side)
        if (prefs.email && prefs.userEmail && user?.uid) {
          const d13 = new Date(`${schedule.day13.gregorianDate}T00:00:00+06:00`);
          const now = new Date();
          const diffDays = Math.ceil((d13.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays === prefs.advanceDays) {
            const emailKey = `ayyam_email_sent_${schedule.hijriYear}_${schedule.hijriMonth}`;
            if (!localStorage.getItem(emailKey)) {
              await triggerAyyamEmailAlert(prefs.userEmail, schedule, prefs.advanceDays);
              localStorage.setItem(emailKey, 'true');
            }
          }
        }
      } catch (err) {
        console.warn('Ayyam Al-Bid notification init failed:', err);
      }
    };

    initAyyamNotifications();
  }, [isHydrated, user?.uid]);

  // Handlers for Prayer Checklists & Statuses
  const handleSavePrayerLog = async (updated: DailyPrayerLog) => {
    setPrayerLog(updated);
    setPrayerLogsCache((prev) => ({ ...prev, [updated.date]: updated }));
    if (user?.uid) {
      try {
        await savePrayerLog(user.uid, updated);
      } catch (err) {
        console.error('Failed to save prayer log to Firestore:', err);
      }
    }
  };

  // Handlers for Deeds Checklists
  const handleToggleDeed = async (deedId: string) => {
    const isCompleted = deedsLog.completedDeedIds.includes(deedId);
    const updatedIds = isCompleted
      ? deedsLog.completedDeedIds.filter((id) => id !== deedId)
      : [...deedsLog.completedDeedIds, deedId];

    const updated: DailyDeedsLog = {
      ...deedsLog,
      date: currentDate,
      completedDeedIds: updatedIds,
      updatedAt: new Date().toISOString(),
    };

    // Optimistic UI update
    setDeedsLog(updated);
    setDeedsLogsCache((prev) => ({ ...prev, [currentDate]: updated }));

    // Persistent Firestore Write
    if (user?.uid) {
      try {
        await saveDeedsLog(user.uid, updated);
      } catch (err) {
        console.error('Failed to save deeds log to Firestore:', err);
      }
    }
  };

  const handleAddCustomDeed = (newDeed: DeedItem) => {
    setCustomDeeds((prev) => [newDeed, ...prev]);
  };

  // Handlers for Quran
  const handleSaveQuranLog = async (newLog: QuranLog) => {
    setQuranLogs((prev) => [newLog, ...prev.filter((l) => l.id !== newLog.id)]);
    if (user?.uid) {
      await saveQuranLog(user.uid, newLog);
    }
  };

  const handleDeleteQuranLog = async (logId: string) => {
    setQuranLogs((prev) => prev.filter((l) => l.id !== logId));
    if (user?.uid) {
      await deleteQuranLog(user.uid, logId);
    }
  };

  // Handlers for Character Reflection
  const handleSaveCharacterReflection = async (updated: CharacterReflection) => {
    setCharacterReflection(updated);
    if (user?.uid) {
      await saveCharacterReflection(user.uid, updated);
    }
  };

  // Handlers for Ramadan Logs
  const handleSaveRamadanLog = async (updated: RamadanLog) => {
    setRamadanLog(updated);
    if (user?.uid) {
      await saveRamadanLog(user.uid, updated);
    }
  };

  // Handlers for Personal Habits
  const handleSaveHabit = async (updated: PersonalHabit) => {
    setHabits((prev) => {
      const idx = prev.findIndex((h) => h.id === updated.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [...prev, updated];
    });
    if (user?.uid) {
      await savePersonalHabit(user.uid, updated);
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
    if (user?.uid) {
      await deletePersonalHabit(user.uid, habitId);
    }
  };

  // Handlers for Duas
  const handleToggleFavoriteDua = async (duaId: string) => {
    const isFav = favoriteDuaIds.includes(duaId);
    const updated = isFav ? favoriteDuaIds.filter((id) => id !== duaId) : [...favoriteDuaIds, duaId];
    setFavoriteDuaIds(updated);
    if (user?.uid) {
      await toggleFavoriteDua(user.uid, duaId);
    }
  };

  // Settings & Profile Save
  const handleSaveSettings = async (updated: UserSettings) => {
    setSettings(updated);
    if (user?.uid) {
      await saveUserSettings(user.uid, updated);
      if (user) {
        setUser({ ...user, displayName: updated.displayName });
      }
    }
  };

  // If initial auth or Firestore hydration is in progress, show serene loading screen
  if (!isAuthReady || !isHydrated) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center font-bengali">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#0F4C3A] to-[#0A3327] flex items-center justify-center text-amber-300 shadow-xl border border-emerald-800/40 animate-pulse mb-5">
          <span className="font-arabic text-3xl font-bold">ﷲ</span>
        </div>
        <h1 className="text-2xl font-bold text-[#0F4C3A] tracking-tight">MY DEEN &amp; LIFE</h1>
        <p className="text-xs text-[#8A7043] font-semibold mt-1">
          Become Better Every Day, For The Sake of Allah.
        </p>

        <div className="mt-8 p-4 rounded-2xl bg-white shadow-sm border border-stone-200/80 max-w-sm w-full flex items-center justify-center gap-3">
          <div className="w-5 h-5 border-2 border-[#0F4C3A] border-t-transparent rounded-full animate-spin shrink-0" />
          <span className="text-xs font-medium text-stone-700">
            ক্লাউড ফায়ারস্টোর হতে আপনার আমল ও প্রোফাইল ডাটা সিঙ্ক হচ্ছে...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-800 flex flex-col font-bengali islamic-pattern">
      {/* Global Sync Error Toast (if an operation failed) */}
      {syncState.status === 'error' && (
        <div className="bg-rose-600 text-white text-xs px-4 py-2 flex items-center justify-between shadow-md sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{syncState.message} ({syncState.errorMessage || 'নেটওয়ার্ক ত্রুটি'})</span>
          </div>
          {syncState.retryFn && (
            <button
              onClick={() => syncState.retryFn?.()}
              className="px-3 py-1 bg-white text-rose-700 rounded-lg text-xs font-bold hover:bg-rose-50 flex items-center gap-1 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>পুনরায় চেষ্টা করুন</span>
            </button>
          )}
        </div>
      )}

      {/* Top Header */}
      <Header
        user={user}
        settings={settings}
        unreadNotificationsCount={notifications.filter((n) => !n.read).length}
        onToggleNotifications={() => setShowNotifications((prev) => !prev)}
        showNotifications={showNotifications}
        notifications={notifications}
        onMarkNotificationRead={async (id) => {
          await markNotificationAsRead(user?.uid || 'guest', id);
          setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        }}
        onCloseNotifications={() => setShowNotifications(false)}
        onOpenSettings={() => setShowSettings(true)}
        onOpenAuth={() => setShowAuth(true)}
        onOpenFirebaseGuide={() => setShowFirebaseGuide(true)}
      />

      {/* Main Navigation (Desktop Tabs & Mobile Quick Bar) */}
      <Navigation activeTab={activeTab} onSelectTab={(tab) => setActiveTab(tab)} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'home' && (
          <HomeDashboard
            user={user}
            settings={settings}
            todayDate={currentDate}
            prayerLog={prayerLog}
            deedsLog={deedsLog}
            quranLogs={quranLogs}
            characterReflection={characterReflection}
            dailyHadith={dailyHadith || undefined}
            totalVerifiedHadiths={hadiths.filter((h) => h.verificationStatus === 'verified').length}
            onOpenHadithAdmin={() => setShowHadithAdmin(true)}
            onUpdatePrayer={handleSavePrayerLog}
            onToggleDeed={handleToggleDeed}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenQuickAddQuran={() => setActiveTab('quran')}
          />
        )}

        {activeTab === 'salah' && (
          <SalahTracker
            currentDate={currentDate}
            prayerLog={prayerLog}
            onDateChange={(d) => setCurrentDate(d)}
            onSavePrayerLog={handleSavePrayerLog}
          />
        )}

        {activeTab === 'deeds' && (
          <DailyDeeds
            currentDate={currentDate}
            deedsLog={deedsLog}
            onToggleDeed={handleToggleDeed}
            customDeeds={customDeeds}
            onAddCustomDeed={handleAddCustomDeed}
          />
        )}

        {activeTab === 'ayyam' && (
          <AyyamAlBidDashboard
            uid={user?.uid || 'guest'}
            userEmail={user?.email || 'raiyan3945@gmail.com'}
          />
        )}

        {activeTab === 'hadith' && (
          <HadithLibraryView
            hadiths={hadiths}
            dailyHadith={dailyHadith || hadiths[0]}
            onOpenAdmin={() => setShowHadithAdmin(true)}
          />
        )}

        {activeTab === 'dua' && (
          <DuaLibrary
            favoriteIds={favoriteDuaIds}
            onToggleFavorite={handleToggleFavoriteDua}
          />
        )}

        {activeTab === 'quran' && (
          <QuranTracker
            currentDate={currentDate}
            quranLogs={quranLogs}
            settings={settings}
            onSaveLog={handleSaveQuranLog}
            onDeleteLog={handleDeleteQuranLog}
          />
        )}

        {activeTab === 'ramadan' && (
          <RamadanPrep
            currentDate={currentDate}
            settings={settings}
            ramadanLog={ramadanLog}
            onSaveRamadanLog={handleSaveRamadanLog}
            onOpenSettings={() => setShowSettings(true)}
          />
        )}

        {activeTab === 'character' && (
          <CharacterTracker
            currentDate={currentDate}
            reflection={characterReflection}
            onSaveReflection={handleSaveCharacterReflection}
          />
        )}

        {activeTab === 'habits' && (
          <PersonalHabits
            currentDate={currentDate}
            habits={habits}
            onSaveHabit={handleSaveHabit}
            onDeleteHabit={handleDeleteHabit}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            currentDate={currentDate}
            onSelectDate={(d) => setCurrentDate(d)}
            prayerLogsCache={prayerLogsCache}
            deedsLogsCache={deedsLogsCache}
            quranLogs={quranLogs}
          />
        )}

        {activeTab === 'improvement' && (
          <ImprovementTracker
            uid={user?.uid || 'guest'}
            todayDate={currentDate}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsReports
            currentDate={currentDate}
            prayerLogsCache={prayerLogsCache}
            deedsLogsCache={deedsLogsCache}
            quranLogs={quranLogs}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E6E0D6] bg-white/70 py-6 text-center text-xs text-stone-500 mb-14 md:mb-0">
        <p className="font-medium text-stone-700">
          MY DEEN &amp; LIFE • Become Better Every Day, For The Sake of Allah.
        </p>
        <p className="text-[11px] text-stone-400 mt-1">
          Asia/Dhaka টাইমজোন • পবিত্র মাহে রমাদান ১৪৪৮ হিজরি প্রস্তুতি
        </p>
      </footer>

      {/* Modals */}
      {showHadithAdmin && (
        <HadithAdminModal
          hadiths={hadiths}
          onHadithUpdated={(updated) => {
            setHadiths(updated);
            setDailyHadith(getHadithOfTheDay(updated, currentDate));
          }}
          onClose={() => setShowHadithAdmin(false)}
          uid={user?.uid}
        />
      )}

      {showSettings && (
        <SettingsModal
          uid={user?.uid || 'guest'}
          settings={settings}
          onSaveSettings={handleSaveSettings}
          onClose={() => setShowSettings(false)}
          onOpenFirebaseGuide={() => {
            setShowSettings(false);
            setShowFirebaseGuide(true);
          }}
          onDataReset={() => {
            loadUserData();
          }}
        />
      )}

      {showAuth && (
        <AuthModal
          user={user}
          onUserChanged={(u) => {
            setUser(u);
            if (u?.displayName) {
              setSettings((prev) => ({ ...prev, displayName: u.displayName || prev.displayName }));
            }
          }}
          onClose={() => setShowAuth(false)}
          onOpenFirebaseGuide={() => {
            setShowAuth(false);
            setShowFirebaseGuide(true);
          }}
        />
      )}

      {showFirebaseGuide && (
        <FirebaseGuideModal onClose={() => setShowFirebaseGuide(false)} />
      )}
    </div>
  );
}
