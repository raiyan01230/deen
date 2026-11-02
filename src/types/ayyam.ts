export type MoonConfirmationStatus =
  | 'officially_confirmed' // ইসলামিক ফাউন্ডেশন বাংলাদেশ / জাতীয় চাঁদ দেখা কমিটি
  | 'estimated_provisional' // বাংলাদেশ আবহাওয়া অধিদপ্তর / জ্যোতির্বিজ্ঞান ভিত্তিক
  | 'awaiting_confirmation' // চাঁদ দেখার খবরের অপেক্ষায়
  | 'manually_verified'; // প্রশাসনিক নিরীক্ষিত

export type FastingLogStatus = 'planned' | 'fasted' | 'not_fasted' | 'not_recorded';
export type FastingType = 'ayyam_al_bid' | 'voluntary_sunnah' | 'ramadan' | 'qada';

export interface BangladeshHijriDateInfo {
  gregorianDate: string; // YYYY-MM-DD
  hijriYear: number;
  hijriMonth: number;
  hijriMonthNameBn: string;
  hijriMonthNameAr: string;
  hijriDay: number;
  confirmationStatus: MoonConfirmationStatus;
  statusLabelBn: string;
  district: string; // e.g. 'ঢাকা (Dhaka)'
  sourceType: 'IFB' | 'BMD' | 'ALADHAN' | 'MANUAL';
  sourceName: string;
  sourceUrl: string;
  announcementDate?: string;
  retrievedTime: string;
  discrepancyNote?: string;
  isDaysOfTashriq?: boolean;
}

export interface AyyamAlBidDates {
  hijriMonth: number;
  hijriMonthNameBn: string;
  hijriYear: number;
  confirmationStatus: MoonConfirmationStatus;
  day13: {
    hijriDay: 13;
    gregorianDate: string; // YYYY-MM-DD
    weekdayBn: string;
    isProhibitedTashriq: boolean;
    tashriqReason?: string;
  };
  day14: {
    hijriDay: 14;
    gregorianDate: string;
    weekdayBn: string;
    isProhibitedTashriq: boolean;
    tashriqReason?: string;
  };
  day15: {
    hijriDay: 15;
    gregorianDate: string;
    weekdayBn: string;
    isProhibitedTashriq: boolean;
    tashriqReason?: string;
  };
  sunsetMaghribBegins: string; // e.g. "17:45"
  fajrSehriEnds: string; // e.g. "05:02"
  daysUntilStart?: number;
  hasTashriqProhibition?: boolean;
}

export interface FastingDayRecord {
  date: string; // YYYY-MM-DD
  hijriDateStr: string; // e.g. "১৩ রজব ১৪৪৮"
  fastingType: FastingType;
  status: FastingLogStatus;
  sehriDone?: boolean;
  iftarDone?: boolean;
  reflectionNotes?: string;
  updatedAt: string;
}

export interface UserNotificationPreferences {
  email: boolean;
  browserPush: boolean;
  inApp: boolean;
  advanceDays: number; // 2 or 3 days before
  reminderTime: string; // e.g. "20:30"
  preFajrSehriAlert: boolean;
  userEmail: string;
  district: string;
  deviceTokens?: string[];
}

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'ayyam_advance' | 'ayyam_evening' | 'ayyam_sehri' | 'date_correction' | 'info';
  read: boolean;
  link?: string;
  idempotencyKey?: string;
}

export interface MonthStartCorrectionAudit {
  id: string;
  hijriMonth: number;
  hijriYear: number;
  previousStartDate: string;
  correctedStartDate: string;
  reason: string;
  correctedBy: string;
  correctedAt: string;
}
