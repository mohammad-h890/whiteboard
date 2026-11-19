import React, { useState, useEffect, useMemo } from 'react';
import {
  PenTool,
  Highlighter,
  Eraser,
  CircleDot,
  Compass,
  Sun,
  Moon,
  PanelRightClose,
  PanelRightOpen,
  PanelLeftClose,
  Trash2,
  Columns,
  Layers,
  Monitor,
  PaintBucket,
  Palette,
  Keyboard,
  Settings2,
  FlaskConical,
  Search,
  Pin,
  Plus,
  X,
  Bookmark,
  Clock,
  Sliders,
  ZoomIn,
  ZoomOut,
  Languages,
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
  DIVERSE_PALETTE_COLORS,
  INITIAL_RECENT_COLORS,
  INITIAL_SAVED_PALETTE_COLORS,
  addRecentColor,
  addSavedPaletteColor,
  removeSavedPaletteColor,
  QUICK_WIDGET_CATALOG,
  INITIAL_PINNED_WIDGET_IDS,
  filterQuickWidgets,
  togglePinnedWidgetId,
  filterBoardTools,
  QuickWidgetCatalogItem,
  computeCustomBoardCursor,
} from './core/canvasAndMathEngine';
import { InteractiveLabsPanel, LabTabId } from './components/InteractiveLabsPanel';
import {
  SmartWhiteboardCanvas,
  PenToolId,
  BoardLayer,
  StampedBoardWidget,
  BoardFeatureTrigger,
} from './components/SmartWhiteboardCanvas';
import {
  SecondMonitorControlDock,
  StandaloneProjectorWindow,
  ProjectorSyncPayload,
  broadcastProjectorState,
} from './components/SecondMonitorProjectorView';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { FeatureManagerModal } from './components/FeatureManagerModal';

const STORAGE_KEY = 'daneshboard_persisted_settings_v4';

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
  eraserSize?: number;
  stabilizationLevel?: number;
  rightPenDockOpen?: boolean;
  leftLabDockOpen?: boolean;
  activeLabTab?: LabTabId;
  recentColors?: string[];
  savedPaletteColors?: string[];
  pinnedWidgetIds?: string[];
  uiScalePct?: number;
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

  // Theme state
  const [isDark, setIsDark] = useState<boolean>(initialSaved.isDark ?? false);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  // UI Text & Menu Size Scaling for Video Projectors (100% laptop to 145% classroom projector)
  const [uiScalePct, setUiScalePct] = useState<number>(initialSaved.uiScalePct ?? 100);

  useEffect(() => {
    const root = document.documentElement;
    const basePx = (uiScalePct / 100) * 16;
    root.style.fontSize = `${basePx}px`;
  }, [uiScalePct]);

  // Modular Feature Engine (enable/disable modules & sub-features)
  const [modules, setModules] = useState<AppModule[]>(() => {
    const validIds = new Set(INITIAL_MODULES.map((m) => m.id));
    if (Array.isArray(initialSaved.modules)) {
      const cleaned = initialSaved.modules.filter((m) => validIds.has(m.id));
      if (cleaned.length === INITIAL_MODULES.length) return cleaned;
    }
    return INITIAL_MODULES;
  });
  const [activeProfileId, setActiveProfileId] = useState<TeachingProfileId>(
    initialSaved.activeProfileId &&
      (initialSaved.activeProfileId as string) !== 'konkur-test'
      ? initialSaved.activeProfileId
      : 'physics-lab'
  );
  const [featureManagerOpen, setFeatureManagerOpen] = useState<boolean>(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState<boolean>(false);
  const [canvasSettingsOpen, setCanvasSettingsOpen] = useState<boolean>(false);
  const [usePersianNumerals, setUsePersianNumerals] = useState<boolean>(
    initialSaved.usePersianNumerals ?? true
  );

  const resourceMetrics = useMemo(() => calculateResourceUsage(modules), [modules]);

  // Canvas & Ink Engine State
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
    initialSaved.strokeColor ?? '#0284c7'
  );
  const [strokeWidth, setStrokeWidth] = useState<number>(
    initialSaved.strokeWidth ?? 3
  );
  const [eraserSize, setEraserSize] = useState<number>(
    initialSaved.eraserSize ?? 24
  );
  const [stabilizationLevel] = useState<number>(
    initialSaved.stabilizationLevel ?? 6
  );
  const [splitScreenPdfOpen, setSplitScreenPdfOpen] = useState<boolean>(false);
  const [desktopOverlayMode, setDesktopOverlayMode] = useState<boolean>(false);
  const [floatingWatermark, setFloatingWatermark] = useState<boolean>(false);
  const [clearTrigger, setClearTrigger] = useState<number>(0);
  const [fillDrawnShapes, setFillDrawnShapes] = useState<boolean>(false);
  const [colorActionTrigger, setColorActionTrigger] = useState<{
    color: string;
    target: 'auto' | 'shapes' | 'widgets';
    ts: number;
  } | null>(null);
  const [featureTrigger, setFeatureTrigger] = useState<BoardFeatureTrigger | null>(null);

  // Recent Colors & Saved Palettes State
  const [recentColors, setRecentColors] = useState<string[]>(
    initialSaved.recentColors ?? INITIAL_RECENT_COLORS
  );
  const [savedPaletteColors, setSavedPaletteColors] = useState<string[]>(
    initialSaved.savedPaletteColors ?? INITIAL_SAVED_PALETTE_COLORS
  );
  const [showAllColorsGrid, setShowAllColorsGrid] = useState<boolean>(false);

  // Right-Side Pinned Widgets & Fast Search State
  const [pinnedWidgetIds, setPinnedWidgetIds] = useState<string[]>(
    initialSaved.pinnedWidgetIds ?? INITIAL_PINNED_WIDGET_IDS
  );
  const [showPinManager, setShowPinManager] = useState<boolean>(false);
  const [rightWidgetSearch, setRightWidgetSearch] = useState<string>('');
  const [quickNumberValue, setQuickNumberValue] = useState<string>('۱۲۵');

  // Header Global Search Bar State (جستجوی سریع ابزارها و ابزارک‌ها)
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [globalSearchOpen, setGlobalSearchOpen] = useState<boolean>(false);

  // Real-Time Second Monitor / Projector State
  const [secondMonitorOpen, setSecondMonitorOpen] = useState<boolean>(false);
  const [fullscreenProjectorMode, setFullscreenProjectorMode] = useState<boolean>(
    typeof window !== 'undefined' && window.location.hash === '#projector'
  );
  const [projectorFrozen, setProjectorFrozen] = useState<boolean>(false);
  const [projectorForceWhiteBg, setProjectorForceWhiteBg] = useState<boolean>(true);
  const [projectorBlankScreen, setProjectorBlankScreen] = useState<boolean>(false);
  const [liveProjectorPayload, setLiveProjectorPayload] = useState<ProjectorSyncPayload>({
    timestamp: Date.now(),
    background: initialSaved.background ?? 'grid',
    currentPage: 1,
    totalPages: 2,
    strokes: [],
    activeLiveStroke: null,
    stampedWidgets: [],
    clippedQuestion: null,
    usePersianNumerals: initialSaved.usePersianNumerals ?? true,
    projectorForceWhiteBg: true,
    projectorBlankScreen: false,
  });

  useEffect(() => {
    const onHashChange = () => {
      setFullscreenProjectorMode(window.location.hash === '#projector');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Collapsible Ergonomic Docks State
  const [rightPenDockOpen, setRightPenDockOpen] = useState<boolean>(
    initialSaved.rightPenDockOpen ?? true
  );
  const [leftLabDockOpen, setLeftLabDockOpen] = useState<boolean>(
    initialSaved.leftLabDockOpen ?? false
  );
  const [activeLabTab, setActiveLabTab] = useState<LabTabId>(
    initialSaved.activeLabTab && (initialSaved.activeLabTab as string) !== 'konkur'
      ? initialSaved.activeLabTab
      : 'math'
  );

  // Layers State
  const [layers, setLayers] = useState<BoardLayer[]>([
    { id: 'layer-1-question', name: '۱. سوالات (قفل)', role: 'question', visible: true, locked: true },
    { id: 'layer-2-solution', name: '۲. دستخط حل استاد', role: 'solution', visible: true, locked: false },
    { id: 'layer-3-answer', name: '۳. پاسخ تشریحی', role: 'answer-key', visible: false, locked: true },
  ]);
  const [activeLayerId, setActiveLayerId] = useState<string>('layer-2-solution');

  // Shapes & Smart Widgets on Board (each widget belongs to its specific whiteboard pageIndex)
  const [stampedWidgets, setStampedWidgets] = useState<StampedBoardWidget[]>([]);
  const [activeBoardPage, setActiveBoardPage] = useState<number>(1);
  const [spotlightActive, setSpotlightActive] = useState<boolean>(false);

  const dockCursorSpec = useMemo(
    () =>
      computeCustomBoardCursor({
        activeTool,
        strokeColor,
        strokeWidth,
        eraserSize,
      }),
    [activeTool, strokeColor, strokeWidth, eraserSize]
  );

  // Persist settings to localStorage
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
        eraserSize,
        stabilizationLevel,
        rightPenDockOpen,
        leftLabDockOpen,
        activeLabTab,
        recentColors,
        savedPaletteColors,
        pinnedWidgetIds,
        uiScalePct,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore quota errors
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
    eraserSize,
    stabilizationLevel,
    rightPenDockOpen,
    leftLabDockOpen,
    activeLabTab,
    recentColors,
    savedPaletteColors,
    pinnedWidgetIds,
    uiScalePct,
  ]);

  const fmt = (val: string | number) => toPersianDigits(val, usePersianNumerals);

  const handleSelectColorWithRecent = (colorHex: string) => {
    setStrokeColor(colorHex);
    setRecentColors((prev) => addRecentColor(prev, colorHex, 8));
    if (activeTool === 'fill-bucket') {
      setColorActionTrigger({ color: colorHex, target: 'auto', ts: Date.now() });
    }
  };

  const handleStampToBoard = (
    title: string,
    summary: string,
    badgeColor: string,
    extraProps?: Partial<StampedBoardWidget>
  ) => {
    setStampedWidgets((prev) => [
      ...prev,
      {
        id: `widget-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        pageIndex: activeBoardPage,
        title,
        summary,
        badgeColor,
        dividerColor: '#0f172a',
        x: 250 + (prev.length % 4) * 55,
        y: 95 + (prev.length % 4) * 45,
        ...extraProps,
      },
    ]);
  };

  const handleStampCatalogWidget = (item: QuickWidgetCatalogItem) => {
    const innerCol =
      strokeColor && strokeColor !== '#0f172a' ? strokeColor : item.defaultInnerColor;
    handleStampToBoard(item.stampTitle, item.stampSummary, innerCol, {
      dividerColor: '#0f172a',
      ...item.extraProps,
    });
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
        setActiveTool('eraser-pixel');
        break;
      case 'tool-undo-redo':
        setFeatureTrigger({ feature: 'undo', ts: Date.now() });
        break;
      case 'tool-redo':
        setFeatureTrigger({ feature: 'redo', ts: Date.now() });
        break;
      case 'rec-spotlight':
        setSpotlightActive((s) => !s);
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

  // Global keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (globalSearchOpen) setGlobalSearchOpen(false);
        if (canvasSettingsOpen) setCanvasSettingsOpen(false);
        if (featureManagerOpen) setFeatureManagerOpen(false);
        if (shortcutsModalOpen) setShortcutsModalOpen(false);
        return;
      }
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
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const k = e.key.toLowerCase();
        if (k === 'p') setActiveTool('fountain');
        else if (k === 'b') setActiveTool('pencil');
        else if (k === 'h') setActiveTool('highlighter');
        else if (k === 'l') setActiveTool('laser-vanish');
        else if (k === 's') setActiveTool('shape-snap');
        else if (k === 'v') setActiveTool('lasso');
        else if (k === 'g') setActiveTool('fill-bucket');
        else if (k === 'e') setActiveTool('eraser-pixel');
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

  const handleLaunchSubFeature = (moduleId: ModuleId, subFeatureId: string) => {
    // 1. Ensure the module and sub-feature are enabled
    setModules((prev) => toggleSubFeature(prev, moduleId, subFeatureId, true));
    setFeatureManagerOpen(false);

    // 2. Open or trigger the corresponding UI control immediately
    switch (subFeatureId) {
      case 'infinite-paginated-canvas':
        setCanvasSettingsOpen(true);
        break;
      case 'photoshop-layers':
        setFeatureTrigger({ feature: 'layers-popover', ts: Date.now() });
        break;
      case 'stroke-stabilizer':
        setActiveTool('fountain');
        break;
      case 'laser-vanishing-pen':
        setActiveTool('laser-vanish');
        break;
      case 'hold-to-snap-shapes':
        setActiveTool('shape-snap');
        break;
      case 'split-screen-minimap':
        setSplitScreenPdfOpen(true);
        break;
      case 'desktop-overlay-mode':
        setDesktopOverlayMode(true);
        break;
      case 'one-click-class-notes-pdf':
        setFeatureTrigger({ feature: 'class-notes-export', ts: Date.now() });
        break;
      case 'anti-piracy-floating-watermark':
        setFloatingWatermark(true);
        break;
      case 'handwriting-math-ocr':
      case 'handwriting-beautifier':
        setFeatureTrigger({ feature: 'handwriting-pad', ts: Date.now() });
        break;
      case 'text-to-diagram':
        setFeatureTrigger({ feature: 'flowchart-pad', ts: Date.now() });
        break;
      default: {
        // Subject Lab sub-features: open the Subject Labs drawer on the matching tab
        if (moduleId === 'mod-3-math') {
          setActiveLabTab('math');
          setLeftLabDockOpen(true);
        } else if (moduleId === 'mod-4-physics') {
          setActiveLabTab('physics');
          setLeftLabDockOpen(true);
        } else if (moduleId === 'mod-5-chemistry') {
          setActiveLabTab('chemistry');
          setLeftLabDockOpen(true);
        } else if (moduleId === 'mod-6-bio-lit') {
          setActiveLabTab('humanities');
          setLeftLabDockOpen(true);
        }
        break;
      }
    }
  };

  // Propagate projector background/blank toggles to live projector payload
  useEffect(() => {
    if (projectorFrozen) return;
    setLiveProjectorPayload((prev) => {
      const next: ProjectorSyncPayload = {
        ...prev,
        timestamp: Date.now(),
        background,
        usePersianNumerals,
        projectorForceWhiteBg,
        projectorBlankScreen,
      };
      broadcastProjectorState(next);
      return next;
    });
  }, [background, usePersianNumerals, projectorForceWhiteBg, projectorBlankScreen, projectorFrozen]);

  const pinnedWidgets = useMemo(
    () =>
      QUICK_WIDGET_CATALOG.filter((item) => pinnedWidgetIds.includes(item.id)),
    [pinnedWidgetIds]
  );

  const filteredRightCatalog = useMemo(
    () => filterQuickWidgets(rightWidgetSearch),
    [rightWidgetSearch]
  );

  const globalMatchedTools = useMemo(
    () => filterBoardTools(globalSearchQuery).slice(0, 6),
    [globalSearchQuery]
  );

  const globalMatchedWidgets = useMemo(
    () => filterQuickWidgets(globalSearchQuery).slice(0, 8),
    [globalSearchQuery]
  );

  if (fullscreenProjectorMode) {
    return (
      <StandaloneProjectorWindow
        fallbackPayload={liveProjectorPayload}
        onExitProjectorMode={() => {
          if (window.location.hash === '#projector') {
            window.location.hash = '';
          }
          setFullscreenProjectorMode(false);
        }}
      />
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* =====================================================================
          ULTRA-CLEAN, SIMPLIFIED TOP HEADER (Brand + Unified Search + Essential Actions)
          Note: relative z-[100] ensures header popovers (Search & Settings) always render ABOVE all board items!
      ===================================================================== */}
      <header className="relative z-[100] flex items-center justify-between gap-3 px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shrink-0">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
            دانش‌بورد استودیو
          </span>
        </div>

        {/* Zone 2: Unified Search for Tools & Widgets + On-Demand Menus */}
        <div className="flex items-center gap-2 flex-1 max-w-2xl justify-center">
          {/* Fast Search Bar for Tools & Smart Widgets */}
          <div className="relative flex-1 max-w-xs sm:max-w-sm z-[110]">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus-within:border-sky-500">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                data-testid="global-tool-widget-search-input"
                value={globalSearchQuery}
                onFocus={() => setGlobalSearchOpen(true)}
                onChange={(e) => {
                  setGlobalSearchQuery(e.target.value);
                  setGlobalSearchOpen(true);
                }}
                placeholder="جستجوی ابزار یا ابزارک (کسر، محور، ساعت، پاک‌کن...)"
                aria-label="جستجوی سریع ابزارها و ابزارک‌ها"
                className="w-full bg-transparent text-xs font-medium focus:outline-none placeholder:text-slate-400"
              />
              {globalSearchQuery && (
                <button
                  type="button"
                  onClick={() => setGlobalSearchQuery('')}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Instant Search Results Popover (Strictly above all board items with z-[120]) */}
            {globalSearchOpen && (
              <>
                <div
                  onClick={() => setGlobalSearchOpen(false)}
                  className="fixed inset-0 z-[105] bg-transparent"
                  aria-hidden="true"
                />
                <div
                  data-testid="global-search-results-popover"
                  className="absolute right-0 left-0 mt-1.5 p-2.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-sky-500/40 shadow-2xl ring-1 ring-slate-950/10 z-[120] max-h-96 overflow-y-auto space-y-2.5 text-xs"
                >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  <span className="font-bold text-slate-700 dark:text-slate-200 text-[11px]">
                    دسترسی سریع به ابزارک‌ها و ابزارها
                  </span>
                  <button
                    type="button"
                    onClick={() => setGlobalSearchOpen(false)}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Matching Smart Widgets */}
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-sky-600 dark:text-sky-400">
                    ابزارک‌های هوشمند (کلیک = درج روی تخته · 📌 = پین در منوی راست):
                  </div>
                  {globalMatchedWidgets.length === 0 ? (
                    <div className="text-[11px] text-slate-400 py-1">ابزارکی یافت نشد</div>
                  ) : (
                    <div className="grid grid-cols-1 gap-1">
                      {globalMatchedWidgets.map((wItem) => {
                        const isPinned = pinnedWidgetIds.includes(wItem.id);
                        return (
                          <div
                            key={wItem.id}
                            className="flex items-center justify-between gap-1 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 hover:bg-sky-500/10 border border-slate-200/70 dark:border-slate-700/70"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                handleStampCatalogWidget(wItem);
                                setGlobalSearchOpen(false);
                              }}
                              className="flex-1 text-right font-semibold text-slate-800 dark:text-slate-100 flex items-center justify-between"
                            >
                              <span>{wItem.labelFa}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-600 dark:text-sky-300">
                                + درج در تخته
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setPinnedWidgetIds((prev) =>
                                  togglePinnedWidgetId(prev, wItem.id)
                                )
                              }
                              title={isPinned ? 'حذف از پین‌شده‌ها' : 'پین کردن در منوی راست'}
                              className={`p-1 rounded transition-colors ${
                                isPinned
                                  ? 'bg-amber-500 text-slate-950'
                                  : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                              }`}
                            >
                              <Pin className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Matching Drawing & Board Tools */}
                <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    ابزارهای قلم، پاک‌کن و تخته:
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {globalMatchedTools.map((tItem) => (
                      <button
                        key={tItem.id}
                        type="button"
                        onClick={() => {
                          if (tItem.actionKind === 'pen-tool' && tItem.toolId) {
                            setActiveTool(tItem.toolId as PenToolId);
                          } else if (tItem.actionKind === 'board-feature' && tItem.toolId) {
                            setFeatureTrigger({
                              feature: tItem.toolId as BoardFeatureTrigger['feature'],
                              ts: Date.now(),
                            });
                          } else if (tItem.actionKind === 'lab-drawer') {
                            setLeftLabDockOpen(true);
                          }
                          setGlobalSearchOpen(false);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 hover:bg-emerald-500/10 text-right font-semibold flex items-center justify-between"
                      >
                        <span>{tItem.labelFa}</span>
                        <span className="text-[10px] text-slate-400">{tItem.categoryFa}</span>
                      </button>
                    ))}
                  </div>
                </div>
                </div>
              </>
            )}
          </div>

          {/* Interactive Subject Labs Drawer Toggle */}
          <button
            type="button"
            onClick={() => setLeftLabDockOpen((o) => !o)}
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 text-xs font-bold transition-colors whitespace-nowrap ${
              leftLabDockOpen
                ? 'bg-sky-600 text-white border-sky-500 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-sky-500'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>آزمایشگاه دروس</span>
          </button>

          {/* Second Monitor / Projector Output Button */}
          <button
            type="button"
            data-testid="open-second-monitor-btn"
            onClick={() => setSecondMonitorOpen((o) => !o)}
            className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 text-xs font-bold transition-colors whitespace-nowrap ${
              secondMonitorOpen
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-2xs'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">مانیتور دوم</span>
          </button>

          {/* Module Enable/Disable Manager Button (مدیریت فعال/غیرفعال کردن ماژول‌ها) */}
          <button
            type="button"
            data-testid="open-feature-manager-btn"
            onClick={() => setFeatureManagerOpen(true)}
            title="فعال یا غیرفعال کردن ماژول‌ها و زیرمجموعه‌ها"
            className="px-2.5 py-1.5 rounded-lg border border-amber-500/35 bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500 hover:text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>
              ماژول‌ها ({fmt(resourceMetrics.activeModulesCount)}/{fmt(resourceMetrics.totalModulesCount)})
            </span>
          </button>
        </div>

        {/* Zone 3: UI Scale for Video Projectors, Settings Popover, Keyboard Shortcuts & Theme Toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick UI Text & Menu Size Scaling Control for Video Projectors */}
          <div
            data-testid="ui-scale-control"
            title="تنظیم اندازه متن‌ها، منوها و دکمه‌ها (مناسب لپ‌تاپ و ویدئو پروژکتور کلاس)"
            className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
          >
            <button
              type="button"
              data-testid="ui-scale-decrease-btn"
              onClick={() => setUiScalePct((s) => Math.max(90, s - 15))}
              aria-label="کوچک‌تر کردن اندازه متون و منوها"
              title="کوچک‌تر کردن منوها"
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              data-testid="ui-scale-reset-btn"
              onClick={() =>
                setUiScalePct((s) => (s === 100 ? 125 : s === 125 ? 140 : 100))
              }
              title="کلیک برای تغییر سریع اندازه نما (لپ‌تاپ ۱۰۰٪ / ویدئو پروژکتور ۱۲۵٪ و ۱۴۰٪)"
              className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-700 dark:text-sky-300 font-mono text-[11px] whitespace-nowrap"
            >
              {fmt(uiScalePct)}٪ نما
            </button>
            <button
              type="button"
              data-testid="ui-scale-increase-btn"
              onClick={() => setUiScalePct((s) => Math.min(155, s + 15))}
              aria-label="بزرگ‌تر کردن اندازه متون و منوها (ویژه ویدئو پروژکتور)"
              title="بزرگ‌تر کردن اندازه متون و منوها (ویژه ویدئو پروژکتور)"
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Simplified Canvas Settings Popover */}
          <div className="relative">
            <button
              type="button"
              data-testid="open-canvas-settings-btn"
              onClick={() => setCanvasSettingsOpen((v) => !v)}
              aria-expanded={canvasSettingsOpen}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                canvasSettingsOpen
                  ? 'bg-sky-600 text-white border-sky-500'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-sky-500'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5 text-sky-500" />
              <span className="hidden sm:inline">تنظیمات تخته</span>
            </button>

            {canvasSettingsOpen && (
              <div className="absolute left-0 mt-2 w-80 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    تنظیمات تخته سفید و نمایش پروژکتور
                  </span>
                  <button
                    type="button"
                    onClick={() => setCanvasSettingsOpen(false)}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                {/* UI Font & Menu Scaling Presets inside Settings Popover */}
                <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/25 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-sky-700 dark:text-sky-300">
                    <span>اندازه متن‌ها و منوها (ویدئو پروژکتور):</span>
                    <span className="font-mono">{fmt(uiScalePct)}٪</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { pct: 100, label: '۱۰۰٪ لپ‌تاپ' },
                      { pct: 115, label: '۱۱۵٪ درشت' },
                      { pct: 130, label: '۱۳۰٪ پروژکتور' },
                      { pct: 145, label: '۱۴۵٪ سالن' },
                    ].map((preset) => (
                      <button
                        key={preset.pct}
                        type="button"
                        data-testid={`ui-scale-preset-${preset.pct}`}
                        onClick={() => setUiScalePct(preset.pct)}
                        className={`py-1 px-1 rounded-lg text-[10px] font-bold border transition-colors ${
                          uiScalePct === preset.pct
                            ? 'bg-sky-600 text-white border-sky-500'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block space-y-1">
                  <span className="text-[11px] text-slate-500">پروفایل درس:</span>
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
                    <span className="text-[11px] text-slate-500">ابعاد بوم:</span>
                    <select
                      id="canvas-mode-select"
                      value={canvasMode}
                      onChange={(e) =>
                        setCanvasMode(e.target.value as 'infinite' | 'a4' | '16:9' | '9:16')
                      }
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <option value="infinite">بوم کامل</option>
                      <option value="a4">برگه A4</option>
                      <option value="16:9">عریض ۱۶:۹ (پروژکتور)</option>
                    </select>
                  </label>

                  <label className="block space-y-1">
                    <span className="text-[11px] text-slate-500">طرح زمینه تخته:</span>
                    <select
                      id="canvas-bg-select"
                      value={background}
                      onChange={(e) => setBackground(e.target.value as CanvasBackgroundId)}
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <option value="grid">شطرنجی</option>
                      <option value="white">تخته سفید ساده</option>
                      <option value="lined">خط‌دار تحریری</option>
                      <option value="dots">نقطه‌ای</option>
                      <option value="blackboard">تخته سیاه</option>
                      <option value="greenboard">تخته سبز</option>
                      <option value="sepia">کاغذ کاهی</option>
                    </select>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => setSplitScreenPdfOpen((v) => !v)}
                  className={`w-full py-1.5 px-2.5 rounded-lg border font-semibold flex items-center justify-center gap-1.5 ${
                    splitScreenPdfOpen
                      ? 'bg-sky-600 text-white border-sky-500'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>نمایش پنل جزوه PDF کنار تخته</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDesktopOverlayMode((v) => !v)}
                  className={`w-full py-1.5 px-2.5 rounded-lg border font-semibold flex items-center justify-center gap-1.5 ${
                    desktopOverlayMode
                      ? 'bg-violet-600 text-white border-violet-500'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>حالت نوشتن شفاف روی دسکتاپ</span>
                </button>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  <span className="text-slate-500">نمایش ارقام:</span>
                  <button
                    type="button"
                    onClick={() => setUsePersianNumerals((p) => !p)}
                    className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold"
                  >
                    {usePersianNumerals ? 'فارسی (۰-۹)' : 'انگلیسی (0-9)'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShortcutsModalOpen(true)}
            aria-label="راهنمای کلیدهای میانبر"
            title="کلیدهای میانبر (?)"
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
        </div>
      </header>

      {/* =====================================================================
          MAIN WORKSPACE: RIGHT FAST-ACCESS DOCK + CLEAN WHITEBOARD + OPTIONAL LABS
      ===================================================================== */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Right Dock (in RTL): Pinned Frequently-Used Widgets + Pen/Eraser + Color Palette */}
        <aside
          aria-label="منوی سمت راست: ابزارک‌های پین‌شده و موتور قلم"
          className={`border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between transition-all shrink-0 z-20 overflow-y-auto ${
            rightPenDockOpen ? 'w-64 p-2.5' : 'w-14 p-1.5 items-center'
          }`}
        >
          <div className="space-y-3 w-full">
            {/* Collapse / Expand Header */}
            <div className="flex items-center justify-between">
              {rightPenDockOpen && (
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                  ابزارک‌های پین‌شده و قلم
                </span>
              )}
              <button
                type="button"
                onClick={() => setRightPenDockOpen((v) => !v)}
                aria-label={rightPenDockOpen ? 'جمع کردن منوی راست' : 'باز کردن منوی راست'}
                title={rightPenDockOpen ? 'جمع کردن منوی راست' : 'باز کردن منوی راست'}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 mx-auto"
              >
                {rightPenDockOpen ? (
                  <PanelRightClose className="w-4 h-4" />
                ) : (
                  <PanelRightOpen className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* =====================================================================
                SECTION 1: RIGHT-SIDE PINNED FREQUENTLY-USED WIDGETS MENU
                (منوی ابزارک‌های پرکاربرد پین‌شده در سمت راست برای دسترسی یک‌کلیکی)
            ===================================================================== */}
            {rightPenDockOpen && (
              <div
                data-testid="right-pinned-widgets-menu"
                className="p-2.5 rounded-xl bg-sky-500/8 dark:bg-slate-800/70 border border-sky-500/25 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-sky-700 dark:text-sky-300 flex items-center gap-1">
                    <Pin className="w-3.5 h-3.5 text-amber-500" />
                    <span>ابزارک‌های پین‌شده ({fmt(pinnedWidgets.length)})</span>
                  </span>
                  <button
                    type="button"
                    data-testid="toggle-pin-widget-manager-btn"
                    onClick={() => setShowPinManager((v) => !v)}
                    className="px-2 py-0.5 rounded-md bg-sky-600 text-white text-[10px] font-bold hover:bg-sky-500 transition-colors"
                  >
                    {showPinManager ? 'بستن لیست' : '+ پین / جستجو'}
                  </button>
                </div>

                {/* 1-Click Pinned Widget Buttons */}
                <div className="grid grid-cols-2 gap-1.5">
                  {pinnedWidgets.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      data-testid={`pinned-widget-btn-${item.id}`}
                      onClick={() => handleStampCatalogWidget(item)}
                      title={`افزودن فوری «${item.labelFa}» به تخته`}
                      className="py-1.5 px-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-sky-600 hover:text-white border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate text-right transition-colors shadow-2xs flex items-center justify-between gap-1"
                    >
                      <span className="truncate">{item.shortLabelFa}</span>
                      <Plus className="w-3 h-3 shrink-0 opacity-70" />
                    </button>
                  ))}
                </div>

                {/* Compact Pinnable Number Input Box right inside the Right Pinned Menu */}
                <div className="pt-1.5 border-t border-sky-500/20 flex items-center gap-1">
                  <input
                    type="text"
                    value={quickNumberValue}
                    onChange={(e) =>
                      setQuickNumberValue(toPersianDigits(e.target.value, true))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const txt = toPersianDigits(quickNumberValue.trim() || '۰', true);
                        handleStampToBoard(`عدد فارسی (${txt})`, txt, strokeColor, {
                          widgetKind: 'persian-number',
                          persianText: txt,
                          dividerColor: '#0f172a',
                          filled: true,
                        });
                      }
                    }}
                    placeholder="عدد..."
                    aria-label="کادر سریع نوشتن عدد در منوی راست"
                    className="w-20 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-center"
                  />
                  <button
                    type="button"
                    data-testid="right-quick-number-stamp-btn"
                    onClick={() => {
                      const txt = toPersianDigits(quickNumberValue.trim() || '۰', true);
                      handleStampToBoard(`عدد فارسی (${txt})`, txt, strokeColor, {
                        widgetKind: 'persian-number',
                        persianText: txt,
                        dividerColor: '#0f172a',
                        filled: true,
                      });
                    }}
                    className="flex-1 py-1 px-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold text-center transition-colors"
                  >
                    + درج عدد روی تخته
                  </button>
                </div>

                {/* Pin / Search Catalog Drawer */}
                {showPinManager && (
                  <div
                    data-testid="pin-widget-catalog-drawer"
                    className="pt-2 border-t border-sky-500/25 space-y-1.5"
                  >
                    <input
                      type="text"
                      value={rightWidgetSearch}
                      onChange={(e) => setRightWidgetSearch(e.target.value)}
                      placeholder="جستجوی ابزارک برای پین..."
                      aria-label="جستجوی ابزارک در منوی راست"
                      className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-[11px]"
                    />
                    <div className="max-h-40 overflow-y-auto space-y-1 pr-0.5">
                      {filteredRightCatalog.map((item) => {
                        const isPinned = pinnedWidgetIds.includes(item.id);
                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-1 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px]"
                          >
                            <button
                              type="button"
                              onClick={() => handleStampCatalogWidget(item)}
                              className="flex-1 text-right font-semibold truncate hover:text-sky-600"
                            >
                              {item.labelFa}
                            </button>
                            <button
                              type="button"
                              data-testid={`toggle-pin-${item.id}`}
                              onClick={() =>
                                setPinnedWidgetIds((prev) =>
                                  togglePinnedWidgetId(prev, item.id)
                                )
                              }
                              className={`px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5 ${
                                isPinned
                                  ? 'bg-amber-500 text-slate-950'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                              }`}
                            >
                              <Pin className="w-2.5 h-2.5" />
                              <span>{isPinned ? 'پین‌شده' : 'پین'}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* =====================================================================
                SECTION 2: PEN, FILL-BUCKET & ERASER TOOLS + ERASER SIZE SLIDER
            ===================================================================== */}
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
                    label: 'مداد طبیعی (B)',
                    icon: <PenTool className="w-4 h-4 shrink-0" />,
                  },
                  {
                    id: 'highlighter',
                    label: 'هایلایتر (H)',
                    icon: <Highlighter className="w-4 h-4 shrink-0" />,
                  },
                  {
                    id: 'shape-snap',
                    label: 'شکل هوشمند (S)',
                    icon: <Compass className="w-4 h-4 shrink-0" />,
                  },
                  {
                    id: 'fill-bucket',
                    label: 'سطل رنگ اشکال و ابزارک‌ها (G)',
                    icon: <PaintBucket className="w-4 h-4 shrink-0" />,
                  },
                  {
                    id: 'eraser-pixel',
                    label: 'پاک‌کن پیکسلی با تنظیم سایز (E)',
                    icon: <Eraser className="w-4 h-4 shrink-0" />,
                  },
                  {
                    id: 'eraser-stroke',
                    label: 'پاک‌کن خطی کامل',
                    icon: <Eraser className="w-4 h-4 shrink-0" />,
                  },
                  {
                    id: 'laser-vanish',
                    label: 'قلم لیزری (L)',
                    icon: <CircleDot className="w-4 h-4 shrink-0" />,
                  },
                  {
                    id: 'lasso',
                    label: 'کمند انتخاب و جابه‌جایی (V)',
                    icon: <Compass className="w-4 h-4 shrink-0" />,
                  },
                ] as Array<{ id: PenToolId; label: string; icon: React.ReactNode }>
              ).map((tool) => {
                const isActive = activeTool === tool.id;
                  return (
                  <React.Fragment key={tool.id}>
                    <button
                      type="button"
                      data-testid={`pen-tool-${tool.id}`}
                      onClick={() => setActiveTool(tool.id)}
                      title={tool.label}
                      aria-label={tool.label}
                      className={`w-full flex items-center ${
                        rightPenDockOpen ? 'gap-2 px-2.5' : 'justify-center px-1'
                      } py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? tool.id === 'fill-bucket'
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-2xs'
                            : tool.id.startsWith('eraser')
                            ? 'bg-rose-600 text-white font-bold shadow-2xs'
                            : 'bg-sky-600 text-white font-semibold shadow-2xs'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {tool.icon}
                      {rightPenDockOpen && <span className="truncate">{tool.label}</span>}
                    </button>

                    {/* Right next to Shape-Snap (S): Offline Gboard-Style Handwriting Pad Button */}
                    {tool.id === 'shape-snap' && (
                      <button
                        type="button"
                        data-testid="dock-handwriting-pad-btn"
                        onClick={() =>
                          setFeatureTrigger({ feature: 'handwriting-pad', ts: Date.now() })
                        }
                        title="تشخیص آفلاین اعداد فارسی، انگلیسی و نشانه‌های ریاضی"
                        aria-label="تشخیص آفلاین اعداد و نشانه‌ها"
                        className={`w-full flex items-center ${
                          rightPenDockOpen ? 'gap-2 px-2.5' : 'justify-center px-1'
                        } py-1.5 rounded-lg text-xs font-bold bg-sky-500/12 text-sky-700 dark:text-sky-300 border border-sky-500/30 hover:bg-sky-600 hover:text-white transition-colors`}
                      >
                        <Languages className="w-4 h-4 shrink-0" />
                        {rightPenDockOpen && (
                          <span className="truncate">اعداد و نشانه‌ها (آفلاین)</span>
                        )}
                      </button>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Live Tool Cursor & Nib Preview Box in Right Dock */}
            {rightPenDockOpen && (
              <div
                data-testid="dock-tool-cursor-preview"
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
              >
                <div className="space-y-0.5">
                  <div className="text-[10px] font-extrabold text-slate-700 dark:text-slate-200">
                    نشانگر زنده روی تخته:
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    {dockCursorSpec.labelFa} ({fmt(dockCursorSpec.diameterPx)}px)
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                  <span
                    style={{
                      width: `${Math.min(34, Math.max(6, dockCursorSpec.diameterPx))}px`,
                      height: `${Math.min(34, Math.max(6, dockCursorSpec.diameterPx))}px`,
                      backgroundColor: dockCursorSpec.color,
                      borderColor: dockCursorSpec.color,
                      opacity: dockCursorSpec.fillOpacity,
                    }}
                    className={`border-2 ${
                      dockCursorSpec.shape === 'square' ? 'rounded-md' : 'rounded-full'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Adjustable Eraser Size Control (تنظیم اندازه پاک‌کن) */}
            {rightPenDockOpen && (
              <div
                data-testid="eraser-size-control-box"
                className="p-2 rounded-xl bg-rose-500/8 border border-rose-500/25 space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1">
                    <Eraser className="w-3.5 h-3.5" />
                    <span>اندازه پاک‌کن:</span>
                  </span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                    {fmt(eraserSize)}px
                  </span>
                </div>
                <input
                  type="range"
                  data-testid="eraser-size-slider"
                  min={6}
                  max={80}
                  value={eraserSize}
                  onChange={(e) => {
                    setEraserSize(Number(e.target.value));
                    if (!activeTool.startsWith('eraser')) {
                      setActiveTool('eraser-pixel');
                    }
                  }}
                  aria-label="اندازه پاک‌کن"
                  className="w-full accent-rose-600"
                />
                <div className="grid grid-cols-3 gap-1 text-[10px]">
                  {[
                    { sz: 12, label: 'ریز (۱۲)' },
                    { sz: 24, label: 'متوسط (۲۴)' },
                    { sz: 48, label: 'درشت (۴۸)' },
                  ].map((preset) => (
                    <button
                      key={preset.sz}
                      type="button"
                      onClick={() => {
                        setEraserSize(preset.sz);
                        if (!activeTool.startsWith('eraser')) {
                          setActiveTool('eraser-pixel');
                        }
                      }}
                      className={`py-0.5 rounded font-bold border transition-colors ${
                        eraserSize === preset.sz
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* =====================================================================
                SECTION 3: DIVERSE COLOR PALETTE (24 COLORS) + RECENT COLORS + SAVED PALETTES
            ===================================================================== */}
            <div
              data-testid="pen-engine-color-palette"
              className={`pt-2.5 border-t border-slate-200 dark:border-slate-800 ${
                rightPenDockOpen ? 'space-y-2.5' : 'flex flex-col items-center gap-1.5'
              }`}
            >
              {rightPenDockOpen && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5 text-amber-500" />
                    <span>پالت رنگ متنوع ({fmt(DIVERSE_PALETTE_COLORS.length)} رنگ)</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowAllColorsGrid((v) => !v)}
                      className="text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline"
                    >
                      {showAllColorsGrid ? 'کمتر' : 'همه ۲۴ رنگ'}
                    </button>
                    <input
                      type="color"
                      value={strokeColor}
                      onChange={(e) => handleSelectColorWithRecent(e.target.value)}
                      title="انتخاب رنگ دلخواه"
                      aria-label="انتخاب رنگ دلخواه پالت"
                      className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                    />
                  </div>
                </div>
              )}

              {/* Diverse Color Swatches Grid */}
              <div
                className={
                  rightPenDockOpen
                    ? 'grid grid-cols-6 gap-1.5'
                    : 'flex flex-col items-center gap-1.5'
                }
              >
                {DIVERSE_PALETTE_COLORS.slice(
                  0,
                  rightPenDockOpen ? (showAllColorsGrid ? 24 : 12) : 6
                ).map((sw) => (
                  <button
                    key={sw.c}
                    type="button"
                    onClick={() => handleSelectColorWithRecent(sw.c)}
                    aria-label={`انتخاب رنگ ${sw.name}`}
                    title={sw.name}
                    style={{ backgroundColor: sw.c }}
                    className={`w-6 h-6 rounded-full border-2 transition-transform mx-auto ${
                      strokeColor.toLowerCase() === sw.c.toLowerCase()
                        ? 'scale-115 border-slate-900 dark:border-white ring-2 ring-sky-400/50'
                        : 'border-white/50 dark:border-slate-700 hover:scale-110'
                    }`}
                  />
                ))}
              </div>

              {rightPenDockOpen && (
                <>
                  {/* Recent Colors (رنگ‌های اخیر) */}
                  <div
                    data-testid="recent-colors-section"
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-sky-500" />
                        <span>رنگ‌های اخیر ({fmt(recentColors.length)}):</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {recentColors.map((rc) => (
                        <button
                          key={rc}
                          type="button"
                          onClick={() => handleSelectColorWithRecent(rc)}
                          style={{ backgroundColor: rc }}
                          title={`رنگ اخیر ${rc}`}
                          aria-label={`رنگ اخیر ${rc}`}
                          className={`w-5 h-5 rounded-full border ${
                            strokeColor.toLowerCase() === rc.toLowerCase()
                              ? 'scale-115 border-slate-900 dark:border-white ring-2 ring-sky-400/50'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Saved Palette Colors (پالت‌های ذخیره‌شده) */}
                  <div
                    data-testid="saved-palette-section"
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        <Bookmark className="w-3 h-3 text-emerald-500" />
                        <span>پالت ذخیره‌شده ({fmt(savedPaletteColors.length)}):</span>
                      </span>
                      <button
                        type="button"
                        data-testid="save-current-color-btn"
                        onClick={() =>
                          setSavedPaletteColors((prev) =>
                            addSavedPaletteColor(prev, strokeColor, 12)
                          )
                        }
                        className="px-1.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[9px]"
                      >
                        + ذخیره رنگ فعلی
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {savedPaletteColors.map((sc) => (
                        <div key={sc} className="relative group flex items-center">
                          <button
                            type="button"
                            onClick={() => handleSelectColorWithRecent(sc)}
                            style={{ backgroundColor: sc }}
                            title={`پالت ذخیره‌شده ${sc}`}
                            aria-label={`پالت ذخیره‌شده ${sc}`}
                            className={`w-5 h-5 rounded-full border ${
                              strokeColor.toLowerCase() === sc.toLowerCase()
                                ? 'scale-115 border-slate-900 dark:border-white ring-2 ring-emerald-400/50'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setSavedPaletteColors((prev) =>
                                removeSavedPaletteColor(prev, sc)
                              )
                            }
                            aria-label={`حذف رنگ ذخیره‌شده ${sc}`}
                            className="hidden group-hover:flex absolute -top-1 -left-1 w-3.5 h-3.5 rounded-full bg-rose-600 text-white text-[8px] items-center justify-center"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Direct Action Buttons to Color Drawn Shapes & Smart Widgets */}
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        data-testid="pen-palette-color-shape-btn"
                        onClick={() =>
                          setColorActionTrigger({
                            color: strokeColor,
                            target: 'shapes',
                            ts: Date.now(),
                          })
                        }
                        className="py-1.5 px-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px] text-center transition-colors"
                      >
                        رنگ داخل شکل ترسیمی
                      </button>
                      <button
                        type="button"
                        data-testid="pen-palette-color-widget-btn"
                        onClick={() =>
                          setColorActionTrigger({
                            color: strokeColor,
                            target: 'widgets',
                            ts: Date.now(),
                          })
                        }
                        className="py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] text-center transition-colors"
                      >
                        رنگ داخل ابزارک هوشمند
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setFillDrawnShapes((f) => !f)}
                      className={`w-full py-1 px-2 rounded-lg text-[10px] font-bold border transition-colors flex items-center justify-between ${
                        fillDrawnShapes
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span>رنگ خودکار داخل اشکال جدید:</span>
                      <span>{fillDrawnShapes ? 'فعال ✓' : 'غیرفعال'}</span>
                    </button>
                  </div>

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
                      max={24}
                      value={strokeWidth}
                      onChange={(e) => setStrokeWidth(Number(e.target.value))}
                      aria-label="ضخامت قلم"
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
            data-testid="clear-board-page-btn"
            onClick={() => {
              setClearTrigger((c) => c + 1);
            }}
            title="پاکسازی کامل تخته (قابل بازگشت با Ctrl+Z)"
            aria-label="پاکسازی دستخط تخته"
            className="w-full flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors mt-2"
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            {rightPenDockOpen && <span>پاکسازی تخته</span>}
          </button>
        </aside>

        {/* Center Interactive Smart Whiteboard Canvas */}
        <SmartWhiteboardCanvas
          canvasMode={canvasMode}
          background={background}
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          strokeColor={strokeColor}
          onSelectColor={handleSelectColorWithRecent}
          strokeWidth={strokeWidth}
          onChangeStrokeWidth={setStrokeWidth}
          eraserSize={eraserSize}
          onChangeEraserSize={setEraserSize}
          stabilizationLevel={stabilizationLevel}
          holdToSnapEnabled={isSubFeatureActive(modules, 'hold-to-snap-shapes')}
          fillDrawnShapes={fillDrawnShapes}
          colorActionTrigger={colorActionTrigger}
          featureTrigger={featureTrigger}
          splitScreenPdfOpen={splitScreenPdfOpen}
          desktopOverlayMode={desktopOverlayMode}
          onToggleDesktopOverlayMode={() => setDesktopOverlayMode((d) => !d)}
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
          onUpdateStampedWidgets={setStampedWidgets}
          spotlightActive={spotlightActive}
          floatingWatermark={floatingWatermark}
          onToggleFloatingWatermark={() => setFloatingWatermark((w) => !w)}
          usePersianNumerals={usePersianNumerals}
          clearTrigger={clearTrigger}
          onCurrentPageChange={setActiveBoardPage}
          onLiveBoardSync={(boardState) => {
            if (projectorFrozen) return;
            const nextPayload: ProjectorSyncPayload = {
              timestamp: Date.now(),
              background,
              currentPage: boardState.currentPage,
              totalPages: boardState.totalPages,
              strokes: boardState.strokes,
              activeLiveStroke: boardState.activeLiveStroke,
              stampedWidgets: boardState.stampedWidgets,
              clippedQuestion: boardState.clippedQuestion,
              usePersianNumerals,
              projectorForceWhiteBg,
              projectorBlankScreen,
            };
            setLiveProjectorPayload(nextPayload);
            broadcastProjectorState(nextPayload);
          }}
        />

        {/* Collapsible Left Dock (in RTL): Interactive Subject Labs */}
        {leftLabDockOpen && (
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
        )}
      </main>

      {/* Module Enable/Disable Manager Modal (مدیریت ویژگی‌ها و ماژول‌ها) */}
      <FeatureManagerModal
        isOpen={featureManagerOpen}
        onClose={() => setFeatureManagerOpen(false)}
        modules={modules}
        activeProfileId={activeProfileId}
        onSelectProfile={handleSelectProfile}
        onToggleModule={handleToggleModule}
        onToggleSubFeature={(modId, subId) =>
          setModules((prev) => toggleSubFeature(prev, modId, subId))
        }
        onLaunchSubFeature={handleLaunchSubFeature}
        metrics={resourceMetrics}
        usePersianNumerals={usePersianNumerals}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
        usePersianNumerals={usePersianNumerals}
        onTriggerShortcutAction={handleTriggerShortcutAction}
      />

      {/* Real-Time Second Monitor / Projector Control Dock */}
      <SecondMonitorControlDock
        isOpen={secondMonitorOpen}
        onClose={() => setSecondMonitorOpen(false)}
        livePayload={liveProjectorPayload}
        isFrozen={projectorFrozen}
        onToggleFreeze={() => setProjectorFrozen((f) => !f)}
        projectorForceWhiteBg={projectorForceWhiteBg}
        onToggleForceWhiteBg={() => setProjectorForceWhiteBg((w) => !w)}
        projectorBlankScreen={projectorBlankScreen}
        onToggleBlankScreen={() => setProjectorBlankScreen((b) => !b)}
        onEnterFullscreenProjector={() => setFullscreenProjectorMode(true)}
        usePersianNumerals={usePersianNumerals}
      />
    </div>
  );
}
