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
  Layers,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  SystemSettings,
  getSystemSettings,
  getBatchStations,
  saveBatchStations,
  DEFAULT_SYSTEM_SETTINGS,
  JourneyStationSetting,
} from '../../services/systemSettingsService';
import { Batch } from '../../types/teacher';

interface SystemSettingsViewProps {
  batches?: Batch[];
  selectedBatch?: Batch | null;
}

export const SystemSettingsView: React.FC<SystemSettingsViewProps> = ({
  batches = [],
  selectedBatch = null,
}) => {
  const [activeBatchId, setActiveBatchId] = useState<string>(
    selectedBatch?.id || batches[0]?.id || ''
  );
  const [stations, setStations] = useState<JourneyStationSetting[]>([]);
  const [isLoadingStations, setIsLoadingStations] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync activeBatchId with prop changes
  useEffect(() => {
    if (selectedBatch?.id && selectedBatch.id !== activeBatchId) {
      setActiveBatchId(selectedBatch.id);
    } else if (!activeBatchId && batches.length > 0) {
      setActiveBatchId(batches[0].id);
    }
  }, [selectedBatch?.id, batches]);

  // Fetch stations for the selected batch from Supabase (Source of Truth)
  useEffect(() => {
    let isMounted = true;
    const loadStations = async () => {
      setIsLoadingStations(true);
      setErrorMessage(null);
      try {
        const data = await getBatchStations(activeBatchId || undefined);
        if (isMounted) {
          setStations(data.length > 0 ? data : DEFAULT_SYSTEM_SETTINGS.stations);
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn('Failed to fetch stations for batch:', err);
          setStations(DEFAULT_SYSTEM_SETTINGS.stations);
        }
      } finally {
        if (isMounted) {
          setIsLoadingStations(false);
        }
      }
    };

    loadStations();
    return () => {
      isMounted = false;
    };
  }, [activeBatchId]);

  const activeBatchObj = batches.find((b) => b.id === activeBatchId) || selectedBatch;

  const handleSave = async () => {
    try {
      setErrorMessage(null);
      setIsSaving(true);
      await saveBatchStations(activeBatchId || undefined, stations);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err: any) {
      setSavedSuccess(false);
      setErrorMessage(err?.message || 'حدث خطأ أثناء حفظ الإعدادات في قاعدة البيانات.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('هل أنت متأكدة من استعادة المحطات الافتراضية لهذه الدفعة؟')) {
      setStations([...DEFAULT_SYSTEM_SETTINGS.stations]);
      setErrorMessage(null);
    }
  };

  // Station Handlers
  const handleStationChange = (index: number, field: keyof JourneyStationSetting, value: any) => {
    const updatedStations = [...stations];
    updatedStations[index] = { ...updatedStations[index], [field]: value };
    setStations(updatedStations);
  };

  const addStation = () => {
    const lastThreshold = stations[stations.length - 1]?.threshold ?? 2800;
    const newStation: JourneyStationSetting = {
      id: `st-${Date.now()}`,
      level: stations.length + 1,
      title: 'محطة جديدة ✨',
      badge: 'شارة جديدة',
      threshold: lastThreshold + 500,
      icon: '✨',
      description: 'وصف المحطة الجديدة وأهدافها الإيمانية والتربوية.',
      requirementsSummary: `جمع ${lastThreshold + 500} نقطة وإكمال المتطلبات`,
    };
    setStations([...stations, newStation]);
  };

  const removeStation = (index: number) => {
    if (stations.length <= 1) {
      alert('لا يمكن حذف المحطة الوحيدة المتبقية في مسار الرحلة.');
      return;
    }
    const updated = stations.filter((_, i) => i !== index);
    setStations(updated);
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
              <span>⚙️ لوحة إعدادات محطات الرحلة وحدود النقاط لكل دفعة</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
              محطات الرحلة والمعايير
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-300 max-w-2xl leading-relaxed">
              تحديد مراحل الرحلة بناءً على نقاط الطالبة وتخصيص حدود كل مرحلة بدقة لكل دفعة بشكل منفصل.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              disabled={isSaving || isLoadingStations}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-black border border-slate-600 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>استعادة الافتراضي</span>
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving || isLoadingStations}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 disabled:opacity-50 text-white text-xs font-black shadow-lg shadow-teal-500/25 transition-all cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري الحفظ في Supabase...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>حفظ إعدادات الدفعة</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* BATCH SELECTOR CARD */}
      <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-black">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-black text-slate-700 block">الدفعة المستهدفة للإعدادات:</span>
            <span className="text-[11px] font-bold text-slate-400">
              {activeBatchObj ? `المرحلة: ${activeBatchObj.stage || 'عامة'} • الكود: ${activeBatchObj.code || 'BTC'}` : 'الإعدادات العامة'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 min-w-[240px]">
          {batches.length > 0 ? (
            <select
              value={activeBatchId}
              onChange={(e) => setActiveBatchId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-black text-slate-800 focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.stage || 'دفعة'})
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs font-black text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
              {selectedBatch?.name || 'الدفعة العامة'}
            </span>
          )}
        </div>
      </div>

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
              <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
              <span>تم حفظ محطات الرحلة للدفعة في Supabase بنجاح ✓</span>
            </div>
            <span className="text-xs bg-white/20 px-3 py-1 rounded-full">تحديث حي وتزامن فوري ✓</span>
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
              <AlertCircle className="w-5 h-5 text-white shrink-0" />
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
              <span>
                مراحل رحلة الطالبة وحدود النقاط {activeBatchObj ? `(دفعة: ${activeBatchObj.name})` : ''}
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-bold mt-1">
              تحدد كل مرحلة الحد الأدنى والأقصى لنقاط الـ XP، وتنعكس مباشرة على حساب مستوى الطالبة ونسبة التقدم.
            </p>
          </div>

          <button
            onClick={addStation}
            disabled={isLoadingStations}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-black border border-teal-200 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-teal-600" />
            <span>إضافة محطة جديدة</span>
          </button>
        </div>

        {isLoadingStations ? (
          <div className="py-12 text-center text-slate-500 font-bold text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
            <span>جاري تحميل إعدادات المحطات من قاعدة البيانات...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {stations.map((st, idx) => {
              const minThreshold = st.threshold;
              const nextStation = stations[idx + 1];
              const maxThreshold = nextStation ? nextStation.threshold : null;

              return (
                <div
                  key={st.id || `st-node-${idx}`}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 hover:border-teal-300 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-black text-xs">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={st.title}
                        onChange={(e) => handleStationChange(idx, 'title', e.target.value)}
                        placeholder="اسم المرحلة"
                        className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-black text-slate-900 focus:outline-none focus:border-teal-500 min-w-[140px]"
                      />
                      <input
                        type="text"
                        value={st.badge}
                        onChange={(e) => handleStationChange(idx, 'badge', e.target.value)}
                        placeholder="اسم الشارة"
                        className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-teal-700 focus:outline-none min-w-[100px]"
                      />
                      <input
                        type="text"
                        value={st.icon || '🌱'}
                        onChange={(e) => handleStationChange(idx, 'icon', e.target.value)}
                        title="رمز الأيقونة / الإيموجي"
                        className="w-10 text-center bg-white border border-slate-300 rounded-xl px-1.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      {/* Interval bounds (Min → Max) */}
                      <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                        <span className="text-xs font-bold text-slate-500">الحد الأدنى:</span>
                        <input
                          type="number"
                          value={st.threshold}
                          disabled={idx === 0}
                          onChange={(e) =>
                            handleStationChange(idx, 'threshold', Math.max(0, Number(e.target.value) || 0))
                          }
                          className="w-16 sm:w-20 text-xs font-black text-emerald-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 rounded px-1"
                        />
                        <span className="text-[10px] font-bold text-slate-400">XP</span>
                      </div>

                      <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
                        <span className="text-slate-400">الحد الأقصى:</span>
                        <span className="font-black text-teal-700">
                          {maxThreshold !== null ? `${maxThreshold} XP` : 'فما فوق (النهاية) 👑'}
                        </span>
                      </div>

                      <button
                        onClick={() => removeStation(idx)}
                        disabled={stations.length <= 1}
                        className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-30 transition-colors cursor-pointer"
                        title="حذف المحطة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        وصف المحطة الإيماني والتربوي:
                      </label>
                      <input
                        type="text"
                        value={st.description}
                        onChange={(e) => handleStationChange(idx, 'description', e.target.value)}
                        placeholder="وصف إيماني مختصر..."
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        ملخص متطلبات الانتقال للمحطة:
                      </label>
                      <input
                        type="text"
                        value={st.requirementsSummary}
                        onChange={(e) => handleStationChange(idx, 'requirementsSummary', e.target.value)}
                        placeholder="مثال: جمع 300 نقطة وإكمال التحديات..."
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* BOTTOM SAVE BUTTON BAR */}
      <div className="p-5 rounded-[28px] bg-white border border-slate-200 shadow-md flex flex-wrap items-center justify-between gap-4 mt-6">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
          <Info className="w-4 h-4 text-teal-600 shrink-0" />
          <span>
            يتم حفظ الإعدادات مباشرة في قاعدة بيانات Supabase وتنعكس فوريًا في حسابات تقدم ومستويات الطلاب.
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            disabled={isSaving || isLoadingStations}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-black border border-slate-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-amber-600" />
            <span>استعادة الافتراضي</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving || isLoadingStations}
            type="button"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-black shadow-lg shadow-teal-600/25 transition-all cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>حفظ إعدادات الدفعة</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

