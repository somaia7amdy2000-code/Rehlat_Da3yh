import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles, Megaphone, CheckCircle2, Circle, Clock, Award,
  FileText, Image as ImageIcon, Video, FileCode, Download,
  Heart, Users, School, UserCheck, Shield, ChevronRight,
  Calendar, Check, Plus, Bell, Bookmark, ArrowUpRight, Flame,
  BookOpen, Star, Crown, MessageSquareHeart
} from 'lucide-react';
import {
  ClubInfo,
  ClubAnnouncement,
  ClubTask,
  ClubMember,
  ClubFile,
  SupervisorMessage,
  ClubFileType,
} from '../types/club';
import { BatchClub, Batch, BatchStudent, BatchChallenge, PendingSubmission } from '../types/teacher';
import { clubService } from '../services/clubService';
import { teacherService } from '../services/teacherService';

interface ClubPageProps {
  currentClub?: BatchClub | null;
  batch?: Batch | null;
  allBatchStudents?: BatchStudent[];
  studentChallenges?: BatchChallenge[];
  studentSubmissions?: PendingSubmission[];
  studentId?: string;
  studentName?: string;
  studentCode?: string;
  className?: string;
  refreshContext?: () => void;
  onRewardEarned?: (xp: number) => void;
  triggerConfetti?: () => void;
  debugInfo?: any;
  studentContext?: any;
}

export const StudentClubDebugPanel: React.FC<{
  debugInfo?: any;
  studentContext?: any;
  currentClub?: any;
}> = ({ debugInfo, studentContext, currentClub }) => {
  const dbg = debugInfo || studentContext?.debugInfo || {};
  return (
    <div className="bg-slate-900 text-slate-100 p-6 rounded-3xl border-4 border-rose-500 font-mono text-sm space-y-4 my-8 dir-ltr text-left shadow-2xl">
      <div className="flex items-center justify-between border-b border-rose-500/40 pb-3">
        <h3 className="text-rose-400 font-black text-xl tracking-wider">
          DEBUG — Student Club Data
        </h3>
        <span className="bg-rose-500/20 text-rose-300 px-3 py-1 rounded-full text-xs font-bold border border-rose-500/40">
          Diagnostic Mode
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
          <span className="text-slate-400 block font-bold mb-1">Supabase configured:</span>
          <span className="text-amber-300 font-bold text-sm">{String(dbg.isSupabaseConfigured ?? 'unknown')}</span>
        </div>

        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
          <span className="text-slate-400 block font-bold mb-1">1. studentId (input):</span>
          <span className="text-emerald-300 font-bold text-sm">{dbg.studentId || 'null'}</span>
        </div>

        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
          <span className="text-slate-400 block font-bold mb-1">2. supaStudent.id:</span>
          <span className="text-emerald-300 font-bold text-sm">{dbg.supaStudentId || 'null'}</span>
        </div>

        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
          <span className="text-slate-400 block font-bold mb-1">3a. memberData exists:</span>
          <span className="text-sky-300 font-bold text-sm">{String(dbg.hasMemberData ?? false)}</span>
        </div>

        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
          <span className="text-slate-400 block font-bold mb-1">3b. memberData.club_id:</span>
          <span className="text-sky-300 font-bold text-sm">{dbg.memberDataClubId || 'null'}</span>
        </div>

        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 col-span-1 md:col-span-2">
          <span className="text-slate-400 block font-bold mb-1">3c. memberData.clubs:</span>
          <pre className="bg-slate-900 p-2 rounded text-amber-200 text-[11px] overflow-x-auto whitespace-pre-wrap">{dbg.memberDataClubs || 'null'}</pre>
        </div>

        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 col-span-1 md:col-span-2">
          <span className="text-slate-400 block font-bold mb-1">3d. query error:</span>
          <span className="text-rose-300 font-bold text-sm">{dbg.memberQueryError || 'none'}</span>
        </div>

        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
          <span className="text-slate-400 block font-bold mb-1">4a. clubObj.id:</span>
          <span className="text-purple-300 font-bold text-sm">{dbg.clubObjId || 'null'}</span>
        </div>

        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
          <span className="text-slate-400 block font-bold mb-1">4b. clubObj.name:</span>
          <span className="text-purple-300 font-bold text-sm">{dbg.clubObjName || 'null'}</span>
        </div>

        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
          <span className="text-slate-400 block font-bold mb-1">5a. student.clubId:</span>
          <span className="text-teal-300 font-bold text-sm">{studentContext?.student?.clubId || dbg.studentClubId || 'undefined'}</span>
        </div>

        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
          <span className="text-slate-400 block font-bold mb-1">5b. student.clubName:</span>
          <span className="text-teal-300 font-bold text-sm">{studentContext?.student?.clubName || dbg.studentClubName || 'undefined'}</span>
        </div>

        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 col-span-1 md:col-span-2">
          <span className="text-slate-400 block font-bold mb-1">5c. supaClubItem:</span>
          <pre className="bg-slate-900 p-2 rounded text-emerald-200 text-[11px] overflow-x-auto whitespace-pre-wrap">{dbg.supaClubItem || 'null'}</pre>
        </div>

        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 col-span-1 md:col-span-2">
          <span className="text-slate-400 block font-bold mb-1">5d. studentContext.clubItem:</span>
          <pre className="bg-slate-900 p-2 rounded text-emerald-200 text-[11px] overflow-x-auto whitespace-pre-wrap">{JSON.stringify(studentContext?.clubItem || null, null, 2)}</pre>
        </div>

        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 col-span-1 md:col-span-2">
          <span className="text-slate-400 block font-bold mb-1">5e. currentClub (in YouthMainApp):</span>
          <pre className="bg-slate-900 p-2 rounded text-teal-200 text-[11px] overflow-x-auto whitespace-pre-wrap">{JSON.stringify(currentClub || null, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
};

export const ClubPage: React.FC<ClubPageProps> = ({
  currentClub,
  batch,
  allBatchStudents = [],
  studentChallenges = [],
  studentSubmissions = [],
  studentId,
  studentName,
  studentCode,
  className,
  refreshContext,
  onRewardEarned,
  triggerConfetti,
  debugInfo,
  studentContext,
}) => {
  // State from dynamic service layer
  const [clubInfo, setClubInfo] = useState<ClubInfo | null>(null);
  const [announcements, setAnnouncements] = useState<ClubAnnouncement[]>([]);
  const [tasks, setTasks] = useState<ClubTask[]>([]);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [files, setFiles] = useState<ClubFile[]>([]);
  const [supervisorMsg, setSupervisorMsg] = useState<SupervisorMessage | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [selectedFileModal, setSelectedFileModal] = useState<ClubFile | null>(null);
  const [searchMemberQuery, setSearchMemberQuery] = useState<string>('');
  const [proofSubmissionModal, setProofSubmissionModal] = useState<{ task: ClubTask; notes: string } | null>(null);

  // Fetch all club dynamic data on mount
  useEffect(() => {
    let isMounted = true;
    const fetchClubData = async () => {
      try {
        setIsLoading(true);

        if (currentClub && currentClub.name) {
          const dynamicClubInfo: ClubInfo = {
            id: currentClub.id,
            name: currentClub.name,
            slogan: currentClub.description || 'معًا نلتقي للتعلم والتميز الإيماني.',
            description: currentClub.description || 'نادي نشاط مخصص للدفعة.',
            supervisorName: currentClub.supervisorName || 'معلم الحلقة',
            supervisorTitle: 'مشرف النادي',
            memberCount: currentClub.memberCount || 0,
            gradeLevel: batch?.stage || 'المرحلة العامة',
            stage: batch?.stage || 'المرحلة العامة',
            category: 'نادي النشاط الطلابي',
          };

          const clubMembersMapped: ClubMember[] = (allBatchStudents || [])
            .filter((s) => s.clubName && s.clubName !== 'بدون نادي' && s.clubName.trim().toLowerCase() === currentClub.name.trim().toLowerCase())
            .map((s) => ({
              id: s.id,
              name: s.name,
              className: s.className,
              levelBadge: s.levelBadge || '🌱 البداية',
              avatarUrl: s.avatarUrl,
            }));

          const batchId = batch?.id || '';
          let clubChallenges = (studentChallenges || []).filter(
            (ch) => ch.targetType === 'club' && ch.targetName && ch.targetName.trim().toLowerCase() === currentClub.name.trim().toLowerCase()
          );

          if (clubChallenges.length === 0 && batchId) {
            const allBatchChallenges = await teacherService.getChallengesByBatch(batchId);
            clubChallenges = allBatchChallenges.filter(
              (ch) => ch.targetType === 'club' && ch.targetName && ch.targetName.trim().toLowerCase() === currentClub.name.trim().toLowerCase()
            );
          }

          const mappedClubTasks: ClubTask[] = clubChallenges.map((ch) => {
            const matchingSub = (studentSubmissions || []).find(
              (sub) =>
                (sub.studentId === studentId || sub.studentName === studentName || sub.studentCode === studentCode) &&
                (sub.taskTitle === ch.title || sub.challengeId === ch.id)
            );

            let status: 'pending' | 'submitted' | 'approved' | 'rejected' = 'pending';
            if (matchingSub) {
              status = matchingSub.status as any;
            }

            return {
              id: ch.id,
              title: ch.title,
              description: ch.description || '',
              xp_reward: ch.rewardXp,
              due_date: ch.dueDate || 'نشط',
              assigned_by: 'معلم الحلقة',
              status,
            };
          });

          const [annRes, filesRes, msgRes] = await Promise.all([
            clubService.getAnnouncements(),
            clubService.getClubFiles(),
            clubService.getSupervisorMessage(),
          ]);

          if (isMounted) {
            setClubInfo(dynamicClubInfo);
            setAnnouncements(annRes);
            setTasks(mappedClubTasks);
            setMembers(clubMembersMapped);
            setFiles(filesRes);
            setSupervisorMsg(msgRes);
          }
        } else {
          if (isMounted) {
            setClubInfo(null);
            setMembers([]);
            setTasks([]);
          }
        }
      } catch (error) {
        console.error('Error loading club data:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchClubData();
    return () => {
      isMounted = false;
    };
  }, [currentClub, batch, allBatchStudents, studentChallenges, studentSubmissions]);

  // Handle opening proof submission modal
  const handleOpenSubmitModal = (task: ClubTask) => {
    setProofSubmissionModal({ task, notes: '' });
  };

  // Confirm proof submission
  const handleConfirmProofSubmit = async () => {
    if (!proofSubmissionModal) return;
    const { task, notes } = proofSubmissionModal;
    try {
      const batchId = batch?.id || '';
      await teacherService.submitForReview({
        batchId,
        batchName: batch?.name || 'الدفعة العامة',
        studentId: studentId || '',
        studentName: studentName || 'طالب',
        studentCode: studentCode || '',
        className: className || '',
        clubName: currentClub?.name || 'نادي',
        taskTitle: task.title,
        sourceType: 'club',
        sourceName: currentClub?.name || 'نادي',
        contentSummary: notes.trim() || 'تم تنفيذ التحدي وإرسال الإثبات للمراجعة.',
        rewardXp: task.xp_reward || task.rewardXp || 100,
        challengeId: task.id,
      });

      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: 'submitted' } : t))
      );
      setProofSubmissionModal(null);
      showToast('⏳ تم إرسال إثبات الإنجاز للمعلم بنجاح! بانتظار المراجعة.');
      refreshContext?.();
    } catch (err) {
      console.error('Task submit error:', err);
      showToast('تعذر إرسال الإنجاز، يرجى المحاولة لاحقاً');
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Icon selector helper for files
  const getFileIcon = (type: ClubFileType) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-6 h-6 text-rose-500" />;
      case 'image':
        return <ImageIcon className="w-6 h-6 text-emerald-500" />;
      case 'video':
        return <Video className="w-6 h-6 text-purple-500" />;
      case 'doc':
        return <FileCode className="w-6 h-6 text-sky-500" />;
      default:
        return <FileText className="w-6 h-6 text-teal-500" />;
    }
  };

  const getFileTypeBadge = (type: ClubFileType) => {
    switch (type) {
      case 'pdf':
        return <span className="px-2 py-0.5 text-[10px] font-black rounded-lg bg-rose-100 text-rose-700 border border-rose-200">PDF</span>;
      case 'image':
        return <span className="px-2 py-0.5 text-[10px] font-black rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200">صورة</span>;
      case 'video':
        return <span className="px-2 py-0.5 text-[10px] font-black rounded-lg bg-purple-100 text-purple-700 border border-purple-200">فيديو</span>;
      case 'doc':
        return <span className="px-2 py-0.5 text-[10px] font-black rounded-lg bg-sky-100 text-sky-700 border border-sky-200">مستند</span>;
    }
  };

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(searchMemberQuery.toLowerCase()) ||
    m.className.toLowerCase().includes(searchMemberQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-full border-4 border-teal-500/20 border-t-teal-600 animate-spin" />
        <p className="text-xs font-bold text-slate-500">جاري تحميل بيانات النادي...</p>
      </div>
    );
  }

  console.log('[TRACE ClubPage] clubInfo:', clubInfo);
  console.log('[TRACE ClubPage] currentClub:', currentClub);

  if (!clubInfo || !clubInfo.name) {
    return (
      <div className="space-y-6 dir-rtl my-8">
        <div className="bg-white/90 rounded-[32px] p-12 text-center border border-dashed border-slate-200 space-y-3">
          <Users className="w-16 h-16 text-slate-300 mx-auto" />
          <h3 className="font-black text-lg text-slate-800">لم تنضم إلى أي نادٍ بعد.</h3>
          <p className="text-xs font-bold text-slate-400">ستظهر تفاصيل النادي والمهام والإعلانات فور انضمامك لأحد الأندية من قبل المعلم.</p>
        </div>
        <StudentClubDebugPanel debugInfo={debugInfo} studentContext={studentContext} currentClub={currentClub} />
      </div>
    );
  }

  return (
    <div className="space-y-8 dir-rtl pb-24">
      {/* Toast Notification Popup */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 inset-x-4 z-50 max-w-md mx-auto p-4 rounded-2xl bg-slate-900 text-white font-black text-xs shadow-2xl border border-teal-500/40 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
              <span>{toastMsg}</span>
            </div>
            <button onClick={() => setToastMsg(null)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400">
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= 1. HEADER: LARGE BEAUTIFUL CARD ================= */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-900 via-teal-950 to-emerald-950 p-6 sm:p-8 text-white shadow-xl shadow-teal-950/20 border border-teal-500/30"
        >
          {/* Decorative Background Glow Shapes */}
          <div className="absolute -top-16 -left-16 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            {/* Top Badge & Title */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-black backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{clubInfo?.category || 'نادي النشاط المدرسي'}</span>
              </div>
              <span className="text-xs font-bold text-teal-200/80 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                مفعل بالكامل ⚡
              </span>
            </div>

            {/* Club Name & Slogan */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                <span>{clubInfo?.name || '🌿 النادي'}</span>
              </h1>
              <p className="text-sm sm:text-base font-bold text-teal-100/90 leading-relaxed max-w-xl">
                "{clubInfo?.slogan || 'معًا ننشر الخير بالكلمة الطيبة.'}"
              </p>
            </div>

            {/* Three Key Info Pills: Supervisor, Member Count, Grade */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {/* Supervisor */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5 text-teal-300" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-teal-200/80 block">👩‍🏫 المشرفة</span>
                  <span className="text-xs font-black text-white">{clubInfo?.supervisorName || 'أ. فاطمة الزهراء'}</span>
                </div>
              </div>

              {/* Members Count */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-200/80 block">👥 عدد الأعضاء</span>
                  <span className="text-xs font-black text-white">{clubInfo?.memberCount || 18} عضواً متميزاً</span>
                </div>
              </div>

              {/* Grade Level */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
                  <School className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-amber-200/80 block">🏫 المرحلة</span>
                  <span className="text-xs font-black text-white">{clubInfo?.gradeLevel || 'المرحلة الثانوية والأنشطة'}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ================= 2. SECTION: 📢 إعلان النادي ================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <Megaphone className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-black text-slate-900">إعلان النادي 📢</h2>
          </div>
          <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
            أحدث التنبيهات
          </span>
        </div>

        <div className="space-y-3">
          {announcements.length === 0 ? (
            <div className="bg-white/90 rounded-[28px] p-6 text-center border border-[#EEF2F7]">
              <p className="text-xs font-bold text-slate-500">لا توجد إعلانات حالياً.</p>
            </div>
          ) : (
            announcements.map((ann) => {
              const isPinned = ann.pinned || ann.isPinned;
              const annDate = ann.created_at || ann.date;
              return (
                <motion.div
                  key={ann.id}
                  whileHover={{ y: -2 }}
                  className={`rounded-[28px] p-5 sm:p-6 transition-all border ${
                    isPinned
                      ? 'bg-gradient-to-r from-amber-50/90 via-teal-50/60 to-white border-amber-200/90 shadow-md shadow-amber-500/5'
                      : 'bg-white/90 border-[#EEF2F7] shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900">{ann.title}</h3>
                    </div>
                    {isPinned && (
                      <span className="px-2.5 py-1 text-[10px] font-black rounded-full bg-amber-100 text-amber-800 border border-amber-300 shrink-0 flex items-center gap-1">
                        <Bookmark className="w-3 h-3 fill-amber-600 text-amber-600" />
                        <span>مثبت</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm font-bold text-slate-700 leading-relaxed mb-4">
                    {ann.content}
                  </p>

                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                      <span>الناشر: {ann.author}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{annDate}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </section>

      {/* ================= 3. SECTION: ✅ مهام النادي ================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-black text-slate-900">مهام النادي ✅</h2>
          </div>
          <div className="text-xs font-bold text-slate-500">
            معتمدة: {tasks.filter((t) => t.status === 'approved').length} / {tasks.length}
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="bg-white/90 rounded-[24px] p-6 text-center border border-[#EEF2F7]">
            <p className="text-xs font-bold text-slate-500">لا توجد مهام متاحة حالياً.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {tasks.map((task) => {
            const isPending = task.status === 'pending';
            const isSubmitted = task.status === 'submitted';
            const isApproved = task.status === 'approved';
            const xp = task.xp_reward || task.rewardXp || 0;
            const dueDate = task.due_date || task.dueDate;
            const assignedBy = task.assigned_by || task.assignedTo;

            return (
              <motion.div
                key={task.id}
                whileHover={{ y: -2 }}
                className={`p-4 sm:p-5 rounded-[24px] border transition-all flex flex-col justify-between gap-3 ${
                  isApproved
                    ? 'bg-slate-50/90 border-slate-200/80 text-slate-600 shadow-none'
                    : isSubmitted
                    ? 'bg-amber-50/40 border-amber-200/80 shadow-xs'
                    : 'bg-white/90 border-[#EEF2F7] hover:border-teal-300 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className={`font-black text-xs sm:text-sm transition-all ${
                        isApproved ? 'line-through text-slate-400' : 'text-slate-900'
                      }`}
                    >
                      {task.title}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-black rounded-full shrink-0 ${
                        isApproved
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : isSubmitted
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : 'bg-teal-100 text-teal-900 border border-teal-200'
                      }`}
                    >
                      +{xp} XP 💎
                    </span>
                  </div>

                  {task.description && (
                    <p className={`text-[11px] font-bold leading-relaxed ${isApproved ? 'text-slate-400' : 'text-slate-600'}`}>
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Status & Action Button Footer */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>تسليم: {dueDate}</span>
                    </div>
                    {assignedBy && (
                      <span className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100 font-bold">
                        بواسطة: {assignedBy}
                      </span>
                    )}
                  </div>

                  {/* Dynamic Action / Status Indicator */}
                  <div>
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => handleOpenSubmitModal(task)}
                        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-xs shadow-md shadow-teal-600/20 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>تم الإنجاز (إرسال للمراجعة)</span>
                      </button>
                    )}

                    {isSubmitted && (
                      <div className="w-full py-2 px-3 rounded-xl bg-amber-100/80 text-amber-900 border border-amber-300 font-extrabold text-xs flex items-center justify-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-amber-700 animate-spin" />
                        <span>بانتظار مراجعة المعلم</span>
                      </div>
                    )}

                    {isApproved && (
                      <div className="w-full py-2 px-3 rounded-xl bg-emerald-100/80 text-emerald-900 border border-emerald-300 font-extrabold text-xs flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>مكتمل ومعتمد من المعلم ✅</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>

      {/* ================= 4. SECTION: 👥 أعضاء النادي ================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">أعضاء النادي 👥</h2>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-500">
            إجمالي: {members.length} طالب
          </span>
        </div>

        {/* Member Search input */}
        <div className="relative">
          <input
            type="text"
            placeholder="ابحث عن عضو باسمه أو صفه..."
            value={searchMemberQuery}
            onChange={(e) => setSearchMemberQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-3 rounded-2xl bg-white border border-slate-200/80 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition-all shadow-xs"
          />
          <Users className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
        </div>

        {/* Clean Member Cards Grid (Displaying ONLY: Name, Class, Level) */}
        {filteredMembers.length === 0 ? (
          <div className="bg-white/90 rounded-[24px] p-6 text-center border border-[#EEF2F7]">
            <p className="text-xs font-bold text-slate-500">لا يوجد أعضاء مضافون في هذا النادي حالياً.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredMembers.map((member) => (
            <motion.div
              key={member.id}
              whileHover={{ y: -2 }}
              className="bg-white/90 border border-[#EEF2F7] shadow-[0_8px_25px_rgb(0,0,0,0.03)] rounded-[24px] p-4 flex items-center gap-3.5 transition-all"
            >
              {/* Profile Photo */}
              <div className="relative shrink-0">
                <img
                  src={member.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                  alt={member.name}
                  className="w-13 h-13 rounded-2xl object-cover border-2 border-teal-500/20 shadow-xs"
                />
                {member.levelNumber && (
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-teal-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white">
                    {member.levelNumber}
                  </span>
                )}
              </div>

              {/* Student Info: Name, Class, Level Badge */}
              <div className="flex-1 min-w-0 space-y-1">
                <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                  {member.name}
                </h3>
                <p className="text-[11px] font-bold text-slate-500 truncate">
                  {member.className}
                </p>

                <div className="pt-0.5 flex items-center gap-1.5 flex-wrap">
                  {/* Level Badge */}
                  <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                    {member.levelBadge}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>



      {/* ================= 6. SECTION: 📂 ملفات النادي ================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-black text-slate-900">ملفات النادي 📂</h2>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {files.length} ملفات جاهزة للتحميل
          </span>
        </div>

        {files.length === 0 ? (
          <div className="bg-white/90 rounded-[24px] p-6 text-center border border-[#EEF2F7]">
            <p className="text-xs font-bold text-slate-500">لا توجد ملفات مرفوعة في النادي حالياً.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {files.map((file) => (
              <motion.div
                key={file.id}
                whileHover={{ y: -2 }}
                onClick={() => setSelectedFileModal(file)}
                className="bg-white/90 border border-[#EEF2F7] hover:border-sky-300 shadow-[0_8px_25px_rgb(0,0,0,0.03)] rounded-[24px] p-4 flex items-center justify-between gap-3 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0">
                    {getFileIcon(file.fileType)}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                      {file.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                      {getFileTypeBadge(file.fileType)}
                      <span>• {file.fileSize}</span>
                    </div>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-teal-50 text-slate-500 hover:text-teal-700 flex items-center justify-center shrink-0 transition-colors">
                  <Download className="w-4 h-4" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>



      {/* ================= FILE MODAL PREVIEW ================= */}
      <AnimatePresence>
        {selectedFileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs dir-rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  {getFileIcon(selectedFileModal.fileType)}
                  <h3 className="font-extrabold text-sm text-slate-900 truncate">معاينة الملف</h3>
                </div>
                <button
                  onClick={() => setSelectedFileModal(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                <h4 className="font-black text-sm text-slate-900">{selectedFileModal.title}</h4>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                  <span>الحجم: {selectedFileModal.fileSize}</span>
                  <span>•</span>
                  <span>تاريخ الرفع: {selectedFileModal.uploadDate}</span>
                </div>
                <div className="pt-1">{getFileTypeBadge(selectedFileModal.fileType)}</div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => {
                    showToast(`جاري تحميل الملف "${selectedFileModal.title}"...`);
                    setSelectedFileModal(null);
                  }}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-xs shadow-lg shadow-teal-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل الملف الآن</span>
                </button>
                <button
                  onClick={() => setSelectedFileModal(null)}
                  className="py-3 px-4 rounded-2xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Proof Submission Modal */}
        {proofSubmissionModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-[32px] p-6 shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">إرسال إثبات إنجاز التحدي</h3>
                    <p className="text-[11px] text-teal-700 font-bold">+{proofSubmissionModal.task.xp_reward || proofSubmissionModal.task.rewardXp || 100} XP 💎</p>
                  </div>
                </div>
                <button
                  onClick={() => setProofSubmissionModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="block font-black text-xs text-slate-900 mb-1">
                    {proofSubmissionModal.task.title}
                  </span>
                  {proofSubmissionModal.task.description && (
                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                      {proofSubmissionModal.task.description}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-700">
                    ماذا فعلت لإنجاز هذا التحدي؟ (تفاصيل أو ملحوظة للمعلم):
                  </label>
                  <textarea
                    rows={3}
                    value={proofSubmissionModal.notes}
                    onChange={(e) =>
                      setProofSubmissionModal({ ...proofSubmissionModal, notes: e.target.value })
                    }
                    placeholder="مثال: قمت بتصميم الملصق المطلوب وكتابة العبارات التوجيهية..."
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleConfirmProofSubmit}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-xs shadow-md shadow-teal-600/20 cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>إرسال للمراجعة والاعتماد</span>
                </button>
                <button
                  onClick={() => setProofSubmissionModal(null)}
                  className="py-3 px-4 rounded-2xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <StudentClubDebugPanel debugInfo={debugInfo} studentContext={studentContext} currentClub={currentClub} />
    </div>
  );
};
