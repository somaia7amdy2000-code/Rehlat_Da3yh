import React from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  Users,
  School,
  Sparkles,
  Trophy,
  BookOpen,
  BarChart2,
  RefreshCw,
  Layers,
  Settings,
  LogOut,
} from 'lucide-react';
import { Batch } from '../../types/teacher';

export type TeacherTab =
  | 'dashboard'
  | 'students'
  | 'classes'
  | 'clubs'
  | 'challenges'
  | 'library'
  | 'reports'
  | 'settings';

interface TeacherDashboardHeaderProps {
  selectedBatch: Batch;
  activeTab: TeacherTab;
  onTabChange: (tab: TeacherTab) => void;
  onSwitchBatch: () => void;
  onLogout?: () => void;
}

export const TeacherDashboardHeader: React.FC<TeacherDashboardHeaderProps> = ({
  selectedBatch,
  activeTab,
  onTabChange,
  onSwitchBatch,
  onLogout,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
    { id: 'students', label: 'الطلاب', icon: Users },
    { id: 'classes', label: 'الفصول', icon: School },
    { id: 'clubs', label: 'الأندية', icon: Sparkles },
    { id: 'challenges', label: 'التحديات', icon: Trophy },
    { id: 'library', label: 'المكتبة', icon: BookOpen },
    { id: 'reports', label: 'التقارير', icon: BarChart2 },
    { id: 'settings', label: 'إعدادات النظام', icon: Settings },
  ] as const;

  return (
    <div className="space-y-4 dir-rtl">
      {/* Top Banner showing Selected Batch & Switch Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-teal-950 to-emerald-950 p-4 sm:p-5 rounded-[24px] border border-teal-500/30 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-400/30 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black bg-teal-500/30 text-teal-300 px-2 py-0.5 rounded-md border border-teal-400/30">
                الدفعة الحالية
              </span>
              <span className="text-xs font-bold text-slate-300">{selectedBatch.stage}</span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-white">{selectedBatch.name}</h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSwitchBatch}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-teal-200 text-xs font-black rounded-xl border border-white/10 hover:border-teal-400/50 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-teal-300" />
            <span>تغيير الدفعة ↺</span>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="px-4 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-black rounded-xl border border-rose-500/30 hover:border-rose-400/50 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              title="تسجيل الخروج"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-300" />
              <span>تسجيل الخروج</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Navigation Tabs */}
      <div className="bg-white/90 backdrop-blur-md p-2 rounded-[24px] border border-[#EEF2F7] shadow-sm overflow-x-auto no-scrollbar">
        <nav className="flex items-center gap-1.5 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id as TeacherTab)}
                className={`relative px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? 'text-white bg-gradient-to-r from-teal-600 to-emerald-600 shadow-md shadow-teal-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
