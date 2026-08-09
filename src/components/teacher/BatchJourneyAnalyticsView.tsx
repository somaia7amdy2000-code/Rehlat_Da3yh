import React, { useState } from 'react';
import { getSystemSettings } from '../../services/systemSettingsService';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass,
  Lock,
  Search,
  CheckCircle2,
  TrendingUp,
  Award,
  Trophy,
  Star,
  BookOpen,
  Calendar,
  Sparkles,
  Users,
  Info,
  ShieldCheck,
  ChevronLeft,
  Target,
  Flame,
  MessageSquare,
  Gift,
  HelpCircle,
  Crown,
} from 'lucide-react';
import { Batch, BatchStudent } from '../../types/teacher';
import { calculateStudentJourney, StudentJourneyMetrics } from '../../services/journeyEngine';

interface BatchJourneyAnalyticsViewProps {
  batch: Batch;
  students: BatchStudent[];
}

export const BatchJourneyAnalyticsView: React.FC<BatchJourneyAnalyticsViewProps> = ({ batch, students }) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-[28px] p-12 text-center border border-[#EEF2F7] space-y-4 dir-rtl">
        <div className="w-16 h-16 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto text-2xl font-black">
          🧭
        </div>
        <h3 className="text-lg font-black text-slate-900">لا يوجد طلاب في هذه الدفعة حتى الآن</h3>
        <p className="text-xs text-slate-500 font-bold max-w-md mx-auto leading-relaxed">
          قم بإضافة طلاب للدفعة أو استيرادهم من ملف Excel لتتمكن من متابعة وتحليل خريطة الرحلة ومحطات التقدم الخاصة بهم.
        </p>
      </div>
    );
  }

  // Filter students
  const filteredStudents = students.filter(
    (s) =>
      s.name.includes(searchQuery) ||
      s.className.includes(searchQuery) ||
      (s.studentCode && s.studentCode.includes(searchQuery))
  );

  // Active student object
  const activeStudentRaw = students.find((s) => s.id === selectedStudentId) || students[0];

  // Convert BatchStudent to StudentJourneyMetrics
  const studentMetrics: StudentJourneyMetrics = {
    id: activeStudentRaw.id,
    name: activeStudentRaw.name,
    batchId: batch.id,
    className: activeStudentRaw.className,
    clubName: activeStudentRaw.clubName,
    xp: activeStudentRaw.points ?? 0, // XP
    points: activeStudentRaw.points ?? 0,
    completedChallengesCount: activeStudentRaw.completedChallengesCount ?? 0,
    approvedAchievementsCount: 0,
    clubTasksCompleted: activeStudentRaw.completedTasks ?? 0,
    clubAnnouncementsCount: 0,
    attendanceRate: activeStudentRaw.attendanceRate ?? 0,
    teacherEvaluationsCount: 0,
    libraryViewsCount: 0,
    specialRewardsCount: 0,
    badgesEarnedCount: 0,
    avatarUrl: activeStudentRaw.avatarUrl,
  };

  const journeyResult = calculateStudentJourney(studentMetrics);

  return (
    <div className="space-y-6 dir-rtl text-slate-900 font-sans pb-12">
      {/* 1. TOP READ-ONLY BANNER & SYSTEM STATEMENT */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-slate-900 via-teal-950 to-emerald-950 p-6 sm:p-8 text-white shadow-2xl border border-teal-500/30"
      >
        <div className="absolute top-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-black backdrop-blur-md">
              <Compass className="w-4 h-4 text-teal-300" />
              <span>لوحة تحليلات الرحلة • Journey Analytics</span>
            </div>

            {/* Strict Read-Only Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-black backdrop-blur-md shadow-xs">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>صفحة للعرض والتحليل فقط (قراءة فقط)</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>تحليلات المحطة والتقدم المباشر للدفعة ({batch.name}) 🧭</span>
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-teal-100/90 leading-relaxed max-w-3xl">
              تنعكس جميع إجراءات المعلمة (اعتماد التحديات، اعتماد الإنجازات، التقييمات، مهام الأندية،
              والحضور) تلقائياً وفي الوقت الفعلي داخل محرك رحلة الطالبة دون حاجة لتعديل يدوي للمحطة.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-teal-200/80 font-bold border-t border-white/10">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> المحطات تحسب تلقائياً من الإنجازات
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-300" /> محرك محمي لا يسمح بنقل الطالب يدوياً
            </span>
          </div>
        </div>
      </motion.div>

      {/* 2. MAIN LAYOUT: STUDENT SELECTOR SIDEBAR + ANALYTICS DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SIDEBAR: Student List Filter */}
        <div className="lg:col-span-4 bg-white rounded-[24px] border border-[#EEF2F7] shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-600" />
              <h2 className="text-sm font-black text-slate-800">طالبات الدفعة ({students.length})</h2>
            </div>
            <span className="text-[10px] font-bold bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full">
              اختر طالبة لاستعراض رحلتها
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث باسم الطالبة أو الفصل..."
              className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>

          {/* Students List */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredStudents.map((std) => {
              const isSelected = std.id === selectedStudentId;
              const stdCalc = calculateStudentJourney({
                id: std.id,
                name: std.name,
                xp: std.points ?? 0,
                points: std.points ?? 0,
                completedChallengesCount: std.completedChallengesCount ?? 0,
                approvedAchievementsCount: 0,
                clubTasksCompleted: std.completedTasks ?? 0,
                clubAnnouncementsCount: 0,
                attendanceRate: std.attendanceRate ?? 0,
                teacherEvaluationsCount: 0,
                libraryViewsCount: 0,
                specialRewardsCount: 0,
                badgesEarnedCount: 0,
              });

              return (
                <button
                  key={std.id}
                  onClick={() => setSelectedStudentId(std.id)}
                  className={`w-full text-right p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                    isSelected
                      ? 'bg-gradient-to-r from-teal-50 to-emerald-50 border-teal-500 shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <img
                    src={std.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                    alt={std.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-slate-800 truncate">{std.name}</h3>
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                        {stdCalc.currentStation.title}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500 font-bold">
                      <span className="truncate">{std.className}</span>
                      <span className="text-teal-600 font-black">{stdCalc.journeyPercentage}%</span>
                    </div>
                  </div>
                </button>
              );
            })}

            {filteredStudents.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400 font-bold">
                لا توجد طالبة تطابق نتائج البحث
              </div>
            )}
          </div>
        </div>

        {/* MAIN PANEL: Selected Student Detailed Journey Analytics */}
        <div className="lg:col-span-8 space-y-6">
          {/* A. Hero Overview Card for Selected Student */}
          <div className="bg-white rounded-[28px] border border-[#EEF2F7] shadow-sm p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <img
                  src={studentMetrics.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                  alt={studentMetrics.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-teal-500/30 shadow-md"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900">{studentMetrics.name}</h2>
                    <span className="text-[10px] font-black bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-full">
                      مفعل بالدفعة
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-500 mt-0.5">
                    {studentMetrics.className} • {studentMetrics.clubName || 'عضو في نادي التلاوة'}
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-3.5 rounded-2xl shadow-md text-center shrink-0">
                <span className="text-[10px] font-bold text-emerald-100 block">المحطة المحسوبة الآن</span>
                <span className="text-base font-black text-white">{journeyResult.currentStation.title}</span>
              </div>
            </div>

            {/* Live Journey Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-teal-600" />
                  <span>نسبة الإنجاز الإجمالية بالرحلة:</span>
                </span>
                <span className="text-teal-600 text-sm">{journeyResult.journeyPercentage}%</span>
              </div>

              <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${journeyResult.journeyPercentage}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-teal-500 via-emerald-500 to-amber-400 rounded-full shadow-xs"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 pt-1 overflow-x-auto gap-2">
                {getSystemSettings().stations.map((st) => (
                  <span key={st.id} className="whitespace-nowrap">{st.title}</span>
                ))}
              </div>
            </div>

            {/* Primary Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
                <span className="text-[11px] font-bold text-slate-500 block">إجمالي الـ XP</span>
                <span className="text-base font-black text-teal-600 font-mono mt-0.5 block">
                  {journeyResult.totalWeightedScore} XP
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
                <span className="text-[11px] font-bold text-slate-500 block">النقاط الكلية</span>
                <span className="text-base font-black text-emerald-600 font-mono mt-0.5 block">
                  {studentMetrics.points} نقطة
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
                <span className="text-[11px] font-bold text-slate-500 block">التحديات المعتمدة</span>
                <span className="text-base font-black text-sky-600 font-mono mt-0.5 block">
                  {studentMetrics.completedChallengesCount} تحدي
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
                <span className="text-[11px] font-bold text-slate-500 block">الإنجازات والأوسمة</span>
                <span className="text-base font-black text-amber-600 font-mono mt-0.5 block">
                  {studentMetrics.approvedAchievementsCount + studentMetrics.badgesEarnedCount} أوسمة
                </span>
              </div>
            </div>
          </div>

          {/* B. Detailed Breakdown: Why the Student Reached this Station */}
          <div className="bg-white rounded-[28px] border border-[#EEF2F7] shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-black text-slate-900">
                  لماذا وصلت الطالبة لهذه المحطة؟ (تفاصيل احتساب الأنظمة الـ 11)
                </h3>
              </div>
              <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                تحديث حي
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {journeyResult.breakdown.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-teal-200 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl shrink-0">{item.icon}</span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-slate-800 truncate">{item.label}</h4>
                      <span className="text-[11px] font-bold text-slate-500">{item.value}</span>
                    </div>
                  </div>

                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100 shrink-0">
                    +{item.contributionXp} XP
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* C. Remaining Requirements for the Next Station */}
          <div className="bg-white rounded-[28px] border border-[#EEF2F7] shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black text-slate-900">
                  المتطلبات المتبقية للانتقال للمحطة القادمة ({journeyResult.nextStation?.title || 'أعلى محطة 👑'})
                </h3>
              </div>
              {journeyResult.nextStation && (
                <span className="text-[11px] font-extrabold bg-amber-50 text-amber-800 px-3 py-1 rounded-full border border-amber-200">
                  هدف الترقية
                </span>
              )}
            </div>

            {journeyResult.nextStation ? (
              <div className="space-y-2.5">
                {journeyResult.remainingRequirements.map((req, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                      req.completed
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                          req.completed ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {req.completed ? '✓' : idx + 1}
                      </div>
                      <div>
                        <h4 className="text-xs font-black">{req.title}</h4>
                        <p className="text-[11px] font-semibold text-slate-500">
                          الحالي: {req.current} / المطلوب: {req.required}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-xl ${
                        req.completed
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {req.completed ? 'مكتمل ✓' : 'متبقي'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-200 text-center space-y-2">
                <Crown className="w-10 h-10 text-amber-500 mx-auto" />
                <h4 className="text-base font-black text-slate-900">وصلت الطالبة لأعلى محطة في الرحلة! (👑 قدوة)</h4>
                <p className="text-xs font-bold text-slate-600 max-w-md mx-auto">
                  حازت الطالبة على جميع أوسمة ومحطات الدفعة بامتياز، وسيتم منحها تاج القدوة والتكريم الرسمي بحفل الدفعة.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
