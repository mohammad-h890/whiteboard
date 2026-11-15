import React, { useState, useEffect, useMemo } from 'react';
import {
  PenTool,
  Highlighter,
  Eraser,
  CircleDot,
  Compass,
  Sliders,
  Sun,
  Moon,
  PanelRightClose,
  PanelRightOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
  Columns,
  Layers,
  MonitorUp,
  Keyboard,
  Settings2,
  FlaskConical,
} from 'lucide-react';
import {
  INITIAL_MODULES,
  AppModule,
  ModuleId,
  TeachingProfileId,
  TEACHING_PROFILES,
  CanvasBackgroundId,
  applyTeachingProfile,
  toggleModuleMaster,
  toggleSubFeature,
  calculateResourceUsage,
  isSubFeatureActive,
  toPersianDigits,
} from './core/featureEngine';
import {
  INITIAL_RECENT_PROJECTS,
  RecentProjectItem,
  appendRecentProjectItem,
} from './core/studioAndAiEngine';
import { FeatureManagerModal } from './components/FeatureManagerModal';
import { InteractiveLabsPanel, LabTabId } from './components/InteractiveLabsPanel';
import {
  SmartWhiteboardCanvas,
  PenToolId,
  BoardLayer,
  StampedBoardWidget,
} from './components/SmartWhiteboardCanvas';
import { StudioTimelineDock, WebcamKeyframeMode } from './components/StudioTimelineDock';
import { ArchitectureBlueprintView } from './components/ArchitectureBlueprintView';
import { SmartExportAndAiModal, StudioModalMode } from './components/SmartExportAndAiModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { RecentProjectsMenu } from './components/RecentProjectsMenu';

type MainViewMode = 'workspace' | 'architecture';

const STORAGE_KEY = 'daneshboard_persisted_settings_v2';

interface PersistedSettingsState {
  isDark?: boolean;
  modules?: AppModule[];
  activeProfileId?: TeachingProfileId;
  usePersianNumerals?: boolean;
  canvasMode?: 'infinite' | 'a4' | '16:9' | '9:16';
  background?: CanvasBackgroundId;
  activeTool?: PenToolId;
  strokeColor?: string;
  strokeWidth?: number;
  stabilizationLevel?: number;
  rightPenDockOpen?: boolean;
  leftLabDockOpen?: boolean;
  activeLabTab?: LabTabId;
  webcamEnabled?: boolean;
  webcamKeyframeMode?: WebcamKeyframeMode;
  invisibleUiMode?: boolean;
  floatingWatermark?: boolean;
  watermarkCode?: string;
  recentProjects?: RecentProjectItem[];
}

function loadPersistedSettings(): PersistedSettingsState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export default function App() {
  const initialSaved = useMemo(() => loadPersistedSettings(), []);

  // Theme state (persisted across reloads)
  const [isDark, setIsDark] = useState<boolean>(initialSaved.isDark ?? true);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  // Core Modular Feature Manager State (10 Modules, 48 Sub-features)
  const [modules, setModules] = useState<AppModule[]>(
    initialSaved.modules ?? INITIAL_MODULES
  );
  const [activeProfileId, setActiveProfileId] = useState<TeachingProfileId>(
    initialSaved.activeProfileId ?? 'physics-lab'
  );
  const [featureManagerOpen, setFeatureManagerOpen] = useState<boolean>(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState<boolean>(false);
  const [canvasSettingsOpen, setCanvasSettingsOpen] = useState<boolean>(false);
  const [mainView, setMainView] = useState<MainViewMode>('workspace');
  const [usePersianNumerals, setUsePersianNumerals] = useState<boolean>(
    initialSaved.usePersianNumerals ?? true
  );

  // Canvas & Ink Engine State (Module 1)
  const [canvasMode, setCanvasMode] = useState<'infinite' | 'a4' | '16:9' | '9:16'>(
    initialSaved.canvasMode ?? 'infinite'
  );
  const [background, setBackground] = useState<CanvasBackgroundId>(
    initialSaved.background ?? 'grid'
  );
  const [activeTool, setActiveTool] = useState<PenToolId>(
    initialSaved.activeTool ?? 'fountain'
  );
  const [strokeColor, setStrokeColor] = useState<string>(
    initialSaved.strokeColor ?? '#38bdf8'
  );
  const [strokeWidth, setStrokeWidth] = useState<number>(
    initialSaved.strokeWidth ?? 3
  );
  const [stabilizationLevel, setStabilizationLevel] = useState<number>(
    initialSaved.stabilizationLevel ?? 6
  );
  const [splitScreenPdfOpen, setSplitScreenPdfOpen] = useState<boolean>(false);
  const [desktopOverlayMode, setDesktopOverlayMode] = useState<boolean>(false);
  const [clearTrigger, setClearTrigger] = useState<number>(0);

  // Collapsible Ergonomic Docks State — Default compact so 88%+ of screen is pure Whiteboard!
  const [rightPenDockOpen, setRightPenDockOpen] = useState<boolean>(
    initialSaved.rightPenDockOpen ?? false
  );
  const [leftLabDockOpen, setLeftLabDockOpen] = useState<boolean>(
    initialSaved.leftLabDockOpen ?? false
  );
  const [activeLabTab, setActiveLabTab] = useState<LabTabId>(
    initialSaved.activeLabTab ?? 'math'
  );

  // Photoshop-style Layers State
  const [layers, setLayers] = useState<BoardLayer[]>([
    { id: 'layer-1-question', name: '۱. سوالات (قفل)', role: 'question', visible: true, locked: true },
    { id: 'layer-2-solution', name: '۲. دستخط حل استاد', role: 'solution', visible: true, locked: false },
    { id: 'layer-3-answer', name: '۳. پاسخ تشریحی', role: 'answer-key', visible: false, locked: true },
  ]);
  const [activeLayerId, setActiveLayerId] = useState<string>('layer-2-solution');

  // Stamped Lab Widgets & Callouts on Board
  const [stampedWidgets, setStampedWidgets] = useState<StampedBoardWidget[]>([]);
  const [calloutStamps, setCalloutStamps] = useState<string[]>([]);

  // Recent Projects (tracks last 5 exported PDF files or session recordings)
  const [recentProjects, setRecentProjects] = useState<RecentProjectItem[]>(
    initialSaved.recentProjects ?? INITIAL_RECENT_PROJECTS
  );

  // Multi-Track Recording Studio, NLE, Smart Export & AI State (Modules 7, 8, 9, 10)
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [webcamEnabled, setWebcamEnabled] = useState<boolean>(
    initialSaved.webcamEnabled ?? true
  );
  const [webcamKeyframeMode, setWebcamKeyframeMode] = useState<WebcamKeyframeMode>(
    initialSaved.webcamKeyframeMode ?? 'bubble-left'
  );
  const [invisibleUiMode, setInvisibleUiMode] = useState<boolean>(
    initialSaved.invisibleUiMode ?? true
  );
  const [teleprompterOpen, setTeleprompterOpen] = useState<boolean>(false);
  const [spotlightActive, setSpotlightActive] = useState<boolean>(false);
  const [floatingWatermark, setFloatingWatermark] = useState<boolean>(
    initialSaved.floatingWatermark ?? false
  );
  const [watermarkCode, setWatermarkCode] = useState<string>(
    initialSaved.watermarkCode ?? 'DB-98421'
  );
  const [reelsPreviewMode, setReelsPreviewMode] = useState<boolean>(false);
  const [exportModalType, setExportModalType] = useState<StudioModalMode | null>(null);

  // Save all applied settings to localStorage whenever any setting changes
  useEffect(() => {
    try {
      const payload: PersistedSettingsState = {
        isDark,
        modules,
        activeProfileId,
        usePersianNumerals,
        canvasMode,
        background,
        activeTool,
        strokeColor,
        strokeWidth,
        stabilizationLevel,
        rightPenDockOpen,
        leftLabDockOpen,
        activeLabTab,
        webcamEnabled,
        webcamKeyframeMode,
        invisibleUiMode,
        floatingWatermark,
        watermarkCode,
        recentProjects,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }, [
    isDark,
    modules,
    activeProfileId,
    usePersianNumerals,
    canvasMode,
    background,
    activeTool,
    strokeColor,
    strokeWidth,
    stabilizationLevel,
    rightPenDockOpen,
    leftLabDockOpen,
    activeLabTab,
    webcamEnabled,
    webcamKeyframeMode,
    invisibleUiMode,
    floatingWatermark,
    watermarkCode,
    recentProjects,
  ]);

  useEffect(() => {
    if (!isRecording) return;
    const id = window.setInterval(() => {
      setRecordingSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [isRecording]);

  const metrics = useMemo(() => calculateResourceUsage(modules), [modules]);
  const fmt = (val: string | number) => toPersianDigits(val, usePersianNumerals);

  const handleRecordProjectItem = (
    title: string,
    teacherName: string,
    kind: 'pdf-handout' | 'session-recording',
    durationOrPagesLabel: string = kind === 'pdf-handout' ? '۲ صفحه A4 وکتور' : 'ضبط ۴ کاناله'
  ) => {
    setRecentProjects((prev) =>
      appendRecentProjectItem(
        prev,
        {
          id: `proj-${Date.now()}`,
          title,
          teacherName,
          kind,
          timestampLabel: 'همین الان',
          durationOrPagesLabel,
          profileId: activeProfileId,
          watermarkCode,
        },
        5
      )
    );
  };

  const handleToggleRecordingSession = () => {
    if (isRecording) {
      const mins = Math.floor(recordingSeconds / 60);
      const secs = recordingSeconds % 60;
      const durLabel = `${fmt(String(mins).padStart(2, '0'))}:${fmt(
        String(secs).padStart(2, '0')
      )} (۴ ترک ایزوله)`;
      handleRecordProjectItem(
        `ضبط ۴ کاناله جلسه (${
          TEACHING_PROFILES.find((p) => p.id === activeProfileId)?.title ?? 'تدریس'
        })`,
        'مهندس محمدحسین احمدی',
        'session-recording',
        durLabel
      );
      setIsRecording(false);
    } else {
      setRecordingSeconds(0);
      setIsRecording(true);
    }
  };

  const handleTriggerShortcutAction = (shortcutId: string) => {
    switch (shortcutId) {
      case 'tool-fountain':
        setActiveTool('fountain');
        break;
      case 'tool-pencil':
        setActiveTool('pencil');
        break;
      case 'tool-highlighter':
        setActiveTool('highlighter');
        break;
      case 'tool-laser':
        setActiveTool('laser-vanish');
        break;
      case 'tool-shape-snap':
        setActiveTool('shape-snap');
        break;
      case 'tool-lasso':
        setActiveTool('lasso');
        break;
      case 'tool-eraser':
        setActiveTool('eraser-stroke');
        break;
      case 'rec-toggle':
        handleToggleRecordingSession();
        break;
      case 'rec-webcam-mode':
        setWebcamKeyframeMode((m) =>
          m === 'bubble-left'
            ? 'fullscreen-talk'
            : m === 'fullscreen-talk'
            ? 'hidden-writing'
            : 'bubble-left'
        );
        break;
      case 'rec-teleprompter':
        setTeleprompterOpen((t) => !t);
        break;
      case 'rec-spotlight':
        setSpotlightActive((s) => !s);
        break;
      case 'rec-callout':
        setCalloutStamps((prev) => [...prev, 'نکته طلایی کنکور!']);
        break;
      case 'layer-select-1':
        setActiveLayerId('layer-1-question');
        break;
      case 'layer-select-2':
        setActiveLayerId('layer-2-solution');
        break;
      case 'layer-select-3':
        setActiveLayerId('layer-3-answer');
        setLayers((prev) =>
          prev.map((l) => (l.id === 'layer-3-answer' ? { ...l, visible: !l.visible } : l))
        );
        break;
      case 'layer-lock-toggle':
        setLayers((prev) =>
          prev.map((l) => (l.id === activeLayerId ? { ...l, locked: !l.locked } : l))
        );
        break;
      case 'modal-shortcuts':
        setShortcutsModalOpen((o) => !o);
        break;
      default:
        break;
    }
  };

  // Global keyboard listener for shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === '?' || e.key === 'F1') {
        e.preventDefault();
        setShortcutsModalOpen((o) => !o);
        return;
      }
      if (e.key === 'F9') {
        e.preventDefault();
        handleTriggerShortcutAction('rec-toggle');
        return;
      }
      if (e.key === 'F10') {
        e.preventDefault();
        handleTriggerShortcutAction('rec-webcam-mode');
        return;
      }
      if (e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        handleTriggerShortcutAction('rec-teleprompter');
        return;
      }
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleTriggerShortcutAction('rec-spotlight');
        return;
      }
      if (e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleTriggerShortcutAction('rec-callout');
        return;
      }
      if (e.altKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        handleTriggerShortcutAction('layer-lock-toggle');
        return;
      }
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const k = e.key.toLowerCase();
        if (k === 'p') setActiveTool('fountain');
        else if (k === 'b') setActiveTool('pencil');
        else if (k === 'h') setActiveTool('highlighter');
        else if (k === 'l') setActiveTool('laser-vanish');
        else if (k === 's') setActiveTool('shape-snap');
        else if (k === 'v') setActiveTool('lasso');
        else if (k === 'e') setActiveTool('eraser-stroke');
        else if (k === '1') handleTriggerShortcutAction('layer-select-1');
        else if (k === '2') handleTriggerShortcutAction('layer-select-2');
        else if (k === '3') handleTriggerShortcutAction('layer-select-3');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const handleSelectProfile = (profileId: TeachingProfileId) => {
    setActiveProfileId(profileId);
    const updated = applyTeachingProfile(profileId, modules);
    setModules(updated);

    const prof = TEACHING_PROFILES.find((p) => p.id === profileId);
    if (prof) {
      setBackground(prof.recommendedBackground);
      if (prof.recommendedLabTab) {
        setActiveLabTab(prof.recommendedLabTab);
      }
    }
  };

  const handleToggleModule = (moduleId: ModuleId, forceState?: boolean) => {
    setModules((prev) => toggleModuleMaster(prev, moduleId, forceState));
  };

  const handleToggleSubFeature = (moduleId: ModuleId, subFeatureId: string) => {
    setModules((prev) => toggleSubFeature(prev, moduleId, subFeatureId));
  };

  const handleStampToBoard = (title: string, summary: string, badgeColor: string) => {
    setStampedWidgets((prev) => [
      ...prev,
      {
        id: `widget-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title,
        summary,
        badgeColor,
        x: 150 + (prev.length % 4) * 55,
        y: 80 + (prev.length % 4) * 45,
      },
    ]);
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* =====================================================================
          SINGLE ULTRA-CLEAN TOP HEADER (Strictly 3 Zones)
      ===================================================================== */}
      <header className="flex items-center justify-between gap-4 px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shrink-0 z-30">
        {/* Zone 1: Brand Wordmark */}
        <a
          href="#workspace"
          onClick={(e) => {
            e.preventDefault();
            setMainView('workspace');
          }}
          className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0"
        >
          دانش‌بورد استودیو (DaneshBoard)
        </a>

        {/* Zone 2: Navigation & Quick Drawers (Interactive Labs, Canvas Settings, Recent Projects, Architecture) */}
        <nav
          aria-label="ناوبری اصلی"
          className="flex items-center gap-2 sm:gap-3 text-xs font-semibold"
        >
          <button
            type="button"
            onClick={() => {
              setMainView('workspace');
              setLeftLabDockOpen((o) => !o);
            }}
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              leftLabDockOpen
                ? 'bg-sky-600 text-white border-sky-500 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-sky-500'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>آزمایشگاه‌های دروس</span>
          </button>

          {/* Compact Canvas & Profile Settings Popover Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setCanvasSettingsOpen((v) => !v)}
              aria-expanded={canvasSettingsOpen}
              className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                canvasSettingsOpen
                  ? 'bg-sky-600 text-white border-sky-500'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-sky-500'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5 text-sky-500" />
              <span>تنظیمات تخته و پروفایل</span>
            </button>

            {canvasSettingsOpen && (
              <div className="absolute right-0 mt-2 w-80 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    تنظیمات بوم و پروفایل (ذخیره خودکار)
                  </span>
                  <button
                    type="button"
                    onClick={() => setCanvasSettingsOpen(false)}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <label className="block space-y-1">
                  <span className="text-[11px] text-slate-500">پروفایل تدریس:</span>
                  <select
                    id="teaching-profile-select"
                    value={activeProfileId}
                    onChange={(e) => handleSelectProfile(e.target.value as TeachingProfileId)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                  >
                    {TEACHING_PROFILES.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block space-y-1">
                    <span className="text-[11px] text-slate-500">حالت بوم:</span>
                    <select
                      id="canvas-mode-select"
                      value={canvasMode}
                      onChange={(e) =>
                        setCanvasMode(e.target.value as 'infinite' | 'a4' | '16:9' | '9:16')
                      }
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <option value="infinite">بوم بی‌نهایت</option>
                      <option value="16:9">استاندارد ۱۶:۹</option>
                      <option value="a4">صفحه‌بندی A4</option>
                      <option value="9:16">عمودی ۹:۱۶</option>
                    </select>
                  </label>

                  <label className="block space-y-1">
                    <span className="text-[11px] text-slate-500">الگوی تخته:</span>
                    <select
                      id="canvas-bg-select"
                      value={background}
                      onChange={(e) => setBackground(e.target.value as CanvasBackgroundId)}
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <option value="grid">شطرنجی مهندسی</option>
                      <option value="white">تخته سفید ساده</option>
                      <option value="blackboard">تخته سیاه کلاسیک</option>
                      <option value="greenboard">تخته سبز گچی</option>
                      <option value="sepia">کاغذ کاهی</option>
                      <option value="lined">خط‌دار تحریری</option>
                      <option value="dots">نقطه‌ای (Dot Grid)</option>
                      <option value="isometric">ایزومتریک سه‌بعدی</option>
                      <option value="music">خطوط حامل موسیقی</option>
                    </select>
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setSplitScreenPdfOpen((v) => !v)}
                    className={`flex-1 py-1.5 px-2 rounded-lg border font-medium flex items-center justify-center gap-1 ${
                      splitScreenPdfOpen
                        ? 'bg-sky-600 text-white border-sky-500'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span>تقسیم صفحه + PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDesktopOverlayMode((v) => !v)}
                    className={`flex-1 py-1.5 px-2 rounded-lg border font-medium flex items-center justify-center gap-1 ${
                      desktopOverlayMode
                        ? 'bg-amber-600 text-white border-amber-500'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <MonitorUp className="w-3.5 h-3.5" />
                    <span>نوشتن روی دسکتاپ</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                    صرفه‌جویی RAM: {fmt(metrics.savedRamMb)}MB ({fmt(metrics.ramSavingsPercent)}٪)
                  </span>
                  <button
                    type="button"
                    onClick={() => setUsePersianNumerals((p) => !p)}
                    className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold"
                  >
                    اعداد: {usePersianNumerals ? 'فارسی (۰-۹)' : 'EN (0-9)'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Recent Projects Dropdown (Tracks last 5 PDF exports & recordings) */}
          <RecentProjectsMenu
            recentProjects={recentProjects}
            usePersianNumerals={usePersianNumerals}
            onRestoreProject={(item) => {
              setMainView('workspace');
              if (item.profileId) {
                handleSelectProfile(item.profileId as TeachingProfileId);
              }
              setWatermarkCode(item.watermarkCode);
              handleStampToBoard(
                item.title,
                `مدرس: ${item.teacherName} · ${item.durationOrPagesLabel}`,
                '#0284c7'
              );
            }}
            onClearHistory={() => setRecentProjects([])}
          />

          <a
            href="#architecture"
            onClick={(e) => {
              e.preventDefault();
              setMainView((v) => (v === 'architecture' ? 'workspace' : 'architecture'));
            }}
            className={`hidden lg:inline-block px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
              mainView === 'architecture'
                ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {mainView === 'architecture' ? 'بازگشت به تخته سفید' : 'معماری پروژه'}
          </a>
        </nav>

        {/* Zone 3: Keyboard Shortcuts Icon Trigger, Theme Toggle & Feature Manager Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShortcutsModalOpen(true)}
            aria-label="راهنمای کلیدهای میانبر"
            title="راهنمای کلیدهای میانبر (?)"
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-sky-500 transition-colors"
          >
            <Keyboard className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </button>

          <button
            type="button"
            onClick={() => setIsDark((d) => !d)}
            aria-label={isDark ? 'تغییر به پوسته روشن' : 'تغییر به پوسته تیره'}
            title={isDark ? 'پوسته روشن' : 'پوسته تیره'}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-sky-500 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setFeatureManagerOpen(true)}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-xs"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>
              ماژول‌ها ({fmt(metrics.activeModulesCount)}/{fmt(metrics.totalModulesCount)})
            </span>
          </button>
        </div>
      </header>

      {/* =====================================================================
          MAIN BODY: MAXIMIZED SMART WHITEBOARD WORKSPACE
      ===================================================================== */}
      {mainView === 'architecture' ? (
        <ArchitectureBlueprintView
          modules={modules}
          metrics={metrics}
          usePersianNumerals={usePersianNumerals}
          onToggleModule={(id) => handleToggleModule(id)}
          onOpenFeatureManager={() => setFeatureManagerOpen(true)}
          onSwitchToWorkspace={() => setMainView('workspace')}
        />
      ) : (
        <main className="flex-1 flex overflow-hidden relative">
          {/* Collapsible Slim Right Dock (in RTL): Smart Ink Tools */}
          <aside
            aria-label="نوار ابزار قلم و ترسیم"
            className={`border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between transition-all shrink-0 z-20 ${
              rightPenDockOpen ? 'w-52 p-2.5' : 'w-13 p-1.5 items-center'
            }`}
          >
            <div className="space-y-2 w-full">
              <div className="flex items-center justify-between">
                {rightPenDockOpen && (
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    موتور قلم و ترسیم
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setRightPenDockOpen((v) => !v)}
                  aria-label={rightPenDockOpen ? 'جمع کردن نوار قلم' : 'باز کردن تنظیمات قلم'}
                  title={rightPenDockOpen ? 'جمع کردن نوار قلم' : 'باز کردن تنظیمات قلم'}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 mx-auto"
                >
                  {rightPenDockOpen ? (
                    <PanelRightClose className="w-4 h-4" />
                  ) : (
                    <PanelRightOpen className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Pen Tools List */}
              <div className="space-y-1">
                {(
                  [
                    {
                      id: 'fountain',
                      label: 'روان‌نویس هوشمند (P)',
                      icon: <PenTool className="w-4 h-4 shrink-0" />,
                    },
                    {
                      id: 'pencil',
                      label: 'مداد بافت طبیعی (B)',
                      icon: <PenTool className="w-4 h-4 shrink-0" />,
                    },
                    {
                      id: 'highlighter',
                      label: 'هایلایتر زیر متن (H)',
                      icon: <Highlighter className="w-4 h-4 shrink-0" />,
                    },
                    {
                      id: 'laser-vanish',
                      label: 'قلم لیزری محوشونده (L)',
                      icon: <CircleDot className="w-4 h-4 shrink-0" />,
                    },
                    {
                      id: 'shape-snap',
                      label: 'تشخیص شکل هوشمند (S)',
                      icon: <Compass className="w-4 h-4 shrink-0" />,
                    },
                    {
                      id: 'lasso',
                      label: 'ابزار کمند (V)',
                      icon: <Compass className="w-4 h-4 shrink-0" />,
                    },
                    {
                      id: 'eraser-stroke',
                      label: 'پاک‌کن خطی (E)',
                      icon: <Eraser className="w-4 h-4 shrink-0" />,
                    },
                    {
                      id: 'eraser-pixel',
                      label: 'پاک‌کن پیکسلی',
                      icon: <Eraser className="w-4 h-4 shrink-0" />,
                    },
                  ] as Array<{ id: PenToolId; label: string; icon: React.ReactNode }>
                ).map((tool) => {
                  const isActive = activeTool === tool.id;
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => setActiveTool(tool.id)}
                      title={tool.label}
                      aria-label={tool.label}
                      className={`w-full flex items-center ${
                        rightPenDockOpen ? 'gap-2 px-2.5' : 'justify-center px-1'
                      } py-2 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-sky-600 text-white font-semibold shadow-2xs'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {tool.icon}
                      {rightPenDockOpen && <span className="truncate">{tool.label}</span>}
                    </button>
                  );
                })}
              </div>

              {/* Compact Color Swatches (Always accessible even when dock is slim!) */}
              <div
                className={`pt-2 border-t border-slate-200 dark:border-slate-800 ${
                  rightPenDockOpen ? 'space-y-3' : 'flex flex-col items-center gap-1.5'
                }`}
              >
                <div className={rightPenDockOpen ? 'flex items-center gap-1.5' : 'flex flex-col gap-1.5'}>
                  {[
                    { c: '#38bdf8', name: 'آبی آسمانی' },
                    { c: '#10b981', name: 'سبز زمردی' },
                    { c: '#f59e0b', name: 'زرد کهربایی' },
                    { c: '#f43f5e', name: 'قرمز مرجانی' },
                    { c: '#a855f7', name: 'بنفش' },
                  ].map((sw) => (
                    <button
                      key={sw.c}
                      type="button"
                      onClick={() => setStrokeColor(sw.c)}
                      aria-label={`انتخاب رنگ ${sw.name}`}
                      style={{ backgroundColor: sw.c }}
                      className={`w-5 h-5 rounded-full border-2 transition-transform ${
                        strokeColor === sw.c
                          ? 'scale-115 border-slate-900 dark:border-white'
                          : 'border-transparent'
                      }`}
                    />
                  ))}
                </div>

                {rightPenDockOpen && (
                  <>
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-500">ضخامت قلم:</span>
                        <span className="font-mono font-bold tabular-nums">
                          {fmt(strokeWidth)}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min={2}
                        max={10}
                        value={strokeWidth}
                        onChange={(e) => setStrokeWidth(Number(e.target.value))}
                        aria-label="ضخامت قلم"
                        className="w-full accent-sky-600"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-500">حذف لرزش دست:</span>
                        <span className="font-mono font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                          {fmt(stabilizationLevel * 10)}٪
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={10}
                        value={stabilizationLevel}
                        onChange={(e) => setStabilizationLevel(Number(e.target.value))}
                        aria-label="تثبیت‌کننده دستخط"
                        className="w-full accent-sky-600"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Clear Board Button */}
            <button
              type="button"
              onClick={() => {
                setClearTrigger((c) => c + 1);
                setStampedWidgets([]);
                setCalloutStamps([]);
              }}
              title="پاکسازی صفحه تخته"
              aria-label="پاکسازی دستخط تخته"
              className="w-full flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              {rightPenDockOpen && <span>پاکسازی تخته</span>}
            </button>
          </aside>

          {/* Center Interactive Smart Whiteboard Canvas (Occupies 88%+ of Viewport) */}
          <SmartWhiteboardCanvas
            canvasMode={canvasMode}
            background={background}
            activeTool={activeTool}
            onSelectTool={setActiveTool}
            strokeColor={strokeColor}
            onSelectColor={setStrokeColor}
            strokeWidth={strokeWidth}
            stabilizationLevel={stabilizationLevel}
            holdToSnapEnabled={isSubFeatureActive(modules, 'hold-to-snap-shapes')}
            splitScreenPdfOpen={splitScreenPdfOpen}
            desktopOverlayMode={desktopOverlayMode}
            layers={layers}
            activeLayerId={activeLayerId}
            onSelectLayer={setActiveLayerId}
            onToggleLayerVisible={(id) =>
              setLayers((prev) =>
                prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
              )
            }
            onToggleLayerLock={(id) =>
              setLayers((prev) =>
                prev.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l))
              )
            }
            stampedWidgets={stampedWidgets}
            onRemoveStampedWidget={(id) =>
              setStampedWidgets((prev) => prev.filter((w) => w.id !== id))
            }
            calloutStamps={calloutStamps}
            webcamEnabled={webcamEnabled}
            webcamKeyframeMode={webcamKeyframeMode}
            invisibleUiMode={invisibleUiMode}
            teleprompterOpen={teleprompterOpen}
            onCloseTeleprompter={() => setTeleprompterOpen(false)}
            spotlightActive={spotlightActive}
            floatingWatermark={floatingWatermark}
            watermarkCode={watermarkCode}
            reelsPreviewMode={reelsPreviewMode}
            aiOcrEnabled={modules.find((m) => m.id === 'mod-10-ai')?.enabled ?? true}
            usePersianNumerals={usePersianNumerals}
            clearTrigger={clearTrigger}
          />

          {/* Collapsible Left Dock (in RTL): Interactive Subject Labs & Konkur Tools */}
          {leftLabDockOpen ? (
            <aside
              aria-label="آزمایشگاه‌های تعاملی دروس"
              className="w-80 lg:w-96 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 z-20 shadow-xl"
            >
              <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    آزمایشگاه‌های تعاملی و ابزارک‌ها
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setLeftLabDockOpen(false)}
                  aria-label="بستن پنل آزمایشگاه‌ها"
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-hidden">
                <InteractiveLabsPanel
                  modules={modules}
                  activeTab={activeLabTab}
                  onChangeTab={setActiveLabTab}
                  onToggleModule={handleToggleModule}
                  usePersianNumerals={usePersianNumerals}
                  onStampToBoard={handleStampToBoard}
                />
              </div>
            </aside>
          ) : null}
        </main>
      )}

      {/* =====================================================================
          BOTTOM STUDIO TIMELINE & SMART EXPORT DOCK (Modules 7, 8, 9, 10)
      ===================================================================== */}
      {mainView === 'workspace' && (
        <StudioTimelineDock
          modules={modules}
          usePersianNumerals={usePersianNumerals}
          isRecording={isRecording}
          recordingSeconds={recordingSeconds}
          onToggleRecording={handleToggleRecordingSession}
          webcamEnabled={webcamEnabled}
          onToggleWebcam={() => setWebcamEnabled((w) => !w)}
          webcamKeyframeMode={webcamKeyframeMode}
          onChangeWebcamKeyframeMode={setWebcamKeyframeMode}
          invisibleUiMode={invisibleUiMode}
          onToggleInvisibleUi={() => setInvisibleUiMode((u) => !u)}
          teleprompterOpen={teleprompterOpen}
          onToggleTeleprompter={() => setTeleprompterOpen((t) => !t)}
          spotlightActive={spotlightActive}
          onToggleSpotlight={() => setSpotlightActive((s) => !s)}
          floatingWatermark={floatingWatermark}
          onToggleWatermark={() => setFloatingWatermark((w) => !w)}
          reelsPreviewMode={reelsPreviewMode}
          onToggleReelsPreview={() => setReelsPreviewMode((r) => !r)}
          onAddCalloutStamp={(label) => setCalloutStamps((prev) => [...prev, label])}
          onTriggerExportModal={(t) => setExportModalType(t)}
          onOpenAiStudioModal={() => setExportModalType('ai-assistant')}
        />
      )}

      {/* =====================================================================
          GLOBAL & GRANULAR FEATURE MANAGER MODAL
      ===================================================================== */}
      <FeatureManagerModal
        isOpen={featureManagerOpen}
        onClose={() => setFeatureManagerOpen(false)}
        modules={modules}
        activeProfileId={activeProfileId}
        onSelectProfile={handleSelectProfile}
        onToggleModule={handleToggleModule}
        onToggleSubFeature={handleToggleSubFeature}
        metrics={metrics}
        usePersianNumerals={usePersianNumerals}
      />

      {/* =====================================================================
          SMART EXPORT & AI ASSISTANT STUDIO MODAL (Modules 9 & 10)
      ===================================================================== */}
      <SmartExportAndAiModal
        mode={exportModalType}
        onClose={() => setExportModalType(null)}
        onSwitchMode={(m) => setExportModalType(m)}
        usePersianNumerals={usePersianNumerals}
        watermarkCode={watermarkCode}
        onChangeWatermarkCode={setWatermarkCode}
        floatingWatermark={floatingWatermark}
        onToggleWatermark={() => setFloatingWatermark((w) => !w)}
        onStampToBoard={handleStampToBoard}
        onRecordExportedProject={(title, teacherName, kind) =>
          handleRecordProjectItem(title, teacherName, kind)
        }
      />

      {/* =====================================================================
          KEYBOARD SHORTCUTS & HOTKEYS MODAL
      ===================================================================== */}
      <KeyboardShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
        usePersianNumerals={usePersianNumerals}
        onTriggerShortcutAction={handleTriggerShortcutAction}
      />
    </div>
  );
}
