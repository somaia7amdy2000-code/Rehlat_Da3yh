import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Users, Clock, PlusCircle, CheckCircle2, XCircle, Target, Sparkles, FileText, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { BatchChallenge, Batch, PendingSubmission } from '../../types/teacher';
import { teacherService } from '../../services/teacherService';

interface BatchChallengesViewProps {
  batch: Batch;
  challenges: BatchChallenge[];
  pendingSubmissions?: PendingSubmission[];
  onOpenCreateChallenge: () => void;
  onReviewSubmission?: (submissionId: string, status: 'approved' | 'rejected', notes: string) => void;
  onDeleteChallenge?: (challengeId: string) => void;
}

export const BatchChallengesView: React.FC<BatchChallengesViewProps> = ({
  batch,
  challenges,
  pendingSubmissions = [],
  onOpenCreateChallenge,
  onReviewSubmission,
  onDeleteChallenge,
}) => {
  const [selectedChallengeDetail, setSelectedChallengeDetail] = useState<BatchChallenge | null>(null);
  const [deletingChallenge, setDeletingChallenge] = useState<BatchChallenge | null>(null);

  // Filter challenge submissions
  const challengeSubs = pendingSubmissions.filter(
    (s) => s.sourceType === 'challenge' || (s.taskTitle && !s.achievementId)
  );
  const pendingChallengeSubs = challengeSubs.filter((s) => s.status === 'pending');

  const handleConfirmDelete = async () => {
    if (!deletingChallenge) return;
    const chId = deletingChallenge.id;
    setDeletingChallenge(null);
    setSelectedChallengeDetail(null);
    if (onDeleteChallenge) {
      await onDeleteChallenge(chId);
    } else {
      await teacherService.deleteChallenge(batch.id, chId);
      window.dispatchEvent(new CustomEvent('rihlat_db_updated'));
    }
  };

  const getTargetBadgeText = (ch: BatchChallenge) => {
    if (!ch) return 'الجميع';
    const tType = ch.targetType || 'batch';
    if (tType === 'school' || tType === 'all') return '🏫 المدرسة بأكملها';
    if (tType === 'batch') return '👥 الدفعة بأكملها';
    if (tType === 'class') return `📚 فصل: ${ch.targetName || 'فصل معين'}`;
    if (tType === 'club') return `🎙️ نادي: ${ch.targetName || 'نادي معين'}`;
    if (tType === 'student') return `👤 الطالبة: ${ch.targetName || 'طالبة محددة'}`;
    return 'الجميع';
  };

  return (
    <div className="space-y-6 dir-rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-[28px] border border-[#EEF2F7] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100 font-bold">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">تحديات {batch.name}</h2>
            <p className="text-xs font-bold text-slate-500">التحديات التنافسية لتحفيز الطلاب ونيل نقاط XP</p>
          </div>
        </div>

        <button
          onClick={onOpenCreateChallenge}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-md shadow-amber-600/20 flex items-center gap-2 cursor-pointer transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ إنشاء تحدي جديد</span>
        </button>
      </div>

      {/* PENDING SUBMISSIONS REVIEW SECTION */}
      {pendingChallengeSubs.length > 0 && (
        <div className="bg-amber-50/70 border-2 border-amber-300/80 p-5 rounded-[28px] space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
              <Sparkles className="w-5 h-5 text-amber-600 animate-bounce" />
              <span>إنجازات الطلاب التنافسية بانتظار المراجعة ({pendingChallengeSubs.length})</span>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-200/80 px-3 py-1 rounded-full">
              يتطلب اعتماد المعلمة
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingChallengeSubs.map((sub) => {
              const matchingCh = challenges.find((c) => c && (c.title === sub.taskTitle || c.title === sub.sourceName));
              return (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-white rounded-2xl border border-amber-200 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <span className="font-black text-slate-900 text-sm block">{sub.studentName}</span>
                      <span className="text-[10px] font-bold text-slate-500">{sub.className}</span>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-200">
                      +{sub.rewardXp || matchingCh?.rewardXp || 50} XP
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-black text-amber-900 block">التحدي: {sub.taskTitle}</span>
                    {matchingCh?.description && (
                      <p className="text-[10px] font-bold text-slate-500">{matchingCh.description}</p>
                    )}
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-black text-slate-600 block">ماذا فعل الطالب؟:</span>
                    <p className="text-xs font-bold text-slate-800 leading-relaxed">
                      {sub.contentSummary || 'قام بتأدية التحدي المطلوبة.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onReviewSubmission?.(sub.id, 'approved', 'أحسنت! تم قبول التحدي بنجاح 🎉')}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>قبول التحدي (+{sub.rewardXp || 50} XP)</span>
                    </button>
                    <button
                      onClick={() => onReviewSubmission?.(sub.id, 'rejected', 'يرجى مراجعة وتعديل التطبيق')}
                      className="flex-1 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>رفض التحدي</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* SAVED CHALLENGES LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {challenges.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-white rounded-[28px] border border-slate-200 space-y-3">
            <Trophy className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-600">لا توجد تحديات منشأة في هذه الدفعة بعد.</p>
            <button
              onClick={onOpenCreateChallenge}
              className="px-4 py-2 bg-amber-600 text-white font-black text-xs rounded-xl inline-flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>إنشاء أول تحدي</span>
            </button>
          </div>
        ) : (
          challenges.map((ch, index) => {
            if (!ch) return null;
            const challengeId = ch.id || `ch-old-${index}`;
            const isSelected = selectedChallengeDetail?.id === challengeId;
            const chTitle = ch.title || 'تحدي';
            const challengeSubmissions = challengeSubs.filter(
              (s) => (s.taskTitle && s.taskTitle === chTitle) || (s.sourceName && s.sourceName === chTitle)
            );

            return (
              <motion.div
                key={challengeId}
                whileHover={{ y: -2 }}
                className="p-5 rounded-[28px] bg-white border border-[#EEF2F7] shadow-sm hover:shadow-md transition-all space-y-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                    {ch.type || 'تحدي'}
                  </span>
                  <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    +{ch.rewardXp ?? (ch as any).xp ?? 50} XP 💎
                  </span>
                </div>

                <div>
                  <h3 className="font-black text-base text-slate-900 leading-snug">{chTitle}</h3>
                  {ch.description && (
                    <p className="text-xs font-bold text-slate-500 mt-1 line-clamp-2">{ch.description}</p>
                  )}
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <Target className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>المستهدف: {getTargetBadgeText(ch)}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs font-bold text-slate-600">
                  <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <Users className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>المشاركات: {challengeSubmissions.length || ch.participantsCount || 0}</span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>الموعد: {ch.dueDate || 'غير محدد'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedChallengeDetail(isSelected ? null : ch)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <span>{isSelected ? 'إخفاء التفاصيل' : 'عرض التفاصيل والإجابات'}</span>
                    {isSelected ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => setDeletingChallenge(ch)}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-rose-200/80 shrink-0"
                    title="حذف التحدي"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>حذف</span>
                  </button>
                </div>

                {/* Challenge Details Modal / Expanded Card */}
                {isSelected && (
                  <div className="pt-3 border-t border-slate-200 space-y-3 bg-slate-50/80 p-3 rounded-2xl">
                    <div>
                      <span className="text-[11px] font-black text-slate-800 block">وصف التحدي الكامل:</span>
                      <p className="text-xs font-bold text-slate-600 mt-0.5">
                        {ch.description || 'لا يوجد وصف إضافي للتحدي.'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-black text-slate-800 block">
                        إجابات الطلاب لهذا التحدي ({challengeSubmissions.length}):
                      </span>
                      {challengeSubmissions.length === 0 ? (
                        <p className="text-[10px] font-bold text-slate-400">لا توجد إجابات مقدمة بعد لهذا التحدي.</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {challengeSubmissions.map((s) => (
                            <div key={s.id} className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-black text-slate-800">{s.studentName} ({s.className})</span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                                    s.status === 'approved'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : s.status === 'rejected'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {s.status === 'approved' ? 'مكتمل ✅' : s.status === 'rejected' ? 'مرفوض ❌' : 'بانتظار المراجعة ⏳'}
                                </span>
                              </div>
                              <p className="text-slate-600 text-[11px] font-bold">{s.contentSummary}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deletingChallenge && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 dir-rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[28px] p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center border border-rose-200 shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">هل أنتِ متأكدة من حذف هذا التحدي؟</h3>
                  <p className="text-xs font-bold text-slate-500 mt-1">
                    {deletingChallenge.title || 'هذا التحدي'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف التحدي</span>
                </button>
                <button
                  onClick={() => setDeletingChallenge(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
