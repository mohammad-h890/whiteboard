import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Check,
  Trash2,
  RotateCcw,
  Sparkles,
  Plus,
  Delete,
  Space,
  Wand2,
  GitBranch,
  Languages,
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
  offsetY = 25,
  scale = 120
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
    label: 'عدد فارسی «۱۷»',
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
        65,
        24,
        115
      ),
      ...buildScaledStrokes(
        [
          [
            { x: 0.2, y: 0.16 },
            { x: 0.5, y: 0.88 },
            { x: 0.8, y: 0.16 },
          ],
        ],
        215,
        24,
        115
      ),
    ],
  },
  {
    id: 'sample-fa-pe',
    label: 'حرف «پ» (۳ نقطه)',
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
        130,
        20,
        125
      ),
      [
        { x: 185, y: 125 },
        { x: 187, y: 126 },
      ],
      [
        { x: 198, y: 125 },
        { x: 200, y: 126 },
      ],
      [
        { x: 192, y: 134 },
        { x: 194, y: 135 },
      ],
    ],
  },
  {
    id: 'sample-fa-gaf',
    label: 'حرف «گ» (سرکش دوگانه)',
    mode: 'fa-text',
    strokes: buildScaledStrokes(
      [
        [
          { x: 0.72, y: 0.34 },
          { x: 0.72, y: 0.76 },
          { x: 0.2, y: 0.76 },
        ],
        [
          { x: 0.88, y: 0.18 },
          { x: 0.64, y: 0.34 },
        ],
        [
          { x: 0.88, y: 0.08 },
          { x: 0.64, y: 0.24 },
        ],
      ],
      130,
      22,
      125
    ),
  },
  {
    id: 'sample-en-7',
    label: 'عدد انگلیسی «7»',
    mode: 'en-digits',
    strokes: buildScaledStrokes(
      [
        [
          { x: 0.2, y: 0.16 },
          { x: 0.5, y: 0.16 },
          { x: 0.82, y: 0.16 },
          { x: 0.6, y: 0.52 },
          { x: 0.38, y: 0.88 },
        ],
      ],
      135,
      22,
      120
    ),
  },
  {
    id: 'sample-en-L',
    label: 'حرف انگلیسی «L»',
    mode: 'en-text',
    strokes: buildScaledStrokes(
      [
        [
          { x: 0.25, y: 0.14 },
          { x: 0.25, y: 0.5 },
          { x: 0.25, y: 0.86 },
          { x: 0.52, y: 0.86 },
          { x: 0.78, y: 0.86 },
        ],
      ],
      135,
      22,
      120
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
      135,
      22,
      120
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
  onStampRecognizedText,
  onStampBeautifiedStrokes,
  onStampFlowchart,
}) => {
  const [activeTab, setActiveTab] = useState<'handwriting' | 'flowchart'>(initialTab);
  const [mode, setMode] = useState<HandwritingRecognitionMode>('all');
  const [strokes, setStrokes] = useState<HandwritingStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<HandwritingStroke>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [composedText, setComposedText] = useState<string>('');
  const [flowchartInput, setFlowchartInput] = useState<string>(
    'دریافت معادله -> محاسبه دلتا (Δ) -> بررسی علامت دلتا -> یافتن ریشه‌های x₁ و x₂'
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const recognition = React.useMemo(
    () => recognizeOfflineHandwriting(strokes, mode, composedText || 'ریا'),
    [strokes, mode, composedText]
  );

  const fmt = (val: string | number) => toPersianDigits(val, usePersianNumerals);

  // Render the Gboard-style ink pad canvas with baseline guides and active strokes
  const renderInkPad = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Subtle Gboard-style ruled guidelines
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    // Ascender line (25%), Baseline (72%)
    [h * 0.25, h * 0.72].forEach((yPos) => {
      ctx.beginPath();
      ctx.moveTo(12, yPos);
      ctx.lineTo(w - 12, yPos);
      ctx.stroke();
    });

    // Vertical character compartment guides (for multi-digit or multi-letter writing)
    [w * 0.33, w * 0.66].forEach((xPos) => {
      ctx.beginPath();
      ctx.moveTo(xPos, 12);
      ctx.lineTo(xPos, h - 12);
      ctx.stroke();
    });
    ctx.restore();

    // Draw all committed strokes + current live stroke
    const allToDraw = currentStroke.length > 0 ? [...strokes, currentStroke] : strokes;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = strokeColor || '#0284c7';
    ctx.lineWidth = 5;

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
  }, [strokes, currentStroke, strokeColor, beautifierActive]);

  useEffect(() => {
    renderInkPad();
  }, [renderInkPad]);

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
      setStrokes((prev) => [...prev, currentStroke]);
      setCurrentStroke([]);
    }
  };

  const handleAcceptCandidate = (textToInsert: string) => {
    if (!textToInsert) return;
    setComposedText((prev) => `${prev}${textToInsert}`);
    setStrokes([]);
  };

  const handleStampComposedToBoard = () => {
    const finalTxt = (composedText.trim() || recognition.bestMatch || '۱۲۵').trim();
    if (!finalTxt) return;
    const isNumber = /^[۰-۹0-9.+\-×÷=]+$/.test(finalTxt);
    onStampRecognizedText(
      finalTxt,
      isNumber ? 'persian-number' : mode === 'symbols' ? 'math-symbol' : 'text-note'
    );
    setStrokes([]);
  };

  const flowchartSpec = parseTextToFlowchart(flowchartInput);

  return (
    <div
      data-testid="offline-handwriting-pad"
      className="w-full max-w-xl rounded-2xl bg-white/98 dark:bg-slate-900/98 border-2 border-sky-500/40 shadow-2xl overflow-hidden text-xs z-50 backdrop-blur-md"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-gradient-to-l from-sky-600/15 via-indigo-600/10 to-transparent border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Languages className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                دست‌نویس هوشمند آفلاین (به سبک صفحه‌کلید گوگل Gboard)
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                ۱۰۰٪ آفلاین · دقت بالا
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              شناسایی اعداد و حروف فارسی و انگلیسی، کلمات و علائم ریاضی/نگارشی بدون نیاز به اینترنت
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('handwriting')}
            className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-colors ${
              activeTab === 'handwriting'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            ✍️ پد دست‌نویس
          </button>
          <button
            type="button"
            data-testid="handwriting-pad-flowchart-tab"
            onClick={() => setActiveTab('flowchart')}
            className={`px-2 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors ${
              activeTab === 'flowchart'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <GitBranch className="w-3 h-3" />
            <span>فلوچارت از متن</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن پد دست‌نویسی"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {activeTab === 'flowchart' ? (
        <div className="p-3.5 space-y-3">
          <div className="space-y-1">
            <label className="block font-bold text-slate-700 dark:text-slate-200 text-[11px]">
              مراحل فلوچارت را با علامت «-&gt;» یا «،» بنویسید تا نمودار مرحله‌ای روی تخته درج شود:
            </label>
            <textarea
              rows={2}
              value={flowchartInput}
              onChange={(e) => setFlowchartInput(e.target.value)}
              className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              placeholder="مرحله اول -> مرحله دوم -> مرحله سوم"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {flowchartSpec.nodes.map((n, idx) => (
              <React.Fragment key={n.id}>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 font-bold text-[11px]">
                  {fmt(n.stepNumber)}. {n.label}
                </span>
                {idx < flowchartSpec.nodes.length - 1 && (
                  <span className="text-slate-400 font-bold">←</span>
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              data-testid="stamp-flowchart-to-board-btn"
              onClick={() => {
                onStampFlowchart?.(
                  flowchartSpec.title,
                  flowchartSpec.nodes.map((n) => n.label)
                );
              }}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ درج فلوچارت روی تخته سفید</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 space-y-2.5">
          {/* Language & Character Set Mode Selector Strip */}
          <div className="flex items-center justify-between gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 flex-wrap">
              {(
                [
                  { id: 'all', label: 'همه (هوشمند)' },
                  { id: 'fa-digits', label: 'اعداد فارسی (۰-۹)' },
                  { id: 'fa-text', label: 'حروف و کلمات فارسی' },
                  { id: 'en-digits', label: 'اعداد انگلیسی (0-9)' },
                  { id: 'en-text', label: 'حروف انگلیسی (A-Z)' },
                  { id: 'symbols', label: 'نشانه‌ها و علائم (+ = √ ؟)' },
                ] as Array<{ id: HandwritingRecognitionMode; label: string }>
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  data-testid={`hw-mode-${m.id}`}
                  onClick={() => setMode(m.id)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                    mode === m.id
                      ? 'bg-sky-600 text-white border-sky-500 shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-400'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {onToggleBeautifier && (
              <button
                type="button"
                data-testid="toggle-handwriting-beautifier-btn"
                onClick={onToggleBeautifier}
                title="مرتب‌سازی و صاف کردن خودکار خمیدگی دستخط (Handwriting Beautifier)"
                className={`px-2 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 ${
                  beautifierActive
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                <Wand2 className="w-3 h-3" />
                <span>خوش‌فرم‌ساز دستخط: {beautifierActive ? 'روشن ✓' : 'خاموش'}</span>
              </button>
            )}
          </div>

          {/* Gboard-Style Top Candidate & Word Prediction Strip */}
          <div
            data-testid="gboard-candidate-bar"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 overflow-x-auto"
          >
            <span className="text-[10px] font-bold text-slate-400 shrink-0">
              پیشنهاد Gboard:
            </span>

            {recognition.bestMatch ? (
              <>
                <button
                  type="button"
                  data-testid="gboard-best-candidate"
                  onClick={() => handleAcceptCandidate(recognition.bestMatch)}
                  className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-sm flex items-center gap-1.5 shadow-2xs shrink-0"
                >
                  <span>{recognition.bestMatch}</span>
                  {recognition.candidates[0] && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-white/20 font-mono">
                      {fmt(recognition.candidates[0].confidence)}٪
                    </span>
                  )}
                </button>

                {recognition.candidates.slice(1, 5).map((cand) => (
                  <button
                    key={`${cand.text}-${cand.category}`}
                    type="button"
                    onClick={() => handleAcceptCandidate(cand.text)}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-sky-500/15 border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1 shrink-0"
                  >
                    <span>{cand.text}</span>
                    <span className="text-[9px] text-slate-400">{cand.labelFa}</span>
                  </button>
                ))}
              </>
            ) : (
              <span className="text-[11px] text-slate-400">
                روی پد زیر با موس یا قلم بنویسید (یا از دکمه‌های تست سریع زیر استفاده کنید)...
              </span>
            )}

            {/* Offline Dictionary Word Completions */}
            {recognition.wordCompletions.slice(0, 4).map((word) => (
              <button
                key={word}
                type="button"
                onClick={() => {
                  setComposedText(word);
                  setStrokes([]);
                }}
                className="px-2 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] shrink-0"
              >
                {word}
              </button>
            ))}
          </div>

          {/* Composed Text Box + Direct Stamp to Whiteboard */}
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              data-testid="gboard-composed-input"
              value={composedText}
              onChange={(e) => setComposedText(e.target.value)}
              placeholder={
                recognition.bestMatch
                  ? `تشخیص فعلی: «${recognition.bestMatch}» (کلیک روی + درج در تخته)`
                  : 'متن یا عدد تشخیص‌داده‌شده در اینجا جمع می‌شود...'
              }
              className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-extrabold text-slate-900 dark:text-slate-100"
            />
            {recognition.bestMatch && (
              <button
                type="button"
                data-testid="gboard-append-current-btn"
                onClick={() => handleAcceptCandidate(recognition.bestMatch)}
                title="افزودن حرف/عدد فعلی به ادامه متن"
                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
                <span>افزودن «{recognition.bestMatch}»</span>
              </button>
            )}
            <button
              type="button"
              data-testid="gboard-stamp-to-board-btn"
              onClick={handleStampComposedToBoard}
              className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs flex items-center gap-1 shadow-sm shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ درج روی تخته سفید</span>
            </button>
          </div>

          {/* Interactive Gboard Multi-Stroke Writing Canvas */}
          <div className="relative rounded-xl border-2 border-dashed border-sky-500/35 bg-slate-50/90 dark:bg-slate-950/80 overflow-hidden">
            <canvas
              ref={canvasRef}
              width={480}
              height={165}
              data-testid="gboard-ink-canvas"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="w-full h-36 cursor-crosshair touch-none block"
            />
            <div className="absolute top-1.5 left-2 pointer-events-none flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded bg-slate-900/75 text-white text-[10px] font-bold">
                {strokes.length === 0
                  ? 'بوم دست‌نویس (چندحرفی / نقطه‌گذاری آزاد)'
                  : `${fmt(strokes.length)} خط ترسیم شد · تشخیص زنده: ${recognition.bestMatch}`}
              </span>
            </div>
          </div>

          {/* Gboard Bottom Control Keys + Quick Sample Presets */}
          <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setStrokes([]);
                  setCurrentStroke([]);
                }}
                className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 font-bold text-[10px] flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>پاک کردن پد</span>
              </button>
              <button
                type="button"
                onClick={() => setStrokes((prev) => prev.slice(0, -1))}
                disabled={strokes.length === 0}
                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center gap-1 disabled:opacity-40"
              >
                <RotateCcw className="w-3 h-3" />
                <span>حذف آخرین خط</span>
              </button>
              <button
                type="button"
                onClick={() => setComposedText((prev) => `${prev} `)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center gap-1"
              >
                <Space className="w-3 h-3" />
                <span>فاصله</span>
              </button>
              <button
                type="button"
                onClick={() => setComposedText((prev) => prev.slice(0, -1))}
                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center gap-1"
              >
                <Delete className="w-3 h-3" />
                <span>حذف حرف</span>
              </button>
              {strokes.length > 0 && onStampBeautifiedStrokes && (
                <button
                  type="button"
                  onClick={() => {
                    onStampBeautifiedStrokes(strokes);
                    setStrokes([]);
                  }}
                  className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 font-bold text-[10px] flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>انتقال دستخط صاف به بوم</span>
                </button>
              )}
            </div>

            {/* 1-Click Offline Recognition Accuracy Test Samples */}
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[10px] text-slate-400 font-bold">تست سریع:</span>
              {SAMPLE_GESTURES.map((smp) => (
                <button
                  key={smp.id}
                  type="button"
                  data-testid={`hw-sample-${smp.id}`}
                  onClick={() => {
                    setMode(smp.mode);
                    setStrokes(smp.strokes);
                  }}
                  className="px-1.5 py-0.5 rounded bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/25 text-sky-700 dark:text-sky-300 text-[10px] font-bold"
                >
                  {smp.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
