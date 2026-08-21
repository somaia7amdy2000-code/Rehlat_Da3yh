import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface JourneyStationSetting {
  id: string;
  level: number;
  title: string;
  badge: string;
  threshold: number;
  icon: string;
  description: string;
  requirementsSummary: string;
}

export interface XpAndRewardSettings {
  challengeXpMultiplier: number;
  clubTaskXpMultiplier: number;
  clubAnnouncementXpMultiplier: number;
  teacherEvaluationXpMultiplier: number;
  libraryViewXpMultiplier: number;
  specialRewardXpMultiplier: number;
  attendanceMaxXp: number;
  badgeXpMultiplier: number;
  challengeDefaultPoints: number;
  evaluationDefaultPoints: number;
  libraryRewardXp: number;
  clubTaskRewardXp: number;
  attendanceBasePoints: number;
}

export interface BrandingSettings {
  appName: string;
  appLogo: string;
  primaryColor: string;
  secondaryColor: string;
  journeyBgImage: string;
  enableAnimations: boolean;
  themeMode: 'light' | 'emerald' | 'indigo' | 'dark';
}

export interface LeaderboardSettings {
  showTopCount: number;
  enableXpLeaderboard: boolean;
  enablePointsLeaderboard: boolean;
  enableClassLeaderboard: boolean;
}

export interface NotificationTemplate {
  id: string;
  title: string;
  body: string;
  type: 'challenge' | 'club' | 'evaluation' | 'system';
}

export interface SystemSettings {
  stations: JourneyStationSetting[];
  rewards: XpAndRewardSettings;
  branding: BrandingSettings;
  leaderboard: LeaderboardSettings;
  notificationTemplates: NotificationTemplate[];
}

// Default Seed Settings
export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  stations: [
    {
      id: 'st-0',
      level: 1,
      title: '🌱 البداية',
      badge: 'البداية',
      threshold: 0,
      icon: '🌱',
      description: 'بداية الانطلاق والمشاركة في الأنشطة القرآنية والتربوية.',
      requirementsSummary: 'التسجيل والمشاركة الأولية بالحلقة',
    },
    {
      id: 'st-1',
      level: 2,
      title: '📖 طالب علم',
      badge: 'طالب علم',
      threshold: 200,
      icon: '📖',
      description: 'الالتزام بحلقات القرآن والبدء في حل التحديات الإيمانية.',
      requirementsSummary: 'جمع 200 نقطة وإكمال التحديات الأولى',
    },
    {
      id: 'st-2',
      level: 3,
      title: '⭐ مجتهد',
      badge: 'مجتهد',
      threshold: 500,
      icon: '⭐',
      description: 'المواظبة العالية والمشاركة الفاعلة.',
      requirementsSummary: 'جمع 500 نقطة وإكمال التحديات',
    },
    {
      id: 'st-3',
      level: 4,
      title: '💎 متميز',
      badge: 'متميز',
      threshold: 1000,
      icon: '💎',
      description: 'التفوق والانضباط التام والمشاركة الفاعلة بأندية النشاط.',
      requirementsSummary: 'جمع 1000 نقطة والمشاركة بالأنشطة',
    },
    {
      id: 'st-4',
      level: 5,
      title: '🌟 مؤثر',
      badge: 'مؤثر',
      threshold: 1800,
      icon: '🌟',
      description: 'مساعدة الزميلات وإفادة الحلقة والمواظبة على المطالعة.',
      requirementsSummary: 'جمع 1800 نقطة وتقييمات إيجابية متكررة',
    },
    {
      id: 'st-5',
      level: 6,
      title: '👑 قدوة',
      badge: 'قدوة',
      threshold: 2800,
      icon: '👑',
      description: 'أعلى محطة بالرحلة، حيث تكون الطالبة قدوة حسنة في حفظ القرآن وسلوكه.',
      requirementsSummary: 'جمع 2800 نقطة واجتياز جميع المعايير بامتياز',
    },
  ],
  rewards: {
    challengeXpMultiplier: 50,
    clubTaskXpMultiplier: 40,
    clubAnnouncementXpMultiplier: 15,
    teacherEvaluationXpMultiplier: 60,
    libraryViewXpMultiplier: 25,
    specialRewardXpMultiplier: 80,
    attendanceMaxXp: 150,
    badgeXpMultiplier: 45,
    challengeDefaultPoints: 50,
    evaluationDefaultPoints: 60,
    libraryRewardXp: 25,
    clubTaskRewardXp: 40,
    attendanceBasePoints: 10,
  },
  branding: {
    appName: 'رحلة الداعية الصغير 🕌',
    appLogo: '✨',
    primaryColor: '#0d9488', // teal-600
    secondaryColor: '#10b981', // emerald-500
    journeyBgImage: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=1200',
    enableAnimations: true,
    themeMode: 'emerald',
  },
  leaderboard: {
    showTopCount: 10,
    enableXpLeaderboard: true,
    enablePointsLeaderboard: true,
    enableClassLeaderboard: true,
  },
  notificationTemplates: [
    {
      id: 'tpl-2',
      title: '🏆 إكمال تحدي بنجاح',
      body: 'تم تسجيل إكمال التحدي {{challengeTitle}} بنجاح!',
      type: 'challenge',
    },
    {
      id: 'tpl-3',
      title: '⭐ ثناء وتقييم إيجابي',
      body: 'حصلت على ثناء ممتاز من معلمتك: {{evaluationNote}}',
      type: 'evaluation',
    },
    {
      id: 'tpl-4',
      title: '📢 إعلان جديد في النادي',
      body: 'تم نشر إعلان جديد في {{clubName}}: {{announcementTitle}}',
      type: 'club',
    },
  ],
};

// In-memory cache for fast lookups per batch (populated exclusively from Supabase)
const batchStationsCache = new Map<string, JourneyStationSetting[]>();

export function isValidUUID(id?: string): boolean {
  return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Validation for stations configuration
 */
export function validateStations(stations: JourneyStationSetting[]): { isValid: boolean; error?: string } {
  if (!stations || !Array.isArray(stations) || stations.length === 0) {
    return { isValid: false, error: 'يجب أن يحتوي النظام على محطة واحدة على الأقل في الرحلة.' };
  }

  for (let i = 0; i < stations.length; i++) {
    const st = stations[i];
    if (!st.title || !st.title.trim()) {
      return { isValid: false, error: `يرجى كتابة عنوان صالح للمحطة رقم ${i + 1}.` };
    }
    if (!st.badge || !st.badge.trim()) {
      return { isValid: false, error: `يرجى كتابة اسم الشارة للمحطة "${st.title}".` };
    }
    if (typeof st.threshold !== 'number' || isNaN(st.threshold)) {
      return { isValid: false, error: `قيمة عتبة النقاط للمحطة "${st.title}" غير صالحة.` };
    }
    if (st.threshold < 0) {
      return { isValid: false, error: `لا يمكن إدخال قيم سالبة لعتبات النقاط في المحطة "${st.title}".` };
    }
  }

  // First station must start at 0
  if (stations[0].threshold !== 0) {
    return { isValid: false, error: 'يجب أن تبدأ المحطة الأولى دائماً بعتبة 0 XP (نقطة الانطلاق).' };
  }

  // Thresholds must be strictly ascending (prevents overlapping and invalid ranges)
  for (let i = 1; i < stations.length; i++) {
    if (stations[i].threshold <= stations[i - 1].threshold) {
      return {
        isValid: false,
        error: `يجب أن تكون عتبة المحطة "${stations[i].title}" (${stations[i].threshold} XP) أكبر تماماً من عتبة المحطة السابقة "${stations[i - 1].title}" (${stations[i - 1].threshold} XP) لتجنب تداخل المستويات.`,
      };
    }
  }

  return { isValid: true };
}

let currentSettings: SystemSettings = DEFAULT_SYSTEM_SETTINGS;
const listeners: Array<(settings: SystemSettings) => void> = [];

export function getSystemSettings(): SystemSettings {
  return currentSettings;
}

/**
 * Synchronous retrieval of batch stations from in-memory cache (populated by Supabase),
 * falling back to default stations if not yet loaded or not configured.
 */
export function getBatchStationsSync(batchId?: string): JourneyStationSetting[] {
  if (!batchId) {
    return DEFAULT_SYSTEM_SETTINGS.stations;
  }

  if (batchStationsCache.has(batchId)) {
    return batchStationsCache.get(batchId)!;
  }

  return DEFAULT_SYSTEM_SETTINGS.stations;
}

/**
 * Asynchronous retrieval of batch stations from Supabase (Source of Truth).
 * If no custom settings exist for this batch in Supabase, returns DEFAULT_SYSTEM_SETTINGS.stations.
 */
export async function getBatchStations(batchId?: string): Promise<JourneyStationSetting[]> {
  if (!batchId || !isValidUUID(batchId)) {
    return DEFAULT_SYSTEM_SETTINGS.stations;
  }

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('id, batch_id, stations_config')
        .eq('batch_id', batchId)
        .maybeSingle();

      if (error) {
        console.warn(`[SystemSettings] Error querying system_settings for batch ${batchId}:`, error.message);
      } else if (data && data.stations_config && Array.isArray(data.stations_config) && data.stations_config.length > 0) {
        const validated = validateStations(data.stations_config);
        if (validated.isValid) {
          batchStationsCache.set(batchId, data.stations_config);
          return data.stations_config;
        }
      } else {
        // No custom record in Supabase for this batch; clear any stale memory cache
        batchStationsCache.delete(batchId);
      }
    } catch (err) {
      console.warn('[SystemSettings] Failed to fetch batch stations from Supabase:', err);
    }
  }

  return getBatchStationsSync(batchId);
}

/**
 * Asynchronous retrieval of batch journey stations specifically for Student Portal via secure RPC.
 */
export async function getStudentJourneyStations(
  studentId: string,
  studentCode: string
): Promise<JourneyStationSetting[] | null> {
  if (!isSupabaseConfigured || !isValidUUID(studentId) || !studentCode) {
    return null;
  }

  try {
    const { data, error } = await supabase.rpc('get_student_journey_stations', {
      p_student_id: studentId,
      p_student_code: studentCode.trim(),
    });

    if (error) {
      console.warn('[SystemSettings] get_student_journey_stations RPC error:', error.message);
      return null;
    }

    if (data && Array.isArray(data) && data.length > 0) {
      const validated = validateStations(data);
      if (validated.isValid) {
        return data;
      }
    }
  } catch (err) {
    console.warn('[SystemSettings] Failed to fetch student journey stations via RPC:', err);
  }

  return null;
}

/**
 * Save batch stations with Supabase as Source of Truth and strict validation.
 * Uses atomic upsert on batch_id with fallback to insert/update.
 */
export async function saveBatchStations(
  batchId: string | undefined,
  stations: JourneyStationSetting[]
): Promise<JourneyStationSetting[]> {
  const validation = validateStations(stations);
  if (!validation.isValid) {
    throw new Error(validation.error || 'إعدادات المحطات غير صالحة.');
  }

  if (!batchId || !isValidUUID(batchId)) {
    throw new Error('يرجى تحديد دفعة صالحة لحفظ الإعدادات الخاصة بها.');
  }

  // Normalize station levels and threshold numbers
  const normalizedStations: JourneyStationSetting[] = stations.map((st, idx) => ({
    ...st,
    level: idx + 1,
    threshold: Number(st.threshold) || 0,
  }));

  // 1. SUPABASE IS THE TRUE SOURCE OF TRUTH
  if (isSupabaseConfigured) {
    // Attempt upsert on batch_id
    const { error: upsertErr } = await supabase
      .from('system_settings')
      .upsert(
        {
          batch_id: batchId,
          stations_config: normalizedStations,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'batch_id' }
      );

    if (upsertErr) {
      console.warn('[SystemSettings] Upsert failed, attempting check and update/insert:', upsertErr.message);

      // Fallback in case unique index is not yet applied: check if row exists
      const { data: existing, error: selectErr } = await supabase
        .from('system_settings')
        .select('id')
        .eq('batch_id', batchId)
        .maybeSingle();

      if (selectErr) {
        throw new Error(`تعذر الاتصال بقاعدة البيانات للتحقق من إعدادات الدفعة: ${selectErr.message}`);
      }

      if (existing && existing.id) {
        const { error: updateErr } = await supabase
          .from('system_settings')
          .update({
            stations_config: normalizedStations,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (updateErr) {
          throw new Error(`فشل تحديث إعدادات المحطات في قاعدة البيانات: ${updateErr.message}`);
        }
      } else {
        const { error: insertErr } = await supabase
          .from('system_settings')
          .insert({
            batch_id: batchId,
            stations_config: normalizedStations,
            updated_at: new Date().toISOString(),
          });

        if (insertErr) {
          throw new Error(`فشل إنشاء إعدادات المحطات في قاعدة البيانات: ${insertErr.message}`);
        }
      }
    }
  }

  // 2. UPDATE IN-MEMORY CACHE ON SUCCESS
  batchStationsCache.set(batchId, normalizedStations);
  currentSettings.stations = normalizedStations;

  // 3. NOTIFY SUBSCRIBERS
  listeners.forEach((listener) => listener(currentSettings));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('rihlat_settings_updated'));
    window.dispatchEvent(new Event('rihlat_db_updated'));
  }

  return normalizedStations;
}

export function saveSystemSettings(newSettings: SystemSettings): SystemSettings {
  const validation = validateStations(newSettings.stations);
  if (!validation.isValid) {
    throw new Error(validation.error || 'إعدادات المحطات غير صالحة.');
  }

  currentSettings = { ...newSettings };

  // Notify all active subscribers
  listeners.forEach((listener) => listener(currentSettings));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('rihlat_settings_updated'));
    window.dispatchEvent(new Event('rihlat_db_updated'));
  }
  return currentSettings;
}

export function subscribeToSettings(listener: (settings: SystemSettings) => void): () => void {
  listeners.push(listener);
  // Immediate trigger
  listener(currentSettings);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

export function resetSettingsToDefault(): SystemSettings {
  return saveSystemSettings(DEFAULT_SYSTEM_SETTINGS);
}

