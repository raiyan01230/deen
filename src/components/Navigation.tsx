import React from 'react';
import {
  Home,
  CheckCircle2,
  BookOpen,
  Calendar,
  BarChart3,
  HeartHandshake,
  Clock,
  Sparkles,
  Compass,
  Target,
  Moon,
} from 'lucide-react';

export type NavTabId =
  | 'home'
  | 'salah'
  | 'deeds'
  | 'ayyam'
  | 'hadith'
  | 'dua'
  | 'quran'
  | 'ramadan'
  | 'character'
  | 'habits'
  | 'improvement'
  | 'calendar'
  | 'analytics';

interface NavItem {
  id: NavTabId;
  labelBn: string;
  labelEn: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', labelBn: 'হোম ড্যাশবোর্ড', labelEn: 'Home', icon: Home },
  { id: 'salah', labelBn: 'সালাত ট্র্যাকার', labelEn: 'Salah Tracker', icon: Clock },
  { id: 'deeds', labelBn: 'দৈনন্দিন আমল', labelEn: 'Daily Deeds', icon: CheckCircle2 },
  { id: 'improvement', labelBn: 'ইমপ্রুভমেন্ট ট্র্যাকার', labelEn: 'Improvement', icon: Target },
  { id: 'ayyam', labelBn: 'আইয়ামে বীজ সিয়াম', labelEn: 'Ayyam al-Bid', icon: Moon },
  { id: 'hadith', labelBn: 'সহীহ হাদিস লাইব্রেরি', labelEn: 'Sahih Hadith', icon: BookOpen },
  { id: 'dua', labelBn: 'দুআ সম্ভার', labelEn: 'Dua Library', icon: Sparkles },
  { id: 'quran', labelBn: 'কুরআন ট্র্যাকার', labelEn: 'Quran Tracker', icon: BookOpen },
  { id: 'ramadan', labelBn: 'রমাদান প্রস্তুতি', labelEn: 'Ramadan 1448', icon: Compass },
  { id: 'character', labelBn: 'আত্মশুদ্ধি ও গীবত বর্জন', labelEn: 'Character & Soul', icon: HeartHandshake },
  { id: 'habits', labelBn: 'ব্যক্তিগত লক্ষ্য', labelEn: 'Habits & Growth', icon: Target },
  { id: 'calendar', labelBn: 'মাসিক ক্যালেন্ডার', labelEn: 'Calendar', icon: Calendar },
  { id: 'analytics', labelBn: 'বিশ্লেষণ ও রিপোর্ট', labelEn: 'Analytics', icon: BarChart3 },
];

interface NavigationProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onSelectTab }) => {
  return (
    <>
      {/* Desktop Horizontal Scrollable Tab Bar */}
      <nav className="bg-white/95 border-b border-[#E6E0D6] shadow-2xs sticky top-[58px] z-30">
        <div className="max-w-7xl mx-auto px-2 sm:px-6">
          <div className="flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar py-2.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#0F4C3A] to-[#125B46] text-white shadow-md shadow-emerald-900/15'
                      : 'text-stone-600 hover:text-emerald-900 hover:bg-stone-100/80'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-amber-300' : 'text-stone-400 group-hover:text-emerald-800'
                    }`}
                  />
                  <span>{item.labelBn}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Quick Bar for top 5 most frequent tabs */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-lg px-2 py-1.5 flex justify-around">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center p-1 rounded-lg w-16 transition-colors ${
                isActive ? 'text-[#0F4C3A]' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              <div
                className={`p-1 rounded-lg transition-transform ${
                  isActive ? 'bg-emerald-50 text-emerald-800 scale-105' : ''
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] mt-0.5 truncate font-medium ${isActive ? 'font-bold' : ''}`}>
                {item.labelBn.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
};
