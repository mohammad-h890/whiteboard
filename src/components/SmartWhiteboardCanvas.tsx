import React, { useRef, useEffect, useState } from 'react';
import {
  PenTool,
  Highlighter,
  Eraser,
  Sparkles,
  CircleDot,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Scissors,
  Compass,
  FileText,
  X,
  Wand2,
  Undo2,
  Redo2,
  StickyNote,
  Table,
  Ruler,
  Map,
  Plus,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { CanvasBackgroundId, toPersianDigits } from '../core/featureEngine';
import {
  recognizeGeometricShape,
  eraseStrokePointsInRadius,
  Point2D,
} from '../core/canvasAndMathEngine';

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
  | 'lasso';

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

interface StrokePath {
  id: string;
  pageIndex: number;
  layerId: string;
  tool: PenToolId;
  color: string;
  width: number;
  points: Point2D[];
  createdAt?: number;
  isVanishing?: boolean;
  shapeLabel?: string;
}

interface SmartWhiteboardCanvasProps {
  canvasMode: 'infinite' | 'a4' | '16:9' | '9:16';
  background: CanvasBackgroundId;
  activeTool: PenToolId;
  onSelectTool: (t: PenToolId) => void;
  strokeColor: string;
  onSelectColor: (c: string) => void;
  strokeWidth: number;
  stabilizationLevel: number;
  holdToSnapEnabled: boolean;
  splitScreenPdfOpen: boolean;
  desktopOverlayMode: boolean;
  layers: BoardLayer[];
  activeLayerId: string;
  onSelectLayer: (id: string) => void;
  onToggleLayerVisible: (id: string) => void;
  onToggleLayerLock: (id: string) => void;
  stampedWidgets: StampedBoardWidget[];
  onRemoveStampedWidget: (id: string) => void;
  calloutStamps: string[];
  webcamEnabled: boolean;
  webcamKeyframeMode?: 'bubble-left' | 'fullscreen-talk' | 'hidden-writing';
  invisibleUiMode: boolean;
  teleprompterOpen: boolean;
  onCloseTeleprompter: () => void;
  spotlightActive: boolean;
  floatingWatermark: boolean;
  watermarkCode?: string;
  reelsPreviewMode: boolean;
  aiOcrEnabled: boolean;
  usePersianNumerals: boolean;
  clearTrigger: number;
}

const DEFAULT_STROKES: StrokePath[] = [
  {
    id: 'demo-1',
    pageIndex: 1,
    layerId: 'layer-2-solution',
    tool: 'fountain',
    color: '#0284c7',
    width: 3,
    points: [
      { x: 180, y: 210 },
      { x: 240, y: 205 },
      { x: 310, y: 212 },
      { x: 380, y: 208 },
    ],
  },
];

export const SmartWhiteboardCanvas: React.FC<SmartWhiteboardCanvasProps> = ({
  canvasMode,
  background,
  activeTool,
  onSelectTool,
  strokeColor,
  strokeWidth,
  stabilizationLevel,
  holdToSnapEnabled,
  splitScreenPdfOpen,
  desktopOverlayMode,
  layers,
  activeLayerId,
  onSelectLayer,
  onToggleLayerVisible,
  onToggleLayerLock,
  stampedWidgets,
  onRemoveStampedWidget,
  calloutStamps,
  webcamEnabled,
  webcamKeyframeMode = 'bubble-left',
  invisibleUiMode,
  teleprompterOpen,
  onCloseTeleprompter,
  spotlightActive,
  floatingWatermark,
  watermarkCode = 'DB-98421',
  reelsPreviewMode,
  aiOcrEnabled,
  usePersianNumerals,
  clearTrigger,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [strokes, setStrokes] = useState<StrokePath[]>(DEFAULT_STROKES);
  const [redoStack, setRedoStack] = useState<StrokePath[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(2);

  // Module 1 Interactive Extras: Sticky Notes with Elastic Connectors, Dynamic Table, Ruler/Protractor, Minimap
  const [stickyNodes, setStickyNodes] = useState<StickyNode[]>([]);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [showDynamicTable, setShowDynamicTable] = useState<boolean>(false);
  const [tableData, setTableData] = useState<string[][]>([
    ['کمیت فیزیکی', 'نماد', 'مقدار در تست'],
    ['جرم جسم', 'm', '۵ kg'],
    ['زاویه شیب', 'θ', '۳۰°'],
  ]);
  const [showRulerProtractor, setShowRulerProtractor] = useState<boolean>(false);
  const [rulerAngle, setRulerAngle] = useState<number>(0);
  const [showMinimap, setShowMinimap] = useState<boolean>(false);
  const [lastSnapNotice, setLastSnapNotice] = useState<string | null>(null);
  const [forcedShapeKind, setForcedShapeKind] = useState<
    'auto' | 'line' | 'circle' | 'rectangle' | 'triangle'
  >('auto');
  const [draggingWidgetId, setDraggingWidgetId] = useState<string | null>(null);
  const [widgetCoords, setWidgetCoords] = useState<Record<string, { x: number; y: number }>>({});

  const isDrawingRef = useRef<boolean>(false);
  const currentPointsRef = useRef<Point2D[]>([]);
  const [radialMenuPos, setRadialMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 450, y: 280 });
  const [clippedQuestionOnBoard, setClippedQuestionOnBoard] = useState<boolean>(false);
  const [selectedPdfQuestionIdx, setSelectedPdfQuestionIdx] = useState<number>(0);
  const [ocrConvertedText, setOcrConvertedText] = useState<string | null>(null);
  const [watermarkStep, setWatermarkStep] = useState<number>(0);

  const fmt = (val: string | number) => toPersianDigits(val, usePersianNumerals);

  const PDF_QUESTIONS = [
    {
      title: 'سوال ۱ (فیزیک ۳ - تجربی ۱۴۰۳)',
      body: 'جسمی به جرم ۵ کیلوگرم روی سطح شیب‌دار با زاویه ۳۰ درجه قرار دارد. شتاب حرکت و نیروی عمودی تکیه‌گاه را بیابید.',
    },
    {
      title: 'سوال ۲ (حسابان ۲ - ریاضی ۱۴۰۳)',
      body: 'مساحت ناحیه محصور بین نمودار تابع f(x) = 0.5x² + 0.5 و محور افقی در بازه [۰, ۴] را با ۸ مستطیل ریمان تقریب بزنید.',
    },
    {
      title: 'سوال ۳ (شیمی ۲ - ساختار اتم)',
      body: 'آرایش الکترونی اوربیتالی عنصر اکسیژن (Z=8) را طبق قاعده هوند رسم کرده و تعداد الکترون‌های جفت‌نشده را مشخص کنید.',
    },
  ];

  useEffect(() => {
    if (clearTrigger > 0) {
      setStrokes((prev) => prev.filter((s) => s.pageIndex !== currentPage));
      setStickyNodes([]);
      setShowDynamicTable(false);
      setOcrConvertedText(null);
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

  const pageStrokes = strokes.filter((s) => s.pageIndex === currentPage);

  // Render strokes onto HTML5 canvas
  useEffect(() => {
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

    const drawPath = (s: StrokePath) => {
      if (s.points.length < 2) return;
      ctx.save();
      ctx.beginPath();
      ctx.lineCap = s.tool === 'marker' ? 'square' : 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = s.color;
      ctx.lineWidth =
        s.tool === 'highlighter'
          ? s.width * 4.5
          : s.tool === 'marker'
          ? s.width * 2.2
          : s.width;

      if (s.tool === 'dashed') {
        ctx.setLineDash([8, 6]);
      } else if (s.tool === 'lasso') {
        ctx.setLineDash([4, 4]);
      }

      if (s.tool === 'highlighter') {
        ctx.globalAlpha = 0.32;
      } else if (s.isVanishing) {
        ctx.globalAlpha = 0.85;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;
      } else if (s.tool === 'pencil') {
        ctx.globalAlpha = 0.75;
      }

      ctx.moveTo(s.points[0].x, s.points[0].y);
      if (s.shapeLabel || s.tool === 'shape-snap' || s.points.length <= 5) {
        // Exact vertex-to-vertex rendering for snapped lines, rectangles, triangles, and circles
        for (let i = 1; i < s.points.length; i++) {
          ctx.lineTo(s.points[i].x, s.points[i].y);
        }
      } else {
        for (let i = 1; i < s.points.length; i++) {
          const prev = s.points[i - 1];
          const curr = s.points[i];
          const midX = (prev.x + curr.x) / 2;
          const midY = (prev.y + curr.y) / 2;
          ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
        }
        const lastPt = s.points[s.points.length - 1];
        ctx.lineTo(lastPt.x, lastPt.y);
      }
      ctx.stroke();
      ctx.restore();
    };

    highlighterStrokes.forEach(drawPath);
    regularStrokes.forEach(drawPath);
  }, [pageStrokes, layers]);

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
        title: 'مفهوم پایه',
        text: 'قانون دوم نیوتن: ∑F = m·a',
        colorClass: 'bg-amber-100 dark:bg-amber-950/90 border-amber-400 text-amber-950 dark:text-amber-100',
        x: 90,
        y: 105,
        connectedToId: id2,
      },
      {
        id: id2,
        title: 'نتیجه در سطح شیب‌دار',
        text: 'a = g·(sinθ − μ·cosθ)',
        colorClass: 'bg-sky-100 dark:bg-sky-950/90 border-sky-400 text-sky-950 dark:text-sky-100',
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

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button === 2) return;
    setRadialMenuPos(null);

    const activeLayer = layers.find((l) => l.id === activeLayerId);
    if (!activeLayer || activeLayer.locked || !activeLayer.visible) return;

    const pt = getPointerCoords(e);

    // 1. Stroke Eraser (whole stroke)
    if (activeTool === 'eraser-stroke') {
      setStrokes((prev) =>
        prev.filter(
          (s) =>
            s.pageIndex !== currentPage ||
            s.points.every((p) => Math.hypot(p.x - pt.x, p.y - pt.y) > 26)
        )
      );
      return;
    }

    // 2. Pixel Eraser (splits strokes in radius)
    if (activeTool === 'eraser-pixel') {
      setStrokes((prev) => {
        const next: StrokePath[] = [];
        for (const s of prev) {
          if (s.pageIndex !== currentPage) {
            next.push(s);
            continue;
          }
          const segments = eraseStrokePointsInRadius(s.points, pt, 22);
          segments.forEach((seg, idx) => {
            next.push({
              ...s,
              id: `${s.id}-seg-${idx}-${Date.now()}`,
              points: seg,
            });
          });
        }
        return next;
      });
      return;
    }

    // 3. Highlighter-only Eraser
    if (activeTool === 'eraser-highlighter') {
      setStrokes((prev) =>
        prev.filter(
          (s) =>
            s.pageIndex !== currentPage ||
            s.tool !== 'highlighter' ||
            s.points.every((p) => Math.hypot(p.x - pt.x, p.y - pt.y) > 32)
        )
      );
      return;
    }

    isDrawingRef.current = true;
    currentPointsRef.current = [pt];
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;
    setMousePos({ x: relX, y: relY });

    if (draggingWidgetId) {
      setWidgetCoords((prev) => ({
        ...prev,
        [draggingWidgetId]: {
          x: Math.max(16, Math.min(rect.width - 240, relX - 110)),
          y: Math.max(48, Math.min(rect.height - 180, relY - 30)),
        },
      }));
      return;
    }

    if (draggingNodeId) {
      setStickyNodes((prev) =>
        prev.map((n) =>
          n.id === draggingNodeId
            ? { ...n, x: Math.max(20, Math.min(rect.width - 180, relX - 70)), y: Math.max(20, Math.min(rect.height - 90, relY - 30)) }
            : n
        )
      );
      return;
    }

    if (!isDrawingRef.current) return;
    const rawPt = getPointerCoords(e);
    const pts = currentPointsRef.current;
    const lastPt = pts[pts.length - 1] ?? rawPt;

    const alpha = Math.max(0.15, 1 - stabilizationLevel * 0.08);
    const smoothedPt = {
      x: lastPt.x + alpha * (rawPt.x - lastPt.x),
      y: lastPt.y + alpha * (rawPt.y - lastPt.y),
    };
    currentPointsRef.current.push(smoothedPt);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        ctx.beginPath();
        ctx.lineCap = 'round';
        ctx.strokeStyle =
          activeTool === 'laser-vanish'
            ? '#ef4444'
            : activeTool === 'lasso'
            ? '#0284c7'
            : strokeColor;
        ctx.lineWidth =
          activeTool === 'highlighter' ? strokeWidth * 4.5 : strokeWidth;
        if (activeTool === 'highlighter') ctx.globalAlpha = 0.25;
        if (activeTool === 'dashed' || activeTool === 'lasso') ctx.setLineDash([6, 4]);
        ctx.moveTo(lastPt.x, lastPt.y);
        ctx.lineTo(smoothedPt.x, smoothedPt.y);
        ctx.stroke();
        ctx.restore();
      }
    }
  };

  const handlePointerUp = () => {
    if (draggingWidgetId) {
      setDraggingWidgetId(null);
      return;
    }
    if (draggingNodeId) {
      setDraggingNodeId(null);
      return;
    }
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    let pts = [...currentPointsRef.current];
    if (pts.length < 2) return;

    // Lasso Tool: recolor strokes inside bounding box of lasso
    if (activeTool === 'lasso') {
      const minX = Math.min(...pts.map((p) => p.x));
      const maxX = Math.max(...pts.map((p) => p.x));
      const minY = Math.min(...pts.map((p) => p.y));
      const maxY = Math.max(...pts.map((p) => p.y));
      setStrokes((prev) =>
        prev.map((s) => {
          if (s.pageIndex !== currentPage) return s;
          const inside = s.points.some(
            (p) => p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY
          );
          return inside ? { ...s, color: strokeColor } : s;
        })
      );
      currentPointsRef.current = [];
      return;
    }

    // Geometric Shape Recognition (Hold-to-Snap & Explicit Shape Modes)
    let recognizedLabel: string | undefined;
    if (activeTool === 'shape-snap' || (holdToSnapEnabled && pts.length >= 4)) {
      const minX = Math.min(...pts.map((p) => p.x));
      const maxX = Math.max(...pts.map((p) => p.x));
      const minY = Math.min(...pts.map((p) => p.y));
      const maxY = Math.max(...pts.map((p) => p.y));
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const avgR = Math.max(18, (maxX - minX + (maxY - minY)) / 4);

      if (activeTool === 'shape-snap' && forcedShapeKind !== 'auto') {
        if (forcedShapeKind === 'line') {
          pts = [pts[0], pts[pts.length - 1]];
          recognizedLabel = 'پارهخط صاف';
        } else if (forcedShapeKind === 'circle') {
          const circlePts: Point2D[] = [];
          for (let i = 0; i <= 48; i++) {
            const angle = (i * 2 * Math.PI) / 48;
            circlePts.push({
              x: Number((cx + avgR * Math.cos(angle)).toFixed(1)),
              y: Number((cy + avgR * Math.sin(angle)).toFixed(1)),
            });
          }
          pts = circlePts;
          recognizedLabel = 'دایره استاندارد';
        } else if (forcedShapeKind === 'rectangle') {
          pts = [
            { x: minX, y: minY },
            { x: maxX, y: minY },
            { x: maxX, y: maxY },
            { x: minX, y: maxY },
            { x: minX, y: minY },
          ];
          recognizedLabel = 'مستطیل هندسی';
        } else if (forcedShapeKind === 'triangle') {
          pts = [
            { x: cx, y: minY },
            { x: maxX, y: maxY },
            { x: minX, y: maxY },
            { x: cx, y: minY },
          ];
          recognizedLabel = 'مثلث هندسی';
        }
        setLastSnapNotice(`ترسیم دقیق شکل: ${recognizedLabel}`);
        window.setTimeout(() => setLastSnapNotice(null), 2500);
      } else {
        const recognized = recognizeGeometricShape(pts, activeTool === 'shape-snap');
        if (recognized.type !== 'freehand') {
          pts = recognized.snappedPoints;
          recognizedLabel = recognized.labelFa;
          setLastSnapNotice(`تشخیص هوشمند شکل: ${recognized.labelFa}`);
          window.setTimeout(() => setLastSnapNotice(null), 2500);
        }
      }
    }

    const newStroke: StrokePath = {
      id: `stroke-${Date.now()}-${Math.random()}`,
      pageIndex: currentPage,
      layerId: activeLayerId,
      tool: activeTool,
      color: activeTool === 'laser-vanish' ? '#ef4444' : strokeColor,
      width: strokeWidth,
      points: pts,
      createdAt: Date.now(),
      isVanishing: activeTool === 'laser-vanish',
      shapeLabel: recognizedLabel,
    };
    setStrokes((prev) => [...prev, newStroke]);
    setRedoStack([]);
    currentPointsRef.current = [];
  };

  const getBackgroundStyle = (): React.CSSProperties => {
    if (desktopOverlayMode) {
      return {
        backgroundImage:
          'linear-gradient(45deg, rgba(148,163,184,0.12) 25%, transparent 25%), linear-gradient(-45deg, rgba(148,163,184,0.12) 25%, transparent 25%)',
        backgroundSize: '24px 24px',
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
          backgroundImage: 'linear-gradient(to bottom, rgba(148,163,184,0.28) 1px, transparent 1px)',
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

  const questionLayerVisible =
    layers.find((l) => l.role === 'question')?.visible ?? true;
  const answerKeyLayerVisible =
    layers.find((l) => l.role === 'answer-key')?.visible ?? false;

  const watermarkPositions = [
    'top-28 left-6',
    'bottom-20 left-56',
    'top-44 left-8',
    'bottom-20 right-12',
  ];

  const currentPdfQ = PDF_QUESTIONS[selectedPdfQuestionIdx] ?? PDF_QUESTIONS[0];

  return (
    <div className="flex-1 flex overflow-hidden relative bg-slate-100 dark:bg-slate-950">
      {/* Optional Split-Screen PDF Book & Question Clipper (Module 1 & 2) */}
      {splitScreenPdfOpen && (
        <div className="w-80 lg:w-96 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 z-10">
          <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
              <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>جزوه PDF (نمای دوصفحه‌ای کنار تخته)</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              سوال {fmt(selectedPdfQuestionIdx + 1)} از {fmt(PDF_QUESTIONS.length)}
            </span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {PDF_QUESTIONS.map((q, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border-2 transition-all space-y-2 ${
                  selectedPdfQuestionIdx === idx
                    ? 'border-dashed border-sky-500 bg-sky-50/30 dark:bg-sky-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-sky-700 dark:text-sky-300">{q.title}</span>
                  <span className="text-[10px] text-slate-400">کادر برش هوشمند</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {q.body}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPdfQuestionIdx(idx);
                    setClippedQuestionOnBoard(true);
                  }}
                  className="w-full py-1.5 px-3 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-500 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>برش هوشمند و انتقال این سوال به تخته</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Whiteboard Viewport */}
      <div
        className="flex-1 relative overflow-hidden flex items-center justify-center p-1 sm:p-1.5"
        onContextMenu={(e) => {
          e.preventDefault();
          const rect = e.currentTarget.getBoundingClientRect();
          setRadialMenuPos({
            x: Math.min(rect.width - 140, Math.max(140, e.clientX - rect.left)),
            y: Math.min(rect.height - 140, Math.max(140, e.clientY - rect.top)),
          });
        }}
      >
        <div
          style={getBackgroundStyle()}
          className={`relative transition-all overflow-hidden shadow-lg border ${
            background === 'blackboard' || background === 'greenboard'
              ? 'border-slate-700 text-slate-100'
              : background === 'sepia'
              ? 'border-amber-300 text-slate-900'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          } ${
            reelsPreviewMode || canvasMode === '9:16'
              ? 'w-[360px] h-full rounded-2xl'
              : canvasMode === 'a4'
              ? 'w-[760px] h-full rounded-xl'
              : 'w-full h-full rounded-xl'
          }`}
        >
          {/* Floating Top-Left Canvas Action Bar (Undo/Redo, Page Switcher, Sticky/Connector, Table, Ruler, Minimap) */}
          <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-sm z-20 text-xs">
            <button
              type="button"
              onClick={handleUndo}
              disabled={pageStrokes.length === 0}
              aria-label="بازگشت به عقب (Undo)"
              title="بازگشت به عقب (Undo)"
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 text-slate-700 dark:text-slate-300"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              aria-label="انجام مجدد (Redo)"
              title="انجام مجدد (Redo)"
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 text-slate-700 dark:text-slate-300"
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
            <span className="font-mono text-[11px] font-bold px-1 tabular-nums">
              صفحه {fmt(currentPage)} از {fmt(totalPages)}
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
              title="افزودن صفحه جدید به تخته"
              className="p-1 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

            {/* Sticky Note + Elastic Connector */}
            <button
              type="button"
              onClick={handleAddConnectedStickyPair}
              className="px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-medium flex items-center gap-1 text-slate-700 dark:text-slate-300"
            >
              <StickyNote className="w-3.5 h-3.5 text-amber-500" />
              <span>کانکتور و نوت</span>
            </button>

            {/* Dynamic Table Builder */}
            <button
              type="button"
              onClick={() => setShowDynamicTable((v) => !v)}
              className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 ${
                showDynamicTable
                  ? 'bg-sky-600 text-white'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>جدول‌ساز</span>
            </button>

            {/* Virtual Ruler & Protractor */}
            <button
              type="button"
              onClick={() => setShowRulerProtractor((v) => !v)}
              className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 ${
                showRulerProtractor
                  ? 'bg-emerald-600 text-white'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Ruler className="w-3.5 h-3.5" />
              <span>خط‌کش/نقاله</span>
            </button>

            {/* Minimap Radar Toggle */}
            <button
              type="button"
              onClick={() => setShowMinimap((v) => !v)}
              aria-label="نقشه کوچک (Minimap)"
              title="نقشه کوچک (Minimap)"
              className={`p-1.5 rounded-md ${
                showMinimap
                  ? 'bg-sky-600 text-white'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Shape-Snap Mode Selector Bar when activeTool === 'shape-snap' */}
          {activeTool === 'shape-snap' && (
            <div className="absolute top-14 left-3 flex flex-wrap items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-sky-500/50 shadow-md z-25 text-[11px]">
              <span className="font-bold text-sky-600 dark:text-sky-400 ml-1">
                حالت رسم شکل:
              </span>
              {(
                [
                  { id: 'auto', label: 'تشخیص خودکار هوش مصنوعی' },
                  { id: 'line', label: 'خط صاف' },
                  { id: 'circle', label: 'دایره' },
                  { id: 'rectangle', label: 'مستطیل' },
                  { id: 'triangle', label: 'مثلث' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setForcedShapeKind(m.id)}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                    forcedShapeKind === m.id
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}

          {/* Hold-to-Snap Shape Detection Toast */}
          {lastSnapNotice && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-md z-30">
              ✓ {lastSnapNotice}
            </div>
          )}

          {/* Reels 9:16 Top 1/3 Webcam Preview */}
          {reelsPreviewMode && (
            <div className="h-1/3 w-full bg-slate-900 border-b-2 border-sky-500 flex flex-col items-center justify-center text-white p-3 relative">
              <span className="text-[11px] font-semibold text-sky-400">
                ۱/۳ بالایی ریلز (۹:۱۶): تصویر وب‌کم هوشمند استاد
              </span>
              <p className="text-xs text-slate-300 mt-1 text-center">
                برش خودکار چهره استاد در بالای قاب عمودی اینستاگرام و یوتیوب شورتس
              </p>
            </div>
          )}

          {/* Layer 1 (Locked Question Layer): Clipped Exam Question Card */}
          {questionLayerVisible && clippedQuestionOnBoard && (
            <div className="absolute top-4 right-4 max-w-sm p-3 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 shadow-sm pointer-events-none select-none z-0">
              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400 mb-1">
                <span>لایه ۱ (قفل‌شده): {currentPdfQ.title}</span>
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
                لایه ۳ (پاسخ تشریحی آماده استاد - آشکارشده با یک کلیک):
              </div>
              <p className="text-xs text-emerald-900 dark:text-emerald-100 font-mono" dir="ltr">
                mg·sin(30°) = 5 × 9.8 × 0.5 = 24.5 N | N = mg·cos(30°) = 42.44 N
              </p>
            </div>
          )}

          {/* Elastic Smart Connectors & Sticky Notes Overlay */}
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
                        d={`M ${n.x + 80} ${n.y + 35} C ${(n.x + target.x) / 2 + 80} ${n.y + 35}, ${
                          (n.x + target.x) / 2 + 80
                        } ${target.y + 35}, ${target.x + 80} ${target.y + 35}`}
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
                  className={`absolute w-44 p-2.5 rounded-xl border shadow-md cursor-move select-none z-20 ${node.colorClass}`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold opacity-75 mb-0.5">
                    <span>{node.title} (قابل جابه‌جایی)</span>
                    <button
                      type="button"
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
            <div className="absolute top-32 left-8 bg-white/95 dark:bg-slate-900/95 border border-slate-300 dark:border-slate-700 rounded-xl shadow-lg p-3 z-20 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                <span>جدول‌ساز پویا روی تخته</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setTableData((prev) => [...prev, ['ردیف جدید', '—', '۰']])
                    }
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
                            className={`w-24 px-1.5 py-0.5 rounded bg-transparent focus:outline-none focus:bg-sky-500/10 ${
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

          {/* Virtual Ruler & 180-Degree Protractor Overlay (Strictly Left-to-Right: 0 on Left -> 1, 2, ... to Right) */}
          {showRulerProtractor && (
            <div
              style={{ transform: `rotate(${rulerAngle}deg)` }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] bg-sky-500/15 backdrop-blur-xs border-2 border-sky-500 rounded-xl shadow-lg z-20 flex flex-col justify-between p-2.5 select-none space-y-2"
            >
              {/* Protractor 0° to 180° Left-to-Right Arc Scale */}
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

              {/* Ruler Centimeter Ticks: Strictly Left-to-Right (0, 1, 2, ... 12) */}
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
                  خط‌کش و نقاله (چپ به راست: {fmt(0)} تا {fmt(12)}cm · زاویه: {fmt(rulerAngle)}°)
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

          {/* Minimap Radar in Top-Right/Bottom-Left */}
          {showMinimap && (
            <div className="absolute top-16 left-4 w-36 h-24 rounded-xl bg-slate-900/85 border border-sky-500/40 p-2 z-20 pointer-events-none">
              <span className="text-[9px] text-sky-400 font-bold block mb-1">
                نقشه کوچک بوم (Minimap)
              </span>
              <div className="w-full h-14 rounded border border-slate-700 relative overflow-hidden bg-slate-950">
                <div className="absolute inset-2 border border-sky-400/70 rounded-xs bg-sky-500/10" />
              </div>
            </div>
          )}

          {/* Stamped Interactive Lab Shapes & Charts on Board (Draggable Visual SVG Cards) */}
          {stampedWidgets.map((w, idx) => {
            const pos = widgetCoords[w.id] ?? {
              x: w.x || 140 + (idx % 3) * 65,
              y: w.y || 85 + (idx % 4) * 55,
            };
            const toEn = (s: string) =>
              s.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
            const normText = toEn(`${w.title} ${w.summary}`);
            const fracMatch = normText.match(/(\d+)\s*\/\s*(\d+)/);
            const num = fracMatch ? Math.max(0, Number(fracMatch[1])) : 3;
            const den = fracMatch ? Math.max(1, Number(fracMatch[2])) : 5;

            return (
              <div
                key={w.id}
                style={{ left: pos.x, top: pos.y }}
                onPointerDown={() => setDraggingWidgetId(w.id)}
                data-testid={`stamped-widget-${idx}`}
                className="absolute w-64 p-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 border-2 border-sky-500/50 shadow-xl z-20 cursor-move select-none space-y-2"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5">
                  <div>
                    <span
                      style={{ color: w.badgeColor }}
                      className="text-xs font-extrabold block"
                    >
                      {w.title}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      قابل جابه‌جایی روی تخته سفید
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveStampedWidget(w.id);
                    }}
                    aria-label={`حذف کارت ${w.title}`}
                    className="text-slate-400 hover:text-rose-500 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Visual SVG Shape / Chart Preview Rendered Directly on the Whiteboard */}
                <div className="flex justify-center items-center py-1.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  {w.title.includes('کسر') ? (
                    w.title.includes('نواری') ? (
                      <svg viewBox="0 0 200 44" className="w-48 h-11">
                        {Array.from({ length: den }).map((_, i) => {
                          const cellW = 184 / den;
                          return (
                            <rect
                              key={i}
                              x={8 + i * cellW}
                              y={8}
                              width={Math.max(2, cellW - 2)}
                              height={28}
                              rx={3}
                              fill={i < num ? '#0284c7' : '#1e293b'}
                              stroke="#38bdf8"
                              strokeWidth="1.2"
                            />
                          );
                        })}
                      </svg>
                    ) : (
                      <svg viewBox="0 0 100 100" className="w-24 h-24">
                        {den === 1 ? (
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill={num >= 1 ? '#0284c7' : '#1e293b'}
                            stroke="#38bdf8"
                            strokeWidth="2"
                          />
                        ) : (
                          Array.from({ length: den }).map((_, i) => {
                            const startAngle = (i * 2 * Math.PI) / den - Math.PI / 2;
                            const endAngle = ((i + 1) * 2 * Math.PI) / den - Math.PI / 2;
                            const x1 = 50 + 42 * Math.cos(startAngle);
                            const y1 = 50 + 42 * Math.sin(startAngle);
                            const x2 = 50 + 42 * Math.cos(endAngle);
                            const y2 = 50 + 42 * Math.sin(endAngle);
                            const largeArc = 2 * Math.PI / den > Math.PI ? 1 : 0;
                            const d = `M 50 50 L ${x1} ${y1} A 42 42 0 ${largeArc} 1 ${x2} ${y2} Z`;
                            return (
                              <path
                                key={i}
                                d={d}
                                fill={i < num ? '#0284c7' : '#1e293b'}
                                stroke="#0f172a"
                                strokeWidth="1.5"
                              />
                            );
                          })
                        )}
                      </svg>
                    )
                  ) : w.title.includes('سطح شیب‌دار') || w.title.includes('FBD') ? (
                    <svg viewBox="0 0 200 100" className="w-48 h-24">
                      <polygon
                        points="20,85 175,85 20,25"
                        fill="rgba(56,189,248,0.15)"
                        stroke="#0284c7"
                        strokeWidth="2"
                      />
                      <rect
                        x="70"
                        y="35"
                        width="26"
                        height="18"
                        rx="3"
                        transform="rotate(21 83 44)"
                        fill="#0284c7"
                      />
                      <line x1="85" y1="44" x2="125" y2="60" stroke="#10b981" strokeWidth="2.5" />
                      <line x1="85" y1="44" x2="98" y2="12" stroke="#f59e0b" strokeWidth="2.5" />
                    </svg>
                  ) : w.title.includes('مشتق') ||
                    w.title.includes('ریمان') ||
                    w.title.includes('انتگرال') ||
                    w.title.includes('موج') ||
                    w.title.includes('ترمودینامیک') ||
                    w.title.includes('عرضه و تقاضا') ? (
                    <svg viewBox="0 0 200 95" className="w-48 h-24">
                      <line x1="20" y1="80" x2="185" y2="80" stroke="#64748b" strokeWidth="1.5" />
                      <line x1="20" y1="12" x2="20" y2="80" stroke="#64748b" strokeWidth="1.5" />
                      <rect x="35" y="52" width="22" height="28" fill="rgba(14,165,233,0.22)" stroke="#0284c7" />
                      <rect x="59" y="38" width="22" height="42" fill="rgba(14,165,233,0.22)" stroke="#0284c7" />
                      <rect x="83" y="26" width="22" height="54" fill="rgba(14,165,233,0.22)" stroke="#0284c7" />
                      <rect x="107" y="42" width="22" height="38" fill="rgba(14,165,233,0.22)" stroke="#0284c7" />
                      <path
                        d="M 22 72 Q 85 10, 175 55"
                        fill="none"
                        stroke={w.badgeColor || '#0284c7'}
                        strokeWidth="2.5"
                      />
                      <line x1="45" y1="65" x2="145" y2="20" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 2" />
                    </svg>
                  ) : w.title.includes('ساعت') ? (
                    <svg viewBox="0 0 100 100" className="w-20 h-20">
                      <circle cx="50" cy="50" r="42" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
                      <line x1="50" y1="50" x2="50" y2="22" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
                      <line x1="50" y1="50" x2="72" y2="50" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" />
                      <circle cx="50" cy="50" r="3" fill="#f8fafc" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 200 70" className="w-48 h-16">
                      <rect x="14" y="15" width="48" height="40" rx="8" fill="rgba(2,132,199,0.18)" stroke="#0284c7" strokeWidth="1.8" />
                      <line x1="62" y1="35" x2="96" y2="35" stroke="#38bdf8" strokeWidth="2" />
                      <circle cx="116" cy="35" r="20" fill="rgba(16,185,129,0.18)" stroke="#10b981" strokeWidth="1.8" />
                      <line x1="136" y1="35" x2="162" y2="35" stroke="#10b981" strokeWidth="2" />
                      <polygon points="162,22 188,35 162,48" fill="rgba(245,158,11,0.25)" stroke="#f59e0b" strokeWidth="1.8" />
                    </svg>
                  )}
                </div>

                <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium block leading-relaxed">
                  {w.summary}
                </span>
              </div>
            );
          })}

          {/* Animated Educational Callouts (Module 8) */}
          {calloutStamps.length > 0 && (
            <div className="absolute top-16 left-5 flex flex-col gap-1.5 z-10 pointer-events-none">
              {calloutStamps.map((stamp, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs shadow-md"
                >
                  ★ {stamp}
                </div>
              ))}
            </div>
          )}

          {/* AI Handwriting OCR Result Box (Module 10) */}
          {ocrConvertedText && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl bg-sky-600 text-white text-xs font-semibold shadow-lg flex items-center gap-3 z-20">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>خروجی تبدیل دستخط به فرمول استاندارد (Math OCR): {ocrConvertedText}</span>
              <button
                type="button"
                onClick={() => setOcrConvertedText(null)}
                aria-label="بستن نتیجه OCR"
                className="p-0.5 hover:bg-sky-700 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Interactive HTML5 Ink Canvas */}
          <canvas
            ref={canvasRef}
            width={1100}
            height={700}
            data-testid="smart-whiteboard-canvas"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="w-full h-full cursor-crosshair touch-none relative z-0"
          />

          {/* Spotlight Cursor Effect (Module 7) */}
          {spotlightActive && (
            <div
              style={{
                background: `radial-gradient(circle 115px at ${mousePos.x}px ${mousePos.y}px, transparent 0%, rgba(2, 6, 23, 0.72) 100%)`,
              }}
              className="absolute inset-0 pointer-events-none z-10 transition-opacity"
            />
          )}

          {/* Floating Anti-Piracy Dynamic Watermark (Module 9) */}
          {floatingWatermark && (
            <div
              className={`absolute ${watermarkPositions[watermarkStep]} transition-all duration-700 pointer-events-none select-none z-10 px-3 py-1 rounded bg-slate-900/20 dark:bg-white/10 text-[11px] font-medium text-slate-600 dark:text-slate-300`}
            >
              کد امنیتی دانش‌پذیر: <span className="font-mono">{watermarkCode}</span> · کپی‌برداری پیگرد قانونی دارد
            </div>
          )}

          {/* Floating Smart Webcam Bubble / Post-Production Keyframe (Module 7 & 8) */}
          {webcamEnabled && !reelsPreviewMode && webcamKeyframeMode !== 'hidden-writing' && (
            <div
              className={`absolute bottom-5 left-5 bg-slate-900 border-2 border-sky-500 shadow-xl flex flex-col items-center justify-center text-center p-2 select-none z-20 transition-all ${
                webcamKeyframeMode === 'fullscreen-talk'
                  ? 'w-48 h-36 rounded-2xl'
                  : 'w-28 h-28 rounded-full'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 text-xs font-bold mb-1">
                استاد
              </div>
              <span className="text-[10px] font-semibold text-white leading-tight">
                {webcamKeyframeMode === 'fullscreen-talk'
                  ? 'وب‌کم بزرگ (توضیح شفاهی)'
                  : 'وب‌کم هوشمند'}
              </span>
              <span className="text-[9px] text-emerald-400 mt-0.5">حذف پس‌زمینه AI</span>
            </div>
          )}

          {/* Invisible Teleprompter Overlay (Module 7) */}
          {teleprompterOpen && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 w-96 p-3.5 rounded-xl bg-slate-900/90 text-slate-100 border border-sky-500/40 shadow-2xl z-30 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-sky-400 font-semibold">
                <span>تله‌پرامپتر مخفی (در ویدیوی ضبط‌شده ثبت نمی‌شود)</span>
                <button
                  type="button"
                  onClick={onCloseTeleprompter}
                  aria-label="بستن تله‌پرامپتر"
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs leading-relaxed text-slate-200">
                ۱. ابتدا بردار وزن mg را به دو مؤلفه موازی و عمود بر سطح تجزیه کنید.
                <br />
                ۲. نکته کنکوری دام آموزشی زاویه متمم را با مهر کنکوری نمایش دهید.
              </p>
            </div>
          )}

          {/* Radial Quick Menu (منوی دایره‌ای سریع زیر نوک قلم) */}
          {radialMenuPos && (
            <div
              style={{ left: radialMenuPos.x - 110, top: radialMenuPos.y - 110 }}
              className="absolute w-56 h-56 rounded-full bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 shadow-2xl z-30 flex items-center justify-center p-4"
            >
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <button
                  type="button"
                  onClick={() => {
                    onSelectTool('fountain');
                    setRadialMenuPos(null);
                  }}
                  className="p-2 rounded-lg hover:bg-sky-500/10 text-[10px] font-semibold flex flex-col items-center gap-1"
                >
                  <PenTool className="w-4 h-4 text-sky-500" />
                  <span>روان‌نویس</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectTool('highlighter');
                    setRadialMenuPos(null);
                  }}
                  className="p-2 rounded-lg hover:bg-amber-500/10 text-[10px] font-semibold flex flex-col items-center gap-1"
                >
                  <Highlighter className="w-4 h-4 text-amber-500" />
                  <span>هایلایتر زیرمتن</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectTool('laser-vanish');
                    setRadialMenuPos(null);
                  }}
                  className="p-2 rounded-lg hover:bg-rose-500/10 text-[10px] font-semibold flex flex-col items-center gap-1"
                >
                  <CircleDot className="w-4 h-4 text-rose-500" />
                  <span>قلم لیزری</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectTool('eraser-stroke');
                    setRadialMenuPos(null);
                  }}
                  className="p-2 rounded-lg hover:bg-slate-500/10 text-[10px] font-semibold flex flex-col items-center gap-1"
                >
                  <Eraser className="w-4 h-4 text-slate-500" />
                  <span>پاک‌کن خطی</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRadialMenuPos(null)}
                  className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold flex items-center justify-center"
                >
                  بستن
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectTool('shape-snap');
                    setRadialMenuPos(null);
                  }}
                  className="p-2 rounded-lg hover:bg-emerald-500/10 text-[10px] font-semibold flex flex-col items-center gap-1"
                >
                  <Compass className="w-4 h-4 text-emerald-500" />
                  <span>شکل هوشمند</span>
                </button>
              </div>
            </div>
          )}

          {/* Floating Bottom-Right Photoshop Layers & Quick AI OCR Strip */}
          <div
            className={`absolute bottom-4 right-4 flex flex-wrap items-center gap-2 px-3 py-2 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-md z-20 ${
              invisibleUiMode ? 'ring-1 ring-emerald-500/40' : ''
            }`}
          >
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
              لایه‌ها:
            </span>
            {layers.map((layer) => (
              <div
                key={layer.id}
                onClick={() => !layer.locked && onSelectLayer(layer.id)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] border cursor-pointer ${
                  activeLayerId === layer.id
                    ? 'bg-sky-500/10 border-sky-500/40 text-sky-700 dark:text-sky-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLayerVisible(layer.id);
                  }}
                  aria-label={`نمایش یا مخفی کردن ${layer.name}`}
                  className="hover:text-sky-500"
                >
                  {layer.visible ? (
                    <Eye className="w-3.5 h-3.5" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>
                <span>{layer.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLayerLock(layer.id);
                  }}
                  aria-label={`قفل کردن ${layer.name}`}
                  className="hover:text-amber-500"
                >
                  {layer.locked ? (
                    <Lock className="w-3 h-3 text-amber-500" />
                  ) : (
                    <Unlock className="w-3 h-3 opacity-50" />
                  )}
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setRadialMenuPos({ x: 360, y: 260 })}
              className="px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            >
              منوی دایره‌ای سریع
            </button>

            {aiOcrEnabled && (
              <button
                type="button"
                onClick={() =>
                  setOcrConvertedText('∑F = m·a  ⟹  a = g·(sinθ − μ·cosθ) = 3.2 m/s²')
                }
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-sky-600 text-white hover:bg-sky-500 flex items-center gap-1"
              >
                <Wand2 className="w-3 h-3" />
                <span>تبدیل دستخط به فرمول (AI OCR)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
