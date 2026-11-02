import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRamadanCountdown, toBengaliNumber, getDhakaDateString } from './hijriCalendar';

test('toBengaliNumber converts Arabic numerals to Bengali digits', () => {
  assert.equal(toBengaliNumber(1448), '১৪৪৮');
  assert.equal(toBengaliNumber('2027-02-09'), '২০২৭-০২-০৯');
  assert.equal(toBengaliNumber(0), '০');
});

test('calculateRamadanCountdown computes positive future countdown', () => {
  const mockNow = new Date('2026-11-02T12:00:00+06:00');
  const countdown = calculateRamadanCountdown('2027-02-09', mockNow);
  
  assert.equal(countdown.isPast, false);
  assert.ok(countdown.totalDays > 90); // ~98 days away
});

test('getDhakaDateString formats date in YYYY-MM-DD', () => {
  const d = new Date('2026-11-02T06:00:00Z');
  const dhakaStr = getDhakaDateString(d);
  assert.match(dhakaStr, /^\d{4}-\d{2}-\d{2}$/);
});
