import React, { useState } from 'react';
import {
  Search,
  Bookmark,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  BookOpen,
  Volume2,
  ExternalLink,
  ShieldCheck,
  Heart,
} from 'lucide-react';
import { DuaItem } from '../types';
import { DUA_CATEGORIES, INITIAL_DUAS } from '../utils/duaData';

interface DuaLibraryProps {
  favoriteIds: string[];
  onToggleFavorite: (duaId: string) => void;
}

export const DuaLibrary: React.FC<DuaLibraryProps> = ({ favoriteIds, onToggleFavorite }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeCounters, setActiveCounters] = useState<Record<string, number>>({});

  const handleCopy = (text: string, id: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(`${id}_${type}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleIncrementCounter = (duaId: string) => {
    setActiveCounters((prev) => ({
      ...prev,
      [duaId]: (prev[duaId] || 0) + 1,
    }));
  };

  const handleResetCounter = (duaId: string) => {
    setActiveCounters((prev) => ({
      ...prev,
      [duaId]: 0,
    }));
  };

  const filteredDuas = INITIAL_DUAS.filter((dua) => {
    const isFav = favoriteIds.includes(dua.id);
    if (showOnlyFavorites && !isFav) return false;
    if (selectedCategory !== 'all' && dua.category !== selectedCategory) return false;

    if (searchQuery.trim() === '') return true;
    const q = searchQuery.toLowerCase();
    return (
      dua.titleBn.toLowerCase().includes(q) ||
      dua.titleEn.toLowerCase().includes(q) ||
      dua.arabic.includes(q) ||
      dua.banglish.toLowerCase().includes(q) ||
      dua.bengaliMeaning.toLowerCase().includes(q) ||
      dua.reference.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Header Banner */}
      <div className="clay-card-emerald p-6 rounded-3xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>সহীহ হাদিস ও কুরআন সমর্থিত দুআ ভাণ্ডার</span>
            </div>
            <h2 className="text-2xl font-bold font-bengali">
              মাসনূন দুআ ও জিকির সম্ভার
            </h2>
            <p className="text-xs text-emerald-100/90 mt-1 max-w-xl">
              দৈনন্দিন জীবনের প্রতিটি মুহূর্তের জন্য কুরআনুল কারীম ও নির্ভরযোগ্য সহীহ হাদিস বর্ণিত দুআ ও তাসবীহ।
            </p>
          </div>

          <button
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs ${
              showOnlyFavorites
                ? 'bg-amber-400 text-stone-900 ring-2 ring-amber-300'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <Bookmark className="w-4 h-4 text-amber-300 fill-current" />
            <span>পছন্দের দুআ ({favoriteIds.length})</span>
          </button>
        </div>
      </div>

      {/* Search and Category Filters */}
      <div className="clay-card p-4 bg-white space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="দুআ খুঁজুন (আরবি, বাংলা অর্থ, উচ্চারণ বা রেফারেন্স দ্বারা)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-emerald-600"
          />
        </div>

        {/* Category Pills */}
        <div className="flex space-x-1.5 overflow-x-auto no-scrollbar py-1">
          {DUA_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setShowOnlyFavorites(false);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs whitespace-nowrap transition cursor-pointer font-medium ${
                  isSelected
                    ? 'bg-[#0F4C3A] text-white shadow-2xs font-semibold'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {cat.nameBn}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dua Cards List */}
      <div className="space-y-4">
        {filteredDuas.length === 0 ? (
          <div className="clay-card p-12 text-center text-stone-500 bg-white">
            <p className="text-sm">কোনো দুআ খুঁজে পাওয়া যায়নি।</p>
          </div>
        ) : (
          filteredDuas.map((dua) => {
            const isFav = favoriteIds.includes(dua.id);
            const count = activeCounters[dua.id] || 0;

            return (
              <div
                key={dua.id}
                className="clay-card p-5 sm:p-6 bg-white border border-stone-200 hover:border-emerald-200 transition-all"
              >
                {/* Top Bar: Title, Category, Reference & Favorite */}
                <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-stone-900 font-bengali">
                      {dua.titleBn}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-[11px] text-stone-400 font-medium">
                        {dua.titleEn}
                      </span>
                      {dua.authenticity && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                          {dua.authenticity}
                        </span>
                      )}
                      {dua.repetitions && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                          পাঠ সংখ্যা: {dua.repetitions}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onToggleFavorite(dua.id)}
                      className={`p-2 rounded-xl transition ${
                        isFav
                          ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                          : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'
                      }`}
                      title={isFav ? 'পছন্দ তালিকা থেকে সরান' : 'পছন্দে যোগ করুন'}
                    >
                      <Bookmark className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* 1. Arabic Text (Selectable Unicode text with correct RTL shaping & Noto Naskh font) */}
                <div className="my-4 p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE3D6] shadow-2xs">
                  <p className="font-arabic text-xl sm:text-2xl text-[#0F4C3A] font-bold select-text leading-loose text-right">
                    {dua.arabic}
                  </p>
                </div>

                {/* 2. Banglish Transliteration */}
                <div className="mb-3">
                  <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-0.5">
                    উচ্চারণ (Banglish):
                  </div>
                  <p className="text-xs sm:text-sm text-stone-700 font-medium italic leading-relaxed">
                    {dua.banglish}
                  </p>
                </div>

                {/* 3. Bengali Meaning */}
                <div className="mb-4">
                  <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-0.5">
                    বাংলা অর্থ:
                  </div>
                  <p className="text-xs sm:text-sm text-stone-900 font-medium leading-relaxed font-bengali">
                    {dua.bengaliMeaning}
                  </p>
                </div>

                {/* 4. When to Read & Verified Reference */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-3 border-t border-stone-100 bg-stone-50/60 p-3 rounded-xl mb-4">
                  <div>
                    <span className="font-semibold text-stone-700">কখন পড়বেন: </span>
                    <span className="text-stone-600">{dua.whenToReadBn}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-stone-700">উৎস ও সনদ: </span>
                    <span className="text-emerald-800 font-medium">{dua.reference}</span>
                  </div>
                </div>

                {/* Scholarly note if present */}
                {dua.scholarlyNote && (
                  <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 mb-3">
                    <span className="font-semibold">বিশেষ জ্ঞাতব্য: </span>
                    {dua.scholarlyNote}
                  </div>
                )}

                {/* Action Bar: Copy Buttons & Interactive Tasbih Counter */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    {/* Copy Arabic */}
                    <button
                      onClick={() => handleCopy(dua.arabic, dua.id, 'ar')}
                      className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-medium flex items-center gap-1.5 transition"
                    >
                      {copiedId === `${dua.id}_ar` ? (
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

                    {/* Copy Banglish */}
                    <button
                      onClick={() => handleCopy(dua.banglish, dua.id, 'bn')}
                      className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-medium flex items-center gap-1.5 transition"
                    >
                      {copiedId === `${dua.id}_bn` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-semibold">উচ্চারণ কপি হয়েছে</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-stone-400" />
                          <span>উচ্চারণ কপি</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Built-in Digital Tasbih Counter for repetition */}
                  <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-xl">
                    <span className="text-xs text-stone-500 font-medium px-2">
                      কাউন্টার: <strong className="text-emerald-900 font-bold">{count}</strong>
                    </span>
                    <button
                      onClick={() => handleIncrementCounter(dua.id)}
                      className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs"
                    >
                      +১
                    </button>
                    {count > 0 && (
                      <button
                        onClick={() => handleResetCounter(dua.id)}
                        className="p-1 rounded-lg hover:bg-stone-200 text-stone-500 transition"
                        title="রিসেট"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
