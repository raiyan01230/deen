import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Map, 
  History, 
  FileText, 
  Trophy,
  AlertCircle,
  CheckCircle2,
  Lock,
  ChevronRight,
  Info
} from 'lucide-react';
import { DailyReportForm } from './DailyReportForm';
import { ChallengeRoadmap } from './ChallengeRoadmap';
import { TrackerAnalytics } from './TrackerAnalytics';
import { ImprovementLog, UserChallengeProgress } from '../types/improvement';
import { 
  getImprovementLog, 
  saveImprovementLog, 
  getChallengeProgress, 
  saveChallengeProgress,
  getImprovementLogsRange
} from '../services/dataService';
import { toBengaliNumber } from '../utils/hijriCalendar';

interface ImprovementTrackerProps {
  uid: string;
  todayDate: string;
}

type TrackerTab = 'report' | 'roadmap' | 'history';

export const ImprovementTracker: React.FC<ImprovementTrackerProps> = ({ uid, todayDate }) => {
  const [activeTab, setActiveTab] = useState<TrackerTab>('report');
  const [log, setLog] = useState<ImprovementLog | null>(null);
  const [progress, setProgress] = useState<UserChallengeProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [uid, todayDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [currentLog, currentProgress] = await Promise.all([
        getImprovementLog(uid, todayDate),
        getChallengeProgress(uid)
      ]);
      setLog(currentLog);
      setProgress(currentProgress);
    } catch (error) {
      console.error('Error loading tracker data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLog = async (updatedLog: ImprovementLog) => {
    setLog(updatedLog);
    await saveImprovementLog(uid, updatedLog);
  };

  const handleCompleteTask = async (taskId: string) => {
    if (!progress) return;
    
    const isCompleted = progress.completedTaskIds.includes(taskId);
    if (isCompleted) return;

    const newCompleted = [...progress.completedTaskIds, taskId];
    const newLevel = Math.floor(newCompleted.length / 7) + 1;
    
    const updatedProgress: UserChallengeProgress = {
      ...progress,
      currentChallengeId: newLevel,
      completedTaskIds: newCompleted,
      lastTaskCompletedAt: new Date().toISOString()
    };
    
    setProgress(updatedProgress);
    await saveChallengeProgress(uid, updatedProgress);
  };

  if (loading) {
    return (
      <div className="clay-card p-12 text-center animate-pulse">
        <div className="w-12 h-12 bg-emerald-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <Trophy className="w-6 h-6 text-emerald-600" />
        </div>
        <p className="text-stone-500">আপনার আত্মশুদ্ধি ট্র্যাকার লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Hero */}
      <div className="clay-card-emerald p-6 rounded-3xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold mb-3 border border-amber-300/20">
              <Trophy className="w-3.5 h-3.5" />
              <span>ইসলামিক সেলফ-ইমপ্রুভমেন্ট ট্র্যাকার</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-bengali">
              আত্মশুদ্ধি ও চরিত্র গঠন
            </h2>
            <p className="text-xs text-emerald-100/90 mt-1 max-w-xl leading-relaxed">
              প্রতিদিন নিজের হিসাব নিন, ৫টি ধাপে আপনার চরিত্রকে উন্নত করুন এবং গীবত ও অহংকারমুক্ত জীবনের পথে অগ্রসর হোন।
            </p>
          </div>
          
          {/* Progress Summary Card */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-wider text-emerald-200 mb-1 font-bold">আপনার বর্তমান ধাপ</span>
            <div className="text-2xl font-bold text-amber-300">
              চ্যালেঞ্জ {toBengaliNumber(progress?.currentChallengeId || 1)}
            </div>
            <div className="text-[11px] text-emerald-100 mt-1">
              সম্পন্ন কাজ: {toBengaliNumber(progress?.completedTaskIds.length || 0)}টি
            </div>
          </div>
        </div>
      </div>

      {/* Internal Navigation Tabs */}
      <div className="flex bg-white/50 backdrop-blur-sm p-1.5 rounded-2xl border border-[#E6E0D6] shadow-2xs">
        <button
          onClick={() => setActiveTab('report')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'report' ? 'bg-[#0F4C3A] text-white shadow-md' : 'text-stone-600 hover:bg-white/80'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>আজকের রিপোর্ট</span>
        </button>
        <button
          onClick={() => setActiveTab('roadmap')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'roadmap' ? 'bg-[#0F4C3A] text-white shadow-md' : 'text-stone-600 hover:bg-white/80'
          }`}
        >
          <Map className="w-4 h-4" />
          <span>চ্যালেঞ্জ রোডম্যাপ</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'history' ? 'bg-[#0F4C3A] text-white shadow-md' : 'text-stone-600 hover:bg-white/80'
          }`}
        >
          <History className="w-4 h-4" />
          <span>ইতিহাস ও রিপোর্ট</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'report' && log && (
          <DailyReportForm 
            uid={uid}
            log={log} 
            onUpdate={handleUpdateLog} 
          />
        )}
        
        {activeTab === 'roadmap' && progress && (
          <ChallengeRoadmap 
            progress={progress} 
            onCompleteTask={handleCompleteTask} 
          />
        )}
        
        {activeTab === 'history' && (
          <TrackerAnalytics uid={uid} />
        )}
      </div>
    </div>
  );
};
