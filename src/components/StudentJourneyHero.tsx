import React, { useState } from 'react';
import { motion } from 'motion/react';
import { JourneyConfig, Station, JourneyType, StudentProfile } from '../types';
import { journeyConfigs } from '../data/journeysData';
import StationDetailModal from './StationDetailModal';
import { 
  Trees, Car, Rocket, Shield, Sparkles, Award, Trophy, 
  Flame, CheckCircle2, Lock, ChevronLeft, Target, RefreshCw, Star, Info,
  BookOpen
} from 'lucide-react';

interface StudentJourneyHeroProps {
  student: StudentProfile;
  onJourneyTypeChange?: (type: JourneyType) => void;
}

export default function StudentJourneyHero({ student, onJourneyTypeChange }: StudentJourneyHeroProps) {
  const [selectedJourneyType, setSelectedJourneyType] = useState<JourneyType>(student.journeyType);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  const activeJourney: JourneyConfig = journeyConfigs[selectedJourneyType] || journeyConfigs['tree'];

  const handleTypeSelect = (type: JourneyType) => {
    setSelectedJourneyType(type);
    if (onJourneyTypeChange) {
      onJourneyTypeChange(type);
    }
  };

  // Helper icon for journey type
  const renderJourneyIcon = (type: JourneyType) => {
    switch (type) {
      case 'tree': return <Trees className="w-5 h-5" />;
      case 'car': return <Car className="w-5 h-5" />;
      case 'rocket': return <Rocket className="w-5 h-5" />;
      case 'superhero': return <Shield className="w-5 h-5" />;
    }
  };

  return (
    <div className="w-full relative dir-rtl">
      
      {/* ================= HERO JOURNEY CONTAINER ================= */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full bg-slate-900 border border-emerald-500/30 rounded-3xl sm:rounded-[2.5rem] shadow-2xl shadow-emerald-950/50 overflow-hidden relative text-white"
      >
        {/* Dynamic Glowing Radial Backgrounds */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* ---------------- 1. TOP HERO HEADER & THEME SWITCHER ---------------- */}
        <div className="p-6 sm:p-10 border-b border-slate-800/80 bg-gradient-to-b from-slate-900/90 via-slate-900/50 to-transparent relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            {/* Student Info & Journey Title */}
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold mb-3">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>اللافتة التحفيزية البصرية للطفل والشباب</span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight flex items-center gap-3">
                <span>رحلتي: {activeJourney.title}</span>
              </h1>

              <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl font-medium">
                {activeJourney.subtitle}
              </p>
            </div>

            {/* Visual Journey Theme Selector Tabs */}
            <div className="bg-slate-950/80 p-2 rounded-2xl border border-slate-800 flex items-center gap-1.5 overflow-x-auto self-start lg:self-auto max-w-full">
              <span className="text-xs text-slate-400 font-bold px-3 hidden sm:inline-block whitespace-nowrap">
                اختر مسار القمة:
              </span>
              
              {(['tree', 'car', 'rocket', 'superhero'] as JourneyType[]).map((type) => {
                const isActive = selectedJourneyType === type;
                const labels: Record<JourneyType, string> = {
                  tree: 'شجرة العطاء',
                  car: 'سباق النور',
                  rocket: 'صاروخ الإنجاز',
                  superhero: 'حارس القيم'
                };

                return (
                  <button
                    key={type}
                    onClick={() => handleTypeSelect(type)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                      isActive 
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/40 ring-1 ring-emerald-400/30' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    {renderJourneyIcon(type)}
                    <span>{labels[type]}</span>
                  </button>
                );
              })}
            </div>

          </div>

          {/* Key Student Overview Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-slate-800/60">
            <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-slate-700/50">
              <span className="text-xs text-slate-400 font-bold block mb-1">نقاطك الحالية</span>
              <div className="flex items-center justify-between">
                <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">{student.currentPoints}</span>
                <Flame className="w-5 h-5 text-amber-400" />
              </div>
            </div>

            <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-slate-700/50">
              <span className="text-xs text-slate-400 font-bold block mb-1">المستوى الحالي</span>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[110px]">{student.currentLevelTitle && student.currentLevelTitle.includes(':') ? student.currentLevelTitle.split(':')[1].trim() : (student.currentLevelTitle || 'البداية')}</span>
                <Trophy className="w-5 h-5 text-emerald-400" />
              </div>
            </div>

            <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-slate-700/50">
              <span className="text-xs text-slate-400 font-bold block mb-1">الترتيب بالحلقة</span>
              <div className="flex items-center justify-between">
                <span className="text-xl sm:text-2xl font-black text-sky-400 font-mono">المركز #{student.rankInClass}</span>
                <Star className="w-5 h-5 text-amber-300" />
              </div>
            </div>

            <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-slate-700/50">
              <span className="text-xs text-slate-400 font-bold block mb-1">الهدف القادم</span>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-slate-200">1200 نقطة</span>
                <Target className="w-5 h-5 text-teal-400" />
              </div>
            </div>
          </div>
        </div>

        {/* ---------------- 2. INTERACTIVE JOURNEY PATH CANVAS (HERO MAIN BODY) ---------------- */}
        <div className="p-6 sm:p-10 lg:p-12 relative min-h-[480px] sm:min-h-[580px] flex flex-col justify-center">

          {/* Interactive Hint Banner */}
          <div className="text-center mb-8">
            <p className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-300 bg-emerald-950/60 px-4 py-2 rounded-full border border-emerald-500/30">
              <Info className="w-4 h-4 text-emerald-400 animate-bounce" />
              <span>انقر على أي محطة في المسار لاستعراض التفاصيل، نسبة الإنجاز، المتطلبات، والجائزة!</span>
            </p>
          </div>

          {/* Curved Desktop SVG Path */}
          <div className="hidden lg:block absolute inset-0 pointer-events-none px-16 py-28 z-0">
            <svg className="w-full h-full" viewBox="0 0 1000 300" fill="none" preserveAspectRatio="none">
              <path
                d="M 100,150 Q 300,50 500,150 T 900,150"
                stroke="url(#journeyGradient)"
                strokeWidth="8"
                strokeDasharray="12 8"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="journeyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Station Nodes Layout */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-4 items-center">
            {activeJourney.stations.map((st, idx) => {
              const isCompleted = st.status === 'completed';
              const isCurrent = st.status === 'current';
              const isLocked = st.status === 'locked';

              return (
                <motion.div
                  key={st.id}
                  whileHover={{ scale: 1.05, y: -6 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setSelectedStation(st)}
                  className={`cursor-pointer rounded-3xl p-5 border transition-all duration-300 relative group flex flex-col items-center text-center ${
                    isCompleted 
                      ? 'bg-gradient-to-b from-slate-800/90 to-emerald-950/80 border-emerald-500/50 hover:border-emerald-400 shadow-lg shadow-emerald-950/40' 
                      : isCurrent 
                      ? 'bg-gradient-to-b from-slate-800/90 to-sky-950/90 border-sky-400 hover:border-sky-300 shadow-2xl shadow-sky-900/50 ring-4 ring-sky-500/20' 
                      : 'bg-slate-900/70 border-slate-800 opacity-75 hover:opacity-100 hover:border-slate-700'
                  }`}
                >
                  {/* Station Number Badge Floating Top */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs mb-3 shadow-md border ${
                    isCompleted 
                      ? 'bg-emerald-500 text-slate-950 border-emerald-300' 
                      : isCurrent 
                      ? 'bg-amber-400 text-slate-950 border-amber-200 animate-pulse' 
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {st.stationNumber}
                  </div>

                  {/* Icon Node Graphic */}
                  <div className={`relative w-20 h-20 rounded-2xl flex items-center justify-center mb-3 shadow-xl transition-all ${
                    isCompleted 
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-900/50' 
                      : isCurrent 
                      ? 'bg-gradient-to-br from-sky-500 to-teal-500 text-white shadow-sky-900/60 ring-2 ring-white/20' 
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}>
                    {isCompleted && (
                      <CheckCircle2 className="w-10 h-10 text-white drop-shadow-md" />
                    )}
                    {isCurrent && (
                      <div className="relative flex items-center justify-center">
                        <Flame className="w-10 h-10 text-amber-300 animate-bounce" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
                      </div>
                    )}
                    {isLocked && (
                      <Lock className="w-9 h-9 text-slate-500" />
                    )}

                    {/* Glowing Aura for Current Station */}
                    {isCurrent && (
                      <div className="absolute inset-0 rounded-2xl bg-sky-400/20 blur-md pointer-events-none" />
                    )}
                  </div>

                  {/* Station Name & Points Required */}
                  <h3 className="font-extrabold text-base sm:text-lg text-white group-hover:text-emerald-300 transition-colors">
                    {st.name}
                  </h3>

                  <div className="mt-1 flex items-center gap-1 text-xs text-slate-300 font-semibold">
                    <span>{st.requiredPoints} نقطة</span>
                  </div>

                  {/* Status Pills */}
                  <div className="mt-3">
                    {isCompleted && (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        مكتملة ✓
                      </span>
                    )}
                    {isCurrent && (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/40">
                        قيد الإنجاز ({st.progressPercentage}%)
                      </span>
                    )}
                    {isLocked && (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                        مغلقة 🔒
                      </span>
                    )}
                  </div>

                  {/* Hover Prompt */}
                  <span className="mt-2 text-[11px] text-emerald-400/0 group-hover:text-emerald-400 font-bold transition-all flex items-center gap-1">
                    <span>استعرض التفاصيل</span>
                    <ChevronLeft className="w-3 h-3" />
                  </span>
                </motion.div>
              );
            })}
          </div>

        </div>

        {/* ---------------- 3. FOOTER STATS & QUICK ACTION ---------------- */}
        <div className="p-6 sm:p-8 bg-slate-950/80 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-bold block">مكافأة الوصول للمحطة القادمة</span>
              <p className="text-sm font-bold text-white">
                {activeJourney.stations.find(s => s.status === 'current')?.reward.title || 'درع الشجرة المباركة'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              const currentSt = activeJourney.stations.find(s => s.status === 'current') || activeJourney.stations[0];
              setSelectedStation(currentSt);
            }}
            className="w-full sm:w-auto py-3 px-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all text-xs sm:text-sm"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>عرض تفاصيل محطتي الحالية</span>
          </button>
        </div>

      </motion.div>

      {/* Interactive Station Detail Modal Popup */}
      <StationDetailModal
        station={selectedStation}
        onClose={() => setSelectedStation(null)}
        currentStudentPoints={student.currentPoints}
      />
    </div>
  );
}
