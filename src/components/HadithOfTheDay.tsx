import React, { useState } from 'react';
import {
  BookOpen,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Share2,
  Calendar,
} from 'lucide-react';
import { HadithRecord } from '../types/hadith';
import { toBengaliNumber } from '../utils/hijriCalendar';

interface HadithOfTheDayProps {
  hadith: HadithRecord;
  totalVerifiedCount: number;
  onOpenLibraryAdmin: () => void;
}

export const HadithOfTheDay: React.FC<HadithOfTheDayProps> = ({
  hadith,
  totalVerifiedCount,
  onOpenLibraryAdmin,
}) => {
  const [copiedType, setCopiedType] = useState<'ar' | 'bn' | null>(null);

  const handleCopy = (text: string, type: 'ar' | 'bn') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="clay-card p-6 bg-gradient-to-br from-white via-amber-50/20 to-[#FAF8F5] border border-amber-200/80">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-3.5">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800 shadow-2xs">
            <BookOpen className="w-4 h-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-stone-900 text-base font-bengali">
                নির্বাচিত সহীহ হাদিস (র‍্যান্ডম)
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                {hadith.authenticityGrade}
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium">
              হাদিস ভাণ্ডার লাইব্রেরি: {toBengaliNumber(totalVerifiedCount)}টি পরীক্ষিত সহীহ হাদিস
            </p>
          </div>
        </div>

        <button
          onClick={onOpenLibraryAdmin}
          className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition border border-stone-200 flex items-center gap-1.5"
        >
          <span>হাদিস লাইব্রেরি ও ব্যবস্থাপনা</span>
        </button>
      </div>

      {/* Badges: Collection, Narrator, Topic */}
      <div className="flex flex-wrap items-center gap-2 my-3">
        <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 font-semibold border border-emerald-200">
          {hadith.collection} • হাদিস নং {toBengaliNumber(hadith.hadithNumber)}
        </span>
        <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 font-medium border border-amber-200">
          বর্ণনাকারী: {hadith.narrator}
        </span>
        <span className="text-xs px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 font-medium">
          বিষয়: {hadith.topic}
        </span>
      </div>

      {/* 1. Arabic Text (Noto Naskh Arabic with correct RTL shaping) */}
      <div className="my-4 p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE3D6] shadow-2xs">
        <p className="font-arabic text-xl sm:text-2xl text-[#0F4C3A] font-bold select-text leading-loose text-right">
          {hadith.arabic}
        </p>
      </div>

      {/* 2. Bengali Translation */}
      <div className="mb-4">
        <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1">
          বাংলা অনুবাদ:
        </div>
        <p className="text-sm text-stone-900 font-medium leading-relaxed font-bengali">
          {hadith.bengali}
        </p>
      </div>

      {/* Reference & Grading Authority */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-3 border-t border-stone-200/80 bg-stone-50/70 p-3 rounded-xl mb-4">
        <div>
          <span className="font-semibold text-stone-700">কিতাবের রেফারেন্স: </span>
          <span className="text-stone-600">{hadith.inBookReference}</span>
        </div>
        <div>
          <span className="font-semibold text-stone-700">সনদ ও তাহকীক কর্তৃপক্ষ: </span>
          <span className="text-emerald-800 font-semibold">{hadith.gradingAuthority}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          {/* Copy Arabic */}
          <button
            onClick={() => handleCopy(hadith.arabic, 'ar')}
            className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-medium flex items-center gap-1.5 transition"
          >
            {copiedType === 'ar' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">আরবি কপি হয়েছে</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-stone-400" />
                <span>আরবি কপি</span>
              </>
            )}
          </button>

          {/* Copy Bengali */}
          <button
            onClick={() => handleCopy(hadith.bengali, 'bn')}
            className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-medium flex items-center gap-1.5 transition"
          >
            {copiedType === 'bn' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">অনুবাদ কপি হয়েছে</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-stone-400" />
                <span>বাংলা কপি</span>
              </>
            )}
          </button>
        </div>

        {/* Source link */}
        <a
          href={hadith.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-emerald-800 hover:text-emerald-950 font-medium flex items-center gap-1 hover:underline"
        >
          <span>Sunnah.com এ যাচাই করুন</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
