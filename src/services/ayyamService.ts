import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import {
  BangladeshHijriDateInfo,
  AyyamAlBidDates,
  FastingDayRecord,
  UserNotificationPreferences,
  InAppNotification,
  MonthStartCorrectionAudit,
  MoonConfirmationStatus,
} from '../types/ayyam';
import { calculateAyyamAlBidDates, getHijriMonthStart } from '../utils/ayyamCalculations';
import { getDhakaDateString, getApproximateHijriDate } from '../utils/hijriCalendar';

export const DEFAULT_NOTIFICATION_PREFS: UserNotificationPreferences = {
  email: true,
  browserPush: true,
  inApp: true,
  advanceDays: 3,
  reminderTime: '20:30',
  preFajrSehriAlert: true,
  userEmail: 'raiyan3945@gmail.com',
  district: 'ঢাকা (Dhaka)',
};

const LOCAL_FASTING_KEY = 'my_deen_fasting_logs';
const LOCAL_HIJRI_PREFS_KEY = 'my_deen_hijri_prefs';
const LOCAL_NOTIFS_KEY = 'my_deen_inapp_notifs';
const LOCAL_AUDIT_KEY = 'my_deen_month_audits';

/**
 * Returns current Bangladesh Hijri date intelligence with verification status.
 */
export async function getBangladeshHijriDateInfo(
  district: string = 'ঢাকা (Dhaka)',
  customMonthStart?: string
): Promise<BangladeshHijriDateInfo> {
  const todayDhaka = getDhakaDateString();
  const hijri = getApproximateHijriDate(new Date());

  // Check if manual administrative correction exists
  let status: MoonConfirmationStatus = 'estimated_provisional';
  let statusLabelBn = 'বাংলাদেশ আবহাওয়া অধিদপ্তর ও জ্যোতির্বিজ্ঞানভিত্তিক অনুমিত তারিখ';
  let sourceName = 'বাংলাদেশ আবহাওয়া অধিদপ্তর (BMD) ও ইসলামিক ক্যালেন্ডার প্রজেকশন';
  let sourceUrl = 'https://www.bmd.gov.bd';
  let discrepancyNote: string | undefined = undefined;

  // Try fetching live cross-check status from backend API if available
  try {
    const res = await fetch(`/api/hijri/bangladesh-status?district=${encodeURIComponent(district)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.status) {
        status = data.status;
        statusLabelBn = data.statusLabelBn || statusLabelBn;
        sourceName = data.sourceName || sourceName;
        sourceUrl = data.sourceUrl || sourceUrl;
        discrepancyNote = data.discrepancyNote;
      }
    }
  } catch (e) {
    // Graceful offline fallback
  }

  return {
    gregorianDate: todayDhaka,
    hijriYear: hijri.year,
    hijriMonth: hijri.month,
    hijriMonthNameBn: hijri.monthNameBn,
    hijriMonthNameAr: hijri.monthNameAr,
    hijriDay: hijri.day,
    confirmationStatus: status,
    statusLabelBn,
    district,
    sourceType: status === 'officially_confirmed' ? 'IFB' : 'BMD',
    sourceName,
    sourceUrl,
    retrievedTime: new Date().toISOString(),
    discrepancyNote,
    isDaysOfTashriq: hijri.month === 12 && (hijri.day === 11 || hijri.day === 12 || hijri.day === 13),
  };
}

/**
 * Calculates current or upcoming month's Ayyam al-Bid dates for Bangladesh.
 * If the 15th of the current month has passed, it automatically returns the next month's schedule.
 */
export async function getCurrentAyyamAlBidSchedule(
  district: string = 'ঢাকা (Dhaka)'
): Promise<AyyamAlBidDates> {
  const info = await getBangladeshHijriDateInfo(district);
  
  // 1. Calculate current month's schedule
  const currentMonthStart = getHijriMonthStart(info.hijriMonth, info.hijriYear);
  const currentSchedule = calculateAyyamAlBidDates(
    currentMonthStart,
    info.hijriMonth,
    info.hijriYear,
    info.confirmationStatus
  );

  // 2. Check if the 15th has already passed (in Bangladesh time)
  // We consider it "passed" after Maghrib of the 15th, or just the end of the day.
  const d15 = new Date(`${currentSchedule.day15.gregorianDate}T23:59:59+06:00`);
  const now = new Date();

  if (now > d15) {
    // Current month's Ayyam Al-Bid is over. Calculate for NEXT month.
    let nextMonth = info.hijriMonth + 1;
    let nextYear = info.hijriYear;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }

    const nextMonthStart = getHijriMonthStart(nextMonth, nextYear);
    return calculateAyyamAlBidDates(
      nextMonthStart,
      nextMonth,
      nextYear,
      'estimated_provisional' // Next month is always estimated initially
    );
  }

  return currentSchedule;
}

// ===================== FASTING LOGS PERSISTENCE =====================

export async function saveFastingLog(
  uid: string,
  record: FastingDayRecord
): Promise<FastingDayRecord> {
  const userKey = `${LOCAL_FASTING_KEY}_${uid || 'guest'}`;
  const localVal: Record<string, FastingDayRecord> = JSON.parse(
    localStorage.getItem(userKey) || '{}'
  );
  localVal[record.date] = record;
  localStorage.setItem(userKey, JSON.stringify(localVal));

  if (isFirebaseConfigured() && db && uid && uid !== 'guest') {
    try {
      const docRef = doc(db, 'users', uid, 'fastingLogs', record.date);
      await setDoc(docRef, record, { merge: true });
    } catch (err) {
      console.warn('Firestore saveFastingLog error:', err);
    }
  }

  return record;
}

export async function getFastingLogs(uid: string): Promise<Record<string, FastingDayRecord>> {
  const userKey = `${LOCAL_FASTING_KEY}_${uid || 'guest'}`;
  const localVal: Record<string, FastingDayRecord> = JSON.parse(
    localStorage.getItem(userKey) || '{}'
  );

  if (isFirebaseConfigured() && db && uid && uid !== 'guest') {
    try {
      const colRef = collection(db, 'users', uid, 'fastingLogs');
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        snap.forEach((d) => {
          localVal[d.id] = d.data() as FastingDayRecord;
        });
        localStorage.setItem(userKey, JSON.stringify(localVal));
      }
    } catch (err) {
      console.warn('Firestore getFastingLogs error:', err);
    }
  }

  return localVal;
}

// ===================== USER NOTIFICATION PREFERENCES =====================

export async function saveNotificationPreferences(
  uid: string,
  prefs: UserNotificationPreferences
): Promise<UserNotificationPreferences> {
  localStorage.setItem(LOCAL_HIJRI_PREFS_KEY, JSON.stringify(prefs));

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, 'users', uid, 'notificationPreferences', 'ayyam_settings');
      await setDoc(docRef, prefs, { merge: true });
    } catch (err) {
      console.warn('Firestore saveNotificationPreferences error:', err);
    }
  }

  return prefs;
}

export async function getNotificationPreferences(uid: string): Promise<UserNotificationPreferences> {
  try {
    const saved = localStorage.getItem(LOCAL_HIJRI_PREFS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {}

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, 'users', uid, 'notificationPreferences', 'ayyam_settings');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as UserNotificationPreferences;
        localStorage.setItem(LOCAL_HIJRI_PREFS_KEY, JSON.stringify(data));
        return data;
      }
    } catch (e) {}
  }

  return DEFAULT_NOTIFICATION_PREFS;
}

// ===================== IN-APP NOTIFICATIONS =====================

export async function getInAppNotifications(uid: string): Promise<InAppNotification[]> {
  try {
    const local = localStorage.getItem(LOCAL_NOTIFS_KEY);
    if (local) return JSON.parse(local);
  } catch (e) {}
  return [];
}

export async function saveInAppNotification(
  uid: string,
  notif: InAppNotification
): Promise<InAppNotification> {
  const list = await getInAppNotifications(uid);
  // Prevent duplicate idempotency key
  if (notif.idempotencyKey && list.some((n) => n.idempotencyKey === notif.idempotencyKey)) {
    return notif;
  }
  list.unshift(notif);
  localStorage.setItem(LOCAL_NOTIFS_KEY, JSON.stringify(list));

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, 'users', uid, 'notifications', notif.id);
      await setDoc(docRef, notif, { merge: true });
    } catch (e) {}
  }

  return notif;
}

export async function markNotificationAsRead(uid: string, notifId: string): Promise<void> {
  const list = await getInAppNotifications(uid);
  const updated = list.map((n) => (n.id === notifId ? { ...n, read: true } : n));
  localStorage.setItem(LOCAL_NOTIFS_KEY, JSON.stringify(updated));

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, 'users', uid, 'notifications', notifId);
      await setDoc(docRef, { read: true }, { merge: true });
    } catch (e) {}
  }
}

// ===================== ADMIN AUDIT CORRECTIONS =====================

export async function saveMonthCorrectionAudit(
  audit: MonthStartCorrectionAudit
): Promise<void> {
  const list: MonthStartCorrectionAudit[] = JSON.parse(
    localStorage.getItem(LOCAL_AUDIT_KEY) || '[]'
  );
  list.unshift(audit);
  localStorage.setItem(LOCAL_AUDIT_KEY, JSON.stringify(list));

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, 'global', 'hijriAudit', 'corrections', audit.id);
      await setDoc(docRef, audit, { merge: true });
    } catch (e) {}
  }
}

export async function getMonthCorrectionAudits(): Promise<MonthStartCorrectionAudit[]> {
  try {
    const saved = localStorage.getItem(LOCAL_AUDIT_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return [];
}

/**
 * Triggers test transactional email via server-side endpoint.
 */
export async function triggerAyyamEmailAlert(
  email: string,
  ayyam: AyyamAlBidDates,
  advanceDays: number
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/notifications/email-ayyam-al-bid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, ayyam, advanceDays }),
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({}));
    return { success: false, message: err.message || 'সার্ভার ইমেইল পাঠাতে ব্যর্থ হয়েছে।' };
  } catch (e: any) {
    return { success: false, message: e.message || 'নেটওয়ার্ক সংযোগ সমস্যা।' };
  }
}

/**
 * Helper to check if today is an Ayyam al-Bid fasting day for the current user's timezone.
 */
export async function isTodayAyyamAlBid(district: string = 'ঢাকা (Dhaka)'): Promise<boolean> {
  const info = await getBangladeshHijriDateInfo(district);
  // Fasting days are 13, 14, 15
  // Exception: 13 Dhul Hijjah is prohibited
  if (info.hijriDay === 13 && info.hijriMonth === 12) return false;
  return [13, 14, 15].includes(info.hijriDay);
}
