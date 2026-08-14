import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { School, Users, Plus, Edit2, Trash2, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { BatchClass, Batch, BatchStudent } from '../../types/teacher';
import { calculateStudentJourney } from '../../services/journeyEngine';
import { teacherService } from '../../services/teacherService';
import { StudentProfileModal } from './StudentProfileModal';

interface BatchClassesViewProps {
  batch: Batch;
  classes: BatchClass[];
  students?: BatchStudent[];
  onOpenCreateClass?: () => void;
  onOpenEditClass?: (batchClass: BatchClass) => void;
  onDeleteClass?: (classId: string) => void;
  onDeleteStudent?: (studentId: string) => void;
  onStudentUpdated?: () => void;
}

export const BatchClassesView: React.FC<BatchClassesViewProps> = ({
  batch,
  classes,
  students = [],
  onOpenCreateClass,
  onOpenEditClass,
  onDeleteClass,
  onDeleteStudent,
  onStudentUpdated,
}) => {
  const [selectedClass, setSelectedClass] = useState<BatchClass | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewProfileStudent, setViewProfileStudent] = useState<BatchStudent | null>(null);
  const [showClassDeleteConfirm, setShowClassDeleteConfirm] = useState(false);
  const [deletingGridClass, setDeletingGridClass] = useState<BatchClass | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<BatchStudent | null>(null);
  const [, setForceUpdate] = useState({});

  // Filter classes dynamically
  const filteredClasses = classes.filter(
    (cls) =>
      cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.teacherName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get real student count for a class
  const getRealStudentCount = (cls: BatchClass) => {
    const classStudents = students.filter((s) => s.className === cls.name);
    return classStudents.length > 0 ? classStudents.length : cls.studentCount || 0;
  };

  // Get student list for a class
  const getStudentsForClass = (cls: BatchClass): BatchStudent[] => {
    return students.filter((s) => s.className === cls.name);
  };

  // Handle immediate point update
  const handlePointsChange = async (student: BatchStudent, delta: number) => {
    const currentPoints = student.points || 0;
    const newPoints = Math.max(0, currentPoints + delta);
    student.points = newPoints;
    setForceUpdate({});

    try {
      const updated = await teacherService.updateStudent(batch.id, student.id, { points: newPoints });
      student.points = updated.points;
      student.levelBadge = updated.levelBadge;
      setForceUpdate({});
      if (onStudentUpdated) {
        onStudentUpdated();
      }
    } catch (error) {
      console.error('Error updating student points:', error);
    }
  };

  // If a class is selected, show the "Inside Class" teaching management view!
  if (selectedClass) {
    const classStudents = getStudentsForClass(selectedClass);

    return (
      <div className="space-y-6 dir-rtl">
        {/* Inside Class Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-[28px] border border-[#EEF2F7] shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedClass(null)}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
              title="العودة لجميع الفصول"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة للفصول</span>
            </button>

            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 font-bold shrink-0">
              <School className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900">{selectedClass.name}</h2>
                <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                  {classStudents.length} طلاب
                </span>
              </div>
              <p className="text-xs font-bold text-slate-500">المعلمة المشرفة: {selectedClass.teacherName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenEditClass && (
              <button
                onClick={() => onOpenEditClass(selectedClass)}
                className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>تعديل الفصل</span>
              </button>
            )}

            {onDeleteClass && (
              <button
                onClick={() => setShowClassDeleteConfirm(true)}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف الفصل</span>
              </button>
            )}
          </div>
        </div>

        {/* Teaching Spreadsheet-like Table */}
        <div className="bg-white rounded-[28px] border border-[#EEF2F7] shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base text-slate-900">جدول إدارة الفصل والتحكم المباشر بالنقاط 📊</h3>
            <span className="text-xs font-bold text-slate-400">التحديث فوري في تطبيق الطالب</span>
          </div>

          {classStudents.length === 0 ? (
            <div className="p-10 text-center space-y-2 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <Users className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-500">لا يوجد طلاب مضافين لهذا الفصل حتى الآن.</p>
              <p className="text-[11px] text-slate-400">يمكنكِ إضافة طلاب وتعيينهم لهذا الفصل من تبويب (الطلاب).</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-xs font-black text-slate-600">
                    <th className="p-3.5 rounded-r-xl">اسم الطالب</th>
                    <th className="p-3.5">مستوى الرحلة الحالي</th>
                    <th className="p-3.5 text-center">النقاط الحالية</th>
                    <th className="p-3.5 text-center">التحكم بالنقاط</th>
                    <th className="p-3.5 text-center rounded-l-xl">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-bold">
                  {classStudents.map((std) => {
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
                      <tr key={std.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Student Name */}
                        <td className="p-3.5">
                          <button
                            onClick={() => setViewProfileStudent(std)}
                            className="font-black text-slate-900 hover:text-teal-700 hover:underline text-right transition-colors cursor-pointer flex items-center gap-2"
                          >
                            <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 text-xs">
                              {std.name ? std.name.charAt(0) : 'ط'}
                            </div>
                            <span>{std.name}</span>
                          </button>
                        </td>

                        {/* Current Journey Level */}
                        <td className="p-3.5">
                          <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/80 font-extrabold text-[11px] inline-block">
                            {stationTitle}
                          </span>
                        </td>

                        {/* Current Points */}
                        <td className="p-3.5 text-center">
                          <span className="font-mono font-black text-teal-800 text-sm">
                            {std.points || 0} XP 💎
                          </span>
                        </td>

                        {/* Points Controls: [-5] [-1] [Current Points] [+1] [+5] */}
                        <td className="p-3.5">
                          <div className="flex items-center justify-center gap-1.5 dir-ltr">
                            <button
                              onClick={() => handlePointsChange(std, -5)}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 font-mono font-black text-xs transition-colors active:scale-95 cursor-pointer"
                              title="خصم 5 نقاط"
                            >
                              -5
                            </button>
                            <button
                              onClick={() => handlePointsChange(std, -1)}
                              className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/80 font-mono font-black text-xs transition-colors active:scale-95 cursor-pointer"
                              title="خصم نقطة واحدة"
                            >
                              -1
                            </button>

                            <div className="px-3 py-1 bg-slate-900 text-teal-300 font-mono font-black text-xs rounded-lg min-w-[48px] text-center border border-slate-700 shadow-xs">
                              {std.points || 0}
                            </div>

                            <button
                              onClick={() => handlePointsChange(std, 1)}
                              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 font-mono font-black text-xs transition-colors active:scale-95 cursor-pointer"
                              title="إضافة نقطة واحدة"
                            >
                              +1
                            </button>
                            <button
                              onClick={() => handlePointsChange(std, 5)}
                              className="px-2 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-mono font-black text-xs transition-colors active:scale-95 shadow-xs cursor-pointer"
                              title="إضافة 5 نقاط"
                            >
                              +5
                            </button>
                            <button
                              onClick={() => handlePointsChange(std, 10)}
                              className="px-2 py-1 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-mono font-black text-xs transition-colors active:scale-95 shadow-xs cursor-pointer"
                              title="إضافة 10 نقاط"
                            >
                              +10
                            </button>
                            <button
                              onClick={() => handlePointsChange(std, 50)}
                              className="px-2 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-mono font-black text-xs transition-colors active:scale-95 shadow-xs cursor-pointer"
                              title="إضافة 50 نقطة"
                            >
                              +50
                            </button>
                            <button
                              onClick={() => handlePointsChange(std, 200)}
                              className="px-2 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-mono font-black text-xs transition-colors active:scale-95 shadow-xs cursor-pointer"
                              title="إضافة 200 نقطة (الوصول لـ طالب علم)"
                            >
                              +200
                            </button>
                          </div>
                        </td>

                        {/* Actions: Delete Student */}
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => setStudentToDelete(std)}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                            title="حذف الطالب"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Student Profile Modal */}
        {viewProfileStudent && (
          <StudentProfileModal
            student={viewProfileStudent}
            batch={batch}
            onClose={() => setViewProfileStudent(null)}
          />
        )}

        {/* Confirmation Modal for Class Deletion */}
        <AnimatePresence>
          {showClassDeleteConfirm && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 dir-rtl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm bg-white rounded-[28px] p-6 shadow-2xl border border-slate-100 space-y-4"
              >
                <div className="flex items-center gap-2 text-rose-600">
                  <Trash2 className="w-5 h-5 shrink-0" />
                  <h3 className="font-black text-base text-slate-900">هل أنت متأكد من حذف هذا الفصل؟</h3>
                </div>
                <p className="text-xs text-slate-600 font-bold leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  سيتم حذف فصل ({selectedClass.name}) من هذه الدفعة.
                </p>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowClassDeleteConfirm(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onDeleteClass) {
                        onDeleteClass(selectedClass.id);
                      }
                      setShowClassDeleteConfirm(false);
                      setSelectedClass(null);
                    }}
                    className="px-5 py-2 rounded-xl bg-rose-600 text-white font-black text-xs hover:bg-rose-700 shadow-md shadow-rose-600/20 cursor-pointer"
                  >
                    حذف
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Confirmation Modal for Student Deletion */}
        <AnimatePresence>
          {studentToDelete && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 dir-rtl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm bg-white rounded-[28px] p-6 shadow-2xl border border-slate-100 space-y-4"
              >
                <div className="flex items-center gap-2 text-rose-600">
                  <Trash2 className="w-5 h-5 shrink-0" />
                  <h3 className="font-black text-base text-slate-900">هل أنت متأكد من حذف هذا الطالب؟</h3>
                </div>
                <p className="text-xs text-slate-600 font-bold leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  الطالب: {studentToDelete.name}
                </p>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setStudentToDelete(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onDeleteStudent && studentToDelete) {
                        onDeleteStudent(studentToDelete.id);
                      }
                      setStudentToDelete(null);
                    }}
                    className="px-5 py-2 rounded-xl bg-rose-600 text-white font-black text-xs hover:bg-rose-700 shadow-md shadow-rose-600/20 cursor-pointer"
                  >
                    حذف
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Main Classes Grid View (when no class is selected)
  return (
    <div className="space-y-6 dir-rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-5 rounded-[28px] border border-[#EEF2F7] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 font-bold">
            <School className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">فصول وحلقات {batch.name}</h2>
            <p className="text-xs font-bold text-slate-500">
              إدارة أسماء الفصول المخصصة والمعلمات المشرفات والطلاب المنتسبين
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3.5 py-1.5 rounded-full border border-teal-200">
            {classes.length} فصول بالدفعة
          </span>
          {onOpenCreateClass && (
            <button
              onClick={onOpenCreateClass}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black text-xs shadow-md shadow-teal-600/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة فصل جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 text-xs font-bold">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="بحث باسم الفصل أو المعلمة..."
          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 font-bold"
        />
      </div>

      {/* Empty State */}
      {filteredClasses.length === 0 && (
        <div className="bg-white rounded-[28px] border border-dashed border-slate-200 p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
            <School className="w-6 h-6" />
          </div>
          <h3 className="font-black text-base text-slate-800">لا توجد فصول مضافة بعد</h3>
          <p className="text-xs font-bold text-slate-500 max-w-sm mx-auto">
            يمكنكِ إضافة الفصول بأسماء مخصصة لهذه الدفعة دون قيود على المسميات.
          </p>
          {onOpenCreateClass && (
            <button
              onClick={onOpenCreateClass}
              className="mt-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl font-black text-xs hover:bg-teal-700 shadow-md shadow-teal-600/20 inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء أول فصل لهذه الدفعة</span>
            </button>
          )}
        </div>
      )}

      {/* Classes Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClasses.map((cls) => {
          const studentCount = getRealStudentCount(cls);

          return (
            <motion.div
              key={cls.id}
              whileHover={{ y: -2 }}
              onClick={() => setSelectedClass(cls)}
              className="p-5 rounded-[28px] bg-white border border-[#EEF2F7] shadow-sm hover:shadow-md transition-all space-y-4 cursor-pointer relative group"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-black text-base text-slate-900 group-hover:text-teal-700 transition-colors">
                    {cls.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mt-1">
                    <span>المعلمة: {cls.teacherName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onOpenEditClass && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEditClass(cls);
                      }}
                      className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                      title="تعديل الفصل"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {onDeleteClass && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingGridClass(cls);
                      }}
                      className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                      title="حذف الفصل"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-bold text-slate-600">
                <span className="flex items-center gap-1 text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                  <Users className="w-3.5 h-3.5" />
                  <span>{studentCount} طلاب</span>
                </span>

                <span className="text-teal-600 group-hover:underline font-black text-[11px]">
                  دخول إدارة الفصل ←
                </span>
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

      {/* Confirmation Modal for Grid Class Deletion */}
      <AnimatePresence>
        {deletingGridClass && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 dir-rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white rounded-[28px] p-6 shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center gap-2 text-rose-600">
                <Trash2 className="w-5 h-5 shrink-0" />
                <h3 className="font-black text-base text-slate-900">هل أنت متأكد من حذف هذا الفصل؟</h3>
              </div>
              <p className="text-xs text-slate-600 font-bold leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                سيتم حذف فصل ({deletingGridClass.name}) من هذه الدفعة.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeletingGridClass(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onDeleteClass && deletingGridClass) {
                      onDeleteClass(deletingGridClass.id);
                    }
                    setDeletingGridClass(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-rose-600 text-white font-black text-xs hover:bg-rose-700 shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  حذف
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
