import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { teacherService } from '../services/teacherService';
import { Achievement, StudentUnlockedAchievement } from '../types/teacher';
import {
  Trophy,
  Lock,
  Unlock,
  CheckCircle2,
  Sparkles,
  Target,
  Gift,
  ArrowRight,
  Zap,
  Award,
  ChevronLeft,
  X,
  PartyPopper,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface StudentAchievementsViewProps {
  batchId?: string;
  batchName?: string;
  clubName?: string;
  studentId?: string;
  onAdvanceJourneySteps?: (steps: number) => void;
}

export const StudentAchievementsView: React.FC<StudentAchievementsViewProps> = ({
  batchId = 'batch-g6-f',
  batchName = 'G6 Girls (الصف السادس - إناث 📚)',
  clubName = '🎙️ نادي الإعلام والبودكاست',
  studentId = 'student-default',
  onAdvanceJourneySteps,
}) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlockedMap, setUnlockedMap] = useState<Record<string, string>>({});
  const [pendingMap, setPendingMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unlocked' | 'pending' | 'locked'>('all');
  
  // Submit for Review Modal State
  const [submitModalAchievement, setSubmitModalAchievement] = useState<Achievement | null>(null);
  const [studentNote, setStudentNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Celebration Modal State
  const [celebrationAchievement, setCelebrationAchievement] = useState<{
    achievement: Achievement;
    journeyStepsAdded: number;
    unlockedAt: string;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, [batchId, clubName, studentId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allAchievements, studentUnlocked, studentSubs] = await Promise.all([
        teacherService.getAchievements(batchId, clubName),
        teacherService.getStudentUnlockedAchievements(studentId),
        teacherService.getStudentSubmissions(batchId, studentId),
      ]);

      setAchievements(allAchievements);

      const unkMap: Record<string, string> = {};
      studentUnlocked.forEach((u) => {
        unkMap[u.achievementId] = u.unlockedAt;
      });
      setUnlockedMap(unkMap);

      const pndMap: Record<string, boolean> = {};
      studentSubs.forEach((sub) => {
        if (sub.achievementId && sub.status === 'pending') {
          pndMap[sub.achievementId] = true;
        }
      });
      setPendingMap(pndMap);

      // Check automatic achievement unlocks based on student progress stats
      const studentStats = {
        completedChallengesCount: 0,
        points: 0,
        journeySteps: 0,
        clubTasks: 0,
        libraryViews: 0,
      };

      // Auto-unlock eligible automatic achievements
      for (const ach of allAchievements) {
        if (ach.type === 'automatic' && !unkMap[ach.id]) {
          let isEligible = false;
          const targetVal = ach.autoTriggerValue || 1;

          if (ach.autoTriggerType === 'challenges_completed' && studentStats.completedChallengesCount >= targetVal) {
            isEligible = true;
          } else if (ach.autoTriggerType === 'points_reached' && studentStats.points >= targetVal) {
            isEligible = true;
          } else if (ach.autoTriggerType === 'journey_steps' && studentStats.journeySteps >= targetVal) {
            isEligible = true;
          } else if (ach.autoTriggerType === 'club_tasks' && studentStats.clubTasks >= targetVal) {
            isEligible = true;
          } else if (ach.autoTriggerType === 'library_views' && studentStats.libraryViews >= targetVal) {
            isEligible = true;
          }

          if (isEligible) {
            const result = await teacherService.unlockAchievementForStudent(studentId, ach.id);
            if (result.success) {
              unkMap[ach.id] = result.unlockedAt;
            }
          }
        }
      }

      setUnlockedMap({ ...unkMap });

      // Check if there are newly unlocked achievements that haven't been celebrated yet in this session
      const celebratedIdsStr = sessionStorage.getItem('celebrated_achievements') || '[]';
      const celebratedIds: string[] = JSON.parse(celebratedIdsStr);

      for (const ach of allAchievements) {
        if (unkMap[ach.id] && !celebratedIds.includes(ach.id)) {
          // Trigger celebration for newly unlocked achievement!
          celebratedIds.push(ach.id);
          sessionStorage.setItem('celebrated_achievements', JSON.stringify(celebratedIds));

          triggerConfetti();
          setCelebrationAchievement({
            achievement: ach,
            journeyStepsAdded: ach.journeyStepsReward || 2,
            unlockedAt: unkMap[ach.id],
          });

          if (onAdvanceJourneySteps && (ach.journeyStepsReward || 2) > 0) {
            onAdvanceJourneySteps(ach.journeyStepsReward || 2);
          }
          break; // celebrate one at a time
        }
      }
    } catch (err) {
      console.error('Error loading student achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#14B8A6', '#10B981', '#F59E0B', '#6366F1', '#EC4899'],
    });
  };

  const handleSubmitForReview = async () => {
    if (!submitModalAchievement) return;

    setIsSubmitting(true);
    try {
      await teacherService.submitForReview({
        batchId,
        studentId,
        studentName: 'الطالبة',
        studentAvatar: '',
        className: 'الفصل',
        taskTitle: submitModalAchievement.title,
        sourceType: 'achievement',
        sourceName: submitModalAchievement.targetName || 'إنجازات الدفعة',
        contentSummary: studentNote.trim()
          ? `طلب فتح إنجاز (${submitModalAchievement.title}): ${studentNote.trim()}`
          : `طلب توثيق إنجاز (${submitModalAchievement.title}) - الشرط: ${submitModalAchievement.requiredCondition}`,
        rewardXp: submitModalAchievement.xpReward || 200,
        achievementId: submitModalAchievement.id,
      });

      // Update pending map
      setPendingMap((prev) => ({
        ...prev,
        [submitModalAchievement.id]: true,
      }));

      setToastMessage(`🌱 خطوة جديدة في رحلتك! تم إرسال طلب اعتماد إنجاز "${submitModalAchievement.title}" للمعلمة للمراجعة 🚀`);
      setTimeout(() => setToastMessage(null), 4000);

      setSubmitModalAchievement(null);
      setStudentNote('');
    } catch (err) {
      console.error('Failed to submit achievement:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const unlockedCount = Object.keys(unlockedMap).length;
  const pendingCount = Object.keys(pendingMap).length;
  const totalCount = achievements.length;
  const completionPercentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  const filteredAchievements = achievements.filter((ach) => {
    const isUnlocked = !!unlockedMap[ach.id];
    const isPending = !!pendingMap[ach.id];
    if (activeFilter === 'unlocked') return isUnlocked;
    if (activeFilter === 'pending') return isPending && !isUnlocked;
    if (activeFilter === 'locked') return !isUnlocked && !isPending;
    return true;
  });

  return (
    <div className="space-y-6 dir-rtl text-slate-800">
      
      {/* HEADER HERO STATS CARD */}
      <div className="rounded-[32px] bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-teal-500/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 font-bold text-xs border border-teal-400/30">
                🏆 سجل إنجازات الطالب
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-400/30">
                {clubName}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              لوحة الإنجازات والأوسمة 🏅
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-bold leading-relaxed">
              هنا تجد جميع الأوسمة والإنجازات الخاصة بدفعتك وناديك. افتح الإنجازات لترتقي بتقدمك في "رحلتك" القرآنية!
            </p>
          </div>

          {/* Progress Doughnut / Counter Card */}
          <div className="bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-[24px] border border-white/10 flex items-center gap-4 shrink-0 shadow-lg">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-teal-400 flex items-center justify-center text-white text-2xl font-black shadow-md">
              <Trophy className="w-8 h-8 text-amber-100" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-300">مستوى الإنجاز العام</div>
              <div className="text-2xl font-black font-mono text-amber-300">
                {unlockedCount} / {totalCount} <span className="text-xs font-sans text-slate-200">({completionPercentage}%)</span>
              </div>
              <div className="w-36 bg-slate-700/80 rounded-full h-2 mt-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-400 to-teal-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3.5 rounded-[20px] shadow-2xl border border-teal-500/40 font-bold text-xs sm:text-sm flex items-center gap-2.5 dir-rtl"
          >
            <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FILTER TABS & INFOBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-[24px] border border-slate-100 shadow-xs">
        <div className="flex items-center gap-2 bg-slate-100/80 p-1 rounded-2xl overflow-x-auto">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              activeFilter === 'all'
                ? 'bg-teal-700 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الكل ({achievements.length})
          </button>
          <button
            onClick={() => setActiveFilter('unlocked')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              activeFilter === 'unlocked'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            المفتوحة 🔓 ({unlockedCount})
          </button>
          <button
            onClick={() => setActiveFilter('pending')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              activeFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            قيد المراجعة ⏳ ({pendingCount})
          </button>
          <button
            onClick={() => setActiveFilter('locked')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              activeFilter === 'locked'
                ? 'bg-slate-700 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            المقفلة 🔒 ({totalCount - unlockedCount - pendingCount})
          </button>
        </div>

        <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-teal-600" />
          <span>موافقات المعلمة تفتح الإنجاز وتزيد خطواتك تلقائيًا في "رحلتي" 🚀</span>
        </div>
      </div>

      {/* ACHIEVEMENTS GRID */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 font-bold">جاري تحميل الإنجازات...</div>
      ) : filteredAchievements.length === 0 ? (
        <div className="bg-white rounded-[28px] p-8 text-center border border-slate-100 space-y-2">
          <Award className="w-12 h-12 mx-auto text-slate-300" />
          <h3 className="font-black text-slate-700 text-base">لا توجد إنجازات بعد. في انتظار أول إنجاز تنشئه المعلمة.</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAchievements.map((achievement) => {
            const isUnlocked = !!unlockedMap[achievement.id];
            const isPending = !!pendingMap[achievement.id];
            const unlockedDate = unlockedMap[achievement.id];

            return (
              <motion.div
                key={achievement.id}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                className={`rounded-[28px] p-5 sm:p-6 transition-all relative overflow-hidden flex flex-col justify-between ${
                  isUnlocked
                    ? 'bg-white border-2 border-teal-500/80 shadow-lg shadow-teal-500/10'
                    : isPending
                    ? 'bg-amber-50/50 border-2 border-amber-300 shadow-sm'
                    : 'bg-slate-50/90 border border-slate-200/80 opacity-90'
                }`}
              >
                {/* Background Status Accent */}
                {isUnlocked && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-bl-full pointer-events-none" />
                )}

                <div>
                  {/* Top Row: Icon, Title & Status Badge */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-md ${
                          isUnlocked
                            ? 'bg-gradient-to-br from-amber-100 via-teal-50 to-emerald-100 border-2 border-amber-300/80 text-amber-600'
                            : isPending
                            ? 'bg-amber-100 text-amber-700 border border-amber-300'
                            : 'bg-slate-200 text-slate-400 border border-slate-300 grayscale'
                        }`}
                      >
                        {achievement.icon || '🏆'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                              isUnlocked
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : isPending
                                ? 'bg-amber-100 text-amber-800 border-amber-200'
                                : 'bg-slate-200 text-slate-600 border-slate-300'
                            }`}
                          >
                            {achievement.targetName || 'دفعة الطالب'}
                          </span>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                              achievement.type === 'automatic'
                                ? 'bg-teal-50 text-teal-800 border-teal-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {achievement.type === 'automatic' ? 'إنجاز آلي ⚡' : 'إنجاز يدوي 📤'}
                          </span>
                        </div>
                        <h3
                          className={`font-black text-base ${
                            isUnlocked ? 'text-slate-900' : 'text-slate-800'
                          }`}
                        >
                          {achievement.title}
                        </h3>
                      </div>
                    </div>

                    {/* Status Badge Icon */}
                    <div className="shrink-0">
                      {isUnlocked ? (
                        <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200 font-black text-xs shadow-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>تم الإنجاز 🔓</span>
                        </div>
                      ) : isPending ? (
                        <div className="flex items-center gap-1 bg-amber-100 text-amber-800 px-3 py-1 rounded-full border border-amber-300 font-black text-xs shadow-xs">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                          <span>قيد المراجعة ⏳</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 bg-slate-200/80 text-slate-600 px-2.5 py-1 rounded-full border border-slate-300 font-bold text-xs">
                          <Lock className="w-3.5 h-3.5 text-slate-500" />
                          <span>مقفل 🔒</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {achievement.description && (
                    <p className="text-xs text-slate-600 font-bold leading-relaxed mb-3">
                      {achievement.description}
                    </p>
                  )}

                  {/* CLEAR REQUIREMENT CONDITION BOX (الشرط المطلوب لفتحه بوضوح) */}
                  {!isUnlocked ? (
                    <div className="p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-2xl space-y-1 my-3 text-xs">
                      <div className="flex items-center gap-1.5 font-black text-amber-900">
                        <Target className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>الشرط المطلوب لفتح هذا الإنجاز 🎯:</span>
                      </div>
                      <p className="text-slate-800 font-bold leading-relaxed pr-5">
                        {achievement.requiredCondition || 'إكمال المهام المحددة من المعلمة'}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-teal-50/70 border border-teal-100 rounded-2xl flex items-center justify-between text-xs font-bold text-teal-900 my-3">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-teal-600" />
                        <span>الشرط المكتمل: {achievement.requiredCondition}</span>
                      </div>
                      <span className="text-[11px] text-teal-700 font-mono">
                        تاريخ الفتح: {unlockedDate}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Action / Reward Row */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/60">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>+{achievement.journeyStepsReward || 2} خطوات في "رحلتي" 🚀</span>
                  </div>

                  {!isUnlocked && achievement.type === 'automatic' && (
                    <div className="px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 font-black text-xs border border-teal-200 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                      <span>ينفتح تلقائياً فور تحقق الشرط ⚡</span>
                    </div>
                  )}

                  {!isUnlocked && achievement.type !== 'automatic' && !isPending && (
                    <button
                      onClick={() => setSubmitModalAchievement(achievement)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-xs shadow-md shadow-teal-600/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <span>إرسال للمراجعة 📤</span>
                    </button>
                  )}

                  {!isUnlocked && achievement.type !== 'automatic' && isPending && (
                    <button
                      disabled
                      className="px-4 py-2 rounded-xl bg-amber-100 text-amber-800 font-black text-xs border border-amber-300 flex items-center gap-1.5 opacity-90 cursor-not-allowed"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                      <span>قيد مراجعة المعلمة ⏳</span>
                    </button>
                  )}

                  {isUnlocked && (
                    <span className="text-xs font-black text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>مسجل بسجلك ✓</span>
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* SUBMIT FOR REVIEW MODAL */}
      <AnimatePresence>
        {submitModalAchievement && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 dir-rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-white rounded-[32px] p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 relative"
            >
              <button
                onClick={() => setSubmitModalAchievement(null)}
                className="absolute top-5 left-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-3xl shrink-0">
                  {submitModalAchievement.icon || '🏆'}
                </div>
                <div>
                  <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200">
                    طلب مراجعة واعتماد إنجاز المعلمة 🏆
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-0.5">
                    {submitModalAchievement.title}
                  </h3>
                </div>
              </div>

              {/* Requirement Summary Box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
                <div className="font-black text-slate-800 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-amber-600" />
                  <span>الشرط المطلوب لإتمامه:</span>
                </div>
                <p className="text-slate-600 font-bold leading-relaxed">
                  {submitModalAchievement.requiredCondition}
                </p>
                <div className="pt-2 border-t border-slate-200/60 flex items-center gap-3 text-amber-700 font-black">
                  <span>المكافأة عند الموافقة: +{submitModalAchievement.xpReward || 200} نقطة</span>
                  <span>•</span>
                  <span>+{submitModalAchievement.journeyStepsReward || 2} خطوات في "رحلتي" 🚀</span>
                </div>
              </div>

              {/* Optional Note Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">
                  تفاصيل الإنجاز / ملاحظات التوثيق للمعلمة (اختياري):
                </label>
                <textarea
                  value={studentNote}
                  onChange={(e) => setStudentNote(e.target.value)}
                  placeholder="مثال: أتممت حفظ الأجزاء الثلاثة وتلخيص الدرس المرفق في المكتبة بنجاح..."
                  rows={3}
                  className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all resize-none"
                />
              </div>

              <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl text-xs text-teal-900 font-bold leading-relaxed">
                ℹ️ بعد إرسال الطلب، سيظهر في لوحة المعلمة بتبويب "الطلبات والتسليمات المعلقة". عند موافقة المعلمة، سينفتح الإنجاز وتتحرك رحلتك القرآنية فورًا!
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSubmitForReview}
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-xs shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSubmitting ? 'جاري إرسال الطلب...' : 'إرسال للمراجعة الآن 📤'}</span>
                </button>
                <button
                  onClick={() => setSubmitModalAchievement(null)}
                  className="px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs cursor-pointer transition-all"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CELEBRATION POPUP MODAL */}
      <AnimatePresence>
        {celebrationAchievement && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 dir-rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="w-full max-w-md bg-white rounded-[36px] p-6 sm:p-8 text-center space-y-5 shadow-2xl border border-amber-200 relative overflow-hidden"
            >
              <button
                onClick={() => setCelebrationAchievement(null)}
                className="absolute top-4 left-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Glowing Badge Container */}
              <div className="relative mx-auto w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-400 via-teal-400 to-emerald-500 p-1 shadow-xl shadow-amber-500/20 flex items-center justify-center animate-bounce">
                <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center text-5xl">
                  {celebrationAchievement.achievement.icon || '🏆'}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-black bg-amber-100 text-amber-800 px-3 py-1 rounded-full border border-amber-200 inline-flex items-center gap-1">
                  <PartyPopper className="w-4 h-4 text-amber-600" />
                  <span>🏅 أضفت وسامًا جديدًا إلى رحلتك! ✨</span>
                </span>
                <h2 className="text-2xl font-black text-slate-900 pt-2">
                  {celebrationAchievement.achievement.title}
                </h2>
                <p className="text-xs text-slate-600 font-bold leading-relaxed px-2">
                  {celebrationAchievement.achievement.description || celebrationAchievement.achievement.requiredCondition}
                </p>
              </div>

              {/* Journey Steps Boost Banner */}
              <div className="p-4 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-2xl space-y-1 shadow-md">
                <div className="text-xs font-bold text-teal-100">🌟 محطة جديدة أصبحت خلفك! تقدمت خطوة للأمام</div>
                <div className="text-lg font-black flex items-center justify-center gap-1.5">
                  <Zap className="w-5 h-5 text-amber-300" />
                  <span>+{celebrationAchievement.journeyStepsAdded} خطوات مضافة تلقائيًا إلى "رحلتي" 🚀</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setCelebrationAchievement(null)}
                  className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm shadow-lg transition-all cursor-pointer"
                >
                  🚀 مواصلة التقدم في رحلتي
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
