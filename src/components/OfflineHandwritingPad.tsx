import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Trash2,
  RotateCcw,
  Plus,
  Delete,
  Space,
  Wand2,
  GitBranch,
  Maximize2,
  Minimize2,
  Calculator,
  Zap,
  Check,
  Sparkles,
} from 'lucide-react';
import {
  HandwritingRecognitionMode,
  HandwritingStroke,
  HandwritingCandidate,
  InstantSymbolBounds,
  recognizeOfflineHandwriting,
  fitStrokeToBezierCurve,
  normalizeHandwritingStrokeGeometry,
} from '../core/handwritingEngine';
import { parseTextToFlowchart } from '../core/studioAndAiEngine';
import { toPersianDigits } from '../core/featureEngine';

export interface LastAutoReplacedSymbol {
  widgetId?: string;
  strokeId?: string;
  text: string;
  candidates: HandwritingCandidate[];
  sourceStrokes?: HandwritingStroke[];
  box?: InstantSymbolBounds;
}

export interface OfflineHandwritingPadProps {
  isOpen: boolean;
  onClose: () => void;
  strokeColor: string;
  usePersianNumerals: boolean;
  initialTab?: 'handwriting' | 'flowchart';
  mode?: HandwritingRecognitionMode;
  onChangeMode?: (nextMode: HandwritingRecognitionMode) => void;
  instantReplaceMode?: boolean;
  onToggleInstantReplaceMode?: () => void;
  convertDelayMs?: number;
  onChangeConvertDelayMs?: (ms: number) => void;
  lastAutoReplaced?: LastAutoReplacedSymbol | null;
  onReplaceLastAutoItem?: (newText: string) => void;
  onUndoLastAutoItem?: () => void;
  offlineLearningStats?: {
    prototypeCount: number;
    totalFeedbackCount: number;
    maxPrototypes: number;
  };
  onResetOfflineLearning?: () => void;
  beautifierActive?: boolean;
  onToggleBeautifier?: () => void;
  boardStrokes?: HandwritingStroke[];
  onClearBoardStrokes?: () => void;
  onUndoLastBoardStroke?: () => void;
  onStampRecognizedText: (text: string, kind: 'text-note' | 'math-formula' | 'math-symbol') => void;
  onStampBeautifiedStrokes?: (strokes: HandwritingStroke[]) => void;
  onStampFlowchart?: (title: string, nodes: string[]) => void;
}

const SAMPLE_GESTURES: Array<{
  id: string;
  label: string;
  mode: HandwritingRecognitionMode;
  strokes: HandwritingStroke[];
}> = [
  {
    id: 'fa-17',
    label: '۱۷',
    mode: 'fa-digits',
    strokes: [
      [
        { x: 110, y: 20 },
        { x: 110, y: 55 },
        { x: 110, y: 92 },
      ],
      [
        { x: 185, y: 22 },
        { x: 215, y: 92 },
        { x: 245, y: 22 },
      ],
    ],
  },
  {
    id: 'en-42',
    label: '42',
    mode: 'en-digits',
    strokes: [
      [
        { x: 145, y: 20 },
        { x: 105, y: 65 },
        { x: 162, y: 65 },
        { x: 145, y: 65 },
        { x: 145, y: 92 },
      ],
      [
        { x: 205, y: 30 },
        { x: 228, y: 18 },
        { x: 252, y: 30 },
        { x: 246, y: 52 },
        { x: 202, y: 90 },
        { x: 256, y: 90 },
      ],
    ],
  },
  {
    id: 'sym-plus',
    label: '+',
    mode: 'symbols',
    strokes: [
      [
        { x: 165, y: 55 },
        { x: 235, y: 55 },
      ],
      [
        { x: 200, y: 20 },
        { x: 200, y: 90 },
      ],
    ],
  },
  {
    id: 'sym-eq',
    label: '=',
    mode: 'symbols',
    strokes: [
      [
        { x: 160, y: 42 },
        { x: 240, y: 42 },
      ],
      [
        { x: 160, y: 68 },
        { x: 240, y: 68 },
      ],
    ],
  },
  {
    id: 'sym-div',
    label: '÷',
    mode: 'symbols',
    strokes: [
      [
        { x: 160, y: 55 },
        { x: 240, y: 55 },
      ],
      [
        { x: 200, y: 32 },
        { x: 202, y: 33 },
      ],
      [
        { x: 200, y: 78 },
        { x: 202, y: 79 },
      ],
    ],
  },
];

export const OfflineHandwritingPad: React.FC<OfflineHandwritingPadProps> = ({
  isOpen,
  onClose,
  strokeColor,
  usePersianNumerals,
  initialTab = 'handwriting',
  mode: controlledMode,
  onChangeMode,
  instantReplaceMode = true,
  onToggleInstantReplaceMode,
  convertDelayMs = 1500,
  onChangeConvertDelayMs,
  lastAutoReplaced = null,
  onReplaceLastAutoItem,
  onUndoLastAutoItem,
  offlineLearningStats,
  onResetOfflineLearning,
  beautifierActive = true,
  onToggleBeautifier,
  boardStrokes = [],
  onClearBoardStrokes,
  onUndoLastBoardStroke,
  onStampRecognizedText,
  onStampFlowchart,
}) => {
  const [activeTab, setActiveTab] = useState<'handwriting' | 'flowchart'>(initialTab);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [internalMode, setInternalMode] = useState<HandwritingRecognitionMode>('all');
  const mode = controlledMode ?? internalMode;
  const setMode = (next: HandwritingRecognitionMode) => {
    setInternalMode(next);
    onChangeMode?.(next);
  };
  const [localStrokes, setLocalStrokes] = useState<HandwritingStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<HandwritingStroke>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [committedText, setCommittedText] = useState<string>('');
  const [customCorrectionText, setCustomCorrectionText] = useState<string>('');
  const [learnedNotice, setLearnedNotice] = useState<string | null>(null);
  const [flowchartInput, setFlowchartInput] = useState<string>(
    'شروع -> محاسبه فرمول -> بررسی نتیجه -> پایان'
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastPenTimestampRef = useRef<number>(0);
  const learnedNoticeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setCustomCorrectionText(lastAutoReplaced?.text ?? '');
  }, [lastAutoReplaced?.widgetId, lastAutoReplaced?.strokeId, lastAutoReplaced?.text]);

  useEffect(() => {
    return () => {
      if (learnedNoticeTimerRef.current !== null) {
        window.clearTimeout(learnedNoticeTimerRef.current);
      }
    };
  }, []);

  const triggerInstantCorrection = (rawNext: string) => {
    const cleaned = rawNext.trim();
    if (!cleaned || !onReplaceLastAutoItem) return;
    onReplaceLastAutoItem(cleaned);
    setCustomCorrectionText(cleaned);
    if (learnedNoticeTimerRef.current !== null) {
      window.clearTimeout(learnedNoticeTimerRef.current);
    }
    setLearnedNotice(`«${cleaned}» ثبت و یاد گرفته شد`);
    learnedNoticeTimerRef.current = window.setTimeout(() => {
      setLearnedNotice(null);
      learnedNoticeTimerRef.current = null;
    }, 2200);
  };

  const activeStrokes = React.useMemo(() => {
    const raw = [...boardStrokes, ...localStrokes];
    if (!beautifierActive) return raw;
    return raw.map((st) => (st.length >= 4 ? fitStrokeToBezierCurve(st) : st));
  }, [boardStrokes, localStrokes, beautifierActive]);

  const recognition = React.useMemo(
    () => recognizeOfflineHandwriting(activeStrokes, mode),
    [activeStrokes, mode]
  );

  const editableDisplayValue = `${committedText}${recognition.bestMatch}`;
  const fmt = (val: string | number) => toPersianDigits(val, usePersianNumerals);

  const handleClearAllInk = () => {
    setLocalStrokes([]);
    setCurrentStroke([]);
    onClearBoardStrokes?.();
  };

  const handleUndoLastInk = () => {
    if (localStrokes.length > 0) {
      setLocalStrokes((prev) => prev.slice(0, -1));
    } else if (boardStrokes.length > 0) {
      onUndoLastBoardStroke?.();
    } else if (lastAutoReplaced && onUndoLastAutoItem) {
      onUndoLastAutoItem();
    }
  };

  const renderInkPad = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Subtle baseline guide
    ctx.save();
    ctx.strokeStyle = 'rgba(2, 132, 199, 0.32)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(10, h * 0.78);
    ctx.lineTo(w - 10, h * 0.78);
    ctx.stroke();
    ctx.restore();

    const allToDraw =
      currentStroke.length > 0 ? [...localStrokes, currentStroke] : localStrokes;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = strokeColor || '#0284c7';
    ctx.lineWidth = 3.6;

    for (const rawSt of allToDraw) {
      if (rawSt.length === 0) continue;
      if (rawSt.length === 1) {
        ctx.fillStyle = strokeColor || '#0284c7';
        ctx.beginPath();
        ctx.arc(rawSt[0].x, rawSt[0].y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      const st =
        beautifierActive && rawSt.length >= 4
          ? normalizeHandwritingStrokeGeometry(rawSt)
          : rawSt;
      ctx.beginPath();
      ctx.moveTo(st[0].x, st[0].y);
      for (let i = 1; i < st.length; i++) {
        if (beautifierActive && i < st.length - 1) {
          const midX = (st[i].x + st[i + 1].x) / 2;
          const midY = (st[i].y + st[i + 1].y) / 2;
          ctx.quadraticCurveTo(st[i].x, st[i].y, midX, midY);
        } else {
          ctx.lineTo(st[i].x, st[i].y);
        }
      }
      ctx.stroke();
    }
    ctx.restore();
  }, [localStrokes, currentStroke, strokeColor, beautifierActive]);

  useEffect(() => {
    if (isExpanded && activeTab === 'handwriting') {
      renderInkPad();
    }
  }, [isExpanded, activeTab, renderInkPad]);

  if (!isOpen) return null;

  const getCanvasPointFromClient = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / Math.max(1, rect.width);
    const scaleY = canvas.height / Math.max(1, rect.height);
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'pen') {
      lastPenTimestampRef.current = Date.now();
    } else if (
      e.pointerType === 'touch' &&
      (Date.now() - lastPenTimestampRef.current < 2500 || e.width > 28 || e.height > 28)
    ) {
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = getCanvasPointFromClient(e.clientX, e.clientY);
    setIsDrawing(true);
    setCurrentStroke([pt]);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const pt = getCanvasPointFromClient(e.clientX, e.clientY);
    setCurrentStroke((prev) => [...prev, pt]);
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStroke.length > 0) {
      setLocalStrokes((prev) => [...prev, currentStroke]);
    }
    setCurrentStroke([]);
  };

  const handleSelectCandidate = (candidateText: string) => {
    setCommittedText((prev) => `${prev}${candidateText}`);
    handleClearAllInk();
  };

  const handleStampComposedToBoard = () => {
    const finalText = editableDisplayValue.trim();
    if (!finalText) return;
    onStampRecognizedText(finalText, 'math-formula');
    setCommittedText('');
    handleClearAllInk();
  };

  const flowchartSpec = parseTextToFlowchart(flowchartInput);

  return (
    <div
      dir="rtl"
      data-testid="offline-handwriting-pad"
      className={`rounded-xl bg-white/95 dark:bg-slate-900/95 border border-sky-500/45 shadow-xl backdrop-blur-md text-xs overflow-hidden transition-all ${
        isExpanded ? 'w-[420px] max-w-[94vw]' : 'w-[340px] max-w-[92vw]'
      }`}
    >
      {/* Compact Header Bar */}
      <div className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 bg-sky-500/10 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 min-w-0">
          <Calculator className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
          <span className="font-extrabold text-slate-800 dark:text-slate-100 truncate text-[11px]">
            تشخیص آفلاین اعداد و نشانه‌ها
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <select
            data-testid="compact-hw-mode-select"
            value={mode}
            onChange={(e) => setMode(e.target.value as HandwritingRecognitionMode)}
            aria-label="حالت تشخیص اعداد و نشانه‌ها"
            className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-200"
          >
            <option value="all">همه (اعداد و نشانه‌ها)</option>
            <option value="fa-digits">اعداد فارسی (۰-۹)</option>
            <option value="en-digits">اعداد انگلیسی (0-9)</option>
            <option value="symbols">نشانه‌ها (+ − × ÷ =)</option>
          </select>

          <button
            type="button"
            data-testid="toggle-handwriting-expand-btn"
            onClick={() => setIsExpanded((v) => !v)}
            title={isExpanded ? 'کوچک کردن کادر' : 'گسترده کردن بوم نوشتاری'}
            aria-label={isExpanded ? 'جمع کردن منوی دست‌نویس' : 'گسترده کردن منوی دست‌نویس'}
            className={`px-2 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1 transition-colors ${
              isExpanded
                ? 'bg-sky-600 text-white shadow-2xs'
                : 'bg-sky-500/15 hover:bg-sky-500/25 text-sky-700 dark:text-sky-300 border border-sky-500/30'
            }`}
          >
            {isExpanded ? (
              <>
                <Minimize2 className="w-3 h-3" />
                <span>جمع‌شونده</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3 h-3" />
                <span>گسترده</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleUndoLastInk}
            disabled={activeStrokes.length === 0 && !lastAutoReplaced}
            title="واگرد آخرین خط یا مورد جایگزین‌شده (Ctrl+Z)"
            aria-label="واگرد آخرین خط دست‌نویس"
            className="p-1 rounded hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-35"
          >
            <RotateCcw className="w-3 h-3" />
          </button>

          <button
            type="button"
            data-testid="clear-handwriting-ink-btn"
            onClick={() => {
              handleClearAllInk();
              setCommittedText('');
            }}
            title="پاک کردن عبارت و دستخط"
            aria-label="پاک کردن عبارت و دستخط"
            className="p-1 rounded hover:bg-rose-500/15 text-rose-600 dark:text-rose-400"
          >
            <Trash2 className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="بستن کادر تشخیص اعداد و نشانه‌ها"
            title="خاموش کردن تشخیص اعداد و نشانه‌ها"
            className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {activeTab === 'flowchart' ? (
        <div className="p-2.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 dark:text-slate-200 text-[11px]">
              تبدیل متن به فلوچارت روی تخته:
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('handwriting')}
              className="px-2 py-0.5 rounded bg-sky-600 text-white font-bold text-[10px]"
            >
              اعداد و نشانه‌ها
            </button>
          </div>
          <input
            type="text"
            value={flowchartInput}
            onChange={(e) => setFlowchartInput(e.target.value)}
            className="w-full px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[11px] font-semibold"
            placeholder="مرحله ۱ -> مرحله ۲"
          />
          <button
            type="button"
            data-testid="stamp-flowchart-to-board-btn"
            onClick={() => {
              onStampFlowchart?.(
                flowchartSpec.title,
                flowchartSpec.nodes.map((n) => n.label)
              );
            }}
            className="w-full py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px]"
          >
            + وارد کردن فلوچارت ({fmt(flowchartSpec.nodes.length)})
          </button>
        </div>
      ) : (
        <div className="p-2 space-y-1.5">
          {isExpanded && (
            <div className="flex items-center justify-between gap-1 flex-wrap pb-1 border-b border-slate-200/70 dark:border-slate-800">
              <div className="flex items-center gap-1 flex-wrap">
                {(
                  [
                    { id: 'all', label: 'همه' },
                    { id: 'fa-digits', label: 'اعداد فارسی' },
                    { id: 'en-digits', label: '0-9' },
                    { id: 'symbols', label: '+ − × ÷ =' },
                  ] as Array<{ id: HandwritingRecognitionMode; label: string }>
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    data-testid={`hw-mode-${m.id}`}
                    onClick={() => setMode(m.id)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all ${
                      mode === m.id
                        ? 'bg-sky-600 text-white border-sky-500'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                data-testid="handwriting-pad-flowchart-tab"
                onClick={() => setActiveTab('flowchart')}
                className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px] flex items-center gap-0.5"
              >
                <GitBranch className="w-2.5 h-2.5" />
                <span>فلوچارت</span>
              </button>
            </div>
          )}

          {/* Instant Per-Symbol / Multi-Digit In-Place Replacement Toggle & Pause Delay */}
          {onToggleInstantReplaceMode && (
            <div className="flex items-center justify-between gap-1.5 pb-0.5 flex-wrap">
              <button
                type="button"
                data-testid="toggle-instant-replace-btn"
                onClick={onToggleInstantReplaceMode}
                title="با روشن بودن این گزینه، اعداد (تک‌رقمی تا ۴ رقمی) و علامت‌ها در جای دست‌نویس جانشین می‌شوند"
                className={`px-2 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1 border transition-colors whitespace-nowrap shrink-0 ${
                  instantReplaceMode
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Zap className="w-3 h-3 shrink-0" />
                <span>جایگزینی درجا: {instantReplaceMode ? 'روشن' : 'خاموش'}</span>
              </button>
              {instantReplaceMode && onChangeConvertDelayMs ? (
                <label className="flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-300 font-semibold shrink-0">
                  <span>مکث تبدیل:</span>
                  <select
                    data-testid="instant-convert-delay-select"
                    aria-label="زمان مکث تبدیل دست‌نویس"
                    value={convertDelayMs}
                    onChange={(e) => onChangeConvertDelayMs(Number(e.target.value))}
                    className="px-1.5 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-200"
                  >
                    <option value={900}>۰.۹ ثانیه (سریع)</option>
                    <option value={1500}>۱.۵ ثانیه (۳-۴ رقمی)</option>
                    <option value={2500}>۲.۵ ثانیه (آرام)</option>
                  </select>
                </label>
              ) : (
                <span className="text-[9.5px] text-slate-500 dark:text-slate-400 truncate">
                  حالت دستی (دکمه وارد کردن)
                </span>
              )}
            </div>
          )}

          {/* 1-Click + Manual Input In-Place Correction Bar with Offline Adaptive Learning */}
          {instantReplaceMode && activeStrokes.length === 0 && lastAutoReplaced && (
            <div
              data-testid="instant-replace-correction-bar"
              className="space-y-1.5 py-1.5 px-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30"
            >
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                  اصلاح فوری:
                </span>
                {lastAutoReplaced.candidates.slice(0, 6).map((cand, idx) => {
                  const isActive = cand.text === lastAutoReplaced.text;
                  return (
                    <button
                      key={`${cand.text}-${idx}`}
                      type="button"
                      data-testid={`instant-replace-candidate-${idx}`}
                      onClick={() => triggerInstantCorrection(cand.text)}
                      className={`px-2 py-0.5 rounded font-extrabold text-[11px] shrink-0 transition-colors ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-emerald-500'
                      }`}
                    >
                      {cand.text}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-1">
                <input
                  type="text"
                  data-testid="instant-correction-input"
                  value={customCorrectionText}
                  onChange={(e) => setCustomCorrectionText(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      triggerInstantCorrection(customCorrectionText);
                    }
                  }}
                  placeholder="مقدار صحیح را بنویسید (مثلاً ۷ یا ۱۲۵)..."
                  aria-label="کادر نوشتن اصلاح فوری دست‌نویس"
                  className="flex-1 min-w-0 px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-emerald-500/45 focus:border-emerald-600 text-[11px] font-extrabold text-slate-900 dark:text-slate-100 outline-none"
                />
                <button
                  type="button"
                  data-testid="instant-correction-apply-btn"
                  onClick={() => triggerInstantCorrection(customCorrectionText)}
                  disabled={!customCorrectionText.trim()}
                  className="px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-[10px] flex items-center gap-0.5 shrink-0 transition-colors whitespace-nowrap"
                >
                  <Check className="w-3 h-3" />
                  <span>ثبت اصلاح</span>
                </button>
              </div>

              {(learnedNotice || (offlineLearningStats && offlineLearningStats.totalFeedbackCount > 0)) && (
                <div className="flex items-center justify-between gap-1 text-[9.5px] text-emerald-700 dark:text-emerald-300 font-semibold">
                  <span className="flex items-center gap-1 truncate" data-testid="offline-learning-status">
                    <Sparkles className="w-2.5 h-2.5 shrink-0" />
                    {learnedNotice ? (
                      <span>{learnedNotice}</span>
                    ) : (
                      <span>
                        یادگیری آفلاین: {fmt(offlineLearningStats?.totalFeedbackCount ?? 0)} بازخورد (فشرده)
                      </span>
                    )}
                  </span>
                  {offlineLearningStats &&
                    offlineLearningStats.prototypeCount > 0 &&
                    onResetOfflineLearning && (
                      <button
                        type="button"
                        data-testid="reset-offline-learning-btn"
                        onClick={onResetOfflineLearning}
                        title="بازنشانی حافظه یادگیری آفلاین دست‌نویس"
                        className="text-[9px] text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 underline shrink-0"
                      >
                        بازنشانی
                      </button>
                    )}
                </div>
              )}
            </div>
          )}

          {/* Top 5 Candidate Suggestions Bar (for live ink or manual mode) */}
          {recognition.candidates.length > 0 && (
            <div
              data-testid="gboard-candidate-bar"
              className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none"
            >
              {recognition.candidates.slice(0, 5).map((cand, idx) => (
                <button
                  key={`${cand.text}-${idx}`}
                  type="button"
                  data-testid={`gboard-candidate-${idx}`}
                  onClick={() => handleSelectCandidate(cand.text)}
                  className={`px-2 py-0.5 rounded font-bold text-[11px] shrink-0 transition-colors flex items-center gap-1 ${
                    idx === 0
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>{cand.text}</span>
                </button>
              ))}
            </div>
          )}

          {/* Editable Recognized Expression + Insert Button */}
          <div className="flex items-center gap-1">
            <input
              type="text"
              data-testid="gboard-composed-input"
              value={editableDisplayValue}
              onChange={(e) => setCommittedText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleStampComposedToBoard();
                }
              }}
              placeholder="عدد یا علامت ریاضی بنویسید..."
              aria-label="عدد یا علامت شناسایی‌شده"
              className="flex-1 min-w-0 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-sky-500/60 focus:border-sky-600 text-xs font-extrabold text-slate-900 dark:text-slate-100 outline-none"
            />
            <button
              type="button"
              data-testid="gboard-stamp-to-board-btn"
              onClick={handleStampComposedToBoard}
              disabled={!editableDisplayValue.trim()}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-extrabold text-[11px] flex items-center gap-0.5 shrink-0 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>وارد کردن</span>
            </button>
          </div>

          {isExpanded && (
            <div
              data-testid="handwriting-expanded-panel"
              className="space-y-1.5 pt-1 border-t border-slate-200 dark:border-slate-800"
            >
              <div className="relative rounded-lg border border-dashed border-sky-500/40 bg-slate-50/90 dark:bg-slate-950/80 overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={110}
                  data-testid="gboard-ink-canvas"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  className="w-full h-24 cursor-crosshair touch-none block"
                />
                {localStrokes.length === 0 && currentStroke.length === 0 && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-[10px] text-slate-400">
                    اعداد فارسی (۰-۹)، انگلیسی (0-9) یا نشانه‌های ریاضی (+ − × ÷ =) را اینجا بنویسید
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-1 flex-wrap">
                <div className="flex items-center gap-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setCommittedText(`${editableDisplayValue} `);
                      handleClearAllInk();
                    }}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center gap-1"
                  >
                    <Space className="w-3 h-3" />
                    <span>فاصله</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = editableDisplayValue;
                      setCommittedText(cur.slice(0, -1));
                      handleClearAllInk();
                    }}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center gap-1"
                  >
                    <Delete className="w-3 h-3" />
                    <span>حذف</span>
                  </button>
                  {SAMPLE_GESTURES.map((smp) => (
                    <button
                      key={smp.id}
                      type="button"
                      data-testid={`hw-sample-${smp.id}`}
                      onClick={() => {
                        setMode(smp.mode);
                        setLocalStrokes(smp.strokes);
                      }}
                      className="px-1.5 py-0.5 rounded bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/25 text-sky-700 dark:text-sky-300 text-[10px] font-bold"
                    >
                      {smp.label}
                    </button>
                  ))}
                </div>

                {onToggleBeautifier && (
                  <button
                    type="button"
                    data-testid="toggle-handwriting-beautifier-btn"
                    onClick={onToggleBeautifier}
                    className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[9px] font-bold flex items-center gap-1"
                  >
                    <Wand2 className="w-2.5 h-2.5" />
                    <span>صاف‌سازی: {beautifierActive ? 'روشن' : 'خاموش'}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
