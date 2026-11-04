import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { HadithRecord, HadithFilterOptions } from '../types/hadith';
import { INITIAL_SAHIH_HADITHS } from '../data/hadithLibrary';

const LOCAL_HADITH_KEY = 'my_deen_hadith_records';

/**
 * Loads all Hadiths (initial seed + custom user/admin imported records).
 */
export async function getAllHadiths(uid?: string): Promise<HadithRecord[]> {
  let records: HadithRecord[] = [...INITIAL_SAHIH_HADITHS];

  // Read local custom records
  try {
    const local = localStorage.getItem(LOCAL_HADITH_KEY);
    if (local) {
      const parsed: HadithRecord[] = JSON.parse(local);
      const existingIds = new Set(records.map((r) => r.id));
      parsed.forEach((p) => {
        if (!existingIds.has(p.id)) {
          records.push(p);
        }
      });
    }
  } catch (e) {
    console.warn('Failed to parse local hadiths:', e);
  }

  // Fetch from Firestore if user is authenticated and Firebase is configured
  if (uid && isFirebaseConfigured() && db) {
    try {
      const colRef = collection(db, 'users', uid, 'hadithRecords');
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const existingIds = new Set(records.map((r) => r.id));
        snap.forEach((d) => {
          const item = d.data() as HadithRecord;
          if (!existingIds.has(item.id)) {
            records.push(item);
          }
        });
      }
    } catch (err) {
      console.warn('Firestore getAllHadiths error:', err);
    }
  }

  return records;
}

/**
 * Random Rotation Algorithm:
 * Returns one random verified Hadith from the library.
 * Changes on every refresh or component mount.
 */
export function getHadithOfTheDay(hadiths: HadithRecord[], _dateStr: string = ''): HadithRecord {
  const verifiedList = hadiths.filter((h) => h.verificationStatus === 'verified');
  if (verifiedList.length === 0) {
    return hadiths[0] || INITIAL_SAHIH_HADITHS[0];
  }

  // Pure random selection for every visit/refresh
  const randomIndex = Math.floor(Math.random() * verifiedList.length);

  return verifiedList[randomIndex];
}

/**
 * Saves or updates a Hadith record in local storage and Firestore.
 */
export async function saveHadithRecord(
  hadith: HadithRecord,
  uid?: string
): Promise<HadithRecord> {
  const all = await getAllHadiths(uid);
  const idx = all.findIndex((h) => h.id === hadith.id);
  if (idx >= 0) {
    all[idx] = hadith;
  } else {
    all.push(hadith);
  }

  localStorage.setItem(LOCAL_HADITH_KEY, JSON.stringify(all));

  if (uid && isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, 'users', uid, 'hadithRecords', hadith.id);
      await setDoc(docRef, hadith, { merge: true });
    } catch (err) {
      console.error('Firestore saveHadithRecord error:', err);
    }
  }

  return hadith;
}

/**
 * Filters Hadith records by query, collection, topic, or verification status.
 */
export function filterHadiths(
  hadiths: HadithRecord[],
  options: HadithFilterOptions
): HadithRecord[] {
  return hadiths.filter((h) => {
    if (options.verificationStatus && options.verificationStatus !== 'all') {
      if (h.verificationStatus !== options.verificationStatus) return false;
    }
    if (options.collection && options.collection !== 'all') {
      if (h.collection !== options.collection) return false;
    }
    if (options.topic && options.topic !== 'all') {
      if (h.topic !== options.topic) return false;
    }
    if (options.searchQuery && options.searchQuery.trim() !== '') {
      const q = options.searchQuery.toLowerCase();
      const match =
        h.arabic.includes(q) ||
        h.bengali.toLowerCase().includes(q) ||
        h.narrator.toLowerCase().includes(q) ||
        String(h.hadithNumber).includes(q) ||
        h.topic.toLowerCase().includes(q) ||
        h.gradingAuthority.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });
}
