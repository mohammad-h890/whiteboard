import { Point2D } from './canvasAndMathEngine';

export type HandwritingStroke = Point2D[];

export type HandwritingRecognitionMode = 'all' | 'fa-digits' | 'en-digits' | 'symbols';

export interface HandwritingCandidate {
  text: string;
  labelFa: string;
  category: 'fa-digit' | 'en-digit' | 'symbol' | 'expression';
  confidence: number; // 0..100
}

export interface HandwritingRecognitionOutput {
  bestMatch: string;
  bestConfidence: number;
  candidates: HandwritingCandidate[];
  clusterCount: number;
}

export interface LearnedHandwritingSample {
  id: string;
  char: string;
  category: 'fa-digit' | 'en-digit' | 'symbol';
  normPts: Point2D[];
  aspect: number;
  dots: number;
  dotPos: 'none' | 'above' | 'below' | 'both';
  bars: number;
  isClosed: boolean;
  hitCount: number;
  lastUsedAt: number;
}

export interface OfflineHandwritingModelState {
  version: 1;
  totalFeedbackCount: number;
  prototypes: LearnedHandwritingSample[];
}

export const MAX_LEARNED_PROTOTYPES_PER_CHAR = 3;
export const MAX_TOTAL_LEARNED_PROTOTYPES = 72;
const LEARNED_MODEL_STORAGE_KEY = 'daneshboard_hw_learned_prototypes_v1';

interface PrototypeSpec {
  char: string;
  labelFa: string;
  category: 'fa-digit' | 'en-digit' | 'symbol';
  basePath: Point2D[];
  dots: number;
  dotPos: 'none' | 'above' | 'below' | 'both';
  bars: number;
  aspectRange: [number, number];
  isClosedLoop?: boolean;
}

function pts(coords: Array<[number, number]>): Point2D[] {
  return coords.map(([x, y]) => ({ x, y }));
}

function makeCircleProto(cx = 50, cy = 50, rx = 38, ry = 38, steps = 28): Point2D[] {
  const out: Point2D[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / steps;
    out.push({ x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) });
  }
  return out;
}

/**
 * Lightweight Offline Prototype Database strictly for:
 * - Persian digits (۰-۹)
 * - English digits (0-9)
 * - Math & Punctuation symbols (+ − × ÷ = √ > < ( ) / % ؟ ? ! .)
 */
const HANDWRITING_PROTOTYPES: PrototypeSpec[] = [
  // ==================== PERSIAN DIGITS (۰-۹) ====================
  {
    char: '۰',
    labelFa: 'عدد صفر فارسی (۰)',
    category: 'fa-digit',
    basePath: makeCircleProto(50, 50, 26, 26),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.5, 1.8],
    isClosedLoop: true,
  },
  {
    char: '۱',
    labelFa: 'عدد یک فارسی (۱)',
    category: 'fa-digit',
    basePath: pts([
      [50, 10],
      [50, 50],
      [50, 90],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.02, 0.42],
  },
  {
    char: '۲',
    labelFa: 'عدد دو فارسی (۲)',
    category: 'fa-digit',
    basePath: pts([
      [82, 16],
      [66, 38],
      [48, 20],
      [46, 55],
      [46, 92],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.35, 1.3],
  },
  {
    char: '۲',
    labelFa: 'عدد دو فارسی (۲)',
    category: 'fa-digit',
    basePath: pts([
      [25, 20],
      [52, 42],
      [78, 18],
      [52, 46],
      [52, 92],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.35, 1.3],
  },
  {
    char: '۲',
    labelFa: 'عدد دو فارسی دست‌نویس روان (۲)',
    category: 'fa-digit',
    basePath: pts([
      [84, 18],
      [62, 34],
      [34, 30],
      [36, 62],
      [38, 92],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.32, 1.35],
  },
  {
    char: '۳',
    labelFa: 'عدد سه فارسی (۳)',
    category: 'fa-digit',
    basePath: pts([
      [88, 18],
      [74, 38],
      [62, 18],
      [48, 38],
      [34, 18],
      [34, 58],
      [34, 92],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.45, 1.5],
  },
  {
    char: '۴',
    labelFa: 'عدد چهار فارسی (۴)',
    category: 'fa-digit',
    basePath: pts([
      [75, 22],
      [42, 22],
      [68, 48],
      [35, 48],
      [35, 92],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.38, 1.35],
  },
  {
    char: '۴',
    labelFa: 'عدد چهار فارسی دست‌نویس (۴)',
    category: 'fa-digit',
    basePath: pts([
      [35, 12],
      [35, 90],
      [35, 48],
      [75, 24],
      [50, 48],
      [78, 52],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.38, 1.35],
  },
  {
    char: '۵',
    labelFa: 'عدد پنج فارسی (۵)',
    category: 'fa-digit',
    basePath: pts([
      [50, 14],
      [22, 48],
      [18, 78],
      [38, 90],
      [50, 68],
      [62, 90],
      [82, 78],
      [78, 48],
      [50, 14],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.55, 1.5],
    isClosedLoop: true,
  },
  {
    char: '۶',
    labelFa: 'عدد شش فارسی (۶)',
    category: 'fa-digit',
    basePath: pts([
      [74, 24],
      [38, 34],
      [30, 52],
      [68, 48],
      [42, 72],
      [28, 92],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.38, 1.3],
  },
  {
    char: '۷',
    labelFa: 'عدد هفت فارسی (۷)',
    category: 'fa-digit',
    basePath: pts([
      [18, 16],
      [50, 88],
      [82, 16],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.45, 1.65],
  },
  {
    char: '۸',
    labelFa: 'عدد هشت فارسی (۸)',
    category: 'fa-digit',
    basePath: pts([
      [18, 86],
      [50, 14],
      [82, 86],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.45, 1.65],
  },
  {
    char: '۹',
    labelFa: 'عدد نه فارسی (۹)',
    category: 'fa-digit',
    basePath: pts([
      [66, 38],
      [45, 16],
      [24, 32],
      [38, 52],
      [66, 38],
      [66, 92],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.35, 1.2],
  },

  // ==================== ENGLISH DIGITS (0-9) ====================
  {
    char: '0',
    labelFa: 'عدد صفر انگلیسی (0)',
    category: 'en-digit',
    basePath: makeCircleProto(50, 50, 32, 42),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.45, 1.25],
    isClosedLoop: true,
  },
  {
    char: '1',
    labelFa: 'عدد یک انگلیسی (1)',
    category: 'en-digit',
    basePath: pts([
      [35, 24],
      [52, 10],
      [52, 90],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.02, 0.55],
  },
  {
    char: '1',
    labelFa: 'عدد یک انگلیسی ساده (1)',
    category: 'en-digit',
    basePath: pts([
      [50, 10],
      [50, 50],
      [50, 90],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.02, 0.42],
  },
  {
    char: '2',
    labelFa: 'عدد دو انگلیسی (2)',
    category: 'en-digit',
    basePath: pts([
      [22, 28],
      [48, 12],
      [76, 26],
      [70, 48],
      [20, 88],
      [82, 88],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.45, 1.35],
  },
  {
    char: '3',
    labelFa: 'عدد سه انگلیسی (3)',
    category: 'en-digit',
    basePath: pts([
      [24, 20],
      [68, 14],
      [76, 34],
      [44, 50],
      [78, 68],
      [66, 88],
      [22, 84],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.4, 1.25],
  },
  {
    char: '4',
    labelFa: 'عدد چهار انگلیسی (4)',
    category: 'en-digit',
    basePath: pts([
      [64, 14],
      [20, 64],
      [82, 64],
      [64, 64],
      [64, 92],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.45, 1.35],
  },
  {
    char: '5',
    labelFa: 'عدد پنج انگلیسی (5)',
    category: 'en-digit',
    basePath: pts([
      [76, 14],
      [28, 14],
      [24, 48],
      [68, 48],
      [78, 70],
      [58, 90],
      [22, 84],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.42, 1.3],
  },
  {
    char: '6',
    labelFa: 'عدد شش انگلیسی (6)',
    category: 'en-digit',
    basePath: pts([
      [68, 14],
      [34, 40],
      [24, 72],
      [48, 90],
      [74, 74],
      [64, 52],
      [28, 58],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.42, 1.25],
  },
  {
    char: '7',
    labelFa: 'عدد هفت انگلیسی (7)',
    category: 'en-digit',
    basePath: pts([
      [18, 16],
      [82, 16],
      [38, 90],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.42, 1.35],
  },
  {
    char: '8',
    labelFa: 'عدد هشت انگلیسی (8)',
    category: 'en-digit',
    basePath: pts([
      [50, 12],
      [26, 28],
      [50, 50],
      [76, 72],
      [50, 90],
      [24, 72],
      [50, 50],
      [74, 28],
      [50, 12],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.4, 1.2],
    isClosedLoop: true,
  },
  {
    char: '9',
    labelFa: 'عدد نه انگلیسی (9)',
    category: 'en-digit',
    basePath: pts([
      [72, 36],
      [48, 14],
      [24, 32],
      [44, 52],
      [72, 36],
      [64, 90],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.38, 1.2],
  },

  // ==================== MATH & PUNCTUATION SYMBOLS ====================
  {
    char: '−',
    labelFa: 'علامت منفی (−)',
    category: 'symbol',
    basePath: pts([
      [12, 50],
      [88, 50],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [2.4, 25],
  },
  {
    char: '+',
    labelFa: 'علامت جمع (+)',
    category: 'symbol',
    basePath: pts([
      [50, 14],
      [50, 86],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 1,
    aspectRange: [0.02, 25],
  },
  {
    char: '+',
    labelFa: 'علامت جمع (+)',
    category: 'symbol',
    basePath: pts([
      [14, 50],
      [86, 50],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 1,
    aspectRange: [0.02, 25],
  },
  {
    char: '×',
    labelFa: 'علامت ضرب (×)',
    category: 'symbol',
    basePath: pts([
      [18, 18],
      [82, 82],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 1,
    aspectRange: [0.45, 1.85],
  },
  {
    char: '×',
    labelFa: 'علامت ضرب (×)',
    category: 'symbol',
    basePath: pts([
      [82, 18],
      [18, 82],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 1,
    aspectRange: [0.45, 1.85],
  },
  {
    char: '=',
    labelFa: 'علامت مساوی (=)',
    category: 'symbol',
    basePath: pts([
      [14, 38],
      [86, 38],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 1,
    aspectRange: [1.2, 25.0],
  },
  {
    char: '÷',
    labelFa: 'علامت تقسیم (÷)',
    category: 'symbol',
    basePath: pts([
      [14, 50],
      [86, 50],
    ]),
    dots: 2,
    dotPos: 'both',
    bars: 0,
    aspectRange: [1.2, 25],
  },
  {
    char: '√',
    labelFa: 'علامت رادیکال (√)',
    category: 'symbol',
    basePath: pts([
      [12, 58],
      [24, 58],
      [36, 88],
      [52, 16],
      [88, 16],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.65, 2.4],
  },
  {
    char: '>',
    labelFa: 'علامت بزرگ‌تر (>)',
    category: 'symbol',
    basePath: pts([
      [22, 18],
      [78, 50],
      [22, 82],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.45, 1.6],
  },
  {
    char: '<',
    labelFa: 'علامت کوچک‌تر (<)',
    category: 'symbol',
    basePath: pts([
      [78, 18],
      [22, 50],
      [78, 82],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.45, 1.6],
  },
  {
    char: '(',
    labelFa: 'پرانتز باز (()',
    category: 'symbol',
    basePath: pts([
      [68, 12],
      [42, 34],
      [34, 50],
      [42, 66],
      [68, 88],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.15, 0.72],
  },
  {
    char: ')',
    labelFa: 'پرانتز بسته ())',
    category: 'symbol',
    basePath: pts([
      [32, 12],
      [58, 34],
      [66, 50],
      [58, 66],
      [32, 88],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.15, 0.72],
  },
  {
    char: '/',
    labelFa: 'خط کسر / تقسیم (/)',
    category: 'symbol',
    basePath: pts([
      [78, 14],
      [50, 50],
      [22, 86],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.35, 1.3],
  },
  {
    char: '؟',
    labelFa: 'علامت سؤال فارسی (؟)',
    category: 'symbol',
    basePath: pts([
      [76, 26],
      [44, 14],
      [24, 32],
      [50, 52],
      [50, 72],
    ]),
    dots: 1,
    dotPos: 'below',
    bars: 0,
    aspectRange: [0.35, 1.2],
  },
  {
    char: '?',
    labelFa: 'علامت سؤال انگلیسی (?)',
    category: 'symbol',
    basePath: pts([
      [24, 26],
      [56, 14],
      [76, 32],
      [50, 52],
      [50, 72],
    ]),
    dots: 1,
    dotPos: 'below',
    bars: 0,
    aspectRange: [0.35, 1.2],
  },
  {
    char: '!',
    labelFa: 'علامت تعجب (!)',
    category: 'symbol',
    basePath: pts([
      [50, 12],
      [50, 68],
    ]),
    dots: 1,
    dotPos: 'below',
    bars: 0,
    aspectRange: [0.02, 0.45],
  },
];

// ==================== GEOMETRIC STROKE SMOOTHING ====================

export function removeStrokeEndpointHooks(points: Point2D[]): {
  cleaned: Point2D[];
  hooksRemoved: number;
} {
  if (points.length < 5) {
    return { cleaned: points, hooksRemoved: 0 };
  }
  let totalLen = 0;
  for (let i = 1; i < points.length; i++) {
    totalLen += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  if (totalLen < 24) {
    return { cleaned: points, hooksRemoved: 0 };
  }

  const maxHookLen = Math.min(16, totalLen * 0.11);
  let startIdx = 0;
  let endIdx = points.length - 1;
  let hooksRemoved = 0;

  const s01x = points[1].x - points[0].x;
  const s01y = points[1].y - points[0].y;
  const s12x = points[2].x - points[1].x;
  const s12y = points[2].y - points[1].y;
  const len01 = Math.hypot(s01x, s01y);
  const len12 = Math.hypot(s12x, s12y);
  if (len01 > 0.1 && len01 <= maxHookLen && len12 > 1) {
    const cosStart = (s01x * s12x + s01y * s12y) / (len01 * len12);
    if (cosStart < 0.6) {
      startIdx = 1;
      hooksRemoved++;
    }
  }

  const n = points.length;
  const e1x = points[n - 2].x - points[n - 3].x;
  const e1y = points[n - 2].y - points[n - 3].y;
  const e2x = points[n - 1].x - points[n - 2].x;
  const e2y = points[n - 1].y - points[n - 2].y;
  const lenE1 = Math.hypot(e1x, e1y);
  const lenE2 = Math.hypot(e2x, e2y);
  if (lenE2 > 0.1 && lenE2 <= maxHookLen && lenE1 > 1 && endIdx - startIdx >= 3) {
    const cosEnd = (e1x * e2x + e1y * e2y) / (lenE1 * lenE2);
    if (cosEnd < 0.6) {
      endIdx = n - 2;
      hooksRemoved++;
    }
  }

  return {
    cleaned: points.slice(startIdx, endIdx + 1),
    hooksRemoved,
  };
}

export function fitStrokeToBezierCurve(points: Point2D[]): Point2D[] {
  if (points.length <= 2) return points;
  const smoothed: Point2D[] = [{ ...points[0] }];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const segLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const steps = segLen > 14 ? 3 : segLen > 5 ? 2 : 1;
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      const x =
        0.5 *
        (2 * p1.x +
          (-p0.x + p2.x) * t +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
      const y =
        0.5 *
        (2 * p1.y +
          (-p0.y + p2.y) * t +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
      smoothed.push({ x, y });
    }
  }
  return smoothed;
}

export function normalizeHandwritingStrokeGeometry(points: Point2D[]): Point2D[] {
  if (points.length <= 2) return points;
  const { cleaned } = removeStrokeEndpointHooks(points);
  return fitStrokeToBezierCurve(cleaned);
}

// ==================== RESAMPLING, CLUSTERING & MATCHING ====================

export function resamplePath(points: Point2D[], targetCount = 32): Point2D[] {
  if (points.length === 0) return [];
  const fitted = points.length >= 4 ? normalizeHandwritingStrokeGeometry(points) : points;
  let totalLen = 0;
  for (let i = 1; i < fitted.length; i++) {
    totalLen += Math.hypot(fitted[i].x - fitted[i - 1].x, fitted[i].y - fitted[i - 1].y);
  }
  if (fitted.length === 1 || totalLen < 1e-3) {
    return Array.from({ length: targetCount }, () => ({ ...fitted[0] }));
  }

  const step = totalLen / (targetCount - 1);
  const result: Point2D[] = [{ ...fitted[0] }];
  let acc = 0;
  let prev = { ...fitted[0] };

  for (let i = 1; i < fitted.length; i++) {
    const curr = fitted[i];
    let seg = Math.hypot(curr.x - prev.x, curr.y - prev.y);
    while (acc + seg >= step && result.length < targetCount - 1) {
      const rem = step - acc;
      const t = seg === 0 ? 0 : rem / seg;
      const interp = {
        x: prev.x + t * (curr.x - prev.x),
        y: prev.y + t * (curr.y - prev.y),
      };
      result.push(interp);
      prev = interp;
      seg = Math.hypot(curr.x - prev.x, curr.y - prev.y);
      acc = 0;
    }
    acc += seg;
    prev = curr;
  }
  while (result.length < targetCount) {
    result.push({ ...fitted[fitted.length - 1] });
  }
  return result;
}

function normalizePointsToBox100(points: Point2D[]): {
  normalized: Point2D[];
  aspect: number;
  isClosed: boolean;
} {
  const resampled = resamplePath(points, 32);
  if (resampled.length === 0) {
    return { normalized: [], aspect: 1, isClosed: false };
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of resampled) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const w = Math.max(1, maxX - minX);
  const h = Math.max(1, maxY - minY);
  const aspect = Math.max(4, w) / Math.max(4, h);

  const isStraightThin = w < 10 || h < 10 || aspect < 0.22 || aspect > 4.2;
  const normalized = resampled.map((p) => {
    if (isStraightThin) {
      const scale = Math.max(w, h);
      const ox = (scale - w) / 2;
      const oy = (scale - h) / 2;
      return {
        x: ((p.x - minX + ox) / scale) * 100,
        y: ((p.y - minY + oy) / scale) * 100,
      };
    }
    return {
      x: ((p.x - minX) / w) * 100,
      y: ((p.y - minY) / h) * 100,
    };
  });

  const first = normalized[0];
  const last = normalized[normalized.length - 1];
  const endDist = Math.hypot(last.x - first.x, last.y - first.y);
  const isClosed = endDist < 34 && w > 8 && h > 8;

  return { normalized, aspect, isClosed };
}

function buildRasterZoneVector(normPts: Point2D[]): number[] {
  const zones = new Array<number>(16).fill(0);
  if (normPts.length === 0) return zones;
  for (const p of normPts) {
    const gx = Math.min(3, Math.max(0, Math.floor(p.x / 25)));
    const gy = Math.min(3, Math.max(0, Math.floor(p.y / 25)));
    zones[gy * 4 + gx] += 1;
  }
  const inv = 1 / normPts.length;
  for (let i = 0; i < 16; i++) zones[i] *= inv;
  return zones;
}

function computeZoneDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < 16; i++) {
    sum += Math.abs(a[i] - b[i]);
  }
  return sum * 28;
}

function computeDirectionalPathDist(a: Point2D[], b: Point2D[]): number {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 100;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += Math.hypot(a[i].x - b[i].x, a[i].y - b[i].y);
  }
  return sum / n;
}

function computePathSimilarityDistance(
  inputPts: Point2D[],
  protoPts: Point2D[],
  isClosedLoop: boolean
): number {
  const fwd = computeDirectionalPathDist(inputPts, protoPts);
  const rev = computeDirectionalPathDist(inputPts, [...protoPts].reverse());
  let best = Math.min(fwd, rev * 1.06);

  if (isClosedLoop && protoPts.length >= 16) {
    for (const shift of [8, 16, 24]) {
      const shifted = [...protoPts.slice(shift), ...protoPts.slice(0, shift)];
      best = Math.min(best, computeDirectionalPathDist(inputPts, shifted));
    }
  }

  const zoneDist = computeZoneDistance(
    buildRasterZoneVector(inputPts),
    buildRasterZoneVector(protoPts)
  );
  return best * 0.78 + zoneDist * 0.22;
}

interface NormalizedProto extends PrototypeSpec {
  normPts: Point2D[];
  zoneVec: number[];
}

const NORMALIZED_PROTOTYPES: NormalizedProto[] = HANDWRITING_PROTOTYPES.map((p) => {
  const normPts = normalizePointsToBox100(p.basePath).normalized;
  return {
    ...p,
    normPts,
    zoneVec: buildRasterZoneVector(normPts),
  };
});

interface RuntimeLearnedSample extends LearnedHandwritingSample {
  zoneVec: number[];
}

let cachedOfflineModel: {
  totalFeedbackCount: number;
  prototypes: RuntimeLearnedSample[];
} | null = null;

function inferCharCategory(char: string): 'fa-digit' | 'en-digit' | 'symbol' {
  if (/^[۰-۹]$/.test(char)) return 'fa-digit';
  if (/^[0-9]$/.test(char)) return 'en-digit';
  return 'symbol';
}

function getLabelForChar(char: string, category: 'fa-digit' | 'en-digit' | 'symbol'): string {
  const existing = HANDWRITING_PROTOTYPES.find((p) => p.char === char);
  if (existing) return existing.labelFa;
  if (category === 'fa-digit') return `عدد فارسی (${char})`;
  if (category === 'en-digit') return `عدد انگلیسی (${char})`;
  return `نشانه (${char})`;
}

function roundPt(p: Point2D): Point2D {
  return {
    x: Math.round(p.x * 10) / 10,
    y: Math.round(p.y * 10) / 10,
  };
}

function hydrateLearnedSample(sample: LearnedHandwritingSample): RuntimeLearnedSample {
  const roundedPts = sample.normPts.map(roundPt);
  return {
    ...sample,
    normPts: roundedPts,
    zoneVec: buildRasterZoneVector(roundedPts),
  };
}

function packPointsCompact(ptsList: Point2D[]): number[] {
  const flat: number[] = [];
  for (const p of ptsList) {
    flat.push(Math.round(p.x), Math.round(p.y));
  }
  return flat;
}

function unpackPointsCompact(raw: unknown): Point2D[] {
  if (!Array.isArray(raw) || raw.length < 4) return [];
  if (typeof raw[0] === 'number') {
    const out: Point2D[] = [];
    for (let i = 0; i + 1 < raw.length; i += 2) {
      out.push({ x: Number(raw[i]) || 0, y: Number(raw[i + 1]) || 0 });
    }
    return out;
  }
  return raw
    .filter((p): p is Point2D => Boolean(p) && typeof p === 'object' && 'x' in p && 'y' in p)
    .map((p) => roundPt({ x: Number(p.x) || 0, y: Number(p.y) || 0 }));
}

function readOfflineModelFromStorage(): {
  totalFeedbackCount: number;
  prototypes: RuntimeLearnedSample[];
} {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { totalFeedbackCount: 0, prototypes: [] };
  }
  try {
    const raw = window.localStorage.getItem(LEARNED_MODEL_STORAGE_KEY);
    if (!raw) return { totalFeedbackCount: 0, prototypes: [] };
    const parsed = JSON.parse(raw) as {
      totalFeedbackCount?: number;
      prototypes?: Array<Record<string, unknown>>;
    };
    if (!parsed || !Array.isArray(parsed.prototypes)) {
      return { totalFeedbackCount: 0, prototypes: [] };
    }
    const valid: RuntimeLearnedSample[] = [];
    for (const item of parsed.prototypes.slice(0, MAX_TOTAL_LEARNED_PROTOTYPES)) {
      if (!item || typeof item.char !== 'string' || item.char.length === 0) continue;
      const ptsDecoded = unpackPointsCompact(item.pts ?? item.normPts);
      if (ptsDecoded.length < 4) continue;
      const category = inferCharCategory(item.char);
      valid.push(
        hydrateLearnedSample({
          id: typeof item.id === 'string' ? item.id : `lp-${item.char}-${valid.length}`,
          char: item.char,
          category,
          normPts: ptsDecoded,
          aspect: typeof item.aspect === 'number' ? item.aspect : 1,
          dots: typeof item.dots === 'number' ? item.dots : 0,
          dotPos:
            item.dotPos === 'above' || item.dotPos === 'below' || item.dotPos === 'both'
              ? item.dotPos
              : 'none',
          bars: typeof item.bars === 'number' ? item.bars : 0,
          isClosed: Boolean(item.isClosed),
          hitCount: typeof item.hitCount === 'number' && item.hitCount >= 1 ? item.hitCount : 1,
          lastUsedAt: typeof item.lastUsedAt === 'number' ? item.lastUsedAt : Date.now(),
        })
      );
    }
    return {
      totalFeedbackCount:
        typeof parsed.totalFeedbackCount === 'number' && parsed.totalFeedbackCount >= valid.length
          ? parsed.totalFeedbackCount
          : valid.length,
      prototypes: valid,
    };
  } catch {
    return { totalFeedbackCount: 0, prototypes: [] };
  }
}

export function serializeOfflineHandwritingModel(state: OfflineHandwritingModelState): string {
  return JSON.stringify({
    v: 1,
    totalFeedbackCount: state.totalFeedbackCount,
    prototypes: state.prototypes.slice(0, MAX_TOTAL_LEARNED_PROTOTYPES).map((p) => ({
      char: p.char,
      pts: packPointsCompact(p.normPts),
      aspect: Math.round(p.aspect * 100) / 100,
      dots: p.dots,
      dotPos: p.dotPos,
      bars: p.bars,
      isClosed: p.isClosed ? 1 : 0,
      hitCount: p.hitCount,
      lastUsedAt: p.lastUsedAt,
    })),
  });
}

function persistOfflineModelToStorage(state: {
  totalFeedbackCount: number;
  prototypes: RuntimeLearnedSample[];
}): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const serialized = serializeOfflineHandwritingModel({
      version: 1,
      totalFeedbackCount: state.totalFeedbackCount,
      prototypes: state.prototypes.map(({ zoneVec: _z, ...rest }) => rest),
    });
    window.localStorage.setItem(LEARNED_MODEL_STORAGE_KEY, serialized);
  } catch {
    // Ignore storage quota/privacy errors safely
  }
}

function ensureRuntimeOfflineModel(): {
  totalFeedbackCount: number;
  prototypes: RuntimeLearnedSample[];
} {
  if (!cachedOfflineModel) {
    cachedOfflineModel = readOfflineModelFromStorage();
  }
  return cachedOfflineModel;
}

export function getOfflineHandwritingModelStats(): {
  prototypeCount: number;
  totalFeedbackCount: number;
  maxPrototypes: number;
} {
  const model = ensureRuntimeOfflineModel();
  return {
    prototypeCount: model.prototypes.length,
    totalFeedbackCount: model.totalFeedbackCount,
    maxPrototypes: MAX_TOTAL_LEARNED_PROTOTYPES,
  };
}

export function clearOfflineHandwritingLearning(): void {
  cachedOfflineModel = { totalFeedbackCount: 0, prototypes: [] };
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(LEARNED_MODEL_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
}

function computeFastPathSimilarityDistance(
  inputPts: Point2D[],
  inputZoneVec: number[],
  protoPts: Point2D[],
  protoZoneVec: number[],
  isClosedLoop: boolean
): number {
  const fwd = computeDirectionalPathDist(inputPts, protoPts);
  const rev = computeDirectionalPathDist(inputPts, [...protoPts].reverse());
  let best = Math.min(fwd, rev * 1.06);

  if (isClosedLoop && protoPts.length >= 16) {
    for (const shift of [8, 16, 24]) {
      const shifted = [...protoPts.slice(shift), ...protoPts.slice(0, shift)];
      best = Math.min(best, computeDirectionalPathDist(inputPts, shifted));
    }
  }

  const zoneDist = computeZoneDistance(inputZoneVec, protoZoneVec);
  return best * 0.78 + zoneDist * 0.22;
}

interface StrokeStats {
  points: Point2D[];
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  cx: number;
  cy: number;
  width: number;
  height: number;
  diag: number;
  pathLen: number;
  directDist: number;
  isDot: boolean;
}

function computeStrokeStats(points: Point2D[], medianBodyDiag: number): StrokeStats {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let pathLen = 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
    if (i > 0) {
      pathLen += Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y);
    }
  }
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const diag = Math.hypot(width, height);
  const first = points[0];
  const last = points[points.length - 1];
  const directDist = Math.hypot(last.x - first.x, last.y - first.y);
  const adaptiveDotLimit = Math.max(14, Math.min(26, medianBodyDiag * 0.16));
  const isDot =
    points.length === 1 ||
    (diag <= adaptiveDotLimit && pathLen <= adaptiveDotLimit * 1.8);

  return {
    points,
    minX,
    maxX,
    minY,
    maxY,
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
    width,
    height,
    diag,
    pathLen,
    directDist,
    isDot,
  };
}

function clusterStrokes(strokes: Point2D[][]): StrokeStats[][] {
  const nonEmpty = strokes.filter((s) => s.length > 0);
  if (nonEmpty.length === 0) return [];

  const diags = nonEmpty
    .map((s) => {
      const xs = s.map((p) => p.x);
      const ys = s.map((p) => p.y);
      return Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    })
    .filter((d) => d > 18)
    .sort((a, b) => a - b);
  const medianDiag = diags.length > 0 ? diags[Math.floor(diags.length / 2)] : 80;

  const stats = nonEmpty.map((s) => computeStrokeStats(s, medianDiag));
  const dots = stats.filter((s) => s.isDot);
  const bodies = stats.filter((s) => !s.isDot);

  if (bodies.length === 0) {
    return [stats];
  }

  // Sort bodies left-to-right (digits & math expressions read LTR)
  bodies.sort((a, b) => a.cx - b.cx);

  const clusters: StrokeStats[][] = [[bodies[0]]];
  for (let i = 1; i < bodies.length; i++) {
    const curr = bodies[i];
    const prev = clusters[clusters.length - 1];
    const prevMinX = Math.min(...prev.map((s) => s.minX));
    const prevMaxX = Math.max(...prev.map((s) => s.maxX));
    const prevCx = (prevMinX + prevMaxX) / 2;
    const prevWidth = Math.max(16, prevMaxX - prevMinX);

    const overlapX = Math.min(curr.maxX, prevMaxX) - Math.max(curr.minX, prevMinX);
    const minW = Math.min(curr.width, prevWidth);
    const isVerticallyStacked =
      Math.abs(curr.cx - prevCx) <= Math.max(curr.width, prevWidth, 24) * 0.58 &&
      overlapX >= -10;

    if (overlapX >= minW * 0.16 || isVerticallyStacked) {
      prev.push(curr);
    } else {
      clusters.push([curr]);
    }
  }

  for (const d of dots) {
    let bestCluster: StrokeStats[] | null = null;
    let bestDist = Infinity;
    for (const c of clusters) {
      const cMinX = Math.min(...c.map((s) => s.minX));
      const cMaxX = Math.max(...c.map((s) => s.maxX));
      const cMinY = Math.min(...c.map((s) => s.minY));
      const cMaxY = Math.max(...c.map((s) => s.maxY));
      const cCx = (cMinX + cMaxX) / 2;
      const cW = Math.max(12, cMaxX - cMinX);
      const cH = Math.max(12, cMaxY - cMinY);

      // Only attach a dot to an existing cluster when it sits vertically above or below
      // that cluster (e.g. dots of ÷, !, ?, ؟). A dot sitting horizontally beside digits
      // on the same row is an independent Persian zero (۰) or decimal point!
      const horizAligned =
        d.cx >= cMinX - Math.max(10, cW * 0.25) &&
        d.cx <= cMaxX + Math.max(10, cW * 0.25);
      const vertAboveOrBelow =
        (d.cy < cMinY + 6 && cMinY - d.cy <= Math.max(58, cH * 1.45)) ||
        (d.cy > cMaxY - 6 && d.cy - cMaxY <= Math.max(58, cH * 1.45));

      if (horizAligned && vertAboveOrBelow) {
        const dist = Math.abs(d.cx - cCx) * 0.35 + Math.min(Math.abs(d.cy - cMinY), Math.abs(d.cy - cMaxY));
        if (dist < bestDist) {
          bestDist = dist;
          bestCluster = c;
        }
      }
    }
    if (bestCluster) {
      bestCluster.push(d);
    } else {
      clusters.push([d]);
    }
  }

  clusters.sort((a, b) => {
    const ax = a.reduce((s, i) => s + i.cx, 0) / a.length;
    const bx = b.reduce((s, i) => s + i.cx, 0) / b.length;
    return ax - bx;
  });

  return clusters;
}

interface ExtractedClusterFeatures {
  nPts: Point2D[];
  zoneVec: number[];
  aspect: number;
  isClosed: boolean;
  dotCount: number;
  dotPos: 'none' | 'above' | 'below' | 'both';
  barCount: number;
  isPlusLike: boolean;
  isEqualsLike: boolean;
  isMultiplyLike: boolean;
  isDivisionLike: boolean;
  hasBody: boolean;
}

function extractClusterFeatures(cluster: StrokeStats[]): ExtractedClusterFeatures {
  const explicitDots = cluster.filter((s) => s.isDot);
  const bodyStrokes = cluster.filter((s) => !s.isDot);

  if (bodyStrokes.length === 0) {
    const dotPts = normalizePointsToBox100(cluster[0]?.points ?? [{ x: 50, y: 50 }]).normalized;
    return {
      nPts: dotPts,
      zoneVec: buildRasterZoneVector(dotPts),
      aspect: 1,
      isClosed: true,
      dotCount: explicitDots.length,
      dotPos: 'none',
      barCount: 0,
      isPlusLike: false,
      isEqualsLike: false,
      isMultiplyLike: false,
      isDivisionLike: false,
      hasBody: false,
    };
  }

  const sortedByLen = [...bodyStrokes].sort((a, b) => b.pathLen - a.pathLen);
  const mainBody = sortedByLen[0];
  const auxStrokes = sortedByLen.slice(1);

  const bothStraightAndComparable =
    bodyStrokes.length === 2 &&
    explicitDots.length === 0 &&
    bodyStrokes[0].pathLen <= bodyStrokes[0].directDist * 1.28 &&
    bodyStrokes[1].pathLen <= bodyStrokes[1].directDist * 1.28 &&
    Math.min(bodyStrokes[0].diag, bodyStrokes[1].diag) >=
      Math.max(bodyStrokes[0].diag, bodyStrokes[1].diag) * 0.42;

  const isPlusLike =
    bothStraightAndComparable &&
    ((bodyStrokes[0].width > bodyStrokes[0].height * 1.8 &&
      bodyStrokes[1].height > bodyStrokes[1].width * 1.8) ||
      (bodyStrokes[1].width > bodyStrokes[1].height * 1.8 &&
        bodyStrokes[0].height > bodyStrokes[0].width * 1.8));

  const isEqualsLike =
    bothStraightAndComparable &&
    bodyStrokes[0].width > bodyStrokes[0].height * 2.2 &&
    bodyStrokes[1].width > bodyStrokes[1].height * 2.2 &&
    Math.abs(bodyStrokes[0].cy - bodyStrokes[1].cy) > 5;

  const isMultiplyLike =
    bothStraightAndComparable &&
    !isPlusLike &&
    !isEqualsLike &&
    bodyStrokes[0].width > bodyStrokes[0].height * 0.45 &&
    bodyStrokes[0].height > bodyStrokes[0].width * 0.45 &&
    bodyStrokes[1].width > bodyStrokes[1].height * 0.45 &&
    bodyStrokes[1].height > bodyStrokes[1].width * 0.45;

  let barCount = 0;
  const combinedBodyPoints: Point2D[] = [...mainBody.points];
  for (const aux of auxStrokes) {
    const isStraight = aux.directDist >= aux.pathLen * 0.5;
    if (aux.pathLen <= mainBody.pathLen * 1.25 && isStraight) {
      barCount++;
    } else {
      combinedBodyPoints.push(...aux.points);
    }
  }

  const dotCount = Math.min(2, explicitDots.length);
  const hasDotAbove = explicitDots.some((d) => d.cy < mainBody.cy);
  const hasDotBelow = explicitDots.some((d) => d.cy > mainBody.cy);
  const dotPos: 'none' | 'above' | 'below' | 'both' =
    dotCount === 0
      ? 'none'
      : hasDotAbove && hasDotBelow
      ? 'both'
      : hasDotAbove
      ? 'above'
      : 'below';

  const isDivisionLike =
    explicitDots.length === 2 &&
    mainBody.width / mainBody.height > 1.8 &&
    hasDotAbove &&
    hasDotBelow;

  const normInput = normalizePointsToBox100(combinedBodyPoints);
  const nPts = normInput.normalized;

  return {
    nPts,
    zoneVec: buildRasterZoneVector(nPts),
    aspect: normInput.aspect,
    isClosed: normInput.isClosed,
    dotCount,
    dotPos,
    barCount,
    isPlusLike,
    isEqualsLike,
    isMultiplyLike,
    isDivisionLike,
    hasBody: true,
  };
}

function mergeSampleIntoPrototype(
  existing: RuntimeLearnedSample,
  inputPts: Point2D[],
  inputAspect: number,
  nowTs: number
): RuntimeLearnedSample {
  // Exponentially damped online running centroid: stays adaptable even after thousands of corrections
  const effWeight = Math.min(14, existing.hitCount);
  const n = Math.min(existing.normPts.length, inputPts.length);
  const mergedPts: Point2D[] = [];
  for (let i = 0; i < n; i++) {
    mergedPts.push(
      roundPt({
        x: (existing.normPts[i].x * effWeight + inputPts[i].x) / (effWeight + 1),
        y: (existing.normPts[i].y * effWeight + inputPts[i].y) / (effWeight + 1),
      })
    );
  }
  const mergedAspect =
    Math.round(((existing.aspect * effWeight + inputAspect) / (effWeight + 1)) * 100) / 100;
  return {
    ...existing,
    normPts: mergedPts,
    zoneVec: buildRasterZoneVector(mergedPts),
    aspect: mergedAspect,
    hitCount: existing.hitCount + 1,
    lastUsedAt: nowTs,
  };
}

function upsertLearnedSampleBounded(
  prototypes: RuntimeLearnedSample[],
  char: string,
  features: ExtractedClusterFeatures,
  nowTs: number
): RuntimeLearnedSample[] {
  const category = inferCharCategory(char);
  const next = [...prototypes];

  // 1. Find closest existing learned centroid for this exact character
  let bestIdx = -1;
  let bestDist = Infinity;
  let charCount = 0;
  let weakestCharIdx = -1;
  let weakestCharScore = Infinity;

  for (let i = 0; i < next.length; i++) {
    const p = next[i];
    if (p.char !== char) continue;
    charCount++;
    const d = computeFastPathSimilarityDistance(
      features.nPts,
      features.zoneVec,
      p.normPts,
      p.zoneVec,
      features.isClosed || p.isClosed
    );
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
    // Lower score = least reinforced & oldest (eviction candidate for this char)
    const retainScore = p.hitCount * 1_000_000 + (p.lastUsedAt % 1_000_000);
    if (retainScore < weakestCharScore) {
      weakestCharScore = retainScore;
      weakestCharIdx = i;
    }
  }

  // Case A: Similar writing style -> update online running centroid in-place (0 extra memory!)
  if (bestIdx >= 0 && bestDist <= 22) {
    next[bestIdx] = mergeSampleIntoPrototype(next[bestIdx], features.nPts, features.aspect, nowTs);
    return next;
  }

  const freshSample: RuntimeLearnedSample = {
    id: `lp-${char}-${nowTs}-${Math.random().toString(36).slice(2, 6)}`,
    char,
    category,
    normPts: features.nPts.map(roundPt),
    zoneVec: features.zoneVec,
    aspect: Math.round(features.aspect * 100) / 100,
    dots: features.dotCount,
    dotPos: features.dotPos,
    bars: features.barCount,
    isClosed: features.isClosed,
    hitCount: 1,
    lastUsedAt: nowTs,
  };

  // Case B: Character already at per-character cap (3 style centroids) -> merge if moderately close, else replace weakest
  if (charCount >= MAX_LEARNED_PROTOTYPES_PER_CHAR) {
    if (bestIdx >= 0 && bestDist <= 34) {
      next[bestIdx] = mergeSampleIntoPrototype(next[bestIdx], features.nPts, features.aspect, nowTs);
    } else if (weakestCharIdx >= 0) {
      next[weakestCharIdx] = freshSample;
    }
    return next;
  }

  // Case C: Global cap reached (72 total prototypes across all chars) -> evict globally least-used/oldest
  if (next.length >= MAX_TOTAL_LEARNED_PROTOTYPES) {
    let evictIdx = 0;
    let lowestScore = Infinity;
    for (let i = 0; i < next.length; i++) {
      const p = next[i];
      const score = p.hitCount * 10_000_000_000 + p.lastUsedAt;
      if (score < lowestScore) {
        lowestScore = score;
        evictIdx = i;
      }
    }
    next[evictIdx] = freshSample;
    return next;
  }

  next.push(freshSample);
  return next;
}

/**
 * Pure, O(1)-bounded offline feedback trainer.
 * Safely merges or caps learned prototypes (max 3 per char, max 72 total) so even thousands
 * of corrections never slow down recognition or bloat storage.
 */
export function applyHandwritingFeedbackToModel(
  model: OfflineHandwritingModelState,
  strokes: Point2D[][],
  correctedText: string,
  nowTs = Date.now()
): {
  nextModel: OfflineHandwritingModelState;
  learnedChars: string[];
} {
  const cleaned = correctedText.trim();
  const nonEmpty = strokes.filter((s) => s.length > 0);
  if (!cleaned || nonEmpty.length === 0) {
    return { nextModel: model, learnedChars: [] };
  }

  const chars = [...cleaned].filter((ch) => ch.trim().length > 0);
  if (chars.length === 0) {
    return { nextModel: model, learnedChars: [] };
  }

  let runtimeProtos = model.prototypes
    .slice(0, MAX_TOTAL_LEARNED_PROTOTYPES)
    .map(hydrateLearnedSample);
  const learnedChars: string[] = [];

  if (chars.length === 1) {
    // Entire drawn stroke group maps to this single corrected character/symbol
    const allStats = nonEmpty.map((s) => computeStrokeStats(s, 80));
    const features = extractClusterFeatures(allStats);
    if (features.hasBody) {
      runtimeProtos = upsertLearnedSampleBounded(runtimeProtos, chars[0], features, nowTs);
      learnedChars.push(chars[0]);
    }
  } else {
    // Multi-character correction (e.g. 3- or 4-digit number like ۱۴۳): align cluster-by-cluster
    const clusters = clusterStrokes(nonEmpty);
    if (clusters.length === chars.length) {
      for (let i = 0; i < clusters.length; i++) {
        const features = extractClusterFeatures(clusters[i]);
        if (!features.hasBody) continue;
        runtimeProtos = upsertLearnedSampleBounded(runtimeProtos, chars[i], features, nowTs);
        learnedChars.push(chars[i]);
      }
    } else if (clusters.length === 1 && chars.length <= 4) {
      // If user wrote a compact token that didn't split, still record feedback count without corrupting single-char clusters
      return {
        nextModel: {
          version: 1,
          totalFeedbackCount: model.totalFeedbackCount + 1,
          prototypes: runtimeProtos.map(({ zoneVec: _z, ...rest }) => rest),
        },
        learnedChars: [],
      };
    }
  }

  return {
    nextModel: {
      version: 1,
      totalFeedbackCount: model.totalFeedbackCount + 1,
      prototypes: runtimeProtos.map(({ zoneVec: _z, ...rest }) => rest),
    },
    learnedChars,
  };
}

/**
 * Records a user's instant correction into the active in-memory & localStorage offline model.
 */
export function recordOfflineHandwritingFeedback(
  strokes: Point2D[][],
  correctedText: string
): {
  learnedChars: string[];
  prototypeCount: number;
  totalFeedbackCount: number;
} {
  const current = ensureRuntimeOfflineModel();
  const baseState: OfflineHandwritingModelState = {
    version: 1,
    totalFeedbackCount: current.totalFeedbackCount,
    prototypes: current.prototypes.map(({ zoneVec: _z, ...rest }) => rest),
  };
  const { nextModel, learnedChars } = applyHandwritingFeedbackToModel(
    baseState,
    strokes,
    correctedText,
    Date.now()
  );
  cachedOfflineModel = {
    totalFeedbackCount: nextModel.totalFeedbackCount,
    prototypes: nextModel.prototypes.map(hydrateLearnedSample),
  };
  persistOfflineModelToStorage(cachedOfflineModel);
  return {
    learnedChars,
    prototypeCount: cachedOfflineModel.prototypes.length,
    totalFeedbackCount: cachedOfflineModel.totalFeedbackCount,
  };
}

function recognizeSingleCluster(
  cluster: StrokeStats[],
  mode: HandwritingRecognitionMode,
  customLearnedPrototypes?: RuntimeLearnedSample[]
): HandwritingCandidate[] {
  const features = extractClusterFeatures(cluster);

  if (!features.hasBody) {
    return mode === 'symbols'
      ? [{ text: '.', labelFa: 'نقطه (.)', category: 'symbol', confidence: 94 }]
      : [
          { text: '۰', labelFa: 'صفر فارسی (۰)', category: 'fa-digit', confidence: 95 },
          { text: '.', labelFa: 'نقطه (.)', category: 'symbol', confidence: 92 },
        ];
  }

  const {
    nPts,
    zoneVec,
    aspect,
    isClosed,
    dotCount,
    dotPos,
    barCount,
    isPlusLike,
    isEqualsLike,
    isMultiplyLike,
    isDivisionLike,
  } = features;

  const eligibleProtos = NORMALIZED_PROTOTYPES.filter((p) => {
    if (mode === 'fa-digits') return p.category === 'fa-digit' || p.category === 'symbol';
    if (mode === 'en-digits') return p.category === 'en-digit' || p.category === 'symbol';
    if (mode === 'symbols') return p.category === 'symbol';
    return true;
  });

  const scoredByChar = new Map<string, HandwritingCandidate>();

  for (const proto of eligibleProtos) {
    let dist = computeFastPathSimilarityDistance(
      nPts,
      zoneVec,
      proto.normPts,
      proto.zoneVec,
      Boolean(proto.isClosedLoop)
    );

    if (isPlusLike) {
      if (proto.char === '+') dist *= 0.22;
      else if (proto.char === '=' || proto.char === '−' || proto.char === '×') dist += 36;
    } else if (isEqualsLike) {
      if (proto.char === '=') dist *= 0.22;
      else if (proto.char === '+' || proto.char === '−' || proto.char === '×') dist += 36;
    } else if (isMultiplyLike) {
      if (proto.char === '×') dist *= 0.25;
      else if (proto.char === '+' || proto.char === '=') dist += 30;
    }

    if (isDivisionLike) {
      if (proto.char === '÷') dist *= 0.25;
      else dist += 24;
    } else if (proto.dots !== dotCount) {
      dist += Math.abs(proto.dots - dotCount) * 22;
    } else if (dotCount > 0 && proto.dotPos === dotPos) {
      dist *= 0.6;
    }

    if (proto.bars !== barCount) {
      dist += Math.abs(proto.bars - barCount) * 18;
    } else if (barCount > 0) {
      dist *= 0.66;
    }

    const [minA, maxA] = proto.aspectRange;
    if (aspect < minA) {
      dist += (minA - aspect) * 18;
    } else if (aspect > maxA) {
      dist += (aspect - maxA) * 11;
    }

    if (proto.isClosedLoop && isClosed) {
      dist *= 0.76;
    } else if (proto.isClosedLoop && !isClosed) {
      dist += 10;
    }

    if (mode === 'fa-digits' && proto.category === 'fa-digit') dist *= 0.8;
    if (mode === 'en-digits' && proto.category === 'en-digit') dist *= 0.8;
    if (mode === 'all' && proto.category === 'fa-digit') dist *= 0.9;

    const confidence = Math.max(12, Math.min(99, Math.round(100 - dist * 1.12)));
    const existing = scoredByChar.get(proto.char);
    if (!existing || confidence > existing.confidence) {
      scoredByChar.set(proto.char, {
        text: proto.char,
        labelFa: proto.labelFa,
        category: proto.category,
        confidence,
      });
    }
  }

  // Score against O(1)-bounded offline learned user prototypes (max 72 total)
  const learnedList = customLearnedPrototypes ?? ensureRuntimeOfflineModel().prototypes;
  for (const learned of learnedList) {
    if (mode === 'fa-digits' && learned.category === 'en-digit') continue;
    if (mode === 'en-digits' && learned.category === 'fa-digit') continue;
    if (mode === 'symbols' && learned.category !== 'symbol') continue;

    let dist = computeFastPathSimilarityDistance(
      nPts,
      zoneVec,
      learned.normPts,
      learned.zoneVec,
      learned.isClosed
    );

    if (learned.dots !== dotCount) {
      dist += Math.abs(learned.dots - dotCount) * 16;
    }
    if (learned.bars !== barCount) {
      dist += Math.abs(learned.bars - barCount) * 14;
    }
    const aspectDiff = Math.abs(aspect - learned.aspect);
    if (aspectDiff > 0.45) {
      dist += (aspectDiff - 0.45) * 10;
    }

    // Personalization boost: stronger reinforcement smoothly improves user-specific match
    const personalFactor = Math.max(0.52, 0.76 - Math.min(6, learned.hitCount - 1) * 0.04);
    dist *= personalFactor;

    const confidence = Math.max(14, Math.min(99, Math.round(100 - dist * 1.12)));
    const existing = scoredByChar.get(learned.char);
    if (!existing || confidence > existing.confidence) {
      scoredByChar.set(learned.char, {
        text: learned.char,
        labelFa: getLabelForChar(learned.char, learned.category),
        category: learned.category,
        confidence,
      });
    }
  }

  return Array.from(scoredByChar.values()).sort((a, b) => b.confidence - a.confidence);
}

/**
 * Lightweight Offline Recognizer for Persian Digits (۰-۹), English Digits (0-9),
 * and Math/Punctuation Symbols (+ − × ÷ = √ > < ( ) / ؟ ? ! .).
 */
export function recognizeOfflineHandwriting(
  strokes: Point2D[][],
  mode: HandwritingRecognitionMode = 'all',
  customModel?: OfflineHandwritingModelState
): HandwritingRecognitionOutput {
  const nonEmpty = strokes.filter((s) => s.length > 0);
  if (nonEmpty.length === 0) {
    return {
      bestMatch: '',
      bestConfidence: 0,
      candidates: [],
      clusterCount: 0,
    };
  }

  const customRuntimeProtos = customModel
    ? customModel.prototypes
        .slice(0, MAX_TOTAL_LEARNED_PROTOTYPES)
        .map(hydrateLearnedSample)
    : undefined;

  const clusters = clusterStrokes(nonEmpty);
  if (clusters.length === 1) {
    const singleCandidates = recognizeSingleCluster(
      clusters[0],
      mode,
      customRuntimeProtos
    ).slice(0, 6);
    return {
      bestMatch: singleCandidates[0]?.text ?? '',
      bestConfidence: singleCandidates[0]?.confidence ?? 0,
      candidates: singleCandidates,
      clusterCount: 1,
    };
  }

  const perClusterRankings = clusters.map((c) =>
    recognizeSingleCluster(c, mode, customRuntimeProtos)
  );
  const combinedBest = perClusterRankings.map((r) => r[0]?.text ?? '').join('');
  const avgConfidence = Math.round(
    perClusterRankings.reduce((s, r) => s + (r[0]?.confidence ?? 70), 0) /
      perClusterRankings.length
  );

  const multiCandidates: HandwritingCandidate[] = [
    {
      text: combinedBest,
      labelFa: `عبارت عددی (${combinedBest})`,
      category: 'expression',
      confidence: avgConfidence,
    },
  ];

  for (let i = 0; i < perClusterRankings.length; i++) {
    if (perClusterRankings[i].length > 1) {
      const altText = perClusterRankings
        .map((r, idx) => (idx === i ? r[1].text : r[0]?.text ?? ''))
        .join('');
      if (altText !== combinedBest && !multiCandidates.some((c) => c.text === altText)) {
        multiCandidates.push({
          text: altText,
          labelFa: `پیشنهاد جایگزین (${altText})`,
          category: 'expression',
          confidence: Math.max(50, avgConfidence - 6),
        });
      }
    }
  }

  return {
    bestMatch: combinedBest,
    bestConfidence: avgConfidence,
    candidates: multiCandidates.slice(0, 6),
    clusterCount: clusters.length,
  };
}

export interface InstantSymbolBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  cx: number;
  cy: number;
}

export interface InstantBoardSymbolResult {
  kind: 'digit' | 'symbol' | 'fraction-bar';
  text: string;
  isEnglishDigit: boolean;
  box: InstantSymbolBounds;
  suggestedScale: number;
  candidates: HandwritingCandidate[];
  lineStart?: Point2D;
  lineEnd?: Point2D;
}

function getBoundsOfStrokeList(strokes: Point2D[][]): InstantSymbolBounds | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let count = 0;
  for (const st of strokes) {
    for (const p of st) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
      count++;
    }
  }
  if (count === 0) return null;
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  return {
    minX,
    minY,
    maxX,
    maxY,
    width,
    height,
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
  };
}

/**
 * Detects a long, straight horizontal stroke intended as a 2D fraction bar (خط کسر)
 * rather than a short minus sign (−).
 */
export function isLongFractionBarStroke(stroke: Point2D[]): boolean {
  if (stroke.length < 2) return false;
  const box = getBoundsOfStrokeList([stroke]);
  if (!box) return false;
  let pathLen = 0;
  for (let i = 1; i < stroke.length; i++) {
    pathLen += Math.hypot(stroke[i].x - stroke[i - 1].x, stroke[i].y - stroke[i - 1].y);
  }
  const directDist = Math.hypot(
    stroke[stroke.length - 1].x - stroke[0].x,
    stroke[stroke.length - 1].y - stroke[0].y
  );
  const aspect = box.width / Math.max(4, box.height);
  const straightness = pathLen > 0 ? directDist / pathLen : 0;
  return box.width >= 105 && aspect >= 4.0 && straightness >= 0.85;
}

/**
 * Determines whether a newly started stroke belongs to the current in-place handwriting group:
 * - Multi-stroke symbols (+, ×, =, ÷, !, ؟) stay together.
 * - Adjacent digits on the SAME horizontal row (for 2-, 3-, or 4-digit numbers like ۱۲۵, ۱۴۰۳, 2025)
 *   stay grouped together so the user has room to finish multi-digit numbers cleanly.
 * - Spatially separate rows (e.g., fraction numerator vs bar vs denominator), wide horizontal gaps,
 *   or strokes starting after a completed multi-stroke math operator (+, ×, =, ÷) commit immediately.
 */
export function doesNewStrokeBelongToCurrentSymbol(
  existingStrokes: Point2D[][],
  newStartOrStroke: Point2D | Point2D[]
): boolean {
  const nonEmpty = existingStrokes.filter((s) => s.length > 0);
  if (nonEmpty.length === 0) return true;
  if (nonEmpty.length >= 10) return false;
  if (nonEmpty.length === 1 && isLongFractionBarStroke(nonEmpty[0])) return false;

  const box = getBoundsOfStrokeList(nonEmpty);
  if (!box) return true;

  const testPt: Point2D | null = Array.isArray(newStartOrStroke)
    ? newStartOrStroke[0] ?? null
    : newStartOrStroke;
  if (!testPt) return true;

  const w = box.width;
  const h = box.height;
  const refCharH = Math.max(36, Math.min(110, h));

  // 1. Multi-stroke single-symbol overlap checks (for +, ×, =, ÷, !, ?)
  if (nonEmpty.length === 1) {
    if (w > h * 1.8) {
      // Horizontal first stroke: could become +, =, or ÷ (vertically stacked strokes/dots)
      const padX = Math.max(18, w * 0.28);
      const padY = Math.max(32, w * 0.65);
      if (
        testPt.x >= box.minX - padX &&
        testPt.x <= box.maxX + padX &&
        testPt.y >= box.minY - padY &&
        testPt.y <= box.maxY + padY
      ) {
        return true;
      }
    } else if (h > w * 2.2) {
      // Vertical first stroke: could become + or !
      const padX = Math.max(32, h * 0.58);
      if (
        testPt.x >= box.minX - padX &&
        testPt.x <= box.maxX + padX &&
        testPt.y >= box.minY - Math.max(20, h * 0.25) &&
        testPt.y <= box.maxY + Math.max(28, h * 0.42)
      ) {
        return true;
      }
    } else {
      // General 2D single stroke: 2nd diagonal of ×, or stroke overlapping existing box
      const padX = Math.max(18, w * 0.28);
      if (
        testPt.x >= box.minX - padX &&
        testPt.x <= box.maxX + padX &&
        testPt.y >= box.minY - Math.max(18, h * 0.28) &&
        testPt.y <= box.maxY + Math.max(24, h * 0.38)
      ) {
        return true;
      }
    }
  } else if (nonEmpty.length === 2) {
    // Allow 3rd stroke of ÷ (second dot directly above/below horizontal bar)
    const padX = Math.max(18, w * 0.25);
    if (
      testPt.x >= box.minX - padX &&
      testPt.x <= box.maxX + padX &&
      testPt.y >= box.minY - Math.max(32, w * 0.6) &&
      testPt.y <= box.maxY + Math.max(32, w * 0.6)
    ) {
      return true;
    }
  }

  // If the current 2–3 stroke group is already a finished math operator (+, ×, =, ÷),
  // separate immediately when the user moves horizontally away to start the next operand!
  if (nonEmpty.length >= 2 && nonEmpty.length <= 3) {
    const currentRec = recognizeOfflineHandwriting(nonEmpty, 'all');
    if (
      currentRec.clusterCount === 1 &&
      currentRec.candidates[0]?.category === 'symbol'
    ) {
      return false;
    }
  }

  // 2. Same-row multi-digit continuation (lets user write 2-, 3-, 4-digit numbers like ۱۲۵, ۱۴۰۳, 2025):
  // Must stay on the same horizontal row and within normal inter-digit horizontal spacing.
  const sameRowVertically =
    testPt.y >= box.minY - Math.max(20, refCharH * 0.34) &&
    testPt.y <= box.maxY + Math.max(20, refCharH * 0.34);

  if (!sameRowVertically) {
    return false;
  }

  const maxInterDigitGap =
    nonEmpty.length >= 2
      ? Math.max(82, Math.min(126, refCharH * 1.38))
      : Math.max(66, Math.min(98, refCharH * 1.12));
  const horizGapFromGroup =
    testPt.x < box.minX
      ? box.minX - testPt.x
      : testPt.x > box.maxX
      ? testPt.x - box.maxX
      : 0;

  return horizGapFromGroup <= maxInterDigitGap;
}

/**
 * Classifies an in-place handwritten symbol OR multi-digit number (e.g. ۵, ×, ۱۲۵, ۱۴۰۳, 2025)
 * for automatic in-place replacement right where the user drew it on the whiteboard.
 */
export function classifyInstantBoardSymbol(
  strokes: Point2D[][],
  mode: HandwritingRecognitionMode = 'all'
): InstantBoardSymbolResult | null {
  const nonEmpty = strokes.filter((s) => s.length > 0);
  if (nonEmpty.length === 0) return null;

  const box = getBoundsOfStrokeList(nonEmpty);
  if (!box) return null;

  if (nonEmpty.length === 1 && isLongFractionBarStroke(nonEmpty[0])) {
    const avgY = Number(box.cy.toFixed(1));
    return {
      kind: 'fraction-bar',
      text: '───',
      isEnglishDigit: false,
      box,
      suggestedScale: 1,
      candidates: [
        { text: '───', labelFa: 'خط کسر افقی', category: 'symbol', confidence: 98 },
        { text: '−', labelFa: 'علامت منفی (−)', category: 'symbol', confidence: 82 },
      ],
      lineStart: { x: Number(box.minX.toFixed(1)), y: avgY },
      lineEnd: { x: Number(box.maxX.toFixed(1)), y: avgY },
    };
  }

  const rec = recognizeOfflineHandwriting(nonEmpty, mode);
  if (!rec.bestMatch) return null;

  const topCand = rec.candidates[0];
  const charCount = [...rec.bestMatch].length;
  const isSymbol = charCount === 1 && topCand?.category === 'symbol';
  const isEnglishDigit =
    /^[0-9]+$/.test(rec.bestMatch) ||
    topCand?.category === 'en-digit' ||
    mode === 'en-digits';

  // For multi-digit numbers (e.g. ۱۲۵, ۱۴۰۳), scale by vertical digit height rather than total width!
  const refSpan =
    charCount >= 2
      ? Math.max(box.height, 40)
      : isSymbol
      ? Math.max(box.height, box.width * 0.85, 34)
      : Math.max(box.height, box.width * 0.72, 36);
  const suggestedScale = Number(Math.max(0.55, Math.min(1.95, refSpan / 62)).toFixed(2));

  return {
    kind: isSymbol ? 'symbol' : 'digit',
    text: rec.bestMatch,
    isEnglishDigit,
    box,
    suggestedScale,
    candidates: rec.candidates.slice(0, 5),
  };
}

export interface ExpressionScaleAnchor {
  scale: number;
  lastBox: InstantSymbolBounds;
  lastCommitTs: number;
}

/**
 * Keeps all consecutive numbers & symbols written as part of the same math expression
 * at a consistent typography scale, preventing accidental size mismatches when handwriting
 * naturally fluctuates smaller or larger between terms.
 */
export function resolveConsistentExpressionScale(
  rawScale: number,
  box: InstantSymbolBounds,
  anchor: ExpressionScaleAnchor | null,
  nowTs: number
): { scale: number; nextAnchor: ExpressionScaleAnchor } {
  const clampedRaw = Number(Math.max(0.55, Math.min(1.95, rawScale)).toFixed(2));
  if (!anchor) {
    return {
      scale: clampedRaw,
      nextAnchor: { scale: clampedRaw, lastBox: box, lastCommitTs: nowTs },
    };
  }

  const elapsedMs = Math.max(0, nowTs - anchor.lastCommitTs);
  const dist = Math.hypot(box.cx - anchor.lastBox.cx, box.cy - anchor.lastBox.cy);
  const ratio = clampedRaw / Math.max(0.25, anchor.scale);

  // Within the same active expression (<= 16s gap, nearby on the board <= 520px, and not intentionally 2x giant heading):
  // keep the exact same uniform scale as the expression's anchor!
  const isSameExpression =
    elapsedMs <= 16000 &&
    dist <= 520 &&
    ratio >= 0.45 &&
    ratio <= 1.9;

  if (isSameExpression) {
    return {
      scale: anchor.scale,
      nextAnchor: {
        scale: anchor.scale,
        lastBox: box,
        lastCommitTs: nowTs,
      },
    };
  }

  return {
    scale: clampedRaw,
    nextAnchor: {
      scale: clampedRaw,
      lastBox: box,
      lastCommitTs: nowTs,
    },
  };
}


