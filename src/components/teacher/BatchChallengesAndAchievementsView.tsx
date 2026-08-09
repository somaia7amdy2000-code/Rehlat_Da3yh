import React, { useState } from 'react';
import { Trophy, Award } from 'lucide-react';
import { Batch, BatchChallenge } from '../../types/teacher';
import { BatchChallengesView } from './BatchChallengesView';
import { BatchAchievementsView } from './BatchAchievementsView';

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
  clubsList = [],
  onOpenCreateChallenge,
  onDeleteChallenge,
  showToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'challenges' | 'achievements'>('challenges');

  return (
    <div className="space-y-6 dir-rtl">
      {/* Merged Navigation Sub-Header */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-[#EEF2F7] shadow-xs">
        <button
          onClick={() => setActiveSubTab('challenges')}
          className={`flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'challenges'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>🎯 التحديات التنافسية ({challenges.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('achievements')}
          className={`flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'achievements'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>🏆 الأوسمة والإنجازات</span>
        </button>
      </div>

      {/* Sub-Tab Content */}
      {activeSubTab === 'challenges' ? (
        <BatchChallengesView
          batch={selectedBatch}
          challenges={challenges}
          onOpenCreateChallenge={onOpenCreateChallenge}
          onDeleteChallenge={onDeleteChallenge}
        />
      ) : (
        <BatchAchievementsView
          selectedBatch={selectedBatch}
          clubsList={clubsList}
          showToast={showToast}
        />
      )}
    </div>
  );
};
