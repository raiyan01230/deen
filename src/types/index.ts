export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export type PrayerStatus = 'unrecorded' | 'on_time' | 'late_qada' | 'missed';

export interface PrayerEntry {
  status: PrayerStatus;
  jamat?: boolean;
  sunnah?: boolean;
  updatedAt?: string;
}

export interface DailyPrayerLog {
  date: string; // YYYY-MM-DD
  fajr: PrayerEntry;
  dhuhr: PrayerEntry;
  asr: PrayerEntry;
  maghrib: PrayerEntry;
  isha: PrayerEntry;
  tahajjud?: boolean;
  duha?: boolean;
  witr?: boolean;
  notes?: string;
  updatedAt: string;
}

export type DeedCategory = 'obligatory' | 'sunnah' | 'optional' | 'character';

export interface DeedItem {
  id: string;
  category: DeedCategory;
  titleBn: string;
  titleEn: string;
  descriptionBn?: string;
  reference?: string;
  isObligatory?: boolean;
  isCustom?: boolean;
}

export interface DailyDeedsLog {
  date: string; // YYYY-MM-DD
  completedDeedIds: string[];
  updatedAt: string;
}

export interface DuaItem {
  id: string;
  titleBn: string;
  titleEn: string;
  arabic: string;
  banglish: string;
  bengaliMeaning: string;
  whenToReadBn: string;
  repetitions?: number | string;
  reference: string;
  authenticity?: string;
  category: string;
  isFavorite?: boolean;
  scholarlyNote?: string;
}

export interface QuranLog {
  id: string;
  date: string; // YYYY-MM-DD
  surahNumber: number;
  surahNameBn: string;
  surahNameAr: string;
  ayahStart?: number;
  ayahEnd?: number;
  pageStart?: number;
  pageEnd?: number;
  pagesCount: number;
  durationMinutes: number;
  reflection?: string;
  createdAt: string;
}

export interface CharacterReflection {
  id: string;
  date: string; // YYYY-MM-DD
  avoidedGheebahIntention: boolean;
  reflectionText?: string;
  soughtForgiveness?: boolean;
  angerControlled?: boolean;
  truthfulnessObserved?: boolean;
  kindnessShown?: boolean;
  updatedAt: string;
}

export interface RamadanLog {
  date: string; // YYYY-MM-DD
  dayNumber: number;
  fasted: boolean;
  sehriRecorded?: boolean;
  iftarRecorded?: boolean;
  taraweehRakats?: number; // 0, 8, 20
  charityGiven?: boolean;
  quranReadMinutes?: number;
  specialReflection?: string;
  isOddNight?: boolean;
  laylatulQadrDuaDone?: boolean;
  updatedAt: string;
}

export interface PersonalHabit {
  id: string;
  titleBn: string;
  category: 'study' | 'knowledge' | 'reading' | 'fitness' | 'time' | 'family' | 'character';
  targetFrequency: string;
  completedDates: string[];
  createdAt: string;
}

export interface UserSettings {
  displayName: string;
  language: 'bn' | 'banglish' | 'en';
  timezone: string; // e.g. 'Asia/Dhaka'
  ramadanTargetDate: string; // '2027-02-09'
  quranDailyGoalPages: number;
  notificationsEnabled: boolean;
  reminderTimes: {
    fajr: boolean;
    dhuhr: boolean;
    asr: boolean;
    maghrib: boolean;
    isha: boolean;
    adhkarMorning: boolean;
    adhkarEvening: boolean;
    quran: boolean;
  };
  isDarkMode: boolean;
  useCustomFirebase?: boolean;
  customFirebaseConfig?: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId: string;
  };
}

export interface DailySummaryStats {
  date: string;
  obligatoryCount: number; // 5
  recordedCount: number; // prayers with status !== 'unrecorded'
  completedCount: number; // on_time + late_qada
  onTimeCount: number;
  lateQadaCount: number;
  missedCount: number;
  unrecordedCount: number;
  completionRate: number; // completedCount / 5
  dataCoverageRate: number; // recordedCount / 5
}
