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
  achievementXpMultiplier: number;
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
  type: 'achievement' | 'challenge' | 'club' | 'evaluation' | 'system';
}

export interface SystemSettings {
  stations: JourneyStationSetting[];
  rewards: XpAndRewardSettings;
  branding: BrandingSettings;
  leaderboard: LeaderboardSettings;
  achievementCategories: string[];
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
      description: 'المواظبة العالية وحصد الأوسمة والإنجازات المعتمدة.',
      requirementsSummary: 'جمع 500 نقطة وإنجازين معتمدين',
    },
    {
      id: 'st-3',
      level: 4,
      title: '💎 متميز',
      badge: 'متميز',
      threshold: 1000,
      icon: '💎',
      description: 'التفوق والانضباط التام والمشاركة الفاعلة بأندية النشاط.',
      requirementsSummary: 'جمع 1000 نقطة و 3 أوسمة معتمدة',
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
    achievementXpMultiplier: 100,
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
  achievementCategories: [
    'قرآني وإيماني',
    'تربوي وسلوكي',
    'علمي ومكتبي',
    'اجتماعي ونادي',
    'قيادي وقدوة',
  ],
  notificationTemplates: [
    {
      id: 'tpl-1',
      title: '🎉 تهانينا! إنجاز معتمد جديد',
      body: 'قام المعلم باعتتماد إنجازك {{achievementTitle}} وأضيفت {{xp}} XP لرصيدك!',
      type: 'achievement',
    },
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

const SETTINGS_STORAGE_KEY = 'rihlat_system_settings_v1';

let currentSettings: SystemSettings = loadSettings();
const listeners: Array<(settings: SystemSettings) => void> = [];

function loadSettings(): SystemSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_SYSTEM_SETTINGS, ...parsed };
    }
  } catch (err) {
    console.warn('Failed to load system settings, falling back to defaults:', err);
  }
  return DEFAULT_SYSTEM_SETTINGS;
}

export function getSystemSettings(): SystemSettings {
  currentSettings = loadSettings();
  return currentSettings;
}

export function saveSystemSettings(newSettings: SystemSettings): SystemSettings {
  currentSettings = { ...newSettings };
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(currentSettings));
  } catch (err) {
    console.error('Failed to persist system settings:', err);
    throw new Error('فشل حفظ الإعدادات في التخزين المحلي. يرجى التحقق من مساحة التخزين.');
  }
  // Notify all active subscribers
  listeners.forEach((listener) => listener(currentSettings));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('rihlat_settings_updated'));
    window.dispatchEvent(new Event('rihlat_db_updated'));
    window.dispatchEvent(new Event('storage'));
  }
  return currentSettings;
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', () => {
    currentSettings = loadSettings();
    listeners.forEach((listener) => listener(currentSettings));
  });
  window.addEventListener('rihlat_settings_updated', () => {
    currentSettings = loadSettings();
    listeners.forEach((listener) => listener(currentSettings));
  });
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
