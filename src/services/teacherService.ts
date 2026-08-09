import {
  Batch,
  BatchStudent,
  BatchClass,
  BatchClub,
  ClubMember,
  BatchChallenge,
  BatchLibraryItem,
  StudentLibraryQuery,
  PendingSubmission,
  BatchAnnouncement,
  BatchDashboardStats,
  Achievement,
  StudentUnlockedAchievement,
} from '../types/teacher';
import { calculateStudentJourney } from './journeyEngine';

// Seed Initial Achievements (Empty by default - created strictly by teacher)
const achievementsStore: Achievement[] = [];

const unlockedAchievementsStore: Record<string, StudentUnlockedAchievement[]> = {};

const initialBatches: Batch[] = [];

// Seed Students per Batch
const initialStudents: Record<string, BatchStudent[]> = {};

// Seed Classes
const initialClasses: Record<string, BatchClass[]> = {};

// Seed Clubs
const initialClubs: Record<string, BatchClub[]> = {};

// Seed Challenges
const initialChallenges: Record<string, BatchChallenge[]> = {};

// Seed Library Items
const initialLibrary: Record<string, BatchLibraryItem[]> = {
  'batch-g6-f': [
    {
      id: 'lib-1',
      title: 'دليل التلاوة الخاشعة وأحكام التجويد 📖',
      description: 'دليل شامل ومصوّر لأهم أحكام النون الساكنة والتنوين مع أمثلة من القرآن الكريم.',
      fileType: 'pdf',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileSize: '2.4 MB',
      targetType: 'all',
      uploadedAt: '2026-08-01',
      category: 'تجويد وقراءات',
      thumbnailUrl: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&q=80&w=600',
    },
    {
      id: 'lib-2',
      title: 'كيف تعد بودكاست دعوي ناجح؟ 🎬',
      description: 'مقطع فيديو تعليمي يشرح أساسيات كتابة السكريبت والتسجيل الصوتي المؤثر.',
      fileType: 'video',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      fileSize: '14.8 MB',
      targetType: 'all',
      uploadedAt: '2026-08-02',
      category: 'إعلام وبودكاست',
      thumbnailUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&q=80&w=600',
    },
    {
      id: 'lib-3',
      title: 'تسجيل تلاوة نموذجية لسورة الملك 🎧',
      description: 'تلاوة خاشعة بالترتيل للمتابعة والتكرار مع القارئ الشيخ.',
      fileType: 'audio',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      fileSize: '5.1 MB',
      targetType: 'all',
      uploadedAt: '2026-08-03',
      category: 'تلاوات خاشعة',
      thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=600',
    },
    {
      id: 'lib-4',
      title: 'إنفوجرافيك: صفات الداعية الصغير 🖼️',
      description: 'تصميم بصرِي متكامل يوضح القيم الخمس الأساسية للطالب القدوة.',
      fileType: 'image',
      url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=1000',
      fileSize: '1.2 MB',
      targetType: 'all',
      uploadedAt: '2026-08-04',
      category: 'قيم وأخلاق',
      thumbnailUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=600',
    },
    {
      id: 'lib-5',
      title: 'مجمع الملك فهد لطباعة المصحف الشريف 🔗',
      description: 'رابط مباشر لتحميل مصحف المدينة النبوية وتطبيقات القرآن الكريم الرسمية.',
      fileType: 'link',
      url: 'https://qurancomplex.gov.sa',
      fileSize: 'رابط خارجي',
      targetType: 'all',
      uploadedAt: '2026-08-05',
      category: 'مصادر موثوقة',
      thumbnailUrl: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=600',
    }
  ]
};

// Seed Announcements per Batch
const initialAnnouncements: Record<string, BatchAnnouncement[]> = {};

// Seed Pending Submissions per Batch
const initialSubmissions: Record<string, PendingSubmission[]> = {};

// In-Memory Mutated Storage
let batchesStore = [...initialBatches];
let studentsStore = { ...initialStudents };
let classesStore = { ...initialClasses };
let clubsStore = { ...initialClubs };
let challengesStore = { ...initialChallenges };
let libraryStore = { ...initialLibrary };
let announcementsStore = { ...initialAnnouncements };
let submissionsStore = { ...initialSubmissions };

const TEACHER_DB_STORAGE_KEY = 'rihlat_teacher_db_v3';

function saveDbToLocalStorage() {
  try {
    const dbData = {
      batchesStore,
      studentsStore,
      classesStore,
      clubsStore,
      challengesStore,
      libraryStore,
      announcementsStore,
      submissionsStore,
      achievementsStore,
      unlockedAchievementsStore,
    };
    localStorage.setItem(TEACHER_DB_STORAGE_KEY, JSON.stringify(dbData));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rihlat_db_updated'));
      window.dispatchEvent(new Event('storage'));
    }
  } catch (err) {
    console.error('Failed to save teacher db to localStorage:', err);
  }
}

function loadDbFromLocalStorage() {
  try {
    // Clear old legacy storage keys if present
    ['rihlat_teacher_db_v2', 'rihlat_teacher_db_v1', 'rihlat_achievements_v1'].forEach((oldKey) => {
      try { localStorage.removeItem(oldKey); } catch (_) {}
    });

    const raw = localStorage.getItem(TEACHER_DB_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.batchesStore) batchesStore = parsed.batchesStore;
      if (parsed.studentsStore) studentsStore = parsed.studentsStore;
      if (parsed.classesStore) classesStore = parsed.classesStore;
      if (parsed.clubsStore) clubsStore = parsed.clubsStore;
      if (parsed.challengesStore) challengesStore = parsed.challengesStore;
      if (parsed.libraryStore) libraryStore = parsed.libraryStore;
      if (parsed.announcementsStore) announcementsStore = parsed.announcementsStore;
      if (parsed.submissionsStore) submissionsStore = parsed.submissionsStore;
      
      achievementsStore.length = 0;
      if (Array.isArray(parsed.achievementsStore)) {
        // Strip any legacy mock achievements (e.g. ach-1 through ach-6)
        const userCreatedAchievements = parsed.achievementsStore.filter(
          (a: any) => a && a.id && !['ach-1', 'ach-2', 'ach-3', 'ach-4', 'ach-5', 'ach-6'].includes(a.id)
        );
        achievementsStore.push(...userCreatedAchievements);
      }

      Object.keys(unlockedAchievementsStore).forEach((k) => delete unlockedAchievementsStore[k]);
      if (parsed.unlockedAchievementsStore) {
        Object.entries(parsed.unlockedAchievementsStore).forEach(([studentId, list]: [string, any]) => {
          if (Array.isArray(list)) {
            const validList = list.filter(
              (u: any) => u && u.achievementId && !['ach-1', 'ach-2', 'ach-3', 'ach-4', 'ach-5', 'ach-6'].includes(u.achievementId)
            );
            if (validList.length > 0) {
              unlockedAchievementsStore[studentId] = validList;
            }
          }
        });
      }
    }

    if (batchesStore.length === 0) {
      const defaultBatchId = 'batch-g6-f';
      batchesStore = [
        {
          id: defaultBatchId,
          name: 'دفعة طالبات الهدى - الصف السادس',
          gender: 'female',
          studentCount: 4,
          classCount: 2,
          clubCount: 2,
          createdAt: '2026-08-01',
          code: 'BTC-6F',
          stage: 'الصف السادس',
          description: 'دفعة عامة لتدبر وحفظ القرآن الكريم',
          supervisorName: 'أ. هدى الزهراني',
          colorGradient: 'from-rose-500/20 via-teal-500/20 to-emerald-500/20',
        },
      ];
      classesStore[defaultBatchId] = [
        {
          id: 'class-1',
          batchId: defaultBatchId,
          name: 'الفصل E',
          teacherName: 'أ. هدى الزهراني',
          schedule: 'الأحد والثلاثاء - 4 عصراً',
          room: 'قاعة 1',
          studentCount: 2,
          avgPoints: 0,
          challengeCompletionRate: 100,
          studentNames: ['مريم خليل الزهراني', 'هند سليمان المطيري'],
        },
        {
          id: 'class-2',
          batchId: defaultBatchId,
          name: 'الفصل F',
          teacherName: 'أ. هدى الزهراني',
          schedule: 'الإثنين والأربعاء - 4 عصراً',
          room: 'قاعة 2',
          studentCount: 2,
          avgPoints: 0,
          challengeCompletionRate: 100,
          studentNames: ['ندى عبد الرحمن القحطاني', 'أبرار محمد العتيبي'],
        },
      ];
      studentsStore[defaultBatchId] = [
        {
          id: 'std-1',
          batchId: defaultBatchId,
          name: 'مريم خليل الزهراني',
          studentCode: 'STU-101',
          className: 'الفصل E',
          clubName: 'نادي التلاوة الخاشعة',
          levelBadge: '🌱 البداية',
          points: 0,
          completedTasks: 0,
          completedChallengesCount: 0,
          attendanceRate: 100,
          status: 'active',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        },
        {
          id: 'std-2',
          batchId: defaultBatchId,
          name: 'هند سليمان المطيري',
          studentCode: 'STU-102',
          className: 'الفصل E',
          clubName: 'نادي الإعلام والدعوة',
          levelBadge: '🌱 البداية',
          points: 0,
          completedTasks: 0,
          completedChallengesCount: 0,
          attendanceRate: 95,
          status: 'active',
          avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
        },
        {
          id: 'std-3',
          batchId: defaultBatchId,
          name: 'ندى عبد الرحمن القحطاني',
          studentCode: 'STU-103',
          className: 'الفصل F',
          clubName: 'بدون نادي',
          levelBadge: '🌱 البداية',
          points: 0,
          completedTasks: 0,
          completedChallengesCount: 0,
          attendanceRate: 90,
          status: 'active',
          avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
        },
        {
          id: 'std-4',
          batchId: defaultBatchId,
          name: 'أبرار محمد العتيبي',
          studentCode: 'STU-104',
          className: 'الفصل F',
          clubName: 'بدون نادي',
          levelBadge: '🌱 البداية',
          points: 0,
          completedTasks: 0,
          completedChallengesCount: 0,
          attendanceRate: 85,
          status: 'active',
          avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=200',
        },
      ];
      saveDbToLocalStorage();
    }
  } catch (err) {
    console.warn('Failed to load teacher db from localStorage:', err);
  }
}

// Load on initialization
loadDbFromLocalStorage();

if (typeof window !== 'undefined') {
  window.addEventListener('storage', () => {
    loadDbFromLocalStorage();
  });
  window.addEventListener('rihlat_db_updated', () => {
    loadDbFromLocalStorage();
  });
}

export function computeDynamicLevelBadge(student: BatchStudent): string {
  const currentPoints = student.points || 0;
  const stAny = student as any;
  const journeyRes = calculateStudentJourney({
    id: student.id,
    name: student.name,
    studentCode: student.studentCode,
    xp: currentPoints,
    points: currentPoints,
    completedChallengesCount: student.completedChallengesCount ?? 0,
    approvedAchievementsCount: stAny.approvedAchievementsCount || 0,
    clubTasksCompleted: student.completedTasks || 0,
    clubAnnouncementsCount: 0,
    attendanceRate: student.attendanceRate || 0,
    teacherEvaluationsCount: stAny.evaluationsCount || 0,
    libraryViewsCount: 0,
    specialRewardsCount: 0,
    badgesEarnedCount: stAny.badgesEarnedCount || 0,
    avatarUrl: student.avatarUrl,
  });
  return journeyRes.currentStation?.title || '🌱 البداية';
}

function computeBatchClubs(batchId: string): BatchClub[] {
  const students = studentsStore[batchId] || [];
  let clubs = [...(clubsStore[batchId] || [])];

  // Auto-discover any club assigned to students that isn't explicitly in clubsStore yet
  const existingNames = new Set(clubs.map((c) => c.name.trim().toLowerCase()));
  students.forEach((s) => {
    if (s.clubName && s.clubName !== 'بدون نادي' && s.clubName.trim()) {
      const normalized = s.clubName.trim().toLowerCase();
      if (!existingNames.has(normalized)) {
        existingNames.add(normalized);
        clubs.push({
          id: `club-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          batchId,
          name: s.clubName.trim(),
          description: `نادي ${s.clubName.trim()} للدفعة.`,
          supervisorName: 'معلمة الحلقة',
          memberCount: 0,
          activeTasksCount: 0,
          category: 'نادي النشاط الطلابي',
          members: [],
          tasks: [],
          announcements: [],
          achievements: [],
        });
      }
    }
  });

  const batchChallenges = challengesStore[batchId] || [];

  const computedClubs = clubs.map((club) => {
    const clubStudents = students.filter(
      (s) => s.clubName && s.clubName !== 'بدون نادي' && s.clubName.trim().toLowerCase() === club.name.trim().toLowerCase()
    );

    const members: ClubMember[] = clubStudents.map((s) => ({
      id: s.id,
      name: s.name,
      className: s.className,
      avatarUrl: s.avatarUrl,
      studentCode: s.studentCode,
      points: s.points,
      levelBadge: computeDynamicLevelBadge(s),
    }));

    const activeClubChallenges = batchChallenges.filter(
      (ch) => ch.targetType === 'club' && ch.targetName && ch.targetName.trim().toLowerCase() === club.name.trim().toLowerCase()
    );

    return {
      ...club,
      members,
      memberCount: members.length,
      activeTasksCount: activeClubChallenges.length,
    };
  });

  clubsStore[batchId] = computedClubs;
  return computedClubs;
}

/**
 * Calculate the exact completed challenges count for a student based on real challenge records and approved submissions.
 */
export function calculateStudentCompletedChallengesCount(
  student: { id: string; studentCode?: string; name: string },
  batchId: string,
  batchChallenges: BatchChallenge[],
  allSubmissions: PendingSubmission[]
): number {
  if (!batchChallenges) batchChallenges = [];
  if (!allSubmissions) allSubmissions = [];

  const studentSubs = allSubmissions.filter(
    (s) =>
      s.status === 'approved' &&
      (s.studentId === student.id ||
        (s.studentCode && student.studentCode && s.studentCode.trim().toLowerCase() === student.studentCode.trim().toLowerCase()) ||
        (s.studentName && student.name && s.studentName.trim().toLowerCase() === student.name.trim().toLowerCase()))
  );

  const completedFromList = batchChallenges.filter((ch) => {
    return studentSubs.some(
      (s) =>
        s.taskTitle === ch.title ||
        s.sourceName === ch.title ||
        (s as any).challengeId === ch.id ||
        (s as any).achievementId === ch.id
    );
  }).length;

  const matchedSubIds = new Set<string>();
  batchChallenges.forEach((ch) => {
    studentSubs.forEach((s) => {
      if (
        s.taskTitle === ch.title ||
        s.sourceName === ch.title ||
        (s as any).challengeId === ch.id ||
        (s as any).achievementId === ch.id
      ) {
        matchedSubIds.add(s.id);
      }
    });
  });

  const unmatchedChallengeSubs = studentSubs.filter(
    (s) =>
      !matchedSubIds.has(s.id) &&
      (s.sourceType === 'challenge' || (!s.sourceType && !s.achievementId && s.sourceType !== 'club'))
  ).length;

  return completedFromList + unmatchedChallengeSubs;
}

export const teacherService = {
  /**
   * Save DB state helper
   */
  saveDb() {
    saveDbToLocalStorage();
  },

  /**
   * Get all students created across all batches
   */
  async getAllStudentsAcrossBatches(): Promise<Array<BatchStudent & { batchName?: string }>> {
    loadDbFromLocalStorage();
    const result: Array<BatchStudent & { batchName?: string }> = [];
    Object.keys(studentsStore).forEach((batchId) => {
      const batch = batchesStore.find((b) => b.id === batchId);
      (studentsStore[batchId] || []).forEach((st) => {
        result.push({
          ...st,
          levelBadge: computeDynamicLevelBadge(st),
          batchName: batch?.name || 'الدفعة العامة',
        });
      });
    });
    return result;
  },

  /**
   * Get student and batch info by Student Code
   */
  async getStudentByCode(studentCode: string): Promise<{ student: BatchStudent; batch: Batch } | null> {
    loadDbFromLocalStorage();
    const cleanCode = studentCode.trim().toLowerCase();
    for (const batchId of Object.keys(studentsStore)) {
      const list = studentsStore[batchId] || [];
      const found = list.find((s) => s.studentCode && s.studentCode.trim().toLowerCase() === cleanCode);
      if (found) {
        const batch: Batch = batchesStore.find((b) => b.id === batchId) || {
          id: batchId,
          name: 'الدفعة العامة',
          gender: 'female',
          studentCount: list.length,
          classCount: 1,
          clubCount: 1,
          createdAt: '2026-08-01',
          code: 'BTC-100',
          stage: 'عامة',
          description: 'دفعة عامة',
          supervisorName: 'المشرفة العامة',
          colorGradient: 'from-rose-500/20 via-teal-500/20 to-emerald-500/20',
        };
        const updatedStudent = { ...found, levelBadge: computeDynamicLevelBadge(found) };
        return { student: updatedStudent, batch };
      }
    }
    return null;
  },

  /**
   * Get full student context for Student App
   */
  async getStudentFullContext(studentId: string) {
    loadDbFromLocalStorage();
    const cleanId = studentId ? studentId.trim().toLowerCase() : '';
    for (const batchId of Object.keys(studentsStore)) {
      const list = studentsStore[batchId] || [];
      const student = list.find(
        (s) =>
          s.id === studentId ||
          (s.studentCode && s.studentCode.trim().toLowerCase() === cleanId) ||
          (s.name && s.name.trim().toLowerCase() === cleanId)
      );
      if (student) {
        const allSubs = Object.values(submissionsStore).flat();
        const challenges = await this.getChallengesForStudent(student, batchId);
        const finalCompletedCount = calculateStudentCompletedChallengesCount(
          student,
          batchId,
          challenges,
          allSubs
        );

        if (student.completedChallengesCount !== finalCompletedCount) {
          student.completedChallengesCount = finalCompletedCount;
          saveDbToLocalStorage();
        }

        const updatedStudent = {
          ...student,
          completedChallengesCount: finalCompletedCount,
          levelBadge: computeDynamicLevelBadge({ ...student, completedChallengesCount: finalCompletedCount }),
        };
        console.log('[DEBUG 3] Student object immediately after loading:', updatedStudent);
        const batch: Batch = batchesStore.find((b) => b.id === batchId) || {
          id: batchId,
          name: 'الدفعة العامة',
          gender: 'female',
          studentCount: list.length,
          classCount: 1,
          clubCount: 1,
          createdAt: '2026-08-01',
          code: 'BTC-100',
          stage: 'عامة',
          description: 'دفعة عامة',
          supervisorName: 'المشرفة العامة',
          colorGradient: 'from-rose-500/20 via-teal-500/20 to-emerald-500/20',
        };
        const classes = classesStore[batchId] || [];
        const classItem = classes.find((c) => c.name === updatedStudent.className) || null;
        const clubs = clubsStore[batchId] || [];
        const clubItem = clubs.find((c) => c.name === updatedStudent.clubName) || null;
        const library = await this.getLibraryByBatch(batchId);
        const announcements = this.getMessagesForStudent(updatedStudent, batchId);
        const submissions = submissionsStore[batchId] || [];
        const unlockedAch = unlockedAchievementsStore[updatedStudent.id] || [];
        const allBatchStudents = list.map((s) => ({ ...s, levelBadge: computeDynamicLevelBadge(s) }));

        return {
          student: updatedStudent,
          batch,
          classItem,
          clubItem,
          challenges,
          library,
          announcements,
          submissions,
          unlockedAch,
          allBatchStudents,
        };
      }
    }
    return null;
  },

  /**
   * Get batch station settings synchronously
   */
  getBatchStationsSync(batchId?: string) {
    if (!batchId) return undefined;
    loadDbFromLocalStorage();
    const batch = batchesStore.find((b) => b.id === batchId);
    return batch?.stations;
  },

  /**
   * Fetch all Batches
   */
  async getBatches(): Promise<Batch[]> {
    loadDbFromLocalStorage();
    batchesStore.forEach((batch) => {
      const students = studentsStore[batch.id] || [];
      const classes = classesStore[batch.id] || [];
      const clubs = computeBatchClubs(batch.id);

      batch.studentCount = students.length;
      batch.classCount = classes.length;
      batch.clubCount = clubs.length;
    });
    saveDbToLocalStorage();
    return batchesStore;
  },

  /**
   * Get single batch info
   */
  async getBatchById(batchId: string): Promise<Batch | null> {
    loadDbFromLocalStorage();
    const batch = batchesStore.find((b) => b.id === batchId);
    if (batch) {
      const students = studentsStore[batch.id] || [];
      const classes = classesStore[batch.id] || [];
      const clubs = computeBatchClubs(batch.id);

      batch.studentCount = students.length;
      batch.classCount = classes.length;
      batch.clubCount = clubs.length;
      return batch;
    }
    return null;
  },

  /**
   * Fetch stats for selected batch
   */
  async getBatchStats(batchId: string): Promise<BatchDashboardStats> {
    loadDbFromLocalStorage();
    const students = studentsStore[batchId] || [];
    const classes = classesStore[batchId] || [];
    const challenges = (challengesStore[batchId] || []).filter((c) => c.status === 'active');
    const pendingSubs = (submissionsStore[batchId] || []).filter((s) => s.status === 'pending');
    const clubs = clubsStore[batchId] || [];
    const announcements = announcementsStore[batchId] || [];

    return {
      totalStudents: students.length,
      totalClasses: classes.length,
      activeChallenges: challenges.length,
      pendingReviews: pendingSubs.length,
      activeClubs: clubs.length,
      totalAnnouncements: announcements.length,
    };
  },

  /**
   * Fetch students of selected batch
   */
  async getStudentsByBatch(batchId: string): Promise<BatchStudent[]> {
    loadDbFromLocalStorage();
    const list = studentsStore[batchId] || [];
    const allSubs = Object.values(submissionsStore).flat();
    const batchChallenges = challengesStore[batchId] || [];

    let updated = false;
    const result = list.map((s) => {
      const studentChallenges = batchChallenges.filter((ch) =>
        this.isStudentInChallengeAudience(ch, s, batchId)
      );
      const actualCount = calculateStudentCompletedChallengesCount(
        s,
        batchId,
        studentChallenges,
        allSubs
      );
      if (s.completedChallengesCount !== actualCount) {
        s.completedChallengesCount = actualCount;
        updated = true;
      }
      return {
        ...s,
        completedChallengesCount: actualCount,
        levelBadge: computeDynamicLevelBadge({ ...s, completedChallengesCount: actualCount }),
      };
    });

    if (updated) {
      saveDbToLocalStorage();
    }
    return result;
  },

  /**
   * Add a new student to selected batch
   */
  async addStudent(batchId: string, student: Omit<BatchStudent, 'id' | 'batchId'>): Promise<BatchStudent> {
    loadDbFromLocalStorage();
    const newStudent: BatchStudent = {
      ...student,
      id: `std-${Date.now()}`,
      batchId,
      levelBadge: '🌱 البداية',
      points: 0,
      completedTasks: 0,
      completedChallengesCount: 0,
      attendanceRate: 0,
      status: 'active',
    };
    console.log('[DEBUG 1] Student object immediately after creation:', newStudent);

    if (!studentsStore[batchId]) studentsStore[batchId] = [];
    studentsStore[batchId].push(newStudent);

    // Update batch student count
    const batch = batchesStore.find((b) => b.id === batchId);
    if (batch) batch.studentCount += 1;

    // Sync student list into matching class
    const classes = classesStore[batchId] || [];
    classes.forEach((cls) => {
      cls.studentNames = (studentsStore[batchId] || [])
        .filter((s) => s.className === cls.name)
        .map((s) => s.name);
      cls.studentCount = cls.studentNames.length;
    });

    saveDbToLocalStorage();
    console.log('[DEBUG 2] Student object immediately after saving:', newStudent);
    return newStudent;
  },

  /**
   * Update an existing student in batch
   */
  async updateStudent(
    batchId: string,
    studentId: string,
    updates: Partial<Omit<BatchStudent, 'id' | 'batchId'>>
  ): Promise<BatchStudent> {
    loadDbFromLocalStorage();
    let targetBatchId = batchId;
    let list = studentsStore[targetBatchId] || [];
    let index = list.findIndex((s) => s.id === studentId);

    if (index === -1) {
      // Fallback search across all batches
      for (const bId of Object.keys(studentsStore)) {
        const bList = studentsStore[bId] || [];
        const idx = bList.findIndex((s) => s.id === studentId);
        if (idx !== -1) {
          targetBatchId = bId;
          list = bList;
          index = idx;
          break;
        }
      }
    }

    if (index === -1) throw new Error('Student not found');

    const updated = {
      ...list[index],
      ...updates,
    };

    // Ensure points is never negative
    if (typeof updated.points === 'number') {
      updated.points = Math.max(0, updated.points);
    }

    // Automatically recalculate levelBadge based on new points and metrics
    const currentPoints = updated.points || 0;
    const stAny = updated as any;
    const journeyRes = calculateStudentJourney({
      id: updated.id,
      name: updated.name,
      studentCode: updated.studentCode,
      batchId: targetBatchId,
      className: updated.className,
      clubName: updated.clubName,
      xp: currentPoints,
      points: currentPoints,
      completedChallengesCount: updated.completedChallengesCount ?? 0,
      approvedAchievementsCount: stAny.approvedAchievementsCount || 0,
      clubTasksCompleted: updated.completedTasks || 0,
      clubAnnouncementsCount: 0,
      attendanceRate: updated.attendanceRate || 0,
      teacherEvaluationsCount: stAny.evaluationsCount || 0,
      libraryViewsCount: 0,
      specialRewardsCount: 0,
      badgesEarnedCount: stAny.badgesEarnedCount || 0,
      avatarUrl: updated.avatarUrl,
    });
    updated.levelBadge = journeyRes.currentStation?.title || '🌱 البداية';

    list[index] = updated;
    studentsStore[targetBatchId] = [...list];

    // Sync student list into matching class
    const classes = classesStore[targetBatchId] || [];
    classes.forEach((cls) => {
      cls.studentNames = (studentsStore[targetBatchId] || [])
        .filter((s) => s.className === cls.name)
        .map((s) => s.name);
      cls.studentCount = cls.studentNames.length;
    });

    saveDbToLocalStorage();
    return updated;
  },

  /**
   * Import students from parsed Excel file array (UI interface ready for backend integration)
   */
  async importStudentsFromExcel(
    batchId: string,
    newStudentsData: Array<{ name: string; studentCode?: string; className: string; clubName?: string; points?: number }>
  ): Promise<BatchStudent[]> {
    const createdList: BatchStudent[] = [];
    if (!studentsStore[batchId]) studentsStore[batchId] = [];

    newStudentsData.forEach((item, idx) => {
      const student: BatchStudent = {
        id: `std-import-${Date.now()}-${idx}`,
        batchId,
        name: item.name,
        studentCode: item.studentCode || `STU-${100 + idx}`,
        className: item.className || 'الفصل E',
        clubName: item.clubName || 'بدون نادي',
        levelBadge: '🌱 البداية',
        points: 0,
        completedTasks: 0,
        completedChallengesCount: 0,
        avatarUrl: `https://images.unsplash.com/photo-${1534528741775 + (idx % 10)}?auto=format&fit=crop&q=80&w=200`,
        status: 'active',
      };
      studentsStore[batchId].push(student);
      createdList.push(student);
    });

    // Update batch student count
    const batch = batchesStore.find((b) => b.id === batchId);
    if (batch) batch.studentCount += createdList.length;

    // Sync student lists into matching classes
    const classes = classesStore[batchId] || [];
    classes.forEach((cls) => {
      cls.studentNames = (studentsStore[batchId] || [])
        .filter((s) => s.className === cls.name)
        .map((s) => s.name);
      cls.studentCount = cls.studentNames.length;
    });

    saveDbToLocalStorage();
    return createdList;
  },

  /**
   * Fetch classes of selected batch
   */
  async getClassesByBatch(batchId: string): Promise<BatchClass[]> {
    return classesStore[batchId] || [];
  },

  /**
   * Fetch clubs of selected batch dynamically synced with student assignments and active tasks
   */
  async getClubsByBatch(batchId: string): Promise<BatchClub[]> {
    loadDbFromLocalStorage();
    const computedClubs = computeBatchClubs(batchId);
    saveDbToLocalStorage();
    return computedClubs;
  },

  /**
   * Create a new club in batch
   */
  async createClub(batchId: string, club: Omit<BatchClub, 'id' | 'batchId'>): Promise<BatchClub> {
    loadDbFromLocalStorage();
    const newClub: BatchClub = {
      ...club,
      id: `club-${Date.now()}`,
      batchId,
    };
    if (!clubsStore[batchId]) clubsStore[batchId] = [];
    clubsStore[batchId].push(newClub);

    const batch = batchesStore.find((b) => b.id === batchId);
    if (batch) {
      const clubs = computeBatchClubs(batchId);
      batch.clubCount = clubs.length;
    }

    saveDbToLocalStorage();
    return newClub;
  },

  /**
   * Fetch challenges of selected batch
   */
  async getChallengesByBatch(batchId: string): Promise<BatchChallenge[]> {
    return challengesStore[batchId] || [];
  },

  /**
   * Helper: Check if a student is in the target audience of a challenge
   */
  isStudentInChallengeAudience(ch: BatchChallenge, student: BatchStudent, batchId: string): boolean {
    const targetType = ch.targetType || 'batch';
    if (targetType === 'school' || targetType === 'all') {
      return true;
    }
    if (targetType === 'batch') {
      return ch.batchId === batchId;
    }
    if (targetType === 'class') {
      if (ch.batchId && ch.batchId !== batchId) return false;
      if (!student.className || !ch.targetName) return false;
      const sClass = student.className.trim().toLowerCase();
      const tClass = ch.targetName.trim().toLowerCase();
      return sClass === tClass || sClass.includes(tClass) || tClass.includes(sClass);
    }
    if (targetType === 'club') {
      if (ch.batchId && ch.batchId !== batchId) return false;
      if (!student.clubName || !ch.targetName) return false;
      if (student.clubName.trim() === 'بدون نادي') return false;
      const sClub = student.clubName.trim().toLowerCase();
      const tClub = ch.targetName.trim().toLowerCase();
      return sClub === tClub || sClub.includes(tClub) || tClub.includes(sClub);
    }
    if (targetType === 'student') {
      if (ch.targetStudentId && student.id === ch.targetStudentId) return true;
      if (ch.targetStudentCode && student.studentCode && student.studentCode.trim().toLowerCase() === ch.targetStudentCode.trim().toLowerCase()) return true;
      if (ch.targetName && student.name.trim() === ch.targetName.trim()) return true;
      return false;
    }
    return true;
  },

  /**
   * Fetch challenges relevant for a specific student based on target audience rules
   */
  async getChallengesForStudent(student: BatchStudent, batchId: string): Promise<BatchChallenge[]> {
    const results: BatchChallenge[] = [];
    Object.keys(challengesStore).forEach((bId) => {
      (challengesStore[bId] || []).forEach((ch) => {
        if (this.isStudentInChallengeAudience(ch, student, batchId)) {
          results.push(ch);
        }
      });
    });
    return results;
  },

  /**
   * Create a new challenge in batch
   */
  async createChallenge(batchId: string, challenge: Omit<BatchChallenge, 'id' | 'batchId'>): Promise<BatchChallenge> {
    const newChallenge: BatchChallenge = {
      ...challenge,
      id: `ch-${Date.now()}`,
      batchId,
    };
    if (!challengesStore[batchId]) challengesStore[batchId] = [];
    challengesStore[batchId].unshift(newChallenge);
    saveDbToLocalStorage();
    return newChallenge;
  },

  /**
   * Fetch library items of selected batch (including global items targeted for 'all')
   */
  async getLibraryByBatch(batchId: string): Promise<BatchLibraryItem[]> {
    loadDbFromLocalStorage();
    const itemsMap = new Map<string, BatchLibraryItem>();

    // 1. Add items specifically uploaded to this batch
    const batchItems = libraryStore[batchId] || [];
    batchItems.forEach((item) => itemsMap.set(item.id, item));

    // 2. Add items from any batch targeted to 'all' or specifically matching this batch
    Object.keys(libraryStore).forEach((key) => {
      (libraryStore[key] || []).forEach((item) => {
        if (!item.targetType || item.targetType === 'all' || item.batchId === batchId) {
          itemsMap.set(item.id, item);
        }
      });
    });

    return Array.from(itemsMap.values());
  },

  /**
   * Fetch library items targeted specifically for a student based on real relationships (Batch, Club, Student ID)
   */
  async getLibraryForStudent(query: StudentLibraryQuery): Promise<BatchLibraryItem[]> {
    loadDbFromLocalStorage();
    const itemsMap = new Map<string, BatchLibraryItem>();

    // Collect ALL items across all batches
    Object.keys(libraryStore).forEach((key) => {
      (libraryStore[key] || []).forEach((item) => {
        itemsMap.set(item.id, item);
      });
    });

    const allItems = Array.from(itemsMap.values());

    const normalize = (str?: string) => (str || '').replace(/[^\p{L}\p{N}]/gu, '').toLowerCase().trim();

    const studentBatchId = query.batchId || '';
    const studentBatchNameNorm = normalize(query.batchName);
    const studentClubNorm = normalize(query.clubName);
    const studentId = query.studentId || '';
    const studentCodeNorm = normalize(query.studentCode);
    const studentNameNorm = normalize(query.studentName);

    return allItems.filter((item) => {
      const targetType = item.targetType || 'all';

      // Rule 1: الجميع ("all") -> Show to ALL students
      if (targetType === 'all' || item.targetName === 'الجميع') {
        return true;
      }

      // Rule 2: دفعة محددة ("batch") -> Show ONLY to students in that batch
      if (targetType === 'batch') {
        if (item.batchId && studentBatchId && item.batchId === studentBatchId) {
          return true;
        }
        const targetBatchNorm = normalize(item.targetName);
        if (targetBatchNorm && studentBatchNameNorm && (studentBatchNameNorm.includes(targetBatchNorm) || targetBatchNorm.includes(studentBatchNameNorm))) {
          return true;
        }
        return false;
      }

      // Rule 3: نادي محدد ("club") -> Show ONLY to students who currently belong to that club
      if (targetType === 'club') {
        if (!studentClubNorm || query.clubName === 'بدون نادي') {
          return false;
        }
        const targetClubNorm = normalize(item.targetName);
        if (targetClubNorm && (studentClubNorm.includes(targetClubNorm) || targetClubNorm.includes(studentClubNorm))) {
          return true;
        }
        return false;
      }

      // Rule 4: طالب محدد ("student") -> Show ONLY to that specific student
      if (targetType === 'student') {
        if (item.targetStudentId && studentId && item.targetStudentId === studentId) {
          return true;
        }
        if (item.targetStudentCode && studentCodeNorm && normalize(item.targetStudentCode) === studentCodeNorm) {
          return true;
        }
        const targetStudentNameNorm = normalize(item.targetName);
        if (targetStudentNameNorm && studentNameNorm && (studentNameNorm === targetStudentNameNorm || studentNameNorm.includes(targetStudentNameNorm) || targetStudentNameNorm.includes(studentNameNorm))) {
          return true;
        }
        return false;
      }

      return false;
    });
  },

  /**
   * Upload/add a library file to batch
   */
  async uploadLibraryFile(batchId: string, file: Omit<BatchLibraryItem, 'id' | 'batchId' | 'uploadedAt'>): Promise<BatchLibraryItem> {
    loadDbFromLocalStorage();
    const newItem: BatchLibraryItem = {
      ...file,
      id: `lib-${Date.now()}`,
      batchId,
      uploadedAt: new Date().toISOString().split('T')[0],
    };
    if (!libraryStore[batchId]) libraryStore[batchId] = [];
    libraryStore[batchId].unshift(newItem);
    saveDbToLocalStorage();
    return newItem;
  },

  /**
   * Filter messages targeted to a specific student based on their ID, class, club, or batch
   */
  getMessagesForStudent(student: BatchStudent, batchId: string): BatchAnnouncement[] {
    loadDbFromLocalStorage();
    const allAnnouncements = Object.values(announcementsStore).flat();
    const studentMessages = allAnnouncements.filter((msg) => {
      if (!msg.targetType || msg.targetType === 'all' || msg.targetType === 'batch') {
        return !msg.batchId || msg.batchId === batchId || msg.targetValue === batchId;
      }
      if (msg.targetType === 'class') {
        return msg.targetValue === student.className;
      }
      if (msg.targetType === 'club') {
        return msg.targetValue === student.clubName;
      }
      if (msg.targetType === 'student') {
        return (
          msg.targetValue === student.id ||
          msg.targetValue === student.studentCode ||
          msg.targetValue === student.name
        );
      }
      return false;
    });

    return studentMessages.sort((a, b) => {
      return (b.id || '').localeCompare(a.id || '');
    });
  },

  /**
   * Fetch announcements of selected batch
   */
  async getAnnouncementsByBatch(batchId: string): Promise<BatchAnnouncement[]> {
    loadDbFromLocalStorage();
    return announcementsStore[batchId] || [];
  },

  /**
   * Add a new announcement or teacher message to selected batch
   */
  async addAnnouncement(batchId: string, announcement: Omit<BatchAnnouncement, 'id' | 'batchId' | 'createdAt'>): Promise<BatchAnnouncement> {
    loadDbFromLocalStorage();
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    const dateFormatted = now.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });

    const newAnn: BatchAnnouncement = {
      ...announcement,
      id: `msg-${Date.now()}`,
      batchId,
      createdAt: `${timeFormatted} • ${dateFormatted}`,
      author: announcement.author || 'معلمة الدفعة',
      title: announcement.title || 'رسالة جديدة من المعلمة',
      pinned: announcement.pinned || false,
      targetType: announcement.targetType || 'batch',
      targetValue: announcement.targetValue || batchId,
      targetName: announcement.targetName || 'الدفعة العامة',
      readBy: [],
    };
    if (!announcementsStore[batchId]) announcementsStore[batchId] = [];
    announcementsStore[batchId].unshift(newAnn);
    saveDbToLocalStorage();
    return newAnn;
  },

  /**
   * Mark a teacher message as read by student
   */
  async markMessageAsRead(messageId: string, studentId: string): Promise<boolean> {
    loadDbFromLocalStorage();
    let updated = false;
    for (const bId of Object.keys(announcementsStore)) {
      const list = announcementsStore[bId] || [];
      const msg = list.find((m) => m.id === messageId);
      if (msg) {
        if (!msg.readBy) msg.readBy = [];
        if (!msg.readBy.includes(studentId)) {
          msg.readBy.push(studentId);
          updated = true;
        }
      }
    }
    if (updated) {
      saveDbToLocalStorage();
    }
    return updated;
  },

  /**
   * Delete a teacher message or announcement
   */
  async deleteAnnouncement(batchId: string, messageId: string): Promise<boolean> {
    loadDbFromLocalStorage();
    if (announcementsStore[batchId]) {
      announcementsStore[batchId] = announcementsStore[batchId].filter((m) => m.id !== messageId);
      saveDbToLocalStorage();
      return true;
    }
    return false;
  },

  /**
   * Fetch pending task submissions waiting for teacher review in selected batch
   */
  async getPendingSubmissions(batchId: string): Promise<PendingSubmission[]> {
    return submissionsStore[batchId] || [];
  },

  /**
   * Submit a task, challenge, or achievement for teacher review
   */
  async submitForReview(
    submission: Omit<PendingSubmission, 'id' | 'status' | 'submittedAt'>
  ): Promise<PendingSubmission> {
    const batchId = submission.batchId || 'batch-g6-f';
    const newSub: PendingSubmission = {
      ...submission,
      id: `sub-${Date.now()}`,
      submittedAt: 'الآن',
      status: 'pending',
    };
    if (!submissionsStore[batchId]) submissionsStore[batchId] = [];
    submissionsStore[batchId].unshift(newSub);
    saveDbToLocalStorage();
    return newSub;
  },

  /**
   * Fetch submissions made by a student
   */
  async getStudentSubmissions(batchId: string = 'batch-g6-f', studentId?: string): Promise<PendingSubmission[]> {
    const list = submissionsStore[batchId] || [];
    if (!studentId) return list;
    return list.filter((s) => s.studentId === studentId || s.studentName.includes(studentId));
  },

  /**
   * Review a student submission (Approve / Reject)
   */
  async reviewSubmission(
    batchId: string,
    submissionId: string,
    status: 'approved' | 'rejected',
    teacherNotes?: string
  ): Promise<PendingSubmission> {
    const list = submissionsStore[batchId] || [];
    const index = list.findIndex((s) => s.id === submissionId);
    if (index === -1) throw new Error('Submission not found');

    const updated = {
      ...list[index],
      status,
      teacherNotes,
    };
    list[index] = updated;
    submissionsStore[batchId] = [...list];

    // Update student stats based on review
    let student = (studentsStore[batchId] || []).find(
      (s) =>
        s.id === updated.studentId ||
        (s.studentCode && s.studentCode === updated.studentCode) ||
        s.name.trim() === updated.studentName.trim()
    );

    if (!student) {
      for (const bId of Object.keys(studentsStore)) {
        const found = (studentsStore[bId] || []).find(
          (s) =>
            s.id === updated.studentId ||
            (s.studentCode && s.studentCode === updated.studentCode) ||
            s.name.trim() === updated.studentName.trim()
        );
        if (found) {
          student = found;
          break;
        }
      }
    }

    if (student) {
      if (status === 'approved') {
        student.points = (student.points || 0) + (updated.rewardXp || 0);
        student.completedTasks = (student.completedTasks || 0) + 1;
      }

      // Recalculate real completed challenges count accurately
      const allSubs = Object.values(submissionsStore).flat();
      const bChallenges = challengesStore[batchId] || [];
      const sChallenges = bChallenges.filter((ch) =>
        this.isStudentInChallengeAudience(ch, student!, batchId)
      );
      const realCount = calculateStudentCompletedChallengesCount(
        student,
        batchId,
        sChallenges,
        allSubs
      );
      student.completedChallengesCount = realCount;
      student.levelBadge = computeDynamicLevelBadge(student);

      // Automatically unlock achievement for student if it's an achievement submission
      if (status === 'approved' && (updated.achievementId || updated.sourceType === 'achievement')) {
        const achId = updated.achievementId;
        if (achId) {
          const studentId = updated.studentId || student.id || 'student-default';
          await this.unlockAchievementForStudent(studentId, achId);
        }
      }
    }

    saveDbToLocalStorage();
    return updated;
  },

  // --- BATCH CRUD ---
  async createBatch(
    batchData: Omit<Batch, 'id' | 'studentCount' | 'classCount' | 'clubCount' | 'createdAt' | 'colorGradient'> & {
      colorGradient?: string;
    }
  ): Promise<Batch> {
    const newBatch: Batch = {
      ...batchData,
      id: `batch-${Date.now()}`,
      studentCount: 0,
      classCount: 0,
      clubCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      colorGradient:
        batchData.colorGradient ||
        (batchData.gender === 'female'
          ? 'from-rose-500/20 via-teal-500/20 to-emerald-500/20'
          : 'from-sky-500/20 via-teal-500/20 to-emerald-500/20'),
    };
    batchesStore.push(newBatch);
    studentsStore[newBatch.id] = [];
    classesStore[newBatch.id] = [];
    clubsStore[newBatch.id] = [];
    challengesStore[newBatch.id] = [];
    libraryStore[newBatch.id] = [];
    announcementsStore[newBatch.id] = [];
    submissionsStore[newBatch.id] = [];
    saveDbToLocalStorage();
    return newBatch;
  },

  async updateBatch(batchId: string, updates: Partial<Batch>): Promise<Batch> {
    const idx = batchesStore.findIndex((b) => b.id === batchId);
    if (idx === -1) throw new Error('Batch not found');
    const updated = { ...batchesStore[idx], ...updates };
    batchesStore[idx] = updated;
    saveDbToLocalStorage();
    return updated;
  },

  async deleteBatch(batchId: string): Promise<boolean> {
    batchesStore = batchesStore.filter((b) => b.id !== batchId);
    delete studentsStore[batchId];
    delete classesStore[batchId];
    delete clubsStore[batchId];
    delete challengesStore[batchId];
    delete libraryStore[batchId];
    delete announcementsStore[batchId];
    delete submissionsStore[batchId];
    saveDbToLocalStorage();
    return true;
  },

  // --- CLASS CRUD ---
  async createClass(
    batchId: string,
    classData: Omit<BatchClass, 'id' | 'batchId' | 'studentCount' | 'avgPoints' | 'challengeCompletionRate' | 'studentNames'> & {
      studentNames?: string[];
    }
  ): Promise<BatchClass> {
    const newClass: BatchClass = {
      ...classData,
      id: `class-${Date.now()}`,
      batchId,
      studentCount: 0,
      avgPoints: 0,
      challengeCompletionRate: 100,
      studentNames: classData.studentNames || [],
    };
    if (!classesStore[batchId]) classesStore[batchId] = [];
    classesStore[batchId].push(newClass);

    // Update batch classCount
    const batch = batchesStore.find((b) => b.id === batchId);
    if (batch) batch.classCount = classesStore[batchId].length;

    saveDbToLocalStorage();
    return newClass;
  },

  async updateClass(batchId: string, classId: string, updates: Partial<BatchClass>): Promise<BatchClass> {
    const list = classesStore[batchId] || [];
    const idx = list.findIndex((c) => c.id === classId);
    if (idx === -1) throw new Error('Class not found');
    const updated = { ...list[idx], ...updates };
    list[idx] = updated;
    classesStore[batchId] = [...list];
    return updated;
  },

  async deleteClass(batchId: string, classId: string): Promise<boolean> {
    const list = classesStore[batchId] || [];
    classesStore[batchId] = list.filter((c) => c.id !== classId);

    // Update batch classCount
    const batch = batchesStore.find((b) => b.id === batchId);
    if (batch) batch.classCount = classesStore[batchId].length;

    saveDbToLocalStorage();
    return true;
  },

  async moveStudentToClass(batchId: string, studentId: string, newClassName: string): Promise<BatchStudent> {
    const list = studentsStore[batchId] || [];
    const student = list.find((s) => s.id === studentId);
    if (!student) throw new Error('Student not found');
    student.className = newClassName;

    // Update class student lists and counts
    const classes = classesStore[batchId] || [];
    classes.forEach((cls) => {
      cls.studentNames = (studentsStore[batchId] || [])
        .filter((s) => s.className === cls.name)
        .map((s) => s.name);
      cls.studentCount = cls.studentNames.length;
    });

    return student;
  },

  // --- CLUB CRUD ---
  async updateClub(batchId: string, clubId: string, updates: Partial<BatchClub>): Promise<BatchClub> {
    const list = clubsStore[batchId] || [];
    const idx = list.findIndex((c) => c.id === clubId);
    if (idx === -1) throw new Error('Club not found');
    const updated = { ...list[idx], ...updates };
    list[idx] = updated;
    clubsStore[batchId] = [...list];
    return updated;
  },

  async deleteClub(batchId: string, clubId: string): Promise<boolean> {
    loadDbFromLocalStorage();
    const list = clubsStore[batchId] || [];
    clubsStore[batchId] = list.filter((c) => c.id !== clubId);

    // Update batch clubCount
    const batch = batchesStore.find((b) => b.id === batchId);
    if (batch) {
      const clubs = computeBatchClubs(batchId);
      batch.clubCount = clubs.length;
    }

    saveDbToLocalStorage();
    return true;
  },

  async addClubMember(batchId: string, clubId: string, studentId: string): Promise<BatchClub> {
    const clubs = clubsStore[batchId] || [];
    const club = clubs.find((c) => c.id === clubId);
    if (!club) throw new Error('Club not found');

    const students = studentsStore[batchId] || [];
    const student = students.find((s) => s.id === studentId);
    if (!student) throw new Error('Student not found');

    // Update student's clubName
    student.clubName = club.name;

    // Add member if not already added
    if (!club.members) club.members = [];
    if (!club.members.some((m) => m.id === student.id)) {
      club.members.push({
        id: student.id,
        name: student.name,
        className: student.className,
        avatarUrl: student.avatarUrl,
      });
      club.memberCount = club.members.length;
    }

    return club;
  },

  async removeClubMember(batchId: string, clubId: string, studentId: string): Promise<BatchClub> {
    const clubs = clubsStore[batchId] || [];
    const club = clubs.find((c) => c.id === clubId);
    if (!club) throw new Error('Club not found');

    if (club.members) {
      club.members = club.members.filter((m) => m.id !== studentId);
      club.memberCount = club.members.length;
    }

    // Clear clubName on student
    const student = (studentsStore[batchId] || []).find((s) => s.id === studentId);
    if (student) student.clubName = 'بدون نادي';

    return club;
  },

  // --- CHALLENGE CRUD ---
  async updateChallenge(batchId: string, challengeId: string, updates: Partial<BatchChallenge>): Promise<BatchChallenge> {
    const list = challengesStore[batchId] || [];
    const idx = list.findIndex((c) => c.id === challengeId);
    if (idx === -1) throw new Error('Challenge not found');
    const updated = { ...list[idx], ...updates };
    list[idx] = updated;
    challengesStore[batchId] = [...list];
    return updated;
  },

  async deleteChallenge(batchId: string, challengeId: string): Promise<boolean> {
    if (batchId && challengesStore[batchId]) {
      challengesStore[batchId] = challengesStore[batchId].filter((c) => c && c.id !== challengeId);
    }
    Object.keys(challengesStore).forEach((key) => {
      challengesStore[key] = (challengesStore[key] || []).filter((c) => c && c.id !== challengeId);
    });
    saveDbToLocalStorage();
    return true;
  },

  // --- LIBRARY CRUD ---
  async updateLibraryFile(batchId: string, itemId: string, updates: Partial<BatchLibraryItem>): Promise<BatchLibraryItem> {
    loadDbFromLocalStorage();
    let updatedItem: BatchLibraryItem | null = null;
    Object.keys(libraryStore).forEach((key) => {
      const list = libraryStore[key] || [];
      const idx = list.findIndex((l) => l.id === itemId);
      if (idx !== -1) {
        const updated = { ...list[idx], ...updates };
        list[idx] = updated;
        libraryStore[key] = [...list];
        updatedItem = updated;
      }
    });
    saveDbToLocalStorage();
    return updatedItem || ({ id: itemId, ...updates } as BatchLibraryItem);
  },

  async deleteLibraryFile(batchId: string, itemId: string): Promise<boolean> {
    loadDbFromLocalStorage();
    Object.keys(libraryStore).forEach((key) => {
      if (Array.isArray(libraryStore[key])) {
        libraryStore[key] = libraryStore[key].filter((l) => l && l.id !== itemId);
      }
    });
    saveDbToLocalStorage();
    return true;
  },

  // --- STUDENT DELETE ---
  async deleteStudent(batchId: string, studentId: string): Promise<boolean> {
    const list = studentsStore[batchId] || [];
    studentsStore[batchId] = list.filter((s) => s.id !== studentId);

    // Update batch studentCount
    const batch = batchesStore.find((b) => b.id === batchId);
    if (batch) batch.studentCount = studentsStore[batchId].length;

    // Sync student lists into matching classes
    const classes = classesStore[batchId] || [];
    classes.forEach((cls) => {
      cls.studentNames = (studentsStore[batchId] || [])
        .filter((s) => s.className === cls.name)
        .map((s) => s.name);
      cls.studentCount = cls.studentNames.length;
    });

    saveDbToLocalStorage();
    return true;
  },

  // --- ACHIEVEMENTS MANAGEMENT ---
  async getAchievements(batchId?: string, clubName?: string): Promise<Achievement[]> {
    return achievementsStore.filter((a) => {
      // Show if target is 'all'
      if (a.targetType === 'all') return true;
      
      // Show if batch matches
      if (batchId && a.batchId && a.batchId === batchId) {
        if (a.targetType === 'batch') return true;
        if (a.targetType === 'club' && clubName && a.targetName === clubName) return true;
      }

      // Show if targetName matches batch or club
      if (clubName && a.targetType === 'club' && a.targetName === clubName) return true;

      return false;
    });
  },

  async getAllAchievements(): Promise<Achievement[]> {
    return achievementsStore;
  },

  async createAchievement(data: Omit<Achievement, 'id' | 'createdAt'>): Promise<Achievement> {
    const newAchievement: Achievement = {
      ...data,
      id: `ach-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    achievementsStore.unshift(newAchievement);
    saveDbToLocalStorage();
    return newAchievement;
  },

  async updateAchievement(id: string, updates: Partial<Achievement>): Promise<Achievement> {
    const idx = achievementsStore.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Achievement not found');
    achievementsStore[idx] = { ...achievementsStore[idx], ...updates };
    saveDbToLocalStorage();
    return achievementsStore[idx];
  },

  async deleteAchievement(id: string): Promise<boolean> {
    const idx = achievementsStore.findIndex((a) => a.id === id);
    if (idx !== -1) {
      achievementsStore.splice(idx, 1);
      saveDbToLocalStorage();
      return true;
    }
    return false;
  },

  async getStudentUnlockedAchievements(studentId: string = 'student-default'): Promise<StudentUnlockedAchievement[]> {
    return unlockedAchievementsStore[studentId] || [];
  },

  async unlockAchievementForStudent(
    studentId: string = 'student-default',
    achievementId: string
  ): Promise<{ success: boolean; journeyStepsAdded: number; achievement: Achievement; unlockedAt: string }> {
    const achievement = achievementsStore.find((a) => a.id === achievementId);
    if (!achievement) throw new Error('Achievement not found');

    if (!unlockedAchievementsStore[studentId]) {
      unlockedAchievementsStore[studentId] = [];
    }

    const existing = unlockedAchievementsStore[studentId].find((u) => u.achievementId === achievementId);
    if (existing) {
      return {
        success: false,
        journeyStepsAdded: 0,
        achievement,
        unlockedAt: existing.unlockedAt,
      };
    }

    const unlockedAt = new Date().toISOString().split('T')[0];
    unlockedAchievementsStore[studentId].push({
      achievementId,
      unlockedAt,
    });
    saveDbToLocalStorage();

    return {
      success: true,
      journeyStepsAdded: achievement.journeyStepsReward || 1,
      achievement,
      unlockedAt,
    };
  },

  async validateTeacherCredentials(teacherName: string, teacherCode: string): Promise<boolean> {
    const nameClean = (teacherName || '').trim().toLowerCase();
    const codeClean = (teacherCode || '').trim().toLowerCase();
    if (!nameClean || !codeClean) return false;

    // Standard valid teacher codes including 2000 and RD-2026-58
    const defaultTeacherCodes = ['2000', 'rd-2026-58', 'btc-6f', 'teacher', '1234', 't-100', '2026', '123456', '0000'];

    // Load batches to check batch codes & supervisor names
    const batches = await this.getBatches();
    const batchCodes = batches.map((b) => (b.code || '').trim().toLowerCase());

    const isValidCode = defaultTeacherCodes.includes(codeClean) || batchCodes.includes(codeClean);
    if (!isValidCode) return false;

    const normName = nameClean.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/أ\./g, '').replace(/ا\./g, '').trim();

    // Valid if code is valid and teacher name is provided (e.g., سمية)
    return normName.length >= 2;
  },
};

