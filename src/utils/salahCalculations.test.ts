import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDailyPrayerStats, calculateAggregatePrayerStats } from './salahCalculations';
import { DailyPrayerLog } from '../types';

test('calculateDailyPrayerStats returns accurate counts with denominator of 5', () => {
  const sampleLog: DailyPrayerLog = {
    date: '2026-11-02',
    fajr: { status: 'on_time' },
    dhuhr: { status: 'on_time' },
    asr: { status: 'late_qada' },
    maghrib: { status: 'missed' },
    isha: { status: 'unrecorded' },
    updatedAt: new Date().toISOString(),
  };

  const stats = calculateDailyPrayerStats(sampleLog);

  assert.equal(stats.obligatoryCount, 5);
  assert.equal(stats.completedCount, 3); // 2 on_time + 1 late_qada
  assert.equal(stats.onTimeCount, 2);
  assert.equal(stats.lateQadaCount, 1);
  assert.equal(stats.missedCount, 1);
  assert.equal(stats.unrecordedCount, 1);
  assert.equal(stats.recordedCount, 4);
  assert.equal(stats.completionRate, 3 / 5); // 0.60
  assert.equal(stats.dataCoverageRate, 4 / 5); // 0.80
});

test('calculateDailyPrayerStats handles empty/null log safely without marking missed', () => {
  const stats = calculateDailyPrayerStats(undefined, '2026-11-02');
  assert.equal(stats.obligatoryCount, 5);
  assert.equal(stats.completedCount, 0);
  assert.equal(stats.missedCount, 0);
  assert.equal(stats.unrecordedCount, 5);
  assert.equal(stats.completionRate, 0);
  assert.equal(stats.dataCoverageRate, 0);
});

test('calculateAggregatePrayerStats correctly computes coverage and completed ratios', () => {
  const day1: DailyPrayerLog = {
    date: '2026-11-01',
    fajr: { status: 'on_time' },
    dhuhr: { status: 'on_time' },
    asr: { status: 'on_time' },
    maghrib: { status: 'on_time' },
    isha: { status: 'on_time' },
    updatedAt: '',
  };
  const day2: DailyPrayerLog = {
    date: '2026-11-02',
    fajr: { status: 'on_time' },
    dhuhr: { status: 'unrecorded' },
    asr: { status: 'unrecorded' },
    maghrib: { status: 'unrecorded' },
    isha: { status: 'unrecorded' },
    updatedAt: '',
  };

  const agg = calculateAggregatePrayerStats([day1, day2]);
  assert.equal(agg.totalDays, 2);
  assert.equal(agg.totalPossiblePrayers, 10);
  assert.equal(agg.totalCompleted, 6);
  assert.equal(agg.totalUnrecorded, 4);
  assert.equal(agg.averageCompletionRate, 6 / 10); // 0.60
  assert.equal(agg.averageCoverageRate, 6 / 10); // 6 recorded out of 10
  assert.equal(agg.completionRateAmongRecorded, 6 / 6); // 100% of recorded prayers were completed
});
