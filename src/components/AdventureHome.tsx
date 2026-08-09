import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Station, StudentProfile } from '../types';
import { adventureLandmarks, adventureStudentProfile } from '../data/landmarksData';
import LandmarkDetailModal from './LandmarkDetailModal';
import { 
  Volume2, VolumeX, Settings, Sparkles, User, 
  Sprout, Heart, Shield, Compass, Crown, Trophy, 
  CheckCircle2, Flame, Lock, Compass as CompassIcon, ChevronLeft,
  Feather, Star, MapPin
} from 'lucide-react';

interface AdventureHomeProps {
  onSwitchToTeacher?: () => void;
}

export default function AdventureHome({ onSwitchToTeacher }: AdventureHomeProps) {
  const [student, setStudent] = useState<StudentProfile>(adventureStudentProfile);
  const [landmarks, setLandmarks] = useState<Station[]>(adventureLandmarks);
  const [selectedLandmark, setSelectedLandmark] = useState<Station | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Active landmark is the one marked 'current'
  const activeLandmark = landmarks.find(l => l.status === 'current') || landmarks[2];

  // Icon selector for each landmark
  const renderLandmarkIcon = (type?: string, isCompleted?: boolean, isCurrent?: boolean) => {
    const baseClass = "w-7 h-7 sm:w-9 sm:h-9 transition-transform duration-300";
    
    if (isCompleted) {
      return <CheckCircle2 className={`${baseClass} text-emerald-300`} />;
    }
    if (isCurrent) {
      return <Flame className={`${baseClass} text-amber-300 animate-pulse`} />;
    }

    switch (type) {
      case 'garden': return <Sprout className={`${baseClass} text-emerald-400`} />;
      case 'valley': return <Heart className={`${baseClass} text-teal-400`} />;
      case 'mountain': return <Shield className={`${baseClass} text-amber-400`} />;
      case 'river': return <Compass className={`${baseClass} text-cyan-400`} />;
      case 'peak': return <Crown className={`${baseClass} text-indigo-400`} />;
      case 'summit': return <Trophy className={`${baseClass} text-amber-300`} />;
      default: return <Sparkles className={`${baseClass} text-emerald-300`} />;
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-b from-[#021814] via-[#082032] to-[#010a17] text-white overflow-hidden dir-rtl select-none">
      
      {/* ================= BACKGROUND ATMOSPHERE & ENVIRONMENT ================= */}
      
      {/* Soft Ambient Light Rays */}
      <div className="absolute top-0 right-1/4 w-96 h-full bg-gradient-to-b from-emerald-500/15 via-teal-500/5 to-transparent blur-3xl pointer-events-none animate-ray-pulse" />
      <div className="absolute top-0 left-1/4 w-96 h-full bg-gradient-to-b from-sky-500/15 via-blue-500/5 to-transparent blur-3xl pointer-events-none animate-ray-pulse" style={{ animationDelay: '3s' }} />

      {/* Floating Magic Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {[...Array(18)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-emerald-400/40 blur-[1px] animate-float-particle"
            style={{
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 6 + 6}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Animated Drifting Clouds */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-20">
        <div className="absolute -top-10 -left-20 w-[600px] h-40 bg-emerald-300/20 rounded-full blur-3xl animate-cloud-drift" />
        <div className="absolute top-1/3 -right-20 w-[700px] h-48 bg-sky-300/20 rounded-full blur-3xl animate-cloud-drift" style={{ animationDuration: '55s' }} />
        <div className="absolute bottom-10 left-10 w-[500px] h-36 bg-teal-300/15 rounded-full blur-3xl animate-cloud-drift" style={{ animationDuration: '45s' }} />
      </div>

      {/* Tiny Bird Silhouettes Floating in Sky */}
      <div className="absolute top-16 right-12 pointer-events-none opacity-40 text-emerald-200">
        <Feather className="w-5 h-5 animate-bounce" style={{ animationDuration: '7s' }} />
      </div>

      {/* ================= MINIMAL TOP BAR ================= */}
      <header className="relative z-30 px-6 sm:px-12 py-5 flex items-center justify-between backdrop-blur-md bg-slate-950/20 border-b border-white/5">
        
        {/* Student Avatar & Identity */}
        <div className="flex items-center gap-4">
          <div className="relative group cursor-pointer" onClick={() => setSelectedLandmark(activeLandmark)}>
            {student.avatar ? (
              <img 
                src={student.avatar} 
                alt={student.fullName}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-emerald-400 shadow-xl shadow-emerald-950/80 group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-800 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 font-bold text-lg shadow-xl group-hover:scale-105 transition-transform">
                {student.fullName ? student.fullName.charAt(0) : 'ط'}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 p-1 bg-amber-400 text-slate-950 rounded-full text-[10px] font-black shadow">
              <Star className="w-3 h-3 fill-slate-950" />
            </span>
          </div>

          <div>
            <h1 className="text-base sm:text-lg font-black text-white tracking-wide flex items-center gap-2">
              <span>{student.fullName}</span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-extrabold">
                {student.currentPoints} نقطة
              </span>
            </h1>
            <p className="text-xs text-emerald-200/80 font-medium mt-0.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{student.currentLevelTitle}</span>
            </p>
          </div>
        </div>

        {/* Minimal Actions: Audio & Teacher View Switcher */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2.5 rounded-full bg-slate-900/60 hover:bg-slate-800/80 text-emerald-300 border border-white/10 transition-all shadow-lg"
            title="مؤثرات الصوت"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {onSwitchToTeacher && (
            <button
              onClick={onSwitchToTeacher}
              className="px-4 py-2 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs sm:text-sm font-extrabold rounded-2xl border border-emerald-500/30 transition-all shadow-lg flex items-center gap-2"
            >
              <User className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">لوحة المعلم</span>
            </button>
          )}
        </div>

      </header>

      {/* ================= MAIN SCENE: CINEMATIC ADVENTURE LANDSCAPE ================= */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12 min-h-[calc(100vh-100px)] flex flex-col justify-between">
        
        {/* Intro Atmosphere Header */}
        <div className="text-center space-y-2 mb-8 sm:mb-12">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-black shadow-lg"
          >
            <CompassIcon className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '15s' }} />
            <span>خارطة المعالم الإيمانية والتربوية</span>
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-teal-100 to-sky-200 tracking-tight"
          >
            مسار الارتقاء إلى أفق الأثر
          </motion.h2>

          <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto font-medium">
            انقر على أي معلم لمشاهدة رسالته، آياته الهادية، شروط اجتيازه، وجائزة الواحة!
          </p>
        </div>

        {/* ---------------- INTERACTIVE WINDING MAP SCENE ---------------- */}
        <div className="relative w-full py-8 sm:py-16 my-4 min-h-[600px] flex flex-col items-center justify-center">

          {/* Glowing Winding Background Trail (Desktop & Mobile) */}
          <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center">
            <svg className="w-full h-full max-w-4xl opacity-70 animate-path-glow" viewBox="0 0 800 700" fill="none">
              <path
                d="M 150 620 C 350 620, 650 500, 650 380 C 650 260, 200 240, 200 140 C 200 60, 550 40, 650 30"
                stroke="url(#glowingPathGradient)"
                strokeWidth="10"
                strokeDasharray="14 10"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="glowingPathGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="35%" stopColor="#14b8a6" />
                  <stop offset="65%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Landmarks Nodes Stacked along the Vertical Adventure Road */}
          <div className="relative z-10 w-full max-w-4xl space-y-12 sm:space-y-16">
            
            {landmarks.map((lm, index) => {
              const isCompleted = lm.status === 'completed';
              const isCurrent = lm.status === 'current';
              const isLocked = lm.status === 'locked';

              // Alternate left/right alignment for winding visual effect
              const isEven = index % 2 === 0;

              return (
                <div 
                  key={lm.id}
                  className={`flex items-center w-full ${
                    isEven ? 'justify-start sm:pr-12' : 'justify-end sm:pl-12'
                  }`}
                >
                  <motion.div
                    whileHover={{ scale: 1.05, y: -6 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setSelectedLandmark(lm)}
                    className={`relative cursor-pointer max-w-md w-full rounded-3xl sm:rounded-[2rem] p-5 sm:p-6 border backdrop-blur-xl transition-all duration-300 group ${
                      isCompleted 
                        ? 'bg-gradient-to-br from-emerald-950/70 via-slate-900/80 to-slate-950/80 border-emerald-500/40 hover:border-emerald-400 shadow-xl shadow-emerald-950/50' 
                        : isCurrent 
                        ? 'bg-gradient-to-br from-amber-950/80 via-slate-900/90 to-teal-950/90 border-amber-400 hover:border-amber-300 shadow-2xl shadow-amber-950/70 ring-4 ring-amber-500/20' 
                        : 'bg-slate-950/60 border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-700'
                    }`}
                  >
                    
                    {/* Active Avatar Pin Marker */}
                    {isCurrent && (
                      <div className="absolute -top-12 right-6 sm:right-8 z-20 flex flex-col items-center animate-avatar-breathe">
                        <div className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] shadow-lg flex items-center gap-1">
                          <span>أنت هنا!</span>
                          <Sparkles className="w-3 h-3 text-slate-950 fill-slate-950" />
                        </div>
                        <div className="w-10 h-10 rounded-full border-2 border-amber-300 shadow-2xl overflow-hidden mt-1 bg-slate-900 flex items-center justify-center text-amber-300 font-bold text-xs">
                          {student.avatar ? (
                            <img src={student.avatar} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span>{student.fullName ? student.fullName.charAt(0) : 'ط'}</span>
                          )}
                        </div>
                        <div className="w-2 h-2 bg-amber-400 rotate-45 -mt-1" />
                      </div>
                    )}

                    {/* Landmark Header */}
                    <div className="flex items-start justify-between gap-4">
                      
                      <div className="flex items-center gap-3.5">
                        <div className={`p-3.5 rounded-2xl border shadow-xl shrink-0 ${
                          isCompleted 
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                            : isCurrent 
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                            : 'bg-slate-800 border-slate-700 text-slate-500'
                        }`}>
                          {renderLandmarkIcon(lm.landmarkType, isCompleted, isCurrent)}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              معلم #{lm.stationNumber}
                            </span>
                            <span className="text-xs font-bold text-slate-300">
                              {lm.requiredPoints} نقطة
                            </span>
                          </div>

                          <h3 className="text-lg sm:text-2xl font-black text-white mt-1 group-hover:text-emerald-300 transition-colors">
                            {lm.name}
                          </h3>
                        </div>
                      </div>

                      {/* Status Tag */}
                      <div>
                        {isCompleted && (
                          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            مكتمل ✓
                          </span>
                        )}
                        {isCurrent && (
                          <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                            قيد الإنجاز 🔥
                          </span>
                        )}
                        {isLocked && (
                          <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-800 text-slate-400 border border-slate-700">
                            مغلق 🔒
                          </span>
                        )}
                      </div>

                    </div>

                    {/* Arabic Quote */}
                    {lm.arabicSub && (
                      <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed font-medium line-clamp-2 italic">
                        "{lm.arabicSub}"
                      </p>
                    )}

                    {/* Footer Prompt */}
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-bold text-emerald-400 group-hover:text-emerald-300">
                      <span>استكشف تفاصيل المعلم</span>
                      <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    </div>

                  </motion.div>
                </div>
              );
            })}

          </div>

        </div>

      </main>

      {/* Interactive Glassmorphic Landmark Modal */}
      <LandmarkDetailModal
        landmark={selectedLandmark}
        onClose={() => setSelectedLandmark(null)}
        studentPoints={student.currentPoints}
      />

    </div>
  );
}
