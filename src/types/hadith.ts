export type HadithCollection =
  | 'Sahih al-Bukhari'
  | 'Sahih Muslim'
  | 'Jami` at-Tirmidhi'
  | 'Sunan an-Nasa\'i'
  | 'Sunan Abi Dawud'
  | 'Sunan Ibn Majah';

export type HadithVerificationStatus = 'verified' | 'unreviewed';

export interface HadithRecord {
  id: string;
  arabic: string;
  bengali: string;
  narrator: string; // e.g. হযরত আবু হুরায়রা (রা.)
  collection: HadithCollection;
  hadithNumber: string | number;
  inBookReference: string; // e.g. Book 1, Hadith 1
  authenticityGrade: 'সহীহ (Sahih)';
  gradingAuthority: string; // e.g. ইমাম বুখারী (র.), ইমাম মুসলিম (র.), শায়খ আল-আলবানী (র.)
  sourceUrl: string; // e.g. https://sunnah.com/bukhari:1
  topic: string; // e.g. নিয়্যাত ও ইখলাস, সালাত, চরিত্র, জিকির
  translatorInfo: string; // e.g. ইসলামিক ফাউন্ডেশন বাংলাদেশ / তাওহীদ পাবলিকেশন্স
  verificationStatus: HadithVerificationStatus;
  reviewedBy?: string;
  crossReferences?: string[];
  createdAt: string;
}

export interface HadithFilterOptions {
  searchQuery?: string;
  collection?: string;
  topic?: string;
  verificationStatus?: HadithVerificationStatus | 'all';
}
