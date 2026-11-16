export interface OcrConversionResult {
  id: string;
  rawInput: string;
  recognizedPersianText: string;
  latexFormula: string;
  confidencePct: number;
  category: 'physics' | 'math' | 'chemistry' | 'persian-note';
}

/**
 * Deterministic Offline Math & Persian Handwriting OCR Preset Engine
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
 * Converts a Persian structured text prompt into a vector flowchart specification.
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
 * Economics: Calculates market equilibrium price (P*) and quantity (Q*)
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
 * for browser download.
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
      ? `<div class="callouts">نکات مهم جلسه: ${params.calloutStamps.join(' · ')}</div>`
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

export type KeyboardShortcutCategory = 'all' | 'tools' | 'layers';

export interface KeyboardShortcutSpec {
  id: string;
  category: 'tools' | 'layers';
  categoryLabel: string;
  keys: string[];
  actionTitle: string;
  description: string;
}

export const KEYBOARD_SHORTCUTS_CATALOG: KeyboardShortcutSpec[] = [
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
    actionTitle: 'تشخیص هوشمند اشکال هندسی و چندضلعی‌ها',
    description: 'تبدیل خودکار خط، دایره، بیضی، مثلث، لوزی، پنج‌ضلعی، شش‌ضلعی و هشت‌ضلعی دست‌کش به شکل استاندارد',
  },
  {
    id: 'tool-lasso',
    category: 'tools',
    categoryLabel: 'ابزارهای قلم و ترسیم',
    keys: ['V'],
    actionTitle: 'ابزار کمند انتخاب و جابه‌جایی (Lasso)',
    description: 'دور دستخط یا اشکال خط بکشید تا آن‌ها را انتخاب، جابه‌جا، کپی یا رنگ‌آمیزی کنید',
  },
  {
    id: 'tool-eraser',
    category: 'tools',
    categoryLabel: 'ابزارهای قلم و ترسیم',
    keys: ['E'],
    actionTitle: 'پاک‌کن هوشمند با سایز واقعی',
    description: 'پاک کردن نقطه‌ای یا خطی با نمایش دایره اندازه واقعی پاک‌کن',
  },
  {
    id: 'tool-undo-redo',
    category: 'tools',
    categoryLabel: 'ابزارهای قلم و ترسیم',
    keys: ['Ctrl', 'Z'],
    actionTitle: 'بازگشت به مرحله قبل (Undo)',
    description: 'لغو آخرین خط یا تغییر انجام‌شده روی تخته سفید',
  },
  {
    id: 'rec-spotlight',
    category: 'layers',
    categoryLabel: 'مدیریت لایه‌ها و نما',
    keys: ['Alt', 'S'],
    actionTitle: 'نورافکن تمرکز روی تخته (Spotlight)',
    description: 'تاریک کردن اطراف بوم برای تمرکز دانش‌آموز روی فرمول فعلی',
  },
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
  kind: 'pdf-handout';
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
    title: 'مشتق، خط مماس و انتگرال ریمان (حسابان دوازدهم)',
    teacherName: 'دکتر سارا کریمی',
    kind: 'pdf-handout',
    timestampLabel: 'دیروز · ۱۸:۳۰',
    durationOrPagesLabel: '۴ صفحه A4 وکتور',
    profileId: 'math-geometry',
    watermarkCode: 'DB-77410',
  },
  {
    id: 'rec-proj-3',
    title: 'ژنتیک مندل، مربع پانت و تقطیع عروضی ادبیات',
    teacherName: 'دکتر مریم نوری',
    kind: 'pdf-handout',
    timestampLabel: '۳ روز پیش',
    durationOrPagesLabel: '۳ صفحه A4 وکتور',
    profileId: 'bio-humanities',
    watermarkCode: 'DB-33902',
  },
];

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
