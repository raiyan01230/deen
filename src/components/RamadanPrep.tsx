import React, { useState, useEffect } from 'react';
import {
  Moon,
  Clock,
  Calendar,
  CheckCircle2,
  Sparkles,
  Info,
  BookOpen,
  Heart,
  Flame,
  ArrowRight,
  Sun,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';
import { RamadanLog, UserSettings } from '../types';
import { calculateRamadanCountdown, toBengaliNumber, RamadanCountdown } from '../utils/hijriCalendar';
import { subscribeToSyncState, SyncStateInfo } from '../services/dataService';

interface RamadanPrepProps {
  currentDate: string;
  settings: UserSettings;
  ramadanLog: RamadanLog;
  onSaveRamadanLog: (updated: RamadanLog) => void;
  onOpenSettings: () => void;
}

export const RamadanPrep: React.FC<RamadanPrepProps> = ({
  currentDate,
  settings,
  ramadanLog,
  onSaveRamadanLog,
  onOpenSettings,
}) => {
  const [syncInfo, setSyncInfo] = useState<SyncStateInfo>({ status: 'idle', message: 'প্রস্তুত' });
  const [countdown, setCountdown] = useState<RamadanCountdown>(
    calculateRamadanCountdown(settings.ramadanTargetDate)
  );
  const [activeTab, setActiveTab] = useState<'prep_plan' | 'daily_tracker' | 'last_ten_nights'>('prep_plan');

  useEffect(() => {
    const unsub = subscribeToSyncState((info) => setSyncInfo(info));
    return () => unsub();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(calculateRamadanCountdown(settings.ramadanTargetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [settings.ramadanTargetDate]);

  const handleToggleFasting = () => {
    onSaveRamadanLog({
      ...ramadanLog,
      fasted: !ramadanLog.fasted,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleToggleSehri = () => {
    onSaveRamadanLog({
      ...ramadanLog,
      sehriRecorded: !ramadanLog.sehriRecorded,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleToggleIftar = () => {
    onSaveRamadanLog({
      ...ramadanLog,
      iftarRecorded: !ramadanLog.iftarRecorded,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSetTaraweeh = (rakats: number) => {
    onSaveRamadanLog({
      ...ramadanLog,
      taraweehRakats: ramadanLog.taraweehRakats === rakats ? 0 : rakats,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleToggleCharity = () => {
    onSaveRamadanLog({
      ...ramadanLog,
      charityGiven: !ramadanLog.charityGiven,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleToggleLaylatulQadrDua = () => {
    onSaveRamadanLog({
      ...ramadanLog,
      laylatulQadrDuaDone: !ramadanLog.laylatulQadrDuaDone,
      updatedAt: new Date().toISOString(),
    });
  };

  const PREPARATION_STEPS = [
    {
      step: 1,
      titleBn: 'পাঁচ ওয়াক্ত ফরজ সালাতে পরিপূর্ণ ধারাবাহিকতা অর্জন',
      descBn: 'রমাদানের পূর্বেই প্রতিটি ফরজ সালাত প্রথম ওয়াক্তে আদায়ের মজবুত অভ্যাস গড়ে তুলুন। কাজা সালাতের হিসাব করে তা আদায়ের সূচনা করুন।',
    },
    {
      step: 2,
      titleBn: 'নিয়মিত ও বাস্তবসম্মত কুরআন তিলাওয়াত সূচি গঠন',
      descBn: 'রমাদানে অন্তত এক খতম তিলাওয়াতের উদ্দেশ্যে প্রতিদিন নির্দিষ্ট সময়ে (যেমন: ফজরের পর) অন্তত ২-৪ পৃষ্ঠা তিলাওয়াত ও তাদাব্বুর শুরু করুন।',
    },
    {
      step: 3,
      titleBn: 'গুরুত্বপূর্ণ মাসনূন ও কুরআনীয় দুআ মুখস্থ ও চর্চা',
      descBn: 'বিশেষ করে ইফতারের দুআ, সাইয়েদুল ইস্তেগফার, ক্ষমা প্রার্থনা ও লাইলাতুল কদরের দুআ হৃদয়ে গেঁথে নিন।',
    },
    {
      step: 4,
      titleBn: 'সকাল ও সন্ধ্যার মাসনূন জিকির জীবনে অবিচ্ছেদ্য করা',
      descBn: 'দিনের শুরুতে ও শেষে সুরক্ষার এই ঢালটি আপনার আধ্যাত্মিক একাগ্রতা ও মনঃসংযোগ শতগুণ বৃদ্ধি করবে।',
    },
    {
      step: 5,
      titleBn: 'চরিত্র সংশোধন ও গীবত-পরনিন্দা বর্জনের চূড়ান্ত সংকল্প',
      descBn: 'রাসূলুল্লাহ ﷺ বলেছেন: যে ব্যক্তি মিথ্যা বলা ও মন্দ আচরণ ত্যাগ করল না, তার পানাহার ত্যাগ করায় আল্লাহর কোনো প্রয়োজন নেই।',
    },
    {
      step: 6,
      titleBn: 'বাস্তবসম্মত ঘুম ও দৈনন্দিন রুটিন পুনর্বিন্যাস',
      descBn: 'সেহরি, তাহাজ্জুদ ও কর্মক্ষেত্রের সময়সূচির মধ্যে ভারসাম্য রক্ষার জন্য আগে থেকেই রাত জাগার বদভ্যাস ত্যাগ করে তাড়াতাড়ি ঘুমানো।',
    },
    {
      step: 7,
      titleBn: 'ঐচ্ছিক নফল সিয়াম ও তাহাজ্জুদে অভ্যস্ত হওয়া',
      descBn: 'রজব ও শা\'বান মাসে সোমবার/বৃহস্পতিবার এবং চাঁদের ১৩, ১৪ ও ১৫ তারিখের আইয়ামে বীজের নফল সিয়াম পালন করা।',
    },
  ];

  const ODD_NIGHTS = [21, 23, 25, 27, 29];

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Ramadan 1448 AH Dynamic Countdown Hero */}
      <div className="clay-card-emerald p-6 sm:p-8 rounded-3xl text-white relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold">
                <Moon className="w-3.5 h-3.5" />
                <span>পবিত্র মাহে রমাদান ১৪৪৮ হিজরি (২০২৭)</span>
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
            <h2 className="text-2xl sm:text-3xl font-bold font-bengali">
              রমাদান প্রস্তুতি ও বরকতময় মাস ট্র্যাকার
            </h2>
            <p className="text-xs text-emerald-100/90 mt-1 max-w-xl leading-relaxed">
              সম্ভাব্য প্রথম রোজা: {toBengaliNumber('09')} ফেব্রুয়ারি ২০২৭ (বিকল্প {toBengaliNumber('08')} ফেব্রুয়ারি চাঁদ দেখার ওপর নির্ভরশীল)। বাংলাদেশ সরকারের জাতীয় চাঁদ দেখা কমিটির আনুষ্ঠানিক ঘোষণার ওপর চূড়ান্ত তারিখ নির্ভরশীল।
            </p>
          </div>

          <button
            onClick={onOpenSettings}
            className="self-start md:self-auto px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-emerald-100 border border-white/15 transition"
          >
            তারিখ সেটিংস পরিবর্তন
          </button>
        </div>

        {/* Live Dynamic Countdown Display */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4">
          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 min-w-[75px] text-center">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-bengali">
              {toBengaliNumber(countdown.totalDays)}
            </span>
            <div className="text-[11px] text-emerald-200 mt-0.5">দিন বাকি</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 min-w-[75px] text-center">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-bengali">
              {toBengaliNumber(countdown.totalHours)}
            </span>
            <div className="text-[11px] text-emerald-200 mt-0.5">ঘণ্টা</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 min-w-[75px] text-center">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-bengali">
              {toBengaliNumber(countdown.totalMinutes)}
            </span>
            <div className="text-[11px] text-emerald-200 mt-0.5">মিনিট</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 min-w-[75px] text-center">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-bengali">
              {toBengaliNumber(countdown.totalSeconds)}
            </span>
            <div className="text-[11px] text-emerald-200 mt-0.5">সেকেন্ড</div>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-stone-200 gap-2">
        <button
          onClick={() => setActiveTab('prep_plan')}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold border-b-2 transition cursor-pointer ${
            activeTab === 'prep_plan'
              ? 'border-emerald-700 text-emerald-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          রমাদান পূর্ব ৭-দফা প্রস্তুতি পরিকল্পনা
        </button>
        <button
          onClick={() => setActiveTab('daily_tracker')}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold border-b-2 transition cursor-pointer ${
            activeTab === 'daily_tracker'
              ? 'border-emerald-700 text-emerald-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          রমাদান দৈনিক ট্র্যাকার
        </button>
        <button
          onClick={() => setActiveTab('last_ten_nights')}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold border-b-2 transition cursor-pointer ${
            activeTab === 'last_ten_nights'
              ? 'border-emerald-700 text-emerald-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          শেষ ১০ রাত ও লাইলাতুল কদর
        </button>
      </div>

      {/* Tab 1: Gradual 7-Step Preparation Plan */}
      {activeTab === 'prep_plan' && (
        <div className="space-y-4">
          <div className="clay-card p-4 bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-900 leading-relaxed font-bengali">
            রমাদান হঠাৎ করে শুরু হলে অনেকের পক্ষে দীর্ঘদিনের অনভ্যাসের কারণে রোজা ও তারাবীহ পালন কঠিন হয়ে পড়ে। তাই সালাফে সালেহীনরা রমাদানের কয়েকমাস আগে থেকেই নিজেদের আত্মিক ও শারীরিক প্রস্তুতি গ্রহণ করতেন।
          </div>

          <div className="space-y-3">
            {PREPARATION_STEPS.map((item) => (
              <div
                key={item.step}
                className="clay-card p-5 bg-white border border-stone-200 hover:border-emerald-200 transition flex items-start gap-4"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0F4C3A] to-[#14532D] text-amber-300 font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                  {toBengaliNumber(item.step)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900 font-bengali">
                    {item.titleBn}
                  </h4>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed font-bengali">
                    {item.descBn}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Ramadan Daily Tracker (Live & Ready for Fasting Days) */}
      {activeTab === 'daily_tracker' && (
        <div className="space-y-5">
          {/* Respectful, healthy guidance */}
          <div className="clay-card p-4 bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 shrink-0 text-amber-800 mt-0.5" />
            <p className="font-bengali leading-relaxed">
              সিয়াম সাধনা একটি আন্তরিক ব্যক্তিগত ইবাদত। অসুস্থতা, সফর বা শারিরীক অপারগতার ক্ষেত্রে শরীয়তের অবকাশ রয়েছে; তাই এটি কোনো অস্বাস্থ্যকর প্রতিযোগিতা বা লজ্জাজনক চাপ সৃষ্টির মাধ্যম নয়।
            </p>
          </div>

          {/* Fasting & Sehri/Iftar Log Card */}
          <div className="clay-card p-6 bg-white border border-stone-200 space-y-4">
            <h3 className="text-base font-bold text-stone-900 font-bengali flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              <span>আজকের সিয়াম ও সময়ানুবর্তিতা রেকর্ড</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Fasting Toggle */}
              <button
                onClick={handleToggleFasting}
                className={`p-4 rounded-2xl border text-center transition cursor-pointer ${
                  ramadanLog.fasted
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm font-bold'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100 font-medium'
                }`}
              >
                <div className="text-xs">আজকের রোজা</div>
                <div className="text-base mt-1">
                  {ramadanLog.fasted ? '✓ রোজা রাখা হয়েছে' : 'রোজা রাখা হয়নি / প্রযোজ্য নয়'}
                </div>
              </button>

              {/* Sehri Toggle */}
              <button
                onClick={handleToggleSehri}
                className={`p-4 rounded-2xl border text-center transition cursor-pointer ${
                  ramadanLog.sehriRecorded
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm font-bold'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100 font-medium'
                }`}
              >
                <div className="text-xs">সেহরি গ্রহণ</div>
                <div className="text-base mt-1">
                  {ramadanLog.sehriRecorded ? '✓ সেহরি সময়মতো সম্পন্ন' : 'সেহরি রেকর্ড করুন'}
                </div>
              </button>

              {/* Iftar Toggle */}
              <button
                onClick={handleToggleIftar}
                className={`p-4 rounded-2xl border text-center transition cursor-pointer ${
                  ramadanLog.iftarRecorded
                    ? 'bg-amber-600 text-white border-amber-700 shadow-sm font-bold'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100 font-medium'
                }`}
              >
                <div className="text-xs">ইফতার ও দুআ</div>
                <div className="text-base mt-1">
                  {ramadanLog.iftarRecorded ? '✓ ইফতার সম্পন্ন' : 'ইফতার রেকর্ড করুন'}
                </div>
              </button>
            </div>
          </div>

          {/* Taraweeh Tracker */}
          <div className="clay-card p-6 bg-white border border-stone-200">
            <h4 className="text-sm font-bold text-stone-900 mb-2 font-bengali">
              তারাবীহ সালাত ট্র্যাকার
            </h4>
            <p className="text-xs text-stone-500 mb-4 font-bengali">
              তারাবীহ সালাত রমাদানুল মুবারকের অত্যন্ত গুরুত্বপূর্ণ সুন্নাহ। নিজের সাধ্য ও স্থানীয় জামাত অনুযায়ী সংরক্ষণ করুন:
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {[8, 20].map((rakats) => (
                <button
                  key={rakats}
                  onClick={() => handleSetTaraweeh(rakats)}
                  className={`px-5 py-2.5 rounded-xl text-xs border transition cursor-pointer ${
                    ramadanLog.taraweehRakats === rakats
                      ? 'bg-emerald-700 text-white border-emerald-800 font-bold shadow-xs'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100 font-medium'
                  }`}
                >
                  {toBengaliNumber(rakats)} রাকাত তারাবীহ আদায়
                </button>
              ))}

              <button
                onClick={handleToggleCharity}
                className={`px-4 py-2.5 rounded-xl text-xs border transition cursor-pointer ${
                  ramadanLog.charityGiven
                    ? 'bg-purple-600 text-white border-purple-700 font-bold shadow-xs'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100 font-medium'
                }`}
              >
                {ramadanLog.charityGiven ? '✓ আজকের সাদাকাহ প্রদান' : '+ সাদাকাহ/দান রেকর্ড'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Last 10 Nights & Laylatul Qadr Preparation */}
      {activeTab === 'last_ten_nights' && (
        <div className="space-y-5">
          <div className="clay-card p-6 bg-gradient-to-r from-purple-950 via-indigo-950 to-[#0A1A2E] text-white">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold mb-2">
              <Sparkles className="w-4 h-4" />
              <span>হাজার মাসের চেয়েও শ্রেষ্ঠ রাত: লাইলাতুল কদর</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-bengali">
              রমাদানের শেষ দশক ও বেজোড় রজনীসমূহ
            </h3>
            <p className="text-xs text-indigo-200 mt-1 max-w-xl leading-relaxed">
              রাসূলুল্লাহ ﷺ বলেছেন: "তোমরা রমাদানের শেষ দশকের বেজোড় রাতগুলোতে লাইলাতুল কদর সন্ধান কর।" (সহীহ আল-বুখারী ২০১৭)
            </p>

            {/* Odd Night Markers */}
            <div className="grid grid-cols-5 gap-2 sm:gap-3 mt-6">
              {ODD_NIGHTS.map((night) => (
                <div
                  key={night}
                  className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-amber-300/30 text-center"
                >
                  <span className="text-lg font-bold text-amber-300 font-bengali">
                    {toBengaliNumber(night)}তম
                  </span>
                  <div className="text-[10px] text-emerald-200">বেজোড় রাত</div>
                </div>
              ))}
            </div>
          </div>

          {/* Master Laylatul Qadr Dua Card */}
          <div className="clay-card p-6 bg-white border-amber-200">
            <h4 className="text-sm font-bold text-stone-900 mb-2 font-bengali">
              লাইলাতুল কদরের বিশেষ দুআ (মা আয়েশা রা.-কে শিখিয়ে দেওয়া)
            </h4>
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-amber-200/80 my-3">
              <p className="font-arabic text-xl sm:text-2xl text-[#0F4C3A] font-bold text-right leading-loose select-text">
                اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي
              </p>
              <p className="text-xs text-stone-500 italic mt-2">
                Allahumma innaka 'Afuwwun tuhibbul-'afwa fa'fu 'anni.
              </p>
              <p className="text-sm text-stone-800 font-medium font-bengali mt-1">
                "হে আল্লাহ! আপনি পরম ক্ষমাশীল, ক্ষমা করাকে আপনি ভালোবাসেন; অতএব আমাকে ক্ষমা করে দিন।"
              </p>
              <span className="text-[11px] text-emerald-800 font-semibold block mt-1">
                সূত্র: সুনান আত-তিরমিযী ৩৫১৩ (সহীহ)
              </span>
            </div>

            <button
              onClick={handleToggleLaylatulQadrDua}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                ramadanLog.laylatulQadrDuaDone
                  ? 'bg-emerald-700 text-white'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{ramadanLog.laylatulQadrDuaDone ? '✓ দুআটি পাঠ সম্পন্ন' : 'দুআ পাঠ চিহ্নিত করুন'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
