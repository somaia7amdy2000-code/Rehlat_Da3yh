import { YouthLevel } from '../components/YouthMainApp';
import { getSystemSettings, JourneyStationSetting } from './systemSettingsService';
import { teacherService } from './teacherService';

export interface StudentJourneyMetrics {
  id: string;
  name: string;
  studentCode?: string;
  batchId?: string;
  className?: string;
  clubName?: string;
  xp: number;
  points: number;
  completedChallengesCount: number;
  approvedAchievementsCount: number;
  clubTasksCompleted: number;
  clubAnnouncementsCount: number;
  attendanceRate: number; // 0 - 100%
  teacherEvaluationsCount: number;
  libraryViewsCount: number;
  specialRewardsCount: number;
  badgesEarnedCount: number;
  avatarUrl?: string;
}

export interface JourneyCalculationResult {
  student: StudentJourneyMetrics;
  currentStationIndex: number;
  currentStation: YouthLevel;
  nextStation: YouthLevel | null;
  dynamicStations: YouthLevel[];
  journeyPercentage: number; // 0 to 100
  levelProgressRatio: number; // 0.0 to 1.0 (exact progress ratio between current level threshold and next level threshold)
  currentLevelThreshold: number;
  nextLevelThreshold: number;
  totalWeightedScore: number;
  remainingRequirements: Array<{
    title: string;
    required: number | string;
    current: number | string;
    completed: boolean;
  }>;
  breakdown: Array<{
    label: string;
    icon: string;
    value: string;
    contributionXp: number;
  }>;
}

/**
 * Calculates student journey metrics, percentage, and station level live.
 * READ-ONLY computation based on real teacher approvals & student activities.
 */
export function calculateStudentJourney(
  metrics: StudentJourneyMetrics,
  customStations?: JourneyStationSetting[]
): JourneyCalculationResult {
  console.log('[DEBUG 4] JourneyEngine input metrics:', metrics);
  
  let configuredStations = customStations;
  if (!configuredStations && metrics.batchId) {
    try {
      configuredStations = teacherService.getBatchStationsSync(metrics.batchId);
    } catch (e) {
      // Fallback to system settings
    }
  }
  if (!configuredStations || configuredStations.length === 0) {
    configuredStations = getSystemSettings().stations;
  }

  const settings = getSystemSettings();
  const { rewards } = settings;

  const {
    xp = 0,
    points = 0,
    completedChallengesCount = 0,
    approvedAchievementsCount = 0,
    clubTasksCompleted = 0,
    clubAnnouncementsCount = 0,
    attendanceRate = 0,
    teacherEvaluationsCount = 0,
    libraryViewsCount = 0,
    specialRewardsCount = 0,
    badgesEarnedCount = 0,
  } = metrics;

  // Real persisted points are the authoritative score
  const totalWeightedScore = Math.max(0, points, xp);

  const challengesXp = completedChallengesCount * (rewards.challengeXpMultiplier || 50);
  const achievementsXp = approvedAchievementsCount * (rewards.achievementXpMultiplier || 100);
  const clubXp = clubTasksCompleted * (rewards.clubTaskXpMultiplier || 40);
  const evaluationsXp = teacherEvaluationsCount * (rewards.teacherEvaluationXpMultiplier || 60);
  const libraryXp = libraryViewsCount * (rewards.libraryViewXpMultiplier || 25);
  const rewardsXp = specialRewardsCount * (rewards.specialRewardXpMultiplier || 80);
  const attendanceXp = Math.floor((attendanceRate / 100) * (rewards.attendanceMaxXp || 150));
  const badgesXp = badgesEarnedCount * (rewards.badgeXpMultiplier || 45);

  const stationThresholds = configuredStations.map((st) => Number(st.threshold) || 0);

  // Calculate station index based on current thresholds
  let currentStationIndex = 0;
  for (let i = stationThresholds.length - 1; i >= 0; i--) {
    if (totalWeightedScore >= stationThresholds[i]) {
      currentStationIndex = i;
      break;
    }
  }

  // Build station levels dynamically from configured stations
  const dynamicStations: YouthLevel[] = configuredStations.map((st, idx) => {
    const thresh = Number(st.threshold) || 0;
    return {
      id: st.id || `lvl-${idx + 1}`,
      levelNumber: idx + 1,
      title: st.title,
      nameOnly: st.badge || st.title,
      emoji: st.icon || '🌱',
      status: idx === currentStationIndex ? 'current' : idx < currentStationIndex ? 'completed' : 'locked',
      shape: idx % 2 === 0 ? 'shield' : 'hexagon',
      material: idx === 0 ? 'emerald' : idx === 1 ? 'cyan' : idx === 2 ? 'gold' : idx === 3 ? 'sapphire' : idx === 4 ? 'purple' : 'crown',
      description: st.description,
      requiredTasks: [
        { text: `جمع ${thresh} XP في التطبيق`, done: totalWeightedScore >= thresh },
        { text: st.requirementsSummary || 'إكمال التحديات والتقييمات الإيمانية', done: totalWeightedScore >= thresh },
      ],
      rewardTitle: `وسام ${st.badge || st.title}`,
      rewardPoints: thresh,
      rewardIcon: st.icon || '🏆',
    };
  });

  const currentStation = dynamicStations[currentStationIndex] || dynamicStations[0];
  const nextStation = dynamicStations[currentStationIndex + 1] || null;

  const currentLevelThreshold = stationThresholds[currentStationIndex] || 0;
  const nextLevelThreshold = stationThresholds[currentStationIndex + 1] !== undefined
    ? stationThresholds[currentStationIndex + 1]
    : currentLevelThreshold;

  // Calculate progress ratio between current level threshold and next level threshold
  let levelProgressRatio = 0;
  if (nextStation && currentStationIndex < stationThresholds.length - 1) {
    if (nextLevelThreshold > currentLevelThreshold) {
      levelProgressRatio = Math.min(
        1,
        Math.max(0, (totalWeightedScore - currentLevelThreshold) / (nextLevelThreshold - currentLevelThreshold))
      );
    } else {
      levelProgressRatio = 1;
    }
  } else {
    levelProgressRatio = 1;
  }

  const journeyPercentage = Math.round(levelProgressRatio * 100);

  // Determine remaining requirements for the next station
  const remainingRequirements: JourneyCalculationResult['remainingRequirements'] = [];

  if (nextStation && configuredStations[currentStationIndex + 1]) {
    const nextTargetScore = Number(configuredStations[currentStationIndex + 1]?.threshold) || 0;
    const scoreDiff = Math.max(0, nextTargetScore - totalWeightedScore);

    remainingRequirements.push({
      title: 'نقاط إضافية مطلوب جمعها للوصول للمحطة القادمة',
      required: `${nextTargetScore} نقطة`,
      current: `${totalWeightedScore} نقطة`,
      completed: scoreDiff === 0,
    });

    const targetChallenges = (currentStationIndex + 1) * 3;
    remainingRequirements.push({
      title: 'تحديات قرآنية وإيمانية معتمدة',
      required: `${targetChallenges} تحديات`,
      current: `${completedChallengesCount} تحدي`,
      completed: completedChallengesCount >= targetChallenges,
    });

    const targetAchievements = currentStationIndex + 1;
    remainingRequirements.push({
      title: 'إنجازات وأوسمة معتمدة من المعلمة',
      required: `${targetAchievements} إنجازات`,
      current: `${approvedAchievementsCount} إنجاز`,
      completed: approvedAchievementsCount >= targetAchievements,
    });

    const targetEvaluations = Math.max(1, currentStationIndex);
    remainingRequirements.push({
      title: 'تقييمات إيجابية معتمدة في الحلقة',
      required: `${targetEvaluations} تقييمات`,
      current: `${teacherEvaluationsCount} تقييم`,
      completed: teacherEvaluationsCount >= targetEvaluations,
    });
  }

  // System breakdown summary
  const breakdown = [
    {
      label: 'التحديات المكتملة',
      icon: '🏆',
      value: `${completedChallengesCount} تحدي`,
      contributionXp: challengesXp,
    },
    {
      label: 'الإنجازات المعتمدة',
      icon: '🎖️',
      value: `${approvedAchievementsCount} إنجاز`,
      contributionXp: achievementsXp,
    },
    {
      label: 'مجموع نقاط الـ XP',
      icon: '⚡',
      value: `${xp} XP`,
      contributionXp: xp,
    },
    {
      label: 'إجمالي النقاط العامة',
      icon: '💎',
      value: `${points} نقطة`,
      contributionXp: points,
    },
    {
      label: 'مهام ومشاركات النادي',
      icon: '🤝',
      value: `${clubTasksCompleted} مهام`,
      contributionXp: clubXp,
    },
    {
      label: 'تفاعلات إعلانات النادي',
      icon: '📢',
      value: `${clubAnnouncementsCount} إعلانات`,
      contributionXp: clubAnnouncementsCount * 15,
    },
    {
      label: 'نسبة الحضور والانضباط',
      icon: '📅',
      value: `${attendanceRate}%`,
      contributionXp: attendanceXp,
    },
    {
      label: 'تقييمات وثنآءات المعلمة',
      icon: '🌟',
      value: `${teacherEvaluationsCount} تقييم إيجابي`,
      contributionXp: evaluationsXp,
    },
    {
      label: 'التقدم والمطالعة بالمكتبة',
      icon: '📚',
      value: `${libraryViewsCount} مورد`,
      contributionXp: libraryXp,
    },
    {
      label: 'المكافآت الخاصة المعتمدة',
      icon: '🎁',
      value: `${specialRewardsCount} مكافأة`,
      contributionXp: rewardsXp,
    },
    {
      label: 'الأوسمة والشارات المكتسبة',
      icon: '🏅',
      value: `${badgesEarnedCount} أوسمة`,
      contributionXp: badgesXp,
    },
  ];

  const result: JourneyCalculationResult = {
    student: metrics,
    currentStationIndex,
    currentStation,
    nextStation,
    dynamicStations,
    journeyPercentage,
    levelProgressRatio,
    currentLevelThreshold,
    nextLevelThreshold,
    totalWeightedScore,
    remainingRequirements,
    breakdown,
  };
  console.log('[DEBUG 5] JourneyEngine output result:', result);
  return result;
}
