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
}

const NORMALIZED_PROTOTYPES: NormalizedProto[] = HANDWRITING_PROTOTYPES.map((p) => ({
  ...p,
  normPts: normalizePointsToBox100(p.basePath).normalized,
}));

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
    let bestCluster = clusters[0];
    let bestDist = Infinity;
    for (const c of clusters) {
      const cMinX = Math.min(...c.map((s) => s.minX));
      const cMaxX = Math.max(...c.map((s) => s.maxX));
      const cCx = (cMinX + cMaxX) / 2;
      const dist =
        d.cx >= cMinX && d.cx <= cMaxX
          ? Math.abs(d.cx - cCx) * 0.35
          : Math.min(Math.abs(d.cx - cMinX), Math.abs(d.cx - cMaxX));
      if (dist < bestDist) {
        bestDist = dist;
        bestCluster = c;
      }
    }
    bestCluster.push(d);
  }

  clusters.sort((a, b) => {
    const ax = a.reduce((s, i) => s + i.cx, 0) / a.length;
    const bx = b.reduce((s, i) => s + i.cx, 0) / b.length;
    return ax - bx;
  });

  return clusters;
}

function recognizeSingleCluster(
  cluster: StrokeStats[],
  mode: HandwritingRecognitionMode
): HandwritingCandidate[] {
  const explicitDots = cluster.filter((s) => s.isDot);
  const bodyStrokes = cluster.filter((s) => !s.isDot);

  if (bodyStrokes.length === 0) {
    return mode === 'symbols'
      ? [{ text: '.', labelFa: 'نقطه (.)', category: 'symbol', confidence: 94 }]
      : [
          { text: '۰', labelFa: 'صفر فارسی (۰)', category: 'fa-digit', confidence: 95 },
          { text: '.', labelFa: 'نقطه (.)', category: 'symbol', confidence: 92 },
        ];
  }

  const sortedByLen = [...bodyStrokes].sort((a, b) => b.pathLen - a.pathLen);
  const mainBody = sortedByLen[0];
  const auxStrokes = sortedByLen.slice(1);

  const bothStraightAndComparable =
    bodyStrokes.length === 2 &&
    explicitDots.length === 0 &&
    bodyStrokes[0].pathLen <= bodyStrokes[0].directDist * 1.15 &&
    bodyStrokes[1].pathLen <= bodyStrokes[1].directDist * 1.15 &&
    Math.min(bodyStrokes[0].diag, bodyStrokes[1].diag) >=
      Math.max(bodyStrokes[0].diag, bodyStrokes[1].diag) * 0.45;

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

  const eligibleProtos = NORMALIZED_PROTOTYPES.filter((p) => {
    if (mode === 'fa-digits') return p.category === 'fa-digit' || p.category === 'symbol';
    if (mode === 'en-digits') return p.category === 'en-digit' || p.category === 'symbol';
    if (mode === 'symbols') return p.category === 'symbol';
    return true;
  });

  const scoredByChar = new Map<string, HandwritingCandidate>();

  for (const proto of eligibleProtos) {
    let dist = computePathSimilarityDistance(nPts, proto.normPts, Boolean(proto.isClosedLoop));

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
    if (normInput.aspect < minA) {
      dist += (minA - normInput.aspect) * 18;
    } else if (normInput.aspect > maxA) {
      dist += (normInput.aspect - maxA) * 11;
    }

    if (proto.isClosedLoop && normInput.isClosed) {
      dist *= 0.76;
    } else if (proto.isClosedLoop && !normInput.isClosed) {
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

  return Array.from(scoredByChar.values()).sort((a, b) => b.confidence - a.confidence);
}

/**
 * Lightweight Offline Recognizer for Persian Digits (۰-۹), English Digits (0-9),
 * and Math/Punctuation Symbols (+ − × ÷ = √ > < ( ) / ؟ ? ! .).
 */
export function recognizeOfflineHandwriting(
  strokes: Point2D[][],
  mode: HandwritingRecognitionMode = 'all'
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

  const clusters = clusterStrokes(nonEmpty);
  if (clusters.length === 1) {
    const singleCandidates = recognizeSingleCluster(clusters[0], mode).slice(0, 6);
    return {
      bestMatch: singleCandidates[0]?.text ?? '',
      bestConfidence: singleCandidates[0]?.confidence ?? 0,
      candidates: singleCandidates,
      clusterCount: 1,
    };
  }

  const perClusterRankings = clusters.map((c) => recognizeSingleCluster(c, mode));
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
