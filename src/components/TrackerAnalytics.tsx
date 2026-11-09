import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  History as HistoryIcon, 
  Download, 
  Copy, 
  Check, 
  AlertCircle, 
  TrendingUp,
  Calendar,
  ChevronRight,
  Filter
} from 'lucide-react';
import { getImprovementLogsRange } from '../services/dataService';
import { ImprovementLog } from '../types/improvement';
import { toBengaliNumber } from '../utils/hijriCalendar';

interface TrackerAnalyticsProps {
  uid: string;
}

export const TrackerAnalytics: React.FC<TrackerAnalyticsProps> = ({ uid }) => {
  const [logs, setLogs] = useState<ImprovementLog[]>([]);
  const [range, setRange] = useState<7 | 14 | 30>(7);
  const [loading, setLoading] = useState(true);
  const [copyStatus, setCopyStatus] = useState<'weekly' | 'full' | null>(null);

  useEffect(() => {
    loadLogs();
  }, [uid, range]);

  const loadLogs = async () => {
    setLoading(true);
    const data = await getImprovementLogsRange(uid, range);
    setLogs(data);
    setLoading(false);
  };

  const handleCopySummary = (type: 'weekly' | 'full') => {
    const periodName = type === 'weekly' ? 'সাপ্তাহিক' : '৩০ দিনের';
    let summary = "```markdown\n";
    summary += `### ${periodName.toUpperCase()} ISLAMIC SELF-IMPROVEMENT REPORT\n`;
    summary += `প্রস্তুতকাল: ${new Date().toLocaleDateString('bn-BD')}\n\n`;

    logs.forEach(log => {
      const isRecorded = Object.values(log.salah).some(s => s !== 'unrecorded');
      if (!isRecorded) {
        summary += `**${log.date}:** [তথ্য প্রদান করা হয়নি]\n---\n`;
        return;
      }
      
      summary += `**তারিখ: ${log.date}**\n`;
      summary += `- গীবত: ${log.ghibahTrack.committedGhibah ? 'হ্যাঁ' : 'না'}\n`;
      summary += `- ভালো কাজ: ${log.goodDeeds || 'নেই'}\n`;
      summary += `- ভুলসমূহ: ${log.mistakes || 'নেই'}\n`;
      summary += `---\n`;
    });
    summary += "```";

    navigator.clipboard.writeText(summary);
    setCopyStatus(type);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const mistakesList = logs
    .map(l => l.mistakes)
    .filter(Boolean)
    .join(', ')
    .split(/[ ,،]+/)
    .filter(s => s.length > 3);

  const improvementsList = logs
    .map(l => l.goodDeeds)
    .filter(Boolean)
    .join(', ')
    .split(/[ ,،]+/)
    .filter(s => s.length > 3);

  if (loading) {
    return <div className="p-8 text-center text-stone-500 animate-pulse">রিপোর্ট জেনারেট হচ্ছে...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex bg-white p-1 rounded-xl border border-stone-200 shadow-2xs">
          {[7, 14, 30].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r as any)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                range === r ? 'bg-emerald-600 text-white shadow-sm' : 'text-stone-500 hover:bg-stone-50'
              }`}
            >
              {toBengaliNumber(r)} দিন
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleCopySummary('weekly')}
            className="px-4 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50 transition flex items-center gap-2"
          >
            {copyStatus === 'weekly' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>সাপ্তাহিক রিপোর্ট</span>
          </button>
          <button
            onClick={() => handleCopySummary('full')}
            className="px-4 py-2 rounded-xl bg-[#0F4C3A] text-white text-xs font-bold hover:bg-[#125B46] transition flex items-center gap-2"
          >
            {copyStatus === 'full' ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
            <span>পূর্ণ রিপোর্ট</span>
          </button>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mistakes analysis */}
        <div className="clay-card p-6 bg-white border border-stone-200 space-y-4">
          <h4 className="text-sm font-bold text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>বারবার হওয়া ভুলসমূহ (বিগত {toBengaliNumber(range)} দিন)</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {mistakesList.length > 0 ? (
              Array.from(new Set(mistakesList)).slice(0, 10).map((m, i) => (
                <span key={i} className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-100">
                  {m}
                </span>
              ))
            ) : (
              <p className="text-[10px] text-stone-400 italic">কোনো ডেটা পাওয়া যায়নি</p>
            )}
          </div>
        </div>

        {/* Improvements analysis */}
        <div className="clay-card p-6 bg-white border border-stone-200 space-y-4">
          <h4 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span>ইতিবাচক পরিবর্তনসমূহ</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {improvementsList.length > 0 ? (
              Array.from(new Set(improvementsList)).slice(0, 10).map((imp, i) => (
                <span key={i} className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
                  {imp}
                </span>
              ))
            ) : (
              <p className="text-[10px] text-stone-400 italic">কোনো ডেটা পাওয়া যায়নি</p>
            )}
          </div>
        </div>
      </div>

      {/* History Timeline */}
      <div className="clay-card bg-white border border-stone-200 overflow-hidden">
        <div className="p-4 border-b border-stone-100 bg-stone-50 flex items-center gap-2">
          <HistoryIcon className="w-4 h-4 text-stone-500" />
          <h4 className="text-sm font-bold text-stone-800">রিপোর্ট ইতিহাস</h4>
        </div>
        <div className="divide-y divide-stone-100">
          {logs.map((l) => {
            const hasData = Object.values(l.salah).some(s => s !== 'unrecorded') || l.goodDeeds || l.mistakes;
            return (
              <div key={l.date} className={`p-4 flex items-center justify-between hover:bg-stone-50 transition ${!hasData ? 'opacity-40' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[50px]">
                    <div className="text-xs font-bold text-stone-800">{l.date.split('-')[2]}</div>
                    <div className="text-[8px] text-stone-500 uppercase font-bold">{new Date(l.date).toLocaleString('bn-BD', { month: 'short' })}</div>
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="text-[11px] font-bold text-stone-700">
                      {hasData ? (l.ghibahTrack.committedGhibah ? '⚠️ আচরণে বিচ্যুতি ছিল' : '✅ সচেতন ছিলেন') : 'রিপোর্ট দেওয়া হয়নি'}
                    </h5>
                    <p className="text-[9px] text-stone-500 truncate max-w-[200px]">
                      {l.goodDeeds || l.eventDescription || 'কোনো বিবরণ নেই'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {Object.entries(l.salah).map(([k, v]) => (
                      <div 
                        key={k} 
                        className={`w-1.5 h-1.5 rounded-full ${v === 'on_time' ? 'bg-emerald-500' : v === 'late_qada' ? 'bg-amber-400' : v === 'missed' ? 'bg-rose-500' : 'bg-stone-200'}`} 
                        title={k}
                      />
                    ))}
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-300" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
