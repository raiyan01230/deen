import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Plus,
  Share2,
  Sparkles,
  Info,
} from 'lucide-react';
import { HadithRecord, HadithCollection } from '../types/hadith';
import { filterHadiths } from '../services/hadithService';
import { HadithOfTheDay } from './HadithOfTheDay';
import { toBengaliNumber } from '../utils/hijriCalendar';

interface HadithLibraryViewProps {
  hadiths: HadithRecord[];
  dailyHadith: HadithRecord;
  onOpenAdmin: () => void;
}

export const HadithLibraryView: React.FC<HadithLibraryViewProps> = ({
  hadiths,
  dailyHadith,
  onOpenAdmin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = filterHadiths(hadiths, {
    searchQuery,
    collection: selectedCollection,
  }).filter((h) => (selectedTopic === 'all' ? true : h.topic === selectedTopic));

  const verifiedCount = hadiths.filter((h) => h.verificationStatus === 'verified').length;
  const bukhariCount = hadiths.filter((h) => h.collection === 'Sahih al-Bukhari').length;
  const muslimCount = hadiths.filter((h) => h.collection === 'Sahih Muslim').length;

  const topics = Array.from(new Set(hadiths.map((h) => h.topic).filter(Boolean)));

  const handleCopyText = (hadith: HadithRecord) => {
    const text = `${hadith.arabic}\n\nঅনুবাদ: ${hadith.bengali}\n\n[বর্ণনাকারী: ${hadith.narrator} | ${hadith.collection} - হাদিস নং ${hadith.hadithNumber} (${hadith.authenticityGrade})]\nমূল সূত্র: ${hadith.sourceUrl}`;
    navigator.clipboard.writeText(text);
    setCopiedId(hadith.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Header Banner */}
      <div className="clay-card-emerald p-6 sm:p-8 rounded-3xl text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-medium mb-3 border border-amber-300/20">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>সহীহ হাদিস সংগ্রহ ও নিরীক্ষণ ভাণ্ডার</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2 font-bengali">
              সহীহ হাদিস লাইব্রেরি
            </h2>
            <p className="text-emerald-100/90 text-sm max-w-2xl leading-relaxed font-bengali">
              বিশুদ্ধ ও প্রমাণিত সহীহ হাদিসসমূহের সংগ্রহশালা। প্রতিটি হাদিস সহীহুল বুখারী ও সহীহ মুসলিম থেকে সংগৃহীত, তাহকিককৃত এবং নির্ভরযোগ্য সূত্রসহ সংরক্ষিত।
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 flex flex-col items-center justify-center min-w-[200px]">
            <span className="text-xs text-amber-300 font-semibold uppercase tracking-wider">
              যাচাইকৃত সহীহ হাদিস সংখ্যা
            </span>
            <div className="text-3xl font-bold text-white mt-1">
              {toBengaliNumber(verifiedCount)}টি
            </div>
            <div className="text-[11px] text-emerald-200 mt-1 text-center">
              বুখারী: {toBengaliNumber(bukhariCount)} | মুসলিম: {toBengaliNumber(muslimCount)}
            </div>
            <button
              onClick={onOpenAdmin}
              className="mt-3 w-full py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>হাদিস যোগ / ডাটা নিরীক্ষণ</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Featured Hadith of the Day */}
      <HadithOfTheDay
        hadith={dailyHadith}
        totalVerifiedCount={verifiedCount}
        onOpenLibraryAdmin={onOpenAdmin}
      />

      {/* 3. Search and Filters */}
      <div className="clay-card p-4 sm:p-5 bg-white border-stone-200">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="হাদিস নম্বর, বর্ণনাকারী, আরবি শব্দ বা বাংলা অর্থ দিয়ে খুঁজুন..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700 font-bengali"
            />
          </div>

          {/* Collection Filter */}
          <select
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            className="w-full md:w-auto px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-medium text-stone-700 bg-stone-50 focus:outline-hidden"
          >
            <option value="all">সকল কিতাব ({toBengaliNumber(hadiths.length)})</option>
            <option value="Sahih al-Bukhari">সহীহুল বুখারী ({toBengaliNumber(bukhariCount)})</option>
            <option value="Sahih Muslim">সহীহ মুসলিম ({toBengaliNumber(muslimCount)})</option>
            <option value="Sunan an-Nasa'i">সুনান আন-নাসায়ী</option>
            <option value="Sunan Abi Dawud">সুনান আবু দাউদ</option>
            <option value="Jami' at-Tirmidhi">জামে আত-তিরমিযী</option>
            <option value="Sunan Ibn Majah">সুনান ইবনে মাজাহ</option>
          </select>

          {/* Topic Filter */}
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="w-full md:w-auto px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-medium text-stone-700 bg-stone-50 focus:outline-hidden"
          >
            <option value="all">সকল বিষয়</option>
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Filter count feedback */}
        <div className="flex items-center justify-between text-xs text-stone-500 mt-3 pt-3 border-t border-stone-100">
          <span>
            প্রদর্শিত হচ্ছে: <strong className="text-stone-800">{toBengaliNumber(filtered.length)}</strong>টি হাদিস
          </span>
          <span className="text-[11px] text-emerald-800 font-medium">
            *শতভাগ নির্ভরযোগ্য মূল কিতাব ও সানাদভিত্তিক
          </span>
        </div>
      </div>

      {/* 4. Hadith Cards List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="clay-card p-12 text-center text-stone-500 bg-white">
            <BookOpen className="w-10 h-10 mx-auto text-stone-300 mb-2" />
            <p className="font-semibold text-stone-700">কোনো হাদিস পাওয়া যায়নি</p>
            <p className="text-xs text-stone-400 mt-1">অন্য কোনো শব্দ দিয়ে অনুসন্ধান করুন।</p>
          </div>
        ) : (
          filtered.map((h) => (
            <div
              key={h.id}
              className="clay-card p-5 sm:p-6 bg-white border border-stone-200 hover:border-emerald-300 transition duration-150"
            >
              {/* Header Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 font-bold border border-emerald-200">
                    {h.collection} • হাদিস নং {toBengaliNumber(h.hadithNumber)}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-100/70 text-emerald-800 font-semibold border border-emerald-300">
                    {h.authenticityGrade}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 font-medium">
                    বিষয়: {h.topic}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopyText(h)}
                    className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 transition text-xs flex items-center gap-1"
                    title="হাদিস কপি করুন"
                  >
                    {copiedId === h.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 text-[11px] font-semibold">কপি হয়েছে</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[11px]">কপি</span>
                      </>
                    )}
                  </button>

                  <a
                    href={h.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-stone-600 transition text-xs flex items-center gap-1"
                    title="Sunnah.com এ যাচাই করুন"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="text-[11px]">সূত্র</span>
                  </a>
                </div>
              </div>

              {/* Arabic text */}
              <div className="my-3 p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE3D6]">
                <p className="font-arabic text-xl sm:text-2xl text-[#0F4C3A] font-bold leading-loose text-right select-text">
                  {h.arabic}
                </p>
              </div>

              {/* Bengali translation */}
              <div className="mb-3">
                <p className="text-sm text-stone-900 font-medium leading-relaxed font-bengali">
                  {h.bengali}
                </p>
              </div>

              {/* Narrator and Reference Footer */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-3 border-t border-stone-100 text-stone-500">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-stone-700">বর্ণনাকারী:</span>
                  <span>{h.narrator}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>
                    <strong className="text-stone-700">তাহকিক:</strong> {h.gradingAuthority}
                  </span>
                  <span>
                    <strong className="text-stone-700">রেফারেন্স:</strong> {h.inBookReference}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
