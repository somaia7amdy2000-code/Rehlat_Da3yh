import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, ChevronLeft, ChevronRight, Compass, Sparkles, 
  TrendingUp, Award, Target, Rocket, Users, Heart, 
  CheckCircle2, MapPin, Flag, Trophy, Footprints, 
  MessageSquareHeart, Home, User, Plus, X, Search, Clock, Gift,
  Crown, Star, Zap, BookOpen, Shield, Mail, HandHeart, Check, Gem, Sprout,
  Menu, Moon, Settings, Book, BarChart3, MoreHorizontal, Lock, Flame, LogOut, Globe, Edit3, Play, Upload
} from 'lucide-react';
import confetti from 'canvas-confetti';
import fantasyBg from '../assets/images/fantasy_valley_bg_1785881049645.jpg';
import { initialChallengesData } from '../data/challenges';
import { Challenge, ChallengeCategory } from '../types/challenge';
import { challengeService } from '../services/challengeService';
import { subscribeToSettings, getSystemSettings, SystemSettings } from '../services/systemSettingsService';
import { ClubPage } from './ClubPage';
import { StudentLibraryView } from './StudentLibraryView';
import { BatchStudent, Batch, BatchClass, BatchClub } from '../types/teacher';
import { teacherService, normalizeStudentCode } from '../services/teacherService';
import { calculateStudentJourney, StudentJourneyMetrics } from '../services/journeyEngine';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Types
export interface YouthLevelTask {
  text: string;
  done: boolean;
}

export interface YouthLevel {
  id: string;
  levelNumber: number;
  title: string;
  nameOnly: string;
  emoji: string;
  status: 'completed' | 'current' | 'next' | 'locked';
  shape: 'shield' | 'hexagon';
  material: 'emerald' | 'cyan' | 'gold' | 'sapphire' | 'purple' | 'crown';
  description: string;
  requiredTasks: YouthLevelTask[];
  rewardTitle: string;
  rewardPoints: number;
  rewardIcon: string;
}

// Helper Component for Premium 3D Level Badge (Hexagon)
function LevelBadge3D({ 
  level, 
  isCurrent, 
  onClick 
}: { 
  level: YouthLevel; 
  isCurrent: boolean; 
  onClick: () => void; 
}) {
  // Metallic theme palette for SVG 3D gradients
  const themeGradients = {
    emerald: { start: '#34d399', mid: '#10b981', end: '#047857', border: '#a7f3d0' },
    cyan: { start: '#38bdf8', mid: '#0284c7', end: '#0c4a6e', border: '#bae6fd' },
    gold: { start: '#fde047', mid: '#d97706', end: '#78350f', border: '#fef08a' },
    sapphire: { start: '#60a5fa', mid: '#2563eb', end: '#1e3a8a', border: '#bfdbfe' },
    purple: { start: '#c084fc', mid: '#9333ea', end: '#581c87', border: '#e9d5ff' },
    crown: { start: '#facc15', mid: '#eab308', end: '#854d0e', border: '#fef08a' }
  }[level.material];

  return (
    <div className="relative flex flex-col items-center group">
      
      {/* Floating "أنت هنا" Badge for Current Level */}
      {isCurrent && (
        <motion.div 
          initial={{ y: -4 }}
          animate={{ y: [-4, -8, -4] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="absolute -top-8 z-30 px-2.5 py-0.5 rounded-full bg-[#0d4738] text-white font-black text-[10px] shadow-sm border border-emerald-300/50 flex items-center gap-1 whitespace-nowrap"
        >
          <span>أنت هنا</span>
        </motion.div>
      )}

      {/* Badge Container */}
      <div className="relative flex items-center justify-center">
        
        {/* Soft Turquoise Glow Halo for Current Level */}
        {isCurrent && (
          <>
            {/* Ambient soft glow aura */}
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.35, 0.65, 0.35] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="absolute -inset-3 rounded-full bg-[#14B8A6]/30 blur-md pointer-events-none"
            />
            
            {/* Gentle pulse ring every 3 seconds */}
            <motion.div 
              animate={{ scale: [1, 1.15, 1], opacity: [0.75, 0.25, 0.75] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="absolute -inset-2 rounded-full border-2 border-[#2DD4BF] shadow-[0_0_16px_rgba(45,212,191,0.5)] pointer-events-none"
            />
          </>
        )}

        {/* Unified 3D Hexagon Button */}
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.25 }}
          onClick={onClick}
          className={`relative z-10 flex items-center justify-center cursor-pointer transition-all duration-250 ${
            isCurrent 
              ? 'w-[84px] h-[84px] drop-shadow-[0_10px_24px_rgba(0,0,0,0.12)]' 
              : 'w-[70px] h-[70px] opacity-95 group-hover:opacity-100 drop-shadow-[0_10px_24px_rgba(0,0,0,0.12)]'
          }`}
        >
          <svg viewBox="0 0 100 115" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id={`lvlGrad-${level.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={themeGradients.start} />
                <stop offset="50%" stopColor={themeGradients.mid} />
                <stop offset="100%" stopColor={themeGradients.end} />
              </linearGradient>
              <linearGradient id={`lvlBorder-${level.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="100%" stopColor={themeGradients.border} stopOpacity="0.7" />
              </linearGradient>
            </defs>

            {/* Unified 3D Hexagon Geometry */}
            <polygon 
              points="50 4, 92 28, 92 76, 50 100, 8 76, 8 28" 
              fill={`url(#lvlGrad-${level.id})`}
              stroke={`url(#lvlBorder-${level.id})`}
              strokeWidth={isCurrent ? "4" : "3"}
              strokeLinejoin="round"
            />
            {/* Top Gloss Highlight */}
            <polygon 
              points="50 10, 84 30, 50 50, 16 30" 
              fill="rgba(255, 255, 255, 0.28)"
            />
            {/* Inner Hexagon Outline */}
            <polygon 
              points="50 16, 78 32, 78 70, 50 86, 22 70, 22 32" 
              fill="none"
              stroke="rgba(255, 255, 255, 0.35)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>

          {/* Icon/Emoji inside 3D badge */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className={`${isCurrent ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'} filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]`}>
              {level.emoji}
            </span>
          </div>
        </motion.button>
      </div>

      {/* Label under Badge */}
      <span className={`text-[10px] sm:text-[11px] font-black text-slate-800 mt-1.5 text-center whitespace-nowrap ${isCurrent ? 'font-black text-teal-950' : ''}`}>
        {level.nameOnly}
      </span>
    </div>
  );
}

// Helper Component for 3D Hexagon Collectible Medal
function HexagonMedal({ 
  material = 'gold', 
  icon: Icon, 
  size = 'md',
  label
}: { 
  material?: 'gold' | 'emerald' | 'violet' | 'sky' | 'amber'; 
  icon: React.ElementType; 
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}) {
  const sizeMap = {
    sm: { container: 'w-10 h-11', svg: 'w-10 h-11', icon: 'w-4 h-4' },
    md: { container: 'w-13 h-15', svg: 'w-13 h-15', icon: 'w-5 h-5' },
    lg: { container: 'w-16 h-18', svg: 'w-16 h-18', icon: 'w-7 h-7' }
  }[size];

  const theme = {
    gold: {
      gradStart: '#fde047',
      gradMid: '#eab308',
      gradEnd: '#ca8a04',
      border: '#fef08a',
      iconClass: 'text-amber-950'
    },
    emerald: {
      gradStart: '#6ee7b7',
      gradMid: '#10b981',
      gradEnd: '#047857',
      border: '#a7f3d0',
      iconClass: 'text-emerald-950'
    },
    violet: {
      gradStart: '#c4b5fd',
      gradMid: '#8b5cf6',
      gradEnd: '#6d28d9',
      border: '#ddd6fe',
      iconClass: 'text-white'
    },
    sky: {
      gradStart: '#7dd3fc',
      gradMid: '#06b6d4',
      gradEnd: '#0369a1',
      border: '#bae6fd',
      iconClass: 'text-slate-950'
    },
    amber: {
      gradStart: '#fde68a',
      gradMid: '#d97706',
      gradEnd: '#92400e',
      border: '#fef3c7',
      iconClass: 'text-amber-950'
    }
  }[material];

  return (
    <div className="flex flex-col items-center group">
      <motion.div 
        whileHover={{ scale: 1.12, y: -3 }}
        whileTap={{ scale: 0.95 }}
        className={`relative flex items-center justify-center ${sizeMap.container} cursor-pointer transition-all duration-200 drop-shadow-md`}
      >
        <svg viewBox="0 0 100 115" className={`${sizeMap.svg} filter drop-shadow-sm`}>
          <defs>
            <linearGradient id={`hexGrad-${material}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={theme.gradStart} />
              <stop offset="50%" stopColor={theme.gradMid} />
              <stop offset="100%" stopColor={theme.gradEnd} />
            </linearGradient>
            <linearGradient id={`hexBorder-${material}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="100%" stopColor={theme.border} stopOpacity="0.5" />
            </linearGradient>
          </defs>
          
          {/* Outer Bevel Frame */}
          <polygon 
            points="50 3, 93 28, 93 78, 50 103, 7 78, 7 28" 
            fill={`url(#hexGrad-${material})`} 
            stroke={`url(#hexBorder-${material})`}
            strokeWidth="3.5"
          />
          {/* Inner Glossy Polygon */}
          <polygon 
            points="50 10, 85 31, 85 75, 50 96, 15 75, 15 31" 
            fill="rgba(255, 255, 255, 0.22)"
          />
          <polygon 
            points="50 10, 85 31, 50 52, 15 31" 
            fill="rgba(255, 255, 255, 0.38)"
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className={`${sizeMap.icon} ${theme.iconClass} drop-shadow-xs stroke-[2.5]`} />
        </div>
      </motion.div>

      {label && (
        <span className="text-[11px] font-black text-slate-700 mt-1.5 drop-shadow-xs group-hover:text-teal-700 transition-colors">
          {label}
        </span>
      )}
    </div>
  );
}

function CircularProgressRing({ progress, total, size = 56, strokeWidth = 5 }: { progress?: number; total?: number; size?: number; strokeWidth?: number }) {
  const safeTotal = typeof total === 'number' && !isNaN(total) && total > 0 ? total : 1;
  const safeProgress = typeof progress === 'number' && !isNaN(progress) ? progress : 0;
  const rawPercentage = Math.round((safeProgress / safeTotal) * 100);
  const percentage = isNaN(rawPercentage) ? 0 : Math.min(100, Math.max(0, rawPercentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const rawDashoffset = circumference - (percentage / 100) * circumference;
  const strokeDashoffset = isNaN(rawDashoffset) ? circumference : rawDashoffset;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-slate-100"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-[#14B8A6] transition-all duration-700 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center font-bold text-slate-900 text-[11px] font-mono">
        <span>{percentage}%</span>
      </div>
    </div>
  );
}

function renderChallengeIcon(name: string, className = "w-6 h-6") {
  switch (name) {
    case 'BookOpen': return <BookOpen className={className} />;
    case 'Shield': return <Shield className={className} />;
    case 'Crown': return <Crown className={className} />;
    case 'Trophy': return <Trophy className={className} />;
    case 'Award': return <Award className={className} />;
    case 'Flame': return <Flame className={className} />;
    case 'Heart': return <Heart className={className} />;
    case 'Target': return <Target className={className} />;
    case 'Star': return <Star className={className} />;
    case 'Compass': return <Compass className={className} />;
    case 'Sparkles': return <Sparkles className={className} />;
    case 'Users': return <Users className={className} />;
    case 'Zap': return <Zap className={className} />;
    case 'CheckCircle2': return <CheckCircle2 className={className} />;
    case 'Moon': return <Moon className={className} />;
    default: return <Sparkles className={className} />;
  }
}

export default function YouthMainApp({ 
  onSwitchToTeacher,
  onLogout,
}: { 
  onSwitchToTeacher?: () => void;
  onLogout?: () => void;
}) {
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(getSystemSettings());
  const [activeTab, setActiveTab] = useState<'home' | 'challenges' | 'club' | 'library' | 'profile'>('home');

  React.useEffect(() => {
    const unsubscribe = subscribeToSettings((newSettings) => {
      setSystemSettings(newSettings);
    });
    return () => unsubscribe();
  }, []);
  const [selectedLevelModal, setSelectedLevelModal] = useState<YouthLevel | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);

  // Batch & Class Selection for Student Login
  const [availableBatches, setAvailableBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [availableClasses, setAvailableClasses] = useState<BatchClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  // Active Logged-In Student State & Context
  const [activeStudentCode, setActiveStudentCode] = useState<string | null>(null);

  const [studentContext, setStudentContext] = useState<any | null>(null);
  const [allStudentsList, setAllStudentsList] = useState<Array<BatchStudent & { batchName?: string }>>([]);
  const [loginNameInput, setLoginNameInput] = useState('');
  const [loginCodeInput, setLoginCodeInput] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [ambiguousMatches, setAmbiguousMatches] = useState<Array<BatchStudent & { batchName?: string }> | null>(null);
  const [isLoadingStudent, setIsLoadingStudent] = useState(true);

  // Load available batches when student is not logged in (using secure portal discovery RPC)
  React.useEffect(() => {
    if (!studentContext) {
      teacherService.getPortalBatches().then((batches) => {
        setAvailableBatches(batches || []);
      });
    }
  }, [studentContext]);

  // Handle batch selection change (using secure portal discovery RPC)
  const handleBatchChange = async (batchId: string) => {
    setSelectedBatchId(batchId);
    setSelectedClassId('');
    setAvailableClasses([]);
    if (batchId) {
      const classes = await teacherService.getPortalClasses(batchId);
      setAvailableClasses(classes || []);
    }
  };

  // Helper for Arabic normalization
  const normalizeArabic = (str: string) => {
    return str
      .trim()
      .toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/\s+/g, ' ');
  };

  const getFirstNTokens = (nameStr: string, n: number = 3) => {
    const tokens = normalizeArabic(nameStr).split(' ').filter(Boolean);
    return tokens.slice(0, n).join(' ');
  };

  const handleSelectSpecificStudent = async (studentId: string) => {
    const ctx = await teacherService.getStudentFullContext(studentId);
    if (ctx) {
      setActiveStudentCode(studentId);
      setStudentContext(ctx);
      setAmbiguousMatches(null);
      setLoginError(null);
    } else {
      setLoginError('فشل تحميل بيانات الطالب.');
    }
  };

  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAmbiguousMatches(null);
    setLoginError(null);

    const nameClean = loginNameInput.trim();
    const codeClean = loginCodeInput.trim();

    if (!selectedBatchId || !selectedClassId || !nameClean || !codeClean) {
      setLoginError('يرجى اختيار الدفعة والفصل وإدخال الاسم الثلاثي وكود الطالب لدخول الرحلة.');
      return;
    }

    const res = await teacherService.studentPortalLogin({
      batchId: selectedBatchId,
      classId: selectedClassId,
      studentCode: codeClean,
      studentName: nameClean,
    });

    if (res.success && res.context) {
      setActiveStudentCode(res.context.student.id);
      setStudentContext(res.context);
      setLoginError(null);
    } else {
      setLoginError(res.error || 'بيانات الطالب غير صحيحة، تأكد من الدفعة، الفصل، الاسم والكود.');
    }
  };

  // Profile & Settings States
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editNameInput, setEditNameInput] = useState('');
  const [editAvatarInput, setEditAvatarInput] = useState('');
  const [isAllMessagesModalOpen, setIsAllMessagesModalOpen] = useState(false);

  // Fetch student context and system settings
  const refreshStudentContext = React.useCallback(async () => {
    setIsLoadingStudent(true);

    let codeToUse = activeStudentCode;
    let studentCodeParam: string | undefined = undefined;

    try {
      const stored = localStorage.getItem('rihlat_logged_student_code_v1');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object') {
            if (!codeToUse && (parsed.studentId || parsed.studentCode)) {
              codeToUse = parsed.studentId || parsed.studentCode;
            }
            if (parsed.studentCode) {
              studentCodeParam = parsed.studentCode;
            }
          } else if (!codeToUse && typeof stored === 'string') {
            codeToUse = stored;
          }
        } catch {
          if (!codeToUse) codeToUse = stored;
        }
      }
    } catch (e) {
      // ignore
    }

    if (codeToUse) {
      const ctx = await teacherService.getStudentFullContext(codeToUse, studentCodeParam);
      if (ctx) {
        setStudentContext(ctx);
        setLoginError(null);
      } else {
        setStudentContext(null);
      }
    } else {
      setStudentContext(null);
    }
    setIsLoadingStudent(false);
  }, [activeStudentCode]);

  React.useEffect(() => {
    refreshStudentContext();

    const handleUpdate = () => {
      refreshStudentContext();
    };

    window.addEventListener('rihlat_db_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('rihlat_settings_updated', handleUpdate);

    return () => {
      window.removeEventListener('rihlat_db_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('rihlat_settings_updated', handleUpdate);
    };
  }, [refreshStudentContext]);

  const handleLoginWithCode = async (code: string) => {
    if (!code || !code.trim()) {
      setLoginError('الرجاء إدخال كود الطالب (مثال: STU-101)');
      return;
    }
    const clean = code.trim();
    const ctx = await teacherService.getStudentFullContext(clean);
    if (ctx) {
      setActiveStudentCode(ctx.student.studentCode);
      setStudentContext(ctx);
      setLoginError(null);
    } else {
      setLoginError(`لم يتم العثور على طالب بالكود "${clean}". يرجى التأكد من الكود المعتمد لدى المعلم.`);
    }
  };

  const handleLogoutStudent = () => {
    setActiveStudentCode(null);
    setStudentContext(null);
    setSelectedBatchId('');
    setSelectedClassId('');
    setAvailableClasses([]);
    setLoginNameInput('');
    setLoginCodeInput('');
    setAmbiguousMatches(null);
    setLoginError(null);
    setActiveTab('home');
    try {
      localStorage.removeItem('rihlat_logged_student_code_v1');
    } catch (e) {
      // ignore
    }
    if (onLogout) {
      onLogout();
    }
  };

  // Derived Dynamic Profile from Authenticated Student
  const currentStudent: BatchStudent | null = studentContext?.student || null;
  if (currentStudent) {
    console.log('[DEBUG 6] Student object received by the Student App:', currentStudent);
  }
  const currentBatch: Batch | null = studentContext?.batch || null;
  const currentClass: BatchClass | null = studentContext?.classItem || null;
  const currentClub: BatchClub | null = studentContext?.clubItem || null;

  console.log('[TRACE YouthMainApp] studentContext?.student?.id:', studentContext?.student?.id);
  console.log('[TRACE YouthMainApp] studentContext?.student?.clubId:', studentContext?.student?.clubId);
  console.log('[TRACE YouthMainApp] studentContext?.student?.clubName:', studentContext?.student?.clubName);
  console.log('[TRACE YouthMainApp] studentContext?.clubItem:', studentContext?.clubItem);
  console.log('[TRACE YouthMainApp] currentClub:', currentClub);

  // Calculate actual approved challenge count from submissions or student record
  const approvedFromList = (studentContext?.challenges || []).filter((ch) => {
    return (studentContext?.submissions || []).some(
      (s) =>
        s.status === 'approved' &&
        (s.taskTitle === ch.title || s.sourceName === ch.title || (s as any).challengeId === ch.id)
    );
  }).length;

  const matchedSubIds = new Set<string>();
  (studentContext?.challenges || []).forEach((ch) => {
    (studentContext?.submissions || []).forEach((s) => {
      if (
        s.status === 'approved' &&
        (s.taskTitle === ch.title || s.sourceName === ch.title || (s as any).challengeId === ch.id)
      ) {
        matchedSubIds.add(s.id);
      }
    });
  });

  const unmatchedApprovedSubs = (studentContext?.submissions || []).filter(
    (s) =>
      s.status === 'approved' &&
      !matchedSubIds.has(s.id) &&
      (s.sourceType === 'challenge' || (!s.sourceType && s.sourceType !== 'club')) &&
      (s.studentId === currentStudent?.id ||
        (s.studentCode && currentStudent?.studentCode && s.studentCode === currentStudent.studentCode) ||
        (s.studentName && currentStudent?.name && s.studentName.trim() === currentStudent.name.trim()))
  ).length;

  const actualCompletedChallengesCount = approvedFromList + unmatchedApprovedSubs;

  // Dynamic Journey Metrics for Authenticated Student
  const currentJourneyMetrics: StudentJourneyMetrics = {
    id: currentStudent?.id || 'std-guest',
    name: currentStudent?.name || 'طالب رحلة القرآن',
    studentCode: currentStudent?.studentCode || 'STU-100',
    batchId: currentBatch?.id || currentStudent?.batchId,
    xp: currentStudent?.points || 0,
    points: currentStudent?.points || 0,
    attendanceRate: currentStudent?.attendanceRate || 0,
    completedChallengesCount: actualCompletedChallengesCount,
    clubTasksCompleted: currentStudent?.completedTasks || 0,
    clubAnnouncementsCount: 0,
    teacherEvaluationsCount: 0,
    libraryViewsCount: 0,
    specialRewardsCount: 0,
  };

  const dynamicJourneyResult = calculateStudentJourney(currentJourneyMetrics, currentBatch?.stations);
  const currentLevelIdx = dynamicJourneyResult.currentStationIndex;

  const userProfile = {
    name: currentStudent?.name || 'طالب مسجل',
    studentCode: currentStudent?.studentCode || 'STU-100',
    title: currentBatch ? `${currentBatch.name} • ${currentStudent?.className}` : 'حلقة القرآن الكريم',
    avatar: currentStudent?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    level: dynamicJourneyResult.currentStation.title,
    points: currentStudent?.points || 0,
    nextLevelPoints: dynamicJourneyResult.nextStation ? dynamicJourneyResult.nextStation.rewardPoints : dynamicJourneyResult.currentStation.rewardPoints + 1000,
    streakDays: currentStudent?.completedTasks || 0,
    badgesCount: studentContext?.unlockedAch?.length || 0,
    completedChallengesCount: actualCompletedChallengesCount,
  };

  React.useEffect(() => {
    if (currentStudent) {
      setEditNameInput(currentStudent.name || '');
      setEditAvatarInput(currentStudent.avatarUrl || '');
    }
  }, [currentStudent?.id, currentStudent?.name, currentStudent?.avatarUrl]);

  // Challenges State
  const [challengesCategoryTab, setChallengesCategoryTab] = useState<'daily' | 'weekly' | 'monthly' | 'completed'>('daily');
  const [challengesStatusFilter, setChallengesStatusFilter] = useState<'all' | 'not_started' | 'pending' | 'completed'>('all');
  const [selectedChallengeModal, setSelectedChallengeModal] = useState<Challenge | null>(null);
  const [studentSubmissionText, setStudentSubmissionText] = useState('');
  const [isSubmittingChallenge, setIsSubmittingChallenge] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  // Synchronize Challenges strictly from Student Context (Teacher-created)
  React.useEffect(() => {
    if (studentContext?.challenges && studentContext.challenges.length > 0) {
      const studentSubmissions = studentContext.submissions || [];
      const mappedFromTeacher: Challenge[] = studentContext.challenges.map((bCh: any) => {
        let cat: ChallengeCategory = 'daily';
        if (bCh.type?.includes('أسبوعي') || bCh.type?.includes('weekly')) cat = 'weekly';
        else if (bCh.type?.includes('شهري') || bCh.type?.includes('monthly')) cat = 'monthly';

        // Find student submission for this challenge
        const existingSub = studentSubmissions.find(
          (s) =>
            (s.studentId === currentStudent?.id ||
              (s.studentCode && s.studentCode === currentStudent?.studentCode) ||
              (s.studentName && s.studentName === currentStudent?.name)) &&
            (s.taskTitle === bCh.title || s.sourceName === bCh.title)
        );

        let subStatus = existingSub?.status || 'none';
        let challengeStatus: 'completed' | 'in_progress' | 'pending' | 'rejected' | 'available' | 'not_started' = 'not_started';

        if (subStatus === 'approved' || bCh.status === 'completed') {
          challengeStatus = 'completed';
        } else if (subStatus === 'pending') {
          challengeStatus = 'pending';
        } else if (subStatus === 'rejected') {
          challengeStatus = 'not_started';
        } else {
          challengeStatus = 'not_started';
        }

        const challengeItem: any = {
          id: bCh.id,
          title: bCh.title,
          description: bCh.description || `تحدي موجه لـ (${bCh.targetName || 'الجميع'}) • الموعد: ${bCh.dueDate || 'مستمر'}`,
          desc: bCh.description || `تحدي موجه لـ (${bCh.targetName || 'الجميع'}) • الموعد: ${bCh.dueDate || 'مستمر'}`,
          category: cat,
          difficulty: 'متوسط',
          xp_reward: bCh.rewardXp || bCh.xp || 100,
          gems_reward: 10,
          progress: challengeStatus === 'completed' ? 1 : 0,
          total_progress: 1,
          status: challengeStatus,
          submissionStatus: subStatus,
          submissionContent: existingSub?.contentSummary || '',
          active: true,
          due_date: bCh.dueDate,
          xp: bCh.rewardXp || bCh.xp || 100,
          points: bCh.rewardXp || bCh.points || 100,
          done: challengeStatus === 'completed',
          iconName: 'Trophy',
        };
        challengeService.registerChallenge(challengeItem);
        return challengeItem;
      });

      setChallenges(mappedFromTeacher);
    } else {
      setChallenges([]);
    }
  }, [studentContext, currentStudent]);

  const handleStudentSubmitChallenge = async (ch: any) => {
    if (!studentContext || !currentStudent) return;
    setIsSubmittingChallenge(true);
    const submittedText = studentSubmissionText.trim() || 'تم تنفيذ التحدي بنجاح';
    try {
      await teacherService.submitForReview({
        batchId: studentContext.batch.id,
        studentId: currentStudent.id,
        studentCode: currentStudent.studentCode,
        studentName: currentStudent.name,
        studentAvatar: currentStudent.avatarUrl || '👧',
        className: currentStudent.className,
        clubName: currentStudent.clubName,
        taskTitle: ch.title,
        sourceType: 'challenge',
        sourceName: ch.title,
        contentSummary: submittedText,
        rewardXp: ch.xp || ch.xp_reward || 50,
        challengeId: ch.id,
      });
      setToastMessage('🎉 تم إرسال إنجازك للمراجعة بنجاح!');
      setStudentSubmissionText('');
      setTimeout(() => setToastMessage(null), 3500);

      // Refresh student context
      if (activeStudentCode) {
        const updatedCtx = await teacherService.getStudentFullContext(activeStudentCode);
        if (updatedCtx) setStudentContext(updatedCtx);
      }

      // Update selected modal and local challenge status to pending
      setSelectedChallengeModal((prev: any) =>
        prev
          ? {
              ...prev,
              status: 'pending',
              submissionStatus: 'pending',
              submissionContent: submittedText,
            }
          : null
      );

      setChallenges((prev) =>
        prev.map((c) =>
          c.id === ch.id
            ? { ...c, status: 'pending' as any, submissionStatus: 'pending', submissionContent: submittedText }
            : c
        )
      );
    } catch (err) {
      console.error('Error submitting challenge:', err);
    } finally {
      setIsSubmittingChallenge(false);
    }
  };

  const toggleChallenge = async (id: string) => {
    try {
      const result = await challengeService.updateProgress(id, 1);
      
      if (result.challenge.status === 'locked') {
        setToastMessage(`🔒 هذا التحدي مغلق حالياً: ${result.challenge.unlock_req || 'أكمل التحديات السابقة لفتحه!'}`);
        setTimeout(() => setToastMessage(null), 3500);
        return;
      }

      if (!result.isNewlyCompleted && (result.challenge.status === 'completed' || result.challenge.done)) {
        setToastMessage(`✨ هذه المحطة مكتملة بالفعل في رحلتك! ("${result.challenge.title}")`);
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }

      setChallenges((prev) => prev.map((c) => (c.id === id ? result.challenge : c)));

      if (result.isNewlyCompleted && result.rewardEarned) {
        triggerConfetti();
        const earnedPoints = result.rewardEarned.points;
        if (currentBatch && currentStudent) {
          await teacherService.updateStudent(currentBatch.id, currentStudent.id, {
            completedChallengesCount: (currentStudent.completedChallengesCount || 0) + 1,
          });
          refreshStudentContext();
        }
        setToastMessage(`🌱 خطوة جديدة في رحلتك! أكملت "${result.challenge.title}" وحصلت على +${earnedPoints} نقطة 🚀`);
        setTimeout(() => setToastMessage(null), 3500);
      } else {
        const totalMax = result.challenge.total_progress || result.challenge.total || 1;
        setToastMessage(`🚶 تقدمت خطوة للأمام! تم إحراز تقدم في "${result.challenge.title}" (${result.challenge.progress}/${totalMax})`);
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      console.error('Error updating challenge:', err);
    }
  };

  const completeChallengeFully = async (id: string) => {
    try {
      const result = await challengeService.completeChallengeFully(id);
      
      if (result.isNewlyCompleted && result.rewardEarned) {
        setChallenges((prev) => prev.map((c) => (c.id === id ? result.challenge : c)));
        triggerConfetti();
        const earnedPoints = result.rewardEarned.points;
        if (currentBatch && currentStudent) {
          await teacherService.updateStudent(currentBatch.id, currentStudent.id, {
            completedChallengesCount: (currentStudent.completedChallengesCount || 0) + 1,
          });
          refreshStudentContext();
        }
        setToastMessage(`💚 كل تحدٍ يقربك من هدفك! أكملت "${result.challenge.title}" بالكامل وحصلت على +${earnedPoints} نقطة 🚀`);
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (err) {
      console.error('Error completing challenge:', err);
    }
  };

  // Dynamic Calculation of Statistics from Database Data
  const stats = challengeService.calculateStats(challenges);
  const dailyChallenges = challenges.filter((c) => c.category === 'daily' && c.active !== false);
  const weeklyChallenges = challenges.filter((c) => c.category === 'weekly' && c.active !== false);
  const monthlyChallenges = challenges.filter((c) => c.category === 'monthly' && c.active !== false);
  const completedChallenges = challenges.filter((c) => (c.status === 'completed' || c.done) && c.active !== false);

  const dailyDoneCount = stats.dailyCompleted;
  const weeklyDoneCount = stats.weeklyCompleted;
  const monthlyDoneCount = stats.monthlyCompleted;
  const dailyProgressPercent = stats.dailyProgressPercent;

  const currentLevel = dynamicJourneyResult.currentStation;

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.65 },
      colors: ['#0d9488', '#38bdf8', '#8b5cf6', '#f59e0b', '#10b981']
    });
  };

  // Student Authentication Gate
  if (!studentContext || !currentStudent) {
    return (
      <div className="min-h-screen bg-slate-900 text-white font-sans dir-rtl flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-teal-500 selection:text-white">
        <div className="w-full max-w-md space-y-6">
          {/* Top Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-3xl bg-teal-500/20 border border-teal-400/30 text-teal-300 flex items-center justify-center mx-auto shadow-2xl">
              <Compass className="w-8 h-8 text-teal-300" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">تسجيل دخول الطالب</h1>
            <p className="text-xs font-black text-teal-400 tracking-wide">استعد لرحلتك التالية</p>
            <p className="text-xs sm:text-sm text-slate-300 font-bold leading-relaxed px-2">
              أدخل اسمك الثلاثي وكود الطالب المخصص لك من معلمك للوصول إلى رحلتك التفاعلية.
            </p>
          </div>

          {/* Login Form Card */}
          <form onSubmit={handleLoginSubmit} className="bg-slate-800/90 border border-slate-700/80 rounded-[28px] p-6 shadow-2xl space-y-4 backdrop-blur-md">
            {/* 1. Batch Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-200 block">الدفعة / المسار</label>
              <select
                value={selectedBatchId}
                onChange={(e) => handleBatchChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-2xl px-4 py-3 text-sm font-black text-white focus:outline-none focus:border-teal-400 text-right cursor-pointer"
              >
                <option value="" className="bg-slate-900 text-slate-400">-- اختر الدفعة --</option>
                {availableBatches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Class Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-200 block">الحلقة / الفصل</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                disabled={!selectedBatchId}
                className="w-full bg-slate-900 border border-slate-600 rounded-2xl px-4 py-3 text-sm font-black text-white focus:outline-none focus:border-teal-400 text-right cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" className="bg-slate-900 text-slate-400">
                  {selectedBatchId ? '-- اختر الفصل --' : '-- اختر الدفعة أولاً --'}
                </option>
                {availableClasses.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Student Name Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-200 block">الاسم الثلاثي للطالب</label>
              <input
                type="text"
                value={loginNameInput}
                onChange={(e) => setLoginNameInput(e.target.value)}
                placeholder="مثال: أحمد محمد علي"
                className="w-full bg-slate-900 border border-slate-600 rounded-2xl px-4 py-3 text-sm font-black text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 text-right"
              />
            </div>

            {/* 4. Student Code Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-200 block">كود الطالب</label>
              <input
                type="text"
                value={loginCodeInput}
                onChange={(e) => setLoginCodeInput(e.target.value)}
                placeholder="مثال: 01"
                className="w-full bg-slate-900 border border-slate-600 rounded-2xl px-4 py-3 text-sm font-black text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 dir-ltr text-center tracking-wider"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>دخول الرحلة</span>
            </button>

            {loginError && (
              <p className="text-xs text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-center leading-relaxed">
                {loginError}
              </p>
            )}

            {ambiguousMatches && ambiguousMatches.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                <p className="text-xs font-black text-amber-300 text-center">
                  تم العثور على أكثر من طالب مطابق بنفس الاسم والكود، الرجاء اختيار فصلك للوصول لصفحتك:
                </p>
                <div className="space-y-2">
                  {ambiguousMatches.map((st) => (
                    <button
                      type="button"
                      key={st.id}
                      onClick={() => handleSelectSpecificStudent(st.id)}
                      className="w-full p-3 rounded-xl bg-slate-900 hover:bg-teal-900/40 border border-slate-700 hover:border-teal-400 transition-all text-right flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <span className="text-xs font-black text-white block">{st.name}</span>
                        <span className="text-[10px] text-teal-400 font-bold">
                          {st.batchName} • {st.className}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {onSwitchToTeacher && (
              <div className="pt-2 text-center border-t border-slate-700/50">
                <button
                  type="button"
                  onClick={onSwitchToTeacher}
                  className="text-xs font-bold text-teal-400 hover:text-teal-300 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>بوابة المعلم 👨‍🏫</span>
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen text-slate-800 font-sans dir-rtl selection:bg-[#14B8A6] selection:text-white pb-32 sm:pb-36 relative overflow-x-hidden bg-[#F3F6F8]"
    >
      {/* Soft Light Gray Page Background */}
      <div 
        className="fixed inset-0 pointer-events-none -z-10 bg-[#F3F6F8]" 
      />

      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#0F766E] text-white px-6 py-3.5 rounded-[18px] shadow-2xl border border-teal-500 font-bold text-xs sm:text-sm flex items-center gap-2.5"
          >
            <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Outer Shell Wrapper - Max Width 1100px */}
      <div className="max-w-[1100px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* 1. TOP HEADER ROW (Match attached image top row) */}
        <header className="flex items-center justify-between w-full dir-rtl bg-transparent py-2">
          {/* Notification Bell Button on Left (in RTL) */}
          <button 
            onClick={() => setShowNotificationModal(true)}
            className="w-12 h-12 rounded-2xl bg-white border border-[#E6ECEF] shadow-2xs hover:shadow-sm flex items-center justify-center text-slate-700 transition-all cursor-pointer relative shrink-0"
          >
            <Bell className="w-5 h-5 text-slate-700" />
            <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-[#0F766E] border-2 border-white shadow-2xs" />
          </button>

          {/* Greeting Text in Center/Right */}
          <div className="text-right flex-1 mx-4">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>مرحباً، {currentStudent.name}</span>
                <span className="text-xl">👋</span>
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-[#0F766E] border border-teal-200 font-mono text-[11px] font-bold dir-ltr">
                {currentStudent.studentCode}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-bold mt-0.5 flex items-center gap-2 flex-wrap">
              <span>محطة الرحلة الحالية: <strong className="text-[#0F766E]">{dynamicJourneyResult.currentStation.title}</strong></span>
              <span>•</span>
              <span>{currentBatch?.name} ({currentStudent.className})</span>
            </p>
          </div>

          {/* Student Avatar on Right (in RTL) + Student Switcher Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleLogoutStudent}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl border border-slate-200 transition-all items-center gap-1.5 cursor-pointer shadow-2xs flex"
              title="تبديل الطالب / الخروج"
            >
              <span>تبديل الطالب 🔄</span>
            </button>
            {onSwitchToTeacher && (
              <button 
                onClick={onSwitchToTeacher}
                className="hidden sm:flex px-3 py-1.5 bg-teal-50 text-[#0F766E] text-xs font-black rounded-xl border border-teal-200 hover:bg-teal-100 transition-all items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>بوابة المعلم ↺</span>
              </button>
            )}
            <div 
              onClick={() => setActiveTab('profile')}
              className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-[#0F766E] to-[#14B8A6] shadow-sm cursor-pointer shrink-0"
            >
              <img 
                src={userProfile.avatar} 
                alt={currentStudent.name} 
                className="w-full h-full object-cover rounded-full border-2 border-white" 
              />
            </div>
          </div>
        </header>

        {/* MAIN CONTENT BASED ON ACTIVE TAB */}
        {activeTab === 'home' && (() => {
          const nextLevel = dynamicJourneyResult.nextStation;

          return (
            <div className="space-y-6 dir-rtl">
              
              {/* 1. HERO JOURNEY LANDSCAPE BANNER CARD */}
              <div className="bg-white rounded-[24px] border border-[#E6ECEF] shadow-sm overflow-hidden">
                
                {/* Scenic Landscape Canvas Container */}
                <div className="relative w-full min-h-[380px] sm:min-h-[420px] bg-gradient-to-b from-sky-100/90 via-slate-50/80 to-emerald-50/90 p-4 sm:p-6 overflow-hidden flex flex-col justify-between select-none">
                  
                  {/* Soft Premium Atmospheric Landscape SVG (Subtle mountains, sky light & Islamic dome silhouette) */}
                  <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 1000 380" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="skyCanvasGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.85" />
                          <stop offset="50%" stopColor="#F0F9FF" stopOpacity="0.6" />
                          <stop offset="100%" stopColor="#ECFDF5" stopOpacity="0.9" />
                        </linearGradient>

                        <linearGradient id="farMountainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#0F766E" stopOpacity="0.08" />
                          <stop offset="100%" stopColor="#0F766E" stopOpacity="0.22" />
                        </linearGradient>

                        <linearGradient id="midMountainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.12" />
                          <stop offset="100%" stopColor="#059669" stopOpacity="0.28" />
                        </linearGradient>

                        <linearGradient id="pathProgressGlow" x1="100%" y1="0%" x2="0%" y2="0%">
                          <stop offset="0%" stopColor="#10B981" />
                          <stop offset="50%" stopColor="#0F766E" />
                          <stop offset="100%" stopColor="#14B8A6" />
                        </linearGradient>

                        <filter id="pathGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="4" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>

                      {/* Sky background rect */}
                      <rect width="1000" height="380" fill="url(#skyCanvasGrad)" />

                      {/* Soft Horizon Sun/Ambient Light */}
                      <circle cx="850" cy="110" r="140" fill="#FDE047" opacity="0.18" filter="blur(20px)" />

                      {/* Distant Mosque & Minaret Silhouette */}
                      <path d="M 830,170 C 850,125 890,125 910,170 L 910,250 L 830,250 Z" fill="#0F766E" opacity="0.08" />
                      <path d="M 865,110 L 875,110 L 870,90 Z" fill="#0F766E" opacity="0.1" />

                      {/* Layer 1: Distant Soft Blurred Mountain Peaks */}
                      <path d="M 0,220 Q 200,130 450,190 Q 700,140 1000,210 L 1000,380 L 0,380 Z" fill="url(#farMountainGrad)" filter="blur(1px)" />

                      {/* Layer 2: Rolling Foreground Green Slopes */}
                      <path d="M 0,270 Q 300,180 600,250 Q 820,190 1000,260 L 1000,380 L 0,380 Z" fill="url(#midMountainGrad)" />

                      {/* Layer 3: Smooth Winding Curved Path Base Track */}
                      <path 
                        d="M 880,220 C 820,105 770,105 720,105 C 660,105 610,230 560,230 C 500,230 460,95 410,95 C 350,95 300,220 250,220 C 190,220 140,105 90,105" 
                        stroke="#CBD5E1" 
                        strokeWidth="22" 
                        fill="none" 
                        strokeLinecap="round" 
                        opacity="0.65" 
                      />
                      <path 
                        d="M 880,220 C 820,105 770,105 720,105 C 660,105 610,230 560,230 C 500,230 460,95 410,95 C 350,95 300,220 250,220 C 190,220 140,105 90,105" 
                        stroke="#94A3B8" 
                        strokeWidth="3" 
                        fill="none" 
                        strokeLinecap="round" 
                        strokeDasharray="6 8" 
                        opacity="0.5" 
                      />

                      {/* Active Glowing Progress Path segments based on dynamic levelProgressRatio */}
                      {(() => {
                        const hopPaths = [
                          "M 880,220 C 820,105 770,105 720,105", // Hop 0: 0 -> 1
                          "M 720,105 C 660,105 610,230 560,230", // Hop 1: 1 -> 2
                          "M 560,230 C 500,230 460,95 410,95",   // Hop 2: 2 -> 3
                          "M 410,95 C 350,95 300,220 250,220",   // Hop 3: 3 -> 4
                          "M 250,220 C 190,220 140,105 90,105"    // Hop 4: 4 -> 5
                        ];

                        const progressRatio = dynamicJourneyResult.levelProgressRatio !== undefined 
                          ? dynamicJourneyResult.levelProgressRatio 
                          : (dynamicJourneyResult.journeyPercentage / 100);

                        return (
                          <g>
                            {hopPaths.map((pathD, hopIdx) => {
                              if (hopIdx < currentLevelIdx) {
                                return (
                                  <path 
                                    key={hopIdx}
                                    d={pathD} 
                                    stroke="url(#pathProgressGlow)" 
                                    strokeWidth="16" 
                                    fill="none" 
                                    strokeLinecap="round" 
                                    filter="url(#pathGlowFilter)"
                                  />
                                );
                              } else if (hopIdx === currentLevelIdx && progressRatio > 0) {
                                const strokePct = Math.min(100, Math.max(0, progressRatio * 100));
                                return (
                                  <path 
                                    key={hopIdx}
                                    d={pathD}
                                    pathLength="100"
                                    strokeDasharray={`${strokePct} 100`}
                                    stroke="url(#pathProgressGlow)" 
                                    strokeWidth="16" 
                                    fill="none" 
                                    strokeLinecap="round" 
                                    filter="url(#pathGlowFilter)"
                                  />
                                );
                              }
                              return null;
                            })}
                          </g>
                        );
                      })()}
                    </svg>
                  </div>

                  {/* Top Bar inside Landscape Canvas */}
                  <div className="relative z-10 flex items-center justify-between w-full">
                    {/* Top Bookmark Ribbon */}
                    <div className="bg-[#0F766E] text-white px-3.5 py-2.5 rounded-b-2xl shadow-md flex items-center justify-center border-t-0">
                      <Compass className="w-5 h-5 sm:w-6 sm:h-6 text-[#D4A017]" />
                    </div>

                    {/* Main Title Center */}
                    <div className="text-center space-y-0.5">
                      <h2 className="text-xl sm:text-2xl font-black text-[#0F766E] tracking-tight flex items-center justify-center gap-2">
                        <span className="text-[#14B8A6]">🌿</span>
                        <span>خريطة الرحلة</span>
                        <span className="text-[#14B8A6]">🌿</span>
                      </h2>
                      <p className="text-[11px] sm:text-xs font-bold text-slate-600">
                        واصل السير نحو القدوة والتأثير
                      </p>
                    </div>

                    <div className="w-10" />
                  </div>

                  {/* Winding Curved Journey Canvas Map */}
                  <div className="relative z-10 w-full max-w-4xl mx-auto h-[220px] sm:h-[250px] my-1 sm:my-2">
                    {(() => {
                      const hopControlPoints = [
                        { p0: { x: 880, y: 220 }, p1: { x: 820, y: 105 }, p2: { x: 770, y: 105 }, p3: { x: 720, y: 105 } },
                        { p0: { x: 720, y: 105 }, p1: { x: 660, y: 105 }, p2: { x: 610, y: 230 }, p3: { x: 560, y: 230 } },
                        { p0: { x: 560, y: 230 }, p1: { x: 500, y: 230 }, p2: { x: 460, y: 95 },  p3: { x: 410, y: 95 } },
                        { p0: { x: 410, y: 95 },  p1: { x: 350, y: 95 },  p2: { x: 300, y: 220 }, p3: { x: 250, y: 220 } },
                        { p0: { x: 250, y: 220 }, p1: { x: 190, y: 220 }, p2: { x: 140, y: 105 }, p3: { x: 90, y: 105 } },
                      ];

                      const getCubicBezierPoint = (
                        p0: { x: number; y: number },
                        p1: { x: number; y: number },
                        p2: { x: number; y: number },
                        p3: { x: number; y: number },
                        t: number
                      ) => {
                        const tc = Math.min(1, Math.max(0, t));
                        const mt = 1 - tc;
                        const mt2 = mt * mt;
                        const mt3 = mt2 * mt;
                        const t2 = tc * tc;
                        const t3 = t2 * tc;

                        return {
                          x: mt3 * p0.x + 3 * mt2 * tc * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
                          y: mt3 * p0.y + 3 * mt2 * tc * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
                        };
                      };

                      const levelRatio = dynamicJourneyResult.levelProgressRatio !== undefined 
                        ? dynamicJourneyResult.levelProgressRatio 
                        : (dynamicJourneyResult.journeyPercentage / 100);

                      let studentPosLeft = '88%';
                      let studentPosTop = '58%';

                      if (currentLevelIdx < hopControlPoints.length) {
                        const ctrl = hopControlPoints[currentLevelIdx];
                        const pt = getCubicBezierPoint(ctrl.p0, ctrl.p1, ctrl.p2, ctrl.p3, levelRatio);
                        studentPosLeft = `${(pt.x / 1000) * 100}%`;
                        studentPosTop = `${(pt.y / 380) * 100}%`;
                      } else {
                        studentPosLeft = '9%';
                        studentPosTop = '27.5%';
                      }

                      return (
                        <>
                          {/* Station Nodes */}
                          {dynamicJourneyResult.dynamicStations.map((lvl, idx) => {
                            const isCurrent = idx === currentLevelIdx;
                            const isCompleted = idx < currentLevelIdx;
                            const isLocked = idx > currentLevelIdx;

                            // Custom Station Node Configs
                            const stationConfigs = [
                              { icon: Sprout, label: lvl.title, colorGradient: 'from-emerald-500 to-teal-600', left: '88%', top: '58%' },
                              { icon: BookOpen, label: lvl.title, colorGradient: 'from-teal-600 to-cyan-600', left: '72%', top: '27.5%' },
                              { icon: Star, label: lvl.title, colorGradient: 'from-amber-500 to-orange-500', left: '56%', top: '60.5%' },
                              { icon: Gem, label: lvl.title, colorGradient: 'from-sky-500 to-blue-600', left: '41%', top: '25%' },
                              { icon: Sparkles, label: lvl.title, colorGradient: 'from-purple-500 to-indigo-600', left: '25%', top: '58%' },
                              { icon: Crown, label: lvl.title, colorGradient: 'from-amber-400 via-amber-500 to-yellow-600', left: '9%', top: '27.5%' }
                            ];

                            const st = stationConfigs[idx] || stationConfigs[0];
                            const StationIcon = st.icon;

                            return (
                              <div 
                                key={lvl.id} 
                                style={{ left: st.left, top: st.top }}
                                onClick={() => {
                                  setSelectedLevelModal(lvl);
                                }}
                                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer z-20"
                              >
                                {/* Station Circle Node */}
                                {isCurrent ? (
                                  <motion.div 
                                    animate={{ scale: [1, 1.06, 1] }}
                                    transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                                    className="relative flex items-center justify-center w-16 h-16 sm:w-22 sm:h-22 rounded-full bg-gradient-to-tr from-[#0F766E] via-teal-600 to-[#14B8A6] text-white shadow-2xl ring-4 ring-[#14B8A6] ring-offset-2 ring-offset-white shadow-teal-500/50"
                                  >
                                    <StationIcon className="w-8 h-8 sm:w-11 sm:h-11 text-white drop-shadow-md" />
                                  </motion.div>
                                ) : isCompleted ? (
                                  <div className="relative flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white text-[#0F766E] border-2 border-[#14B8A6] shadow-md hover:scale-110 transition-all">
                                    <StationIcon className="w-6 h-6 sm:w-8 sm:h-8 text-[#0F766E]" />
                                    
                                    {/* Completed Green Checkmark Overlay */}
                                    <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#14B8A6] text-white flex items-center justify-center border-2 border-white text-xs font-black shadow-sm z-20">
                                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="relative flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/90 text-slate-400 border-2 border-slate-300/80 shadow-2xs opacity-75 hover:opacity-100 hover:scale-105 transition-all backdrop-blur-xs">
                                    <StationIcon className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />

                                    {/* Locked Overlay */}
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center border-2 border-white text-xs shadow-2xs z-20">
                                      <Lock className="w-3 h-3" />
                                    </div>
                                  </div>
                                )}

                                {/* Station Name Label Pill */}
                                <span className={`text-[10px] sm:text-xs font-black px-2.5 py-0.5 mt-1 rounded-full shadow-2xs border transition-all whitespace-nowrap ${
                                  isCurrent 
                                    ? 'bg-white text-[#0F766E] border-[#0F766E] shadow-md font-extrabold scale-105' 
                                    : isCompleted
                                    ? 'bg-emerald-50/95 text-emerald-900 border-emerald-200'
                                    : 'bg-white/90 text-slate-500 border-slate-200'
                                }`}>
                                  {lvl.nameOnly}
                                </span>
                              </div>
                            );
                          })}

                          {/* Dynamic Active Student Position Marker on the Curved Path */}
                          <div 
                            style={{ left: studentPosLeft, top: studentPosTop }}
                            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-30 transition-all duration-300"
                          >
                            <motion.div 
                              animate={{ y: [-6, 2, -6] }}
                              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                              className="bg-[#0F766E] text-white text-[10px] sm:text-[11px] font-black px-3 py-1 rounded-full shadow-xl border-2 border-white whitespace-nowrap flex items-center gap-1.5"
                            >
                              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping shrink-0" />
                              <span>أنت هنا 🏃‍♂️</span>
                            </motion.div>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                </div>

                {/* Hero Card Attached Bottom Sub-Row */}
                <div className="p-4 sm:p-5 bg-white border-t border-[#E6ECEF]">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-center">
                    
                    {/* Box 1: Start Challenges CTA Button */}
                    <button 
                      onClick={() => setActiveTab('challenges')}
                      className="w-full bg-gradient-to-r from-[#0F766E] to-[#14B8A6] text-white p-3.5 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-between cursor-pointer group"
                    >
                      <div className="text-right">
                        <h4 className="text-sm sm:text-base font-black">ابدأ التحديات</h4>
                        <span className="text-[11px] text-teal-100 font-bold block mt-0.5">وتقدم في رحلتك</span>
                      </div>
                      <div className="w-9 h-9 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-white group-hover:scale-110 transition-all shrink-0">
                        <Target className="w-5 h-5" />
                      </div>
                    </button>

                    {/* Box 2: متبقي لك للوصول إلى المستوى التالي */}
                    {(() => {
                      const currentXP = dynamicJourneyResult.totalWeightedScore;
                      const currentLevelThreshold = dynamicJourneyResult.currentLevelThreshold || 0;
                      const nextLevelThreshold = dynamicJourneyResult.nextLevelThreshold || 0;
                      const hasNextLevel = dynamicJourneyResult.nextStation !== null && nextLevelThreshold > currentLevelThreshold;
                      const remainingXP = hasNextLevel ? Math.max(0, nextLevelThreshold - currentXP) : 0;
                      const levelProgressPercent = dynamicJourneyResult.journeyPercentage;

                      return (
                        <div className="bg-[#F3F6F8] p-3.5 rounded-2xl border border-[#E6ECEF] flex items-center justify-between">
                          <div className="text-right flex-1">
                            <span className="text-xs font-bold text-slate-500 block">متبقي لك للوصول إلى المستوى التالي</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm sm:text-base font-black text-[#0F766E]">
                                {hasNextLevel ? `متبقي ${remainingXP} نقطة` : 'وصلت إلى أعلى مستوى 👑'}
                              </span>
                              <span className="text-[10px] font-black bg-teal-100 text-[#0F766E] px-2 py-0.5 rounded-full border border-teal-200 shrink-0">
                                {hasNextLevel ? `التقدم ${levelProgressPercent}%` : '100%'}
                              </span>
                            </div>
                          </div>
                          <div className="w-9 h-9 rounded-2xl bg-teal-50 text-[#0F766E] border border-teal-200 flex items-center justify-center shrink-0 me-2">
                            <TrendingUp className="w-5 h-5" />
                          </div>
                        </div>
                      );
                    })()}

                    {/* Box 3: المحطة القادمة */}
                    <div className="bg-[#F3F6F8] p-3.5 rounded-2xl border border-[#E6ECEF] flex items-center justify-between">
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-500 block">المحطة القادمة</span>
                        <span className="text-sm sm:text-base font-black text-slate-800 block mt-0.5">{nextLevel ? nextLevel.nameOnly : 'أعلى مستوى 👑'}</span>
                      </div>
                      <div className="w-9 h-9 rounded-2xl bg-teal-50 text-[#0F766E] border border-teal-200 flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5" />
                      </div>
                    </div>

                  </div>
                </div>

              </div>

              {/* 2. GRID OF METRIC CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Card 1: تقدمي في المستوى الحالي */}
                <div className="bg-white rounded-[24px] p-5 border border-[#E6ECEF] shadow-xs flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-slate-800">تقدمي في المستوى الحالي</span>
                    <TrendingUp className="w-5 h-5 text-[#0F766E]" />
                  </div>

                  {/* Circular Progress Gauge */}
                  <div className="flex flex-col items-center justify-center py-2">
                    <div className="relative w-20 h-20 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-slate-100"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-[#0F766E]"
                          strokeDasharray={`${isNaN(dynamicJourneyResult.journeyPercentage) ? 0 : dynamicJourneyResult.journeyPercentage}, 100`}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <span className="absolute text-lg font-black text-slate-900">{dynamicJourneyResult.journeyPercentage}%</span>
                    </div>
                    <span className="text-xs font-bold text-slate-500 mt-2 text-center">
                      {dynamicJourneyResult.journeyPercentage === 0 ? 'ابدأ رحلتك المتميزة اليوم!' : 'أنت في الطريق، استمر!'}
                    </span>
                  </div>

                  <button 
                    onClick={() => setActiveTab('challenges')}
                    className="w-full py-2.5 rounded-xl bg-[#F3F6F8] hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>عرض التحديات</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>

                {/* Card 2: إجمالي النقاط */}
                <div className="bg-white rounded-[24px] p-5 border border-[#E6ECEF] shadow-xs flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-slate-800">إجمالي النقاط (XP)</span>
                    <Footprints className="w-5 h-5 text-[#0F766E]" />
                  </div>

                  <div className="flex flex-col py-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900">{dynamicJourneyResult.totalWeightedScore}</span>
                      <span className="text-xs font-bold text-slate-500">نقطة خبرة</span>
                    </div>
                    <span className="text-xs text-slate-400 font-bold mt-1">محسوبة من التحديات والاعتمادات الرسمية</span>
                  </div>

                  <button 
                    onClick={() => setActiveTab('challenges')}
                    className="w-full py-2.5 rounded-xl bg-[#F3F6F8] hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>عرض التحديات</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>

              </div>

              {/* 3. CURRENT STATION PROGRESS CARD */}
              <div className="bg-white rounded-[24px] p-5 border border-[#E6ECEF] shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Landmark Illustration & Current Station Title */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0F766E] shrink-0 text-2xl font-black">
                    {dynamicJourneyResult.currentStation.emoji || '🌱'}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-500 block">المحطة الحالية</span>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-1.5 mt-0.5">
                      <span>{dynamicJourneyResult.currentStation.title}</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-bold mt-1">
                      أكمل التحديات واجمع النقاط لترتقي للمحطة التالية
                    </p>
                  </div>
                </div>

                {/* Progress Bar & CTA */}
                <div className="w-full md:w-72 space-y-2">
                  <div className="flex items-center justify-between text-xs font-black">
                    <span className="text-slate-700">تقدمك في هذه المحطة</span>
                    <span className="text-[#0F766E]">{dynamicJourneyResult.journeyPercentage}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#0F766E] to-[#14B8A6] rounded-full transition-all duration-500" 
                      style={{ width: `${dynamicJourneyResult.journeyPercentage}%` }}
                    />
                  </div>
                  <button 
                    onClick={() => setActiveTab('challenges')}
                    className="w-full mt-2 py-2.5 rounded-xl bg-[#0F766E] hover:bg-teal-800 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <span>عرض التحديات</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 4. TEACHER MESSAGE BANNER */}
              {(() => {
                const messages = studentContext?.announcements || [];
                const latestMsg = messages[0];
                const isRead = latestMsg?.readBy?.includes(currentStudent?.id || '');

                return (
                  <div className="bg-[#0F766E] text-white rounded-[24px] p-5 shadow-xs border border-teal-700 space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-teal-100">
                          <Mail className="w-4 h-4 text-teal-100" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-black text-[#D4A017]">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>رسالة المعلم</span>
                            {latestMsg && latestMsg.targetName && (
                              <span className="text-[10px] font-bold text-teal-200 bg-white/10 px-2 py-0.5 rounded-md">
                                {latestMsg.targetName}
                              </span>
                            )}
                          </div>
                          {latestMsg && (
                            <span className="text-[10px] font-bold text-teal-200/80 block">
                              {latestMsg.createdAt} • بقلم: {latestMsg.author || 'المعلم'}
                            </span>
                          )}
                        </div>
                      </div>

                      {latestMsg && (
                        <div>
                          {!isRead ? (
                            <span className="px-2.5 py-1 rounded-full bg-amber-400 text-amber-950 font-black text-[10px] animate-pulse">
                              رسالة جديدة 📩
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-teal-800 text-teal-200 font-bold text-[10px]">
                              تمت القراءة ✓
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {latestMsg ? (
                      <p className="text-xs sm:text-sm font-bold leading-relaxed text-teal-50 bg-teal-800/40 p-3.5 rounded-2xl border border-teal-600/50">
                        {latestMsg.content}
                      </p>
                    ) : (
                      <p className="text-xs font-bold leading-relaxed text-teal-100/90 bg-teal-800/20 p-3 rounded-2xl border border-teal-600/30">
                        لا توجد رسائل جديدة من المعلم حالياً. واصل الاجتهاد والتفوق! 🌸
                      </p>
                    )}

                    {latestMsg && (
                      <div className="flex items-center justify-between pt-1 border-t border-teal-600/40 text-xs">
                        {!isRead && currentStudent ? (
                          <button
                            onClick={async () => {
                              await teacherService.markMessageAsRead(latestMsg.id, currentStudent.id);
                              refreshStudentContext();
                            }}
                            className="px-3 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-teal-100 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-all border border-teal-600"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>تأكيد القراءة</span>
                          </button>
                        ) : <div />}

                        {messages.length > 1 && (
                          <button
                            onClick={() => setIsAllMessagesModalOpen(true)}
                            className="text-[11px] font-bold text-teal-200 hover:text-white underline cursor-pointer"
                          >
                            عرض سجل كل الرسائل ({messages.length}) ←
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

            </div>
          );
        })()}

        {/* ================= TAB 2: CHALLENGES VIEW ================= */}
        {activeTab === 'challenges' && (() => {
          const featuredChallenge = challenges.find((c) => c.isFeatured) || challenges[0];

          // Filter challenges based on Category Tabs and Status Filters
          const filteredList = challenges.filter((c) => {
            // Category Tab Filter
            if (challengesCategoryTab === 'daily' && c.category !== 'daily') return false;
            if (challengesCategoryTab === 'weekly' && c.category !== 'weekly') return false;
            if (challengesCategoryTab === 'monthly' && c.category !== 'monthly') return false;
            if (challengesCategoryTab === 'completed' && c.status !== 'completed' && !c.done) return false;

            // Status Filter
            if (challengesStatusFilter === 'not_started' && (c.status !== 'not_started' && c.status !== 'available' && c.status !== 'new')) return false;
            if (challengesStatusFilter === 'pending' && c.status !== 'pending') return false;
            if (challengesStatusFilter === 'completed' && c.status !== 'completed' && !c.done) return false;

            return true;
          });

          // Counts for top status filter badges
          const notStartedCount = challenges.filter(c => c.status === 'not_started' || c.status === 'available' || c.status === 'new').length;
          const pendingCount = challenges.filter(c => c.status === 'pending').length;
          const completedCount = challenges.filter(c => c.status === 'completed' || c.done).length;

          return (
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-8"
            >
              {/* 1. INSPIRING MOTIVATIONAL HEADER */}
              <div className="rounded-[28px] bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 shadow-[0_12px_40px_rgba(15,23,42,0.12)] border border-slate-700/80 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-[#14B8A6]/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#14B8A6]/20 text-[#2DD4BF] border border-teal-400/30 font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-xs">
                        <Sparkles className="w-4 h-4 text-[#2DD4BF]" />
                        <span>+{userProfile.points} نقطة إجمالية</span>
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 font-bold bg-white/10 px-3.5 py-1.5 rounded-full border border-white/15">
                      مستوى التفاعل: ممتاز 🌟
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl sm:text-[32px] font-bold text-white tracking-tight leading-tight flex items-center gap-2">
                      <span>⚡ تحديات اليوم والأسبوع والشهر</span>
                    </h2>
                  </div>

                  {/* Overall Daily Progress Bar */}
                  <div className="bg-white/10 backdrop-blur-md rounded-[20px] p-4 border border-white/15 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-200">إنجاز اليوم: {dailyDoneCount} من {dailyChallenges.length} تحديات اليومية</span>
                      <span className="text-[#2DD4BF] font-mono">{dailyProgressPercent}% مكتمل</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden p-0.5 border border-white/20">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${dailyProgressPercent}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-[#2DD4BF] to-emerald-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. LARGE FEATURED "TODAY'S CHALLENGE" CARD */}
              {featuredChallenge && (
                <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-800 to-[#0F172A] text-white p-6 sm:p-8 shadow-[0_16px_48px_rgba(15,23,42,0.18)] border border-teal-500/30 relative overflow-hidden cursor-pointer"
                  onClick={() => setSelectedChallengeModal(featuredChallenge)}
                >
                  <div className="absolute top-0 right-0 w-80 h-80 bg-[#14B8A6]/20 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <span className="bg-[#14B8A6]/25 text-[#2DD4BF] border border-teal-400/40 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-xs">
                        <Zap className="w-4 h-4 fill-[#2DD4BF]" />
                        <span>🔥 تحدي اليوم الرئيسي • FEATURED CHALLENGE</span>
                      </span>

                      {featuredChallenge.timeLeft && (
                        <span className="bg-white/10 text-slate-200 px-3.5 py-1.5 rounded-full text-xs font-bold border border-white/15 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>ينتهي خلال: {featuredChallenge.timeLeft}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-3 max-w-xl">
                        <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                          {featuredChallenge.title}
                        </h3>
                        <p className="text-slate-300 text-xs sm:text-sm font-bold leading-relaxed">
                          {featuredChallenge.desc}
                        </p>

                        <div className="flex items-center gap-2.5 pt-1">
                          <span className="bg-purple-500/20 text-purple-300 border border-purple-400/30 px-3.5 py-1.5 rounded-full text-xs font-bold font-mono flex items-center gap-1.5">
                            <span>✨ +{featuredChallenge.xp} XP</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row md:flex-col items-center gap-4 bg-white/5 backdrop-blur-md p-5 rounded-[24px] border border-white/12 shrink-0">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${
                            featuredChallenge.status === 'completed' || featuredChallenge.done
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : (featuredChallenge as any).status === 'pending'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-teal-500/20 text-[#2DD4BF] border border-teal-500/30'
                          }`}>
                            {featuredChallenge.status === 'completed' || featuredChallenge.done ? (
                              <CheckCircle2 className="w-6 h-6" />
                            ) : (featuredChallenge as any).status === 'pending' ? (
                              <Clock className="w-6 h-6" />
                            ) : (
                              <Target className="w-6 h-6" />
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-slate-400 font-bold block">حالة التحدي</span>
                            <span className="text-sm font-bold text-white">
                              {featuredChallenge.status === 'completed' || featuredChallenge.done
                                ? 'منجزة ✓'
                                : (featuredChallenge as any).status === 'pending'
                                  ? 'معلقة ⏳'
                                  : 'لم تبدأ بعد 📌'}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedChallengeModal(featuredChallenge);
                          }}
                          className={`w-full px-7 py-3 rounded-[18px] font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 group ${
                            featuredChallenge.status === 'completed' || featuredChallenge.done
                              ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                              : (featuredChallenge as any).status === 'pending'
                                ? 'bg-amber-500 text-white shadow-amber-500/20'
                                : 'bg-gradient-to-r from-[#14B8A6] to-emerald-500 hover:from-teal-500 hover:to-emerald-600 text-white shadow-teal-500/25'
                          }`}
                        >
                          <span>
                            {featuredChallenge.status === 'completed' || featuredChallenge.done 
                              ? 'عرض الإنجاز ✓' 
                              : (featuredChallenge as any).status === 'pending'
                                ? 'عرض الحالة ⏳'
                                : 'تسليم الحل ➔'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 3. THREE STATS METRIC CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <motion.div 
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => setChallengesCategoryTab('daily')}
                  className={`rounded-[28px] p-[24px] h-[170px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border flex flex-col justify-between text-center transition-all cursor-pointer ${
                    challengesCategoryTab === 'daily' ? 'bg-teal-50/80 border-[#14B8A6]/40 ring-2 ring-[#14B8A6]/20' : 'bg-white border-[#EEF2F7]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold px-1">
                    <span className="text-[#14B8A6]">اليومية</span>
                    <span className="text-slate-900">تحديات اليوم</span>
                  </div>

                  <div className="flex flex-col items-center justify-center flex-1">
                    <div className="w-[44px] h-[44px] rounded-[18px] bg-teal-50 text-[#14B8A6] flex items-center justify-center mb-1 shadow-xs">
                      <Zap className="w-5 h-5 fill-[#14B8A6]" />
                    </div>
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">{dailyDoneCount} / {dailyChallenges.length}</span>
                    <span className="text-xs font-bold text-[#6B7280]">تحديات مكتملة</span>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => setChallengesCategoryTab('weekly')}
                  className={`rounded-[28px] p-[24px] h-[170px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border flex flex-col justify-between text-center transition-all cursor-pointer ${
                    challengesCategoryTab === 'weekly' ? 'bg-purple-50/80 border-purple-400/40 ring-2 ring-purple-500/20' : 'bg-white border-[#EEF2F7]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold px-1">
                    <span className="text-purple-600">الأسبوعية</span>
                    <span className="text-slate-900">المهمات الكبرى</span>
                  </div>

                  <div className="flex flex-col items-center justify-center flex-1">
                    <div className="w-[44px] h-[44px] rounded-[18px] bg-purple-50 text-purple-600 flex items-center justify-center mb-1 shadow-xs">
                      <Trophy className="w-5 h-5 fill-purple-500" />
                    </div>
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">{weeklyDoneCount} / {weeklyChallenges.length}</span>
                    <span className="text-xs font-bold text-[#6B7280]">مهمات كبرى مكتملة</span>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => setChallengesCategoryTab('monthly')}
                  className={`rounded-[28px] p-[24px] h-[170px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border flex flex-col justify-between text-center transition-all cursor-pointer ${
                    challengesCategoryTab === 'monthly' ? 'bg-amber-50/80 border-amber-400/40 ring-2 ring-amber-500/20' : 'bg-white border-[#EEF2F7]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold px-1">
                    <span className="text-amber-600">الشهرية</span>
                    <span className="text-slate-900">تحديات الشهر</span>
                  </div>

                  <div className="flex flex-col items-center justify-center flex-1">
                    <div className="w-[44px] h-[44px] rounded-[18px] bg-amber-50 text-amber-500 flex items-center justify-center mb-1 shadow-xs">
                      <Crown className="w-5 h-5 fill-amber-500" />
                    </div>
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">{monthlyDoneCount} / {monthlyChallenges.length}</span>
                    <span className="text-xs font-bold text-[#6B7280]">تحديات شهرية مكتملة</span>
                  </div>
                </motion.div>
              </div>

              {/* 4. CATEGORY TABS (اليومية - الأسبوعية - الشهرية - المكتملة) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#14B8A6]" />
                    <span>فئات التحديات:</span>
                  </h3>
                </div>

                <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    { id: 'daily', label: 'اليومية ⚡', count: dailyChallenges.length },
                    { id: 'weekly', label: 'الأسبوعية 🏆', count: weeklyChallenges.length },
                    { id: 'monthly', label: 'الشهرية 🌙', count: monthlyChallenges.length },
                    { id: 'completed', label: 'المكتملة ✓', count: completedChallenges.length },
                  ].map((tab) => {
                    const isActive = challengesCategoryTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setChallengesCategoryTab(tab.id as any)}
                        className={`rounded-[18px] px-5 py-2.5 font-bold text-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                          isActive
                            ? 'bg-gradient-to-r from-[#14B8A6] to-emerald-600 text-white shadow-md'
                            : 'bg-white border border-[#EEF2F7] text-slate-600 hover:bg-[#ECFDF5]'
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. STATUS FILTERS (الكل - لم تبدأ بعد - معلقة - منجزة) */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none bg-slate-100/70 p-1.5 rounded-[20px] border border-slate-200/60">
                {[
                  { id: 'all', label: 'الكل', count: challenges.length },
                  { id: 'not_started', label: 'لم تبدأ بعد 📌', count: notStartedCount },
                  { id: 'pending', label: 'معلقة ⏳', count: pendingCount },
                  { id: 'completed', label: 'منجزة ✓', count: completedCount },
                ].map((filter) => {
                  const isActive = challengesStatusFilter === filter.id;
                  return (
                    <button
                      key={filter.id}
                      onClick={() => setChallengesStatusFilter(filter.id as any)}
                      className={`flex-1 min-w-[90px] py-1.5 px-3 rounded-[14px] text-xs font-bold transition-all cursor-pointer text-center whitespace-nowrap flex items-center justify-center gap-1.5 ${
                        isActive
                          ? 'bg-white text-[#14B8A6] shadow-sm font-extrabold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>{filter.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive ? 'bg-[#14B8A6]/15 text-[#14B8A6]' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {filter.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* 6. CHALLENGES LIST WITH CARDS & INTERACTIONS */}
              <div className="space-y-4">
                {filteredList.length === 0 ? (
                  <div className="bg-white rounded-[28px] p-8 text-center border border-[#EEF2F7] space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Target className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-extrabold text-slate-600">لا توجد تحديات متاحة حالياً.</p>
                  </div>
                ) : (
                  filteredList.map((challenge) => {
                    const isCompleted = challenge.status === 'completed' || challenge.done;
                    const isPending = challenge.status === 'pending';
                    const isNotStarted = !isCompleted && !isPending;

                    return (
                      <motion.div
                        key={challenge.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -2 }}
                        transition={{ duration: 0.25 }}
                        onClick={() => setSelectedChallengeModal(challenge)}
                        className={`rounded-[28px] p-[24px] shadow-[0_12px_40px_rgba(15,23,42,0.06)] border transition-all cursor-pointer ${
                          isCompleted
                            ? 'bg-emerald-50/40 border-emerald-200/80'
                            : isPending
                              ? 'bg-amber-50/40 border-amber-200/80'
                              : 'bg-white border-[#EEF2F7] hover:border-teal-300/80 hover:shadow-lg'
                        }`}
                      >
                        <div className="space-y-4">
                          {/* Top Badges Row */}
                          <div className="flex items-center justify-between text-xs font-bold">
                            <div className="flex items-center gap-2">
                              {/* 3 Explicit Statuses: منجزة, معلقة, لم تبدأ بعد */}
                              {isCompleted ? (
                                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300/60 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>منجزة ✓</span>
                                </span>
                              ) : isPending ? (
                                <span className="bg-amber-100 text-amber-800 border border-amber-300/60 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                                  <span>معلقة ⏳</span>
                                </span>
                              ) : (
                                <span className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1">
                                  <Target className="w-3.5 h-3.5 text-slate-500" />
                                  <span>لم تبدأ بعد 📌</span>
                                </span>
                              )}

                              <span className="bg-slate-100 text-[#6B7280] px-3 py-1 rounded-full text-[11px] font-bold">
                                {challenge.category === 'daily' ? 'يومي' : challenge.category === 'weekly' ? 'أسبوعي' : 'شهري'} • {challenge.difficulty}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[#6B7280] text-[11px]">
                              {isCompleted ? (
                                <span className="text-emerald-600 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>مكتمل</span>
                                </span>
                              ) : isPending ? (
                                <span className="text-amber-600 font-bold flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>قيد المراجعة</span>
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-slate-500">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{challenge.due_date ? `الموعد: ${challenge.due_date}` : 'متاح'}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Content Header & Icon */}
                          <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center shrink-0 shadow-xs ${
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-700'
                                : isPending
                                  ? 'bg-amber-100 text-amber-700'
                                  : challenge.category === 'daily'
                                    ? 'bg-teal-50 text-[#14B8A6]'
                                    : 'bg-purple-50 text-purple-600'
                            }`}>
                              {renderChallengeIcon(challenge.iconName || 'Sparkles', 'w-6 h-6')}
                            </div>

                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                                  {challenge.title}
                                </h3>
                                
                                {/* Points Badge */}
                                <div className="flex items-center gap-2">
                                  <span className="bg-purple-50 text-purple-800 border border-purple-200/80 px-3 py-1 rounded-full text-xs font-bold font-mono flex items-center gap-1">
                                    <span>✨ +{challenge.xp || 50} XP</span>
                                  </span>
                                </div>
                              </div>

                              <p className="text-xs font-bold leading-relaxed text-[#6B7280]">
                                {challenge.desc}
                              </p>
                            </div>
                          </div>

                          {/* Simplified Action Footer */}
                          <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between gap-3">
                            <span className="text-xs font-bold text-slate-500">
                              {isCompleted 
                                ? '🎉 تم إنجاز التحدي واعتماده'
                                : isPending
                                  ? '⏳ إنجازك قيد مراجعة المعلم'
                                  : 'اضغط لعرض التفاصيل وتسليم الإنجاز'}
                            </span>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedChallengeModal(challenge);
                              }}
                              className={`px-4 py-2 rounded-[16px] font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                                isCompleted
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : isPending
                                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                    : 'bg-[#14B8A6] hover:bg-teal-700 text-white'
                              }`}
                            >
                              <span>{isCompleted ? 'عرض الإنجاز' : isPending ? 'عرض الحالة' : 'تسليم الحل'}</span>
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          );
        })()}

        {/* ================= TAB: CLUB VIEW (النادي) ================= */}
        {activeTab === 'club' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ClubPage
              currentClub={currentClub}
              batch={currentBatch}
              allBatchStudents={studentContext?.allBatchStudents || []}
              studentChallenges={studentContext?.challenges || []}
              studentSubmissions={studentContext?.submissions || []}
              studentId={currentStudent?.id || ''}
              studentName={currentStudent?.name || ''}
              studentCode={currentStudent?.studentCode || ''}
              className={currentStudent?.className || ''}
              refreshContext={refreshStudentContext}
              debugInfo={studentContext?.debugInfo}
              studentContext={studentContext}
              onRewardEarned={async (earnedXp) => {
                if (currentBatch && currentStudent) {
                  await teacherService.updateStudent(currentBatch.id, currentStudent.id, {
                    completedTasks: (currentStudent.completedTasks || 0) + 1,
                  });
                  refreshStudentContext();
                }
              }}
              triggerConfetti={triggerConfetti}
            />
          </motion.div>
        )}

        {/* ================= TAB 3.8: STUDENT LIBRARY VIEW (NETFLIX STYLE) ================= */}
        {activeTab === 'library' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <StudentLibraryView
              studentBatchId={studentContext?.batch?.id}
              studentBatchName={studentContext?.batch?.name}
              studentClassId={studentContext?.student?.classId}
              studentClassName={studentContext?.student?.className}
              studentClubId={studentContext?.student?.clubId}
              studentClubName={studentContext?.student?.clubName}
              studentId={studentContext?.student?.id}
              studentCode={studentContext?.student?.studentCode}
              studentName={studentContext?.student?.name}
            />
          </motion.div>
        )}

        {/* ================= TAB 4: PROFILE VIEW ================= */}
        {activeTab === 'profile' && (
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-8"
          >
            {/* 1. PROFILE HEADER CARD (بطاقة الملف الشخصي) */}
            <div className="rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 shadow-[0_16px_48px_rgba(15,23,42,0.18)] border border-slate-700/80 relative overflow-hidden">
              {/* Background ambient lighting */}
              <div className="absolute top-0 right-0 w-72 h-72 bg-[#14B8A6]/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-6">
                {/* Top Badges / Edit Trigger */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <span className="bg-[#14B8A6]/20 text-[#2DD4BF] border border-teal-400/30 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#2DD4BF]" />
                    <span>حساب الطالب المتميز</span>
                  </span>

                  <button
                    onClick={() => setIsEditProfileOpen(true)}
                    className="bg-white/10 hover:bg-white/20 text-slate-200 border border-white/15 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>تعديل الملف</span>
                  </button>
                </div>

                {/* Avatar + Main Info */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-right gap-6">
                  {/* Avatar Container with Glow Ring */}
                  <div className="relative shrink-0 group cursor-pointer" onClick={() => setIsEditProfileOpen(true)}>
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-[#2DD4BF] p-0.5 shadow-[0_0_25px_rgba(45,212,191,0.35)] transition-transform duration-300 group-hover:scale-105 flex items-center justify-center bg-slate-800 text-teal-300 font-bold text-3xl">
                      {userProfile.avatar ? (
                        <img 
                          src={userProfile.avatar} 
                          alt={userProfile.name} 
                          className="w-full h-full object-cover rounded-full" 
                        />
                      ) : (
                        <span>{userProfile.name ? userProfile.name.charAt(0) : 'ط'}</span>
                      )}
                    </div>
                    <div className="absolute bottom-1 right-1 bg-[#14B8A6] text-white p-1.5 rounded-full border-2 border-slate-900 shadow-md">
                      <Star className="w-3.5 h-3.5 fill-white" />
                    </div>
                  </div>

                  {/* User Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        {userProfile.name}
                      </h2>
                      <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 px-3 py-1 rounded-full text-xs font-bold font-mono">
                        {userProfile.points.toLocaleString()} 💎
                      </span>
                    </div>

                    <p className="text-slate-300 text-xs sm:text-sm font-bold">
                      {userProfile.title}
                    </p>

                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 text-xs font-bold text-teal-300">
                      <span>🌟 {userProfile.level}</span>
                    </div>
                  </div>
                </div>

                {/* Level Progress Bar */}
                <div className="bg-white/10 backdrop-blur-md rounded-[22px] p-4 border border-white/15 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-200">
                      التقدم للمستوى التالي ({dynamicJourneyResult.nextStation ? dynamicJourneyResult.nextStation.title : 'أعلى مستوى 👑'})
                    </span>
                    <span className="text-[#2DD4BF] font-mono">
                      {userProfile.points} / {userProfile.nextLevelPoints} XP ({dynamicJourneyResult.journeyPercentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden p-0.5 border border-white/20">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${dynamicJourneyResult.journeyPercentage}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-[#2DD4BF] via-emerald-400 to-amber-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. STATS (الإحصائيات الحقيقية فقط) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Stat 1: Total Points */}
              <motion.div 
                whileHover={{ y: -4 }}
                transition={{ duration: 0.25 }}
                className="rounded-[24px] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-[#EEF2F7] flex flex-col justify-between text-center transition-all"
              >
                <div className="w-11 h-11 rounded-[16px] bg-teal-50 text-[#14B8A6] flex items-center justify-center mx-auto mb-2 shadow-xs">
                  <Sparkles className="w-5 h-5 fill-[#14B8A6]" />
                </div>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                  {userProfile.points}
                </span>
                <span className="text-xs font-bold text-[#6B7280] mt-1">إجمالي النقاط 💎</span>
              </motion.div>

              {/* Stat 2: Completed Challenges */}
              <motion.div 
                whileHover={{ y: -4 }}
                transition={{ duration: 0.25 }}
                className="rounded-[24px] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-[#EEF2F7] flex flex-col justify-between text-center transition-all"
              >
                <div className="w-11 h-11 rounded-[16px] bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 shadow-xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                  {userProfile.completedChallengesCount}
                </span>
                <span className="text-xs font-bold text-[#6B7280] mt-1">التحديات المكتملة 📖</span>
              </motion.div>
            </div>

            {/* 3. RECENT ACTIVITY (النشاط الأخير - البيانات الحقيقية فقط) */}
            {(() => {
              const studentSubs = (studentContext?.submissions || []).filter(
                (s: any) =>
                  s.studentId === currentStudent?.id ||
                  (s.studentCode && currentStudent?.studentCode && s.studentCode === currentStudent.studentCode) ||
                  (s.studentName && currentStudent?.name && s.studentName.trim() === currentStudent.name.trim())
              );

              if (studentSubs.length === 0) return null;

              return (
                <div className="rounded-[28px] bg-white p-6 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-[#EEF2F7] space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">النشاط الأخير 📜</h3>
                      <p className="text-xs text-[#6B7280] font-bold mt-0.5">أحدث النشاطات والتشاركات الفعلية المسجلة لك</p>
                    </div>
                    <span className="text-xs text-[#14B8A6] font-bold">نشاط موثق</span>
                  </div>

                  <div className="space-y-3.5">
                    {studentSubs.slice(0, 5).map((sub: any, idx: number) => {
                      const isApproved = sub.status === 'approved';
                      return (
                        <div key={sub.id || idx} className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl ${isApproved ? 'bg-teal-50 text-[#14B8A6]' : 'bg-amber-50 text-amber-600'} flex items-center justify-center shrink-0`}>
                              {isApproved ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">{sub.taskTitle || sub.sourceName || 'تحدي قرآني'}</h4>
                              <p className="text-[11px] text-[#6B7280] font-bold mt-0.5">
                                {isApproved ? 'تم اعتماد التحدي واحتساب النقاط بنجاح' : 'تم إرسال التحديث وبانتظار اعتماد المعلم'}
                              </p>
                            </div>
                          </div>
                          <div className="text-left shrink-0">
                            <span className="text-xs font-bold text-slate-900 font-mono block">
                              {sub.pointsAwarded || sub.xpAwarded ? `+${sub.pointsAwarded || sub.xpAwarded} 💎` : (isApproved ? '+50 💎' : 'قيد المراجعة')}
                            </span>
                            <span className="text-[10px] text-[#6B7280] font-bold">{sub.submittedAt || sub.date || 'مؤخراً'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* 4. SETTINGS / ACCOUNT (إعدادات الحساب) */}
            <div className="rounded-[28px] bg-white p-6 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-[#EEF2F7] space-y-4">
              <div className="pb-2 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">إعدادات الحساب ⚙️</h3>
                <p className="text-xs text-[#6B7280] font-bold mt-0.5">إدارة الجلسة الحالية وتسجيل الخروج</p>
              </div>

              <div className="space-y-3">
                {/* Logout Only */}
                <div 
                  onClick={() => {
                    handleLogoutStudent();
                    setToastMessage('👋 تم تسجيل الخروج بنجاح. نلقاك على خير!');
                    setTimeout(() => setToastMessage(null), 3000);
                  }}
                  className="p-4 rounded-2xl border border-red-100 bg-red-50/30 hover:bg-red-50 flex items-center justify-between transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-red-700">تسجيل الخروج</h4>
                      <p className="text-[11px] text-red-500 font-bold mt-0.5">إنهاء الجلسة الحالية والعودة لصفحة البداية</p>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-red-400" />
                </div>
              </div>
            </div>

            {/* EDIT PROFILE MODAL */}
            <AnimatePresence>
              {isEditProfileOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-[28px] p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h3 className="text-lg font-bold text-slate-900">تعديل الملف الشخصي 👤</h3>
                      <button
                        onClick={() => setIsEditProfileOpen(false)}
                        className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-4 text-right">
                      {/* Avatar Upload Preview & Device File Upload */}
                      <div className="flex flex-col items-center justify-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-teal-500 shadow-sm flex items-center justify-center bg-slate-800 text-teal-300 font-bold text-2xl">
                          {editAvatarInput ? (
                            <img src={editAvatarInput} alt="معاينة الصورة" className="w-full h-full object-cover" />
                          ) : (
                            <span>{editNameInput ? editNameInput.charAt(0) : 'ط'}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap justify-center">
                          <label htmlFor="student-profile-avatar-upload" className="cursor-pointer bg-teal-50 hover:bg-teal-100 text-[#0F766E] border border-teal-200 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs">
                            <Upload className="w-3.5 h-3.5" />
                            <span>رفع صورة من الجهاز</span>
                            <input
                              id="student-profile-avatar-upload"
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > 5 * 1024 * 1024) {
                                  setToastMessage('⚠️ حجم الصورة كبير جداً (الحد الأقصى 5 ميجابايت)');
                                  setTimeout(() => setToastMessage(null), 3000);
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const result = event.target?.result as string;
                                  if (result) {
                                    setEditAvatarInput(result);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }}
                              className="hidden"
                            />
                          </label>

                          {editAvatarInput && (
                            <button
                              type="button"
                              onClick={() => setEditAvatarInput('')}
                              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                            >
                              إزالة الصورة
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">الاسم الكامل</label>
                        <input
                          type="text"
                          value={editNameInput}
                          onChange={(e) => setEditNameInput(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">كود الطالب المعين (غير قابل للتعديل)</label>
                        <input
                          type="text"
                          value={currentStudent?.studentCode || 'STU-100'}
                          disabled
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-500 bg-slate-100 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-3">
                      <button
                        onClick={async () => {
                          if (currentBatch && currentStudent) {
                            await teacherService.updateStudent(currentBatch.id, currentStudent.id, {
                              name: editNameInput,
                              avatarUrl: editAvatarInput,
                            });
                            await refreshStudentContext();
                          }
                          setIsEditProfileOpen(false);
                          setToastMessage('✓ تم حفظ التعديلات بنجاح!');
                          setTimeout(() => setToastMessage(null), 3000);
                        }}
                        className="flex-1 py-3 bg-[#14B8A6] hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
                      >
                        حفظ التغييرات
                      </button>
                      <button
                        onClick={() => setIsEditProfileOpen(false)}
                        className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

      </div>

      {/* ================= MODALS ================= */}



      {/* Floating Level Card Glass Modal */}
      <AnimatePresence>
        {selectedLevelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md dir-rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 25 }}
              className="bg-white/95 backdrop-blur-2xl rounded-[2.25rem] p-5 sm:p-6 shadow-[0_25px_60px_rgba(0,0,0,0.35)] border-2 border-white max-w-md w-full relative text-right overflow-hidden space-y-4"
            >
              {/* Background Ambient Glow inside modal */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-teal-200/40 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-200/40 rounded-full blur-2xl pointer-events-none" />

              {/* Header with Close Button */}
              <div className="relative z-10 flex items-center justify-between border-b border-slate-200/70 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500 via-emerald-500 to-teal-700 text-white flex items-center justify-center text-2xl shadow-md border border-white">
                    {selectedLevelModal.emoji}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight">
                      المستوى {selectedLevelModal.levelNumber}: {selectedLevelModal.nameOnly}
                    </h3>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full inline-block mt-0.5 ${
                      selectedLevelModal.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : selectedLevelModal.status === 'current'
                        ? 'bg-teal-100 text-teal-800 border border-teal-300'
                        : selectedLevelModal.status === 'next'
                        ? 'bg-sky-100 text-sky-800 border border-sky-300'
                        : 'bg-slate-100 text-slate-600 border border-slate-300'
                    }`}>
                      {selectedLevelModal.status === 'completed' ? '✓ مستوعب ومكتمل' : selectedLevelModal.status === 'current' ? '🎯 مستواك الحالي' : selectedLevelModal.status === 'next' ? '🚀 المستوى التالي' : '🔒 مقفل'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedLevelModal(null)}
                  className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Short Description */}
              <div className="relative z-10 bg-slate-50/90 rounded-2xl p-3.5 border border-slate-200/80">
                <span className="text-[10px] font-black text-teal-800 block mb-1">وصف المستوى:</span>
                <p className="text-xs font-bold text-slate-700 leading-relaxed">
                  {selectedLevelModal.description}
                </p>
              </div>

              {/* Required Tasks to Unlock Next Level */}
              <div className="relative z-10 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                  <Target className="w-4 h-4 text-teal-600" />
                  <span>المهام المطلوبة للارتقاء والفتح:</span>
                </div>
                <div className="space-y-1.5 bg-slate-50/80 rounded-2xl p-3 border border-slate-200/60">
                  {selectedLevelModal.requiredTasks.map((task, tIdx) => (
                    <div key={tIdx} className="flex items-start gap-2 text-xs font-bold text-slate-800">
                      <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                        task.done 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-slate-200 text-slate-500 border border-slate-300'
                      }`}>
                        {task.done ? '✓' : tIdx + 1}
                      </span>
                      <span className={task.done ? 'line-through text-slate-400' : ''}>
                        {task.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reward Box */}
              <div className="relative z-10 bg-gradient-to-r from-amber-500/10 via-amber-400/15 to-emerald-500/10 rounded-2xl p-3.5 border border-amber-300/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Gift className="w-6 h-6 text-amber-600 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block">المكافأة والوسام عند الإتمام:</span>
                    <span className="text-xs font-black text-slate-900">{selectedLevelModal.rewardTitle}</span>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-xl bg-amber-400/20 text-amber-900 font-black text-xs border border-amber-400/40 shrink-0">
                  +{selectedLevelModal.rewardPoints} نقطة 💎
                </div>
              </div>

              {/* Action Button */}
              <div className="relative z-10 pt-1">
                <button
                  onClick={() => {
                    if (selectedLevelModal.status === 'completed') {
                      triggerConfetti();
                    }
                    setSelectedLevelModal(null);
                  }}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-700 hover:to-emerald-800 text-white font-black text-sm shadow-lg shadow-teal-600/30 border border-teal-400/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{selectedLevelModal.status === 'completed' ? 'احتفل بالإنجاز 🎉' : 'فهمت، تابع المسار'}</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notifications Modal */}
      <AnimatePresence>
        {showNotificationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs dir-rtl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-base text-slate-900">الإشعارات والتنبيهات 🔔</h3>
                <button onClick={() => setShowNotificationModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-2xl bg-teal-50 border border-teal-200 text-xs text-teal-900">
                  <span className="font-bold block text-teal-800">حصلت على +50 نقطة جديدة 🎉</span>
                  <span>تمت إضافة النقاط بسبب إتقان مراجعة سورة الملك.</span>
                </div>
                <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900">
                  <span className="font-bold block text-indigo-800">تحديث مسار المحطة القادمة 🚩</span>
                  <span>أنت على بعد خطوات من إتمام مرحلة المبادرة.</span>
                </div>
              </div>

              <button 
                onClick={() => setShowNotificationModal(false)}
                className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all text-xs cursor-pointer"
              >
                إغلاق
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Challenge Details Modal */}
      <AnimatePresence>
        {selectedChallengeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md dir-rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white/95 backdrop-blur-2xl rounded-[2.25rem] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.35)] border-2 border-white max-w-lg w-full relative text-right overflow-hidden space-y-5"
            >
              {/* Glow background effects */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-teal-200/40 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-200/40 rounded-full blur-2xl pointer-events-none" />

              {/* Modal Top Bar (Back Button & X Close) */}
              <div className="relative z-10 flex items-center justify-between border-b border-slate-200/70 pb-3">
                <button
                  onClick={() => setSelectedChallengeModal(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>← العودة للتحديات</span>
                </button>

                <button
                  onClick={() => setSelectedChallengeModal(null)}
                  className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Challenge Title & Category Header */}
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-[#14B8A6] flex items-center justify-center shrink-0 shadow-xs">
                  {renderChallengeIcon(selectedChallengeModal.iconName || 'Sparkles', 'w-6 h-6')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/60">
                      {selectedChallengeModal.category === 'daily' ? 'تحدي يومي ⚡' : selectedChallengeModal.category === 'weekly' ? 'تحدي أسبوعي 🏆' : 'تحدي شهري 🌙'}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-1 leading-tight">
                    {selectedChallengeModal.title}
                  </h3>
                </div>
              </div>

              {/* Challenge Description */}
              <div className="relative z-10 space-y-1.5">
                <span className="text-xs font-black text-slate-700 block">شرح التحدي:</span>
                <p className="text-xs font-bold text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  {selectedChallengeModal.desc || (selectedChallengeModal as any).description || 'لا يوجد شرح إضافي'}
                </p>
              </div>

              {/* Duration & Reward Cards */}
              <div className="relative z-10 grid grid-cols-2 gap-3">
                <div className="bg-amber-50/80 rounded-2xl p-3 border border-amber-200/80 space-y-1">
                  <span className="text-[11px] font-bold text-amber-800 block">المدة:</span>
                  <span className="text-xs font-black text-slate-900">
                    {selectedChallengeModal.due_date || (selectedChallengeModal as any).dueDate || '3 أيام'}
                  </span>
                </div>
                <div className="bg-purple-50/80 rounded-2xl p-3 border border-purple-200/80 space-y-1">
                  <span className="text-[11px] font-bold text-purple-800 block">مكافأة التحدي:</span>
                  <span className="text-xs font-black text-purple-900 font-mono">
                    XP {selectedChallengeModal.xp || (selectedChallengeModal as any).xp_reward || 50}
                  </span>
                </div>
              </div>

              {/* Submission & Action Section */}
              <div className="relative z-10 pt-1 space-y-3">
                {selectedChallengeModal.status === 'completed' || selectedChallengeModal.done ? (
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-emerald-900 font-bold text-xs space-y-2">
                    <div className="flex items-center gap-1.5 font-black text-sm text-emerald-800">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>التحدي مكتمل وحُصلت النقاط! 🎉</span>
                    </div>
                    <p className="text-slate-600">تم اعتماد الإنجاز من المعلم وتخصيص النقاط بنجاح.</p>
                    {(selectedChallengeModal as any).submissionContent && (
                      <div className="bg-white p-2.5 rounded-xl border border-emerald-200 text-slate-800">
                        <span className="text-[10px] text-emerald-800 font-black block">إجابتك المعتمدة:</span>
                        <p>{(selectedChallengeModal as any).submissionContent}</p>
                      </div>
                    )}
                  </div>
                ) : (selectedChallengeModal as any).status === 'pending' ? (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-amber-900 font-bold text-xs space-y-2">
                    <div className="flex items-center gap-1.5 font-black text-sm text-amber-800">
                      <Sparkles className="w-5 h-5 text-amber-600 animate-pulse" />
                      <span>تم إرسال إنجازك للمراجعة 🎉</span>
                    </div>
                    <p className="text-amber-900 font-black text-xs">الحالة: بانتظار المراجعة ⏳</p>
                    <p className="text-slate-600">إنجازك بانتظار اعتماد ومراجعة المعلم لنيل النقاط.</p>
                    {(selectedChallengeModal as any).submissionContent && (
                      <div className="bg-white p-2.5 rounded-xl border border-amber-200 text-slate-800">
                        <span className="text-[10px] text-amber-800 font-black block">ما كتبته للمراجعة:</span>
                        <p>{(selectedChallengeModal as any).submissionContent}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(selectedChallengeModal as any).status === 'rejected' && (
                      <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl text-rose-900 font-bold text-xs">
                        ⚠️ لم يتم قبول الإنجاز السابق، يُرجى تعديل الإجابة وإعادة الإرسال.
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="block text-xs font-black text-slate-800">
                        ماذا فعلت؟ (اكتب تفاصيل إنجازك للمعلم):
                      </label>
                      <textarea
                        value={studentSubmissionText}
                        onChange={(e) => setStudentSubmissionText(e.target.value)}
                        placeholder="مثال: أتممت تحضير إذاعة يوم الأحد بحمد الله..."
                        rows={3}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                      />
                    </div>

                    <button
                      onClick={() => handleStudentSubmitChallenge(selectedChallengeModal)}
                      disabled={isSubmittingChallenge}
                      className="w-full py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-lg shadow-amber-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{isSubmittingChallenge ? 'جاري الإرسال...' : 'إرسال التحدي للمراجعة 🚀'}</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fixed Bottom Navigation Bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-xl w-[96%] sm:w-[92%] bg-white/95 backdrop-blur-md rounded-full border border-[#E6ECEF] shadow-xl px-2 sm:px-3 py-2 flex items-center justify-between gap-0.5 sm:gap-1 dir-rtl">
        {/* 1: رحلتي */}
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer py-1 min-w-0 ${
            activeTab === 'home' ? 'text-[#0F766E] font-black scale-105' : 'text-slate-400 hover:text-slate-600 font-bold'
          }`}
        >
          <Home className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          <span className="text-[9px] sm:text-[10px] leading-none whitespace-nowrap">رحلتي</span>
        </button>

        {/* 2: النادي */}
        <button 
          onClick={() => setActiveTab('club')}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer py-1 min-w-0 ${
            activeTab === 'club' ? 'text-[#0F766E] font-black scale-105' : 'text-slate-400 hover:text-slate-600 font-bold'
          }`}
        >
          <Users className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          <span className="text-[9px] sm:text-[10px] leading-none whitespace-nowrap">النادي</span>
        </button>

        {/* 3: Center Prominent Action Button: 🎯 التحديات */}
        <div className="flex flex-col items-center justify-center -mt-6 px-1 shrink-0">
          <button 
            onClick={() => setActiveTab('challenges')}
            className={`w-11 h-11 sm:w-13 sm:h-13 rounded-full text-white flex items-center justify-center shadow-lg hover:scale-105 transition-all cursor-pointer border-3 sm:border-4 border-white ${
              activeTab === 'challenges' ? 'bg-[#0F766E] ring-2 ring-teal-400 shadow-teal-700/30' : 'bg-[#0F766E]'
            }`}
          >
            <Target className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2] text-amber-300" />
          </button>
          <span className={`text-[9px] sm:text-[10px] font-black mt-0.5 leading-none transition-colors ${
            activeTab === 'challenges' ? 'text-[#0F766E]' : 'text-slate-500'
          }`}>
            التحديات
          </span>
        </div>

        {/* 4: المكتبة */}
        <button 
          onClick={() => setActiveTab('library')}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer py-1 min-w-0 ${
            activeTab === 'library' ? 'text-[#0F766E] font-black scale-105' : 'text-slate-400 hover:text-slate-600 font-bold'
          }`}
        >
          <Book className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          <span className="text-[9px] sm:text-[10px] leading-none whitespace-nowrap">المكتبة</span>
        </button>

        {/* 5: الملف الشخصي */}
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer py-1 min-w-0 ${
            activeTab === 'profile' ? 'text-[#0F766E] font-black scale-105' : 'text-slate-400 hover:text-slate-600 font-bold'
          }`}
        >
          <User className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          <span className="text-[9px] sm:text-[10px] leading-none whitespace-nowrap">الملف</span>
        </button>
      </div>

      {/* ALL TEACHER MESSAGES MODAL */}
      <AnimatePresence>
        {isAllMessagesModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-[28px] p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-[#0F766E]">
                  <Mail className="w-5 h-5" />
                  <h3 className="font-black text-base text-slate-900">سجل رسائل المعلم</h3>
                </div>
                <button
                  onClick={() => setIsAllMessagesModalOpen(false)}
                  className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {studentContext?.announcements && studentContext.announcements.length > 0 ? (
                  studentContext.announcements.map((msg) => {
                    const isRead = msg.readBy?.includes(currentStudent?.id || '');
                    return (
                      <div
                        key={msg.id}
                        className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100 space-y-2 text-right"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-lg bg-teal-100 text-[#0F766E] font-extrabold text-[10px]">
                            {msg.targetName || 'الدفعة العامة'}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {msg.createdAt}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 leading-relaxed">
                          {msg.content}
                        </p>
                        <div className="flex items-center justify-between pt-1 text-[10px] font-bold border-t border-teal-100/60">
                          <span className="text-slate-500">المرسل: {msg.author || 'المعلم'}</span>
                          {isRead ? (
                            <span className="text-emerald-700 font-bold">تمت القراءة ✓</span>
                          ) : (
                            currentStudent && (
                              <button
                                onClick={async () => {
                                  await teacherService.markMessageAsRead(msg.id, currentStudent.id);
                                  refreshStudentContext();
                                }}
                                className="text-teal-700 font-black underline cursor-pointer"
                              >
                                تعليم كـ مقروء
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-500 text-center py-4">لا توجد رسائل سابقة.</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
