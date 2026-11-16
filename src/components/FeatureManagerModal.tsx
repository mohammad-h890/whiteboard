import React, { useState } from 'react';
import {
  X,
  Search,
  Sliders,
  Cpu,
  HardDrive,
  Check,
  Sparkles,
  Power,
  RotateCcw,
  Layers,
  Play,
} from 'lucide-react';
import {
  AppModule,
  ModuleId,
  TeachingProfileId,
  TEACHING_PROFILES,
  ResourceMetrics,
  toPersianDigits,
} from '../core/featureEngine';

interface FeatureManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  modules: AppModule[];
  activeProfileId: TeachingProfileId;
  onSelectProfile: (profileId: TeachingProfileId) => void;
  onToggleModule: (moduleId: ModuleId, forceState?: boolean) => void;
  onToggleSubFeature: (moduleId: ModuleId, subFeatureId: string) => void;
  onLaunchSubFeature?: (moduleId: ModuleId, subFeatureId: string) => void;
  metrics: ResourceMetrics;
  usePersianNumerals: boolean;
}

type CategoryFilter = 'all' | 'core' | 'stem-labs' | 'humanities' | 'media-studio' | 'intelligence';

export const FeatureManagerModal: React.FC<FeatureManagerModalProps> = ({
  isOpen,
  onClose,
  modules,
  activeProfileId,
  onSelectProfile,
  onToggleModule,
  onToggleSubFeature,
  onLaunchSubFeature,
  metrics,
  usePersianNumerals,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  React.useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const fmt = (val: string | number) => toPersianDigits(val, usePersianNumerals);

  const filteredModules = modules
    .filter((mod) => (categoryFilter === 'all' ? true : mod.category === categoryFilter))
    .map((mod) => {
      if (!searchQuery.trim()) return mod;
      const q = searchQuery.trim().toLowerCase();
      const modMatches =
        mod.title.toLowerCase().includes(q) || mod.description.toLowerCase().includes(q);
      const matchingSubs = mod.subFeatures.filter(
        (sf) =>
          sf.title.toLowerCase().includes(q) || sf.description.toLowerCase().includes(q)
      );
      if (modMatches) return mod;
      if (matchingSubs.length > 0) {
        return { ...mod, subFeatures: matchingSubs };
      }
      return null;
    })
    .filter((m): m is AppModule => m !== null);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feature-manager-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-6xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-sky-600/10 dark:bg-sky-500/15 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="feature-manager-title"
                className="text-base font-bold text-slate-900 dark:text-slate-100 truncate"
              >
                مدیریت ویژگی‌ها و ماژول‌ها (Feature & Resource Manager)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                هر قابلیت را می‌توانید روشن/خاموش کنید یا با دکمه «اجرا و استفاده» مستقیماً روی تخته باز کنید.
              </p>
            </div>
          </div>

          {/* Resource Savings Telemetry Bar */}
          <div className="hidden xl:flex items-center gap-4 px-4 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs shrink-0 whitespace-nowrap">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <HardDrive className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-slate-500 dark:text-slate-400">RAM مصرفی:</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                {fmt(metrics.usedRamMb)} MB
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">
                {fmt(metrics.savedRamMb)} MB آزادسازی ({fmt(metrics.ramSavingsPercent)}٪)
              </span>
            </div>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <Cpu className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <span className="text-slate-500 dark:text-slate-400">CPU:</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                {fmt(metrics.usedCpuPct)}٪
              </span>
            </div>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-slate-500 dark:text-slate-400">ابزارهای روشن:</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                {fmt(metrics.activeSubFeaturesCount)} / {fmt(metrics.totalSubFeaturesCount)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="بستن پنجره مدیریت ماژول‌ها"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Teaching Profiles Strip */}
        <div className="px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              انتخاب سریع «پروفایل تدریس» (روشن/خاموش خودکار ابزارهای مرتبط با رشته شما):
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSelectProfile('simple')}
                className="px-2.5 py-1 text-xs font-medium rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                حالت فوق‌سبک
              </button>
              <button
                type="button"
                onClick={() => onSelectProfile('full-suite')}
                className="px-2.5 py-1 text-xs font-medium rounded-md text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 transition-colors flex items-center gap-1 whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5" />
                روشن کردن تمام ۷ ماژول
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {TEACHING_PROFILES.map((prof) => {
              const isSelected = activeProfileId === prof.id;
              return (
                <button
                  key={prof.id}
                  type="button"
                  onClick={() => onSelectProfile(prof.id)}
                  className={`text-right p-2.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-sky-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold truncate">{prof.title}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </div>
                  <p
                    className={`text-[11px] mt-0.5 line-clamp-1 ${
                      isSelected ? 'text-sky-100' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {prof.subtitle}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 overflow-x-auto">
            {(
              [
                { id: 'all', label: 'همه ماژول‌ها (۷)' },
                { id: 'core', label: 'بوم، قلم و دسکتاپ (۱)' },
                { id: 'stem-labs', label: 'ریاضی، فیزیک و شیمی (۲-۴)' },
                { id: 'humanities', label: 'زیست و ادبیات (۵)' },
                { id: 'media-studio', label: 'خروجی جزوه PDF و امنیت (۶)' },
                { id: 'intelligence', label: 'دست‌نویس آفلاین و فلوچارت (۷)' },
              ] as Array<{ id: CategoryFilter; label: string }>
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  categoryFilter === tab.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی قابلیت (مثلاً: دسکتاپ، دست‌نویس، کسر...)"
              aria-label="جستجوی ماژول یا ابزار"
              className="w-full pr-9 pl-3 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Modules & Granular Sub-Features Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {filteredModules.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                هیچ ماژول یا ابزاری با عبارت «{searchQuery}» یافت نشد.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                }}
                className="mt-3 px-4 py-2 text-xs font-medium rounded-lg bg-sky-600 text-white hover:bg-sky-500 transition-colors"
              >
                نمایش تمام ماژول‌ها
              </button>
            </div>
          ) : (
            filteredModules.map((mod) => {
              const activeSubsCount = mod.subFeatures.filter((s) => s.enabled).length;
              return (
                <div
                  key={mod.id}
                  className={`rounded-xl border transition-colors ${
                    mod.enabled
                      ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      : 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200/60 dark:border-slate-800/60 opacity-80'
                  }`}
                >
                  {/* Module Header Row */}
                  <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={mod.enabled}
                        aria-label={`کلید اصلی ${mod.title}`}
                        onClick={() => onToggleModule(mod.id)}
                        className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 shrink-0 ${
                          mod.enabled ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                            mod.enabled ? '-translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {mod.title}
                          </h3>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                            {fmt(activeSubsCount)} از {fmt(mod.subFeatures.length)} زیرقابلیت فعال
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {mod.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      <span>مصرف پایه: {fmt(mod.baseRamMb)} MB</span>
                      <span aria-hidden="true">·</span>
                      <button
                        type="button"
                        onClick={() => onToggleModule(mod.id)}
                        className={`font-medium flex items-center gap-1 ${
                          mod.enabled
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        {mod.enabled ? 'روشن (فعال در محیط کار)' : 'خاموش (آزادسازی از RAM)'}
                      </button>
                    </div>
                  </div>

                  {/* Sub-features Grid */}
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {mod.subFeatures.map((sf) => {
                      const isSubActive = mod.enabled && sf.enabled;
                      return (
                        <div
                          key={sf.id}
                          className={`p-3 rounded-lg border transition-all flex flex-col justify-between gap-2.5 ${
                            isSubActive
                              ? 'bg-sky-50/40 dark:bg-sky-950/20 border-sky-500/30'
                              : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800/70'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <span
                                className={`text-xs font-semibold block ${
                                  isSubActive
                                    ? 'text-slate-900 dark:text-slate-100'
                                    : 'text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                {sf.title}
                              </span>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                {sf.description}
                              </p>
                            </div>

                            <button
                              type="button"
                              role="switch"
                              aria-checked={isSubActive}
                              aria-label={`تغییر وضعیت ${sf.title}`}
                              onClick={() => onToggleSubFeature(mod.id, sf.id)}
                              className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 shrink-0 mt-0.5 ${
                                isSubActive ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
                              }`}
                            >
                              <span
                                className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                                  isSubActive ? '-translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-mono tabular-nums">
                              <span>RAM: {fmt(sf.ramMb)}MB</span>
                              <span aria-hidden="true">·</span>
                              <span>CPU: {fmt(sf.cpuPct)}%</span>
                            </div>

                            {onLaunchSubFeature && (
                              <button
                                type="button"
                                data-testid={`launch-subfeature-${sf.id}`}
                                onClick={() => onLaunchSubFeature(mod.id, sf.id)}
                                className="px-2.5 py-1 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold flex items-center gap-1 transition-colors shadow-2xs"
                              >
                                <Play className="w-2.5 h-2.5 fill-current" />
                                <span>اجرا و استفاده در برنامه</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            با کلیک روی «اجرا و استفاده در برنامه» در هر کارت، آن قابلیت بلافاصله فعال و روی تخته یا آزمایشگاه باز می‌شود.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500 transition-colors whitespace-nowrap"
          >
            تایید و بازگشت به تخته هوشمند
          </button>
        </div>
      </div>
    </div>
  );
};
