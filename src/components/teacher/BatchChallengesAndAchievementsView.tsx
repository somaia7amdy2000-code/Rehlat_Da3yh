import React from 'react';
import { Batch, BatchChallenge } from '../../types/teacher';
import { BatchChallengesView } from './BatchChallengesView';

interface BatchChallengesAndAchievementsViewProps {
  selectedBatch: Batch;
  challenges: BatchChallenge[];
  clubsList?: string[];
  onOpenCreateChallenge: () => void;
  onDeleteChallenge?: (challengeId: string) => void;
  showToast?: (msg: string) => void;
}

export const BatchChallengesAndAchievementsView: React.FC<BatchChallengesAndAchievementsViewProps> = ({
  selectedBatch,
  challenges,
  onOpenCreateChallenge,
  onDeleteChallenge,
}) => {
  return (
    <BatchChallengesView
      batch={selectedBatch}
      challenges={challenges}
      onOpenCreateChallenge={onOpenCreateChallenge}
      onDeleteChallenge={onDeleteChallenge}
    />
  );
};

