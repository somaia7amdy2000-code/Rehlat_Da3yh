import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  BookOpen,
  FileText,
  Video,
  Music,
  Image as ImageIcon,
  Link as LinkIcon,
  Play,
  Pause,
  ExternalLink,
  Globe,
  Users,
  Award,
  User,
  Sparkles,
  X,
  Volume2,
  VolumeX,
  Eye,
  Download,
  Share2,
  Compass,
} from 'lucide-react';
import { BatchLibraryItem, LibraryResourceType } from '../types/teacher';
import { teacherService } from '../services/teacherService';

interface StudentLibraryViewProps {
  studentBatchId?: string;
  studentBatchName?: string;
  studentClubName?: string;
  studentId?: string;
  studentCode?: string;
  studentName?: string;
  showToast?: (msg: string) => void;
}

export const StudentLibraryView: React.FC<StudentLibraryViewProps> = ({
  studentBatchId,
  studentBatchName,
  studentClubName,
  studentId,
  studentCode,
  studentName,
  showToast,
}) => {
  const [items, setItems] = useState<BatchLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | LibraryResourceType>('all');
  const [activeMediaModal, setActiveMediaModal] = useState<BatchLibraryItem | null>(null);

  // Audio player state inside modal
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(25);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadLibraryData();
  }, [studentBatchId, studentBatchName, studentClubName, studentId, studentCode, studentName]);

  const loadLibraryData = async () => {
    setLoading(true);
    try {
      const data = await teacherService.getLibraryForStudent({
        batchId: studentBatchId,
        batchName: studentBatchName,
        clubName: studentClubName,
        studentId,
        studentCode,
        studentName,
      });
      setItems(data);
    } catch (err) {
      console.error('Failed to load library items:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter items by tab & search query
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedTab === 'all') return true;
    return item.fileType === selectedTab;
  });

  // Calculate counts for tab badges
  const counts = {
    all: items.length,
    pdf: items.filter((i) => i.fileType === 'pdf').length,
    video: items.filter((i) => i.fileType === 'video').length,
    audio: items.filter((i) => i.fileType === 'audio').length,
    image: items.filter((i) => i.fileType === 'image').length,
    link: items.filter((i) => i.fileType === 'link').length,
  };

  const getTargetBadge = (item: BatchLibraryItem) => {
    if (item.targetType === 'all') {
      return (
        <span className="text-[11px] font-black bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200/80 flex items-center gap-1 shadow-xs">
          <Globe className="w-3.5 h-3.5 text-emerald-600" />
          <span>الجميع</span>
        </span>
      );
    }
    if (item.targetType === 'club') {
      return (
        <span className="text-[11px] font-black bg-purple-50 text-purple-800 px-2.5 py-1 rounded-lg border border-purple-200/80 flex items-center gap-1 shadow-xs">
          <Award className="w-3.5 h-3.5 text-purple-600" />
          <span>{item.targetName || 'نادي محدد'}</span>
        </span>
      );
    }
    if (item.targetType === 'student') {
      return (
        <span className="text-[11px] font-black bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg border border-amber-200/80 flex items-center gap-1 shadow-xs">
          <User className="w-3.5 h-3.5 text-amber-600" />
          <span>خاص: {item.targetName || 'طالب محدد'}</span>
        </span>
      );
    }
    return (
      <span className="text-[11px] font-black bg-teal-50 text-teal-800 px-2.5 py-1 rounded-lg border border-teal-200/80 flex items-center gap-1 shadow-xs">
        <Users className="w-3.5 h-3.5 text-teal-600" />
        <span>الدفعة: {item.targetName || 'دفعة محددة'}</span>
      </span>
    );
  };

  const getMediaTypeBadge = (fileType: LibraryResourceType) => {
    switch (fileType) {
      case 'pdf':
        return (
          <span className="bg-rose-500/90 text-white text-[11px] font-black px-2.5 py-1 rounded-lg backdrop-blur-md flex items-center gap-1 shadow-md">
            <FileText className="w-3.5 h-3.5" />
            <span>مستند PDF</span>
          </span>
        );
      case 'video':
        return (
          <span className="bg-purple-600/90 text-white text-[11px] font-black px-2.5 py-1 rounded-lg backdrop-blur-md flex items-center gap-1 shadow-md">
            <Video className="w-3.5 h-3.5" />
            <span>فيديو تعليمي</span>
          </span>
        );
      case 'audio':
        return (
          <span className="bg-amber-500/90 text-white text-[11px] font-black px-2.5 py-1 rounded-lg backdrop-blur-md flex items-center gap-1 shadow-md">
            <Music className="w-3.5 h-3.5" />
            <span>تسجيل صوتي</span>
          </span>
        );
      case 'image':
        return (
          <span className="bg-emerald-600/90 text-white text-[11px] font-black px-2.5 py-1 rounded-lg backdrop-blur-md flex items-center gap-1 shadow-md">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>صورة / إنفوجرافيك</span>
          </span>
        );
      case 'link':
        return (
          <span className="bg-sky-600/90 text-white text-[11px] font-black px-2.5 py-1 rounded-lg backdrop-blur-md flex items-center gap-1 shadow-md">
            <LinkIcon className="w-3.5 h-3.5" />
            <span>رابط خارجي</span>
          </span>
        );
      default:
        return null;
    }
  };

  const defaultThumbnail = (type: LibraryResourceType) => {
    switch (type) {
      case 'pdf':
        return 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800';
      case 'video':
        return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800';
      case 'audio':
        return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800';
      case 'image':
        return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800';
      case 'link':
        return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800';
      default:
        return 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=800';
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 dir-rtl w-full max-w-full min-w-0 overflow-hidden sm:overflow-visible">
      {/* ================= NETFLIX-STYLE HERO BANNER ================= */}
      <div className="relative rounded-[24px] sm:rounded-[36px] overflow-hidden bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-5 sm:p-8 md:p-12 text-white shadow-2xl border border-teal-500/20 w-full max-w-full">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center opacity-15 mix-blend-overlay" />
        <div className="relative z-10 max-w-2xl w-full space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 font-black text-[11px] sm:text-xs backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-300 animate-pulse shrink-0" />
            <span>مكتبة الرحلة التعليمية والقرآنية 📚</span>
          </div>

          <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-white leading-tight drop-shadow-md">
            استكشف المراجع والدروس والوسائط المخصصة لرحلتك
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm font-bold leading-relaxed">
            جميع المواد والكتب والتسجيلات الصوتية في هذه المكتبة مرفوعة مباشرة من معلمك لمساعدتك في مواصلة التقدم والإبداع في رحلتك!
          </p>

          <div className="flex items-center gap-2 sm:gap-4 text-xs font-bold text-teal-200/80 pt-1 flex-wrap">
            <span className="flex items-center gap-1">
              <Compass className="w-4 h-4 text-teal-400 shrink-0" />
              <span>محتوى موثق ومعتمد</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{items.length} موارد متوفرة الآن</span>
            </span>
          </div>
        </div>
      </div>

      {/* ================= SEARCH & CATEGORY FILTER TABS ================= */}
      <div className="space-y-4 w-full max-w-full min-w-0">
        {/* Search Input Bar */}
        <div className="relative w-full max-w-xl">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن كتاب، فيديو، تلاوة، أو موضوع خاص برحلتك..."
            className="w-full pl-4 pr-11 py-3 bg-white border border-[#EEF2F7] rounded-2xl shadow-xs focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-800 text-xs sm:text-sm placeholder:text-slate-400"
          />
          <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3.5 top-3.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Netflix Category Pills Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none w-full max-w-full min-w-0">
          <button
            onClick={() => setSelectedTab('all')}
            className={`px-3.5 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              selectedTab === 'all'
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-105'
                : 'bg-white text-slate-600 border border-[#EEF2F7] hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>📚 الكل</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                selectedTab === 'all' ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => setSelectedTab('pdf')}
            className={`px-3.5 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              selectedTab === 'pdf'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20 scale-105'
                : 'bg-white text-slate-600 border border-[#EEF2F7] hover:bg-rose-50 hover:text-rose-600'
            }`}
          >
            <FileText className="w-4 h-4 text-rose-500" />
            <span>📄 مستندات PDF</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                selectedTab === 'pdf' ? 'bg-white text-rose-600' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {counts.pdf}
            </span>
          </button>

          <button
            onClick={() => setSelectedTab('video')}
            className={`px-3.5 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              selectedTab === 'video'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20 scale-105'
                : 'bg-white text-slate-600 border border-[#EEF2F7] hover:bg-purple-50 hover:text-purple-600'
            }`}
          >
            <Video className="w-4 h-4 text-purple-500" />
            <span>🎥 فيديوهات تعليمية</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                selectedTab === 'video' ? 'bg-white text-purple-600' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {counts.video}
            </span>
          </button>

          <button
            onClick={() => setSelectedTab('audio')}
            className={`px-3.5 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              selectedTab === 'audio'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20 scale-105'
                : 'bg-white text-slate-600 border border-[#EEF2F7] hover:bg-amber-50 hover:text-amber-600'
            }`}
          >
            <Music className="w-4 h-4 text-amber-500" />
            <span>🎧 تسجيلات صوتية</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                selectedTab === 'audio' ? 'bg-white text-amber-600' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {counts.audio}
            </span>
          </button>

          <button
            onClick={() => setSelectedTab('image')}
            className={`px-3.5 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              selectedTab === 'image'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 scale-105'
                : 'bg-white text-slate-600 border border-[#EEF2F7] hover:bg-emerald-50 hover:text-emerald-600'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-emerald-500" />
            <span>🖼️ صور وإنفوجرافيك</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                selectedTab === 'image' ? 'bg-white text-emerald-600' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {counts.image}
            </span>
          </button>

          <button
            onClick={() => setSelectedTab('link')}
            className={`px-3.5 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              selectedTab === 'link'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20 scale-105'
                : 'bg-white text-slate-600 border border-[#EEF2F7] hover:bg-sky-50 hover:text-sky-600'
            }`}
          >
            <LinkIcon className="w-4 h-4 text-sky-500" />
            <span>🔗 روابط خارجية</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                selectedTab === 'link' ? 'bg-white text-sky-600' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {counts.link}
            </span>
          </button>
        </div>
      </div>

      {/* ================= NETFLIX CARDS GRID ================= */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-bold space-y-3 w-full">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p>جاري تحميل مراجع المكتبة المباركة...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-[24px] sm:rounded-[32px] p-8 sm:p-12 text-center border border-dashed border-slate-200 space-y-3 w-full max-w-full">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-black text-base text-slate-700">لم يضف المعلم أي موارد للمكتبة حتى الآن.</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full max-w-full min-w-0">
          {filteredItems.map((item) => {
            const thumbnail = item.thumbnailUrl || defaultThumbnail(item.fileType);

            return (
              <motion.div
                key={item.id}
                whileHover={{ y: -6, scale: 1.01 }}
                transition={{ duration: 0.25 }}
                onClick={() => setActiveMediaModal(item)}
                className="group relative bg-white rounded-[24px] sm:rounded-[32px] overflow-hidden border border-[#EEF2F7] shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between w-full max-w-full min-w-0"
              >
                {/* Poster Thumbnail with Overlay */}
                <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-900 shrink-0">
                  <img
                    src={thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 inset-x-2.5 sm:top-3 sm:inset-x-3 flex items-center justify-between gap-1.5 z-10 flex-wrap">
                    {getMediaTypeBadge(item.fileType)}
                    {getTargetBadge(item)}
                  </div>

                  {/* Big Hover Play/View Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center z-10 opacity-80 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/90 text-slate-900 shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      {item.fileType === 'video' || item.fileType === 'audio' ? (
                        <Play className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600 fill-teal-600 mr-0.5" />
                      ) : (
                        <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" />
                      )}
                    </div>
                  </div>

                  {/* Bottom Duration or Size Overlay */}
                  <div className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 text-[10px] sm:text-[11px] font-black text-slate-200 bg-slate-900/80 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg backdrop-blur-md z-10 border border-white/10">
                    {item.duration || item.fileSize || 'مورد رقمي'}
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-4 sm:p-5 space-y-2 flex-1 flex flex-col justify-between min-w-0">
                  <div className="space-y-1.5 min-w-0">
                    <span className="inline-block text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                      {item.category || 'عام'}
                    </span>
                    <h3 className="font-black text-sm sm:text-base text-slate-900 line-clamp-1 group-hover:text-teal-600 transition-colors break-words">
                      {item.title}
                    </h3>
                    <p className="text-xs font-bold text-slate-500 line-clamp-2 leading-relaxed break-words">
                      {item.description || 'اضغط لمشاهدة ومعاينة هذا المورد التعليمي المرفق لمسيرتك القرآنية.'}
                    </p>
                  </div>

                  {/* Footer Source Info */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-400 gap-2 flex-wrap">
                    <span className="truncate max-w-[140px] sm:max-w-[160px]">مرفوع بواسطة: {item.uploadedBy || 'المعلم'}</span>
                    <span className="text-teal-600 group-hover:underline flex items-center gap-1 shrink-0">
                      <span>فتح</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ================= RICH INTERACTIVE MEDIA MODALS ================= */}
      <AnimatePresence>
        {activeMediaModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 dir-rtl overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-3xl bg-white rounded-[28px] sm:rounded-[36px] overflow-hidden shadow-2xl border border-slate-100 space-y-0 relative max-h-[90vh] flex flex-col my-auto"
            >
              {/* Modal Header Bar */}
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30">
                    {activeMediaModal.fileType === 'pdf' && <FileText className="w-5 h-5" />}
                    {activeMediaModal.fileType === 'video' && <Video className="w-5 h-5" />}
                    {activeMediaModal.fileType === 'audio' && <Music className="w-5 h-5" />}
                    {activeMediaModal.fileType === 'image' && <ImageIcon className="w-5 h-5" />}
                    {activeMediaModal.fileType === 'link' && <LinkIcon className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-black text-base text-white">{activeMediaModal.title}</h3>
                    <p className="text-xs text-slate-400 font-bold">{activeMediaModal.category || 'مكتبة الطالب'}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveMediaModal(null);
                    setIsPlayingAudio(false);
                  }}
                  className="p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content Stage (Customized per media type) */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* 📄 PDF VIEWER MODAL */}
                {activeMediaModal.fileType === 'pdf' && (
                  <div className="space-y-4">
                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4 text-center">
                      <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
                        <FileText className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-black text-lg text-slate-900">{activeMediaModal.title}</h4>
                        <p className="text-xs font-bold text-slate-500 max-w-md mx-auto leading-relaxed">
                          {activeMediaModal.description || 'مستند وثائقي تعليمي متكامل للتنزيل والقراءة اليومية.'}
                        </p>
                      </div>

                      {/* PDF Pages Preview Box */}
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-lg mx-auto text-right space-y-3">
                        <div className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 flex justify-between">
                          <span>معاينة محتوى المستند:</span>
                          <span className="text-rose-600 font-mono">PDF • {activeMediaModal.fileSize || '3.5 MB'}</span>
                        </div>
                        <p className="text-xs text-slate-600 font-bold leading-relaxed line-clamp-4">
                          يتناول هذا الملف أبرز وقفات التفكّر والتلاوة الخاشعة لورد الأسبوع، مع ربط الآيات الكريمة بالواجبات السلوكية والتحديات في مسيرتك القرآنية.
                        </p>
                      </div>

                      <div className="flex items-center justify-center gap-3 pt-2">
                        <a
                          href={activeMediaModal.url || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'}
                          target="_blank"
                          rel="noreferrer"
                          className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-lg shadow-rose-600/20 flex items-center gap-2 transition-all cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                          <span>قراءة المستند كاملاً 📖</span>
                        </a>

                        <a
                          href={activeMediaModal.url || '#'}
                          download
                          className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <span>تحميل الملف</span>
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* 🎥 VIDEO PLAYER MODAL */}
                {activeMediaModal.fileType === 'video' && (
                  <div className="space-y-4">
                    <div className="relative rounded-3xl overflow-hidden bg-black aspect-video shadow-2xl flex items-center justify-center">
                      <video
                        controls
                        autoPlay
                        className="w-full h-full object-contain"
                        poster={activeMediaModal.thumbnailUrl || defaultThumbnail('video')}
                        src={
                          activeMediaModal.url ||
                          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
                        }
                      />
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                      <h4 className="font-black text-slate-900 text-base">{activeMediaModal.title}</h4>
                      <p className="text-xs font-bold text-slate-600 leading-relaxed">
                        {activeMediaModal.description || 'درس مرئي يوضح أصول القراءة والتطبيقات العملية مباشرة من المعلم.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* 🎧 AUDIO PLAYER MODAL */}
                {activeMediaModal.fileType === 'audio' && (
                  <div className="space-y-6">
                    <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-amber-950 to-slate-900 text-white shadow-2xl space-y-6 border border-amber-500/20 text-center">
                      <div className="w-24 h-24 rounded-full bg-amber-500/20 border-2 border-amber-400/40 text-amber-300 flex items-center justify-center mx-auto shadow-xl relative">
                        <Music className="w-10 h-10" />
                        {isPlayingAudio && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full animate-ping" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-black text-xl text-white">{activeMediaModal.title}</h4>
                        <p className="text-xs font-bold text-amber-200/80">
                          {activeMediaModal.description || 'تلاوة نموذجية صوتية خاشعة دقيقة الضبط والمقامات.'}
                        </p>
                      </div>

                      {/* Animated Audio Waveform Visualization */}
                      <div className="flex items-center justify-center gap-1 h-12 py-2">
                        {[40, 75, 30, 90, 60, 100, 45, 80, 50, 95, 35, 70, 85, 40, 60].map((h, idx) => (
                          <motion.div
                            key={idx}
                            animate={{ height: isPlayingAudio ? [`${h}%`, '20%', `${h}%`] : `${h * 0.4}%` }}
                            transition={{ repeat: Infinity, duration: 0.8 + (idx % 5) * 0.2 }}
                            className="w-1.5 bg-gradient-to-t from-amber-500 to-amber-300 rounded-full"
                          />
                        ))}
                      </div>

                      {/* Audio Timeline Scrub Bar */}
                      <div className="space-y-2 max-w-md mx-auto">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={audioProgress}
                          onChange={(e) => setAudioProgress(Number(e.target.value))}
                          className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                        />
                        <div className="flex justify-between text-[11px] font-mono text-amber-200/70 font-bold">
                          <span>02:15</span>
                          <span>{activeMediaModal.duration || '08:45'}</span>
                        </div>
                      </div>

                      {/* Audio Player Controls */}
                      <div className="flex items-center justify-center gap-6 pt-2">
                        <button
                          onClick={() => setIsMuted(!isMuted)}
                          className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                        >
                          {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
                        </button>

                        <button
                          onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                          className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black flex items-center justify-center shadow-xl shadow-amber-500/30 hover:scale-105 transition-all cursor-pointer"
                        >
                          {isPlayingAudio ? (
                            <Pause className="w-7 h-7 fill-slate-950" />
                          ) : (
                            <Play className="w-7 h-7 fill-slate-950 mr-0.5" />
                          )}
                        </button>

                        <a
                          href={activeMediaModal.url || '#'}
                          download
                          className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* 🖼️ IMAGE LIGHTBOX MODAL */}
                {activeMediaModal.fileType === 'image' && (
                  <div className="space-y-4">
                    <div className="rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 shadow-xl max-h-[500px] flex items-center justify-center">
                      <img
                        src={activeMediaModal.url || activeMediaModal.thumbnailUrl || defaultThumbnail('image')}
                        alt={activeMediaModal.title}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                      <h4 className="font-black text-slate-900 text-base">{activeMediaModal.title}</h4>
                      <p className="text-xs font-bold text-slate-600 leading-relaxed">
                        {activeMediaModal.description || 'بطاقة تصميم وإنفوجرافيك مخصص للتعلم البصري والتذكير.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* 🔗 LINK PREVIEW MODAL */}
                {activeMediaModal.fileType === 'link' && (
                  <div className="p-8 bg-slate-50 border border-slate-200 rounded-3xl space-y-5 text-center">
                    <div className="w-16 h-16 rounded-3xl bg-sky-100 text-sky-600 flex items-center justify-center mx-auto shadow-inner">
                      <LinkIcon className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-black text-xl text-slate-900">{activeMediaModal.title}</h4>
                      <p className="text-xs font-bold text-slate-500 max-w-md mx-auto leading-relaxed">
                        {activeMediaModal.description || 'رابط منصة خارجية مخصصة للتطبيقات والمسابقات التفاعلية.'}
                      </p>
                    </div>

                    <a
                      href={activeMediaModal.url || 'https://quran.com'}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-black text-sm shadow-xl shadow-sky-600/20 transition-all cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>الانتقال إلى الرابط والموقع الخارجي 🔗</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Modal Footer Bar */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
                <span>المستهدف: {activeMediaModal.targetName || 'جميع الطلاب'}</span>
                <button
                  onClick={() => {
                    setActiveMediaModal(null);
                    setIsPlayingAudio(false);
                  }}
                  className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-black cursor-pointer"
                >
                  إغلاق المعاينة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
