import test from 'node:test';
import assert from 'node:assert/strict';
import {
  recognizeGeometricShape,
  eraseStrokePointsInRadius,
  computeCleanedDocumentPixel,
  calculateRiemannAndDerivative,
  evaluateVennRegion,
  Point2D,
} from './canvasAndMathEngine';

test('recognizeGeometricShape detects straight line, circle, triangle, and rectangle accurately', () => {
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
  for (let i = 0; i <= 24; i++) {
    const a = (i * 2 * Math.PI) / 24;
    circlePts.push({
      x: 100 + 50 * Math.cos(a),
      y: 100 + 50 * Math.sin(a),
    });
  }
  const circleRes = recognizeGeometricShape(circlePts);
  assert.equal(circleRes.type, 'circle');
  assert.ok(circleRes.snappedPoints.length > 30);

  // Hand-drawn triangle: apex (100, 20) -> bottom-right (180, 160) -> bottom-left (20, 160) -> apex (102, 22)
  const triPts: Point2D[] = [
    { x: 100, y: 20 },
    { x: 140, y: 90 },
    { x: 180, y: 160 },
    { x: 100, y: 160 },
    { x: 20, y: 160 },
    { x: 60, y: 90 },
    { x: 102, y: 22 },
  ];
  const triRes = recognizeGeometricShape(triPts, true);
  assert.equal(triRes.type, 'triangle');
  assert.equal(triRes.snappedPoints.length, 4);

  // Hand-drawn rectangle: (20, 20) -> (180, 20) -> (180, 120) -> (20, 120) -> (20, 22)
  const rectPts: Point2D[] = [
    { x: 20, y: 20 },
    { x: 100, y: 21 },
    { x: 180, y: 20 },
    { x: 180, y: 70 },
    { x: 180, y: 120 },
    { x: 100, y: 120 },
    { x: 20, y: 120 },
    { x: 20, y: 70 },
    { x: 20, y: 22 },
  ];
  const rectRes = recognizeGeometricShape(rectPts, true);
  assert.equal(rectRes.type, 'rectangle');
  assert.equal(rectRes.snappedPoints.length, 5);
});

test('eraseStrokePointsInRadius splits a stroke into two segments when erased in the middle', () => {
  const pts: Point2D[] = [
    { x: 0, y: 0 },
    { x: 20, y: 0 },
    { x: 50, y: 0 }, // inside eraser at (50,0)
    { x: 80, y: 0 },
    { x: 100, y: 0 },
  ];
  const segments = eraseStrokePointsInRadius(pts, { x: 50, y: 0 }, 15);
  assert.equal(segments.length, 2);
  assert.deepEqual(segments[0], [
    { x: 0, y: 0 },
    { x: 20, y: 0 },
  ]);
  assert.deepEqual(segments[1], [
    { x: 80, y: 0 },
    { x: 100, y: 0 },
  ]);
});

test('computeCleanedDocumentPixel removes dark shadows while preserving ink contrast', () => {
  // Shadowed white paper: pixel=135, local background=145 -> ratio=0.93 -> pure white (255)
  assert.equal(computeCleanedDocumentPixel(135, 145, 0.84), 255);
  // Handwritten ink under shadow: pixel=65, local background=145 -> ratio=0.44 -> dark ink (18)
  assert.equal(computeCleanedDocumentPixel(65, 145, 0.84), 18);
});

test('calculateRiemannAndDerivative computes tangent slope and Riemann rectangles', () => {
  const res = calculateRiemannAndDerivative('parabola', 2, 8);
  // f(x) = 0.5x^2 + 0.5 -> f'(2) = 2, f(2) = 2.5
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
