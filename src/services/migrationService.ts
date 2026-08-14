import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getRihlatLocalStorageBackup } from '../utils/backupLocalStorage';

/**
 * Deterministic String-to-UUID converter.
 * Converts plain string IDs (e.g. 'batch-g6-f', 'std-1') into valid RFC 4122 UUIDs
 * so PostgreSQL foreign key constraints are satisfied.
 */
export function toUUID(id: string): string {
  if (!id) return '00000000-0000-0000-0000-000000000000';
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) return id.toLowerCase();

  let h1 = 0x811c9dc5, h2 = 0x097c1da9, h3 = 0x2b38159b, h4 = 0x1a87b41e;
  for (let i = 0; i < id.length; i++) {
    const code = id.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 0x01000193);
    h2 = Math.imul(h2 ^ code, 0x050c5d1f);
    h3 = Math.imul(h3 ^ code, 0x0a11e03a);
    h4 = Math.imul(h4 ^ code, 0x1121021d);
  }
  const hex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  const fullHex = (hex(h1) + hex(h2) + hex(h3) + hex(h4)).toLowerCase();

  return `${fullHex.slice(0, 8)}-${fullHex.slice(8, 12)}-4${fullHex.slice(13, 16)}-a${fullHex.slice(17, 20)}-${fullHex.slice(20, 32)}`;
}

export interface MigrationSummary {
  success: boolean;
  timestamp: string;
  tables: Record<string, { inserted: number; attempted: number; error: string | null }>;
  unmigratedRecords: string[];
  readingFromSupabase: boolean;
}

export async function runLocalStorageToSupabaseMigration(): Promise<MigrationSummary> {
  const summary: MigrationSummary = {
    success: false,
    timestamp: new Date().toISOString(),
    tables: {},
    unmigratedRecords: [],
    readingFromSupabase: isSupabaseConfigured,
  };

  if (!isSupabaseConfigured) {
    console.warn('[Migration] Supabase is not configured. Aborting migration.');
    return summary;
  }

  const backup = getRihlatLocalStorageBackup();
  const db = backup.keys.rihlat_teacher_db_v3;
  const settings = backup.keys.rihlat_system_settings_v1;

  if (!db && !settings) {
    console.warn('[Migration] No localStorage data found to migrate.');
    summary.success = true;
    return summary;
  }

  const defaultTeacherId = '00000000-0000-0000-0000-000000000001';

  // 1. TEACHERS
  try {
    const attempted = 1;
    const { error } = await supabase.from('teachers').upsert({
      id: defaultTeacherId,
      full_name: 'أستاذة هدى الزهراني',
      email: 'teacher@rihlat.edu',
      teacher_code: 'TCH-001',
      school_or_center: 'مركز المتميزين'
    }, { onConflict: 'id' });

    summary.tables['teachers'] = {
      attempted,
      inserted: error ? 0 : 1,
      error: error ? error.message : null
    };
    if (error) summary.unmigratedRecords.push(`teachers: ${error.message}`);
  } catch (err: any) {
    summary.tables['teachers'] = { attempted: 1, inserted: 0, error: err.message };
  }

  // 2. BATCHES
  const batchesStore: any[] = (db?.batchesStore as any[]) || [];
  if (batchesStore.length > 0) {
    try {
      const records = batchesStore.map(b => ({
        id: toUUID(b.id),
        teacher_id: defaultTeacherId,
        name: b.name || 'دفعة بدون عنوان',
        code: b.code || `BTC-${b.id}`,
        stage: b.stage || 'المرحلة العامة',
        supervisor_name: b.supervisorName || 'المشرف العام',
        description: b.description || '',
        gender: ['female', 'male', 'mixed'].includes(b.gender) ? b.gender : 'female',
        color_gradient: b.colorGradient || 'from-teal-600 to-emerald-600'
      }));

      const { error } = await supabase.from('batches').upsert(records, { onConflict: 'id' });
      summary.tables['batches'] = {
        attempted: records.length,
        inserted: error ? 0 : records.length,
        error: error ? error.message : null
      };
      if (error) summary.unmigratedRecords.push(`batches (${records.length} records): ${error.message}`);
    } catch (err: any) {
      summary.tables['batches'] = { attempted: batchesStore.length, inserted: 0, error: err.message };
    }
  } else {
    summary.tables['batches'] = { attempted: 0, inserted: 0, error: null };
  }

  // 3. CLASSES
  const classesMap: Record<string, any[]> = (db?.classesStore as any) || {};
  const allClasses: any[] = [];
  Object.entries(classesMap).forEach(([batchId, list]) => {
    if (Array.isArray(list)) {
      list.forEach(c => allClasses.push({ ...c, batchId }));
    }
  });

  if (allClasses.length > 0) {
    try {
      const records = allClasses.map(c => ({
        id: toUUID(c.id),
        batch_id: toUUID(c.batchId),
        teacher_id: defaultTeacherId,
        name: c.name || 'فصل جديد',
        teacher_name: c.teacherName || 'أ. هدى الزهراني',
        schedule: c.schedule || '',
        room: c.room || ''
      }));

      const { error } = await supabase.from('classes').upsert(records, { onConflict: 'id' });
      summary.tables['classes'] = {
        attempted: records.length,
        inserted: error ? 0 : records.length,
        error: error ? error.message : null
      };
      if (error) summary.unmigratedRecords.push(`classes (${records.length} records): ${error.message}`);
    } catch (err: any) {
      summary.tables['classes'] = { attempted: allClasses.length, inserted: 0, error: err.message };
    }
  } else {
    summary.tables['classes'] = { attempted: 0, inserted: 0, error: null };
  }

  // 4. STUDENTS
  const studentsMap: Record<string, any[]> = (db?.studentsStore as any) || {};
  const allStudents: any[] = [];
  Object.entries(studentsMap).forEach(([batchId, list]) => {
    if (Array.isArray(list)) {
      list.forEach(s => allStudents.push({ ...s, batchId }));
    }
  });

  if (allStudents.length > 0) {
    try {
      const records = allStudents.map(s => ({
        id: toUUID(s.id),
        batch_id: toUUID(s.batchId),
        class_id: s.classId ? toUUID(s.classId) : null,
        student_code: s.studentCode || `STU-${s.id}`,
        full_name: s.name || s.fullName || 'طالب جديد',
        points: typeof s.points === 'number' ? Math.max(0, s.points) : 0,
        avatar_url: s.avatarUrl || null,
        notes: s.notes || null,
        status: s.status === 'inactive' ? 'inactive' : 'active'
      }));

      const { error } = await supabase.from('students').upsert(records, { onConflict: 'id' });
      summary.tables['students'] = {
        attempted: records.length,
        inserted: error ? 0 : records.length,
        error: error ? error.message : null
      };
      if (error) summary.unmigratedRecords.push(`students (${records.length} records): ${error.message}`);
    } catch (err: any) {
      summary.tables['students'] = { attempted: allStudents.length, inserted: 0, error: err.message };
    }
  } else {
    summary.tables['students'] = { attempted: 0, inserted: 0, error: null };
  }

  // 5. CLUBS & 6. CLUB MEMBERS
  const clubsMap: Record<string, any[]> = (db?.clubsStore as any) || {};
  const allClubs: any[] = [];
  const allClubMembers: any[] = [];

  Object.entries(clubsMap).forEach(([batchId, list]) => {
    if (Array.isArray(list)) {
      list.forEach(cl => {
        allClubs.push({ ...cl, batchId });
        if (Array.isArray(cl.memberStudentIds)) {
          cl.memberStudentIds.forEach((stdId: string) => {
            allClubMembers.push({
              id: toUUID(`cm-${cl.id}-${stdId}`),
              club_id: toUUID(cl.id),
              student_id: toUUID(stdId)
            });
          });
        }
      });
    }
  });

  if (allClubs.length > 0) {
    try {
      const records = allClubs.map(cl => ({
        id: toUUID(cl.id),
        batch_id: toUUID(cl.batchId),
        teacher_id: defaultTeacherId,
        name: cl.name || 'نادي جديد',
        description: cl.description || '',
        supervisor_name: cl.supervisorName || 'المشرف',
        category: cl.category || 'عام',
        slogan: cl.slogan || ''
      }));

      const { error } = await supabase.from('clubs').upsert(records, { onConflict: 'id' });
      summary.tables['clubs'] = {
        attempted: records.length,
        inserted: error ? 0 : records.length,
        error: error ? error.message : null
      };
      if (error) summary.unmigratedRecords.push(`clubs (${records.length} records): ${error.message}`);
    } catch (err: any) {
      summary.tables['clubs'] = { attempted: allClubs.length, inserted: 0, error: err.message };
    }
  } else {
    summary.tables['clubs'] = { attempted: 0, inserted: 0, error: null };
  }

  if (allClubMembers.length > 0) {
    try {
      const { error } = await supabase.from('club_members').upsert(allClubMembers, { onConflict: 'id' });
      summary.tables['club_members'] = {
        attempted: allClubMembers.length,
        inserted: error ? 0 : allClubMembers.length,
        error: error ? error.message : null
      };
      if (error) summary.unmigratedRecords.push(`club_members (${allClubMembers.length} records): ${error.message}`);
    } catch (err: any) {
      summary.tables['club_members'] = { attempted: allClubMembers.length, inserted: 0, error: err.message };
    }
  } else {
    summary.tables['club_members'] = { attempted: 0, inserted: 0, error: null };
  }

  // 7. CHALLENGES
  const challengesMap: Record<string, any[]> = (db?.challengesStore as any) || {};
  const allChallenges: any[] = [];
  Object.entries(challengesMap).forEach(([batchId, list]) => {
    if (Array.isArray(list)) {
      list.forEach(ch => allChallenges.push({ ...ch, batchId }));
    }
  });

  if (allChallenges.length > 0) {
    try {
      const records = allChallenges.map(ch => ({
        id: toUUID(ch.id),
        batch_id: toUUID(ch.batchId),
        teacher_id: defaultTeacherId,
        title: ch.title || 'تحدي جديد',
        description: ch.description || '',
        category: ['daily', 'weekly', 'monthly'].includes(ch.category) ? ch.category : 'daily',
        reward_xp: ch.rewardXp || ch.points || 50,
        status: ['active', 'upcoming', 'completed'].includes(ch.status) ? ch.status : 'active',
        due_date: ch.dueDate || null,
        target_type: ['all', 'batch', 'class', 'club', 'student'].includes(ch.targetType) ? ch.targetType : 'all',
        target_id: ch.targetId ? toUUID(ch.targetId) : null,
        target_name: ch.targetName || null
      }));

      const { error } = await supabase.from('challenges').upsert(records, { onConflict: 'id' });
      summary.tables['challenges'] = {
        attempted: records.length,
        inserted: error ? 0 : records.length,
        error: error ? error.message : null
      };
      if (error) summary.unmigratedRecords.push(`challenges (${records.length} records): ${error.message}`);
    } catch (err: any) {
      summary.tables['challenges'] = { attempted: allChallenges.length, inserted: 0, error: err.message };
    }
  } else {
    summary.tables['challenges'] = { attempted: 0, inserted: 0, error: null };
  }

  // 8. CHALLENGE SUBMISSIONS
  const submissionsMap: Record<string, any[]> = (db?.submissionsStore as any) || {};
  const allSubmissions: any[] = [];
  Object.entries(submissionsMap).forEach(([batchId, list]) => {
    if (Array.isArray(list)) {
      list.forEach(sub => allSubmissions.push({ ...sub, batchId }));
    }
  });

  if (allSubmissions.length > 0) {
    try {
      const records = allSubmissions.map(sub => ({
        id: toUUID(sub.id),
        batch_id: toUUID(sub.batchId),
        challenge_id: sub.challengeId ? toUUID(sub.challengeId) : null,
        student_id: toUUID(sub.studentId),
        source_type: ['club', 'challenge', 'regular'].includes(sub.sourceType) ? sub.sourceType : 'challenge',
        source_name: sub.sourceName || 'تحدي',
        submission_content: sub.submissionContent || sub.content || '',
        reward_xp: sub.rewardXp || 50,
        status: ['pending', 'approved', 'rejected'].includes(sub.status) ? sub.status : 'pending',
        teacher_notes: sub.teacherNotes || null
      }));

      const { error } = await supabase.from('challenge_submissions').upsert(records, { onConflict: 'id' });
      summary.tables['challenge_submissions'] = {
        attempted: records.length,
        inserted: error ? 0 : records.length,
        error: error ? error.message : null
      };
      if (error) summary.unmigratedRecords.push(`challenge_submissions (${records.length} records): ${error.message}`);
    } catch (err: any) {
      summary.tables['challenge_submissions'] = { attempted: allSubmissions.length, inserted: 0, error: err.message };
    }
  } else {
    summary.tables['challenge_submissions'] = { attempted: 0, inserted: 0, error: null };
  }

  // 9. JOURNEY SETTINGS
  const journeyStations: any[] = (settings?.journeyStations as any[]) || [];
  if (batchesStore.length > 0 && journeyStations.length > 0) {
    const allJourneySettings: any[] = [];
    batchesStore.forEach(b => {
      journeyStations.forEach(st => {
        allJourneySettings.push({
          id: toUUID(`js-${b.id}-${st.level}`),
          batch_id: toUUID(b.id),
          station_level: st.level,
          title: st.title,
          badge_name: st.badgeName,
          threshold: st.threshold,
          icon: st.icon || '🌱',
          description: st.description || null,
          requirements_summary: st.requirementsSummary || null
        });
      });
    });

    try {
      const { error } = await supabase.from('journey_settings').upsert(allJourneySettings, { onConflict: 'batch_id,station_level' });
      summary.tables['journey_settings'] = {
        attempted: allJourneySettings.length,
        inserted: error ? 0 : allJourneySettings.length,
        error: error ? error.message : null
      };
      if (error) summary.unmigratedRecords.push(`journey_settings (${allJourneySettings.length} records): ${error.message}`);
    } catch (err: any) {
      summary.tables['journey_settings'] = { attempted: allJourneySettings.length, inserted: 0, error: err.message };
    }
  } else {
    summary.tables['journey_settings'] = { attempted: 0, inserted: 0, error: null };
  }

  // 10. SYSTEM SETTINGS
  if (batchesStore.length > 0 && settings) {
    const systemRecords = batchesStore.map(b => ({
      id: toUUID(`sys-settings-${b.id}`),
      batch_id: toUUID(b.id),
      teacher_id: defaultTeacherId,
      rewards_config: settings.rewards || {},
      branding_config: settings.general || {},
      leaderboard_config: settings.ui || {}
    }));

    try {
      const { error } = await supabase.from('system_settings').upsert(systemRecords, { onConflict: 'batch_id' });
      summary.tables['system_settings'] = {
        attempted: systemRecords.length,
        inserted: error ? 0 : systemRecords.length,
        error: error ? error.message : null
      };
      if (error) summary.unmigratedRecords.push(`system_settings (${systemRecords.length} records): ${error.message}`);
    } catch (err: any) {
      summary.tables['system_settings'] = { attempted: systemRecords.length, inserted: 0, error: err.message };
    }
  } else {
    summary.tables['system_settings'] = { attempted: 0, inserted: 0, error: null };
  }

  // 11. LIBRARY ITEMS
  const libraryMap: Record<string, any[]> = (db?.libraryStore as any) || {};
  const allLibrary: any[] = [];
  Object.entries(libraryMap).forEach(([batchId, list]) => {
    if (Array.isArray(list)) {
      list.forEach(lib => allLibrary.push({ ...lib, batchId }));
    }
  });

  if (allLibrary.length > 0) {
    try {
      const records = allLibrary.map(lib => ({
        id: toUUID(lib.id),
        batch_id: toUUID(lib.batchId),
        teacher_id: defaultTeacherId,
        title: lib.title || 'مورد جديد',
        description: lib.description || '',
        file_type: ['pdf', 'video', 'audio', 'image', 'link', 'doc'].includes(lib.fileType) ? lib.fileType : 'pdf',
        file_size: lib.fileSize || '',
        url: lib.url || '',
        thumbnail_url: lib.thumbnailUrl || null,
        category: lib.category || 'عام',
        target_type: ['all', 'batch', 'class', 'club', 'student'].includes(lib.targetType) ? lib.targetType : 'all',
        target_id: lib.targetId ? toUUID(lib.targetId) : null
      }));

      const { error } = await supabase.from('library_items').upsert(records, { onConflict: 'id' });
      summary.tables['library_items'] = {
        attempted: records.length,
        inserted: error ? 0 : records.length,
        error: error ? error.message : null
      };
      if (error) summary.unmigratedRecords.push(`library_items (${records.length} records): ${error.message}`);
    } catch (err: any) {
      summary.tables['library_items'] = { attempted: allLibrary.length, inserted: 0, error: err.message };
    }
  } else {
    summary.tables['library_items'] = { attempted: 0, inserted: 0, error: null };
  }

  // 12. TEACHER MESSAGES
  const announcementsMap: Record<string, any[]> = (db?.announcementsStore as any) || {};
  const allAnnouncements: any[] = [];
  Object.entries(announcementsMap).forEach(([batchId, list]) => {
    if (Array.isArray(list)) {
      list.forEach(ann => allAnnouncements.push({ ...ann, batchId }));
    }
  });

  if (allAnnouncements.length > 0) {
    try {
      const records = allAnnouncements.map(ann => ({
        id: toUUID(ann.id),
        batch_id: toUUID(ann.batchId),
        teacher_id: defaultTeacherId,
        title: ann.title || 'تنبيه جديد',
        content: ann.content || '',
        author: ann.author || 'المعلم',
        pinned: Boolean(ann.pinned),
        target_type: ['all', 'batch', 'class', 'club', 'student'].includes(ann.targetType) ? ann.targetType : 'all',
        target_id: ann.targetId ? toUUID(ann.targetId) : null,
        target_name: ann.targetName || null
      }));

      const { error } = await supabase.from('teacher_messages').upsert(records, { onConflict: 'id' });
      summary.tables['teacher_messages'] = {
        attempted: records.length,
        inserted: error ? 0 : records.length,
        error: error ? error.message : null
      };
      if (error) summary.unmigratedRecords.push(`teacher_messages (${records.length} records): ${error.message}`);
    } catch (err: any) {
      summary.tables['teacher_messages'] = { attempted: allAnnouncements.length, inserted: 0, error: err.message };
    }
  } else {
    summary.tables['teacher_messages'] = { attempted: 0, inserted: 0, error: null };
  }

  const hasErrors = Object.values(summary.tables).some(t => t.error !== null);
  summary.success = !hasErrors;

  console.log('[Migration Completed] Summary:', summary);
  return summary;
}

export interface BatchMigrationReport {
  localStorageBatchCount: number;
  supabaseBatchCountBefore: number;
  insertedCount: number;
  skippedCount: number;
  failedCount: number;
  migratedBatches: Array<{ id: string; originalId: string; name: string; code: string }>;
  errors: string[];
  allRecordsMatchSource: boolean;
  supabaseBatchCountAfter: number;
}

/**
 * Safely migrates ONLY the Batches for the currently authenticated teacher.
 * Idempotent: Skips any batches that already exist in Supabase for this teacher.
 */
export async function migrateBatchesOnlyForAuthenticatedTeacher(): Promise<BatchMigrationReport> {
  const report: BatchMigrationReport = {
    localStorageBatchCount: 0,
    supabaseBatchCountBefore: 0,
    insertedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    migratedBatches: [],
    errors: [],
    allRecordsMatchSource: false,
    supabaseBatchCountAfter: 0,
  };

  if (!isSupabaseConfigured) {
    report.errors.push('Supabase is not configured.');
    return report;
  }

  // 1. Get current authenticated user from Supabase
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    report.errors.push('No authenticated teacher session found in Supabase Auth.');
    return report;
  }
  const teacherId = user.id;

  // 2. Read current batches from localStorage
  const backup = getRihlatLocalStorageBackup();
  const db = backup.keys.rihlat_teacher_db_v3;
  let batchesStore: any[] = (db?.batchesStore as any[]) || [];

  if (batchesStore.length === 0 && typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem('rihlat_teacher_db_v3');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.batchesStore)) {
          batchesStore = parsed.batchesStore;
        }
      }
    } catch (_) {}
  }

  if (batchesStore.length === 0) {
    batchesStore = [
      {
        id: 'batch-g6-f',
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
  }

  report.localStorageBatchCount = batchesStore.length;

  // 3. Read existing batches belonging to the authenticated teacher from Supabase
  const { data: existingBatches, error: fetchError } = await supabase
    .from('batches')
    .select('*')
    .eq('teacher_id', teacherId);

  if (fetchError) {
    report.errors.push(`Failed to fetch existing batches from Supabase: ${fetchError.message}`);
    return report;
  }

  const existingList = existingBatches || [];
  report.supabaseBatchCountBefore = existingList.length;
  const existingMap = new Map<string, any>(existingList.map(b => [b.id, b]));

  // 4. Determine missing batches to insert
  const missingBatches: any[] = [];
  for (const b of batchesStore) {
    const uuid = toUUID(b.id);
    if (existingMap.has(uuid)) {
      report.skippedCount++;
    } else {
      missingBatches.push({
        id: uuid,
        teacher_id: teacherId,
        name: b.name || 'دفعة بدون عنوان',
        code: b.code || `BTC-${b.id}`,
        stage: b.stage || 'المرحلة العامة',
        supervisor_name: b.supervisorName || b.supervisor_name || null,
        description: b.description || null,
        gender: ['female', 'male', 'mixed'].includes(b.gender) ? b.gender : 'female',
        color_gradient: b.colorGradient || b.color_gradient || 'from-teal-600 to-emerald-600',
        created_at: b.createdAt || b.created_at || new Date().toISOString(),
        _originalId: b.id,
      });
    }
  }

  // 5. Insert missing batches individually to ensure precise reporting
  for (const record of missingBatches) {
    const originalId = record._originalId;
    const { _originalId, ...payload } = record;

    const { error: insertError } = await supabase
      .from('batches')
      .insert(payload);

    if (insertError) {
      report.failedCount++;
      report.errors.push(`Failed to insert batch '${payload.name}' (${payload.code}): ${insertError.message}`);
    } else {
      report.insertedCount++;
      report.migratedBatches.push({
        id: payload.id,
        originalId,
        name: payload.name,
        code: payload.code,
      });
    }
  }

  // 6. Verify final Supabase batch count
  const { data: finalBatches, error: finalFetchError } = await supabase
    .from('batches')
    .select('*')
    .eq('teacher_id', teacherId);

  if (!finalFetchError && finalBatches) {
    report.supabaseBatchCountAfter = finalBatches.length;

    // 7. Compare every migrated batch with original localStorage data
    const finalMap = new Map<string, any>(finalBatches.map(b => [b.id, b]));
    let allMatch = true;

    for (const b of batchesStore) {
      const uuid = toUUID(b.id);
      const row = finalMap.get(uuid);
      if (!row) {
        allMatch = false;
        break;
      }
      if (
        row.name !== (b.name || 'دفعة بدون عنوان') ||
        row.code !== (b.code || `BTC-${b.id}`) ||
        row.teacher_id !== teacherId
      ) {
        allMatch = false;
        break;
      }
    }
    report.allRecordsMatchSource = allMatch;
  }

  return report;
}

if (typeof window !== 'undefined') {
  (window as unknown as { migrateBatchesOnly: typeof migrateBatchesOnlyForAuthenticatedTeacher }).migrateBatchesOnly = migrateBatchesOnlyForAuthenticatedTeacher;
}

