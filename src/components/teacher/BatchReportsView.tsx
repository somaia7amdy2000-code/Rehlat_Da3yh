import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart2,
  Award,
  Users,
  Download,
  User,
  Sparkles,
  Trophy,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  Layers,
  ChevronDown,
  BookOpen,
  Calendar,
  Medal,
  Star,
  Printer,
  Search,
  Filter,
  School,
  FileSpreadsheet,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';
import {
  Batch,
  BatchStudent,
  BatchClass,
  BatchClub,
  BatchChallenge,
  PendingSubmission,
} from '../../types/teacher';
import { teacherService } from '../../services/teacherService';
import { calculateStudentJourney, StudentJourneyMetrics } from '../../services/journeyEngine';

interface BatchReportsViewProps {
  batch: Batch;
  batches?: Batch[];
}

export type ReportTargetType = 'batch' | 'class' | 'club' | 'student' | 'all_students' | 'all_clubs';

export const BatchReportsView: React.FC<BatchReportsViewProps> = ({ batch, batches = [] }) => {
  // Available batches
  const allBatches = batches.length > 0 ? batches : [batch];

  // Selection states
  const [selectedBatchId, setSelectedBatchId] = useState<string>(batch.id);
  const [targetType, setTargetType] = useState<ReportTargetType>('batch');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedClubId, setSelectedClubId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [topAchieversLimit, setTopAchieversLimit] = useState<3 | 5 | 10>(3);

  // Date Range filter states
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [datePreset, setDatePreset] = useState<'all' | 'this_month' | 'last_30_days' | 'last_7_days'>('all');

  // Data states (Real Supabase data)
  const [currentBatch, setCurrentBatch] = useState<Batch>(batch);
  const [students, setStudents] = useState<BatchStudent[]>([]);
  const [classes, setClasses] = useState<BatchClass[]>([]);
  const [clubs, setClubs] = useState<BatchClub[]>([]);
  const [challenges, setChallenges] = useState<BatchChallenge[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<PendingSubmission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync selectedBatchId when parent batch prop changes
  useEffect(() => {
    if (batch?.id) {
      setSelectedBatchId(batch.id);
      setCurrentBatch(batch);
    }
  }, [batch?.id]);

  // Load real batch data from Supabase
  // Only the newest load updates the report; the full-screen spinner shows only on the first
  // load of a batch — later refreshes happen quietly in the background.
  const loadSeqRef = useRef(0);
  const loadedBatchRef = useRef<string | null>(null);

  const loadReportData = async (batchId: string) => {
    const seq = ++loadSeqRef.current;
    if (loadedBatchRef.current !== batchId) setIsLoading(true);
    try {
      const [fetchedBatch, fetchedStudents, fetchedClasses, fetchedClubs, fetchedChallenges, fetchedSubs] =
        await Promise.all([
          teacherService.getBatchById(batchId),
          teacherService.getStudentsByBatch(batchId),
          teacherService.getClassesByBatch(batchId),
          teacherService.getClubsByBatch(batchId),
          teacherService.getChallengesByBatch(batchId),
          teacherService.getAllSubmissionsByBatch(batchId),
        ]);

      if (seq !== loadSeqRef.current) return;
      loadedBatchRef.current = batchId;
      if (fetchedBatch) setCurrentBatch(fetchedBatch);
      setStudents(fetchedStudents || []);
      setClasses(fetchedClasses || []);
      setClubs(fetchedClubs || []);
      setChallenges(fetchedChallenges || []);
      setAllSubmissions(fetchedSubs || []);

      // Auto-select class if available
      if (fetchedClasses && fetchedClasses.length > 0 && !selectedClassId) {
        setSelectedClassId(fetchedClasses[0].id);
      }
      // Auto-select club if available
      if (fetchedClubs && fetchedClubs.length > 0 && !selectedClubId) {
        setSelectedClubId(fetchedClubs[0].id);
      }
      // Auto-select student if available
      if (fetchedStudents && fetchedStudents.length > 0 && !selectedStudentId) {
        setSelectedStudentId(fetchedStudents[0].id);
      }
    } catch (err) {
      console.error('Error loading real report data from Supabase:', err);
    } finally {
      if (seq === loadSeqRef.current) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReportData(selectedBatchId);

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const handleUpdate = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => loadReportData(selectedBatchId), 600);
    };

    window.addEventListener('rihlat_db_updated', handleUpdate);
    window.addEventListener('rihlat_settings_updated', handleUpdate);
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener('rihlat_db_updated', handleUpdate);
      window.removeEventListener('rihlat_settings_updated', handleUpdate);
    };
  }, [selectedBatchId]);

  // Handle Date Preset Changes
  const handleDatePresetChange = (preset: 'all' | 'this_month' | 'last_30_days' | 'last_7_days') => {
    setDatePreset(preset);
    const now = new Date();
    const toDateStr = now.toISOString().split('T')[0];

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'this_month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(startOfMonth.toISOString().split('T')[0]);
      setEndDate(toDateStr);
    } else if (preset === 'last_30_days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
      setEndDate(toDateStr);
    } else if (preset === 'last_7_days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      setStartDate(sevenDaysAgo.toISOString().split('T')[0]);
      setEndDate(toDateStr);
    }
  };

  // Helper: check if a date string falls inside the selected date range
  const isWithinDateRange = (dateStr?: string): boolean => {
    if (!startDate && !endDate) return true;
    if (!dateStr) return true;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return true;
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (d < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (d > end) return false;
      }
      return true;
    } catch {
      return true;
    }
  };

  // Filter submissions by date range
  const dateFilteredSubmissions = useMemo(() => {
    return allSubmissions.filter((sub) => isWithinDateRange(sub.submittedAt));
  }, [allSubmissions, startDate, endDate]);

  // Compute student audience match for challenges
  const isChallengeForStudent = (ch: BatchChallenge, student: BatchStudent): boolean => {
    return teacherService.isStudentInChallengeAudience(ch, student, selectedBatchId);
  };

  // Helper to compute rich metrics per student
  const computeStudentMetrics = (student: BatchStudent) => {
    // 0. Accurately resolve true club association from real Supabase clubs/club_members
    const matchedClub = clubs.find(
      (c) =>
        (student.clubId && c.id === student.clubId) ||
        c.members?.some(
          (m) =>
            m.id === student.id ||
            (m.studentCode &&
              student.studentCode &&
              m.studentCode.trim().toLowerCase() === student.studentCode.trim().toLowerCase()) ||
            (m.name && student.name && m.name.trim().toLowerCase() === student.name.trim().toLowerCase())
        ) ||
        (student.clubName &&
          student.clubName !== 'بدون نادي' &&
          c.name.trim().toLowerCase() === student.clubName.trim().toLowerCase())
    );

    const resolvedClubName =
      matchedClub?.name || (student.clubName && student.clubName !== 'بدون نادي' ? student.clubName : 'بدون نادي');
    const resolvedClubId = matchedClub?.id || student.clubId;

    const enrichedStudent: BatchStudent = {
      ...student,
      clubId: resolvedClubId,
      clubName: resolvedClubName,
    };

    // 1. All submissions for this student within date range
    const studentSubs = dateFilteredSubmissions.filter(
      (s) =>
        s.studentId === enrichedStudent.id ||
        (s.studentCode &&
          enrichedStudent.studentCode &&
          s.studentCode.trim().toLowerCase() === enrichedStudent.studentCode.trim().toLowerCase()) ||
        (s.studentName && s.studentName.trim().toLowerCase() === enrichedStudent.name.trim().toLowerCase())
    );

    // 2. Approved submissions
    const approvedSubs = studentSubs.filter((s) => s.status === 'approved');
    const completedChallengesCount = approvedSubs.length;

    // 3. Pending submissions
    const pendingSubs = studentSubs.filter((s) => s.status === 'pending');
    const pendingChallengesCount = pendingSubs.length;

    // 4. Assigned challenges for this student
    const assignedChallenges = challenges.filter((ch) => isChallengeForStudent(ch, enrichedStudent));
    const assignedChallengesCount = assignedChallenges.length;

    // 5. Completion Rate calculation
    const completionRate =
      assignedChallengesCount > 0
        ? Math.min(100, Math.round((completedChallengesCount / assignedChallengesCount) * 100))
        : completedChallengesCount > 0
        ? 100
        : 0;

    // 6. Challenge XP earned in this period
    const challengeXpEarned = approvedSubs.reduce((sum, s) => sum + (s.rewardXp || 0), 0);

    // 7. Journey engine metrics
    const journeyMetrics: StudentJourneyMetrics = {
      id: enrichedStudent.id,
      name: enrichedStudent.name,
      studentCode: enrichedStudent.studentCode,
      batchId: selectedBatchId,
      className: enrichedStudent.className,
      clubName: resolvedClubName,
      xp: enrichedStudent.points || 0,
      points: enrichedStudent.points || 0,
      completedChallengesCount,
      clubTasksCompleted: approvedSubs.filter((s) => s.sourceType === 'club').length,
      clubAnnouncementsCount: 0,
      attendanceRate: enrichedStudent.attendanceRate ?? 95,
      teacherEvaluationsCount: 1,
      libraryViewsCount: 1,
      specialRewardsCount: 0,
      badgesEarnedCount: 0,
      avatarUrl: enrichedStudent.avatarUrl,
    };

    const journeyRes = calculateStudentJourney(journeyMetrics);

    return {
      student: enrichedStudent,
      assignedChallengesCount,
      completedCount: completedChallengesCount,
      pendingCount: pendingChallengesCount,
      completionRate,
      challengeXpEarned,
      approvedSubs,
      pendingSubs,
      journeyRes,
    };
  };

  // Compute all students metrics
  const computedStudents = useMemo(() => {
    return students.map(computeStudentMetrics);
  }, [students, clubs, dateFilteredSubmissions, challenges, selectedBatchId]);

  // Filter students based on chosen scope (TargetType)
  const scopedStudents = useMemo(() => {
    let list = computedStudents;

    if (targetType === 'class' && selectedClassId) {
      const targetClass = classes.find((c) => c.id === selectedClassId);
      if (targetClass) {
        list = list.filter(
          (cs) =>
            cs.student.classId === selectedClassId ||
            (cs.student.className &&
              cs.student.className.trim().toLowerCase() === targetClass.name.trim().toLowerCase())
        );
      }
    } else if (targetType === 'club' && selectedClubId) {
      const targetClub = clubs.find((c) => c.id === selectedClubId);
      if (targetClub) {
        list = list.filter(
          (cs) =>
            cs.student.clubId === selectedClubId ||
            targetClub.members?.some(
              (m) =>
                m.id === cs.student.id ||
                (m.studentCode && cs.student.studentCode && m.studentCode === cs.student.studentCode)
            ) ||
            (cs.student.clubName &&
              cs.student.clubName.trim().toLowerCase() === targetClub.name.trim().toLowerCase())
        );
      }
    } else if (targetType === 'student' && selectedStudentId) {
      list = list.filter((cs) => cs.student.id === selectedStudentId);
    }

    // Apply search query if present
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      list = list.filter(
        (cs) =>
          cs.student.name.toLowerCase().includes(term) ||
          (cs.student.studentCode && cs.student.studentCode.toLowerCase().includes(term)) ||
          (cs.student.className && cs.student.className.toLowerCase().includes(term)) ||
          (cs.student.clubName && cs.student.clubName.toLowerCase().includes(term))
      );
    }

    return list;
  }, [computedStudents, targetType, selectedClassId, selectedClubId, selectedStudentId, searchTerm, classes, clubs]);

  // Sort students by completed challenges descending then points
  const rankedStudents = useMemo(() => {
    return [...scopedStudents].sort((a, b) => {
      if (b.completedCount !== a.completedCount) {
        return b.completedCount - a.completedCount;
      }
      return (b.student.points || 0) - (a.student.points || 0);
    });
  }, [scopedStudents]);

  // Summary Metrics for the Top KPI Cards
  const summaryStats = useMemo(() => {
    const totalStudents = scopedStudents.length;
    const totalPoints = scopedStudents.reduce((sum, cs) => sum + (cs.student.points || 0), 0);
    const totalApproved = scopedStudents.reduce((sum, cs) => sum + cs.completedCount, 0);
    const totalPending = scopedStudents.reduce((sum, cs) => sum + cs.pendingCount, 0);
    const avgCompletion =
      totalStudents > 0
        ? Math.round(scopedStudents.reduce((sum, cs) => sum + cs.completionRate, 0) / totalStudents)
        : 0;

    return {
      totalStudents,
      totalPoints,
      totalApproved,
      totalPending,
      avgCompletion,
    };
  }, [scopedStudents]);

  // Active Student for Single Student View
  const activeStudentComputed = useMemo(() => {
    if (targetType === 'student') {
      return (
        computedStudents.find((cs) => cs.student.id === selectedStudentId) ||
        computedStudents[0] ||
        null
      );
    }
    return null;
  }, [computedStudents, targetType, selectedStudentId]);

  // Active Club for Single Club View
  const activeClub = useMemo(() => {
    if (targetType === 'club') {
      return clubs.find((c) => c.id === selectedClubId) || clubs[0] || null;
    }
    return null;
  }, [clubs, targetType, selectedClubId]);

  // Active Class for Single Class View
  const activeClass = useMemo(() => {
    if (targetType === 'class') {
      return classes.find((c) => c.id === selectedClassId) || classes[0] || null;
    }
    return null;
  }, [classes, targetType, selectedClassId]);

  // Export to Excel / CSV with UTF-8 BOM
  const exportToCSV = () => {
    if (scopedStudents.length === 0) return;

    // Headers in Arabic
    const headers = [
      'الطالب',
      'الكود',
      'الفصل',
      'النادي',
      'النقاط',
      'عدد التحديات',
      'المنجزة',
      'قيد التنفيذ',
      'نسبة الإنجاز %',
      'محطة الرحلة',
    ];

    const rows = scopedStudents.map((cs) => [
      `"${cs.student.name.replace(/"/g, '""')}"`,
      `"${(cs.student.studentCode || '').replace(/"/g, '""')}"`,
      `"${(cs.student.className || 'الفصل').replace(/"/g, '""')}"`,
      `"${(cs.student.clubName || 'بدون نادي').replace(/"/g, '""')}"`,
      cs.student.points || 0,
      cs.assignedChallengesCount,
      cs.completedCount,
      cs.pendingCount,
      `${cs.completionRate}%`,
      `"${(cs.journeyRes.currentStation?.title || '').replace(/"/g, '""')}"`,
    ]);

    // Construct CSV Content with UTF-8 BOM (\uFEFF)
    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const dateStr = new Date().toISOString().split('T')[0];
    const scopeLabel =
      targetType === 'batch'
        ? `الدفعة_${currentBatch.name}`
        : targetType === 'class'
        ? `فصل_${activeClass?.name || 'الفصل'}`
        : targetType === 'club'
        ? `نادي_${activeClub?.name || 'النادي'}`
        : targetType === 'student'
        ? `طالب_${activeStudentComputed?.student.name || 'طالب'}`
        : `تقرير_شامل_${currentBatch.name}`;

    link.setAttribute('href', url);
    link.setAttribute('download', `تقرير_رحلة_داعية_${scopeLabel}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export PDF Handler
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6 dir-rtl text-right">
      {/* Printable CSS Overrides */}
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

      {/* Top Header & Export Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-[28px] border border-[#EEF2F7] shadow-sm no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 font-bold">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">
              تقارير وأداء {currentBatch?.name || 'الدفعة'}
            </h2>
            <p className="text-xs font-bold text-slate-500">
              بيانات حقيقية من Supabase، إنجازات الطلاب، ونسب إنجاز التحديات
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export to Excel/CSV */}
          <button
            onClick={exportToCSV}
            disabled={scopedStudents.length === 0}
            className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-black text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            title="تصدير جدول التقرير إلى Excel بصيغة CSV تدعم اللغة العربية"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>تصدير Excel / CSV</span>
          </button>

          {/* Export PDF / Print */}
          <button
            onClick={handleExportPDF}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-700/20 flex items-center gap-2 cursor-pointer transition-all"
            title="طباعة وتصدير التقرير بتنسيق PDF"
          >
            <Printer className="w-4 h-4" />
            <span>تصدير تقرير PDF</span>
          </button>
        </div>
      </div>

      {/* Filter & Target Selection Panel */}
      <div className="p-5 bg-white rounded-[28px] border border-[#EEF2F7] shadow-xs space-y-4 no-print">
        {/* 1. Target Scope Buttons */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-black text-slate-800">1. تحديد نطاق التقرير المطلوب:</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {/* Batch */}
            <button
              onClick={() => setTargetType('batch')}
              className={`p-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                targetType === 'batch'
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-md shadow-emerald-700/20'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>دفعة كاملة</span>
            </button>

            {/* Class */}
            <button
              onClick={() => setTargetType('class')}
              className={`p-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                targetType === 'class'
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-md shadow-emerald-700/20'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <School className="w-3.5 h-3.5" />
              <span>فصل محدد</span>
            </button>

            {/* Club */}
            <button
              onClick={() => setTargetType('club')}
              className={`p-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                targetType === 'club'
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-md shadow-emerald-700/20'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>نادي محدد</span>
            </button>

            {/* Single Student */}
            <button
              onClick={() => setTargetType('student')}
              className={`p-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                targetType === 'student'
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-md shadow-emerald-700/20'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>طالب محدد</span>
            </button>

            {/* All Students */}
            <button
              onClick={() => setTargetType('all_students')}
              className={`p-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                targetType === 'all_students'
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-md shadow-emerald-700/20'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>شامل الطلاب</span>
            </button>

            {/* All Clubs Comparison */}
            <button
              onClick={() => setTargetType('all_clubs')}
              className={`p-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                targetType === 'all_clubs'
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-md shadow-emerald-700/20'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>مقارنة الأندية</span>
            </button>
          </div>
        </div>

        {/* 2. Dynamic Dropdowns based on Selected Scope */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
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

          {/* Class Selector Dropdown (When targetType === 'class') */}
          {targetType === 'class' && (
            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-600">اختر الفصل:</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-black rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {classes.length === 0 ? (
                  <option value="">لا توجد فصول في هذه الدفعة</option>
                ) : (
                  classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.studentCount || 0} طالب)
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          {/* Club Selector Dropdown (When targetType === 'club') */}
          {targetType === 'club' && (
            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-600">اختر النادي:</label>
              <select
                value={selectedClubId}
                onChange={(e) => setSelectedClubId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-black rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {clubs.length === 0 ? (
                  <option value="">لا توجد أندية في هذه الدفعة</option>
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

          {/* Student Selector Dropdown (When targetType === 'student') */}
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
                      {st.name} — {st.className} {st.studentCode ? `(${st.studentCode})` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          {/* Search Box for Tables */}
          {(targetType === 'batch' || targetType === 'class' || targetType === 'all_students') && (
            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-600">بحث بالاسم أو الكود:</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ابحث عن طالب أو فصل..."
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl pr-8 pl-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {/* 3. Date Range Filter Section */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-black text-slate-800">2. تحديد الفترة الزمنية للتقرير:</h4>
            </div>

            {/* Quick Date Presets */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => handleDatePresetChange('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                  datePreset === 'all'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                كل الفترات
              </button>
              <button
                type="button"
                onClick={() => handleDatePresetChange('this_month')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                  datePreset === 'this_month'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                هذا الشهر
              </button>
              <button
                type="button"
                onClick={() => handleDatePresetChange('last_30_days')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                  datePreset === 'last_30_days'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                آخر 30 يوم
              </button>
              <button
                type="button"
                onClick={() => handleDatePresetChange('last_7_days')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                  datePreset === 'last_7_days'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                آخر 7 أيام
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">من تاريخ:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('all');
                }}
                className="w-full bg-transparent text-xs font-black text-slate-800 focus:outline-none cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">إلى تاريخ:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('all');
                }}
                className="w-full bg-transparent text-xs font-black text-slate-800 focus:outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Printable Content Area */}
      <div className="printable-report-area space-y-6">
        {isLoading ? (
          <div className="p-12 text-center bg-white rounded-[28px] border border-slate-200">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-xs font-black text-slate-600">جاري جلب بيانات التقرير الحقيقية من Supabase...</p>
          </div>
        ) : (
          <>
            {/* Header info in print mode */}
            <div className="hidden print:block border-b-2 border-emerald-700 pb-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-black text-slate-900">منصة رحلة داعية — تقرير الأداء والإنجاز</h1>
                  <p className="text-xs font-bold text-slate-600">
                    الدفعة: {currentBatch?.name} • المرحلة: {currentBatch?.stage} • المشرفة: {currentBatch?.supervisorName || 'معلمة الحلقة'}
                  </p>
                </div>
                <div className="text-left text-xs font-bold text-slate-500">
                  <p>تاريخ التقرير: {new Date().toLocaleDateString('ar-EG')}</p>
                  {(startDate || endDate) && (
                    <p>الفترة: من {startDate || 'البداية'} إلى {endDate || 'الآن'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* TOP STATISTICAL SUMMARY CARDS */}
            {targetType !== 'all_clubs' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total Students */}
                <div className="p-5 rounded-[28px] bg-white border border-[#EEF2F7] shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>عدد الطلاب</span>
                    <Users className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-emerald-700">{summaryStats.totalStudents} طالب</div>
                  <p className="text-[11px] text-slate-400 font-bold">
                    {targetType === 'batch'
                      ? `في ${currentBatch?.name}`
                      : targetType === 'class'
                      ? `في فصل ${activeClass?.name || ''}`
                      : targetType === 'club'
                      ? `في نادي ${activeClub?.name || ''}`
                      : 'في النطاق المحدد'}
                  </p>
                </div>

                {/* 2. Total Points (XP) */}
                <div className="p-5 rounded-[28px] bg-white border border-[#EEF2F7] shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>إجمالي النقاط والمكافآت</span>
                    <Award className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-black text-amber-700">{summaryStats.totalPoints} XP</div>
                  <p className="text-[11px] text-slate-400 font-bold">مجموع نقاط الطلاب بالنطاق</p>
                </div>

                {/* 3. Total Approved Submissions */}
                <div className="p-5 rounded-[28px] bg-white border border-[#EEF2F7] shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>التحديات المنجزة المعتمدة</span>
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="text-2xl font-black text-teal-700">{summaryStats.totalApproved} إنجاز</div>
                  <p className="text-[11px] text-slate-400 font-bold">
                    {summaryStats.totalPending > 0 ? `(${summaryStats.totalPending} قيد المراجعة)` : 'معتمدة بالكامل'}
                  </p>
                </div>

                {/* 4. Average Completion Rate */}
                <div className="p-5 rounded-[28px] bg-white border border-[#EEF2F7] shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>متوسط نسبة الإنجاز</span>
                    <Compass className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-2xl font-black text-purple-700">{summaryStats.avgCompletion}%</div>
                  <p className="text-[11px] text-slate-400 font-bold">معدل إنجاز التحديات الموجهة</p>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* VIEW 1: SINGLE STUDENT DETAILED REPORT ('student')       */}
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
                          src={
                            activeStudentComputed.student.avatarUrl ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                          }
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

                      <div className="text-left bg-white/10 p-3.5 rounded-2xl border border-white/20 backdrop-blur-xs space-y-1">
                        <span className="text-[10px] text-emerald-200 font-bold block">محطة الرحلة الحالية:</span>
                        <span className="text-base font-black text-amber-300">
                          {activeStudentComputed.journeyRes.currentStation?.title || '🌱 البداية'}
                        </span>
                        <div className="text-[11px] text-emerald-100 font-bold">
                          نسبة الإنجاز: {activeStudentComputed.completionRate}%
                        </div>
                      </div>
                    </div>

                    {/* Student Performance Metrics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-5 rounded-[28px] bg-white border border-[#EEF2F7] shadow-xs space-y-1">
                        <span className="text-xs font-bold text-slate-500">التحديات الموجهة للطالب</span>
                        <div className="text-2xl font-black text-slate-800">
                          {activeStudentComputed.assignedChallengesCount} تحديات
                        </div>
                        <p className="text-[11px] text-slate-400 font-bold">حسب الدفعة والفصل والنادي</p>
                      </div>

                      <div className="p-5 rounded-[28px] bg-white border border-[#EEF2F7] shadow-xs space-y-1">
                        <span className="text-xs font-bold text-slate-500">المنجزة المعتمدة</span>
                        <div className="text-2xl font-black text-emerald-600">
                          {activeStudentComputed.completedCount} إنجاز
                        </div>
                        <p className="text-[11px] text-slate-400 font-bold">معتمدة من المعلمة</p>
                      </div>

                      <div className="p-5 rounded-[28px] bg-white border border-[#EEF2F7] shadow-xs space-y-1">
                        <span className="text-xs font-bold text-slate-500">قيد المراجعة</span>
                        <div className="text-2xl font-black text-amber-600">
                          {activeStudentComputed.pendingCount} تسليم
                        </div>
                        <p className="text-[11px] text-slate-400 font-bold">بانتظار مراجعة المعلمة</p>
                      </div>
                    </div>

                    {/* Student Submissions List */}
                    <div className="p-6 rounded-[28px] bg-white border border-[#EEF2F7] shadow-xs space-y-4">
                      <h3 className="font-black text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span>
                          سجل إنجازات وتسليمات الطالب ({activeStudentComputed.approvedSubs.length + activeStudentComputed.pendingSubs.length})
                        </span>
                      </h3>

                      {activeStudentComputed.approvedSubs.length === 0 && activeStudentComputed.pendingSubs.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs font-bold">
                          لا توجد تسليمات مسجلة لهذا الطالب في الفترة الزمنية المحددة.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Approved Submissions */}
                          {activeStudentComputed.approvedSubs.map((sub) => (
                            <div
                              key={sub.id}
                              className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 flex flex-wrap items-center justify-between gap-3"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md">
                                    معتمد ✓
                                  </span>
                                  <h4 className="font-black text-slate-900 text-sm">
                                    {sub.taskTitle || sub.sourceName}
                                  </h4>
                                </div>
                                <p className="text-xs font-bold text-slate-600">
                                  {sub.contentSummary || 'تم تنفيذ التحدي بنجاح.'}
                                </p>
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
                                <span className="text-[10px] font-bold text-slate-400 block">
                                  {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('ar-EG') : 'مؤخراً'}
                                </span>
                              </div>
                            </div>
                          ))}

                          {/* Pending Submissions */}
                          {activeStudentComputed.pendingSubs.map((sub) => (
                            <div
                              key={sub.id}
                              className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 flex flex-wrap items-center justify-between gap-3"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded-md">
                                    قيد المراجعة ⏳
                                  </span>
                                  <h4 className="font-black text-slate-900 text-sm">
                                    {sub.taskTitle || sub.sourceName}
                                  </h4>
                                </div>
                                <p className="text-xs font-bold text-slate-600">
                                  {sub.contentSummary || 'تم إرسال المهمة للمراجعة.'}
                                </p>
                              </div>

                              <div className="text-left space-y-1">
                                <span className="font-black text-sm text-amber-700 bg-amber-100 px-3 py-1 rounded-xl block">
                                  +{sub.rewardXp || 50} XP
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 block">
                                  {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('ar-EG') : 'مؤخراً'}
                                </span>
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
            {/* VIEW 2: SINGLE CLUB REPORT ('club')                      */}
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
                        <span className="text-sm font-black text-amber-300">
                          {activeClub.supervisorName || 'معلمة الحلقة'}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* VIEW 3: ALL CLUBS COMPARISON ('all_clubs')               */}
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
                            cs.student.clubId === cl.id ||
                            cl.members?.some(
                              (m) =>
                                m.id === cs.student.id ||
                                (m.studentCode && cs.student.studentCode && m.studentCode === cs.student.studentCode)
                            ) ||
                            (cs.student.clubName &&
                              cs.student.clubName.trim().toLowerCase() === cl.name.trim().toLowerCase())
                        );
                        const totalApproved = members.reduce((sum, m) => sum + m.completedCount, 0);
                        const totalPoints = members.reduce((sum, m) => sum + (m.student.points || 0), 0);
                        const avgComp =
                          members.length > 0
                            ? Math.round(members.reduce((sum, m) => sum + m.completionRate, 0) / members.length)
                            : 0;

                        return (
                          <div
                            key={cl.id}
                            className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3"
                          >
                            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                              <h4 className="font-black text-slate-900 text-base">{cl.name}</h4>
                              <span className="text-[11px] font-black bg-purple-100 text-purple-800 px-2.5 py-1 rounded-lg">
                                {members.length} عضو
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 font-bold">{cl.description}</p>

                            <div className="grid grid-cols-3 gap-2 text-center text-xs font-black pt-1">
                              <div className="p-2 bg-white rounded-xl border border-slate-200">
                                <span className="text-[10px] text-slate-400 block font-bold">المنجزة</span>
                                <span className="text-emerald-700 text-sm">{totalApproved}</span>
                              </div>
                              <div className="p-2 bg-white rounded-xl border border-slate-200">
                                <span className="text-[10px] text-slate-400 block font-bold">النقاط</span>
                                <span className="text-amber-700 text-sm">{totalPoints} XP</span>
                              </div>
                              <div className="p-2 bg-white rounded-xl border border-slate-200">
                                <span className="text-[10px] text-slate-400 block font-bold">متوسط الإنجاز</span>
                                <span className="text-purple-700 text-sm">{avgComp}%</span>
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

            {/* ======================================================== */}
            {/* TOP ACHIEVERS RANKING WIDGET (for Batch / Class / Club)  */}
            {/* ======================================================== */}
            {targetType !== 'student' && targetType !== 'all_clubs' && rankedStudents.length > 0 && (
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {rankedStudents.slice(0, topAchieversLimit).map((cs, idx) => {
                    const medals = ['🥇 المركز الأول', '🥈 المركز الثاني', '🥉 المركز الثالث'];
                    const rankTitle = medals[idx] || `المركز ${idx + 1}`;

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
              </div>
            )}

            {/* ======================================================== */}
            {/* PRIMARY REPORT DATA TABLE                                */}
            {/* Format: الطالب | الكود | الفصل | النادي | النقاط |      */}
            {/* عدد التحديات | المنجزة | قيد التنفيذ | نسبة الإنجاز    */}
            {/* ======================================================== */}
            {targetType !== 'student' && targetType !== 'all_clubs' && (
              <div className="p-6 rounded-[28px] bg-white border border-[#EEF2F7] shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-600" />
                    <span>
                      جدول أداء وإنجازات الطلاب ({scopedStudents.length} طالب)
                    </span>
                  </h3>

                  {(startDate || endDate) && (
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                      الفترة: {startDate || 'البداية'} إلى {endDate || 'الآن'}
                    </span>
                  )}
                </div>

                {scopedStudents.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs font-bold">
                    لا يوجد طلاب مطابقون للخيارات والبحث المحدد.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-700 font-black border-b border-slate-200">
                          <th className="p-3">الطالب</th>
                          <th className="p-3 text-center">الكود</th>
                          <th className="p-3">الفصل</th>
                          <th className="p-3">النادي</th>
                          <th className="p-3 text-center">النقاط</th>
                          <th className="p-3 text-center">عدد التحديات</th>
                          <th className="p-3 text-center">المنجزة</th>
                          <th className="p-3 text-center">قيد التنفيذ</th>
                          <th className="p-3 text-center">نسبة الإنجاز</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {scopedStudents.map((cs) => (
                          <tr
                            key={cs.student.id}
                            className="hover:bg-slate-50/80 font-bold text-slate-800 transition-colors"
                          >
                            {/* الطالب */}
                            <td className="p-3 font-black text-slate-900 flex items-center gap-2">
                              <img
                                src={
                                  cs.student.avatarUrl ||
                                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60'
                                }
                                alt=""
                                className="w-7 h-7 rounded-xl object-cover border border-slate-200"
                              />
                              <span>{cs.student.name}</span>
                            </td>

                            {/* الكود */}
                            <td className="p-3 text-center text-slate-500 font-mono">
                              {cs.student.studentCode || '—'}
                            </td>

                            {/* الفصل */}
                            <td className="p-3 text-slate-700">{cs.student.className || 'الفصل'}</td>

                            {/* النادي */}
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                  cs.student.clubName && cs.student.clubName !== 'بدون نادي'
                                    ? 'bg-purple-50 text-purple-800 border border-purple-200'
                                    : 'text-slate-400'
                                }`}
                              >
                                {cs.student.clubName || 'بدون نادي'}
                              </span>
                            </td>

                            {/* النقاط */}
                            <td className="p-3 text-center font-black text-amber-700">
                              {cs.student.points || 0} XP
                            </td>

                            {/* عدد التحديات الموجهة */}
                            <td className="p-3 text-center text-slate-600 font-black">
                              {cs.assignedChallengesCount}
                            </td>

                            {/* المنجزة */}
                            <td className="p-3 text-center">
                              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 font-black">
                                {cs.completedCount}
                              </span>
                            </td>

                            {/* قيد التنفيذ */}
                            <td className="p-3 text-center">
                              <span
                                className={`px-2.5 py-1 rounded-lg border font-black ${
                                  cs.pendingCount > 0
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-slate-50 text-slate-400 border-slate-200'
                                }`}
                              >
                                {cs.pendingCount}
                              </span>
                            </td>

                            {/* نسبة الإنجاز */}
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                                  <div
                                    className={`h-full rounded-full ${
                                      cs.completionRate >= 80
                                        ? 'bg-emerald-500'
                                        : cs.completionRate >= 50
                                        ? 'bg-amber-500'
                                        : 'bg-purple-500'
                                    }`}
                                    style={{ width: `${cs.completionRate}%` }}
                                  />
                                </div>
                                <span className="font-black text-slate-900 w-8 text-left">
                                  {cs.completionRate}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
