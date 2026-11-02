/**
 * Hijri & Asia/Dhaka calendar utilities.
 * Note: Tabular / astronomical calculation is approximate.
 * Actual Islamic months begin with the verified sighting of the crescent moon (Hilal).
 */

export interface HijriDate {
  year: number;
  month: number;
  monthNameAr: string;
  monthNameBn: string;
  day: number;
  isApproximate: boolean;
}

export const HIJRI_MONTHS_BN = [
  'মুহাররম',
  'সফর',
  'রবিউল আউয়াল',
  'রবিউস সানি',
  'জমাদিউল আউয়াল',
  'জমাদিউস সানি',
  'রজব',
  'শা\'বান',
  'রমাদান',
  'শাওয়াল',
  'জিলকদ',
  'জিলহজ্জ',
];

export const HIJRI_MONTHS_AR = [
  'المحرّم',
  'صفر',
  'ربيع الأول',
  'ربيع الثاني',
  'جمادى الأولى',
  'جمادى الثانية',
  'رجب',
  'شعبان',
  'رمضان',
  'شوّال',
  'ذو القعدة',
  'ذو الحجّة',
];

export const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBengaliNumber(num: number | string): string {
  return String(num).replace(/[0-9]/g, (digit) => BENGALI_DIGITS[parseInt(digit, 10)]);
}

/**
 * Returns current date string formatted as YYYY-MM-DD in Asia/Dhaka timezone.
 */
export function getDhakaDateString(date: Date = new Date()): string {
  // Asia/Dhaka is UTC+6
  const dhakaFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return dhakaFormatter.format(date);
}

/**
 * Approximate tabular Islamic calendar converter from Gregorian date.
 * Uses Kuwaiti/Umm al-Qura standard civil tabular algorithm.
 * Accounts for Islamic day starting at Sunset (Maghrib) in Asia/Dhaka.
 */
/**
 * Approximate tabular Islamic calendar converter from Gregorian date.
 * Uses the Kuwaiti Calendar (standard civil tabular algorithm).
 * Accounts for Islamic day starting at Sunset (Maghrib) in Asia/Dhaka.
 */
export function getApproximateHijriDate(date: Date = new Date(), dayOffset: number = 0): HijriDate {
  // 1. Determine if we are past sunset in Asia/Dhaka
  const dhakaTime = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
  const hours = dhakaTime.getHours();
  const minutes = dhakaTime.getMinutes();
  
  // Maghrib approximation for Bangladesh: 
  // Average ~18:15. We use 18:15 as the cutoff.
  const isPastSunset = hours > 18 || (hours === 18 && minutes >= 15);
  
  // If it's past sunset, the Islamic day is the "next" day
  const effectiveDate = new Date(date.getTime() + (dayOffset + (isPastSunset ? 1 : 0)) * 86400000);
  
  let day = effectiveDate.getDate();
  let month = effectiveDate.getMonth() + 1;
  let year = effectiveDate.getFullYear();

  if (month < 3) {
    year -= 1;
    month += 12;
  }

  const a = Math.floor(year / 100);
  const b = 2 - a + Math.floor(a / 4);
  const jd = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524;

  // Conversion logic (Tabular Islamic)
  const ijd = jd + 1;
  const z = Math.floor(ijd);
  const cyc = Math.floor((z - 1948440) / 10631);
  const rem = (z - 1948440) % 10631;
  const j = Math.floor(rem / 354.36667);
  const hYear = cyc * 30 + j;
  const hDayInYear = Math.floor(rem - Math.floor(j * 354.36667)) + 1;

  // Determine month lengths: 30, 29, 30, 29...
  const monthLengths = [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 30]; // 12th month can be 30 in leap years
  
  let hMonth = 0;
  let hDay = 0;
  let accumulated = 0;
  for (let i = 0; i < 12; i++) {
    let mLen = monthLengths[i];
    // Simple tabular leap year check for the 12th month
    if (i === 11) {
      const isLeap = ((11 * hYear + 14) % 30) < 11;
      mLen = isLeap ? 30 : 29;
    }
    
    if (hDayInYear <= accumulated + mLen) {
      hMonth = i + 1;
      hDay = hDayInYear - accumulated;
      break;
    }
    accumulated += mLen;
  }

  // Fallback safety
  if (hMonth === 0) {
    hMonth = 12;
    hDay = 30;
  }

  const monthIdx = Math.max(0, Math.min(11, hMonth - 1));

  return {
    year: hYear,
    month: hMonth,
    monthNameAr: HIJRI_MONTHS_AR[monthIdx],
    monthNameBn: HIJRI_MONTHS_BN[monthIdx],
    day: hDay,
    isApproximate: true,
  };
}

export interface RamadanCountdown {
  targetDateStr: string;
  totalDays: number;
  totalHours: number;
  totalMinutes: number;
  totalSeconds: number;
  isPast: boolean;
  isCurrentlyRamadan: boolean;
}

/**
 * Calculates countdown to Ramadan 1448 AH (default approx 9 Feb 2027 in Asia/Dhaka).
 */
export function calculateRamadanCountdown(
  targetDateStr: string = '2027-02-09',
  now: Date = new Date()
): RamadanCountdown {
  // Target start in Asia/Dhaka (midnight)
  const targetDate = new Date(`${targetDateStr}T00:00:00+06:00`);
  const diffMs = targetDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    // Check if within 30 days of Ramadan
    const daysSince = Math.abs(diffMs) / (1000 * 60 * 60 * 24);
    const isCurrentlyRamadan = daysSince <= 30;
    return {
      targetDateStr,
      totalDays: 0,
      totalHours: 0,
      totalMinutes: 0,
      totalSeconds: 0,
      isPast: true,
      isCurrentlyRamadan,
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  return {
    targetDateStr,
    totalDays,
    totalHours: totalHours % 24,
    totalMinutes: totalMinutes % 60,
    totalSeconds: totalSeconds % 60,
    isPast: false,
    isCurrentlyRamadan: false,
  };
}
