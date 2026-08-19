export type ChallengeCategory = 'daily' | 'weekly' | 'monthly';
export type ChallengeDifficulty = 'سهل' | 'متوسط' | 'صعب' | 'أسطوري';
export type ChallengeStatus = 'new' | 'in_progress' | 'completed' | 'locked' | 'pending' | 'rejected' | 'not_started';

/**
 * Standard Database Challenge Entity Schema (Supabase-ready)
 */
export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  xp_reward: number;
  gems_reward: number;
  progress: number;
  total_progress: number;
  due_date?: string;
  class_id?: string;
  status: ChallengeStatus;
  active: boolean;

  // Additional UI Display Metadata
  iconName?: string;
  badge_reward?: string;
  full_explanation?: string;
  target_goal?: string;
  unit?: string;
  completed_at?: string;
  is_featured?: boolean;
  unlock_req?: string;
  timeLeft?: string;

  // Backward-compatibility aliases for UI components
  desc?: string;
  gems?: number;
  xp?: number;
  points?: number;
  done?: boolean;
  total?: number;
}

export interface ChallengeStats {
  dailyTotal: number;
  dailyCompleted: number;
  weeklyTotal: number;
  weeklyCompleted: number;
  monthlyTotal: number;
  monthlyCompleted: number;
  totalCompleted: number;
  dailyProgressPercent: number;
}

export interface ChallengeRewardResult {
  challenge: Challenge;
  rewardEarned: {
    gems: number;
    xp: number;
    points: number;
  } | null;
  isNewlyCompleted: boolean;
}
