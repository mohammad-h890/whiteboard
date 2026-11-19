export interface Point2D {
  x: number;
  y: number;
}

export type RecognizedShapeType =
  | 'freehand'
  | 'line'
  | 'circle'
  | 'ellipse'
  | 'rectangle'
  | 'rhombus'
  | 'trapezoid'
  | 'parallelogram'
  | 'triangle'
  | 'pentagon'
  | 'hexagon'
  | 'octagon';

export interface ShapeRecognitionResult {
  type: RecognizedShapeType;
  snappedPoints: Point2D[];
  labelFa: string;
}

/**
 * Point-to-line-segment Euclidean distance.
 */
function pointToSegmentDist(p: Point2D, a: Point2D, b: Point2D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/**
 * Minimum distance from point `p` to a closed polygon defined by `vertices`.
 */
function pointToPolygonDist(p: Point2D, vertices: Point2D[]): number {
  let minDist = Infinity;
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % vertices.length];
    const d = pointToSegmentDist(p, a, b);
    if (d < minDist) minDist = d;
  }
  return minDist;
}

/**
 * Resamples a polyline into `numPoints` equidistant points along its arc length
 * so recognition is invariant to drawing speed.
 */
function resampleEquidistant(points: Point2D[], numPoints: number = 64): Point2D[] {
  if (points.length <= 2) return points;
  let totalLen = 0;
  for (let i = 1; i < points.length; i++) {
    totalLen += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  if (totalLen < 1e-3) return points;

  const step = totalLen / (numPoints - 1);
  const result: Point2D[] = [{ ...points[0] }];
  let accDist = 0;
  let prev = { ...points[0] };

  for (let i = 1; i < points.length; i++) {
    const curr = points[i];
    let segLen = Math.hypot(curr.x - prev.x, curr.y - prev.y);
    while (accDist + segLen >= step && result.length < numPoints - 1) {
      const remain = step - accDist;
      const ratio = segLen === 0 ? 0 : remain / segLen;
      const nx = prev.x + ratio * (curr.x - prev.x);
      const ny = prev.y + ratio * (curr.y - prev.y);
      const interp = { x: nx, y: ny };
      result.push(interp);
      prev = interp;
      segLen = Math.hypot(curr.x - prev.x, curr.y - prev.y);
      accDist = 0;
    }
    accDist += segLen;
    prev = curr;
  }

  result.push({ ...points[points.length - 1] });
  return result;
}

/**
 * Ramer-Douglas-Peucker polyline simplification for polygon corner detection.
 */
function simplifyPolylineRDP(points: Point2D[], epsilon: number): Point2D[] {
  if (points.length <= 2) return points;
  let maxDist = 0;
  let index = 0;
  const first = points[0];
  const last = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const d = pointToSegmentDist(points[i], first, last);
    if (d > maxDist) {
      index = i;
      maxDist = d;
    }
  }

  if (maxDist > epsilon) {
    const left = simplifyPolylineRDP(points.slice(0, index + 1), epsilon);
    const right = simplifyPolylineRDP(points.slice(index), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [first, last];
}

/**
 * Extracts clean polygon corners from a closed stroke by trimming start/end overlap tails,
 * applying RDP simplification, collapsing short micro-edges, and merging near-collinear edges.
 */
function extractClosedPolygonVertices(points: Point2D[], diag: number): Point2D[] {
  if (points.length < 3) return points;

  // Trim trailing overlap points near the start point so closing a square doesn't create a fake 5th corner
  const trimmed = [...points];
  while (
    trimmed.length > 8 &&
    Math.hypot(
      trimmed[trimmed.length - 1].x - trimmed[0].x,
      trimmed[trimmed.length - 1].y - trimmed[0].y
    ) <
      diag * 0.09
  ) {
    trimmed.pop();
  }

  const closedInput = [...trimmed, { ...trimmed[0] }];
  const rdp = simplifyPolylineRDP(closedInput, diag * 0.052);
  let verts = rdp.slice(0, -1); // remove duplicate closing vertex
  if (verts.length < 3) return verts;

  // Collapse micro-edges shorter than 0.14 * diag by averaging adjacent close corners
  let changed = true;
  while (changed && verts.length > 3) {
    changed = false;
    for (let i = 0; i < verts.length; i++) {
      const nextIdx = (i + 1) % verts.length;
      const curr = verts[i];
      const next = verts[nextIdx];
      if (Math.hypot(next.x - curr.x, next.y - curr.y) < diag * 0.14) {
        verts[i] = { x: (curr.x + next.x) / 2, y: (curr.y + next.y) / 2 };
        verts.splice(nextIdx, 1);
        changed = true;
        break;
      }
    }
  }

  // Merge near-collinear vertices (including index 0 if user started drawing mid-edge!)
  changed = true;
  while (changed && verts.length > 3) {
    changed = false;
    for (let i = 0; i < verts.length; i++) {
      const prev = verts[(i - 1 + verts.length) % verts.length];
      const curr = verts[i];
      const next = verts[(i + 1) % verts.length];
      const a1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
      const a2 = Math.atan2(next.y - curr.y, next.x - curr.x);
      let diff = Math.abs(a2 - a1);
      if (diff > Math.PI) diff = 2 * Math.PI - diff;
      if (diff < (28 * Math.PI) / 180) {
        verts.splice(i, 1);
        changed = true;
        break;
      }
    }
  }

  return verts;
}

function buildRegularPolygonVertices(
  sides: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  startAngleRad: number = -Math.PI / 2
): Point2D[] {
  const out: Point2D[] = [];
  for (let i = 0; i < sides; i++) {
    const a = startAngleRad + (i * 2 * Math.PI) / sides;
    out.push({
      x: cx + rx * Math.cos(a),
      y: cy + ry * Math.sin(a),
    });
  }
  return out;
}

function closePolygonPoints(vertices: Point2D[]): Point2D[] {
  if (vertices.length === 0) return [];
  const rounded = vertices.map((v) => ({
    x: Number(v.x.toFixed(1)),
    y: Number(v.y.toFixed(1)),
  }));
  rounded.push({ ...rounded[0] });
  return rounded;
}

/**
 * Checks whether `verts` has `expectedSides` vertices roughly evenly distributed in angle around `(cx, cy)`.
 */
function hasRegularAngularDistribution(
  verts: Point2D[],
  expectedSides: number,
  cx: number,
  cy: number
): boolean {
  if (verts.length !== expectedSides) return false;
  const angles = verts
    .map((v) => Math.atan2(v.y - cy, v.x - cx))
    .sort((a, b) => a - b);
  const idealStep = (2 * Math.PI) / expectedSides;
  for (let i = 0; i < expectedSides; i++) {
    const nextAngle =
      i < expectedSides - 1 ? angles[i + 1] : angles[0] + 2 * Math.PI;
    const gap = nextAngle - angles[i];
    if (gap < idealStep * 0.48 || gap > idealStep * 1.55) {
      return false;
    }
  }
  return true;
}

/**
 * AI Geometric Shape Recognizer: automatically detects whether a hand-drawn stroke
 * is a straight line, triangle, square/rectangle, rhombus, trapezoid, parallelogram,
 * pentagon (5-gon), hexagon (6-gon), octagon (8-gon), circle, or ellipse,
 * and returns clean, regular geometric vertices.
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
    directDist / pathLength > 0.83 ||
    (directDist > diag * 0.8 && Math.min(width, height) / Math.max(width, height) < 0.15)
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

  // Check if closed shape (or if user is in AI shape-snap mode)
  const isClosed = directDist < diag * 0.68 || forceSnap;

  if (isClosed && points.length >= 3) {
    const sampled = resampleEquidistant(points, 64);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const rx = Math.max(10, width / 2);
    const ry = Math.max(10, height / 2);
    const avgR = (rx + ry) / 2;

    const evalPolygonFit = (polyVerts: Point2D[]): number => {
      if (polyVerts.length < 3) return Infinity;
      let errSum = 0;
      for (const p of sampled) {
        errSum += pointToPolygonDist(p, polyVerts) / diag;
      }
      return errSum / sampled.length;
    };

    // Measure what fraction of the stroke moves nearly horizontally or vertically (axis-aligned square/rectangle signature)
    let axisAlignedSegs = 0;
    let totalMeasuredSegs = 0;
    for (let i = 2; i < sampled.length; i++) {
      const dx = Math.abs(sampled[i].x - sampled[i - 2].x);
      const dy = Math.abs(sampled[i].y - sampled[i - 2].y);
      const segLen = Math.hypot(dx, dy);
      if (segLen > 1e-2) {
        totalMeasuredSegs++;
        const acuteDeg = (Math.atan2(Math.min(dx, dy), Math.max(dx, dy)) * 180) / Math.PI;
        if (acuteDeg <= 22) {
          axisAlignedSegs++;
        }
      }
    }
    const axisAlignedRatio =
      totalMeasuredSegs > 0 ? axisAlignedSegs / totalMeasuredSegs : 0;

    // Extract true polygon corners from the stroke using RDP + collinear merging
    const detectedPolyVerts = extractClosedPolygonVertices(points, diag);
    const detectedCornerCount = detectedPolyVerts.length;
    const detectedPolyErr = evalPolygonFit(detectedPolyVerts);

    // Count how many of the 4 bounding-box corners are visited within 0.22 * diag
    const bboxCorners: Point2D[] = [
      { x: minX, y: minY },
      { x: maxX, y: minY },
      { x: maxX, y: maxY },
      { x: minX, y: maxY },
    ];
    let cornersVisited = 0;
    for (const c of bboxCorners) {
      const minD = Math.min(...sampled.map((p) => Math.hypot(p.x - c.x, p.y - c.y)));
      if (minD < diag * 0.22) {
        cornersVisited++;
      }
    }

    // Check if a 4-vertex polygon has 2 near-horizontal and 2 near-vertical edges (Rectangle / Square)
    let isAxisAligned4Gon = false;
    if (detectedCornerCount === 4) {
      let horizEdges = 0;
      let vertEdges = 0;
      for (let i = 0; i < 4; i++) {
        const a = detectedPolyVerts[i];
        const b = detectedPolyVerts[(i + 1) % 4];
        const dx = Math.abs(b.x - a.x);
        const dy = Math.abs(b.y - a.y);
        const degFromHoriz = (Math.atan2(dy, dx) * 180) / Math.PI;
        if (degFromHoriz <= 24) horizEdges++;
        else if (degFromHoriz >= 66) vertEdges++;
      }
      if (horizEdges === 2 && vertEdges === 2) {
        isAxisAligned4Gon = true;
      }
    }

    // Candidate 1: Circle / Ellipse normalized fit error
    let circleRawErrSum = 0;
    for (const p of sampled) {
      const nx = (p.x - cx) / rx;
      const ny = (p.y - cy) / ry;
      const distInPixels = Math.abs(Math.hypot(nx, ny) - 1) * avgR;
      circleRawErrSum += distInPixels / diag;
    }
    const rawCircleError = circleRawErrSum / sampled.length;
    const isSharpPolygon =
      detectedCornerCount >= 3 &&
      detectedCornerCount <= 8 &&
      detectedPolyErr < rawCircleError * 0.76;
    const circleCornerPenalty =
      isAxisAligned4Gon || axisAlignedRatio >= 0.68
        ? 1.85
        : isSharpPolygon
        ? 1.55
        : cornersVisited >= 4
        ? 1.45
        : cornersVisited === 3
        ? 1.25
        : 1.0;
    const circleError = rawCircleError * circleCornerPenalty;

    // Candidate 2: Pentagon (پنج‌ضلعی منتظم - 5 equal sides & angles around center)
    const regPentagonUp = buildRegularPolygonVertices(5, cx, cy, avgR, avgR, -Math.PI / 2);
    const regPentagonInv = buildRegularPolygonVertices(5, cx, cy, avgR, avgR, Math.PI / 2);
    const regPentagonStretchedUp = buildRegularPolygonVertices(5, cx, cy, rx, ry, -Math.PI / 2);
    const regPentagonStretchedInv = buildRegularPolygonVertices(5, cx, cy, rx, ry, Math.PI / 2);
    const isPentagonUp =
      evalPolygonFit(regPentagonStretchedUp) <= evalPolygonFit(regPentagonStretchedInv);
    const pentagonVertices = isPentagonUp ? regPentagonUp : regPentagonInv;
    const regPentagonErr = Math.min(
      evalPolygonFit(regPentagonUp),
      evalPolygonFit(regPentagonInv),
      evalPolygonFit(regPentagonStretchedUp),
      evalPolygonFit(regPentagonStretchedInv)
    );
    const isValidPentagonTopology =
      detectedCornerCount === 5 &&
      !isAxisAligned4Gon &&
      axisAlignedRatio < 0.64 &&
      hasRegularAngularDistribution(detectedPolyVerts, 5, cx, cy);
    const pentagonError = isValidPentagonTopology
      ? Math.min(regPentagonErr, detectedPolyErr * 1.08) * 0.85
      : regPentagonErr * 1.35;

    // Candidate 3: Hexagon (شش‌ضلعی منتظم - 6 equal sides & angles around center)
    const regHexPointy = buildRegularPolygonVertices(6, cx, cy, avgR, avgR, -Math.PI / 2);
    const regHexFlat = buildRegularPolygonVertices(6, cx, cy, avgR, avgR, 0);
    const regHexStretchedPointy = buildRegularPolygonVertices(6, cx, cy, rx, ry, -Math.PI / 2);
    const regHexStretchedFlat = buildRegularPolygonVertices(6, cx, cy, rx, ry, 0);
    const isHexPointy =
      evalPolygonFit(regHexStretchedPointy) <= evalPolygonFit(regHexStretchedFlat);
    const hexagonVertices = isHexPointy ? regHexPointy : regHexFlat;
    const regHexErr = Math.min(
      evalPolygonFit(regHexPointy),
      evalPolygonFit(regHexFlat),
      evalPolygonFit(regHexStretchedPointy),
      evalPolygonFit(regHexStretchedFlat)
    );
    const isValidHexagonTopology =
      detectedCornerCount === 6 &&
      !isAxisAligned4Gon &&
      axisAlignedRatio < 0.64 &&
      hasRegularAngularDistribution(detectedPolyVerts, 6, cx, cy);
    const hexagonError = isValidHexagonTopology
      ? Math.min(regHexErr, detectedPolyErr * 1.08) * 0.85
      : regHexErr * 1.35;

    // Candidate 4: Octagon (هشت‌ضلعی منتظم - 8 equal sides & angles around center)
    const regOctagon = buildRegularPolygonVertices(8, cx, cy, avgR, avgR, Math.PI / 8);
    const regOctagonStretched = buildRegularPolygonVertices(8, cx, cy, rx, ry, Math.PI / 8);
    const regOctagonErr = Math.min(evalPolygonFit(regOctagon), evalPolygonFit(regOctagonStretched));
    const octagonError =
      (detectedCornerCount === 7 || detectedCornerCount === 8) &&
      axisAlignedRatio < 0.6 &&
      detectedPolyErr < rawCircleError * 0.78
        ? Math.min(detectedPolyErr, regOctagonErr) * 0.88
        : Infinity;

    // Candidate 5: Rhombus / Diamond (لوزی متقارن - 4 symmetric diamond corners)
    const rhombusCorners: Point2D[] = [
      { x: cx, y: minY },
      { x: maxX, y: cy },
      { x: cx, y: maxY },
      { x: minX, y: cy },
    ];
    const rhombusRawErr = evalPolygonFit(rhombusCorners);
    const rhombusError =
      isAxisAligned4Gon || axisAlignedRatio >= 0.62
        ? rhombusRawErr * 1.65
        : cornersVisited <= 1
        ? rhombusRawErr * 0.88
        : rhombusRawErr * 1.35;

    // Candidate 6: Rectangle / Square fit error + 4-edge & axis-alignment check
    let rectErrSum = 0;
    let hasTop = false;
    let hasBottom = false;
    let hasLeft = false;
    let hasRight = false;
    for (const p of sampled) {
      const d = pointToPolygonDist(p, bboxCorners);
      rectErrSum += d / diag;
      if (Math.abs(p.y - minY) < height * 0.22) hasTop = true;
      if (Math.abs(maxY - p.y) < height * 0.22) hasBottom = true;
      if (Math.abs(p.x - minX) < width * 0.22) hasLeft = true;
      if (Math.abs(maxX - p.x) < width * 0.22) hasRight = true;
    }
    const allFourEdges = hasTop && hasBottom && hasLeft && hasRight;
    let rectPenalty =
      (allFourEdges ? 0.95 : 1.35) *
      (cornersVisited >= 3 ? 0.85 : cornersVisited === 2 ? 1.0 : 1.25);
    if (isAxisAligned4Gon || (allFourEdges && axisAlignedRatio >= 0.64)) {
      rectPenalty *= 0.65;
    }
    const rectError = (rectErrSum / sampled.length) * rectPenalty;

    // Candidate 7: Symmetrical Trapezoid / Parallelogram ONLY when clearly non-rectangular
    let customQuadType: 'trapezoid' | 'parallelogram' | null = null;
    let customQuadError = Infinity;
    let symmetricQuadVertices: Point2D[] = bboxCorners;
    if (
      detectedCornerCount === 4 &&
      !isAxisAligned4Gon &&
      axisAlignedRatio < 0.62 &&
      detectedPolyErr < Math.min(rectError, rhombusError) * 0.78
    ) {
      const sortedByY = [...detectedPolyVerts].sort((a, b) => a.y - b.y);
      const topPair = [sortedByY[0], sortedByY[1]].sort((a, b) => a.x - b.x);
      const botPair = [sortedByY[2], sortedByY[3]].sort((a, b) => a.x - b.x);
      const topWidth = Math.max(20, topPair[1].x - topPair[0].x);
      const botWidth = Math.max(20, botPair[1].x - botPair[0].x);
      const topSlope = Math.abs(topPair[1].y - topPair[0].y) / topWidth;
      const botSlope = Math.abs(botPair[1].y - botPair[0].y) / botWidth;

      if (topSlope < 0.22 && botSlope < 0.22) {
        const widthRatio = Math.min(topWidth, botWidth) / Math.max(topWidth, botWidth, 1);
        const leftShift = topPair[0].x - botPair[0].x;
        const rightShift = topPair[1].x - botPair[1].x;

        if (widthRatio < 0.72) {
          customQuadType = 'trapezoid';
          symmetricQuadVertices = [
            { x: cx - topWidth / 2, y: minY },
            { x: cx + topWidth / 2, y: minY },
            { x: cx + botWidth / 2, y: maxY },
            { x: cx - botWidth / 2, y: maxY },
          ];
          customQuadError = detectedPolyErr * 0.9;
        } else if (
          leftShift * rightShift > 0 &&
          Math.abs(leftShift) > width * 0.14 &&
          Math.abs(rightShift) > width * 0.14
        ) {
          customQuadType = 'parallelogram';
          const slant = Math.max(width * 0.18, Math.min(width * 0.32, Math.abs(leftShift)));
          symmetricQuadVertices = [
            { x: minX + slant, y: minY },
            { x: maxX, y: minY },
            { x: maxX - slant, y: maxY },
            { x: minX, y: maxY },
          ];
          customQuadError = detectedPolyErr * 0.9;
        }
      }
    }

    // Candidate 8: Symmetrical Triangle (مثلث متقارن یا قائم‌الزاویه استاندارد)
    const uprightTri: Point2D[] = [
      { x: cx, y: minY },
      { x: maxX, y: maxY },
      { x: minX, y: maxY },
    ];
    const invertedTri: Point2D[] = [
      { x: minX, y: minY },
      { x: maxX, y: minY },
      { x: cx, y: maxY },
    ];
    const rightTriLeft: Point2D[] = [
      { x: minX, y: minY },
      { x: maxX, y: maxY },
      { x: minX, y: maxY },
    ];
    const rightTriRight: Point2D[] = [
      { x: maxX, y: minY },
      { x: maxX, y: maxY },
      { x: minX, y: maxY },
    ];

    const uprightErr = evalPolygonFit(uprightTri);
    const invertedErr = evalPolygonFit(invertedTri);
    const rightLeftErr = evalPolygonFit(rightTriLeft);
    const rightRightErr = evalPolygonFit(rightTriRight);

    let bestTriVertices = uprightTri;
    let rawTriError = uprightErr;
    if (invertedErr < rawTriError) {
      rawTriError = invertedErr;
      bestTriVertices = invertedTri;
    }
    if (rightLeftErr < rawTriError * 0.88) {
      rawTriError = rightLeftErr;
      bestTriVertices = rightTriLeft;
    }
    if (rightRightErr < rawTriError * 0.88) {
      rawTriError = rightRightErr;
      bestTriVertices = rightTriRight;
    }
    if (detectedCornerCount === 3 && detectedPolyErr < rawTriError) {
      rawTriError = detectedPolyErr;
      const candidates = [
        { verts: uprightTri, err: uprightErr },
        { verts: invertedTri, err: invertedErr },
        { verts: rightTriLeft, err: rightLeftErr },
        { verts: rightTriRight, err: rightRightErr },
      ].sort((a, b) => a.err - b.err);
      bestTriVertices = candidates[0].verts;
    }

    const triPenalty =
      isAxisAligned4Gon || cornersVisited >= 4
        ? 1.45
        : detectedCornerCount === 3
        ? 0.82
        : 1.05;
    const triError = rawTriError * triPenalty;

    // Pick the shape with the strictly lowest error score
    const minError = Math.min(
      circleError,
      rectError,
      rhombusError,
      customQuadError,
      triError,
      pentagonError,
      hexagonError,
      octagonError
    );
    const maxAllowedError = forceSnap ? 0.26 : 0.125;

    if (minError <= maxAllowedError) {
      if (pentagonError === minError) {
        return {
          type: 'pentagon',
          snappedPoints: closePolygonPoints(pentagonVertices),
          labelFa: 'پنج‌ضلعی منتظم',
        };
      }

      if (hexagonError === minError) {
        return {
          type: 'hexagon',
          snappedPoints: closePolygonPoints(hexagonVertices),
          labelFa: 'شش‌ضلعی منتظم',
        };
      }

      if (octagonError === minError) {
        return {
          type: 'octagon',
          snappedPoints: closePolygonPoints(regOctagon),
          labelFa: 'هشت‌ضلعی منتظم',
        };
      }

      if (triError === minError) {
        return {
          type: 'triangle',
          snappedPoints: closePolygonPoints(bestTriVertices),
          labelFa: 'مثلث منتظم',
        };
      }

      if (rhombusError === minError) {
        return {
          type: 'rhombus',
          snappedPoints: closePolygonPoints(rhombusCorners),
          labelFa: 'لوزی متقارن',
        };
      }

      if (customQuadError === minError && customQuadType) {
        return {
          type: customQuadType,
          snappedPoints: closePolygonPoints(symmetricQuadVertices),
          labelFa: customQuadType === 'trapezoid' ? 'ذوزنقه متقارن' : 'متوازی‌الاضلاع متقارن',
        };
      }

      if (circleError === minError) {
        const aspect = width / height;
        const isEllipse = aspect < 0.68 || aspect > 1.48;
        const circlePts: Point2D[] = [];
        const steps = 48;
        for (let i = 0; i <= steps; i++) {
          const angle = (i * 2 * Math.PI) / steps;
          circlePts.push({
            x: Number((cx + (isEllipse ? rx : avgR) * Math.cos(angle)).toFixed(1)),
            y: Number((cy + (isEllipse ? ry : avgR) * Math.sin(angle)).toFixed(1)),
          });
        }
        return {
          type: isEllipse ? 'ellipse' : 'circle',
          snappedPoints: circlePts,
          labelFa: isEllipse ? 'بیضی متقارن' : 'دایره منتظم',
        };
      }

      const isSquare = width / height >= 0.78 && width / height <= 1.28;
      const squareOrRectVerts: Point2D[] = isSquare
        ? [
            { x: cx - avgR, y: cy - avgR },
            { x: cx + avgR, y: cy - avgR },
            { x: cx + avgR, y: cy + avgR },
            { x: cx - avgR, y: cy + avgR },
          ]
        : bboxCorners;

      return {
        type: 'rectangle',
        snappedPoints: closePolygonPoints(squareOrRectVerts),
        labelFa: isSquare ? 'مربع منتظم' : 'مستطیل هندسی',
      };
    }
  }

  return { type: 'freehand', snappedPoints: points, labelFa: 'خط آزاد' };
}

/**
 * Checks whether an eraser circle of `radius` centered at `center` touches ANY point or line segment
 * of a stroke path (including 2-point straight lines, 4-point rectangles, and 3-point triangles).
 */
export function isStrokeHitByEraser(
  points: Point2D[],
  center: Point2D,
  radius: number
): boolean {
  if (points.length === 0) return false;
  if (points.length === 1) {
    return Math.hypot(points[0].x - center.x, points[0].y - center.y) <= radius;
  }
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    let dist: number;
    if (lenSq === 0) {
      dist = Math.hypot(center.x - a.x, center.y - a.y);
    } else {
      const t = Math.max(0, Math.min(1, ((center.x - a.x) * dx + (center.y - a.y) * dy) / lenSq));
      const projX = a.x + t * dx;
      const projY = a.y + t * dy;
      dist = Math.hypot(center.x - projX, center.y - projY);
    }
    if (dist <= radius) return true;
  }
  return false;
}

/**
 * Pixel Eraser: splits a stroke into remaining sub-segments when an eraser circle passes through it.
 * Automatically subdivides long segments (such as snapped straight lines, rectangles, or triangles)
 * when hit by the eraser so middle sections erase cleanly.
 */
export function eraseStrokePointsInRadius(
  points: Point2D[],
  center: Point2D,
  radius: number
): Point2D[][] {
  if (points.length < 2) return [];
  const r = Math.max(1, radius);
  const rSq = r * r;

  const segments: Point2D[][] = [];
  let currentSegment: Point2D[] = [];

  const flushCurrent = () => {
    if (currentSegment.length >= 2) {
      segments.push(currentSegment);
    }
    currentSegment = [];
  };

  for (let i = 0; i < points.length - 1; i++) {
    const A = points[i];
    const B = points[i + 1];
    const dx = B.x - A.x;
    const dy = B.y - A.y;
    const fx = A.x - center.x;
    const fy = A.y - center.y;

    const a = dx * dx + dy * dy;
    if (a < 1e-6) {
      const distSq = fx * fx + fy * fy;
      if (distSq > rSq) {
        if (currentSegment.length === 0) currentSegment.push(A);
      } else {
        flushCurrent();
      }
      continue;
    }

    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - rSq;
    const disc = b * b - 4 * a * c;

    if (disc <= 0) {
      // Entire segment is outside the eraser circle
      if (currentSegment.length === 0) currentSegment.push(A);
      currentSegment.push(B);
      continue;
    }

    const sqrtDisc = Math.sqrt(disc);
    const t1 = (-b - sqrtDisc) / (2 * a);
    const t2 = (-b + sqrtDisc) / (2 * a);

    // If the circle intersection interval [t1, t2] does not overlap [0, 1], segment is completely outside
    if (t2 <= 0 || t1 >= 1) {
      if (currentSegment.length === 0) currentSegment.push(A);
      currentSegment.push(B);
      continue;
    }

    // Segment overlaps the eraser circle on [max(0, t1), min(1, t2)]
    if (t1 > 1e-4) {
      if (currentSegment.length === 0) currentSegment.push(A);
      const enterPt: Point2D = {
        x: Number((A.x + t1 * dx).toFixed(1)),
        y: Number((A.y + t1 * dy).toFixed(1)),
      };
      currentSegment.push(enterPt);
      flushCurrent();
    } else {
      flushCurrent();
    }

    if (t2 < 1 - 1e-4) {
      const exitPt: Point2D = {
        x: Number((A.x + t2 * dx).toFixed(1)),
        y: Number((A.y + t2 * dy).toFixed(1)),
      };
      currentSegment = [exitPt, B];
    }
  }

  flushCurrent();
  return segments;
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

export type GeometricShapePresetId =
  | 'fraction-line'
  | 'radical-sign'
  | 'circle'
  | 'square'
  | 'rectangle'
  | 'triangle-eq'
  | 'triangle-right'
  | 'rhombus'
  | 'parallelogram'
  | 'trapezoid'
  | 'pentagon'
  | 'hexagon'
  | 'ellipse'
  | 'arrow'
  | 'angle'
  | 'axes'
  | 'cube-3d'
  | 'cylinder-3d';

export interface GeometricShapePresetSpec {
  id: GeometricShapePresetId;
  labelFa: string;
  category: '2d' | '3d' | 'coord' | 'math';
}

export const GEOMETRIC_SHAPE_PRESETS: GeometricShapePresetSpec[] = [
  { id: 'fraction-line', labelFa: 'خط کسری (صورت/مخرج)', category: 'math' },
  { id: 'radical-sign', labelFa: 'رادیکال بزرگ (√)', category: 'math' },
  { id: 'circle', labelFa: 'دایره', category: '2d' },
  { id: 'square', labelFa: 'مربع', category: '2d' },
  { id: 'rectangle', labelFa: 'مستطیل', category: '2d' },
  { id: 'triangle-eq', labelFa: 'مثلث متساوی‌الاضلاع', category: '2d' },
  { id: 'triangle-right', labelFa: 'مثلث قائم‌الزاویه', category: '2d' },
  { id: 'rhombus', labelFa: 'لوزی', category: '2d' },
  { id: 'parallelogram', labelFa: 'متوازی‌الاضلاع', category: '2d' },
  { id: 'trapezoid', labelFa: 'ذوزنقه', category: '2d' },
  { id: 'pentagon', labelFa: 'پنج‌ضلعی منتظم', category: '2d' },
  { id: 'hexagon', labelFa: 'شش‌ضلعی منتظم', category: '2d' },
  { id: 'ellipse', labelFa: 'بیضی', category: '2d' },
  { id: 'arrow', labelFa: 'پیکان / بردار', category: 'coord' },
  { id: 'angle', labelFa: 'زاویه هندسی (θ)', category: 'coord' },
  { id: 'axes', labelFa: 'دستگاه مختصات', category: 'coord' },
  { id: 'cube-3d', labelFa: 'مکعب سه‌بعدی', category: '3d' },
  { id: 'cylinder-3d', labelFa: 'استوانه سه‌بعدی', category: '3d' },
];

export interface MathSymbolPresetSpec {
  symbol: string;
  labelFa: string;
}

export const FREQUENT_MATH_SYMBOLS: MathSymbolPresetSpec[] = [
  { symbol: '—', labelFa: 'خط کسری ساده' },
  { symbol: '+', labelFa: 'جمع (+)' },
  { symbol: '−', labelFa: 'تفریق (−)' },
  { symbol: '×', labelFa: 'ضرب (×)' },
  { symbol: '÷', labelFa: 'تقسیم (÷)' },
  { symbol: '=', labelFa: 'مساوی (=)' },
  { symbol: '≠', labelFa: 'نامساوی (≠)' },
  { symbol: '>', labelFa: 'بزرگ‌تر (>)' },
  { symbol: '<', labelFa: 'کوچک‌تر (<)' },
  { symbol: '≥', labelFa: 'بزرگ‌تر مساوی (≥)' },
  { symbol: '≤', labelFa: 'کوچک‌تر مساوی (≤)' },
  { symbol: '±', labelFa: 'مثبت/منفی (±)' },
  { symbol: '√', labelFa: 'رادیکال (√)' },
  { symbol: 'π', labelFa: 'عدد پی (π)' },
  { symbol: '٪', labelFa: 'درصد (٪)' },
  { symbol: '°', labelFa: 'درجه (°)' },
  { symbol: '≈', labelFa: 'تقریباً مساوی (≈)' },
  { symbol: '∞', labelFa: 'بی‌نهایت (∞)' },
  { symbol: '⊥', labelFa: 'عمود بر (⊥)' },
  { symbol: '∥', labelFa: 'موازی با (∥)' },
  { symbol: '∠', labelFa: 'زاویه (∠)' },
  { symbol: '△', labelFa: 'مثلث (△)' },
];

export const READY_PERSIAN_NUMBERS: string[] = [
  '۰',
  '۱',
  '۲',
  '۳',
  '۴',
  '۵',
  '۶',
  '۷',
  '۸',
  '۹',
  '۱۰',
  '۲۰',
  '۵۰',
  '۱۰۰',
  '+',
  '−',
  '×',
  '÷',
  '=',
  '٪',
  'π',
  '√',
];

function rotateAndScalePoint(
  pt: Point2D,
  cx: number,
  cy: number,
  scale: number,
  rotationDeg: number
): Point2D {
  const rad = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const sx = pt.x * scale;
  const sy = pt.y * scale;
  return {
    x: Number((cx + sx * cos - sy * sin).toFixed(1)),
    y: Number((cy + sx * sin + sy * cos).toFixed(1)),
  };
}

/**
 * Generates clean vector stroke polylines (centered at `cx, cy`, scaled by `scale`, rotated by `rotationDeg`)
 * for any ready-made geometric shape so it can be rendered or baked directly onto the whiteboard canvas.
 */
export function generateGeometricShapeStrokes(
  shapeId: GeometricShapePresetId,
  cx: number,
  cy: number,
  scale: number = 1,
  rotationDeg: number = 0
): Point2D[][] {
  const s = Math.max(0.25, Math.min(4, scale));
  const rawPolylines: Point2D[][] = [];

  const makeRegularPolygon = (sides: number, radius: number, startAngle = -Math.PI / 2) => {
    const poly: Point2D[] = [];
    for (let i = 0; i <= sides; i++) {
      const a = startAngle + (i * 2 * Math.PI) / sides;
      poly.push({ x: radius * Math.cos(a), y: radius * Math.sin(a) });
    }
    return poly;
  };

  switch (shapeId) {
    case 'fraction-line':
      // Main crisp horizontal fraction bar
      rawPolylines.push([
        { x: -64, y: 0 },
        { x: 64, y: 0 },
      ]);
      // Top numerator guide box
      rawPolylines.push([
        { x: -28, y: -54 },
        { x: 28, y: -54 },
        { x: 28, y: -12 },
        { x: -28, y: -12 },
        { x: -28, y: -54 },
      ]);
      // Bottom denominator guide box
      rawPolylines.push([
        { x: -28, y: 12 },
        { x: 28, y: 12 },
        { x: 28, y: 54 },
        { x: -28, y: 54 },
        { x: -28, y: 12 },
      ]);
      break;
    case 'radical-sign':
      rawPolylines.push([
        { x: -68, y: 8 },
        { x: -54, y: 8 },
        { x: -40, y: 42 },
        { x: -22, y: -42 },
        { x: 66, y: -42 },
      ]);
      break;
    case 'circle':
      rawPolylines.push(makeRegularPolygon(48, 52));
      break;
    case 'ellipse': {
      const poly: Point2D[] = [];
      for (let i = 0; i <= 48; i++) {
        const a = (i * 2 * Math.PI) / 48;
        poly.push({ x: 68 * Math.cos(a), y: 40 * Math.sin(a) });
      }
      rawPolylines.push(poly);
      break;
    }
    case 'square':
      rawPolylines.push([
        { x: -46, y: -46 },
        { x: 46, y: -46 },
        { x: 46, y: 46 },
        { x: -46, y: 46 },
        { x: -46, y: -46 },
      ]);
      break;
    case 'rectangle':
      rawPolylines.push([
        { x: -66, y: -42 },
        { x: 66, y: -42 },
        { x: 66, y: 42 },
        { x: -66, y: 42 },
        { x: -66, y: -42 },
      ]);
      break;
    case 'triangle-eq':
      rawPolylines.push([
        { x: 0, y: -52 },
        { x: 54, y: 44 },
        { x: -54, y: 44 },
        { x: 0, y: -52 },
      ]);
      break;
    case 'triangle-right':
      rawPolylines.push([
        { x: -52, y: -48 },
        { x: -52, y: 48 },
        { x: 56, y: 48 },
        { x: -52, y: -48 },
      ]);
      // Right-angle square marker
      rawPolylines.push([
        { x: -52, y: 34 },
        { x: -38, y: 34 },
        { x: -38, y: 48 },
      ]);
      break;
    case 'rhombus':
      rawPolylines.push([
        { x: 0, y: -54 },
        { x: 58, y: 0 },
        { x: 0, y: 54 },
        { x: -58, y: 0 },
        { x: 0, y: -54 },
      ]);
      break;
    case 'parallelogram':
      rawPolylines.push([
        { x: -42, y: -40 },
        { x: 64, y: -40 },
        { x: 42, y: 40 },
        { x: -64, y: 40 },
        { x: -42, y: -40 },
      ]);
      break;
    case 'trapezoid':
      rawPolylines.push([
        { x: -36, y: -42 },
        { x: 36, y: -42 },
        { x: 64, y: 42 },
        { x: -64, y: 42 },
        { x: -36, y: -42 },
      ]);
      break;
    case 'pentagon':
      rawPolylines.push(makeRegularPolygon(5, 54));
      break;
    case 'hexagon':
      rawPolylines.push(makeRegularPolygon(6, 54));
      break;
    case 'arrow':
      rawPolylines.push([
        { x: -64, y: 0 },
        { x: 60, y: 0 },
      ]);
      rawPolylines.push([
        { x: 38, y: -16 },
        { x: 62, y: 0 },
        { x: 38, y: 16 },
      ]);
      break;
    case 'angle': {
      rawPolylines.push([
        { x: 56, y: -42 },
        { x: -48, y: 40 },
        { x: 64, y: 40 },
      ]);
      const arc: Point2D[] = [];
      for (let i = 0; i <= 14; i++) {
        const a = (-38 * Math.PI) / 180 + (i / 14) * ((38 * Math.PI) / 180);
        arc.push({ x: -48 + 32 * Math.cos(a), y: 40 + 32 * Math.sin(a) });
      }
      rawPolylines.push(arc);
      break;
    }
    case 'axes':
      rawPolylines.push([
        { x: -68, y: 0 },
        { x: 68, y: 0 },
      ]);
      rawPolylines.push([
        { x: 0, y: 68 },
        { x: 0, y: -68 },
      ]);
      rawPolylines.push([
        { x: 58, y: -6 },
        { x: 68, y: 0 },
        { x: 58, y: 6 },
      ]);
      rawPolylines.push([
        { x: -6, y: -58 },
        { x: 0, y: -68 },
        { x: 6, y: -58 },
      ]);
      break;
    case 'cube-3d': {
      // Front face
      rawPolylines.push([
        { x: -44, y: -22 },
        { x: 24, y: -22 },
        { x: 24, y: 46 },
        { x: -44, y: 46 },
        { x: -44, y: -22 },
      ]);
      // Back face
      rawPolylines.push([
        { x: -20, y: -46 },
        { x: 48, y: -46 },
        { x: 48, y: 22 },
        { x: -20, y: 22 },
        { x: -20, y: -46 },
      ]);
      // 4 connecting edges
      rawPolylines.push([{ x: -44, y: -22 }, { x: -20, y: -46 }]);
      rawPolylines.push([{ x: 24, y: -22 }, { x: 48, y: -46 }]);
      rawPolylines.push([{ x: 24, y: 46 }, { x: 48, y: 22 }]);
      rawPolylines.push([{ x: -44, y: 46 }, { x: -20, y: 22 }]);
      break;
    }
    case 'cylinder-3d': {
      const topOval: Point2D[] = [];
      const botOval: Point2D[] = [];
      for (let i = 0; i <= 36; i++) {
        const a = (i * 2 * Math.PI) / 36;
        topOval.push({ x: 44 * Math.cos(a), y: -36 + 14 * Math.sin(a) });
        botOval.push({ x: 44 * Math.cos(a), y: 36 + 14 * Math.sin(a) });
      }
      rawPolylines.push(topOval);
      rawPolylines.push(botOval);
      rawPolylines.push([{ x: -44, y: -36 }, { x: -44, y: 36 }]);
      rawPolylines.push([{ x: 44, y: -36 }, { x: 44, y: 36 }]);
      break;
    }
  }

  return rawPolylines.map((poly) =>
    poly.map((pt) => rotateAndScalePoint(pt, cx, cy, s, rotationDeg))
  );
}

export interface IranianLongDivisionResult {
  dividend: number;
  divisor: number;
  quotient: number;
  product: number;
  remainder: number;
}

/**
 * Computes exact Iranian Textbook Long Division (تقسیم چکشی ایرانی) metrics.
 */
export function calculateIranianLongDivision(
  dividend: number,
  divisor: number
): IranianLongDivisionResult {
  const safeDividend = Math.max(0, Math.round(Number.isFinite(dividend) ? dividend : 0));
  const safeDivisor = Math.max(1, Math.round(Number.isFinite(divisor) ? divisor : 1));
  const quotient = Math.floor(safeDividend / safeDivisor);
  const product = quotient * safeDivisor;
  const remainder = safeDividend - product;
  return {
    dividend: safeDividend,
    divisor: safeDivisor,
    quotient,
    product,
    remainder,
  };
}

export interface GroupableBoardItem {
  id: string;
  x: number;
  y: number;
  scale?: number;
  rotationDeg?: number;
  badgeColor?: string;
  groupId?: string;
  groupName?: string;
}

/**
 * Groups selected board shapes/widgets under a shared groupId and groupName.
 */
export function groupBoardItems<T extends GroupableBoardItem>(
  items: T[],
  targetIds: string[],
  groupId: string,
  groupName: string
): T[] {
  const idSet = new Set(targetIds);
  if (idSet.size < 2) return items;
  return items.map((item) =>
    idSet.has(item.id)
      ? {
          ...item,
          groupId,
          groupName,
        }
      : item
  );
}

/**
 * Ungroups board shapes either by a specific groupId or an array of item IDs.
 */
export function ungroupBoardItems<T extends GroupableBoardItem>(
  items: T[],
  groupIdOrItemIds: string | string[]
): T[] {
  const isArray = Array.isArray(groupIdOrItemIds);
  const idSet = isArray ? new Set(groupIdOrItemIds) : null;
  return items.map((item) => {
    const match = isArray
      ? idSet!.has(item.id)
      : item.groupId === groupIdOrItemIds || item.id === groupIdOrItemIds;
    if (!match) return item;
    return {
      ...item,
      groupId: undefined,
      groupName: undefined,
    };
  });
}

/**
 * Moves a board item to (newX, newY). If the item belongs to a group (groupId),
 * translates all members of the same group by the exact same (dx, dy) offset.
 */
export function moveBoardItemOrGroup<T extends GroupableBoardItem>(
  items: T[],
  targetId: string,
  newX: number,
  newY: number
): T[] {
  const target = items.find((i) => i.id === targetId);
  if (!target) return items;
  const dx = newX - target.x;
  const dy = newY - target.y;
  const gid = target.groupId;

  return items.map((item) => {
    if (item.id === targetId) {
      return { ...item, x: newX, y: newY };
    }
    if (gid && item.groupId === gid) {
      return {
        ...item,
        x: Math.max(8, item.x + dx),
        y: Math.max(36, item.y + dy),
      };
    }
    return item;
  });
}

export interface PaletteColorSpec {
  c: string;
  name: string;
  category: 'vivid' | 'warm' | 'cool' | 'pastel-dark';
}

export const DIVERSE_PALETTE_COLORS: PaletteColorSpec[] = [
  { c: '#38bdf8', name: 'آبی آسمانی', category: 'vivid' },
  { c: '#0284c7', name: 'آبی کلاسیک', category: 'vivid' },
  { c: '#1d4ed8', name: 'آبی لاجوردی', category: 'cool' },
  { c: '#10b981', name: 'سبز زمردی', category: 'vivid' },
  { c: '#16a34a', name: 'سبز چمنی', category: 'cool' },
  { c: '#84cc16', name: 'سبز لیمویی', category: 'vivid' },
  { c: '#eab308', name: 'زرد طلایی', category: 'warm' },
  { c: '#f59e0b', name: 'زرد کهربایی', category: 'vivid' },
  { c: '#f97316', name: 'نارنجی آتشین', category: 'warm' },
  { c: '#ea580c', name: 'نارنجی آجری', category: 'warm' },
  { c: '#ef4444', name: 'قرمز روشن', category: 'warm' },
  { c: '#f43f5e', name: 'قرمز مرجانی', category: 'vivid' },
  { c: '#be123c', name: 'زرشکی تیره', category: 'warm' },
  { c: '#ec4899', name: 'صورتی سرخابی', category: 'vivid' },
  { c: '#f472b6', name: 'صورتی ملایم', category: 'pastel-dark' },
  { c: '#d946ef', name: 'ارغوانی نئونی', category: 'vivid' },
  { c: '#a855f7', name: 'بنفش یاسی', category: 'cool' },
  { c: '#7c3aed', name: 'بنفش سلطنتی', category: 'cool' },
  { c: '#6366f1', name: 'نیلی', category: 'cool' },
  { c: '#14b8a6', name: 'فیروزه‌ای', category: 'cool' },
  { c: '#06b6d4', name: 'سیان / آبی فیروزه‌ای', category: 'cool' },
  { c: '#92400e', name: 'قهوه‌ای', category: 'pastel-dark' },
  { c: '#475569', name: 'خاکستری سربی', category: 'pastel-dark' },
  { c: '#0f172a', name: 'مشکی / سرمه‌ای تیره', category: 'pastel-dark' },
];

export const INITIAL_RECENT_COLORS: string[] = [
  '#38bdf8',
  '#10b981',
  '#f59e0b',
  '#f43f5e',
  '#a855f7',
  '#0284c7',
];

export const INITIAL_SAVED_PALETTE_COLORS: string[] = [
  '#0284c7',
  '#10b981',
  '#f59e0b',
  '#e11d48',
  '#7c3aed',
  '#f97316',
];

/**
 * Prepends a newly selected color to the 'Recent Colors' list (case-insensitively deduplicated)
 * and trims the list to `maxCount`.
 */
export function addRecentColor(
  recentColors: string[],
  newColor: string,
  maxCount = 8
): string[] {
  const norm = newColor.trim().toLowerCase();
  if (!norm) return recentColors;
  const filtered = recentColors.filter((c) => c.trim().toLowerCase() !== norm);
  return [norm, ...filtered].slice(0, Math.max(1, maxCount));
}

/**
 * Adds a color to the 'Saved Palette' list if it is not already saved (up to maxCount).
 */
export function addSavedPaletteColor(
  savedColors: string[],
  colorToSave: string,
  maxCount = 12
): string[] {
  const norm = colorToSave.trim().toLowerCase();
  if (!norm) return savedColors;
  if (savedColors.some((c) => c.trim().toLowerCase() === norm)) {
    return savedColors;
  }
  return [...savedColors, norm].slice(0, Math.max(1, maxCount));
}

/**
 * Removes a color from the 'Saved Palette' list.
 */
export function removeSavedPaletteColor(
  savedColors: string[],
  colorToRemove: string
): string[] {
  const norm = colorToRemove.trim().toLowerCase();
  return savedColors.filter((c) => c.trim().toLowerCase() !== norm);
}

export interface QuickWidgetCatalogItem {
  id: string;
  labelFa: string;
  shortLabelFa: string;
  categoryFa: string;
  keywords: string;
  stampTitle: string;
  stampSummary: string;
  defaultInnerColor: string;
  extraProps?: {
    widgetKind?: 'lab-shape' | 'persian-number' | 'geo-shape';
    geoShapeId?: GeometricShapePresetId;
    persianText?: string;
    dividerColor?: string;
    divDividend?: number;
    divDivisor?: number;
    axisMin?: number;
    axisMax?: number;
    axisSubdivisions?: number;
    filled?: boolean;
  };
}

export const QUICK_WIDGET_CATALOG: QuickWidgetCatalogItem[] = [
  {
    id: 'qw-fraction-pizza',
    labelFa: 'کسر دایره‌ای (پیتزایی)',
    shortLabelFa: 'کسر دایره',
    categoryFa: 'ریاضی',
    keywords: 'کسر دایره پیتزا تقسیم صورت مخرج fraction',
    stampTitle: 'شکل کسر دایره‌ای (۳/۵)',
    stampSummary: '۳/۵',
    defaultInnerColor: '#38bdf8',
    extraProps: { dividerColor: '#0f172a', divDividend: 3, divDivisor: 5, filled: true },
  },
  {
    id: 'qw-fraction-bar',
    labelFa: 'کسر نواری (مستطیلی)',
    shortLabelFa: 'کسر نواری',
    categoryFa: 'ریاضی',
    keywords: 'کسر نواری مستطیل تقسیم fraction bar',
    stampTitle: 'شکل کسر نواری (۳/۵)',
    stampSummary: '۳/۵',
    defaultInnerColor: '#10b981',
    extraProps: { dividerColor: '#0f172a', divDividend: 3, divDivisor: 5, filled: true },
  },
  {
    id: 'qw-number-line',
    labelFa: 'محور اعداد (۰ تا ۱۰)',
    shortLabelFa: 'محور اعداد',
    categoryFa: 'ریاضی',
    keywords: 'محور اعداد کسری واحد خط اعداد number line',
    stampTitle: 'محور اعداد (۰ تا ۱۰)',
    stampSummary: '۰ تا ۱۰',
    defaultInnerColor: '#38bdf8',
    extraProps: {
      dividerColor: '#0f172a',
      axisMin: 0,
      axisMax: 10,
      axisSubdivisions: 1,
      filled: false,
    },
  },
  {
    id: 'qw-clock',
    labelFa: 'ساعت درجه‌بندی‌شده (۱ تا ۱۲)',
    shortLabelFa: 'ساعت',
    categoryFa: 'ریاضی',
    keywords: 'ساعت دقیقه عقربه زمان clock',
    stampTitle: 'ساعت آموزشی (۳:۲۵)',
    stampSummary: '۳/۲۵',
    defaultInnerColor: '#fef08a',
    extraProps: { dividerColor: '#0f172a', divDividend: 3, divDivisor: 25, filled: true },
  },
  {
    id: 'qw-iranian-division',
    labelFa: 'تقسیم چکشی ایرانی',
    shortLabelFa: 'تقسیم چکشی',
    categoryFa: 'ریاضی',
    keywords: 'تقسیم چکشی مقسوم خارج قسمت باقی مانده division',
    stampTitle: 'تقسیم چکشی ایرانی (۱۴۷ ÷ ۱۲)',
    stampSummary: '۱۴۷ ÷ ۱۲',
    defaultInnerColor: '#38bdf8',
    extraProps: { dividerColor: '#0f172a', divDividend: 147, divDivisor: 12, filled: true },
  },
  {
    id: 'qw-place-value',
    labelFa: 'مکعب ارزش مکانی (ده‌تایی و یکی)',
    shortLabelFa: 'ارزش مکانی',
    categoryFa: 'ریاضی',
    keywords: 'مکعب ارزش مکانی ده تایی یکی پایه ده',
    stampTitle: 'مکعب ارزش مکانی (۳۴)',
    stampSummary: '۳/۴',
    defaultInnerColor: '#f59e0b',
    extraProps: { dividerColor: '#0f172a', divDividend: 3, divDivisor: 4, filled: true },
  },
  {
    id: 'qw-balance-scale',
    labelFa: 'ترازوی معادله جبری',
    shortLabelFa: 'ترازو',
    categoryFa: 'ریاضی',
    keywords: 'ترازو معادله جبر تعادل',
    stampTitle: 'ترازوی معادله (۲x + ۳ = ۱۱)',
    stampSummary: '۲x + ۳ = ۱۱',
    defaultInnerColor: '#10b981',
    extraProps: { dividerColor: '#0f172a', filled: true },
  },
  {
    id: 'qw-venn',
    labelFa: 'نمودار ون مجموعه‌ها (A, B, C)',
    shortLabelFa: 'نمودار ون',
    categoryFa: 'ریاضی',
    keywords: 'نمودار ون مجموعه اشتراک اجتماع venn',
    stampTitle: 'نمودار ون مجموعه‌ها',
    stampSummary: '(A ∪ B) − C',
    defaultInnerColor: '#38bdf8',
    extraProps: { dividerColor: '#0f172a', filled: true },
  },
  {
    id: 'qw-geo-circle',
    labelFa: 'دایره هندسی',
    shortLabelFa: 'دایره',
    categoryFa: 'هندسه',
    keywords: 'دایره شکل هندسی شعاع قطر circle',
    stampTitle: 'دایره',
    stampSummary: '',
    defaultInnerColor: '#38bdf8',
    extraProps: { widgetKind: 'geo-shape', geoShapeId: 'circle', dividerColor: '#0f172a', filled: true },
  },
  {
    id: 'qw-geo-triangle',
    labelFa: 'مثلث متساوی‌الاضلاع',
    shortLabelFa: 'مثلث',
    categoryFa: 'هندسه',
    keywords: 'مثلث شکل هندسی زاویه triangle',
    stampTitle: 'مثلث متساوی‌الاضلاع',
    stampSummary: '',
    defaultInnerColor: '#f59e0b',
    extraProps: { widgetKind: 'geo-shape', geoShapeId: 'triangle-eq', dividerColor: '#0f172a', filled: true },
  },
  {
    id: 'qw-geo-rectangle',
    labelFa: 'مستطیل هندسی',
    shortLabelFa: 'مستطیل',
    categoryFa: 'هندسه',
    keywords: 'مستطیل مربع چهارضلعی هندسه rectangle',
    stampTitle: 'مستطیل',
    stampSummary: '',
    defaultInnerColor: '#10b981',
    extraProps: { widgetKind: 'geo-shape', geoShapeId: 'rectangle', dividerColor: '#0f172a', filled: true },
  },
  {
    id: 'qw-geo-cube3d',
    labelFa: 'مکعب سه‌بعدی',
    shortLabelFa: 'مکعب ۳بعدی',
    categoryFa: 'هندسه',
    keywords: 'مکعب سه بعدی حجم فضا cube 3d',
    stampTitle: 'مکعب سه‌بعدی',
    stampSummary: '',
    defaultInnerColor: '#a855f7',
    extraProps: { widgetKind: 'geo-shape', geoShapeId: 'cube-3d', dividerColor: '#0f172a', filled: true },
  },
  {
    id: 'qw-geo-axes',
    labelFa: 'دستگاه مختصات (x, y)',
    shortLabelFa: 'مختصات',
    categoryFa: 'هندسه',
    keywords: 'دستگاه مختصات دکارتی محور افقی عمودی axes',
    stampTitle: 'دستگاه مختصات',
    stampSummary: '',
    defaultInnerColor: '#38bdf8',
    extraProps: { widgetKind: 'geo-shape', geoShapeId: 'axes', dividerColor: '#0f172a', filled: false },
  },
  {
    id: 'qw-inclined-plane',
    labelFa: 'سطح شیب‌دار و دیاگرام جسم آزاد (FBD)',
    shortLabelFa: 'سطح شیب‌دار',
    categoryFa: 'فیزیک',
    keywords: 'سطح شیب دار فیزیک نیرو اصطکاک fbd',
    stampTitle: 'دیاگرام جسم آزاد (سطح شیب‌دار)',
    stampSummary: 'θ = ۳۰°',
    defaultInnerColor: '#38bdf8',
    extraProps: { dividerColor: '#0f172a', filled: true },
  },
  {
    id: 'qw-circuit',
    labelFa: 'مدار الکتریکی (اهم و مقاومت)',
    shortLabelFa: 'مدار',
    categoryFa: 'فیزیک',
    keywords: 'مدار الکتریکی مقاومت باتری جریان ولتاژ فیزیک',
    stampTitle: 'مدار الکتریکی',
    stampSummary: '۱۲V',
    defaultInnerColor: '#f59e0b',
    extraProps: { dividerColor: '#0f172a', filled: true },
  },
  {
    id: 'qw-punnett',
    labelFa: 'مربع پانت ژنتیک (زیست)',
    shortLabelFa: 'مربع پانت',
    categoryFa: 'زیست و شیمی',
    keywords: 'مربع پانت ژنتیک زیست غالب مغلوب punnett',
    stampTitle: 'مربع پانت ژنتیک (Aa × Aa)',
    stampSummary: 'Aa × Aa',
    defaultInnerColor: '#10b981',
    extraProps: { dividerColor: '#0f172a', filled: true },
  },
  {
    id: 'qw-heart',
    labelFa: 'قلب و آناتومی گردش خون',
    shortLabelFa: 'قلب',
    categoryFa: 'زیست و شیمی',
    keywords: 'قلب زیست آناتومی بطن دهلیز heart',
    stampTitle: 'آناتومی قلب انسان',
    stampSummary: '۴ حفره',
    defaultInnerColor: '#f43f5e',
    extraProps: { dividerColor: '#0f172a', filled: true },
  },
];

export const INITIAL_PINNED_WIDGET_IDS: string[] = [
  'qw-fraction-pizza',
  'qw-number-line',
  'qw-clock',
  'qw-iranian-division',
  'qw-geo-triangle',
];

/**
 * Filters the Quick Widget Catalog by a Persian or English search query.
 */
export function filterQuickWidgets(query: string): QuickWidgetCatalogItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return QUICK_WIDGET_CATALOG;
  return QUICK_WIDGET_CATALOG.filter(
    (item) =>
      item.labelFa.toLowerCase().includes(q) ||
      item.shortLabelFa.toLowerCase().includes(q) ||
      item.categoryFa.toLowerCase().includes(q) ||
      item.keywords.toLowerCase().includes(q)
  );
}

/**
 * Pins or unpins a widget ID in the user's pinned widgets list.
 */
export function togglePinnedWidgetId(
  pinnedIds: string[],
  widgetId: string
): string[] {
  if (pinnedIds.includes(widgetId)) {
    return pinnedIds.filter((id) => id !== widgetId);
  }
  return [...pinnedIds, widgetId];
}

export interface SearchableBoardToolItem {
  id: string;
  labelFa: string;
  categoryFa: string;
  keywords: string;
  actionKind: 'pen-tool' | 'board-feature' | 'lab-drawer';
  toolId?: string;
}

export const SEARCHABLE_BOARD_TOOLS: SearchableBoardToolItem[] = [
  {
    id: 'tool-fountain',
    labelFa: 'روان‌نویس هوشمند (P)',
    categoryFa: 'ابزار قلم',
    keywords: 'قلم روان‌نویس نوشتن خط خودکار pen fountain',
    actionKind: 'pen-tool',
    toolId: 'fountain',
  },
  {
    id: 'tool-pencil',
    labelFa: 'مداد تحریر طبیعی (B)',
    categoryFa: 'ابزار قلم',
    keywords: 'مداد طراحی سیاه قلم pencil',
    actionKind: 'pen-tool',
    toolId: 'pencil',
  },
  {
    id: 'tool-highlighter',
    labelFa: 'هایلایتر و ماژیک علامت‌زن (H)',
    categoryFa: 'ابزار قلم',
    keywords: 'هایلایتر ماژیک رنگ علامت highlighter',
    actionKind: 'pen-tool',
    toolId: 'highlighter',
  },
  {
    id: 'tool-shape-snap',
    labelFa: 'تشخیص خودکار اشکال (پنج‌ضلعی، شش‌ضلعی، مثلث، دایره...) (S)',
    categoryFa: 'ابزار ترسیم',
    keywords: 'شکل هوشمند خط صاف دایره مثلث مستطیل پنج ضلعی شش ضلعی لوزی snap shape',
    actionKind: 'pen-tool',
    toolId: 'shape-snap',
  },
  {
    id: 'feat-handwriting-pad',
    labelFa: 'تشخیص دست‌خط و نوشتار آفلاین (فارسی، انگلیسی، اعداد و علائم)',
    categoryFa: 'دست‌نویس هوشمند',
    keywords: 'دستخط دست نویس تشخیص حروف اعداد فارسی انگلیسی کیبورد گوگل gboard handwriting',
    actionKind: 'board-feature',
    toolId: 'handwriting-pad',
  },
  {
    id: 'tool-fill-bucket',
    labelFa: 'سطل رنگ اشکال و ابزارک‌ها (G)',
    categoryFa: 'رنگ‌آمیزی',
    keywords: 'سطل رنگ رنگ آمیزی داخل شکل ابزارک fill bucket color',
    actionKind: 'pen-tool',
    toolId: 'fill-bucket',
  },
  {
    id: 'tool-eraser-pixel',
    labelFa: 'پاک‌کن پیکسلی با تنظیم سایز (پاک کردن بخشی از شکل)',
    categoryFa: 'پاک‌کن',
    keywords: 'پاک کن پاکن پیکسلی جزئی اندازه سایز eraser pixel',
    actionKind: 'pen-tool',
    toolId: 'eraser-pixel',
  },
  {
    id: 'tool-eraser-stroke',
    labelFa: 'پاک‌کن خطی (حذف کامل خط با یک تماس) (E)',
    categoryFa: 'پاک‌کن',
    keywords: 'پاک کن پاکن خطی کامل حذف eraser stroke',
    actionKind: 'pen-tool',
    toolId: 'eraser-stroke',
  },
  {
    id: 'tool-laser',
    labelFa: 'قلم لیزری محوشونده (L)',
    categoryFa: 'ابزار اشاره',
    keywords: 'لیزر قلم لیزری اشاره محو شونده laser',
    actionKind: 'pen-tool',
    toolId: 'laser-vanish',
  },
  {
    id: 'tool-lasso',
    labelFa: 'ابزار کمند و جابه‌جایی (V)',
    categoryFa: 'ابزار انتخاب',
    keywords: 'کمند انتخاب جابه جایی تغییر رنگ lasso select',
    actionKind: 'pen-tool',
    toolId: 'lasso',
  },
  {
    id: 'feat-ruler',
    labelFa: 'خط‌کش و نقاله ۱۸۰ درجه روی تخته',
    categoryFa: 'ابزار هندسی',
    keywords: 'خط کش نقاله زاویه سانتی متر اندازه گیری ruler protractor',
    actionKind: 'board-feature',
    toolId: 'ruler',
  },
  {
    id: 'feat-table',
    labelFa: 'جدول‌ساز پویا روی تخته',
    categoryFa: 'ابزار تخته',
    keywords: 'جدول سطر ستون داده table',
    actionKind: 'board-feature',
    toolId: 'table',
  },
  {
    id: 'feat-shapes-palette',
    labelFa: 'پنل اعداد فارسی و اشکال هندسی آماده',
    categoryFa: 'ابزار تخته',
    keywords: 'اعداد فارسی اشکال هندسی آماده علامت جمع تفریق ضرب',
    actionKind: 'board-feature',
    toolId: 'shapes-palette',
  },
  {
    id: 'feat-sticky',
    labelFa: 'یادداشت چسبان و کانکتور مفهومی',
    categoryFa: 'ابزار تخته',
    keywords: 'یادداشت نوت چسبان کانکتور فلش sticky note',
    actionKind: 'board-feature',
    toolId: 'sticky',
  },
  {
    id: 'feat-labs',
    labelFa: 'آزمایشگاه‌های کامل دروس (ریاضی، فیزیک، شیمی، زیست)',
    categoryFa: 'آزمایشگاه‌ها',
    keywords: 'آزمایشگاه دروس ریاضی فیزیک شیمی زیست ادبیات labs',
    actionKind: 'lab-drawer',
    toolId: 'labs',
  },
];

export function filterBoardTools(query: string): SearchableBoardToolItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return SEARCHABLE_BOARD_TOOLS;
  return SEARCHABLE_BOARD_TOOLS.filter(
    (item) =>
      item.labelFa.toLowerCase().includes(q) ||
      item.categoryFa.toLowerCase().includes(q) ||
      item.keywords.toLowerCase().includes(q)
  );
}

export interface CustomBoardCursorSpec {
  mode: 'pen' | 'highlighter' | 'marker' | 'laser' | 'eraser' | 'fill-bucket' | 'lasso';
  /** Exact diameter in CSS pixels reflecting the real rendered tool size on the board */
  diameterPx: number;
  /** Exact radius in CSS pixels */
  radiusPx: number;
  /** Real active tool color (or eraser/laser indicator color) */
  color: string;
  /** Opacity of the inner fill representing ink density */
  fillOpacity: number;
  /** Nib shape ('square' for chisel marker, 'circle' for pens/erasers) */
  shape: 'circle' | 'square';
  /** Whether the cursor ring uses a dashed border (e.g. stroke-eraser, lasso, dashed pen) */
  dashedBorder: boolean;
  /** Whether to show an outer precision ring around very fine pen nibs (< 14px) */
  showPrecisionRing: boolean;
  /** Persian tool label for instant visual feedback */
  labelFa: string;
  /** Real logical size value in px shown in the badge */
  sizeLabelPx: number;
}

/**
 * Computes the custom cursor geometry and visual styling for any active pen or eraser tool
 * so the user gets immediate 1:1 visual feedback of the tool's real size and color on the board.
 */
export function computeCustomBoardCursor(params: {
  activeTool: string;
  strokeColor: string;
  strokeWidth: number;
  eraserSize: number;
  canvasScaleRatio?: number;
}): CustomBoardCursorSpec {
  const { activeTool, strokeColor, strokeWidth, eraserSize, canvasScaleRatio = 1 } = params;
  const scale = Number.isFinite(canvasScaleRatio) && canvasScaleRatio > 0 ? canvasScaleRatio : 1;
  const safeStrokeWidth = Math.max(1, strokeWidth);
  const safeEraserRadius = Math.max(6, eraserSize);

  // 1. Eraser modes (پاک‌کن پیکسلی، خطی، هایلایتر)
  if (
    activeTool === 'eraser-pixel' ||
    activeTool === 'eraser-stroke' ||
    activeTool === 'eraser-highlighter'
  ) {
    const rawDiameter = safeEraserRadius * 2;
    const diameterPx = Math.max(12, Math.round(rawDiameter * scale));
    return {
      mode: 'eraser',
      diameterPx,
      radiusPx: diameterPx / 2,
      color: '#f43f5e',
      fillOpacity: 0.18,
      shape: 'circle',
      dashedBorder: activeTool !== 'eraser-pixel',
      showPrecisionRing: false,
      labelFa:
        activeTool === 'eraser-pixel'
          ? 'پاک‌کن پیکسلی'
          : activeTool === 'eraser-stroke'
          ? 'پاک‌کن خطی'
          : 'پاک‌کن هایلایتر',
      sizeLabelPx: Math.round(safeEraserRadius),
    };
  }

  // 2. Highlighter (هایلایتر: 4.5x strokeWidth with translucent ink)
  if (activeTool === 'highlighter') {
    const rawDiameter = safeStrokeWidth * 4.5;
    const diameterPx = Math.max(10, Math.round(rawDiameter * scale));
    return {
      mode: 'highlighter',
      diameterPx,
      radiusPx: diameterPx / 2,
      color: strokeColor,
      fillOpacity: 0.35,
      shape: 'circle',
      dashedBorder: false,
      showPrecisionRing: false,
      labelFa: 'هایلایتر',
      sizeLabelPx: Math.round(rawDiameter),
    };
  }

  // 3. Chisel Marker (ماژیک: 2.2x strokeWidth with square nib)
  if (activeTool === 'marker') {
    const rawDiameter = safeStrokeWidth * 2.2;
    const diameterPx = Math.max(6, Math.round(rawDiameter * scale));
    return {
      mode: 'marker',
      diameterPx,
      radiusPx: diameterPx / 2,
      color: strokeColor,
      fillOpacity: 0.88,
      shape: 'square',
      dashedBorder: false,
      showPrecisionRing: diameterPx < 14,
      labelFa: 'ماژیک',
      sizeLabelPx: Math.round(rawDiameter),
    };
  }

  // 4. Vanishing Laser Pointer (قلم لیزری محوشونده)
  if (activeTool === 'laser-vanish') {
    const rawDiameter = Math.max(8, safeStrokeWidth * 1.6);
    const diameterPx = Math.max(10, Math.round(rawDiameter * scale));
    return {
      mode: 'laser',
      diameterPx,
      radiusPx: diameterPx / 2,
      color: '#ef4444',
      fillOpacity: 0.92,
      shape: 'circle',
      dashedBorder: false,
      showPrecisionRing: true,
      labelFa: 'لیزر',
      sizeLabelPx: Math.round(safeStrokeWidth),
    };
  }

  // 5. Fill-Bucket (سطل رنگ)
  if (activeTool === 'fill-bucket') {
    return {
      mode: 'fill-bucket',
      diameterPx: 20,
      radiusPx: 10,
      color: strokeColor,
      fillOpacity: 0.9,
      shape: 'circle',
      dashedBorder: false,
      showPrecisionRing: true,
      labelFa: 'سطل رنگ',
      sizeLabelPx: 20,
    };
  }

  // 6. Lasso Select & Move (کمند انتخاب و جابه‌جایی)
  if (activeTool === 'lasso') {
    return {
      mode: 'lasso',
      diameterPx: 18,
      radiusPx: 9,
      color: '#0284c7',
      fillOpacity: 0.2,
      shape: 'circle',
      dashedBorder: true,
      showPrecisionRing: false,
      labelFa: 'انتخاب و جابه‌جایی',
      sizeLabelPx: 18,
    };
  }

  // 7. Standard Pens (fountain, ballpoint, pencil, dashed, shape-snap)
  const diameterPx = Math.max(3, Math.round(safeStrokeWidth * scale));
  return {
    mode: 'pen',
    diameterPx,
    radiusPx: diameterPx / 2,
    color: strokeColor,
    fillOpacity: activeTool === 'pencil' ? 0.75 : 0.95,
    shape: 'circle',
    dashedBorder: activeTool === 'dashed' || activeTool === 'shape-snap',
    showPrecisionRing: diameterPx < 14,
    labelFa:
      activeTool === 'shape-snap'
        ? 'قلم شکل هوشمند'
        : activeTool === 'pencil'
        ? 'مداد'
        : activeTool === 'dashed'
        ? 'قلم خط‌چین'
        : 'قلم',
    sizeLabelPx: Math.round(safeStrokeWidth),
  };
}

export interface BoundingBox2D {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

/**
 * Computes the bounding box enclosing one or more stroke point arrays (used by Lasso selection).
 */
export function getStrokesBoundingBox(strokePointsList: Point2D[][]): BoundingBox2D | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let count = 0;

  for (const pts of strokePointsList) {
    for (const p of pts) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
      count++;
    }
  }

  if (count === 0) return null;
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
}

/**
 * Translates all points in a stroke by (dx, dy) for Lasso drag-and-move.
 */
export function translateStrokePoints(points: Point2D[], dx: number, dy: number): Point2D[] {
  return points.map((p) => ({
    x: Number((p.x + dx).toFixed(1)),
    y: Number((p.y + dy).toFixed(1)),
  }));
}

export interface CustomBoardShortcut {
  id: string;
  /** Normalized key combo such as 'Alt+1', 'Alt+2', 'Alt+K', 'F2' */
  keyCombo: string;
  targetKind: 'geo-shape' | 'persian-number' | 'math-symbol';
  targetValue: string;
  labelFa: string;
}

export const INITIAL_CUSTOM_BOARD_SHORTCUTS: CustomBoardShortcut[] = [
  {
    id: 'sc-fraction-line',
    keyCombo: 'Alt+1',
    targetKind: 'geo-shape',
    targetValue: 'fraction-line',
    labelFa: 'خط کسری (صورت/مخرج)',
  },
  {
    id: 'sc-radical',
    keyCombo: 'Alt+2',
    targetKind: 'geo-shape',
    targetValue: 'radical-sign',
    labelFa: 'رادیکال بزرگ (√)',
  },
  {
    id: 'sc-div-symbol',
    keyCombo: 'Alt+3',
    targetKind: 'math-symbol',
    targetValue: '÷',
    labelFa: 'علامت تقسیم (÷)',
  },
  {
    id: 'sc-mul-symbol',
    keyCombo: 'Alt+4',
    targetKind: 'math-symbol',
    targetValue: '×',
    labelFa: 'علامت ضرب (×)',
  },
  {
    id: 'sc-num-100',
    keyCombo: 'Alt+5',
    targetKind: 'persian-number',
    targetValue: '۱۰۰',
    labelFa: 'عدد ۱۰۰',
  },
];

/**
 * Normalizes a shortcut key string (e.g. 'alt + 1' -> 'Alt+1').
 */
export function normalizeShortcutCombo(rawCombo: string): string {
  const trimmed = rawCombo.trim();
  if (!trimmed) return '';
  const parts = trimmed
    .split('+')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return '';
  return parts
    .map((part) => {
      const low = part.toLowerCase();
      if (low === 'alt') return 'Alt';
      if (low === 'ctrl' || low === 'control') return 'Ctrl';
      if (low === 'shift') return 'Shift';
      return part.length === 1 ? part.toUpperCase() : part;
    })
    .join('+');
}

/**
 * Formats a keyboard event's modifiers + key into a normalized shortcut combo string.
 */
export function formatKeyboardEventToCombo(evt: {
  key: string;
  code?: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
}): string {
  const ignoredKeys = new Set(['Alt', 'Control', 'Shift', 'Meta']);
  if (ignoredKeys.has(evt.key)) return '';
  const mods: string[] = [];
  if (evt.ctrlKey) mods.push('Ctrl');
  if (evt.altKey) mods.push('Alt');
  if (evt.shiftKey) mods.push('Shift');

  let baseKey = evt.key;
  if (evt.code && evt.code.startsWith('Digit')) {
    baseKey = evt.code.replace('Digit', '');
  } else if (evt.code && evt.code.startsWith('Key')) {
    baseKey = evt.code.replace('Key', '').toUpperCase();
  } else {
    // Convert Persian digits to English digits for key combo matching
    baseKey = baseKey.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
    if (baseKey.length === 1) baseKey = baseKey.toUpperCase();
  }

  return [...mods, baseKey].join('+');
}

/**
 * Adds or updates a custom shortcut (replacing any existing shortcut with the same keyCombo).
 */
export function upsertCustomBoardShortcut(
  shortcuts: CustomBoardShortcut[],
  newItem: Omit<CustomBoardShortcut, 'keyCombo'> & { keyCombo: string }
): CustomBoardShortcut[] {
  const normCombo = normalizeShortcutCombo(newItem.keyCombo);
  if (!normCombo) return shortcuts;
  const filtered = shortcuts.filter(
    (s) =>
      s.id !== newItem.id &&
      normalizeShortcutCombo(s.keyCombo).toLowerCase() !== normCombo.toLowerCase()
  );
  return [
    ...filtered,
    {
      ...newItem,
      keyCombo: normCombo,
    },
  ];
}

/**
 * Removes a custom board shortcut by ID.
 */
export function removeCustomBoardShortcut(
  shortcuts: CustomBoardShortcut[],
  shortcutId: string
): CustomBoardShortcut[] {
  return shortcuts.filter((s) => s.id !== shortcutId);
}

/**
 * Finds a matching custom shortcut for a given key combination.
 */
export function findMatchingCustomShortcut(
  shortcuts: CustomBoardShortcut[],
  keyCombo: string
): CustomBoardShortcut | undefined {
  const norm = normalizeShortcutCombo(keyCombo).toLowerCase();
  if (!norm) return undefined;
  return shortcuts.find((s) => normalizeShortcutCombo(s.keyCombo).toLowerCase() === norm);
}

/**
 * Scales a single stroke's points around its geometric center (or a provided center)
 * for keyboard resize operations (+ / -).
 */
export function scaleStrokePointsAboutCenter(
  points: Point2D[],
  scaleFactor: number,
  customCenter?: Point2D
): Point2D[] {
  if (points.length === 0) return [];
  const clampedScale = Math.max(0.25, Math.min(4.0, scaleFactor));
  let cx = customCenter?.x ?? 0;
  let cy = customCenter?.y ?? 0;
  if (!customCenter) {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    cx = (minX + maxX) / 2;
    cy = (minY + maxY) / 2;
  }
  return points.map((p) => ({
    x: Number((cx + (p.x - cx) * clampedScale).toFixed(1)),
    y: Number((cy + (p.y - cy) * clampedScale).toFixed(1)),
  }));
}

/**
 * Scales a group of multiple strokes around their shared bounding-box center.
 */
export function scaleMultiStrokesAboutCommonCenter(
  strokePointsList: Point2D[][],
  scaleFactor: number
): Point2D[][] {
  const bbox = getStrokesBoundingBox(strokePointsList);
  if (!bbox) return strokePointsList;
  const center = {
    x: bbox.minX + bbox.width / 2,
    y: bbox.minY + bbox.height / 2,
  };
  return strokePointsList.map((pts) => scaleStrokePointsAboutCenter(pts, scaleFactor, center));
}

export interface ClampedFloatingPosition {
  left: number;
  top: number;
  wasClampedX: boolean;
  wasClampedY: boolean;
}

/**
 * Clamps any floating editor/toolbar panel strictly inside the visible viewport bounds
 * so buttons never fall off-screen when a widget or shape is near a screen corner/edge.
 */
export function clampFloatingPanelPosition(params: {
  desiredLeft: number;
  desiredTop: number;
  panelWidth: number;
  panelHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  padding?: number;
}): ClampedFloatingPosition {
  const {
    desiredLeft,
    desiredTop,
    panelWidth,
    panelHeight,
    viewportWidth,
    viewportHeight,
    padding = 12,
  } = params;

  const maxLeft = Math.max(padding, viewportWidth - panelWidth - padding);
  const maxTop = Math.max(padding, viewportHeight - panelHeight - padding);

  const left = Math.round(Math.max(padding, Math.min(maxLeft, desiredLeft)));
  const top = Math.round(Math.max(padding, Math.min(maxTop, desiredTop)));

  return {
    left,
    top,
    wasClampedX: left !== Math.round(desiredLeft),
    wasClampedY: top !== Math.round(desiredTop),
  };
}

export interface BoardWidgetHitSpec {
  id: string;
  title: string;
  x: number;
  y: number;
  scale?: number;
  widgetKind?: 'lab-shape' | 'persian-number' | 'geo-shape';
}

/**
 * Estimates the interactive hit bounding box (in board CSS pixels) of a stamped widget,
 * geometric shape, or ready-made Persian number/math symbol.
 */
export function estimateBoardWidgetHitBox(widget: BoardWidgetHitSpec): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  const sc = Math.max(0.35, widget.scale ?? 1);
  let baseW = 190;
  let baseH = 145;
  if (widget.title.includes('محور')) {
    baseW = 360;
    baseH = 120;
  } else if (widget.widgetKind === 'persian-number') {
    baseW = 115;
    baseH = 85;
  } else if (widget.widgetKind === 'geo-shape') {
    baseW = 165;
    baseH = 145;
  }
  const width = baseW * sc;
  const height = baseH * sc;
  return {
    minX: widget.x - 8,
    minY: widget.y - 8,
    maxX: widget.x + width + 8,
    maxY: widget.y + height + 8,
    width,
    height,
  };
}

/**
 * Checks whether a stroke-eraser sample point intersects a board widget, shape, or ready-made number.
 */
export function isPointHittingBoardWidget(
  pt: Point2D,
  widget: BoardWidgetHitSpec,
  eraserRadius: number
): boolean {
  const box = estimateBoardWidgetHitBox(widget);
  const r = Math.max(4, eraserRadius);
  const nearestX = Math.max(box.minX, Math.min(pt.x, box.maxX));
  const nearestY = Math.max(box.minY, Math.min(pt.y, box.maxY));
  const dx = pt.x - nearestX;
  const dy = pt.y - nearestY;
  return dx * dx + dy * dy <= r * r;
}

export interface PinnedBoardPage {
  pageNumber: number;
  label: string;
}

/**
 * Pins or unpins a whiteboard page on the board toolbar for fast 1-click switching.
 */
export function togglePinnedBoardPage(
  pinnedPages: PinnedBoardPage[],
  pageNumber: number,
  customLabel?: string
): PinnedBoardPage[] {
  const safePage = Math.max(1, Math.floor(pageNumber));
  const exists = pinnedPages.some((p) => p.pageNumber === safePage);
  if (exists) {
    return pinnedPages.filter((p) => p.pageNumber !== safePage);
  }
  const next: PinnedBoardPage[] = [
    ...pinnedPages,
    {
      pageNumber: safePage,
      label: customLabel?.trim() || `ص ${safePage}`,
    },
  ];
  return next.sort((a, b) => a.pageNumber - b.pageNumber);
}

/**
 * Updates the short label of an already-pinned whiteboard page.
 */
export function renamePinnedBoardPage(
  pinnedPages: PinnedBoardPage[],
  pageNumber: number,
  newLabel: string
): PinnedBoardPage[] {
  const trimmed = newLabel.trim();
  if (!trimmed) return pinnedPages;
  return pinnedPages.map((p) =>
    p.pageNumber === pageNumber ? { ...p, label: trimmed } : p
  );
}

export interface StrokeSelectionOverlayLayout {
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct: number;
  padPx: number;
  toolbarPlacement: 'above' | 'below';
  toolbarAlign: 'left' | 'right';
}

/**
 * Computes percentage-based CSS overlay coordinates for the dashed selection frame
 * around selected canvas strokes/shapes, accounting for stroke thickness and board clamping.
 */
export function computeStrokeSelectionOverlay(params: {
  box: BoundingBox2D;
  maxStrokeWidth: number;
  boardWidth: number;
  boardHeight: number;
  toolbarClearanceY?: number;
}): StrokeSelectionOverlayLayout {
  const {
    box,
    maxStrokeWidth,
    boardWidth,
    boardHeight,
    toolbarClearanceY = 180,
  } = params;
  const safeW = Math.max(1, boardWidth);
  const safeH = Math.max(1, boardHeight);
  const padPx = Math.max(10, Math.ceil(Math.max(0, maxStrokeWidth) / 2) + 6);

  const clampedLeft = Math.max(0, Math.min(safeW - 8, box.minX - padPx));
  const clampedTop = Math.max(0, Math.min(safeH - 8, box.minY - padPx));
  const clampedRight = Math.max(clampedLeft + 8, Math.min(safeW, box.maxX + padPx));
  const clampedBottom = Math.max(clampedTop + 8, Math.min(safeH, box.maxY + padPx));

  const overlayW = clampedRight - clampedLeft;
  const overlayH = clampedBottom - clampedTop;

  const hasRoomBelow = safeH - clampedBottom >= 64;
  const toolbarPlacement: 'above' | 'below' =
    clampedTop < toolbarClearanceY && hasRoomBelow ? 'below' : 'above';

  return {
    leftPct: Number(((clampedLeft / safeW) * 100).toFixed(4)),
    topPct: Number(((clampedTop / safeH) * 100).toFixed(4)),
    widthPct: Number(((overlayW / safeW) * 100).toFixed(4)),
    heightPct: Number(((overlayH / safeH) * 100).toFixed(4)),
    padPx,
    toolbarPlacement,
    toolbarAlign: clampedRight < 520 ? 'left' : 'right',
  };
}
