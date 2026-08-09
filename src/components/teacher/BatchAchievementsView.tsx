import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { teacherService } from '../../services/teacherService';
import { Achievement, Batch, PendingSubmission } from '../../types/teacher';
import {
  Trophy,
  Plus,
  Target,
  Sparkles,
  Zap,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  School,
  Inbox,
  X,
  MessageSquare,
  FileText,
  Filter,
} from 'lucide-react';
import { CreateAchievementModal } from './ActionModals';

interface BatchAchievementsViewProps {
  selectedBatch: Batch;
  clubsList?: string[];
  showToast?: (msg: string) => void;
}

export const BatchAchievementsView: React.FC<BatchAchievementsViewProps> = ({
  selectedBatch,
  clubsList = [],
  showToast,
}) => {
  const [activeMainTab, setActiveMainTab] = useState<'achievements' | 'requests'>('achievements');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [submissions, setSubmissions] = useState<PendingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Filter state for requests tab
  const [requestFilter, setRequestFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Selected submission for teacher review modal
  const [reviewModalSubmission, setReviewModalSubmission] = useState<PendingSubmission | null>(null);
  const [teacherNotesInput, setTeacherNotesInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedBatch]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [achData, subsData] = await Promise.all([
        teacherService.getAchievements(selectedBatch.id),
        teacherService.getPendingSubmissions(selectedBatch.id),
      ]);
      setAchievements(achData);
      setSubmissions(subsData);
    } catch (err) {
      console.error('Error loading achievements and submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAchievement = async (data: {
    title: string;
    description: string;
    icon: string;
    requiredCondition: string;
    journeyStepsReward: number;
    targetType: 'all' | 'batch' | 'club';
    targetName?: string;
    type?: 'manual' | 'automatic';
    autoTriggerType?: 'challenges_completed' | 'points_reached' | 'journey_steps' | 'club_tasks' | 'library_views';
    autoTriggerValue?: number;
    requiresReview?: boolean;
  }) => {
    try {
      const newAch = await teacherService.createAchievement({
        ...data,
        batchId: selectedBatch.id,
      });

      setAchievements((prev) => [newAch, ...prev]);
      if (showToast) showToast(`✨ إنجاز جديد أضاء رحلة الطلاب! تم تعميم وسام "${data.title}" بنجاح 🏆`);
    } catch (err) {
      console.error('Failed to create achievement:', err);
    }
  };

  const handleDeleteAchievement = async (id: string, title: string) => {
    if (!confirm(`هل أنتِ متأكدة من حذف هذا الإنجاز (${title})؟`)) return;

    try {
      await teacherService.deleteAchievement(id);
      setAchievements((prev) => prev.filter((a) => a.id !== id));
      if (showToast) showToast('تم حذف الإنجاز بنجاح');
    } catch (err) {
      console.error('Failed to delete achievement:', err);
    }
  };

  const handleReviewAction = async (status: 'approved' | 'rejected') => {
    if (!reviewModalSubmission) return;

    setIsProcessing(true);
    try {
      const updated = await teacherService.reviewSubmission(
        selectedBatch.id,
        reviewModalSubmission.id,
        status,
        teacherNotesInput.trim() || undefined
      );

      // Update submissions list locally
      setSubmissions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));

      if (status === 'approved') {
        if (showToast) {
          showToast(`🌱 خطوة جديدة في رحلة الطالب (${reviewModalSubmission.studentName})! تم اعتماد الإنجاز وتقدم خطوته في رحلتي 🚀`);
        }
      } else {
        if (showToast) {
          showToast(`❌ تم رفض طلب الإنجاز وحفظ الملاحظات للرجوع للطالب.`);
        }
      }

      setReviewModalSubmission(null);
      setTeacherNotesInput('');
    } catch (err) {
      console.error('Failed to review submission:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter achievement submissions (sourceType === 'achievement' OR has achievementId)
  const achievementSubmissions = submissions.filter(
    (s) => s.sourceType === 'achievement' || !!s.achievementId
  );

  const pendingRequests = achievementSubmissions.filter((s) => s.status === 'pending');
  const approvedRequests = achievementSubmissions.filter((s) => s.status === 'approved');
  const rejectedRequests = achievementSubmissions.filter((s) => s.status === 'rejected');

  const filteredRequests = achievementSubmissions.filter((s) => {
    if (requestFilter === 'pending') return s.status === 'pending';
    if (requestFilter === 'approved') return s.status === 'approved';
    if (requestFilter === 'rejected') return s.status === 'rejected';
    return true;
  });

  const batchCount = achievements.filter((a) => a.targetType === 'batch').length;
  const clubCount = achievements.filter((a) => a.targetType === 'club').length;

  return (
    <div className="space-y-6 dir-rtl">
      
      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full border border-amber-200">
              إدارة الإنجازات والأوسمة 🏆
            </span>
            <span className="text-xs font-bold text-slate-500">{selectedBatch.name}</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">نظام الإنجازات والأوسمة وتوثيقات الطلاب</h2>
          <p className="text-xs text-slate-500 font-bold">
            يمكنك إنشاء الأوسمة وتحديد شروطها، ومراجعة طلبات التوثيق والإنجازات المرفوعة من الطلاب
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-teal-600 hover:from-amber-600 hover:to-teal-700 text-white font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء إنجاز جديد 🏆</span>
        </button>
      </div>

      {/* MAIN NAVIGATION SUB-TABS */}
      <div className="flex items-center gap-3 bg-white p-2 rounded-[24px] border border-slate-100 shadow-xs">
        <button
          onClick={() => setActiveMainTab('achievements')}
          className={`flex-1 sm:flex-initial px-6 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeMainTab === 'achievements'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>🏆 أوسمة وإنجازات الدفعة ({achievements.length})</span>
        </button>

        <button
          onClick={() => setActiveMainTab('requests')}
          className={`flex-1 sm:flex-initial px-6 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer relative ${
            activeMainTab === 'requests'
              ? 'bg-gradient-to-r from-amber-500 to-teal-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Inbox className="w-4 h-4 text-white" />
          <span>📥 طلبات الإنجازات والمراجعة</span>
          {pendingRequests.length > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-xs">
              {pendingRequests.length} جديد
            </span>
          )}
        </button>
      </div>

      {/* VIEW 1: BATCH & CLUB ACHIEVEMENTS LIST */}
      {activeMainTab === 'achievements' && (
        <div className="space-y-6">
          {/* STATS METRICS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-black shrink-0">
                🏆
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500">إجمالي الإنجازات</div>
                <div className="text-xl font-black text-slate-900 font-mono">{achievements.length} إنجاز</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center text-xl font-black shrink-0">
                📚
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500">خاصة بالدفعة</div>
                <div className="text-xl font-black text-slate-900 font-mono">{batchCount} إنجاز</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-black shrink-0">
                🎙️
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500">خاصة بالأندية</div>
                <div className="text-xl font-black text-slate-900 font-mono">{clubCount} إنجاز</div>
              </div>
            </div>
          </div>

          {/* ACHIEVEMENTS CARDS GRID */}
          {loading ? (
            <div className="text-center py-12 text-slate-400 font-bold">جاري تحميل إنجازات الدفعة...</div>
          ) : achievements.length === 0 ? (
            <div className="bg-white rounded-[28px] p-8 text-center border border-slate-100 space-y-3">
              <Trophy className="w-12 h-12 mx-auto text-amber-300" />
              <h3 className="font-black text-slate-800 text-base">لم تقمي بإنشاء إنجازات لهذه الدفعة بعد</h3>
              <p className="text-xs text-slate-500 font-bold max-w-md mx-auto">
                اضغطي على زر "إنشاء إنجاز جديد" لإضافة أول إنجاز مع تحديد شروطه وعدد خطوات الرحلة الممنوحة للطالب.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-amber-600 text-white font-black text-xs hover:bg-amber-700 shadow-md inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إنشاء أول إنجاز الآن</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((a) => (
                <div
                  key={a.id}
                  className="bg-white rounded-[28px] p-5 sm:p-6 border border-slate-100 shadow-xs space-y-4 hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-3xl shrink-0 shadow-xs">
                        {a.icon || '🏆'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-black bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                            {a.targetName || selectedBatch.name}
                          </span>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                              a.type === 'automatic'
                                ? 'bg-teal-50 text-teal-800 border-teal-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {a.type === 'automatic' ? 'آلي ⚡' : 'يدوي 📤'}
                          </span>
                        </div>
                        <h3 className="font-black text-slate-900 text-base mt-0.5">{a.title}</h3>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteAchievement(a.id, a.title)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="حذف الإنجاز"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {a.description && (
                    <p className="text-xs text-slate-600 font-bold leading-relaxed">{a.description}</p>
                  )}

                  {/* REQUIRED CONDITION CLEAR BOX */}
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 font-black text-amber-900">
                      <Target className="w-4 h-4 text-amber-600" />
                      <span>الشرط الظاهر للطلاب لفتح هذا الإنجاز:</span>
                    </div>
                    <p className="text-slate-800 font-bold">{a.requiredCondition}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span>مكافأة: +{a.journeyStepsReward || 1} خطوات في "رحلتي"</span>
                    </div>
                    <span className="text-slate-400 text-[11px] font-mono">تاريخ التأسيس: {a.createdAt}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: 📥 طلبات الإنجازات (REVIEW REQUESTS SECTION) */}
      {activeMainTab === 'requests' && (
        <div className="space-y-6">
          
          {/* REQUEST STATS COUNTERS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-black shrink-0">
                ⏳
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500">بانتظار المراجعة</div>
                <div className="text-xl font-black text-amber-600 font-mono">{pendingRequests.length} طلب</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-black shrink-0">
                ✅
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500">تم الاعتماد</div>
                <div className="text-xl font-black text-emerald-600 font-mono">{approvedRequests.length} طلب</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl font-black shrink-0">
                ❌
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500">تم الرفض</div>
                <div className="text-xl font-black text-rose-600 font-mono">{rejectedRequests.length} طلب</div>
              </div>
            </div>
          </div>

          {/* REQUEST FILTER TABS */}
          <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-[24px] border border-slate-100 shadow-xs flex-wrap">
            <div className="flex items-center gap-2 bg-slate-100/80 p-1 rounded-2xl overflow-x-auto">
              <button
                onClick={() => setRequestFilter('all')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  requestFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                الكل ({achievementSubmissions.length})
              </button>
              <button
                onClick={() => setRequestFilter('pending')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  requestFilter === 'pending'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ⏳ بانتظار المراجعة ({pendingRequests.length})
              </button>
              <button
                onClick={() => setRequestFilter('approved')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  requestFilter === 'approved'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ✅ تم الاعتماد ({approvedRequests.length})
              </button>
              <button
                onClick={() => setRequestFilter('rejected')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  requestFilter === 'rejected'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ❌ تم الرفض ({rejectedRequests.length})
              </button>
            </div>

            <div className="text-xs text-slate-500 font-bold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>مراجعات إنجازات {selectedBatch.name}</span>
            </div>
          </div>

          {/* REQUEST CARDS LIST */}
          {filteredRequests.length === 0 ? (
            <div className="bg-white rounded-[28px] p-8 text-center border border-slate-100 space-y-3">
              <Inbox className="w-12 h-12 mx-auto text-slate-300" />
              <h3 className="font-black text-slate-800 text-base">لا توجد طلبات إنجازات مضافة في هذا التصنيف</h3>
              <p className="text-xs text-slate-500 font-bold max-w-md mx-auto">
                عندما يقوم الطلاب بإرسال توثيقات الإنجازات من صفحة "إنجازاتي"، ستظهر جميع الطلبات هنا للمراجعة والاعتماد.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((submission) => {
                const isPending = submission.status === 'pending';
                const isApproved = submission.status === 'approved';
                const isRejected = submission.status === 'rejected';

                return (
                  <div
                    key={submission.id}
                    className={`bg-white rounded-[28px] p-5 sm:p-6 border transition-all space-y-4 relative ${
                      isPending
                        ? 'border-amber-300/80 shadow-md shadow-amber-500/5'
                        : isApproved
                        ? 'border-emerald-200 shadow-xs'
                        : 'border-rose-200 shadow-xs opacity-90'
                    }`}
                  >
                    {/* TOP ROW: STUDENT METADATA & STATUS BADGE */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-3">
                        {submission.studentAvatar ? (
                          <img
                            src={submission.studentAvatar}
                            alt={submission.studentName}
                            className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-800 font-bold flex items-center justify-center shrink-0 text-sm">
                            {submission.studentName ? submission.studentName.charAt(0) : 'ط'}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-black text-slate-900 text-base">{submission.studentName}</h3>
                            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                              كود الطالب: {submission.studentCode || 'STD-G6-089'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500 font-bold mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <School className="w-3.5 h-3.5 text-teal-600" />
                              <span>الدفعة: {submission.batchName || selectedBatch.name}</span>
                            </span>
                            <span>•</span>
                            <span>الفصل: {submission.className}</span>
                            {submission.clubName && (
                              <>
                                <span>•</span>
                                <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                                  {submission.clubName}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* STATUS BADGE */}
                      <div className="shrink-0 flex items-center gap-2">
                        {isPending && (
                          <span className="bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-xs">
                            <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                            <span>⏳ بانتظار المراجعة</span>
                          </span>
                        )}
                        {isApproved && (
                          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>✅ تم الاعتماد</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="bg-rose-100 text-rose-800 border border-rose-300 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-xs">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>❌ تم الرفض</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ACHIEVEMENT DETAILS & STUDENT SUBMISSION CONTENT */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* ACHIEVEMENT INFO */}
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🏆</span>
                          <span className="font-black text-slate-900 text-sm">{submission.taskTitle}</span>
                        </div>
                        <div className="text-slate-600 font-bold flex items-center justify-between">
                          <span>المصدر: {submission.sourceName}</span>
                          <span className="font-mono text-slate-400">تاريخ الإرسال: {submission.submittedAt}</span>
                        </div>
                      </div>

                      {/* STUDENT NOTE / CONTENT SUMMARY */}
                      <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-1.5 text-xs">
                        <div className="font-black text-amber-900 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-amber-600" />
                          <span>الوصف والملاحظات المرفوعة من الطالب:</span>
                        </div>
                        <p className="text-slate-800 font-bold leading-relaxed">
                          {submission.contentSummary}
                        </p>
                      </div>
                    </div>

                    {/* TEACHER NOTES IF REVIEWED */}
                    {submission.teacherNotes && (
                      <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl text-xs space-y-1">
                        <div className="font-black text-teal-900 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                          <span>تعليق وملاحظات المعلمة:</span>
                        </div>
                        <p className="text-teal-800 font-bold">{submission.teacherNotes}</p>
                      </div>
                    )}

                    {/* ACTION BUTTON */}
                    <div className="pt-2 flex items-center justify-end gap-3">
                      <button
                        onClick={() => {
                          setReviewModalSubmission(submission);
                          setTeacherNotesInput(submission.teacherNotes || '');
                        }}
                        className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                          isPending
                            ? 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-teal-600/20'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{isPending ? 'مراجعة واتخاذ إجراء ✍️' : 'تعديل القرار أو التعليق ✍️'}</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* REVIEW SUBMISSION MODAL */}
      <AnimatePresence>
        {reviewModalSubmission && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 dir-rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-white rounded-[32px] p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 relative"
            >
              <button
                onClick={() => setReviewModalSubmission(null)}
                className="absolute top-5 left-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <span className="text-[10px] font-black bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full border border-amber-200">
                  مراجعة توثيق الطالب واتخاذ قرار الاعتماد ✍️
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  {reviewModalSubmission.taskTitle}
                </h3>
              </div>

              {/* STUDENT METADATA SUMMARY BOX */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center gap-3">
                  {reviewModalSubmission.studentAvatar ? (
                    <img
                      src={reviewModalSubmission.studentAvatar}
                      alt={reviewModalSubmission.studentName}
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-800 font-bold flex items-center justify-center text-xs">
                      {reviewModalSubmission.studentName ? reviewModalSubmission.studentName.charAt(0) : 'ط'}
                    </div>
                  )}
                  <div>
                    <div className="font-black text-slate-900 text-sm">{reviewModalSubmission.studentName}</div>
                    <div className="text-slate-500 font-bold">
                      كود الطالب: {reviewModalSubmission.studentCode || 'STD-G6-089'} • الفصل: {reviewModalSubmission.className}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 space-y-1">
                  <span className="font-black text-slate-700 block">وصف وتوثيق الطالب المرفق:</span>
                  <p className="text-slate-600 font-bold leading-relaxed bg-white p-3 rounded-xl border border-slate-200/60">
                    {reviewModalSubmission.contentSummary}
                  </p>
                </div>
              </div>

              {/* TEACHER OPTIONAL COMMENT INPUT */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">
                  تعليق أو ملاحظة توجيهية للطالب (اختياري):
                </label>
                <textarea
                  value={teacherNotesInput}
                  onChange={(e) => setTeacherNotesInput(e.target.value)}
                  placeholder="مثال: ممتازة بارك الله فيكِ تم اعتماد الإنجاز وسجل في رحلتك القرآنية! أو: يرجى استكمال التلخيص المرفق..."
                  rows={3}
                  className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all resize-none"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 font-bold leading-relaxed">
                💡 عند اعتماد الإنجاز: ينفتح الإنجاز تلقائيًا بصفحة الطالب، يظهر احتفال بالترقية، وتتحرك رحلته القرآنية بعدد الخطوات المحددة!
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => handleReviewAction('approved')}
                  disabled={isProcessing}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isProcessing ? 'جاري الحفظ...' : '✅ قبول واعتماد الإنجاز'}</span>
                </button>

                <button
                  onClick={() => handleReviewAction('rejected')}
                  disabled={isProcessing}
                  className="px-5 py-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-black text-xs cursor-pointer transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>❌ رفض الطلب</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE ACHIEVEMENT MODAL */}
      <CreateAchievementModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateAchievement}
        currentBatchName={selectedBatch.name}
        clubsList={clubsList}
      />

    </div>
  );
};
