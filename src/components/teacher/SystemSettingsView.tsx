import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings,
  Compass,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  Info,
} from 'lucide-react';
import {
  SystemSettings,
  getSystemSettings,
  saveSystemSettings,
  resetSettingsToDefault,
  JourneyStationSetting,
} from '../../services/systemSettingsService';

export const SystemSettingsView: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>(getSystemSettings());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setSettings(getSystemSettings());
  }, []);

  const handleSave = () => {
    try {
      setErrorMessage(null);
      saveSystemSettings(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setSavedSuccess(false);
      setErrorMessage(err?.message || 'حدث خطأ أثناء حفظ الإعدادات، يرجى المحاولة مرة أخرى.');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const handleReset = () => {
    if (window.confirm('هل أنت متأكدة من إعادة جميع إعدادات النظام للقيم الافتراضية؟')) {
      const reset = resetSettingsToDefault();
      setSettings(reset);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  // Station Handlers
  const handleStationChange = (index: number, field: keyof JourneyStationSetting, value: any) => {
    const updatedStations = [...settings.stations];
    updatedStations[index] = { ...updatedStations[index], [field]: value };
    setSettings({ ...settings, stations: updatedStations });
  };

  const addStation = () => {
    const newStation: JourneyStationSetting = {
      id: `st-${Date.now()}`,
      level: settings.stations.length + 1,
      title: 'محطة جديدة ✨',
      badge: 'شارة جديدة',
      threshold: (settings.stations[settings.stations.length - 1]?.threshold || 3800) + 1000,
      icon: '✨',
      description: 'وصف المحطة الجديدة وتحدياتها الإيمانية.',
      requirementsSummary: 'إكمال المتطلبات المطلوبة للوصول',
    };
    setSettings({ ...settings, stations: [...settings.stations, newStation] });
  };

  const removeStation = (index: number) => {
    if (settings.stations.length <= 1) {
      alert('لا يمكن حذف المحطة الوحيدة المتبقية.');
      return;
    }
    const updated = settings.stations.filter((_, i) => i !== index);
    setSettings({ ...settings, stations: updated });
  };

  return (
    <div className="space-y-6 dir-rtl text-slate-900 font-sans pb-16">
      {/* HEADER BANNER */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-6 sm:p-8 text-white shadow-2xl border border-teal-500/30"
      >
        <div className="absolute top-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-black">
              <Settings className="w-4 h-4 text-teal-300" />
              <span>⚙️ لوحة إعدادات محطات الرحلة والمعايير</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
              محطات الرحلة والمعايير
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-300 max-w-2xl leading-relaxed">
              جميع القيم المعروضة ديناميكية وتنعكس فور حفظها في تطبيق الطالبة ومحرك الرحلة دون الحاجة لتعديل في الكود.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-black border border-slate-600 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>إعادة ضبط المصنع</span>
            </button>

            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white text-xs font-black shadow-lg shadow-teal-500/25 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ الإعدادات</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* SAVE SUCCESS & ERROR BANNERS */}
      <AnimatePresence>
        {savedSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-emerald-500 text-white font-black text-sm flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-white" />
              <span>تم حفظ الإعدادات ✓</span>
            </div>
            <span className="text-xs bg-white/20 px-3 py-1 rounded-full">تحديث حي ✓</span>
          </motion.div>
        )}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-rose-600 text-white font-black text-sm flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-white" />
              <span>{errorMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* JOURNEY STATIONS EDITOR */}
      <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Compass className="w-5 h-5 text-teal-600" />
              <span>إدارة محطات رحلة الطالبة ومستوياتها (تعديل مباشر)</span>
            </h2>
            <p className="text-xs text-slate-500 font-bold mt-1">
              تظهر هذه المحطات والمستويات في واجهة الطالبة وتحسب العتبة المطلوبة لكل مستوى تلقائياً.
            </p>
          </div>

          <button
            onClick={addStation}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-black border border-teal-200 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-teal-600" />
            <span>إضافة محطة جديدة</span>
          </button>
        </div>

        <div className="space-y-4">
          {settings.stations.map((st, idx) => (
            <div
              key={st.id}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 hover:border-teal-300 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-black text-xs">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={st.title}
                    onChange={(e) => handleStationChange(idx, 'title', e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-sm font-black text-slate-900 focus:outline-none focus:border-teal-500"
                  />
                  <input
                    type="text"
                    value={st.badge}
                    onChange={(e) => handleStationChange(idx, 'badge', e.target.value)}
                    placeholder="اسم الشارة"
                    className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-teal-700 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-500">عتبة الـ XP:</span>
                    <input
                      type="number"
                      value={st.threshold}
                      onChange={(e) => handleStationChange(idx, 'threshold', Number(e.target.value))}
                      className="w-20 text-xs font-black text-emerald-600 focus:outline-none"
                    />
                    <span className="text-[10px] font-bold text-slate-400">XP</span>
                  </div>

                  <button
                    onClick={() => removeStation(idx)}
                    className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                    title="حذف المحطة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">وصف المحطة الإيماني والتربوي:</label>
                  <input
                    type="text"
                    value={st.description}
                    onChange={(e) => handleStationChange(idx, 'description', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">ملخص متطلبات الانتقال للمحطة:</label>
                  <input
                    type="text"
                    value={st.requirementsSummary}
                    onChange={(e) => handleStationChange(idx, 'requirementsSummary', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM SAVE BUTTON BAR */}
      <div className="p-5 rounded-[28px] bg-white border border-slate-200 shadow-md flex flex-wrap items-center justify-between gap-4 mt-6">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
          <Info className="w-4 h-4 text-teal-600 shrink-0" />
          <span>حفظ التعديلات يطبق القيم مباشرة على كافة واجهات النظام وتطبيقات المعلمة والطالبة.</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black border border-slate-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-amber-600" />
            <span>إعادة ضبط المصنع</span>
          </button>

          <button
            onClick={handleSave}
            type="button"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs sm:text-sm font-black shadow-lg shadow-teal-600/25 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>حفظ الإعدادات</span>
          </button>
        </div>
      </div>
    </div>
  );
};
