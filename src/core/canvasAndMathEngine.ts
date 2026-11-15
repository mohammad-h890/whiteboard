export interface Point2D {
  x: number;
  y: number;
}

export type RecognizedShapeType = 'freehand' | 'line' | 'circle' | 'rectangle' | 'triangle';

export interface ShapeRecognitionResult {
  type: RecognizedShapeType;
  snappedPoints: Point2D[];
  labelFa: string;
}

/**
 * Ramer-Douglas-Peucker polyline simplification for counting dominant corners of a hand-drawn shape.
 */
function simplifyPolylineRDP(points: Point2D[], epsilon: number): Point2D[] {
  if (points.length <= 2) return points;
  let maxDist = 0;
  let index = 0;
  const start = points[0];
  const end = points[points.length - 1];
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lenSq = dx * dx + dy * dy;

  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i];
    let dist = 0;
    if (lenSq === 0) {
      dist = Math.hypot(p.x - start.x, p.y - start.y);
    } else {
      const t = Math.max(0, Math.min(1, ((p.x - start.x) * dx + (p.y - start.y) * dy) / lenSq));
      const projX = start.x + t * dx;
      const projY = start.y + t * dy;
      dist = Math.hypot(p.x - projX, p.y - projY);
    }
    if (dist > maxDist) {
      maxDist = dist;
      index = i;
    }
  }

  if (maxDist > epsilon) {
    const left = simplifyPolylineRDP(points.slice(0, index + 1), epsilon);
    const right = simplifyPolylineRDP(points.slice(index), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [start, end];
}

/**
 * Recognizes whether a drawn stroke is a straight line, circle, rectangle, or triangle
 * and returns clean geometric vertices (Hold-to-Snap shape recognizer).
 */
export function recognizeGeometricShape(
  points: Point2D[],
  forceSnap: boolean = false
): ShapeRecognitionResult {
  if (points.length < 2) {
    return { type: 'freehand', snappedPoints: points, labelFa: 'خط آزاد' };
  }

  const first = points[0];
  const last = points[points.length - 1];
  const directDist = Math.hypot(last.x - first.x, last.y - first.y);

  let pathLength = 0;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
    if (i > 0) {
      pathLength += Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y);
    }
  }

  if (pathLength < 12) {
    return { type: 'freehand', snappedPoints: points, labelFa: 'خط آزاد' };
  }

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const diag = Math.hypot(width, height);

  // 1. Straight line check: direct distance is close to total path length or very thin bounding box
  if (
    directDist / pathLength > 0.84 ||
    (directDist > diag * 0.82 && Math.min(width, height) / Math.max(width, height) < 0.16)
  ) {
    let endX = last.x;
    let endY = last.y;
    const angleDeg = Math.abs((Math.atan2(endY - first.y, endX - first.x) * 180) / Math.PI);
    // Snap near-horizontal or near-vertical lines within 5 degrees
    if (angleDeg < 5 || angleDeg > 175) {
      endY = first.y;
    } else if (Math.abs(angleDeg - 90) < 5) {
      endX = first.x;
    }
    return {
      type: 'line',
      snappedPoints: [
        { x: Number(first.x.toFixed(1)), y: Number(first.y.toFixed(1)) },
        { x: Number(endX.toFixed(1)), y: Number(endY.toFixed(1)) },
      ],
      labelFa: 'پارهخط صاف',
    };
  }

  // Check if closed shape (or if user explicitly selected the shape-snap tool)
  const isClosed = directDist < diag * 0.65 || forceSnap;

  if (isClosed && points.length >= 4) {
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const rx = Math.max(10, width / 2);
    const ry = Math.max(10, height / 2);
    const avgR = (rx + ry) / 2;

    // A) Normalized elliptical radial error: ((x-cx)/rx)^2 + ((y-cy)/ry)^2 should be near 1 for circle/oval
    let normRadialErrorSum = 0;
    let edgeDistSum = 0;
    let cornerZonePoints = 0;

    for (const p of points) {
      const nx = (p.x - cx) / rx;
      const ny = (p.y - cy) / ry;
      const normR = Math.hypot(nx, ny);
      normRadialErrorSum += Math.abs(normR - 1);

      const dLeft = Math.abs(p.x - minX);
      const dRight = Math.abs(maxX - p.x);
      const dTop = Math.abs(p.y - minY);
      const dBottom = Math.abs(maxY - p.y);
      const minEdgeDist = Math.min(dLeft, dRight, dTop, dBottom);
      edgeDistSum += minEdgeDist / diag;

      // Check if point is near one of the 4 bounding box corners
      const nearXEdge = Math.min(dLeft, dRight) < width * 0.22;
      const nearYEdge = Math.min(dTop, dBottom) < height * 0.22;
      if (nearXEdge && nearYEdge) {
        cornerZonePoints++;
      }
    }

    const meanNormRadialError = normRadialErrorSum / points.length;
    const meanEdgeDist = edgeDistSum / points.length;
    const cornerFraction = cornerZonePoints / points.length;

    // Simplify stroke using Ramer-Douglas-Peucker to count sharp vertices
    const simplified = simplifyPolylineRDP(points, diag * 0.09);
    // If start and end are close, merge them for vertex counting
    const closedVertexCount =
      simplified.length > 2 &&
      Math.hypot(
        simplified[0].x - simplified[simplified.length - 1].x,
        simplified[0].y - simplified[simplified.length - 1].y
      ) <
        diag * 0.35
        ? simplified.length - 1
        : simplified.length;

    // Check top vs bottom horizontal spread for triangles
    const topBandPts = points.filter((p) => p.y <= minY + height * 0.25);
    const bottomBandPts = points.filter((p) => p.y >= maxY - height * 0.25);
    const topSpread =
      topBandPts.length > 0
        ? Math.max(...topBandPts.map((p) => p.x)) - Math.min(...topBandPts.map((p) => p.x))
        : width;
    const bottomSpread =
      bottomBandPts.length > 0
        ? Math.max(...bottomBandPts.map((p) => p.x)) - Math.min(...bottomBandPts.map((p) => p.x))
        : width;

    // 2. Triangle detection: either 3 RDP vertices OR narrow apex at top/bottom with wide opposite base
    const hasTriangleTaper =
      (topSpread < width * 0.45 && bottomSpread > width * 0.55) ||
      (bottomSpread < width * 0.45 && topSpread > width * 0.55);

    if (
      closedVertexCount === 3 ||
      (hasTriangleTaper && meanNormRadialError > 0.14 && cornerFraction < 0.32)
    ) {
      const inverted = bottomSpread < topSpread;
      const triPts: Point2D[] = inverted
        ? [
            { x: Number(minX.toFixed(1)), y: Number(minY.toFixed(1)) },
            { x: Number(maxX.toFixed(1)), y: Number(minY.toFixed(1)) },
            { x: Number(cx.toFixed(1)), y: Number(maxY.toFixed(1)) },
            { x: Number(minX.toFixed(1)), y: Number(minY.toFixed(1)) },
          ]
        : [
            { x: Number(cx.toFixed(1)), y: Number(minY.toFixed(1)) },
            { x: Number(maxX.toFixed(1)), y: Number(maxY.toFixed(1)) },
            { x: Number(minX.toFixed(1)), y: Number(maxY.toFixed(1)) },
            { x: Number(cx.toFixed(1)), y: Number(minY.toFixed(1)) },
          ];
      return {
        type: 'triangle',
        snappedPoints: triPts,
        labelFa: 'مثلث هندسی',
      };
    }

    // 3. Circle detection: low radial deviation and low bounding-box corner concentration
    if (meanNormRadialError < 0.21 && cornerFraction < 0.24 && closedVertexCount !== 4) {
      const circlePts: Point2D[] = [];
      const steps = 48;
      for (let i = 0; i <= steps; i++) {
        const angle = (i * 2 * Math.PI) / steps;
        circlePts.push({
          x: Number((cx + avgR * Math.cos(angle)).toFixed(1)),
          y: Number((cy + avgR * Math.sin(angle)).toFixed(1)),
        });
      }
      return {
        type: 'circle',
        snappedPoints: circlePts,
        labelFa: 'دایره استاندارد',
      };
    }

    // 4. Rectangle detection: 4 RDP vertices or strong edge-hugging
    if (closedVertexCount === 4 || meanEdgeDist < 0.12 || cornerFraction >= 0.2) {
      const rectPts: Point2D[] = [
        { x: Number(minX.toFixed(1)), y: Number(minY.toFixed(1)) },
        { x: Number(maxX.toFixed(1)), y: Number(minY.toFixed(1)) },
        { x: Number(maxX.toFixed(1)), y: Number(maxY.toFixed(1)) },
        { x: Number(minX.toFixed(1)), y: Number(maxY.toFixed(1)) },
        { x: Number(minX.toFixed(1)), y: Number(minY.toFixed(1)) },
      ];
      return {
        type: 'rectangle',
        snappedPoints: rectPts,
        labelFa: 'مستطیل هندسی',
      };
    }

    // Fallback when forceSnap is active: choose circle vs rectangle based on radial error
    if (forceSnap) {
      if (meanNormRadialError <= 0.28) {
        const circlePts: Point2D[] = [];
        for (let i = 0; i <= 48; i++) {
          const angle = (i * 2 * Math.PI) / 48;
          circlePts.push({
            x: Number((cx + avgR * Math.cos(angle)).toFixed(1)),
            y: Number((cy + avgR * Math.sin(angle)).toFixed(1)),
          });
        }
        return {
          type: 'circle',
          snappedPoints: circlePts,
          labelFa: 'دایره استاندارد',
        };
      }
      return {
        type: 'rectangle',
        snappedPoints: [
          { x: Number(minX.toFixed(1)), y: Number(minY.toFixed(1)) },
          { x: Number(maxX.toFixed(1)), y: Number(minY.toFixed(1)) },
          { x: Number(maxX.toFixed(1)), y: Number(maxY.toFixed(1)) },
          { x: Number(minX.toFixed(1)), y: Number(maxY.toFixed(1)) },
          { x: Number(minX.toFixed(1)), y: Number(minY.toFixed(1)) },
        ],
        labelFa: 'مستطیل هندسی',
      };
    }
  }

  return { type: 'freehand', snappedPoints: points, labelFa: 'خط آزاد' };
}

/**
 * Pixel Eraser: splits a stroke into remaining sub-segments when an eraser circle passes through it.
 */
export function eraseStrokePointsInRadius(
  points: Point2D[],
  center: Point2D,
  radius: number
): Point2D[][] {
  const segments: Point2D[][] = [];
  let currentSegment: Point2D[] = [];

  for (const pt of points) {
    const dist = Math.hypot(pt.x - center.x, pt.y - center.y);
    if (dist > radius) {
      currentSegment.push(pt);
    } else {
      if (currentSegment.length >= 2) {
        segments.push(currentSegment);
      }
      currentSegment = [];
    }
  }
  if (currentSegment.length >= 2) {
    segments.push(currentSegment);
  }
  return segments;
}

/**
 * Document Cleaner (Adaptive Shadow Removal & Binarization for mobile exam photos).
 * Given grayscale luminance (0-255) and local background illumination (0-255),
 * returns cleaned output pixel intensity (255 = pure white paper, 15 = crisp dark ink).
 */
export function computeCleanedDocumentPixel(
  pixelLuminance: number,
  localBackgroundLuminance: number,
  sensitivityThreshold = 0.84
): number {
  const safeBg = Math.max(30, localBackgroundLuminance);
  const normalizedRatio = pixelLuminance / safeBg;
  if (normalizedRatio < sensitivityThreshold) {
    return 18; // Crisp black/slate ink
  }
  return 255; // Pure white background (shadows eliminated)
}

export type MathFunctionId = 'parabola' | 'cubic' | 'sine';

export interface RiemannCalculusResult {
  fnLabel: string;
  derivativeAtX: number;
  valueAtX: number;
  riemannArea: number;
  exactArea: number;
  rectangles: Array<{ x: number; width: number; height: number }>;
}

/**
 * Computes live Calculus function value, tangent derivative f'(x0), and Riemann sum rectangles on [0, 4].
 */
export function calculateRiemannAndDerivative(
  fnId: MathFunctionId,
  x0: number,
  rectCount: number
): RiemannCalculusResult {
  const safeN = Math.max(2, Math.min(32, Math.round(rectCount)));
  const a = 0;
  const b = 4;
  const dx = (b - a) / safeN;

  const evalFn = (x: number): number => {
    switch (fnId) {
      case 'parabola':
        return 0.5 * x * x + 0.5;
      case 'cubic':
        return 0.15 * x * x * x - 0.3 * x * x + x + 1;
      case 'sine':
        return 2 * Math.sin(x) + 2.5;
    }
  };

  const evalDeriv = (x: number): number => {
    switch (fnId) {
      case 'parabola':
        return x;
      case 'cubic':
        return 0.45 * x * x - 0.6 * x + 1;
      case 'sine':
        return 2 * Math.cos(x);
    }
  };

  const rectangles: Array<{ x: number; width: number; height: number }> = [];
  let riemannArea = 0;
  for (let i = 0; i < safeN; i++) {
    const midX = a + (i + 0.5) * dx;
    const h = evalFn(midX);
    rectangles.push({ x: Number((a + i * dx).toFixed(3)), width: Number(dx.toFixed(3)), height: Number(h.toFixed(3)) });
    riemannArea += h * dx;
  }

  // Numerical exact integral with 200 steps
  let exactArea = 0;
  const fineDx = (b - a) / 200;
  for (let i = 0; i < 200; i++) {
    exactArea += evalFn(a + (i + 0.5) * fineDx) * fineDx;
  }

  const fnLabel =
    fnId === 'parabola'
      ? 'f(x) = 0.5x² + 0.5'
      : fnId === 'cubic'
      ? 'f(x) = 0.15x³ − 0.3x² + x + 1'
      : 'f(x) = 2sin(x) + 2.5';

  return {
    fnLabel,
    derivativeAtX: Number(evalDeriv(x0).toFixed(2)),
    valueAtX: Number(evalFn(x0).toFixed(2)),
    riemannArea: Number(riemannArea.toFixed(2)),
    exactArea: Number(exactArea.toFixed(2)),
    rectangles,
  };
}

export type VennExpressionId = 'A_union_B' | 'A_intersect_B' | 'A_minus_B' | 'A_union_B_minus_C' | 'A_intersect_B_intersect_C';

/**
 * Evaluates whether a point belonging to sets (inA, inB, inC) is shaded for a given set expression.
 */
export function evaluateVennRegion(
  expr: VennExpressionId,
  inA: boolean,
  inB: boolean,
  inC: boolean
): boolean {
  switch (expr) {
    case 'A_union_B':
      return inA || inB;
    case 'A_intersect_B':
      return inA && inB;
    case 'A_minus_B':
      return inA && !inB;
    case 'A_union_B_minus_C':
      return (inA || inB) && !inC;
    case 'A_intersect_B_intersect_C':
      return inA && inB && inC;
  }
}
