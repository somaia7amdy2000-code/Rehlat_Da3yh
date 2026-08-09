import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Station } from '../types';
import { 
  X, CheckCircle2, Lock, Flame, Award, Gift, 
  Target, ChevronLeft, Sparkles, BookOpen, Sprout, Trophy, Compass,
  Shield, Zap, Eye, Watch, Gamepad2, Camera, Crown, Heart, Briefcase, Cpu, Tablet
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface StationDetailModalProps {
  station: Station | null;
  onClose: () => void;
  currentStudentPoints: number;
}

export default function StationDetailModal({ station, onClose, currentStudentPoints }: StationDetailModalProps) {
  if (!station) return null;

  const isCompleted = station.status === 'completed';
  const isCurrent = station.status === 'current';
  const isLocked = station.status === 'locked';

  // Trigger celebratory confetti if completing or clicking current station
  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  // Icon mapping helper
  const renderRewardIcon = (iconName: string) => {
    const props = { className: "w-6 h-6 text-emerald-400" };
    switch (iconName) {
      case 'Sprout': return <Sprout {...props} />;
      case 'BookOpen': return <BookOpen {...props} />;
      case 'Gift': return <Gift {...props} />;
      case 'Compass': return <Compass {...props} />;
      case 'Trophy': return <Trophy {...props} />;
      case 'Award': return <Award {...props} />;
      case 'Watch': return <Watch {...props} />;
      case 'Gamepad2': return <Gamepad2 {...props} />;
      case 'Camera': return <Camera {...props} />;
      case 'Crown': return <Crown {...props} />;
      case 'Zap': return <Zap {...props} />;
      case 'Eye': return <Eye {...props} />;
      case 'Tablet': return <Tablet {...props} />;
      case 'Cpu': return <Cpu {...props} />;
      case 'ShieldCheck': return <Shield {...props} />;
      case 'Heart': return <Heart {...props} />;
      case 'Briefcase': return <Briefcase {...props} />;
      default: return <Award {...props} />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md dir-rtl overflow-y-auto">
        {/* Modal Backdrop Click */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-slate-900 border border-emerald-500/30 rounded-3xl shadow-2xl shadow-emerald-950/60 overflow-hidden text-white z-10 my-8"
        >
          {/* Header Banner */}
          <div className={`p-6 sm:p-8 relative ${
            isCompleted 
              ? 'bg-gradient-to-r from-emerald-900/90 via-teal-900/90 to-emerald-950/90' 
              : isCurrent 
              ? 'bg-gradient-to-r from-teal-900/90 via-sky-900/90 to-slate-900/90'
              : 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 opacity-90'
          }`}>
            {/* Top Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-2 rounded-full bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-all border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Station Status Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-3 border backdrop-blur-md">
              {isCompleted && (
                <span className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  محطة مكتملة بنجاح
                </span>
              )}
              {isCurrent && (
                <span className="bg-sky-500/20 text-sky-300 border-sky-500/30 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                  المحطة الحالية (قيد الإنجاز)
                </span>
              )}
              {isLocked && (
                <span className="bg-slate-700/50 text-slate-300 border-slate-600/30 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-slate-400" />
                  محطة قادمة مغلقة
                </span>
              )}
            </div>

            {/* Title & Badge */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-emerald-400 font-bold text-xs sm:text-sm tracking-wide block">
                  المحطة رقم {station.stationNumber}
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 flex items-center gap-2">
                  <span>{station.name}</span>
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
                  {station.description}
                </p>
              </div>

              <div className="hidden sm:flex flex-col items-center justify-center p-3 rounded-2xl bg-white/10 border border-white/10 text-center min-w-[90px]">
                <span className="text-xs text-slate-300 font-medium">وسام المحطة</span>
                <span className="text-xs font-bold text-emerald-300 mt-1">{station.badgeName}</span>
              </div>
            </div>
          </div>

          {/* Modal Body Content */}
          <div className="p-6 sm:p-8 space-y-6">

            {/* 1. Progress Section */}
            <div className="bg-slate-800/80 rounded-2xl p-4 sm:p-5 border border-slate-700/60">
              <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                <span className="text-slate-300 font-bold flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-400" />
                  <span>مستوى التقدم في المحطة</span>
                </span>
                <span className="font-extrabold text-emerald-400 font-mono dir-ltr">
                  {station.requiredPoints} / {Math.min(currentStudentPoints, station.requiredPoints)} ن
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700/80">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${station.progressPercentage}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-full rounded-full transition-all ${
                    isCompleted 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                      : isCurrent 
                      ? 'bg-gradient-to-r from-sky-500 to-emerald-400' 
                      : 'bg-slate-600'
                  }`}
                />
              </div>

              <div className="mt-2 text-left">
                <span className="text-xs text-slate-400 font-medium">
                  {isCompleted 
                    ? '100% تم استيفاء جميع النقاط المطلوبة' 
                    : `${station.progressPercentage}% إنجاز (${Math.max(0, station.requiredPoints - currentStudentPoints)} نقطة متبقية)`}
                </span>
              </div>
            </div>

            {/* 2. Requirements Section */}
            <div>
              <h4 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>متطلبات واشتراطات عبور المحطة:</span>
              </h4>

              <ul className="space-y-2.5">
                {station.requirements.map((req, idx) => (
                  <li 
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/40 text-xs sm:text-sm text-slate-200"
                  >
                    <div className={`mt-0.5 p-1 rounded-full ${isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="leading-relaxed">{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 3. Reward Section */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-teal-950/60 border border-emerald-500/40 relative overflow-hidden">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30 flex items-center justify-center shrink-0">
                  {renderRewardIcon(station.reward.icon)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-amber-300">مكافأة الوصول للمحطة</span>
                  </div>
                  <h5 className="text-base sm:text-lg font-bold text-white">
                    {station.reward.title}
                  </h5>
                  <p className="text-xs sm:text-sm text-emerald-200/80">
                    {station.reward.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 transition-all text-xs sm:text-sm"
              >
                إغلاق النافذة
              </button>

              {(isCompleted || isCurrent) && (
                <button
                  onClick={triggerConfetti}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 transition-all text-xs sm:text-sm"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>احتفل بالإنجاز 🎉</span>
                </button>
              )}
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
