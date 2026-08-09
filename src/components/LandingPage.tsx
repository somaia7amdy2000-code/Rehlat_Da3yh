import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, School, Sparkles, ArrowRight, Lock, KeyRound, AlertCircle, Compass } from 'lucide-react';
import { teacherService } from '../services/teacherService';

interface LandingPageProps {
  onSelectStudent: () => void;
  onTeacherAuthenticated: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSelectStudent,
  onTeacherAuthenticated,
}) => {
  const [selectedRole, setSelectedRole] = useState<'none' | 'teacher_auth'>('none');
  const [teacherName, setTeacherName] = useState('');
  const [teacherCode, setTeacherCode] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthenticating(true);

    try {
      const isValid = await teacherService.validateTeacherCredentials(teacherName, teacherCode);
      if (isValid) {
        onTeacherAuthenticated();
      } else {
        setAuthError('اسم المعلم أو الكود غير صحيح');
      }
    } catch (err) {
      setAuthError('اسم المعلم أو الكود غير صحيح');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden dir-rtl font-sans selection:bg-teal-500 selection:text-white">
      {/* Subtle Background Glow Spheres */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-lg z-10 space-y-8">
        {/* App Title & Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-black shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>منصة رحلة داعية</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            أهلاً بك في رحلة داعية
          </h1>

          <p className="text-base sm:text-lg font-bold text-slate-400">
            طريقك لتترك أثراً
          </p>
        </motion.div>

        {/* Dynamic Card Content */}
        <AnimatePresence mode="wait">
          {selectedRole === 'none' ? (
            /* Role Selection Screen */
            <motion.div
              key="role-selection"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Student Choice Button */}
                <motion.button
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onSelectStudent}
                  className="p-6 rounded-3xl bg-slate-900/90 border border-teal-500/20 hover:border-teal-500/60 shadow-xl hover:shadow-teal-500/10 text-right space-y-4 transition-all group cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
                    <GraduationCap className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white group-hover:text-teal-300 transition-colors">
                      طالب
                    </h2>
                    <p className="text-xs font-bold text-slate-400 mt-1">
                      الدخول للرحلة التفاعلية والمهام والأنشطة
                    </p>
                  </div>
                </motion.button>

                {/* Teacher Choice Button */}
                <motion.button
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setAuthError('');
                    setSelectedRole('teacher_auth');
                  }}
                  className="p-6 rounded-3xl bg-slate-900/90 border border-emerald-500/20 hover:border-emerald-500/60 shadow-xl hover:shadow-emerald-500/10 text-right space-y-4 transition-all group cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <School className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white group-hover:text-emerald-300 transition-colors">
                      معلم
                    </h2>
                    <p className="text-xs font-bold text-slate-400 mt-1">
                      بوابة المعلمات والمشرفات ومتابعة الإنجازات
                    </p>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          ) : (
            /* Teacher Authentication Screen */
            <motion.div
              key="teacher-auth"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">تسجيل دخول المعلمة</h2>
                    <p className="text-xs font-bold text-slate-400">أدخلي بيانات الاعتماد للتحقق</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedRole('none');
                    setAuthError('');
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer text-xs font-bold flex items-center gap-1"
                >
                  <span>رجوع</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {authError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-black flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{authError}</span>
                </motion.div>
              )}

              <form onSubmit={handleTeacherSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-300 block">اسم المعلم:</label>
                  <input
                    type="text"
                    required
                    value={teacherName}
                    onChange={(e) => {
                      setTeacherName(e.target.value);
                      if (authError) setAuthError('');
                    }}
                    placeholder="أدخلي اسم المعلمة..."
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs font-bold focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-300 block">كود المعلم:</label>
                  <input
                    type="password"
                    required
                    value={teacherCode}
                    onChange={(e) => {
                      setTeacherCode(e.target.value);
                      if (authError) setAuthError('');
                    }}
                    placeholder="أدخلي كود المعلمة..."
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs font-bold focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isAuthenticating}
                    className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>{isAuthenticating ? 'جاري التحقق...' : 'دخول'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('none');
                      setAuthError('');
                    }}
                    className="px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
