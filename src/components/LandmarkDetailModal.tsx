import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Station } from '../types';
import { 
  X, CheckCircle2, Lock, Flame, Award, Gift, 
  Target, Sparkles, BookOpen, Sprout, Trophy,
  Shield, Watch, Crown, Heart, Star, Compass, MapPin
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LandmarkDetailModalProps {
  landmark: Station | null;
  onClose: () => void;
  studentPoints: number;
}

export default function LandmarkDetailModal({ landmark, onClose, studentPoints }: LandmarkDetailModalProps) {
  if (!landmark) return null;

  const isCompleted = landmark.status === 'completed';
  const isCurrent = landmark.status === 'current';
  const isLocked = landmark.status === 'locked';

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#10b981', '#06b6d4', '#f59e0b', '#ec4899', '#3b82f6']
    });
  };

  const renderIcon = (type?: string) => {
    const props = { className: "w-8 h-8 text-emerald-400" };
    switch (type) {
      case 'garden': return <Sprout {...props} />;
      case 'valley': return <Heart className="w-8 h-8 text-teal-400" />;
      case 'mountain': return <Shield className="w-8 h-8 text-amber-400" />;
      case 'river': return <Compass className="w-8 h-8 text-cyan-400" />;
      case 'peak': return <Crown className="w-8 h-8 text-indigo-400" />;
      case 'summit': return <Trophy className="w-8 h-8 text-amber-300" />;
      default: return <Award {...props} />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-xl dir-rtl overflow-y-auto">
        
        {/* Backdrop click to close */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Glassmorphic Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 30 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-xl bg-slate-900/90 border border-emerald-500/30 rounded-3xl sm:rounded-[2.5rem] shadow-2xl shadow-emerald-950/80 overflow-hidden text-white z-10 my-8 backdrop-blur-2xl"
        >
          {/* Top Banner with Background Ambient Light */}
          <div className="relative p-6 sm:p-8 border-b border-white/10 bg-gradient-to-b from-emerald-950/80 via-slate-900/90 to-slate-900">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 left-5 p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-white/10 shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Status Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black mb-4 border backdrop-blur-md shadow-md">
              {isCompleted && (
                <span className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  محطة مجتازة بنجاح ✓
                </span>
              )}
              {isCurrent && (
                <span className="bg-amber-500/20 text-amber-300 border-amber-500/40 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                  موقعك الحالي في أفق الرحلة 🔥
                </span>
              )}
              {isLocked && (
                <span className="bg-slate-800/80 text-slate-400 border-slate-700/60 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-slate-400" />
                  معلم مقبل لم يُفتح بعد 🔒
                </span>
              )}
            </div>

            {/* Title & Icon Header */}
            <div className="flex items-start gap-4">
              <div className="p-4 rounded-3xl bg-slate-800/80 border border-white/10 shadow-xl shrink-0">
                {renderIcon(landmark.landmarkType)}
              </div>

              <div>
                <span className="text-emerald-400 text-xs font-mono font-bold tracking-widest block">
                  المعلم التجريبي #{landmark.stationNumber}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white mt-0.5 tracking-tight">
                  {landmark.name}
                </h2>
                {landmark.arabicSub && (
                  <p className="text-emerald-200/90 text-xs sm:text-sm mt-1.5 leading-relaxed font-medium">
                    "{landmark.arabicSub}"
                  </p>
                )}
              </div>
            </div>

            {/* Qur'anic Ayah / Emotional Anchor Card */}
            {landmark.ayah && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-6 p-4 rounded-2xl bg-slate-950/60 border border-amber-500/30 text-amber-200 text-center relative overflow-hidden"
              >
                <span className="text-[10px] text-amber-400/80 font-bold uppercase tracking-wider block mb-1">
                  الآية الهادية لهذا المعلم
                </span>
                <p className="font-serif text-base sm:text-lg text-amber-100 font-extrabold leading-relaxed">
                  ﴿ {landmark.ayah} ﴾
                </p>
              </motion.div>
            )}
          </div>

          {/* Modal Body */}
          <div className="p-6 sm:p-8 space-y-6">

            {/* Description */}
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              {landmark.description}
            </p>

            {/* Points Progress */}
            <div className="bg-slate-950/60 rounded-2xl p-4 sm:p-5 border border-slate-800">
              <div className="flex items-center justify-between text-xs sm:text-sm mb-2 font-bold">
                <span className="text-slate-300 flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-400" />
                  <span>النقاط المطلوبة للوصول الكامل</span>
                </span>
                <span className="text-emerald-400 font-mono dir-ltr">
                  {landmark.requiredPoints} / {Math.min(studentPoints, landmark.requiredPoints)} ن
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden p-0.5 border border-slate-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${landmark.progressPercentage}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-full rounded-full transition-all ${
                    isCompleted 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                      : isCurrent 
                      ? 'bg-gradient-to-r from-amber-500 via-emerald-400 to-teal-400' 
                      : 'bg-slate-700'
                  }`}
                />
              </div>

              <div className="mt-2 text-left">
                <span className="text-[11px] text-slate-400 font-medium">
                  {isCompleted 
                    ? 'اكتمل هذا المعلم بنجاح تام! 🎉' 
                    : `${landmark.progressPercentage}% إنجاز (${Math.max(0, landmark.requiredPoints - studentPoints)} نقطة متبقية)`}
                </span>
              </div>
            </div>

            {/* Requirements List */}
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>شروط ومتطلبات اجتياز هذا المعلم:</span>
              </h4>

              <div className="space-y-2.5">
                {landmark.requirements.map((req, idx) => (
                  <div 
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs sm:text-sm text-slate-200"
                  >
                    <div className={`mt-0.5 p-1 rounded-full ${isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="leading-relaxed">{req}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reward Preview */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-950/80 via-teal-950/60 to-slate-900 border border-emerald-500/40 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-300 border border-emerald-500/30 shrink-0">
                <Gift className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[10px] font-extrabold text-amber-400 tracking-wider uppercase block">
                  مكافأة واحة المعلم
                </span>
                <h5 className="text-sm sm:text-base font-bold text-white mt-0.5">
                  {landmark.reward.title}
                </h5>
                <p className="text-xs text-emerald-200/80 mt-0.5">
                  {landmark.reward.description}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl border border-slate-700 transition-all text-xs sm:text-sm"
              >
                إغلاق النافذة
              </button>

              {(isCompleted || isCurrent) && (
                <button
                  onClick={triggerConfetti}
                  className="flex-1 py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white font-extrabold rounded-2xl shadow-xl shadow-emerald-950/60 flex items-center justify-center gap-2 transition-all text-xs sm:text-sm"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>احتفل بإنجازك 🎉</span>
                </button>
              )}
            </div>

          </div>
        </motion.div>

      </div>
    </AnimatePresence>
  );
}
