import React, { useState } from 'react';
import { motion } from 'motion/react';
import { StudentProfile, PointTransaction, JourneyType } from '../types';
import { mockStudentProfile, mockTransactions } from '../data/journeysData';
import StudentJourneyHero from './StudentJourneyHero';
import { 
  Award, History, Bell, User, CheckCircle2, AlertCircle, 
  PlusCircle, MinusCircle, BookOpen, Clock, Calendar, Search, Filter,
  ShieldCheck, Sparkles, LogOut, Heart
} from 'lucide-react';

interface StudentDashboardProps {
  onSwitchToTeacher?: () => void;
}

export default function StudentDashboard({ onSwitchToTeacher }: StudentDashboardProps) {
  const [student, setStudent] = useState<StudentProfile>(mockStudentProfile);
  const [transactions, setTransactions] = useState<PointTransaction[]>(mockTransactions);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const handleJourneyTypeChange = (newType: JourneyType) => {
    setStudent(prev => ({
      ...prev,
      journeyType: newType
    }));
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.reason.includes(searchTerm);
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 dir-rtl selection:bg-emerald-500 selection:text-white pb-16">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        {/* App Title & Logo */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl text-white shadow-lg shadow-emerald-950/50">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-1.5">
              <span>رحلة داعية</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                لوحة الطالب
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              {student.className} - {student.teacherName}
            </p>
          </div>
        </div>

        {/* Student Avatar & Switch View Action */}
        <div className="flex items-center gap-3">
          {onSwitchToTeacher && (
            <button
              onClick={onSwitchToTeacher}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-2"
            >
              <User className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">تسجيل دخول المعلم</span>
              <span className="sm:hidden">المعلم</span>
            </button>
          )}

          <div className="flex items-center gap-2 pr-2 border-r border-slate-800">
            {student.avatar ? (
              <img 
                src={student.avatar} 
                alt={student.fullName}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-emerald-500/50"
              />
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-800 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 font-bold text-sm">
                {student.fullName ? student.fullName.charAt(0) : 'ط'}
              </div>
            )}
            <div className="hidden md:block text-right">
              <span className="text-xs font-bold text-white block leading-tight">{student.fullName}</span>
              <span className="text-[11px] text-emerald-400 font-mono font-bold">الطالب #{student.classNumber}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-8 sm:space-y-12">
        
        {/* ================= 1. HERO SECTION: INTERACTIVE JOURNEY CARD ================= */}
        <section>
          <StudentJourneyHero 
            student={student} 
            onJourneyTypeChange={handleJourneyTypeChange} 
          />
        </section>

        {/* ================= 2. POINT HISTORY & NOTIFICATIONS GRID ================= */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          
          {/* Point History Log (2 cols on large screen) */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            
            {/* Header & Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">سجل النقاط والحركات</h2>
                  <p className="text-xs text-slate-400 mt-0.5">تفاصيل العمليات المضافة والأنشطة الإيمانية والسلوكية</p>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'quran', label: 'القرآن' },
                  { id: 'behavior', label: 'السلوك' },
                  { id: 'attendance', label: 'المواظبة' },
                  { id: 'reward', label: 'المكافآت' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      categoryFilter === cat.id 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث في أسباب النقاط..."
                className="w-full pl-4 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Transactions List */}
            <div className="space-y-3">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map(trans => {
                  const isPositive = trans.points > 0;

                  return (
                    <motion.div
                      key={trans.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition-all flex items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className={`mt-0.5 p-2 rounded-xl shrink-0 ${
                          isPositive 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {isPositive ? <PlusCircle className="w-5 h-5" /> : <MinusCircle className="w-5 h-5" />}
                        </div>

                        <div>
                          <p className="text-xs sm:text-sm font-bold text-white leading-snug">
                            {trans.reason}
                          </p>
                          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mt-1">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>{trans.date}</span>
                          </span>
                        </div>
                      </div>

                      {/* Points Value */}
                      <div className={`font-mono font-black text-sm sm:text-base dir-ltr ${
                        isPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {isPositive ? `+${trans.points}` : trans.points} ن
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs sm:text-sm">
                  لا توجد حركات طابقت البحث.
                </div>
              )}
            </div>

          </div>

          {/* Teacher Notes & Badges Panel (1 col on large screen) */}
          <div className="space-y-6">
            
            {/* Teacher Encouragement Note */}
            <div className="bg-gradient-to-br from-emerald-950/80 via-teal-950/60 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 relative overflow-hidden">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-emerald-500/20 rounded-2xl text-emerald-300">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">رسالة المعلم اليومية</h3>
                  <p className="text-xs text-emerald-300/80">{student.teacherName}</p>
                </div>
              </div>

              <blockquote className="text-xs sm:text-sm text-slate-200 leading-relaxed italic bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                "ما شاء الله يا عبدالرحمن، إتقانك لسورة الملك كان متميزاً جداً! واصل الجد والاجتهاد لرفع التاج في الحفل القادم."
              </blockquote>
            </div>

            {/* Badges Collection */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <span>الأوسمة المكتسبة</span>
                </h3>
                <span className="text-xs font-mono font-bold text-emerald-400">0 وسام</span>
              </div>

              <div className="text-center py-6 text-slate-400 text-xs font-bold bg-slate-950/40 rounded-2xl border border-slate-800">
                لا توجد إنجازات بعد. في انتظار أول إنجاز ينشئه المعلم.
              </div>
            </div>

          </div>

        </section>

      </main>

    </div>
  );
}
