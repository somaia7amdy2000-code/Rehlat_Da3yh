import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, BookOpen, Sparkles, LogIn, UserPlus, HelpCircle } from 'lucide-react';

export default function TeacherLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Front-end UI display only
    alert('هذه واجهة عرض فقط. لم يتم ربط تسجيل الدخول بقاعدة البيانات بعد.');
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-900 via-teal-900 to-sky-950 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden dir-rtl">
      {/* Background Decorative Blur Circles */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Card Header & Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex items-center justify-center p-3 sm:p-4 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl shadow-xl shadow-emerald-900/40 text-white mb-4 ring-4 ring-white/10"
          >
            <BookOpen className="w-9 h-9 sm:w-11 sm:h-11" />
          </motion.div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-wide flex items-center justify-center gap-2">
            <span>رحلة داعية</span>
            <Sparkles className="w-6 h-6 text-emerald-400 animate-pulse" />
          </h1>
          
          <p className="text-emerald-200/90 text-sm sm:text-base mt-2 font-medium">
            منصة تحفيز طلاب القرآن الكريم والتربية الإسلامية
          </p>
        </div>

        {/* Login / Register Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20 text-slate-800">
          
          {/* Card Title & Welcome Message */}
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {activeTab === 'login' ? 'مرحباً بعودتك، أستاذنا الفاضل' : 'حساب معلم جديد'}
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              {activeTab === 'login' 
                ? 'سجّل دخولك لمتابعة رحلة طلابك وتحفيزهم نحو القمة'
                : 'أنشئ حسابك للبدء في إدارة الفصول وتتبع نقاط الطلاب'}
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Additional Field for Registration Mode */}
            {activeTab === 'register' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
              >
                <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
                  الاسم الكامل
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="أ. محمد أحمد"
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserPlus className="w-5 h-5" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Email Input */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="teacher@example.com"
                  className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-left dir-ltr"
                />
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs sm:text-sm font-bold text-slate-700">
                  كلمة المرور
                </label>
                {activeTab === 'login' && (
                  <button
                    type="button"
                    onClick={() => alert('يمكنك إعادة تعيين كلمة المرور عبر البريد عند تفعيل الربط.')}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-all"
                  >
                    نسيت كلمة المرور؟
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-left dir-ltr"
                />
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me checkbox */}
            {activeTab === 'login' && (
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm text-slate-600">تذكر بياناتي</span>
                </label>
              </div>
            )}

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-700 hover:via-teal-700 hover:to-sky-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <LogIn className="w-5 h-5" />
              <span>{activeTab === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب الان'}</span>
            </motion.button>
          </form>

          {/* Toggle between Login and Register */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            {activeTab === 'login' ? (
              <p className="text-xs sm:text-sm text-slate-600">
                ليس لديك حساب معلم بعد؟{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-all"
                >
                  إنشاء حساب معلم جديد
                </button>
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-slate-600">
                لديك حساب بالفعل؟{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-all"
                >
                  تسجيل الدخول
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center">
          <p className="text-xs text-emerald-100/70 flex items-center justify-center gap-1">
            <HelpCircle className="w-4 h-4" />
            <span>خاص بمعلمي القرآن الكريم والتربية الإسلامية</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
