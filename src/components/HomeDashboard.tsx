import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  BookOpen,
  ArrowRight,
  Sun,
  Moon,
  Heart,
  Flame,
  ChevronRight,
  Bookmark,
  Share2,
} from 'lucide-react';
import { DailyPrayerLog, DailyDeedsLog, QuranLog, CharacterReflection, UserSettings } from '../types';
import { AppUser } from '../services/authService';
import {
  getApproximateHijriDate,
  calculateRamadanCountdown,
  toBengaliNumber,
  getDhakaDateString,
  RamadanCountdown,
} from '../utils/hijriCalendar';
import { calculateDailyPrayerStats, PRAYER_NAMES, PRAYER_NAMES_BN } from '../utils/salahCalculations';
import { NavTabId } from './Navigation';
import { HadithRecord } from '../types/hadith';
import { HadithOfTheDay } from './HadithOfTheDay';
import { AyyamAlBidDates } from '../types/ayyam';
import { getCurrentAyyamAlBidSchedule } from '../services/ayyamService';

interface HomeDashboardProps {
  user: AppUser | null;
  settings: UserSettings;
  todayDate: string;
  prayerLog: DailyPrayerLog;
  deedsLog: DailyDeedsLog;
  quranLogs: QuranLog[];
  characterReflection: CharacterReflection;
  dailyHadith?: HadithRecord;
  totalVerifiedHadiths?: number;
  onOpenHadithAdmin?: () => void;
  onUpdatePrayer: (updated: DailyPrayerLog) => void;
  onToggleDeed: (deedId: string) => void;
  onNavigateTab: (tab: NavTabId) => void;
  onOpenQuickAddQuran: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  user,
  settings,
  todayDate,
  prayerLog,
  deedsLog,
  quranLogs,
  characterReflection,
  dailyHadith,
  totalVerifiedHadiths = 0,
  onOpenHadithAdmin,
  onUpdatePrayer,
  onToggleDeed,
  onNavigateTab,
  onOpenQuickAddQuran,
}) => {
  const hijri = getApproximateHijriDate(new Date());
  const [countdown, setCountdown] = useState<RamadanCountdown>(
    calculateRamadanCountdown(settings.ramadanTargetDate)
  );
  const [ayyamSchedule, setAyyamSchedule] = useState<AyyamAlBidDates | null>(null);

  useEffect(() => {
    getCurrentAyyamAlBidSchedule().then((sched) => {
      setAyyamSchedule(sched);
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(calculateRamadanCountdown(settings.ramadanTargetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [settings.ramadanTargetDate]);

  const prayerStats = calculateDailyPrayerStats(prayerLog, todayDate);
  const totalDeedsDone = deedsLog.completedDeedIds.length;

  // Today's Quran total pages
  const todayQuranLogs = quranLogs.filter((q) => q.date === todayDate);
  const todayPages = todayQuranLogs.reduce((acc, curr) => acc + (curr.pagesCount || 0), 0);
  const todayQuranMinutes = todayQuranLogs.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);

  // Adhkar status
  const morningDone = deedsLog.completedDeedIds.includes('morning_adhkar');
  const eveningDone = deedsLog.completedDeedIds.includes('evening_adhkar');

  // Daily Quranic Reminders collection (authentic verses)
  const DAILY_VERSES = [
    {
      arabic: 'فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ',
      translit: 'Fadhkuruni adhkurkum washkuru li wa la takfurun.',
      bengali: 'অতএব তোমরা আমাকে স্মরণ করো, আমিও তোমাদের স্মরণ করব। আর আমার প্রতি কৃতজ্ঞ হও এবং অকৃতজ্ঞ হয়ো না।',
      reference: 'সূরা আল-বাকারাহ ২:১৫২',
    },
    {
      arabic: 'إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا',
      translit: 'Innas-salata kanat \'alal-mu\'minina kitaban mawquta.',
      bengali: 'নিশ্চয়ই নির্ধারিত সময়ে সালাত কায়েম করা মুমিনদের জন্য একটি আবশ্যক ফরজ বিধান।',
      reference: 'সূরা আন-নিসা ৪:১০৩',
    },
    {
      arabic: 'وَمَنْ يَتَّقِ اللَّهَ يَجْعَلْ لَهُ مَخْرَجًا وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ',
      translit: 'Wa may-yattaqillaha yaj\'al lahu makhraja, wa yarzuqhu min haythu la yahtasib.',
      bengali: 'আর যে ব্যক্তি আল্লাহকে ভয় করে, আল্লাহ তার জন্য মুক্তির পথ তৈরি করে দেন এবং এমন উৎস থেকে রিজিক দেন যা সে কল্পনাও করতে পারে না।',
      reference: 'সূরা আত-ত্বালাক ৬৫:২-৩',
    },
  ];

  // Pick deterministic verse based on day of month
  const verseIndex = new Date().getDate() % DAILY_VERSES.length;
  const currentVerse = DAILY_VERSES[verseIndex];

  // Quick toggle prayer status on Home
  const handleQuickPrayerToggle = (prayerKey: typeof PRAYER_NAMES[number]) => {
    const currentStatus = prayerLog[prayerKey]?.status || 'unrecorded';
    const nextStatus = currentStatus === 'unrecorded' ? 'on_time' : currentStatus === 'on_time' ? 'late_qada' : currentStatus === 'late_qada' ? 'missed' : 'unrecorded';
    onUpdatePrayer({
      ...prayerLog,
      [prayerKey]: {
        ...prayerLog[prayerKey],
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Hero Card: Personalized Greeting & Date */}
      <div className="clay-card-emerald p-6 sm:p-8 rounded-3xl text-white relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-medium mb-3 border border-amber-300/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>ইখলাস ও আত্মশুদ্ধির পথচলা</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
              আসসালামু আলাইকুম, {settings.displayName || user?.displayName || 'মুসাফির'}!
            </h2>
            <p className="text-emerald-100/90 text-sm max-w-xl leading-relaxed">
              আজকের দিনটি আল্লাহর সন্তুষ্টি অর্জনের এক নতুন সুযোগ। প্রতিটি ফরজ সালাত সময়মতো আদায় ও উত্তম চরিত্র গঠনের মাধ্যমে আখিরাতের পাথেয় সঞ্চয় করুন।
            </p>
          </div>

          {/* Quick Date Snapshot */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 flex flex-col items-center md:items-end justify-center min-w-[200px]">
            <span className="text-xs text-amber-300 font-semibold tracking-wide uppercase">
              আজকের তারিখ (হিজরি ও ইংরেজি)
            </span>
            <div className="text-lg font-bold text-white mt-1">
              {toBengaliNumber(hijri.day)} {hijri.monthNameBn} {toBengaliNumber(hijri.year)}
            </div>
            <div className="text-xs text-emerald-200 mt-0.5">
              {new Date().toLocaleDateString('bn-BD', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </div>
            <span className="text-[10px] text-emerald-300/80 mt-1">
              *হিজরি তারিখ স্থানীয় চাঁদ দেখার ওপর নির্ভরশীল
            </span>
          </div>
        </div>
      </div>

      {/* 2. Dynamic Ramadan 1448 Countdown Banner */}
      <div className="clay-card p-5 bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-emerald-800/10 border-amber-300/40">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-[#0F4C3A] text-amber-300 flex items-center justify-center shrink-0 shadow-md">
              <Moon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h3 className="font-bold text-stone-900 text-base">
                  পবিত্র মাহে রমাদান ১৪৪৮ হিজরি প্রস্তুতি
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold">
                  ২০২৭
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-0.5">
                সম্ভাব্য শুরু: {toBengaliNumber('09')} ফেব্রুয়ারি ২০২৭ (এশিয়া/ঢাকা)
              </p>
            </div>
          </div>

          {/* Countdown Blocks */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center justify-center bg-white px-3 py-1.5 rounded-xl border border-amber-200 shadow-2xs min-w-[54px]">
              <span className="text-lg font-bold text-[#0F4C3A]">
                {toBengaliNumber(countdown.totalDays)}
              </span>
              <span className="text-[10px] text-stone-500 font-medium">দিন</span>
            </div>
            <span className="font-bold text-amber-600">:</span>
            <div className="flex flex-col items-center justify-center bg-white px-3 py-1.5 rounded-xl border border-amber-200 shadow-2xs min-w-[54px]">
              <span className="text-lg font-bold text-[#0F4C3A]">
                {toBengaliNumber(countdown.totalHours)}
              </span>
              <span className="text-[10px] text-stone-500 font-medium">ঘণ্টা</span>
            </div>
            <span className="font-bold text-amber-600">:</span>
            <div className="flex flex-col items-center justify-center bg-white px-3 py-1.5 rounded-xl border border-amber-200 shadow-2xs min-w-[54px]">
              <span className="text-lg font-bold text-[#0F4C3A]">
                {toBengaliNumber(countdown.totalMinutes)}
              </span>
              <span className="text-[10px] text-stone-500 font-medium">মিনিট</span>
            </div>
            <button
              onClick={() => onNavigateTab('ramadan')}
              className="ml-2 p-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition shadow-xs cursor-pointer"
              title="রমাদান প্রস্তুতি কেন্দ্র দেখুন"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2.1 Ayyam al-Bid Upcoming Fasting Card */}
      {ayyamSchedule && (
        <div className="clay-card p-5 bg-gradient-to-r from-emerald-900/5 via-emerald-800/10 to-amber-500/10 border-emerald-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#0F4C3A] text-amber-300 flex items-center justify-center shrink-0 shadow-md">
                <Moon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-stone-900 text-base">
                    আসন্ন আইয়ামে বীজ সিয়াম (১৩, ১৪, ১৫ {ayyamSchedule.hijriMonthNameBn})
                  </h3>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                    মাসিক নফল সিয়াম
                  </span>
                </div>
                <p className="text-xs text-stone-600 mt-0.5">
                  তারিখ: {ayyamSchedule.day13.gregorianDate} থেকে {ayyamSchedule.day15.gregorianDate} (বাংলাদেশ সময়)
                  {ayyamSchedule.hasTashriqProhibition && (
                    <span className="ml-1.5 text-rose-600 font-bold">
                      [আইয়ামে তাশরিক: ১৩ জিলহজ সিয়াম নিষিদ্ধ]
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs text-stone-500">বাকি সময়</div>
                <div className="text-sm font-bold text-emerald-900">
                  {(ayyamSchedule.daysUntilStart ?? 0) > 0
                    ? `${toBengaliNumber(ayyamSchedule.daysUntilStart ?? 0)} দিন বাকি`
                    : ayyamSchedule.daysUntilStart === 0
                    ? 'আজই শুরু!'
                    : 'চলমান'}
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('ayyam')}
                className="px-4 py-2 rounded-xl bg-[#0F4C3A] text-white hover:bg-emerald-900 text-xs font-semibold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>সিয়াম প্ল্যানার</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Core Pillars Grid: Salah, Deeds, Quran, Adhkar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pillar 1: Five Obligatory Prayers */}
        <div className="clay-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg">
                আজকের ৫ ওয়াক্ত সালাত
              </span>
              <button
                onClick={() => onNavigateTab('salah')}
                className="text-stone-400 hover:text-emerald-800 transition text-xs font-medium flex items-center gap-0.5"
              >
                বিস্তারিত <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-2xl font-bold text-stone-800 mb-1">
              {toBengaliNumber(prayerStats.completedCount)} / {toBengaliNumber(5)}
            </div>
            <p className="text-xs text-stone-500 mb-4">
              {prayerStats.completedCount === 5
                ? 'আলহামদুলিল্লাহ! আজকের সব ফরজ সালাত সম্পন্ন।'
                : `${toBengaliNumber(5 - prayerStats.completedCount)}টি ওয়াক্ত এখনো বাকি রয়েছে`}
            </p>

            {/* Quick Interactive 5 Prayer badges */}
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {PRAYER_NAMES.map((pName) => {
                const status = prayerLog[pName]?.status || 'unrecorded';
                let bgClass = 'bg-stone-100 text-stone-500 border-stone-200';
                if (status === 'on_time') bgClass = 'bg-emerald-600 text-white border-emerald-700 shadow-xs';
                else if (status === 'late_qada') bgClass = 'bg-amber-500 text-white border-amber-600';
                else if (status === 'missed') bgClass = 'bg-rose-500 text-white border-rose-600';

                return (
                  <button
                    key={pName}
                    onClick={() => handleQuickPrayerToggle(pName)}
                    className={`py-1.5 px-1 rounded-xl text-[11px] font-semibold border flex flex-col items-center justify-center transition cursor-pointer ${bgClass}`}
                    title={`${PRAYER_NAMES_BN[pName].name}: ক্লিক করে স্ট্যাটাস পরিবর্তন করুন`}
                  >
                    <span>{PRAYER_NAMES_BN[pName].name}</span>
                    <span className="text-[9px] opacity-90 mt-0.5">
                      {status === 'on_time' ? 'ওয়াক্তে' : status === 'late_qada' ? 'দেরি' : status === 'missed' ? 'কাজা' : '—'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
            <span>ক্লিক করে স্ট্যাটাস আপডেট করুন</span>
            <span className="font-semibold text-emerald-800">{Math.round(prayerStats.completionRate * 100)}%</span>
          </div>
        </div>

        {/* Pillar 2: Daily Deeds */}
        <div className="clay-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg">
                দৈনন্দিন নেক আমল
              </span>
              <button
                onClick={() => onNavigateTab('deeds')}
                className="text-stone-400 hover:text-amber-800 transition text-xs font-medium flex items-center gap-0.5"
              >
                চেকলিস্ট <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-2xl font-bold text-stone-800 mb-1">
              {toBengaliNumber(totalDeedsDone)}টি আমল সম্পন্ন
            </div>
            <p className="text-xs text-stone-500 mb-3">
              সুন্নাহ, নফল, জিকির ও নৈতিক উন্নতির তালিকা
            </p>
            {/* Quick deed completion progress */}
            <div className="w-full bg-stone-100 rounded-full h-2.5 mb-3 overflow-hidden">
              <div
                className="bg-amber-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((totalDeedsDone / 20) * 100))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-stone-600">
              <span>ফরজ ও সুন্নাহ আমলসমূহ</span>
              <span className="font-semibold text-amber-700">{toBengaliNumber(totalDeedsDone)} / ২০</span>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('deeds')}
            className="mt-4 w-full py-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold hover:bg-amber-100 transition flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>আমল ট্র্যাকার খুলুন</span>
          </button>
        </div>

        {/* Pillar 3: Quran Reading */}
        <div className="clay-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg">
                কুরআন তিলাওয়াত
              </span>
              <button
                onClick={() => onNavigateTab('quran')}
                className="text-stone-400 hover:text-teal-800 transition text-xs font-medium flex items-center gap-0.5"
              >
                লগবুক <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-2xl font-bold text-stone-800 mb-1">
              {toBengaliNumber(todayPages)} পৃষ্ঠা
            </div>
            <p className="text-xs text-stone-500 mb-2">
              আজকের সময়: {toBengaliNumber(todayQuranMinutes)} মিনিট
            </p>
            <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-100 text-xs text-teal-900">
              দৈনিক লক্ষ্য: {toBengaliNumber(settings.quranDailyGoalPages)} পৃষ্ঠা
              {todayPages >= settings.quranDailyGoalPages && (
                <span className="ml-1.5 font-bold text-teal-700">✓ সম্পন্ন!</span>
              )}
            </div>
          </div>
          <button
            onClick={onOpenQuickAddQuran}
            className="mt-4 w-full py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition flex items-center justify-center gap-1.5 shadow-xs"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>+ তিলাওয়াত যোগ করুন</span>
          </button>
        </div>

        {/* Pillar 4: Morning & Evening Adhkar */}
        <div className="clay-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg">
                সকাল ও সন্ধ্যার জিকির
              </span>
              <button
                onClick={() => onNavigateTab('dua')}
                className="text-stone-400 hover:text-indigo-800 transition text-xs font-medium flex items-center gap-0.5"
              >
                দুআ সম্ভার <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-2 mt-2">
              <button
                onClick={() => onToggleDeed('morning_adhkar')}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs transition cursor-pointer ${
                  morningDone
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sun className={`w-4 h-4 ${morningDone ? 'text-amber-500' : 'text-stone-400'}`} />
                  <span>সকালের মাসনূন জিকির</span>
                </div>
                <span>{morningDone ? '✓ সম্পন্ন' : 'বাকি'}</span>
              </button>

              <button
                onClick={() => onToggleDeed('evening_adhkar')}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs transition cursor-pointer ${
                  eveningDone
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Moon className={`w-4 h-4 ${eveningDone ? 'text-indigo-500' : 'text-stone-400'}`} />
                  <span>সন্ধ্যার মাসনূন জিকির</span>
                </div>
                <span>{eveningDone ? '✓ সম্পন্ন' : 'বাকি'}</span>
              </button>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('dua')}
            className="mt-3 w-full py-2 rounded-xl bg-indigo-50 text-indigo-900 border border-indigo-200 text-xs font-semibold hover:bg-indigo-100 transition flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>মাসনূন দুআসমূহ পড়ুন</span>
          </button>
        </div>
      </div>

      {/* 4. Beautiful Daily Quranic Reminder with Verified Reference */}
      <div className="clay-card p-6 bg-gradient-to-r from-[#FAF8F5] via-amber-50/40 to-[#F4EFEA] border-amber-200/80">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
              <Bookmark className="w-4 h-4" />
            </span>
            <h4 className="font-bold text-stone-900 text-sm font-bengali">
              আজকের নির্বাচিত কুরআনীয় উপদেশ
            </h4>
          </div>
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-100/60 px-2.5 py-0.5 rounded-full border border-emerald-200">
            {currentVerse.reference}
          </span>
        </div>

        {/* Quran Arabic Text with Correct RTL & Font */}
        <p className="font-arabic text-xl sm:text-2xl text-[#0F4C3A] font-semibold my-4 leading-loose text-right select-text">
          {currentVerse.arabic}
        </p>

        {/* Banglish & Bengali Translation */}
        <p className="text-xs italic text-stone-500 mb-2">
          {currentVerse.translit}
        </p>
        <p className="text-sm font-medium text-stone-800 font-bengali leading-relaxed border-t border-amber-200/50 pt-2.5">
          {currentVerse.bengali}
        </p>
      </div>

      {/* 5. Verified Daily Rotating Sahih Hadith Card */}
      {dailyHadith && (
        <HadithOfTheDay
          hadith={dailyHadith}
          totalVerifiedCount={totalVerifiedHadiths}
          onOpenLibraryAdmin={onOpenHadithAdmin || (() => onNavigateTab('hadith'))}
        />
      )}

      {/* 6. Character & Repentance Card (Gentle, uplifting, Gheebah intention) */}
      <div className="clay-card p-6 bg-white border-stone-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-stone-900 text-sm mb-1">
              আজকের গীবত ও পরনিন্দা পরিহারের দৃঢ় সংকল্প
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed max-w-2xl">
              "হে মুমিনগণ! তোমরা অধিকাংশ অনুমান থেকে দূরে থাক; নিশ্চয় কতক অনুমান পাপ। আর তোমরা কারো দোষ অনুসন্ধান করো না এবং কেউ কারো গীবত করো না।" (সূরা আল-হুজুরাত ৪৯:১২)
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('character')}
          className="shrink-0 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition"
        >
          আত্মশুদ্ধি নোটবুক খুলুন
        </button>
      </div>
    </div>
  );
};
