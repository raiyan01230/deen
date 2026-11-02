import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  ShieldCheck,
  Info,
  Calendar,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { DailyPrayerLog, DailyDeedsLog, QuranLog } from '../types';
import {
  calculateDailyPrayerStats,
  calculateAggregatePrayerStats,
  PRAYER_NAMES,
  PRAYER_NAMES_BN,
} from '../utils/salahCalculations';
import { toBengaliNumber } from '../utils/hijriCalendar';

interface AnalyticsReportsProps {
  currentDate: string;
  prayerLogsCache: Record<string, DailyPrayerLog>;
  deedsLogsCache: Record<string, DailyDeedsLog>;
  quranLogs: QuranLog[];
}

export const AnalyticsReports: React.FC<AnalyticsReportsProps> = ({
  currentDate,
  prayerLogsCache,
  deedsLogsCache,
  quranLogs,
}) => {
  // Collect last 14 days of real logs
  const past14Days = useMemo(() => {
    const list: string[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - i);
      list.push(d.toISOString().split('T')[0]);
    }
    return list;
  }, [currentDate]);

  // Aggregate stats across past 14 days
  const logsList = past14Days.map((dStr) => prayerLogsCache[dStr] || {
    date: dStr,
    fajr: { status: 'unrecorded' },
    dhuhr: { status: 'unrecorded' },
    asr: { status: 'unrecorded' },
    maghrib: { status: 'unrecorded' },
    isha: { status: 'unrecorded' },
    updatedAt: '',
  });

  const aggregate = calculateAggregatePrayerStats(logsList);

  // 1. Weekly & Daily Salah Data (Real denominator = 5)
  const dailySalahChartData = past14Days.map((dStr) => {
    const pLog = prayerLogsCache[dStr];
    const stats = calculateDailyPrayerStats(pLog, dStr);
    const dayName = new Date(dStr).toLocaleDateString('bn-BD', { weekday: 'narrow', day: 'numeric' });

    return {
      date: dStr,
      label: dayName,
      onTime: stats.onTimeCount,
      lateQada: stats.lateQadaCount,
      missed: stats.missedCount,
      unrecorded: stats.unrecordedCount,
      completionRatePercent: Math.round(stats.completionRate * 100),
      coverageRatePercent: Math.round(stats.dataCoverageRate * 100),
    };
  });

  // 2. Individual Prayer Comparison across recorded logs (Fajr, Dhuhr, Asr, Maghrib, Isha)
  const individualPrayerData = PRAYER_NAMES.map((pName) => {
    let onTimeCount = 0;
    let lateCount = 0;
    let missedCount = 0;
    let unrecordedCount = 0;

    past14Days.forEach((dStr) => {
      const log = prayerLogsCache[dStr];
      const status = log?.[pName]?.status || 'unrecorded';
      if (status === 'on_time') onTimeCount++;
      else if (status === 'late_qada') lateCount++;
      else if (status === 'missed') missedCount++;
      else unrecordedCount++;
    });

    return {
      name: PRAYER_NAMES_BN[pName].name,
      'ওয়াক্তমতো': onTimeCount,
      'দেরিতে/কাজা': lateCount,
      'আদায় হয়নি': missedCount,
      'রেকর্ড নেই': unrecordedCount,
    };
  });

  // 3. Status Breakdown Pie Data
  const statusPieData = [
    { name: 'ওয়াক্তমতো আদায়', value: aggregate.totalOnTime, color: '#0F4C3A' },
    { name: 'দেরিতে / কাজা', value: aggregate.totalLateQada, color: '#D97706' },
    { name: 'আদায় হয়নি (ছুটে গেছে)', value: aggregate.totalMissed, color: '#E11D48' },
    { name: 'রেকর্ড এন্ট্রি নেই', value: aggregate.totalUnrecorded, color: '#D6D3D1' },
  ].filter((item) => item.value > 0);

  // 4. Daily Deeds completion trend
  const deedsTrendData = past14Days.map((dStr) => {
    const dLog = deedsLogsCache[dStr];
    const count = dLog?.completedDeedIds?.length || 0;
    const dayLabel = new Date(dStr).toLocaleDateString('bn-BD', { weekday: 'narrow', day: 'numeric' });
    return {
      date: dStr,
      label: dayLabel,
      completedDeeds: count,
    };
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="clay-card-emerald p-6 rounded-3xl text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold mb-2">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>বাস্তব ডাটা ভিত্তিক রিপোর্ট ও বিশ্লেষণ</span>
            </div>
            <h2 className="text-2xl font-bold font-bengali">
              সালাত ধারাবাহিকতা ও আমল অগ্রগতি
            </h2>
            <p className="text-xs text-emerald-100/90 mt-1 max-w-xl">
              গত ১৪ দিনের প্রকৃত সংরক্ষিত তথ্যের ভিত্তিতে হিসাবকৃত নির্ভুল পরিসংখ্যান। কোনো অনুমান বা কল্পিত ডেটা অন্তর্ভুক্ত নয়।
            </p>
          </div>
        </div>

        {/* 3 Real Metric Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-4 border-t border-white/10">
          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[11px] text-emerald-200">সালাত আদায়ের মোট হার (হরফ = ৫)</span>
            <div className="text-2xl font-bold text-amber-300 mt-0.5">
              {Math.round(aggregate.averageCompletionRate * 100)}%
            </div>
            <span className="text-[10px] text-emerald-300">
              {toBengaliNumber(aggregate.totalCompleted)} / {toBengaliNumber(aggregate.totalPossiblePrayers)} ফরজ সালাত আদায়
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[11px] text-emerald-200">তথ্য কভারেজ রেট</span>
            <div className="text-2xl font-bold text-white mt-0.5">
              {Math.round(aggregate.averageCoverageRate * 100)}%
            </div>
            <span className="text-[10px] text-emerald-300">
              রেকর্ড করা ওয়াক্তসমূহ (খালি স্লট ব্যতিরেকে)
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[11px] text-emerald-200">রেকর্ডকৃতদের মধ্যে আদায়ের হার</span>
            <div className="text-2xl font-bold text-white mt-0.5">
              {Math.round(aggregate.completionRateAmongRecorded * 100)}%
            </div>
            <span className="text-[10px] text-emerald-300">
              রেকর্ডকৃত সালাতের মধ্যে ওয়াক্তমতো/দেরিতে
            </span>
          </div>
        </div>
      </div>

      {/* Fundamental Theological Disclaimer */}
      <div className="clay-card p-4 bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-900 leading-relaxed font-bengali">
          <strong>ধর্মীয় স্বচ্ছতা নির্দেশিকা:</strong> এই পরিসংখ্যানসমূহ আপনার ব্যক্তিগত আমল সংরক্ষণের রেকর্ড মাত্র। কোনো আমল আল্লাহর দরবারে কবুল হয়েছে কিনা কিংবা কোনো সালাতের আধ্যাত্মিক মর্যাদা কেমন—তার বিচারক একমাত্র মহান আল্লাহ।
        </p>
      </div>

      {/* Chart 1: Daily Obligatory Prayer Breakdown (Past 14 Days) */}
      <div className="clay-card p-5 bg-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-stone-900 font-bengali">
              দৈনিক ৫ ওয়াক্ত সালাত বণ্টন (গত ১৪ দিন)
            </h3>
            <p className="text-xs text-stone-500">
              প্রতিদিনের ৫টি ফরজ সালাতের মধ্যে ওয়াক্তমতো, দেরিতে/কাজা ও অনুপস্থিত রেকর্ডের চিত্র
            </p>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailySalahChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EBE1" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#78716C' }} />
              <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: '#78716C' }} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #E7E5E4', fontSize: '12px' }}
                formatter={(val: any, name: any) => [`${toBengaliNumber(val)}টি সালাত`, name]}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="onTime" name="ওয়াক্তমতো আদায়" fill="#0F4C3A" stackId="a" radius={[0, 0, 4, 4]} />
              <Bar dataKey="lateQada" name="দেরিতে / কাজা" fill="#D97706" stackId="a" />
              <Bar dataKey="missed" name="আদায় হয়নি" fill="#E11D48" stackId="a" />
              <Bar dataKey="unrecorded" name="রেকর্ড নেই" fill="#E7E5E4" stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2 & Chart 3: Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Individual Prayer Comparison */}
        <div className="clay-card p-5 bg-white">
          <h3 className="text-base font-bold text-stone-900 mb-1 font-bengali">
            ওয়াক্তভিত্তিক সালাত তুলনা
          </h3>
          <p className="text-xs text-stone-500 mb-4">
            ফজর, যোহর, আসর, মাগরিব ও ইশার আদায়ের তুলনামূলক রেকর্ড
          </p>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={individualPrayerData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EBE1" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#44403C' }} />
                <YAxis tick={{ fontSize: 11, fill: '#78716C' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="ওয়াক্তমতো" fill="#0F4C3A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="দেরিতে/কাজা" fill="#D97706" radius={[4, 4, 0, 0]} />
                <Bar dataKey="আদায় হয়নি" fill="#E11D48" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Overall Status Distribution Pie */}
        <div className="clay-card p-5 bg-white">
          <h3 className="text-base font-bold text-stone-900 mb-1 font-bengali">
            মোট সালাত স্ট্যাটাস বিভাজন
          </h3>
          <p className="text-xs text-stone-500 mb-4">
            গত ১৪ দিনের মোট ৭০টি সম্ভাব্য সালাত স্লটের সার্বিক চিত্র
          </p>

          <div className="h-60 w-full flex items-center justify-center">
            {statusPieData.length === 0 ? (
              <div className="text-xs text-stone-400">কোনো তথ্য নেই</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Chart 4: Daily Deeds Trend Line */}
      <div className="clay-card p-5 bg-white">
        <h3 className="text-base font-bold text-stone-900 mb-1 font-bengali">
          দৈনন্দিন নেক আমল সম্পন্নের প্রবণতা (গত ১৪ দিন)
        </h3>
        <p className="text-xs text-stone-500 mb-4">
          প্রতিদিন সম্পন্নকৃত মোট আমলের সংখ্যা
        </p>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={deedsTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EBE1" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#78716C' }} />
              <YAxis tick={{ fontSize: 11, fill: '#78716C' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
              <Line
                type="monotone"
                dataKey="completedDeeds"
                name="সম্পন্ন আমল"
                stroke="#D4AF37"
                strokeWidth={3}
                dot={{ r: 4, fill: '#0F4C3A' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
