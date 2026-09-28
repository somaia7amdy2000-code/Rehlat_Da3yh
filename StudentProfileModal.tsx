import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, School, Sparkles, Trophy, BookOpen, Compass, CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { BatchStudent, Batch, BatchClub, BatchChallenge, PendingSubmission } from '../../types/teacher';
import { calculateStudentJourney } from '../../services/journeyEngine';
import { teacherService } from '../../services/teacherService';

interface StudentProfileModalProps {
  student: BatchStudent | null;
  batch: Batch;
  onClose: () => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({ student, batch, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [fullContext, setFullContext] = useState<any>(null);
  const [currentStudentPoints, setCurrentStudentPoints] = useState(student?.points || 0);

  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!student) return;
    let isMounted = true;
    setLoading(true);
    setNotFound(false);

    const lookupKey = student.id || student.studentCode || student.name;
    teacherService.getStudentFullContext(lookupKey).then((ctx) => {
      if (isMounted) {
        setFullContext(ctx);
        if (ctx?.student) {
          setCurrentStudentPoints(ctx.student.points ?? 0);
        } else {
          // If remote context returned null / not found, do not retain stale points or data
          setNotFound(true);
          setCurrentStudentPoints(0);
        }
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [student]);

  if (!student) return null;

  // Authoritative activeStudent object: never fall back to stale student prop if remote record does not exist
  const activeStudent: BatchStudent = fullContext?.student || {
    ...student,
    points: notFound ? 0 : (student.points ?? 0),
    completedChallengesCount: notFound ? 0 : (student.completedChallengesCount ?? 0),
    completedTasks: notFound ? 0 : (student.completedTasks ?? 0),
  };

  const handleModifyPoints = async (delta: number) => {
    // Optimistic display only. Do NOT write into activeStudent before saving: it is the same
    // object as the service's local cache, so the service would see "no change" and skip the DB.
    setCurrentStudentPoints((prev) => Math.max(0, prev + delta));
    try {
      const updated = await teacherService.adjustStudentPoints(batch.id, activeStudent.id, delta);
      setCurrentStudentPoints(updated.points);

      const freshCtx = await teacherService.getStudentFullContext(activeStudent.id);
      if (freshCtx) {
        setFullContext(freshCtx);
        setCurrentStudentPoints(freshCtx.student?.points ?? updated.points);
      }
      window.dispatchEvent(new CustomEvent('rihlat_db_updated'));
    } catch (err: any) {
      console.error('Failed to update student points in profile modal:', err);
      setCurrentStudentPoints((prev) => Math.max(0, prev - delta));
      alert(`⚠️ لم يتم حفظ النقاط: ${err?.message || 'خطأ غير معروف'}`);
    }
  };

  const challengesList: BatchChallenge[] = fullContext?.challenges || [];
  const submissionsList: PendingSubmission[] = fullContext?.submissions || [];

  const isChallengeApproved = (ch: BatchChallenge) => {
    if (!submissionsList || submissionsList.length === 0) return false;
    return submissionsList.some(
      (s) =>
        s.status === 'approved' &&
        s.studentId === activeStudent.id &&
        (((s as any).challengeId && ch.id)
          ? (s as any).challengeId === ch.id
          : (s.taskTitle === ch.title || s.sourceName === ch.title))
    );
  };

  const isChallengePending = (ch: BatchChallenge) => {
    if (isChallengeApproved(ch)) return false;
    if (!submissionsList || submissionsList.length === 0) return false;
    return submissionsList.some(
      (s) =>
        s.status === 'pending' &&
        s.studentId === activeStudent.id &&
        (((s as any).challengeId && ch.id)
          ? (s as any).challengeId === ch.id
          : (s.taskTitle === ch.title || s.sourceName === ch.title))
    );
  };

  const completedChallenges = challengesList.filter(isChallengeApproved);
  const pendingChallenges = challengesList.filter(isChallengePending);
  const notStartedChallenges = challengesList.filter(
    (ch) => !isChallengeApproved(ch) && !isChallengePending(ch)
  );

  const matchedSubIds = new Set<string>();
  challengesList.forEach((ch) => {
    submissionsList.forEach((s) => {
      if (
        s.status === 'approved' &&
        s.studentId === activeStudent.id &&
        (((s as any).challengeId && ch.id)
          ? (s as any).challengeId === ch.id
          : (s.taskTitle === ch.title || s.sourceName === ch.title))
      ) {
        matchedSubIds.add(s.id);
      }
    });
  });

  const unmatchedApprovedSubs = submissionsList.filter(
    (s) =>
      s.status === 'approved' &&
      !matchedSubIds.has(s.id) &&
      (s.sourceType === 'challenge' || (!s.sourceType && s.sourceType !== 'club')) &&
      s.studentId === activeStudent.id
  ).length;

  const realCompletedChallengesCount = completedChallenges.length + unmatchedApprovedSubs;

  const journeyRes = calculateStudentJourney({
    id: activeStudent.id,
    name: activeStudent.name,
    studentCode: activeStudent.studentCode || '',
    xp: currentStudentPoints,
    points: currentStudentPoints,
    attendanceRate: activeStudent.attendanceRate || 0,
    completedChallengesCount: realCompletedChallengesCount,
    clubTasksCompleted: activeStudent.completedTasks || 0,
    clubAnnouncementsCount: 0,
    teacherEvaluationsCount: 0,
    libraryViewsCount: 0,
    specialRewardsCount: 0,
  });

  const currentStation = journeyRes.currentStation;
  const nextStation = journeyRes.nextStation;
  const progressPct = Math.min(100, Math.max(0, journeyRes.journeyPercentage || 0));

  const clubItem: BatchClub | null = fullContext?.clubItem || null;
  const realClubName = activeStudent.clubName || clubItem?.name || null;
  const realBatchName = fullContext?.batch?.name || batch?.name || 'الدفعة';
  const realClassName = fullContext?.classItem?.name || activeStudent.className || 'غير معين بفصل';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 dir-rtl overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-2xl bg-white rounded-[32px] p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-6 my-auto max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              {activeStudent.avatarUrl ? (
                <img
                  src={activeStudent.avatarUrl}
                  alt={activeStudent.name}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-teal-500/20 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 font-black flex items-center justify-center border border-teal-200 shrink-0 text-lg">
                  {activeStudent.name ? activeStudent.name.charAt(0) : 'ط'}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">{activeStudent.name}</h2>
                  {loading && <Loader2 className="w-4 h-4 text-teal-600 animate-spin" />}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500 mt-1">
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-mono">
                    {activeStudent.studentCode || activeStudent.id}
                  </span>
                  <span>•</span>
                  <span className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                    {realClassName}
                  </span>
                  <span>•</span>
                  <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                    {realBatchName}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Basic Info Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs font-bold">
            <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100 flex flex-col justify-between">
              <div>
                <span className="block text-[10px] text-amber-600">إجمالي النقاط</span>
                <span className="text-amber-900 font-black text-base">{currentStudentPoints} XP 💎</span>
              </div>
              <div className="flex items-center justify-center gap-1 mt-1.5 pt-1.5 border-t border-amber-200/60 dir-ltr">
                <button
                  onClick={() => handleModifyPoints(-5)}
                  className="px-1.5 py-0.5 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 text-[10px] font-mono font-bold cursor-pointer transition-colors"
                  title="خصم 5 نقاط"
                >
                  -5
                </button>
                <button
                  onClick={() => handleModifyPoints(1)}
                  className="px-1.5 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-mono font-bold cursor-pointer transition-colors"
                  title="إضافة 1 نقطة"
                >
                  +1
                </button>
                <button
                  onClick={() => handleModifyPoints(5)}
                  className="px-1.5 py-0.5 rounded bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-mono font-bold cursor-pointer transition-colors shadow-2xs"
                  title="إضافة 5 نقاط"
                >
                  +5
                </button>
                <button
                  onClick={() => handleModifyPoints(50)}
                  className="px-1.5 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-mono font-bold cursor-pointer transition-colors shadow-2xs"
                  title="إضافة 50 نقطة"
                >
                  +50
                </button>
                <button
                  onClick={() => handleModifyPoints(200)}
                  className="px-1.5 py-0.5 rounded bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-mono font-bold cursor-pointer transition-colors shadow-2xs"
                  title="إضافة 200 نقطة (طالب علم)"
                >
                  +200
                </button>
              </div>
            </div>

            <div className="bg-teal-50 p-3 rounded-2xl border border-teal-100 flex flex-col justify-between">
              <div>
                <span className="block text-[10px] text-teal-600">محطة الرحلة الحالية</span>
                <span className="text-teal-900 font-black text-xs truncate block mt-0.5">{currentStation?.title || '🌱 البداية'}</span>
              </div>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-100/60 px-1.5 py-0.5 rounded text-center mt-1">
                {nextStation ? `تبقت ${Math.max(0, (nextStation.rewardPoints || (nextStation as any).threshold || 0) - currentStudentPoints)} نقطة للمحطة التالية` : 'وصلت القدوة 👑'}
              </span>
            </div>

            <div className="bg-purple-50 p-3 rounded-2xl border border-purple-100">
              <span className="block text-[10px] text-purple-600">النادي المنتسب</span>
              <span className="text-purple-900 font-black text-xs truncate block mt-0.5">{realClubName || 'لا يوجد نادي'}</span>
            </div>

            <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
              <span className="block text-[10px] text-emerald-600">التحديات المكتملة</span>
              <span className="text-emerald-900 font-black text-base">{realCompletedChallengesCount} ✅</span>
            </div>
          </div>

          {/* Journey Map & Station & Progress */}
          <div className="p-4 sm:p-5 rounded-[24px] bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 text-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-teal-300" />
                <h3 className="font-black text-sm text-white">خريطة ومسار الرحلة</h3>
              </div>
              <span className="text-xs font-black text-teal-200 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                {progressPct}% إنجاز
              </span>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5">
                <span>المحطة: {currentStation?.title || '🌱 البداية'}</span>
                <span>{currentStudentPoints} / {(nextStation as any)?.threshold || (currentStation as any)?.threshold || 100} XP</span>
              </div>
              <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Challenges Status */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-teal-600" />
              <h3 className="font-black text-sm text-slate-900">التحديات ({challengesList.length})</h3>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                <span className="block text-[10px] text-emerald-600">مكتملة ({completedChallenges.length})</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                <span className="block text-[10px] text-amber-600">قيد التنفيذ ({pendingChallenges.length})</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="block text-[10px] text-slate-500">لم تبدأ ({notStartedChallenges.length})</span>
              </div>
            </div>

            {challengesList.length > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-2 rounded-2xl border border-slate-100 bg-slate-50/50 p-2">
                {challengesList.map((ch) => {
                  const isDone = isChallengeApproved(ch);
                  const isPending = isChallengePending(ch);
                  return (
                    <div key={ch.id} className="p-2.5 bg-white rounded-xl border border-slate-100 flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-2">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : isPending ? (
                          <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-slate-300 shrink-0" />
                        )}
                        <span className="text-slate-900">{ch.title}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${isDone ? 'bg-emerald-50 text-emerald-700' : isPending ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                        {isDone ? 'مكتمل' : isPending ? 'قيد الانتظار' : 'لم يبدأ'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Club Info */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="font-black text-sm text-slate-900">بيانات النادي</h3>
            </div>

            {realClubName ? (
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-2 text-xs font-bold text-slate-700">
                <div className="flex justify-between items-center">
                  <span className="font-black text-purple-900 text-sm">{realClubName}</span>
                  {clubItem?.supervisorName && (
                    <span className="text-[11px] text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded">
                      المشرف: {clubItem.supervisorName}
                    </span>
                  )}
                </div>
                {clubItem?.description && (
                  <p className="text-slate-600 text-[11px] leading-relaxed">{clubItem.description}</p>
                )}
                {clubItem?.tasks && clubItem.tasks.length > 0 && (
                  <div className="pt-2 border-t border-purple-200/60 space-y-1">
                    <span className="text-[10px] text-purple-800 font-black block">مهام النادي:</span>
                    {clubItem.tasks.map((t, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[11px] text-purple-900">
                        <span>•</span>
                        <span>{typeof t === 'string' ? t : (t as any).title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center text-xs font-bold text-slate-400">
                الطالب غير منتسب لأي نادي حالياً
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

