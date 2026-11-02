import React, { useState, useEffect } from 'react';
import {
  Moon,
  Calendar,
  Clock,
  Bell,
  Mail,
  Send,
  Download,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Info,
  ShieldCheck,
  ChevronRight,
  RotateCcw,
  Sliders,
  History,
  MapPin,
  X,
} from 'lucide-react';
import {
  BangladeshHijriDateInfo,
  AyyamAlBidDates,
  FastingDayRecord,
  UserNotificationPreferences,
  MonthStartCorrectionAudit,
} from '../types/ayyam';
import {
  BANGLADESH_DISTRICTS,
  generateAyyamICalendar,
} from '../utils/ayyamCalculations';
import {
  getBangladeshHijriDateInfo,
  getCurrentAyyamAlBidSchedule,
  getFastingLogs,
  saveFastingLog,
  getNotificationPreferences,
  saveNotificationPreferences,
  triggerAyyamEmailAlert,
  getMonthCorrectionAudits,
  saveMonthCorrectionAudit,
} from '../services/ayyamService';
import { toBengaliNumber } from '../utils/hijriCalendar';

interface AyyamAlBidDashboardProps {
  uid: string;
  userEmail: string;
}

export const AyyamAlBidDashboard: React.FC<AyyamAlBidDashboardProps> = ({ uid, userEmail }) => {
  const [district, setDistrict] = useState('ঢাকা (Dhaka)');
  const [moonInfo, setMoonInfo] = useState<BangladeshHijriDateInfo | null>(null);
  const [ayyamSchedule, setAyyamSchedule] = useState<AyyamAlBidDates | null>(null);
  const [fastingLogs, setFastingLogs] = useState<Record<string, FastingDayRecord>>({});
  const [prefs, setPrefs] = useState<UserNotificationPreferences>({
    email: true,
    browserPush: true,
    inApp: true,
    advanceDays: 3,
    reminderTime: '20:30',
    preFajrSehriAlert: true,
    userEmail: userEmail || 'raiyan3945@gmail.com',
    district: 'ঢাকা (Dhaka)',
  });

  // Email alert sending state
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState<{ success: boolean; text: string } | null>(null);

  // Admin date correction modal
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [correctedStartDate, setCorrectedStartDate] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [auditList, setAuditList] = useState<MonthStartCorrectionAudit[]>([]);

  useEffect(() => {
    loadData();
  }, [district]);

  const loadData = async () => {
    const info = await getBangladeshHijriDateInfo(district);
    setMoonInfo(info);

    const schedule = await getCurrentAyyamAlBidSchedule(district);
    setAyyamSchedule(schedule);

    const logs = await getFastingLogs(uid);
    setFastingLogs(logs);

    const userPrefs = await getNotificationPreferences(uid);
    setPrefs({
      ...userPrefs,
      userEmail: userPrefs.userEmail || userEmail || 'raiyan3945@gmail.com',
    });

    const audits = await getMonthCorrectionAudits();
    setAuditList(audits);
  };

  const handleUpdateFastingStatus = async (
    dateStr: string,
    hijriDateStr: string,
    status: FastingDayRecord['status']
  ) => {
    const record: FastingDayRecord = {
      date: dateStr,
      hijriDateStr,
      fastingType: 'ayyam_al_bid',
      status,
      updatedAt: new Date().toISOString(),
    };
    await saveFastingLog(uid, record);
    setFastingLogs((prev) => ({ ...prev, [dateStr]: record }));
  };

  const handleSavePreferences = async (newPrefs: UserNotificationPreferences) => {
    setPrefs(newPrefs);
    await saveNotificationPreferences(uid, newPrefs);
  };

  const handleTriggerEmailAlert = async () => {
    if (!ayyamSchedule) return;
    setSendingEmail(true);
    setEmailStatusMsg(null);

    const res = await triggerAyyamEmailAlert(prefs.userEmail, ayyamSchedule, prefs.advanceDays);
    setSendingEmail(false);
    setEmailStatusMsg({ success: res.success, text: res.message });
  };

  const handleExportCalendar = () => {
    if (!ayyamSchedule) return;
    const icsContent = generateAyyamICalendar(ayyamSchedule);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ayyam_al_bid_${ayyamSchedule.hijriMonthNameBn}_1448.ics`;
    link.click();
  };

  const handleAdminCorrectMonth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctedStartDate || !ayyamSchedule) return;

    const audit: MonthStartCorrectionAudit = {
      id: `audit_${Date.now()}`,
      hijriMonth: ayyamSchedule.hijriMonth,
      hijriYear: ayyamSchedule.hijriYear,
      previousStartDate: ayyamSchedule.day13.gregorianDate,
      correctedStartDate,
      reason: correctionReason || 'ইসলামিক ফাউন্ডেশন চাঁদ দেখা কমিটির আনুষ্ঠানিক সিদ্ধান্ত',
      correctedBy: userEmail || 'Admin',
      correctedAt: new Date().toISOString(),
    };

    await saveMonthCorrectionAudit(audit);
    setShowAdminModal(false);
    setCorrectionReason('');
    loadData();
  };

  const handleRequestBrowserPermission = async () => {
    if (!('Notification' in window)) {
      alert('আপনার ব্রাউজার নোটিফিকেশন সাপোর্ট করে না।');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification('ধন্যবাদ!', { body: 'ব্রাউজার নোটিফিকেশন সফলভাবে চালু করা হয়েছে।' });
    }
    handleSavePreferences({ ...prefs, browserPush: permission === 'granted' });
  };

  const handleTestBrowserPop = () => {
    if (Notification.permission !== 'granted') {
      alert('দয়া করে প্রথমে ব্রাউজার নোটিফিকেশন পারমিশন দিন।');
      return;
    }
    new Notification('আইয়ামে বীজের রিমাইন্ডার টেস্ট', {
      body: 'আপনার ব্রাউজার পপআপ নোটিফিকেশন সঠিকভাবে কাজ করছে!',
      icon: '/favicon.ico'
    });
  };

  if (!moonInfo || !ayyamSchedule) {
    return (
      <div className="clay-card p-12 text-center text-stone-500 bg-white">
        <Moon className="w-8 h-8 animate-pulse text-emerald-700 mx-auto mb-2" />
        <p className="text-sm">বাংলাদেশ চাঁদ ও হিজরি ইন্টেলিজেন্স লোড হচ্ছে...</p>
      </div>
    );
  }

  // Calculate live countdown to first fasting day (day 13)
  const firstFastingDay = ayyamSchedule.day13.isProhibitedTashriq
    ? ayyamSchedule.day14
    : ayyamSchedule.day13;

  const targetDate = new Date(`${firstFastingDay.gregorianDate}T05:00:00+06:00`);
  const now = new Date();
  const diffHours = Math.round((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60));
  const daysRemaining = Math.max(0, Math.floor(diffHours / 24));
  const hoursRemaining = Math.max(0, diffHours % 24);

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Header Hero Card */}
      <div className="clay-card-emerald p-6 sm:p-8 rounded-3xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold mb-3">
              <Moon className="w-3.5 h-3.5" />
              <span>বাংলাদেশ চাঁদ ও হিজরি তারিখ ইন্টেলিজেন্স</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-bengali">
              আইয়ামে বীজের নফল সিয়াম (أيام البيض) ট্র্যাকার
            </h2>
            <p className="text-xs text-emerald-100/90 mt-1 max-w-xl leading-relaxed">
              প্রতি চন্দ্র মাসের ১৩, ১৪ ও ১৫ তারিখে আইয়ামে বীজের নফল সিয়াম পালনের মাধ্যমে সারা বছর রোজা রাখার সমান সওয়াব অর্জনের অনন্য সুন্নাহ।
            </p>
          </div>

          {/* District selector & Admin adjustment */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 self-start md:self-center">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-xs">
              <MapPin className="w-3.5 h-3.5 text-amber-300" />
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                {BANGLADESH_DISTRICTS.map((d) => (
                  <option key={d} value={d} className="text-stone-900">
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowAdminModal(true)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-amber-300 border border-white/20 transition flex items-center gap-1"
              title="তারিখ সংশোধন ও অডিট লগ"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>তারিখ অডিট</span>
            </button>
          </div>
        </div>

        {/* Live Countdown & Confirmation Status Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[11px] text-emerald-200">বর্তমান বাংলাদেশ হিজরি তারিখ</span>
            <div className="text-xl font-bold text-white mt-0.5">
              {toBengaliNumber(moonInfo.hijriDay)} {moonInfo.hijriMonthNameBn} {toBengaliNumber(moonInfo.hijriYear)} হিজরি
            </div>
            <span className="text-[10px] text-amber-300">
              {moonInfo.confirmationStatus === 'officially_confirmed'
                ? '✓ সরকারিভাবে ঘোষিত'
                : '• আবহাওয়া অধিদপ্তর অনুমিত'}
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[11px] text-emerald-200">আইয়ামে বীজ কাউন্টডাউন</span>
            <div className="text-xl font-bold text-amber-300 mt-0.5">
              {(() => {
                const dhakaTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
                const hours = dhakaTime.getHours();
                const isNight = hours >= 18; 

                // Note: moonInfo.hijriDay is ALREADY incremented if it is past sunset (Maghrib).
                if ([13, 14, 15].includes(moonInfo.hijriDay)) {
                  if (isNight) {
                    // It is the night OF the Hijri day. The fast for this Hijri day starts at Fajr tomorrow.
                    return `আগামীকাল ${toBengaliNumber(moonInfo.hijriDay)}ই ${moonInfo.hijriMonthNameBn} সুন্নাহ সিয়াম`;
                  }
                  // It is the daylight portion of the Hijri day.
                  return 'আজই সুন্নাহ সিয়াম পালনের দিন!';
                }
                
                if (daysRemaining > 0) {
                  return `${toBengaliNumber(daysRemaining)} দিন ${toBengaliNumber(hoursRemaining)} ঘণ্টা বাকি`;
                }
                
                return 'পরবর্তী সিয়ামের প্রস্তুতি নিন';
              })()}
            </div>
            <span className="text-[10px] text-emerald-300">
              {ayyamSchedule.hijriMonthNameBn} মাসের সূচি: {toBengaliNumber(13)}, {toBengaliNumber(14)}, {toBengaliNumber(15)} তারিখ
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[11px] text-emerald-200">তথ্যসূত্র ও ট্র্যাকিং</span>
            <div className="text-xs font-semibold text-white mt-1 truncate">
              {moonInfo.sourceName}
            </div>
            <span className="text-[10px] text-emerald-300">
              টাইমজোন: Asia/Dhaka • সূর্যাস্তে দিন শুরু
            </span>
          </div>
        </div>
      </div>

      {/* 2. Three Upcoming Fasting Dates Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-stone-900 text-base font-bengali">
            {ayyamSchedule.hijriMonthNameBn} মাসের আইয়ামে বীজ সিয়াম সূচি (১৩, ১৪ ও ১৫ তারিখ)
          </h3>
          <button
            onClick={handleExportCalendar}
            className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>ক্যালেন্ডার (.ics) এক্সপোর্ট</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { info: ayyamSchedule.day13, num: 13, title: `১৩ই ${ayyamSchedule.hijriMonthNameBn}` },
            { info: ayyamSchedule.day14, num: 14, title: `১৪ই ${ayyamSchedule.hijriMonthNameBn}` },
            { info: ayyamSchedule.day15, num: 15, title: `১৫ই ${ayyamSchedule.hijriMonthNameBn}` },
          ].map(({ info, num, title }) => {
            const currentLog = fastingLogs[info.gregorianDate];
            const status = currentLog?.status || 'not_recorded';

            return (
              <div
                key={num}
                className={`clay-card p-5 border transition-all ${
                  info.isProhibitedTashriq
                    ? 'bg-rose-50/70 border-rose-300'
                    : status === 'fasted'
                    ? 'bg-emerald-50/70 border-emerald-300 shadow-xs'
                    : status === 'planned'
                    ? 'bg-amber-50/70 border-amber-300'
                    : 'bg-white border-stone-200'
                }`}
              >
                <div className="flex items-center justify-between border-b border-stone-100 pb-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-emerald-700 text-white text-xs font-bold flex items-center justify-center">
                      {toBengaliNumber(num)}
                    </span>
                    <h4 className="font-bold text-stone-900 text-sm font-bengali">{title}</h4>
                  </div>
                  <span className="text-xs text-stone-500 font-medium">{info.weekdayBn}</span>
                </div>

                <div className="text-xs text-stone-600 mb-4 space-y-1">
                  <div>
                    <span className="font-semibold text-stone-700">ইংরেজি তারিখ: </span>
                    <span className="font-mono">{info.gregorianDate}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-stone-700">সেহরি শেষ (ফজর): </span>
                    <span>{ayyamSchedule.fajrSehriEnds} AM</span>
                  </div>
                  <div>
                    <span className="font-semibold text-stone-700">ইফতার (মাগরিব): </span>
                    <span>{ayyamSchedule.sunsetMaghribBegins} PM</span>
                  </div>
                </div>

                {/* TASHRIQ PROHIBITION BANNER */}
                {info.isProhibitedTashriq ? (
                  <div className="p-3 rounded-xl bg-rose-100/90 border border-rose-300 text-xs text-rose-900 leading-relaxed font-bengali">
                    <div className="flex items-center gap-1 font-bold text-rose-950 mb-1">
                      <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                      <span>আইয়ামে তাশরীক (সিয়াম নিষিদ্ধ)</span>
                    </div>
                    {info.tashriqReason}
                  </div>
                ) : (
                  /* Status Toggles: Planned, Fasted, Not Fasted, Unrecorded */
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-stone-500 block">আমার স্ট্যাটাস:</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => handleUpdateFastingStatus(info.gregorianDate, title, 'planned')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition ${
                          status === 'planned'
                            ? 'bg-amber-500 text-white border-amber-600'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        পরিকল্পিত
                      </button>

                      <button
                        onClick={() => handleUpdateFastingStatus(info.gregorianDate, title, 'fasted')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition ${
                          status === 'fasted'
                            ? 'bg-emerald-600 text-white border-emerald-700'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        ✓ সিয়াম সম্পন্ন
                      </button>

                      <button
                        onClick={() => handleUpdateFastingStatus(info.gregorianDate, title, 'not_fasted')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition ${
                          status === 'not_fasted'
                            ? 'bg-rose-500 text-white border-rose-600'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        রাখা হয়নি
                      </button>

                      <button
                        onClick={() => handleUpdateFastingStatus(info.gregorianDate, title, 'not_recorded')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition ${
                          status === 'not_recorded'
                            ? 'bg-stone-600 text-white border-stone-700'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        রেকর্ড নেই
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Advance Notification Center Settings */}
      <div className="clay-card p-6 bg-white border border-stone-200 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <Bell className="w-4 h-4" />
            </span>
            <div>
              <h4 className="font-bold text-stone-900 text-base font-bengali">
                স্বয়ংক্রিয় নোটিফিকেশন ও অগ্রিম অ্যালার্ট ব্যবস্থাপনা
              </h4>
              <p className="text-xs text-stone-500">
                ইমেইল, ব্রাউজার পুশ এবং ইন-অ্যাপ সতর্কবার্তা (এশিয়া/ঢাকা টাইমজোনে)
              </p>
            </div>
          </div>

          <button
            onClick={handleTriggerEmailAlert}
            disabled={sendingEmail}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 transition shadow-xs disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{sendingEmail ? 'ইমেইল পাঠানো হচ্ছে...' : 'এখনই টেস্ট ইমেইল অ্যালার্ট পাঠান'}</span>
          </button>
        </div>

        {emailStatusMsg && (
          <div
            className={`p-3 rounded-xl text-xs font-medium ${
              emailStatusMsg.success
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}
          >
            {emailStatusMsg.text}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Email toggle */}
          <div className="space-y-3">
            <label className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.email}
                onChange={(e) => handleSavePreferences({ ...prefs, email: e.target.checked })}
                className="mt-1 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <span className="text-xs font-bold text-stone-800 block">ট্রানজ্যাকশনাল ইমেইল অ্যালার্ট</span>
                <span className="text-[11px] text-stone-500 leading-relaxed block mt-0.5">
                  প্রাপক: <strong>{prefs.userEmail}</strong>
                </span>
              </div>
            </label>
          </div>

          {/* Browser push */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={prefs.browserPush}
                onChange={(e) => {
                  if (e.target.checked && Notification.permission !== 'granted') {
                    handleRequestBrowserPermission();
                  } else {
                    handleSavePreferences({ ...prefs, browserPush: e.target.checked });
                  }
                }}
                className="mt-1 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <span className="text-xs font-bold text-stone-800 block">ব্রাউজার পুশ নোটিফিকেশন</span>
                <span className="text-[11px] text-stone-500 leading-relaxed block mt-0.5">
                  ল্যাপটপ বা মোবাইলের স্ক্রিনে পপআপ সতর্কবার্তা
                </span>
              </div>
            </div>
            
            {prefs.browserPush && (
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleRequestBrowserPermission}
                  className="flex-1 py-1.5 rounded-lg bg-stone-200 text-stone-700 text-[10px] font-bold hover:bg-stone-300 transition"
                >
                  পারমিশন রিকোয়েস্ট
                </button>
                <button
                  onClick={handleTestBrowserPop}
                  className="flex-1 py-1.5 rounded-lg bg-stone-200 text-stone-700 text-[10px] font-bold hover:bg-stone-300 transition"
                >
                  টেস্ট পপআপ
                </button>
              </div>
            )}
          </div>

          {/* Advance days lead time */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
            <span className="text-xs font-bold text-stone-800 block mb-1">অগ্রিম রিমাইন্ডার সময়সীমা</span>
            <select
              value={prefs.advanceDays}
              onChange={(e) =>
                handleSavePreferences({ ...prefs, advanceDays: parseInt(e.target.value, 10) })
              }
              className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs text-stone-800 bg-white"
            >
              <option value={3}>৩ দিন আগে অগ্রিম সতর্কবার্তা (ডিফল্ট)</option>
              <option value={2}>২ দিন আগে অগ্রিম সতর্কবার্তা</option>
              <option value={1}>১ দিন আগে সতর্কতা</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Admin Correction & Audit Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="clay-card bg-white max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
              <h3 className="font-bold text-stone-900 text-base font-bengali">
                হিজরি মাস শুরুর তারিখ সংশোধন ও অডিট হিস্ট্রি
              </h3>
              <button
                onClick={() => setShowAdminModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdminCorrectMonth} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  বর্তমান মাস: {ayyamSchedule.hijriMonthNameBn} {ayyamSchedule.hijriYear} হিজরি
                </label>
                <input
                  type="date"
                  required
                  value={correctedStartDate}
                  onChange={(e) => setCorrectedStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-emerald-600"
                />
                <span className="text-[11px] text-stone-500 mt-1 block">
                  জাতীয় চাঁদ দেখা কমিটির সিদ্ধান্তের প্রেক্ষিতে মাসের ১ তারিখের সংশোধিত গ্রেগরিয়ান তারিখ নির্ধারণ করুন।
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">সংশোধনের কারণ ও রেফারেন্স</label>
                <textarea
                  rows={2}
                  required
                  placeholder="যেমন: ইসলামিক ফাউন্ডেশন বাংলাদেশ চাঁদ দেখা কমিটির প্রেস বিজ্ঞপ্তি..."
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
                >
                  তারিখ সংশোধন নিশ্চিত করুন
                </button>
              </div>
            </form>

            {/* Audit log list */}
            {auditList.length > 0 && (
              <div className="mt-6 pt-4 border-t border-stone-200 space-y-2">
                <h5 className="font-bold text-xs text-stone-700 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" />
                  <span>অতীতের সংশোধনী অডিট লগ ({auditList.length}টি)</span>
                </h5>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {auditList.map((a) => (
                    <div key={a.id} className="p-2.5 rounded-xl bg-stone-50 text-[11px] text-stone-700 border border-stone-200">
                      <div><strong>কারণ:</strong> {a.reason}</div>
                      <div className="text-stone-400 mt-0.5">সংশোধনকারী: {a.correctedBy} • {new Date(a.correctedAt).toLocaleDateString('bn-BD')}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
