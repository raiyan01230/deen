import React, { useState } from 'react';
import { 
  Lock, 
  CheckCircle2, 
  ChevronRight, 
  Star, 
  Trophy, 
  Info,
  Clock,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Copy
} from 'lucide-react';
import { CHALLENGES } from '../data/improvementTasks';
import { UserChallengeProgress, Challenge, ChallengeTask } from '../types/improvement';
import { toBengaliNumber } from '../utils/hijriCalendar';

interface ChallengeRoadmapProps {
  progress: UserChallengeProgress;
  onCompleteTask: (taskId: string) => Promise<void>;
}

export const ChallengeRoadmap: React.FC<ChallengeRoadmapProps> = ({ progress, onCompleteTask }) => {
  const [selectedTask, setSelectedTask] = useState<ChallengeTask | null>(null);

  // Determine current state
  const completedCount = progress.completedTaskIds.length;
  const currentLevel = Math.floor(completedCount / 7) + 1;
  const currentDayInChallenge = (completedCount % 7) + 1;

  const isTaskLocked = (challengeId: number, dayNumber: number) => {
    // A task is locked if its challenge hasn't started yet
    if (challengeId > currentLevel) return true;
    // Or if it's the correct challenge but a future day
    if (challengeId === currentLevel && dayNumber > currentDayInChallenge) return true;
    return false;
  };

  const isTaskCompleted = (taskId: string) => progress.completedTaskIds.includes(taskId);

  const handleTaskClick = (task: ChallengeTask, locked: boolean) => {
    if (locked) return;
    setSelectedTask(task);
  };

  const currentChallenge = CHALLENGES.find(c => c.id === currentLevel) || CHALLENGES[CHALLENGES.length - 1];

  return (
    <div className="space-y-8">
      {/* 5 Challenges Roadmap */}
      <div className="grid grid-cols-1 gap-6">
        {CHALLENGES.map((challenge) => {
          const isChallengeLocked = challenge.id > currentLevel;
          const isChallengeCompleted = challenge.id < currentLevel;
          const isActive = challenge.id === currentLevel;

          return (
            <div 
              key={challenge.id}
              className={`clay-card overflow-hidden transition-all border ${
                isActive 
                  ? 'border-emerald-300 ring-2 ring-emerald-500/10 ring-offset-2' 
                  : isChallengeCompleted 
                    ? 'border-emerald-100 bg-emerald-50/10' 
                    : 'border-stone-200 opacity-80 grayscale-[0.5]'
              }`}
            >
              {/* Challenge Header */}
              <div className={`p-5 flex items-center justify-between ${
                isActive ? 'bg-emerald-600 text-white' : isChallengeCompleted ? 'bg-emerald-50 text-emerald-900' : 'bg-stone-100 text-stone-500'
              }`}>
                <div className="flex items-center gap-3">
                  {isChallengeCompleted ? (
                    <Trophy className="w-5 h-5 text-amber-500" />
                  ) : isActive ? (
                    <Star className="w-5 h-5 text-amber-300 animate-pulse" />
                  ) : (
                    <Lock className="w-5 h-5" />
                  )}
                  <div>
                    <h3 className="font-bold font-bengali">{challenge.titleBn}</h3>
                    <p className="text-[10px] opacity-80 font-medium">{challenge.descriptionBn}</p>
                  </div>
                </div>
                {isActive && (
                  <span className="px-3 py-1 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider">চলমান</span>
                )}
              </div>

              {/* Task Grid (7 Days) */}
              <div className="p-4 grid grid-cols-7 gap-2">
                {challenge.tasks.map((task) => {
                  const locked = isTaskLocked(challenge.id, task.dayNumber);
                  const completed = isTaskCompleted(task.id);
                  const isToday = isActive && task.dayNumber === currentDayInChallenge;

                  return (
                    <button
                      key={task.id}
                      onClick={() => handleTaskClick(task, locked)}
                      className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl border transition-all ${
                        completed
                          ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm'
                          : isToday
                            ? 'bg-amber-100 border-amber-400 text-amber-900 scale-105 z-10 shadow-md ring-4 ring-amber-400/20'
                            : locked
                              ? 'bg-stone-50 border-stone-100 text-stone-300 cursor-not-allowed'
                              : 'bg-white border-stone-200 text-stone-600 hover:border-emerald-400 hover:bg-emerald-50'
                      }`}
                      title={locked ? 'আগের কাজগুলো সম্পন্ন করুন' : task.titleBn}
                    >
                      {locked ? (
                        <Lock className="w-3 h-3 mb-1" />
                      ) : completed ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <span className="text-sm font-bold">{toBengaliNumber(task.dayNumber)}</span>
                      )}
                      <span className="text-[8px] mt-0.5 font-bold">{locked ? 'বন্ধ' : 'দিন'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action: Copy Full Challenge Report */}
      <div className="flex justify-center pt-4">
        <button
          onClick={() => {
            let report = "```markdown\n";
            report += `### FULL CHALLENGE PROGRESS REPORT\n`;
            report += `বর্তমান ধাপ: চ্যালেঞ্জ ${toBengaliNumber(currentLevel)}\n`;
            report += `সর্বমোট সম্পন্ন কাজ: ${toBengaliNumber(completedCount)}/৩৫\n\n`;
            
            CHALLENGES.forEach(c => {
              report += `**${c.titleBn}**\n`;
              c.tasks.forEach(t => {
                const done = isTaskCompleted(t.id);
                report += `- দিন ${toBengaliNumber(t.dayNumber)}: ${done ? '✅ সম্পন্ন' : '❌ বাকি'}\n`;
              });
              report += `\n`;
            });
            report += "```";
            
            navigator.clipboard.writeText(report);
            alert('ফুল চ্যালেঞ্জ রিপোর্ট কপি হয়েছে!');
          }}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-stone-200 text-stone-700 font-bold text-sm hover:bg-stone-50 transition shadow-sm"
        >
          <Copy className="w-4 h-4" />
          <span>ফুল চ্যালেঞ্জ রিপোর্ট কপি করুন</span>
        </button>
      </div>

      {/* Task Modal / Detail View */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="clay-card bg-white max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            {/* Modal Header */}
            <div className="bg-[#0F4C3A] text-white p-6 relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="px-2 py-0.5 rounded-lg bg-amber-400 text-[#0F4C3A] text-[10px] font-bold">
                  দিন {toBengaliNumber(selectedTask.dayNumber)}
                </div>
                <span className="text-emerald-100 text-xs font-medium">চ্যালেঞ্জ {toBengaliNumber(Math.floor(CHALLENGES.findIndex(c => c.tasks.some(t => t.id === selectedTask.id))) + 1)}</span>
              </div>
              <h4 className="text-xl font-bold font-bengali">{selectedTask.titleBn}</h4>
              <button 
                onClick={() => setSelectedTask(null)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition"
              >
                <ChevronRight className="w-6 h-6 rotate-180" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                  <Info className="w-3.5 h-3.5" />
                  বিবরণ ও উদ্দেশ্য
                </h5>
                <p className="text-stone-700 leading-relaxed font-medium">{selectedTask.descriptionBn}</p>
              </div>

              <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
                <h5 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  আজকের সুনির্দিষ্ট কাজ
                </h5>
                <p className="text-stone-800 font-bold leading-relaxed">{selectedTask.taskBn}</p>
              </div>

              <div className="space-y-3">
                <h5 className="text-xs font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  নির্দেশনা ও গাইডেন্স
                </h5>
                <p className="text-sm text-stone-600 leading-relaxed italic">{selectedTask.guidanceBn}</p>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                {!isTaskCompleted(selectedTask.id) ? (
                  <button
                    onClick={() => {
                      onCompleteTask(selectedTask.id);
                      setSelectedTask(null);
                    }}
                    className="w-full py-4 rounded-2xl bg-[#0F4C3A] text-white font-bold shadow-lg shadow-emerald-900/20 hover:bg-[#125B46] transition-all flex items-center justify-center gap-2 group"
                  >
                    <span>কাজটি সম্পন্ন করেছি</span>
                    <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                ) : (
                  <div className="w-full py-4 rounded-2xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>কাজটি ইতিমধ্যে সম্পন্ন হয়েছে</span>
                  </div>
                )}
                
                <button
                  onClick={() => setSelectedTask(null)}
                  className="w-full py-3 text-stone-400 text-xs font-bold hover:text-stone-600 transition"
                >
                  ফিরে যান
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="clay-card p-5 bg-white border border-[#E6E0D6] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-stone-800">{toBengaliNumber(completedCount)}</div>
            <p className="text-[10px] text-stone-500 font-bold uppercase">সম্পন্ন কাজ</p>
          </div>
        </div>

        <div className="clay-card p-5 bg-white border border-[#E6E0D6] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-stone-800">{toBengaliNumber(35 - completedCount)}</div>
            <p className="text-[10px] text-stone-500 font-bold uppercase">বাকি আছে</p>
          </div>
        </div>

        <div className="clay-card p-5 bg-white border border-[#E6E0D6] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-stone-800">{Math.round((completedCount / 35) * 100)}%</div>
            <p className="text-[10px] text-stone-500 font-bold uppercase">সর্বমোট অগ্রগতি</p>
          </div>
        </div>
      </div>
    </div>
  );
};
