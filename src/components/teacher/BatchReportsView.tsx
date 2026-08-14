import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  BarChart2,
  Award,
  Users,
  Download,
  User,
  Sparkles,
  Trophy,
  CheckCircle2,
  Compass,
  FileText,
  Layers,
  ChevronDown,
  BookOpen,
  Calendar,
  Medal,
  Star,
  Printer
} from 'lucide-react';
import { Batch, BatchStudent, BatchClub, PendingSubmission } from '../../types/teacher';
import { teacherService } from '../../services/teacherService';
import { calculateStudentJourney, StudentJourneyMetrics } from '../../services/journeyEngine';

interface BatchReportsViewProps {
  batch: Batch;
  batches?: Batch[];
}

export type ReportTargetType = 'batch' | 'student' | 'club' | 'all_clubs';

export const BatchReportsView: React.FC<BatchReportsViewProps> = ({ batch, batches = [] }) => {
  // Available batches
  const allBatches = batches.length > 0 ? batches : [batch];

  // Selection states
  const [selectedBatchId, setSelectedBatchId] = useState<string>(batch.id);
  const [targetType, setTargetType] = useState<ReportTargetType>('batch');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedClubId, setSelectedClubId] = useState<string>('');
  const [topAchieversLimit, setTopAchieversLimit] = useState<3 | 5 | 10>(3);

  // Data states
  const [currentBatch, setCurrentBatch] = useState<Batch>(batch);
  const [students, setStudents] = useState<BatchStudent[]>([]);
  const [clubs, setClubs] = useState<BatchClub[]>([]);
  const [submissions, setSubmissions] = useState<PendingSubmission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync selectedBatchId when parent batch prop changes
  useEffect(() => {
    if (batch?.id) {
      setSelectedBatchId(batch.id);
      setCurrentBatch(batch);
    }
  }, [batch]);

  // Load batch report data whenever selectedBatchId changes or on event
  const loadReportData = async (batchId: string) => {
    setIsLoading(true);
    try {
      const [fetchedBatch, fetchedStudents, fetchedClubs, fetchedSubs] = await Promise.all([
        teacherService.getBatchById(batchId),
        teacherService.getStudentsByBatch(batchId),
        teacherService.getClubsByBatch(batchId),
        teacherService.getPendingSubmissions(batchId),
      ]);

      if (fetchedBatch) setCurrentBatch(fetchedBatch);
      setStudents(fetchedStudents || []);
      setClubs(fetchedClubs || []);
      setSubmissions(fetchedSubs || []);

      // Auto-select student if needed
      if (fetchedStudents && fetchedStudents.length > 0 && !selectedStudentId) {
        setSelectedStudentId(fetchedStudents[0].id);
      }
      // Auto-select club if needed
      if (fetchedClubs && fetchedClubs.length > 0 && !selectedClubId) {
        setSelectedClubId(fetchedClubs[0].id);
      }
    } catch (err) {
      console.error('Error loading report data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReportData(selectedBatchId);

    const handleUpdate = () => {
      loadReportData(selectedBatchId);
    };

    window.addEventListener('rihlat_db_updated', handleUpdate);
    window.addEventListener('rihlat_settings_updated', handleUpdate);
    return () => {
      window.removeEventListener('rihlat_db_updated', handleUpdate);
      window.removeEventListener('rihlat_settings_updated', handleUpdate);
    };
  }, [selectedBatchId]);

  // Helper to get approved challenge submissions for a student
  const getStudentApprovedSubmissions = (student: BatchStudent) => {
    return submissions.filter(
      (s) =>
        s.status === 'approved' &&
        (s.studentId === student.id ||
          (s.studentCode && student.studentCode && s.studentCode.trim().toLowerCase() === student.studentCode.trim().toLowerCase()) ||
          (s.studentName && s.studentName.trim().toLowerCase() === student.name.trim().toLowerCase()))
    );
  };

  // Helper to compute metrics per student
  const computeStudentMetrics = (student: BatchStudent) => {
    const studentApprovedSubs = getStudentApprovedSubmissions(student);
    const approvedChallenges = studentApprovedSubs.filter(
      (s) => s.sourceType === 'challenge' || !s.sourceType || s.challengeId
    );
    const completedChallengesCount = approvedChallenges.length;
    const challengeXpEarned = approvedChallenges.reduce((sum, s) => sum + (s.rewardXp || 0), 0);

    const journeyMetrics: StudentJourneyMetrics = {
      id: student.id,
      name: student.name,
      studentCode: student.studentCode,
      batchId: selectedBatchId,
      className: student.className,
      clubName: student.clubName,
      xp: student.points || 0,
      points: student.points || 0,
      completedChallengesCount,
      clubTasksCompleted: studentApprovedSubs.filter((s) => s.sourceType === 'club').length,
      clubAnnouncementsCount: 0,
      attendanceRate: student.attendanceRate ?? 95,
      teacherEvaluationsCount: 1,
      libraryViewsCount: 1,
      specialRewardsCount: 0,
      badgesEarnedCount: 0,
      avatarUrl: student.avatarUrl,
    };

    const journeyRes = calculateStudentJourney(journeyMetrics);

    return {
      student,
      approvedSubs: studentApprovedSubs,
      approvedChallenges,
      completedCount: completedChallengesCount,
      challengeXpEarned,
      journeyRes,
    };
  };

  // Computed data for all students in current batch
  const computedStudents = students.map(computeStudentMetrics);

  // Sort students by approved completed challenges descending (secondary sort by XP)
  const rankedStudents = [...computedStudents].sort((a, b) => {
    if (b.completedCount !== a.completedCount) {
      return b.completedCount - a.completedCount;
    }
    return b.student.points - a.student.points;
  });

  // Export PDF Handler
  const handleExportPDF = () => {
    window.print();
  };

  // Find currently selected student if targetType === 'student'
  const activeStudentComputed =
    computedStudents.find((cs) => cs.student.id === selectedStudentId) ||
    computedStudents[0] ||
    null;

  // Find currently selected club if targetType === 'club'
  const activeClub =
    clubs.find((c) => c.id === selectedClubId) || clubs[0] || null;

  const activeClubStudents = activeClub
    ? computedStudents.filter(
        (cs) =>
          cs.student.clubName &&
          cs.student.clubName.trim().toLowerCase() === activeClub.name.trim().toLowerCase()
      )
    : [];

  return (
    <div className="space-y-6 dir-rtl text-right">
      {/* Printable CSS overrides */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-report-area, .printable-report-area * {
            visibility: visible;
          }
          .printable-report-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white;
            color: black;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Header & Export PDF Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-[28px] border border-[#EEF2F7] shadow-sm no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 font-bold">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">تقارير وأداء {currentBatch?.name}</h2>
            <p className="text-xs font-bold text-slate-500">
              مؤشرات الأداء الحقيقية، الإنجازات المعتمدة، ورحلات التعلم للطلاب والأندية
            </p>
          </div>
        </div>

        <button
          onClick={handleExportPDF}
          className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-700/20 flex items-center gap-2 cursor-pointer transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>تصدير تقرير الدفعة PDF</span>
        </button>
      </div>

      {/* Target Selector Controls Panel */}
      <div className="p-5 bg-white rounded-[28px] border border-[#EEF2F7] shadow-xs space-y-4 no-print">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Layers className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-black text-slate-800">تحديد نطاق التقرير المطلوب:</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Target Type Buttons */}
          <button
            onClick={() => setTargetType('batch')}
            className={`p-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              targetType === 'batch'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-md shadow-emerald-700/20'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>دفعة كاملة</span>
          </button>

          <button
            onClick={() => setTargetType('student')}
            className={`p-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              targetType === 'student'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-md shadow-emerald-700/20'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <User className="w-4 h-4" />
            <span>طالب واحد</span>
          </button>

          <button
            onClick={() => setTargetType('club')}
            className={`p-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              targetType === 'club'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-md shadow-emerald-700/20'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>نادي واحد</span>
          </button>

          <button
            onClick={() => setTargetType('all_clubs')}
            className={`p-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              targetType === 'all_clubs'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-md shadow-emerald-700/20'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>جميع أندية الدفعة</span>
          </button>
        </div>

        {/* Dynamic Dropdowns Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
          {/* Batch Selector Dropdown */}
          <div className="space-y-1">
            <label className="text-[11px] font-black text-slate-600">الدفعة المستهدفة:</label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-black rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {allBatches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.stage})
                </option>
              ))}
            </select>
          </div>

          {/* Student Selector Dropdown (Visible only if targetType === 'student') */}
          {targetType === 'student' && (
            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-600">اختر الطالب:</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-black rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {students.length === 0 ? (
                  <option value="">لا يوجد طلاب في هذه الدفعة</option>
                ) : (
                  students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} — {st.className}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          {/* Club Selector Dropdown (Visible only if targetType === 'club') */}
          {targetType === 'club' && (
            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-600">اختر النادي:</label>
              <select
                value={selectedClubId}
                onChange={(e) => setSelectedClubId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-black rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {clubs.length === 0 ? (
                  <option value="">لا توجد أندية بأسماء مستقلة بعد</option>
                ) : (
                  clubs.map((cl) => (
                    <option key={cl.id} value={cl.id}>
                      {cl.name} ({cl.memberCount || 0} عضو)
                    </option>
                  ))
                )}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Printable Content Area */}
      <div className="printable-report-area space-y-6">
        {isLoading ? (
          <div className="p-12 text-center bg-white rounded-[28px] border border-slate-200">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-xs font-black text-slate-600">جاري تحميل بيانات التقرير الحقيقية...</p>
          </div>
        ) : (
          <>
            {/* ======================================================== */}
            {/* REPORT TARGET 1: FULL BATCH REPORT ('batch')             */}
            {/* ======================================================== */}
            {targetType === 'batch' && (
              <div className="space-y-6">
                {/* Batch Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 rounded-[28px] bg-white border border-[#EEF2F7] shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>إجمالي الطلاب</span>
                      <Users className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-black text-emerald-700">{students.length} طالب/طالبة</div>
                    <p className="text-[11px] text-slate-400 font-bold">مسجلون في {currentBatch?.name}</p>
                  </div>

                  <div className="p-5 rounded-[28px] bg-white border border-[#EEF2F7] shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>إجمالي النقاط والمكافآت</span>
                      <Award className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="text-2xl font-black text-amber-700">
                      {students.reduce((sum, s) => sum + (s.points || 0), 0)} XP
                    </div>
                    <p className="text-[11px] text-slate-400 font-bold">مجموع نقاط طلاب الدفعة</p>
                  </div>

                  <div className="p-5 rounded-[28px] bg-white border border-[#EEF2F7] shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>التحديات المعتمدة المكتملة</span>
                      <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    </div>
                    <div className="text-2xl font-black text-teal-700">
                      {computedStudents.reduce((sum, cs) => sum + cs.completedCount, 0)} إنجاز
                    </div>
                    <p className="text-[11px] text-slate-400 font-bold">تحديات تم تقديمها واعتمدتها المعلمة</p>
                  </div>

                  <div className="p-5 rounded-[28px] bg-white border border-[#EEF2F7] shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>متوسط التقدم بالرحلة</span>
                      <Compass className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-2xl font-black text-purple-700">
                      {students.length > 0
                        ? Math.round(
                            computedStudents.reduce((sum, cs) => sum + cs.journeyRes.journeyPercentage, 0) /
                              students.length
                          )
                        : 0}
                      %
                    </div>
                    <p className="text-[11px] text-slate-400 font-bold">مستوى التقدم العام لطلاب الدفعة</p>
                  </div>
                </div>

                {/* Section 5: TOP ACHIEVERS RANKING */}
                <div className="p-6 rounded-[28px] bg-white border border-[#EEF2F7] shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-500" />
                      <span>أكثر الطلاب إنجازًا (حسب التحديات المعتمدة)</span>
                    </h3>

                    {/* Ranking Limit Controls: أول 3 | أول 5 | أول 10 */}
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl no-print">
                      <button
                        onClick={() => setTopAchieversLimit(3)}
                        className={`px-3 py-1 rounded-lg text-xs font-black cursor-pointer transition-all ${
                          topAchieversLimit === 3
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        أول 3
                      </button>
                      <button
                        onClick={() => setTopAchieversLimit(5)}
                        className={`px-3 py-1 rounded-lg text-xs font-black cursor-pointer transition-all ${
                          topAchieversLimit === 5
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        أول 5
                      </button>
                      <button
                        onClick={() => setTopAchieversLimit(10)}
                        className={`px-3 py-1 rounded-lg text-xs font-black cursor-pointer transition-all ${
                          topAchieversLimit === 10
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        أول 10
                      </button>
                    </div>
                  </div>

                  {rankedStudents.length === 0 ? (
                    <p className="text-xs font-bold text-slate-500 text-center py-6">
                      لا يوجد طلاب مسجلون في هذه الدفعة بعد.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {rankedStudents.slice(0, topAchieversLimit).map((cs, idx) => {
                        const medals = ['🥇 المركز الأول', '🥈 المركز الثاني', '🥉 المركز الثالث'];
                        const rankTitle = medals[idx] || `المركز ${idx + 1}`;
                        const isTopThree = idx < 3;

                        return (
                          <div
                            key={cs.student.id}
                            className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                              idx === 0
                                ? 'bg-amber-50/80 border-amber-300'
                                : idx === 1
                                ? 'bg-slate-50 border-slate-300'
                                : idx === 2
                                ? 'bg-orange-50/60 border-orange-200'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="space-y-1">
                              <span
                                className={`text-[11px] font-black px-2 py-0.5 rounded-md inline-block ${
                                  idx === 0
                                    ? 'bg-amber-100 text-amber-900'
                                    : idx === 1
                                    ? 'bg-slate-200 text-slate-800'
                                    : idx === 2
                                    ? 'bg-orange-100 text-orange-900'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {rankTitle}
                              </span>
                              <h4 className="font-black text-slate-900 text-sm">{cs.student.name}</h4>
                              <p className="text-[11px] text-slate-500 font-bold">
                                {cs.student.className} {cs.student.clubName ? `• ${cs.student.clubName}` : ''}
                              </p>
                            </div>

                            <div className="text-left space-y-1">
                              <div className="px-2.5 py-1 bg-emerald-100 text-emerald-900 font-black text-xs rounded-lg border border-emerald-200">
                                {cs.completedCount} إنجازات
                              </div>
                              <div className="text-xs font-black text-amber-700 text-left">
                                {cs.student.points} XP
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* All Batch Students Overview List */}
                <div className="p-6 rounded-[28px] bg-white border border-[#EEF2F7] shadow-xs space-y-4">
                  <h3 className="font-black text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <BookOpen className="w-5 h-5 text-emerald-600" />
                    <span>سجل أداء كافة طلاب الدفعة ({students.length})</span>
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 font-black border-b border-slate-200">
                          <th className="p-3">الطالب</th>
                          <th className="p-3">الفصل</th>
                          <th className="p-3">النادي</th>
                          <th className="p-3 text-center">التحديات المعتمدة</th>
                          <th className="p-3 text-center">النقاط (XP)</th>
                          <th className="p-3">محطة الرحلة</th>
                          <th className="p-3 text-center">التقدم %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {computedStudents.map((cs) => (
                          <tr key={cs.student.id} className="hover:bg-slate-50/80 font-bold text-slate-800">
                            <td className="p-3 font-black text-slate-900">{cs.student.name}</td>
                            <td className="p-3">{cs.student.className}</td>
                            <td className="p-3 text-slate-500">{cs.student.clubName || 'بدون نادي'}</td>
                            <td className="p-3 text-center">
                              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 font-black">
                                {cs.completedCount}
                              </span>
                            </td>
                            <td className="p-3 text-center font-black text-amber-700">{cs.student.points}</td>
                            <td className="p-3 text-purple-800 font-black">
                              {cs.journeyRes.currentStation.title}
                            </td>
                            <td className="p-3 text-center font-black">
                              {cs.journeyRes.journeyPercentage}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* REPORT TARGET 2: SINGLE STUDENT REPORT ('student')        */}
            {/* ======================================================== */}
            {targetType === 'student' && (
              <div className="space-y-6">
                {!activeStudentComputed ? (
                  <div className="p-8 text-center bg-white rounded-[28px] border border-slate-200">
                    <User className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-black text-slate-600">يرجى اختيار طالب لعرض تقريره بالتفصيل.</p>
                  </div>
                ) : (
                  <>
                    {/* Student Identity Banner */}
                    <div className="p-6 rounded-[28px] bg-gradient-to-r from-emerald-800 to-teal-800 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={activeStudentComputed.student.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={activeStudentComputed.student.name}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-white/40 shadow-sm"
                        />
                        <div>
                          <div className="text-xs font-bold text-emerald-200">
                            {currentBatch?.name} • {activeStudentComputed.student.className}
                          </div>
                          <h2 className="text-xl font-black text-white mt-0.5">
                            {activeStudentComputed.student.name}
                          </h2>
                          <div className="text-xs font-bold text-emerald-100 mt-1 flex items-center gap-2">
                            <span>النادي: {activeStudentComputed.student.clubName || 'غير منتسب'}</span>
                            {activeStudentComputed.student.studentCode && (
                              <span>• الكود: {activeStudentComputed.student.studentCode}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-left bg-white/10 p-3 rounded-2xl border border-white/20 backdrop-blur-xs">
                        <span className="text-[10px] text-emerald-200 font-bold block">محطة الرحلة الحالية:</span>
                        <span className="text-base font-black text-amber-300">
                          {activeStudentComputed.journeyRes.currentStation.title}
                        </span>
                      </div>
                    </div>

                    {/* Student Metrics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-5 rounded-[28px] bg-white border border-[#EEF2F7] shadow-xs space-y-1">
                        <span className="text-xs font-bold text-slate-500">إجمالي النقاط XP</span>
                        <div className="text-2xl font-black text-amber-600">{activeStudentComputed.student.points} XP</div>
                        <p className="text-[11px] text-slate-400 font-bold">الرصيد الكلي للنقاط والمكافآت</p>
                      </div>

                      <div className="p-5 rounded-[28px] bg-white border border-[#EEF2F7] shadow-xs space-y-1">
                        <span className="text-xs font-bold text-slate-500">التحديات المكتملة المعتمدة</span>
                        <div className="text-2xl font-black text-emerald-600">
                          {activeStudentComputed.completedCount} إنجاز
                        </div>
                        <p className="text-[11px] text-slate-400 font-bold">معتمدة رسمياً من المعلمة</p>
                      </div>

                      <div className="p-5 rounded-[28px] bg-white border border-[#EEF2F7] shadow-xs space-y-1">
                        <span className="text-xs font-bold text-slate-500">نقاط التحديات فقط</span>
                        <div className="text-2xl font-black text-teal-600">
                          +{activeStudentComputed.challengeXpEarned} XP
                        </div>
                        <p className="text-[11px] text-slate-400 font-bold">مكتسبة من التحديات المعتمدة</p>
                      </div>

                      <div className="p-5 rounded-[28px] bg-white border border-[#EEF2F7] shadow-xs space-y-1">
                        <span className="text-xs font-bold text-slate-500">نسبة الإنجاز في الرحلة</span>
                        <div className="text-2xl font-black text-purple-600">
                          {activeStudentComputed.journeyRes.journeyPercentage}%
                        </div>
                        <p className="text-[11px] text-slate-400 font-bold">معدل التقدم بمحطات الرحلة</p>
                      </div>
                    </div>

                    {/* List of Approved Completed Challenges */}
                    <div className="p-6 rounded-[28px] bg-white border border-[#EEF2F7] shadow-xs space-y-4">
                      <h3 className="font-black text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span>سجل التحديات والإنجازات المعتمدة ({activeStudentComputed.approvedSubs.length})</span>
                      </h3>

                      {activeStudentComputed.approvedSubs.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs font-bold">
                          لا توجد تحديات أو إنجازات معتمدة لهذا الطالب حتى الآن.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {activeStudentComputed.approvedSubs.map((sub) => (
                            <div
                              key={sub.id}
                              className="p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/40 flex flex-wrap items-center justify-between gap-3"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md">
                                    معتمد ✓
                                  </span>
                                  <h4 className="font-black text-slate-900 text-sm">{sub.taskTitle || sub.sourceName}</h4>
                                </div>
                                <p className="text-xs font-bold text-slate-600">{sub.contentSummary || 'تم إنجاز المهمة المطلوبة بنجاح.'}</p>
                                {sub.teacherNotes && (
                                  <p className="text-[11px] font-bold text-teal-800 bg-teal-100/60 px-2.5 py-1 rounded-lg">
                                    ملاحظات المعلمة: {sub.teacherNotes}
                                  </p>
                                )}
                              </div>

                              <div className="text-left space-y-1">
                                <span className="font-black text-sm text-emerald-700 bg-emerald-100 px-3 py-1 rounded-xl block">
                                  +{sub.rewardXp || 50} XP
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 block">{sub.submittedAt || 'مؤخراً'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* REPORT TARGET 3: SINGLE CLUB REPORT ('club')             */}
            {/* ======================================================== */}
            {targetType === 'club' && (
              <div className="space-y-6">
                {!activeClub ? (
                  <div className="p-8 text-center bg-white rounded-[28px] border border-slate-200">
                    <Sparkles className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-black text-slate-600">لا توجد أندية مخصصة في هذه الدفعة بعد.</p>
                  </div>
                ) : (
                  <>
                    {/* Club Header Banner */}
                    <div className="p-6 rounded-[28px] bg-slate-900 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="text-xs font-bold text-purple-300">
                          {currentBatch?.name} • {activeClub.category || 'نادي نشاط'}
                        </div>
                        <h2 className="text-xl font-black text-white mt-0.5">{activeClub.name}</h2>
                        <p className="text-xs font-bold text-slate-300 mt-1">{activeClub.description}</p>
                      </div>

                      <div className="text-left bg-white/10 p-3 rounded-2xl border border-white/20">
                        <span className="text-[10px] text-slate-300 font-bold block">مشرفة النادي:</span>
                        <span className="text-sm font-black text-amber-300">{activeClub.supervisorName || 'معلمة الحلقة'}</span>
                      </div>
                    </div>

                    {/* Club Metrics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-5 rounded-[28px] bg-white border border-[#EEF2F7] shadow-xs space-y-1">
                        <span className="text-xs font-bold text-slate-500">عدد المنتسبين للنادي</span>
                        <div className="text-2xl font-black text-purple-700">{activeClubStudents.length} عضو</div>
                        <p className="text-[11px] text-slate-400 font-bold">طلاب منتسبون رسمياً لـ {activeClub.name}</p>
                      </div>

                      <div className="p-5 rounded-[28px] bg-white border border-[#EEF2F7] shadow-xs space-y-1">
                        <span className="text-xs font-bold text-slate-500">إجمالي التحديات المعتمدة لأعضاء النادي</span>
                        <div className="text-2xl font-black text-emerald-700">
                          {activeClubStudents.reduce((sum, cs) => sum + cs.completedCount, 0)} إنجاز
                        </div>
                        <p className="text-[11px] text-slate-400 font-bold">إنجازات محققة من قبل الأعضاء</p>
                      </div>

                      <div className="p-5 rounded-[28px] bg-white border border-[#EEF2F7] shadow-xs space-y-1">
                        <span className="text-xs font-bold text-slate-500">إجمالي نقاط أعضاء النادي</span>
                        <div className="text-2xl font-black text-amber-700">
                          {activeClubStudents.reduce((sum, cs) => sum + cs.student.points, 0)} XP
                        </div>
                        <p className="text-[11px] text-slate-400 font-bold">مجموع النقاط المكتسبة</p>
                      </div>
                    </div>

                    {/* Club Members Roster */}
                    <div className="p-6 rounded-[28px] bg-white border border-[#EEF2F7] shadow-xs space-y-4">
                      <h3 className="font-black text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                        <Users className="w-5 h-5 text-purple-600" />
                        <span>قائمة أعضاء نادي {activeClub.name} ({activeClubStudents.length})</span>
                      </h3>

                      {activeClubStudents.length === 0 ? (
                        <p className="text-xs font-bold text-slate-500 text-center py-6">
                          لا يوجد طلاب منتسبون لهذا النادي حالياً.
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-right text-xs">
                            <thead>
                              <tr className="bg-slate-50 text-slate-600 font-black border-b border-slate-200">
                                <th className="p-3">الطالب</th>
                                <th className="p-3">الفصل</th>
                                <th className="p-3 text-center">التحديات المعتمدة</th>
                                <th className="p-3 text-center">النقاط (XP)</th>
                                <th className="p-3">محطة الرحلة</th>
                                <th className="p-3 text-center">التقدم %</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {activeClubStudents.map((cs) => (
                                <tr key={cs.student.id} className="hover:bg-slate-50/80 font-bold text-slate-800">
                                  <td className="p-3 font-black text-slate-900">{cs.student.name}</td>
                                  <td className="p-3">{cs.student.className}</td>
                                  <td className="p-3 text-center">
                                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 font-black">
                                      {cs.completedCount}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center font-black text-amber-700">{cs.student.points}</td>
                                  <td className="p-3 text-purple-800 font-black">
                                    {cs.journeyRes.currentStation.title}
                                  </td>
                                  <td className="p-3 text-center font-black">
                                    {cs.journeyRes.journeyPercentage}%
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* REPORT TARGET 4: ALL CLUBS IN BATCH ('all_clubs')         */}
            {/* ======================================================== */}
            {targetType === 'all_clubs' && (
              <div className="space-y-6">
                <div className="p-6 rounded-[28px] bg-white border border-[#EEF2F7] shadow-xs space-y-4">
                  <h3 className="font-black text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <span>مقارنة وتقارير جميع أندية {currentBatch?.name} ({clubs.length} أندية)</span>
                  </h3>

                  {clubs.length === 0 ? (
                    <p className="text-xs font-bold text-slate-500 text-center py-6">
                      لا توجد أندية مخصصة في هذه الدفعة بعد.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {clubs.map((cl) => {
                        const members = computedStudents.filter(
                          (cs) =>
                            cs.student.clubName &&
                            cs.student.clubName.trim().toLowerCase() === cl.name.trim().toLowerCase()
                        );
                        const totalApproved = members.reduce((sum, m) => sum + m.completedCount, 0);
                        const totalXp = members.reduce((sum, m) => sum + m.student.points, 0);

                        return (
                          <div key={cl.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                              <h4 className="font-black text-slate-900 text-base">{cl.name}</h4>
                              <span className="text-[11px] font-black bg-purple-100 text-purple-800 px-2.5 py-1 rounded-lg">
                                {members.length} عضو
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 font-bold">{cl.description}</p>

                            <div className="grid grid-cols-2 gap-2 text-center text-xs font-black pt-1">
                              <div className="p-2 bg-white rounded-xl border border-slate-200">
                                <span className="text-[10px] text-slate-400 block font-bold">التحديات المعتمدة</span>
                                <span className="text-emerald-700 text-sm">{totalApproved} إنجاز</span>
                              </div>
                              <div className="p-2 bg-white rounded-xl border border-slate-200">
                                <span className="text-[10px] text-slate-400 block font-bold">مجموع النقاط</span>
                                <span className="text-amber-700 text-sm">{totalXp} XP</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
