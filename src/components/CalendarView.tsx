import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  BookOpen,
  Info,
} from 'lucide-react';
import { DailyPrayerLog, DailyDeedsLog, QuranLog } from '../types';
import { getApproximateHijriDate, toBengaliNumber } from '../utils/hijriCalendar';
import { calculateDailyPrayerStats } from '../utils/salahCalculations';

interface CalendarViewProps {
  currentDate: string;
  onSelectDate: (dateStr: string) => void;
  prayerLogsCache: Record<string, DailyPrayerLog>;
  deedsLogsCache: Record<string, DailyDeedsLog>;
  quranLogs: QuranLog[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentDate,
  onSelectDate,
  prayerLogsCache,
  deedsLogsCache,
  quranLogs,
}) => {
  const [viewYear, setViewYear] = useState<number>(new Date(currentDate).getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(new Date(currentDate).getMonth()); // 0-indexed

  const monthNamesBn = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Build grid days
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    days.push({
      dateStr: `${viewYear}-${mm}-${dd}`,
      dayNum: d,
      isCurrentMonth: true,
    });
  }

  // Selected date details
  const selectedPrayerLog = prayerLogsCache[currentDate];
  const selectedPrayerStats = calculateDailyPrayerStats(selectedPrayerLog, currentDate);
  const selectedDeedsLog = deedsLogsCache[currentDate];
  const selectedQuranLogs = quranLogs.filter((q) => q.date === currentDate);
  const selectedHijri = getApproximateHijriDate(new Date(currentDate));

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="clay-card-emerald p-6 rounded-3xl text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold mb-2">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>ইসলামিক ও গ্রেগরিয়ান যৌথ দিনপঞ্জিকা</span>
            </div>
            <h2 className="text-2xl font-bold font-bengali">
              মাসিক আমল ও সালাত ক্যালেন্ডার
            </h2>
            <p className="text-xs text-emerald-100/90 mt-1 max-w-xl">
              যেকোনো তারিখে ক্লিক করে সেই দিনের পাঁচ ওয়াক্ত সালাত, নেক আমল এবং কুরআন তিলাওয়াত রেকর্ড পর্যবেক্ষণ ও সম্পাদনা করুন।
            </p>
          </div>

          {/* Month Switcher Controls */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/15">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl hover:bg-white/10 text-white transition cursor-pointer"
              title="পূর্ববর্তী মাস"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 text-center min-w-[120px]">
              <span className="text-sm font-bold text-amber-300">
                {monthNamesBn[viewMonth]} {toBengaliNumber(viewYear)}
              </span>
            </div>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl hover:bg-white/10 text-white transition cursor-pointer"
              title="পরবর্তী মাস"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid & Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Grid */}
        <div className="lg:col-span-2 clay-card p-5 bg-white">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'].map((name, i) => (
              <div
                key={name}
                className={`text-xs font-bold py-1.5 rounded-lg ${
                  i === 5 ? 'text-emerald-700 bg-emerald-50' : 'text-stone-500'
                }`}
              >
                {name}
              </div>
            ))}
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {/* Empty offset placeholders */}
            {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
              <div key={`empty_${idx}`} className="h-16 sm:h-20 rounded-xl bg-stone-50/40" />
            ))}

            {/* Days */}
            {days.map((item) => {
              const isSelected = item.dateStr === currentDate;
              const isToday = item.dateStr === new Date().toISOString().split('T')[0];
              const pLog = prayerLogsCache[item.dateStr];
              const pStats = calculateDailyPrayerStats(pLog, item.dateStr);
              const dLog = deedsLogsCache[item.dateStr];
              const deedCount = dLog?.completedDeedIds?.length || 0;
              const qCount = quranLogs.filter((q) => q.date === item.dateStr).length;

              return (
                <button
                  key={item.dateStr}
                  onClick={() => onSelectDate(item.dateStr)}
                  className={`h-16 sm:h-20 p-1 sm:p-1.5 rounded-2xl flex flex-col justify-between text-left transition cursor-pointer border ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-600 shadow-sm'
                      : isToday
                      ? 'bg-amber-50/60 border-amber-300'
                      : 'bg-stone-50/70 border-stone-200/80 hover:bg-stone-100 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-bold leading-none ${
                        isToday ? 'text-amber-700' : isSelected ? 'text-emerald-900' : 'text-stone-800'
                      }`}
                    >
                      {toBengaliNumber(item.dayNum)}
                    </span>
                    {isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="আজ" />
                    )}
                  </div>

                  {/* Micro Badges for Prayer and Deeds */}
                  <div className="space-y-0.5 w-full">
                    {/* Prayer dots */}
                    <div className="flex items-center gap-0.5">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          pStats.completedCount === 5
                            ? 'bg-emerald-600'
                            : pStats.completedCount > 0
                            ? 'bg-amber-500'
                            : pStats.recordedCount > 0
                            ? 'bg-rose-500'
                            : 'bg-stone-300'
                        }`}
                        title={`${toBengaliNumber(pStats.completedCount)}/৫ সালাত আদায়`}
                      />
                      <span className="text-[9px] text-stone-500 font-medium">
                        {toBengaliNumber(pStats.completedCount)}/৫
                      </span>
                    </div>

                    {deedCount > 0 && (
                      <div className="text-[9px] text-stone-600 truncate font-bengali">
                        {toBengaliNumber(deedCount)} আমল
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-[11px] text-stone-500">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span>৫ ওয়াক্ত সালাত সম্পন্ন</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ml-2" />
              <span>আংশিক সম্পন্ন</span>
              <span className="w-2.5 h-2.5 rounded-full bg-stone-300 ml-2" />
              <span>রেকর্ডহীন</span>
            </div>
            <span className="italic">*তারিখে ক্লিক করে বিস্তারিত রেকর্ড দেখুন</span>
          </div>
        </div>

        {/* Selected Date Details Panel */}
        <div className="clay-card p-5 bg-white flex flex-col justify-between">
          <div>
            <div className="border-b border-stone-100 pb-3 mb-4">
              <span className="text-xs text-amber-700 font-semibold uppercase">
                নির্বাচিত তারিখের বিবরণ
              </span>
              <h3 className="text-lg font-bold text-stone-900 mt-1">
                {currentDate}
              </h3>
              <div className="text-xs text-emerald-800 font-medium mt-0.5">
                {toBengaliNumber(selectedHijri.day)} {selectedHijri.monthNameBn} {toBengaliNumber(selectedHijri.year)} হিজরি (*আনুমানিক)
              </div>
            </div>

            {/* Prayers Breakdown for Selected Date */}
            <div className="space-y-2 mb-4">
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                সালাত রেকর্ড ({toBengaliNumber(selectedPrayerStats.completedCount)}/৫)
              </h4>
              {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((pKey) => {
                const pEntry = selectedPrayerLog?.[pKey as keyof DailyPrayerLog] as any;
                const status = pEntry?.status || 'unrecorded';
                const pNames: Record<string, string> = {
                  fajr: 'ফজর', dhuhr: 'যোহর', asr: 'আসর', maghrib: 'মাগরিব', isha: 'ইশা'
                };

                return (
                  <div
                    key={pKey}
                    className="p-2 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-stone-800">{pNames[pKey]}</span>
                    <span
                      className={`font-medium ${
                        status === 'on_time'
                          ? 'text-emerald-700'
                          : status === 'late_qada'
                          ? 'text-amber-700'
                          : status === 'missed'
                          ? 'text-rose-700'
                          : 'text-stone-400'
                      }`}
                    >
                      {status === 'on_time'
                        ? 'ওয়াক্তমতো আদায়'
                        : status === 'late_qada'
                        ? 'দেরিতে / কাজা'
                        : status === 'missed'
                        ? 'আদায় হয়নি'
                        : 'রেকর্ড নেই'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Deeds Breakdown */}
            <div className="mb-4">
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                আমল সারসংক্ষেপ
              </h4>
              <p className="text-xs text-stone-600">
                মোট সম্পন্ন আমল: <strong>{toBengaliNumber(selectedDeedsLog?.completedDeedIds?.length || 0)}টি</strong>
              </p>
            </div>

            {/* Quran Breakdown */}
            <div>
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                কুরআন তিলাওয়াত
              </h4>
              {selectedQuranLogs.length === 0 ? (
                <p className="text-xs text-stone-400">এই তারিখে কোনো তিলাওয়াত রেকর্ড নেই।</p>
              ) : (
                <div className="space-y-1">
                  {selectedQuranLogs.map((q) => (
                    <div key={q.id} className="text-xs text-stone-700 bg-teal-50/60 p-2 rounded-lg border border-teal-100">
                      সূরা {q.surahNameBn} ({toBengaliNumber(q.pagesCount)} পৃষ্ঠা • {toBengaliNumber(q.durationMinutes)} মিনিট)
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
