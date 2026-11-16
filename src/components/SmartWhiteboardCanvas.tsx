import React, { useRef, useEffect, useState } from 'react';
import {
  Highlighter,
  Eraser,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  FileUp,
  FileText,
  X,
  Undo2,
  Redo2,
  StickyNote,
  Table,
  Ruler,
  Plus,
  ChevronRight,
  ChevronLeft,
  Shapes,
  RotateCw,
  Copy,
  Move,
  Pin,
  Hash,
  Layers,
  Trash2,
  Maximize2,
  Minimize2,
  ArrowDown,
  ArrowUp,
  Keyboard,
  PenTool,
  Languages,
  Monitor,
  Download,
  ShieldCheck,
} from 'lucide-react';
import { CanvasBackgroundId, toPersianDigits } from '../core/featureEngine';
import {
  recognizeGeometricShape,
  eraseStrokePointsInRadius,
  isStrokeHitByEraser,
  GEOMETRIC_SHAPE_PRESETS,
  GeometricShapePresetId,
  generateGeometricShapeStrokes,
  FREQUENT_MATH_SYMBOLS,
  CustomBoardShortcut,
  INITIAL_CUSTOM_BOARD_SHORTCUTS,
  upsertCustomBoardShortcut,
  removeCustomBoardShortcut,
  findMatchingCustomShortcut,
  formatKeyboardEventToCombo,
  computeCustomBoardCursor,
  getStrokesBoundingBox,
  translateStrokePoints,
  Point2D,
} from '../core/canvasAndMathEngine';
import { BareBoardShapeGraphic } from './BareBoardShapeGraphic';
import { OfflineHandwritingPad } from './OfflineHandwritingPad';
import { generatePrintableClassNotesHtml } from '../core/studioAndAiEngine';
import type { ProjectorStrokeItem } from './SecondMonitorProjectorView';

export type PenToolId =
  | 'ballpoint'
  | 'fountain'
  | 'pencil'
  | 'marker'
  | 'dashed'
  | 'highlighter'
  | 'laser-vanish'
  | 'eraser-stroke'
  | 'eraser-pixel'
  | 'eraser-highlighter'
  | 'shape-snap'
  | 'lasso'
  | 'fill-bucket';

export interface BoardLayer {
  id: string;
  name: string;
  role: 'question' | 'solution' | 'answer-key';
  visible: boolean;
  locked: boolean;
}

export interface StampedBoardWidget {
  id: string;
  title: string;
  summary: string;
  badgeColor: string;
  x: number;
  y: number;
  widgetKind?: 'lab-shape' | 'persian-number' | 'geo-shape';
  persianText?: string;
  geoShapeId?: GeometricShapePresetId;
  scale?: number;
  rotationDeg?: number;
  filled?: boolean;
  dashed?: boolean;
  strokeWidthPx?: number;
  groupId?: string;
  groupName?: string;
  dividerColor?: string;
  divDividend?: number;
  divDivisor?: number;
  hideDivisionSteps?: boolean;
  axisMin?: number;
  axisMax?: number;
  axisSubdivisions?: number;
  axisJumps?: Array<{ from: number; to: number; color?: string }>;
  showAxisJumps?: boolean;
}

interface StickyNode {
  id: string;
  title: string;
  text: string;
  colorClass: string;
  x: number;
  y: number;
  connectedToId?: string;
}

interface DroppedBoardPdf {
  id: string;
  name: string;
  kind: 'pdf-blob' | 'image-blob' | 'sample-sheet';
  url?: string;
  pageNumber: number;
  totalPages: number;
  x: number;
  y: number;
  width: number;
  height: number;
  sampleQuestionIndex: number;
  interactiveScrollMode: boolean;
  isFullscreenOnBoard?: boolean;
}

interface StrokePath {
  id: string;
  pageIndex: number;
  layerId: string;
  tool: PenToolId;
  color: string;
  fillColor?: string;
  width: number;
  points: Point2D[];
  createdAt?: number;
  isVanishing?: boolean;
  shapeLabel?: string;
}

export interface BoardFeatureTrigger {
  feature:
    | 'ruler'
    | 'table'
    | 'shapes-palette'
    | 'sticky'
    | 'number-box'
    | 'pdf-import'
    | 'handwriting-pad'
    | 'flowchart-pad'
    | 'desktop-overlay'
    | 'layers-popover'
    | 'class-notes-export';
  ts: number;
}

interface SmartWhiteboardCanvasProps {
  canvasMode: 'infinite' | 'a4' | '16:9' | '9:16';
  background: CanvasBackgroundId;
  activeTool: PenToolId;
  onSelectTool: (t: PenToolId) => void;
  strokeColor: string;
  onSelectColor: (c: string) => void;
  strokeWidth: number;
  onChangeStrokeWidth?: (w: number) => void;
  eraserSize: number;
  onChangeEraserSize?: (size: number) => void;
  stabilizationLevel: number;
  holdToSnapEnabled: boolean;
  fillDrawnShapes?: boolean;
  colorActionTrigger?: {
    color: string;
    target: 'auto' | 'shapes' | 'widgets';
    ts: number;
  } | null;
  featureTrigger?: BoardFeatureTrigger | null;
  splitScreenPdfOpen: boolean;
  desktopOverlayMode?: boolean;
  onToggleDesktopOverlayMode?: () => void;
  layers: BoardLayer[];
  activeLayerId: string;
  onSelectLayer: (id: string) => void;
  onToggleLayerVisible: (id: string) => void;
  onToggleLayerLock: (id: string) => void;
  stampedWidgets: StampedBoardWidget[];
  onRemoveStampedWidget: (id: string) => void;
  onUpdateStampedWidgets?: React.Dispatch<React.SetStateAction<StampedBoardWidget[]>>;
  spotlightActive: boolean;
  floatingWatermark: boolean;
  onToggleFloatingWatermark?: () => void;
  watermarkCode?: string;
  usePersianNumerals: boolean;
  clearTrigger: number;
  onLiveBoardSync?: (state: {
    currentPage: number;
    totalPages: number;
    strokes: ProjectorStrokeItem[];
    activeLiveStroke?: {
      tool: PenToolId;
      color: string;
      fillColor?: string;
      width: number;
      points: Point2D[];
    } | null;
    stampedWidgets: StampedBoardWidget[];
    clippedQuestion?: { title: string; body: string } | null;
  }) => void;
}

const DEFAULT_STROKES: StrokePath[] = [];

const SAMPLE_PDF_SHEETS = [
  {
    title: 'برگه امتحان ریاضی و کسرها (صفحه ۱)',
    body: '۱) کسر ۳/۵ را روی محور اعداد ۰ تا ۱۰ و همچنین با شکل دایره‌ای نمایش دهید.\n۲) حاصل تقسیم چکشی ۱۴۷ بر ۱۲ را به همراه خارج‌قسمت و باقی‌مانده بنویسید.',
  },
  {
    title: 'برگه تست فیزیک و مکانیک (صفحه ۲)',
    body: '۳) جسمی به جرم ۵ کیلوگرم روی سطح شیب‌دار با زاویه ۳۰ درجه قرار دارد. بردارهای نیرو (FBD) و شتاب حرکت را روی شکل رسم کنید.',
  },
  {
    title: 'برگه تمرین ساعت و هندسه (صفحه ۳)',
    body: '۴) عقربه‌های ساعت را روی ۳:۲۵ تنظیم کرده و زاویه بین عقربه‌ها را با نقاله اندازه بگیرید.',
  },
];

export const SmartWhiteboardCanvas: React.FC<SmartWhiteboardCanvasProps> = ({
  canvasMode,
  background,
  activeTool,
  onSelectTool,
  strokeColor,
  onSelectColor,
  strokeWidth,
  onChangeStrokeWidth,
  eraserSize,
  onChangeEraserSize,
  stabilizationLevel,
  fillDrawnShapes = false,
  colorActionTrigger = null,
  featureTrigger = null,
  splitScreenPdfOpen,
  desktopOverlayMode = false,
  onToggleDesktopOverlayMode,
  layers,
  activeLayerId,
  onSelectLayer,
  onToggleLayerVisible,
  onToggleLayerLock,
  stampedWidgets,
  onRemoveStampedWidget,
  onUpdateStampedWidgets,
  spotlightActive,
  floatingWatermark,
  onToggleFloatingWatermark,
  watermarkCode = 'DB-98421',
  usePersianNumerals,
  clearTrigger,
  onLiveBoardSync,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const pdfFileInputRef = useRef<HTMLInputElement | null>(null);
  const [strokes, setStrokes] = useState<StrokePath[]>(DEFAULT_STROKES);
  const [redoStack, setRedoStack] = useState<StrokePath[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(2);

  // Fullscreen & Expandable/Scrollable Board Dimensions
  const [isBoardFullscreen, setIsBoardFullscreen] = useState<boolean>(false);
  const [boardWidth, setBoardWidth] = useState<number>(1200);
  const [boardHeight, setBoardHeight] = useState<number>(760);

  // Custom Shortcuts for Ready Shapes, Math Symbols & Numbers
  const [customShortcuts, setCustomShortcuts] = useState<CustomBoardShortcut[]>(() => {
    try {
      const saved = window.localStorage.getItem('daneshboard_custom_shortcuts_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_CUSTOM_BOARD_SHORTCUTS;
  });
  const [newShortcutTargetType, setNewShortcutTargetType] = useState<
    'geo-shape' | 'math-symbol' | 'persian-number'
  >('geo-shape');
  const [newShortcutPayload, setNewShortcutPayload] = useState<string>('fraction-line');
  const [newShortcutKeyCombo, setNewShortcutKeyCombo] = useState<string>('Alt+9');
  const [capturingShortcutKey, setCapturingShortcutKey] = useState<boolean>(false);

  // Lasso Handwritten Stroke Selection & Drag-Move State
  const [selectedStrokeIds, setSelectedStrokeIds] = useState<string[]>([]);
  const [draggingSelectedStrokes, setDraggingSelectedStrokes] = useState<{
    lastX: number;
    lastY: number;
  } | null>(null);

  // On-demand Board Tools (hidden by default for a clean board)
  const [stickyNodes, setStickyNodes] = useState<StickyNode[]>([]);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [showDynamicTable, setShowDynamicTable] = useState<boolean>(false);
  const [tableData, setTableData] = useState<string[][]>([
    ['ردیف', 'موضوع', 'مقدار'],
    ['۱', 'کسر اول', '۳/۵'],
    ['۲', 'کسر دوم', '۲/۵'],
  ]);
  const [showRulerProtractor, setShowRulerProtractor] = useState<boolean>(false);
  const [rulerAngle, setRulerAngle] = useState<number>(0);
  const [showLayersPopover, setShowLayersPopover] = useState<boolean>(false);
  const [showMoreToolsMenu, setShowMoreToolsMenu] = useState<boolean>(false);
  const [lastSnapNotice, setLastSnapNotice] = useState<string | null>(null);
  const [forcedShapeKind, setForcedShapeKind] = useState<'auto' | 'line' | 'freehand'>('auto');

  // Small Pinnable Menu for Inserting Numbers on Board (منوی کوچک پین‌شونده درج عدد روی تخته)
  const [showNumberMiniMenu, setShowNumberMiniMenu] = useState<boolean>(false);
  const [numberMiniMenuPinned, setNumberMiniMenuPinned] = useState<boolean>(true);
  const [customPersianInput, setCustomPersianInput] = useState<string>('۱۲۵');

  // Simplified Geometric Shapes Popover
  const [showShapesPalette, setShowShapesPalette] = useState<boolean>(false);

  // Offline Gboard-Style Handwriting & Flowchart Pad State
  const [showHandwritingPad, setShowHandwritingPad] = useState<boolean>(false);
  const [handwritingPadTab, setHandwritingPadTab] = useState<'handwriting' | 'flowchart'>(
    'handwriting'
  );
  const [handwritingBeautifierActive, setHandwritingBeautifierActive] =
    useState<boolean>(true);

  // Class Notes PDF Handout Preview & Export Modal State
  const [showClassNotesModal, setShowClassNotesModal] = useState<boolean>(false);
  const [teacherNameInput, setTeacherNameInput] = useState<string>('استاد محمدحسین احمدی');
  const [sessionTopicInput, setSessionTopicInput] = useState<string>(
    'جلسه تدریس ریاضی، هندسه و فیزیک'
  );

  // PDF / Image Dropped Directly on the Whiteboard
  const [boardPdfSheet, setBoardPdfSheet] = useState<DroppedBoardPdf | null>(null);
  const [draggingPdfSheet, setDraggingPdfSheet] = useState<boolean>(false);

  // Selected Widget & Dragging State (No floating badge above widgets!)
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [moveSelectedWithMouse, setMoveSelectedWithMouse] = useState<boolean>(true);
  const [draggingWidgetId, setDraggingWidgetId] = useState<string | null>(null);
  const [widgetCoords, setWidgetCoords] = useState<Record<string, { x: number; y: number }>>({});

  // Pointer & Eraser Cursor Tracking
  const isDrawingRef = useRef<boolean>(false);
  const currentPointsRef = useRef<Point2D[]>([]);
  const pointerDownInfoRef = useRef<{
    clientX: number;
    clientY: number;
    relX: number;
    relY: number;
    maxDist: number;
    hitWidgetId: string | null;
  } | null>(null);
  const boardContainerRef = useRef<HTMLDivElement | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 450, y: 280 });
  const [boardCursorPos, setBoardCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [clippedQuestionOnBoard, setClippedQuestionOnBoard] = useState<boolean>(false);
  const [selectedPdfQuestionIdx, setSelectedPdfQuestionIdx] = useState<number>(0);
  const [watermarkStep, setWatermarkStep] = useState<number>(0);

  const fmt = (val: string | number) => toPersianDigits(val, usePersianNumerals);
  const isEraserActive =
    activeTool === 'eraser-pixel' ||
    activeTool === 'eraser-stroke' ||
    activeTool === 'eraser-highlighter';
  const isPenDrawingTool =
    !isEraserActive && activeTool !== 'lasso' && activeTool !== 'fill-bucket';

  const customCursorSpec = React.useMemo(
    () =>
      computeCustomBoardCursor({
        activeTool,
        strokeColor,
        strokeWidth,
        eraserSize,
      }),
    [activeTool, strokeColor, strokeWidth, eraserSize]
  );

  // Persist custom board shortcuts
  useEffect(() => {
    try {
      window.localStorage.setItem(
        'daneshboard_custom_shortcuts_v1',
        JSON.stringify(customShortcuts)
      );
    } catch {
      // ignore
    }
  }, [customShortcuts]);

  // Respond to external feature triggers (e.g. from unified search bar or Modules manager)
  useEffect(() => {
    if (!featureTrigger) return;
    switch (featureTrigger.feature) {
      case 'ruler':
        setShowRulerProtractor(true);
        break;
      case 'table':
        setShowDynamicTable(true);
        break;
      case 'shapes-palette':
        setShowShapesPalette(true);
        break;
      case 'sticky':
        handleAddConnectedStickyPair();
        break;
      case 'number-box':
        setShowNumberMiniMenu(true);
        break;
      case 'pdf-import':
        pdfFileInputRef.current?.click();
        break;
      case 'handwriting-pad':
        setHandwritingPadTab('handwriting');
        setShowHandwritingPad(true);
        break;
      case 'flowchart-pad':
        setHandwritingPadTab('flowchart');
        setShowHandwritingPad(true);
        break;
      case 'desktop-overlay':
        onToggleDesktopOverlayMode?.();
        break;
      case 'layers-popover':
        setShowLayersPopover(true);
        break;
      case 'class-notes-export':
        setShowClassNotesModal(true);
        break;
    }
  }, [featureTrigger]);

  useEffect(() => {
    if (clearTrigger > 0) {
      setStrokes((prev) => prev.filter((s) => s.pageIndex !== currentPage));
      setStickyNodes([]);
      setShowDynamicTable(false);
      setSelectedWidgetId(null);
      setSelectedStrokeIds([]);
      setBoardPdfSheet(null);
    }
  }, [clearTrigger, currentPage]);

  // Vanishing laser pen cleanup timer
  useEffect(() => {
    const hasVanishing = strokes.some((s) => s.isVanishing);
    if (!hasVanishing) return;
    const timer = window.setInterval(() => {
      const now = Date.now();
      setStrokes((prev) =>
        prev.filter((s) => !s.isVanishing || (s.createdAt && now - s.createdAt < 2400))
      );
    }, 250);
    return () => window.clearInterval(timer);
  }, [strokes]);

  // Floating Anti-Piracy Watermark position shifter
  useEffect(() => {
    if (!floatingWatermark) return;
    const id = window.setInterval(() => {
      setWatermarkStep((s) => (s + 1) % 4);
    }, 4000);
    return () => window.clearInterval(id);
  }, [floatingWatermark]);

  const pageStrokes = React.useMemo(
    () => strokes.filter((s) => s.pageIndex === currentPage),
    [strokes, currentPage]
  );

  const selectedStrokesBox = React.useMemo(() => {
    if (selectedStrokeIds.length === 0) return null;
    const selSet = new Set(selectedStrokeIds);
    const chosen = pageStrokes.filter((s) => selSet.has(s.id));
    if (chosen.length === 0) return null;
    return getStrokesBoundingBox(chosen.map((s) => s.points));
  }, [selectedStrokeIds, pageStrokes]);

  const selectedWidget = React.useMemo(
    () => stampedWidgets.find((w) => w.id === selectedWidgetId) ?? null,
    [stampedWidgets, selectedWidgetId]
  );

  // Automatically select newly stamped widget so its small corner menu opens immediately
  const prevWidgetsCountRef = useRef<number>(stampedWidgets.length);
  useEffect(() => {
    if (stampedWidgets.length > prevWidgetsCountRef.current) {
      const newest = stampedWidgets[stampedWidgets.length - 1];
      if (newest) {
        setSelectedWidgetId(newest.id);
      }
    }
    prevWidgetsCountRef.current = stampedWidgets.length;
  }, [stampedWidgets.length]);

  const updateWidgetProps = (id: string, patch: Partial<StampedBoardWidget>) => {
    if (!onUpdateStampedWidgets) return;
    onUpdateStampedWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...patch } : w))
    );
  };

  const addPersianNumberToBoard = (rawText: string, customX?: number, customY?: number) => {
    if (!onUpdateStampedWidgets) return;
    const persianStr = toPersianDigits(rawText.trim() || '۰', true);
    const newId = `num-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const x = customX ?? 340 + (stampedWidgets.length % 5) * 60;
    const y = customY ?? 150 + (stampedWidgets.length % 4) * 55;
    const newWidget: StampedBoardWidget = {
      id: newId,
      title: `عدد فارسی (${persianStr})`,
      summary: persianStr,
      badgeColor: strokeColor,
      dividerColor: '#0f172a',
      x,
      y,
      widgetKind: 'persian-number',
      persianText: persianStr,
      scale: 1,
      rotationDeg: 0,
      filled: true,
      dashed: false,
      strokeWidthPx: 3,
    };
    onUpdateStampedWidgets((prev) => [...prev, newWidget]);
    setSelectedWidgetId(newId);
    if (!numberMiniMenuPinned) {
      setShowNumberMiniMenu(false);
    }
  };

  const addMathSymbolToBoard = (
    symbolText: string,
    labelFa: string,
    customX?: number,
    customY?: number
  ) => {
    if (!onUpdateStampedWidgets) return;
    if (symbolText === 'a/b') {
      addGeometricShapeToBoard('fraction-line', customX, customY);
      return;
    }
    const newId = `sym-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const x = customX ?? 350 + (stampedWidgets.length % 5) * 55;
    const y = customY ?? 155 + (stampedWidgets.length % 4) * 50;
    const newWidget: StampedBoardWidget = {
      id: newId,
      title: `علامت ریاضی (${labelFa})`,
      summary: symbolText,
      badgeColor: strokeColor === '#0f172a' ? '#0284c7' : strokeColor,
      dividerColor: '#0f172a',
      x,
      y,
      widgetKind: 'persian-number',
      persianText: symbolText,
      scale: 1.1,
      rotationDeg: 0,
      filled: true,
      dashed: false,
      strokeWidthPx: 3,
    };
    onUpdateStampedWidgets((prev) => [...prev, newWidget]);
    setSelectedWidgetId(newId);
    setShowShapesPalette(false);
    setLastSnapNotice(`علامت «${labelFa}» روی تخته درج شد`);
    window.setTimeout(() => setLastSnapNotice(null), 2000);
  };

  const addGeometricShapeToBoard = (
    shapeId: GeometricShapePresetId,
    customX?: number,
    customY?: number
  ) => {
    if (!onUpdateStampedWidgets) return;
    const preset = GEOMETRIC_SHAPE_PRESETS.find((p) => p.id === shapeId);
    const newId = `geo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const x = customX ?? 360 + (stampedWidgets.length % 4) * 70;
    const y = customY ?? 160 + (stampedWidgets.length % 4) * 60;
    const newWidget: StampedBoardWidget = {
      id: newId,
      title: preset?.labelFa ?? 'شکل هندسی',
      summary: shapeId === 'fraction-line' ? '۳/۵' : '',
      badgeColor: strokeColor === '#0f172a' ? '#38bdf8' : strokeColor,
      dividerColor: '#0f172a',
      x,
      y,
      widgetKind: 'geo-shape',
      geoShapeId: shapeId,
      persianText: '',
      divDividend: shapeId === 'fraction-line' ? 3 : undefined,
      divDivisor: shapeId === 'fraction-line' ? 5 : undefined,
      scale: 1,
      rotationDeg: 0,
      filled: shapeId !== 'fraction-line' && shapeId !== 'radical-sign',
      dashed: false,
      strokeWidthPx: strokeWidth,
    };
    onUpdateStampedWidgets((prev) => [...prev, newWidget]);
    setSelectedWidgetId(newId);
    setShowShapesPalette(false);
  };

  // Global keyboard listener for Custom Board Shortcuts (Alt+1..9 etc.) & Esc from Fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isBoardFullscreen) {
        setIsBoardFullscreen(false);
        return;
      }
      if (capturingShortcutKey) return;
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

      const combo = formatKeyboardEventToCombo({
        key: e.key,
        code: e.code,
        altKey: e.altKey,
        ctrlKey: e.ctrlKey || e.metaKey,
        shiftKey: e.shiftKey,
      });
      const matched = findMatchingCustomShortcut(customShortcuts, combo);
      if (matched) {
        e.preventDefault();
        if (matched.targetKind === 'geo-shape') {
          addGeometricShapeToBoard(matched.targetValue as GeometricShapePresetId);
          setLastSnapNotice(`میانبر ${matched.keyCombo}: «${matched.labelFa}» درج شد`);
          window.setTimeout(() => setLastSnapNotice(null), 2000);
        } else if (matched.targetKind === 'math-symbol') {
          addMathSymbolToBoard(matched.targetValue, matched.labelFa);
        } else if (matched.targetKind === 'persian-number') {
          addPersianNumberToBoard(matched.targetValue);
          setLastSnapNotice(`میانبر ${matched.keyCombo}: عدد «${matched.targetValue}» درج شد`);
          window.setTimeout(() => setLastSnapNotice(null), 2000);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleToggleBoardFullscreen = () => {
    setIsBoardFullscreen((prev) => {
      const next = !prev;
      try {
        if (next && document.documentElement.requestFullscreen && !document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else if (!next && document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      } catch {
        // ignore iframe fullscreen restriction
      }
      return next;
    });
  };

  const handleBakeGeoShapeToCanvasStrokes = (w: StampedBoardWidget) => {
    if (!w.geoShapeId) return;
    const container = boardContainerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const rect = container.getBoundingClientRect();
    const scaleX = canvas.width / Math.max(1, rect.width);
    const scaleY = canvas.height / Math.max(1, rect.height);
    const pos = widgetCoords[w.id] ?? { x: w.x, y: w.y };
    const cx = (pos.x + 80 * (w.scale ?? 1)) * scaleX;
    const cy = (pos.y + 80 * (w.scale ?? 1)) * scaleY;

    const polylines = generateGeometricShapeStrokes(
      w.geoShapeId,
      cx,
      cy,
      w.scale ?? 1,
      w.rotationDeg ?? 0
    );

    const bakedStrokes: StrokePath[] = polylines.map((pts, i) => ({
      id: `baked-${w.id}-${i}-${Date.now()}`,
      pageIndex: currentPage,
      layerId: activeLayerId,
      tool: w.dashed ? 'dashed' : 'fountain',
      color: w.dividerColor || '#0f172a',
      fillColor: w.filled ? w.badgeColor : undefined,
      width: w.strokeWidthPx ?? strokeWidth,
      points: pts,
      createdAt: Date.now(),
      shapeLabel: w.title,
    }));

    setStrokes((prev) => [...prev, ...bakedStrokes]);
    onRemoveStampedWidget(w.id);
    setSelectedWidgetId(null);
    setLastSnapNotice(`«${w.title}» به خطوط قابل پاک‌کردن روی تخته تبدیل شد`);
    window.setTimeout(() => setLastSnapNotice(null), 2400);
  };

  const handleUploadPdfOrImageFile = (
    file: File,
    dropX = 120,
    dropY = 70,
    fullscreenOnBoard = true
  ) => {
    const url = URL.createObjectURL(file);
    const isImage = file.type.startsWith('image/');
    setBoardPdfSheet({
      id: `pdf-${Date.now()}`,
      name: file.name,
      kind: isImage ? 'image-blob' : 'pdf-blob',
      url,
      pageNumber: 1,
      totalPages: 5,
      x: dropX,
      y: dropY,
      width: 680,
      height: 500,
      sampleQuestionIndex: 0,
      interactiveScrollMode: false,
      isFullscreenOnBoard: fullscreenOnBoard,
    });
    setLastSnapNotice(
      `فایل «${file.name}» به‌صورت تمام‌صفحه روی وایت‌برد قرار گرفت (مستقیم روی آن بنویسید)`
    );
    window.setTimeout(() => setLastSnapNotice(null), 2600);
  };

  const handlePlaceSamplePdfOnBoard = (fullscreenOnBoard = false) => {
    setBoardPdfSheet({
      id: `pdf-sample-${Date.now()}`,
      name: 'جزوه و سوالات امتحانی.pdf',
      kind: 'sample-sheet',
      pageNumber: 1,
      totalPages: SAMPLE_PDF_SHEETS.length,
      x: 100,
      y: 65,
      width: 640,
      height: 440,
      sampleQuestionIndex: 0,
      interactiveScrollMode: false,
      isFullscreenOnBoard: fullscreenOnBoard,
    });
    setLastSnapNotice(
      fullscreenOnBoard
        ? 'برگه PDF تمام‌صفحه روی وایت‌برد قرار گرفت — با قلم مستقیم روی کل برگه بنویسید'
        : 'برگه PDF روی وایت‌برد قرار گرفت — با قلم مستقیم روی آن بنویسید'
    );
    window.setTimeout(() => setLastSnapNotice(null), 2600);
  };

  // Unified canvas renderer
  const redrawCanvas = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const visibleLayerIds = new Set(layers.filter((l) => l.visible).map((l) => l.id));

    const highlighterStrokes = pageStrokes.filter(
      (s) => s.tool === 'highlighter' && visibleLayerIds.has(s.layerId)
    );
    const regularStrokes = pageStrokes.filter(
      (s) => s.tool !== 'highlighter' && visibleLayerIds.has(s.layerId)
    );

    const drawPathOnCtx = (targetCtx: CanvasRenderingContext2D, s: StrokePath) => {
      if (s.points.length < 2) return;
      targetCtx.save();
      targetCtx.beginPath();
      targetCtx.lineCap = s.tool === 'marker' ? 'square' : 'round';
      targetCtx.lineJoin = 'round';
      targetCtx.strokeStyle = s.color;
      targetCtx.lineWidth =
        s.tool === 'highlighter'
          ? s.width * 4.5
          : s.tool === 'marker'
          ? s.width * 2.2
          : s.width;

      if (s.tool === 'dashed') {
        targetCtx.setLineDash([8, 6]);
      } else if (s.tool === 'lasso') {
        targetCtx.setLineDash([4, 4]);
      }

      if (s.tool === 'highlighter') {
        targetCtx.globalAlpha = 0.32;
      } else if (s.isVanishing) {
        targetCtx.globalAlpha = 0.85;
        targetCtx.shadowColor = '#ef4444';
        targetCtx.shadowBlur = 8;
      } else if (s.tool === 'pencil') {
        targetCtx.globalAlpha = 0.75;
      }

      targetCtx.moveTo(s.points[0].x, s.points[0].y);
      if (Boolean(s.shapeLabel)) {
        for (let i = 1; i < s.points.length; i++) {
          targetCtx.lineTo(s.points[i].x, s.points[i].y);
        }
      } else {
        for (let i = 1; i < s.points.length; i++) {
          const prev = s.points[i - 1];
          const curr = s.points[i];
          const midX = (prev.x + curr.x) / 2;
          const midY = (prev.y + curr.y) / 2;
          targetCtx.quadraticCurveTo(prev.x, prev.y, midX, midY);
        }
        const lastPt = s.points[s.points.length - 1];
        targetCtx.lineTo(lastPt.x, lastPt.y);
      }
      if (s.fillColor && s.points.length >= 3) {
        targetCtx.fillStyle = `${s.fillColor}42`;
        targetCtx.fill();
      }
      targetCtx.stroke();
      targetCtx.restore();
    };

    highlighterStrokes.forEach((s) => drawPathOnCtx(ctx, s));
    regularStrokes.forEach((s) => drawPathOnCtx(ctx, s));

    // Render active in-progress stroke
    if (isDrawingRef.current && currentPointsRef.current.length >= 2 && !isEraserActive) {
      const livePts =
        activeTool === 'shape-snap' && forcedShapeKind === 'line'
          ? [
              currentPointsRef.current[0],
              currentPointsRef.current[currentPointsRef.current.length - 1],
            ]
          : currentPointsRef.current;

      drawPathOnCtx(ctx, {
        id: 'live-preview',
        pageIndex: currentPage,
        layerId: activeLayerId,
        tool: activeTool,
        color:
          activeTool === 'laser-vanish'
            ? '#ef4444'
            : activeTool === 'lasso'
            ? '#0284c7'
            : strokeColor,
        width: strokeWidth,
        points: livePts,
        isVanishing: activeTool === 'laser-vanish',
        shapeLabel:
          activeTool === 'shape-snap' && forcedShapeKind === 'line' ? 'پارهخط صاف' : undefined,
      });
    }
  }, [
    pageStrokes,
    layers,
    activeTool,
    isEraserActive,
    forcedShapeKind,
    currentPage,
    activeLayerId,
    strokeColor,
    strokeWidth,
  ]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const handleUndo = () => {
    setStrokes((prev) => {
      const idx = [...prev].reverse().findIndex((s) => s.pageIndex === currentPage);
      if (idx === -1) return prev;
      const actualIdx = prev.length - 1 - idx;
      const removed = prev[actualIdx];
      setRedoStack((r) => [...r, removed]);
      return prev.filter((_, i) => i !== actualIdx);
    });
  };

  const handleRedo = () => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setStrokes((s) => [...s, last]);
      return prev.slice(0, -1);
    });
  };

  const handleAddConnectedStickyPair = () => {
    const id1 = `sticky-${Date.now()}-1`;
    const id2 = `sticky-${Date.now()}-2`;
    setStickyNodes((prev) => [
      ...prev,
      {
        id: id1,
        title: 'نکته ۱',
        text: 'قانون دوم نیوتن: ∑F = m·a',
        colorClass:
          'bg-amber-100 dark:bg-amber-950/90 border-amber-400 text-amber-950 dark:text-amber-100',
        x: 90,
        y: 105,
        connectedToId: id2,
      },
      {
        id: id2,
        title: 'نتیجه',
        text: 'a = g·(sinθ − μ·cosθ)',
        colorClass:
          'bg-sky-100 dark:bg-sky-950/90 border-sky-400 text-sky-950 dark:text-sky-100',
        x: 330,
        y: 155,
      },
    ]);
  };

  const getPointerCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const findHitWidgetAtRelCoords = (relX: number, relY: number): StampedBoardWidget | null => {
    for (let i = stampedWidgets.length - 1; i >= 0; i--) {
      const w = stampedWidgets[i];
      const pos = widgetCoords[w.id] ?? {
        x: w.x || 240 + (i % 3) * 85,
        y: w.y || 95 + (i % 4) * 75,
      };
      const sc = w.scale ?? 1;
      const wBox = (w.title.includes('محور') ? 360 : 190) * sc;
      const hBox = 145 * sc;
      if (
        relX >= pos.x - 12 &&
        relX <= pos.x + wBox &&
        relY >= pos.y - 12 &&
        relY <= pos.y + hBox
      ) {
        return w;
      }
    }
    return null;
  };

  const applyEraserAlongSegment = (fromPt: Point2D, toPt: Point2D) => {
    const dist = Math.hypot(toPt.x - fromPt.x, toPt.y - fromPt.y);
    const steps = Math.max(1, Math.min(24, Math.ceil(dist / 6)));
    const samplePoints: Point2D[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      samplePoints.push({
        x: fromPt.x + (toPt.x - fromPt.x) * t,
        y: fromPt.y + (toPt.y - fromPt.y) * t,
      });
    }

    const effectiveRadius = Math.max(6, eraserSize);

    if (activeTool === 'eraser-stroke') {
      setStrokes((prev) =>
        prev.filter((s) => {
          if (s.pageIndex !== currentPage) return true;
          const hit = samplePoints.some((sp) =>
            isStrokeHitByEraser(s.points, sp, effectiveRadius + s.width * 0.5)
          );
          return !hit;
        })
      );
      return;
    }

    if (activeTool === 'eraser-pixel') {
      setStrokes((prev) => {
        let currentList = prev;
        for (const sp of samplePoints) {
          const next: StrokePath[] = [];
          for (const s of currentList) {
            if (s.pageIndex !== currentPage) {
              next.push(s);
              continue;
            }
            if (!isStrokeHitByEraser(s.points, sp, effectiveRadius + s.width * 0.5)) {
              next.push(s);
              continue;
            }
            // Exact analytical circle-segment clipping preserves all remaining vertices and corners!
            const segments = eraseStrokePointsInRadius(s.points, sp, effectiveRadius);
            segments.forEach((seg, idx) => {
              next.push({
                ...s,
                id: `${s.id}-seg-${idx}-${Date.now()}-${Math.random()}`,
                points: seg,
                // Preserve shapeLabel so geometric shapes keep straight edges & crisp corners!
                shapeLabel: s.shapeLabel,
                // Clear fillColor if a closed shape's perimeter was broken into open segments
                fillColor: undefined,
              });
            });
          }
          currentList = next;
        }
        return currentList;
      });
      return;
    }

    if (activeTool === 'eraser-highlighter') {
      setStrokes((prev) =>
        prev.filter((s) => {
          if (s.pageIndex !== currentPage || s.tool !== 'highlighter') return true;
          const hit = samplePoints.some((sp) =>
            isStrokeHitByEraser(s.points, sp, effectiveRadius + 10)
          );
          return !hit;
        })
      );
    }
  };

  // Respond to one-click Color Action Trigger from the Pen & Drawing Engine Palette
  useEffect(() => {
    if (!colorActionTrigger) return;
    const { color, target } = colorActionTrigger;

    if (target === 'widgets' || (target === 'auto' && selectedWidgetId)) {
      if (selectedWidgetId) {
        updateWidgetProps(selectedWidgetId, { badgeColor: color, filled: true });
        setLastSnapNotice('رنگ داخل ابزارک انتخاب‌شده به‌روزرسانی شد');
        window.setTimeout(() => setLastSnapNotice(null), 2200);
        return;
      }
      if (stampedWidgets.length > 0 && onUpdateStampedWidgets) {
        const lastW = stampedWidgets[stampedWidgets.length - 1];
        updateWidgetProps(lastW.id, { badgeColor: color, filled: true });
        setSelectedWidgetId(lastW.id);
        setLastSnapNotice(`رنگ داخل «${lastW.title}» تغییر کرد`);
        window.setTimeout(() => setLastSnapNotice(null), 2200);
        return;
      }
    }

    if (target === 'shapes' || target === 'auto') {
      let coloredStroke = false;
      setStrokes((prev) => {
        const revIdx = [...prev].reverse().findIndex((s) => s.pageIndex === currentPage);
        if (revIdx === -1) return prev;
        coloredStroke = true;
        const targetIdx = prev.length - 1 - revIdx;
        return prev.map((s, idx) =>
          idx === targetIdx ? { ...s, fillColor: color } : s
        );
      });
      if (coloredStroke) {
        setLastSnapNotice('داخل آخرین شکل ترسیم‌شده رنگ‌آمیزی شد');
        window.setTimeout(() => setLastSnapNotice(null), 2200);
      } else if (stampedWidgets.length > 0) {
        const lastW = stampedWidgets[stampedWidgets.length - 1];
        updateWidgetProps(lastW.id, { badgeColor: color, filled: true });
        setSelectedWidgetId(lastW.id);
        setLastSnapNotice(`رنگ داخل «${lastW.title}» تغییر کرد`);
        window.setTimeout(() => setLastSnapNotice(null), 2200);
      }
    }
  }, [colorActionTrigger]);

  // When a smart widget is selected and fill-bucket is active, changing strokeColor updates its inner fill live
  useEffect(() => {
    if (selectedWidgetId && activeTool === 'fill-bucket') {
      updateWidgetProps(selectedWidgetId, { badgeColor: strokeColor, filled: true });
    }
  }, [strokeColor]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button === 2) return;

    const pt = getPointerCoords(e);
    const container = boardContainerRef.current;
    const rect = container ? container.getBoundingClientRect() : null;
    const relX = rect ? e.clientX - rect.left : 0;
    const relY = rect ? e.clientY - rect.top : 0;

    const hitWidget = rect ? findHitWidgetAtRelCoords(relX, relY) : null;

    pointerDownInfoRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      relX,
      relY,
      maxDist: 0,
      hitWidgetId: hitWidget ? hitWidget.id : null,
    };

    // 1. Fill-Bucket Tool (سطل رنگ): Color any clicked Smart Widget OR any clicked Drawn Shape
    if (activeTool === 'fill-bucket') {
      if (hitWidget) {
        updateWidgetProps(hitWidget.id, { badgeColor: strokeColor, filled: true });
        setSelectedWidgetId(hitWidget.id);
        setLastSnapNotice(`داخل «${hitWidget.title}» با سطل رنگ رنگ‌آمیزی شد`);
        window.setTimeout(() => setLastSnapNotice(null), 2200);
        return;
      }

      let matchedStroke = false;
      setStrokes((prev) => {
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i--) {
          const s = next[i];
          if (s.pageIndex !== currentPage || s.points.length < 2) continue;
          const xs = s.points.map((p) => p.x);
          const ys = s.points.map((p) => p.y);
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);

          const insideBox =
            s.points.length >= 3 &&
            pt.x >= minX - 18 &&
            pt.x <= maxX + 18 &&
            pt.y >= minY - 18 &&
            pt.y <= maxY + 18;
          const nearLine = isStrokeHitByEraser(s.points, pt, 36 + s.width);

          if (insideBox || nearLine) {
            next[i] = { ...s, fillColor: strokeColor };
            matchedStroke = true;
            break;
          }
        }
        return matchedStroke ? next : prev;
      });

      if (matchedStroke) {
        setLastSnapNotice('داخل شکل ترسیم‌شده با سطل رنگ رنگ‌آمیزی شد');
        window.setTimeout(() => setLastSnapNotice(null), 2200);
        return;
      }

      if (selectedWidgetId) {
        updateWidgetProps(selectedWidgetId, { badgeColor: strokeColor, filled: true });
        return;
      }
      if (pageStrokes.length > 0) {
        const lastStrokeId = pageStrokes[pageStrokes.length - 1].id;
        setStrokes((prev) =>
          prev.map((s) => (s.id === lastStrokeId ? { ...s, fillColor: strokeColor } : s))
        );
        return;
      }
      if (stampedWidgets.length > 0) {
        const lastW = stampedWidgets[stampedWidgets.length - 1];
        updateWidgetProps(lastW.id, { badgeColor: strokeColor, filled: true });
        setSelectedWidgetId(lastW.id);
      }
      return;
    }

    // 2. If user clicked inside an active Lasso handwritten stroke selection box, start dragging those strokes!
    if (
      activeTool === 'lasso' &&
      selectedStrokesBox &&
      pt.x >= selectedStrokesBox.minX - 16 &&
      pt.x <= selectedStrokesBox.maxX + 16 &&
      pt.y >= selectedStrokesBox.minY - 16 &&
      pt.y <= selectedStrokesBox.maxY + 16
    ) {
      setDraggingSelectedStrokes({ lastX: pt.x, lastY: pt.y });
      return;
    }

    // 3. If user clicked on a widget while in Lasso mode OR while that widget is selected and moveSelectedWithMouse is enabled:
    if (
      hitWidget &&
      (activeTool === 'lasso' ||
        (selectedWidgetId === hitWidget.id && moveSelectedWithMouse && !isEraserActive))
    ) {
      setSelectedWidgetId(hitWidget.id);
      setDraggingWidgetId(hitWidget.id);
      return;
    }

    const activeLayer = layers.find((l) => l.id === activeLayerId);
    if (!activeLayer || activeLayer.locked || !activeLayer.visible) return;

    if (isEraserActive) {
      isDrawingRef.current = true;
      currentPointsRef.current = [pt];
      applyEraserAlongSegment(pt, pt);
      return;
    }

    isDrawingRef.current = true;
    currentPointsRef.current = [pt];
  };

  const handleBoardPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = boardContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;

    // Always update custom cursor position on the board for instant visual feedback
    setBoardCursorPos({ x: relX, y: relY });

    if (pointerDownInfoRef.current) {
      const d = Math.hypot(
        e.clientX - pointerDownInfoRef.current.clientX,
        e.clientY - pointerDownInfoRef.current.clientY
      );
      if (d > pointerDownInfoRef.current.maxDist) {
        pointerDownInfoRef.current.maxDist = d;
      }
    }

    if (spotlightActive) {
      setMousePos({ x: relX, y: relY });
    }

    // Dragging selected handwritten strokes with the Lasso tool
    if (draggingSelectedStrokes && selectedStrokeIds.length > 0) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const scaleX = canvas.width / Math.max(1, rect.width);
      const scaleY = canvas.height / Math.max(1, rect.height);
      const curCanvasX = relX * scaleX;
      const curCanvasY = relY * scaleY;
      const dx = curCanvasX - draggingSelectedStrokes.lastX;
      const dy = curCanvasY - draggingSelectedStrokes.lastY;
      if (Math.abs(dx) > 0.4 || Math.abs(dy) > 0.4) {
        const selSet = new Set(selectedStrokeIds);
        setStrokes((prev) =>
          prev.map((s) =>
            selSet.has(s.id)
              ? { ...s, points: translateStrokePoints(s.points, dx, dy) }
              : s
          )
        );
        setDraggingSelectedStrokes({ lastX: curCanvasX, lastY: curCanvasY });
      }
      return;
    }

    if (draggingPdfSheet && boardPdfSheet && !boardPdfSheet.isFullscreenOnBoard) {
      setBoardPdfSheet((prev) =>
        prev
          ? {
              ...prev,
              x: Math.max(10, Math.min(rect.width - 200, relX - 140)),
              y: Math.max(40, Math.min(rect.height - 120, relY - 18)),
            }
          : null
      );
      return;
    }

    if (draggingWidgetId) {
      const nextX = Math.max(8, Math.min(rect.width - 120, relX - 60));
      const nextY = Math.max(36, Math.min(rect.height - 100, relY - 40));

      setWidgetCoords((prev) => ({
        ...prev,
        [draggingWidgetId]: { x: nextX, y: nextY },
      }));

      if (onUpdateStampedWidgets) {
        onUpdateStampedWidgets((prev) =>
          prev.map((w) => (w.id === draggingWidgetId ? { ...w, x: nextX, y: nextY } : w))
        );
      }
      return;
    }

    if (draggingNodeId) {
      setStickyNodes((prev) =>
        prev.map((n) =>
          n.id === draggingNodeId
            ? {
                ...n,
                x: Math.max(16, Math.min(rect.width - 180, relX - 70)),
                y: Math.max(44, Math.min(rect.height - 90, relY - 24)),
              }
            : n
        )
      );
    }
  };

  const emitLiveSync = (livePoints?: Point2D[] | null) => {
    if (!onLiveBoardSync) return;
    const visibleLayerIds = new Set(layers.filter((l) => l.visible).map((l) => l.id));
    const visibleStrokes = strokes.filter(
      (s) => s.pageIndex === currentPage && visibleLayerIds.has(s.layerId)
    );
    const mergedWidgets = stampedWidgets.map((w) => {
      const pos = widgetCoords[w.id];
      return pos ? { ...w, x: pos.x, y: pos.y } : w;
    });
    const qLayerVisible = layers.find((l) => l.role === 'question')?.visible ?? true;
    const qItem = SAMPLE_PDF_SHEETS[selectedPdfQuestionIdx] ?? SAMPLE_PDF_SHEETS[0];
    onLiveBoardSync({
      currentPage,
      totalPages,
      strokes: visibleStrokes,
      activeLiveStroke:
        livePoints && livePoints.length >= 2
          ? {
              tool: activeTool,
              color: strokeColor,
              width: strokeWidth,
              points: livePoints,
            }
          : null,
      stampedWidgets: mergedWidgets,
      clippedQuestion: qLayerVisible && clippedQuestionOnBoard ? qItem : null,
    });
  };

  useEffect(() => {
    emitLiveSync(null);
  }, [
    strokes,
    stampedWidgets,
    widgetCoords,
    currentPage,
    totalPages,
    layers,
    clippedQuestionOnBoard,
    selectedPdfQuestionIdx,
  ]);

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const rawPt = getPointerCoords(e);
    const pts = currentPointsRef.current;
    const lastPt = pts[pts.length - 1] ?? rawPt;

    if (isEraserActive) {
      currentPointsRef.current = [rawPt];
      applyEraserAlongSegment(lastPt, rawPt);
      return;
    }

    const alpha =
      activeTool === 'shape-snap' && forcedShapeKind !== 'freehand'
        ? 0.78
        : Math.max(0.15, 1 - stabilizationLevel * 0.08);
    const smoothedPt = {
      x: lastPt.x + alpha * (rawPt.x - lastPt.x),
      y: lastPt.y + alpha * (rawPt.y - lastPt.y),
    };
    currentPointsRef.current.push(smoothedPt);
    redrawCanvas();
    emitLiveSync([...currentPointsRef.current]);
  };

  const handlePointerUp = () => {
    const downInfo = pointerDownInfoRef.current;
    pointerDownInfoRef.current = null;

    if (draggingSelectedStrokes) {
      setDraggingSelectedStrokes(null);
      return;
    }
    if (draggingPdfSheet) {
      setDraggingPdfSheet(false);
      return;
    }
    if (draggingWidgetId) {
      setDraggingWidgetId(null);
      return;
    }
    if (draggingNodeId) {
      setDraggingNodeId(null);
      return;
    }

    // If user clicked (tap without dragging < 6px) on a widget on the board, select it and open the corner menu!
    if (downInfo && downInfo.maxDist < 6) {
      if (downInfo.hitWidgetId) {
        isDrawingRef.current = false;
        currentPointsRef.current = [];
        setSelectedWidgetId(downInfo.hitWidgetId);
        redrawCanvas();
        return;
      } else if (selectedWidgetId && !isEraserActive) {
        setSelectedWidgetId(null);
      }
    }

    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    if (isEraserActive) {
      currentPointsRef.current = [];
      return;
    }
    let pts = [...currentPointsRef.current];
    currentPointsRef.current = [];

    if (pts.length < 2) {
      redrawCanvas();
      return;
    }

    // Lasso Tool: Select strokes inside bounding box so user can drag-move, recolor, duplicate, or delete them!
    if (activeTool === 'lasso') {
      const minX = Math.min(...pts.map((p) => p.x)) - 10;
      const maxX = Math.max(...pts.map((p) => p.x)) + 10;
      const minY = Math.min(...pts.map((p) => p.y)) - 10;
      const maxY = Math.max(...pts.map((p) => p.y)) + 10;
      const matchedIds = pageStrokes
        .filter((s) =>
          s.points.some((p) => p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY)
        )
        .map((s) => s.id);

      setSelectedStrokeIds(matchedIds);
      if (matchedIds.length > 0) {
        setLastSnapNotice(
          `${fmt(matchedIds.length)} خط با کمند انتخاب شد — کادر انتخابی را با ماوس بکشید و جابه‌جا کنید`
        );
        window.setTimeout(() => setLastSnapNotice(null), 2600);
      } else {
        // Also check if user circled a widget on the board
        const container = boardContainerRef.current;
        const canvas = canvasRef.current;
        if (container && canvas) {
          const rect = container.getBoundingClientRect();
          const scaleX = rect.width / Math.max(1, canvas.width);
          const scaleY = rect.height / Math.max(1, canvas.height);
          const midX = ((minX + maxX) / 2) * scaleX;
          const midY = ((minY + maxY) / 2) * scaleY;
          const hitW = findHitWidgetAtRelCoords(midX, midY);
          if (hitW) {
            setSelectedWidgetId(hitW.id);
            setLastSnapNotice(`«${hitW.title}» با کمند انتخاب شد — با ماوس جابه‌جا کنید`);
            window.setTimeout(() => setLastSnapNotice(null), 2400);
          }
        }
      }
      redrawCanvas();
      return;
    }

    // Geometric Shape Recognition
    let recognizedLabel: string | undefined;
    if (activeTool === 'shape-snap') {
      if (forcedShapeKind === 'line') {
        const first = pts[0];
        const last = pts[pts.length - 1];
        let endX = last.x;
        let endY = last.y;
        const angleDeg = Math.abs((Math.atan2(endY - first.y, endX - first.x) * 180) / Math.PI);
        if (angleDeg < 5 || angleDeg > 175) endY = first.y;
        else if (Math.abs(angleDeg - 90) < 5) endX = first.x;
        pts = [
          { x: Number(first.x.toFixed(1)), y: Number(first.y.toFixed(1)) },
          { x: Number(endX.toFixed(1)), y: Number(endY.toFixed(1)) },
        ];
        recognizedLabel = 'پارهخط صاف';
      } else if (forcedShapeKind === 'auto') {
        const recognized = recognizeGeometricShape(pts, true);
        if (recognized.type !== 'freehand') {
          pts = recognized.snappedPoints;
          recognizedLabel = recognized.labelFa;
          setLastSnapNotice(`تشخیص هوشمند: ${recognized.labelFa}`);
          window.setTimeout(() => setLastSnapNotice(null), 2000);
        }
      }
    }

    const shouldFillShape =
      fillDrawnShapes &&
      pts.length >= 3 &&
      (Boolean(recognizedLabel && recognizedLabel !== 'پارهخط صاف') ||
        activeTool === 'shape-snap' ||
        activeTool === 'fountain' ||
        activeTool === 'pencil' ||
        activeTool === 'marker');

    const newStroke: StrokePath = {
      id: `stroke-${Date.now()}-${Math.random()}`,
      pageIndex: currentPage,
      layerId: activeLayerId,
      tool: activeTool,
      color: activeTool === 'laser-vanish' ? '#ef4444' : strokeColor,
      fillColor: shouldFillShape ? strokeColor : undefined,
      width: strokeWidth,
      points: pts,
      createdAt: Date.now(),
      isVanishing: activeTool === 'laser-vanish',
      shapeLabel: recognizedLabel,
    };
    setStrokes((prev) => [...prev, newStroke]);
    setRedoStack([]);
  };

  const getBackgroundStyle = (): React.CSSProperties => {
    if (desktopOverlayMode) {
      return {
        backgroundColor: 'rgba(15, 23, 42, 0.14)',
        backgroundImage:
          'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%), radial-gradient(rgba(148, 163, 184, 0.35) 1px, transparent 1px)',
        backgroundSize: '100% 100%, 28px 28px',
      };
    }
    switch (background) {
      case 'blackboard':
        return {
          backgroundColor: '#0f172a',
          backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        };
      case 'greenboard':
        return {
          backgroundColor: '#064e3b',
          backgroundImage: 'radial-gradient(#047857 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        };
      case 'sepia':
        return {
          backgroundColor: '#fef3c7',
          backgroundImage: 'linear-gradient(to bottom, rgba(180,83,9,0.1) 1px, transparent 1px)',
          backgroundSize: '100% 32px',
        };
      case 'lined':
        return {
          backgroundImage:
            'linear-gradient(to bottom, rgba(148,163,184,0.28) 1px, transparent 1px)',
          backgroundSize: '100% 32px',
        };
      case 'grid':
        return {
          backgroundImage:
            'linear-gradient(to right, rgba(148,163,184,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.2) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        };
      case 'dots':
        return {
          backgroundImage: 'radial-gradient(rgba(148,163,184,0.45) 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
        };
      case 'isometric':
        return {
          backgroundImage:
            'radial-gradient(rgba(56,189,248,0.4) 1.5px, transparent 1.5px), radial-gradient(rgba(148,163,184,0.3) 1px, transparent 1px)',
          backgroundSize: '32px 18px',
          backgroundPosition: '0 0, 16px 9px',
        };
      case 'music':
        return {
          backgroundImage:
            'repeating-linear-gradient(to bottom, rgba(148,163,184,0.35) 0px, rgba(148,163,184,0.35) 1px, transparent 1px, transparent 8px, transparent 40px)',
          backgroundSize: '100% 56px',
        };
      default:
        return {};
    }
  };

  const questionLayerVisible = layers.find((l) => l.role === 'question')?.visible ?? true;
  const answerKeyLayerVisible = layers.find((l) => l.role === 'answer-key')?.visible ?? false;
  const watermarkPositions = [
    'top-28 left-6',
    'bottom-20 left-56',
    'top-44 left-8',
    'bottom-20 right-12',
  ];
  const currentPdfQ = SAMPLE_PDF_SHEETS[selectedPdfQuestionIdx] ?? SAMPLE_PDF_SHEETS[0];

  const handleAddOrUpdateCustomShortcut = () => {
    let labelFa = newShortcutPayload;
    if (newShortcutTargetType === 'geo-shape') {
      labelFa =
        GEOMETRIC_SHAPE_PRESETS.find((p) => p.id === newShortcutPayload)?.labelFa ??
        newShortcutPayload;
    } else if (newShortcutTargetType === 'math-symbol') {
      labelFa =
        FREQUENT_MATH_SYMBOLS.find((m) => m.symbol === newShortcutPayload)?.labelFa ??
        newShortcutPayload;
    } else {
      labelFa = `عدد ${toPersianDigits(newShortcutPayload, true)}`;
    }
    setCustomShortcuts((prev) =>
      upsertCustomBoardShortcut(prev, {
        id: `sc-${newShortcutTargetType}-${newShortcutPayload}`,
        keyCombo: newShortcutKeyCombo,
        targetKind: newShortcutTargetType,
        targetValue:
          newShortcutTargetType === 'persian-number'
            ? toPersianDigits(newShortcutPayload, true)
            : newShortcutPayload,
        labelFa,
      })
    );
    setLastSnapNotice(`شورتکات «${newShortcutKeyCombo}» برای «${labelFa}» ذخیره شد`);
    window.setTimeout(() => setLastSnapNotice(null), 2200);
  };

  return (
    <div
      className={
        isBoardFullscreen
          ? 'fixed inset-0 z-50 flex overflow-hidden bg-slate-100 dark:bg-slate-950'
          : 'flex-1 flex overflow-hidden relative bg-slate-100 dark:bg-slate-950'
      }
    >
      {/* Hidden File Input for Importing PDF or Image onto Whiteboard */}
      <input
        ref={pdfFileInputRef}
        type="file"
        accept=".pdf,application/pdf,image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            handleUploadPdfOrImageFile(f, 120, 70, true);
            e.target.value = '';
          }
        }}
      />

      {/* Optional Split-Screen PDF Book & Question Clipper */}
      {splitScreenPdfOpen && (
        <div className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 z-10">
          <div className="px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
              <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>جزوه PDF کنار تخته</span>
            </div>
            <button
              type="button"
              onClick={() => pdfFileInputRef.current?.click()}
              className="px-2 py-1 rounded bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-500"
            >
              + آپلود PDF تمام‌صفحه
            </button>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
            {SAMPLE_PDF_SHEETS.map((q, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border transition-all space-y-2 ${
                  selectedPdfQuestionIdx === idx
                    ? 'border-sky-500 bg-sky-50/30 dark:bg-sky-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40'
                }`}
              >
                <div className="text-xs font-bold text-sky-700 dark:text-sky-300">{q.title}</div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {q.body}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPdfQuestionIdx(idx);
                      setBoardPdfSheet({
                        id: `pdf-sheet-${idx}`,
                        name: q.title,
                        kind: 'sample-sheet',
                        pageNumber: idx + 1,
                        totalPages: SAMPLE_PDF_SHEETS.length,
                        x: 90,
                        y: 65,
                        width: 600,
                        height: 400,
                        sampleQuestionIndex: idx,
                        interactiveScrollMode: false,
                        isFullscreenOnBoard: false,
                      });
                      setClippedQuestionOnBoard(true);
                    }}
                    className="py-1.5 px-2 rounded-lg bg-sky-600 text-white text-[11px] font-semibold hover:bg-sky-500 transition-colors"
                  >
                    انداختن روی تخته
                  </button>
                  <button
                    type="button"
                    data-testid={`place-pdf-fullscreen-btn-${idx}`}
                    onClick={() => {
                      setSelectedPdfQuestionIdx(idx);
                      setBoardPdfSheet({
                        id: `pdf-sheet-${idx}`,
                        name: q.title,
                        kind: 'sample-sheet',
                        pageNumber: idx + 1,
                        totalPages: SAMPLE_PDF_SHEETS.length,
                        x: 8,
                        y: 52,
                        width: 960,
                        height: 640,
                        sampleQuestionIndex: idx,
                        interactiveScrollMode: false,
                        isFullscreenOnBoard: true,
                      });
                      setClippedQuestionOnBoard(true);
                    }}
                    className="py-1.5 px-2 rounded-lg bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-500 transition-colors flex items-center justify-center gap-1"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>تمام‌صفحه روی تخته</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scrollable & Expandable Main Whiteboard Viewport */}
      <div
        ref={scrollViewportRef}
        data-testid="whiteboard-scroll-viewport"
        className="flex-1 relative overflow-auto p-1"
      >
        <div
          ref={boardContainerRef}
          onPointerMove={handleBoardPointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={() => {
            setBoardCursorPos(null);
            handlePointerUp();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDrop={(e) => {
            e.preventDefault();
            const container = boardContainerRef.current;
            if (!container) return;
            const rect = container.getBoundingClientRect();
            const dropX = Math.max(20, Math.min(rect.width - 140, e.clientX - rect.left - 50));
            const dropY = Math.max(50, Math.min(rect.height - 120, e.clientY - rect.top - 50));

            // 1. Check if user dragged & dropped a real PDF or Image file onto the whiteboard!
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              const droppedFile = e.dataTransfer.files[0];
              handleUploadPdfOrImageFile(droppedFile, dropX, dropY, true);
              return;
            }

            // 2. Check internal drag payload
            const payload = e.dataTransfer.getData('text/plain');
            if (payload.startsWith('persian-num:')) {
              addPersianNumberToBoard(payload.replace('persian-num:', ''), dropX, dropY);
            } else if (payload.startsWith('geo-shape:')) {
              addGeometricShapeToBoard(
                payload.replace('geo-shape:', '') as GeometricShapePresetId,
                dropX,
                dropY
              );
            }
          }}
          style={{
            ...getBackgroundStyle(),
            minWidth: canvasMode === 'a4' ? '780px' : `${boardWidth}px`,
            minHeight: `${boardHeight}px`,
          }}
          className={`relative transition-colors overflow-hidden shadow-sm border mx-auto ${
            background === 'blackboard' || background === 'greenboard'
              ? 'border-slate-700 text-slate-100'
              : background === 'sepia'
              ? 'border-amber-300 text-slate-900'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          } ${
            canvasMode === 'a4' ? 'w-[780px] rounded-xl' : 'w-full h-full rounded-xl'
          }`}
        >
          {/* =====================================================================
              ULTRA-CLEAN STICKY TOP-LEFT BAR (Undo/Redo, Pages, Fullscreen, Scroll/Expand, PDF, Number, Shapes)
          ===================================================================== */}
          <div className="sticky top-2.5 left-2.5 mx-2.5 mt-2 flex flex-wrap items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-sm z-30 text-xs w-fit">
            <button
              type="button"
              onClick={handleUndo}
              disabled={pageStrokes.length === 0}
              aria-label="بازگشت به عقب (Undo)"
              title="بازگشت به عقب (Undo)"
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 text-slate-700 dark:text-slate-300"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              aria-label="انجام مجدد (Redo)"
              title="انجام مجدد (Redo)"
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 text-slate-700 dark:text-slate-300"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

            {/* Multi-Page Switcher */}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              aria-label="صفحه قبلی تخته"
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] font-bold px-0.5 tabular-nums">
              صفحه {fmt(currentPage)}/{fmt(totalPages)}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              aria-label="صفحه بعدی تخته"
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setTotalPages((t) => t + 1);
                setCurrentPage(totalPages + 1);
              }}
              aria-label="افزودن صفحه جدید"
              title="افزودن صفحه جدید"
              className="p-1 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

            {/* Fullscreen Whiteboard Toggle (تمام‌صفحه کردن تخته وایت‌برد) */}
            <button
              type="button"
              data-testid="toggle-board-fullscreen-btn"
              onClick={handleToggleBoardFullscreen}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors ${
                isBoardFullscreen
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20'
              }`}
              title="تمام‌صفحه کردن تخته وایت‌برد (Esc برای خروج)"
            >
              {isBoardFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
              <span>{isBoardFullscreen ? 'خروج از تمام‌صفحه' : 'تمام‌صفحه تخته'}</span>
            </button>

            {/* Expand & Scroll Whiteboard Controls (اسکرول و گسترش دادن تخته وایت‌برد) */}
            <button
              type="button"
              data-testid="expand-board-height-btn"
              onClick={() => {
                setBoardHeight((h) => h + 500);
                setLastSnapNotice('ارتفاع تخته وایت‌برد ۵۰۰ پیکسل گسترش یافت (اسکرول به پایین)');
                window.setTimeout(() => {
                  scrollViewportRef.current?.scrollBy({ top: 320, behavior: 'smooth' });
                }, 60);
                window.setTimeout(() => setLastSnapNotice(null), 2200);
              }}
              className="px-2 py-1 rounded-lg text-[11px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 flex items-center gap-1 transition-colors"
              title="افزایش طول تخته وایت‌برد برای ادامه نوشتن در پایین صفحه"
            >
              <ArrowDown className="w-3 h-3" />
              <span>+ گسترش تخته</span>
            </button>

            <button
              type="button"
              data-testid="expand-board-width-btn"
              onClick={() => {
                setBoardWidth((w) => w + 400);
                setLastSnapNotice('عرض تخته وایت‌برد ۴۰۰ پیکسل گسترش یافت');
                window.setTimeout(() => setLastSnapNotice(null), 2200);
              }}
              className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
              title="افزایش عرض افقی تخته وایت‌برد"
            >
              + عرض تخته
            </button>

            <button
              type="button"
              data-testid="scroll-board-down-btn"
              onClick={() =>
                scrollViewportRef.current?.scrollBy({ top: 260, behavior: 'smooth' })
              }
              title="اسکرول تخته به پایین"
              aria-label="اسکرول تخته به پایین"
              className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              data-testid="scroll-board-up-btn"
              onClick={() =>
                scrollViewportRef.current?.scrollBy({ top: -260, behavior: 'smooth' })
              }
              title="اسکرول تخته به بالا"
              aria-label="اسکرول تخته به بالا"
              className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

            {/* Direct Import PDF onto Whiteboard Button (وارد کردن PDF تمام‌صفحه روی وایت‌برد) */}
            <button
              type="button"
              data-testid="import-pdf-to-board-btn"
              onClick={() => pdfFileInputRef.current?.click()}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30 hover:bg-rose-600 hover:text-white transition-colors"
              title="انتخاب فایل PDF یا تصویر برای قرار دادن تمام‌صفحه روی وایت‌برد"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>وارد کردن PDF روی تخته</span>
            </button>

            {!boardPdfSheet && (
              <button
                type="button"
                data-testid="sample-pdf-to-board-btn"
                onClick={() => handlePlaceSamplePdfOnBoard(true)}
                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-600 text-white hover:bg-rose-500 transition-colors flex items-center gap-1"
                title="قرار دادن برگه PDF نمونه به‌صورت تمام‌صفحه روی وایت‌برد"
              >
                <Maximize2 className="w-3 h-3" />
                <span>+ PDF تمام‌صفحه روی وایت‌برد</span>
              </button>
            )}

            {/* Small Pinnable Number Box Trigger (منوی کوچک درج عدد) */}
            <button
              type="button"
              data-testid="toggle-number-mini-menu-btn"
              onClick={() => setShowNumberMiniMenu((v) => !v)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors ${
                showNumberMiniMenu
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/30 hover:bg-sky-500/20'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>درج عدد</span>
            </button>

            {/* Ready Shapes, Fraction Bar & Math Symbols Trigger */}
            <button
              type="button"
              data-testid="toggle-shapes-palette-btn"
              onClick={() => setShowShapesPalette((v) => !v)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors ${
                showShapesPalette
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20'
              }`}
            >
              <Shapes className="w-3.5 h-3.5" />
              <span>اشکال آماده و علائم ریاضی</span>
            </button>

            {/* Offline Gboard-Style Handwriting Pad Trigger (پد دست‌نویسی آفلاین گوگل) */}
            <button
              type="button"
              data-testid="toggle-handwriting-pad-btn"
              onClick={() => {
                setHandwritingPadTab('handwriting');
                setShowHandwritingPad((v) => !v);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors ${
                showHandwritingPad
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'bg-sky-500/15 text-sky-800 dark:text-sky-300 border border-sky-500/35 hover:bg-sky-500/25'
              }`}
              title="تشخیص آفلاین دست‌نویس اعداد و حروف فارسی و انگلیسی به سبک کیبورد گوگل"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>✍️ دست‌نویس آفلاین (گوگل)</span>
            </button>

            {/* Desktop Overlay Mode Toggle (حالت نوشتن روی دسکتاپ) */}
            {onToggleDesktopOverlayMode && (
              <button
                type="button"
                data-testid="toggle-desktop-overlay-btn"
                onClick={onToggleDesktopOverlayMode}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors ${
                  desktopOverlayMode
                    ? 'bg-violet-600 text-white shadow-2xs'
                    : 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/30 hover:bg-violet-500/20'
                }`}
                title="حالت نوشتن شفاف روی دسکتاپ (Desktop Overlay Mode)"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>{desktopOverlayMode ? 'خروج از نمای دسکتاپ' : 'نوشتن روی دسکتاپ'}</span>
              </button>
            )}

            {/* Collapsible "More Board Tools" Dropdown (خط‌کش، جدول، نوت، لایه‌ها، جزوه PDF، واترمارک) */}
            <div className="relative">
              <button
                type="button"
                data-testid="more-board-tools-btn"
                onClick={() => setShowMoreToolsMenu((v) => !v)}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                  showMoreToolsMenu || showRulerProtractor || showDynamicTable || showLayersPopover
                    ? 'bg-slate-800 text-white border-slate-700 dark:bg-slate-200 dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                ابزارهای کمکی ▾
              </button>

              {showMoreToolsMenu && (
                <div className="absolute left-0 mt-1.5 w-56 p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-40 space-y-1 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRulerProtractor((v) => !v);
                      setShowMoreToolsMenu(false);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-right"
                  >
                    <Ruler className="w-3.5 h-3.5 text-emerald-500" />
                    <span>خط‌کش و نقاله</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDynamicTable((v) => !v);
                      setShowMoreToolsMenu(false);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-right"
                  >
                    <Table className="w-3.5 h-3.5 text-sky-500" />
                    <span>جدول‌ساز روی تخته</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleAddConnectedStickyPair();
                      setShowMoreToolsMenu(false);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-right"
                  >
                    <StickyNote className="w-3.5 h-3.5 text-amber-500" />
                    <span>یادداشت چسبان</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLayersPopover((v) => !v);
                      setShowMoreToolsMenu(false);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-right"
                  >
                    <Layers className="w-3.5 h-3.5 text-indigo-500" />
                    <span>مدیریت لایه‌های تخته</span>
                  </button>
                  <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                  <button
                    type="button"
                    data-testid="open-class-notes-export-btn"
                    onClick={() => {
                      setShowClassNotesModal(true);
                      setShowMoreToolsMenu(false);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-right font-semibold text-sky-700 dark:text-sky-300"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-500" />
                    <span>خروجی جزوه PDF استاندارد جلسه</span>
                  </button>
                  {onToggleFloatingWatermark && (
                    <button
                      type="button"
                      data-testid="toggle-watermark-menu-btn"
                      onClick={() => {
                        onToggleFloatingWatermark();
                        setShowMoreToolsMenu(false);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-right"
                    >
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>واترمارک امنیتی شناور</span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600">
                        {floatingWatermark ? 'فعال ✓' : 'غیرفعال'}
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* =====================================================================
              SMALL PINNABLE NUMBER INSERTION MENU (منوی کوچک پین‌شونده درج عدد روی تخته)
          ===================================================================== */}
          {showNumberMiniMenu && (
            <div
              data-testid="pinnable-number-mini-menu"
              className="sticky top-14 left-3 ml-3 mt-2 w-72 p-2.5 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-2 border-sky-500/60 shadow-xl z-30 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-100 text-[11px]">
                  درج عدد روی تخته
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setNumberMiniMenuPinned((p) => !p)}
                    title={numberMiniMenuPinned ? 'پین شده (باز می‌ماند)' : 'پین کردن این منو'}
                    aria-label="پین کردن منوی درج عدد"
                    className={`p-1 rounded transition-colors ${
                      numberMiniMenuPinned
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Pin className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNumberMiniMenu(false)}
                    aria-label="بستن منوی درج عدد"
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  data-testid="pinnable-number-input"
                  value={customPersianInput}
                  onChange={(e) => setCustomPersianInput(toPersianDigits(e.target.value, true))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addPersianNumberToBoard(customPersianInput);
                    }
                  }}
                  placeholder="عدد را بنویسید (مثلاً ۱۲۵)"
                  aria-label="کادر نوشتن عدد برای درج روی تخته"
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-xs text-center"
                />
                <button
                  type="button"
                  data-testid="pinnable-number-submit-btn"
                  onClick={() => addPersianNumberToBoard(customPersianInput)}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] whitespace-nowrap transition-colors"
                >
                  افزودن به تخته
                </button>
              </div>
            </div>
          )}

          {/* =====================================================================
              READY SHAPES, FRACTION LINE, FREQUENT MATH SYMBOLS & SHORTCUT BUILDER POPOVER
          ===================================================================== */}
          {showShapesPalette && (
            <div
              data-testid="ready-shapes-and-math-popover"
              className="sticky top-14 left-3 ml-3 mt-2 w-[380px] sm:w-[440px] max-h-[78vh] overflow-y-auto p-3.5 rounded-2xl bg-white/98 dark:bg-slate-900/98 backdrop-blur-md border-2 border-emerald-500/60 shadow-2xl z-40 space-y-3 text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="font-extrabold text-slate-900 dark:text-slate-100">
                  اشکال آماده، خط کسری، علائم ریاضی و شورتکات‌ساز
                </span>
                <button
                  type="button"
                  onClick={() => setShowShapesPalette(false)}
                  aria-label="بستن پنل اشکال آماده"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 1. Geometric Shapes & Fraction Line */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  ۱) اشکال هندسی، خط کسری و رادیکال آماده:
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                  {GEOMETRIC_SHAPE_PRESETS.map((shape) => {
                    const assignedSc = customShortcuts.find(
                      (s) => s.targetKind === 'geo-shape' && s.targetValue === shape.id
                    );
                    return (
                      <button
                        key={shape.id}
                        type="button"
                        data-testid={`ready-shape-btn-${shape.id}`}
                        onClick={() => addGeometricShapeToBoard(shape.id)}
                        aria-label={`افزودن شکل ${shape.labelFa} به تخته`}
                        className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 hover:bg-emerald-500/15 hover:border-emerald-500 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-1 transition-all relative"
                      >
                        {assignedSc && (
                          <span
                            dir="ltr"
                            className="absolute top-0.5 left-0.5 px-1 py-0.2 rounded bg-emerald-600 text-white font-mono text-[8px] font-bold"
                          >
                            {assignedSc.keyCombo}
                          </span>
                        )}
                        <svg viewBox="0 0 160 160" className="w-7 h-7 overflow-visible">
                          {generateGeometricShapeStrokes(shape.id, 80, 80, 1, 0).map(
                            (pts, idx) => (
                              <path
                                key={idx}
                                d={pts
                                  .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                                  .join(' ')}
                                fill="none"
                                stroke="#0f172a"
                                className="dark:stroke-slate-100"
                                strokeWidth="10"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            )
                          )}
                        </svg>
                        <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight line-clamp-1">
                          {shape.labelFa}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Frequently Used Math Symbols (علامت‌های پرکاربرد ریاضی) */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-bold text-sky-700 dark:text-sky-300">
                  ۲) علامت‌های پرکاربرد ریاضی (کلیک = درج فوری روی تخته):
                </div>
                <div className="grid grid-cols-6 sm:grid-cols-7 gap-1.5">
                  {FREQUENT_MATH_SYMBOLS.map((sym, symIdx) => {
                    const assignedSc = customShortcuts.find(
                      (s) => s.targetKind === 'math-symbol' && s.targetValue === sym.symbol
                    );
                    return (
                      <button
                        key={sym.symbol}
                        type="button"
                        data-testid={`math-symbol-btn-${symIdx}`}
                        onClick={() => addMathSymbolToBoard(sym.symbol, sym.labelFa)}
                        title={sym.labelFa}
                        className="p-1.5 rounded-xl bg-sky-50/70 dark:bg-slate-800 hover:bg-sky-600 hover:text-white border border-sky-200 dark:border-slate-700 flex flex-col items-center justify-center transition-colors relative"
                      >
                        {assignedSc && (
                          <span
                            dir="ltr"
                            className="absolute -top-1 left-0.5 px-1 rounded bg-sky-600 text-white font-mono text-[7px] font-bold"
                          >
                            {assignedSc.keyCombo}
                          </span>
                        )}
                        <span className="text-sm font-black font-mono leading-none">
                          {sym.symbol}
                        </span>
                        <span className="text-[8px] opacity-75 mt-1 truncate max-w-full">
                          {sym.labelFa}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Custom Keyboard Shortcut Builder for Ready Shapes, Math Symbols & Numbers */}
              <div
                data-testid="custom-shortcut-builder"
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                    <Keyboard className="w-3.5 h-3.5 text-amber-500" />
                    <span>ساخت شورتکات برای اشکال آماده، علائم و اعداد:</span>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <select
                    value={newShortcutTargetType}
                    onChange={(e) => {
                      const t = e.target.value as
                        | 'geo-shape'
                        | 'math-symbol'
                        | 'persian-number';
                      setNewShortcutTargetType(t);
                      if (t === 'geo-shape') setNewShortcutPayload('fraction-line');
                      else if (t === 'math-symbol') setNewShortcutPayload('×');
                      else setNewShortcutPayload('۱۲۵');
                    }}
                    aria-label="نوع مورد برای ساخت شورتکات"
                    className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-[11px] font-semibold"
                  >
                    <option value="geo-shape">شکل آماده / خط کسری</option>
                    <option value="math-symbol">علامت ریاضی</option>
                    <option value="persian-number">عدد دلخواه</option>
                  </select>

                  {newShortcutTargetType === 'geo-shape' ? (
                    <select
                      value={newShortcutPayload}
                      onChange={(e) => setNewShortcutPayload(e.target.value)}
                      aria-label="انتخاب شکل آماده برای شورتکات"
                      className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-[11px] font-semibold"
                    >
                      {GEOMETRIC_SHAPE_PRESETS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.labelFa}
                        </option>
                      ))}
                    </select>
                  ) : newShortcutTargetType === 'math-symbol' ? (
                    <select
                      value={newShortcutPayload}
                      onChange={(e) => setNewShortcutPayload(e.target.value)}
                      aria-label="انتخاب علامت ریاضی برای شورتکات"
                      className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-[11px] font-semibold"
                    >
                      {FREQUENT_MATH_SYMBOLS.map((m) => (
                        <option key={m.symbol} value={m.symbol}>
                          {m.symbol} ({m.labelFa})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={newShortcutPayload}
                      onChange={(e) =>
                        setNewShortcutPayload(toPersianDigits(e.target.value, true))
                      }
                      placeholder="عدد (مثلاً ۱۰۰)"
                      aria-label="عدد برای شورتکات"
                      className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-[11px] font-bold text-center"
                    />
                  )}

                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      dir="ltr"
                      data-testid="custom-shortcut-key-input"
                      value={capturingShortcutKey ? 'کلید را بزنید...' : newShortcutKeyCombo}
                      onFocus={() => setCapturingShortcutKey(true)}
                      onBlur={() => setCapturingShortcutKey(false)}
                      onKeyDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const combo = formatKeyboardEventToCombo({
                          key: e.key,
                          code: e.code,
                          altKey: e.altKey,
                          ctrlKey: e.ctrlKey || e.metaKey,
                          shiftKey: e.shiftKey,
                        });
                        if (combo) {
                          setNewShortcutKeyCombo(combo);
                          setCapturingShortcutKey(false);
                        }
                      }}
                      readOnly
                      aria-label="کلید میانبر اختصاصی"
                      className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-amber-400 font-mono text-[11px] font-bold text-center cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  data-testid="save-custom-shortcut-btn"
                  onClick={handleAddOrUpdateCustomShortcut}
                  className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[11px] transition-colors"
                >
                  + ثبت شورتکات «{newShortcutKeyCombo}»
                </button>

                {/* Active Custom Shortcuts Chips */}
                <div className="flex flex-wrap gap-1 pt-1 max-h-24 overflow-y-auto">
                  {customShortcuts.map((sc) => (
                    <div
                      key={sc.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px]"
                    >
                      <kbd
                        dir="ltr"
                        className="font-mono font-bold text-sky-600 dark:text-sky-400"
                      >
                        {sc.keyCombo}
                      </kbd>
                      <span>←</span>
                      <span className="font-semibold">{sc.labelFa}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setCustomShortcuts((prev) =>
                            removeCustomBoardShortcut(prev, sc.id)
                          )
                        }
                        className="text-slate-400 hover:text-rose-500 font-bold mr-0.5"
                        title="حذف این شورتکات"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              FLOATING PEN SIZE & COLOR BAR AT TOP OF BOARD (مشابه پاک‌کن برای تمام قلم‌ها!)
          ===================================================================== */}
          {isPenDrawingTool && (
            <div
              data-testid="floating-pen-size-bar"
              className="sticky top-14 left-3 ml-3 mt-1.5 w-fit flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-sky-500/50 shadow-md z-30 text-xs"
            >
              {/* Live Real-Size & Real-Color Nib Preview Dot */}
              <div
                title="نشانگر زنده اندازه و رنگ واقعی نوک قلم"
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0"
              >
                <span
                  style={{
                    width: Math.min(24, Math.max(4, customCursorSpec.diameterPx)),
                    height: Math.min(24, Math.max(4, customCursorSpec.diameterPx)),
                    backgroundColor: customCursorSpec.color,
                    opacity: customCursorSpec.fillOpacity,
                    borderRadius: customCursorSpec.shape === 'square' ? '3px' : '9999px',
                  }}
                  className="block transition-all"
                />
              </div>

              <PenTool className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span className="font-bold text-slate-700 dark:text-slate-200">
                اندازه {customCursorSpec.labelFa} ({fmt(strokeWidth)}px):
              </span>
              <input
                type="range"
                data-testid="floating-pen-size-slider"
                min={2}
                max={24}
                value={strokeWidth}
                onChange={(e) => onChangeStrokeWidth?.(Number(e.target.value))}
                aria-label="تنظیم اندازه قلم بالای تخته"
                className="w-24 accent-sky-600"
              />
              {[
                { sz: 2, label: 'نازک (۲)' },
                { sz: 4, label: 'متوسط (۴)' },
                { sz: 8, label: 'ضخیم (۸)' },
                { sz: 14, label: 'درشت (۱۴)' },
              ].map((p) => (
                <button
                  key={p.sz}
                  type="button"
                  onClick={() => onChangeStrokeWidth?.(p.sz)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                    strokeWidth === p.sz
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-sky-500/15'
                  }`}
                >
                  {p.label}
                </button>
              ))}

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

              {/* Quick Color Swatches right on the top pen bar */}
              <div className="flex items-center gap-1">
                {['#0f172a', '#0284c7', '#e11d48', '#16a34a', '#d97706', '#9333ea'].map(
                  (c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => onSelectColor(c)}
                      style={{ backgroundColor: c }}
                      aria-label={`رنگ سریع قلم ${c}`}
                      className={`w-4 h-4 rounded-full border transition-transform ${
                        strokeColor.toLowerCase() === c.toLowerCase()
                          ? 'scale-125 border-slate-900 dark:border-white ring-2 ring-sky-400/60'
                          : 'border-white/60 dark:border-slate-700'
                      }`}
                    />
                  )
                )}
              </div>
            </div>
          )}

          {/* =====================================================================
              FLOATING ERASER SIZE BAR WHEN ERASER IS ACTIVE
          ===================================================================== */}
          {isEraserActive && onChangeEraserSize && (
            <div
              data-testid="floating-eraser-size-bar"
              className="sticky top-14 left-3 ml-3 mt-1.5 w-fit flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-rose-500/50 shadow-md z-30 text-xs"
            >
              <Eraser className="w-3.5 h-3.5 text-rose-500" />
              <span className="font-bold text-slate-700 dark:text-slate-200">
                اندازه پاک‌کن ({fmt(eraserSize)}px):
              </span>
              <input
                type="range"
                min={6}
                max={80}
                value={eraserSize}
                onChange={(e) => onChangeEraserSize(Number(e.target.value))}
                aria-label="تنظیم اندازه پاک‌کن روی تخته"
                className="w-24 accent-rose-600"
              />
              {[
                { sz: 12, label: 'ریز' },
                { sz: 24, label: 'متوسط' },
                { sz: 48, label: 'درشت' },
              ].map((p) => (
                <button
                  key={p.sz}
                  type="button"
                  onClick={() => onChangeEraserSize(p.sz)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    eraserSize === p.sz
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {/* =====================================================================
              LASSO SELECT & MOVE GUIDANCE BANNER (راهنمای کمند انتخاب و جابه‌جایی)
          ===================================================================== */}
          {activeTool === 'lasso' && (
            <div
              data-testid="lasso-tool-helper-bar"
              className="sticky top-14 left-3 ml-3 mt-1.5 w-fit flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50/95 dark:bg-slate-900/95 border-2 border-amber-500/70 shadow-md z-30 text-xs text-slate-800 dark:text-slate-100"
            >
              <Move className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="font-bold">
                کمند انتخاب و جابه‌جایی (V): ۱) دور دستخط‌ها خط بکشید تا کادر انتخاب ظاهر شود و با ماوس کل فرمول/نوشته را جابه‌جا، کپی یا رنگ‌آمیزی کنید · ۲) یا روی هر شکل/ابزارک بکشید تا جابه‌جا شود.
              </span>
            </div>
          )}

          {/* =====================================================================
              LASSO SELECTED HANDWRITTEN STROKES BOUNDING BOX & ACTION TOOLBAR
          ===================================================================== */}
          {selectedStrokesBox && (
            <div
              data-testid="lasso-selection-box"
              style={{
                left: selectedStrokesBox.minX - 10,
                top: selectedStrokesBox.minY - 10,
                width: selectedStrokesBox.width + 20,
                height: selectedStrokesBox.height + 20,
              }}
              className="absolute border-2 border-dashed border-sky-500 bg-sky-500/8 rounded-xl z-30 pointer-events-none"
            >
              <div
                data-testid="lasso-selection-toolbar"
                className="absolute -top-9 right-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 text-white shadow-lg pointer-events-auto whitespace-nowrap text-[10px] font-bold"
              >
                <span className="text-sky-300 ml-1">
                  {fmt(selectedStrokeIds.length)} خط انتخابی (بکشید = جابه‌جایی)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const selSet = new Set(selectedStrokeIds);
                    setStrokes((prev) =>
                      prev.map((s) => (selSet.has(s.id) ? { ...s, color: strokeColor } : s))
                    );
                  }}
                  className="px-1.5 py-0.5 rounded bg-sky-600 hover:bg-sky-500"
                >
                  تغییر رنگ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const selSet = new Set(selectedStrokeIds);
                    const copies: StrokePath[] = [];
                    strokes.forEach((s) => {
                      if (selSet.has(s.id)) {
                        copies.push({
                          ...s,
                          id: `copy-stroke-${Date.now()}-${Math.random()}`,
                          points: translateStrokePoints(s.points, 35, 35),
                        });
                      }
                    });
                    setStrokes((prev) => [...prev, ...copies]);
                    setSelectedStrokeIds(copies.map((c) => c.id));
                  }}
                  className="px-1.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500"
                >
                  کپی
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const selSet = new Set(selectedStrokeIds);
                    setStrokes((prev) => prev.filter((s) => !selSet.has(s.id)));
                    setSelectedStrokeIds([]);
                  }}
                  className="px-1.5 py-0.5 rounded bg-rose-600 hover:bg-rose-500"
                >
                  حذف
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStrokeIds([])}
                  className="px-1.5 py-0.5 rounded bg-slate-700 hover:bg-slate-600"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Shape-Snap Multi-Polygon Bar + Adjacent Offline Handwriting Button when activeTool === 'shape-snap' */}
          {activeTool === 'shape-snap' && (
            <div
              data-testid="shape-snap-and-handwriting-bar"
              className="sticky top-26 left-3 ml-3 mt-1.5 w-fit flex flex-wrap items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-sky-500/50 shadow-md z-30 text-[11px]"
            >
              <span className="font-bold text-sky-600 dark:text-sky-400 ml-1">حالت رسم شکل:</span>
              {(
                [
                  { id: 'auto', label: 'تشخیص خودکار' },
                  { id: 'line', label: 'خط صاف' },
                  { id: 'freehand', label: 'رسم آزاد' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setForcedShapeKind(m.id)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    forcedShapeKind === m.id
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {m.label}
                </button>
              ))}

              {/* Right next to Shape Recognition: Offline Gboard Handwriting Pad Toggle */}
              <button
                type="button"
                data-testid="open-handwriting-next-to-shape-btn"
                onClick={() => {
                  setHandwritingPadTab('handwriting');
                  setShowHandwritingPad((v) => !v);
                }}
                className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center gap-1 shadow-xs"
              >
                <Languages className="w-3.5 h-3.5" />
                <span>✍️ دست‌نویسی آفلاین (کیبورد گوگل)</span>
              </button>
            </div>
          )}

          {/* Offline Gboard-Style Handwriting & Flowchart Pad Floating Panel */}
          {showHandwritingPad && (
            <div className="sticky top-14 left-3 ml-3 mt-2 z-40 w-fit">
              <OfflineHandwritingPad
                isOpen={showHandwritingPad}
                onClose={() => setShowHandwritingPad(false)}
                strokeColor={strokeColor}
                usePersianNumerals={usePersianNumerals}
                initialTab={handwritingPadTab}
                beautifierActive={handwritingBeautifierActive}
                onToggleBeautifier={() => setHandwritingBeautifierActive((b) => !b)}
                onStampRecognizedText={(txt, kind) => {
                  if (kind === 'math-symbol') {
                    addMathSymbolToBoard(txt, txt);
                  } else {
                    addPersianNumberToBoard(txt);
                  }
                  setLastSnapNotice(`دست‌نویس «${txt}» با دقت بالا تشخیص داده شد و روی تخته قرار گرفت`);
                  window.setTimeout(() => setLastSnapNotice(null), 2400);
                }}
                onStampBeautifiedStrokes={(hwStrokes) => {
                  const newPaths: StrokePath[] = hwStrokes.map((st, idx) => ({
                    id: `hw-stroke-${Date.now()}-${idx}`,
                    pageIndex: currentPage,
                    layerId: activeLayerId,
                    tool: 'fountain',
                    color: strokeColor,
                    width: strokeWidth,
                    points: st.map((p) => ({ x: p.x + 220, y: p.y + 180 })),
                    createdAt: Date.now(),
                  }));
                  setStrokes((prev) => [...prev, ...newPaths]);
                  setLastSnapNotice('دستخط صاف‌شده به بوم تخته منتقل شد');
                  window.setTimeout(() => setLastSnapNotice(null), 2200);
                }}
                onStampFlowchart={(title, steps) => {
                  const baseNodes: StickyNode[] = steps.map((stepLabel, idx) => ({
                    id: `flow-${Date.now()}-${idx}`,
                    title: `مرحله ${fmt(idx + 1)}`,
                    text: stepLabel,
                    colorClass:
                      idx % 2 === 0
                        ? 'bg-sky-100 border-sky-400 text-slate-900'
                        : 'bg-emerald-100 border-emerald-400 text-slate-900',
                    x: 160 + idx * 195,
                    y: 210,
                    connectedToId: undefined,
                  }));
                  for (let i = 0; i < baseNodes.length - 1; i++) {
                    baseNodes[i].connectedToId = baseNodes[i + 1].id;
                  }
                  setStickyNodes((prev) => [...prev, ...baseNodes]);
                  setShowHandwritingPad(false);
                  setLastSnapNotice(`${title} روی تخته سفید ترسیم شد`);
                  window.setTimeout(() => setLastSnapNotice(null), 2400);
                }}
              />
            </div>
          )}

          {/* Desktop Overlay Mode Active Glass Backdrop & Control Banner */}
          {desktopOverlayMode && (
            <div
              data-testid="desktop-overlay-active-banner"
              className="sticky top-14 right-3 mr-3 mt-2 w-fit flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-violet-950/90 text-white border border-violet-400/50 shadow-xl z-30 text-xs"
            >
              <Monitor className="w-4 h-4 text-violet-300" />
              <span className="font-bold">
                حالت نوشتن شفاف روی دسکتاپ فعال است (مستقیم با قلم روی صفحه خط بکشید)
              </span>
              {onToggleDesktopOverlayMode && (
                <button
                  type="button"
                  onClick={onToggleDesktopOverlayMode}
                  className="px-2 py-0.5 rounded bg-violet-600 hover:bg-violet-500 text-[10px] font-bold"
                >
                  بازگشت به تخته عادی
                </button>
              )}
            </div>
          )}

          {/* Class Notes PDF Handout Preview & Download Modal */}
          {showClassNotesModal && (
            <div
              data-testid="class-notes-export-modal"
              className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
              onClick={() => setShowClassNotesModal(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-sky-600" />
                    <span>خروجی خودکار «جزوه PDF استاندارد جلسه»</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowClassNotesModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="space-y-1 block">
                    <span className="text-[11px] text-slate-500 font-semibold">نام استاد / دبیر:</span>
                    <input
                      type="text"
                      value={teacherNameInput}
                      onChange={(e) => setTeacherNameInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold"
                    />
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-[11px] text-slate-500 font-semibold">موضوع جلسه تدریس:</span>
                    <input
                      type="text"
                      value={sessionTopicInput}
                      onChange={(e) => setSessionTopicInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold"
                    />
                  </label>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="font-bold text-sky-700 dark:text-sky-300">
                    خلاصه محتوای آماده درج در جزوه A4:
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300">
                    • تعداد صفحات تخته: {fmt(totalPages)} صفحه · تعداد خطوط و اشکال: {fmt(strokes.length)}
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300">
                    • تعداد ابزارک‌ها و فرمول‌های روی تخته: {fmt(stampedWidgets.length)} مورد
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300">
                    • کد امنیتی واترمارک: {watermarkCode}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowClassNotesModal(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                  >
                    بستن
                  </button>
                  <button
                    type="button"
                    data-testid="download-class-notes-html-btn"
                    onClick={() => {
                      const html = generatePrintableClassNotesHtml({
                        teacherName: teacherNameInput,
                        sessionTopic: sessionTopicInput,
                        watermarkCode,
                        presetLabel: 'جزوه استاندارد A4 جلسه',
                        stampedWidgets: stampedWidgets.map((w) => ({
                          title: w.title,
                          summary: w.summary || w.persianText || '',
                        })),
                        calloutStamps: stickyNodes.map((n) => `${n.title}: ${n.text}`),
                      });
                      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `daneshboard-class-notes-${Date.now()}.html`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      setShowClassNotesModal(false);
                      setLastSnapNotice('فایل جزوه استاندارد جلسه با موفقیت دانلود شد');
                      window.setTimeout(() => setLastSnapNotice(null), 2400);
                    }}
                    className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>دانلود فایل جزوه استاندارد (A4)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Toast Notice */}
          {lastSnapNotice && (
            <div className="sticky top-14 left-1/2 -translate-x-1/2 w-fit mx-auto px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-md z-30">
              ✓ {lastSnapNotice}
            </div>
          )}

          {/* =====================================================================
              PDF / IMAGE DROPPED DIRECTLY ON WHITEBOARD (تخته سفید با قابلیت تمام‌صفحه کردن PDF روی وایت‌برد)
          ===================================================================== */}
          {boardPdfSheet && (
            <div
              data-testid="board-dropped-pdf-sheet"
              style={
                boardPdfSheet.isFullscreenOnBoard
                  ? {
                      left: 8,
                      top: 52,
                      width: 'calc(100% - 16px)',
                      height: 'calc(100% - 60px)',
                    }
                  : {
                      left: boardPdfSheet.x,
                      top: boardPdfSheet.y,
                      width: boardPdfSheet.width,
                      height: boardPdfSheet.height,
                    }
              }
              className={`absolute rounded-xl bg-white dark:bg-slate-900 border-2 border-rose-500/70 shadow-xl overflow-hidden flex flex-col transition-all ${
                boardPdfSheet.interactiveScrollMode ? 'z-30' : 'z-10 pointer-events-none'
              }`}
            >
              {/* PDF Sheet Header Bar (Always clickable at z-30 so user can toggle fullscreen, move, flip pages, or close) */}
              <div
                onPointerDown={(e) => {
                  e.stopPropagation();
                  if (!boardPdfSheet.isFullscreenOnBoard) {
                    setDraggingPdfSheet(true);
                  }
                }}
                className="px-3 py-1.5 bg-rose-600 text-white text-[11px] font-bold flex items-center justify-between cursor-move pointer-events-auto select-none shrink-0"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{boardPdfSheet.name}</span>
                  {boardPdfSheet.isFullscreenOnBoard && (
                    <span className="px-1.5 py-0.5 rounded bg-white/20 text-[9px]">
                      تمام‌صفحه روی وایت‌برد (آماده نوشتن با قلم)
                    </span>
                  )}
                </div>
                <div
                  className="flex items-center gap-1.5 shrink-0"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  {boardPdfSheet.kind === 'sample-sheet' && (
                    <button
                      type="button"
                      onClick={() =>
                        setBoardPdfSheet((prev) =>
                          prev
                            ? {
                                ...prev,
                                sampleQuestionIndex:
                                  (prev.sampleQuestionIndex + 1) % SAMPLE_PDF_SHEETS.length,
                                pageNumber:
                                  ((prev.sampleQuestionIndex + 1) % SAMPLE_PDF_SHEETS.length) + 1,
                              }
                            : null
                        )
                      }
                      className="px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-[10px]"
                    >
                      صفحه بعد ({fmt(boardPdfSheet.pageNumber)}/{fmt(boardPdfSheet.totalPages)})
                    </button>
                  )}
                  {boardPdfSheet.kind === 'pdf-blob' && (
                    <button
                      type="button"
                      onClick={() =>
                        setBoardPdfSheet((prev) =>
                          prev
                            ? { ...prev, interactiveScrollMode: !prev.interactiveScrollMode }
                            : null
                        )
                      }
                      className="px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-[10px]"
                    >
                      {boardPdfSheet.interactiveScrollMode
                        ? 'حالت: اسکرول PDF'
                        : 'حالت: نوشتن با قلم روی PDF'}
                    </button>
                  )}

                  {/* 1-Click Fullscreen PDF on Whiteboard Toggle */}
                  <button
                    type="button"
                    data-testid="toggle-pdf-fullscreen-on-board-btn"
                    onClick={() =>
                      setBoardPdfSheet((prev) =>
                        prev
                          ? { ...prev, isFullscreenOnBoard: !prev.isFullscreenOnBoard }
                          : null
                      )
                    }
                    className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 hover:bg-amber-300 font-extrabold text-[10px] flex items-center gap-1"
                    title="تمام‌صفحه کردن برگه PDF روی کل تخته وایت‌برد"
                  >
                    {boardPdfSheet.isFullscreenOnBoard ? (
                      <>
                        <Minimize2 className="w-3 h-3" />
                        <span>اندازه پنجره‌ای</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-3 h-3" />
                        <span>تمام‌صفحه روی وایت‌برد</span>
                      </>
                    )}
                  </button>

                  {!boardPdfSheet.isFullscreenOnBoard && (
                    <button
                      type="button"
                      onClick={() =>
                        setBoardPdfSheet((prev) =>
                          prev
                            ? {
                                ...prev,
                                width: Math.min(980, prev.width + 90),
                                height: Math.min(720, prev.height + 70),
                              }
                            : null
                        )
                      }
                      className="px-1.5 py-0.5 rounded bg-white/20 hover:bg-white/30 text-[10px]"
                      title="بزرگ‌تر کردن برگه PDF"
                    >
                      + بزرگ‌تر
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setBoardPdfSheet(null)}
                    aria-label="بستن برگه PDF روی تخته"
                    className="p-0.5 rounded hover:bg-rose-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* PDF Sheet Content Body */}
              <div className="flex-1 bg-white dark:bg-slate-900 p-5 overflow-hidden relative">
                {boardPdfSheet.kind === 'image-blob' && boardPdfSheet.url ? (
                  <img
                    src={boardPdfSheet.url}
                    alt={boardPdfSheet.name}
                    className="w-full h-full object-contain select-none"
                  />
                ) : boardPdfSheet.kind === 'pdf-blob' && boardPdfSheet.url ? (
                  <iframe
                    src={boardPdfSheet.url}
                    title={boardPdfSheet.name}
                    className="w-full h-full border-0"
                  />
                ) : (
                  <div className="space-y-4 text-slate-900 dark:text-slate-100 select-none">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                      <span className="text-base font-extrabold text-rose-600 dark:text-rose-400">
                        {SAMPLE_PDF_SHEETS[boardPdfSheet.sampleQuestionIndex]?.title}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        صفحه {fmt(boardPdfSheet.pageNumber)} از {fmt(boardPdfSheet.totalPages)}
                      </span>
                    </div>
                    <p className="text-base leading-loose font-semibold whitespace-pre-line">
                      {SAMPLE_PDF_SHEETS[boardPdfSheet.sampleQuestionIndex]?.body}
                    </p>
                    <div className="pt-8 border-t border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                      محل حل تشریحی و نوشتن مستقیم استاد با قلم روی برگه PDF تمام‌صفحه...
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Layer 1 (Locked Question Layer) */}
          {questionLayerVisible && clippedQuestionOnBoard && !boardPdfSheet && (
            <div className="absolute top-4 right-4 max-w-sm p-3 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 shadow-sm pointer-events-none select-none z-0">
              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400 mb-1">
                <span>لایه ۱: {currentPdfQ.title}</span>
                <Lock className="w-3 h-3" />
              </div>
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                {currentPdfQ.body}
              </p>
            </div>
          )}

          {/* Layer 3 (Revealable Detailed Answer Key Layer) */}
          {answerKeyLayerVisible && (
            <div className="absolute bottom-16 right-5 max-w-md p-3.5 rounded-xl bg-emerald-50/95 dark:bg-emerald-950/90 border border-emerald-500/40 shadow-sm pointer-events-none select-none z-0">
              <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 mb-1">
                لایه ۳ (پاسخ تشریحی آماده استاد):
              </div>
              <p className="text-xs text-emerald-900 dark:text-emerald-100 font-mono" dir="ltr">
                mg·sin(30°) = 5 × 9.8 × 0.5 = 24.5 N | N = mg·cos(30°) = 42.44 N
              </p>
            </div>
          )}

          {/* Sticky Notes Overlay */}
          {stickyNodes.length > 0 && (
            <>
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                {stickyNodes.map((n) => {
                  if (!n.connectedToId) return null;
                  const target = stickyNodes.find((t) => t.id === n.connectedToId);
                  if (!target) return null;
                  return (
                    <g key={`${n.id}-${target.id}`}>
                      <path
                        d={`M ${n.x + 80} ${n.y + 35} C ${(n.x + target.x) / 2 + 80} ${
                          n.y + 35
                        }, ${(n.x + target.x) / 2 + 80} ${target.y + 35}, ${target.x + 80} ${
                          target.y + 35
                        }`}
                        fill="none"
                        stroke="#0284c7"
                        strokeWidth="2.5"
                        strokeDasharray="4 3"
                      />
                      <circle cx={target.x + 80} cy={target.y + 35} r="4" fill="#0284c7" />
                    </g>
                  );
                })}
              </svg>
              {stickyNodes.map((node) => (
                <div
                  key={node.id}
                  style={{ left: node.x, top: node.y }}
                  onPointerDown={() => setDraggingNodeId(node.id)}
                  className={`absolute w-44 p-2.5 rounded-xl border shadow-md cursor-move select-none z-25 ${node.colorClass}`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold opacity-75 mb-0.5">
                    <span>{node.title}</span>
                    <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        setStickyNodes((prev) => prev.filter((item) => item.id !== node.id));
                      }}
                      className="hover:opacity-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-xs font-semibold leading-snug">{node.text}</p>
                </div>
              ))}
            </>
          )}

          {/* Dynamic Editable Table Widget on Board */}
          {showDynamicTable && (
            <div className="absolute top-28 left-8 bg-white/95 dark:bg-slate-900/95 border border-slate-300 dark:border-slate-700 rounded-xl shadow-lg p-3 z-25 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                <span>جدول روی تخته</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setTableData((prev) => [...prev, ['جدید', '—', '۰']])}
                    className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px]"
                  >
                    + سطر
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDynamicTable(false)}
                    className="text-slate-400 hover:text-rose-500"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <table className="border-collapse text-xs">
                <tbody>
                  {tableData.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className="border border-slate-200 dark:border-slate-700 p-1"
                        >
                          <input
                            type="text"
                            value={cell}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTableData((prev) =>
                                prev.map((r, ri) =>
                                  ri === rIdx ? r.map((c, ci) => (ci === cIdx ? val : c)) : r
                                )
                              );
                            }}
                            className={`w-20 px-1.5 py-0.5 rounded bg-transparent focus:outline-none focus:bg-sky-500/10 ${
                              rIdx === 0 ? 'font-bold text-sky-600 dark:text-sky-400' : ''
                            }`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Virtual Ruler & 180-Degree Protractor Overlay */}
          {showRulerProtractor && (
            <div
              style={{ transform: `rotate(${rulerAngle}deg)` }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] bg-sky-500/15 backdrop-blur-xs border-2 border-sky-500 rounded-xl shadow-lg z-25 flex flex-col justify-between p-2.5 select-none space-y-2"
            >
              <div
                dir="ltr"
                className="flex items-center justify-between px-2 py-1 rounded-lg bg-sky-500/10 border border-sky-500/30 text-[10px] font-mono font-bold text-sky-700 dark:text-sky-300"
              >
                {[0, 30, 60, 90, 120, 150, 180].map((deg) => (
                  <span key={deg} className="tabular-nums">
                    {fmt(deg)}°
                  </span>
                ))}
              </div>

              <div
                dir="ltr"
                data-testid="ruler-ltr-scale"
                className="flex flex-row justify-between items-start px-1.5 pt-1 border-t border-sky-500/40"
              >
                {Array.from({ length: 13 }).map((_, cm) => (
                  <div key={cm} className="flex flex-col items-center">
                    <div className="w-0.5 h-3.5 bg-sky-600 dark:bg-sky-400" />
                    <span className="text-[10px] font-mono font-bold text-sky-900 dark:text-sky-100 mt-0.5 tabular-nums">
                      {fmt(cm)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between px-1 text-xs">
                <span className="font-bold text-sky-700 dark:text-sky-300">
                  خط‌کش و نقاله ({fmt(rulerAngle)}°)
                </span>
                <div className="flex items-center gap-1" dir="ltr">
                  <button
                    type="button"
                    onClick={() => setRulerAngle((a) => a - 15)}
                    className="px-2 py-0.5 rounded bg-white/80 dark:bg-slate-900/80 text-[10px] font-mono font-bold"
                  >
                    -15°
                  </button>
                  <button
                    type="button"
                    onClick={() => setRulerAngle((a) => a + 15)}
                    className="px-2 py-0.5 rounded bg-white/80 dark:bg-slate-900/80 text-[10px] font-mono font-bold"
                  >
                    +15°
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRulerProtractor(false)}
                    aria-label="بستن خط‌کش و نقاله"
                    className="p-0.5 text-slate-500 hover:text-rose-500"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* On-Demand Layers Popover */}
          {showLayersPopover && (
            <div className="absolute top-14 left-44 p-3 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-xl z-30 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                <span>لایه‌های تخته</span>
                <button
                  type="button"
                  onClick={() => setShowLayersPopover(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-1">
                {layers.map((layer) => (
                  <div
                    key={layer.id}
                    onClick={() => !layer.locked && onSelectLayer(layer.id)}
                    className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-[11px] border cursor-pointer ${
                      activeLayerId === layer.id
                        ? 'bg-sky-500/10 border-sky-500/40 text-sky-700 dark:text-sky-300 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span>{layer.name}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleLayerVisible(layer.id);
                        }}
                        aria-label={`نمایش یا مخفی کردن ${layer.name}`}
                      >
                        {layer.visible ? (
                          <Eye className="w-3.5 h-3.5" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleLayerLock(layer.id);
                        }}
                        aria-label={`قفل کردن ${layer.name}`}
                      >
                        {layer.locked ? (
                          <Lock className="w-3 h-3 text-amber-500" />
                        ) : (
                          <Unlock className="w-3 h-3 opacity-50" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =====================================================================
              LAYER Z-10: Bare Frameless Vector Shapes & Numbers on Board
          ===================================================================== */}
          {stampedWidgets.map((w, idx) => {
            const pos = widgetCoords[w.id] ?? {
              x: w.x || 240 + (idx % 3) * 85,
              y: w.y || 95 + (idx % 4) * 75,
            };
            const sc = w.scale ?? 1;
            const rot = w.rotationDeg ?? 0;
            const isSelected = selectedWidgetId === w.id;

            return (
              <div
                key={w.id}
                style={{
                  left: pos.x,
                  top: pos.y,
                  transform: `scale(${sc}) rotate(${rot}deg)`,
                  transformOrigin: 'center center',
                }}
                data-testid={`stamped-widget-${idx}`}
                className={`absolute z-10 pointer-events-none select-none transition-shadow p-1 ${
                  isSelected
                    ? 'ring-2 ring-dashed ring-sky-500/80 rounded-xl bg-sky-500/5'
                    : ''
                }`}
              >
                <BareBoardShapeGraphic widget={w} usePersianNumerals={usePersianNumerals} />
              </div>
            );
          })}

          {/* =====================================================================
              COMPACT CORNER MENU FOR SELECTED SHAPE/WIDGET
          ===================================================================== */}
          {selectedWidget && (
            <div
              data-testid="selected-shape-inspector"
              className="fixed bottom-3 left-3 w-80 p-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-2 border-sky-500 shadow-2xl z-40 space-y-2.5 text-xs"
            >
              {/* Header: Shape Name + Move/Draw Toggle + Copy + Delete + Close */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                <span className="font-extrabold text-sky-600 dark:text-sky-400 truncate max-w-[140px]">
                  {selectedWidget.title}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setMoveSelectedWithMouse((m) => !m)}
                    title={
                      moveSelectedWithMouse
                        ? 'با کشیدن ماوس جابه‌جا می‌شود (کلیک برای حالت رسم روی شکل)'
                        : 'حالت رسم خط روی شکل فعال است'
                    }
                    className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                      moveSelectedWithMouse
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Move className="w-3 h-3" />
                    <span>{moveSelectedWithMouse ? 'جابه‌جایی' : 'رسم روی شکل'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!onUpdateStampedWidgets) return;
                      const copyId = `copy-${Date.now()}`;
                      onUpdateStampedWidgets((prev) => [
                        ...prev,
                        {
                          ...selectedWidget,
                          id: copyId,
                          x: (widgetCoords[selectedWidget.id]?.x ?? selectedWidget.x) + 35,
                          y: (widgetCoords[selectedWidget.id]?.y ?? selectedWidget.y) + 35,
                        },
                      ]);
                      setSelectedWidgetId(copyId);
                    }}
                    title="کپی از این شکل"
                    className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    data-testid="delete-selected-widget-btn"
                    onClick={() => {
                      onRemoveStampedWidget(selectedWidget.id);
                      setSelectedWidgetId(null);
                    }}
                    title="حذف این شکل از تخته"
                    aria-label={`حذف شکل ${selectedWidget.title}`}
                    className="p-1 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedWidgetId(null)}
                    aria-label="بستن منوی ویرایش شکل"
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Widget-Specific Quick Inline Controls */}
              {((selectedWidget.title.includes('کسر') && !selectedWidget.title.includes('محور')) ||
                selectedWidget.geoShapeId === 'fraction-line') && (
                <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                  <label className="block">
                    <span className="text-[10px] text-slate-500 block">صورت کسر:</span>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={selectedWidget.divDividend ?? 3}
                      onChange={(e) => {
                        const v = Math.max(0, Number(e.target.value));
                        const d = selectedWidget.divDivisor ?? 5;
                        updateWidgetProps(selectedWidget.id, {
                          divDividend: v,
                          summary: `${fmt(v)}/${fmt(d)}`,
                        });
                      }}
                      className="w-full px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-bold text-center"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] text-slate-500 block">مخرج کسر:</span>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={selectedWidget.divDivisor ?? 5}
                      onChange={(e) => {
                        const d = Math.max(1, Math.min(99, Number(e.target.value)));
                        const v = selectedWidget.divDividend ?? 3;
                        updateWidgetProps(selectedWidget.id, {
                          divDivisor: d,
                          summary: `${fmt(v)}/${fmt(d)}`,
                        });
                      }}
                      className="w-full px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-bold text-center"
                    />
                  </label>
                </div>
              )}

              {selectedWidget.title.includes('محور') && (
                <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                  <label className="block">
                    <span className="text-[10px] text-slate-500 block">شروع:</span>
                    <input
                      type="number"
                      value={selectedWidget.axisMin ?? 0}
                      onChange={(e) =>
                        updateWidgetProps(selectedWidget.id, { axisMin: Number(e.target.value) })
                      }
                      className="w-full px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-bold text-center"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] text-slate-500 block">پایان:</span>
                    <input
                      type="number"
                      value={selectedWidget.axisMax ?? 10}
                      onChange={(e) =>
                        updateWidgetProps(selectedWidget.id, { axisMax: Number(e.target.value) })
                      }
                      className="w-full px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-bold text-center"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] text-slate-500 block">تقسیم واحد:</span>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={selectedWidget.axisSubdivisions ?? 1}
                      onChange={(e) =>
                        updateWidgetProps(selectedWidget.id, {
                          axisSubdivisions: Math.max(1, Math.min(12, Number(e.target.value))),
                        })
                      }
                      className="w-full px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-bold text-center"
                    />
                  </label>
                </div>
              )}

              {selectedWidget.title.includes('ساعت') && (
                <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                  <label className="block">
                    <span className="text-[10px] text-slate-500 block">ساعت (۱ تا ۱۲):</span>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={selectedWidget.divDividend ?? 3}
                      onChange={(e) =>
                        updateWidgetProps(selectedWidget.id, {
                          divDividend: Math.max(1, Math.min(12, Number(e.target.value))),
                        })
                      }
                      className="w-full px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-bold text-center"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] text-slate-500 block">دقیقه (۰ تا ۵۹):</span>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={selectedWidget.divDivisor ?? 25}
                      onChange={(e) =>
                        updateWidgetProps(selectedWidget.id, {
                          divDivisor: Math.max(0, Math.min(59, Number(e.target.value))),
                        })
                      }
                      className="w-full px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-bold text-center"
                    />
                  </label>
                </div>
              )}

              {selectedWidget.title.includes('تقسیم چکشی') && (
                <div className="space-y-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="text-[10px] text-slate-500 block">مقسوم:</span>
                      <input
                        type="number"
                        min={1}
                        value={selectedWidget.divDividend ?? 147}
                        onChange={(e) =>
                          updateWidgetProps(selectedWidget.id, {
                            divDividend: Math.max(1, Number(e.target.value)),
                          })
                        }
                        className="w-full px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-bold text-center"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[10px] text-slate-500 block">مقسوم‌علیه:</span>
                      <input
                        type="number"
                        min={1}
                        value={selectedWidget.divDivisor ?? 12}
                        onChange={(e) =>
                          updateWidgetProps(selectedWidget.id, {
                            divDivisor: Math.max(1, Number(e.target.value)),
                          })
                        }
                        className="w-full px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-bold text-center"
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateWidgetProps(selectedWidget.id, {
                        hideDivisionSteps: !selectedWidget.hideDivisionSteps,
                      })
                    }
                    className="w-full py-1 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold text-[10px]"
                  >
                    {selectedWidget.hideDivisionSteps
                      ? 'نمایش مراحل جواب تقسیم'
                      : 'مخفی کردن جواب (حل با قلم)'}
                  </button>
                </div>
              )}

              {(selectedWidget.widgetKind === 'persian-number' ||
                selectedWidget.widgetKind === 'geo-shape') && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">متن/عدد:</span>
                  <input
                    type="text"
                    value={selectedWidget.persianText ?? ''}
                    onChange={(e) => {
                      const val = toPersianDigits(e.target.value, true);
                      updateWidgetProps(selectedWidget.id, {
                        persianText: val,
                        title:
                          selectedWidget.widgetKind === 'persian-number'
                            ? `عدد فارسی (${val || '۰'})`
                            : selectedWidget.title,
                      });
                    }}
                    placeholder="برچسب..."
                    aria-label="ویرایش متن یا عدد شکل انتخاب‌شده"
                    className="flex-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-center"
                  />
                </div>
              )}

              {/* Size & Rotation Row */}
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-1.5 flex-1">
                  <span className="text-[10px] text-slate-500 whitespace-nowrap">
                    سایز ({fmt(Math.round((selectedWidget.scale ?? 1) * 100))}٪):
                  </span>
                  <input
                    type="range"
                    min={0.4}
                    max={2.6}
                    step={0.1}
                    value={selectedWidget.scale ?? 1}
                    onChange={(e) =>
                      updateWidgetProps(selectedWidget.id, { scale: Number(e.target.value) })
                    }
                    aria-label="تغییر اندازه شکل انتخاب‌شده"
                    className="w-full accent-sky-600"
                  />
                </label>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      updateWidgetProps(selectedWidget.id, {
                        rotationDeg: ((selectedWidget.rotationDeg ?? 0) - 15) % 360,
                      })
                    }
                    className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] font-bold"
                  >
                    -۱۵°
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateWidgetProps(selectedWidget.id, {
                        rotationDeg: ((selectedWidget.rotationDeg ?? 0) + 15) % 360,
                      })
                    }
                    className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] font-bold"
                  >
                    +۱۵°
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateWidgetProps(selectedWidget.id, {
                        rotationDeg: ((selectedWidget.rotationDeg ?? 0) + 90) % 360,
                      })
                    }
                    title="چرخش ۹۰ درجه"
                    className="p-1 rounded bg-slate-100 dark:bg-slate-800"
                  >
                    <RotateCw className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Inner Fill Color Swatches */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-500">رنگ‌آمیزی داخل:</span>
                <div className="flex items-center gap-1.5">
                  {[
                    '#38bdf8',
                    '#10b981',
                    '#f59e0b',
                    '#f43f5e',
                    '#a855f7',
                    '#ec4899',
                    '#eab308',
                  ].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() =>
                        updateWidgetProps(selectedWidget.id, { badgeColor: c, filled: true })
                      }
                      style={{ backgroundColor: c }}
                      aria-label={`رنگ داخل شکل ${c}`}
                      className={`w-4 h-4 rounded-full border ${
                        selectedWidget.badgeColor === c
                          ? 'scale-125 border-slate-900 dark:border-white ring-2 ring-sky-400/50'
                          : 'border-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {selectedWidget.widgetKind === 'geo-shape' && (
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      updateWidgetProps(selectedWidget.id, { filled: !selectedWidget.filled })
                    }
                    className="flex-1 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold"
                  >
                    {selectedWidget.filled ? 'داخل رنگی ✓' : 'بدون رنگ داخل'}
                  </button>
                  <button
                    type="button"
                    data-testid="convert-shape-to-ink-btn"
                    onClick={() => handleBakeGeoShapeToCanvasStrokes(selectedWidget)}
                    className="flex-1 py-1 rounded bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-500"
                  >
                    تبدیل به خطوط قابل پاک‌کردن
                  </button>
                </div>
              )}
            </div>
          )}

          {/* =====================================================================
              LAYER Z-20: Interactive HTML5 Ink Canvas (Dynamic Scrollable/Expandable Size)
          ===================================================================== */}
          <canvas
            ref={canvasRef}
            width={boardWidth}
            height={boardHeight}
            data-testid="smart-whiteboard-canvas"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="w-full h-full cursor-none touch-none relative z-20"
          />

          {/* =====================================================================
              LIVE CUSTOM CURSOR FOR PEN, HIGHLIGHTER, MARKER & ERASER
              (نشانگر سفارشی با اندازه و رنگ واقعی ابزار انتخابی روی تخته)
          ===================================================================== */}
          {boardCursorPos && (
            <div
              data-testid="custom-board-cursor"
              style={{
                left: boardCursorPos.x,
                top: boardCursorPos.y,
              }}
              className="absolute pointer-events-none z-40 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
            >
              {/* Outer precision ring when pen nib is small so pointer location is always crystal clear */}
              {customCursorSpec.showPrecisionRing && (
                <div
                  style={{
                    width: Math.max(20, customCursorSpec.diameterPx + 12),
                    height: Math.max(20, customCursorSpec.diameterPx + 12),
                    borderColor: customCursorSpec.color,
                  }}
                  className="absolute rounded-full border border-dashed opacity-55"
                />
              )}

              {/* Exact Real-Size & Real-Color Nib / Eraser Indicator */}
              <div
                data-testid="custom-board-cursor-nib"
                style={{
                  width: customCursorSpec.diameterPx,
                  height: customCursorSpec.diameterPx,
                  backgroundColor:
                    customCursorSpec.mode === 'eraser'
                      ? 'rgba(244, 63, 94, 0.16)'
                      : customCursorSpec.mode === 'lasso'
                      ? 'rgba(2, 132, 199, 0.14)'
                      : customCursorSpec.color,
                  opacity:
                    customCursorSpec.mode === 'eraser' || customCursorSpec.mode === 'lasso'
                      ? 1
                      : customCursorSpec.fillOpacity,
                  borderColor:
                    customCursorSpec.mode === 'eraser'
                      ? '#f43f5e'
                      : customCursorSpec.color,
                  borderWidth:
                    customCursorSpec.mode === 'eraser' || customCursorSpec.dashedBorder
                      ? 2
                      : 1.5,
                  borderStyle: customCursorSpec.dashedBorder ? 'dashed' : 'solid',
                  borderRadius: customCursorSpec.shape === 'square' ? '4px' : '9999px',
                }}
                className="shadow-xs transition-all duration-75"
              />

              {/* Compact Size/Tool Badge next to Cursor */}
              <span
                style={{
                  top: Math.max(14, customCursorSpec.radiusPx + 8),
                }}
                className="absolute px-1.5 py-0.5 rounded bg-slate-900/80 text-white font-mono text-[9px] font-bold whitespace-nowrap shadow-xs"
              >
                {customCursorSpec.labelFa} · {fmt(customCursorSpec.sizeLabelPx)}px
              </span>
            </div>
          )}

          {/* Spotlight Cursor Effect */}
          {spotlightActive && (
            <div
              style={{
                background: `radial-gradient(circle 115px at ${mousePos.x}px ${mousePos.y}px, transparent 0%, rgba(2, 6, 23, 0.72) 100%)`,
              }}
              className="absolute inset-0 pointer-events-none z-25 transition-opacity"
            />
          )}

          {/* Floating Anti-Piracy Dynamic Watermark */}
          {floatingWatermark && (
            <div
              className={`absolute ${watermarkPositions[watermarkStep]} transition-all duration-700 pointer-events-none select-none z-25 px-3 py-1 rounded bg-slate-900/20 dark:bg-white/10 text-[11px] font-medium text-slate-600 dark:text-slate-300`}
            >
              کد امنیتی: <span className="font-mono">{watermarkCode}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
