import { Point2D } from './canvasAndMathEngine';

export type HandwritingStroke = Point2D[];

export type HandwritingRecognitionMode =
  | 'all'
  | 'fa-digits'
  | 'fa-text'
  | 'en-digits'
  | 'en-text'
  | 'symbols';

export interface HandwritingCandidate {
  text: string;
  labelFa: string;
  category: 'fa-digit' | 'en-digit' | 'fa-letter' | 'en-letter' | 'symbol' | 'word';
  confidence: number; // 0..100
}

export interface HandwritingRecognitionOutput {
  bestMatch: string;
  bestConfidence: number;
  candidates: HandwritingCandidate[];
  wordCompletions: string[];
  clusterCount: number;
}

interface PrototypeSpec {
  char: string;
  labelFa: string;
  category: 'fa-digit' | 'en-digit' | 'fa-letter' | 'en-letter' | 'symbol';
  /** Base body stroke(s) normalized in [0..100] x [0..100] coordinate space */
  basePath: Point2D[];
  /** Expected number of dot strokes (0, 1, 2, 3) */
  dots: number;
  /** Expected dot location relative to main body ('none' | 'above' | 'below' | 'inside') */
  dotPos: 'none' | 'above' | 'below' | 'inside';
  /** Expected number of auxiliary bar/slash strokes (e.g. 'آ', 'گ', 'ک', '+', '=', 't') */
  bars: number;
  /** Expected aspect ratio range [minW/H, maxW/H] */
  aspectRange: [number, number];
  /** Whether the base stroke forms a closed loop or near-closed loop */
  isClosedLoop?: boolean;
}

/**
 * Helper to create a smooth polyline from coordinate pairs in [0..100]x[0..100].
 */
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
 * Comprehensive Offline Prototype Database covering:
 * - Persian digits (۰-۹) with multiple writing variants
 * - English digits (0-9) with multiple writing variants
 * - All 33 Persian letters (آ ا ب پ ت ث ج چ ح خ د ذ ر ز ژ س ش ص ض ط ظ ع غ ف ق ک گ ل م ن و ه ی)
 * - English letters (A-Z, a-z)
 * - Frequent Persian, English & Math symbols (+ − × ÷ = ؟ ? ! ، . % √ π ( ) > <)
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

  // ==================== PERSIAN LETTERS (آ - ی) ====================
  {
    char: 'ا',
    labelFa: 'حرف الف (ا)',
    category: 'fa-letter',
    basePath: pts([
      [50, 10],
      [50, 90],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.02, 0.38],
  },
  {
    char: 'آ',
    labelFa: 'حرف آ با کلاه (آ)',
    category: 'fa-letter',
    basePath: pts([
      [50, 22],
      [50, 92],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 1,
    aspectRange: [0.15, 0.9],
  },
  // Boat family: ب پ ت ث
  {
    char: 'ب',
    labelFa: 'حرف ب',
    category: 'fa-letter',
    basePath: pts([
      [88, 38],
      [84, 65],
      [50, 70],
      [16, 65],
      [12, 42],
    ]),
    dots: 1,
    dotPos: 'below',
    bars: 0,
    aspectRange: [1.3, 4.5],
  },
  {
    char: 'پ',
    labelFa: 'حرف پ',
    category: 'fa-letter',
    basePath: pts([
      [88, 38],
      [84, 65],
      [50, 70],
      [16, 65],
      [12, 42],
    ]),
    dots: 3,
    dotPos: 'below',
    bars: 0,
    aspectRange: [1.3, 4.5],
  },
  {
    char: 'ت',
    labelFa: 'حرف ت',
    category: 'fa-letter',
    basePath: pts([
      [88, 45],
      [84, 72],
      [50, 76],
      [16, 72],
      [12, 48],
    ]),
    dots: 2,
    dotPos: 'above',
    bars: 0,
    aspectRange: [1.3, 4.5],
  },
  {
    char: 'ث',
    labelFa: 'حرف ث',
    category: 'fa-letter',
    basePath: pts([
      [88, 45],
      [84, 72],
      [50, 76],
      [16, 72],
      [12, 48],
    ]),
    dots: 3,
    dotPos: 'above',
    bars: 0,
    aspectRange: [1.3, 4.5],
  },
  // H-family: ج چ ح خ
  {
    char: 'ح',
    labelFa: 'حرف ح',
    category: 'fa-letter',
    basePath: pts([
      [25, 22],
      [75, 22],
      [35, 48],
      [22, 72],
      [48, 90],
      [78, 82],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.5, 1.5],
  },
  {
    char: 'ج',
    labelFa: 'حرف ج',
    category: 'fa-letter',
    basePath: pts([
      [25, 22],
      [75, 22],
      [35, 48],
      [22, 72],
      [48, 90],
      [78, 82],
    ]),
    dots: 1,
    dotPos: 'inside',
    bars: 0,
    aspectRange: [0.5, 1.5],
  },
  {
    char: 'چ',
    labelFa: 'حرف چ',
    category: 'fa-letter',
    basePath: pts([
      [25, 22],
      [75, 22],
      [35, 48],
      [22, 72],
      [48, 90],
      [78, 82],
    ]),
    dots: 3,
    dotPos: 'inside',
    bars: 0,
    aspectRange: [0.5, 1.5],
  },
  {
    char: 'خ',
    labelFa: 'حرف خ',
    category: 'fa-letter',
    basePath: pts([
      [25, 26],
      [75, 26],
      [35, 52],
      [22, 74],
      [48, 90],
      [78, 82],
    ]),
    dots: 1,
    dotPos: 'above',
    bars: 0,
    aspectRange: [0.5, 1.5],
  },
  // D/R family: د ذ ر ز ژ
  {
    char: 'د',
    labelFa: 'حرف د',
    category: 'fa-letter',
    basePath: pts([
      [42, 22],
      [78, 56],
      [24, 78],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.5, 1.6],
  },
  {
    char: 'ذ',
    labelFa: 'حرف ذ',
    category: 'fa-letter',
    basePath: pts([
      [42, 28],
      [78, 58],
      [24, 80],
    ]),
    dots: 1,
    dotPos: 'above',
    bars: 0,
    aspectRange: [0.5, 1.6],
  },
  {
    char: 'ر',
    labelFa: 'حرف ر',
    category: 'fa-letter',
    basePath: pts([
      [72, 24],
      [66, 58],
      [24, 88],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.4, 1.4],
  },
  {
    char: 'ز',
    labelFa: 'حرف ز',
    category: 'fa-letter',
    basePath: pts([
      [72, 28],
      [66, 58],
      [24, 88],
    ]),
    dots: 1,
    dotPos: 'above',
    bars: 0,
    aspectRange: [0.4, 1.4],
  },
  {
    char: 'ژ',
    labelFa: 'حرف ژ',
    category: 'fa-letter',
    basePath: pts([
      [72, 28],
      [66, 58],
      [24, 88],
    ]),
    dots: 3,
    dotPos: 'above',
    bars: 0,
    aspectRange: [0.4, 1.4],
  },
  // Seen/Sheen: س ش
  {
    char: 'س',
    labelFa: 'حرف س',
    category: 'fa-letter',
    basePath: pts([
      [88, 36],
      [80, 56],
      [72, 36],
      [64, 56],
      [56, 36],
      [52, 78],
      [28, 86],
      [14, 62],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.85, 2.8],
  },
  {
    char: 'ش',
    labelFa: 'حرف ش',
    category: 'fa-letter',
    basePath: pts([
      [88, 36],
      [80, 56],
      [72, 36],
      [64, 56],
      [56, 36],
      [52, 78],
      [28, 86],
      [14, 62],
    ]),
    dots: 3,
    dotPos: 'above',
    bars: 0,
    aspectRange: [0.85, 2.8],
  },
  // Sad/Dad: ص ض
  {
    char: 'ص',
    labelFa: 'حرف ص',
    category: 'fa-letter',
    basePath: pts([
      [56, 48],
      [76, 32],
      [88, 44],
      [70, 56],
      [52, 52],
      [46, 82],
      [22, 86],
      [14, 60],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.85, 2.6],
  },
  {
    char: 'ض',
    labelFa: 'حرف ض',
    category: 'fa-letter',
    basePath: pts([
      [56, 48],
      [76, 32],
      [88, 44],
      [70, 56],
      [52, 52],
      [46, 82],
      [22, 86],
      [14, 60],
    ]),
    dots: 1,
    dotPos: 'above',
    bars: 0,
    aspectRange: [0.85, 2.6],
  },
  // Ta/Za: ط ظ
  {
    char: 'ط',
    labelFa: 'حرف ط',
    category: 'fa-letter',
    basePath: pts([
      [36, 12],
      [36, 78],
      [62, 56],
      [82, 66],
      [68, 82],
      [20, 82],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.55, 1.8],
  },
  {
    char: 'ظ',
    labelFa: 'حرف ظ',
    category: 'fa-letter',
    basePath: pts([
      [36, 12],
      [36, 78],
      [62, 56],
      [82, 66],
      [68, 82],
      [20, 82],
    ]),
    dots: 1,
    dotPos: 'above',
    bars: 0,
    aspectRange: [0.55, 1.8],
  },
  // Ayn/Ghayn: ع غ
  {
    char: 'ع',
    labelFa: 'حرف ع',
    category: 'fa-letter',
    basePath: pts([
      [64, 18],
      [38, 26],
      [58, 44],
      [26, 66],
      [42, 90],
      [76, 84],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.45, 1.4],
  },
  {
    char: 'غ',
    labelFa: 'حرف غ',
    category: 'fa-letter',
    basePath: pts([
      [64, 22],
      [38, 30],
      [58, 46],
      [26, 68],
      [42, 90],
      [76, 84],
    ]),
    dots: 1,
    dotPos: 'above',
    bars: 0,
    aspectRange: [0.45, 1.4],
  },
  // Fe/Qaf: ف ق
  {
    char: 'ف',
    labelFa: 'حرف ف',
    category: 'fa-letter',
    basePath: pts([
      [76, 52],
      [66, 34],
      [82, 34],
      [84, 66],
      [46, 72],
      [16, 64],
      [14, 46],
    ]),
    dots: 1,
    dotPos: 'above',
    bars: 0,
    aspectRange: [1.1, 3.5],
  },
  {
    char: 'ق',
    labelFa: 'حرف ق',
    category: 'fa-letter',
    basePath: pts([
      [72, 46],
      [62, 28],
      [80, 28],
      [78, 68],
      [48, 88],
      [22, 72],
      [24, 46],
    ]),
    dots: 2,
    dotPos: 'above',
    bars: 0,
    aspectRange: [0.7, 2.2],
  },
  // Kaf/Gaf: ک گ
  {
    char: 'ک',
    labelFa: 'حرف ک',
    category: 'fa-letter',
    basePath: pts([
      [72, 26],
      [72, 76],
      [22, 76],
      [18, 58],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 1,
    aspectRange: [0.6, 2.2],
  },
  {
    char: 'گ',
    labelFa: 'حرف گ',
    category: 'fa-letter',
    basePath: pts([
      [72, 28],
      [72, 78],
      [22, 78],
      [18, 60],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 2,
    aspectRange: [0.6, 2.2],
  },
  // Lam, Mim, Noon, Vav, He, Ye: ل م ن و ه ی
  {
    char: 'ل',
    labelFa: 'حرف ل',
    category: 'fa-letter',
    basePath: pts([
      [68, 12],
      [68, 72],
      [44, 88],
      [22, 72],
      [24, 52],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.42, 1.35],
  },
  {
    char: 'م',
    labelFa: 'حرف م',
    category: 'fa-letter',
    basePath: pts([
      [58, 30],
      [78, 22],
      [74, 42],
      [42, 42],
      [42, 92],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.35, 1.3],
  },
  {
    char: 'ن',
    labelFa: 'حرف ن',
    category: 'fa-letter',
    basePath: pts([
      [78, 38],
      [76, 76],
      [50, 88],
      [24, 76],
      [22, 42],
    ]),
    dots: 1,
    dotPos: 'above',
    bars: 0,
    aspectRange: [0.65, 1.9],
  },
  {
    char: 'و',
    labelFa: 'حرف و',
    category: 'fa-letter',
    basePath: pts([
      [58, 42],
      [44, 24],
      [68, 24],
      [72, 52],
      [34, 88],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.42, 1.35],
  },
  {
    char: 'ه',
    labelFa: 'حرف ه',
    category: 'fa-letter',
    basePath: makeCircleProto(50, 55, 28, 24),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.65, 1.7],
    isClosedLoop: true,
  },
  {
    char: 'ی',
    labelFa: 'حرف ی',
    category: 'fa-letter',
    basePath: pts([
      [74, 26],
      [46, 38],
      [68, 56],
      [54, 86],
      [24, 84],
      [18, 58],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.55, 1.75],
  },
  {
    char: 'ی',
    labelFa: 'حرف ی (با دو نقطه)',
    category: 'fa-letter',
    basePath: pts([
      [78, 38],
      [74, 72],
      [50, 82],
      [24, 72],
      [22, 42],
    ]),
    dots: 2,
    dotPos: 'below',
    bars: 0,
    aspectRange: [0.65, 2.2],
  },

  // ==================== ENGLISH LETTERS (A-Z, a-z) ====================
  {
    char: 'A',
    labelFa: 'حرف انگلیسی A',
    category: 'en-letter',
    basePath: pts([
      [20, 88],
      [50, 14],
      [80, 88],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 1,
    aspectRange: [0.5, 1.4],
  },
  {
    char: 'B',
    labelFa: 'حرف انگلیسی B',
    category: 'en-letter',
    basePath: pts([
      [26, 14],
      [26, 88],
      [26, 14],
      [68, 24],
      [26, 50],
      [74, 68],
      [26, 88],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.45, 1.25],
  },
  {
    char: 'C',
    labelFa: 'حرف انگلیسی C',
    category: 'en-letter',
    basePath: pts([
      [76, 22],
      [42, 14],
      [20, 48],
      [42, 86],
      [78, 78],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.45, 1.3],
  },
  {
    char: 'D',
    labelFa: 'حرف انگلیسی D',
    category: 'en-letter',
    basePath: pts([
      [26, 14],
      [26, 86],
      [68, 76],
      [78, 50],
      [68, 24],
      [26, 14],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.45, 1.3],
    isClosedLoop: true,
  },
  {
    char: 'E',
    labelFa: 'حرف انگلیسی E',
    category: 'en-letter',
    basePath: pts([
      [76, 16],
      [26, 16],
      [26, 50],
      [66, 50],
      [26, 50],
      [26, 86],
      [78, 86],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.45, 1.3],
  },
  {
    char: 'F',
    labelFa: 'حرف انگلیسی F',
    category: 'en-letter',
    basePath: pts([
      [76, 16],
      [26, 16],
      [26, 88],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 1,
    aspectRange: [0.4, 1.25],
  },
  {
    char: 'G',
    labelFa: 'حرف انگلیسی G',
    category: 'en-letter',
    basePath: pts([
      [74, 22],
      [38, 14],
      [18, 50],
      [38, 86],
      [76, 78],
      [76, 54],
      [52, 54],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.5, 1.35],
  },
  {
    char: 'H',
    labelFa: 'حرف انگلیسی H',
    category: 'en-letter',
    basePath: pts([
      [24, 14],
      [24, 88],
      [24, 50],
      [76, 50],
      [76, 14],
      [76, 88],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.45, 1.35],
  },
  {
    char: 'I',
    labelFa: 'حرف انگلیسی I',
    category: 'en-letter',
    basePath: pts([
      [50, 12],
      [50, 88],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.02, 0.45],
  },
  {
    char: 'i',
    labelFa: 'حرف انگلیسی i',
    category: 'en-letter',
    basePath: pts([
      [50, 34],
      [50, 88],
    ]),
    dots: 1,
    dotPos: 'above',
    bars: 0,
    aspectRange: [0.02, 0.55],
  },
  {
    char: 'J',
    labelFa: 'حرف انگلیسی J',
    category: 'en-letter',
    basePath: pts([
      [66, 14],
      [66, 72],
      [44, 88],
      [22, 72],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.35, 1.15],
  },
  {
    char: 'K',
    labelFa: 'حرف انگلیسی K',
    category: 'en-letter',
    basePath: pts([
      [26, 14],
      [26, 88],
      [26, 52],
      [76, 16],
      [28, 52],
      [78, 88],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.45, 1.35],
  },
  {
    char: 'L',
    labelFa: 'حرف انگلیسی L',
    category: 'en-letter',
    basePath: pts([
      [26, 14],
      [26, 86],
      [78, 86],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.42, 1.3],
  },
  {
    char: 'M',
    labelFa: 'حرف انگلیسی M',
    category: 'en-letter',
    basePath: pts([
      [16, 88],
      [16, 16],
      [50, 62],
      [84, 16],
      [84, 88],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.55, 1.6],
  },
  {
    char: 'N',
    labelFa: 'حرف انگلیسی N',
    category: 'en-letter',
    basePath: pts([
      [22, 88],
      [22, 16],
      [78, 88],
      [78, 16],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.45, 1.4],
  },
  {
    char: 'O',
    labelFa: 'حرف انگلیسی O',
    category: 'en-letter',
    basePath: makeCircleProto(50, 50, 36, 38),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.55, 1.4],
    isClosedLoop: true,
  },
  {
    char: 'P',
    labelFa: 'حرف انگلیسی P',
    category: 'en-letter',
    basePath: pts([
      [26, 88],
      [26, 14],
      [72, 22],
      [72, 46],
      [26, 52],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.42, 1.25],
  },
  {
    char: 'R',
    labelFa: 'حرف انگلیسی R',
    category: 'en-letter',
    basePath: pts([
      [26, 88],
      [26, 14],
      [72, 22],
      [72, 46],
      [26, 52],
      [78, 88],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.45, 1.3],
  },
  {
    char: 'S',
    labelFa: 'حرف انگلیسی S',
    category: 'en-letter',
    basePath: pts([
      [74, 22],
      [42, 14],
      [24, 32],
      [50, 50],
      [78, 68],
      [56, 88],
      [22, 78],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.42, 1.25],
  },
  {
    char: 'T',
    labelFa: 'حرف انگلیسی T',
    category: 'en-letter',
    basePath: pts([
      [16, 16],
      [84, 16],
      [50, 16],
      [50, 88],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.45, 1.4],
  },
  {
    char: 't',
    labelFa: 'حرف انگلیسی t',
    category: 'en-letter',
    basePath: pts([
      [46, 14],
      [46, 82],
      [66, 88],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 1,
    aspectRange: [0.3, 1.1],
  },
  {
    char: 'U',
    labelFa: 'حرف انگلیسی U',
    category: 'en-letter',
    basePath: pts([
      [22, 16],
      [24, 72],
      [50, 88],
      [76, 72],
      [78, 16],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.45, 1.35],
  },
  {
    char: 'V',
    labelFa: 'حرف انگلیسی V',
    category: 'en-letter',
    basePath: pts([
      [18, 16],
      [50, 88],
      [82, 16],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.45, 1.5],
  },
  {
    char: 'W',
    labelFa: 'حرف انگلیسی W',
    category: 'en-letter',
    basePath: pts([
      [12, 18],
      [32, 86],
      [50, 42],
      [68, 86],
      [88, 18],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.65, 1.9],
  },
  {
    char: 'X',
    labelFa: 'حرف انگلیسی X',
    category: 'en-letter',
    basePath: pts([
      [20, 16],
      [80, 86],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 1,
    aspectRange: [0.5, 1.45],
  },
  {
    char: 'Y',
    labelFa: 'حرف انگلیسی Y',
    category: 'en-letter',
    basePath: pts([
      [20, 16],
      [50, 52],
      [80, 16],
      [50, 52],
      [50, 88],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.45, 1.35],
  },
  {
    char: 'Z',
    labelFa: 'حرف انگلیسی Z',
    category: 'en-letter',
    basePath: pts([
      [20, 18],
      [80, 18],
      [20, 86],
      [80, 86],
    ]),
    dots: 0,
    dotPos: 'none',
    bars: 0,
    aspectRange: [0.45, 1.4],
  },

  // ==================== PUNCTUATION & MATH SYMBOLS ====================
  {
    char: '−',
    labelFa: 'علامت منفی / خط تیره (−)',
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
    dotPos: 'above',
    bars: 0,
    aspectRange: [0.8, 3.2],
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
];

/**
 * Built-in Offline Persian & Educational Dictionary for instant Gboard-style word suggestions.
 */
export const OFFLINE_WORD_DICTIONARY_FA: string[] = [
  'سلام',
  'سوال',
  'پاسخ',
  'نتیجه',
  'بنابراین',
  'فرمول',
  'معادله',
  'مشتق',
  'انتگرال',
  'احتمال',
  'مثلث',
  'دایره',
  'مربع',
  'مستطیل',
  'پنج‌ضلعی',
  'شش‌ضلعی',
  'زاویه',
  'عمود',
  'موازی',
  'سرعت',
  'شتاب',
  'نیرو',
  'انرژی',
  'جریان',
  'مقاومت',
  'فشار',
  'دما',
  'واکنش',
  'مولکول',
  'الکترون',
  'پروتون',
  'حجم',
  'مساحت',
  'محیط',
  'کسر',
  'محور',
  'نسبت',
  'درصد',
  'تمرین',
  'مثال',
  'اثبات',
  'نکته',
  'مهم',
];

export const OFFLINE_WORD_DICTIONARY_EN: string[] = [
  'sin',
  'cos',
  'tan',
  'log',
  'lim',
  'max',
  'min',
  'sum',
  'area',
  'force',
  'mass',
  'atom',
  'cell',
  'test',
  'note',
];

function resamplePath(points: Point2D[], n = 32): Point2D[] {
  if (points.length === 0) return [];
  if (points.length === 1) return Array.from({ length: n }, () => ({ ...points[0] }));

  let totalLen = 0;
  for (let i = 1; i < points.length; i++) {
    totalLen += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  if (totalLen < 1e-3) {
    return Array.from({ length: n }, () => ({ ...points[0] }));
  }

  const step = totalLen / (n - 1);
  const result: Point2D[] = [{ ...points[0] }];
  let acc = 0;
  let prev = { ...points[0] };

  for (let i = 1; i < points.length; i++) {
    const curr = points[i];
    let seg = Math.hypot(curr.x - prev.x, curr.y - prev.y);
    while (acc + seg >= step && result.length < n - 1) {
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
  while (result.length < n) {
    result.push({ ...points[points.length - 1] });
  }
  return result;
}

function normalizePointsToBox100(points: Point2D[]): {
  normalized: Point2D[];
  width: number;
  height: number;
  aspect: number;
  pathLen: number;
  isClosed: boolean;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let pathLen = 0;

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
    if (i > 0) {
      pathLen += Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y);
    }
  }

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const rawAspect = width / height;
  const aspect = Math.max(0.1, Math.min(10, rawAspect));
  const maxDim = Math.max(width, height, 1);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  // Preserve aspect ratio if very thin/flat, otherwise scale smoothly to [10..90]
  const scaleX = aspect < 0.35 ? 80 / maxDim : 80 / width;
  const scaleY = aspect > 2.6 ? 80 / maxDim : 80 / height;

  const resampled = resamplePath(points, 32);
  const normalized = resampled.map((p) => ({
    x: 50 + (p.x - cx) * scaleX,
    y: 50 + (p.y - cy) * scaleY,
  }));

  const first = points[0];
  const last = points[points.length - 1];
  const directDist = Math.hypot(last.x - first.x, last.y - first.y);
  const diag = Math.hypot(width, height);
  const isClosed = pathLen > diag * 1.6 && directDist < diag * 0.42;

  return { normalized, width, height, aspect, pathLen, isClosed };
}

function computePathSimilarityDistance(a: Point2D[], b: Point2D[]): number {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 100;

  let forwardSum = 0;
  let reverseSum = 0;
  for (let i = 0; i < n; i++) {
    forwardSum += Math.hypot(a[i].x - b[i].x, a[i].y - b[i].y);
    reverseSum += Math.hypot(a[i].x - b[n - 1 - i].x, a[i].y - b[n - 1 - i].y);
  }
  const orderedDist = Math.min(forwardSum / n, (reverseSum / n) * 1.08);

  // Also compute Chamfer point-cloud distance for stroke-order invariance
  let cloudSum = 0;
  for (let i = 0; i < n; i++) {
    let minD = Infinity;
    for (let j = 0; j < n; j++) {
      const d = Math.hypot(a[i].x - b[j].x, a[i].y - b[j].y);
      if (d < minD) minD = d;
    }
    cloudSum += minD;
  }
  const cloudDist = cloudSum / n;

  return orderedDist * 0.65 + cloudDist * 0.35;
}

const NORMALIZED_PROTOTYPES = HANDWRITING_PROTOTYPES.map((proto) => ({
  ...proto,
  normPts: normalizePointsToBox100(proto.basePath).normalized,
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
  isDot: boolean;
}

function analyzeStroke(points: Point2D[]): StrokeStats {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let pathLen = 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
    if (i > 0) {
      pathLen += Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y);
    }
  }
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const diag = Math.hypot(width, height);
  const isDot = points.length <= 6 && diag < 18 && pathLen < 26;
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
    isDot,
  };
}

/**
 * Groups multiple strokes drawn on the handwriting pad into spatially separated character clusters,
 * keeping dots and crossbars attached to their parent character body.
 */
function clusterHandwritingStrokes(
  rawStrokes: Point2D[][],
  mode: HandwritingRecognitionMode
): StrokeStats[][] {
  const valid = rawStrokes.filter((s) => s.length > 0).map(analyzeStroke);
  if (valid.length === 0) return [];
  if (valid.length === 1) return [[valid[0]]];

  const nonDots = valid.filter((s) => !s.isDot);
  const dots = valid.filter((s) => s.isDot);

  if (nonDots.length === 0) {
    return [valid];
  }

  // Sort main strokes along X-axis (left-to-right first for clustering)
  const sortedMain = [...nonDots].sort((a, b) => a.cx - b.cx);
  const clusters: StrokeStats[][] = [[sortedMain[0]]];

  for (let i = 1; i < sortedMain.length; i++) {
    const curr = sortedMain[i];
    const prevCluster = clusters[clusters.length - 1];
    const clusterMinX = Math.min(...prevCluster.map((s) => s.minX));
    const clusterMaxX = Math.max(...prevCluster.map((s) => s.maxX));
    const clusterWidth = Math.max(20, clusterMaxX - clusterMinX);

    // Check horizontal overlap between `curr` and `prevCluster`
    const overlapX = Math.min(curr.maxX, clusterMaxX) - Math.max(curr.minX, clusterMinX);
    if (overlapX > -Math.min(14, clusterWidth * 0.18)) {
      prevCluster.push(curr);
    } else {
      clusters.push([curr]);
    }
  }

  // Assign each dot to its nearest cluster by X-coordinate
  for (const d of dots) {
    let bestCluster = clusters[0];
    let bestDist = Infinity;
    for (const c of clusters) {
      const cCx = c.reduce((sum, s) => sum + s.cx, 0) / c.length;
      const dist = Math.abs(d.cx - cCx);
      if (dist < bestDist) {
        bestDist = dist;
        bestCluster = c;
      }
    }
    bestCluster.push(d);
  }

  // For Persian text mode (`fa-text`), characters are written RTL (right to left);
  // for numbers (even Persian digits!) and English text, people write digits left-to-right (e.g. ۱ then ۲ then ۵).
  if (mode === 'fa-text') {
    clusters.sort((a, b) => {
      const ax = a.reduce((s, i) => s + i.cx, 0) / a.length;
      const bx = b.reduce((s, i) => s + i.cx, 0) / b.length;
      return bx - ax;
    });
  } else {
    clusters.sort((a, b) => {
      const ax = a.reduce((s, i) => s + i.cx, 0) / a.length;
      const bx = b.reduce((s, i) => s + i.cx, 0) / b.length;
      return ax - bx;
    });
  }

  return clusters;
}

/**
 * Recognizes a single character cluster (main body stroke + optional dots/bars)
 * and returns a ranked list of candidates.
 */
function recognizeSingleCluster(
  cluster: StrokeStats[],
  mode: HandwritingRecognitionMode
): HandwritingCandidate[] {
  // Separate dots vs non-dot strokes
  const dotStrokes = cluster.filter((s) => s.isDot);
  const bodyStrokes = cluster.filter((s) => !s.isDot);

  // If all strokes are dots, e.g. period '.' or zero '۰'
  if (bodyStrokes.length === 0) {
    return [
      { text: '۰', labelFa: 'صفر فارسی (۰)', category: 'fa-digit', confidence: 95 },
      { text: '.', labelFa: 'نقطه (.)', category: 'symbol', confidence: 92 },
    ];
  }

  // Pick the primary (longest path) stroke as the main body, and count auxiliary bars
  const sortedByLen = [...bodyStrokes].sort((a, b) => b.pathLen - a.pathLen);
  const mainBody = sortedByLen[0];
  const auxStrokes = sortedByLen.slice(1);

  // Check if auxStrokes are crossbars/slashes (like آ, ک, گ, +, =, ×, t)
  let barCount = 0;
  const combinedBodyPoints: Point2D[] = [...mainBody.points];
  for (const aux of auxStrokes) {
    if (aux.pathLen <= mainBody.pathLen * 1.15 && aux.points.length <= 40) {
      barCount++;
    } else {
      combinedBodyPoints.push(...aux.points);
    }
  }

  // Geometric disambiguation for 2-stroke '+' vs '='
  const isPlusLike =
    bodyStrokes.length === 2 &&
    dotStrokes.length === 0 &&
    ((bodyStrokes[0].width > bodyStrokes[0].height * 1.8 &&
      bodyStrokes[1].height > bodyStrokes[1].width * 1.8) ||
      (bodyStrokes[1].width > bodyStrokes[1].height * 1.8 &&
        bodyStrokes[0].height > bodyStrokes[0].width * 1.8));

  const isEqualsLike =
    bodyStrokes.length === 2 &&
    dotStrokes.length === 0 &&
    bodyStrokes[0].width > bodyStrokes[0].height * 1.8 &&
    bodyStrokes[1].width > bodyStrokes[1].height * 1.8 &&
    Math.abs(bodyStrokes[0].cy - bodyStrokes[1].cy) > 6;

  const dotCount = Math.min(3, dotStrokes.length);
  let dotPos: 'none' | 'above' | 'below' | 'inside' = 'none';
  if (dotCount > 0) {
    const avgDotY = dotStrokes.reduce((s, d) => s + d.cy, 0) / dotStrokes.length;
    if (avgDotY < mainBody.minY + mainBody.height * 0.35) {
      dotPos = 'above';
    } else if (avgDotY > mainBody.maxY - mainBody.height * 0.25) {
      dotPos = 'below';
    } else {
      dotPos = 'inside';
    }
  }

  // Special case: division sign '÷' has 1 horizontal line + 2 dots (1 above, 1 below)
  const isDivisionLike =
    dotCount === 2 &&
    mainBody.width / mainBody.height > 2.0 &&
    dotStrokes.some((d) => d.cy < mainBody.cy) &&
    dotStrokes.some((d) => d.cy > mainBody.cy);

  const normInput = normalizePointsToBox100(combinedBodyPoints);

  // Filter prototypes by active mode
  const eligibleProtos = NORMALIZED_PROTOTYPES.filter((p) => {
    if (mode === 'fa-digits') return p.category === 'fa-digit' || p.category === 'symbol';
    if (mode === 'en-digits') return p.category === 'en-digit' || p.category === 'symbol';
    if (mode === 'fa-text') return p.category === 'fa-letter' || p.category === 'fa-digit';
    if (mode === 'en-text') return p.category === 'en-letter' || p.category === 'en-digit';
    if (mode === 'symbols') return p.category === 'symbol';
    return true;
  });

  const scoredByChar = new Map<string, HandwritingCandidate>();

  for (const proto of eligibleProtos) {
    let dist = computePathSimilarityDistance(normInput.normalized, proto.normPts);

    if (isPlusLike) {
      if (proto.char === '+') dist *= 0.25;
      else if (proto.char === '=') dist += 35;
    } else if (isEqualsLike) {
      if (proto.char === '=') dist *= 0.25;
      else if (proto.char === '+') dist += 35;
    }

    // 1. Dot count & dot position bonus/penalty (critical for ب پ ت ث ج چ ح خ د ذ ر ز ژ س ش ص ض ط ظ ع غ ف ق ن)
    if (isDivisionLike && proto.char === '÷') {
      dist *= 0.35;
    } else if (proto.dots !== dotCount) {
      dist += Math.abs(proto.dots - dotCount) * 26;
    } else if (dotCount > 0) {
      if (proto.dotPos === dotPos) {
        dist *= 0.62; // Strong boost when both dot count and dot position match!
      } else {
        dist += 18;
      }
    }

    // 2. Auxiliary bar count bonus/penalty (for آ, ک, گ, +, ×, =, t, A, F)
    if (proto.bars !== barCount) {
      dist += Math.abs(proto.bars - barCount) * 19;
    } else if (barCount > 0) {
      dist *= 0.68;
    }

    // 3. Aspect ratio check
    const [minA, maxA] = proto.aspectRange;
    if (normInput.aspect < minA) {
      dist += (minA - normInput.aspect) * 28;
    } else if (normInput.aspect > maxA) {
      dist += (normInput.aspect - maxA) * 18;
    }

    // 4. Closed loop check (۰, ۵, ه, 0, 8, O, D)
    if (proto.isClosedLoop && normInput.isClosed) {
      dist *= 0.78;
    } else if (proto.isClosedLoop && !normInput.isClosed) {
      dist += 14;
    }

    // 5. Mode preference boost
    if (mode === 'fa-digits' && proto.category === 'fa-digit') dist *= 0.82;
    if (mode === 'en-digits' && proto.category === 'en-digit') dist *= 0.82;
    if (mode === 'fa-text' && proto.category === 'fa-letter') dist *= 0.85;
    if (mode === 'en-text' && proto.category === 'en-letter') dist *= 0.85;

    const confidence = Math.max(12, Math.min(99, Math.round(100 - dist * 1.15)));
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
 * Main Offline Gboard-Style Handwriting Recognizer:
 * Recognizes single or multi-character strokes (Persian digits, English digits,
 * Persian letters & words, English letters & words, and math/punctuation symbols)
 * with 100% offline execution.
 */
export function recognizeOfflineHandwriting(
  strokes: Point2D[][],
  mode: HandwritingRecognitionMode = 'all',
  currentTextPrefix: string = ''
): HandwritingRecognitionOutput {
  const nonEmpty = strokes.filter((s) => s.length > 0);
  if (nonEmpty.length === 0) {
    return {
      bestMatch: '',
      bestConfidence: 0,
      candidates: [],
      wordCompletions: OFFLINE_WORD_DICTIONARY_FA.slice(0, 6),
      clusterCount: 0,
    };
  }

  const clusters = clusterHandwritingStrokes(nonEmpty, mode);
  if (clusters.length === 1) {
    const singleCandidates = recognizeSingleCluster(clusters[0], mode).slice(0, 8);
    const best = singleCandidates[0]?.text ?? '';
    const bestConfidence = singleCandidates[0]?.confidence ?? 0;

    const searchPrefix = (currentTextPrefix + best).trim().toLowerCase();
    const lowerBest = best.toLowerCase();
    const dict = mode === 'en-text' ? OFFLINE_WORD_DICTIONARY_EN : OFFLINE_WORD_DICTIONARY_FA;
    const matchedWords = searchPrefix
      ? dict.filter(
          (w) =>
            w.toLowerCase().startsWith(searchPrefix) ||
            (lowerBest.length > 0 && w.toLowerCase().startsWith(lowerBest)) ||
            (lowerBest.length > 0 && w.toLowerCase().includes(lowerBest))
        )
      : dict;
    const wordCompletions = (matchedWords.length > 0 ? matchedWords : dict).slice(0, 6);

    return {
      bestMatch: best,
      bestConfidence,
      candidates: singleCandidates,
      wordCompletions,
      clusterCount: 1,
    };
  }

  // Multi-cluster recognition (e.g. writing multi-digit number ۱۲۵ or multi-letter word سلام)
  const perClusterRankings = clusters.map((c) => recognizeSingleCluster(c, mode));
  const combinedBest = perClusterRankings.map((r) => r[0]?.text ?? '').join('');
  const avgConfidence = Math.round(
    perClusterRankings.reduce((s, r) => s + (r[0]?.confidence ?? 70), 0) /
      perClusterRankings.length
  );

  // Build top alternative multi-character combinations
  const multiCandidates: HandwritingCandidate[] = [
    {
      text: combinedBest,
      labelFa: `نوشتار ترکیبی (${combinedBest})`,
      category: 'word',
      confidence: avgConfidence,
    },
  ];

  // Alternative using #2 candidate of the least confident cluster
  for (let i = 0; i < perClusterRankings.length; i++) {
    if (perClusterRankings[i].length > 1) {
      const altText = perClusterRankings
        .map((r, idx) => (idx === i ? r[1].text : r[0]?.text ?? ''))
        .join('');
      if (altText !== combinedBest && !multiCandidates.some((c) => c.text === altText)) {
        multiCandidates.push({
          text: altText,
          labelFa: `پیشنهاد جایگزین (${altText})`,
          category: 'word',
          confidence: Math.max(50, avgConfidence - 6),
        });
      }
    }
  }

  // Also add single-cluster recognition (in case all strokes were meant as one single character)
  const allStrokesAsOne = recognizeSingleCluster(clusters.flat(), mode).slice(0, 4);
  for (const singleCand of allStrokesAsOne) {
    if (!multiCandidates.some((c) => c.text === singleCand.text)) {
      multiCandidates.push(singleCand);
    }
  }

  const dict = mode === 'en-text' ? OFFLINE_WORD_DICTIONARY_EN : OFFLINE_WORD_DICTIONARY_FA;
  const wordCompletions = dict
    .filter((w) => w.startsWith(combinedBest) || w.startsWith(combinedBest[0] ?? ''))
    .slice(0, 6);

  return {
    bestMatch: combinedBest,
    bestConfidence: avgConfidence,
    candidates: multiCandidates.slice(0, 8),
    wordCompletions: wordCompletions.length > 0 ? wordCompletions : dict.slice(0, 5),
    clusterCount: clusters.length,
  };
}
