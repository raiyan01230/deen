import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Sparkles,
  Info,
  ChevronRight,
  BookmarkCheck,
  Flame,
  RefreshCw,
} from 'lucide-react';
import { QuranLog, UserSettings } from '../types';
import { SURAH_LIST, SurahMeta } from '../utils/surahData';
import { toBengaliNumber } from '../utils/hijriCalendar';
import { subscribeToSyncState, SyncStateInfo } from '../services/dataService';

interface QuranTrackerProps {
  currentDate: string;
  quranLogs: QuranLog[];
  settings: UserSettings;
  onSaveLog: (log: QuranLog) => void;
  onDeleteLog: (logId: string) => void;
  onOpenAddModalDirect?: boolean;
}

export const QuranTracker: React.FC<QuranTrackerProps> = ({
  currentDate,
  quranLogs,
  settings,
  onSaveLog,
  onDeleteLog,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [syncInfo, setSyncInfo] = useState<SyncStateInfo>({ status: 'idle', message: 'প্রস্তুত' });
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(1);
  const [ayahStart, setAyahStart] = useState<string>('1');
  const [ayahEnd, setAyahEnd] = useState<string>('7');
  const [pageStart, setPageStart] = useState<string>('1');
  const [pageEnd, setPageEnd] = useState<string>('1');
  const [pagesCount, setPagesCount] = useState<string>('1');
  const [durationMinutes, setDurationMinutes] = useState<string>('15');
  const [reflection, setReflection] = useState<string>('');
  const [readingDate, setReadingDate] = useState<string>(currentDate);

  useEffect(() => {
    const unsub = subscribeToSyncState((info) => setSyncInfo(info));
    return () => unsub();
  }, []);

  // Stats calculation
  const totalLogsCount = quranLogs.length;
  const totalPagesRead = quranLogs.reduce((acc, curr) => acc + (curr.pagesCount || 0), 0);
  const totalMinutesSpent = quranLogs.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);

  // Today's reading
  const todayLogs = quranLogs.filter((l) => l.date === currentDate);
  const todayPages = todayLogs.reduce((acc, curr) => acc + (curr.pagesCount || 0), 0);

  const handleSurahSelect = (num: number) => {
    setSelectedSurahNumber(num);
    const s = SURAH_LIST.find((item) => item.number === num);
    if (s) {
      setAyahStart('1');
      setAyahEnd(String(s.totalAyahs));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const surah = SURAH_LIST.find((s) => s.number === selectedSurahNumber) || SURAH_LIST[0];

    const newLog: QuranLog = {
      id: `quran_${Date.now()}`,
      date: readingDate,
      surahNumber: surah.number,
      surahNameBn: surah.nameBn,
      surahNameAr: surah.nameAr,
      ayahStart: ayahStart ? parseInt(ayahStart, 10) : undefined,
      ayahEnd: ayahEnd ? parseInt(ayahEnd, 10) : undefined,
      pageStart: pageStart ? parseInt(pageStart, 10) : undefined,
      pageEnd: pageEnd ? parseInt(pageEnd, 10) : undefined,
      pagesCount: Math.max(1, parseInt(pagesCount, 10) || 1),
      durationMinutes: Math.max(1, parseInt(durationMinutes, 10) || 10),
      reflection: reflection.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onSaveLog(newLog);
    setShowModal(false);
    setReflection('');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="clay-card-emerald p-6 rounded-3xl text-white relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>কুরআন তিলাওয়াত ও তাদাব্বুর (তন্ময় অনুধাবন)</span>
              </div>
              {syncInfo.status === 'saving' && (
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold border border-amber-300/30 animate-pulse">
                  সংরক্ষণ হচ্ছে...
                </span>
              )}
              {syncInfo.status === 'saved' && (
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-emerald-100 text-[10px] font-bold border border-white/20">
                  ✓ সংরক্ষিত
                </span>
              )}
              {syncInfo.status === 'error' && (
                <button
                  onClick={() => syncInfo.retryFn?.()}
                  className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold hover:bg-rose-600 transition flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>পুনরায় চেষ্টা</span>
                </button>
              )}
            </div>
            <h2 className="text-2xl font-bold font-bengali">
              কুরআন পাঠ ট্র্যাকার ও নোটবুক
            </h2>
            <p className="text-xs text-emerald-100/90 mt-1 max-w-xl">
              প্রতিদিনের তিলাওয়াত সংরক্ষণ করুন, কুরআনের বাণীর গভীর ভাবার্থ নিয়ে চিন্তা করুন এবং নিয়মিত ধারাবাহিক অভ্যাস গড়ে তুলুন।
            </p>
          </div>

          <button
            onClick={() => {
              setReadingDate(currentDate);
              setShowModal(true);
            }}
            className="self-start md:self-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-2 transition shadow-sm cursor-pointer z-10"
          >
            <Plus className="w-4 h-4" />
            <span>+ তিলাওয়াত রেকর্ড যোগ করুন</span>
          </button>
        </div>

        {/* 3 Metric Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-4 border-t border-white/10">
          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[11px] text-emerald-200">আজকের তিলাওয়াত</span>
            <div className="text-xl font-bold text-white mt-0.5">
              {toBengaliNumber(todayPages)} / {toBengaliNumber(settings.quranDailyGoalPages)} পৃষ্ঠা
            </div>
            <span className="text-[10px] text-amber-300">
              {todayPages >= settings.quranDailyGoalPages ? 'দৈনিক লক্ষ্য অর্জিত ✓' : 'দৈনিক লক্ষ্য বাকি'}
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[11px] text-emerald-200">সর্বমোট পঠিত পৃষ্ঠা</span>
            <div className="text-xl font-bold text-white mt-0.5">
              {toBengaliNumber(totalPagesRead)} পৃষ্ঠা
            </div>
            <span className="text-[10px] text-emerald-300">
              মোট সেশন: {toBengaliNumber(totalLogsCount)}টি
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[11px] text-emerald-200">মোট তিলাওয়াত সময়</span>
            <div className="text-xl font-bold text-white mt-0.5">
              {toBengaliNumber(totalMinutesSpent)} মিনিট
            </div>
            <span className="text-[10px] text-emerald-300">
              আল্লাহর কালামের সাথে কাটানো সময়
            </span>
          </div>
        </div>
      </div>

      {/* Respectful Guidance Note */}
      <div className="clay-card p-4 bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-900 leading-relaxed font-bengali">
          <strong>মনে রাখবেন:</strong> পৃষ্ঠার সংখ্যা কেবল আপনার ব্যক্তিগত ধারাবাহিক অভ্যাসের রেকর্ড মাত্র; তা কখনোই আধ্যাত্মিক অর্জন বা শ্রেষ্ঠত্বের পরিমাপক নয়। তিলাওয়াতের মূল উদ্দেশ্য হলো তাজবীদসহ বিশুদ্ধ পাঠ এবং অর্থ ও শিক্ষার ওপর আমল করা।
        </p>
      </div>

      {/* Reading Logs History */}
      <div className="clay-card p-5 bg-white">
        <h3 className="text-base font-bold text-stone-900 mb-4 font-bengali flex items-center justify-between">
          <span>সাম্প্রতিক তিলাওয়াত ইতিহাস</span>
          <span className="text-xs font-normal text-stone-500">
            সর্বমোট {toBengaliNumber(quranLogs.length)}টি এন্ট্রি
          </span>
        </h3>

        {quranLogs.length === 0 ? (
          <div className="text-center py-12 text-stone-400">
            <BookOpen className="w-10 h-10 mx-auto text-stone-300 mb-2" />
            <p className="text-sm">এখনো কোনো তিলাওয়াত রেকর্ড যোগ করা হয়নি।</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-3 text-xs text-emerald-700 font-semibold underline"
            >
              প্রথম তিলাওয়াত এন্ট্রি যোগ করুন
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {quranLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-2xl bg-stone-50/70 border border-stone-200 hover:border-emerald-200 transition flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center justify-center shrink-0">
                      {toBengaliNumber(log.surahNumber)}
                    </span>
                    <h4 className="font-bold text-stone-900 text-sm font-bengali">
                      সূরা {log.surahNameBn} ({log.surahNameAr})
                    </h4>
                    {log.ayahStart && log.ayahEnd && (
                      <span className="text-xs text-stone-500 font-medium">
                        • আয়াত {toBengaliNumber(log.ayahStart)}-{toBengaliNumber(log.ayahEnd)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 mt-1.5 ml-8">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      {log.date}
                    </span>
                    <span>• {toBengaliNumber(log.pagesCount)} পৃষ্ঠা</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      {toBengaliNumber(log.durationMinutes)} মিনিট
                    </span>
                  </div>

                  {log.reflection && (
                    <div className="mt-2.5 ml-8 p-3 rounded-xl bg-white border border-stone-200 text-xs text-stone-700 font-bengali leading-relaxed">
                      <span className="font-semibold text-emerald-900">ব্যক্তিগত তাদাব্বুর ও শিক্ষা: </span>
                      {log.reflection}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end md:self-center ml-8 md:ml-0">
                  <button
                    onClick={() => onDeleteLog(log.id)}
                    className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="রেকর্ড মুছুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Reading Session Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="clay-card p-6 bg-white max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in duration-200">
            <h3 className="text-lg font-bold text-stone-900 mb-4 font-bengali flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-800" />
              <span>+ কুরআন তিলাওয়াত রেকর্ড সংরক্ষণ</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">তিলাওয়াতের তারিখ</label>
                <input
                  type="date"
                  value={readingDate}
                  onChange={(e) => setReadingDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Surah Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  সূরা নির্বাচন করুন (১-১১৪)
                </label>
                <select
                  value={selectedSurahNumber}
                  onChange={(e) => handleSurahSelect(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-emerald-600"
                >
                  {SURAH_LIST.map((s) => (
                    <option key={s.number} value={s.number}>
                      {s.number}. সূরা {s.nameBn} - {s.nameAr} ({s.nameEn}) • {s.totalAyahs} আয়াত • {s.type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ayah Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">শুরুর আয়াত</label>
                  <input
                    type="number"
                    min="1"
                    value={ayahStart}
                    onChange={(e) => setAyahStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">শেষের আয়াত</label>
                  <input
                    type="number"
                    min="1"
                    value={ayahEnd}
                    onChange={(e) => setAyahEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Pages & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">পঠিত পৃষ্ঠার সংখ্যা</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={pagesCount}
                    onChange={(e) => setPagesCount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">সময়কাল (মিনিটে)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Personal Reflection */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ব্যক্তিগত তাদাব্বুর / আয়াত থেকে শিক্ষা (ঐচ্ছিক)
                </label>
                <textarea
                  rows={3}
                  placeholder="আয়াতের যে শিক্ষাটি আজকে আপনার মনে গভীরভাবে প্রভাব ফেলেছে..."
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-emerald-600 font-bengali"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
          </div>
        </div>
      )}
    </div>
  );
};
