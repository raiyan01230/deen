import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import {
  DailyPrayerLog,
  DailyDeedsLog,
  QuranLog,
  CharacterReflection,
  RamadanLog,
  PersonalHabit,
  UserSettings,
} from '../types';
import { getDhakaDateString } from '../utils/hijriCalendar';
import { updateUserProfileName } from './authService';

// ===================== SYNC STATE MANAGEMENT =====================

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface SyncStateInfo {
  status: SyncStatus;
  message: string;
  lastSavedAt?: string;
  errorMessage?: string;
  retryFn?: () => Promise<void>;
}

let currentSyncState: SyncStateInfo = {
  status: 'idle',
  message: 'প্রস্তুত',
};

const syncListeners = new Set<(info: SyncStateInfo) => void>();

export function subscribeToSyncState(callback: (info: SyncStateInfo) => void): () => void {
  syncListeners.add(callback);
  callback(currentSyncState);
  return () => {
    syncListeners.delete(callback);
  };
}

function updateSyncState(info: Partial<SyncStateInfo>) {
  currentSyncState = { ...currentSyncState, ...info };
  syncListeners.forEach((cb) => cb(currentSyncState));
}

export function getSyncState(): SyncStateInfo {
  return currentSyncState;
}

// Local storage keying helper
function getLocalKey(uid: string, entity: string, id: string = ''): string {
  return `mydeen_${uid}_${entity}${id ? '_' + id : ''}`;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  displayName: 'মুসাফির',
  language: 'bn',
  timezone: 'Asia/Dhaka',
  ramadanTargetDate: '2027-02-09',
  quranDailyGoalPages: 2,
  notificationsEnabled: false,
  reminderTimes: {
    fajr: true,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: true,
    adhkarMorning: true,
    adhkarEvening: true,
    quran: true,
  },
  isDarkMode: false,
};

// ===================== USER SETTINGS & PROFILE =====================

/**
 * Saves user settings and profile to Firestore: users/{uid}/settings/profile
 */
export async function saveUserSettings(uid: string, settings: UserSettings): Promise<UserSettings> {
  if (!uid) return settings;

  const cleanSettings: UserSettings = {
    ...settings,
    displayName: settings.displayName?.trim() || 'মুসাফির',
    timezone: 'Asia/Dhaka',
  };

  updateSyncState({
    status: 'saving',
    message: 'প্রোফাইল তথ্য ক্লাউডে সংরক্ষণ করা হচ্ছে...',
  });

  // Local write first
  const key = getLocalKey(uid, 'settings', 'profile');
  localStorage.setItem(key, JSON.stringify(cleanSettings));

  // Sync to Firebase Auth displayName
  if (cleanSettings.displayName) {
    updateUserProfileName(uid, cleanSettings.displayName).catch((e) => {
      console.warn('Auth displayName update non-critical warning:', e);
    });
  }

  // Firestore write
  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, 'users', uid, 'settings', 'profile');
      await setDoc(
        docRef,
        {
          ...cleanSettings,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      updateSyncState({
        status: 'saved',
        message: 'প্রোফাইল ক্লাউডে সংরক্ষিত হয়েছে ✓',
        lastSavedAt: new Date().toISOString(),
        errorMessage: undefined,
        retryFn: undefined,
      });
    } catch (err: any) {
      console.error('Firestore saveUserSettings error:', err);
      updateSyncState({
        status: 'error',
        message: 'প্রোফাইল সংরক্ষণে সমস্যা হয়েছে',
        errorMessage: err?.message || 'নেটওয়ার্ক বা পারমিশন ত্রুটি',
        retryFn: () => saveUserSettings(uid, cleanSettings).then(() => {}),
      });
      throw err;
    }
  } else {
    updateSyncState({
      status: 'saved',
      message: 'লোকাল ডিভাইসে সংরক্ষিত ✓',
      lastSavedAt: new Date().toISOString(),
    });
  }

  return cleanSettings;
}

/**
 * Loads user settings from Firestore users/{uid}/settings/profile with fallback to local cache
 */
export async function getUserSettings(uid: string): Promise<UserSettings> {
  if (!uid) return DEFAULT_USER_SETTINGS;

  const key = getLocalKey(uid, 'settings', 'profile');
  const localVal = localStorage.getItem(key);
  let cached: UserSettings | null = null;
  try {
    if (localVal) cached = JSON.parse(localVal);
  } catch (e) {
    // Ignore JSON error
  }

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, 'users', uid, 'settings', 'profile');
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data() as UserSettings;
        const merged: UserSettings = {
          ...DEFAULT_USER_SETTINGS,
          ...data,
          displayName: data.displayName || cached?.displayName || 'মুসাফির',
        };
        localStorage.setItem(key, JSON.stringify(merged));
        return merged;
      }
    } catch (err) {
      console.warn('Firestore getUserSettings error:', err);
    }
  }

  return cached || DEFAULT_USER_SETTINGS;
}

/**
 * Real-time subscription to User Settings
 */
export function subscribeToUserSettings(
  uid: string,
  onUpdate: (settings: UserSettings) => void
): Unsubscribe {
  if (!uid || !isFirebaseConfigured() || !db) {
    getUserSettings(uid).then(onUpdate);
    return () => {};
  }

  const docRef = doc(db, 'users', uid, 'settings', 'profile');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as UserSettings;
        const merged = { ...DEFAULT_USER_SETTINGS, ...data };
        localStorage.setItem(getLocalKey(uid, 'settings', 'profile'), JSON.stringify(merged));
        onUpdate(merged);
      }
    },
    (err) => {
      console.warn('onSnapshot userSettings error:', err);
    }
  );
}

// ===================== DAILY DEEDS CHECKLIST =====================

/**
 * Saves completed deed IDs for the given date: users/{uid}/dailyLogs/{date}
 */
export async function saveDeedsLog(uid: string, log: DailyDeedsLog): Promise<DailyDeedsLog> {
  if (!uid) return log;

  const updatedLog: DailyDeedsLog = {
    ...log,
    date: log.date || getDhakaDateString(),
    completedDeedIds: Array.from(new Set(log.completedDeedIds || [])),
    updatedAt: new Date().toISOString(),
  };

  updateSyncState({
    status: 'saving',
    message: 'আমলের তালিকা সংরক্ষণ করা হচ্ছে...',
  });

  // Local storage write
  localStorage.setItem(getLocalKey(uid, 'deeds', updatedLog.date), JSON.stringify(updatedLog));

  // Firestore write
  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, 'users', uid, 'dailyLogs', updatedLog.date);
      await setDoc(docRef, updatedLog, { merge: true });

      updateSyncState({
        status: 'saved',
        message: 'আমল ক্লাউডে সংরক্ষিত ✓',
        lastSavedAt: new Date().toISOString(),
        errorMessage: undefined,
        retryFn: undefined,
      });
    } catch (err: any) {
      console.error('Firestore saveDeedsLog error:', err);
      updateSyncState({
        status: 'error',
        message: 'আমল সংরক্ষণে ত্রুটি হয়েছে',
        errorMessage: err?.message || 'ডাটাবেজ সংযোগে সমস্যা',
        retryFn: () => saveDeedsLog(uid, updatedLog).then(() => {}),
      });
      throw err;
    }
  } else {
    updateSyncState({
      status: 'saved',
      message: 'লোকাল মেমরিতে সংরক্ষিত ✓',
      lastSavedAt: new Date().toISOString(),
    });
  }

  return updatedLog;
}

/**
 * Retrieves daily deeds log for the given date
 */
export async function getDeedsLog(uid: string, dateStr: string): Promise<DailyDeedsLog> {
  const fallbackEmpty: DailyDeedsLog = {
    date: dateStr,
    completedDeedIds: [],
    updatedAt: new Date().toISOString(),
  };

  if (!uid) return fallbackEmpty;

  const key = getLocalKey(uid, 'deeds', dateStr);
  const localVal = localStorage.getItem(key);
  let cached: DailyDeedsLog | null = null;
  try {
    if (localVal) cached = JSON.parse(localVal);
  } catch (e) {
    // Ignore
  }

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, 'users', uid, 'dailyLogs', dateStr);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data() as DailyDeedsLog;
        localStorage.setItem(key, JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn('Firestore getDeedsLog error:', err);
    }
  }

  return cached || fallbackEmpty;
}

/**
 * Real-time subscription to Daily Deeds
 */
export function subscribeToDeedsLog(
  uid: string,
  dateStr: string,
  onUpdate: (log: DailyDeedsLog) => void
): Unsubscribe {
  if (!uid || !isFirebaseConfigured() || !db) {
    getDeedsLog(uid, dateStr).then(onUpdate);
    return () => {};
  }

  const docRef = doc(db, 'users', uid, 'dailyLogs', dateStr);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as DailyDeedsLog;
        localStorage.setItem(getLocalKey(uid, 'deeds', dateStr), JSON.stringify(data));
        onUpdate(data);
      }
    },
    (err) => {
      console.warn('onSnapshot deedsLog error:', err);
    }
  );
}

// ===================== PRAYER LOGS (SALAH TRACKER) =====================

/**
 * Saves prayer log for the given date: users/{uid}/prayerLogs/{date}
 */
export async function savePrayerLog(uid: string, log: DailyPrayerLog): Promise<DailyPrayerLog> {
  if (!uid) return log;

  const updatedLog: DailyPrayerLog = {
    ...log,
    date: log.date || getDhakaDateString(),
    updatedAt: new Date().toISOString(),
  };

  updateSyncState({
    status: 'saving',
    message: 'সালাতের রেকর্ড সংরক্ষণ করা হচ্ছে...',
  });

  localStorage.setItem(getLocalKey(uid, 'prayer', updatedLog.date), JSON.stringify(updatedLog));

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, 'users', uid, 'prayerLogs', updatedLog.date);
      await setDoc(docRef, updatedLog, { merge: true });

      updateSyncState({
        status: 'saved',
        message: 'সালাত ক্লাউডে সংরক্ষিত ✓',
        lastSavedAt: new Date().toISOString(),
        errorMessage: undefined,
        retryFn: undefined,
      });
    } catch (err: any) {
      console.error('Firestore savePrayerLog error:', err);
      updateSyncState({
        status: 'error',
        message: 'সালাত সংরক্ষণে ত্রুটি হয়েছে',
        errorMessage: err?.message || 'নেটওয়ার্ক ত্রুটি',
        retryFn: () => savePrayerLog(uid, updatedLog).then(() => {}),
      });
      throw err;
    }
  } else {
    updateSyncState({
      status: 'saved',
      message: 'লোকাল ডিভাইসে সংরক্ষিত ✓',
      lastSavedAt: new Date().toISOString(),
    });
  }

  return updatedLog;
}

export async function getPrayerLog(uid: string, dateStr: string): Promise<DailyPrayerLog> {
  const fallbackEmpty: DailyPrayerLog = {
    date: dateStr,
    fajr: { status: 'unrecorded' },
    dhuhr: { status: 'unrecorded' },
    asr: { status: 'unrecorded' },
    maghrib: { status: 'unrecorded' },
    isha: { status: 'unrecorded' },
    updatedAt: new Date().toISOString(),
  };

  if (!uid) return fallbackEmpty;

  const key = getLocalKey(uid, 'prayer', dateStr);
  const localVal = localStorage.getItem(key);
  let cached: DailyPrayerLog | null = null;
  try {
    if (localVal) cached = JSON.parse(localVal);
  } catch (e) {
    // Ignore
  }

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, 'users', uid, 'prayerLogs', dateStr);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data() as DailyPrayerLog;
        localStorage.setItem(key, JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn('Firestore getPrayerLog error:', err);
    }
  }

  return cached || fallbackEmpty;
}

export function subscribeToPrayerLog(
  uid: string,
  dateStr: string,
  onUpdate: (log: DailyPrayerLog) => void
): Unsubscribe {
  if (!uid || !isFirebaseConfigured() || !db) {
    getPrayerLog(uid, dateStr).then(onUpdate);
    return () => {};
  }

  const docRef = doc(db, 'users', uid, 'prayerLogs', dateStr);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as DailyPrayerLog;
        localStorage.setItem(getLocalKey(uid, 'prayer', dateStr), JSON.stringify(data));
        onUpdate(data);
      }
    },
    (err) => {
      console.warn('onSnapshot prayerLog error:', err);
    }
  );
}

export async function getPrayerLogsRange(uid: string, dateStrings: string[]): Promise<DailyPrayerLog[]> {
  const results: DailyPrayerLog[] = [];
  for (const date of dateStrings) {
    const log = await getPrayerLog(uid, date);
    results.push(log);
  }
  return results;
}

// ===================== QURAN TRACKER =====================

export async function saveQuranLog(uid: string, log: QuranLog): Promise<QuranLog> {
  const key = getLocalKey(uid, 'quran_all');
  const allLogs: QuranLog[] = JSON.parse(localStorage.getItem(key) || '[]');
  const existingIdx = allLogs.findIndex((l) => l.id === log.id);

  if (existingIdx >= 0) {
    allLogs[existingIdx] = log;
  } else {
    allLogs.unshift(log);
  }
  localStorage.setItem(key, JSON.stringify(allLogs));

  updateSyncState({ status: 'saving', message: 'কুরআন তিলাওয়াত রেকর্ড সেভ হচ্ছে...' });

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, 'users', uid, 'quranLogs', log.id);
      await setDoc(docRef, log, { merge: true });
      updateSyncState({ status: 'saved', message: 'কুরআন রেকর্ড ক্লাউডে সংরক্ষিত ✓' });
    } catch (err: any) {
      console.error('Firestore saveQuranLog error:', err);
      updateSyncState({ status: 'error', message: 'কুরআন রেকর্ড সংরক্ষণে ত্রুটি' });
    }
  }

  return log;
}

export async function deleteQuranLog(uid: string, logId: string): Promise<void> {
  const key = getLocalKey(uid, 'quran_all');
  const allLogs: QuranLog[] = JSON.parse(localStorage.getItem(key) || '[]');
  const filtered = allLogs.filter((l) => l.id !== logId);
  localStorage.setItem(key, JSON.stringify(filtered));

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, 'users', uid, 'quranLogs', logId);
      await deleteDoc(docRef);
    } catch (err) {
      console.error('Firestore deleteQuranLog error:', err);
    }
  }
}

export async function getQuranLogs(uid: string): Promise<QuranLog[]> {
  const key = getLocalKey(uid, 'quran_all');
  const cached: QuranLog[] = JSON.parse(localStorage.getItem(key) || '[]');

  if (isFirebaseConfigured() && db) {
    try {
      const colRef = collection(db, 'users', uid, 'quranLogs');
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        const list: QuranLog[] = [];
        snapshot.forEach((d) => list.push(d.data() as QuranLog));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        localStorage.setItem(key, JSON.stringify(list));
        return list;
      }
    } catch (err) {
      console.warn('Firestore getQuranLogs error:', err);
    }
  }

  return cached;
}

// ===================== CHARACTER & GHEEBAH =====================

export async function saveCharacterReflection(
  uid: string,
  reflection: CharacterReflection
): Promise<CharacterReflection> {
  const updated = {
    ...reflection,
    updatedAt: new Date().toISOString(),
  };

  const key = getLocalKey(uid, 'character', reflection.date);
  localStorage.setItem(key, JSON.stringify(updated));

  updateSyncState({ status: 'saving', message: 'আত্মশুদ্ধি রেকর্ড সেভ হচ্ছে...' });

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, 'users', uid, 'characterReflections', reflection.date);
      await setDoc(docRef, updated, { merge: true });
      updateSyncState({ status: 'saved', message: 'আত্মশুদ্ধি রেকর্ড সংরক্ষিত ✓' });
    } catch (err: any) {
      console.error('Firestore saveCharacterReflection error:', err);
      updateSyncState({ status: 'error', message: 'আত্মশুদ্ধি রেকর্ড সংরক্ষণে ত্রুটি' });
    }
  }

  return updated;
}

export async function getCharacterReflection(uid: string, dateStr: string): Promise<CharacterReflection> {
  const key = getLocalKey(uid, 'character', dateStr);
  const localVal = localStorage.getItem(key);
  let cached: CharacterReflection | null = localVal ? JSON.parse(localVal) : null;

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, 'users', uid, 'characterReflections', dateStr);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data() as CharacterReflection;
        localStorage.setItem(key, JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn('Firestore getCharacterReflection error:', err);
    }
  }

  if (cached) return cached;

  return {
    id: `char_${dateStr}`,
    date: dateStr,
    avoidedGheebahIntention: false,
    reflectionText: '',
    soughtForgiveness: false,
    angerControlled: false,
    truthfulnessObserved: false,
    kindnessShown: false,
    updatedAt: new Date().toISOString(),
  };
}

// ===================== RAMADAN PREPARATION =====================

export async function saveRamadanLog(uid: string, log: RamadanLog): Promise<RamadanLog> {
  const updated = {
    ...log,
    updatedAt: new Date().toISOString(),
  };

  const key = getLocalKey(uid, 'ramadan', log.date);
  localStorage.setItem(key, JSON.stringify(updated));

  updateSyncState({ status: 'saving', message: 'রমাদান প্রস্তুতি রেকর্ড সেভ হচ্ছে...' });

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, 'users', uid, 'ramadanLogs', log.date);
      await setDoc(docRef, updated, { merge: true });
      updateSyncState({ status: 'saved', message: 'রমাদান প্রস্তুতি রেকর্ড সংরক্ষিত ✓' });
    } catch (err: any) {
      console.error('Firestore saveRamadanLog error:', err);
      updateSyncState({ status: 'error', message: 'রমাদান রেকর্ড সংরক্ষণে সমস্যা' });
    }
  }

  return updated;
}

export async function getRamadanLog(uid: string, dateStr: string, dayNumber: number = 1): Promise<RamadanLog> {
  const key = getLocalKey(uid, 'ramadan', dateStr);
  const localVal = localStorage.getItem(key);
  let cached: RamadanLog | null = localVal ? JSON.parse(localVal) : null;

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, 'users', uid, 'ramadanLogs', dateStr);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data() as RamadanLog;
        localStorage.setItem(key, JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn('Firestore getRamadanLog error:', err);
    }
  }

  if (cached) return cached;

  return {
    date: dateStr,
    dayNumber,
    fasted: false,
    sehriRecorded: false,
    iftarRecorded: false,
    taraweehRakats: 0,
    charityGiven: false,
    quranReadMinutes: 0,
    specialReflection: '',
    updatedAt: new Date().toISOString(),
  };
}

// ===================== PERSONAL HABITS =====================

export async function savePersonalHabit(uid: string, habit: PersonalHabit): Promise<PersonalHabit> {
  const key = getLocalKey(uid, 'habits_all');
  const all: PersonalHabit[] = JSON.parse(localStorage.getItem(key) || '[]');
  const idx = all.findIndex((h) => h.id === habit.id);
  if (idx >= 0) {
    all[idx] = habit;
  } else {
    all.push(habit);
  }
  localStorage.setItem(key, JSON.stringify(all));

  updateSyncState({ status: 'saving', message: 'অভ্যাস ডাটা সেভ হচ্ছে...' });

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, 'users', uid, 'customHabits', habit.id);
      await setDoc(docRef, habit, { merge: true });
      updateSyncState({ status: 'saved', message: 'অভ্যাস ক্লাউডে সংরক্ষিত ✓' });
    } catch (err) {
      console.error('Firestore savePersonalHabit error:', err);
      updateSyncState({ status: 'error', message: 'অভ্যাস সংরক্ষণে সমস্যা' });
    }
  }

  return habit;
}

export async function deletePersonalHabit(uid: string, habitId: string): Promise<void> {
  const key = getLocalKey(uid, 'habits_all');
  const all: PersonalHabit[] = JSON.parse(localStorage.getItem(key) || '[]');
  const filtered = all.filter((h) => h.id !== habitId);
  localStorage.setItem(key, JSON.stringify(filtered));

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, 'users', uid, 'customHabits', habitId);
      await deleteDoc(docRef);
    } catch (err) {
      console.error('Firestore deletePersonalHabit error:', err);
    }
  }
}

export async function getPersonalHabits(uid: string): Promise<PersonalHabit[]> {
  const key = getLocalKey(uid, 'habits_all');
  const cached: PersonalHabit[] = JSON.parse(localStorage.getItem(key) || '[]');

  if (isFirebaseConfigured() && db) {
    try {
      const colRef = collection(db, 'users', uid, 'customHabits');
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        const list: PersonalHabit[] = [];
        snapshot.forEach((d) => list.push(d.data() as PersonalHabit));
        localStorage.setItem(key, JSON.stringify(list));
        return list;
      }
    } catch (err) {
      console.warn('Firestore getPersonalHabits error:', err);
    }
  }

  return cached;
}

// ===================== FAVORITE DUAS =====================

export async function toggleFavoriteDua(uid: string, duaId: string): Promise<boolean> {
  const key = getLocalKey(uid, 'favorite_duas');
  const favs: string[] = JSON.parse(localStorage.getItem(key) || '[]');
  const exists = favs.includes(duaId);
  let updatedFavs: string[];

  if (exists) {
    updatedFavs = favs.filter((id) => id !== duaId);
  } else {
    updatedFavs = [...favs, duaId];
  }
  localStorage.setItem(key, JSON.stringify(updatedFavs));

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, 'users', uid, 'favorites', duaId);
      if (exists) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { duaId, createdAt: new Date().toISOString() });
      }
    } catch (err) {
      console.error('Firestore toggleFavoriteDua error:', err);
    }
  }

  return !exists;
}

export async function getFavoriteDuas(uid: string): Promise<string[]> {
  const key = getLocalKey(uid, 'favorite_duas');
  const cached: string[] = JSON.parse(localStorage.getItem(key) || '[]');

  if (isFirebaseConfigured() && db) {
    try {
      const colRef = collection(db, 'users', uid, 'favorites');
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        const list: string[] = [];
        snapshot.forEach((d) => list.push(d.id));
        localStorage.setItem(key, JSON.stringify(list));
        return list;
      }
    } catch (err) {
      console.warn('Firestore getFavoriteDuas error:', err);
    }
  }

  return cached;
}

// ===================== EXPORT & DATA SAFETY =====================

export async function exportAllUserData(uid: string): Promise<{ json: string; csvPrayers: string }> {
  const today = getDhakaDateString();
  const dateList: string[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dateList.push(getDhakaDateString(d));
  }

  const prayerLogs = await getPrayerLogsRange(uid, dateList);
  const quranLogs = await getQuranLogs(uid);
  const habits = await getPersonalHabits(uid);
  const settings = await getUserSettings(uid);
  const favorites = await getFavoriteDuas(uid);

  const fullData = {
    exportedAt: new Date().toISOString(),
    uid,
    settings,
    prayerLogs: prayerLogs.filter((p) => Object.values(p).some((v: any) => v?.status && v.status !== 'unrecorded')),
    quranLogs,
    habits,
    favorites,
  };

  const json = JSON.stringify(fullData, null, 2);

  let csv = 'Date,Fajr,Dhuhr,Asr,Maghrib,Isha\n';
  prayerLogs.forEach((p) => {
    csv += `${p.date},${p.fajr?.status || 'unrecorded'},${p.dhuhr?.status || 'unrecorded'},${p.asr?.status || 'unrecorded'},${p.maghrib?.status || 'unrecorded'},${p.isha?.status || 'unrecorded'}\n`;
  });

  return { json, csvPrayers: csv };
}

export async function deleteAllUserData(uid: string): Promise<void> {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(`mydeen_${uid}_`)) {
      keysToRemove.push(k);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}
