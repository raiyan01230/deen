import React, { useState } from 'react';
import {
  X,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  Download,
  Upload,
  BookOpen,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { HadithRecord, HadithCollection } from '../types/hadith';
import { filterHadiths, saveHadithRecord } from '../services/hadithService';

interface HadithAdminModalProps {
  hadiths: HadithRecord[];
  onHadithUpdated: (all: HadithRecord[]) => void;
  onClose: () => void;
  uid?: string;
}

export const HadithAdminModal: React.FC<HadithAdminModalProps> = ({
  hadiths,
  onHadithUpdated,
  onClose,
  uid,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [collectionFilter, setCollectionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'unreviewed'>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // New Hadith Form state
  const [collection, setCollection] = useState<HadithCollection>('Sahih al-Bukhari');
  const [hadithNumber, setHadithNumber] = useState('');
  const [inBookRef, setInBookRef] = useState('');
  const [narrator, setNarrator] = useState('');
  const [gradingAuthority, setGradingAuthority] = useState('ইমাম আল-বুখারী (র.)');
  const [topic, setTopic] = useState('ইমান ও বিশ্বাস');
  const [arabic, setArabic] = useState('');
  const [bengali, setBengali] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [translatorInfo, setTranslatorInfo] = useState('ইসলামিক ফাউন্ডেশন বাংলাদেশ');
  const [isVerified, setIsVerified] = useState(true);

  const filtered = filterHadiths(hadiths, {
    searchQuery,
    collection: collectionFilter,
    verificationStatus: statusFilter,
  });

  const verifiedCount = hadiths.filter((h) => h.verificationStatus === 'verified').length;

  const handleCreateHadith = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arabic.trim() || !bengali.trim() || !narrator.trim() || !hadithNumber.trim()) {
      alert('দয়া করে সমস্ত আবশ্যকীয় তথ্য পূরণ করুন।');
      return;
    }

    const newRecord: HadithRecord = {
      id: `hadith_${Date.now()}`,
      collection,
      hadithNumber: hadithNumber.trim(),
      inBookReference: inBookRef.trim() || `Hadith ${hadithNumber.trim()}`,
      authenticityGrade: 'সহীহ (Sahih)',
      gradingAuthority: gradingAuthority.trim(),
      sourceUrl: sourceUrl.trim() || `https://sunnah.com/`,
      topic: topic.trim(),
      narrator: narrator.trim(),
      arabic: arabic.trim(),
      bengali: bengali.trim(),
      translatorInfo: translatorInfo.trim(),
      verificationStatus: isVerified ? 'verified' : 'unreviewed',
      createdAt: new Date().toISOString(),
    };

    await saveHadithRecord(newRecord, uid);
    onHadithUpdated([...hadiths, newRecord]);
    setShowAddForm(false);
    // Reset
    setArabic('');
    setBengali('');
    setNarrator('');
    setHadithNumber('');
    setSourceUrl('');
  };

  const handleToggleStatus = async (hadith: HadithRecord) => {
    const updated: HadithRecord = {
      ...hadith,
      verificationStatus: hadith.verificationStatus === 'verified' ? 'unreviewed' : 'verified',
    };
    await saveHadithRecord(updated, uid);
    onHadithUpdated(hadiths.map((h) => (h.id === hadith.id ? updated : h)));
  };

  const handleExportJson = () => {
    const dataStr = JSON.stringify(hadiths, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sahih_hadith_library_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="clay-card bg-white max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 bg-stone-50">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800 shadow-2xs">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-stone-900 text-base font-bengali">
                  সহীহ হাদিস লাইব্রেরি ও নিরীক্ষণ ইন্টারফেস
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                  যাচাইকৃত: {verifiedCount}টি / মোট: {hadiths.length}টি
                </span>
              </div>
              <p className="text-xs text-stone-500">
                সহীহ বুখারী ও সহীহ মুসলিম অগ্রাধিকারপ্রাপ্ত • নির্ভরযোগ্য সনদ ও নির্ভরযোগ্য অনুবাদ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'তালিকায় ফিরুন' : '+ নতুন হাদিস যোগ'}</span>
            </button>
            <button
              onClick={handleExportJson}
              className="p-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-600 transition"
              title="JSON এক্সপোর্ট"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {showAddForm ? (
            /* Add New Hadith Form */
            <form onSubmit={handleCreateHadith} className="space-y-4 max-w-2xl mx-auto">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed font-bengali flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                <span>
                  <strong>হাদিস শুদ্ধতা নীতি:</strong> হাদিসের টেক্সট বা অনুবাদ কখনোই অনুমান দ্বারা তৈরি করা যাবে না। নির্ভরযোগ্য গ্রন্থ বা Sunnah.com থেকে হুবহু মিলিয়ে সনদ ও নম্বর যাচাই করে এন্ট্রি দিন।
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">গ্রন্থ (Collection)</label>
                  <select
                    value={collection}
                    onChange={(e) => {
                      setCollection(e.target.value as HadithCollection);
                      if (e.target.value === 'Sahih al-Bukhari') setGradingAuthority('ইমাম আল-বুখারী (র.)');
                      else if (e.target.value === 'Sahih Muslim') setGradingAuthority('ইমাম মুসলিম (র.)');
                      else setGradingAuthority('শায়খ আল-আলবানী (র.)');
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="Sahih al-Bukhari">Sahih al-Bukhari (সহীহ বুখারী)</option>
                    <option value="Sahih Muslim">Sahih Muslim (সহীহ মুসলিম)</option>
                    <option value="Jami` at-Tirmidhi">Jami` at-Tirmidhi (জামে আত-তিরমিযী)</option>
                    <option value="Sunan an-Nasa'i">Sunan an-Nasa'i (সুনান আন-নাসায়ী)</option>
                    <option value="Sunan Abi Dawud">Sunan Abi Dawud (সুনান আবু দাউদ)</option>
                    <option value="Sunan Ibn Majah">Sunan Ibn Majah (সুনান ইবনে মাজাহ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">হাদিস নম্বর</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: 1, 13, 6405"
                    value={hadithNumber}
                    onChange={(e) => setHadithNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">বর্ণনাকারী (সাহাবী)</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: হযরত আবু হুরায়রা (রা.)"
                    value={narrator}
                    onChange={(e) => setNarrator(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">তাহকীক ও সনদের মান</label>
                  <input
                    type="text"
                    required
                    value={gradingAuthority}
                    onChange={(e) => setGradingAuthority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">আরবি মূল মতন (Harakat সহ Unicode)</label>
                <textarea
                  rows={3}
                  required
                  dir="rtl"
                  placeholder="আরবি ইবারত লিখুন বা পেস্ট করুন..."
                  value={arabic}
                  onChange={(e) => setArabic(e.target.value)}
                  className="font-arabic w-full p-3 rounded-xl border border-stone-200 text-base text-right text-emerald-950 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">বিশুদ্ধ বাংলা অনুবাদ</label>
                <textarea
                  rows={3}
                  required
                  placeholder="বাংলা অনুবাদ লিখুন..."
                  value={bengali}
                  onChange={(e) => setBengali(e.target.value)}
                  className="w-full p-3 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-emerald-600 font-bengali"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">বিষয় / টপিক</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: সালাত, চরিত্র, ইমান"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">অনুবাদ উৎস / লাইসেন্স</label>
                  <input
                    type="text"
                    required
                    value={translatorInfo}
                    onChange={(e) => setTranslatorInfo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">মূল যাচাই লিঙ্ক (Sunnah.com URL)</label>
                <input
                  type="url"
                  placeholder="https://sunnah.com/bukhari:1"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="markVerified"
                  checked={isVerified}
                  onChange={(e) => setIsVerified(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="markVerified" className="text-xs text-stone-800 font-medium">
                  এই হাদিসটির আরবি ও বঙ্গানুবাদ সম্পূর্ণ নিরীক্ষিত ও যাচাইকৃত হিসেবে চিহ্নিত করুন
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-medium"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          ) : (
            /* Hadith Records Table / List */
            <>
              {/* Search & Filters */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="হাদিস নম্বর, বর্ণনাকারী বা শব্দ খুঁজুন..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={collectionFilter}
                    onChange={(e) => setCollectionFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-700 bg-white"
                  >
                    <option value="all">সব গ্রন্থ</option>
                    <option value="Sahih al-Bukhari">সহীহ বুখারী</option>
                    <option value="Sahih Muslim">সহীহ মুসলিম</option>
                    <option value="Jami` at-Tirmidhi">তিরমিযী</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-700 bg-white"
                  >
                    <option value="all">সব স্ট্যাটাস</option>
                    <option value="verified">শুধুমাত্র যাচাইকৃত</option>
                    <option value="unreviewed">অনিরীক্ষিত</option>
                  </select>
                </div>
              </div>

              {/* Records List */}
              <div className="space-y-3 pt-2">
                {filtered.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-stone-50 border border-stone-200 hover:border-emerald-200 transition space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-emerald-950">
                          {item.collection} #{item.hadithNumber}
                        </span>
                        <span className="text-xs text-stone-500">• {item.narrator}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-200 text-stone-700">
                          {item.topic}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(item)}
                          className={`text-xs px-2.5 py-1 rounded-lg font-semibold border transition ${
                            item.verificationStatus === 'verified'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {item.verificationStatus === 'verified' ? '✓ যাচাইকৃত' : 'অনিরীক্ষিত'}
                        </button>
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-stone-400 hover:text-emerald-700"
                          title="Sunnah.com এ দেখুন"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    <p className="font-arabic text-sm text-[#0F4C3A] font-semibold text-right leading-loose">
                      {item.arabic.substring(0, 160)}...
                    </p>
                    <p className="text-xs text-stone-800 leading-relaxed font-bengali">
                      {item.bengali.substring(0, 180)}...
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-500">
          <span>মোট লোডকৃত হাদিস: {hadiths.length}টি (যাচাইকৃত: {verifiedCount}টি)</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold transition"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
