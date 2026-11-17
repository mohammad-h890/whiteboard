import test from 'node:test';
import assert from 'node:assert/strict';
import {
  recognizeGeometricShape,
  eraseStrokePointsInRadius,
  isStrokeHitByEraser,
  calculateRiemannAndDerivative,
  evaluateVennRegion,
  generateGeometricShapeStrokes,
  GEOMETRIC_SHAPE_PRESETS,
  READY_PERSIAN_NUMBERS,
  calculateIranianLongDivision,
  groupBoardItems,
  ungroupBoardItems,
  moveBoardItemOrGroup,
  GroupableBoardItem,
  DIVERSE_PALETTE_COLORS,
  addRecentColor,
  addSavedPaletteColor,
  removeSavedPaletteColor,
  QUICK_WIDGET_CATALOG,
  filterQuickWidgets,
  togglePinnedWidgetId,
  filterBoardTools,
  computeCustomBoardCursor,
  getStrokesBoundingBox,
  translateStrokePoints,
  scaleStrokePointsAboutCenter,
  scaleMultiStrokesAboutCommonCenter,
  FREQUENT_MATH_SYMBOLS,
  INITIAL_CUSTOM_BOARD_SHORTCUTS,
  upsertCustomBoardShortcut,
  removeCustomBoardShortcut,
  findMatchingCustomShortcut,
  formatKeyboardEventToCombo,
  Point2D,
} from './canvasAndMathEngine';

function samplePolygonEdges(vertices: Point2D[], samplesPerEdge = 8): Point2D[] {
  const pts: Point2D[] = [];
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % vertices.length];
    for (let s = 0; s < samplesPerEdge; s++) {
      const t = s / samplesPerEdge;
      pts.push({
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
      });
    }
  }
  pts.push({ ...vertices[0] });
  return pts;
}

test('recognizeGeometricShape detects line, circle, ellipse, triangle, rectangle, rhombus, pentagon, hexagon, and octagon accurately and regularizes crooked polygons', () => {
  const linePts: Point2D[] = [
    { x: 10, y: 10 },
    { x: 50, y: 11 },
    { x: 100, y: 12 },
    { x: 160, y: 10 },
  ];
  const lineRes = recognizeGeometricShape(linePts);
  assert.equal(lineRes.type, 'line');
  assert.equal(lineRes.snappedPoints.length, 2);

  // Hand-drawn rough circle around (100, 100) radius 50
  const circlePts: Point2D[] = [];
  for (let i = 0; i <= 28; i++) {
    const a = (i * 2 * Math.PI) / 28;
    circlePts.push({
      x: 100 + 50 * Math.cos(a),
      y: 100 + 50 * Math.sin(a),
    });
  }
  const circleRes = recognizeGeometricShape(circlePts);
  assert.equal(circleRes.type, 'circle');
  assert.ok(circleRes.snappedPoints.length > 30);

  // Hand-drawn horizontal ellipse around (120, 100) rx=80, ry=40
  const ellipsePts: Point2D[] = [];
  for (let i = 0; i <= 32; i++) {
    const a = (i * 2 * Math.PI) / 32;
    ellipsePts.push({
      x: 120 + 80 * Math.cos(a),
      y: 100 + 40 * Math.sin(a),
    });
  }
  const ellipseRes = recognizeGeometricShape(ellipsePts);
  assert.equal(ellipseRes.type, 'ellipse');

  // Hand-drawn triangle
  const triPts = samplePolygonEdges([
    { x: 100, y: 20 },
    { x: 180, y: 160 },
    { x: 20, y: 160 },
  ]);
  const triRes = recognizeGeometricShape(triPts, true);
  assert.equal(triRes.type, 'triangle');
  assert.equal(triRes.snappedPoints.length, 4);

  // Hand-drawn rectangle
  const rectPts = samplePolygonEdges([
    { x: 20, y: 20 },
    { x: 180, y: 20 },
    { x: 180, y: 120 },
    { x: 20, y: 120 },
  ]);
  const rectRes = recognizeGeometricShape(rectPts, true);
  assert.equal(rectRes.type, 'rectangle');
  assert.equal(rectRes.snappedPoints.length, 5);

  // Hand-drawn rhombus (diamond)
  const rhombusPts = samplePolygonEdges([
    { x: 100, y: 20 },
    { x: 180, y: 100 },
    { x: 100, y: 180 },
    { x: 20, y: 100 },
  ]);
  const rhombusRes = recognizeGeometricShape(rhombusPts, true);
  assert.equal(rhombusRes.type, 'rhombus');
  assert.equal(rhombusRes.snappedPoints.length, 5);

  // Crooked / asymmetric hand-drawn Pentagon (5 unequal sides) -> must snap to a 100% REGULAR pentagon!
  const crookedPentagonVertices: Point2D[] = [
    { x: 115, y: 48 },
    { x: 192, y: 98 },
    { x: 160, y: 182 },
    { x: 75, y: 176 },
    { x: 48, y: 92 },
  ];
  const pentagonPts = samplePolygonEdges(crookedPentagonVertices, 10);
  const pentagonRes = recognizeGeometricShape(pentagonPts, true);
  assert.equal(pentagonRes.type, 'pentagon');
  assert.equal(pentagonRes.snappedPoints.length, 6);
  // Verify all 5 side lengths of the snapped pentagon are equal (regular polygon)
  const pentSides: number[] = [];
  for (let i = 0; i < 5; i++) {
    const p1 = pentagonRes.snappedPoints[i];
    const p2 = pentagonRes.snappedPoints[i + 1];
    pentSides.push(Math.hypot(p2.x - p1.x, p2.y - p1.y));
  }
  assert.ok(Math.max(...pentSides) - Math.min(...pentSides) < 0.5);

  // Crooked / asymmetric hand-drawn Hexagon (6 unequal sides) -> must snap to a 100% REGULAR hexagon!
  const crookedHexagonVertices: Point2D[] = [
    { x: 122, y: 45 },
    { x: 188, y: 82 },
    { x: 182, y: 158 },
    { x: 118, y: 192 },
    { x: 54, y: 154 },
    { x: 58, y: 86 },
  ];
  const hexagonPts = samplePolygonEdges(crookedHexagonVertices, 10);
  const hexagonRes = recognizeGeometricShape(hexagonPts, true);
  assert.equal(hexagonRes.type, 'hexagon');
  assert.equal(hexagonRes.snappedPoints.length, 7);
  // Verify all 6 side lengths of the snapped hexagon are equal (regular polygon)
  const hexSides: number[] = [];
  for (let i = 0; i < 6; i++) {
    const p1 = hexagonRes.snappedPoints[i];
    const p2 = hexagonRes.snappedPoints[i + 1];
    hexSides.push(Math.hypot(p2.x - p1.x, p2.y - p1.y));
  }
  assert.ok(Math.max(...hexSides) - Math.min(...hexSides) < 0.5);

  // Hand-drawn Octagon (8 sides)
  const octagonVertices: Point2D[] = [];
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 8;
    octagonVertices.push({ x: 120 + 75 * Math.cos(a), y: 120 + 75 * Math.sin(a) });
  }
  const octagonPts = samplePolygonEdges(octagonVertices, 8);
  const octagonRes = recognizeGeometricShape(octagonPts, true);
  assert.equal(octagonRes.type, 'octagon');
  assert.equal(octagonRes.snappedPoints.length, 9);

  // Verify scaleStrokePointsAboutCenter and scaleMultiStrokesAboutCommonCenter
  const scaledPent = scaleStrokePointsAboutCenter(pentagonRes.snappedPoints, 1.2);
  const origSide = Math.hypot(
    pentagonRes.snappedPoints[1].x - pentagonRes.snappedPoints[0].x,
    pentagonRes.snappedPoints[1].y - pentagonRes.snappedPoints[0].y
  );
  const newSide = Math.hypot(
    scaledPent[1].x - scaledPent[0].x,
    scaledPent[1].y - scaledPent[0].y
  );
  assert.ok(newSide > origSide * 1.15);
  const multiScaled = scaleMultiStrokesAboutCommonCenter([pentagonRes.snappedPoints], 0.8);
  assert.equal(multiScaled.length, 1);
});

test('eraseStrokePointsInRadius and isStrokeHitByEraser work on both multi-point and 2-point segments and preserve shape corners', () => {
  const pts: Point2D[] = [
    { x: 0, y: 0 },
    { x: 20, y: 0 },
    { x: 50, y: 0 }, // inside eraser at (50,0)
    { x: 80, y: 0 },
    { x: 100, y: 0 },
  ];
  const segments = eraseStrokePointsInRadius(pts, { x: 50, y: 0 }, 15);
  assert.equal(segments.length, 2);

  // Erasing the middle of top edge of a rectangle preserves all 4 original corners intact
  const rect: Point2D[] = [
    { x: 20, y: 20 },
    { x: 180, y: 20 },
    { x: 180, y: 120 },
    { x: 20, y: 120 },
    { x: 20, y: 20 },
  ];
  const rectSegs = eraseStrokePointsInRadius(rect, { x: 100, y: 20 }, 20);
  assert.equal(rectSegs.length, 2);
  assert.deepEqual(rectSegs[0], [
    { x: 20, y: 20 },
    { x: 80, y: 20 },
  ]);
  assert.deepEqual(rectSegs[1], [
    { x: 120, y: 20 },
    { x: 180, y: 20 },
    { x: 180, y: 120 },
    { x: 20, y: 120 },
    { x: 20, y: 20 },
  ]);

  // 2-point straight line hit in the middle
  const twoPointLine: Point2D[] = [
    { x: 0, y: 0 },
    { x: 200, y: 0 },
  ];
  assert.equal(isStrokeHitByEraser(twoPointLine, { x: 100, y: 5 }, 10), true);
  assert.equal(isStrokeHitByEraser(twoPointLine, { x: 100, y: 40 }, 10), false);
});

test('calculateRiemannAndDerivative computes tangent slope and Riemann rectangles', () => {
  const res = calculateRiemannAndDerivative('parabola', 2, 8);
  assert.equal(res.derivativeAtX, 2);
  assert.equal(res.valueAtX, 2.5);
  assert.equal(res.rectangles.length, 8);
  assert.ok(Math.abs(res.riemannArea - res.exactArea) < 0.25);
});

test('evaluateVennRegion evaluates (A U B) - C accurately', () => {
  assert.equal(evaluateVennRegion('A_union_B_minus_C', true, false, false), true);
  assert.equal(evaluateVennRegion('A_union_B_minus_C', false, true, false), true);
  assert.equal(evaluateVennRegion('A_union_B_minus_C', true, true, true), false);
  assert.equal(evaluateVennRegion('A_union_B_minus_C', false, false, false), false);
});

test('generateGeometricShapeStrokes and ready-made Persian numbers generate valid geometry', () => {
  assert.ok(GEOMETRIC_SHAPE_PRESETS.length >= 16);
  assert.ok(READY_PERSIAN_NUMBERS.includes('۵'));
  assert.ok(READY_PERSIAN_NUMBERS.includes('۱۰۰'));

  const cubeStrokes = generateGeometricShapeStrokes('cube-3d', 300, 200, 1.2, 15);
  assert.equal(cubeStrokes.length, 6);

  const triStrokes = generateGeometricShapeStrokes('triangle-eq', 200, 150, 1, 0);
  assert.equal(triStrokes.length, 1);
  assert.equal(triStrokes[0].length, 4);
});

test('calculateIranianLongDivision and shape grouping (group, move together, ungroup) work accurately', () => {
  const div = calculateIranianLongDivision(147, 12);
  assert.equal(div.dividend, 147);
  assert.equal(div.divisor, 12);
  assert.equal(div.quotient, 12);
  assert.equal(div.product, 144);
  assert.equal(div.remainder, 3);

  const initialShapes: GroupableBoardItem[] = [
    { id: 's1', x: 100, y: 100 },
    { id: 's2', x: 200, y: 150 },
    { id: 's3', x: 350, y: 220 },
  ];

  const grouped = groupBoardItems(initialShapes, ['s1', 's2'], 'grp-1', 'گروه هندسی ۱');
  assert.equal(grouped[0].groupId, 'grp-1');
  assert.equal(grouped[1].groupId, 'grp-1');
  assert.equal(grouped[2].groupId, undefined);

  const moved = moveBoardItemOrGroup(grouped, 's1', 150, 130);
  assert.equal(moved[0].x, 150);
  assert.equal(moved[0].y, 130);
  assert.equal(moved[1].x, 250);
  assert.equal(moved[1].y, 180);
  assert.equal(moved[2].x, 350);
  assert.equal(moved[2].y, 220);

  const ungrouped = ungroupBoardItems(moved, 'grp-1');
  assert.equal(ungrouped[0].groupId, undefined);
  assert.equal(ungrouped[1].groupId, undefined);
});

test('DIVERSE_PALETTE_COLORS, recent/saved colors, and quick widget/tool search & pin work accurately', () => {
  assert.equal(DIVERSE_PALETTE_COLORS.length, 24);
  assert.ok(QUICK_WIDGET_CATALOG.length >= 16);

  let recents = ['#38bdf8', '#10b981', '#f59e0b'];
  recents = addRecentColor(recents, '#e11d48', 4);
  assert.deepEqual(recents, ['#e11d48', '#38bdf8', '#10b981', '#f59e0b']);

  recents = addRecentColor(recents, '#10b981', 4);
  assert.deepEqual(recents, ['#10b981', '#e11d48', '#38bdf8', '#f59e0b']);

  let saved = ['#0284c7', '#10b981'];
  saved = addSavedPaletteColor(saved, '#7c3aed', 12);
  assert.deepEqual(saved, ['#0284c7', '#10b981', '#7c3aed']);
  saved = removeSavedPaletteColor(saved, '#0284c7');
  assert.deepEqual(saved, ['#10b981', '#7c3aed']);

  const fracMatches = filterQuickWidgets('کسر');
  assert.ok(fracMatches.length >= 2);

  const eraserTools = filterBoardTools('پاک');
  assert.ok(eraserTools.length >= 2);

  let pinned = ['qw-fraction-pizza', 'qw-clock'];
  pinned = togglePinnedWidgetId(pinned, 'qw-number-line');
  assert.equal(pinned.includes('qw-number-line'), true);
  pinned = togglePinnedWidgetId(pinned, 'qw-clock');
  assert.equal(pinned.includes('qw-clock'), false);
});

test('computeCustomBoardCursor reflects real size and color for pen, highlighter, marker, and eraser', () => {
  const penCursor = computeCustomBoardCursor({
    activeTool: 'fountain',
    strokeColor: '#10b981',
    strokeWidth: 8,
    eraserSize: 24,
    canvasScaleRatio: 1,
  });
  assert.equal(penCursor.mode, 'pen');
  assert.equal(penCursor.color, '#10b981');
  assert.equal(penCursor.diameterPx, 8);
  assert.equal(penCursor.sizeLabelPx, 8);
  assert.equal(penCursor.showPrecisionRing, true);

  const highlighterCursor = computeCustomBoardCursor({
    activeTool: 'highlighter',
    strokeColor: '#f59e0b',
    strokeWidth: 6,
    eraserSize: 24,
    canvasScaleRatio: 1,
  });
  assert.equal(highlighterCursor.mode, 'highlighter');
  assert.equal(highlighterCursor.color, '#f59e0b');
  assert.equal(highlighterCursor.diameterPx, 27);

  const eraserCursor = computeCustomBoardCursor({
    activeTool: 'eraser-pixel',
    strokeColor: '#38bdf8',
    strokeWidth: 4,
    eraserSize: 32,
    canvasScaleRatio: 1,
  });
  assert.equal(eraserCursor.mode, 'eraser');
  assert.equal(eraserCursor.diameterPx, 64);
  assert.equal(eraserCursor.radiusPx, 32);
  assert.equal(eraserCursor.sizeLabelPx, 32);
});

test('getStrokesBoundingBox and translateStrokePoints support Lasso selection and movement', () => {
  const s1: Point2D[] = [
    { x: 20, y: 30 },
    { x: 120, y: 80 },
  ];
  const s2: Point2D[] = [
    { x: 50, y: 10 },
    { x: 90, y: 110 },
  ];
  const box = getStrokesBoundingBox([s1, s2]);
  assert.ok(box);
  assert.equal(box.minX, 20);
  assert.equal(box.minY, 10);
  assert.equal(box.maxX, 120);
  assert.equal(box.maxY, 110);

  const moved = translateStrokePoints(s1, 15, -10);
  assert.deepEqual(moved, [
    { x: 35, y: 20 },
    { x: 135, y: 70 },
  ]);
});

test('fraction-line preset, FREQUENT_MATH_SYMBOLS, and custom board shortcuts work accurately', () => {
  assert.ok(GEOMETRIC_SHAPE_PRESETS.some((p) => p.id === 'fraction-line'));
  assert.ok(GEOMETRIC_SHAPE_PRESETS.some((p) => p.id === 'radical-sign'));
  assert.ok(FREQUENT_MATH_SYMBOLS.length >= 16);

  const fracLineStrokes = generateGeometricShapeStrokes('fraction-line', 100, 100, 1, 0);
  assert.equal(fracLineStrokes.length, 3);

  let shortcuts = [...INITIAL_CUSTOM_BOARD_SHORTCUTS];
  const combo = formatKeyboardEventToCombo({ key: '۸', code: 'Digit8', altKey: true });
  assert.equal(combo, 'Alt+8');

  shortcuts = upsertCustomBoardShortcut(shortcuts, {
    id: 'sc-custom-8',
    keyCombo: 'alt + 8',
    targetKind: 'persian-number',
    targetValue: '۸۵',
    labelFa: 'عدد ۸۵',
  });

  const matched = findMatchingCustomShortcut(shortcuts, 'Alt+8');
  assert.ok(matched);
  assert.equal(matched.targetValue, '۸۵');

  shortcuts = removeCustomBoardShortcut(shortcuts, 'sc-custom-8');
  assert.equal(findMatchingCustomShortcut(shortcuts, 'Alt+8'), undefined);
});
