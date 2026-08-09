import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Users,
  CheckSquare,
  PlusCircle,
  UserCheck,
  X,
  Megaphone,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  Edit2,
  Trophy,
} from 'lucide-react';
import { BatchClub, Batch, BatchChallenge, PendingSubmission } from '../../types/teacher';

interface BatchClubsViewProps {
  batch: Batch;
  clubs: BatchClub[];
  challenges?: BatchChallenge[];
  submissions?: PendingSubmission[];
  onOpenCreateClub: () => void;
  onOpenEditClub?: (club: BatchClub) => void;
  onOpenCreateChallengeForClub?: (clubName: string) => void;
}

export const BatchClubsView: React.FC<BatchClubsViewProps> = ({
  batch,
  clubs,
  challenges = [],
  submissions = [],
  onOpenCreateClub,
  onOpenEditClub,
  onOpenCreateChallengeForClub,
}) => {
  const [selectedClub, setSelectedClub] = useState<BatchClub | null>(null);
  const [clubModalTab, setClubModalTab] = useState<'members' | 'tasks' | 'announcements' | 'achievements'>('members');

  return (
    <div className="space-y-6 dir-rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-[28px] border border-[#EEF2F7] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100 font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">أندية {batch.name}</h2>
            <p className="text-xs font-bold text-slate-500">
              أندية لا صَفّية مستقلة تجمع الموهوبين والمبدعين من مختلف فصول الدفعة
            </p>
          </div>
        </div>

        <button
          onClick={onOpenCreateClub}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-md shadow-purple-600/20 flex items-center gap-2 cursor-pointer transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ إنشاء نادي جديد</span>
        </button>
      </div>

      {/* Clubs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clubs.map((club) => {
          const clubChallengesCount = challenges.filter(
            (c) => c.targetType === 'club' && c.targetName && c.targetName.trim().toLowerCase() === club.name.trim().toLowerCase()
          ).length;

          return (
            <motion.div
              key={club.id}
              whileHover={{ y: -2 }}
              onClick={() => {
                setSelectedClub(club);
                setClubModalTab('members');
              }}
              className="p-5 rounded-[28px] bg-white border border-[#EEF2F7] shadow-sm hover:shadow-md transition-all space-y-4 cursor-pointer relative group"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                    {club.category || 'نادي لا صفي'}
                  </span>
                  <h3 className="font-black text-base text-slate-900 mt-1 group-hover:text-purple-700 transition-colors">
                    {club.name}
                  </h3>
                </div>

                {onOpenEditClub && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenEditClub(club);
                    }}
                    className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                    title="تعديل النادي"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <p className="text-xs font-bold text-slate-500 line-clamp-2 leading-relaxed">
                {club.description || 'نادي متخصص يهدف إلى تطوير المهارات التخصصية والقيادية لطلاب الدفعة.'}
              </p>

              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <UserCheck className="w-4 h-4 text-purple-600" />
                <span>المعلمة المشرفة: {club.supervisorName || 'معلمة الحلقة'}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs font-bold">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                  <span className="block text-[10px] text-slate-400">الأعضاء المنتسبون</span>
                  <span className="text-purple-700 font-black text-sm">{club.memberCount || club.members?.length || 0} عضواً</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                  <span className="block text-[10px] text-slate-400">المهام والتحديات</span>
                  <span className="text-slate-900 font-black text-sm">{clubChallengesCount} تحديات 🎯</span>
                </div>
              </div>

              <div className="pt-1 text-center">
                <span className="text-[11px] font-black text-purple-600 hover:underline">
                  اضغطي لعرض تفاصيل وأعضاء ومهام النادي ←
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Club Details Modal */}
      <AnimatePresence>
        {selectedClub && (() => {
          const clubChallenges = challenges.filter(
            (c) => c.targetType === 'club' && c.targetName && c.targetName.trim().toLowerCase() === selectedClub.name.trim().toLowerCase()
          );

          return (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl bg-white rounded-[32px] p-6 shadow-2xl border border-slate-100 space-y-5"
              >
                {/* Modal Top Header */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100 font-bold">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-lg text-slate-900">{selectedClub.name}</h3>
                        <span className="text-[10px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                          {selectedClub.category || 'نادي لا صفي'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-500 mt-0.5">
                        المعلمة المشرفة: {selectedClub.supervisorName || 'معلمة الحلقة'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedClub(null)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Sub-Nav Tabs */}
                <div className="flex items-center gap-1 border-b border-slate-100 pb-2 overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => setClubModalTab('members')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all ${
                      clubModalTab === 'members'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>الأعضاء ({selectedClub.members?.length || selectedClub.memberCount || 0})</span>
                  </button>

                  <button
                    onClick={() => setClubModalTab('tasks')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all ${
                      clubModalTab === 'tasks'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>التحديات والمهام ({clubChallenges.length})</span>
                  </button>

                  <button
                    onClick={() => setClubModalTab('announcements')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all ${
                      clubModalTab === 'announcements'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Megaphone className="w-3.5 h-3.5" />
                    <span>الإعلانات ({selectedClub.announcements?.length || 0})</span>
                  </button>

                  <button
                    onClick={() => setClubModalTab('achievements')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all ${
                      clubModalTab === 'achievements'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>الإنجازات ({selectedClub.achievements?.length || 0})</span>
                  </button>
                </div>

                {/* Modal Content according to selected Tab */}
                <div className="min-h-[220px] max-h-[320px] overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
                  {/* 1. MEMBERS TAB */}
                  {clubModalTab === 'members' && (
                    <div className="space-y-2">
                      {selectedClub.members && selectedClub.members.length > 0 ? (
                        selectedClub.members.map((m, idx) => (
                          <div
                            key={m.id || idx}
                            className="p-3 bg-white rounded-xl border border-slate-100 flex items-center justify-between text-xs font-bold"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center font-black">
                                {m.name.charAt(0)}
                              </div>
                              <div>
                                <span className="block text-slate-900 font-black">{m.name}</span>
                                <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                                  {m.className}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-purple-700 bg-purple-50 px-2 py-1 rounded-lg border border-purple-100">
                                {m.levelBadge || 'عضو'}
                              </span>
                              <span className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                                {m.points || 0} XP
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs font-bold text-slate-500 text-center py-6">
                          لا يوجد أعضاء في هذا النادي حالياً.
                        </p>
                      )}
                    </div>
                  )}

                  {/* 2. TASKS / CHALLENGES TAB */}
                  {clubModalTab === 'tasks' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-1">
                        <span className="text-xs font-black text-slate-700">تحديات النادي المخصصة:</span>
                        {onOpenCreateChallengeForClub && (
                          <button
                            type="button"
                            onClick={() => {
                              onOpenCreateChallengeForClub(selectedClub.name);
                              setSelectedClub(null);
                            }}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] rounded-lg border border-amber-200 flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>+ إضافة تحدي للنادي</span>
                          </button>
                        )}
                      </div>

                      {clubChallenges.length === 0 ? (
                        <div className="p-6 bg-white rounded-xl border border-slate-100 text-center space-y-2">
                          <Trophy className="w-8 h-8 text-amber-400 mx-auto opacity-60" />
                          <p className="text-xs font-bold text-slate-500">
                            لا توجد تحديات مخصصة لنادي {selectedClub.name} حتى الآن.
                          </p>
                        </div>
                      ) : (
                        clubChallenges.map((ch) => {
                          const clubMembersCount = selectedClub.members?.length || selectedClub.memberCount || 0;
                          const completedCount = (selectedClub.members || []).filter((m) =>
                            submissions.some(
                              (sub) =>
                                (sub.studentId === m.id || sub.studentName === m.name || sub.studentCode === m.studentCode) &&
                                sub.status === 'approved' &&
                                (sub.taskTitle === ch.title || sub.challengeId === ch.id)
                            )
                          ).length;

                          return (
                            <div
                              key={ch.id}
                              className="p-3.5 bg-white rounded-xl border border-slate-100 space-y-2 text-xs font-bold shadow-2xs"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                                  <span className="font-black text-slate-900">{ch.title}</span>
                                </div>
                                <span className="text-xs font-black text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-100">
                                  +{ch.rewardXp} XP 💎
                                </span>
                              </div>

                              {ch.description && (
                                <p className="text-slate-600 text-[11px] leading-relaxed pr-6">
                                  {ch.description}
                                </p>
                              )}

                              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                                <span className="text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {ch.dueDate || 'نشط'}
                                </span>

                                <span className="text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md font-black border border-purple-100">
                                  إنجاز الأعضاء: {completedCount} / {clubMembersCount} أعضاء أكملوا التحدي
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* 3. ANNOUNCEMENTS TAB */}
                  {clubModalTab === 'announcements' && (
                    <div className="space-y-2">
                      {(selectedClub.announcements && selectedClub.announcements.length > 0
                        ? selectedClub.announcements
                        : [{ id: '1', title: 'اجتماع النادي الأسبوعي', content: 'سيكون الاجتماع يوم الثلاثاء بمركز المصادر.', date: 'الأمس' }]
                      ).map((ann, idx) => (
                        <div key={idx} className="p-3 bg-white rounded-xl border border-slate-100 space-y-1 text-xs font-bold">
                          <div className="flex items-center justify-between text-purple-700">
                            <span className="font-black">{ann.title}</span>
                            <span className="text-[10px] text-slate-400">{ann.date}</span>
                          </div>
                          <p className="text-slate-600 font-medium text-[11px] leading-relaxed">{ann.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 4. ACHIEVEMENTS TAB */}
                  {clubModalTab === 'achievements' && (
                    <div className="space-y-2">
                      {(selectedClub.achievements && selectedClub.achievements.length > 0
                        ? selectedClub.achievements
                        : [
                            { id: '1', title: 'درع أفضل نادي تفاعلي بالدفعة', date: 'الشهر الماضي', icon: '🏆' },
                            { id: '2', title: 'إنجاز 50 بودكاست قيمي بنجاح', date: 'الأسبوع الماضي', icon: '🎙️' },
                          ]
                      ).map((ach, idx) => (
                        <div key={idx} className="p-3 bg-white rounded-xl border border-slate-100 flex items-center gap-3 text-xs font-bold">
                          <span className="text-2xl">{ach.icon || '🏆'}</span>
                          <div>
                            <span className="block text-slate-900 font-black">{ach.title}</span>
                            <span className="text-[10px] text-slate-400">{ach.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Close button */}
                <div className="pt-2 text-left border-t border-slate-100">
                  <button
                    onClick={() => setSelectedClub(null)}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-black text-xs hover:bg-slate-800 cursor-pointer"
                  >
                    إغلاق
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};