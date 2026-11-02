import React from 'react';
import { Bell, Check, X, Info, Moon, Calendar, AlertTriangle } from 'lucide-react';
import { InAppNotification } from '../types/ayyam';

interface NotificationCenterProps {
  notifications: InAppNotification[];
  onMarkRead: (id: string) => void;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkRead,
  onClose,
}) => {
  return (
    <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-stone-200 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Header */}
      <div className="px-4 py-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-emerald-800" />
          <h4 className="font-bold text-xs text-stone-900 font-bengali">
            ইন-অ্যাপ নোটিফিকেশন সেন্টার
          </h4>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-stone-100 p-1">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-400">
            <Bell className="w-6 h-6 mx-auto mb-1 text-stone-300" />
            <p>কোনো নতুন নোটিফিকেশন নেই।</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-3 text-xs transition flex items-start gap-2.5 ${
                n.read ? 'bg-white text-stone-600' : 'bg-emerald-50/50 text-stone-900 font-medium'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {n.type === 'ayyam_advance' ? (
                  <Moon className="w-4 h-4 text-amber-500" />
                ) : n.type === 'date_correction' ? (
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                ) : (
                  <Info className="w-4 h-4 text-emerald-600" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-bold text-stone-900 leading-tight mb-0.5">{n.title}</div>
                <p className="text-[11px] text-stone-600 leading-relaxed">{n.message}</p>
                <span className="text-[9px] text-stone-400 mt-1 block">
                  {new Date(n.timestamp).toLocaleDateString('bn-BD', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {!n.read && (
                <button
                  onClick={() => onMarkRead(n.id)}
                  className="p-1 rounded-md text-emerald-700 hover:bg-emerald-100 shrink-0"
                  title="পঠিত চিহ্নিত করুন"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
