import { Challenge, ChallengeStats, ChallengeRewardResult } from '../types/challenge';
import { initialChallengesData } from '../data/challenges';

// In-memory persistent cache / fallback state for smooth client interaction before Supabase connection
let challengesStore: Challenge[] = [...initialChallengesData];

/**
 * Challenge Service - Handles API calls, Supabase integration, and state persistence
 */
export const challengeService = {
  /**
   * Register or sync dynamically loaded teacher challenges into challengesStore
   */
  registerChallenge(ch: Challenge) {
    const existingIndex = challengesStore.findIndex((c) => c.id === ch.id);
    if (existingIndex >= 0) {
      challengesStore[existingIndex] = { ...challengesStore[existingIndex], ...ch };
    } else {
      challengesStore.unshift(ch);
    }
  },

  /**
   * Fetch active challenges from DB or API filtered by class_id and active status
   */
  async getChallenges(classId?: string): Promise<Challenge[]> {
    try {
      return challengesStore.filter((c) => c.active !== false && (!classId || c.class_id === classId));
    } catch (error) {
      console.error('Error fetching challenges:', error);
      return challengesStore;
    }
  },

  /**
   * Increments progress of a challenge by step
   */
  async updateProgress(challengeId: string, step = 1): Promise<ChallengeRewardResult> {
    let target = challengesStore.find((c) => c.id === challengeId);

    if (!target) {
      target = {
        id: challengeId,
        title: 'تحدي المعلمة',
        description: 'تحدي مستهدف',
        category: 'daily',
        difficulty: 'متوسط',
        xp_reward: 100,
        gems_reward: 10,
        progress: 0,
        total_progress: 1,
        status: 'in_progress',
        active: true,
      };
      challengesStore.unshift(target);
    }

    if (target.status === 'locked' || target.status === 'completed' || target.done) {
      return { challenge: target, rewardEarned: null, isNewlyCompleted: false };
    }

    const currentProg = target.progress || 0;
    const maxProg = target.total_progress || target.total || 1;
    const newProgress = Math.min(maxProg, currentProg + step);
    const isNowCompleted = newProgress >= maxProg;

    const updatedChallenge: Challenge = {
      ...target,
      progress: newProgress,
      status: isNowCompleted ? 'completed' : 'in_progress',
      done: isNowCompleted,
      completed_at: isNowCompleted ? new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : target.completed_at,
    };

    // Update in-memory store
    challengesStore = challengesStore.map((c) => (c.id === challengeId ? updatedChallenge : c));

    // Example Supabase update:
    // await supabase.from('challenges').update({
    //   progress: newProgress,
    //   status: isNowCompleted ? 'completed' : 'in_progress',
    //   completed_at: updatedChallenge.completed_at
    // }).eq('id', challengeId);

    const rewardEarned = isNowCompleted
      ? {
          gems: updatedChallenge.gems_reward || updatedChallenge.gems || 0,
          xp: updatedChallenge.xp_reward || updatedChallenge.xp || 0,
          points: updatedChallenge.gems_reward || updatedChallenge.points || 50,
        }
      : null;

    return {
      challenge: updatedChallenge,
      rewardEarned,
      isNewlyCompleted: isNowCompleted,
    };
  },

  /**
   * Directly marks a challenge as fully completed
   */
  async completeChallengeFully(challengeId: string): Promise<ChallengeRewardResult> {
    const target = challengesStore.find((c) => c.id === challengeId);

    if (!target) {
      throw new Error(`Challenge ${challengeId} not found`);
    }

    if (target.status === 'completed' || target.done) {
      return { challenge: target, rewardEarned: null, isNewlyCompleted: false };
    }

    const maxProg = target.total_progress || target.total || 1;
    const updatedChallenge: Challenge = {
      ...target,
      progress: maxProg,
      status: 'completed',
      done: true,
      completed_at: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };

    challengesStore = challengesStore.map((c) => (c.id === challengeId ? updatedChallenge : c));

    const rewardEarned = {
      gems: updatedChallenge.gems_reward || updatedChallenge.gems || 0,
      xp: updatedChallenge.xp_reward || updatedChallenge.xp || 0,
      points: updatedChallenge.gems_reward || updatedChallenge.points || 50,
    };

    return {
      challenge: updatedChallenge,
      rewardEarned,
      isNewlyCompleted: true,
    };
  },

  /**
   * Calculates overall stats for dashboard metrics dynamically
   */
  calculateStats(challenges: Challenge[]): ChallengeStats {
    const activeList = challenges.filter((c) => c.active !== false);

    const daily = activeList.filter((c) => c.category === 'daily');
    const weekly = activeList.filter((c) => c.category === 'weekly');
    const monthly = activeList.filter((c) => c.category === 'monthly');

    const dailyCompleted = daily.filter((c) => c.status === 'completed' || c.done).length;
    const weeklyCompleted = weekly.filter((c) => c.status === 'completed' || c.done).length;
    const monthlyCompleted = monthly.filter((c) => c.status === 'completed' || c.done).length;
    const totalCompleted = activeList.filter((c) => c.status === 'completed' || c.done).length;

    const dailyProgressPercent = daily.length > 0 ? Math.round((dailyCompleted / daily.length) * 100) : 0;

    return {
      dailyTotal: daily.length,
      dailyCompleted,
      weeklyTotal: weekly.length,
      weeklyCompleted,
      monthlyTotal: monthly.length,
      monthlyCompleted,
      totalCompleted,
      dailyProgressPercent,
    };
  },
};
