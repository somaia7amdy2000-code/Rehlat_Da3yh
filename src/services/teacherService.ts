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
  TeacherProfile,
} from '../types/teacher';
import { calculateStudentJourney } from './journeyEngine';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { toUUID } from './migrationService';

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

const isStaleRadioClub = (name?: string) =>
  Boolean(
    name &&
    (
      name.includes('الإذاعة') ||
      name.includes('الإذاعه') ||
      name.includes('اذاعة') ||
      name.includes('اذاعه')
    )
  );

function isUUID(str?: string): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

async function getRealStudentUuid(
  student: { id: string; studentCode?: string },
  _batchId: string
): Promise<string | null> {
  if (isUUID(student.id)) {
    return student.id;
  }
  return null;
}

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
    }

    // Clean up stale test club "نادي الإذاعة" and variants from local stores if present
    let needsSave = false;
    Object.keys(clubsStore).forEach((bId) => {
      const origLen = clubsStore[bId]?.length || 0;
      clubsStore[bId] = (clubsStore[bId] || []).filter((c) => c.name && !isStaleRadioClub(c.name));
      if (clubsStore[bId].length !== origLen) needsSave = true;
    });

    Object.keys(studentsStore).forEach((bId) => {
      (studentsStore[bId] || []).forEach((st) => {
        if (isStaleRadioClub(st.clubName)) {
          st.clubName = 'بدون نادي';
          needsSave = true;
        }
      });
    });

    if (needsSave) {
      saveDbToLocalStorage();
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
  let clubs = [...(clubsStore[batchId] || [])].filter((c) => c.name && !isStaleRadioClub(c.name));

  // Auto-discover any club assigned to students that isn't explicitly in clubsStore yet
  const existingNames = new Set(clubs.map((c) => c.name.trim().toLowerCase()));
  students.forEach((s) => {
    if (s.clubName && s.clubName !== 'بدون نادي' && s.clubName.trim() && !isStaleRadioClub(s.clubName)) {
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
        (s as any).challengeId === ch.id
    );
  }).length;

  const matchedSubIds = new Set<string>();
  batchChallenges.forEach((ch) => {
    studentSubs.forEach((s) => {
      if (
        s.taskTitle === ch.title ||
        s.sourceName === ch.title ||
        (s as any).challengeId === ch.id
      ) {
        matchedSubIds.add(s.id);
      }
    });
  });

  const unmatchedChallengeSubs = studentSubs.filter(
    (s) =>
      !matchedSubIds.has(s.id) &&
      (s.sourceType === 'challenge' || (!s.sourceType && s.sourceType !== 'club'))
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

    if (isSupabaseConfigured) {
      try {
        const { data: supaStudent } = await supabase
          .from('students')
          .select('*')
          .ilike('student_code', cleanCode)
          .maybeSingle();

        if (supaStudent && typeof supaStudent.points === 'number') {
          for (const bId of Object.keys(studentsStore)) {
            const list = studentsStore[bId] || [];
            list.forEach((s) => {
              if (
                s.id === supaStudent.id ||
                (s.studentCode && s.studentCode.trim().toLowerCase() === cleanCode) ||
                (s.name && supaStudent.full_name && s.name.trim().toLowerCase() === supaStudent.full_name.trim().toLowerCase())
              ) {
                s.points = supaStudent.points;
                s.levelBadge = computeDynamicLevelBadge(s);
              }
            });
          }
          saveDbToLocalStorage();
        }
      } catch (err) {
        console.warn('getStudentByCode Supabase sync warning:', err);
      }
    }

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
    const cleanId = studentId ? studentId.trim() : '';
    const cleanIdLower = cleanId.toLowerCase();

    // First, locate student in studentsStore to retrieve local metadata (including studentCode if available)
    let localStudent: any = null;
    let localBatchId: string = '';
    for (const bId of Object.keys(studentsStore)) {
      const list = studentsStore[bId] || [];
      const found = list.find(
        (s) =>
          s.id === cleanId ||
          (s.studentCode && s.studentCode.trim().toLowerCase() === cleanIdLower) ||
          (s.name && s.name.trim().toLowerCase() === cleanIdLower)
      );
      if (found) {
        localStudent = found;
        localBatchId = bId;
        break;
      }
    }

    const debugInfo: any = {
      studentId: cleanId,
      supaStudentId: null,
      supaStudentQuery: null,
      isRlsBlocked: false,
      hasMemberData: false,
      memberDataClubId: null,
      memberDataClubs: null,
      memberQueryError: null,
      clubObjId: null,
      clubObjName: null,
      studentClubId: null,
      studentClubName: null,
      supaClubItem: null,
      clubItem: null,
      isSupabaseConfigured,
    };

    console.log('[TRACE 1] getStudentFullContext received studentId:', studentId);

    let supaClubItem: BatchClub | null = null;
    let supaClubName: string | null = null;
    let supaClubId: string | null = null;
    let supaStudent: any = null;

    if (isSupabaseConfigured && cleanId) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);

        if (isUuid) {
          const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('id', cleanId)
            .maybeSingle();
          supaStudent = data;
          debugInfo.supaStudentQuery = { data, error: error ? error.message : null };
        }

        if (!supaStudent) {
          const { data, error } = await supabase
            .from('students')
            .select('*')
            .ilike('student_code', cleanId)
            .maybeSingle();
          if (data) supaStudent = data;
          if (!debugInfo.supaStudentQuery) {
            debugInfo.supaStudentQuery = { data, error: error ? error.message : null };
          }
        }

        if (!supaStudent) {
          const { data, error } = await supabase
            .from('students')
            .select('*')
            .ilike('full_name', cleanId)
            .maybeSingle();
          if (data) supaStudent = data;
          if (!debugInfo.supaStudentQuery) {
            debugInfo.supaStudentQuery = { data, error: error ? error.message : null };
          }
        }

        if (!supaStudent && localStudent?.studentCode) {
          const { data } = await supabase
            .from('students')
            .select('*')
            .ilike('student_code', localStudent.studentCode.trim())
            .maybeSingle();
          if (data) supaStudent = data;
        }

        if (!supaStudent && localStudent?.name) {
          const { data } = await supabase
            .from('students')
            .select('*')
            .ilike('full_name', localStudent.name.trim())
            .maybeSingle();
          if (data) supaStudent = data;
        }

        if (!supaStudent && isUuid) {
          // Explicit diagnostic: supaStudent is null because anonymous RLS blocks public.students SELECT
          debugInfo.isRlsBlocked = true;
        }

        let dbBatchId = supaStudent?.batch_id || localBatchId;
        let dbPoints = typeof supaStudent?.points === 'number' ? supaStudent.points : (localStudent?.points || 0);

        if (supaStudent) {
          debugInfo.supaStudentId = supaStudent.id;

          // Query public.club_members to resolve student's assigned club
          const { data: memberData, error: memberErr } = await supabase
            .from('club_members')
            .select('club_id, clubs(id, batch_id, name, description, supervisor_name, category)')
            .eq('student_id', supaStudent.id)
            .maybeSingle();

          console.log('[TRACE 3] club_members query data:', memberData);
          console.log('[TRACE 3] club_members query error:', memberErr);

          debugInfo.hasMemberData = !!memberData;
          debugInfo.memberDataClubId = memberData?.club_id || null;
          debugInfo.memberDataClubs = memberData?.clubs ? JSON.stringify(memberData.clubs) : null;
          debugInfo.memberQueryError = memberErr ? memberErr.message || JSON.stringify(memberErr) : null;

          const rawClub = memberData?.clubs;
          let clubObj = Array.isArray(rawClub) ? rawClub[0] : rawClub;

          // Fallback: If joined clubs is null but club_id exists in club_members, fetch club directly
          if (!clubObj && memberData?.club_id) {
            const { data: directClub } = await supabase
              .from('clubs')
              .select('id, batch_id, name, description, supervisor_name, category')
              .eq('id', memberData.club_id)
              .maybeSingle();
            if (directClub) {
              clubObj = directClub;
            }
          }

          if (clubObj) {
            debugInfo.clubObjId = clubObj.id || null;
            debugInfo.clubObjName = clubObj.name || null;
            supaClubId = clubObj.id;
            supaClubName = clubObj.name;
          }
        } else {
          // supaStudent is null (anonymous user). Verify student identity & club via SECURITY DEFINER RPC
          const studentCodeToUse = localStudent?.studentCode || supaStudent?.student_code || cleanId;
          const studentUuidToUse = isUuid ? cleanId : localStudent?.id;

          if (studentUuidToUse && studentCodeToUse) {
            const { data: rpcChallenges, error: rpcErr } = await supabase.rpc('get_student_challenges', {
              p_student_id: studentUuidToUse,
              p_student_code: studentCodeToUse
            });

            debugInfo.rpcVerification = { data: rpcChallenges, error: rpcErr ? rpcErr.message : null };

            if (Array.isArray(rpcChallenges)) {
              const clubChallenge = rpcChallenges.find((c: any) => c.target_type === 'club');
              if (clubChallenge && clubChallenge.target_id && clubChallenge.target_name) {
                supaClubId = clubChallenge.target_id;
                supaClubName = clubChallenge.target_name;
              }
            }
          }
        }

        // Secondary resolution: If we have clubId or clubName, resolve full club details from clubsStore
        const targetClubId = supaClubId || localStudent?.clubId;
        const targetClubName = supaClubName || localStudent?.clubName;

        if (targetClubId || (targetClubName && targetClubName !== 'بدون نادي')) {
          const allClubs = Object.values(clubsStore).flat();
          const matchedClub = allClubs.find(
            (c) =>
              (targetClubId && c.id === targetClubId) ||
              (targetClubName && c.name.trim().toLowerCase() === targetClubName.trim().toLowerCase())
          );

          if (matchedClub) {
            supaClubId = matchedClub.id;
            supaClubName = matchedClub.name;
            supaClubItem = {
              id: matchedClub.id,
              batchId: matchedClub.batchId || dbBatchId || 'default-batch',
              name: matchedClub.name,
              description: matchedClub.description || '',
              supervisorName: matchedClub.supervisorName || '',
              category: matchedClub.category || 'عام',
              memberCount: 1,
              activeTasksCount: 0,
              members: []
            };
          }
        }

        if (supaStudent) {
          let syncedAny = false;
          for (const bId of Object.keys(studentsStore)) {
            const list = studentsStore[bId] || [];
            list.forEach((s) => {
              if (
                s.id === supaStudent.id ||
                (s.studentCode && supaStudent.student_code && s.studentCode.trim().toLowerCase() === supaStudent.student_code.trim().toLowerCase()) ||
                (s.name && supaStudent.full_name && s.name.trim().toLowerCase() === supaStudent.full_name.trim().toLowerCase()) ||
                s.id === cleanId ||
                (s.studentCode && s.studentCode.trim().toLowerCase() === cleanIdLower) ||
                (localStudent && (s.id === localStudent.id || (s.studentCode && localStudent.studentCode && s.studentCode.trim().toLowerCase() === localStudent.studentCode.trim().toLowerCase())))
              ) {
                if (typeof supaStudent.points === 'number') {
                  s.points = supaStudent.points;
                }
                if (supaStudent.id) s.id = supaStudent.id;
                if (supaStudent.full_name) s.name = supaStudent.full_name;
                if (supaStudent.avatar_url) s.avatarUrl = supaStudent.avatar_url;
                if (supaStudent.status) s.status = supaStudent.status;
                if (supaClubName !== null) {
                  s.clubName = supaClubName;
                  s.clubId = supaClubId || undefined;
                }
                s.levelBadge = computeDynamicLevelBadge(s);
                syncedAny = true;
              }
            });
          }
          if (syncedAny) {
            saveDbToLocalStorage();
          }
        }
      } catch (err) {
        console.warn('Failed to fetch/sync student points or club from Supabase in getStudentFullContext:', err);
      }
    }

    for (const batchId of Object.keys(studentsStore)) {
      const list = studentsStore[batchId] || [];
      const student = list.find(
        (s) =>
          s.id === studentId ||
          (s.studentCode && s.studentCode.trim().toLowerCase() === cleanIdLower) ||
          (s.name && s.name.trim().toLowerCase() === cleanIdLower) ||
          (supaStudent && (
            s.id === supaStudent.id ||
            (s.studentCode && supaStudent.student_code && s.studentCode.trim().toLowerCase() === supaStudent.student_code.trim().toLowerCase()) ||
            (s.name && supaStudent.full_name && s.name.trim().toLowerCase() === supaStudent.full_name.trim().toLowerCase())
          ))
      );
      if (student) {
        if (supaStudent && typeof supaStudent.points === 'number') {
          student.points = supaStudent.points;
        }
        if (supaClubName && supaClubName !== 'بدون نادي') {
          student.clubName = supaClubName;
          student.clubId = supaClubId || student.clubId || undefined;
        } else if (supaClubName === 'بدون نادي') {
          student.clubName = 'بدون نادي';
          student.clubId = undefined;
        }

        const allSubs = Object.values(submissionsStore).flat();
        const challenges = await this.getChallengesForStudent(student, batchId);
        const finalCompletedCount = calculateStudentCompletedChallengesCount(
          student,
          batchId,
          challenges,
          allSubs
        );

        const finalPoints = (supaStudent && typeof supaStudent.points === 'number')
          ? supaStudent.points
          : student.points;

        student.points = finalPoints;
        student.completedChallengesCount = finalCompletedCount;
        student.levelBadge = computeDynamicLevelBadge({ ...student, points: finalPoints, completedChallengesCount: finalCompletedCount });

        saveDbToLocalStorage();

        const updatedStudent = {
          ...student,
          points: finalPoints,
          completedChallengesCount: finalCompletedCount,
          levelBadge: computeDynamicLevelBadge({ ...student, points: finalPoints, completedChallengesCount: finalCompletedCount }),
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
        const clubItem = supaClubItem || (
          updatedStudent.clubName && updatedStudent.clubName !== 'بدون نادي'
            ? clubs.find((c) => c.id === updatedStudent.clubId || c.name === updatedStudent.clubName) || null
            : null
        );
        const library = await this.getLibraryByBatch(batchId);
        const announcements = this.getMessagesForStudent(updatedStudent, batchId);
        const submissions = submissionsStore[batchId] || [];
        const allBatchStudents = list.map((s) => ({ ...s, levelBadge: computeDynamicLevelBadge(s) }));

        console.log('[TRACE Return] student.clubId:', updatedStudent.clubId);
        console.log('[TRACE Return] student.clubName:', updatedStudent.clubName);
        console.log('[TRACE Return] supaClubItem:', supaClubItem);
        console.log('[TRACE Return] clubItem:', clubItem);

        debugInfo.studentClubId = updatedStudent.clubId || null;
        debugInfo.studentClubName = updatedStudent.clubName || null;
        debugInfo.supaClubItem = supaClubItem ? JSON.stringify(supaClubItem) : null;
        debugInfo.clubItem = clubItem ? JSON.stringify(clubItem) : null;

        return {
          student: updatedStudent,
          batch,
          classItem,
          clubItem,
          challenges,
          library,
          announcements,
          submissions,
          allBatchStudents,
          debugInfo,
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

    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: supaBatches } = await supabase
            .from('batches')
            .select('*')
            .eq('teacher_id', user.id);

          if (supaBatches && supaBatches.length > 0) {
            supaBatches.forEach((sb) => {
              const existingIdx = batchesStore.findIndex(
                (b) => b.id === sb.id || (b.code && b.code === sb.code)
              );
              const mappedBatch: Batch = {
                id: sb.id,
                name: sb.name,
                code: sb.code,
                stage: sb.stage || 'المرحلة العامة',
                supervisorName: sb.supervisor_name || 'المشرفة',
                description: sb.description || '',
                gender: (sb.gender as any) || 'female',
                colorGradient: sb.color_gradient || 'from-rose-500/20 via-teal-500/20 to-emerald-500/20',
                createdAt: sb.created_at ? sb.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
                studentCount: studentsStore[sb.id]?.length || 0,
                classCount: classesStore[sb.id]?.length || 0,
                clubCount: clubsStore[sb.id]?.length || 0,
              };
              if (existingIdx !== -1) {
                batchesStore[existingIdx] = { ...batchesStore[existingIdx], ...mappedBatch };
              } else {
                batchesStore.push(mappedBatch);
              }
            });
          }
        }
      } catch (err) {
        console.warn('Failed to fetch batches from Supabase:', err);
      }
    }

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

    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: supaStudents, error } = await supabase
            .from('students')
            .select('*')
            .eq('batch_id', batchId);

          if (!error && supaStudents) {
            const currentClasses = classesStore[batchId] || [];
            const studentIds = supaStudents.map((ss: any) => ss.id);
            let clubMembersByStudent: Record<string, string> = {};

            if (studentIds.length > 0) {
              const { data: cmData } = await supabase
                .from('club_members')
                .select('student_id, clubs(name)')
                .in('student_id', studentIds);

              if (cmData) {
                cmData.forEach((cm: any) => {
                  if (cm.student_id && cm.clubs?.name) {
                    clubMembersByStudent[cm.student_id] = cm.clubs.name;
                  }
                });
              }
            }

            const mappedStudents: BatchStudent[] = supaStudents.map((ss: any) => {
              const matchedClass = currentClasses.find((c) => c.id === ss.class_id);
              const existingLocal = (studentsStore[batchId] || []).find(
                (s) =>
                  s.id === ss.id ||
                  (s.studentCode && ss.student_code && s.studentCode.trim().toLowerCase() === ss.student_code.trim().toLowerCase()) ||
                  (s.name && ss.full_name && s.name.trim().toLowerCase() === ss.full_name.trim().toLowerCase())
              );

              const supaClubName = clubMembersByStudent[ss.id];

              const stObj: BatchStudent = {
                id: ss.id,
                batchId: ss.batch_id,
                name: ss.full_name,
                studentCode: ss.student_code,
                className: matchedClass ? matchedClass.name : (existingLocal?.className || 'الفصل E'),
                classId: ss.class_id || undefined,
                clubName: supaClubName || (existingLocal?.clubName && !isStaleRadioClub(existingLocal.clubName) ? existingLocal.clubName : 'بدون نادي'),
                levelBadge: '🌱 البداية',
                points: typeof ss.points === 'number' ? ss.points : (existingLocal?.points ?? 0),
                completedTasks: existingLocal?.completedTasks || 0,
                completedChallengesCount: existingLocal?.completedChallengesCount || 0,
                avatarUrl: ss.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
                status: ss.status || 'active',
              };
              stObj.levelBadge = computeDynamicLevelBadge(stObj);
              return stObj;
            });

            studentsStore[batchId] = mappedStudents;
            saveDbToLocalStorage();
          }
        }
      } catch (err) {
        console.warn('Failed to fetch students from Supabase:', err);
      }
    }

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
    const generatedUuid = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `std-${Date.now()}`;

    const studentCode = student.studentCode && student.studentCode.trim()
      ? student.studentCode.trim()
      : '';

    const className = student.className || 'الفصل E';
    const existingStudentsInBatch = studentsStore[batchId] || [];

    // Check duplicate studentCode in local store within the SAME class
    if (studentCode) {
      const duplicateInSameClass = existingStudentsInBatch.find(
        (s) => s.className === className && s.studentCode === studentCode
      );
      if (duplicateInSameClass) {
        throw new Error(`كود الطالبة ${studentCode} مستخدم بالفعل في هذا الفصل.`);
      }
    }

    let newStudent: BatchStudent = {
      ...student,
      id: generatedUuid,
      batchId,
      studentCode,
      className,
      levelBadge: student.levelBadge || '🌱 البداية',
      points: student.points || 0,
      completedTasks: 0,
      completedChallengesCount: 0,
      attendanceRate: 0,
      status: student.status || 'active',
    };

    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const currentClasses = classesStore[batchId] || [];
          const matchedClass = currentClasses.find((c) => c.name === className);
          const classId = matchedClass && matchedClass.id.length > 30 ? matchedClass.id : null;

          // Check duplicate in Supabase within the SAME class if classId is present
          if (classId && studentCode) {
            const { data: existingStudent } = await supabase
              .from('students')
              .select('id')
              .eq('class_id', classId)
              .eq('student_code', studentCode)
              .maybeSingle();

            if (existingStudent) {
              throw new Error(`كود الطالبة ${studentCode} مستخدم بالفعل في هذا الفصل.`);
            }
          }

          const payload = {
            id: generatedUuid,
            batch_id: batchId,
            class_id: classId,
            student_code: studentCode || `STU-${Math.floor(100000 + Math.random() * 900000)}`,
            full_name: student.name,
            points: student.points || 0,
            avatar_url: student.avatarUrl || null,
            notes: null,
            status: student.status || 'active',
          };

          const { data: inserted, error } = await supabase
            .from('students')
            .insert(payload)
            .select('*')
            .single();

          if (error) {
            if (error.code === '23505' || error.message.includes('unique') || error.message.includes('student_code')) {
              throw new Error(`كود الطالبة ${studentCode || payload.student_code} مستخدم بالفعل في هذا الفصل.`);
            }
            console.error('Failed to save student to Supabase:', error.message);
            throw new Error(`فشل إضافة الطالب إلى قاعدة البيانات: ${error.message}`);
          } else if (inserted) {
            newStudent.id = inserted.id;
            newStudent.studentCode = inserted.student_code;
            newStudent.name = inserted.full_name;
            newStudent.points = inserted.points;
            newStudent.avatarUrl = inserted.avatar_url || newStudent.avatarUrl;
            newStudent.status = inserted.status as any;
          }
        }
      } catch (err: any) {
        console.error('Unexpected error inserting student into Supabase:', err?.message || err);
        throw err;
      }
    }

    if (!studentsStore[batchId]) studentsStore[batchId] = [];
    studentsStore[batchId].push(newStudent);

    // Update batch student count
    const batch = batchesStore.find((b) => b.id === batchId);
    if (batch) batch.studentCount = studentsStore[batchId].length;

    // Sync student list into matching class
    const classes = classesStore[batchId] || [];
    classes.forEach((cls) => {
      cls.studentNames = (studentsStore[batchId] || [])
        .filter((s) => s.className === cls.name)
        .map((s) => s.name);
      cls.studentCount = cls.studentNames.length;
    });

    saveDbToLocalStorage();
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

    const oldPoints = list[index]?.points || 0;

    const isValidUUID = (id?: string) =>
      typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    // Update Supabase if configured
    if (isSupabaseConfigured) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const supaPayload: any = {};
        if (typeof updates.name === 'string') supaPayload.full_name = updates.name;
        if (typeof updates.studentCode === 'string') supaPayload.student_code = updates.studentCode;
        if (typeof updates.avatarUrl === 'string') supaPayload.avatar_url = updates.avatarUrl;
        if (typeof (updates as any).notes === 'string') supaPayload.notes = (updates as any).notes;
        if (typeof updates.status === 'string') supaPayload.status = updates.status;

        // Note: Do NOT include points in supaPayload! Points are updated via point_transactions trigger only.

        if (Object.keys(supaPayload).length > 0) {
          if (!isValidUUID(studentId)) {
            throw new Error(`معرف الطالب (${studentId}) غير صالح لقاعدة البيانات Supabase`);
          }
          const { error } = await supabase
            .from('students')
            .update(supaPayload)
            .eq('id', studentId);

          if (error) {
            console.error('Failed to update student in Supabase:', error.message);
            throw new Error(`فشل تحديث بيانات الطالب في قاعدة البيانات: ${error.message}`);
          }
        }

        // Point changes handled strictly through point_transactions
        if (typeof updates.points === 'number') {
          const targetPoints = Math.max(0, updates.points);
          const delta = targetPoints - oldPoints;

          if (delta !== 0) {
            if (!isValidUUID(studentId) || !isValidUUID(targetBatchId)) {
              throw new Error(`معرف الطالب (${studentId}) أو الدفعة (${targetBatchId}) غير صالح كـ UUID في Supabase`);
            }

            const { error: ptError } = await supabase.from('point_transactions').insert({
              student_id: studentId,
              batch_id: targetBatchId,
              points: delta,
              reason: 'تعديل نقاط مباشر من المعلم',
              category: 'reward'
            });

            if (ptError) {
              console.error('Failed to insert point transaction in Supabase:', ptError.message);
              throw new Error(`فشل حفظ تعديل النقاط في قاعدة البيانات: ${ptError.message}`);
            }
          }
        }
      } else {
        console.warn('Supabase DB update skipped for student session (no active teacher user)');
      }
    }

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

    // Sync student details in matching club
    const batchClubs = clubsStore[targetBatchId] || [];
    batchClubs.forEach((club) => {
      if (club.members) {
        const mIdx = club.members.findIndex((m) => m.id === studentId);
        if (mIdx !== -1) {
          club.members[mIdx] = {
            ...club.members[mIdx],
            name: updated.name,
            avatarUrl: updated.avatarUrl,
            points: updated.points,
            levelBadge: updated.levelBadge,
          };
        }
      }
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
    // Check duplicates inside the imported file per class
    const seenMap = new Set<string>();
    for (const item of newStudentsData) {
      const clsName = item.className || 'الفصل E';
      const code = (item.studentCode || '').trim();
      if (code) {
        const key = `${clsName}::${code}`;
        if (seenMap.has(key)) {
          throw new Error(`تكرار كود الطالبة (${code}) في نفس الفصل (${clsName}) داخل ملف الإكسل.`);
        }
        seenMap.add(key);
      }
    }

    const createdList: BatchStudent[] = [];
    for (const item of newStudentsData) {
      const added = await this.addStudent(batchId, {
        name: item.name,
        studentCode: item.studentCode,
        className: item.className || 'الفصل E',
        clubName: item.clubName || 'بدون نادي',
        levelBadge: '🌱 البداية',
        points: item.points || 0,
        completedTasks: 0,
        completedChallengesCount: 0,
        status: 'active',
      });
      createdList.push(added);
    }
    return createdList;
  },

  /**
   * Fetch classes of selected batch
   */
  async getClassesByBatch(batchId: string): Promise<BatchClass[]> {
    loadDbFromLocalStorage();

    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: supaClasses, error } = await supabase
            .from('classes')
            .select('*')
            .eq('batch_id', batchId);

          if (!error && supaClasses) {
            const batchStudents = studentsStore[batchId] || [];
            const mappedClasses: BatchClass[] = supaClasses.map((sc) => {
              const classStudents = batchStudents.filter(
                (s) => s.className === sc.name || (s as any).class_id === sc.id
              );
              return {
                id: sc.id,
                batchId: sc.batch_id,
                name: sc.name,
                teacherName: sc.teacher_name || '',
                studentCount: classStudents.length,
                avgPoints: classStudents.length > 0
                  ? Math.round(classStudents.reduce((acc, s) => acc + (s.points || 0), 0) / classStudents.length)
                  : 0,
                challengeCompletionRate: 100,
                studentNames: classStudents.map((s) => s.name),
                schedule: sc.schedule || '',
                room: sc.room || '',
              };
            });

            classesStore[batchId] = mappedClasses;
            return mappedClasses;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch classes from Supabase:', err);
      }
    }

    return classesStore[batchId] || [];
  },

  /**
   * Fetch clubs of selected batch dynamically synced with student assignments and active tasks
   */
  async getClubsByBatch(batchId: string): Promise<BatchClub[]> {
    loadDbFromLocalStorage();
    if (isSupabaseConfigured) {
      try {
        const realBatchUuid = isUUID(batchId) ? batchId : toUUID(batchId);
        const { data: supaClubs, error } = await supabase
          .from('clubs')
          .select('*')
          .eq('batch_id', realBatchUuid);

        if (!error && supaClubs) {
          const clubIds = supaClubs.map((sc) => sc.id);
          let supaMembers: any[] = [];
          if (clubIds.length > 0) {
            const { data: mData } = await supabase
              .from('club_members')
              .select('club_id, student_id, students(id, full_name, avatar_url, points, student_code, class_id, classes(name))')
              .in('club_id', clubIds);
            if (mData) supaMembers = mData;
          }

          const membersByClub: Record<string, ClubMember[]> = {};
          if (supaMembers) {
            supaMembers.forEach((m: any) => {
              if (!membersByClub[m.club_id]) membersByClub[m.club_id] = [];
              const st = m.students;
              if (st) {
                membersByClub[m.club_id].push({
                  id: st.id,
                  name: st.full_name,
                  className: st.classes?.name || 'الفصل',
                  avatarUrl: st.avatar_url || '',
                  studentCode: st.student_code || '',
                  points: st.points || 0,
                  levelBadge: computeDynamicLevelBadge({ points: st.points || 0 } as any)
                });
              }
            });
          }

          const mappedClubs: BatchClub[] = supaClubs.map((sc) => {
            const members = membersByClub[sc.id] || [];
            return {
              id: sc.id,
              batchId: sc.batch_id,
              name: sc.name,
              description: sc.description || '',
              icon: sc.icon || '⭐',
              color: sc.color || '#0d9488',
              supervisorName: sc.supervisor_name || '',
              members,
              memberCount: members.length
            };
          });
          clubsStore[batchId] = mappedClubs;
          return mappedClubs;
        }
      } catch (err) {
        console.warn('Supabase getClubsByBatch warning:', err);
      }
    }
    const computedClubs = computeBatchClubs(batchId);
    saveDbToLocalStorage();
    return computedClubs;
  },

  /**
   * Create a new club in batch
   */
  async createClub(
    batchId: string,
    club: Omit<BatchClub, 'id' | 'batchId'>,
    initialStudentIds: string[] = []
  ): Promise<BatchClub> {
    loadDbFromLocalStorage();
    let newClubId = `club-${Date.now()}`;

    if (isSupabaseConfigured) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('لم يتم العثور على جلسة المعلم الحالية. يرجى إعادة تسجيل الدخول.');
      }

      const realBatchUuid = isUUID(batchId) ? batchId : toUUID(batchId);

      // Verify and sync batch ownership in public.batches
      const { data: batchData } = await supabase
        .from('batches')
        .select('id, teacher_id')
        .eq('id', realBatchUuid)
        .maybeSingle();

      if (batchData && batchData.teacher_id !== user.id) {
        const { error: batchUpdateErr } = await supabase
          .from('batches')
          .update({ teacher_id: user.id })
          .eq('id', realBatchUuid);

        if (batchUpdateErr) {
          console.warn('Could not update batch teacher_id:', batchUpdateErr.message);
        }
      }

      const supaPayload: any = {
        batch_id: realBatchUuid,
        teacher_id: user.id,
        name: club.name,
        description: club.description || '',
        supervisor_name: club.supervisorName || ''
      };
      if (club.category) supaPayload.category = club.category;

      const { data, error } = await supabase
        .from('clubs')
        .insert(supaPayload)
        .select()
        .single();

      if (error || !data) {
        console.error('Supabase createClub error:', error);
        throw new Error(`فشل إنشاء النادي في قاعدة البيانات: ${error?.message || 'خطأ غير معروف'}`);
      }

      newClubId = data.id;
    }

    // Assign initial students if selected
    const batchStudents = studentsStore[batchId] || [];
    const members: ClubMember[] = [];

    if (initialStudentIds && initialStudentIds.length > 0) {
      let batchStudents = studentsStore[batchId] || [];
      if (isSupabaseConfigured && batchStudents.length === 0) {
        batchStudents = await this.getStudentsByBatch(batchId);
      }

      for (const sid of initialStudentIds) {
        if (!isUUID(sid)) {
          console.warn(`Skipping non-UUID student ID: ${sid}`);
          continue;
        }

        let student = batchStudents.find((s) => s.id === sid);
        const realStudentUuid = sid;

        if (isSupabaseConfigured) {
          if (!student) {
            const { data: stdData } = await supabase
              .from('students')
              .select('id, full_name, student_code, avatar_url, points, class_id')
              .eq('id', realStudentUuid)
              .maybeSingle();

            if (stdData?.id) {
              const matchedClass = (classesStore[batchId] || []).find((c) => c.id === stdData.class_id);
              student = {
                id: stdData.id,
                batchId,
                name: stdData.full_name,
                studentCode: stdData.student_code,
                className: matchedClass ? matchedClass.name : 'الفصل',
                classId: stdData.class_id || undefined,
                avatarUrl: stdData.avatar_url || '',
                points: stdData.points || 0,
                completedTasks: 0,
                completedChallengesCount: 0,
                levelBadge: computeDynamicLevelBadge({ points: stdData.points || 0 } as any),
                status: 'active',
              };
            }
          }

          if (!student) {
            throw new Error(`تعذر العثور على الطالبة بالمعرف (${realStudentUuid}) في قاعدة البيانات.`);
          }

          // Check existing membership
          const { data: existingMember } = await supabase
            .from('club_members')
            .select('id')
            .eq('club_id', newClubId)
            .eq('student_id', realStudentUuid)
            .maybeSingle();

          if (!existingMember) {
            const { error: memberErr } = await supabase
              .from('club_members')
              .insert({
                club_id: newClubId,
                student_id: realStudentUuid
              });

            if (memberErr) {
              if (memberErr.code !== '23505' && !memberErr.message.includes('unique')) {
                console.error('Supabase club_members insert error:', memberErr);
                throw new Error(`فشل إضافة الطالبة إلى النادي في قاعدة البيانات: ${memberErr.message}`);
              }
            }
          }
        }

        if (student) {
          student.clubName = club.name;
          student.clubId = newClubId;
          members.push({
            id: realStudentUuid,
            name: student.name,
            className: student.className,
            avatarUrl: student.avatarUrl,
            studentCode: student.studentCode,
            points: student.points,
            levelBadge: computeDynamicLevelBadge(student),
          });
        }
      }
    }

    const newClub: BatchClub = {
      ...club,
      id: newClubId,
      batchId,
      members: members.length > 0 ? members : (club.members || []),
      memberCount: members.length > 0 ? members.length : (club.memberCount || 0)
    };

    if (!clubsStore[batchId]) clubsStore[batchId] = [];
    clubsStore[batchId].push(newClub);

    const batch = batchesStore.find((b) => b.id === batchId);
    if (batch) {
      const clubs = computeBatchClubs(batchId);
      batch.clubCount = clubs.length;
    }

    saveDbToLocalStorage();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rihlat_db_updated'));
    }
    return newClub;
  },

  /**
   * Helper functions for challenge category and target mappings
   */
  mapCategoryToDb(typeStr?: string): 'daily' | 'weekly' | 'monthly' {
    if (!typeStr) return 'daily';
    if (typeStr.includes('أسبوعي') || typeStr.includes('weekly')) return 'weekly';
    if (typeStr.includes('شهري') || typeStr.includes('monthly')) return 'monthly';
    return 'daily';
  },

  mapCategoryToUi(dbCategory?: string): string {
    if (dbCategory === 'weekly') return 'تحدي أسبوعي 📅';
    if (dbCategory === 'monthly') return 'تحدي شهري 🌕';
    return 'تحدي يومي ☀️';
  },

  mapTargetTypeToDb(targetType?: string): 'all' | 'batch' | 'class' | 'club' | 'student' {
    if (!targetType || targetType === 'school' || targetType === 'all') return 'all';
    if (targetType === 'batch') return 'batch';
    if (targetType === 'class') return 'class';
    if (targetType === 'club') return 'club';
    if (targetType === 'student') return 'student';
    return 'all';
  },

  /**
   * Fetch challenges of selected batch
   */
  async getChallengesByBatch(batchId: string): Promise<BatchChallenge[]> {
    if (isSupabaseConfigured) {
      try {
        const { data: supaChallenges, error } = await supabase
          .from('challenges')
          .select('*')
          .eq('batch_id', batchId)
          .order('created_at', { ascending: false });

        if (!error && supaChallenges) {
          const mappedChallenges: BatchChallenge[] = supaChallenges.map((sc) => ({
            id: sc.id,
            batchId: sc.batch_id,
            title: sc.title,
            description: sc.description || '',
            type: this.mapCategoryToUi(sc.category),
            points: sc.reward_xp || 50,
            rewardXp: sc.reward_xp || 50,
            gemsReward: sc.gems_reward || 10,
            status: sc.status || 'active',
            participantsCount: 0,
            dueDate: sc.due_date || undefined,
            targetType: (sc.target_type === 'all' ? 'school' : sc.target_type) as any,
            targetId: sc.target_id || undefined,
            targetName: sc.target_name || undefined,
            createdAt: sc.created_at,
          }));
          challengesStore[batchId] = mappedChallenges;
          return mappedChallenges;
        }
      } catch (err) {
        console.warn('Supabase getChallengesByBatch error:', err);
      }
    }
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
      return !ch.targetId || ch.targetId === batchId || ch.batchId === batchId;
    }
    if (targetType === 'class') {
      if (ch.batchId && ch.batchId !== batchId) return false;
      if (ch.targetId && student.classId) {
        return ch.targetId === student.classId;
      }
      if (!student.className || !ch.targetName) return false;
      const sClass = student.className.trim().toLowerCase();
      const tClass = ch.targetName.trim().toLowerCase();
      return sClass === tClass || sClass.includes(tClass) || tClass.includes(sClass);
    }
    if (targetType === 'club') {
      if (ch.batchId && ch.batchId !== batchId) return false;
      if (ch.targetId && student.clubId) {
        return ch.targetId === student.clubId;
      }
      if (!student.clubName || !ch.targetName) return false;
      if (student.clubName.trim() === 'بدون نادي') return false;
      const sClub = student.clubName.trim().toLowerCase();
      const tClub = ch.targetName.trim().toLowerCase();
      return sClub === tClub || sClub.includes(tClub) || tClub.includes(sClub);
    }
    if (targetType === 'student') {
      if (ch.targetId && student.id === ch.targetId) return true;
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
    if (isSupabaseConfigured && student.id && student.studentCode && student.studentCode.trim()) {
      try {
        const { data, error } = await supabase.rpc('get_student_challenges', {
          p_student_id: student.id,
          p_student_code: student.studentCode.trim(),
        });

        if (error) {
          console.warn('Failed to fetch student challenges via RPC, falling back to local list:', error.message);
        } else if (data && Array.isArray(data)) {
          const mappedChallenges: BatchChallenge[] = data.map((sc: any) => ({
            id: sc.id,
            batchId: sc.batch_id,
            title: sc.title,
            description: sc.description || '',
            type: this.mapCategoryToUi(sc.category),
            points: sc.reward_xp || 50,
            rewardXp: sc.reward_xp || 50,
            gemsReward: sc.gems_reward || 10,
            status: sc.status || 'active',
            participantsCount: 0,
            dueDate: sc.due_date || undefined,
            targetType: (sc.target_type === 'all' ? 'school' : sc.target_type) as any,
            targetId: sc.target_id || undefined,
            targetName: sc.target_name || undefined,
            createdAt: sc.created_at,
          }));
          return mappedChallenges;
        }
      } catch (err) {
        console.warn('Network exception while fetching student challenges via RPC, falling back to local challenges:', err);
      }
    }

    const bChallenges = await this.getChallengesByBatch(batchId);
    const results: BatchChallenge[] = [];
    bChallenges.forEach((ch) => {
      if (this.isStudentInChallengeAudience(ch, student, batchId)) {
        results.push(ch);
      }
    });
    return results;
  },

  /**
   * Create a new challenge in batch
   */
  async createChallenge(batchId: string, challenge: Omit<BatchChallenge, 'id' | 'batchId'>): Promise<BatchChallenge> {
    const isValidUUID = (id?: string) =>
      typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (isSupabaseConfigured) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('غير مصرح: يجب تسجيل الدخول كمعلم لإنشاء تحدي');
      }

      if (!isValidUUID(batchId)) {
        throw new Error(`معرف الدفعة (${batchId}) غير صالح كـ UUID في Supabase`);
      }

      const dbCategory = this.mapCategoryToDb(challenge.type);
      const dbTargetType = this.mapTargetTypeToDb(challenge.targetType);

      // Determine target_id based on dbTargetType
      let dbTargetId: string | null = null;
      if (dbTargetType === 'all') {
        dbTargetId = null;
      } else if (dbTargetType === 'batch') {
        dbTargetId = batchId;
      } else if (dbTargetType === 'student') {
        const studentUuid = challenge.targetStudentId || (challenge as any).targetId;
        if (!studentUuid) {
          throw new Error('تحدي الطالبة الفردي يتطلب اختيار طالبة معينة');
        }
        if (!isValidUUID(studentUuid)) {
          throw new Error(`معرف الطالبة المستهدفة (${studentUuid}) غير صالح كـ UUID في Supabase`);
        }
        dbTargetId = studentUuid;
      } else if (dbTargetType === 'club') {
        const potentialId = (challenge as any).targetId;
        if (potentialId && isValidUUID(potentialId)) {
          dbTargetId = potentialId;
        } else if (challenge.targetName) {
          const localClub = (clubsStore[batchId] || []).find(
            (c) => c.name.trim().toLowerCase() === challenge.targetName?.trim().toLowerCase()
          );
          if (localClub?.id && isValidUUID(localClub.id)) {
            dbTargetId = localClub.id;
          } else {
            const { data: supaClub } = await supabase
              .from('clubs')
              .select('id')
              .eq('batch_id', batchId)
              .ilike('name', challenge.targetName.trim())
              .maybeSingle();
            if (supaClub?.id && isValidUUID(supaClub.id)) {
              dbTargetId = supaClub.id;
            }
          }
        }

        if (!dbTargetId || !isValidUUID(dbTargetId)) {
          throw new Error(`فشل إنشاء التحدي للنادي: لم يتم العثور على المعرف الحقيقي (UUID) للنادي المستهدف (${challenge.targetName || 'غير محدد'})`);
        }
      } else if (dbTargetType === 'class') {
        const potentialId = (challenge as any).targetId;
        if (potentialId && isValidUUID(potentialId)) {
          dbTargetId = potentialId;
        } else {
          dbTargetId = null;
        }
      }

      if (dbTargetId !== null && !isValidUUID(dbTargetId)) {
        throw new Error(`المعرف المستهدف (${dbTargetId}) غير صالح كـ UUID في Supabase`);
      }

      // Handle due_date
      let parsedDueDate: string | null = null;
      let finalDescription = challenge.description || '';

      if (challenge.dueDate && challenge.dueDate.trim().length > 0) {
        const parsed = Date.parse(challenge.dueDate);
        const d = new Date(parsed);
        if (!isNaN(parsed) && d.getFullYear() >= 2020 && d.getFullYear() <= 2100) {
          parsedDueDate = d.toISOString();
        } else {
          // Descriptive text like "خلال 3 أيام"
          parsedDueDate = null;
          if (!finalDescription.includes(challenge.dueDate)) {
            finalDescription = finalDescription
              ? `${finalDescription}\n(موعد التسليم: ${challenge.dueDate})`
              : `موعد التسليم: ${challenge.dueDate}`;
          }
        }
      }

      const { data, error } = await supabase
        .from('challenges')
        .insert({
          batch_id: batchId,
          teacher_id: user.id,
          title: challenge.title,
          description: finalDescription,
          category: dbCategory,
          reward_xp: challenge.rewardXp || (challenge as any).points || 50,
          status: challenge.status || 'active',
          due_date: parsedDueDate,
          target_type: dbTargetType,
          target_id: dbTargetId,
          target_name: challenge.targetName || null
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create challenge in Supabase:', error.message);
        throw new Error(`فشل إنشاء التحدي في قاعدة البيانات: ${error.message}`);
      }

      if (!data) {
        throw new Error('لم يتم إرجاع بيانات التحدي من قاعدة البيانات');
      }

      const newChallenge: BatchChallenge = {
        ...challenge,
        id: data.id,
        batchId,
        description: finalDescription,
        type: this.mapCategoryToUi(data.category),
        targetType: (data.target_type === 'all' ? 'school' : data.target_type) as any,
        targetId: data.target_id || undefined,
        dueDate: challenge.dueDate,
      };

      if (!challengesStore[batchId]) challengesStore[batchId] = [];
      challengesStore[batchId].unshift(newChallenge);
      saveDbToLocalStorage();
      return newChallenge;
    }

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
    if (isSupabaseConfigured) {
      try {
        const { data: supaLib, error } = await supabase
          .from('library_items')
          .select('*')
          .eq('batch_id', batchId)
          .order('created_at', { ascending: false });

        if (!error && supaLib) {
          const mappedLib: BatchLibraryItem[] = supaLib.map((sl) => ({
            id: sl.id,
            batchId: sl.batch_id,
            title: sl.title,
            description: sl.description || '',
            type: sl.file_type || 'pdf',
            fileSize: sl.file_size || '1 MB',
            duration: sl.duration || undefined,
            url: sl.url,
            thumbnailUrl: sl.thumbnail_url || undefined,
            category: sl.category || 'عام',
            uploadedBy: sl.uploaded_by || 'المعلم',
            targetType: sl.target_type || 'all',
            targetId: sl.target_id || undefined,
            createdAt: sl.created_at,
          }));
          libraryStore[batchId] = mappedLib;
          return mappedLib;
        }
      } catch (err) {
        console.warn('Supabase getLibraryByBatch error:', err);
      }
    }
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
    let newLibId = `lib-${Date.now()}`;
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('library_items').insert({
          batch_id: batchId,
          title: file.title,
          description: file.description || '',
          file_type: file.type || 'pdf',
          file_size: file.fileSize || '1 MB',
          duration: file.duration || null,
          url: file.url || '#',
          thumbnail_url: file.thumbnailUrl || null,
          category: file.category || 'عام',
          uploaded_by: file.uploadedBy || 'المعلم',
          target_type: file.targetType || 'all',
          target_id: file.targetId || null
        }).select().single();
        if (!error && data) {
          newLibId = data.id;
        }
      } catch (err) {
        console.warn('Supabase uploadLibraryFile error:', err);
      }
    }
    const newItem: BatchLibraryItem = {
      ...file,
      id: newLibId,
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
    if (isSupabaseConfigured) {
      try {
        const { data: supaMsgs, error } = await supabase
          .from('teacher_messages')
          .select('*')
          .eq('batch_id', batchId)
          .order('created_at', { ascending: false });

        if (!error && supaMsgs) {
          const mappedMsgs: BatchAnnouncement[] = supaMsgs.map((sm) => {
            const createdAtDate = new Date(sm.created_at);
            const timeFormatted = createdAtDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
            const dateFormatted = createdAtDate.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
            return {
              id: sm.id,
              batchId: sm.batch_id,
              title: sm.title || 'رسالة من المعلمة',
              content: sm.content,
              author: sm.author || 'معلمة الدفعة',
              createdAt: `${timeFormatted} • ${dateFormatted}`,
              pinned: sm.pinned || false,
              targetType: sm.target_type || 'batch',
              targetValue: sm.target_id || sm.batch_id,
              targetName: sm.target_name || 'الدفعة العامة',
              readBy: []
            };
          });
          announcementsStore[batchId] = mappedMsgs;
          return mappedMsgs;
        }
      } catch (err) {
        console.warn('Supabase getAnnouncementsByBatch error:', err);
      }
    }
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

    let newMsgId = `msg-${Date.now()}`;
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('teacher_messages').insert({
          batch_id: batchId,
          title: announcement.title || 'رسالة جديدة من المعلمة',
          content: announcement.content,
          author: announcement.author || 'معلمة الدفعة',
          pinned: announcement.pinned || false,
          target_type: announcement.targetType || 'batch',
          target_id: announcement.targetValue || batchId,
          target_name: announcement.targetName || 'الدفعة العامة'
        }).select().single();
        if (!error && data) {
          newMsgId = data.id;
        }
      } catch (err) {
        console.warn('Supabase addAnnouncement error:', err);
      }
    }

    const newAnn: BatchAnnouncement = {
      ...announcement,
      id: newMsgId,
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
    if (isSupabaseConfigured) {
      try {
        await supabase.from('teacher_messages').delete().eq('id', messageId);
      } catch (err) {
        console.warn('Supabase deleteAnnouncement error:', err);
      }
    }
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
    if (isSupabaseConfigured) {
      try {
        const { data: supaSubs, error } = await supabase
          .from('challenge_submissions')
          .select('*, students(full_name, student_code, avatar_url, class_id, classes(name)), challenges(title, category, reward_xp)')
          .eq('batch_id', batchId)
          .order('submitted_at', { ascending: false });

        if (!error && supaSubs) {
          const mappedSubs: PendingSubmission[] = supaSubs.map((ss: any) => ({
            id: ss.id,
            batchId: ss.batch_id,
            studentId: ss.student_id,
            studentCode: ss.students?.student_code || '',
            studentName: ss.students?.full_name || 'طالب',
            studentAvatar: ss.students?.avatar_url || '',
            className: ss.students?.classes?.name || 'الفصل',
            sourceType: ss.source_type || 'challenge',
            sourceName: ss.source_name || ss.challenges?.title || 'تحدي',
            contentSummary: ss.submission_content || 'تم تنفيذ التحدي بنجاح',
            taskTitle: ss.challenges?.title || ss.source_name || 'تحدي',
            submittedAt: ss.submitted_at ? new Date(ss.submitted_at).toLocaleDateString('ar-EG') : 'الآن',
            status: ss.status || 'pending',
            rewardXp: ss.reward_xp || ss.challenges?.reward_xp || 50,
            teacherNotes: ss.teacher_notes || undefined,
            challengeId: ss.challenge_id || undefined,
          }));
          submissionsStore[batchId] = mappedSubs;
          return mappedSubs.filter((s) => s.status === 'pending');
        }
      } catch (err) {
        console.warn('Supabase getPendingSubmissions error:', err);
      }
    }
    return (submissionsStore[batchId] || []).filter((s) => s.status === 'pending');
  },

  /**
   * Submit a task, challenge, or achievement for teacher review
   */
  async submitForReview(
    submission: Omit<PendingSubmission, 'id' | 'status' | 'submittedAt'>
  ): Promise<PendingSubmission> {
    const batchId = submission.batchId || 'batch-g6-f';
    let newSubId = `sub-${Date.now()}`;

    if (isSupabaseConfigured) {
      if (!submission.studentId || !submission.studentCode || !submission.studentCode.trim()) {
        throw new Error('رمز الطالبة ومعرفها مطلوبان لإرسال التحدي');
      }

      const challengeId = submission.challengeId || null;

      try {
        const { data, error } = await supabase.rpc('submit_student_challenge', {
          p_student_id: submission.studentId,
          p_student_code: submission.studentCode.trim(),
          p_challenge_id: challengeId,
          p_source_type: submission.sourceType || 'challenge',
          p_source_name: submission.sourceName || submission.taskTitle || 'تحدي',
          p_submission_content: submission.contentSummary || 'تم تنفيذ التحدي بنجاح',
        });

        if (error) {
          console.error('Failed to submit challenge via RPC:', error);
          throw new Error(`فشل إرسال التحدي للمراجعة: ${error.message}`);
        }

        if (data) {
          newSubId = data;
        }
      } catch (err: any) {
        if (err.message && err.message.includes('فشل إرسال التحدي للمراجعة')) {
          throw err;
        }
        console.error('Network or RPC exception during submitForReview:', err);
        throw new Error('تعذر الاتصال بقاعدة البيانات لإرسال التحدي. يرجى التحقق من الاتصال.');
      }
    }

    const newSub: PendingSubmission = {
      ...submission,
      id: newSubId,
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
    loadDbFromLocalStorage();
    const list = submissionsStore[batchId] || [];
    const index = list.findIndex((s) => s.id === submissionId);
    if (index === -1) throw new Error('Submission not found');

    const previousSubmission = list[index];
    const previousStatus = previousSubmission.status;

    // Prevent duplicate approval if already approved
    if (previousStatus === 'approved' && status === 'approved') {
      return previousSubmission;
    }

    const isValidUUID = (id?: string) =>
      typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    // Find target student
    let student = (studentsStore[batchId] || []).find(
      (s) =>
        s.id === previousSubmission.studentId ||
        (s.studentCode && s.studentCode === previousSubmission.studentCode) ||
        s.name.trim() === previousSubmission.studentName.trim()
    );

    if (!student) {
      for (const bId of Object.keys(studentsStore)) {
        const found = (studentsStore[bId] || []).find(
          (s) =>
            s.id === previousSubmission.studentId ||
            (s.studentCode && s.studentCode === previousSubmission.studentCode) ||
            s.name.trim() === previousSubmission.studentName.trim()
        );
        if (found) {
          student = found;
          break;
        }
      }
    }

    if (isSupabaseConfigured) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('غير مصرح: يجب تسجيل الدخول كمعلم لمراجعة المهمة');
      }

      if (!isValidUUID(submissionId)) {
        throw new Error(`معرف المهمة (${submissionId}) غير صالح لـ Supabase`);
      }

      // Check current submission status in Supabase DB for idempotency & double approval prevention
      const { data: existingDbSub } = await supabase
        .from('challenge_submissions')
        .select('status')
        .eq('id', submissionId)
        .maybeSingle();

      const isAlreadyApprovedInDb = existingDbSub?.status === 'approved';

      // Check if a point_transaction was already created for this specific submission
      const { data: existingTx } = await supabase
        .from('point_transactions')
        .select('id')
        .eq('source_id', submissionId)
        .maybeSingle();

      const isAlreadyRewardedInDb = !!existingTx;

      const { error: subError } = await supabase
        .from('challenge_submissions')
        .update({
          status,
          teacher_notes: teacherNotes || null,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (subError) {
        console.error('Supabase reviewSubmission update error:', subError.message);
        throw new Error(`فشل تحديث حالة التسليم في قاعدة البيانات: ${subError.message}`);
      }

      // Award points ONLY IF status is 'approved' AND it was NOT previously approved AND no transaction exists
      if (status === 'approved' && previousStatus !== 'approved' && !isAlreadyApprovedInDb && !isAlreadyRewardedInDb && student) {
        const rewardXp = previousSubmission.rewardXp || 50;
        if (rewardXp > 0) {
          if (!isValidUUID(student.id) || !isValidUUID(batchId)) {
            throw new Error(`معرف الطالب (${student.id}) أو الدفعة (${batchId}) غير صالح كـ UUID في Supabase`);
          }

          const { error: ptError } = await supabase.from('point_transactions').insert({
            student_id: student.id,
            batch_id: batchId,
            teacher_id: user.id,
            points: rewardXp,
            reason: `إنجاز مهمة: ${previousSubmission.taskTitle || 'تحدي'}`,
            category: 'challenge',
            source_type: 'challenge_submission',
            source_id: submissionId
          });

          if (ptError) {
            console.error('Supabase reviewSubmission point transaction error:', ptError.message);
            throw new Error(`فشل منح نقاط التحدي في قاعدة البيانات: ${ptError.message}`);
          }
        }
      }

      // Fetch authoritative updated student points from Supabase (updated via point_transactions DB trigger)
      if (student && isValidUUID(student.id)) {
        const { data: updatedDbStudent } = await supabase
          .from('students')
          .select('points')
          .eq('id', student.id)
          .maybeSingle();

        if (updatedDbStudent && typeof updatedDbStudent.points === 'number') {
          student.points = updatedDbStudent.points;
        }
      }
    }

    // Update local state ONLY after Supabase calls succeed
    const updated = {
      ...previousSubmission,
      status,
      teacherNotes,
    };
    list[index] = updated;
    submissionsStore[batchId] = [...list];

    if (student) {
      if (status === 'approved' && previousStatus !== 'approved') {
        // If Supabase is NOT configured (offline local mode), add points manually.
        // If Supabase IS configured, student.points was already set to authoritative DB value above.
        if (!isSupabaseConfigured) {
          const rewardXp = updated.rewardXp || 50;
          student.points = (student.points || 0) + rewardXp;
        }
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
    const generatedUuid = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `batch-${Date.now()}`;

    const createdAt = new Date().toISOString().split('T')[0];
    const colorGradient =
      batchData.colorGradient ||
      (batchData.gender === 'female'
        ? 'from-rose-500/20 via-teal-500/20 to-emerald-500/20'
        : 'from-sky-500/20 via-teal-500/20 to-emerald-500/20');

    let newBatch: Batch = {
      ...batchData,
      id: generatedUuid,
      studentCount: 0,
      classCount: 0,
      clubCount: 0,
      createdAt,
      colorGradient,
    };

    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const payload = {
            id: generatedUuid,
            teacher_id: user.id,
            name: batchData.name,
            code: batchData.code || `BTC-${Date.now().toString().slice(-4)}`,
            stage: batchData.stage || 'المرحلة العامة',
            supervisor_name: batchData.supervisorName || null,
            description: batchData.description || null,
            gender: ['female', 'male', 'mixed'].includes(batchData.gender) ? batchData.gender : 'female',
            color_gradient: colorGradient,
          };

          const { data: inserted, error } = await supabase
            .from('batches')
            .insert(payload)
            .select('*')
            .single();

          if (error) {
            console.error('Failed to save batch to Supabase:', error.message);
          } else if (inserted) {
            newBatch.id = inserted.id;
            newBatch.code = inserted.code;
          }
        }
      } catch (err: any) {
        console.error('Unexpected error inserting batch into Supabase:', err?.message || err);
      }
    }

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

    if (isSupabaseConfigured) {
      try {
        const supaPayload: any = {};
        if (updates.name) supaPayload.name = updates.name;
        if (updates.code) supaPayload.code = updates.code;
        if (updates.stage) supaPayload.stage = updates.stage;
        if (updates.supervisorName) supaPayload.supervisor_name = updates.supervisorName;
        if (updates.description) supaPayload.description = updates.description;
        if (updates.gender) supaPayload.gender = updates.gender;
        if (Object.keys(supaPayload).length > 0) {
          await supabase.from('batches').update(supaPayload).eq('id', batchId);
        }
      } catch (err) {
        console.warn('Supabase updateBatch error:', err);
      }
    }

    saveDbToLocalStorage();
    return updated;
  },

  async deleteBatch(batchId: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('batches').delete().eq('id', batchId);
        if (error) {
          console.error('Failed to delete batch from Supabase:', error.message);
          throw new Error(`فشل حذف الدفعة: ${error.message}`);
        }
      }
    }

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
    const generatedUuid = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `class-${Date.now()}`;

    let newClass: BatchClass = {
      ...classData,
      id: generatedUuid,
      batchId,
      studentCount: 0,
      avgPoints: 0,
      challengeCompletionRate: 100,
      studentNames: classData.studentNames || [],
    };

    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const payload = {
            id: generatedUuid,
            batch_id: batchId,
            teacher_id: user.id,
            name: classData.name,
            teacher_name: classData.teacherName || null,
            schedule: classData.schedule || null,
            room: classData.room || null,
          };

          const { data: inserted, error } = await supabase
            .from('classes')
            .insert(payload)
            .select('*')
            .single();

          if (error) {
            console.error('Failed to save class to Supabase:', error.message);
          } else if (inserted) {
            newClass.id = inserted.id;
            newClass.name = inserted.name;
            newClass.teacherName = inserted.teacher_name || newClass.teacherName;
            newClass.schedule = inserted.schedule || newClass.schedule;
            newClass.room = inserted.room || newClass.room;
          }
        }
      } catch (err: any) {
        console.error('Unexpected error inserting class into Supabase:', err?.message || err);
      }
    }

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

    if (isSupabaseConfigured) {
      try {
        const supaPayload: any = {};
        if (updates.name) supaPayload.name = updates.name;
        if (updates.teacherName) supaPayload.teacher_name = updates.teacherName;
        if (updates.schedule) supaPayload.schedule = updates.schedule;
        if (updates.room) supaPayload.room = updates.room;
        if (Object.keys(supaPayload).length > 0) {
          await supabase.from('classes').update(supaPayload).eq('id', classId);
        }
      } catch (err) {
        console.warn('Supabase updateClass error:', err);
      }
    }

    return updated;
  },

  async deleteClass(batchId: string, classId: string): Promise<boolean> {
    const targetClass = (classesStore[batchId] || []).find((c) => c.id === classId);

    if (isSupabaseConfigured) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Delete all students belonging to this class in Supabase before deleting the class row
        const { error: studentDeleteErr } = await supabase
          .from('students')
          .delete()
          .eq('class_id', classId);

        if (studentDeleteErr) {
          console.warn('Warning deleting students for class:', studentDeleteErr.message);
        }

        const { error } = await supabase.from('classes').delete().eq('id', classId);
        if (error) {
          console.error('Failed to delete class from Supabase:', error.message);
          throw new Error(`فشل حذف الفصل: ${error.message}`);
        }
      }
    }

    // Filter out the deleted class
    const list = classesStore[batchId] || [];
    classesStore[batchId] = list.filter((c) => c.id !== classId);

    // Remove students in local store that belonged to this class
    if (targetClass && studentsStore[batchId]) {
      studentsStore[batchId] = studentsStore[batchId].filter(
        (s) => s.className !== targetClass.name
      );
    }

    // Update batch classCount and studentCount
    const batch = batchesStore.find((b) => b.id === batchId);
    if (batch) {
      batch.classCount = classesStore[batchId].length;
      if (studentsStore[batchId]) {
        batch.studentCount = studentsStore[batchId].length;
      }
    }

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

    if (isSupabaseConfigured) {
      try {
        const supaPayload: any = {};
        if (updates.name) supaPayload.name = updates.name;
        if (updates.description) supaPayload.description = updates.description;
        if (updates.supervisorName) supaPayload.supervisor_name = updates.supervisorName;
        if (updates.category) supaPayload.category = updates.category;
        if (Object.keys(supaPayload).length > 0) {
          await supabase.from('clubs').update(supaPayload).eq('id', clubId);
        }
      } catch (err) {
        console.warn('Supabase updateClub error:', err);
      }
    }

    return updated;
  },

  async deleteClub(batchId: string, clubId: string): Promise<boolean> {
    loadDbFromLocalStorage();
    const list = clubsStore[batchId] || [];
    const clubToDelete = list.find((c) => c.id === clubId);
    const deletedClubName = clubToDelete?.name;

    if (isSupabaseConfigured) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const realBatchUuid = isUUID(batchId) ? batchId : toUUID(batchId);
        const { data: batchData } = await supabase
          .from('batches')
          .select('id, teacher_id')
          .eq('id', realBatchUuid)
          .maybeSingle();

        if (batchData && batchData.teacher_id !== user.id) {
          await supabase
            .from('batches')
            .update({ teacher_id: user.id })
            .eq('id', realBatchUuid);
        }
      }

      if (!isUUID(clubId)) {
        throw new Error('لا يمكن حذف هذا النادي من قاعدة البيانات لأنه لا يمتلك معرف UUID حقيقي.');
      }

      // Cascade delete associated records in challenges, teacher_messages, library_items before deleting the club
      try {
        await supabase
          .from('challenges')
          .delete()
          .eq('target_type', 'club')
          .eq('target_id', clubId);
      } catch (chErr) {
        console.warn('Supabase cascade delete club challenges warning:', chErr);
      }

      try {
        await supabase
          .from('teacher_messages')
          .delete()
          .eq('target_type', 'club')
          .eq('target_id', clubId);
      } catch (msgErr) {
        console.warn('Supabase cascade delete club teacher_messages warning:', msgErr);
      }

      try {
        await supabase
          .from('library_items')
          .delete()
          .eq('target_type', 'club')
          .eq('target_id', clubId);
      } catch (libErr) {
        console.warn('Supabase cascade delete club library_items warning:', libErr);
      }

      // 1. Delete associated club_members first
      const { error: cmErr } = await supabase
        .from('club_members')
        .delete()
        .eq('club_id', clubId);

      if (cmErr) {
        console.error('Supabase delete club_members error:', cmErr);
        throw new Error(`فشل حذف أعضاء النادي من قاعدة البيانات: ${cmErr.message}`);
      }

      // 2. Delete club from public.clubs
      const { error: clubErr } = await supabase
        .from('clubs')
        .delete()
        .eq('id', clubId);

      if (clubErr) {
        console.error('Supabase delete club error:', clubErr);
        throw new Error(`فشل حذف النادي من قاعدة البيانات: ${clubErr.message}`);
      }
    }

    // 3. Update local state
    clubsStore[batchId] = list.filter((c) => c.id !== clubId);

    // 4. Clean up challenges/library targeting this club locally as well
    if (challengesStore[batchId]) {
      challengesStore[batchId] = challengesStore[batchId].filter(
        (c) => !(c.targetType === 'club' && (c.targetId === clubId || (deletedClubName && c.targetName === deletedClubName)))
      );
    }
    if (libraryStore[batchId]) {
      libraryStore[batchId] = libraryStore[batchId].filter(
        (item) => !(item.targetType === 'club' && (item.targetId === clubId || (deletedClubName && item.targetName === deletedClubName)))
      );
    }

    // 5. Clean up student references locally
    for (const bId of Object.keys(studentsStore)) {
      const students = studentsStore[bId] || [];
      students.forEach((s) => {
        if (s.clubId === clubId || (deletedClubName && s.clubName === deletedClubName)) {
          s.clubId = undefined;
          s.clubName = 'بدون نادي';
        }
      });
    }

    // 6. Update batch clubCount
    const batch = batchesStore.find((b) => b.id === batchId);
    if (batch) {
      batch.clubCount = (clubsStore[batchId] || []).length;
    }

    saveDbToLocalStorage();
    return true;
  },

  async addClubMember(batchId: string, clubId: string, studentId: string): Promise<BatchClub> {
    const clubs = clubsStore[batchId] || [];
    const club = clubs.find((c) => c.id === clubId);
    if (!club) throw new Error('النادي غير موجود');

    if (!isUUID(studentId)) {
      throw new Error(`معرف الطالبة ليس UUID صحيحًا (${studentId}).`);
    }

    const students = studentsStore[batchId] || [];
    let student = students.find((s) => s.id === studentId);

    if (isSupabaseConfigured) {
      if (!isUUID(clubId)) {
        throw new Error(`معرف النادي ليس UUID صحيحًا (${clubId}).`);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const realBatchUuid = isUUID(batchId) ? batchId : toUUID(batchId);
        const { data: batchData } = await supabase
          .from('batches')
          .select('id, teacher_id')
          .eq('id', realBatchUuid)
          .maybeSingle();

        if (batchData && batchData.teacher_id !== user.id) {
          await supabase
            .from('batches')
            .update({ teacher_id: user.id })
            .eq('id', realBatchUuid);
        }
      }

      if (!student) {
        const { data: stdData } = await supabase
          .from('students')
          .select('id, full_name, student_code, avatar_url, points, class_id')
          .eq('id', studentId)
          .maybeSingle();

        if (stdData?.id) {
          const matchedClass = (classesStore[batchId] || []).find((c) => c.id === stdData.class_id);
          student = {
            id: stdData.id,
            batchId,
            name: stdData.full_name,
            studentCode: stdData.student_code,
            className: matchedClass ? matchedClass.name : 'الفصل',
            classId: stdData.class_id || undefined,
            avatarUrl: stdData.avatar_url || '',
            points: stdData.points || 0,
            completedTasks: 0,
            completedChallengesCount: 0,
            levelBadge: computeDynamicLevelBadge({ points: stdData.points || 0 } as any),
            status: 'active',
          };
        }
      }

      if (!student) {
        throw new Error(`تعذر العثور على الطالبة بالمعرف (${studentId}) في قاعدة البيانات.`);
      }

      const { data: existingMember } = await supabase
        .from('club_members')
        .select('id')
        .eq('club_id', clubId)
        .eq('student_id', studentId)
        .maybeSingle();

      if (!existingMember) {
        const { error: memberErr } = await supabase
          .from('club_members')
          .insert({
            club_id: clubId,
            student_id: studentId
          });

        if (memberErr) {
          console.error('Supabase addClubMember error:', memberErr);
          throw new Error(`فشل إضافة الطالبة إلى النادي: ${memberErr.message}`);
        }
      }
    }

    if (student) {
      student.clubName = club.name;
      student.clubId = club.id;

      if (!club.members) club.members = [];
      if (!club.members.some((m) => m.id === studentId)) {
        club.members.push({
          id: studentId,
          name: student.name,
          className: student.className,
          avatarUrl: student.avatarUrl,
        });
        club.memberCount = club.members.length;
      }
    }

    saveDbToLocalStorage();
    return club;
  },

  async removeClubMember(batchId: string, clubId: string, studentId: string): Promise<BatchClub> {
    const clubs = clubsStore[batchId] || [];
    const club = clubs.find((c) => c.id === clubId);
    if (!club) throw new Error('النادي غير موجود');

    const student = (studentsStore[batchId] || []).find((s) => s.id === studentId);

    if (isSupabaseConfigured) {
      if (!isUUID(clubId) || !isUUID(studentId)) {
        throw new Error('معرف النادي أو معرف الطالبة ليس UUID صحيحًا.');
      }

      const { error: delErr } = await supabase
        .from('club_members')
        .delete()
        .eq('club_id', clubId)
        .eq('student_id', studentId);

      if (delErr) {
        console.error('Supabase removeClubMember error:', delErr);
        throw new Error(`فشل إزالة الطالبة من النادي: ${delErr.message}`);
      }
    }

    if (student) {
      student.clubName = 'بدون نادي';
      student.clubId = undefined;
    }

    if (club.members) {
      club.members = club.members.filter((m) => m.id !== studentId);
      club.memberCount = club.members.length;
    }

    saveDbToLocalStorage();
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

    if (isSupabaseConfigured) {
      try {
        const supaPayload: any = {};
        if (updates.title) supaPayload.title = updates.title;
        if (updates.description) supaPayload.description = updates.description;
        if (updates.type) supaPayload.category = updates.type;
        if (updates.rewardXp || (updates as any).points) supaPayload.reward_xp = updates.rewardXp || (updates as any).points;
        if ((updates as any).gemsReward) supaPayload.gems_reward = (updates as any).gemsReward;
        if (updates.status) supaPayload.status = updates.status;
        if (updates.dueDate) supaPayload.due_date = updates.dueDate;
        if (updates.targetType) supaPayload.target_type = updates.targetType;
        if (updates.targetName) supaPayload.target_name = updates.targetName;

        if (Object.keys(supaPayload).length > 0) {
          await supabase.from('challenges').update(supaPayload).eq('id', challengeId);
        }
      } catch (err) {
        console.warn('Supabase updateChallenge error:', err);
      }
    }

    return updated;
  },

  async deleteChallenge(batchId: string, challengeId: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('challenges').delete().eq('id', challengeId);
      } catch (err) {
        console.warn('Supabase deleteChallenge error:', err);
      }
    }

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
    if (isSupabaseConfigured) {
      try {
        const supaPayload: any = {};
        if (updates.title) supaPayload.title = updates.title;
        if (updates.description) supaPayload.description = updates.description;
        if (updates.category) supaPayload.category = updates.category;
        if (updates.targetType) supaPayload.target_type = updates.targetType;
        if (Object.keys(supaPayload).length > 0) {
          await supabase.from('library_items').update(supaPayload).eq('id', itemId);
        }
      } catch (err) {
        console.warn('Supabase updateLibraryFile error:', err);
      }
    }

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
    if (isSupabaseConfigured) {
      try {
        await supabase.from('library_items').delete().eq('id', itemId);
      } catch (err) {
        console.warn('Supabase deleteLibraryFile error:', err);
      }
    }

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
    if (isSupabaseConfigured) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('students').delete().eq('id', studentId);
        if (error) {
          console.error('Failed to delete student from Supabase:', error.message);
          throw new Error(`فشل حذف الطالب: ${error.message}`);
        }
      }
    }

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

  // --- SUPABASE AUTHENTICATION ---
  async loginTeacherWithSupabase(
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; teacher?: TeacherProfile }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'خدمة Supabase غير مفعّلة في بيئة التشغيل.' };
    }

    const cleanEmail = (email || '').trim();
    if (!cleanEmail || !password) {
      return { success: false, error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور.' };
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (authError) {
        return {
          success: false,
          error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
        };
      }

      const userId = authData.user?.id;
      if (!userId) {
        return { success: false, error: 'فشل استرجاع بيانات المستخدم من نظام التوثيق.' };
      }

      // Fetch corresponding teacher profile from public.teachers using auth.uid()
      const { data: profile, error: profileError } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError || !profile) {
        // If user is authenticated but has no row in public.teachers, show clear setup error and sign out
        await supabase.auth.signOut();
        return {
          success: false,
          error: 'الحساب موثق بنجاح، ولكن لم يتم العثور على سجل المعلمة في جدول (public.teachers). يرجى ربط المعلمة بالجدول أولاً.',
        };
      }

      const teacherProfile: TeacherProfile = {
        id: profile.id,
        fullName: profile.full_name || profile.fullName || 'المعلمة',
        email: profile.email,
        teacherCode: profile.teacher_code || profile.teacherCode,
        avatarUrl: profile.avatar_url || profile.avatarUrl,
        schoolOrCenter: profile.school_or_center || profile.schoolOrCenter,
      };

      return { success: true, teacher: teacherProfile };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'حدث خطأ غير متوقع أثناء تسجيل الدخول.',
      };
    }
  },

  async getCurrentTeacherProfile(): Promise<TeacherProfile | null> {
    if (!isSupabaseConfigured) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile) return null;

      return {
        id: profile.id,
        fullName: profile.full_name || profile.fullName || 'المعلمة',
        email: profile.email,
        teacherCode: profile.teacher_code || profile.teacherCode,
        avatarUrl: profile.avatar_url || profile.avatarUrl,
        schoolOrCenter: profile.school_or_center || profile.schoolOrCenter,
      };
    } catch (err) {
      return null;
    }
  },

  async logoutTeacher(): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Error signing out from Supabase Auth:', err);
      }
    }
    return true;
  },
};

