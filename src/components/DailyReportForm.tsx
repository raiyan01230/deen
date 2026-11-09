import React, { useState } from 'react';
import { 
  Save, 
  Copy, 
  Check, 
  MessageSquare, 
  ShieldCheck, 
  AlertTriangle,
  Heart,
  Target,
  ArrowRight,
  Info,
  CheckCircle2
} from 'lucide-react';
import { ImprovementLog } from '../types/improvement';
import { PRAYER_NAMES, PRAYER_NAMES_BN } from '../utils/salahCalculations';
import { PrayerStatus } from '../types';
import { toBengaliNumber } from '../utils/hijriCalendar';

interface DailyReportFormProps {
  uid: string;
  log: ImprovementLog;
  onUpdate: (log: ImprovementLog) => Promise<void>;
}

export const DailyReportForm: React.FC<DailyReportFormProps> = ({ log, onUpdate }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [copyStatus, setCopyStatus] = useState(false);

  const handlePrayerChange = (name: keyof ImprovementLog['salah'], status: PrayerStatus) => {
    onUpdate({
      ...log,
      salah: { ...log.salah, [name]: status }
    });
  };

  const handleGhibahChange = (field: keyof ImprovementLog['ghibahTrack'], value: boolean | string) => {
    onUpdate({
      ...log,
      ghibahTrack: { ...log.ghibahTrack, [field]: value }
    });
  };

  const handleCopyReport = () => {
    const prayerStatus = (status: PrayerStatus) => {
      switch(status) {
        case 'on_time': return 'হ্যাঁ (সময়মতো)';
        case 'late_qada': return 'হ্যাঁ (দেরিতে/কাজা)';
        case 'missed': return 'না (পড়া হয়নি)';
        default: return 'না/উল্লেখ নেই';
      }
    };

    const report = `\`\`\`markdown
### DAILY ISLAMIC REPORT - ${log.date}
**নামাজ:** 
- ফজর: ${prayerStatus(log.salah.fajr)}
- যোহর: ${prayerStatus(log.salah.dhuhr)}
- আসর: ${prayerStatus(log.salah.asr)}
- মাগরিব: ${prayerStatus(log.salah.maghrib)}
- এশা: ${prayerStatus(log.salah.isha)}

**আচরণ ও গীবত:**
- গীবত করা হয়েছে: ${log.ghibahTrack.committedGhibah ? 'হ্যাঁ' : 'না'}
- অন্যের গীবতে অংশগ্রহণ: ${log.ghibahTrack.participatedInGhibah ? 'হ্যাঁ' : 'না'}
- উপহাসে হাসাহাসি: ${log.ghibahTrack.laughedAtMockery ? 'হ্যাঁ' : 'না'}
- অনুপযুক্ত আলোচনা থামানো হয়েছে: ${log.ghibahTrack.stoppedInappropriateConv ? 'হ্যাঁ' : 'না'}
- প্রতিক্রিয়া: ${log.ghibahTrack.reactionNotes || 'প্রয়োজন হয়নি'}

**পর্যালোচনা:**
- দিনের উল্লেখযোগ্য ঘটনা: ${log.eventDescription || 'উল্লেখ নেই'}
- ভালো কাজসমূহ: ${log.goodDeeds || 'উল্লেখ নেই'}
- আজকের ভুলসমূহ: ${log.mistakes || 'উল্লেখ নেই'}
- আজকের শিক্ষা: ${log.todayLessons || 'উল্লেখ নেই'}
- আগামীকালের লক্ষ্য: ${log.tomorrowGoals || 'উল্লেখ নেই'}

*Generated via My Deen & Life Self-Improvement Tracker*
\`\`\``;

    navigator.clipboard.writeText(report);
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Salah Tracking Card */}
      <div className="clay-card p-6 bg-white border border-[#E6E0D6]">
        <div className="flex items-center gap-2 mb-4 border-b border-stone-100 pb-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-stone-900 font-bengali">পাঁচ ওয়াক্ত সালাত ট্র্যাকিং</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {PRAYER_NAMES.map((name) => (
            <div key={name} className="space-y-2">
              <label className="text-xs font-bold text-stone-600 block">{PRAYER_NAMES_BN[name].name}</label>
              <select
                value={log.salah[name]}
                onChange={(e) => handlePrayerChange(name, e.target.value as PrayerStatus)}
                className="w-full p-2 rounded-xl border border-stone-200 text-xs font-medium focus:ring-emerald-500 focus:border-emerald-500 bg-stone-50"
              >
                <option value="unrecorded">বাছাই করুন</option>
                <option value="on_time">সময়মতো আদায়</option>
                <option value="late_qada">দেরিতে/কাজা</option>
                <option value="missed">আদায় করা হয়নি</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Ghibah Tracking Card */}
      <div className="clay-card p-6 bg-white border border-[#E6E0D6]">
        <div className="flex items-center gap-2 mb-4 border-b border-stone-100 pb-3">
          <MessageSquare className="w-5 h-5 text-amber-600" />
          <h3 className="font-bold text-stone-900 font-bengali">গীবত ও আচরণ পর্যবেক্ষণ</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            {[
              { label: 'আজ আমি কারো গীবত করেছি', field: 'committedGhibah', help: 'বর্জনীয়: কারো অনুপস্থিতিতে তার অপছন্দনীয় সত্য বা মিথ্যা আলোচনা।' },
              { label: 'অন্যের করা গীবতে আমি অংশ নিয়েছি', field: 'participatedInGhibah', help: 'সতর্কতা: গীবত শোনা বা তাতে সম্মতি দেওয়াও গুনাহের অন্তর্ভুক্ত।' },
              { label: 'কারো প্রতি উপহাসে আমি হেসেছি', field: 'laughedAtMockery', help: 'দ্রষ্টব্য: অনিচ্ছাকৃত হাসি উপহাস নয়, তবে সচেতনভাবে হাসা থেকে বিরত থাকতে হবে।' },
              { label: 'অনুপযুক্ত আলোচনা আমি থামানোর চেষ্টা করেছি', field: 'stoppedInappropriateConv', help: 'উৎসাহ: কৌশলে আলোচনার মোড় ঘুরিয়ে দেওয়া একটি মহৎ আমল।' },
            ].map((item) => (
              <div key={item.field} className="space-y-1">
                <label className="flex items-start gap-3 p-3 rounded-2xl bg-stone-50 border border-stone-100 hover:bg-stone-100/50 transition cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={log.ghibahTrack[item.field as keyof ImprovementLog['ghibahTrack']] as boolean}
                    onChange={(e) => handleGhibahChange(item.field as any, e.target.checked)}
                    className="mt-1 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span className="text-sm font-medium text-stone-700 group-hover:text-stone-900">{item.label}</span>
                </label>
                <p className="text-[10px] text-stone-400 pl-10 italic">{item.help}</p>
              </div>
            ))}
            
            <div className="mt-4 p-4 rounded-xl bg-amber-50/50 border border-amber-100 text-[11px] text-amber-800 leading-relaxed">
              <span className="font-bold flex items-center gap-1 mb-1">
                <Info className="w-3 h-3" />
                মনে রাখুন:
              </span>
              অবিচার প্রতিকার বা সঠিক পরামর্শের জন্য সীমিত পরিসরে কারো কথা বলা গীবত নয়। ভুলবশত হেসে ফেললে তা নিয়ে হতাশ না হয়ে আল্লাহ্‌র কাছে ক্ষমা চেয়ে পরবর্তী সময়ের জন্য সচেতন হোন।
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              <span>উপহাস বা গীবতের মুখে আপনার প্রতিক্রিয়া (যদি থাকে)</span>
            </label>
            <textarea
              value={log.ghibahTrack.reactionNotes}
              onChange={(e) => handleGhibahChange('reactionNotes', e.target.value)}
              placeholder="যেমন: কৌশলে টপিক বদলে দিয়েছি বা প্রতিবাদ করেছি..."
              className="w-full p-4 rounded-2xl border border-stone-200 text-sm focus:ring-emerald-500 focus:border-emerald-500 h-32 resize-none bg-stone-50"
            />
          </div>
        </div>
      </div>

      {/* Reflections & Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Good Deeds & Mistakes */}
        <div className="clay-card p-6 bg-white border border-[#E6E0D6] space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-emerald-800 flex items-center gap-2">
              <Heart className="w-4 h-4" />
              <span>আজকের উল্লেখযোগ্য ভালো কাজ</span>
            </label>
            <textarea
              value={log.goodDeeds}
              onChange={(e) => onUpdate({ ...log, goodDeeds: e.target.value })}
              placeholder="কি কি ভালো কাজ করেছেন?"
              className="w-full p-4 rounded-2xl border border-stone-200 text-sm h-24 resize-none bg-emerald-50/20"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>আজকের ভুলত্রুটিসমূহ</span>
            </label>
            <textarea
              value={log.mistakes}
              onChange={(e) => onUpdate({ ...log, mistakes: e.target.value })}
              placeholder="আজ কি কি ভুল হয়েছে যা আপনি সংশোধন করতে চান?"
              className="w-full p-4 rounded-2xl border border-stone-200 text-sm h-24 resize-none bg-rose-50/20"
            />
          </div>
        </div>

        {/* Lessons & Goals */}
        <div className="clay-card p-6 bg-white border border-[#E6E0D6] space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-stone-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-stone-400" />
              <span>আজকের প্রাপ্ত শিক্ষা</span>
            </label>
            <textarea
              value={log.todayLessons}
              onChange={(e) => onUpdate({ ...log, todayLessons: e.target.value })}
              placeholder="সারাদিন থেকে কি শিখলেন?"
              className="w-full p-4 rounded-2xl border border-stone-200 text-sm h-24 resize-none bg-stone-50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#0F4C3A] flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span>আগামীকালের লক্ষ্য</span>
            </label>
            <textarea
              value={log.tomorrowGoals}
              onChange={(e) => onUpdate({ ...log, tomorrowGoals: e.target.value })}
              placeholder="আগামীকাল কি অর্জন করতে চান?"
              className="w-full p-4 rounded-2xl border border-stone-200 text-sm h-24 resize-none bg-emerald-50/10"
            />
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 clay-card bg-[#0F4C3A] text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <Copy className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h4 className="text-sm font-bold font-bengali">রিপোর্ট কপি করুন</h4>
            <p className="text-[10px] text-emerald-200">ChatGPT-তে শেয়ার করার জন্য ফরম্যাট করা রিপোর্ট</p>
          </div>
        </div>
        
        <button
          onClick={handleCopyReport}
          className={`px-8 py-3 rounded-2xl flex items-center gap-2 font-bold text-sm transition-all shadow-lg ${
            copyStatus ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-[#0F4C3A] hover:bg-amber-300'
          }`}
        >
          {copyStatus ? (
            <>
              <Check className="w-4 h-4" />
              <span>রিপোর্ট কপি হয়েছে!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>ChatGPT রিপোর্ট কপি করুন</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
