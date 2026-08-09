import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Users, School, Sparkles, ArrowLeft, Layers, ShieldCheck, FolderPlus, Edit2, LogOut, Trash2, AlertTriangle } from 'lucide-react';
import { Batch } from '../../types/teacher';

interface BatchSelectionHomeProps {
  batches: Batch[];
  onSelectBatch: (batch: Batch) => void;
  onOpenCreateBatch?: () => void;
  onOpenEditBatch?: (batch: Batch) => void;
  onDeleteBatch?: (batchId: string) => void;
  onLogout?: () => void;
}

export const BatchSelectionHome: React.FC<BatchSelectionHomeProps> = ({
  batches,
  onSelectBatch,
  onOpenCreateBatch,
  onOpenEditBatch,
  onDeleteBatch,
  onLogout,
}) => {
  const [deletingBatch, setDeletingBatch] = useState<Batch | null>(null);

  const handleConfirmDelete = () => {
    if (deletingBatch && onDeleteBatch) {
      onDeleteBatch(deletingBatch.id);
    }
    setDeletingBatch(null);
  };
  return (
    <div className="space-y-8 dir-rtl">
      {/* Top Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-900 p-6 sm:p-10 text-white shadow-2xl border border-teal-500/30"
      >
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-black backdrop-blur-md">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>بوابة المعلمات والمشرفات • منصة رحلة داعية</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-teal-200/80 bg-white/5 px-3.5 py-1 rounded-full border border-white/10">
                العام الدراسي 2026 م - 1447 هـ
              </span>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="px-3.5 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-200 hover:bg-rose-500/30 text-xs font-black backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-300" />
                  <span>تسجيل الخروج</span>
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              <span>مرحبًا بكِ 🌿</span>
            </h1>
            <p className="text-base sm:text-xl font-bold text-teal-100/90 leading-relaxed">
              اختري الدفعة التي تريدين إدارتها أو أضيفي دفعة جديدة
            </p>
          </div>

          <p className="text-xs sm:text-sm text-teal-200/70 font-bold max-w-2xl leading-relaxed pt-1">
            ملاحظة: المنظومة مبنية بالكامل على الدفعات المستقلة. كل دفعة تضم الحلقات، الطالبات، الأندية، التحديات والمكتبة الخاصة بها بشكل كلي وديناميكي.
          </p>
        </div>
      </motion.div>

      {/* Batches Selection Cards Section */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center border border-teal-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">الدفعات الدراسية المتاحة</h2>
              <p className="text-xs font-bold text-slate-500">اضغطي على بطاقة الدفعة لفتح مساحة العمل الخاصة بها</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3.5 py-1.5 rounded-full border border-teal-200">
              {batches.length} دفعات مسجلة
            </span>
            {onOpenCreateBatch && (
              <button
                onClick={onOpenCreateBatch}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black text-xs shadow-md shadow-teal-600/20 flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" />
                <span>إضافة دفعة جديدة</span>
              </button>
            )}
          </div>
        </div>

        {/* Grid of Batch Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {batches.map((batch) => (
            <motion.div
              key={batch.id}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSelectBatch(batch)}
              className="group cursor-pointer relative overflow-hidden rounded-[32px] bg-white border border-[#EEF2F7] hover:border-teal-400 shadow-[0_10px_30px_rgb(0,0,0,0.04)] hover:shadow-2xl hover:shadow-teal-500/15 p-6 sm:p-7 transition-all space-y-5"
            >
              {/* Subtle Ambient Background Gradient Bar */}
              <div className={`absolute top-0 inset-x-0 h-2 bg-gradient-to-r ${batch.colorGradient}`} />

              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-teal-700 bg-teal-50/80 px-3 py-1 rounded-lg border border-teal-100/80 inline-block">
                      {batch.code} • {batch.stage}
                    </span>
                    <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {batch.gender === 'female' ? 'إناث 🌸' : batch.gender === 'male' ? 'ذكور ⚡' : 'مختلط 👥'}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 group-hover:text-teal-700 transition-colors flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-teal-600 shrink-0" />
                    <span>{batch.name}</span>
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  {onOpenEditBatch && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEditBatch(batch);
                      }}
                      className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                      title="تعديل الدفعة"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {onDeleteBatch && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingBatch(batch);
                      }}
                      className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                      title="حذف الدفعة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  {/* Arrow Button */}
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 group-hover:bg-teal-600 group-hover:text-white text-slate-600 flex items-center justify-center transition-all duration-300 shrink-0 shadow-xs border border-slate-100 group-hover:border-teal-600 group-hover:shadow-md group-hover:shadow-teal-600/30">
                    <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                  </div>
                </div>
              </div>

              <p className="text-xs font-bold text-slate-600 leading-relaxed line-clamp-2">
                {batch.description}
              </p>

              {/* Batch Stats Grid: Students, Classes, Clubs */}
              <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-slate-100 text-xs font-bold">
                <div className="flex flex-col items-center justify-center text-center text-slate-700 bg-slate-50/80 p-3 rounded-2xl border border-slate-100 group-hover:bg-teal-50/30 transition-colors">
                  <Users className="w-4 h-4 text-emerald-600 mb-1" />
                  <span className="text-slate-900 font-black text-sm">{batch.studentCount}</span>
                  <span className="text-[10px] text-slate-500 font-bold">طالب/طالبة</span>
                </div>

                <div className="flex flex-col items-center justify-center text-center text-slate-700 bg-slate-50/80 p-3 rounded-2xl border border-slate-100 group-hover:bg-teal-50/30 transition-colors">
                  <School className="w-4 h-4 text-teal-600 mb-1" />
                  <span className="text-slate-900 font-black text-sm">{batch.classCount}</span>
                  <span className="text-[10px] text-slate-500 font-bold">حلقة وفصل</span>
                </div>

                <div className="flex flex-col items-center justify-center text-center text-slate-700 bg-slate-50/80 p-3 rounded-2xl border border-slate-100 group-hover:bg-teal-50/30 transition-colors">
                  <Sparkles className="w-4 h-4 text-purple-600 mb-1" />
                  <span className="text-slate-900 font-black text-sm">{batch.clubCount}</span>
                  <span className="text-[10px] text-slate-500 font-bold">أندية دعوية</span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 pt-1">
                <span>المشرفة: {batch.supervisorName}</span>
                <span className="text-teal-600 font-black group-hover:underline flex items-center gap-1.5 text-xs">
                  <span>فتح مساحة الدفعة</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Confirmation Modal for Batch Deletion */}
      <AnimatePresence>
        {deletingBatch && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 dir-rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white rounded-[28px] p-6 shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center gap-2.5 text-rose-600">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">هل أنت متأكد من حذف هذه الدفعة؟</h3>
                  <p className="text-xs text-rose-700 font-bold">{deletingBatch.name}</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 font-bold leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                سيتم حذف الدفعة وفصولها وطلابها. هذا الإجراء لا يمكن التراجع عنه.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeletingBatch(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 text-white font-black text-xs hover:bg-rose-700 shadow-md shadow-rose-600/20 transition-all cursor-pointer"
                >
                  حذف الدفعة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
