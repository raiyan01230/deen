import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  Shield,
  Smile,
  Lock,
  Sparkles,
  Info,
  Check,
  Save,
  RotateCcw,
  BookOpen,
  RefreshCw,
} from 'lucide-react';
import { CharacterReflection } from '../types';
import { subscribeToSyncState, SyncStateInfo } from '../services/dataService';

interface CharacterTrackerProps {
  currentDate: string;
  reflection: CharacterReflection;
  onSaveReflection: (updated: CharacterReflection) => void;
}

export const CharacterTracker: React.FC<CharacterTrackerProps> = ({
  currentDate,
  reflection,
  onSaveReflection,
}) => {
  const [syncInfo, setSyncInfo] = useState<SyncStateInfo>({ status: 'idle', message: 'প্রস্তুত' });
  const [reflectionText, setReflectionText] = useState(reflection.reflectionText || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const unsub = subscribeToSyncState((info) => setSyncInfo(info));
    return () => unsub();
  }, []);

  const handleTogglePledge = () => {
    const updated = {
      ...reflection,
      avoidedGheebahIntention: !reflection.avoidedGheebahIntention,
      updatedAt: new Date().toISOString(),
    };
    onSaveReflection(updated);
  };

  const handleToggleTrait = (field: 'angerControlled' | 'truthfulnessObserved' | 'kindnessShown' | 'soughtForgiveness') => {
    const updated = {
      ...reflection,
      [field]: !reflection[field],
      updatedAt: new Date().toISOString(),
    };
    onSaveReflection(updated);
  };

  const handleSaveNote = () => {
    const updated = {
      ...reflection,
      reflectionText,
      updatedAt: new Date().toISOString(),
    };
    onSaveReflection(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="clay-card-emerald p-6 rounded-3xl text-white relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold">
                <HeartHandshake className="w-4 h-4" />
                <span>তাজকিয়াতুন নফস (আত্মশুদ্ধি) ও সচ্চরিত্র গঠন</span>
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
          চারিত্রিক উৎকর্ষ ও গীবত বর্জন কেন্দ্র
        </h2>
        <p className="text-xs text-emerald-100/90 mt-1 max-w-xl leading-relaxed">
          রাসূলুল্লাহ ﷺ বলেছেন: "তোমাদের মধ্যে সর্বোত্তম ব্যক্তি সে, যার চরিত্র সবচেয়ে সুন্দর।" (সহীহ আল-বুখারী ৬০৩৫)
        </p>
          </div>
        </div>

        {/* Privacy & No-Name Guarantee */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2 text-xs text-emerald-200">
          <Lock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span>
            <strong>গোপনীয়তার পূর্ণ অঙ্গীকার:</strong> এখানে নিজের ব্যক্তিগত ত্রুটি সংশোধন ও আত্মসমালোচনার সুযোগ রয়েছে। কারো নাম বা অন্যের ব্যক্তিগত তথ্য এখানে সংরক্ষণ করার প্রয়োজন নেই।
          </span>
        </div>
      </div>

      {/* 1. Daily Intention to Avoid Gossip & Backbiting (Gheebah) */}
      <div className="clay-card p-6 bg-white border border-stone-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 font-bengali">
                আজকের গীবত ও অনর্থক কথা পরিহারের দৃঢ় সংকল্প
              </h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed max-w-xl font-bengali">
                আজকের পুরো দিনে আমি কারো অসাক্ষাতে অপ্রীতিকর কথা বলা, পরনিন্দা শোনা বা সামাজিক যোগাযোগমাধ্যমে অপবাদমূলক মন্তব্য করা থেকে নিজের জিহ্বা ও চোখকে সম্পূর্ণ হিফাজত করব।
              </p>
            </div>
          </div>

          <button
            onClick={handleTogglePledge}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 shadow-xs ${
              reflection.avoidedGheebahIntention
                ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>
              {reflection.avoidedGheebahIntention ? '✓ সংকল্প গৃহীত ও পালিত' : 'আজকের সংকল্প গ্রহণ করুন'}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Character Habit Checkboxes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <button
          onClick={() => handleToggleTrait('angerControlled')}
          className={`clay-card p-4 text-left border transition cursor-pointer flex items-center justify-between ${
            reflection.angerControlled
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
              : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          <div>
            <div className="text-xs font-bold">ক্রোধ ও রাগ নিয়ন্ত্রণ</div>
            <div className="text-[11px] text-stone-500 mt-0.5">উত্তেজনায় চুপ থাকা ও ধৈর্য ধরা</div>
          </div>
          <span className="text-xs">{reflection.angerControlled ? '✓ অর্জিত' : '—'}</span>
        </button>

        <button
          onClick={() => handleToggleTrait('truthfulnessObserved')}
          className={`clay-card p-4 text-left border transition cursor-pointer flex items-center justify-between ${
            reflection.truthfulnessObserved
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
              : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          <div>
            <div className="text-xs font-bold">সত্যবাদিতা ও অঙ্গীকার রক্ষা</div>
            <div className="text-[11px] text-stone-500 mt-0.5">সব কথায় সত্যতা ও প্রতিশ্রুতি পালন</div>
          </div>
          <span className="text-xs">{reflection.truthfulnessObserved ? '✓ অর্জিত' : '—'}</span>
        </button>

        <button
          onClick={() => handleToggleTrait('kindnessShown')}
          className={`clay-card p-4 text-left border transition cursor-pointer flex items-center justify-between ${
            reflection.kindnessShown
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
              : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          <div>
            <div className="text-xs font-bold">পরিবার ও মানুষের সাথে কোমলতা</div>
            <div className="text-[11px] text-stone-500 mt-0.5">পিতামাতা ও অন্যের সাথে সুন্দর আচরণ</div>
          </div>
          <span className="text-xs">{reflection.kindnessShown ? '✓ অর্জিত' : '—'}</span>
        </button>
      </div>

      {/* 3. Private Behavioral Reflection Note */}
      <div className="clay-card p-6 bg-white border border-stone-200">
        <h3 className="text-base font-bold text-stone-900 mb-2 font-bengali">
          আজকের আত্মশুদ্ধি ও আচরণগত চিন্তাভাবনা (ব্যক্তিগত ডায়েরি)
        </h3>
        <p className="text-xs text-stone-500 mb-3 font-bengali">
          কোথায় নিজের আচরণ আরও সুন্দর করা যায়? কথা বলায় বা ব্যবহারে কোনো ত্রুটি হয়েছে কি? লিখে রাখুন:
        </p>
        <textarea
          rows={4}
          value={reflectionText}
          onChange={(e) => setReflectionText(e.target.value)}
          placeholder="আজকের আচরণে যেসব বিষয়ে আরও উন্নতি করা প্রয়োজন... (সম্পূর্ণ ব্যক্তিগত ও গোপনীয়)"
          className="w-full p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-emerald-600 font-bengali leading-relaxed"
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-stone-400">তারিখ: {currentDate}</span>
          <button
            onClick={handleSaveNote}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            {saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>সংরক্ষিত হয়েছে!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>নোট সংরক্ষণ করুন</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4. Gentle, Uplifting Repentance Reminder (Zero Shame, Pure Hope) */}
      <div className="clay-card p-6 bg-gradient-to-r from-teal-50 via-emerald-50 to-amber-50/50 border border-emerald-200/80">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-emerald-950 font-bengali">
                ভুল বা পদস্খলন হলে: পরম দয়াময় আল্লাহর দরবারে তাওবাহ
              </h4>
              <p className="text-xs text-emerald-900/90 mt-1 leading-relaxed max-w-xl font-bengali">
                মানুষ মাত্রই ভুল হতে পারে। ইসলাম কখনোই অপরাধবোধে হতাশ হতে শেখায় না। আল্লাহ বলেন: <em>"হে আমার বান্দাগণ যারা নিজেদের ওপর বাড়াবাড়ি করেছ, তোমরা আল্লাহর রহমত থেকে নিরাশ হয়ো না।"</em> (সূরা আজ-জুমার ৩৯:৫৩)
              </p>
            </div>
          </div>

          <button
            onClick={() => handleToggleTrait('soughtForgiveness')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              reflection.soughtForgiveness
                ? 'bg-emerald-800 text-white'
                : 'bg-white text-emerald-900 border border-emerald-300 hover:bg-emerald-100'
            }`}
          >
            {reflection.soughtForgiveness ? '✓ ইস্তেগফার ও তাওবাহ সম্পন্ন' : 'ইস্তেগফার পাঠের সংকল্প'}
          </button>
        </div>
      </div>
    </div>
  );
};
