import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Sparkles,
  Info,
  RefreshCw,
} from 'lucide-react';
import { DailyPrayerLog, PrayerName, PrayerStatus } from '../types';
import { calculateDailyPrayerStats, PRAYER_NAMES, PRAYER_NAMES_BN } from '../utils/salahCalculations';
import { toBengaliNumber } from '../utils/hijriCalendar';
import { subscribeToSyncState, SyncStateInfo } from '../services/dataService';

interface SalahTrackerProps {
  currentDate: string;
  prayerLog: DailyPrayerLog;
  onDateChange: (newDate: string) => void;
  onSavePrayerLog: (updated: DailyPrayerLog) => void;
}

export const SalahTracker: React.FC<SalahTrackerProps> = ({
  currentDate,
  prayerLog,
  onDateChange,
  onSavePrayerLog,
}) => {
  const [syncInfo, setSyncInfo] = useState<SyncStateInfo>({ status: 'idle', message: 'প্রস্তুত' });
  useEffect(() => {
    const unsub = subscribeToSyncState((info) => setSyncInfo(info));
    return () => unsub();
  }, []);

  const stats = calculateDailyPrayerStats(prayerLog, currentDate);

  const handlePrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    const d = new Date();
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleStatusChange = (prayer: PrayerName, status: PrayerStatus) => {
    const updated: DailyPrayerLog = {
      ...prayerLog,
      [prayer]: {
        ...prayerLog[prayer],
        status,
        updatedAt: new Date().toISOString(),
      },
    };
    onSavePrayerLog(updated);
  };

  const handleToggleJamat = (prayer: PrayerName) => {
    const current = prayerLog[prayer]?.jamat || false;
    const updated: DailyPrayerLog = {
      ...prayerLog,
      [prayer]: {
        ...prayerLog[prayer],
        jamat: !current,
        updatedAt: new Date().toISOString(),
      },
    };
    onSavePrayerLog(updated);
  };

  const handleToggleSunnah = (prayer: PrayerName) => {
    const current = prayerLog[prayer]?.sunnah || false;
    const updated: DailyPrayerLog = {
      ...prayerLog,
      [prayer]: {
        ...prayerLog[prayer],
        sunnah: !current,
        updatedAt: new Date().toISOString(),
      },
    };
    onSavePrayerLog(updated);
  };

  const handleToggleExtra = (field: 'tahajjud' | 'duha' | 'witr') => {
    const current = prayerLog[field] || false;
    onSavePrayerLog({
      ...prayerLog,
      [field]: !current,
      updatedAt: new Date().toISOString(),
    });
  };

  const STATUS_OPTIONS: { id: PrayerStatus; labelBn: string; colorClass: string; activeClass: string }[] = [
    {
      id: 'on_time',
      labelBn: 'ওয়াক্তমতো আদায়',
      colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
      activeClass: 'bg-emerald-600 text-white border-emerald-700 shadow-sm font-semibold',
    },
    {
      id: 'late_qada',
      labelBn: 'দেরিতে / কাজা',
      colorClass: 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100',
      activeClass: 'bg-amber-500 text-white border-amber-600 shadow-sm font-semibold',
    },
    {
      id: 'missed',
      labelBn: 'আদায় হয়নি',
      colorClass: 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100',
      activeClass: 'bg-rose-600 text-white border-rose-700 shadow-sm font-semibold',
    },
    {
      id: 'unrecorded',
      labelBn: 'রেকর্ড নেই',
      colorClass: 'text-stone-500 bg-stone-100 border-stone-200 hover:bg-stone-200',
      activeClass: 'bg-stone-600 text-white border-stone-700 shadow-sm font-semibold',
    },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Date Navigator Bar */}
      <div className="clay-card p-4 flex flex-wrap items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDay}
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition cursor-pointer"
            title="আগের দিন"
            aria-label="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200">
            <Calendar className="w-4 h-4 text-emerald-800" />
            <input
              type="date"
              value={currentDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="text-sm font-semibold text-stone-800 bg-transparent focus:outline-none cursor-pointer"
              aria-label="Select Date"
            />
          </div>
          <button
            onClick={handleNextDay}
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition cursor-pointer"
            title="পরের দিন"
            aria-label="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={handleToday}
          className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition cursor-pointer"
        >
          আজকে যান
        </button>
      </div>

      {/* Daily Summary Card - Strict calculation with denominator = 5 */}
      <div className="clay-card-emerald p-6 rounded-3xl text-white relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="z-10">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-amber-300 font-semibold tracking-wide uppercase">
                দৈনিক সালাত সারসংক্ষেপ
              </span>
              {syncInfo.status === 'saving' && (
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold border border-amber-300/30 animate-pulse">
                  সংরক্ষণ হচ্ছে...
                </span>
              )}
              {syncInfo.status === 'saved' && (
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-emerald-100 text-[10px] font-bold border border-white/20">
                  ✓ সংরক্ষিত
                </span>
              )}
              {syncInfo.status === 'error' && (
                <button
                  onClick={() => syncInfo.retryFn?.()}
                  className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold hover:bg-rose-600 transition flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>পুনরায় চেষ্টা</span>
                </button>
              )}
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mt-1">
              ৫টি ফরজ সালাতের মধ্যে {toBengaliNumber(stats.completedCount)}টি আদায় রেকর্ড করা হয়েছে
            </h3>
            <p className="text-xs text-emerald-100/80 mt-1">
              (ওয়াক্তমতো {toBengaliNumber(stats.onTimeCount)}টি • দেরিতে/কাজা {toBengaliNumber(stats.lateQadaCount)}টি)
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-300">
                {Math.round(stats.completionRate * 100)}%
              </div>
              <div className="text-[10px] text-emerald-200 font-medium">আদায়ের হার (৫টির মধ্যে)</div>
            </div>
            <div className="w-[1px] h-8 bg-white/20" />
            <div className="text-center">
              <div className="text-xl font-bold text-white">
                {toBengaliNumber(stats.recordedCount)} / {toBengaliNumber(5)}
              </div>
              <div className="text-[10px] text-emerald-200 font-medium">রেকর্ড এন্ট্রি কভারেজ</div>
            </div>
          </div>
        </div>

        {/* Clear Data Distinction Note */}
        <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-100">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>
              অনুপস্থিত তথ্য (রেকর্ডহীন: {toBengaliNumber(stats.unrecordedCount)}টি) এবং কাজা হওয়া সালাত ({toBengaliNumber(stats.missedCount)}টি) সম্পূর্ণ পৃথকভাবে গণ্য করা হয়েছে।
            </span>
          </div>
          <span className="text-[11px] text-amber-200/90 italic">
            আদায়ের হার = (ওয়াক্তমতো + কাজা) ÷ ৫
          </span>
        </div>
      </div>

      {/* Five Individual Prayer Cards */}
      <div className="space-y-3.5">
        {PRAYER_NAMES.map((prayer) => {
          const entry = prayerLog[prayer] || { status: 'unrecorded' };
          const meta = PRAYER_NAMES_BN[prayer];

          return (
            <div
              key={prayer}
              className="clay-card p-5 bg-white border-stone-200 hover:border-emerald-200 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Prayer Name & Description */}
                <div className="min-w-[180px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <h4 className="text-base font-bold text-stone-900 font-bengali">
                      {meta.name}
                    </h4>
                    <span className="text-xs text-stone-400 font-medium">
                      ({meta.translit})
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {meta.meaning}
                  </p>
                </div>

                {/* 4 Discrete Status Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1 max-w-xl">
                  {STATUS_OPTIONS.map((opt) => {
                    const isSelected = entry.status === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleStatusChange(prayer, opt.id)}
                        className={`px-3 py-2 rounded-xl text-xs border transition cursor-pointer flex items-center justify-center text-center ${
                          isSelected ? opt.activeClass : opt.colorClass
                        }`}
                      >
                        {opt.labelBn}
                      </button>
                    );
                  })}
                </div>

                {/* Additional Sunnah / Jamat toggles */}
                <div className="flex items-center gap-2 border-t lg:border-t-0 pt-3 lg:pt-0 border-stone-100">
                  <button
                    onClick={() => handleToggleJamat(prayer)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition ${
                      entry.jamat
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                    title="জামাতে আদায়"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>জামাত</span>
                  </button>

                  <button
                    onClick={() => handleToggleSunnah(prayer)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition ${
                      entry.sunnah
                        ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                    title="সুন্নাহ সালাত সম্পন্ন"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>সুন্নাত</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sunnah & Voluntary Prayers Card */}
      <div className="clay-card p-5 bg-stone-50 border-stone-200">
        <h4 className="text-sm font-bold text-stone-800 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>নফল ও অতিরিক্ত সুন্নাহ সালাত (ঐচ্ছিক)</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleToggleExtra('tahajjud')}
            className={`p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
              prayerLog.tahajjud
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <div>
              <div className="text-xs font-bold">তাহাজ্জুদ / কিয়ামুল লাইল</div>
              <div className="text-[11px] text-stone-500">রাতের নিভৃত নফল সালাত</div>
            </div>
            <span className="text-xs">{prayerLog.tahajjud ? '✓ আদায়' : '—'}</span>
          </button>

          <button
            onClick={() => handleToggleExtra('duha')}
            className={`p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
              prayerLog.duha
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <div>
              <div className="text-xs font-bold">সালাতুদ দুহা (চাশত)</div>
              <div className="text-[11px] text-stone-500">পূর্বাহ্নের নফল সালাত</div>
            </div>
            <span className="text-xs">{prayerLog.duha ? '✓ আদায়' : '—'}</span>
          </button>

          <button
            onClick={() => handleToggleExtra('witr')}
            className={`p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
              prayerLog.witr
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <div>
              <div className="text-xs font-bold">বিতরের সালাত</div>
              <div className="text-[11px] text-stone-500">রাত্রির বেজোড় গুরুত্বপূর্ণ সালাত</div>
            </div>
            <span className="text-xs">{prayerLog.witr ? '✓ আদায়' : '—'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
