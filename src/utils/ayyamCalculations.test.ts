import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAyyamAlBidDates,
  isDayOfTashriq,
  generateAyyamICalendar,
  generateAyyamAlBidNotifications,
} from './ayyamCalculations';

test('calculateAyyamAlBidDates maps 13th, 14th, 15th correctly from month start', () => {
  // Let month start on 2026-11-01
  const result = calculateAyyamAlBidDates('2026-11-01', 7, 1448, 'estimated_provisional');

  assert.equal(result.day13.gregorianDate, '2026-11-13');
  assert.equal(result.day14.gregorianDate, '2026-11-14');
  assert.equal(result.day15.gregorianDate, '2026-11-15');
  assert.equal(result.day13.isProhibitedTashriq, false);
});

test('calculateAyyamAlBidDates strictly prohibits 13th of Dhul Hijjah (Days of Tashriq)', () => {
  // Month 12 is Dhul Hijjah
  const result = calculateAyyamAlBidDates('2027-05-08', 12, 1448, 'officially_confirmed');

  assert.equal(result.day13.isProhibitedTashriq, true);
  assert.ok(result.day13.tashriqReason?.includes('সহীহ মুসলিম'));
  assert.equal(result.day14.isProhibitedTashriq, false);
  assert.equal(result.day15.isProhibitedTashriq, false);
});

test('isDayOfTashriq accurately identifies 11, 12, 13 of Dhul Hijjah', () => {
  assert.equal(isDayOfTashriq(12, 11), true);
  assert.equal(isDayOfTashriq(12, 12), true);
  assert.equal(isDayOfTashriq(12, 13), true);
  assert.equal(isDayOfTashriq(12, 14), false);
  assert.equal(isDayOfTashriq(1, 13), false); // Muharram
});

test('generateAyyamICalendar produces valid RFC 5545 iCalendar file', () => {
  const ayyam = calculateAyyamAlBidDates('2026-11-01', 5, 1448);
  const ics = generateAyyamICalendar(ayyam);

  assert.ok(ics.includes('BEGIN:VCALENDAR'));
  assert.ok(ics.includes('END:VCALENDAR'));
  assert.ok(ics.includes('X-WR-TIMEZONE:Asia/Dhaka'));
  assert.ok(ics.includes('SUMMARY:আইয়ামে বীজের নফল সিয়াম'));
});
