import React, { useState } from 'react';
import {
  Cpu,
  FolderTree,
  Database,
  Layers,
  ChevronDown,
  ChevronLeft,
  Folder,
  FileCode,
  CheckCircle2,
  Sliders,
  ArrowRight,
} from 'lucide-react';
import {
  TECH_STACK_LAYERS,
  PROJECT_FOLDER_TREE,
  DATABASE_AND_STATE_SPEC,
  FolderNode,
} from '../data/architectureData';
import { AppModule, ModuleId, ResourceMetrics, toPersianDigits } from '../core/featureEngine';

interface ArchitectureBlueprintViewProps {
  modules: AppModule[];
  metrics: ResourceMetrics;
  usePersianNumerals: boolean;
  onToggleModule: (moduleId: ModuleId) => void;
  onOpenFeatureManager: () => void;
  onSwitchToWorkspace: () => void;
}

export const ArchitectureBlueprintView: React.FC<ArchitectureBlueprintViewProps> = ({
  modules,
  metrics,
  usePersianNumerals,
  onToggleModule,
  onOpenFeatureManager,
  onSwitchToWorkspace,
}) => {
  const [activeSection, setActiveSection] = useState<'stack' | 'folders' | 'db-state' | 'roadmap'>(
    'stack'
  );

  const fmt = (val: string | number) => toPersianDigits(val, usePersianNumerals);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Hero Banner */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 text-xs text-sky-600 dark:text-sky-400 font-semibold">
              <span>گام اول مهندسی سیستم</span>
              <span aria-hidden="true">·</span>
              <span>معماری دسکتاپ هیبریدی Tauri v2 + Rust + React 19 + FFmpeg</span>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100">
              معماری جامع، ساختار پوشه‌ها، دیتابیس و مدیریت وضعیت نرم‌افزار
            </h1>
            <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              این سند مهندسی، زیرساخت کامل نرم‌افزار دسکتاپ (پوشش ۱۰۰٪ قابلیت‌های سیستم‌عامل نظیر نوشتن شفاف روی ویندوز، ضبط نامرئی رابط کاربری، استودیوی ۴ کاناله FFmpeg و بارگذاری تنبل ۱۰ ماژول آموزشی) را به صورت اجرایی نمایش می‌دهد.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenFeatureManager}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Sliders className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              مدیریت کلید ماژول‌ها ({fmt(metrics.activeModulesCount)}/{fmt(metrics.totalModulesCount)})
            </button>
            <button
              type="button"
              onClick={onSwitchToWorkspace}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-sky-600 text-white hover:bg-sky-500 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <span>ورود به محیط تخته هوشمند و آزمایشگاه‌ها</span>
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </div>

        {/* Section Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          {[
            {
              id: 'stack',
              label: '۱. معماری دسکتاپ (Tauri / Rust / FFmpeg)',
              icon: <Cpu className="w-4 h-4" />,
            },
            {
              id: 'folders',
              label: '۲. ساختار کامل پوشه‌ها (Folder Structure)',
              icon: <FolderTree className="w-4 h-4" />,
            },
            {
              id: 'db-state',
              label: '۳. دیتابیس SQLite و مدیریت وضعیت (Zustand)',
              icon: <Database className="w-4 h-4" />,
            },
            {
              id: 'roadmap',
              label: '۴. وضعیت ۱۰ ماژول و نقشه راه پیاده‌سازی',
              icon: <Layers className="w-4 h-4" />,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id as typeof activeSection)}
              className={`flex-1 min-w-48 py-2.5 px-4 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                activeSection === tab.id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* SECTION 1: DESKTOP ARCHITECTURE STACK */}
        {activeSection === 'stack' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-400">هسته دسکتاپ پیشنهادی</span>
                <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                  Tauri v2 (Rust) + React 19 + TS
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  ۶۵٪ مصرف RAM کمتر نسبت به Electron و دسترسی مستقیم به APIهای کرنل ویندوز و مک.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-400">موتور گرافیک و قلم ۱۲۰ هرتز</span>
                <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                  WebGL2 / Skia CanvasKit + R-Tree
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  پشتیبانی از حساسیت فشار قلم Wacom، تثبیت‌کننده دستخط One-Euro و بوم بی‌نهایت.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-400">موتور ضبط ۴ کاناله و تدوین</span>
                <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                  FFmpeg Sidecar + WebCodecs + RNNoise
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  ضبط ۴ ترک مجزا، حذف نویز عصبی میکروفون، برش سکوت و تبدیل ریلز ۹:۱۶.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {TECH_STACK_LAYERS.map((layer, index) => (
                <div
                  key={layer.id}
                  className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {fmt(index + 1)}. {layer.layerName}
                    </h3>
                    <span className="text-xs font-mono font-semibold text-sky-600 dark:text-sky-400">
                      {layer.techChoice}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {layer.whyChosen}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      مزیت رقابتی:
                    </span>
                    <span>{layer.alternativeCompared}</span>
                    <span aria-hidden="true">·</span>
                    <span>پوشش: {layer.coveredModules.join(' ، ')}</span>
                  </div>
                  <pre
                    dir="ltr"
                    className="p-3.5 rounded-lg bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800"
                  >
                    <code>{layer.codeSnippet}</code>
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 2: FOLDER STRUCTURE */}
        {activeSection === 'folders' && (
          <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                ساختار کامل پوشه‌ها (Feature-Sliced Modular Monorepo)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                هر یک از ۱۰ ماژول در پوشه مستقل خود قرار دارد تا در زمان خاموش بودن کلید آن در Feature Manager، هیچ اثری در حافظه (RAM) نداشته باشد:
              </p>
            </div>
            <div className="space-y-2 pt-2">
              {PROJECT_FOLDER_TREE.map((node, idx) => (
                <FolderTreeItem key={idx} node={node} depth={0} defaultExpanded />
              ))}
            </div>
          </div>
        )}

        {/* SECTION 3: SQLITE DATABASE & ZUSTAND STATE */}
        {activeSection === 'db-state' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                ۱. ساختار دیتابیس محلی SQLite (ذخیره آنی در حالت WAL)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ذخیره پروفایل‌های تدریس، لایه‌های فتوشاپی تخته (به صورت باینری فشرده FlatBuffers برای لود زیر ۱۰ میلی‌ثانیه) و پروژه‌های ۴ کاناله ویدیو:
              </p>
              <pre
                dir="ltr"
                className="p-4 rounded-lg bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800"
              >
                <code>{DATABASE_AND_STATE_SPEC.sqliteSchema}</code>
              </pre>
            </div>

            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                ۲. معماری مدیریت وضعیت سه لایه‌ای (Zustand + 120Hz Transient Refs)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                جداسازی وضعیت لحظه‌ای قلم (۱۲۰ بار در ثانیه بدون رندر مجدد React) از وضعیت کلیدهای روشن/خاموش ماژول‌ها:
              </p>
              <pre
                dir="ltr"
                className="p-4 rounded-lg bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800"
              >
                <code>{DATABASE_AND_STATE_SPEC.zustandArchitecture}</code>
              </pre>
            </div>
          </div>
        )}

        {/* SECTION 4: 10-MODULE ROADMAP & QUICK TOGGLES */}
        {activeSection === 'roadmap' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modules.map((mod) => {
              const activeSubs = mod.subFeatures.filter((s) => s.enabled).length;
              return (
                <div
                  key={mod.id}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 ${
                            mod.enabled ? 'text-emerald-500' : 'text-slate-400'
                          }`}
                        />
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {mod.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {mod.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={mod.enabled}
                      aria-label={`تغییر وضعیت ${mod.shortTitle}`}
                      onClick={() => onToggleModule(mod.id)}
                      className={`w-10 h-5 rounded-full transition-colors relative flex items-center px-0.5 shrink-0 ${
                        mod.enabled ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          mod.enabled ? '-translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 tabular-nums">
                    <span>
                      زیرقابلیت‌های روشن: {fmt(activeSubs)} از {fmt(mod.subFeatures.length)}
                    </span>
                    <span className="font-mono">پایه: {fmt(mod.baseRamMb)} MB</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const FolderTreeItem: React.FC<{
  node: FolderNode;
  depth: number;
  defaultExpanded?: boolean;
}> = ({ node, depth, defaultExpanded = true }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasChildren = Boolean(node.children && node.children.length > 0);

  return (
    <div className="select-none">
      <div
        onClick={() => hasChildren && setExpanded((e) => !e)}
        style={{ paddingRight: `${depth * 20 + 8}px` }}
        className={`flex items-center justify-between gap-3 py-2 px-3 rounded-lg transition-colors ${
          hasChildren
            ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60'
            : 'hover:bg-slate-50 dark:hover:bg-slate-900'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-slate-400 shrink-0" />
            )
          ) : (
            <span className="w-4 shrink-0" />
          )}
          {node.type === 'folder' ? (
            <Folder className="w-4 h-4 text-amber-500 shrink-0" />
          ) : (
            <FileCode className="w-4 h-4 text-sky-500 shrink-0" />
          )}
          <span dir="ltr" className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
            {node.name}
          </span>
          {node.badge && (
            <span className="text-[11px] text-sky-600 dark:text-sky-400 font-medium">
              · {node.badge}
            </span>
          )}
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md hidden sm:inline">
          {node.description}
        </span>
      </div>
      {hasChildren && expanded && (
        <div className="border-r border-slate-200 dark:border-slate-800 mr-4">
          {node.children!.map((child, idx) => (
            <FolderTreeItem key={idx} node={child} depth={depth + 1} defaultExpanded />
          ))}
        </div>
      )}
    </div>
  );
};
