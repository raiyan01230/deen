import { DailyPrayerLog, DailySummaryStats, PrayerName, PrayerStatus } from '../types';

export const PRAYER_NAMES: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export const PRAYER_NAMES_BN: Record<PrayerName, { name: string; translit: string; meaning: string }> = {
  fajr: { name: 'ফজর', translit: 'Fajr', meaning: 'ভোরের ফরজ সালাত (২ রাকাত)' },
  dhuhr: { name: 'যোহর', translit: 'Dhuhr', meaning: 'দুপুরের ফরজ সালাত (৪ রাকাত)' },
  asr: { name: 'আসর', translit: 'Asr', meaning: 'বিকালে সূর্য ঢলে পড়ার ফরজ সালাত (৪ রাকাত)' },
  maghrib: { name: 'মাগরিব', translit: 'Maghrib', meaning: 'সূর্যাস্তের পর ফরজ সালাত (৩ রাকাত)' },
  isha: { name: 'ইশা', translit: 'Isha', meaning: 'রাত্রির ফরজ সালাত (৪ রাকাত)' },
};

/**
 * Calculates accurate statistics for a single day's prayer log.
 * Obligatory count is always 5.
 * Distinguishes unrecorded prayer slots from missed prayers.
 */
export function calculateDailyPrayerStats(log?: DailyPrayerLog, dateStr: string = ''): DailySummaryStats {
  if (!log) {
    return {
      date: dateStr,
      obligatoryCount: 5,
      recordedCount: 0,
      completedCount: 0,
      onTimeCount: 0,
      lateQadaCount: 0,
      missedCount: 0,
      unrecordedCount: 5,
      completionRate: 0,
      dataCoverageRate: 0,
    };
  }

  let onTime = 0;
  let lateQada = 0;
  let missed = 0;
  let unrecorded = 0;

  for (const name of PRAYER_NAMES) {
    const status: PrayerStatus = log[name]?.status || 'unrecorded';
    if (status === 'on_time') onTime++;
    else if (status === 'late_qada') lateQada++;
    else if (status === 'missed') missed++;
    else unrecorded++;
  }

  const completed = onTime + lateQada;
  const recorded = onTime + lateQada + missed;

  return {
    date: log.date || dateStr,
    obligatoryCount: 5,
    recordedCount: recorded,
    completedCount: completed,
    onTimeCount: onTime,
    lateQadaCount: lateQada,
    missedCount: missed,
    unrecordedCount: unrecorded,
    completionRate: completed / 5, // Denominator is strictly 5
    dataCoverageRate: recorded / 5, // How much of the day has been recorded
  };
}

/**
 * Calculates aggregate stats over a date range.
 * Distinguishes data coverage from completion rate.
 */
export function calculateAggregatePrayerStats(logs: DailyPrayerLog[]) {
  if (logs.length === 0) {
    return {
      totalDays: 0,
      totalPossiblePrayers: 0,
      totalCompleted: 0,
      totalOnTime: 0,
      totalLateQada: 0,
      totalMissed: 0,
      totalUnrecorded: 0,
      averageCompletionRate: 0,
      averageCoverageRate: 0,
      completionRateAmongRecorded: 0,
    };
  }

  let totalCompleted = 0;
  let totalOnTime = 0;
  let totalLateQada = 0;
  let totalMissed = 0;
  let totalUnrecorded = 0;

  for (const log of logs) {
    const daily = calculateDailyPrayerStats(log);
    totalCompleted += daily.completedCount;
    totalOnTime += daily.onTimeCount;
    totalLateQada += daily.lateQadaCount;
    totalMissed += daily.missedCount;
    totalUnrecorded += daily.unrecordedCount;
  }

  const totalPossible = logs.length * 5;
  const totalRecorded = totalOnTime + totalLateQada + totalMissed;

  return {
    totalDays: logs.length,
    totalPossiblePrayers: totalPossible,
    totalCompleted,
    totalOnTime,
    totalLateQada,
    totalMissed,
    totalUnrecorded,
    averageCompletionRate: totalPossible > 0 ? totalCompleted / totalPossible : 0,
    averageCoverageRate: totalPossible > 0 ? totalRecorded / totalPossible : 0,
    completionRateAmongRecorded: totalRecorded > 0 ? totalCompleted / totalRecorded : 0,
  };
}
