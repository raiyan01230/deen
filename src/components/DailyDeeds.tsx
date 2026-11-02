import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  Plus,
  Search,
  BookOpen,
  Filter,
  Sparkles,
  Heart,
  Shield,
  Layers,
  Check,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { DailyDeedsLog, DeedCategory, DeedItem } from '../types';
import { INITIAL_DEEDS } from '../utils/deedsData';
import { toBengaliNumber } from '../utils/hijriCalendar';
import { subscribeToSyncState, SyncStateInfo } from '../services/dataService';

interface DailyDeedsProps {
  currentDate: string;
  deedsLog: DailyDeedsLog;
  onToggleDeed: (deedId: string) => void;
  customDeeds: DeedItem[];
  onAddCustomDeed: (deed: DeedItem) => void;
}

export const DailyDeeds: React.FC<DailyDeedsProps> = ({
  currentDate,
  deedsLog,
  onToggleDeed,
  customDeeds,
  onAddCustomDeed,
}) => {
  const [syncInfo, setSyncInfo] = useState<SyncStateInfo>({ status: 'idle', message: 'প্রস্তুত' });
  const [activeCategory, setActiveCategory] = useState<DeedCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitleBn, setNewTitleBn] = useState('');
  const [newCategory, setNewCategory] = useState<DeedCategory>('optional');
  const [newDescBn, setNewDescBn] = useState('');

  useEffect(() => {
    const unsub = subscribeToSyncState((info) => setSyncInfo(info));
    return () => unsub();
  }, []);

  const allDeeds = [...INITIAL_DEEDS, ...customDeeds];

  const filteredDeeds = allDeeds.filter((deed) => {
    const matchesCategory = activeCategory === 'all' || deed.category === activeCategory;
    const matchesQuery =
      searchQuery.trim() === '' ||
      deed.titleBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deed.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (deed.descriptionBn && deed.descriptionBn.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  const completedCount = deedsLog.completedDeedIds.length;
  const totalCount = allDeeds.length;

  const handleCreateDeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitleBn.trim()) return;

    const newDeed: DeedItem = {
      id: `custom_${Date.now()}`,
      category: newCategory,
      titleBn: newTitleBn.trim(),
      titleEn: newTitleBn.trim(),
      descriptionBn: newDescBn.trim() || undefined,
      isCustom: true,
      isObligatory: newCategory === 'obligatory',
    };

    onAddCustomDeed(newDeed);
    setNewTitleBn('');
    setNewDescBn('');
    setShowAddModal(false);
  };

  const CATEGORY_TABS: { id: DeedCategory | 'all'; labelBn: string; count: number }[] = [
    { id: 'all', labelBn: 'সব আমল', count: allDeeds.length },
    {
      id: 'obligatory',
      labelBn: 'A. ফরজ ইবাদত',
      count: allDeeds.filter((d) => d.category === 'obligatory').length,
    },
    {
      id: 'sunnah',
      labelBn: 'B. গুরুত্বপূর্ণ সুন্নাহ',
      count: allDeeds.filter((d) => d.category === 'sunnah').length,
    },
    {
      id: 'optional',
      labelBn: 'C. নফল ও নেক আমল',
      count: allDeeds.filter((d) => d.category === 'optional').length,
    },
    {
      id: 'character',
      labelBn: 'D. আত্মশুদ্ধি ও চরিত্র',
      count: allDeeds.filter((d) => d.category === 'character').length,
    },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Overview Progress Card */}
      <div className="clay-card-emerald p-6 rounded-3xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-amber-300 font-semibold tracking-wide uppercase">
                আজকের নেক আমল অগ্রগতি
              </span>
              {syncInfo.status === 'saving' && (
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold border border-amber-300/30 animate-pulse">
                  সংরক্ষণ হচ্ছে...
                </span>
              )}
              {syncInfo.status === 'saved' && (
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-emerald-100 text-[10px] font-bold border border-white/20">
                  ✓ ক্লাউডে সংরক্ষিত
                </span>
              )}
              {syncInfo.status === 'error' && (
                <button
                  onClick={() => syncInfo.retryFn?.()}
                  className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold hover:bg-rose-600 transition flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>ব্যর্থ (পুনরায় চেষ্টা)</span>
                </button>
              )}
            </div>
            <h3 className="text-2xl font-bold mt-1">
              {toBengaliNumber(totalCount)}টির মধ্যে {toBengaliNumber(completedCount)}টি আমল সম্পন্ন
            </h3>
            <p className="text-xs text-emerald-100/90 mt-1">
              ফরজ, সুন্নাহ ও চারিত্রিক উন্নতির মাধ্যমে আল্লাহর নৈকট্য অর্জন। (তারিখ: {currentDate})
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="self-start md:self-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ নতুন আমল যোগ করুন</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 w-full bg-black/20 rounded-full h-3 p-0.5 border border-white/10">
          <div
            className="bg-amber-400 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.round((completedCount / (totalCount || 1)) * 100)}%` }}
          />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="clay-card p-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="আমল খুঁজুন (যেমন: আয়াতুল কুরসী, ইস্তেগফার, গীবত...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-emerald-600"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {CATEGORY_TABS.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs transition cursor-pointer font-medium ${
                  isActive
                    ? 'bg-[#0F4C3A] text-white shadow-2xs font-semibold'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {cat.labelBn}
              </button>
            );
          })}
        </div>
      </div>

      {/* Deeds List */}
      <div className="space-y-3">
        {filteredDeeds.length === 0 ? (
          <div className="clay-card p-12 text-center text-stone-500 bg-white">
            <Layers className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="text-sm">কোনো আমল খুঁজে পাওয়া যায়নি।</p>
          </div>
        ) : (
          filteredDeeds.map((deed) => {
            const isCompleted = deedsLog.completedDeedIds.includes(deed.id);

            return (
              <div
                key={deed.id}
                onClick={() => onToggleDeed(deed.id)}
                className={`clay-card p-4 sm:p-5 transition-all cursor-pointer flex items-start gap-3.5 border ${
                  isCompleted
                    ? 'bg-emerald-50/50 border-emerald-300/80 shadow-xs'
                    : 'bg-white border-stone-200/80 hover:border-emerald-200'
                }`}
              >
                {/* Custom Checkbox */}
                <div className="mt-0.5 shrink-0">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-emerald-700 text-white shadow-2xs'
                        : 'border-2 border-stone-300 bg-stone-50 hover:border-emerald-600'
                    }`}
                  >
                    {isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h4
                      className={`text-sm sm:text-base font-bold font-bengali ${
                        isCompleted ? 'text-emerald-950 line-through opacity-85' : 'text-stone-900'
                      }`}
                    >
                      {deed.titleBn}
                    </h4>

                    {/* Category Label */}
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        deed.category === 'obligatory'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : deed.category === 'sunnah'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : deed.category === 'character'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-teal-100 text-teal-800 border border-teal-200'
                      }`}
                    >
                      {deed.category === 'obligatory'
                        ? 'ফরজ'
                        : deed.category === 'sunnah'
                        ? 'সুন্নাহ'
                        : deed.category === 'character'
                        ? 'চারিত্রিক'
                        : 'নফল (ঐচ্ছিক)'}
                    </span>

                    {deed.isCustom && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-200 text-stone-700">
                        ব্যক্তিগত
                      </span>
                    )}
                  </div>

                  {deed.descriptionBn && (
                    <p className="text-xs text-stone-600 leading-relaxed mb-2 font-bengali">
                      {deed.descriptionBn}
                    </p>
                  )}

                  {deed.reference && (
                    <div className="flex items-center gap-1 text-[11px] text-stone-400 font-medium">
                      <BookOpen className="w-3 h-3 text-emerald-700" />
                      <span>সূত্র: {deed.reference}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Custom Deed Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="clay-card p-6 bg-white max-w-md w-full shadow-2xl animate-in fade-in duration-200">
            <h3 className="text-lg font-bold text-stone-900 mb-4 font-bengali">
              + নতুন ব্যক্তিগত আমল যোগ করুন
            </h3>
            <form onSubmit={handleCreateDeed} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  আমলের নাম (বাংলায়)
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: প্রতিদিন ১ পৃষ্ঠা তাফসীর পাঠ"
                  value={newTitleBn}
                  onChange={(e) => setNewTitleBn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">ক্যাটাগরি</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as DeedCategory)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-emerald-600"
                >
                  <option value="optional">নফল ও সাধারণ আমল (ঐচ্ছিক)</option>
                  <option value="sunnah">সুন্নাহ আমল</option>
                  <option value="character">আত্মশুদ্ধি ও চারিত্রিক উন্নতি</option>
                  <option value="obligatory">ফরজ ইবাদত</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  সংক্ষিপ্ত বিবরণ / ফজিলত (ঐচ্ছিক)
                </label>
                <textarea
                  rows={2}
                  placeholder="নিয়মিত অভ্যাসের লক্ষ্য বা তাগিদ..."
                  value={newDescBn}
                  onChange={(e) => setNewDescBn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-medium"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
