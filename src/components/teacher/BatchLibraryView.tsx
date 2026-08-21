import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Link as LinkIcon,
  Upload,
  ExternalLink,
  Globe,
  Users,
  Award,
  User,
  Edit2,
  Trash2,
  Eye,
  X,
  Play,
  Download,
  Loader2,
} from 'lucide-react';
import { BatchLibraryItem, Batch } from '../../types/teacher';
import { teacherService } from '../../services/teacherService';

interface BatchLibraryViewProps {
  batch: Batch;
  items: BatchLibraryItem[];
  onOpenUploadLibrary: () => void;
  onOpenEditLibrary?: (item: BatchLibraryItem) => void;
  onOpenDeleteLibrary?: (item: BatchLibraryItem) => void;
}

export const BatchLibraryView: React.FC<BatchLibraryViewProps> = ({
  batch,
  items,
  onOpenUploadLibrary,
  onOpenEditLibrary,
  onOpenDeleteLibrary,
}) => {
  const [previewItem, setPreviewItem] = useState<BatchLibraryItem | null>(null);
  const [resolvedPreviewUrl, setResolvedPreviewUrl] = useState<string>('');
  const [isLoadingUrl, setIsLoadingUrl] = useState<boolean>(false);

  useEffect(() => {
    let isCancelled = false;
    if (previewItem && previewItem.url) {
      setIsLoadingUrl(true);
      teacherService.resolveMediaSignedUrl(previewItem.url).then((url) => {
        if (!isCancelled) {
          setResolvedPreviewUrl(url || previewItem.url);
          setIsLoadingUrl(false);
        }
      }).catch(() => {
        if (!isCancelled) {
          setResolvedPreviewUrl(previewItem.url);
          setIsLoadingUrl(false);
        }
      });
    } else {
      setResolvedPreviewUrl('');
      setIsLoadingUrl(false);
    }
    return () => {
      isCancelled = true;
    };
  }, [previewItem]);

  const renderFileIcon = (fileType: BatchLibraryItem['fileType']) => {
    switch (fileType) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-rose-600" />;
      case 'video':
        return <Video className="w-5 h-5 text-purple-600" />;
      case 'audio':
        return <Music className="w-5 h-5 text-amber-600" />;
      case 'image':
        return <ImageIcon className="w-5 h-5 text-emerald-600" />;
      case 'link':
        return <LinkIcon className="w-5 h-5 text-sky-600" />;
      default:
        return <BookOpen className="w-5 h-5 text-teal-600" />;
    }
  };

  const getTargetBadge = (item: BatchLibraryItem) => {
    if (item.targetType === 'all') {
      return (
        <span className="text-[10px] font-black bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
          <Globe className="w-3 h-3 text-emerald-600" />
          <span>الجميع</span>
        </span>
      );
    }
    if (item.targetType === 'club') {
      return (
        <span className="text-[10px] font-black bg-purple-50 text-purple-800 px-2 py-0.5 rounded-md border border-purple-200 flex items-center gap-1">
          <Award className="w-3 h-3 text-purple-600" />
          <span>{item.targetName || 'نادي محدد'}</span>
        </span>
      );
    }
    if (item.targetType === 'student') {
      return (
        <span className="text-[10px] font-black bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
          <User className="w-3 h-3 text-amber-600" />
          <span>طالب: {item.targetName || 'محدد'}</span>
        </span>
      );
    }
    return (
      <span className="text-[10px] font-black bg-teal-50 text-teal-800 px-2 py-0.5 rounded-md border border-teal-200 flex items-center gap-1">
        <Users className="w-3 h-3 text-teal-600" />
        <span>الدفعة: {item.targetName || batch.name}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 dir-rtl">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-[28px] border border-[#EEF2F7] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">نظام إدارة المكتبة والمراجع 📚</h2>
            <p className="text-xs font-bold text-slate-500">إضافة، تعديل، معاينة، وحذف المراجع التعليمية للدفعة وربطها المباشر بالطالب</p>
          </div>
        </div>

        <button
          onClick={onOpenUploadLibrary}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-xl shadow-md shadow-teal-600/20 flex items-center gap-2 cursor-pointer transition-all"
        >
          <Upload className="w-4 h-4" />
          <span>+ إضافة مورد جديد للمكتبة</span>
        </button>
      </div>

      {/* Library Grid */}
      {items.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-[28px] border border-[#EEF2F7] space-y-3">
          <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto text-slate-400">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="font-black text-slate-800 text-base">المكتبة فارغة حالياً</h3>
          <p className="text-xs font-bold text-slate-500 max-w-sm mx-auto">
            قم بإضافة أول مورد تعليمي (PDF، فيديو، صوت، صورة أو رابط) وستظهر مباشرة لدى جميع الطلاب المستهدفين.
          </p>
          <button
            onClick={onOpenUploadLibrary}
            className="mt-2 px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-teal-700 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>إضافة مورد الآن</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ y: -3 }}
              className="p-5 rounded-[28px] bg-white border border-[#EEF2F7] shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header & Badges */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {getTargetBadge(item)}
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                      {item.category || 'عام'}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    {renderFileIcon(item.fileType)}
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="font-black text-base text-slate-900 line-clamp-1">{item.title}</h3>
                  {item.description && (
                    <p className="text-xs font-bold text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Meta details */}
                <div className="text-[11px] font-bold text-slate-400">
                  <span>
                    {item.fileSize || item.duration || 'مورد تعليمي'} • تاريـخ الرفع: {item.uploadedAt}
                  </span>
                </div>
              </div>

              {/* ACTION BUTTONS (معاينة - تعديل - حذف) */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setPreviewItem(item)}
                  className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-teal-600" />
                  <span>معاينة 👁️</span>
                </button>

                <div className="flex items-center gap-1">
                  {onOpenEditLibrary && (
                    <button
                      onClick={() => onOpenEditLibrary(item)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                      title="تعديل المورد"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>
                  )}

                  {onOpenDeleteLibrary && (
                    <button
                      onClick={() => onOpenDeleteLibrary(item)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                      title="حذف المورد"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* PREVIEW MODAL */}
      <AnimatePresence>
        {previewItem && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 dir-rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white rounded-[32px] p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 font-bold">
                    {renderFileIcon(previewItem.fileType)}
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-slate-900">{previewItem.title}</h3>
                    <p className="text-xs font-bold text-slate-500">معاينة تفاعلية للمورد التعليمي</p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewItem(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Media Content Preview */}
              <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 p-2 min-h-[220px] flex items-center justify-center relative">
                {isLoadingUrl ? (
                  <div className="flex flex-col items-center justify-center p-8 space-y-3 text-teal-400">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="text-xs font-bold text-slate-400">جاري تجهيز الرابط الآمن للمعاينة...</p>
                  </div>
                ) : previewItem.fileType === 'video' ? (
                  <iframe
                    src={
                      resolvedPreviewUrl && resolvedPreviewUrl.includes('youtube')
                        ? resolvedPreviewUrl.replace('watch?v=', 'embed/')
                        : resolvedPreviewUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ'
                    }
                    title={previewItem.title}
                    className="w-full h-64 rounded-xl border-0"
                    allowFullScreen
                  />
                ) : previewItem.fileType === 'audio' ? (
                  <div className="w-full p-6 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
                      <Music className="w-8 h-8" />
                    </div>
                    {resolvedPreviewUrl ? (
                      <audio controls className="w-full mt-2" src={resolvedPreviewUrl}>
                        متصفحك لا يدعم مشغل الصوتيات
                      </audio>
                    ) : (
                      <p className="text-xs text-slate-400 font-bold">لا يوجد ملف صوتي للعرض</p>
                    )}
                  </div>
                ) : previewItem.fileType === 'image' ? (
                  <img
                    src={resolvedPreviewUrl || previewItem.thumbnailUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800'}
                    alt={previewItem.title}
                    className="max-h-80 object-contain rounded-xl mx-auto"
                  />
                ) : (
                  <div className="w-full p-8 text-center space-y-4 text-white">
                    <div className="w-16 h-16 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center mx-auto border border-teal-500/30">
                      <FileText className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-bold text-slate-300 max-w-md mx-auto">
                      {previewItem.description || 'مستند تعليمي إلكتروني متاح للتحميل والقراءة المباشرة.'}
                    </p>
                    <a
                      href={resolvedPreviewUrl || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs shadow-lg transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>فتح الملف المباشر / تحميل</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Description & Target */}
              <div className="space-y-2 pt-2 text-xs font-bold text-slate-700">
                <div className="flex items-center justify-between text-slate-500">
                  <span>الفئة المستهدفة: {getTargetBadge(previewItem)}</span>
                  <span>التصنيف: {previewItem.category || 'عام'}</span>
                </div>
                {previewItem.description && (
                  <p className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-800 leading-relaxed font-bold">
                    {previewItem.description}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setPreviewItem(null)}
                  className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

