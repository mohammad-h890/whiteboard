import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Trash2,
  RotateCcw,
  Sparkles,
  Plus,
  Delete,
  Space,
  Wand2,
  GitBranch,
  Languages,
  ChevronDown,
  ChevronUp,
  Edit3,
} from 'lucide-react';
import {
  HandwritingRecognitionMode,
  HandwritingStroke,
  recognizeOfflineHandwriting,
} from '../core/handwritingEngine';
import { parseTextToFlowchart } from '../core/studioAndAiEngine';
import { toPersianDigits } from '../core/featureEngine';

export interface OfflineHandwritingPadProps {
  isOpen: boolean;
  onClose: () => void;
  strokeColor: string;
  usePersianNumerals: boolean;
  initialTab?: 'handwriting' | 'flowchart';
  beautifierActive?: boolean;
  onToggleBeautifier?: () => void;
  /** Live strokes drawn directly on the main whiteboard canvas while Handwriting Mode is ON */
  boardStrokes?: HandwritingStroke[];
  onClearBoardStrokes?: () => void;
  onUndoLastBoardStroke?: () => void;
  onStampRecognizedText: (
    text: string,
    kind: 'persian-number' | 'text-note' | 'math-symbol'
  ) => void;
  onStampBeautifiedStrokes?: (strokes: HandwritingStroke[]) => void;
  onStampFlowchart?: (title: string, steps: string[]) => void;
}

interface SampleGesturePreset {
  id: string;
  label: string;
  mode: HandwritingRecognitionMode;
  strokes: HandwritingStroke[];
}

function buildScaledStrokes(
  rawStrokes: Array<Array<{ x: number; y: number }>>,
  offsetX = 110,
  offsetY = 20,
  scale = 100
): HandwritingStroke[] {
  return rawStrokes.map((st) =>
    st.map((pt) => ({
      x: offsetX + pt.x * scale,
      y: offsetY + pt.y * scale,
    }))
  );
}

const SAMPLE_GESTURES: SampleGesturePreset[] = [
  {
    id: 'sample-fa-12',
    label: 'عدد «۱۷»',
    mode: 'fa-digits',
    strokes: [
      ...buildScaledStrokes(
        [
          [
            { x: 0.5, y: 0.14 },
            { x: 0.5, y: 0.5 },
            { x: 0.5, y: 0.88 },
          ],
        ],
        55,
        18,
        95
      ),
      ...buildScaledStrokes(
        [
          [
            { x: 0.2, y: 0.16 },
            { x: 0.5, y: 0.88 },
            { x: 0.8, y: 0.16 },
          ],
        ],
        185,
        18,
        95
      ),
    ],
  },
  {
    id: 'sample-fa-pe',
    label: 'حرف «پ»',
    mode: 'fa-text',
    strokes: [
      ...buildScaledStrokes(
        [
          [
            { x: 0.86, y: 0.45 },
            { x: 0.82, y: 0.65 },
            { x: 0.5, y: 0.68 },
            { x: 0.18, y: 0.65 },
            { x: 0.14, y: 0.45 },
          ],
        ],
        110,
        15,
        105
      ),
      [
        { x: 155, y: 105 },
        { x: 157, y: 106 },
      ],
      [
        { x: 168, y: 105 },
        { x: 170, y: 106 },
      ],
      [
        { x: 162, y: 114 },
        { x: 164, y: 115 },
      ],
    ],
  },
  {
    id: 'sample-fa-salam',
    label: 'کلمه «سلام»',
    mode: 'fa-text',
    strokes: buildScaledStrokes(
      [
        [
          { x: 0.9, y: 0.62 },
          { x: 0.76, y: 0.62 },
          { x: 0.62, y: 0.62 },
          { x: 0.55, y: 0.18 },
          { x: 0.5, y: 0.65 },
          { x: 0.34, y: 0.22 },
          { x: 0.26, y: 0.45 },
          { x: 0.16, y: 0.45 },
          { x: 0.16, y: 0.88 },
        ],
      ],
      100,
      16,
      110
    ),
  },
  {
    id: 'sample-sym-plus',
    label: 'علامت «+»',
    mode: 'symbols',
    strokes: buildScaledStrokes(
      [
        [
          { x: 0.2, y: 0.5 },
          { x: 0.5, y: 0.5 },
          { x: 0.8, y: 0.5 },
        ],
        [
          { x: 0.5, y: 0.2 },
          { x: 0.5, y: 0.5 },
          { x: 0.5, y: 0.8 },
        ],
      ],
      115,
      18,
      100
    ),
  },
];

export const OfflineHandwritingPad: React.FC<OfflineHandwritingPadProps> = ({
  isOpen,
  onClose,
  strokeColor,
  usePersianNumerals,
  initialTab = 'handwriting',
  beautifierActive = true,
  onToggleBeautifier,
  boardStrokes = [],
  onClearBoardStrokes,
  onUndoLastBoardStroke,
  onStampRecognizedText,
  onStampBeautifiedStrokes,
  onStampFlowchart,
}) => {
  const [activeTab, setActiveTab] = useState<'handwriting' | 'flowchart'>(initialTab);
  const [mode, setMode] = useState<HandwritingRecognitionMode>('all');
  const [localStrokes, setLocalStrokes] = useState<HandwritingStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<HandwritingStroke>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [committedText, setCommittedText] = useState<string>('');
  const [showMiniPadCanvas, setShowMiniPadCanvas] = useState<boolean>(false);
  const [flowchartInput, setFlowchartInput] = useState<string>(
    'دریافت معادله -> محاسبه دلتا (Δ) -> بررسی علامت دلتا -> یافتن ریشه‌های x₁ و x₂'
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Combine strokes drawn directly on the main whiteboard + any strokes drawn inside the mini-pad
  const activeStrokes = React.useMemo(
    () => [...boardStrokes, ...localStrokes],
    [boardStrokes, localStrokes]
  );

  const recognition = React.useMemo(
    () => recognizeOfflineHandwriting(activeStrokes, mode, committedText || ''),
    [activeStrokes, mode, committedText]
  );

  // Live editable value shown inside the corner input box:
  // Combines any manually edited/committed prefix with the live recognized strokes from the whiteboard!
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
    } else {
      onUndoLastBoardStroke?.();
    }
  };

  // Render optional mini-pad inside the corner card when expanded
  const renderInkPad = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    [h * 0.28, h * 0.75].forEach((yPos) => {
      ctx.beginPath();
      ctx.moveTo(10, yPos);
      ctx.lineTo(w - 10, yPos);
      ctx.stroke();
    });
    ctx.restore();

    const allToDraw =
      currentStroke.length > 0 ? [...localStrokes, currentStroke] : localStrokes;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = strokeColor || '#0284c7';
    ctx.lineWidth = 4.5;

    for (const st of allToDraw) {
      if (st.length === 0) continue;
      if (st.length === 1) {
        ctx.fillStyle = strokeColor || '#0284c7';
        ctx.beginPath();
        ctx.arc(st[0].x, st[0].y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
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
    if (showMiniPadCanvas) {
      renderInkPad();
    }
  }, [showMiniPadCanvas, renderInkPad]);

  if (!isOpen) return null;

  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / Math.max(1, rect.width);
    const scaleY = canvas.height / Math.max(1, rect.height);
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = getCanvasPoint(e);
    setIsDrawing(true);
    setCurrentStroke([pt]);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const pt = getCanvasPoint(e);
    setCurrentStroke((prev) => [...prev, pt]);
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStroke.length > 0) {
      const normalizedStroke =
        currentStroke.length === 1
          ? [currentStroke[0], { x: currentStroke[0].x + 1, y: currentStroke[0].y + 1 }]
          : currentStroke;
      setLocalStrokes((prev) => [...prev, normalizedStroke]);
      setCurrentStroke([]);
    }
  };

  const handleSelectCandidate = (candidateText: string) => {
    if (!candidateText) return;
    setCommittedText((prev) => `${prev}${candidateText}`);
    handleClearAllInk();
  };

  const handleSelectSuggestedWord = (word: string) => {
    if (!word) return;
    setCommittedText(word);
    handleClearAllInk();
  };

  const handleStampComposedToBoard = () => {
    const finalTxt = editableDisplayValue.trim();
    if (!finalTxt) return;
    const isNumber = /^[۰-۹0-9.+\-×÷=]+$/.test(finalTxt);
    onStampRecognizedText(
      finalTxt,
      isNumber ? 'persian-number' : mode === 'symbols' ? 'math-symbol' : 'text-note'
    );
    setCommittedText('');
    handleClearAllInk();
  };

  const flowchartSpec = parseTextToFlowchart(flowchartInput);

  return (
    <div
      data-testid="offline-handwriting-pad"
      className="w-[360px] sm:w-[420px] rounded-2xl bg-white/98 dark:bg-slate-900/98 border-2 border-sky-500/70 shadow-2xl overflow-hidden text-xs z-50 backdrop-blur-md"
    >
      {/* Compact Corner Header Bar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gradient-to-l from-sky-600/20 via-indigo-600/10 to-transparent border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                تشخیص دست‌نویس آفلاین روی وایت‌برد
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[9px]">
                روشن ✓
              </span>
            </div>
            <p className="text-[10px] text-sky-700 dark:text-sky-300 font-semibold">
              مستقیم روی صفحه وایت‌برد بنویسید؛ متن در کادر زیر قابل ویرایش و درج است
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {activeTab === 'flowchart' ? (
            <button
              type="button"
              onClick={() => setActiveTab('handwriting')}
              className="px-2 py-1 rounded-lg bg-sky-600 text-white font-bold text-[10px]"
            >
              ✍️ دست‌نویس
            </button>
          ) : (
            <button
              type="button"
              data-testid="handwriting-pad-flowchart-tab"
              onClick={() => setActiveTab('flowchart')}
              title="تبدیل متن به فلوچارت"
              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px] flex items-center gap-1"
            >
              <GitBranch className="w-3 h-3" />
              <span>فلوچارت</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="خاموش کردن حالت دست‌نویسی"
            title="خاموش کردن حالت دست‌نویسی"
            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {activeTab === 'flowchart' ? (
        <div className="p-3 space-y-2.5">
          <label className="block font-bold text-slate-700 dark:text-slate-200 text-[11px]">
            مراحل فلوچارت را با «-&gt;» بنویسید تا روی تخته درج شود:
          </label>
          <textarea
            rows={2}
            value={flowchartInput}
            onChange={(e) => setFlowchartInput(e.target.value)}
            className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            placeholder="مرحله اول -> مرحله دوم -> مرحله سوم"
          />
          <div className="flex items-center gap-1 flex-wrap">
            {flowchartSpec.nodes.map((n, idx) => (
              <React.Fragment key={n.id}>
                <span className="px-2 py-0.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 font-bold text-[10px]">
                  {fmt(n.stepNumber)}. {n.label}
                </span>
                {idx < flowchartSpec.nodes.length - 1 && (
                  <span className="text-slate-400 font-bold">←</span>
                )}
              </React.Fragment>
            ))}
          </div>
          <button
            type="button"
            data-testid="stamp-flowchart-to-board-btn"
            onClick={() => {
              onStampFlowchart?.(
                flowchartSpec.title,
                flowchartSpec.nodes.map((n) => n.label)
              );
            }}
            className="w-full py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ وارد کردن فلوچارت روی صفحه</span>
          </button>
        </div>
      ) : (
        <div className="p-3 space-y-2.5">
          {/* 1. Language & Character Mode Strip */}
          <div className="flex items-center justify-between gap-1 flex-wrap">
            <div className="flex items-center gap-1 flex-wrap">
              {(
                [
                  { id: 'all', label: 'فارسی و اعداد (هوشمند)' },
                  { id: 'fa-digits', label: 'اعداد فارسی' },
                  { id: 'fa-text', label: 'حروف و کلمات فارسی' },
                  { id: 'en-digits', label: '0-9' },
                  { id: 'en-text', label: 'A-Z' },
                  { id: 'symbols', label: '+ = ÷' },
                ] as Array<{ id: HandwritingRecognitionMode; label: string }>
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  data-testid={`hw-mode-${m.id}`}
                  onClick={() => setMode(m.id)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all ${
                    mode === m.id
                      ? 'bg-sky-600 text-white border-sky-500 shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-400'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Editable Recognized Text Box + Direct Insert Button */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Edit3 className="w-3 h-3 text-sky-500" />
                <span>متن شناسایی‌شده (قابل ویرایش مستقیم در کادر):</span>
              </span>
              {activeStrokes.length > 0 && (
                <span className="text-emerald-600 dark:text-emerald-400">
                  {fmt(activeStrokes.length)} خط روی تخته · دقت:{' '}
                  {fmt(recognition.bestConfidence)}٪
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="text"
                data-testid="gboard-composed-input"
                value={editableDisplayValue}
                onChange={(e) => {
                  // When user edits the input directly, commit their edit and clear raw pending strokes
                  setCommittedText(e.target.value);
                  handleClearAllInk();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleStampComposedToBoard();
                  }
                }}
                placeholder="روی صفحه وایت‌برد بنویسید یا اینجا تایپ/ویرایش کنید..."
                className="flex-1 px-3 py-2 rounded-xl bg-sky-50/60 dark:bg-slate-800 border-2 border-sky-500/50 focus:border-sky-600 text-sm font-extrabold text-slate-900 dark:text-slate-100 outline-none"
              />
              <button
                type="button"
                data-testid="gboard-stamp-to-board-btn"
                onClick={handleStampComposedToBoard}
                disabled={!editableDisplayValue.trim()}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-extrabold text-xs flex items-center gap-1 shadow-md shrink-0 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>وارد کردن روی صفحه</span>
              </button>
            </div>
          </div>

          {/* 3. Live Character Candidates & Suggested Words (کلمات پیشنهادی) */}
          <div
            data-testid="gboard-candidate-bar"
            className="p-2 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 space-y-1.5"
          >
            {/* Row A: Recognized Alternatives */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <span className="text-[10px] font-bold text-slate-500 shrink-0">
                تشخیص‌ها:
              </span>
              {recognition.candidates.length > 0 ? (
                recognition.candidates.slice(0, 6).map((cand, idx) => (
                  <button
                    key={`${cand.text}-${idx}`}
                    type="button"
                    data-testid={`gboard-candidate-${idx}`}
                    onClick={() => handleSelectCandidate(cand.text)}
                    className={`px-2.5 py-1 rounded-lg font-extrabold text-xs flex items-center gap-1 shrink-0 transition-colors ${
                      idx === 0
                        ? 'bg-sky-600 text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-900 hover:bg-sky-500/15 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <span>{cand.text}</span>
                    <span className="text-[9px] opacity-75">{fmt(cand.confidence)}٪</span>
                  </button>
                ))
              ) : (
                <span className="text-[10px] text-slate-400">
                  با ماوس یا قلم روی صفحه وایت‌برد بنویسید تا حروف و اعداد شناسایی شوند...
                </span>
              )}
            </div>

            {/* Row B: Suggested Complete Words (کلمه پیشنهادی) */}
            <div className="flex items-center gap-1 overflow-x-auto pt-1 border-t border-slate-200/70 dark:border-slate-700/70">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                کلمه پیشنهادی:
              </span>
              {recognition.wordCompletions.map((word) => (
                <button
                  key={word}
                  type="button"
                  onClick={() => handleSelectSuggestedWord(word)}
                  className="px-2 py-0.5 rounded-md bg-emerald-500/15 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] shrink-0 transition-colors"
                >
                  {word}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Action Buttons: Clear Board Ink, Undo Stroke, Space, Backspace, Toggle Mini-Pad */}
          <div className="flex items-center justify-between gap-1 flex-wrap">
            <div className="flex items-center gap-1">
              <button
                type="button"
                data-testid="clear-handwriting-ink-btn"
                onClick={() => {
                  handleClearAllInk();
                  setCommittedText('');
                }}
                className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 font-bold text-[10px] flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>پاک کردن</span>
              </button>
              <button
                type="button"
                onClick={handleUndoLastInk}
                disabled={activeStrokes.length === 0}
                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center gap-1 disabled:opacity-40"
              >
                <RotateCcw className="w-3 h-3" />
                <span>واگرد خط</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCommittedText(`${editableDisplayValue} `);
                  handleClearAllInk();
                }}
                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center gap-1"
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
                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center gap-1"
              >
                <Delete className="w-3 h-3" />
                <span>حذف حرف</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowMiniPadCanvas((v) => !v)}
              className="px-2 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 font-bold text-[10px] flex items-center gap-1"
            >
              <span>{showMiniPadCanvas ? 'بستن پد کوچک' : 'پد کوچک / نمونه'}</span>
              {showMiniPadCanvas ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronUp className="w-3 h-3" />
              )}
            </button>
          </div>

          {/* 5. Optional Collapsible Mini-Pad & Quick Test Gestures */}
          {showMiniPadCanvas && (
            <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800">
              <div className="relative rounded-xl border-2 border-dashed border-sky-500/35 bg-slate-50/90 dark:bg-slate-950/80 overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={420}
                  height={130}
                  data-testid="gboard-ink-canvas"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  className="w-full h-28 cursor-crosshair touch-none block"
                />
              </div>

              <div className="flex items-center justify-between gap-1 flex-wrap">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-bold">نمونه آماده:</span>
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
                    <span>صاف‌ساز: {beautifierActive ? 'روشن' : 'خاموش'}</span>
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
