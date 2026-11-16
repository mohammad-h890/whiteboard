import React, { useEffect, useRef, useState } from 'react';
import {
  Monitor,
  ExternalLink,
  Maximize2,
  Minimize2,
  PauseCircle,
  PlayCircle,
  EyeOff,
  Eye,
  Sun,
  X,
  Radio,
} from 'lucide-react';
import { CanvasBackgroundId, toPersianDigits } from '../core/featureEngine';
import { Point2D } from '../core/canvasAndMathEngine';
import type { PenToolId, StampedBoardWidget } from './SmartWhiteboardCanvas';
import { BareBoardShapeGraphic } from './BareBoardShapeGraphic';

export const PROJECTOR_BROADCAST_CHANNEL = 'daneshboard_projector_sync_v1';
export const PROJECTOR_STORAGE_KEY = 'daneshboard_projector_state_v1';

export interface ProjectorStrokeItem {
  id: string;
  pageIndex: number;
  layerId: string;
  tool: PenToolId;
  color: string;
  fillColor?: string;
  width: number;
  points: Point2D[];
  isVanishing?: boolean;
  shapeLabel?: string;
}

export interface ProjectorSyncPayload {
  timestamp: number;
  background: CanvasBackgroundId;
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
  usePersianNumerals: boolean;
  projectorForceWhiteBg: boolean;
  projectorBlankScreen: boolean;
  laserCursor?: Point2D | null;
}

/**
 * Broadcasts the current whiteboard state in real time to any open Second Monitor / Projector window.
 */
export function broadcastProjectorState(payload: ProjectorSyncPayload): void {
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const ch = new BroadcastChannel(PROJECTOR_BROADCAST_CHANNEL);
      ch.postMessage(payload);
      ch.close();
    }
  } catch {
    // Ignore BroadcastChannel errors
  }

  try {
    window.localStorage.setItem(PROJECTOR_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadInitialProjectorState(): ProjectorSyncPayload | null {
  try {
    const raw = window.localStorage.getItem(PROJECTOR_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ProjectorSyncPayload;
  } catch {
    return null;
  }
}

interface PureProjectorBoardCanvasProps {
  payload: ProjectorSyncPayload;
  className?: string;
}

/**
 * Renders the 100% menu-free Pure Whiteboard Output seen by students on the projector.
 */
export const PureProjectorBoardCanvas: React.FC<PureProjectorBoardCanvasProps> = ({
  payload,
  className = 'w-full h-full',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fmt = (val: string | number) => toPersianDigits(val, payload.usePersianNumerals);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (payload.projectorBlankScreen) return;

    const drawStrokePoints = (
      tool: PenToolId,
      color: string,
      width: number,
      points: Point2D[],
      shapeLabel?: string,
      fillColor?: string
    ) => {
      if (points.length < 2) return;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // When projecting on a bright white projector screen, ensure light sky-blue strokes remain vivid and legible
      const effectiveColor =
        payload.projectorForceWhiteBg && color === '#38bdf8' ? '#0284c7' : color;

      if (tool === 'highlighter') {
        ctx.globalAlpha = 0.34;
        ctx.lineWidth = width * 4.5;
        ctx.strokeStyle = effectiveColor;
      } else if (tool === 'laser-vanish') {
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 14;
        ctx.lineWidth = width + 2;
        ctx.strokeStyle = '#fb7185';
      } else if (tool === 'dashed') {
        ctx.setLineDash([10, 8]);
        ctx.lineWidth = width;
        ctx.strokeStyle = effectiveColor;
      } else {
        ctx.lineWidth = width;
        ctx.strokeStyle = effectiveColor;
      }

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      if (Boolean(shapeLabel)) {
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
      } else {
        for (let i = 1; i < points.length - 1; i++) {
          const midX = (points[i].x + points[i + 1].x) / 2;
          const midY = (points[i].y + points[i + 1].y) / 2;
          ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
        }
        const last = points[points.length - 1];
        ctx.lineTo(last.x, last.y);
      }

      if (fillColor && points.length >= 3) {
        ctx.fillStyle = `${fillColor}3d`;
        ctx.fill();
      }
      ctx.stroke();

      if (shapeLabel) {
        const p0 = points[0];
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = effectiveColor;
        ctx.fillText(shapeLabel, p0.x + 8, p0.y - 8);
      }
      ctx.restore();
    };

    for (const s of payload.strokes) {
      drawStrokePoints(s.tool, s.color, s.width, s.points, s.shapeLabel, s.fillColor);
    }

    if (payload.activeLiveStroke && payload.activeLiveStroke.points.length >= 2) {
      drawStrokePoints(
        payload.activeLiveStroke.tool,
        payload.activeLiveStroke.color,
        payload.activeLiveStroke.width,
        payload.activeLiveStroke.points,
        undefined,
        payload.activeLiveStroke.fillColor
      );
    }
  }, [payload]);

  const isWhiteProjector = payload.projectorForceWhiteBg || payload.background === 'white';

  const getBoardSurfaceClasses = (): string => {
    if (payload.projectorForceWhiteBg) {
      return 'bg-white text-slate-900';
    }
    switch (payload.background) {
      case 'blackboard':
        return 'bg-zinc-950 text-zinc-100';
      case 'greenboard':
        return 'bg-emerald-950 text-emerald-50';
      case 'sepia':
        return 'bg-amber-50 text-amber-950';
      default:
        return 'bg-white text-slate-900';
    }
  };

  const getGridPatternStyle = (): React.CSSProperties => {
    if (payload.projectorBlankScreen) return {};
    if (payload.background === 'white') return {};
    if (payload.background === 'lined') {
      return {
        backgroundImage:
          'repeating-linear-gradient(to bottom, transparent 0px, transparent 31px, rgba(14,165,233,0.18) 32px)',
      };
    }
    return {
      backgroundImage:
        'linear-gradient(to right, rgba(148,163,184,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.18) 1px, transparent 1px)',
      backgroundSize: '28px 28px',
    };
  };

  return (
    <div
      data-testid="pure-projector-board-surface"
      style={getGridPatternStyle()}
      className={`relative overflow-hidden select-none ${getBoardSurfaceClasses()} ${className}`}
    >
      {payload.projectorBlankScreen ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-white text-slate-400">
          <span className="text-lg font-bold">پرده سفید موقت پروژکتور فعال است</span>
          <span className="text-xs mt-1">استاد در حال آماده‌سازی بخش بعدی درس است...</span>
        </div>
      ) : (
        <>
          {/* Clipped Exam Question if visible */}
          {payload.clippedQuestion && (
            <div className="absolute top-4 right-4 max-w-sm p-3 rounded-xl bg-white/95 border border-slate-200 shadow-xs pointer-events-none z-0 text-slate-900">
              <div className="text-[11px] font-bold text-sky-700 mb-1">
                {payload.clippedQuestion.title}
              </div>
              <p className="text-xs leading-relaxed">{payload.clippedQuestion.body}</p>
            </div>
          )}

          {/* Bare Shapes, Numbers & Lab Widgets (Zero edit handles or menus!) */}
          {payload.stampedWidgets.map((w, idx) => {
            const sc = w.scale ?? 1;
            const rot = w.rotationDeg ?? 0;
            return (
              <div
                key={w.id || idx}
                style={{
                  left: w.x,
                  top: w.y,
                  transform: `scale(${sc}) rotate(${rot}deg)`,
                  transformOrigin: 'center center',
                }}
                className="absolute z-10 pointer-events-none select-none"
              >
                <BareBoardShapeGraphic
                  widget={w}
                  usePersianNumerals={payload.usePersianNumerals}
                />
              </div>
            );
          })}

          {/* Synchronized Ink Canvas Layer (z-20) */}
          <canvas
            ref={canvasRef}
            width={1360}
            height={820}
            className="w-full h-full block relative z-20 pointer-events-none"
          />

          {/* Live Teacher Laser Pointer Dot on Projector */}
          {payload.laserCursor && (
            <div
              style={{
                left: payload.laserCursor.x - 8,
                top: payload.laserCursor.y - 8,
              }}
              className="absolute w-4 h-4 rounded-full bg-rose-500 shadow-[0_0_16px_4px_rgba(244,63,94,0.85)] pointer-events-none z-30"
            />
          )}

          {/* Minimal Corner Page Number Badge for Students */}
          <div
            className={`absolute bottom-3 left-3 px-2.5 py-0.5 rounded-md text-[11px] font-bold pointer-events-none z-30 ${
              isWhiteProjector
                ? 'bg-slate-900/5 text-slate-500'
                : 'bg-white/10 text-slate-300'
            }`}
          >
            صفحه {fmt(payload.currentPage + 1)} از {fmt(payload.totalPages)}
          </div>
        </>
      )}
    </div>
  );
};

interface StandaloneProjectorWindowProps {
  fallbackPayload: ProjectorSyncPayload;
  onExitProjectorMode: () => void;
}

/**
 * Full-screen 100% menu-free Projector Receiver Window when opened via #projector or Fullscreen Projector Mode.
 */
export const StandaloneProjectorWindow: React.FC<StandaloneProjectorWindowProps> = ({
  fallbackPayload,
  onExitProjectorMode,
}) => {
  const [livePayload, setLivePayload] = useState<ProjectorSyncPayload>(
    () => loadInitialProjectorState() ?? fallbackPayload
  );

  useEffect(() => {
    let ch: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        ch = new BroadcastChannel(PROJECTOR_BROADCAST_CHANNEL);
        ch.onmessage = (ev) => {
          if (ev.data && typeof ev.data === 'object') {
            setLivePayload(ev.data as ProjectorSyncPayload);
          }
        };
      }
    } catch {
      // Ignore
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === PROJECTOR_STORAGE_KEY && e.newValue) {
        try {
          setLivePayload(JSON.parse(e.newValue) as ProjectorSyncPayload);
        } catch {
          // Ignore
        }
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      if (ch) ch.close();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // Also sync immediately when fallbackPayload updates in same-tab mode
  useEffect(() => {
    setLivePayload(fallbackPayload);
  }, [fallbackPayload]);

  return (
    <div
      data-testid="standalone-projector-fullscreen"
      className="fixed inset-0 w-screen h-screen overflow-hidden bg-white z-50 group"
    >
      <PureProjectorBoardCanvas payload={livePayload} className="w-full h-full" />

      {/* Subtle hover-only exit button in top-left corner so students don't see any menus */}
      <button
        type="button"
        onClick={onExitProjectorMode}
        className="fixed top-2 left-2 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity px-3 py-1.5 rounded-lg bg-slate-900/80 text-white text-xs font-bold flex items-center gap-1.5 z-50 shadow-lg"
      >
        <Minimize2 className="w-3.5 h-3.5" />
        <span>خروج از نمای پروژکتور (بازگشت به منوی استاد)</span>
      </button>
    </div>
  );
};

interface SecondMonitorControlDockProps {
  isOpen: boolean;
  onClose: () => void;
  livePayload: ProjectorSyncPayload;
  isFrozen: boolean;
  onToggleFreeze: () => void;
  projectorForceWhiteBg: boolean;
  onToggleForceWhiteBg: () => void;
  projectorBlankScreen: boolean;
  onToggleBlankScreen: () => void;
  onEnterFullscreenProjector: () => void;
  usePersianNumerals: boolean;
}

/**
 * Floating / Expandable Second Monitor & Projector Live Monitor + Controller for the Teacher.
 * Lets the teacher work with all menus while watching & controlling the exact clean student projector output in real time.
 */
export const SecondMonitorControlDock: React.FC<SecondMonitorControlDockProps> = ({
  isOpen,
  onClose,
  livePayload,
  isFrozen,
  onToggleFreeze,
  projectorForceWhiteBg,
  onToggleForceWhiteBg,
  projectorBlankScreen,
  onToggleBlankScreen,
  onEnterFullscreenProjector,
  usePersianNumerals,
}) => {
  const [expandedSize, setExpandedSize] = useState<boolean>(false);
  const fmt = (val: string | number) => toPersianDigits(val, usePersianNumerals);

  if (!isOpen) return null;

  return (
    <div
      data-testid="second-monitor-projector-panel"
      className={`fixed bottom-14 left-4 z-40 rounded-2xl bg-white/98 dark:bg-slate-900/98 border-2 border-emerald-500/70 shadow-2xl flex flex-col overflow-hidden transition-all ${
        expandedSize ? 'w-[680px] h-[470px]' : 'w-[430px] h-[320px]'
      }`}
    >
      {/* Top Control Header (Only visible to Teacher) */}
      <div className="px-3 py-2 bg-slate-900 text-white flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <Monitor className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-extrabold">
            مانیتور دوم / خروجی زنده پروژکتور دانش‌آموزان (بدون منو)
          </span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
            {isFrozen ? 'فریز شده' : `${fmt(60)}fps بلادرنگ`}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setExpandedSize((v) => !v)}
            title={expandedSize ? 'کوچک کردن مانیتور' : 'بزرگ کردن مانیتور'}
            className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
          >
            {expandedSize ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن مانیتور دوم"
            className="p-1 rounded hover:bg-rose-600 text-slate-300 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Teacher Projector Action Bar */}
      <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-1.5 text-[11px] shrink-0">
        <div className="flex items-center gap-1 flex-wrap">
          <button
            type="button"
            onClick={onToggleForceWhiteBg}
            className={`px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors ${
              projectorForceWhiteBg
                ? 'bg-emerald-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
            }`}
          >
            <Sun className="w-3 h-3" />
            <span>{projectorForceWhiteBg ? 'تخته سفید پروژکتور: روشن' : 'رنگ تخته استاد'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleFreeze}
            className={`px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors ${
              isFrozen
                ? 'bg-amber-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
            }`}
          >
            {isFrozen ? <PlayCircle className="w-3 h-3" /> : <PauseCircle className="w-3 h-3" />}
            <span>{isFrozen ? 'ادامه پخش زنده' : 'فریز تصویر پروژکتور'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleBlankScreen}
            className={`px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors ${
              projectorBlankScreen
                ? 'bg-rose-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
            }`}
          >
            {projectorBlankScreen ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>{projectorBlankScreen ? 'نمایش تخته' : 'پرده سفید موقت'}</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <a
            href="#projector"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="open-projector-new-tab-link"
            className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center gap-1 transition-colors"
            title="باز کردن صفحه خالص سفید بدون منو در تب/پنجره جداگانه برای انداختن روی ویدئو پروژکتور"
          >
            <ExternalLink className="w-3 h-3" />
            <span>پنجره مستقل پروژکتور</span>
          </a>

          <button
            type="button"
            onClick={onEnterFullscreenProjector}
            data-testid="enter-fullscreen-projector-btn"
            className="px-2 py-1 rounded-lg bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-bold flex items-center gap-1 transition-colors"
            title="نمایش تمام‌صفحه خروجی خالص بدون منو"
          >
            <Radio className="w-3 h-3 text-emerald-400" />
            <span>تمام‌صفحه</span>
          </button>
        </div>
      </div>

      {/* Live 16:9 Clean Student Projector Output Screen */}
      <div className="flex-1 bg-slate-200 dark:bg-slate-950 p-2 flex flex-col overflow-hidden">
        <div className="flex-1 rounded-xl border-2 border-slate-300 dark:border-slate-700 overflow-hidden shadow-inner relative bg-white">
          <PureProjectorBoardCanvas payload={livePayload} className="w-full h-full" />
        </div>
        <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
          <span>
            ✓ دانش‌آموزان فقط صفحه تخته سفید بالا را می‌بینند (منوها، ابزارها و دکمه‌های ویرایش مخفی هستند)
          </span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
            SYNC: LIVE
          </span>
        </div>
      </div>
    </div>
  );
};
