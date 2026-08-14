import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Users, Search, UserPlus, FileSpreadsheet, Edit3, Sparkles } from 'lucide-react';
import { BatchStudent, Batch } from '../../types/teacher';
import { calculateStudentJourney } from '../../services/journeyEngine';
import { StudentProfileModal } from './StudentProfileModal';

interface BatchStudentsViewProps {
  batch: Batch;
  students: BatchStudent[];
  onOpenAddStudent: () => void;
  onOpenImportExcel: () => void;
  onOpenEditStudent: (student: BatchStudent) => void;
}

export const BatchStudentsView: React.FC<BatchStudentsViewProps> = ({
  batch,
  students,
  onOpenAddStudent,
  onOpenImportExcel,
  onOpenEditStudent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [viewProfileStudent, setViewProfileStudent] = useState<BatchStudent | null>(null);

  // Extract unique classes
  const classesList = Array.from(new Set(students.map((s) => s.className)));

  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClassFilter === 'ALL' || s.className === selectedClassFilter;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6 dir-rtl">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-[28px] border border-[#EEF2F7] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">سجل طلاب وطالبات {batch.name}</h2>
            <p className="text-xs font-bold text-slate-500">إدارة القائمة، الفصول، المنتسبات للأندية والنقاط الإجمالية</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenImportExcel}
            className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-black text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>استيراد من Excel</span>
          </button>

          <button
            onClick={onOpenAddStudent}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-xl shadow-md shadow-teal-600/20 flex items-center gap-2 cursor-pointer transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ إضافة طالب جديد</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="البحث بالاسم..."
            className="w-full pl-4 pr-10 py-3 bg-white border border-[#EEF2F7] rounded-2xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
        </div>

        {/* Filter by Class */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setSelectedClassFilter('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
              selectedClassFilter === 'ALL'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-[#EEF2F7] hover:bg-slate-50'
            }`}
          >
            جميع الفصول ({students.length})
          </button>

          {classesList.map((cls) => (
            <button
              key={cls}
              onClick={() => setSelectedClassFilter(cls)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                selectedClassFilter === cls
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-[#EEF2F7] hover:bg-slate-50'
              }`}
            >
              {cls}
            </button>
          ))}
        </div>
      </div>

      {/* Students Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((std) => {
          const journeyRes = calculateStudentJourney({
            id: std.id,
            name: std.name,
            studentCode: std.studentCode || '',
            xp: std.points || 0,
            points: std.points || 0,
            attendanceRate: std.attendanceRate || 0,
            completedChallengesCount: std.completedChallengesCount || 0,
            clubTasksCompleted: std.completedTasks || 0,
            clubAnnouncementsCount: 0,
            teacherEvaluationsCount: 0,
            libraryViewsCount: 0,
            specialRewardsCount: 0,
            badgesEarnedCount: 0,
          });
          const stationTitle = journeyRes.currentStation?.title || '🌱 البداية';

          return (
            <motion.div
              key={std.id}
              whileHover={{ y: -2 }}
              onClick={() => setViewProfileStudent(std)}
              className="p-5 rounded-[28px] bg-white border border-[#EEF2F7] shadow-sm hover:shadow-md transition-all space-y-4 relative group cursor-pointer"
            >
              {/* Top Student Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  {std.avatarUrl ? (
                    <img
                      src={std.avatarUrl}
                      alt={std.name}
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-teal-500/20 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 font-bold flex items-center justify-center border-2 border-teal-500/20 shrink-0 text-sm">
                      {std.name ? std.name.charAt(0) : 'ط'}
                    </div>
                  )}
                  <div className="space-y-0.5">
                    <h3 className="font-black text-sm text-slate-900 group-hover:text-teal-700 transition-colors">
                      {std.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <span className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100/80">
                        {std.className}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Edit Student Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenEditStudent(std);
                  }}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-teal-50 text-slate-400 hover:text-teal-700 border border-slate-200/80 transition-colors cursor-pointer"
                  title="تعديل بيانات الطالب"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              {/* Club & Badge Row */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-bold">
                <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-800 border border-purple-100 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  <span>{std.clubName || 'بدون نادي'}</span>
                </span>

                <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                  {stationTitle}
                </span>
              </div>

              {/* Metrics Footer */}
              <div className="pt-2 border-t border-slate-100 text-xs font-bold">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                  <span className="block text-[10px] text-slate-400">النقاط الإجمالية</span>
                  <span className="text-teal-700 font-black text-sm">{std.points || 0} XP 💎</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Student Profile Modal */}
      {viewProfileStudent && (
        <StudentProfileModal
          student={viewProfileStudent}
          batch={batch}
          onClose={() => setViewProfileStudent(null)}
        />
      )}
    </div>
  );
};
