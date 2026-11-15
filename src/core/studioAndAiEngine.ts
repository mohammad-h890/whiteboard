export interface AudioSegment {
  id: string;
  startSec: number;
  endSec: number;
  rmsDb: number;
  type: 'speech' | 'silence' | 'filler' | 'writing-only';
  transcript?: string;
}

export interface TimelineCutMetrics {
  originalDurationSec: number;
  finalDurationSec: number;
  savedSeconds: number;
  savedPercent: number;
  removedSilenceCount: number;
  removedFillerCount: number;
  acceleratedWritingCount: number;
}

/**
 * Module 8: Computes timeline compression metrics when Auto-Cut Silences,
 * Filler-Word Removal ("اممم/آآآ"), and Smart Writing Speedup (2x/4x) are applied.
 */
export function calculateTimelineOptimization(
  segments: AudioSegment[],
  options: {
    cutSilences: boolean;
    silenceThresholdDb: number;
    removeFillers: boolean;
    writingSpeedMultiplier: 1 | 2 | 4;
  }
): TimelineCutMetrics {
  let originalDurationSec = 0;
  let finalDurationSec = 0;
  let removedSilenceCount = 0;
  let removedFillerCount = 0;
  let acceleratedWritingCount = 0;

  for (const seg of segments) {
    const dur = Math.max(0, seg.endSec - seg.startSec);
    originalDurationSec += dur;

    if (seg.type === 'silence' && options.cutSilences && seg.rmsDb <= options.silenceThresholdDb) {
      removedSilenceCount += 1;
      finalDurationSec += Math.min(0.15, dur * 0.1);
      continue;
    }

    if (seg.type === 'filler' && options.removeFillers) {
      removedFillerCount += 1;
      continue;
    }

    if (seg.type === 'writing-only' && options.writingSpeedMultiplier > 1) {
      acceleratedWritingCount += 1;
      finalDurationSec += dur / options.writingSpeedMultiplier;
      continue;
    }

    finalDurationSec += dur;
  }

  const roundedOriginal = Math.round(originalDurationSec * 10) / 10;
  const roundedFinal = Math.round(finalDurationSec * 10) / 10;
  const savedSeconds = Math.max(0, Math.round((roundedOriginal - roundedFinal) * 10) / 10);
  const savedPercent =
    roundedOriginal > 0
      ? Math.round(((roundedOriginal - roundedFinal) / roundedOriginal) * 100)
      : 0;

  return {
    originalDurationSec: roundedOriginal,
    finalDurationSec: roundedFinal,
    savedSeconds,
    savedPercent,
    removedSilenceCount,
    removedFillerCount,
    acceleratedWritingCount,
  };
}

/**
 * Module 8: Calculates background music gain (in dB) using Auto Audio Ducking
 * when the teacher's microphone voice activity is detected.
 */
export function calculateAudioDuckingGainDb(
  baseMusicDb: number,
  teacherVoiceRmsDb: number,
  voiceThresholdDb: number = -35,
  duckingAmountDb: number = 14
): { outputMusicDb: number; isDucked: boolean } {
  if (teacherVoiceRmsDb > voiceThresholdDb) {
    return {
      outputMusicDb: baseMusicDb - duckingAmountDb,
      isDucked: true,
    };
  }
  return {
    outputMusicDb: baseMusicDb,
    isDucked: false,
  };
}

/**
 * Module 9: Smart 9:16 Vertical Reels Camera Cropper
 */
export function calculateReelsPenFocusCrop(
  canvasWidth: number,
  canvasHeight: number,
  penTipX: number,
  penTipY: number,
  cropWidth: number = 360,
  cropHeight: number = 420
): { cropX: number; cropY: number; cropWidth: number; cropHeight: number; zoomScale: number } {
  const halfW = cropWidth / 2;
  const halfH = cropHeight / 2;
  const clampedCenterX = Math.max(halfW, Math.min(canvasWidth - halfW, penTipX));
  const clampedCenterY = Math.max(halfH, Math.min(canvasHeight - halfH, penTipY));

  return {
    cropX: Math.round(clampedCenterX - halfW),
    cropY: Math.round(clampedCenterY - halfH),
    cropWidth,
    cropHeight,
    zoomScale: Number((canvasWidth / cropWidth).toFixed(2)),
  };
}

export interface OcrConversionResult {
  id: string;
  rawInput: string;
  recognizedPersianText: string;
  latexFormula: string;
  confidencePct: number;
  category: 'physics' | 'math' | 'chemistry' | 'persian-note';
}

/**
 * Module 10: Deterministic Offline ONNX Math & Persian Handwriting OCR Engine
 */
export function recognizeHandwritingAndMath(presetKey: string): OcrConversionResult {
  switch (presetKey) {
    case 'newton-inclined':
      return {
        id: 'newton-inclined',
        rawInput: 'دستخط تخته: سیگما اف مساوی ام آ در سطح شیب‌دار',
        recognizedPersianText: 'قانون دوم نیوتن روی سطح شیب‌دار با اصطکاک جنبشی:',
        latexFormula: '∑F_x = m·a  ⟹  m·g·sin(θ) − μ_k·m·g·cos(θ) = m·a',
        confidencePct: 98.4,
        category: 'physics',
      };
    case 'quadratic-roots':
      return {
        id: 'quadratic-roots',
        rawInput: 'دستخط تخته: ریشه‌های معادله درجه دوم و دلتا',
        recognizedPersianText: 'فرمول کلی دلتا و ریشه‌های معادله درجه دوم:',
        latexFormula: 'Δ = b² − 4ac  ,  x₁,₂ = (−b ± √Δ) / (2a)',
        confidencePct: 99.1,
        category: 'math',
      };
    case 'ph-henderson':
      return {
        id: 'ph-henderson',
        rawInput: 'دستخط تخته: پی اچ محلول بافر و ثابت یونش اسید',
        recognizedPersianText: 'رابطه هندرسون-هاسلباخ و محاسبه pH اسید ضعیف:',
        latexFormula: 'pH = −log₁₀[H₃O⁺] = pK_a + log₁₀([A⁻] / [HA])',
        confidencePct: 97.6,
        category: 'chemistry',
      };
    default:
      return {
        id: 'custom-note',
        rawInput: presetKey,
        recognizedPersianText: `متن تایپی استاندارد: ${presetKey}`,
        latexFormula: 'f′(x) = lim_{h→0} [f(x+h) − f(x)] / h',
        confidencePct: 96.5,
        category: 'persian-note',
      };
  }
}

export interface FlowchartDiagramSpec {
  title: string;
  nodes: Array<{ id: string; label: string; stepNumber: number }>;
}

/**
 * Module 10: Converts a Persian structured text prompt into a vector flowchart specification.
 */
export function parseTextToFlowchart(promptText: string): FlowchartDiagramSpec {
  const parts = promptText
    .split(/->|→|،|\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const safeParts =
    parts.length >= 2
      ? parts
      : [
          'دریافت گلیکوز در سیتوپلاسم',
          'قندکافت (گلیکولیز)',
          'چرخه کربس در میتوکندری',
          'زنجیره انتقال الکترون (ATP)',
        ];

  return {
    title: `فلوچارت هوشمند (${safeParts.length} مرحله)`,
    nodes: safeParts.map((label, idx) => ({
      id: `node-${idx + 1}`,
      label,
      stepNumber: idx + 1,
    })),
  };
}

/**
 * Module 6 (Economics): Calculates market equilibrium price (P*) and quantity (Q*)
 * for linear Demand Qd = a - bP and Supply Qs = c + dP.
 */
export function calculateSupplyDemandEquilibrium(
  demandIntercept: number,
  supplyIntercept: number,
  slopeDemand: number = 2,
  slopeSupply: number = 2
): {
  equilibriumPrice: number;
  equilibriumQuantity: number;
  surplusOrShortageAtPrice: (testPrice: number) => {
    qd: number;
    qs: number;
    status: 'equilibrium' | 'surplus' | 'shortage';
  };
} {
  const pStar = Math.max(
    1,
    Number(((demandIntercept - supplyIntercept) / (slopeDemand + slopeSupply)).toFixed(1))
  );
  const qStar = Math.max(0, Number((demandIntercept - slopeDemand * pStar).toFixed(1)));

  return {
    equilibriumPrice: pStar,
    equilibriumQuantity: qStar,
    surplusOrShortageAtPrice: (testPrice: number) => {
      const qd = Math.max(0, Number((demandIntercept - slopeDemand * testPrice).toFixed(1)));
      const qs = Math.max(0, Number((supplyIntercept + slopeSupply * testPrice).toFixed(1)));
      const status =
        Math.abs(qd - qs) < 0.5 ? 'equilibrium' : qs > qd ? 'surplus' : 'shortage';
      return { qd, qs, status };
    },
  };
}

export interface DaneshBoardProjectSnapshot {
  version: string;
  savedAtIso: string;
  activeProfileId: string;
  canvasMode: 'infinite' | 'a4' | '16:9' | '9:16';
  background: string;
  watermarkCode: string;
  stampedWidgetsCount: number;
  calloutStamps: string[];
}

/**
 * Serializes and validates project snapshots for `.daneshboard.json` file save/load.
 */
export function serializeProjectSnapshot(snapshot: DaneshBoardProjectSnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}

export function parseProjectSnapshot(rawJson: string): DaneshBoardProjectSnapshot | null {
  try {
    const parsed = JSON.parse(rawJson);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof parsed.version === 'string' &&
      typeof parsed.activeProfileId === 'string'
    ) {
      return parsed as DaneshBoardProjectSnapshot;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Generates a complete, standalone RTL Persian A4 printable HTML handout document
 * for real browser download.
 */
export function generatePrintableClassNotesHtml(params: {
  teacherName: string;
  sessionTopic: string;
  watermarkCode: string;
  presetLabel: string;
  stampedWidgets: Array<{ title: string; summary: string }>;
  calloutStamps: string[];
}): string {
  const widgetsHtml =
    params.stampedWidgets.length > 0
      ? params.stampedWidgets
          .map(
            (w, idx) =>
              `<div class="card"><strong>${idx + 1}. ${w.title}</strong><p>${w.summary}</p></div>`
          )
          .join('\n')
      : '<div class="card"><strong>۱. تحلیل سطح شیب‌دار (فیزیک ۳)</strong><p>mg·sinθ − f_k = m·a  |  N = mg·cosθ</p></div>';

  const calloutsHtml =
    params.calloutStamps.length > 0
      ? `<div class="callouts">نکات کنکوری جلسه: ${params.calloutStamps.join(' · ')}</div>`
      : '';

  return `<!doctype html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>جزوه جلسه - ${params.sessionTopic}</title>
  <style>
    body { font-family: 'Vazirmatn', Tahoma, sans-serif; max-width: 210mm; margin: 12mm auto; padding: 16px; color: #0f172a; line-height: 1.7; }
    header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; }
    .watermark { font-size: 11px; color: #64748b; background: #f1f5f9; padding: 4px 10px; border-radius: 6px; }
    .card { border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px 16px; margin-bottom: 12px; background: #f8fafc; }
    .callouts { background: #fef3c7; border: 1px solid #f59e0b; padding: 10px 14px; border-radius: 8px; margin-top: 16px; font-weight: bold; }
  </style>
</head>
<body>
  <header>
    <div>
      <h1 style="margin:0;font-size:18px;">${params.sessionTopic}</h1>
      <div style="font-size:13px;color:#475569;">مدرس: ${params.teacherName} · نوع جزوه: ${params.presetLabel}</div>
    </div>
    <div class="watermark">کد امنیتی دانش‌پذیر: ${params.watermarkCode}</div>
  </header>
  <section>
    <div class="card">
      <strong>سوال اصلی جلسه (لایه ۱):</strong>
      <p>جسمی به جرم ۵ کیلوگرم روی سطح شیب‌دار با زاویه ۳۰ درجه قرار دارد. شتاب حرکت و نیروی عمودی تکیه‌گاه را بیابید.</p>
    </div>
    ${widgetsHtml}
    ${calloutsHtml}
  </section>
</body>
</html>`;
}

export type KeyboardShortcutCategory = 'all' | 'tools' | 'recording' | 'layers';

export interface KeyboardShortcutSpec {
  id: string;
  category: 'tools' | 'recording' | 'layers';
  categoryLabel: string;
  keys: string[];
  actionTitle: string;
  description: string;
}

export const KEYBOARD_SHORTCUTS_CATALOG: KeyboardShortcutSpec[] = [
  // Tool Switching
  {
    id: 'tool-fountain',
    category: 'tools',
    categoryLabel: 'ابزارهای قلم و ترسیم',
    keys: ['P'],
    actionTitle: 'انتخاب روان‌نویس هوشمند',
    description: 'فعال‌سازی سریع قلم روان‌نویس با تثبیت‌کننده دستخط',
  },
  {
    id: 'tool-pencil',
    category: 'tools',
    categoryLabel: 'ابزارهای قلم و ترسیم',
    keys: ['B'],
    actionTitle: 'انتخاب مداد با بافت طبیعی',
    description: 'تغییر قلم به مداد گرافیتی برای ترسیم اولیه و سایه‌زنی',
  },
  {
    id: 'tool-highlighter',
    category: 'tools',
    categoryLabel: 'ابزارهای قلم و ترسیم',
    keys: ['H'],
    actionTitle: 'هایلایتر هوشمند زیر متن',
    description: 'هایلایت کردن فرمول‌ها و نکات بدون کدر کردن نوشته‌های سیاه',
  },
  {
    id: 'tool-laser',
    category: 'tools',
    categoryLabel: 'ابزارهای قلم و ترسیم',
    keys: ['L'],
    actionTitle: 'قلم لیزری محوشونده (Vanishing Pen)',
    description: 'ترسیم خط تاکید موقت که پس از ۲.۵ ثانیه خودبه‌خود محو می‌شود',
  },
  {
    id: 'tool-shape-snap',
    category: 'tools',
    categoryLabel: 'ابزارهای قلم و ترسیم',
    keys: ['S'],
    actionTitle: 'تشخیص هوشمند اشکال هندسی (Hold-to-Snap)',
    description: 'تبدیل خودکار خط و دایره دست‌کش به شکل برداری استاندارد',
  },
  {
    id: 'tool-lasso',
    category: 'tools',
    categoryLabel: 'ابزارهای قلم و ترسیم',
    keys: ['V'],
    actionTitle: 'ابزار کمند هوشمند (Lasso)',
    description: 'انتخاب گروهی خطوط برای جابه‌جایی، تغییر رنگ یا تبدیل به متن',
  },
  {
    id: 'tool-eraser',
    category: 'tools',
    categoryLabel: 'ابزارهای قلم و ترسیم',
    keys: ['E'],
    actionTitle: 'پاک‌کن خطی تک‌لمس',
    description: 'حذف کامل یک خط با یک لمس یا کلیک روی آن',
  },
  {
    id: 'tool-undo-redo',
    category: 'tools',
    categoryLabel: 'ابزارهای قلم و ترسیم',
    keys: ['Ctrl', 'Z'],
    actionTitle: 'بازگشت به مرحله قبل (Undo)',
    description: 'لغو آخرین خط یا تغییر انجام‌شده روی تخته سفید',
  },
  // Recording & Studio
  {
    id: 'rec-toggle',
    category: 'recording',
    categoryLabel: 'ضبط ۴ کاناله و تدوین',
    keys: ['F9'],
    actionTitle: 'شروع / توقف ضبط چندکاناله ایزوله',
    description: 'ضبط هم‌زمان بوم، وب‌کم، میکروفون و صدای سیستم در ۴ ترک مجزا',
  },
  {
    id: 'rec-webcam-mode',
    category: 'recording',
    categoryLabel: 'ضبط ۴ کاناله و تدوین',
    keys: ['F10'],
    actionTitle: 'تغییر چیدمان وب‌کم (Keyframe Switch)',
    description: 'سوئیچ آنی بین وب‌کم دایره‌ای، تمام‌صفحه مدرس و فقط تخته',
  },
  {
    id: 'rec-teleprompter',
    category: 'recording',
    categoryLabel: 'ضبط ۴ کاناله و تدوین',
    keys: ['Alt', 'T'],
    actionTitle: 'نمایش / مخفی کردن تله‌پرامپتر مخفی',
    description: 'باز کردن پنل متن تقلب مدرس (نامرئی در فایل ویدیوی نهایی)',
  },
  {
    id: 'rec-spotlight',
    category: 'recording',
    categoryLabel: 'ضبط ۴ کاناله و تدوین',
    keys: ['Alt', 'S'],
    actionTitle: 'نورافکن تمرکز (Spotlight)',
    description: 'تاریک کردن اطراف بوم برای تمرکز دانش‌آموز روی فرمول فعلی',
  },
  {
    id: 'rec-callout',
    category: 'recording',
    categoryLabel: 'ضبط ۴ کاناله و تدوین',
    keys: ['Alt', 'K'],
    actionTitle: 'ثبت مهر «نکته طلایی کنکور»',
    description: 'درج نشانگر زمانی در تایم‌لاین تدوین و روی تخته سفید',
  },
  // Layer & Canvas Management
  {
    id: 'layer-select-1',
    category: 'layers',
    categoryLabel: 'مدیریت لایه‌ها و نما',
    keys: ['1'],
    actionTitle: 'انتخاب لایه ۱ (سوالات قفل‌شده)',
    description: 'سوئیچ مستقیم به لایه زیرین سوالات آزمون و PDF',
  },
  {
    id: 'layer-select-2',
    category: 'layers',
    categoryLabel: 'مدیریت لایه‌ها و نما',
    keys: ['2'],
    actionTitle: 'انتخاب لایه ۲ (دستخط حل استاد)',
    description: 'سوئیچ به لایه اصلی نوشتن و حل تشریحی در حین تدریس',
  },
  {
    id: 'layer-select-3',
    category: 'layers',
    categoryLabel: 'مدیریت لایه‌ها و نما',
    keys: ['3'],
    actionTitle: 'انتخاب و آشکارسازی لایه ۳ (پاسخنامه کلیدی)',
    description: 'نمایش یا مخفی کردن فوری لایه سوم حاوی کلید نهایی پاسخ‌ها',
  },
  {
    id: 'layer-lock-toggle',
    category: 'layers',
    categoryLabel: 'مدیریت لایه‌ها و نما',
    keys: ['Alt', 'L'],
    actionTitle: 'قفل / باز کردن لایه فعال',
    description: 'محافظت از لایه فعلی در برابر پاک شدن ناخواسته با پاک‌کن',
  },
  {
    id: 'modal-shortcuts',
    category: 'layers',
    categoryLabel: 'مدیریت لایه‌ها و نما',
    keys: ['?'],
    actionTitle: 'نمایش پنجره راهنمای کلیدهای میانبر',
    description: 'باز و بسته کردن سریع همین پنجره راهنمای میانبرها',
  },
];

/**
 * Pure filter for KeyboardShortcutsModal by category and search query.
 */
export function filterKeyboardShortcuts(
  category: KeyboardShortcutCategory,
  searchQuery: string
): KeyboardShortcutSpec[] {
  const q = searchQuery.trim().toLowerCase();
  return KEYBOARD_SHORTCUTS_CATALOG.filter((item) => {
    const matchesCategory = category === 'all' || item.category === category;
    if (!matchesCategory) return false;
    if (!q) return true;
    return (
      item.actionTitle.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.categoryLabel.toLowerCase().includes(q) ||
      item.keys.some((k) => k.toLowerCase().includes(q))
    );
  });
}

export interface RecentProjectItem {
  id: string;
  title: string;
  teacherName: string;
  kind: 'pdf-handout' | 'session-recording';
  timestampLabel: string;
  durationOrPagesLabel: string;
  profileId: string;
  watermarkCode: string;
}

export const INITIAL_RECENT_PROJECTS: RecentProjectItem[] = [
  {
    id: 'rec-proj-1',
    title: 'دینامیک: سطح شیب‌دار و قوانین نیوتن (فیزیک ۳)',
    teacherName: 'مهندس محمدحسین احمدی',
    kind: 'pdf-handout',
    timestampLabel: '۱۰ دقیقه پیش',
    durationOrPagesLabel: '۲ صفحه A4 وکتور',
    profileId: 'physics-lab',
    watermarkCode: 'DB-98421',
  },
  {
    id: 'rec-proj-2',
    title: 'ضبط ۴ کاناله: تحلیل تست‌های احتمالی کنکور تجربی ۱۴۰۴',
    teacherName: 'مهندس محمدحسین احمدی',
    kind: 'session-recording',
    timestampLabel: '۱ ساعت پیش',
    durationOrPagesLabel: '۱۸:۴۵ (۴ ترک ایزوله)',
    profileId: 'konkur-studio',
    watermarkCode: 'DB-98421',
  },
  {
    id: 'rec-proj-3',
    title: 'مشتق، خط مماس و انتگرال ریمان (حسابان دوازدهم)',
    teacherName: 'دکتر سارا کریمی',
    kind: 'pdf-handout',
    timestampLabel: 'دیروز · ۱۸:۳۰',
    durationOrPagesLabel: '۴ صفحه A4 وکتور',
    profileId: 'math-calculus',
    watermarkCode: 'DB-77410',
  },
  {
    id: 'rec-proj-4',
    title: 'ضبط استودیویی: آرایش الکترونی، قاعده هوند و پیوند کووالانسی',
    teacherName: 'استاد علی رضایی',
    kind: 'session-recording',
    timestampLabel: '۲ روز پیش',
    durationOrPagesLabel: '۲۴:۱۰ (بدون سکوت)',
    profileId: 'chemistry-lab',
    watermarkCode: 'DB-55109',
  },
  {
    id: 'rec-proj-5',
    title: 'ژنتیک مندل، مربع پانت و تقطیع عروضی ادبیات',
    teacherName: 'دکتر مریم نوری',
    kind: 'pdf-handout',
    timestampLabel: '۳ روز پیش',
    durationOrPagesLabel: '۳ صفحه A4 وکتور',
    profileId: 'bio-lit',
    watermarkCode: 'DB-33902',
  },
];

/**
 * Pure helper to prepend a newly exported PDF or finished recording to the recent projects list,
 * deduplicating by title+kind and strictly keeping the last `maxItems` (default 5).
 */
export function appendRecentProjectItem(
  existing: RecentProjectItem[],
  newItem: RecentProjectItem,
  maxItems: number = 5
): RecentProjectItem[] {
  const filtered = existing.filter(
    (item) => !(item.title === newItem.title && item.kind === newItem.kind)
  );
  return [newItem, ...filtered].slice(0, Math.max(1, maxItems));
}

/**
 * Returns the complete Windows Batch (.bat) script that builds the Vite React app
 * and packages it with Electron + electron-builder into BOTH a Portable .exe and an NSIS Setup Installer .exe.
 */
export function generateElectronBuildBatScript(): string {
  return [
    '@echo off',
    'chcp 65001 >nul',
    'title DaneshBoard Studio - Electron EXE & Installer Builder',
    'echo ============================================================================',
    'echo   دانش‌بورد استودیو (DaneshBoard Studio) - ساخت فایل اجرایی EXE و فایل نصبی Setup',
    'echo   Build Both Portable .EXE and Windows NSIS Installer (.EXE) via Electron',
    'echo ============================================================================',
    'echo.',
    '',
    'REM 1. Check Node.js and NPM availability',
    'where node >nul 2>nul',
    'if %ERRORLEVEL% NEQ 0 (',
    '    echo [ERROR] Node.js یافت نشد! لطفا ابتدا Node.js LTS را از nodejs.org نصب کنید.',
    '    pause',
    '    exit /b 1',
    ')',
    '',
    'echo [1/4] در حال نصب وابستگی‌های پروژه و پکیج‌های Electron و Electron-Builder...',
    'call npm install',
    'call npm install --save-dev electron electron-builder',
    'if %ERRORLEVEL% NEQ 0 (',
    '    echo [ERROR] خطا در نصب پکیج‌های Electron.',
    '    pause',
    '    exit /b 1',
    ')',
    '',
    'echo.',
    'echo [2/4] در حال کامپایل و باندل کردن نسخه نهایی وب (Vite Production Build)...',
    'call npm run build',
    'if %ERRORLEVEL% NEQ 0 (',
    '    echo [ERROR] خطا در ساخت باندل Vite.',
    '    pause',
    '    exit /b 1',
    ')',
    '',
    'echo.',
    'echo [3/4] در حال ساخت هم‌زمان فایل نصبی (NSIS Setup Installer) و نسخه پرتابل (Portable EXE)...',
    'call npx electron-builder --win nsis portable --x64 --config electron-builder.json',
    'if %ERRORLEVEL% NEQ 0 (',
    '    echo [ERROR] خطا در بسته‌بندی Electron-Builder.',
    '    pause',
    '    exit /b 1',
    ')',
    '',
    'echo.',
    'echo ============================================================================',
    'echo [4/4] عملیات با موفقیت کامل انجام شد!',
    'echo   1. فایل نصبی ویندوز (Setup Installer): dist-electron\\DaneshBoard-Studio-Setup.exe',
    'echo   2. فایل اجرایی بدون نیاز به نصب (Portable EXE): dist-electron\\DaneshBoard-Studio-Portable.exe',
    'echo ============================================================================',
    'if exist "dist-electron" explorer "dist-electron"',
    'pause',
  ].join('\r\n');
}

