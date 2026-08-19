import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import {
  X,
  User,
  UserPlus,
  Trophy,
  Megaphone,
  Sparkles,
  Upload,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Send,
  Edit2,
  FileSpreadsheet,
  Check,
  Trash2,
  School,
  FolderPlus,
  Target,
  Layers,
  Building,
  AlertTriangle,
  ArrowRightLeft,
  Users,
  BookOpen,
} from 'lucide-react';
import {
  PendingSubmission,
  BatchStudent,
  Batch,
  BatchClass,
  BatchClub,
  BatchChallenge,
  BatchLibraryItem,
} from '../../types/teacher';
import { calculateStudentJourney } from '../../services/journeyEngine';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; studentCode?: string; className: string; clubName?: string; levelBadge?: string }) => void;
  onImportExcel?: (importedList: Array<{ name: string; studentCode?: string; className: string; clubName?: string; points?: number }>) => void;
  classesList?: string[];
  clubsList?: string[];
  initialMode?: 'excel' | 'manual';
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onImportExcel,
  classesList = ['الفصل E', 'الفصل F', 'الفصل G', 'الفصل A', 'الفصل B', 'الفصل C', 'الفصل A+'],
  clubsList = [],
  initialMode = 'excel',
}) => {
  const [importMethod, setImportMethod] = useState<'excel' | 'manual'>(initialMode);

  // Manual Form States
  const [name, setName] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [className, setClassName] = useState(classesList[0] || 'الفصل E');
  const [clubName, setClubName] = useState('بدون نادي');
  const [levelBadge, setLevelBadge] = useState('🌱 البداية');

  // Excel Import States
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<
    Array<{ name: string; studentCode: string; className: string; clubName: string; points: number }>
  >([]);

  const wasOpenRef = useRef(false);

  // Sync state ONLY when modal transitions from closed to open
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setImportMethod(initialMode);
      setFileName(null);
      setName('');
      setStudentCode('');

      const defaultClass1 = classesList[0] || 'الفصل E';
      const defaultClass2 = classesList[1] || defaultClass1;
      const defaultClass3 = classesList[2] || defaultClass2;

      setPreviewRows([
        { name: 'مريم خليل الزهراني', studentCode: '1', className: defaultClass1, clubName: 'بدون نادي', points: 0 },
        { name: 'هند سليمان المطيري', studentCode: '2', className: defaultClass1, clubName: 'بدون نادي', points: 0 },
        { name: 'ندى عبد الرحمن القحطاني', studentCode: '1', className: defaultClass2, clubName: 'بدون نادي', points: 0 },
        { name: 'أبرار محمد العتيبي', studentCode: '1', className: defaultClass3, clubName: 'بدون نادي', points: 0 },
      ]);

      if (classesList.length > 0 && (!className || !classesList.includes(className))) {
        setClassName(classesList[0]);
      }
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  // Validation: Check if all class names in Excel preview exist in current batch's classesList
  const uniqueExcelClasses: string[] = Array.from(new Set(previewRows.map((r) => r.className.trim())));
  const missingClasses: string[] = uniqueExcelClasses.filter(
    (cName: string) => cName && !classesList.some((existing) => existing.trim() === cName.trim())
  );
  const hasClassError = missingClasses.length > 0;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      studentCode: studentCode.trim(),
      className,
      clubName,
      levelBadge,
    });
    setName('');
    setStudentCode('');
    onClose();
  };

  const handleConfirmExcelImport = () => {
    if (hasClassError) return;
    if (onImportExcel) {
      onImportExcel(previewRows);
    } else {
      previewRows.forEach((row) => {
        onSubmit({
          name: row.name,
          studentCode: row.studentCode,
          className: row.className,
          clubName: row.clubName,
          levelBadge: '🌱 البداية',
        });
      });
    }
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);

      try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) return;

        const worksheet = workbook.Sheets[firstSheetName];
        const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (rawData && rawData.length > 0) {
          // Find header row or column mapping
          const firstRow = rawData[0].map((cell: any) => String(cell || '').trim().toLowerCase());

          let nameIdx = -1;
          let codeIdx = -1;
          let classIdx = -1;
          let clubIdx = -1;
          let pointsIdx = -1;

          firstRow.forEach((col: string, idx: number) => {
            if (col.includes('اسم') || col.includes('name') || col.includes('طالب')) nameIdx = idx;
            else if (col.includes('كود') || col.includes('رقم') || col.includes('code') || col.includes('id')) codeIdx = idx;
            else if (col.includes('فصل') || col.includes('class') || col.includes('صف')) classIdx = idx;
            else if (col.includes('نادي') || col.includes('club')) clubIdx = idx;
            else if (col.includes('نقط') || col.includes('نقاط') || col.includes('point') || col.includes('xp')) pointsIdx = idx;
          });

          const hasHeaderWords = firstRow.some((c: string) =>
            c.includes('اسم') || c.includes('name') || c.includes('طالب') || c.includes('فصل') || c.includes('كود')
          );

          if (nameIdx === -1) nameIdx = 0;
          if (codeIdx === -1) codeIdx = 1;
          if (classIdx === -1) classIdx = 2;
          if (clubIdx === -1) clubIdx = 3;
          if (pointsIdx === -1) pointsIdx = 4;

          const dataRows = hasHeaderWords ? rawData.slice(1) : rawData;
          const defaultFallbackClass = classesList[0] || 'الفصل E';

          const parsed = dataRows
            .filter((row: any[]) => row && row.some((cell: any) => String(cell || '').trim().length > 0))
            .map((row: any[], idx: number) => {
              const rawName = String(row[nameIdx] ?? '').trim();
              const rawCode = String(row[codeIdx] ?? '').trim();
              const rawClass = String(row[classIdx] ?? '').trim();
              const rawClub = String(row[clubIdx] ?? '').trim();
              const rawPoints = Number(row[pointsIdx]) || 0;

              return {
                name: rawName || `طالب ${idx + 1}`,
                studentCode: rawCode || `${idx + 1}`,
                className: rawClass || defaultFallbackClass,
                clubName: rawClub || 'بدون نادي',
                points: rawPoints,
              };
            });

          if (parsed.length > 0) {
            setPreviewRows(parsed);
          }
        }
      } catch (err) {
        console.error('Error reading excel/csv file:', err);
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl bg-white rounded-[32px] p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold border border-teal-100/80">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900">إضافة واستيراد طلاب الدفعة</h3>
                <p className="text-xs text-slate-500 font-bold">إضافة الطلاب وتوزيعهم تلقائيًا على فصول الدفعة المتاحة</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Method Choice Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/80 text-xs font-black">
            <button
              type="button"
              onClick={() => setImportMethod('excel')}
              className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                importMethod === 'excel'
                  ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>1- استيراد من Excel (الخيار الأساسي)</span>
            </button>

            <button
              type="button"
              onClick={() => setImportMethod('manual')}
              className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                importMethod === 'manual'
                  ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>2- إضافة طالب يدويًا</span>
            </button>
          </div>

          {/* TAB 1: EXCEL IMPORT */}
          {importMethod === 'excel' && (
            <div className="space-y-4">
              {/* File Dropzone */}
              <div className="border-2 border-dashed border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50 rounded-2xl p-5 text-center space-y-2 transition-colors cursor-pointer relative">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="w-11 h-11 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold border border-emerald-200">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900">
                    {fileName ? `الملف المرفوع: ${fileName}` : 'اضغطي هنا لاختيار ملف Excel أو اسحبيه إلى هنا'}
                  </p>
                  <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                    يجب أن يحتوي الملف على الأعمدة: <span className="text-teal-800 font-black">اسم الطالب</span> | <span className="text-teal-800 font-black">كود الطالب</span> | <span className="text-teal-800 font-black">الفصل</span>
                  </p>
                </div>
              </div>

              {/* Validation Status Banner */}
              {hasClassError ? (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold space-y-1.5">
                  <div className="flex items-center gap-2 font-black text-rose-900 text-sm">
                    <AlertTriangle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
                    <span>تنبيه: توجد فصول في ملف Excel غير مضافة لهذه الدفعة!</span>
                  </div>
                  <p className="text-xs text-rose-700 leading-relaxed">
                    الفصول التالية المذكورة في الملف غير موجودة بالدفعة الحالية:
                    <span className="font-black bg-rose-200/80 text-rose-950 px-2 py-0.5 rounded-md mx-1">
                      {missingClasses.join('، ')}
                    </span>
                    . يرجى إضافة هذه الفصول أولاً إلى الدفعة من تبويب "الفصول" أو تعديل أسماء الفصول بالملف قبل الاستيراد.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>جميع الفصول المذكورة بالملف متطابقة وموجودة بالدفعة. مستعدة للتوزيع التلقائي!</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md font-black">
                    فصول الدفعة مطابقة
                  </span>
                </div>
              )}

              {/* Data Preview Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>معاينة بيانات الطلاب قبل الاستيراد والتوزيع ({previewRows.length} طلاب):</span>
                  <span className="text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-100 font-black">
                    توزيع تلقائي على الفصول
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/50">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-extrabold sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">اسم الطالب</th>
                        <th className="p-2.5">كود الطالب</th>
                        <th className="p-2.5">الفصل المخصص</th>
                        <th className="p-2.5">حالة المطابقة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800 font-bold">
                      {previewRows.map((row, idx) => {
                        const isClassValid = classesList.some((c) => c.trim() === row.className.trim());
                        return (
                          <tr key={idx} className={isClassValid ? 'hover:bg-white' : 'bg-rose-50/60 hover:bg-rose-50'}>
                            <td className="p-2.5 text-slate-900 font-black">{row.name}</td>
                            <td className="p-2.5 text-slate-600 font-mono text-[11px]">{row.studentCode || `STU-${101 + idx}`}</td>
                            <td className="p-2.5 font-black text-teal-800">{row.className}</td>
                            <td className="p-2.5">
                              {isClassValid ? (
                                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-black inline-flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  موجود بالدفعة
                                </span>
                              ) : (
                                <span className="text-[10px] text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-200 font-black inline-flex items-center gap-1">
                                  <XCircle className="w-3 h-3" />
                                  فصل غير مضاف
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-between gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={hasClassError}
                  onClick={handleConfirmExcelImport}
                  className={`px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all ${
                    hasClassError
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 cursor-pointer'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>{hasClassError ? 'عفواً، أضيفي الفصول المفقودة للدفعة أولاً' : `اعتماد وتوزيع (${previewRows.length}) طلاب على الفصول`}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: MANUAL ADDITION */}
          {importMethod === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4 text-xs font-bold text-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-slate-800">اسم الطالب / الطالبة الرباعي</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: مريم عبد الله الزهراني"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-800">كود الطالب (اختياري)</label>
                  <input
                    type="text"
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value)}
                    placeholder="مثال: STU-2026-001"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-slate-800">الفصل الدراسي</label>
                  <select
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
                  >
                    {classesList.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-slate-800">النادي المنتسب له</label>
                  <select
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
                  >
                    {clubsList.length === 0 ? (
                      <option value="بدون نادي">لا توجد أندية تم إنشاؤها بعد</option>
                    ) : (
                      <>
                        <option value="بدون نادي">بدون نادي</option>
                        {clubsList.map((clb) => (
                          <option key={clb} value={clb}>
                            {clb}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1 text-slate-800">شارة المستوى الأولي (تلقائي)</label>
                <div className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700 flex items-center justify-between">
                  <span>🌱 البداية</span>
                  <span className="text-[10px] text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-bold">محرك الرحلة</span>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-black hover:bg-teal-700 shadow-md shadow-teal-600/20 flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>حفظ وإضافة الطالب</span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export type ChallengeTargetAudience = 'school' | 'batch' | 'class' | 'club' | 'student';

interface CreateChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    type: string;
    rewardXp: number;
    dueDate: string;
    targetType: ChallengeTargetAudience;
    targetName?: string;
    targetId?: string;
    targetStudentId?: string;
    targetStudentCode?: string;
  }) => void;
  classesList?: string[];
  clubsList?: Array<{ id: string; name: string } | string>;
  studentsList?: Array<{ id: string; name: string; studentCode?: string; className?: string }>;
  initialTargetType?: ChallengeTargetAudience;
  initialTargetName?: string;
}

export const CreateChallengeModal: React.FC<CreateChallengeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  classesList = [],
  clubsList = [],
  studentsList = [],
  initialTargetType,
  initialTargetName,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('تحدي يومي ☀️');
  const [rewardXp, setRewardXp] = useState(100);
  const [dueDate, setDueDate] = useState('خلال 3 أيام');
  const [targetType, setTargetType] = useState<ChallengeTargetAudience>('school');
  const [targetName, setTargetName] = useState('');
  const [targetClubId, setTargetClubId] = useState('');
  const [targetStudentId, setTargetStudentId] = useState('');
  const [targetStudentCode, setTargetStudentCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const normalizedClubs = React.useMemo(() => {
    return (clubsList || []).map((c) =>
      typeof c === 'string' ? { id: '', name: c } : c
    );
  }, [clubsList]);

  const wasOpenRef = useRef(false);

  React.useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setErrorMessage(null);
      if (initialTargetType) {
        setTargetType(initialTargetType);
        if (initialTargetName) {
          setTargetName(initialTargetName);
          const found = normalizedClubs.find((c) => c.name === initialTargetName);
          if (found) setTargetClubId(found.id || '');
        } else if (initialTargetType === 'club' && normalizedClubs.length > 0) {
          setTargetName(normalizedClubs[0].name || '');
          setTargetClubId(normalizedClubs[0].id || '');
        }
      }
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, initialTargetType, initialTargetName]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;
    setErrorMessage(null);

    let computedName = targetName;
    if (targetType === 'school') computedName = 'المدرسة بأكملها';
    if (targetType === 'batch') computedName = 'الدفعة الحالية';
    if (targetType === 'student' && studentsList.length > 0) {
      const selected = studentsList.find((s) => s.id === targetStudentId || s.studentCode === targetStudentCode);
      if (selected) {
        computedName = selected.name;
      }
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        title,
        description,
        type,
        rewardXp,
        dueDate,
        targetType,
        targetName: computedName,
        targetId: targetType === 'club' ? targetClubId : undefined,
        targetStudentId,
        targetStudentCode,
      });
      setTitle('');
      setDescription('');
      setErrorMessage(null);
      onClose();
    } catch (err: any) {
      console.error('Failed to create challenge:', err);
      setErrorMessage(err?.message || 'حدث خطأ أثناء حفظ التحدي في قاعدة البيانات');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg bg-white rounded-[28px] p-6 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-amber-600">
              <Trophy className="w-5 h-5" />
              <h3 className="font-black text-lg text-slate-900">إنشاء تحدي جديد</h3>
            </div>
            <button onClick={onClose} className="p-1 rounded-xl hover:bg-slate-100 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold text-slate-700">
            <div>
              <label className="block mb-1 text-slate-800">عنوان التحدي</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: تحدي حفظ وتدبر سورة الرحمن"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block mb-1 text-slate-800">وصف / شرح التحدي</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="اكتبي شرح التحدي والشروط المطلوبة للإنجاز..."
                rows={3}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-slate-800">تكرار/نوع التحدي</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900"
                >
                  <option value="تحدي يومي ☀️">تحدي يومي ☀️</option>
                  <option value="تحدي أسبوعي 📅">تحدي أسبوعي 📅</option>
                  <option value="تحدي شهري 🌕">تحدي شهري 🌕</option>
                  <option value="تجويد وحفظ 📖">تجويد وحفظ 📖</option>
                  <option value="سلوك وإحسان 🌸">سلوك وإحسان 🌸</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-slate-800">مكافأة XP</label>
                <input
                  type="number"
                  required
                  value={rewardXp}
                  onChange={(e) => setRewardXp(Number(e.target.value))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900"
                />
              </div>
            </div>

            {/* Target Scope Selection - BUG #1 FIX */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <label className="block text-slate-800 font-black">الجمهور المستهدف بالتحدي (Audience):</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTargetType('school');
                    setTargetName('المدرسة بأكملها');
                  }}
                  className={`p-2.5 rounded-xl text-center border font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    targetType === 'school'
                      ? 'bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-amber-400/30'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <span>🏫 المدرسة كاملة</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTargetType('batch');
                    setTargetName('الدفعة الحالية');
                  }}
                  className={`p-2.5 rounded-xl text-center border font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    targetType === 'batch'
                      ? 'bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-amber-400/30'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <span>👥 الدفعة</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTargetType('class');
                    if (classesList.length > 0) setTargetName(classesList[0]);
                  }}
                  className={`p-2.5 rounded-xl text-center border font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    targetType === 'class'
                      ? 'bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-amber-400/30'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <span>📚 فصل معين</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTargetType('club');
                    if (normalizedClubs.length > 0) {
                      setTargetName(normalizedClubs[0].name);
                      setTargetClubId(normalizedClubs[0].id);
                    }
                  }}
                  className={`p-2.5 rounded-xl text-center border font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    targetType === 'club'
                      ? 'bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-amber-400/30'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <span>🎙️ نادي معين</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTargetType('student');
                    if (studentsList.length > 0) {
                      setTargetStudentId(studentsList[0].id);
                      setTargetStudentCode(studentsList[0].studentCode || '');
                      setTargetName(studentsList[0].name);
                    }
                  }}
                  className={`p-2.5 rounded-xl text-center border font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 col-span-2 sm:col-span-1 ${
                    targetType === 'student'
                      ? 'bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-amber-400/30'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <span>👤 طالبة محددة</span>
                </button>
              </div>

              {targetType === 'class' && (
                <div className="mt-2">
                  <label className="block mb-1 text-slate-700">اختر الفصل المستهدف:</label>
                  <select
                    value={targetName}
                    onChange={(e) => setTargetName(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900"
                  >
                    {classesList.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {targetType === 'club' && (
                <div className="mt-2">
                  <label className="block mb-1 text-slate-700">اختر النادي المستهدف:</label>
                  <select
                    value={targetClubId || targetName}
                    onChange={(e) => {
                      const selected = normalizedClubs.find((c) => c.id === e.target.value || c.name === e.target.value);
                      if (selected) {
                        setTargetName(selected.name);
                        setTargetClubId(selected.id);
                      } else {
                        setTargetName(e.target.value);
                      }
                    }}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900"
                  >
                    {normalizedClubs.length === 0 ? (
                      <option value="">لا توجد أندية تم إنشاؤها بعد</option>
                    ) : (
                      normalizedClubs.map((clb) => (
                        <option key={clb.id || clb.name} value={clb.id || clb.name}>
                          {clb.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}

              {targetType === 'student' && (
                <div className="mt-2">
                  <label className="block mb-1 text-slate-700">اختر الطالبة المستهدفة:</label>
                  {studentsList.length === 0 ? (
                    <p className="text-xs text-rose-500 font-bold p-2.5 bg-rose-50 rounded-xl border border-rose-100">
                      لا يوجد طالبات مسجلات في هذه الدفعة بعد
                    </p>
                  ) : (
                    <select
                      value={targetStudentId}
                      onChange={(e) => {
                        const sel = studentsList.find((s) => s.id === e.target.value);
                        if (sel) {
                          setTargetStudentId(sel.id);
                          setTargetStudentCode(sel.studentCode || '');
                          setTargetName(sel.name);
                        }
                      }}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900"
                    >
                      {studentsList.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name} ({st.studentCode}) - {st.className}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block mb-1 text-slate-800">موعد التسليم النهائى</label>
              <input
                type="text"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="مثال: خلال 3 أيام / حتى نهاية الشهر"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-amber-600 text-white font-black hover:bg-amber-700 shadow-md shadow-amber-600/20 disabled:opacity-50"
              >
                {isSubmitting ? 'جاري النشر...' : 'نشر التحدي'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

interface AddAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    content: string;
    author: string;
    pinned: boolean;
    targetType: 'student' | 'class' | 'batch' | 'club';
    targetValue: string;
    targetName: string;
  }) => void;
  batchesList?: Array<{ id: string; name: string }>;
  classesList?: string[];
  clubsList?: string[];
  studentsList?: Array<{ id: string; name: string; studentCode?: string; className?: string }>;
  currentBatchId?: string;
  currentBatchName?: string;
}

export const AddAnnouncementModal: React.FC<AddAnnouncementModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  batchesList = [],
  classesList = [],
  clubsList = [],
  studentsList = [],
  currentBatchId,
  currentBatchName,
}) => {
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('معلمة الدفعة');
  const [pinned, setPinned] = useState(false);
  const [targetType, setTargetType] = useState<'student' | 'class' | 'batch' | 'club'>('student');

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedClassName, setSelectedClassName] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState(currentBatchId || '');
  const [selectedClubName, setSelectedClubName] = useState('');

  const wasOpenRef = useRef(false);

  // Auto-select defaults when modal transitions to open
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      if (studentsList.length > 0) {
        setSelectedStudentId(studentsList[0].id);
      }
      if (classesList.length > 0) {
        setSelectedClassName(classesList[0]);
      }
      if (currentBatchId) {
        setSelectedBatchId(currentBatchId);
      } else if (batchesList.length > 0) {
        setSelectedBatchId(batchesList[0].id);
      }
      if (clubsList.length > 0) {
        setSelectedClubName(clubsList[0]);
      }
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, currentBatchId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    let targetVal = '';
    let targetLabel = '';

    if (targetType === 'student') {
      const std = studentsList.find((s) => s.id === selectedStudentId);
      targetVal = std?.id || selectedStudentId;
      targetLabel = std ? std.name : 'طالبة محددة';
    } else if (targetType === 'class') {
      targetVal = selectedClassName;
      targetLabel = selectedClassName ? `فصل ${selectedClassName}` : 'فصل محدد';
    } else if (targetType === 'batch') {
      const b = batchesList.find((bt) => bt.id === selectedBatchId);
      targetVal = selectedBatchId;
      targetLabel = b ? b.name : currentBatchName || 'الدفعة كاملة';
    } else if (targetType === 'club') {
      targetVal = selectedClubName;
      targetLabel = selectedClubName ? `نادي ${selectedClubName}` : 'نادي محدد';
    }

    const title = `رسالة المعلمة إلى ${targetLabel}`;

    onSubmit({
      title,
      content,
      author,
      pinned,
      targetType,
      targetValue: targetVal,
      targetName: targetLabel,
    });

    setContent('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg bg-white rounded-[28px] p-6 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5 text-teal-700">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900">إرسال رسالة جديدة من المعلمة</h3>
                <span className="text-xs font-bold text-slate-500 block">نظام الرسائل المباشرة الموجهة للطلاب</span>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-xl hover:bg-slate-100 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold text-slate-700">
            {/* Target Type Selector Buttons */}
            <div>
              <label className="block mb-2 text-slate-800 font-black">إرسال إلى:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetType('student')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                    targetType === 'student'
                      ? 'bg-teal-600 text-white border-teal-600 font-black shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span className="text-[11px]">طالب محدد</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetType('class')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                    targetType === 'class'
                      ? 'bg-teal-600 text-white border-teal-600 font-black shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <School className="w-4 h-4" />
                  <span className="text-[11px]">فصل محدد</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetType('batch')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                    targetType === 'batch'
                      ? 'bg-teal-600 text-white border-teal-600 font-black shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="text-[11px]">دفعة محددة</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetType('club')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                    targetType === 'club'
                      ? 'bg-teal-600 text-white border-teal-600 font-black shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[11px]">نادي محدد</span>
                </button>
              </div>
            </div>

            {/* Target Value Input / Select */}
            <div className="bg-teal-50/60 p-3.5 rounded-2xl border border-teal-100 space-y-2">
              {targetType === 'student' && (
                <div>
                  <label className="block mb-1 text-teal-900 font-bold">اختاري الطالبة المستهدفة:</label>
                  {studentsList.length > 0 ? (
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full p-3 bg-white border border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900 text-xs"
                    >
                      {studentsList.map((std) => (
                        <option key={std.id} value={std.id}>
                          {std.name} ({std.studentCode || 'بدون كود'}) - {std.className || 'بدون فصل'}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-rose-600 text-xs font-bold p-2 bg-white rounded-xl border border-rose-200">
                      لا يوجد طلاب متاحون في هذه الدفعة حالياً.
                    </div>
                  )}
                </div>
              )}

              {targetType === 'class' && (
                <div>
                  <label className="block mb-1 text-teal-900 font-bold">إرسال لكل طلاب فصل:</label>
                  {classesList.length > 0 ? (
                    <select
                      value={selectedClassName}
                      onChange={(e) => setSelectedClassName(e.target.value)}
                      className="w-full p-3 bg-white border border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900 text-xs"
                    >
                      {classesList.map((cName) => (
                        <option key={cName} value={cName}>
                          فصل {cName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-amber-700 text-xs font-bold p-2 bg-white rounded-xl border border-amber-200">
                      لا توجد فصول محددة، يمكنك كتابة اسم الفصل.
                      <input
                        type="text"
                        value={selectedClassName}
                        onChange={(e) => setSelectedClassName(e.target.value)}
                        placeholder="اسم الفصل (مثال: فصل D)"
                        className="w-full mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                      />
                    </div>
                  )}
                </div>
              )}

              {targetType === 'batch' && (
                <div>
                  <label className="block mb-1 text-teal-900 font-bold">إرسال لكل طلاب الدفعة:</label>
                  {batchesList.length > 0 ? (
                    <select
                      value={selectedBatchId}
                      onChange={(e) => setSelectedBatchId(e.target.value)}
                      className="w-full p-3 bg-white border border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900 text-xs"
                    >
                      {batchesList.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-2.5 bg-white rounded-xl text-teal-900 font-bold border border-teal-200">
                      {currentBatchName || 'الدفعة الحالية كاملة'}
                    </div>
                  )}
                </div>
              )}

              {targetType === 'club' && (
                <div>
                  <label className="block mb-1 text-teal-900 font-bold">إرسال لكل أعضاء نادي:</label>
                  {clubsList.length > 0 ? (
                    <select
                      value={selectedClubName}
                      onChange={(e) => setSelectedClubName(e.target.value)}
                      className="w-full p-3 bg-white border border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900 text-xs"
                    >
                      {clubsList.map((clubName) => (
                        <option key={clubName} value={clubName}>
                          {clubName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-amber-700 text-xs font-bold p-2 bg-white rounded-xl border border-amber-200">
                      لا توجد أندية محددة.
                      <input
                        type="text"
                        value={selectedClubName}
                        onChange={(e) => setSelectedClubName(e.target.value)}
                        placeholder="اسم النادي (مثال: نادي الإذاعة)"
                        className="w-full mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Message Text Area */}
            <div>
              <label className="block mb-1 text-slate-800 font-bold">نص الرسالة:</label>
              <textarea
                required
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="اكتبي نص الرسالة المباشرة للطالب/المجموعة هنا..."
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900 resize-none text-xs sm:text-sm leading-relaxed"
              />
            </div>

            {/* Author / Sender Name */}
            <div>
              <label className="block mb-1 text-slate-800 font-bold">اسم المعلمة المرسلة:</label>
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="pinned-ann"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
              />
              <label htmlFor="pinned-ann" className="text-slate-700 font-bold cursor-pointer">
                تمييز الرسالة في أعلى القائمة
              </label>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black shadow-md shadow-teal-600/20 cursor-pointer flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>إرسال الرسالة الآن</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

interface CreateClubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    supervisorName: string;
    category: string;
    selectedStudentIds?: string[];
  }) => void;
  classes?: BatchClass[];
  students?: BatchStudent[];
}

export const CreateClubModal: React.FC<CreateClubModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  classes = [],
  students = [],
}) => {
  const [name, setName] = useState('');
  const [supervisorName, setSupervisorName] = useState('أ. مشرف النادي');
  const [category, setCategory] = useState('أنشطة ثقافية وإعلامية');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [activeClassName, setActiveClassName] = useState<string>('');

  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      if (classes.length > 0) {
        setActiveClassName(classes[0].name);
      }
    } else if (!isOpen && wasOpenRef.current) {
      setName('');
      setSupervisorName('أ. مشرف النادي');
      setCategory('أنشطة ثقافية وإعلامية');
      setSelectedStudentIds([]);
      setActiveClassName('');
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  if (!isOpen) return null;

  const currentClassStudents = students.filter(
    (s) => s.className === activeClassName
  );

  const toggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const isAllClassSelected =
    currentClassStudents.length > 0 &&
    currentClassStudents.every((s) => selectedStudentIds.includes(s.id));

  const toggleSelectAllClass = () => {
    const classIds = currentClassStudents.map((s) => s.id);
    if (isAllClassSelected) {
      setSelectedStudentIds((prev) => prev.filter((id) => !classIds.includes(id)));
    } else {
      setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...classIds])));
    }
  };

  const removeStudent = (studentId: string) => {
    setSelectedStudentIds((prev) => prev.filter((id) => id !== studentId));
  };

  const selectedStudentsList = selectedStudentIds
    .map((id) => students.find((s) => s.id === id))
    .filter((s): s is BatchStudent => Boolean(s));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name,
      supervisorName,
      category,
      selectedStudentIds,
    });
    setName('');
    setSelectedStudentIds([]);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-xl bg-white rounded-[28px] p-6 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto scrollbar-thin"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-black text-lg text-slate-900">تأسيس نادي جديد بالدفعة</h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold text-slate-700">
            <div>
              <label className="block mb-1 text-slate-800">اسم النادي</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: 🎙️ نادي الإلقاء والخطابة"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-slate-800">المشرف على النادي</label>
                <input
                  type="text"
                  required
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                  placeholder="أ. فاطمة أحمد"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-800">مجال النادي</label>
                <input
                  type="text"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="الأنشطة الإعلامية / الترتيل والتجويد"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
                />
              </div>
            </div>

            {/* Section: إضافة الطلاب */}
            <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>إضافة الطلاب</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    اختياري
                  </span>
                </div>
                {selectedStudentIds.length > 0 && (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-xl">
                    المحدد: {selectedStudentIds.length} طالب
                  </span>
                )}
              </div>

              <p className="text-[11px] font-medium text-slate-500">
                اختر الفصل الدراسي لعرض طلابه وتحديد الانضمام مباشرة للنادي:
              </p>

              {classes.length === 0 ? (
                <div className="p-3 bg-white border border-slate-200 rounded-xl text-center text-slate-400 text-xs font-bold">
                  لا توجد فصول دراسية حالية بالدفعة.
                </div>
              ) : (
                <>
                  {/* Class selection tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                    {classes.map((cls) => {
                      const countInClass = students.filter((s) => s.className === cls.name).length;
                      const selectedInClass = students.filter(
                        (s) => s.className === cls.name && selectedStudentIds.includes(s.id)
                      ).length;
                      const isActive = activeClassName === cls.name;
                      return (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => setActiveClassName(cls.name)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                            isActive
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span>{cls.name}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                              isActive ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {selectedInClass > 0 ? `${selectedInClass}/${countInClass}` : countInClass}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Student checklist for active class */}
                  <div className="bg-white border border-slate-200/90 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-[11px] font-bold text-slate-700">
                      <span>طلاب {activeClassName || 'الفصل'}:</span>
                      {currentClassStudents.length > 0 && (
                        <button
                          type="button"
                          onClick={toggleSelectAllClass}
                          className="text-emerald-700 hover:text-emerald-800 hover:underline font-bold text-[11px]"
                        >
                          {isAllClassSelected ? 'إلغاء تحديد الكل' : 'تحديد جميع طلاب الفصل'}
                        </button>
                      )}
                    </div>

                    {currentClassStudents.length === 0 ? (
                      <div className="text-center py-3 text-slate-400 text-xs font-medium">
                        لا يوجد طلاب مسجلون في {activeClassName}
                      </div>
                    ) : (
                      <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
                        {currentClassStudents.map((std) => {
                          const isSelected = selectedStudentIds.includes(std.id);
                          return (
                            <div
                              key={std.id}
                              onClick={() => toggleStudent(std.id)}
                              className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-black'
                                  : 'bg-slate-50/60 border-slate-100 hover:bg-slate-100 text-slate-700 font-bold'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                                />
                                {std.avatarUrl && (
                                  <img
                                    src={std.avatarUrl}
                                    alt={std.name}
                                    className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0"
                                  />
                                )}
                                <span className="truncate">{std.name}</span>
                                {std.clubName && std.clubName !== 'بدون نادي' && (
                                  <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded font-medium shrink-0">
                                    في {std.clubName}
                                  </span>
                                )}
                              </div>
                              {std.studentCode && (
                                <span className="text-[10px] text-slate-400 font-mono font-bold shrink-0">
                                  {std.studentCode}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Selected Students Area */}
              <div className="pt-2 border-t border-slate-200/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-slate-800">
                    الطلاب المحدودون ({selectedStudentsList.length})
                  </span>
                  {selectedStudentsList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedStudentIds([])}
                      className="text-[10px] text-rose-600 font-bold hover:underline"
                    >
                      مسح الكل
                    </button>
                  )}
                </div>

                {selectedStudentsList.length === 0 ? (
                  <div className="text-center py-2.5 bg-white border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-medium">
                    لم يتم اختيار أي طالب بعد
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-1 bg-white border border-slate-200 rounded-xl">
                    {selectedStudentsList.map((std) => (
                      <div
                        key={std.id}
                        className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/90 text-emerald-950 text-xs font-bold px-2.5 py-1 rounded-xl"
                      >
                        <span className="truncate max-w-[130px]">{std.name}</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-medium">
                          {std.className}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeStudent(std.id)}
                          className="text-emerald-700 hover:text-rose-600 p-0.5 rounded hover:bg-rose-50 transition-colors"
                          title="إزالة الطالب"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-black hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
              >
                <span>إنشاء النادي</span>
                {selectedStudentsList.length > 0 && (
                  <span className="text-xs bg-emerald-700 px-2 py-0.5 rounded-full">
                    {selectedStudentsList.length}
                  </span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

interface UploadLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    fileType: 'pdf' | 'video' | 'audio' | 'image' | 'link' | 'doc';
    url: string;
    thumbnailUrl: string;
    category: string;
    targetType: 'all' | 'batch' | 'club' | 'student';
    targetId?: string;
    targetName?: string;
    targetStudentId?: string;
    targetStudentCode?: string;
    fileSize?: string;
    duration?: string;
  }) => void;
  currentBatchName?: string;
  batchesList?: Array<{ id: string; name: string }>;
  clubsList?: Array<{ id: string; name: string } | string>;
  studentsList?: Array<{ id: string; name: string; studentCode?: string; className?: string }>;
}

export const UploadLibraryModal: React.FC<UploadLibraryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentBatchName = 'الدفعة الحالية',
  batchesList = [],
  clubsList = [],
  studentsList = [],
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileType, setFileType] = useState<'pdf' | 'video' | 'audio' | 'image' | 'link' | 'doc'>('pdf');
  const [url, setUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [category, setCategory] = useState('أدلة وتفاسير');
  const [targetType, setTargetType] = useState<'all' | 'batch' | 'club' | 'student'>('all');
  const [selectedBatchId, setSelectedBatchId] = useState(batchesList[0]?.id || '');
  const [selectedBatchName, setSelectedBatchName] = useState(currentBatchName);
  
  const getClubName = (c: { id: string; name: string } | string) => typeof c === 'string' ? c : c.name;
  const getClubId = (c: { id: string; name: string } | string) => typeof c === 'string' ? c : c.id;

  const [selectedClubId, setSelectedClubId] = useState(clubsList[0] ? getClubId(clubsList[0]) : '');
  const [selectedStudentId, setSelectedStudentId] = useState(studentsList[0]?.id || '');
  const [fileSize, setFileSize] = useState('3.5 MB');
  const [duration, setDuration] = useState('10:00 دقيقة');

  const wasOpenRef = useRef(false);

  React.useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      if (currentBatchName) setSelectedBatchName(currentBatchName);
      if (batchesList.length > 0) {
        setSelectedBatchId(batchesList[0].id);
        setSelectedBatchName(batchesList[0].name);
      }
      if (clubsList.length > 0) {
        setSelectedClubId(getClubId(clubsList[0]));
      }
      if (studentsList.length > 0) {
        setSelectedStudentId(studentsList[0].id);
      }
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, currentBatchName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let targetName = 'الجميع';
    let targetId: string | undefined = undefined;
    let targetStudentId: string | undefined = undefined;
    let targetStudentCode: string | undefined = undefined;

    if (targetType === 'batch') {
      const matchBatch = batchesList.find((b) => b.id === selectedBatchId || b.name === selectedBatchName);
      targetName = matchBatch ? matchBatch.name : (selectedBatchName || currentBatchName);
      targetId = matchBatch ? matchBatch.id : selectedBatchId;
    } else if (targetType === 'club') {
      const matchClub = clubsList.find((c) => getClubId(c) === selectedClubId || getClubName(c) === selectedClubId);
      targetName = matchClub ? getClubName(matchClub) : 'نادي محدد';
      targetId = matchClub ? getClubId(matchClub) : selectedClubId;
    } else if (targetType === 'student') {
      const st = studentsList.find((s) => s.id === selectedStudentId) || studentsList[0];
      if (st) {
        targetName = st.name;
        targetId = st.id;
        targetStudentId = st.id;
        targetStudentCode = st.studentCode;
      } else {
        targetName = 'طالب محدد';
      }
    }

    onSubmit({
      title,
      description,
      fileType,
      url: url || (fileType === 'link' ? 'https://quran.com' : 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'),
      thumbnailUrl,
      category,
      targetType,
      targetId,
      targetName,
      targetStudentId,
      targetStudentCode,
      fileSize: fileType === 'pdf' || fileType === 'image' || fileType === 'doc' ? fileSize : undefined,
      duration: fileType === 'video' || fileType === 'audio' ? duration : undefined,
    });

    // Reset
    setTitle('');
    setDescription('');
    setUrl('');
    setThumbnailUrl('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg bg-white rounded-[32px] p-6 shadow-2xl border border-slate-100 space-y-5 my-8 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 font-bold">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900">إضافة مورد جديد للمكتبة 📚</h3>
                <p className="text-xs font-bold text-slate-500">إضافة وسائط ومراجع تعليمية تظهر فوراً للطالبات في المكتبة</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold text-slate-700">
            {/* Title */}
            <div>
              <label className="block mb-1 text-slate-800">عنوان المورد أو المستند *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: كتاب التدبر والتفكر في سورة الرحمن"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block mb-1 text-slate-800">وصف ملخص للمورد (يظهر للطالب)</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ملخص قصير يوضح محتوى المورد وماذا يستفيد منه الطالب..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
              />
            </div>

            {/* Resource Type & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-slate-800">نوع المورد 🎥📄🎧</label>
                <select
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value as any)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
                >
                  <option value="pdf">📄 مستند PDF</option>
                  <option value="video">🎥 فيديو تعليمي</option>
                  <option value="audio">🎧 تسجيل صوتي / تلاوة</option>
                  <option value="image">🖼️ صورة / إنفوجرافيك</option>
                  <option value="link">🔗 رابط موقع / منصة خارجية</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-slate-800">التصنيف الموضوعي</label>
                <input
                  type="text"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="كتب وتفاسير / تلاوات / دروس مرئية"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
                />
              </div>
            </div>

            {/* Target Audience Selector (الجميع - الدفعة - النادي - الطالب) */}
            <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-2xl space-y-2">
              <label className="block text-teal-900 font-black text-xs">تحديد الفئة المستهدفة لرؤية هذا المورد:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetType('all')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    targetType === 'all'
                      ? 'bg-teal-600 text-white font-black shadow-sm border-teal-600'
                      : 'bg-white text-slate-700 hover:bg-slate-50 font-bold border-slate-200'
                  }`}
                >
                  🌐 الجميع
                </button>

                <button
                  type="button"
                  onClick={() => setTargetType('batch')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    targetType === 'batch'
                      ? 'bg-teal-600 text-white font-black shadow-sm border-teal-600'
                      : 'bg-white text-slate-700 hover:bg-slate-50 font-bold border-slate-200'
                  }`}
                >
                  📚 دفعة محددة
                </button>

                <button
                  type="button"
                  onClick={() => setTargetType('club')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    targetType === 'club'
                      ? 'bg-teal-600 text-white font-black shadow-sm border-teal-600'
                      : 'bg-white text-slate-700 hover:bg-slate-50 font-bold border-slate-200'
                  }`}
                >
                  🎙️ نادي محدد
                </button>

                <button
                  type="button"
                  onClick={() => setTargetType('student')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    targetType === 'student'
                      ? 'bg-teal-600 text-white font-black shadow-sm border-teal-600'
                      : 'bg-white text-slate-700 hover:bg-slate-50 font-bold border-slate-200'
                  }`}
                >
                  👤 طالب محدد
                </button>
              </div>

              {targetType === 'batch' && (
                <div className="mt-2">
                  <label className="block text-slate-700 mb-1">اختر الدفعة المستهدفة:</label>
                  {batchesList.length > 0 ? (
                    <select
                      value={selectedBatchId}
                      onChange={(e) => {
                        setSelectedBatchId(e.target.value);
                        const b = batchesList.find((x) => x.id === e.target.value);
                        if (b) setSelectedBatchName(b.name);
                      }}
                      className="w-full p-2.5 bg-white border border-teal-300 rounded-xl font-bold text-slate-900 focus:outline-none"
                    >
                      {batchesList.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-[11px] text-teal-800 font-bold bg-white p-2 rounded-xl border border-teal-200">
                      الدفعة المستهدفة: <span className="font-black text-slate-900">{currentBatchName}</span>
                    </div>
                  )}
                </div>
              )}

              {targetType === 'club' && (
                <div className="mt-2">
                  <label className="block text-slate-700 mb-1">اختر النادي المستهدف:</label>
                  {clubsList.length > 0 ? (
                    <select
                      value={selectedClubId}
                      onChange={(e) => setSelectedClubId(e.target.value)}
                      className="w-full p-2.5 bg-white border border-teal-300 rounded-xl font-bold text-slate-900 focus:outline-none"
                    >
                      {clubsList.map((c) => {
                        const cid = getClubId(c);
                        const cname = getClubName(c);
                        return (
                          <option key={cid} value={cid}>
                            {cname}
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <div className="text-[11px] text-amber-800 font-bold bg-white p-2 rounded-xl border border-amber-200">
                      لا توجد أندية مخصصة بالدفعة حالياً، سيتم استهداف الأندية العامة.
                    </div>
                  )}
                </div>
              )}

              {targetType === 'student' && (
                <div className="mt-2">
                  <label className="block text-slate-700 mb-1">اختر الطالب المستهدف:</label>
                  {studentsList.length > 0 ? (
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full p-2.5 bg-white border border-teal-300 rounded-xl font-bold text-slate-900 focus:outline-none"
                    >
                      {studentsList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.className || 'طالب'})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-[11px] text-amber-800 font-bold bg-white p-2 rounded-xl border border-amber-200">
                      لا يوجد طلاب مسجلون في هذه الدفعة حالياً.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* URL or File Link */}
            <div>
              <label className="block mb-1 text-slate-800">رابط الملف أو الفيديو أو الموقع المباشر 🔗</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={
                  fileType === 'link'
                    ? 'https://example.com/site'
                    : fileType === 'video'
                    ? 'https://commondatastorage.googleapis.com/...mp4'
                    : 'https://example.com/document.pdf'
                }
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900 text-left dir-ltr"
              />
            </div>

            {/* Optional Thumbnail URL */}
            <div>
              <label className="block mb-1 text-slate-800">رابط صورة مصغرة للمورد (Thumbnail - اختيارية)</label>
              <input
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900 text-left dir-ltr"
              />
            </div>

            {/* Size / Duration */}
            {(fileType === 'pdf' || fileType === 'image' || fileType === 'doc') && (
              <div>
                <label className="block mb-1 text-slate-800">حجم الملف</label>
                <input
                  type="text"
                  value={fileSize}
                  onChange={(e) => setFileSize(e.target.value)}
                  placeholder="3.5 MB"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-bold text-slate-900"
                />
              </div>
            )}

            {(fileType === 'video' || fileType === 'audio') && (
              <div>
                <label className="block mb-1 text-slate-800">مدة التسجيل / الفيديو</label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="12:30 دقيقة"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-bold text-slate-900"
                />
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-teal-600 text-white font-black hover:bg-teal-700 shadow-md shadow-teal-600/20"
              >
                حفظ ونشر المورد للطلاب 🚀
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

interface ReviewSubmissionModalProps {
  submission: PendingSubmission | null;
  onClose: () => void;
  onReview: (submissionId: string, status: 'approved' | 'rejected', notes: string) => void;
}

export const ReviewSubmissionModal: React.FC<ReviewSubmissionModalProps> = ({ submission, onClose, onReview }) => {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!submission) return null;

  const handleAction = async (status: 'approved' | 'rejected') => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onReview(submission.id, status, notes);
      onClose();
    } catch (err) {
      console.error('Error during review submission:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg bg-white rounded-[32px] p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-6"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              {submission.studentAvatar ? (
                <img
                  src={submission.studentAvatar}
                  alt={submission.studentName}
                  className="w-11 h-11 rounded-2xl object-cover border-2 border-teal-500/20"
                />
              ) : (
                <div className="w-11 h-11 rounded-2xl bg-teal-100 text-teal-800 font-bold flex items-center justify-center border-2 border-teal-500/20 text-sm">
                  {submission.studentName ? submission.studentName.charAt(0) : 'ط'}
                </div>
              )}
              <div>
                <h3 className="font-black text-base text-slate-900">{submission.studentName}</h3>
                <p className="text-xs font-bold text-slate-500">{submission.className} • {submission.submittedAt}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-xl hover:bg-slate-100 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-teal-700 bg-teal-100/80 px-2.5 py-0.5 rounded-full">
                {submission.sourceName}
              </span>
              <span className="text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                +{submission.rewardXp} XP 💎
              </span>
            </div>
            <h4 className="font-black text-sm text-slate-900">{submission.taskTitle}</h4>
            <p className="text-xs font-bold text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200/60">
              "{submission.contentSummary}"
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">ملاحظات المعلمة وتوجيه التحفيز (اختياري)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اكتب كلمة مشجعة للطالبة أو ملاحظة للتعديل..."
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              disabled={isSubmitting}
              onClick={() => handleAction('rejected')}
              className="px-4 py-2.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle className="w-4 h-4" />
              <span>رفض / إعادة للتعديل</span>
            </button>

            <button
              disabled={isSubmitting}
              onClick={() => handleAction('approved')}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'جاري الاعتماد...' : 'اعتماد ومنح النقاط 🎉'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

interface EditStudentModalProps {
  isOpen: boolean;
  student: BatchStudent | null;
  onClose: () => void;
  onSubmit: (studentId: string, updates: Partial<BatchStudent>) => void;
  onDelete?: (studentId: string) => void;
  classesList?: string[];
  clubsList?: string[];
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  isOpen,
  student,
  onClose,
  onSubmit,
  onDelete,
  classesList = ['الفصل E', 'الفصل F', 'الفصل G', 'الفصل A', 'الفصل B', 'الفصل C', 'الفصل A+'],
  clubsList = [],
}) => {
  const [name, setName] = useState('');
  const [className, setClassName] = useState('الفصل E');
  const [clubName, setClubName] = useState('بدون نادي');
  const [points, setPoints] = useState(0);
  const [teacherNotes, setTeacherNotes] = useState('');

  // Sub-dialogs state
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [targetMoveClass, setTargetMoveClass] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  React.useEffect(() => {
    if (isOpen && student) {
      setName(student.name || '');
      setClassName(student.className || '');
      setClubName(student.clubName || 'بدون نادي');
      setPoints(student.points || 0);
      setTeacherNotes(student.teacherNotes || '');
      setTargetMoveClass(student.className || '');
      setShowMoveModal(false);
      setShowDeleteConfirm(false);
    }
  }, [isOpen, student?.id]);

  if (!isOpen || !student) return null;

  // Calculate current level dynamically from JourneyEngine
  const journeyRes = calculateStudentJourney({
    id: student.id,
    name: student.name,
    studentCode: student.studentCode || '',
    xp: points,
    points: points,
    attendanceRate: student.attendanceRate || 0,
    completedChallengesCount: student.completedChallengesCount || 0,
    clubTasksCompleted: student.completedTasks || 0,
    clubAnnouncementsCount: 0,
    teacherEvaluationsCount: 0,
    libraryViewsCount: 0,
    specialRewardsCount: 0,
    badgesEarnedCount: 0,
  });
  const currentLevelTitle = journeyRes.currentStation?.title || '🌱 البداية';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(student.id, {
      name,
      className,
      clubName,
      points,
      teacherNotes,
      levelBadge: currentLevelTitle,
    });
    onClose();
  };

  const handleConfirmMoveClass = () => {
    if (!targetMoveClass || targetMoveClass === student.className) {
      setShowMoveModal(false);
      return;
    }
    setClassName(targetMoveClass);
    onSubmit(student.id, {
      name,
      className: targetMoveClass,
      clubName,
      teacherNotes,
      levelBadge: currentLevelTitle,
    });
    setShowMoveModal(false);
    onClose();
  };

  const handleConfirmDelete = () => {
    if (onDelete) {
      onDelete(student.id);
    }
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-white rounded-[28px] p-6 shadow-2xl border border-slate-100 space-y-5 my-8 relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-teal-700">
              <Edit2 className="w-5 h-5" />
              <h3 className="font-black text-lg text-slate-900">تعديل بيانات الطالب / الطالبة</h3>
            </div>
            <button onClick={onClose} className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold text-slate-700">
            {/* Student Name */}
            <div>
              <label className="block mb-1 text-slate-800">اسم الطالب / الطالبة</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
              />
            </div>

            {/* Class & Club Selection */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-slate-800">الفصل الدراسي</label>
                <select
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
                >
                  {classesList.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 text-slate-800">النادي المنتسب له</label>
                <select
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
                >
                  {clubsList.length === 0 ? (
                    <option value="بدون نادي">لا توجد أندية تم إنشاؤها بعد</option>
                  ) : (
                    <>
                      <option value="بدون نادي">بدون نادي</option>
                      {clubsList.map((clb) => (
                        <option key={clb} value={clb}>
                          {clb}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Editable XP Points & Dynamic Current Level */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-slate-800">نقاط XP الحالية</label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="0"
                    value={points}
                    onChange={(e) => setPoints(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-black text-slate-900"
                  />
                  <span className="absolute left-3 text-[10px] text-slate-400 font-black">XP 💎</span>
                </div>
              </div>

              <div>
                <label className="block mb-1 text-slate-800">المستوى الحالي</label>
                <div className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl font-black text-teal-800 flex items-center justify-between">
                  <span>{currentLevelTitle}</span>
                  <span className="text-[10px] text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 font-bold">تلقائي</span>
                </div>
              </div>
            </div>

            {/* Teacher Notes Area */}
            <div>
              <label className="block mb-1 text-slate-800">ملاحظات المعلمة</label>
              <textarea
                rows={3}
                value={teacherNotes}
                onChange={(e) => setTeacherNotes(e.target.value)}
                placeholder="اكتب ملاحظات المعلمة هنا..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900 resize-none"
              />
            </div>

            {/* Actions Section */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="block text-[11px] font-black text-slate-400">إجراءات المعلمة السريعة:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowMoveModal(true)}
                  className="py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>🟢 نقل إلى فصل آخر</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200/80 font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>🔴 حذف الطالب</span>
                </button>
              </div>
            </div>

            {/* Buttons Bar */}
            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-black hover:bg-teal-700 shadow-md shadow-teal-600/20 transition-all cursor-pointer"
              >
                حفظ التعديلات
              </button>
            </div>
          </form>

          {/* Sub-Modal 1: Move Class Dialog */}
          {showMoveModal && (
            <div className="fixed inset-0 z-60 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 dir-rtl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4"
              >
                <div className="flex items-center gap-2 text-emerald-700">
                  <ArrowRightLeft className="w-5 h-5" />
                  <h4 className="font-black text-sm text-slate-900">نقل الطالبة إلى فصل آخر</h4>
                </div>
                <p className="text-xs text-slate-600 font-bold leading-relaxed">
                  سيتم نقل الطالبة <span className="text-teal-700 font-black">({student.name})</span> مع الحفاظ التام على جميع النقاط والإنجازات والشارات ومسيرة الرحلة.
                </p>
                <div>
                  <label className="block mb-1 text-xs font-bold text-slate-700">اختر الفصل الجديد:</label>
                  <select
                    value={targetMoveClass}
                    onChange={(e) => setTargetMoveClass(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900"
                  >
                    {classesList.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls} {cls === student.className ? '(الفصل الحالي)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowMoveModal(false)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmMoveClass}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-black text-xs hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all"
                  >
                    تأكيد النقل
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Sub-Modal 2: Delete Confirm Dialog */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-60 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 dir-rtl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4"
              >
                <div className="flex items-center gap-2 text-rose-600">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <h4 className="font-black text-sm text-slate-900">هل أنت متأكد من حذف هذا الطالب؟</h4>
                </div>
                <p className="text-xs text-slate-600 font-bold leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  الطالب: <span className="text-slate-900 font-black">{student.name}</span>
                </p>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white font-black text-xs hover:bg-rose-700 shadow-md shadow-rose-600/20 transition-all cursor-pointer"
                  >
                    حذف
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (students: Array<{ name: string; studentCode?: string; className: string; clubName?: string; points?: number }>) => void;
  classesList?: string[];
  clubsList?: string[];
}

export const ImportExcelModal: React.FC<ImportExcelModalProps> = ({
  isOpen,
  onClose,
  onImport,
  classesList = ['الفصل E', 'الفصل F', 'الفصل G'],
  clubsList = [],
}) => {
  return (
    <AddStudentModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={() => {}}
      onImportExcel={onImport}
      classesList={classesList}
      clubsList={clubsList}
      initialMode="excel"
    />
  );
};

// --- CREATE & EDIT BATCH MODAL ---
interface CreateBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    stage: string;
    gender: 'female' | 'male' | 'mixed';
    supervisorName: string;
    code: string;
    description: string;
  }) => void;
}

export const CreateBatchModal: React.FC<CreateBatchModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [stage, setStage] = useState('المرحلة الابتدائية العليا');
  const [gender, setGender] = useState<'female' | 'male' | 'mixed'>('female');
  const [supervisorName, setSupervisorName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name,
      stage,
      gender,
      supervisorName: supervisorName || 'أ. مشرف الدفعة',
      code: code || `BATCH-${Math.floor(Math.random() * 900 + 100)}`,
      description: description || 'دفعة تعليمية وتربوية جديدة',
    });
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-white rounded-[28px] p-6 shadow-2xl border border-slate-100 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-teal-700">
              <FolderPlus className="w-5 h-5" />
              <h3 className="font-black text-lg text-slate-900">إضافة دفعة جديدة</h3>
            </div>
            <button onClick={onClose} className="p-1 rounded-xl hover:bg-slate-100 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold text-slate-700">
            <div>
              <label className="block mb-1 text-slate-800">اسم الدفعة</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: دفعة الصف الخامس الابتدائي (إناث)"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-slate-800">المرحلة الدراسية</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
                >
                  <option value="المرحلة الابتدائية الأولى">المرحلة الابتدائية الأولى</option>
                  <option value="المرحلة الابتدائية العليا">المرحلة الابتدائية العليا</option>
                  <option value="المرحلة المتوسطة / الإعدادية">المرحلة المتوسطة / الإعدادية</option>
                  <option value="المرحلة الثانوية">المرحلة الثانوية</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-slate-800">جنس الطلاب</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
                >
                  <option value="female">إناث 🌸</option>
                  <option value="male">ذكور ⚡</option>
                  <option value="mixed">مختلط 👥</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block mb-1 text-slate-800">اسم مشرف / معلم الدفعة</label>
              <input
                type="text"
                value={supervisorName}
                onChange={(e) => setSupervisorName(e.target.value)}
                placeholder="مثال: أ. خديجة محمود"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block mb-1 text-slate-800">وصف مختصر للدفعة</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف أهداف وبرامج هذه الدفعة..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900 resize-none"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-black hover:bg-teal-700 shadow-md shadow-teal-600/20"
              >
                تأسيس الدفعة
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

interface EditBatchModalProps {
  isOpen: boolean;
  batch: Batch | null;
  onClose: () => void;
  onSubmit: (batchId: string, updates: Partial<Batch>) => void;
  onDelete?: (batchId: string) => void;
}

export const EditBatchModal: React.FC<EditBatchModalProps> = ({ isOpen, batch, onClose, onSubmit, onDelete }) => {
  const [name, setName] = useState(batch?.name || '');
  const [stage, setStage] = useState(batch?.stage || '');
  const [gender, setGender] = useState<'female' | 'male' | 'mixed'>(batch?.gender || 'female');
  const [supervisorName, setSupervisorName] = useState(batch?.supervisorName || '');
  const [description, setDescription] = useState(batch?.description || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  React.useEffect(() => {
    if (isOpen && batch) {
      setName(batch.name || '');
      setStage(batch.stage || 'المرحلة الابتدائية العليا');
      setGender(batch.gender || 'female');
      setSupervisorName(batch.supervisorName || '');
      setDescription(batch.description || '');
      setShowDeleteConfirm(false);
    }
  }, [isOpen, batch?.id]);

  if (!isOpen || !batch) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(batch.id, { name, stage, gender, supervisorName, description });
    onClose();
  };

  const handleConfirmDelete = () => {
    if (onDelete && batch) {
      onDelete(batch.id);
    }
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-white rounded-[28px] p-6 shadow-2xl border border-slate-100 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-teal-700">
              <Edit2 className="w-5 h-5" />
              <h3 className="font-black text-lg text-slate-900">تعديل بيانات الدفعة</h3>
            </div>
            <button onClick={onClose} className="p-1 rounded-xl hover:bg-slate-100 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold text-slate-700">
            <div>
              <label className="block mb-1 text-slate-800">اسم الدفعة</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-slate-800">المرحلة الدراسية</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
                >
                  <option value="المرحلة الابتدائية الأولى">المرحلة الابتدائية الأولى</option>
                  <option value="المرحلة الابتدائية العليا">المرحلة الابتدائية العليا</option>
                  <option value="المرحلة المتوسطة / الإعدادية">المرحلة المتوسطة / الإعدادية</option>
                  <option value="المرحلة الثانوية">المرحلة الثانوية</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-slate-800">جنس الطلاب</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
                >
                  <option value="female">إناث 🌸</option>
                  <option value="male">ذكور ⚡</option>
                  <option value="mixed">مختلط 👥</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block mb-1 text-slate-800">مشرف الدفعة</label>
              <input
                type="text"
                value={supervisorName}
                onChange={(e) => setSupervisorName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block mb-1 text-slate-800">الوصف</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900 resize-none"
              />
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-slate-100">
              {onDelete ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف الدفعة</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-black hover:bg-teal-700 shadow-md shadow-teal-600/20 cursor-pointer"
                >
                  حفظ التعديلات
                </button>
              </div>
            </div>
          </form>

          {/* Delete Batch Confirmation Dialog */}
          <AnimatePresence>
            {showDeleteConfirm && (
              <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 text-right"
                >
                  <div className="flex items-center gap-2 text-rose-600">
                    <AlertTriangle className="w-6 h-6 shrink-0" />
                    <h4 className="font-black text-base text-slate-900">هل أنت متأكد من حذف هذه الدفعة؟</h4>
                  </div>
                  <p className="text-xs text-slate-600 font-bold leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    سيتم حذف الدفعة وفصولها وطلابها. هذا الإجراء لا يمكن التراجع عنه.
                  </p>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDelete}
                      className="px-4 py-2 rounded-xl bg-rose-600 text-white font-black hover:bg-rose-700 shadow-md shadow-rose-600/20 cursor-pointer"
                    >
                      حذف الدفعة
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// --- CREATE & EDIT CLASS MODAL ---
interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; teacherName: string; schedule: string; room: string }) => void;
}

export const CreateClassModal: React.FC<CreateClassModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [schedule, setSchedule] = useState('الأحد والأربعاء - 4 مساءً');
  const [room, setRoom] = useState('القاعة الأولى');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name,
      teacherName: teacherName || 'أ. المعلمة المشرفة',
      schedule,
      room,
    });
    setName('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-white rounded-[28px] p-6 shadow-2xl border border-slate-100 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-teal-700">
              <School className="w-5 h-5" />
              <h3 className="font-black text-lg text-slate-900">إنشاء فصل جديد بالدفعة</h3>
            </div>
            <button onClick={onClose} className="p-1 rounded-xl hover:bg-slate-100 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold text-slate-700">
            <div>
              <label className="block mb-1 text-slate-800">اسم الفصل / الحلقة</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: الفصل H أو حلقة عائشة"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block mb-1 text-slate-800">معلم/معلمة الفصل</label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="مثال: أ. أروى الحمد"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-slate-800">الموعد والجدول</label>
                <input
                  type="text"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-800">القاعة / المكان</label>
                <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-black hover:bg-teal-700 shadow-md shadow-teal-600/20"
              >
                إنشاء الفصل
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

interface EditClassModalProps {
  isOpen: boolean;
  batchClass: BatchClass | null;
  onClose: () => void;
  onSubmit: (classId: string, updates: Partial<BatchClass>) => void;
  onDelete?: (classId: string) => void;
}

export const EditClassModal: React.FC<EditClassModalProps> = ({
  isOpen,
  batchClass,
  onClose,
  onSubmit,
  onDelete,
}) => {
  const [name, setName] = useState(batchClass?.name || '');
  const [teacherName, setTeacherName] = useState(batchClass?.teacherName || '');
  const [schedule, setSchedule] = useState(batchClass?.schedule || '');
  const [room, setRoom] = useState(batchClass?.room || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  React.useEffect(() => {
    if (isOpen && batchClass) {
      setName(batchClass.name || '');
      setTeacherName(batchClass.teacherName || '');
      setSchedule(batchClass.schedule || '');
      setRoom(batchClass.room || '');
      setShowDeleteConfirm(false);
    }
  }, [isOpen, batchClass?.id]);

  if (!isOpen || !batchClass) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(batchClass.id, { name, teacherName, schedule, room });
    onClose();
  };

  const handleConfirmDelete = () => {
    if (onDelete && batchClass) {
      onDelete(batchClass.id);
    }
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-white rounded-[28px] p-6 shadow-2xl border border-slate-100 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-teal-700">
              <Edit2 className="w-5 h-5" />
              <h3 className="font-black text-lg text-slate-900">تعديل بيانات الفصل</h3>
            </div>
            <button onClick={onClose} className="p-1 rounded-xl hover:bg-slate-100 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold text-slate-700">
            <div>
              <label className="block mb-1 text-slate-800">اسم الفصل</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block mb-1 text-slate-800">معلم الفصل</label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-slate-800">الجدول</label>
                <input
                  type="text"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-800">القاعة</label>
                <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-slate-100">
              {onDelete ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف الفصل</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-black hover:bg-teal-700 shadow-md shadow-teal-600/20 cursor-pointer"
                >
                  حفظ التعديلات
                </button>
              </div>
            </div>
          </form>

          {/* Delete Class Confirmation Dialog */}
          <AnimatePresence>
            {showDeleteConfirm && (
              <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 text-right"
                >
                  <div className="flex items-center gap-2 text-rose-600">
                    <AlertTriangle className="w-6 h-6 shrink-0" />
                    <h4 className="font-black text-base text-slate-900">هل أنت متأكد من حذف هذا الفصل؟</h4>
                  </div>
                  <p className="text-xs text-slate-600 font-bold leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    سيتم حذف الفصل من الدفعة الحالية.
                  </p>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDelete}
                      className="px-4 py-2 rounded-xl bg-rose-600 text-white font-black hover:bg-rose-700 shadow-md shadow-rose-600/20 cursor-pointer"
                    >
                      حذف
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// --- EDIT CLUB MODAL ---
interface EditClubModalProps {
  isOpen: boolean;
  club: BatchClub | null;
  onClose: () => void;
  onSubmit: (clubId: string, updates: Partial<BatchClub>) => void;
  onDelete?: (clubId: string) => void;
}

export const EditClubModal: React.FC<EditClubModalProps> = ({ isOpen, club, onClose, onSubmit, onDelete }) => {
  const [name, setName] = useState(club?.name || '');
  const [description, setDescription] = useState(club?.description || '');
  const [supervisorName, setSupervisorName] = useState(club?.supervisorName || '');
  const [category, setCategory] = useState(club?.category || '');

  React.useEffect(() => {
    if (isOpen && club) {
      setName(club.name || '');
      setDescription(club.description || '');
      setSupervisorName(club.supervisorName || '');
      setCategory(club.category || '');
    }
  }, [isOpen, club?.id]);

  if (!isOpen || !club) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(club.id, { name, description, supervisorName, category });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-white rounded-[28px] p-6 shadow-2xl border border-slate-100 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <Edit2 className="w-5 h-5" />
              <h3 className="font-black text-lg text-slate-900">تعديل بيانات النادي</h3>
            </div>
            <button onClick={onClose} className="p-1 rounded-xl hover:bg-slate-100 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold text-slate-700">
            <div>
              <label className="block mb-1 text-slate-800">اسم النادي</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block mb-1 text-slate-800">المشرف على النادي</label>
              <input
                type="text"
                value={supervisorName}
                onChange={(e) => setSupervisorName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block mb-1 text-slate-800">وصف النادي</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900 resize-none"
              />
            </div>

            <div>
              <label className="block mb-1 text-slate-800">مجال النادي</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
              />
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-slate-100">
              {onDelete ? (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`هل أنتِ متأكدة من حذف النادي (${club.name})؟`)) {
                      onDelete(club.id);
                      onClose();
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف النادي</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-black hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                >
                  حفظ التعديلات
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// ================= CREATE ACHIEVEMENT MODAL =================
interface CreateAchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    icon: string;
    requiredCondition: string;
    journeyStepsReward: number;
    targetType: 'all' | 'batch' | 'club';
    targetName?: string;
    type?: 'manual' | 'automatic';
    autoTriggerType?: 'challenges_completed' | 'points_reached' | 'journey_steps' | 'club_tasks' | 'library_views';
    autoTriggerValue?: number;
    requiresReview?: boolean;
  }) => void;
  currentBatchName?: string;
  clubsList?: string[];
}

export const CreateAchievementModal: React.FC<CreateAchievementModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentBatchName = 'الدفعة الحالية',
  clubsList = [],
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🏆');
  const [requiredCondition, setRequiredCondition] = useState('');
  const [journeyStepsReward, setJourneyStepsReward] = useState(3);
  const [targetType, setTargetType] = useState<'all' | 'batch' | 'club'>('batch');
  const [selectedClub, setSelectedClub] = useState(clubsList[0] || '');
  
  // Achievement Type (Manual vs Automatic)
  const [achievementType, setAchievementType] = useState<'manual' | 'automatic'>('manual');
  const [autoTriggerType, setAutoTriggerType] = useState<'challenges_completed' | 'points_reached' | 'journey_steps' | 'club_tasks' | 'library_views'>('challenges_completed');
  const [autoTriggerValue, setAutoTriggerValue] = useState(5);

  const presetIcons = ['🏆', '👑', '💎', '🌟', '📖', '🎙️', '🎨', '🎯', '🚀', '🕌', '🏅', '🥇', '📚', '⚡', '🕊️'];

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !requiredCondition.trim()) return;

    let targetName = currentBatchName;
    if (targetType === 'club') {
      targetName = selectedClub;
    } else if (targetType === 'all') {
      targetName = 'جميع الطلاب والدفعات';
    }

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      icon,
      requiredCondition: requiredCondition.trim(),
      journeyStepsReward: Number(journeyStepsReward) || 1,
      targetType,
      targetName,
      type: achievementType,
      autoTriggerType: achievementType === 'automatic' ? autoTriggerType : undefined,
      autoTriggerValue: achievementType === 'automatic' ? Number(autoTriggerValue) || 1 : undefined,
      requiresReview: achievementType === 'manual',
    });

    // Reset & Close
    setTitle('');
    setDescription('');
    setRequiredCondition('');
    setJourneyStepsReward(3);
    setAchievementType('manual');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-xl bg-white rounded-[32px] p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 my-8 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold border border-amber-100">
                <Trophy className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900">إنشاء إنجاز جديد للطلاب 🏆</h3>
                <p className="text-xs text-slate-500 font-bold">تحديد نوع الإنجاز (تلقائي / يدوي) وشروط التقدم لدفعتك أو أنديتك</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-xl hover:bg-slate-100 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold text-slate-700">
            {/* ACHIEVEMENT TYPE SELECTOR (يدوي vs آلي) */}
            <div className="p-3.5 bg-gradient-to-r from-amber-50 to-teal-50 border border-teal-200/80 rounded-2xl space-y-2">
              <label className="block text-slate-900 font-black text-xs flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>نوع الإنجاز وآلية الاعتماد:</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAchievementType('manual');
                    if (!requiredCondition) setRequiredCondition('تسميع 3 أجزاء متتالية مع تقديم ملخص تدبري');
                  }}
                  className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                    achievementType === 'manual'
                      ? 'bg-white border-amber-500 text-amber-900 shadow-md ring-2 ring-amber-500/20'
                      : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between font-black text-xs">
                    <span>إنجاز يدوي 📤</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">يتطلب مراجعة المعلمة</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 mt-1">
                    يرسل الطالب طلب اعتماد وتوثيق للمعلمة، وبعد الموافقة يتم فتح الوسام وزيادة خطوات رحلته.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAchievementType('automatic');
                    if (!requiredCondition) setRequiredCondition('إكمال 5 تحديات يومية بصفحة التحديات');
                  }}
                  className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                    achievementType === 'automatic'
                      ? 'bg-white border-teal-500 text-teal-900 shadow-md ring-2 ring-teal-500/20'
                      : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between font-black text-xs">
                    <span>إنجاز تلقائي (آلي) ⚡</span>
                    <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-md">ينفتح فور تحقق الشرط</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 mt-1">
                    ينفتح تلقائياً فور إكمال الطالب للشروط المحددة (مثل إكمال عدد من التحديات أو النقاط) دون انتظار المعلمة.
                  </span>
                </button>
              </div>
            </div>

            {/* AUTOMATIC TRIGGER SETTINGS (IF AUTOMATIC) */}
            {achievementType === 'automatic' && (
              <div className="p-3.5 bg-teal-50/80 border border-teal-200 rounded-2xl space-y-3">
                <label className="block text-teal-900 font-black text-xs flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-teal-600" />
                  <span>حدد شرط الفتح التلقائي للنظام:</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 text-slate-800">نوع الشرط الآلي</label>
                    <select
                      value={autoTriggerType}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setAutoTriggerType(val);
                        if (val === 'challenges_completed') {
                          setRequiredCondition(`إكمال ${autoTriggerValue} تحديات بصفحة التحديات`);
                        } else if (val === 'points_reached') {
                          setRequiredCondition(`الوصول إلى ${autoTriggerValue} نقطة إجمالية`);
                        } else if (val === 'journey_steps') {
                          setRequiredCondition(`الوصول إلى الخطوة ${autoTriggerValue} في رحلتي`);
                        } else if (val === 'club_tasks') {
                          setRequiredCondition(`إكمال ${autoTriggerValue} مهام في أندية النشاط`);
                        } else if (val === 'library_views') {
                          setRequiredCondition(`قراءة وتلخيص ${autoTriggerValue} ملفات بالمكتبة`);
                        }
                      }}
                      className="w-full p-2.5 bg-white border border-teal-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="challenges_completed">إكمال عدد معين من التحديات (Challenges)</option>
                      <option value="points_reached">الوصول إلى عدد نقاط إجمالي (Points)</option>
                      <option value="journey_steps">الوصول إلى عدد خطوات في "رحلتي" (Steps)</option>
                      <option value="club_tasks">إكمال عدد مهام بالنادي (Club Tasks)</option>
                      <option value="library_views">قراءة ملفات المكتبة (Library Items)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 text-slate-800">الرقم المستهدف (القيمة المطلوبة)</label>
                    <input
                      type="number"
                      min={1}
                      value={autoTriggerValue}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 1;
                        setAutoTriggerValue(val);
                        if (autoTriggerType === 'challenges_completed') {
                          setRequiredCondition(`إكمال ${val} تحديات بصفحة التحديات`);
                        } else if (autoTriggerType === 'points_reached') {
                          setRequiredCondition(`الوصول إلى ${val} نقطة إجمالية`);
                        } else if (autoTriggerType === 'journey_steps') {
                          setRequiredCondition(`الوصول إلى الخطوة ${val} في رحلتي`);
                        } else if (autoTriggerType === 'club_tasks') {
                          setRequiredCondition(`إكمال ${val} مهام في أندية النشاط`);
                        } else if (autoTriggerType === 'library_views') {
                          setRequiredCondition(`قراءة وتلخيص ${val} ملفات بالمكتبة`);
                        }
                      }}
                      className="w-full p-2.5 bg-white border border-teal-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Title & Icon Choice */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block mb-1 text-slate-800">عنوان الإنجاز *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: 👑 وسام حافظة البقرة والآداب"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-800">الشارة / الأيقونة</label>
                <div className="flex items-center gap-1">
                  <span className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-xl shrink-0">
                    {icon}
                  </span>
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    placeholder="رمز"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-base font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Quick Preset Icon Selection */}
            <div>
              <label className="block mb-1 text-[11px] text-slate-500">اختر الشارة السريعة:</label>
              <div className="flex flex-wrap gap-1.5">
                {presetIcons.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIcon(ic)}
                    className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-all cursor-pointer ${
                      icon === ic ? 'bg-amber-500 text-white shadow-md scale-110' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block mb-1 text-slate-800">وصف الإنجاز</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف مختصر ومحفز للطلاب عن أهمية هذا الإنجاز..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900 resize-none"
              />
            </div>

            {/* REQUIRED CONDITION (الشرط المطلوب لفتحه بوضوح) */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-1.5">
              <label className="block text-amber-900 font-black text-xs flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-600" />
                <span>الشرط النصي الظاهر للطالب لفتح الإنجاز *</span>
              </label>
              <input
                type="text"
                required
                value={requiredCondition}
                onChange={(e) => setRequiredCondition(e.target.value)}
                placeholder="مثال: تسميع 3 أجزاء متتالية مع تقديم ملخص تدبري واحد في المكتبة"
                className="w-full p-3 bg-white border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900"
              />
            </div>

            {/* Journey Steps Reward & Target Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-slate-800">خطوات الرحلة الممنوحة للطالب 🚀</label>
                <select
                  value={journeyStepsReward}
                  onChange={(e) => setJourneyStepsReward(Number(e.target.value))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
                >
                  <option value={1}>+1 خطوة في "رحلتي"</option>
                  <option value={2}>+2 خطوات في "رحلتي"</option>
                  <option value={3}>+3 خطوات في "رحلتي"</option>
                  <option value={4}>+4 خطوات في "رحلتي"</option>
                  <option value={5}>+5 خطوات في "رحلتي"</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-slate-800">المستهدف بالإنجاز</label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value as any)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
                >
                  <option value="batch">الدفعة الحالية فقط ({currentBatchName})</option>
                  <option value="club">نادي محدد من أندية الدفعة</option>
                  <option value="all">جميع الطلاب (إنجاز عام)</option>
                </select>
              </div>
            </div>

            {targetType === 'club' && clubsList.length > 0 && (
              <div>
                <label className="block mb-1 text-slate-800">اختر النادي المستهدف</label>
                <select
                  value={selectedClub}
                  onChange={(e) => setSelectedClub(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
                >
                  {clubsList.map((clb) => (
                    <option key={clb} value={clb}>
                      {clb}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-600 text-white font-black hover:bg-amber-700 shadow-md shadow-amber-600/20 flex items-center gap-1.5"
              >
                <Trophy className="w-4 h-4" />
                <span>نشر ونقل الإنجاز للدفعة</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// ================= EDIT LIBRARY ITEM MODAL =================
interface EditLibraryModalProps {
  isOpen: boolean;
  item: BatchLibraryItem | null;
  onClose: () => void;
  onSubmit: (itemId: string, updates: Partial<BatchLibraryItem>) => void;
  onDelete?: (itemId: string) => void;
  currentBatchName?: string;
  batchesList?: Array<{ id: string; name: string }>;
  clubsList?: Array<{ id: string; name: string } | string>;
  studentsList?: Array<{ id: string; name: string; studentCode?: string; className?: string }>;
}

export const EditLibraryModal: React.FC<EditLibraryModalProps> = ({
  isOpen,
  item,
  onClose,
  onSubmit,
  onDelete,
  currentBatchName = 'الدفعة الحالية',
  batchesList = [],
  clubsList = [],
  studentsList = [],
}) => {
  const [title, setTitle] = useState(item?.title || '');
  const [description, setDescription] = useState(item?.description || '');
  const [fileType, setFileType] = useState<'pdf' | 'video' | 'audio' | 'image' | 'link' | 'doc'>(item?.fileType || item?.type || 'pdf');
  const [url, setUrl] = useState(item?.url || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(item?.thumbnailUrl || '');
  const [category, setCategory] = useState(item?.category || 'عام');
  const [targetType, setTargetType] = useState<'all' | 'batch' | 'club' | 'student'>((item?.targetType as any) || 'all');
  
  const getClubName = (c: { id: string; name: string } | string) => typeof c === 'string' ? c : c.name;
  const getClubId = (c: { id: string; name: string } | string) => typeof c === 'string' ? c : c.id;

  const [selectedBatchId, setSelectedBatchId] = useState(item?.batchId || batchesList[0]?.id || '');
  const [selectedBatchName, setSelectedBatchName] = useState(currentBatchName);
  const [selectedClubId, setSelectedClubId] = useState(item?.targetId || (clubsList[0] ? getClubId(clubsList[0]) : ''));
  const [selectedStudentId, setSelectedStudentId] = useState(item?.targetStudentId || item?.targetId || studentsList[0]?.id || '');
  const [fileSize, setFileSize] = useState(item?.fileSize || '3.5 MB');
  const [duration, setDuration] = useState(item?.duration || '10:00 دقيقة');

  React.useEffect(() => {
    if (isOpen && item) {
      setTitle(item.title || '');
      setDescription(item.description || '');
      setFileType(item.fileType || item.type || 'pdf');
      setUrl(item.url || '');
      setThumbnailUrl(item.thumbnailUrl || '');
      setCategory(item.category || 'عام');
      setTargetType((item.targetType as any) || 'all');
      setSelectedBatchId(item.batchId || batchesList[0]?.id || '');
      setSelectedBatchName(currentBatchName);
      if (item.targetType === 'club') {
        setSelectedClubId(item.targetId || (clubsList[0] ? getClubId(clubsList[0]) : ''));
      }
      if (item.targetType === 'student') {
        setSelectedStudentId(item.targetStudentId || item.targetId || studentsList[0]?.id || '');
      }
      setFileSize(item.fileSize || '3.5 MB');
      setDuration(item.duration || '10:00 دقيقة');
    }
  }, [isOpen, item?.id]);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let targetName = 'الجميع';
    let targetId: string | undefined = undefined;
    let targetStudentId: string | undefined = undefined;
    let targetStudentCode: string | undefined = undefined;

    if (targetType === 'batch') {
      const matchBatch = batchesList.find((b) => b.id === selectedBatchId || b.name === selectedBatchName);
      targetName = matchBatch ? matchBatch.name : (selectedBatchName || currentBatchName);
      targetId = matchBatch ? matchBatch.id : selectedBatchId;
    } else if (targetType === 'club') {
      const matchClub = clubsList.find((c) => getClubId(c) === selectedClubId || getClubName(c) === selectedClubId);
      targetName = matchClub ? getClubName(matchClub) : 'نادي محدد';
      targetId = matchClub ? getClubId(matchClub) : selectedClubId;
    } else if (targetType === 'student') {
      const st = studentsList.find((s) => s.id === selectedStudentId) || studentsList[0];
      if (st) {
        targetName = st.name;
        targetId = st.id;
        targetStudentId = st.id;
        targetStudentCode = st.studentCode;
      } else {
        targetName = 'طالب محدد';
      }
    }

    onSubmit(item.id, {
      title,
      description,
      fileType,
      type: fileType,
      url,
      thumbnailUrl,
      category,
      targetType,
      targetId,
      targetName,
      targetStudentId,
      targetStudentCode,
      fileSize: fileType === 'pdf' || fileType === 'image' || fileType === 'doc' ? fileSize : undefined,
      duration: fileType === 'video' || fileType === 'audio' ? duration : undefined,
    });

    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg bg-white rounded-[32px] p-6 shadow-2xl border border-slate-100 space-y-5 my-8 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 font-bold">
                <Edit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900">تعديل المورد التعليمي ✏️</h3>
                <p className="text-xs font-bold text-slate-500">تحديث تفاصيل المورد والملف والفئة المستهدفة للطلاب</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold text-slate-700">
            {/* Title */}
            <div>
              <label className="block mb-1 text-slate-800">عنوان المورد أو المستند *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="عنوان المورد..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block mb-1 text-slate-800">وصف ملخص للمورد</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف مختصر يظهر للطلاب..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
              />
            </div>

            {/* Resource Type & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-slate-800">نوع المورد 🎥📄🎧</label>
                <select
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value as any)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
                >
                  <option value="pdf">📄 مستند PDF</option>
                  <option value="video">🎥 فيديو تعليمي</option>
                  <option value="audio">🎧 تسجيل صوتي / تلاوة</option>
                  <option value="image">🖼️ صورة / إنفوجرافيك</option>
                  <option value="link">🔗 رابط موقع / منصة خارجية</option>
                  <option value="doc">📝 مستند وورد / نصي</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-slate-800">التصنيف الموضوعي</label>
                <input
                  type="text"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
                />
              </div>
            </div>

            {/* Target Audience Selector */}
            <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-2xl space-y-2">
              <label className="block text-teal-900 font-black text-xs">تحديد الفئة المستهدفة لرؤية هذا المورد:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetType('all')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    targetType === 'all'
                      ? 'bg-teal-600 text-white font-black shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-50 font-bold'
                  }`}
                >
                  🌐 الجميع
                </button>

                <button
                  type="button"
                  onClick={() => setTargetType('batch')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    targetType === 'batch'
                      ? 'bg-teal-600 text-white font-black shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-50 font-bold'
                  }`}
                >
                  📚 دفعة محددة
                </button>

                <button
                  type="button"
                  onClick={() => setTargetType('club')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    targetType === 'club'
                      ? 'bg-teal-600 text-white font-black shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-50 font-bold'
                  }`}
                >
                  🎙️ نادي محدد
                </button>

                <button
                  type="button"
                  onClick={() => setTargetType('student')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    targetType === 'student'
                      ? 'bg-teal-600 text-white font-black shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-50 font-bold'
                  }`}
                >
                  👤 طالب محدد
                </button>
              </div>

              {targetType === 'batch' && (
                <div className="mt-2">
                  <label className="block text-slate-700 mb-1">اختر الدفعة المستهدفة:</label>
                  {batchesList.length > 0 ? (
                    <select
                      value={selectedBatchId}
                      onChange={(e) => {
                        setSelectedBatchId(e.target.value);
                        const b = batchesList.find((x) => x.id === e.target.value);
                        if (b) setSelectedBatchName(b.name);
                      }}
                      className="w-full p-2.5 bg-white border border-teal-300 rounded-xl font-bold text-slate-900 focus:outline-none"
                    >
                      {batchesList.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-[11px] text-teal-800 font-bold bg-white p-2 rounded-xl border border-teal-200">
                      الدفعة المستهدفة: <span className="font-black text-slate-900">{currentBatchName}</span>
                    </div>
                  )}
                </div>
              )}

              {targetType === 'club' && (
                <div className="mt-2">
                  <label className="block text-slate-700 mb-1">اختر النادي المستهدف:</label>
                  {clubsList.length > 0 ? (
                    <select
                      value={selectedClubId}
                      onChange={(e) => setSelectedClubId(e.target.value)}
                      className="w-full p-2.5 bg-white border border-teal-300 rounded-xl font-bold text-slate-900 focus:outline-none"
                    >
                      {clubsList.map((c) => {
                        const cid = getClubId(c);
                        const cname = getClubName(c);
                        return (
                          <option key={cid} value={cid}>
                            {cname}
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <div className="text-[11px] text-amber-800 font-bold bg-white p-2 rounded-xl border border-amber-200">
                      لا توجد أندية مخصصة بالدفعة حالياً، سيتم استهداف الأندية العامة.
                    </div>
                  )}
                </div>
              )}

              {targetType === 'student' && (
                <div className="mt-2">
                  <label className="block text-slate-700 mb-1">اختر الطالب المستهدف:</label>
                  {studentsList.length > 0 ? (
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full p-2.5 bg-white border border-teal-300 rounded-xl font-bold text-slate-900 focus:outline-none"
                    >
                      {studentsList.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name} {st.studentCode ? `(${st.studentCode})` : ''} {st.className ? `- ${st.className}` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-[11px] text-amber-800 font-bold bg-white p-2 rounded-xl border border-amber-200">
                      لا يوجد طلاب مسجلين بالدفعة الحالية.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* URL or File Link */}
            <div>
              <label className="block mb-1 text-slate-800">رابط الملف أو الفيديو أو الموقع المباشر 🔗</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900 text-left dir-ltr"
              />
            </div>

            {/* Cover / Thumbnail URL */}
            <div>
              <label className="block mb-1 text-slate-800">رابط صورة الغلاف / المصغرة (Thumbnail)</label>
              <input
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900 text-left dir-ltr"
              />
            </div>

            {/* Size / Duration */}
            {(fileType === 'pdf' || fileType === 'image' || fileType === 'doc') && (
              <div>
                <label className="block mb-1 text-slate-800">حجم الملف</label>
                <input
                  type="text"
                  value={fileSize}
                  onChange={(e) => setFileSize(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-bold text-slate-900"
                />
              </div>
            )}

            {(fileType === 'video' || fileType === 'audio') && (
              <div>
                <label className="block mb-1 text-slate-800">مدة التسجيل / الفيديو</label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-bold text-slate-900"
                />
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 flex items-center justify-between border-t border-slate-100">
              {onDelete ? (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(item.id);
                    onClose();
                  }}
                  className="px-3 py-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف المورد</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-teal-600 text-white font-black hover:bg-teal-700 shadow-md shadow-teal-600/20"
                >
                  حفظ التعديلات 💾
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// ================= CONFIRM DELETE LIBRARY MODAL =================
interface ConfirmDeleteLibraryModalProps {
  isOpen: boolean;
  item: BatchLibraryItem | null;
  onClose: () => void;
  onConfirm: (itemId: string) => void;
}

export const ConfirmDeleteLibraryModal: React.FC<ConfirmDeleteLibraryModalProps> = ({
  isOpen,
  item,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !item) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          className="w-full max-w-md bg-white rounded-[28px] p-6 shadow-2xl border border-slate-100 space-y-5 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 shadow-sm">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h3 className="font-black text-lg text-slate-900">هل أنت متأكد من حذف هذا المورد؟</h3>
            <p className="text-xs font-bold text-slate-600 leading-relaxed">
              المورد: <span className="font-black text-rose-600">"{item.title}"</span>
            </p>
            <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-[11px] font-bold text-rose-800 text-right space-y-1">
              <p>• سيتم حذف هذا المورد نهائياً من نظام المكتبة.</p>
              <p>• سيختفي مباشرة من صفحة المراجع لدى جميع الطلاب المستهدفين.</p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm(item.id);
                onClose();
              }}
              className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>حذف</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
