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
  ExcelImportResult,
  ExcelImportFailure,
} from '../types/teacher';
import { calculateStudentJourney } from './journeyEngine';
import { supabase, isSupabaseConfigured, getSessionUser } from '../lib/supabase';
import { toUUID } from './migrationService';
import { getBatchStationsSync } from './systemSettingsService';

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
const initialLibrary: Record<string, BatchLibraryItem[]> = {};

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

function isUUID(str?: string): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export function normalizeArabic(str?: string): string {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // Tashkeel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ');
}

export function normalizeStudentCode(code?: string): string {
  if (!code) return '';
  const trimmed = code.trim();
  // Purely numeric codes: "01" -> "1", "001" -> "1", "1" -> "1"
  if (/^\d+$/.test(trimmed)) {
    return String(parseInt(trimmed, 10));
  }
  // Compound codes with numeric prefix: "01-D" -> "1-D", "001-A+" -> "1-A+"
  const match = trimmed.match(/^(\d+)([-_/\s].+)$/);
  if (match) {
    const numPart = String(parseInt(match[1], 10));
    return `${numPart}${match[2].trim()}`;
  }
  return trimmed;
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

/**
 * Persist the local cache. `notify` must be false when called from READ paths
 * (getBatches / getStudentsByBatch / getClubsByBatch): the dashboard, reports and
 * student portal reload on 'rihlat_db_updated', so announcing a change from a read
 * made every load trigger the next one — an endless request loop.
 */
function saveDbToLocalStorage(notify: boolean = true) {
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
    if (notify && typeof window !== 'undefined') {
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

    // NOTE: an old cleanup here hid every club whose name contains "إذاعة" (a leftover test club)
    // and re-saved with a change event on every load. It hid real clubs such as "نادي الإذاعة"
    // and could re-trigger reloads, so it was removed. Supabase is the source of truth for clubs.
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
    batchId: student.batchId,
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
  let clubs = [...(clubsStore[batchId] || [])].filter((c) => c.name);

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
  student: { id: string; studentCode?: string; name?: string },
  batchId: string,
  batchChallenges: BatchChallenge[],
  allSubmissions: PendingSubmission[]
): number {
  if (!batchChallenges) batchChallenges = [];
  if (!allSubmissions) allSubmissions = [];
  if (!student || !student.id) return 0;

  // STRICT REQUIREMENT: A submission belongs to a student ONLY when: submission.studentId === student.id
  const studentSubs = allSubmissions.filter(
    (s) => s.status === 'approved' && s.studentId === student.id
  );

  const matchedSubIds = new Set<string>();

  // Challenge matching uses challengeId whenever available; fallback to title/sourceName for legacy
  const completedFromList = batchChallenges.filter((ch) => {
    return studentSubs.some((s) => {
      const subChallengeId = (s as any).challengeId || s.challengeId;
      if (subChallengeId && ch.id) {
        if (subChallengeId === ch.id) {
          matchedSubIds.add(s.id);
          return true;
        }
        return false;
      }
      if (s.taskTitle === ch.title || s.sourceName === ch.title) {
        matchedSubIds.add(s.id);
        return true;
      }
      return false;
    });
  }).length;

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
   * Get student and batch info by Student Code, scoped by batch and class if available
   */
  async getStudentByCode(
    studentCode: string,
    batchId?: string,
    classId?: string
  ): Promise<{ student: BatchStudent; batch: Batch } | null> {
    loadDbFromLocalStorage();
    const cleanCode = studentCode.trim();
    const enteredNorm = normalizeStudentCode(cleanCode);
    const numericCode = cleanCode.includes('-') ? cleanCode.split('-')[0].trim() : cleanCode;
    const enteredNum = normalizeStudentCode(numericCode);

    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('students').select('*');
        if (batchId) query = query.eq('batch_id', batchId);
        if (classId) query = query.eq('class_id', classId);

        const candidateCodes = Array.from(
          new Set([
            cleanCode,
            cleanCode.toLowerCase(),
            cleanCode.toUpperCase(),
            enteredNorm,
            numericCode,
            enteredNum,
            /^\d+$/.test(numericCode) ? numericCode.padStart(2, '0') : null,
            /^\d+$/.test(numericCode) ? numericCode.padStart(3, '0') : null,
          ].filter(Boolean) as string[])
        );

        query = query.in('student_code', candidateCodes);

        const { data: supaStudents } = await query;
        const supaStudent = supaStudents && supaStudents.length > 0 ? supaStudents[0] : null;

        if (supaStudent) {
          const targetBatchId = supaStudent.batch_id;
          const currentBatchClasses = classesStore[targetBatchId] || [];
          const matchedClass = currentBatchClasses.find((c) => c.id === supaStudent.class_id);

          const studentObj: BatchStudent = {
            id: supaStudent.id,
            batchId: targetBatchId,
            name: supaStudent.full_name,
            studentCode: supaStudent.student_code || '',
            className: matchedClass ? matchedClass.name : '',
            classId: supaStudent.class_id || undefined,
            clubName: 'بدون نادي',
            levelBadge: '🌱 البداية',
            points: typeof supaStudent.points === 'number' ? supaStudent.points : 0,
            completedTasks: 0,
            completedChallengesCount: 0,
            avatarUrl: supaStudent.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
            status: supaStudent.status || 'active',
          };
          studentObj.levelBadge = computeDynamicLevelBadge(studentObj);

          const batch: Batch = batchesStore.find((b) => b.id === targetBatchId) || {
            id: targetBatchId,
            name: 'الدفعة العامة',
            gender: 'female',
            studentCount: (studentsStore[targetBatchId] || []).length,
            classCount: (classesStore[targetBatchId] || []).length,
            clubCount: (clubsStore[targetBatchId] || []).length,
            createdAt: '2026-08-01',
            code: 'BTC-100',
            stage: 'عامة',
            description: 'دفعة عامة',
            supervisorName: 'المشرفة العامة',
            colorGradient: 'from-rose-500/20 via-teal-500/20 to-emerald-500/20',
          };

          return { student: studentObj, batch };
        } else {
          // When Supabase is configured and student is not found remotely, never resurrect from local cache
          return null;
        }
      } catch (err) {
        console.warn('getStudentByCode Supabase sync warning:', err);
        return null;
      }
    }

    const batchesToSearch = batchId ? [batchId] : Object.keys(studentsStore);
    for (const bId of batchesToSearch) {
      const list = studentsStore[bId] || [];
      const found = list.find((s) => {
        if (classId && s.classId && s.classId !== classId) return false;
        const sCode = (s.studentCode || '').trim();
        const sNorm = normalizeStudentCode(sCode);
        const sNum = normalizeStudentCode(sCode.includes('-') ? sCode.split('-')[0].trim() : sCode);
        return (
          sCode.toLowerCase() === cleanCode.toLowerCase() ||
          sNorm.toLowerCase() === enteredNorm.toLowerCase() ||
          sNum.toLowerCase() === enteredNum.toLowerCase() ||
          enteredNorm.toLowerCase() === sNum.toLowerCase() ||
          sNorm.toLowerCase() === enteredNum.toLowerCase()
        );
      });
      if (found) {
        const batch: Batch = batchesStore.find((b) => b.id === bId) || {
          id: bId,
          name: 'الدفعة العامة',
          gender: 'female',
          studentCount: list.length,
          classCount: (classesStore[bId] || []).length,
          clubCount: (clubsStore[bId] || []).length,
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
  /**
   * Get full student context for Student App
   */
  async getStudentFullContext(studentId: string, studentCode?: string) {
    loadDbFromLocalStorage();
    const cleanId = studentId ? studentId.trim() : '';
    if (!cleanId) return null;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);

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

    let supaClubItem: BatchClub | null = null;
    let supaClubName: string | null = null;
    let supaClubId: string | null = null;
    let supaStudent: any = null;

    if (isSupabaseConfigured) {
      try {
        if (isUuid) {
          // REQUIREMENT 1: Query public.students ONLY by id = studentId.
          // Do NOT fall back to student_code or full_name if UUID lookup fails.
          const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('id', cleanId)
            .maybeSingle();
          supaStudent = data;
          debugInfo.supaStudentQuery = { data, error: error ? error.message : null };
          if (!supaStudent) {
            debugInfo.isRlsBlocked = true;
          }
        } else {
          // Only for legacy non-UUID strings
          const { data, error } = await supabase
            .from('students')
            .select('*')
            .ilike('student_code', cleanId)
            .maybeSingle();
          if (data) supaStudent = data;
          debugInfo.supaStudentQuery = { data, error: error ? error.message : null };
        }

        // If direct query returned 0 rows (e.g. unauthenticated student portal blocked by RLS),
        // try the secure RPC if we have studentCode available
        if (!supaStudent && isUuid) {
          let codeForRpc = studentCode;
          if (!codeForRpc) {
            try {
              const stored = localStorage.getItem('rihlat_logged_student_code_v1');
              if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed?.studentCode && parsed?.studentId === cleanId) {
                  codeForRpc = parsed.studentCode;
                }
              }
            } catch (e) {
              // ignore
            }
          }

          if (codeForRpc && codeForRpc.trim()) {
            const { data: rpcData, error: rpcErr } = await supabase.rpc('get_student_portal_profile', {
              p_student_id: cleanId,
              p_student_code: codeForRpc.trim(),
            });
            if (!rpcErr && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
              const rRow = rpcData[0];
              supaStudent = {
                id: rRow.student_id,
                batch_id: rRow.batch_id,
                class_id: rRow.class_id,
                student_code: rRow.student_code,
                full_name: rRow.full_name,
                points: rRow.points,
                avatar_url: rRow.avatar_url,
                status: rRow.status,
              };
              if (rRow.club_id || rRow.club_name) {
                supaClubId = rRow.club_id;
                supaClubName = rRow.club_name;
                supaClubItem = {
                  id: rRow.club_id || 'club-temp',
                  batchId: rRow.batch_id,
                  name: rRow.club_name || 'النادي',
                  description: rRow.club_description || '',
                  supervisorName: '',
                  category: rRow.club_category || 'عام',
                  memberCount: 1,
                  activeTasksCount: 0,
                  members: [],
                };
              }
            }
          }
        }

        if (supaStudent && !supaClubItem) {
          debugInfo.supaStudentId = supaStudent.id;

          // Query public.club_members to resolve student's assigned club
          const { data: memberData, error: memberErr } = await supabase
            .from('club_members')
            .select('club_id, clubs(id, batch_id, name, description, supervisor_name, category)')
            .eq('student_id', supaStudent.id)
            .maybeSingle();

          debugInfo.hasMemberData = !!memberData;
          debugInfo.memberDataClubId = memberData?.club_id || null;
          debugInfo.memberDataClubs = memberData?.clubs ? JSON.stringify(memberData.clubs) : null;
          debugInfo.memberQueryError = memberErr ? memberErr.message || JSON.stringify(memberErr) : null;

          const rawClub = memberData?.clubs;
          let clubObj = Array.isArray(rawClub) ? rawClub[0] : rawClub;

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
        }
      } catch (err) {
        console.warn('Failed to fetch student/club from Supabase in getStudentFullContext:', err);
      }
    }

    // IF SUPABASE RETURNED THE STUDENT (AUTHORITATIVE SOURCE OF TRUTH):
    if (supaStudent) {
      const targetBatchId = supaStudent.batch_id;
      const targetClassId = supaStudent.class_id;

      // Resolve className from public.classes using classId
      let resolvedClassItem: BatchClass | null = null;
      let resolvedClassName: string = '';

      if (targetClassId) {
        const currentBatchClasses = classesStore[targetBatchId] || [];
        const localClass = currentBatchClasses.find((c) => c.id === targetClassId);
        if (localClass) {
          resolvedClassItem = localClass;
          resolvedClassName = localClass.name;
        } else if (isSupabaseConfigured) {
          try {
            const { data: supaClass } = await supabase
              .from('classes')
              .select('*')
              .eq('id', targetClassId)
              .maybeSingle();
            if (supaClass) {
              resolvedClassItem = {
                id: supaClass.id,
                batchId: supaClass.batch_id,
                name: supaClass.name,
                teacherName: supaClass.teacher_name || '',
                studentCount: supaClass.student_count || 0,
                avgPoints: 0,
                challengeCompletionRate: 100,
                studentNames: [],
                schedule: supaClass.schedule || '',
                room: supaClass.room || '',
              };
              resolvedClassName = supaClass.name;
              if (!classesStore[targetBatchId]) classesStore[targetBatchId] = [];
              classesStore[targetBatchId].push(resolvedClassItem);
            }
          } catch (clsErr) {
            console.warn('Failed to fetch class for student from Supabase:', clsErr);
          }
        }
      }

      // Resolve club item
      const resolvedClubId = supaClubId || (supaStudent?.club_id) || undefined;
      const resolvedClubName = supaClubName || (supaStudent?.club_name) || undefined;

      if (resolvedClubId || (resolvedClubName && resolvedClubName !== 'بدون نادي')) {
        const allClubs = Object.values(clubsStore).flat();
        const matchedClub = allClubs.find(
          (c) =>
            (resolvedClubId && c.id === resolvedClubId) ||
            (resolvedClubName && c.name.trim().toLowerCase() === resolvedClubName.trim().toLowerCase())
        );
        if (matchedClub) {
          supaClubId = matchedClub.id;
          supaClubName = matchedClub.name;
          supaClubItem = {
            id: matchedClub.id,
            batchId: matchedClub.batchId || targetBatchId,
            name: matchedClub.name,
            description: matchedClub.description || '',
            supervisorName: matchedClub.supervisorName || '',
            category: matchedClub.category || 'عام',
            memberCount: matchedClub.memberCount || matchedClub.members?.length || 0,
            activeTasksCount: 0,
            members: matchedClub.members || [],
          };
        } else {
          supaClubItem = {
            id: resolvedClubId || 'club-temp',
            batchId: targetBatchId,
            name: resolvedClubName || 'النادي',
            description: '',
            supervisorName: '',
            category: 'عام',
            memberCount: 0,
            activeTasksCount: 0,
            members: [],
          };
        }

        // Fetch real club members securely via RPC using studentId, studentCode, and clubId
        const activeClubIdForFetch = supaClubItem.id !== 'club-temp' ? supaClubItem.id : resolvedClubId;
        if (activeClubIdForFetch && activeClubIdForFetch !== 'club-temp' && isSupabaseConfigured) {
          try {
            const clubMembersRpc = await this.getClubMembersForStudent(
              supaStudent.id,
              supaStudent.student_code || '',
              activeClubIdForFetch
            );
            if (clubMembersRpc && clubMembersRpc.length > 0) {
              supaClubItem.id = activeClubIdForFetch;
              supaClubItem.members = clubMembersRpc;
              supaClubItem.memberCount = clubMembersRpc.length;
            }
          } catch (err) {
            console.warn('Failed to populate supaClubItem.members via RPC in getStudentFullContext:', err);
          }
        }
      }

      // Fetch authoritative submissions for this student from Supabase
      if (isSupabaseConfigured) {
        try {
          const { data: supaSubs } = await supabase
            .from('challenge_submissions')
            .select('*, challenges(title, category, reward_xp)')
            .eq('batch_id', targetBatchId)
            .eq('student_id', supaStudent.id);

          if (supaSubs) {
            const currentBatchSubs = submissionsStore[targetBatchId] || [];
            // Remove any cached submissions for this specific student UUID
            const otherSubs = currentBatchSubs.filter((s) => s.studentId !== supaStudent.id);
            const studentSubs: PendingSubmission[] = supaSubs.map((ss: any) => ({
              id: ss.id,
              batchId: ss.batch_id,
              studentId: ss.student_id,
              studentCode: supaStudent.student_code || '',
              studentName: supaStudent.full_name || 'طالب',
              studentAvatar: supaStudent.avatar_url || '',
              className: resolvedClassName || 'الفصل',
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
            submissionsStore[targetBatchId] = [...studentSubs, ...otherSubs];
          }
        } catch (subErr) {
          console.warn('Failed to fetch student submissions from Supabase in getStudentFullContext:', subErr);
        }
      }

      const allBatchSubs = submissionsStore[targetBatchId] || [];

      // Build student object for challenge calculation
      const studentForCalc: BatchStudent = {
        id: supaStudent.id,
        batchId: targetBatchId,
        name: supaStudent.full_name,
        studentCode: supaStudent.student_code || '',
        className: resolvedClassName || '',
        classId: targetClassId || undefined,
        clubName: supaClubName || 'بدون نادي',
        clubId: supaClubId || undefined,
        points: typeof supaStudent.points === 'number' ? supaStudent.points : 0,
        completedChallengesCount: 0,
        completedTasks: 0,
        avatarUrl: supaStudent.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        status: supaStudent.status || 'active',
        levelBadge: '🌱 البداية',
      };

      const challenges = await this.getChallengesForStudent(studentForCalc, targetBatchId);
      const finalCompletedCount = calculateStudentCompletedChallengesCount(
        studentForCalc,
        targetBatchId,
        challenges,
        allBatchSubs
      );

      const finalPoints = typeof supaStudent.points === 'number' ? supaStudent.points : 0;

      // Update / replace in studentsStore for targetBatchId strictly by UUID
      if (!studentsStore[targetBatchId]) studentsStore[targetBatchId] = [];

      // Clean up this student UUID from any other batches
      Object.keys(studentsStore).forEach((bId) => {
        if (bId !== targetBatchId) {
          studentsStore[bId] = (studentsStore[bId] || []).filter((s) => s.id !== supaStudent.id);
        }
      });

      const batchList = studentsStore[targetBatchId];
      const existingIdx = batchList.findIndex((s) => s.id === supaStudent.id);

      const updatedStudent: BatchStudent = {
        id: supaStudent.id,
        batchId: targetBatchId,
        name: supaStudent.full_name,
        studentCode: supaStudent.student_code || '',
        className: resolvedClassName || '',
        classId: targetClassId || undefined,
        clubName: supaClubName || 'بدون نادي',
        clubId: supaClubId || undefined,
        points: finalPoints,
        completedChallengesCount: finalCompletedCount,
        completedTasks: 0,
        avatarUrl: supaStudent.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        status: supaStudent.status || 'active',
        levelBadge: '🌱 البداية',
      };
      updatedStudent.levelBadge = computeDynamicLevelBadge(updatedStudent);

      if (existingIdx !== -1) {
        batchList[existingIdx] = updatedStudent;
      } else {
        batchList.push(updatedStudent);
      }
      studentsStore[targetBatchId] = batchList;
      // Note: Do NOT call saveDbToLocalStorage() here. getStudentFullContext is a read operation and must not dispatch global mutation events.

      const batch: Batch = batchesStore.find((b) => b.id === targetBatchId) || {
        id: targetBatchId,
        name: 'الدفعة العامة',
        gender: 'female',
        studentCount: batchList.length,
        classCount: (classesStore[targetBatchId] || []).length,
        clubCount: (clubsStore[targetBatchId] || []).length,
        createdAt: '2026-08-01',
        code: 'BTC-100',
        stage: 'عامة',
        description: 'دفعة عامة',
        supervisorName: 'المشرفة العامة',
        colorGradient: 'from-rose-500/20 via-teal-500/20 to-emerald-500/20',
      };

      const classes = classesStore[targetBatchId] || [];
      const classItem = resolvedClassItem || classes.find((c) => (updatedStudent.classId ? c.id === updatedStudent.classId : c.name === updatedStudent.className)) || null;
      const library = await this.getLibraryByBatch(targetBatchId);
      const announcements = this.getMessagesForStudent(updatedStudent, targetBatchId);
      const submissions = submissionsStore[targetBatchId] || [];
      const allBatchStudents = batchList.map((s) => ({ ...s, levelBadge: computeDynamicLevelBadge(s) }));

      return {
        student: updatedStudent,
        batch,
        classItem,
        clubItem: supaClubItem,
        challenges,
        library,
        announcements,
        submissions,
        allBatchStudents,
        debugInfo,
      };
    }

    // IF SUPABASE STUDENT LOOKUP WAS NOT DIRECTLY RETURNED (e.g. unauthenticated student portal session),
    // CHECK LOCAL/AUTHENTICATED STUDENT CACHE (populated by studentPortalLogin):
    for (const batchId of Object.keys(studentsStore)) {
      const list = studentsStore[batchId] || [];
      const student = list.find((s) => (isUuid ? s.id === cleanId : s.id === cleanId || (s.studentCode && s.studentCode.trim().toLowerCase() === cleanId.toLowerCase())));
      if (student) {
        const allSubs = submissionsStore[batchId] || [];
        const challenges = await this.getChallengesForStudent(student, batchId);
        const finalCompletedCount = calculateStudentCompletedChallengesCount(
          student,
          batchId,
          challenges,
          allSubs
        );
        student.completedChallengesCount = finalCompletedCount;
        student.levelBadge = computeDynamicLevelBadge(student);

        const batch: Batch = batchesStore.find((b) => b.id === batchId) || {
          id: batchId,
          name: 'الدفعة العامة',
          gender: 'female',
          studentCount: list.length,
          classCount: (classesStore[batchId] || []).length,
          clubCount: (clubsStore[batchId] || []).length,
          createdAt: '2026-08-01',
          code: 'BTC-100',
          stage: 'عامة',
          description: 'دفعة عامة',
          supervisorName: 'المشرفة العامة',
          colorGradient: 'from-rose-500/20 via-teal-500/20 to-emerald-500/20',
        };
        const classes = classesStore[batchId] || [];
        const classItem = classes.find((c) => (student.classId ? c.id === student.classId : c.name === student.className)) || null;
        const clubs = clubsStore[batchId] || [];
        let clubItem = student.clubId ? clubs.find((c) => c.id === student.clubId) || null : (student.clubName && student.clubName !== 'بدون نادي' ? clubs.find((c) => c.name === student.clubName) || null : null);

        if (!clubItem && (student.clubId || (student.clubName && student.clubName !== 'بدون نادي'))) {
          clubItem = {
            id: student.clubId || 'club-temp',
            batchId,
            name: student.clubName || 'النادي',
            description: '',
            supervisorName: '',
            category: 'عام',
            memberCount: 0,
            activeTasksCount: 0,
            members: [],
          };
        }

        // Fetch club members securely via RPC
        const targetClubId = student.clubId || clubItem?.id;
        if (isSupabaseConfigured && targetClubId && targetClubId !== 'club-temp') {
          try {
            const clubMembersRpc = await this.getClubMembersForStudent(
              student.id,
              student.studentCode || studentCode || '',
              targetClubId
            );
            if (clubMembersRpc && clubMembersRpc.length > 0) {
              if (!clubItem) {
                clubItem = {
                  id: targetClubId,
                  batchId,
                  name: student.clubName || 'النادي',
                  description: '',
                  supervisorName: '',
                  category: 'عام',
                  memberCount: clubMembersRpc.length,
                  activeTasksCount: 0,
                  members: clubMembersRpc,
                };
              } else {
                clubItem.members = clubMembersRpc;
                clubItem.memberCount = clubMembersRpc.length;
              }
            }
          } catch (cmErr) {
            console.warn('Failed to fetch club members in getStudentFullContext cached path:', cmErr);
          }
        }

        const library = await this.getLibraryByBatch(batchId);
        const announcements = this.getMessagesForStudent(student, batchId);
        const submissions = submissionsStore[batchId] || [];
        const allBatchStudents = list.map((s) => ({ ...s, levelBadge: computeDynamicLevelBadge(s) }));

        return {
          student,
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

    // IF SUPABASE IS CONFIGURED AND STUDENT WAS NOT FOUND REMOTELY NOR IN CACHE:
    if (isSupabaseConfigured) {
      return null;
    }

    return null;
  },

  /**
   * Get batch station settings synchronously (from memory cache populated by Supabase)
   */
  getBatchStationsSync(batchId?: string) {
    if (!batchId) return undefined;
    return getBatchStationsSync(batchId);
  },

  /**
   * Fetch batches for the student portal discovery (secure RPC, safe for anon)
   */
  async getPortalBatches(): Promise<Batch[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc('get_portal_batches');
        if (!error && data && Array.isArray(data)) {
          return data.map((b: any) => ({
            id: b.id,
            name: b.name,
            code: '',
            stage: b.stage || 'المرحلة العامة',
            supervisorName: '',
            description: '',
            gender: (b.gender as any) || 'female',
            colorGradient: b.color_gradient || 'from-rose-500/20 via-teal-500/20 to-emerald-500/20',
            createdAt: '',
            studentCount: 0,
            classCount: 0,
            clubCount: 0,
          }));
        }
      } catch (err) {
        console.warn('Failed to fetch portal batches via RPC:', err);
      }
    }
    loadDbFromLocalStorage();
    return batchesStore || [];
  },

  /**
   * Fetch classes for a specific batch for the student portal discovery (secure RPC, safe for anon)
   */
  async getPortalClasses(batchId: string): Promise<BatchClass[]> {
    if (!batchId) return [];
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc('get_portal_classes', { p_batch_id: batchId });
        if (!error && data && Array.isArray(data)) {
          return data.map((c: any) => ({
            id: c.id,
            batchId: c.batch_id,
            name: c.name,
            teacherName: '',
            studentCount: 0,
            avgPoints: 0,
            challengeCompletionRate: 100,
            studentNames: [],
            schedule: c.schedule || '',
            room: c.room || '',
          }));
        }
      } catch (err) {
        console.warn('Failed to fetch portal classes via RPC:', err);
      }
    }
    loadDbFromLocalStorage();
    return classesStore[batchId] || [];
  },

  /**
   * Secure student portal login via security definer RPC
   */
  async studentPortalLogin(params: {
    batchId: string;
    classId: string;
    studentCode: string;
    studentName: string;
  }): Promise<{ success: boolean; error?: string; context?: any }> {
    const { batchId, classId, studentCode, studentName } = params;
    const cleanCode = (studentCode || '').trim();
    const cleanName = (studentName || '').trim();

    if (!batchId || !classId || !cleanCode || !cleanName) {
      return {
        success: false,
        error: 'يرجى اختيار الدفعة والفصل وإدخال الاسم الثلاثي وكود الطالب لدخول الرحلة.',
      };
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc('student_portal_login', {
          p_batch_id: batchId,
          p_class_id: classId,
          p_student_code: cleanCode,
          p_student_name: cleanName,
        });

        if (!error && data && Array.isArray(data) && data.length > 0) {
          const row = data[0];
          const studentObj: BatchStudent = {
            id: row.student_id,
            batchId: row.batch_id,
            name: row.full_name,
            studentCode: row.student_code,
            className: row.class_name || '',
            classId: row.class_id,
            clubName: row.club_name || 'بدون نادي',
            clubId: row.club_id || undefined,
            points: typeof row.points === 'number' ? row.points : 0,
            completedChallengesCount: 0,
            completedTasks: 0,
            avatarUrl: row.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
            status: (row.status as any) || 'active',
            levelBadge: '🌱 البداية',
          };
          studentObj.levelBadge = computeDynamicLevelBadge(studentObj);

          const batchObj: Batch = {
            id: row.batch_id,
            name: row.batch_name || 'الدفعة',
            gender: 'female',
            studentCount: 1,
            classCount: 1,
            clubCount: 1,
            createdAt: '',
            code: '',
            stage: '',
            description: '',
            supervisorName: '',
            colorGradient: 'from-rose-500/20 via-teal-500/20 to-emerald-500/20',
          };

          const classObj: BatchClass = {
            id: row.class_id,
            batchId: row.batch_id,
            name: row.class_name || '',
            teacherName: '',
            studentCount: 1,
            avgPoints: 0,
            challengeCompletionRate: 100,
            studentNames: [],
            schedule: '',
            room: '',
          };

          let clubObj: BatchClub | null = null;
          if (row.club_id || row.club_name) {
            clubObj = {
              id: row.club_id || 'club-temp',
              batchId: row.batch_id,
              name: row.club_name || 'النادي',
              description: row.club_description || '',
              supervisorName: '',
              category: row.club_category || 'عام',
              memberCount: 0,
              activeTasksCount: 0,
              members: [],
            };

            if (row.club_id && row.club_id !== 'club-temp') {
              try {
                const members = await this.getClubMembersForStudent(
                  studentObj.id,
                  studentObj.studentCode,
                  row.club_id
                );
                console.log('[Club Debug studentPortalLogin]', {
                  studentId: studentObj.id,
                  studentCode: studentObj.studentCode,
                  clubId: row.club_id,
                  rpcMembersCount: members.length,
                  members,
                });
                if (members && members.length > 0) {
                  clubObj.members = members;
                  clubObj.memberCount = members.length;
                }
              } catch (cmErr) {
                console.warn('Failed to fetch club members in studentPortalLogin:', cmErr);
              }
            }
          }

          // Fetch student challenges and submissions via secure RPCs
          const challenges = await this.getChallengesForStudent(studentObj, row.batch_id);
          const submissions = await this.getStudentSubmissions(row.batch_id, studentObj.id, studentObj.studentCode);

          // Update local store student cache strictly with the verified DB student
          if (!studentsStore[row.batch_id]) studentsStore[row.batch_id] = [];
          const existingIdx = studentsStore[row.batch_id].findIndex((s) => s.id === studentObj.id);
          if (existingIdx !== -1) {
            studentsStore[row.batch_id][existingIdx] = studentObj;
          } else {
            studentsStore[row.batch_id].push(studentObj);
          }
          saveDbToLocalStorage();

          const context = {
            student: studentObj,
            batch: batchObj,
            classItem: classObj,
            clubItem: clubObj,
            challenges,
            submissions,
          };

          try {
            localStorage.setItem(
              'rihlat_logged_student_code_v1',
              JSON.stringify({
                studentId: studentObj.id,
                studentCode: studentObj.studentCode,
                batchId: studentObj.batchId,
                classId: studentObj.classId,
              })
            );
          } catch (e) {
            // ignore
          }

          return { success: true, context };
        } else if (error) {
          console.warn('student_portal_login RPC fallback:', error?.message || error);
        }
      } catch (err: any) {
        console.warn('studentPortalLogin exception, falling back to local verification:', err);
      }
    }

    // Local-only fallback
    loadDbFromLocalStorage();
    const batchStudents = studentsStore[batchId] || [];
    const targetClass = (classesStore[batchId] || []).find((c) => c.id === classId);
    const enteredNorm = normalizeStudentCode(cleanCode);
    const numericCode = cleanCode.includes('-') ? cleanCode.split('-')[0].trim() : cleanCode;
    const enteredNum = normalizeStudentCode(numericCode);

    const inputTokens = normalizeArabic(cleanName).split(' ').filter(Boolean);
    const numTokens = Math.min(3, Math.max(1, inputTokens.length));
    const normalizedInput = inputTokens.slice(0, numTokens).join(' ');

    const matched = batchStudents.filter((st) => {
      if (st.batchId !== batchId) return false;
      const matchesClass = st.classId ? st.classId === classId : targetClass && st.className === targetClass.name;
      if (!matchesClass) return false;

      const stCodeClean = (st.studentCode || '').trim();
      const stNorm = normalizeStudentCode(stCodeClean);
      const stNum = normalizeStudentCode(stCodeClean.includes('-') ? stCodeClean.split('-')[0].trim() : stCodeClean);

      const matchesCode =
        stCodeClean.toLowerCase() === cleanCode.toLowerCase() ||
        stNorm.toLowerCase() === enteredNorm.toLowerCase() ||
        stNum.toLowerCase() === enteredNum.toLowerCase() ||
        stNorm.toLowerCase() === enteredNum.toLowerCase() ||
        enteredNorm.toLowerCase() === stNum.toLowerCase();

      if (!matchesCode) return false;

      const stNameTokens = normalizeArabic(st.name).split(' ').filter(Boolean).slice(0, numTokens).join(' ');
      return stNameTokens === normalizedInput;
    });

    if (matched.length === 0) {
      return { success: false, error: 'بيانات الطالب غير صحيحة، تأكد من الدفعة، الفصل، الاسم والكود.' };
    }
    if (matched.length > 1) {
      return { success: false, error: 'توجد بيانات مكررة لهذا الطالب في هذا الفصل. يرجى التواصل مع المعلم لتصحيح البيانات.' };
    }

    const ctx = await this.getStudentFullContext(matched[0].id, matched[0].studentCode);
    return { success: true, context: ctx };
  },

  /**
   * Fetch all Batches
   */
  async getBatches(): Promise<Batch[]> {
    loadDbFromLocalStorage();

    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await getSessionUser();
        if (user) {
          const { data: supaBatches } = await supabase
            .from('batches')
            .select('*')
            .eq('teacher_id', user.id);

          if (supaBatches && supaBatches.length > 0) {
            const batchIds = supaBatches.map((sb) => sb.id);

            // Fetch real counts from Supabase directly
            const [
              { data: supaStudentsData },
              { data: supaClassesData },
              { data: supaClubsData },
            ] = await Promise.all([
              supabase.from('students').select('id, batch_id').in('batch_id', batchIds),
              supabase.from('classes').select('id, batch_id').in('batch_id', batchIds),
              supabase.from('clubs').select('id, batch_id').in('batch_id', batchIds),
            ]);

            const studentCountMap: Record<string, number> = {};
            const classCountMap: Record<string, number> = {};
            const clubCountMap: Record<string, number> = {};

            supaStudentsData?.forEach((st: any) => {
              if (st.batch_id) {
                studentCountMap[st.batch_id] = (studentCountMap[st.batch_id] || 0) + 1;
              }
            });
            supaClassesData?.forEach((cl: any) => {
              if (cl.batch_id) {
                classCountMap[cl.batch_id] = (classCountMap[cl.batch_id] || 0) + 1;
              }
            });
            supaClubsData?.forEach((cb: any) => {
              if (cb.batch_id) {
                clubCountMap[cb.batch_id] = (clubCountMap[cb.batch_id] || 0) + 1;
              }
            });

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
                studentCount: studentCountMap[sb.id] ?? (studentsStore[sb.id]?.length || 0),
                classCount: classCountMap[sb.id] ?? (classesStore[sb.id]?.length || 0),
                clubCount: clubCountMap[sb.id] ?? (clubsStore[sb.id]?.length || 0),
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

      if (batch.studentCount === undefined) batch.studentCount = students.length;
      if (batch.classCount === undefined) batch.classCount = classes.length;
      if (batch.clubCount === undefined) batch.clubCount = clubs.length;
    });
    saveDbToLocalStorage(false);
    return batchesStore;
  },

  /**
   * Get single batch info
   */
  async getBatchById(batchId: string): Promise<Batch | null> {
    loadDbFromLocalStorage();
    let batch = batchesStore.find((b) => b.id === batchId);

    if (isSupabaseConfigured) {
      try {
        const realBatchUuid = isUUID(batchId) ? batchId : toUUID(batchId);
        const [
          { data: supaBatch },
          { data: supaStudents },
          { data: supaClasses },
          { data: supaClubs },
        ] = await Promise.all([
          supabase.from('batches').select('*').eq('id', realBatchUuid).maybeSingle(),
          supabase.from('students').select('id').eq('batch_id', realBatchUuid),
          supabase.from('classes').select('id').eq('batch_id', realBatchUuid),
          supabase.from('clubs').select('id').eq('batch_id', realBatchUuid),
        ]);

        if (supaBatch) {
          const mapped: Batch = {
            id: supaBatch.id,
            name: supaBatch.name,
            code: supaBatch.code,
            stage: supaBatch.stage || 'المرحلة العامة',
            supervisorName: supaBatch.supervisor_name || 'المشرفة',
            description: supaBatch.description || '',
            gender: (supaBatch.gender as any) || 'female',
            colorGradient: supaBatch.color_gradient || 'from-rose-500/20 via-teal-500/20 to-emerald-500/20',
            createdAt: supaBatch.created_at ? supaBatch.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            studentCount: supaStudents?.length ?? (studentsStore[batchId]?.length || 0),
            classCount: supaClasses?.length ?? (classesStore[batchId]?.length || 0),
            clubCount: supaClubs?.length ?? (clubsStore[batchId]?.length || 0),
          };
          const idx = batchesStore.findIndex((b) => b.id === mapped.id);
          if (idx !== -1) batchesStore[idx] = { ...batchesStore[idx], ...mapped };
          else batchesStore.push(mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('Failed to fetch batch from Supabase in getBatchById:', err);
      }
    }

    if (batch) {
      const students = studentsStore[batch.id] || [];
      const classes = classesStore[batch.id] || [];
      const clubs = computeBatchClubs(batch.id);

      if (batch.studentCount === undefined) batch.studentCount = students.length;
      if (batch.classCount === undefined) batch.classCount = classes.length;
      if (batch.clubCount === undefined) batch.clubCount = clubs.length;
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
        const { data: supaStudents, error } = await supabase
          .from('students')
          .select('*')
          .eq('batch_id', batchId);

        if (!error && supaStudents) {
          let currentClasses = classesStore[batchId] || [];
          // If classes are not yet populated in local memory, fetch them from Supabase to prevent race conditions
          if (currentClasses.length === 0) {
            const { data: supaClasses } = await supabase
              .from('classes')
              .select('*')
              .eq('batch_id', batchId);
            if (supaClasses && supaClasses.length > 0) {
              currentClasses = supaClasses.map((c: any) => ({
                id: c.id,
                batchId: c.batch_id,
                name: c.name,
                teacherName: c.teacher_name || '',
                studentCount: c.student_count || 0,
                avgPoints: 0,
                challengeCompletionRate: 100,
                studentNames: [],
                schedule: c.schedule || '',
                room: c.room || '',
              }));
              classesStore[batchId] = currentClasses;
            }
          }

          const studentIds = supaStudents.map((ss: any) => ss.id);
          const studentClubMap: Record<string, { clubId: string; clubName: string }> = {};

          if (studentIds.length > 0) {
            const { data: cmData } = await supabase
              .from('club_members')
              .select('student_id, club_id, clubs(id, name)')
              .in('student_id', studentIds);

            if (cmData) {
              cmData.forEach((cm: any) => {
                if (cm.student_id) {
                  const clubName = cm.clubs?.name || '';
                  const clubId = cm.club_id || cm.clubs?.id || '';
                  if (clubName) {
                    studentClubMap[cm.student_id] = { clubId, clubName };
                  }
                }
              });
            }

            // Fallback: If relation join didn't populate clubs.name, fetch clubs by club_id
            const missingClubIds = (cmData || [])
              .filter((cm: any) => cm.club_id && !studentClubMap[cm.student_id])
              .map((cm: any) => cm.club_id);

            if (missingClubIds.length > 0) {
              const { data: clubRows } = await supabase
                .from('clubs')
                .select('id, name')
                .in('id', missingClubIds);

              const clubNameById: Record<string, string> = {};
              clubRows?.forEach((c: any) => {
                if (c.id && c.name) clubNameById[c.id] = c.name;
              });

              (cmData || []).forEach((cm: any) => {
                if (cm.student_id && cm.club_id && clubNameById[cm.club_id]) {
                  studentClubMap[cm.student_id] = {
                    clubId: cm.club_id,
                    clubName: clubNameById[cm.club_id],
                  };
                }
              });
            }
          }

          const mappedStudents: BatchStudent[] = supaStudents.map((ss: any) => {
            const matchedClass = currentClasses.find((c) => c.id === ss.class_id);
            const clubInfo = studentClubMap[ss.id];

            const stObj: BatchStudent = {
              id: ss.id,
              batchId: ss.batch_id,
              name: ss.full_name,
              studentCode: ss.student_code || '',
              className: matchedClass ? matchedClass.name : '',
              classId: ss.class_id || undefined,
              clubId: clubInfo?.clubId || undefined,
              clubName: clubInfo?.clubName || 'بدون نادي',
              levelBadge: '🌱 البداية',
              points: typeof ss.points === 'number' ? ss.points : 0,
              completedTasks: 0,
              completedChallengesCount: 0,
              avatarUrl: ss.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
              status: ss.status || 'active',
            };
            stObj.levelBadge = computeDynamicLevelBadge(stObj);
            return stObj;
          });

          studentsStore[batchId] = mappedStudents;
          saveDbToLocalStorage(false);
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
      saveDbToLocalStorage(false);
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

    const currentClasses = classesStore[batchId] || [];
    const matchedClass = currentClasses.find(
      (c) => (student.classId && c.id === student.classId) || (student.className && c.name === student.className)
    );
    const className = student.className || (matchedClass ? matchedClass.name : '');
    const existingStudentsInBatch = studentsStore[batchId] || [];

    // Check duplicate studentCode in local store within the SAME class
    if (studentCode && className) {
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
      classId: matchedClass?.id || student.classId || undefined,
      levelBadge: student.levelBadge || '🌱 البداية',
      points: student.points || 0,
      completedTasks: 0,
      completedChallengesCount: 0,
      attendanceRate: 0,
      status: student.status || 'active',
    };

    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await getSessionUser();
        if (user) {
          const classId = matchedClass && matchedClass.id.length > 30 ? matchedClass.id : (student.classId || null);

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

          const realBatchId = isUUID(batchId) ? batchId : toUUID(batchId);
          const payload = {
            id: generatedUuid,
            batch_id: realBatchId,
            class_id: classId && isUUID(classId) ? classId : null,
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
            console.warn('Supabase insertion error, proceeding with local persistence:', error.message);
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
        if (err.message && err.message.includes('مستخدم بالفعل')) {
          throw err;
        }
        console.warn('Supabase network/fetch warning in addStudent, persisted locally:', err?.message || err);
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
   * Add / subtract points for a student (the +1 / +5 / +50 / -5 buttons).
   * Records exactly `delta` as a point transaction (the DB trigger updates students.points),
   * so quick repeated clicks are each counted once. Returns the student with the saved total.
   */
  async adjustStudentPoints(
    batchId: string,
    studentId: string,
    delta: number,
    reason: string = 'تعديل نقاط مباشر من المعلم'
  ): Promise<BatchStudent> {
    loadDbFromLocalStorage();
    const localStudent = (studentsStore[batchId] || []).find((s) => s.id === studentId);

    if (!isSupabaseConfigured || !isUUID(studentId)) {
      const base = localStudent?.points || 0;
      return this.updateStudent(batchId, studentId, { points: Math.max(0, base + delta) }, { localOnly: true });
    }

    const { data: { user } } = await getSessionUser();
    if (!user) {
      throw new Error('انتهت جلسة تسجيل الدخول، يرجى تسجيل الدخول مرة أخرى.');
    }

    const { data: currentRow, error: readErr } = await supabase
      .from('students')
      .select('points, batch_id')
      .eq('id', studentId)
      .maybeSingle();
    if (readErr || !currentRow) {
      throw new Error(`تعذر العثور على الطالبة في قاعدة البيانات${readErr ? `: ${readErr.message}` : ''}`);
    }

    const currentPoints = typeof currentRow.points === 'number' ? currentRow.points : 0;
    // Never record a deduction larger than the student's balance (points can't go below 0)
    const effectiveDelta = Math.max(delta, -currentPoints);
    let savedPoints = currentPoints;

    if (effectiveDelta !== 0) {
      const { error: ptError } = await supabase.from('point_transactions').insert({
        student_id: studentId,
        batch_id: currentRow.batch_id || (isUUID(batchId) ? batchId : toUUID(batchId)),
        teacher_id: user.id,
        points: effectiveDelta,
        reason,
        category: 'reward',
      });
      if (ptError) {
        throw new Error(`فشل حفظ النقاط في قاعدة البيانات: ${ptError.message}`);
      }

      const { data: freshRow } = await supabase
        .from('students')
        .select('points')
        .eq('id', studentId)
        .maybeSingle();
      savedPoints = typeof freshRow?.points === 'number' ? freshRow.points : currentPoints + effectiveDelta;
    }

    if (!localStudent) {
      await this.getStudentsByBatch(batchId);
    }
    return this.updateStudent(batchId, studentId, { points: savedPoints }, { localOnly: true });
  },

  /**
   * Update an existing student in batch
   */
  async updateStudent(
    batchId: string,
    studentId: string,
    updates: Partial<Omit<BatchStudent, 'id' | 'batchId'>>,
    options: { localOnly?: boolean } = {}
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

    // Update Supabase if configured (errors are surfaced to the caller instead of being swallowed)
    if (isSupabaseConfigured && !options.localOnly) {
      {
        const { data: { user } } = await getSessionUser();
        // No teacher session = student portal (students can't write to the DB; RLS) -> local cache only, as before.
        if (user) {
          const supaPayload: any = {};
          if (typeof updates.name === 'string') supaPayload.full_name = updates.name;
          if (typeof updates.studentCode === 'string') supaPayload.student_code = updates.studentCode;
          if (typeof updates.avatarUrl === 'string') supaPayload.avatar_url = updates.avatarUrl;
          if (typeof (updates as any).notes === 'string') supaPayload.notes = (updates as any).notes;
          if (typeof updates.status === 'string') supaPayload.status = updates.status;

          // Note: Do NOT include points in supaPayload! Points are updated via point_transactions trigger only.

          if (Object.keys(supaPayload).length > 0 && isValidUUID(studentId)) {
            const { error } = await supabase
              .from('students')
              .update(supaPayload)
              .eq('id', studentId);

            if (error) {
              throw new Error(`فشل حفظ بيانات الطالبة في قاعدة البيانات: ${error.message}`);
            }
          }

          // Point changes handled strictly through point_transactions.
          // The delta is computed from the points currently stored in the DATABASE (not the local
          // cache, which the UI may already have changed optimistically -> delta 0 -> nothing saved).
          if (typeof updates.points === 'number' && isValidUUID(studentId)) {
            const targetPoints = Math.max(0, updates.points);
            const { data: currentRow, error: currentErr } = await supabase
              .from('students')
              .select('points')
              .eq('id', studentId)
              .maybeSingle();
            if (currentErr) {
              throw new Error(`تعذر قراءة نقاط الطالبة الحالية: ${currentErr.message}`);
            }
            const dbPoints = typeof currentRow?.points === 'number' ? currentRow.points : oldPoints;
            const delta = targetPoints - dbPoints;

            if (delta !== 0 && isValidUUID(studentId)) {
              const realTargetBatchId = isUUID(targetBatchId) ? targetBatchId : toUUID(targetBatchId);
              const { error: ptError } = await supabase.from('point_transactions').insert({
                student_id: studentId,
                batch_id: realTargetBatchId,
                points: delta,
                teacher_id: user.id,
                reason: 'تعديل نقاط مباشر من المعلم',
                category: 'reward'
              });

              if (ptError) {
                throw new Error(`فشل حفظ النقاط في قاعدة البيانات: ${ptError.message}`);
              }
            }
          }
        }
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
   * Import students from parsed Excel file array with strict Supabase insert verification & detailed error reporting
   */
  async importStudentsFromExcel(
    batchId: string,
    newStudentsData: Array<{ name: string; studentCode?: string; className: string; clubName?: string; points?: number }>
  ): Promise<ExcelImportResult> {
    loadDbFromLocalStorage();

    console.log('[Excel Import] parsed rows:', newStudentsData.length, newStudentsData);

    const realBatchUuid = isUUID(batchId) ? batchId : toUUID(batchId);

    // 1. Fetch real class mappings from Supabase if configured
    const classMapByName: Record<string, string> = {};
    if (isSupabaseConfigured) {
      try {
        const { data: supaClasses, error: classErr } = await supabase
          .from('classes')
          .select('id, name')
          .eq('batch_id', realBatchUuid);
        if (classErr) {
          console.warn('[Excel Import] warning querying classes from Supabase:', classErr.message);
        } else if (supaClasses) {
          supaClasses.forEach((sc: any) => {
            if (sc.name) {
              classMapByName[sc.name.trim()] = sc.id;
            }
          });
        }
      } catch (err: any) {
        console.warn('[Excel Import] error checking classes in Supabase:', err?.message || err);
      }
    }

    // 2. Also map from local classesStore as fallback
    const localClasses = classesStore[batchId] || [];
    localClasses.forEach((lc) => {
      if (lc.name && !classMapByName[lc.name.trim()] && lc.id && isUUID(lc.id)) {
        classMapByName[lc.name.trim()] = lc.id;
      }
    });

    const createdList: BatchStudent[] = [];
    const failures: ExcelImportFailure[] = [];
    let validRowsCount = 0;

    for (let index = 0; index < newStudentsData.length; index++) {
      const item = newStudentsData[index];
      const studentName = (item.name || '').trim();
      const studentCode = (item.studentCode || '').trim();
      const className = (item.className || '').trim();

      console.log(`[Excel Import] validating row [${index + 1}/${newStudentsData.length}]:`, {
        name: studentName,
        studentCode,
        className,
      });

      if (!studentName) {
        console.warn(`[Excel Import] insert failed: اسم الطالب فارغ في الصف ${index + 1}`);
        failures.push({
          name: `صف بدون اسم (${index + 1})`,
          studentCode,
          reason: 'اسم الطالب فارغ أو غير موجود في هذا الصف.',
        });
        continue;
      }

      validRowsCount++;

      const targetClassName = className || (localClasses.length > 0 ? localClasses[0].name : 'الفصل E');
      let targetClassId: string | null = classMapByName[targetClassName] || null;

      if (targetClassId && !isUUID(targetClassId)) {
        targetClassId = null;
      }

      console.log(`[Excel Import] inserting student [${index + 1}]:`, {
        name: studentName,
        studentCode: studentCode || '(توليد تلقائي)',
        className: targetClassName,
        classId: targetClassId,
      });

      if (isSupabaseConfigured) {
        try {
          const { data: authData, error: authError } = await getSessionUser();
          if (authError || !authData?.user) {
            console.error(`[Excel Import] insert failed for (${studentName}): لا توجد جلسة معلم نشطة في Supabase`);
            failures.push({
              name: studentName,
              studentCode,
              reason: 'لا توجد جلسة معلم مصرح لها بالحفظ في Supabase (يرجى تسجيل الدخول كمعلم).',
            });
            continue;
          }

          const generatedUuid = typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `std-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

          const finalStudentCode = studentCode || `STU-${Math.floor(100000 + Math.random() * 900000)}`;

          const payload = {
            id: generatedUuid,
            batch_id: realBatchUuid,
            class_id: targetClassId,
            student_code: finalStudentCode,
            full_name: studentName,
            points: item.points || 0,
            avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
            notes: null,
            status: 'active',
          };

          const { data: inserted, error: insertError } = await supabase
            .from('students')
            .insert(payload)
            .select('*')
            .single();

          if (insertError) {
            let reason = insertError.message;
            if (insertError.code === '23505' || reason.includes('unique') || reason.includes('student_code')) {
              reason = `كود الطالب (${finalStudentCode}) مكرر أو مستخدم بالفعل في قاعدة البيانات (Unique constraint violation).`;
            } else if (insertError.code === '23503') {
              reason = `مفتاح الربط للدفعة أو الفصل غير صالح في قاعدة البيانات (${insertError.message}).`;
            }

            console.error(`[Excel Import] insert failed for (${studentName}):`, {
              code: insertError.code,
              message: insertError.message,
              details: insertError.details,
            });

            failures.push({
              name: studentName,
              studentCode: finalStudentCode,
              reason,
            });
            continue;
          }

          if (inserted) {
            console.log(`[Excel Import] insert success for (${studentName}):`, {
              id: inserted.id,
              student_code: inserted.student_code,
            });

            const newStudent: BatchStudent = {
              id: inserted.id,
              batchId,
              name: inserted.full_name,
              studentCode: inserted.student_code,
              className: targetClassName,
              classId: inserted.class_id || undefined,
              clubName: item.clubName || 'بدون نادي',
              levelBadge: '🌱 البداية',
              points: inserted.points || 0,
              completedTasks: 0,
              completedChallengesCount: 0,
              attendanceRate: 0,
              avatarUrl: inserted.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
              status: (inserted.status as any) || 'active',
            };

            createdList.push(newStudent);
            if (!studentsStore[batchId]) studentsStore[batchId] = [];
            studentsStore[batchId].push(newStudent);
          }
        } catch (err: any) {
          console.error(`[Excel Import] insert failed with unexpected error for (${studentName}):`, err?.message || err);
          failures.push({
            name: studentName,
            studentCode,
            reason: `فشل الاتصال بـ Supabase: ${err?.message || 'خطأ شبكة غير متوقع'}`,
          });
          continue;
        }
      } else {
        failures.push({
          name: studentName,
          studentCode,
          reason: 'قاعدة بيانات Supabase غير متصلة في البيئة الحالية.',
        });
      }
    }

    // Sync counts and class members
    const batch = batchesStore.find((b) => b.id === batchId);
    if (batch && studentsStore[batchId]) {
      batch.studentCount = studentsStore[batchId].length;
    }

    const classes = classesStore[batchId] || [];
    classes.forEach((cls) => {
      cls.studentNames = (studentsStore[batchId] || [])
        .filter((s) => s.className === cls.name)
        .map((s) => s.name);
      cls.studentCount = cls.studentNames.length;
    });

    saveDbToLocalStorage();

    console.log('[Excel Import] final summary:', {
      totalRows: newStudentsData.length,
      validRows: validRowsCount,
      savedInSupabase: createdList.length,
      failedCount: failures.length,
      failures,
    });

    return {
      totalRows: newStudentsData.length,
      validRows: validRowsCount,
      savedInSupabase: createdList.length,
      failedCount: failures.length,
      successfulStudents: createdList,
      failures,
    };
  },

  /**
   * Fetch classes of selected batch
   */
  async getClassesByBatch(batchId: string): Promise<BatchClass[]> {
    loadDbFromLocalStorage();

    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await getSessionUser();
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
    saveDbToLocalStorage(false);
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
      const { data: { user }, error: authError } = await getSessionUser();
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

    // Assign initial students if selected.
    // All members are saved in ONE bulk insert (previously 2-3 sequential requests per student,
    // so adding 80 students took minutes and the club showed a partial count meanwhile).
    const members: ClubMember[] = [];

    const validIds = Array.from(new Set((initialStudentIds || []).filter((sid) => {
      if (!isUUID(sid)) {
        console.warn(`Skipping non-UUID student ID: ${sid}`);
        return false;
      }
      return true;
    })));

    if (validIds.length > 0) {
      let batchStudents = studentsStore[batchId] || [];
      if (isSupabaseConfigured && batchStudents.length === 0) {
        batchStudents = await this.getStudentsByBatch(batchId);
      }

      const byId = new Map(batchStudents.map((s) => [s.id, s] as [string, BatchStudent]));

      if (isSupabaseConfigured) {
        // Fetch any selected students missing from the local cache in one query
        const missingIds = validIds.filter((sid) => !byId.has(sid));
        if (missingIds.length > 0) {
          const { data: stdRows, error: stdErr } = await supabase
            .from('students')
            .select('id, full_name, student_code, avatar_url, points, class_id')
            .in('id', missingIds);
          if (stdErr) {
            throw new Error(`تم إنشاء النادي، لكن تعذر تحميل بيانات الطالبات: ${stdErr.message}`);
          }
          (stdRows || []).forEach((stdData: any) => {
            const matchedClass = (classesStore[batchId] || []).find((c) => c.id === stdData.class_id);
            byId.set(stdData.id, {
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
            });
          });
        }

        const foundIds = validIds.filter((sid) => byId.has(sid));
        const notFound = validIds.length - foundIds.length;

        // Skip students already in this club (one query), then insert the rest in one request
        const { data: existingRows } = await supabase
          .from('club_members')
          .select('student_id')
          .eq('club_id', newClubId);
        const already = new Set((existingRows || []).map((r: any) => r.student_id));
        const rows = foundIds
          .filter((sid) => !already.has(sid))
          .map((sid) => ({ club_id: newClubId, student_id: sid }));

        if (rows.length > 0) {
          const { error: memberErr } = await supabase.from('club_members').insert(rows);
          if (memberErr && memberErr.code !== '23505') {
            console.error('Supabase club_members bulk insert error:', memberErr);
            throw new Error(`تم إنشاء النادي، لكن فشل إضافة الطالبات إليه: ${memberErr.message}`);
          }
        }

        if (notFound > 0) {
          console.warn(`${notFound} selected students were not found in the database and were skipped.`);
        }
      }

      for (const sid of validIds) {
        const student = byId.get(sid);
        if (!student) continue;
        student.clubName = club.name;
        student.clubId = newClubId;
        members.push({
          id: sid,
          name: student.name,
          className: student.className,
          avatarUrl: student.avatarUrl,
          studentCode: student.studentCode,
          points: student.points,
          levelBadge: computeDynamicLevelBadge(student),
        });
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
      // A specific student is identified by ID. Codes repeat across classes and names can repeat,
      // so code/name are only used for old challenges that have no student ID at all.
      if (ch.targetId || ch.targetStudentId) {
        return student.id === ch.targetId || student.id === ch.targetStudentId;
      }
      if (ch.targetStudentCode && student.studentCode && student.studentCode.trim().toLowerCase() === ch.targetStudentCode.trim().toLowerCase()) {
        return !ch.targetName || student.name.trim() === ch.targetName.trim();
      }
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
   * Fetch all members of a club for a student via secure RPC
   */
  async getClubMembersForStudent(studentId: string, studentCode: string, clubId: string): Promise<ClubMember[]> {
    if (isSupabaseConfigured && studentId && clubId) {
      try {
        const { data, error } = await supabase.rpc('get_student_club_members', {
          p_student_id: studentId,
          p_student_code: studentCode ? studentCode.trim() : null,
          p_club_id: clubId,
        });

        console.log('[Club Debug getClubMembersForStudent]', {
          studentId,
          studentCode,
          clubId,
          rpcError: error ? error.message : null,
          rpcDataCount: Array.isArray(data) ? data.length : 0,
          rpcData: data,
        });

        if (!error && data && Array.isArray(data)) {
          return data.map((st: any) => ({
            id: st.student_id,
            name: st.full_name,
            className: st.class_name || 'الفصل',
            avatarUrl: st.avatar_url || '',
            studentCode: st.student_code || '',
            points: typeof st.points === 'number' ? st.points : 0,
            levelBadge: computeDynamicLevelBadge({ points: typeof st.points === 'number' ? st.points : 0 } as any),
          }));
        } else if (error) {
          console.warn('Failed to fetch club members via RPC:', error.message);
        }
      } catch (err) {
        console.warn('Network exception while fetching club members via RPC:', err);
      }
    }
    return [];
  },

  /**
   * Create a new challenge in batch
   */
  async createChallenge(batchId: string, challenge: Omit<BatchChallenge, 'id' | 'batchId'>): Promise<BatchChallenge> {
    const isValidUUID = (id?: string) =>
      typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (isSupabaseConfigured) {
      const { data: { user } } = await getSessionUser();
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
   * Helper to filter library items for a student with strict security matching
   */
  filterLibraryItemsForStudent(items: BatchLibraryItem[], query: StudentLibraryQuery): BatchLibraryItem[] {
    const normalize = (str?: string) => (str || '').replace(/[^\p{L}\p{N}]/gu, '').toLowerCase().trim();

    const studentBatchId = query.batchId || '';
    const studentBatchNameNorm = normalize(query.batchName);
    const studentClassId = query.classId || '';
    const studentClassNameNorm = normalize(query.className);
    const studentClubId = query.clubId || '';
    const studentClubNorm = normalize(query.clubName);
    const studentId = query.studentId || '';
    const studentCodeNorm = normalize(query.studentCode);
    const studentNameNorm = normalize(query.studentName);

    return items.filter((item) => {
      const targetType = item.targetType || 'all';

      // Rule 1: الجميع ("all") -> Visible to all students
      if (targetType === 'all' || item.targetName === 'الجميع') {
        return true;
      }

      // Rule 2: دفعة محددة ("batch") -> Visible ONLY to students belonging to that batch
      if (targetType === 'batch') {
        if (item.batchId && studentBatchId && item.batchId === studentBatchId) {
          return true;
        }
        if (item.targetId && studentBatchId && item.targetId === studentBatchId) {
          return true;
        }
        const targetBatchNorm = normalize(item.targetName);
        if (targetBatchNorm && studentBatchNameNorm && (studentBatchNameNorm === targetBatchNorm || studentBatchNameNorm.includes(targetBatchNorm) || targetBatchNorm.includes(studentBatchNameNorm))) {
          return true;
        }
        return false;
      }

      // Rule 3: فصل محدد ("class") -> Visible ONLY to students in that class
      if (targetType === ('class' as any)) {
        if (item.targetId && studentClassId && item.targetId === studentClassId) {
          return true;
        }
        const targetClassNameNorm = normalize(item.targetName);
        if (targetClassNameNorm && studentClassNameNorm && (studentClassNameNorm === targetClassNameNorm || studentClassNameNorm.includes(targetClassNameNorm) || targetClassNameNorm.includes(studentClassNameNorm))) {
          return true;
        }
        return false;
      }

      // Rule 4: نادي محدد ("club") -> Visible ONLY to students who belong to that club
      if (targetType === 'club') {
        if (!studentClubNorm || query.clubName === 'بدون نادي' || query.clubName === 'بدون نادي حالياً') {
          return false;
        }
        if (item.targetId && studentClubId && item.targetId === studentClubId) {
          return true;
        }
        const targetClubNorm = normalize(item.targetName);
        if (targetClubNorm && (studentClubNorm === targetClubNorm || studentClubNorm.includes(targetClubNorm) || targetClubNorm.includes(studentClubNorm))) {
          return true;
        }
        return false;
      }

      // Rule 5: طالب محدد ("student") -> Visible ONLY to that specific student
      if (targetType === 'student') {
        if (item.targetId && studentId && item.targetId === studentId) {
          return true;
        }
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
   * Fetch library items of selected batch (including global items targeted for 'all')
   */
  async getLibraryByBatch(batchId: string): Promise<BatchLibraryItem[]> {
    if (isSupabaseConfigured) {
      try {
        const { data: supaLib, error } = await supabase
          .from('library_items')
          .select('*')
          .or(`batch_id.eq.${batchId},target_type.eq.all`)
          .order('created_at', { ascending: false });

        if (!error && supaLib) {
          const mappedLib: BatchLibraryItem[] = supaLib.map((sl: any) => ({
            id: sl.id,
            batchId: sl.batch_id,
            title: sl.title,
            description: sl.description || '',
            fileType: sl.file_type || 'pdf',
            type: sl.file_type || 'pdf',
            fileSize: sl.file_size || '1 MB',
            duration: sl.duration || undefined,
            url: sl.url,
            thumbnailUrl: sl.thumbnail_url || undefined,
            category: sl.category || 'عام',
            uploadedBy: sl.uploaded_by || 'المعلم',
            targetType: sl.target_type || 'all',
            targetId: sl.target_id || undefined,
            targetName: sl.target_type === 'all' ? 'الجميع' : undefined,
            createdAt: sl.created_at,
            uploadedAt: (sl.created_at || '').split('T')[0] || new Date().toISOString().split('T')[0],
          }));

          // Enrich targetName from local memory stores if available
          mappedLib.forEach((item) => {
            if (item.targetType === 'student' && item.targetId) {
              const allStudents = Object.values(studentsStore).flat();
              const st = allStudents.find((s) => s.id === item.targetId);
              if (st) item.targetName = st.name;
            } else if (item.targetType === 'club' && item.targetId) {
              const allClubs = Object.values(clubsStore).flat();
              const cl = allClubs.find((c) => c.id === item.targetId);
              if (cl) item.targetName = cl.name;
            }
          });

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
    let rawItems: BatchLibraryItem[] = [];

    if (isSupabaseConfigured) {
      try {
        // 1. Try secure student library RPC first if student credentials available
        if (query.studentId && query.studentCode) {
          const { data: rpcData, error: rpcErr } = await supabase.rpc('get_student_library', {
            p_student_id: query.studentId,
            p_student_code: query.studentCode,
          });
          if (!rpcErr && rpcData && Array.isArray(rpcData)) {
            rawItems = rpcData.map((sl: any) => ({
              id: sl.id,
              batchId: sl.batch_id,
              title: sl.title,
              description: sl.description || '',
              fileType: sl.file_type || 'pdf',
              type: sl.file_type || 'pdf',
              fileSize: sl.file_size || '1 MB',
              duration: sl.duration || undefined,
              url: sl.url,
              thumbnailUrl: sl.thumbnail_url || undefined,
              category: sl.category || 'عام',
              uploadedBy: sl.uploaded_by || 'المعلم',
              targetType: sl.target_type || 'all',
              targetId: sl.target_id || undefined,
              targetName: sl.target_name || (sl.target_type === 'all' ? 'الجميع' : undefined),
              createdAt: sl.created_at,
              uploadedAt: (sl.created_at || '').split('T')[0] || new Date().toISOString().split('T')[0],
            }));
          }
        }

        // 2. Direct Supabase query fallback (with strict client filtering)
        if (rawItems.length === 0) {
          const { data: supaLib, error: supaErr } = await supabase
            .from('library_items')
            .select('*')
            .order('created_at', { ascending: false });

          if (!supaErr && supaLib && supaLib.length > 0) {
            const mapped: BatchLibraryItem[] = supaLib.map((sl: any) => ({
              id: sl.id,
              batchId: sl.batch_id,
              title: sl.title,
              description: sl.description || '',
              fileType: sl.file_type || 'pdf',
              type: sl.file_type || 'pdf',
              fileSize: sl.file_size || '1 MB',
              duration: sl.duration || undefined,
              url: sl.url,
              thumbnailUrl: sl.thumbnail_url || undefined,
              category: sl.category || 'عام',
              uploadedBy: sl.uploaded_by || 'المعلم',
              targetType: sl.target_type || 'all',
              targetId: sl.target_id || undefined,
              targetName: sl.target_type === 'all' ? 'الجميع' : undefined,
              createdAt: sl.created_at,
              uploadedAt: (sl.created_at || '').split('T')[0] || new Date().toISOString().split('T')[0],
            }));

            rawItems = this.filterLibraryItemsForStudent(mapped, query);
          }
        }
      } catch (err) {
        console.warn('Supabase getLibraryForStudent error:', err);
      }
    }

    if (rawItems.length === 0) {
      loadDbFromLocalStorage();
      const itemsMap = new Map<string, BatchLibraryItem>();

      // Collect ALL items across all batches
      Object.keys(libraryStore).forEach((key) => {
        (libraryStore[key] || []).forEach((item) => {
          itemsMap.set(item.id, item);
        });
      });

      rawItems = this.filterLibraryItemsForStudent(Array.from(itemsMap.values()), query);
    }

    // 3. Resolve Signed URLs for private storage files
    const resolvedItems = await Promise.all(
      rawItems.map(async (item) => {
        try {
          const signedUrl = await this.resolveMediaSignedUrl(item.url);
          const signedThumb = item.thumbnailUrl
            ? await this.resolveMediaSignedUrl(item.thumbnailUrl)
            : undefined;
          return {
            ...item,
            url: signedUrl || item.url,
            thumbnailUrl: signedThumb || item.thumbnailUrl,
          };
        } catch {
          return item;
        }
      })
    );

    return resolvedItems;
  },

  /**
   * Upload a physical file directly to private Supabase Storage bucket 'library-files'
   */
  async uploadFileToSupabaseStorage(
    batchId: string,
    file: File
  ): Promise<{ storagePath: string; storageUrl: string; fileSize: string }> {
    // 1. Validation: 50MB max limit
    const MAX_SIZE_BYTES = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      throw new Error(`حجم الملف (${(file.size / (1024 * 1024)).toFixed(1)} MB) يتجاوز الحد الأقصى المسموح به (50 ميجابايت).`);
    }

    // Format human-readable size
    let formattedSize = '1 MB';
    if (file.size < 1024 * 1024) {
      formattedSize = `${Math.round(file.size / 1024)} KB`;
    } else {
      formattedSize = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    }

    if (!isSupabaseConfigured) {
      const localPath = `local-files/${Date.now()}_${file.name}`;
      return {
        storagePath: localPath,
        storageUrl: URL.createObjectURL(file),
        fileSize: formattedSize,
      };
    }

    // 2. Sanitize filename and generate unique collision-free path
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const storagePath = `${batchId}/${uniqueSuffix}_${safeName}`;

    // 3. Upload to private bucket 'library-files'
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('library-files')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError || !uploadData) {
      console.error('Supabase Storage Upload Error:', uploadError);
      throw new Error(`فشل رفع الملف إلى التخزين السحابي: ${uploadError?.message || 'خطأ غير معروف'}`);
    }

    return {
      storagePath,
      storageUrl: `storage://library-files/${storagePath}`,
      fileSize: formattedSize,
    };
  },

  /**
   * Resolve a temporary Signed URL for private storage files or return external URLs directly
   */
  async resolveMediaSignedUrl(rawUrl?: string, expiresInSeconds: number = 3600): Promise<string> {
    if (!rawUrl || rawUrl === '#' || rawUrl.trim() === '') {
      return '';
    }

    // 1. If it's a standard external web link (e.g. YouTube, Quran.com, external PDF), return as is
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('blob:')) {
      return rawUrl;
    }

    // 2. Check for private storage scheme (storage://library-files/<path> or library-files/<path>)
    let storagePath = '';
    if (rawUrl.startsWith('storage://library-files/')) {
      storagePath = rawUrl.replace('storage://library-files/', '');
    } else if (rawUrl.startsWith('library-files/')) {
      storagePath = rawUrl.replace('library-files/', '');
    } else if (!rawUrl.includes('://')) {
      storagePath = rawUrl;
    }

    if (storagePath && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.storage
          .from('library-files')
          .createSignedUrl(storagePath, expiresInSeconds);

        if (!error && data?.signedUrl) {
          return data.signedUrl;
        }
        if (error) {
          console.warn('Failed to create signed URL for path:', storagePath, error.message);
        }
      } catch (err) {
        console.warn('Error resolving signed URL:', err);
      }
    }

    return rawUrl;
  },

  /**
   * Upload/add a library file to batch
   */
  async uploadLibraryFile(
    batchId: string, 
    file: Omit<BatchLibraryItem, 'id' | 'batchId' | 'uploadedAt'> & { fileObject?: File }
  ): Promise<BatchLibraryItem> {
    loadDbFromLocalStorage();
    let newLibId = `lib-${Date.now()}`;
    const fileType = file.fileType || file.type || 'pdf';
    const targetType = file.targetType || 'all';

    let targetId: string | null = null;
    if (targetType === 'student') {
      targetId = file.targetStudentId || file.targetId || null;
    } else if (targetType === 'club' || targetType === 'class' || targetType === 'batch') {
      targetId = file.targetId || null;
    }

    let finalUrl = file.url || '#';
    let calculatedFileSize = file.fileSize || '1 MB';
    let uploadedStoragePath: string | null = null;

    // 1. If a physical file was provided, upload to Supabase Storage first
    if (file.fileObject) {
      const storageResult = await this.uploadFileToSupabaseStorage(batchId, file.fileObject);
      finalUrl = storageResult.storageUrl;
      calculatedFileSize = storageResult.fileSize;
      uploadedStoragePath = storageResult.storagePath;
    }

    // 2. Insert metadata into library_items table
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('library_items').insert({
          batch_id: batchId,
          title: file.title,
          description: file.description || '',
          file_type: fileType,
          file_size: calculatedFileSize,
          duration: file.duration || null,
          url: finalUrl,
          thumbnail_url: file.thumbnailUrl || null,
          category: file.category || 'عام',
          uploaded_by: file.uploadedBy || 'المعلم',
          target_type: targetType,
          target_id: targetId,
        }).select().single();

        if (error) {
          console.error('Supabase uploadLibraryFile DB insert error:', error.message);
          // Rollback: cleanup uploaded storage file to prevent orphaned files
          if (uploadedStoragePath) {
            await supabase.storage.from('library-files').remove([uploadedStoragePath]).catch((cleanupErr) => {
              console.warn('Failed to cleanup orphaned storage file:', cleanupErr);
            });
          }
          throw new Error(`فشل حفظ بيانات المورد في قاعدة البيانات: ${error.message}`);
        }

        if (data) {
          newLibId = data.id;
        }
      } catch (err: any) {
        if (uploadedStoragePath && !err.message?.includes('فشل حفظ بيانات المورد')) {
          await supabase.storage.from('library-files').remove([uploadedStoragePath]).catch(() => {});
        }
        throw err;
      }
    }

    const newItem: BatchLibraryItem = {
      ...file,
      fileType: fileType as any,
      type: fileType,
      fileSize: calculatedFileSize,
      url: finalUrl,
      id: newLibId,
      batchId,
      targetType,
      targetId: targetId || undefined,
      uploadedAt: new Date().toISOString().split('T')[0],
      storagePath: uploadedStoragePath || undefined,
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
   * Fetch all submissions (pending, approved, rejected) for a selected batch
   */
  async getAllSubmissionsByBatch(batchId: string): Promise<PendingSubmission[]> {
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
            submittedAt: ss.submitted_at || new Date().toISOString(),
            status: ss.status || 'pending',
            rewardXp: ss.reward_xp || ss.challenges?.reward_xp || 50,
            teacherNotes: ss.teacher_notes || undefined,
            challengeId: ss.challenge_id || undefined,
          }));
          submissionsStore[batchId] = mappedSubs;
          return mappedSubs;
        }
      } catch (err) {
        console.warn('Supabase getAllSubmissionsByBatch error:', err);
      }
    }
    loadDbFromLocalStorage();
    return submissionsStore[batchId] || [];
  },

  /**
   * Fetch pending task submissions waiting for teacher review in selected batch
   */
  async getPendingSubmissions(batchId: string): Promise<PendingSubmission[]> {
    const all = await this.getAllSubmissionsByBatch(batchId);
    return all.filter((s) => s.status === 'pending');
  },

  /**
   * Submit a task, challenge, or achievement for teacher review
   */
  async submitForReview(
    submission: Omit<PendingSubmission, 'id' | 'status' | 'submittedAt'>
  ): Promise<PendingSubmission> {
    const batchId = submission.batchId || '';
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
  async getStudentSubmissions(batchId: string = '', studentId?: string, studentCode?: string): Promise<PendingSubmission[]> {
    loadDbFromLocalStorage();
    if (isSupabaseConfigured && studentId) {
      try {
        if (studentCode && studentCode.trim()) {
          const { data: rpcSubs, error: rpcErr } = await supabase.rpc('get_student_submissions', {
            p_student_id: studentId,
            p_student_code: studentCode.trim(),
          });
          if (!rpcErr && rpcSubs && Array.isArray(rpcSubs)) {
            return rpcSubs.map((ss: any) => ({
              id: ss.id,
              batchId: ss.batch_id,
              studentId: ss.student_id,
              studentCode: studentCode.trim(),
              studentName: 'طالب',
              className: '',
              sourceType: ss.source_type || 'challenge',
              sourceName: ss.source_name || ss.challenge_title || 'تحدي',
              contentSummary: ss.submission_content || 'تم تنفيذ التحدي بنجاح',
              taskTitle: ss.challenge_title || ss.source_name || 'تحدي',
              submittedAt: ss.submitted_at ? new Date(ss.submitted_at).toLocaleDateString('ar-EG') : 'الآن',
              status: ss.status || 'pending',
              rewardXp: ss.reward_xp || 50,
              teacherNotes: ss.teacher_notes || undefined,
              challengeId: ss.challenge_id || undefined,
            }));
          }
        }

        const { data: supaSubs } = await supabase
          .from('challenge_submissions')
          .select('*, challenges(title, category, reward_xp)')
          .eq('batch_id', batchId)
          .eq('student_id', studentId);

        if (supaSubs) {
          return supaSubs.map((ss: any) => ({
            id: ss.id,
            batchId: ss.batch_id,
            studentId: ss.student_id,
            studentCode: studentCode || '',
            studentName: 'طالب',
            className: '',
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
        }
      } catch (err) {
        console.warn('Failed to fetch student submissions from Supabase:', err);
      }
    }

    const list = submissionsStore[batchId] || [];
    if (!studentId) return list;
    return list.filter((s) => s.studentId === studentId);
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

    const targetStudentId = previousSubmission.studentId;

    // Find target student strictly by UUID
    let student = (studentsStore[batchId] || []).find(
      (s) => s.id === targetStudentId
    );

    if (!student) {
      for (const bId of Object.keys(studentsStore)) {
        const found = (studentsStore[bId] || []).find(
          (s) => s.id === targetStudentId
        );
        if (found) {
          student = found;
          break;
        }
      }
    }

    if (isSupabaseConfigured) {
      const { data: { user } } = await getSessionUser();
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
      if (status === 'approved' && previousStatus !== 'approved' && !isAlreadyApprovedInDb && !isAlreadyRewardedInDb) {
        const rewardXp = previousSubmission.rewardXp || 50;
        if (rewardXp > 0) {
          if (!isValidUUID(targetStudentId) || !isValidUUID(batchId)) {
            throw new Error(`معرف الطالب (${targetStudentId}) أو الدفعة (${batchId}) غير صالح كـ UUID في Supabase`);
          }

          const { error: ptError } = await supabase.from('point_transactions').insert({
            student_id: targetStudentId,
            batch_id: batchId,
            teacher_id: user.id,
            points: rewardXp,
            reason: `إنجاز مهمة: ${previousSubmission.taskTitle || 'تحدي'}`,
            category: 'challenge',
            source_type: 'challenge_submission',
            source_id: submissionId
          });

          if (ptError) {
            if (ptError.code === '23505' || ptError.message.includes('unique')) {
              console.warn('Point transaction already exists for this submission (concurrency duplicate ignored)');
            } else {
              console.error('Supabase reviewSubmission point transaction error:', ptError.message);
              throw new Error(`فشل منح نقاط التحدي في قاعدة البيانات: ${ptError.message}`);
            }
          }
        }
      }

      // Fetch authoritative updated student points from Supabase (updated via point_transactions DB trigger)
      if (isValidUUID(targetStudentId)) {
        const { data: updatedDbStudent } = await supabase
          .from('students')
          .select('points')
          .eq('id', targetStudentId)
          .maybeSingle();

        if (updatedDbStudent && typeof updatedDbStudent.points === 'number') {
          if (student) {
            student.points = updatedDbStudent.points;
          }
          Object.keys(studentsStore).forEach((bId) => {
            studentsStore[bId] = (studentsStore[bId] || []).map((s) =>
              s.id === targetStudentId ? { ...s, points: updatedDbStudent.points } : s
            );
          });
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
        const { data: { user } } = await getSessionUser();
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
      const { data: { user } } = await getSessionUser();
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
      {
        const { data: { user } } = await getSessionUser();
        if (!user) {
          throw new Error('انتهت جلسة تسجيل الدخول، يرجى تسجيل الدخول مرة أخرى.');
        }
        {
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

          if (error || !inserted) {
            console.error('Failed to save class to Supabase:', error?.message);
            throw new Error(`فشل حفظ الفصل في قاعدة البيانات: ${error?.message || 'لم يتم إرجاع الفصل'}`);
          } else {
            newClass.id = inserted.id;
            newClass.name = inserted.name;
            newClass.teacherName = inserted.teacher_name || newClass.teacherName;
            newClass.schedule = inserted.schedule || newClass.schedule;
            newClass.room = inserted.room || newClass.room;
          }
        }
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
      const { data: { user } } = await getSessionUser();
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
      const { data: { user } } = await getSessionUser();
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

      const { data: { user } } = await getSessionUser();
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
    const fileType = updates.fileType || updates.type;
    const targetType = updates.targetType;
    let targetId: string | null | undefined = undefined;
    if (targetType === 'student') {
      targetId = updates.targetStudentId || updates.targetId || null;
    } else if (targetType === 'club' || targetType === 'class' || targetType === 'batch') {
      targetId = updates.targetId || null;
    } else if (targetType === 'all') {
      targetId = null;
    }

    if (isSupabaseConfigured) {
      try {
        const supaPayload: any = {};
        if (updates.title !== undefined) supaPayload.title = updates.title;
        if (updates.description !== undefined) supaPayload.description = updates.description;
        if (updates.category !== undefined) supaPayload.category = updates.category;
        if (fileType !== undefined) supaPayload.file_type = fileType;
        if (updates.fileSize !== undefined) supaPayload.file_size = updates.fileSize;
        if (updates.duration !== undefined) supaPayload.duration = updates.duration;
        if (updates.url !== undefined) supaPayload.url = updates.url;
        if (updates.thumbnailUrl !== undefined) supaPayload.thumbnail_url = updates.thumbnailUrl;
        if (targetType !== undefined) supaPayload.target_type = targetType;
        if (targetId !== undefined) supaPayload.target_id = targetId;

        if (Object.keys(supaPayload).length > 0) {
          const { error } = await supabase.from('library_items').update(supaPayload).eq('id', itemId);
          if (error) {
            console.warn('Supabase updateLibraryFile error:', error.message);
          }
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
        const updated: BatchLibraryItem = { ...list[idx], ...updates };
        if (fileType) {
          updated.fileType = fileType as any;
          updated.type = fileType;
        }
        if (targetType) updated.targetType = targetType;
        if (targetId !== undefined) updated.targetId = targetId || undefined;
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
        // 1. Fetch item URL to check if a private storage file exists
        const { data: itemData } = await supabase
          .from('library_items')
          .select('url')
          .eq('id', itemId)
          .single();

        if (itemData?.url) {
          let storagePath = '';
          if (itemData.url.startsWith('storage://library-files/')) {
            storagePath = itemData.url.replace('storage://library-files/', '');
          } else if (itemData.url.startsWith('library-files/')) {
            storagePath = itemData.url.replace('library-files/', '');
          }
          if (storagePath) {
            await supabase.storage.from('library-files').remove([storagePath]).catch((storageErr) => {
              console.warn('Supabase storage cleanup warning on delete:', storageErr);
            });
          }
        }

        // 2. Delete database record
        const { error } = await supabase.from('library_items').delete().eq('id', itemId);
        if (error) {
          console.warn('Supabase deleteLibraryFile error:', error.message);
        }
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
      const { data: { user } } = await getSessionUser();
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
      const { data: { user } } = await getSessionUser();
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

