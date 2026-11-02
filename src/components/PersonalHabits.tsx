import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  Trash2,
  CheckCircle2,
  BookMarked,
  Brain,
  Activity,
  Clock,
  Home,
  Heart,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { PersonalHabit } from '../types';
import { getDhakaDateString, toBengaliNumber } from '../utils/hijriCalendar';
import { subscribeToSyncState, SyncStateInfo } from '../services/dataService';

interface PersonalHabitsProps {
  currentDate: string;
  habits: PersonalHabit[];
  onSaveHabit: (habit: PersonalHabit) => void;
  onDeleteHabit: (habitId: string) => void;
}

export const PersonalHabits: React.FC<PersonalHabitsProps> = ({
  currentDate,
  habits,
  onSaveHabit,
  onDeleteHabit,
}) => {
  const [syncInfo, setSyncInfo] = useState<SyncStateInfo>({ status: 'idle', message: 'প্রস্তুত' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [titleBn, setTitleBn] = useState('');
  const [category, setCategory] = useState<PersonalHabit['category']>('knowledge');
  const [frequency, setFrequency] = useState('দৈনিক');

  useEffect(() => {
    const unsub = subscribeToSyncState((info) => setSyncInfo(info));
    return () => unsub();
  }, []);

  // Past 7 days array for tracking
  const last7Days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push(getDhakaDateString(d));
  }

  const handleToggleHabitDay = (habit: PersonalHabit, dateStr: string) => {
    const isDone = habit.completedDates.includes(dateStr);
    const updatedDates = isDone
      ? habit.completedDates.filter((d) => d !== dateStr)
      : [...habit.completedDates, dateStr];

    onSaveHabit({
      ...habit,
      completedDates: updatedDates,
    });
  };

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleBn.trim()) return;

    const newHabit: PersonalHabit = {
      id: `habit_${Date.now()}`,
      titleBn: titleBn.trim(),
      category,
      targetFrequency: frequency,
      completedDates: [],
      createdAt: new Date().toISOString(),
    };

    onSaveHabit(newHabit);
    setTitleBn('');
    setShowAddModal(false);
  };

  const CATEGORY_ICONS: Record<PersonalHabit['category'], { label: string; icon: any }> = {
    study: { label: 'ইসলামিক ও সাধারণ অধ্যয়ন', icon: Brain },
    knowledge: { label: 'উপকারী ইলম অর্জন', icon: BookMarked },
    reading: { label: 'বই ও তাফসীর অধ্যয়ন', icon: BookMarked },
    fitness: { label: 'শারীরিক সুস্থতা ও হাঁটা', icon: Activity },
    time: { label: 'সময়ানুবর্তিতা ও সময় ব্যবস্থাপনা', icon: Clock },
    family: { label: 'পারিবারিক দায়দায়িত্ব', icon: Home },
    character: { label: 'উত্তম ব্যবহার ও আখলাক', icon: Heart },
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="clay-card-emerald p-6 rounded-3xl text-white relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold">
                <Target className="w-3.5 h-3.5" />
                <span>জীবনের সামগ্রিক ভারসাম্য ও অভ্যাস উন্নয়ন</span>
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
              ব্যক্তিগত বিকাশ ও রুটিন ব্যবস্থাপনা
            </h2>
            <p className="text-xs text-emerald-100/90 mt-1 max-w-xl leading-relaxed">
              ইলম অর্জন, সুস্থ দেহ ও সময়ানুবর্তিতার মাধ্যমে এক সচেতন ও আল্লাহর প্রতি নিবেদিত মুসলিম হিসেবে নিজের জীবন পরিচালনা করুন।
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="self-start md:self-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-2 transition shadow-sm cursor-pointer z-10"
          >
            <Plus className="w-4 h-4" />
            <span>+ নতুন লক্ষ্য যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* Habits Table / Cards */}
      <div className="clay-card p-5 bg-white">
        <div className="flex items-center justify-between mb-4 border-b border-stone-100 pb-3">
          <h3 className="text-base font-bold text-stone-900 font-bengali">
            গত ৭ দিনের ধারাবাহিকতা চার্ট
          </h3>
          <span className="text-xs text-stone-400">ক্লিক করে সম্পন্ন চিহ্নিত করুন</span>
        </div>

        {habits.length === 0 ? (
          <div className="text-center py-12 text-stone-400">
            <Target className="w-10 h-10 mx-auto text-stone-300 mb-2" />
            <p className="text-sm">এখনো কোনো ব্যক্তিগত অভ্যাস লক্ষ্য যোগ করা হয়নি।</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-3 text-xs text-emerald-700 font-semibold underline"
            >
              প্রথম লক্ষ্যটি যোগ করুন
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {habits.map((habit) => {
              const catMeta = CATEGORY_ICONS[habit.category] || CATEGORY_ICONS.knowledge;
              const Icon = catMeta.icon;

              return (
                <div
                  key={habit.id}
                  className="p-4 rounded-2xl bg-stone-50 border border-stone-200 hover:border-emerald-200 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3 min-w-[220px]">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-stone-900 font-bengali">
                        {habit.titleBn}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-stone-500">{catMeta.label}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-200 text-stone-700">
                          {habit.targetFrequency}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 7-Day Completion Bubbles */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {last7Days.map((dStr) => {
                      const isDone = habit.completedDates.includes(dStr);
                      const isToday = dStr === currentDate;
                      const dayName = new Date(dStr).toLocaleDateString('bn-BD', { weekday: 'narrow' });

                      return (
                        <button
                          key={dStr}
                          onClick={() => handleToggleHabitDay(habit, dStr)}
                          className={`w-8 h-8 rounded-xl flex flex-col items-center justify-center text-xs transition cursor-pointer border ${
                            isDone
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs font-bold'
                              : isToday
                              ? 'bg-white border-emerald-400 text-stone-700 hover:bg-emerald-50'
                              : 'bg-white border-stone-200 text-stone-400 hover:bg-stone-100'
                          }`}
                          title={`${dStr}: ক্লিক করে সম্পন্ন চিহ্নিত করুন`}
                        >
                          <span className="text-[9px] opacity-75 leading-none">{dayName}</span>
                          <span className="text-[10px] leading-tight">{isDone ? '✓' : '•'}</span>
                        </button>
                      );
                    })}

                    <button
                      onClick={() => onDeleteHabit(habit.id)}
                      className="p-1.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition ml-2"
                      title="মুছুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Habit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="clay-card p-6 bg-white max-w-md w-full shadow-2xl animate-in fade-in duration-200">
            <h3 className="text-lg font-bold text-stone-900 mb-4 font-bengali">
              + নতুন ব্যক্তিগত অভ্যাস লক্ষ্য যোগ করুন
            </h3>
            <form onSubmit={handleCreateHabit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  অভ্যাসের শিরোনাম (বাংলায়)
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: প্রতিদিন ৩০ মিনিট সুন্নাহ গ্রন্থ অধ্যয়ন"
                  value={titleBn}
                  onChange={(e) => setTitleBn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">বিভাগ</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as PersonalHabit['category'])}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-emerald-600"
                >
                  <option value="knowledge">উপকারী ইলম অর্জন</option>
                  <option value="study">ইসলামিক ও সাধারণ অধ্যয়ন</option>
                  <option value="reading">দৈনন্দিন বই পড়া</option>
                  <option value="fitness">শারীরিক সুস্থতা ও হাঁটা</option>
                  <option value="time">সময়ানুবর্তিতা ও সময় ব্যবস্থাপনা</option>
                  <option value="family">পারিবারিক দায়দায়িত্ব ও মা-বাবার খেদমত</option>
                  <option value="character">উত্তম আখলাক</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">ফ্রিকোয়েন্সি</label>
                <input
                  type="text"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
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
