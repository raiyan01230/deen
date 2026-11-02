import {
  AyyamAlBidDates,
  BangladeshHijriDateInfo,
  MoonConfirmationStatus,
  UserNotificationPreferences,
  InAppNotification,
} from '../types/ayyam';
import { HIJRI_MONTHS_BN, toBengaliNumber, getApproximateHijriDate } from './hijriCalendar';

export const BANGLADESH_DISTRICTS = [
  'ঢাকা (Dhaka)',
  'চট্টগ্রাম (Chattogram)',
  'সিলেট (Sylhet)',
  'রাজশাহী (Rajshahi)',
  'খুলনা (Khulna)',
  'বরিশাল (Barishal)',
  'রংপুর (Rangpur)',
  'ময়মনসিংহ (Mymensingh)',
  'কুমিল্লা (Cumilla)',
  'বগুড়া (Bogura)',
  'কক্সবাজার (Cox\'s Bazar)',
];

/**
 * Calculates the Gregorian start date (1st day) of a given Hijri month.
 * This is the Gregorian day where the daylight portion is the 1st of the Hijri month.
 */
export function getHijriMonthStart(hijriMonth: number, hijriYear: number): string {
  // Approximate search: find a Gregorian day that maps to 1st of target Hijri month
  // We'll start about 30 days before "today" to find the target month's start
  const now = new Date();
  let searchDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 60); // Look back 2 months
  
  // Safety limit to avoid infinite loops
  for (let i = 0; i < 120; i++) {
    const h = getApproximateHijriDate(searchDate);
    if (h.month === hijriMonth && h.year === hijriYear && h.day === 1) {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Dhaka',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(searchDate);
    }
    searchDate.setDate(searchDate.getDate() + 1);
  }

  // Fallback if not found (should not happen with 120 days search range)
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/**
 * Calculates Gregorian dates for 13th, 14th, and 15th of a Hijri month in Bangladesh.
 */
export function calculateAyyamAlBidDates(
  monthStartDate: string,
  hijriMonth: number,
  hijriYear: number,
  status: MoonConfirmationStatus = 'estimated_provisional'
): AyyamAlBidDates {
  const startDate = new Date(`${monthStartDate}T00:00:00+06:00`);

  // The 13th day of the month is (1st day + 12 days)
  const d13 = new Date(startDate);
  d13.setDate(startDate.getDate() + 12);

  const d14 = new Date(startDate);
  d14.setDate(startDate.getDate() + 13);

  const d15 = new Date(startDate);
  d15.setDate(startDate.getDate() + 14);

  const formatDate = (d: Date) => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  };
  const formatWeekday = (d: Date) =>
    d.toLocaleDateString('bn-BD', { weekday: 'long', timeZone: 'Asia/Dhaka' });

  // IMPORTANT EXCEPTION: Dhul Hijjah (Month 12) - Days of Tashriq
  // The 11th, 12th, and 13th of Dhul Hijjah are Days of Tashriq.
  // Fasting on these days is prohibited by Prophet Muhammad ﷺ.
  const isDhulHijjah = hijriMonth === 12;

  const monthIdx = Math.max(0, Math.min(11, hijriMonth - 1));

  return {
    hijriMonth,
    hijriMonthNameBn: HIJRI_MONTHS_BN[monthIdx],
    hijriYear,
    confirmationStatus: status,
    day13: {
      hijriDay: 13,
      gregorianDate: formatDate(d13),
      weekdayBn: formatWeekday(d13),
      isProhibitedTashriq: isDhulHijjah,
      tashriqReason: isDhulHijjah
        ? '১৩ জিলহজ্জ আইয়ামে তাশরীকের অন্তর্ভুক্ত। রাসূলুল্লাহ ﷺ বলেছেন: "আইয়ামে তাশরীকের দিনগুলো পানাহার ও আল্লাহর জিকিরের দিন।" (সহীহ মুসলিম ১১৪১a/১১৪২a)। এই দিনে সাধারণ নফল সিয়াম নিষিদ্ধ।'
        : undefined,
    },
    day14: {
      hijriDay: 14,
      gregorianDate: formatDate(d14),
      weekdayBn: formatWeekday(d14),
      isProhibitedTashriq: false,
    },
    day15: {
      hijriDay: 15,
      gregorianDate: formatDate(d15),
      weekdayBn: formatWeekday(d15),
      isProhibitedTashriq: false,
    },
    sunsetMaghribBegins: '17:45',
    fajrSehriEnds: '05:02',
    daysUntilStart: Math.ceil(
      (new Date(`${formatDate(d13)}T00:00:00+06:00`).getTime() - new Date().setHours(0, 0, 0, 0)) /
        (1000 * 60 * 60 * 24)
    ),
    hasTashriqProhibition: isDhulHijjah,
  };
}

/**
 * Checks if a specific Hijri date is in Days of Tashriq (11, 12, 13 of Dhul Hijjah)
 */
export function isDayOfTashriq(hijriMonth: number, hijriDay: number): boolean {
  return hijriMonth === 12 && (hijriDay === 11 || hijriDay === 12 || hijriDay === 13);
}

/**
 * Generates advance reminders based on user preferences.
 */
export function generateAyyamAlBidNotifications(
  ayyam: AyyamAlBidDates,
  prefs: UserNotificationPreferences,
  now: Date = new Date()
): InAppNotification[] {
  const notifications: InAppNotification[] = [];
  const d13 = new Date(`${ayyam.day13.gregorianDate}T00:00:00+06:00`);

  // 1. Advance Notice (e.g. 3 days before)
  const advanceDate = new Date(d13);
  advanceDate.setDate(d13.getDate() - prefs.advanceDays);
  const idempotencyKeyAdvance = `ayyam_${ayyam.hijriYear}_${ayyam.hijriMonth}_advance_${prefs.advanceDays}`;

  notifications.push({
    id: `notif_${idempotencyKeyAdvance}`,
    idempotencyKey: idempotencyKeyAdvance,
    title: `আসন্ন আইয়ামে বীজের নফল সিয়াম (${prefs.advanceDays} দিন বাকি)`,
    message: `পবিত্র ${ayyam.hijriMonthNameBn} মাসের আইয়ামে বীজের রোজা শুরু হতে যাচ্ছে ${ayyam.day13.gregorianDate} (${ayyam.day13.weekdayBn}) থেকে। সিয়ামের প্রস্তুতি গ্রহণ করুন।`,
    timestamp: advanceDate.toISOString(),
    type: 'ayyam_advance',
    read: false,
    link: 'ayyam',
  });

  // 2. Evening before 13th Hijri (Maghrib transition)
  const eveDate = new Date(d13);
  eveDate.setDate(d13.getDate() - 1);
  const idempotencyKeyEve = `ayyam_${ayyam.hijriYear}_${ayyam.hijriMonth}_eve_13`;

  notifications.push({
    id: `notif_${idempotencyKeyEve}`,
    idempotencyKey: idempotencyKeyEve,
    title: `আজ মাগরিবের পর থেকে ১৩ই ${ayyam.hijriMonthNameBn} শুরু`,
    message: ayyam.day13.isProhibitedTashriq
      ? `সতর্কতা: আগামীকাল ১৩ জিলহজ্জ আইয়ামে তাশরীক হওয়ায় রোজা রাখা নিষিদ্ধ (সহীহ মুসলিম ১১৪১)। ১৪ ও ১৫ জিলহজ্জ রোজা রাখা যাবে।`
      : `আগামীকাল ১৩ই ${ayyam.hijriMonthNameBn} আইয়ামে বীজের ১ম রোজা। সেহরির জন্য সময়মতো প্রস্তুত হোন।`,
    timestamp: eveDate.toISOString(),
    type: 'ayyam_evening',
    read: false,
    link: 'ayyam',
  });

  return notifications;
}

/**
 * Builds standard RFC 5545 iCalendar content for exporting to Apple/Google/Outlook Calendar.
 */
export function generateAyyamICalendar(ayyam: AyyamAlBidDates): string {
  const daysToInclude = [
    { day: ayyam.day13, num: 13 },
    { day: ayyam.day14, num: 14 },
    { day: ayyam.day15, num: 15 },
  ].filter((d) => !d.day.isProhibitedTashriq);

  let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MY DEEN & LIFE//Bangladesh Hijri Moon Intelligence//BN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-TIMEZONE:Asia/Dhaka
`;

  daysToInclude.forEach((item) => {
    const dateFormatted = item.day.gregorianDate.replace(/-/g, '');
    const uid = `ayyam-${ayyam.hijriYear}-${ayyam.hijriMonth}-${item.num}@mydeenandlife.com`;

    ics += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART;VALUE=DATE:${dateFormatted}
DTEND;VALUE=DATE:${dateFormatted}
SUMMARY:আইয়ামে বীজের নফল সিয়াম (${toBengaliNumber(item.num)}ই ${ayyam.hijriMonthNameBn})
DESCRIPTION:রাসূলুল্লাহ ﷺ প্রতি চন্দ্র মাসের ১৩\\, ১৪ ও ১৫ তারিখে আইয়ামে বীজের রোজা রাখতেন। (সুনান আত-তিরমিযী ৭৬১)। টাইমজোন: এশিয়া/ঢাকা।
STATUS:CONFIRMED
TRANSP:TRANSPARENT
END:VEVENT
`;
  });

  ics += `END:VCALENDAR`;
  return ics;
}
