import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { teacherService } from '../../services/teacherService';
import {
  Batch,
  BatchDashboardStats,
  PendingSubmission,
  BatchAnnouncement,
  BatchStudent,
  BatchClass,
  BatchClub,
  BatchChallenge,
  BatchLibraryItem,
} from '../../types/teacher';
import { BatchSelectionHome } from './BatchSelectionHome';
import { TeacherDashboardHeader, TeacherTab } from './TeacherDashboardHeader';
import { BatchDashboardView } from './BatchDashboardView';
import { BatchStudentsView } from './BatchStudentsView';
import { BatchJourneyAnalyticsView } from './BatchJourneyAnalyticsView';
import { BatchClassesView } from './BatchClassesView';
import { BatchClubsView } from './BatchClubsView';
import { BatchChallengesView } from './BatchChallengesView';
import { BatchLibraryView } from './BatchLibraryView';
import { BatchReportsView } from './BatchReportsView';
import { SystemSettingsView } from './SystemSettingsView';
import {
  AddStudentModal,
  CreateChallengeModal,
  ChallengeTargetAudience,
  AddAnnouncementModal,
  CreateClubModal,
  UploadLibraryModal,
  ReviewSubmissionModal,
  EditStudentModal,
  ImportExcelModal,
  CreateBatchModal,
  EditBatchModal,
  CreateClassModal,
  EditClassModal,
  EditClubModal,
  EditLibraryModal,
  ConfirmDeleteLibraryModal,
} from './ActionModals';
import { CheckCircle2, Sparkles } from 'lucide-react';

export const TeacherDashboard: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [activeTab, setActiveTab] = useState<TeacherTab>('dashboard');

  // Selected Batch Data States
  const [stats, setStats] = useState<BatchDashboardStats | null>(null);
  const [students, setStudents] = useState<BatchStudent[]>([]);
  const [classes, setClasses] = useState<BatchClass[]>([]);
  const [clubs, setClubs] = useState<BatchClub[]>([]);
  const [challenges, setChallenges] = useState<BatchChallenge[]>([]);
  const [library, setLibrary] = useState<BatchLibraryItem[]>([]);
  const [announcements, setAnnouncements] = useState<BatchAnnouncement[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmission[]>([]);

  // Modals visibility states
  const [isCreateBatchOpen, setIsCreateBatchOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<BatchClass | null>(null);

  const [editingClub, setEditingClub] = useState<BatchClub | null>(null);

  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isImportExcelOpen, setIsImportExcelOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<BatchStudent | null>(null);
  const [isCreateChallengeOpen, setIsCreateChallengeOpen] = useState(false);
  const [presetChallengeClubName, setPresetChallengeClubName] = useState<string | null>(null);
  const [isAddAnnouncementOpen, setIsAddAnnouncementOpen] = useState(false);
  const [isCreateClubOpen, setIsCreateClubOpen] = useState(false);
  const [isUploadLibraryOpen, setIsUploadLibraryOpen] = useState(false);
  const [editingLibraryItem, setEditingLibraryItem] = useState<BatchLibraryItem | null>(null);
  const [deletingLibraryItem, setDeletingLibraryItem] = useState<BatchLibraryItem | null>(null);
  const [selectedSubmissionForReview, setSelectedSubmissionForReview] = useState<PendingSubmission | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch All Batches on initial load
  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    const data = await teacherService.getBatches();
    setBatches(data);
  };

  // Fetch Batch specific data when a batch is selected
  useEffect(() => {
    if (!selectedBatch) return;
    loadBatchData(selectedBatch.id);

    const handleUpdate = () => {
      loadBatchData(selectedBatch.id);
    };

    window.addEventListener('rihlat_db_updated', handleUpdate);
    window.addEventListener('rihlat_settings_updated', handleUpdate);
    return () => {
      window.removeEventListener('rihlat_db_updated', handleUpdate);
      window.removeEventListener('rihlat_settings_updated', handleUpdate);
    };
  }, [selectedBatch]);

  const loadBatchData = async (batchId: string) => {
    const [
      batchStats,
      batchStudents,
      batchClasses,
      batchClubs,
      batchChallenges,
      batchLibrary,
      batchAnnouncements,
      batchSubmissions,
    ] = await Promise.all([
      teacherService.getBatchStats(batchId),
      teacherService.getStudentsByBatch(batchId),
      teacherService.getClassesByBatch(batchId),
      teacherService.getClubsByBatch(batchId),
      teacherService.getChallengesByBatch(batchId),
      teacherService.getLibraryByBatch(batchId),
      teacherService.getAnnouncementsByBatch(batchId),
      teacherService.getPendingSubmissions(batchId),
    ]);

    setStats(batchStats);
    setStudents(batchStudents);
    setClasses(batchClasses);
    setClubs(batchClubs);
    setChallenges(batchChallenges);
    setLibrary(batchLibrary);
    setAnnouncements(batchAnnouncements);
    setPendingSubmissions(batchSubmissions);
  };

  // --- BATCH HANDLERS ---
  const handleCreateBatch = async (data: {
    name: string;
    stage: string;
    gender: 'female' | 'male' | 'mixed';
    supervisorName: string;
    code: string;
    description: string;
  }) => {
    const newBatch = await teacherService.createBatch(data);
    showToast(`🌿 تم تأسيس الدفعة الجديدة (${data.name}) بنجاح`);
    loadBatches();
    setSelectedBatch(newBatch);
  };

  const handleEditBatch = async (batchId: string, updates: Partial<Batch>) => {
    await teacherService.updateBatch(batchId, updates);
    showToast(`✨ تم تعديل بيانات الدفعة بنجاح`);
    loadBatches();
    if (selectedBatch?.id === batchId) {
      setSelectedBatch((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    await teacherService.deleteBatch(batchId);
    showToast(`🗑️ تم حذف الدفعة بنجاح`);
    if (selectedBatch?.id === batchId) {
      setSelectedBatch(null);
    }
    loadBatches();
  };

  // --- CLASS HANDLERS ---
  const handleCreateClass = async (data: { name: string; teacherName: string; schedule: string; room: string }) => {
    if (!selectedBatch) return;
    await teacherService.createClass(selectedBatch.id, data);
    showToast(`🏫 تم إضافة الفصل (${data.name}) للدفعة بنجاح`);
    loadBatchData(selectedBatch.id);
    loadBatches();
  };

  const handleEditClass = async (classId: string, updates: Partial<BatchClass>) => {
    if (!selectedBatch) return;
    await teacherService.updateClass(selectedBatch.id, classId, updates);
    showToast(`✨ تم تعديل بيانات الفصل بنجاح`);
    loadBatchData(selectedBatch.id);
  };

  const handleDeleteClass = async (classId: string) => {
    if (!selectedBatch) return;
    await teacherService.deleteClass(selectedBatch.id, classId);
    showToast(`🗑️ تم حذف الفصل بنجاح`);
    loadBatchData(selectedBatch.id);
    loadBatches();
  };

  // --- CLUB HANDLERS ---
  const handleEditClub = async (clubId: string, updates: Partial<BatchClub>) => {
    if (!selectedBatch) return;
    await teacherService.updateClub(selectedBatch.id, clubId, updates);
    showToast(`✨ تم تعديل بيانات النادي بنجاح`);
    loadBatchData(selectedBatch.id);
  };

  const handleDeleteClub = async (clubId: string) => {
    if (!selectedBatch) return;
    try {
      await teacherService.deleteClub(selectedBatch.id, clubId);
      showToast(`🗑️ تم حذف النادي بنجاح`);
      await loadBatchData(selectedBatch.id);
      await loadBatches();
    } catch (err: any) {
      console.error('Failed to delete club:', err);
      showToast(`❌ ${err?.message || 'فشل حذف النادي'}`);
      throw err;
    }
  };

  // --- STUDENT HANDLERS ---
  const handleAddStudent = async (data: { name: string; studentCode?: string; className: string; clubName?: string; levelBadge?: string }) => {
    if (!selectedBatch) return;
    try {
      await teacherService.addStudent(selectedBatch.id, {
        ...data,
        points: 0,
        levelBadge: '🌱 البداية',
        completedTasks: 0,
        completedChallengesCount: 0,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        status: 'active',
      });
      showToast(`✅ تم إضافة الطالب/الطالبة (${data.name}) للدفعة بنجاح`);
      loadBatchData(selectedBatch.id);
      loadBatches();
    } catch (err: any) {
      showToast(`⚠️ ${err.message || 'فشل إضافة الطالب'}`);
    }
  };

  const handleEditStudent = async (studentId: string, updates: Partial<BatchStudent>) => {
    if (!selectedBatch) return;
    await teacherService.updateStudent(selectedBatch.id, studentId, updates);
    showToast(`✨ تم تعديل بيانات الطالب بنجاح`);
    loadBatchData(selectedBatch.id);
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!selectedBatch) return;
    await teacherService.deleteStudent(selectedBatch.id, studentId);
    showToast(`🗑️ تم حذف الطالب بنجاح`);
    loadBatchData(selectedBatch.id);
    loadBatches();
  };

  const handleImportExcel = async (importedList: Array<{ name: string; studentCode?: string; className: string; clubName?: string; points?: number }>) => {
    if (!selectedBatch) return;
    try {
      await teacherService.importStudentsFromExcel(selectedBatch.id, importedList);
      showToast(`📊 تم استيراد ${importedList.length} طلاب إلى الدفعة بنجاح!`);
      loadBatchData(selectedBatch.id);
      loadBatches();
    } catch (err: any) {
      showToast(`⚠️ ${err.message || 'فشل استيراد الطلاب'}`);
    }
  };

  const handleCreateChallenge = async (data: {
    title: string;
    description?: string;
    type: string;
    rewardXp: number;
    dueDate: string;
    targetType: ChallengeTargetAudience;
    targetName?: string;
    targetStudentId?: string;
    targetStudentCode?: string;
  }) => {
    if (!selectedBatch) return;
    try {
      await teacherService.createChallenge(selectedBatch.id, {
        ...data,
        status: 'active',
        participantsCount: 0,
      });
      showToast(`🎉 تم نشر التحدي الجديد (${data.title}) للمستهدفين بنجاح`);
      loadBatchData(selectedBatch.id);
    } catch (err: any) {
      console.error('Failed to create challenge:', err);
      showToast(`❌ ${err?.message || 'فشل نشر التحدي'}`);
      throw err;
    }
  };

  const handleAddAnnouncement = async (data: {
    title: string;
    content: string;
    author: string;
    pinned: boolean;
    targetType: 'student' | 'class' | 'batch' | 'club';
    targetValue: string;
    targetName: string;
  }) => {
    if (!selectedBatch) return;
    await teacherService.addAnnouncement(selectedBatch.id, data);
    showToast(`📩 تم إرسال الرسالة إلى (${data.targetName}) بنجاح`);
    loadBatchData(selectedBatch.id);
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!selectedBatch) return;
    await teacherService.deleteAnnouncement(selectedBatch.id, announcementId);
    showToast(`🗑️ تم حذف الرسالة بنجاح`);
    loadBatchData(selectedBatch.id);
  };

  const handleCreateClub = async (data: {
    name: string;
    supervisorName: string;
    category: string;
    selectedStudentIds?: string[];
  }) => {
    if (!selectedBatch) return;
    const { selectedStudentIds, ...clubDetails } = data;
    try {
      await teacherService.createClub(
        selectedBatch.id,
        {
          ...clubDetails,
          description: `نادي ${data.name} لتنمية المواهب والإبداع بالدفعة`,
          memberCount: 0,
          activeTasksCount: 0,
          members: [],
          tasks: [],
          announcements: [],
        },
        selectedStudentIds || []
      );
      showToast(`✨ تم تأسيس النادي الجديد (${data.name}) بالدفعة`);
      loadBatchData(selectedBatch.id);
      loadBatches();
    } catch (err: any) {
      console.error('Error in handleCreateClub:', err);
      showToast(`❌ فشل إنشاء النادي: ${err?.message || 'خطأ غير معروف'}`);
    }
  };

  const handleUploadLibrary = async (data: {
    title: string;
    description: string;
    fileType: 'pdf' | 'video' | 'audio' | 'image' | 'link' | 'doc';
    url: string;
    thumbnailUrl: string;
    category: string;
    targetType: 'all' | 'batch' | 'club' | 'student';
    targetName?: string;
    targetStudentId?: string;
    targetStudentCode?: string;
    fileSize?: string;
    duration?: string;
  }) => {
    if (!selectedBatch) return;
    await teacherService.uploadLibraryFile(selectedBatch.id, {
      ...data,
      uploadedBy: 'أستاذ الدفعة',
    });
    showToast(`📚 تم إضافة ونشر المورد التعليمي (${data.title}) بنجاح للمكتبة!`);
    loadBatchData(selectedBatch.id);
  };

  const handleEditLibrary = async (itemId: string, updates: Partial<BatchLibraryItem>) => {
    if (!selectedBatch) return;
    await teacherService.updateLibraryFile(selectedBatch.id, itemId, updates);
    showToast(`✨ تم تعديل بيانات المورد التعليمي بنجاح!`);
    loadBatchData(selectedBatch.id);
  };

  const handleDeleteLibrary = async (itemId: string) => {
    if (!selectedBatch) return;
    await teacherService.deleteLibraryFile(selectedBatch.id, itemId);
    showToast(`🗑️ تم حذف المورد التعليمي بنجاح من المكتبة`);
    loadBatchData(selectedBatch.id);
  };

  const handleDeleteChallenge = async (challengeId: string) => {
    if (!selectedBatch) return;
    await teacherService.deleteChallenge(selectedBatch.id, challengeId);
    showToast(`🗑️ تم حذف التحدي بنجاح!`);
    loadBatchData(selectedBatch.id);
  };

  const handleReviewSubmission = async (submissionId: string, status: 'approved' | 'rejected', notes: string) => {
    if (!selectedBatch) return;
    await teacherService.reviewSubmission(selectedBatch.id, submissionId, status, notes);
    if (status === 'approved') {
      showToast(`🎉 تم اعتماد المهمة ومنح الطالب النقاط بنجاح!`);
    } else {
      showToast(`⚠️ تم إعادة المهمة للطالب للتعديل والإفادة.`);
    }
    loadBatchData(selectedBatch.id);
  };

  return (
    <div className="min-h-screen bg-slate-950/40 p-4 sm:p-6 lg:p-8 dir-rtl text-slate-900 font-sans pb-24">
      {/* Toast Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-6 left-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-teal-500/40 flex items-center gap-2.5 text-xs sm:text-sm font-black backdrop-blur-md"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* If no batch selected -> Show Batches Selection Home */}
        {!selectedBatch ? (
          <BatchSelectionHome
            batches={batches}
            onSelectBatch={(batch) => {
              setSelectedBatch(batch);
              setActiveTab('dashboard');
            }}
            onOpenCreateBatch={() => setIsCreateBatchOpen(true)}
            onOpenEditBatch={(b) => setEditingBatch(b)}
            onDeleteBatch={handleDeleteBatch}
            onLogout={onLogout}
          />
        ) : (
          /* When Batch is selected -> Show Batch Workspace Header and Active Tab View */
          <div className="space-y-6">
            <TeacherDashboardHeader
              selectedBatch={selectedBatch}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onSwitchBatch={() => setSelectedBatch(null)}
              onLogout={onLogout}
            />

            {/* Notification Banners for Pending Challenge Submissions */}
            {pendingSubmissions.filter((s) => (s.sourceType === 'challenge' || !s.achievementId) && s.status === 'pending').map((sub) => (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white p-3.5 rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-black border border-amber-400/50"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" />
                  <span>📩 {sub.studentName} أرسل إنجاز تحدي: {sub.taskTitle} ({sub.className})</span>
                </div>
                <button
                  onClick={() => setActiveTab('challenges')}
                  className="px-4 py-1.5 bg-white text-amber-950 rounded-xl text-xs font-black shadow-sm hover:bg-amber-50 cursor-pointer transition-all"
                >
                  مراجعة التحدي 👈
                </button>
              </motion.div>
            ))}

            {/* Render Active Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'dashboard' && stats && (
                  <BatchDashboardView
                    batch={selectedBatch}
                    stats={stats}
                    pendingSubmissions={pendingSubmissions}
                    announcements={announcements}
                    onOpenAddStudent={() => setIsAddStudentOpen(true)}
                    onOpenCreateClass={() => setIsCreateClassOpen(true)}
                    onOpenCreateChallenge={() => setIsCreateChallengeOpen(true)}
                    onOpenAddAnnouncement={() => setIsAddAnnouncementOpen(true)}
                    onOpenCreateClub={() => setIsCreateClubOpen(true)}
                    onOpenUploadLibrary={() => setIsUploadLibraryOpen(true)}
                    onDeleteAnnouncement={handleDeleteAnnouncement}
                    onReviewSubmission={(sub) => setSelectedSubmissionForReview(sub)}
                    onQuickApprove={(id) => handleReviewSubmission(id, 'approved', 'ممتاز وأحسنت!')}
                    onQuickReject={(id) => handleReviewSubmission(id, 'rejected', 'يرجى مراجعة التمارين')}
                  />
                )}

                {activeTab === 'students' && (
                  <BatchStudentsView
                    batch={selectedBatch}
                    students={students}
                    onOpenAddStudent={() => setIsAddStudentOpen(true)}
                    onOpenImportExcel={() => setIsImportExcelOpen(true)}
                    onOpenEditStudent={(std) => setEditingStudent(std)}
                  />
                )}

                {activeTab === 'journey-analytics' && (
                  <BatchJourneyAnalyticsView
                    batch={selectedBatch}
                    students={students}
                  />
                )}

                {activeTab === 'classes' && (
                  <BatchClassesView
                    batch={selectedBatch}
                    classes={classes}
                    students={students}
                    onOpenCreateClass={() => setIsCreateClassOpen(true)}
                    onOpenEditClass={(cls) => setEditingClass(cls)}
                    onDeleteClass={handleDeleteClass}
                    onDeleteStudent={handleDeleteStudent}
                    onStudentUpdated={() => loadBatchData(selectedBatch.id)}
                  />
                )}

                {activeTab === 'clubs' && (
                  <BatchClubsView
                    batch={selectedBatch}
                    clubs={clubs}
                    challenges={challenges}
                    submissions={pendingSubmissions}
                    students={students}
                    onOpenCreateClub={() => {
                      setPresetChallengeClubName(null);
                      setIsCreateClubOpen(true);
                    }}
                    onOpenEditClub={(c) => setEditingClub(c)}
                    onOpenCreateChallengeForClub={(clubName) => {
                      setPresetChallengeClubName(clubName);
                      setIsCreateChallengeOpen(true);
                    }}
                    onAddMemberToClub={async (clubId, studentId) => {
                      if (!selectedBatch) return;
                      try {
                        await teacherService.addClubMember(selectedBatch.id, clubId, studentId);
                        showToast('🎉 تم إضافة الطالبة للنادي بنجاح');
                        await loadBatchData(selectedBatch.id);
                      } catch (err: any) {
                        console.error('Failed to add member to club:', err);
                        showToast(`❌ ${err?.message || 'فشل إضافة الطالبة للنادي'}`);
                      }
                    }}
                    onRemoveMemberFromClub={async (clubId, studentId) => {
                      if (!selectedBatch) return;
                      try {
                        await teacherService.removeClubMember(selectedBatch.id, clubId, studentId);
                        showToast('🗑️ تم إزالة الطالبة من النادي بنجاح');
                        await loadBatchData(selectedBatch.id);
                      } catch (err: any) {
                        console.error('Failed to remove member from club:', err);
                        showToast(`❌ ${err?.message || 'فشل إزالة الطالبة من النادي'}`);
                      }
                    }}
                    onDeleteClub={handleDeleteClub}
                  />
                )}

                {activeTab === 'challenges' && (
                  <BatchChallengesView
                    batch={selectedBatch}
                    challenges={challenges}
                    pendingSubmissions={pendingSubmissions}
                    onOpenCreateChallenge={() => setIsCreateChallengeOpen(true)}
                    onReviewSubmission={handleReviewSubmission}
                    onDeleteChallenge={handleDeleteChallenge}
                  />
                )}

                {activeTab === 'library' && (
                  <BatchLibraryView
                    batch={selectedBatch}
                    items={library}
                    onOpenUploadLibrary={() => setIsUploadLibraryOpen(true)}
                    onOpenEditLibrary={(item) => setEditingLibraryItem(item)}
                    onOpenDeleteLibrary={(item) => setDeletingLibraryItem(item)}
                  />
                )}

                {activeTab === 'reports' && <BatchReportsView batch={selectedBatch} batches={batches} />}

                {activeTab === 'settings' && <SystemSettingsView />}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* --- ALL REUSABLE CRUD ACTION MODALS --- */}
      <CreateBatchModal
        isOpen={isCreateBatchOpen}
        onClose={() => setIsCreateBatchOpen(false)}
        onSubmit={handleCreateBatch}
      />

      <EditBatchModal
        isOpen={Boolean(editingBatch)}
        batch={editingBatch}
        onClose={() => setEditingBatch(null)}
        onSubmit={handleEditBatch}
        onDelete={handleDeleteBatch}
      />

      <CreateClassModal
        isOpen={isCreateClassOpen}
        onClose={() => setIsCreateClassOpen(false)}
        onSubmit={handleCreateClass}
      />

      <EditClassModal
        isOpen={Boolean(editingClass)}
        batchClass={editingClass}
        onClose={() => setEditingClass(null)}
        onSubmit={handleEditClass}
        onDelete={handleDeleteClass}
      />

      <EditClubModal
        isOpen={Boolean(editingClub)}
        club={editingClub}
        onClose={() => setEditingClub(null)}
        onSubmit={handleEditClub}
        onDelete={handleDeleteClub}
      />

      <AddStudentModal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        onSubmit={handleAddStudent}
        onImportExcel={handleImportExcel}
        classesList={classes.map((c) => c.name)}
        clubsList={clubs.map((c) => c.name)}
        initialMode="manual"
      />

      <CreateChallengeModal
        isOpen={isCreateChallengeOpen}
        onClose={() => {
          setIsCreateChallengeOpen(false);
          setPresetChallengeClubName(null);
        }}
        onSubmit={handleCreateChallenge}
        classesList={classes.map((c) => c.name)}
        clubsList={clubs.map((c) => ({ id: c.id, name: c.name }))}
        studentsList={students.map((s) => ({
          id: s.id,
          name: s.name,
          studentCode: s.studentCode,
          className: s.className,
        }))}
        initialTargetType={presetChallengeClubName ? 'club' : undefined}
        initialTargetName={presetChallengeClubName || undefined}
      />

      <AddAnnouncementModal
        isOpen={isAddAnnouncementOpen}
        onClose={() => setIsAddAnnouncementOpen(false)}
        onSubmit={handleAddAnnouncement}
        batchesList={batches.map((b) => ({ id: b.id, name: b.name }))}
        classesList={classes.map((c) => c.name)}
        clubsList={clubs.map((c) => c.name)}
        studentsList={students.map((s) => ({
          id: s.id,
          name: s.name,
          studentCode: s.studentCode,
          className: s.className,
        }))}
        currentBatchId={selectedBatch?.id}
        currentBatchName={selectedBatch?.name}
      />

      <CreateClubModal
        isOpen={isCreateClubOpen}
        onClose={() => setIsCreateClubOpen(false)}
        onSubmit={handleCreateClub}
        classes={classes}
        students={students}
      />

      <UploadLibraryModal
        isOpen={isUploadLibraryOpen}
        onClose={() => setIsUploadLibraryOpen(false)}
        onSubmit={handleUploadLibrary}
        currentBatchName={selectedBatch?.name}
        batchesList={batches.map((b) => ({ id: b.id, name: b.name }))}
        clubsList={clubs.map((c) => c.name)}
        studentsList={students.map((s) => ({
          id: s.id,
          name: s.name,
          studentCode: s.studentCode,
          className: s.className,
        }))}
      />

      <ReviewSubmissionModal
        submission={selectedSubmissionForReview}
        onClose={() => setSelectedSubmissionForReview(null)}
        onReview={handleReviewSubmission}
      />

      <EditStudentModal
        isOpen={Boolean(editingStudent)}
        student={editingStudent}
        onClose={() => setEditingStudent(null)}
        onSubmit={handleEditStudent}
        onDelete={handleDeleteStudent}
        classesList={classes.map((c) => c.name)}
        clubsList={clubs.map((c) => c.name)}
      />

      <ImportExcelModal
        isOpen={isImportExcelOpen}
        onClose={() => setIsImportExcelOpen(false)}
        onImport={handleImportExcel}
        classesList={classes.map((c) => c.name)}
        clubsList={clubs.map((c) => c.name)}
      />

      <EditLibraryModal
        isOpen={Boolean(editingLibraryItem)}
        item={editingLibraryItem}
        onClose={() => setEditingLibraryItem(null)}
        onSubmit={handleEditLibrary}
        onDelete={(itemId) => {
          handleDeleteLibrary(itemId);
          setEditingLibraryItem(null);
        }}
        currentBatchName={selectedBatch?.name}
        clubsList={clubs.map((c) => c.name)}
      />

      <ConfirmDeleteLibraryModal
        isOpen={Boolean(deletingLibraryItem)}
        item={deletingLibraryItem}
        onClose={() => setDeletingLibraryItem(null)}
        onConfirm={handleDeleteLibrary}
      />
    </div>
  );
};
