import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Clock,
  Bell,
  Download,
  Trash2,
  Database,
  ShieldAlert,
  Check,
  Calendar,
  Sparkles,
  Save,
} from 'lucide-react';
import { UserSettings } from '../types';
import { isFirebaseConfigured, initFirebase } from '../lib/firebase';
import { exportAllUserData, deleteAllUserData } from '../services/dataService';

interface SettingsModalProps {
  uid: string;
  settings: UserSettings;
  onSaveSettings: (updated: UserSettings) => void;
  onClose: () => void;
  onOpenFirebaseGuide: () => void;
  onDataReset: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  uid,
  settings,
  onSaveSettings,
  onClose,
  onOpenFirebaseGuide,
  onDataReset,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'firebase' | 'data'>('profile');
  const [displayName, setDisplayName] = useState(settings.displayName || '');
  const [language, setLanguage] = useState(settings.language || 'bn');
  const [timezone, setTimezone] = useState(settings.timezone || 'Asia/Dhaka');
  const [ramadanDate, setRamadanDate] = useState(settings.ramadanTargetDate || '2027-02-09');
  const [quranGoal, setQuranGoal] = useState<number>(settings.quranDailyGoalPages || 2);

  // Notification states
  const [notifEnabled, setNotifEnabled] = useState(settings.notificationsEnabled || false);
  const [reminderTimes, setReminderTimes] = useState(settings.reminderTimes);

  // Custom Firebase fields
  const [fbApiKey, setFbApiKey] = useState(settings.customFirebaseConfig?.apiKey || '');
  const [fbProjectId, setFbProjectId] = useState(settings.customFirebaseConfig?.projectId || '');
  const [fbAuthDomain, setFbAuthDomain] = useState(settings.customFirebaseConfig?.authDomain || '');
  const [fbAppId, setFbAppId] = useState(settings.customFirebaseConfig?.appId || '');

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Sync internal state if settings change externally
  useEffect(() => {
    if (settings.displayName) {
      setDisplayName(settings.displayName);
    }
  }, [settings.displayName]);

  const handleRequestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('আপনার ব্রাউজার নোটিফিকেশন সাপোর্ট করে না।');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotifEnabled(true);
      new Notification('MY DEEN & LIFE', {
        body: 'সালাত ও নেক আমলের রিমাইন্ডার সক্রিয় করা হয়েছে।',
      });
    } else {
      setNotifEnabled(false);
    }
  };

  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaveStatus('saving');
    setSaveError(null);

    const updated: UserSettings = {
      ...settings,
      displayName: displayName.trim() || 'মুসাফির',
      language,
      timezone,
      ramadanTargetDate: ramadanDate,
      quranDailyGoalPages: quranGoal,
      notificationsEnabled: notifEnabled,
      reminderTimes,
    };

    if (fbApiKey && fbProjectId) {
      const fbConfig = {
        apiKey: fbApiKey.trim(),
        projectId: fbProjectId.trim(),
        authDomain: fbAuthDomain.trim() || `${fbProjectId.trim()}.firebaseapp.com`,
        appId: fbAppId.trim(),
      };
      updated.customFirebaseConfig = fbConfig;
      localStorage.setItem('my_deen_firebase_config', JSON.stringify(fbConfig));
      initFirebase(fbConfig);
    }

    try {
      await onSaveSettings(updated);
      setSaveStatus('saved');
      setTimeout(() => {
        setSaveStatus('idle');
        onClose();
      }, 1000);
    } catch (err: any) {
      setSaveStatus('error');
      setSaveError(err?.message || 'সেভ করার সময় একটি ত্রুটি হয়েছে');
    }
  };

  const handleExportJson = async () => {
    setExporting(true);
    try {
      const data = await exportAllUserData(uid);
      const blob = new Blob([data.json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my_deen_and_life_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } finally {
      setExporting(false);
    }
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const data = await exportAllUserData(uid);
      const blob = new Blob([data.csvPrayers], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my_salah_records_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAllData = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await deleteAllUserData(uid);
    onDataReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="clay-card bg-white max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <User className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-stone-900 text-base font-bengali">
              অ্যাপ সেটিংস ও ডাটা ব্যবস্থাপনা
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-stone-200 px-6 gap-3 bg-white text-xs font-semibold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 border-b-2 transition cursor-pointer ${
              activeTab === 'profile'
                ? 'border-emerald-700 text-emerald-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            প্রোফাইল ও লক্ষ্য
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-3 border-b-2 transition cursor-pointer ${
              activeTab === 'notifications'
                ? 'border-emerald-700 text-emerald-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            রিমাইন্ডার
          </button>
          <button
            onClick={() => setActiveTab('firebase')}
            className={`py-3 border-b-2 transition cursor-pointer ${
              activeTab === 'firebase'
                ? 'border-emerald-700 text-emerald-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            ফায়ারবেস সংযোগ
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`py-3 border-b-2 transition cursor-pointer ${
              activeTab === 'data'
                ? 'border-emerald-700 text-emerald-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            ডাটা এক্সপোর্ট ও সুরক্ষা
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2.5">
                <label className="block text-xs font-bold text-emerald-950 font-bengali">
                  আপনার নাম (ড্যাশবোর্ড ও সম্ভাষণে প্রদর্শিত হবে)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="যেমন: আব্দুর রহমান"
                    className="flex-1 px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleSaveAll}
                    disabled={saveStatus === 'saving'}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {saveStatus === 'saving' ? (
                      <span>সেভ হচ্ছে...</span>
                    ) : saveStatus === 'saved' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>সেভ হয়েছে!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>নাম সেভ করুন</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-stone-500">
                    এটি ক্লাউড ফায়ারস্টোর (<code className="font-mono text-[10px] bg-white px-1 rounded">users/{uid}/settings/profile</code>)-এ স্থায়ীভাবে সংরক্ষিত হয়।
                  </span>
                  {saveStatus === 'saved' && (
                    <span className="text-emerald-700 font-bold">✓ ক্লাউডে সংরক্ষিত</span>
                  )}
                  {saveStatus === 'error' && (
                    <span className="text-rose-600 font-bold">{saveError || 'ত্রুটি হয়েছে'}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">টাইমজোন</label>
                  <input
                    type="text"
                    disabled
                    value={timezone}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-100 text-xs text-stone-600 cursor-not-allowed"
                  />
                  <span className="text-[10px] text-stone-400 mt-0.5 block">ডিফল্ট: এশিয়া/ঢাকা (UTC+6)</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">ভাষা</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="bn">বাংলা (ডিফল্ট)</option>
                    <option value="banglish">বাংলা ও ব্যাংলিশ</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  রমাদান ১৪৪৮ হিজরির সম্ভাব্য শুরুর তারিখ (বাংলাদেশ)
                </label>
                <input
                  type="date"
                  value={ramadanDate}
                  onChange={(e) => setRamadanDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-emerald-600"
                />
                <span className="text-[10px] text-stone-500 mt-1 block">
                  ডিফল্ট: ৯ ফেব্রুয়ারি ২০২৭ (বিকল্প ৮ ফেব্রুয়ারি স্থানীয় চাঁদ দেখার ওপর নির্ভরশীল)।
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  দৈনিক কুরআন পাঠের লক্ষ্য (পৃষ্ঠায়)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={quranGoal}
                  onChange={(e) => setQuranGoal(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-emerald-950 font-bengali">
                    ব্রাউজার নোটিফিকেশন অনুমতি
                  </h4>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    সালাত ও সকাল-সন্ধ্যার জিকিরের সময়মত সতর্কবার্তা পেতে অনুমতি প্রদান করুন।
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRequestNotificationPermission}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                    notifEnabled ? 'bg-emerald-700 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {notifEnabled ? 'অনুমোদিত ✓' : 'অনুমতি দিন'}
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-stone-700 block">রিমাইন্ডার ফিল্টার:</span>
                {[
                  { id: 'fajr', label: 'ফজর সালাত রিমাইন্ডার' },
                  { id: 'dhuhr', label: 'যোহর সালাত রিমাইন্ডার' },
                  { id: 'asr', label: 'আসর সালাত রিমাইন্ডার' },
                  { id: 'maghrib', label: 'মাগরিব সালাত রিমাইন্ডার' },
                  { id: 'isha', label: 'ইশা সালাত রিমাইন্ডার' },
                  { id: 'adhkarMorning', label: 'সকালের মাসনূন জিকির' },
                  { id: 'adhkarEvening', label: 'সন্ধ্যার মাসনূন জিকির' },
                  { id: 'quran', label: 'দৈনিক কুরআন তিলাওয়াত' },
                ].map((item) => (
                  <label key={item.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-stone-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reminderTimes[item.id as keyof typeof reminderTimes] || false}
                      onChange={(e) =>
                        setReminderTimes({ ...reminderTimes, [item.id]: e.target.checked })
                      }
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs text-stone-800 font-medium">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'firebase' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed font-bengali flex items-start gap-2">
                <Database className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                <div>
                  <strong>ফায়ারবেস ক্লাউড ফায়ারস্টোর কনফিগারেশন:</strong>
                  <br />
                  আপনি চাইলে আপনার নিজস্ব ফায়ারবেস প্রজেক্টের ওয়েব কনফিগারেশন নিচে ইনপুট দিতে পারেন অথবা সেটআপ গাইড দেখতে পারেন।
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">API Key</label>
                <input
                  type="text"
                  placeholder="AIzaSy..."
                  value={fbApiKey}
                  onChange={(e) => setFbApiKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-mono text-stone-800 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Project ID</label>
                  <input
                    type="text"
                    placeholder="my-deen-1448"
                    value={fbProjectId}
                    onChange={(e) => setFbProjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-mono text-stone-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">App ID</label>
                  <input
                    type="text"
                    placeholder="1:123456789:web:abcdef"
                    value={fbAppId}
                    onChange={(e) => setFbAppId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-mono text-stone-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenFirebaseGuide}
                className="w-full py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition"
              >
                ফায়ারবেস সেটআপ ও সিকিউরিটি রুলস নির্দেশিকা দেখুন
              </button>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
                <h4 className="text-xs font-bold text-stone-800 font-bengali flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-700" />
                  <span>ব্যক্তিগত তথ্যের ব্যাকআপ এক্সপোর্ট (JSON ও CSV)</span>
                </h4>
                <p className="text-xs text-stone-600 font-bengali leading-relaxed">
                  আপনার সমস্ত সালাত এন্ট্রি, আমল হিস্ট্রি, কুরআন তিলাওয়াত রেকর্ড ও সেটিংস সম্পূর্ণ নিরাপদে ডাউনলোড করে সংরক্ষণ করুন।
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleExportJson}
                    disabled={exporting}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>সম্পূর্ণ ডাটা (JSON) এক্সপোর্ট</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCsv}
                    disabled={exporting}
                    className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center gap-1.5 transition border border-stone-200"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>সালাত রেকর্ড (CSV) এক্সপোর্ট</span>
                  </button>
                </div>
              </div>

              {/* Delete / Reset All Data with Confirmation */}
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                <h4 className="text-xs font-bold text-rose-900 font-bengali flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-rose-700" />
                  <span>ব্যক্তিগত ডাটা মুছে ফেলা (Data Reset)</span>
                </h4>
                <p className="text-xs text-rose-700 leading-relaxed font-bengali">
                  সতর্কতা: এটি আপনার সংরক্ষিত সমস্ত ব্যক্তিগত আমল ও সালাতের রেকর্ড স্থায়ীভাবে মুছে ফেলবে।
                </p>

                {confirmDelete ? (
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleDeleteAllData}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs"
                    >
                      হ্যাঁ, আমি নিশ্চিত সমস্ত ডাটা মুছে ফেলব
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-4 py-2 rounded-xl bg-white border border-stone-200 text-stone-700 text-xs font-medium hover:bg-stone-100"
                    >
                      বাতিল
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="px-4 py-2 rounded-xl bg-white border border-rose-300 text-rose-800 hover:bg-rose-100 text-xs font-semibold transition"
                  >
                    সমস্ত ডাটা রিসেট করুন
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
          <span className="text-[11px] text-stone-400">ব্যক্তিগত ইসলামিক ড্যাশবোর্ড</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-200 text-xs font-medium"
            >
              বন্ধ করুন
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saveStatus === 'saving'}
              className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {saveStatus === 'saving' ? (
                <span>সংরক্ষণ হচ্ছে...</span>
              ) : saveStatus === 'saved' ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>সংরক্ষিত!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>সেভ করুন</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
