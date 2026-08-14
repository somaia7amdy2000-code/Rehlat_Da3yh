import React from 'react';
import { motion } from 'motion/react';
import {
  Users,
  School,
  Sparkles,
  Trophy,
  Award,
  BookOpen,
  UserPlus,
  Plus,
  PlusCircle,
  Upload,
  Send,
  Mail,
  Trash2,
} from 'lucide-react';
import { Batch, BatchDashboardStats, BatchAnnouncement } from '../../types/teacher';

interface BatchDashboardViewProps {
  batch: Batch;
  stats: BatchDashboardStats;
  announcements?: BatchAnnouncement[];
  onOpenAddStudent: () => void;
  onOpenCreateClass: () => void;
  onOpenCreateClub: () => void;
  onOpenCreateChallenge: () => void;
  onOpenCreateAchievement?: () => void;
  onOpenUploadLibrary: () => void;
  onOpenAddAnnouncement?: () => void;
  onDeleteAnnouncement?: (id: string) => void;
}

export const BatchDashboardView: React.FC<BatchDashboardViewProps> = ({
  batch,
  stats,
  announcements = [],
  onOpenAddStudent,
  onOpenCreateClass,
  onOpenCreateClub,
  onOpenCreateChallenge,
  onOpenUploadLibrary,
  onOpenAddAnnouncement,
  onDeleteAnnouncement,
}) => {
  const statCards = [
    {
      title: 'إجمالي الطلاب',
      value: stats.totalStudents,
      unit: 'طالب/طالبة',
      icon: Users,
      border: 'border-emerald-200/80',
      iconColor: 'text-emerald-600',
      bgIcon: 'bg-emerald-100',
    },
    {
      title: 'إجمالي الفصول',
      value: stats.totalClasses,
      unit: 'فصل',
      icon: School,
      border: 'border-[#0F766E]/30',
      iconColor: 'text-[#0F766E]',
      bgIcon: 'bg-teal-100',
    },
    {
      title: 'إجمالي الأندية',
      value: stats.activeClubs,
      unit: 'نادٍ مفعل',
      icon: Sparkles,
      border: 'border-purple-200/80',
      iconColor: 'text-purple-600',
      bgIcon: 'bg-purple-100',
    },
    {
      title: 'إجمالي التحديات',
      value: stats.activeChallenges,
      unit: 'تحدٍ',
      icon: Trophy,
      border: 'border-amber-200/80',
      iconColor: 'text-amber-600',
      bgIcon: 'bg-amber-100',
    },
    {
      title: 'إجمالي ملفات المكتبة',
      value: stats.libraryCount || 0,
      unit: 'ملف',
      icon: BookOpen,
      border: 'border-rose-200/80',
      iconColor: 'text-rose-600',
      bgIcon: 'bg-rose-100',
    },
  ];

  const quickActions = [
    {
      label: 'إرسال رسالة للطلاب',
      icon: Send,
      onClick: onOpenAddAnnouncement,
      color: 'bg-[#0F766E] hover:bg-teal-800 text-white shadow-teal-700/20',
    },
    {
      label: 'إضافة طالب',
      icon: UserPlus,
      onClick: onOpenAddStudent,
      color: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20',
    },
    {
      label: 'إضافة فصل',
      icon: Plus,
      onClick: onOpenCreateClass,
      color: 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/20',
    },
    {
      label: 'إنشاء نادي',
      icon: PlusCircle,
      onClick: onOpenCreateClub,
      color: 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20',
    },
    {
      label: 'إنشاء تحدي',
      icon: Trophy,
      onClick: onOpenCreateChallenge,
      color: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20',
    },
    {
      label: 'رفع ملف للمكتبة',
      icon: Upload,
      onClick: onOpenUploadLibrary,
      color: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20',
    },
  ];

  return (
    <div className="space-y-8 dir-rtl">
      {/* Live Statistics Section */}
      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
          <span>الإحصائيات المباشرة لـ {batch.name}</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`p-4 sm:p-5 rounded-[24px] bg-white border ${card.border} shadow-[0_4px_20px_rgb(0,0,0,0.02)] space-y-3 relative overflow-hidden`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl ${card.bgIcon} ${card.iconColor} flex items-center justify-center shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {card.value}
                  </div>
                  <div className="text-[11px] font-bold text-slate-500 mt-0.5">{card.title}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="p-6 rounded-[28px] bg-white border border-[#EEF2F7] shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-black text-slate-900">الإجراءات السريعة 🚀</h2>
          <span className="text-xs font-bold text-slate-400">انقري لفتح نافذة الإنشاء مباشرة</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.label}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={action.onClick}
                className={`p-4 rounded-2xl ${action.color} font-extrabold text-xs flex flex-col items-center justify-center gap-2.5 cursor-pointer shadow-md transition-all text-center`}
              >
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <span>{action.label}</span>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Sent Teacher Messages Section */}
      <section className="p-6 rounded-[28px] bg-white border border-[#EEF2F7] shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-[#0F766E]">
            <Mail className="w-5 h-5" />
            <h2 className="text-base font-black text-slate-900">الرسائل والإعلانات المرسلة للدفعة</h2>
          </div>
          <button
            onClick={onOpenAddAnnouncement}
            className="px-3.5 py-1.5 rounded-xl bg-teal-50 text-[#0F766E] border border-teal-200 text-xs font-bold hover:bg-teal-100 flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>رسالة جديدة</span>
          </button>
        </div>

        {announcements.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <Mail className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-500">لا توجد رسائل مرسلة في هذه الدفعة حتى الآن.</p>
            <button
              onClick={onOpenAddAnnouncement}
              className="text-xs font-black text-[#0F766E] hover:underline"
            >
              + إرسال أول رسالة للطالبة أو المجموعة
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((msg) => (
              <div
                key={msg.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-teal-200 transition-all"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-teal-100 text-[#0F766E] font-extrabold text-[11px]">
                      موجهة إلى: {msg.targetName || 'الدفعة العامة'}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      {msg.createdAt}
                    </span>
                    {msg.readBy && msg.readBy.length > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                        قرأها {msg.readBy.length} طالب
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-800 leading-relaxed">
                    {msg.content}
                  </p>
                  <div className="text-[10px] font-extrabold text-slate-400">
                    المرسل: {msg.author || 'المعلمة'}
                  </div>
                </div>

                {onDeleteAnnouncement && (
                  <button
                    onClick={() => onDeleteAnnouncement(msg.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 self-end sm:self-center transition-colors cursor-pointer"
                    title="حذف الرسالة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
