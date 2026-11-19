import test from 'node:test';
import assert from 'node:assert/strict';
import {
  recognizeOfflineHandwriting,
  removeStrokeEndpointHooks,
  fitStrokeToBezierCurve,
  HandwritingStroke,
} from './handwritingEngine';

function scaleStroke(
  pts: Array<{ x: number; y: number }>,
  offsetX = 40,
  offsetY = 30,
  scale = 120
): HandwritingStroke {
  return pts.map((p) => ({
    x: offsetX + p.x * scale,
    y: offsetY + p.y * scale,
  }));
}

test('recognizeOfflineHandwriting recognizes Persian digits (۰-۹) and multi-digit Persian numbers accurately', () => {
  const digit1 = scaleStroke([
    { x: 0.5, y: 0.1 },
    { x: 0.5, y: 0.35 },
    { x: 0.5, y: 0.65 },
    { x: 0.5, y: 0.9 },
  ]);
  assert.equal(recognizeOfflineHandwriting([digit1], 'fa-digits').bestMatch, '۱');

  const digit2 = scaleStroke([
    { x: 0.72, y: 0.18 },
    { x: 0.56, y: 0.32 },
    { x: 0.36, y: 0.2 },
    { x: 0.36, y: 0.55 },
    { x: 0.36, y: 0.9 },
  ]);
  assert.equal(recognizeOfflineHandwriting([digit2], 'fa-digits').bestMatch, '۲');

  const digit7 = scaleStroke([
    { x: 0.2, y: 0.16 },
    { x: 0.35, y: 0.5 },
    { x: 0.5, y: 0.88 },
    { x: 0.65, y: 0.5 },
    { x: 0.8, y: 0.16 },
  ]);
  assert.equal(recognizeOfflineHandwriting([digit7], 'fa-digits').bestMatch, '۷');

  const digit8 = scaleStroke([
    { x: 0.2, y: 0.88 },
    { x: 0.35, y: 0.5 },
    { x: 0.5, y: 0.16 },
    { x: 0.65, y: 0.5 },
    { x: 0.8, y: 0.88 },
  ]);
  assert.equal(recognizeOfflineHandwriting([digit8], 'fa-digits').bestMatch, '۸');

  // Multi-digit Persian number: ۱۷
  const left1 = scaleStroke(
    [
      { x: 0.5, y: 0.12 },
      { x: 0.5, y: 0.5 },
      { x: 0.5, y: 0.88 },
    ],
    30,
    30,
    100
  );
  const right7 = scaleStroke(
    [
      { x: 0.2, y: 0.16 },
      { x: 0.5, y: 0.88 },
      { x: 0.8, y: 0.16 },
    ],
    220,
    30,
    100
  );
  const multiFa = recognizeOfflineHandwriting([left1, right7], 'fa-digits');
  assert.equal(multiFa.bestMatch, '۱۷');
  assert.equal(multiFa.clusterCount, 2);
});

test('recognizeOfflineHandwriting recognizes English digits (0-9) and multi-digit English numbers', () => {
  const en0 = scaleStroke([
    { x: 0.5, y: 0.12 },
    { x: 0.8, y: 0.3 },
    { x: 0.82, y: 0.5 },
    { x: 0.8, y: 0.7 },
    { x: 0.5, y: 0.88 },
    { x: 0.2, y: 0.7 },
    { x: 0.18, y: 0.5 },
    { x: 0.2, y: 0.3 },
    { x: 0.5, y: 0.12 },
  ]);
  assert.equal(recognizeOfflineHandwriting([en0], 'en-digits').bestMatch, '0');

  const en7 = scaleStroke([
    { x: 0.2, y: 0.16 },
    { x: 0.5, y: 0.16 },
    { x: 0.82, y: 0.16 },
    { x: 0.6, y: 0.52 },
    { x: 0.38, y: 0.88 },
  ]);
  assert.equal(recognizeOfflineHandwriting([en7], 'en-digits').bestMatch, '7');

  const en4 = scaleStroke(
    [
      { x: 0.64, y: 0.14 },
      { x: 0.2, y: 0.64 },
      { x: 0.82, y: 0.64 },
      { x: 0.64, y: 0.64 },
      { x: 0.64, y: 0.92 },
    ],
    30,
    30,
    100
  );
  const en2 = scaleStroke(
    [
      { x: 0.22, y: 0.28 },
      { x: 0.48, y: 0.12 },
      { x: 0.76, y: 0.26 },
      { x: 0.7, y: 0.48 },
      { x: 0.2, y: 0.88 },
      { x: 0.82, y: 0.88 },
    ],
    200,
    30,
    100
  );
  assert.equal(recognizeOfflineHandwriting([en4, en2], 'en-digits').bestMatch, '42');
});

test('recognizeOfflineHandwriting recognizes math & punctuation symbols (+, =, ÷, ×, >, <, √)', () => {
  // Plus (+)
  const plusH = scaleStroke([
    { x: 0.2, y: 0.5 },
    { x: 0.5, y: 0.5 },
    { x: 0.8, y: 0.5 },
  ]);
  const plusV = scaleStroke([
    { x: 0.5, y: 0.2 },
    { x: 0.5, y: 0.5 },
    { x: 0.5, y: 0.8 },
  ]);
  assert.equal(recognizeOfflineHandwriting([plusH, plusV], 'symbols').bestMatch, '+');

  // Equals (=)
  const eqTop = scaleStroke([
    { x: 0.2, y: 0.38 },
    { x: 0.5, y: 0.38 },
    { x: 0.8, y: 0.38 },
  ]);
  const eqBot = scaleStroke([
    { x: 0.2, y: 0.62 },
    { x: 0.5, y: 0.62 },
    { x: 0.8, y: 0.62 },
  ]);
  assert.equal(recognizeOfflineHandwriting([eqTop, eqBot], 'symbols').bestMatch, '=');

  // Division (÷)
  const divBar = scaleStroke([
    { x: 0.15, y: 0.5 },
    { x: 0.85, y: 0.5 },
  ]);
  const dotTop: HandwritingStroke = [
    { x: 100, y: 55 },
    { x: 102, y: 56 },
  ];
  const dotBot: HandwritingStroke = [
    { x: 100, y: 125 },
    { x: 102, y: 126 },
  ];
  assert.equal(recognizeOfflineHandwriting([divBar, dotTop, dotBot], 'symbols').bestMatch, '÷');

  // Greater than (>) and Less than (<)
  const gtStroke = scaleStroke([
    { x: 0.22, y: 0.18 },
    { x: 0.78, y: 0.5 },
    { x: 0.22, y: 0.82 },
  ]);
  assert.equal(recognizeOfflineHandwriting([gtStroke], 'symbols').bestMatch, '>');

  const ltStroke = scaleStroke([
    { x: 0.78, y: 0.18 },
    { x: 0.22, y: 0.5 },
    { x: 0.78, y: 0.82 },
  ]);
  assert.equal(recognizeOfflineHandwriting([ltStroke], 'symbols').bestMatch, '<');
});

test('Geometric stroke smoothing removes endpoint micro-hooks and smooths strokes cleanly', () => {
  const hookedStroke: HandwritingStroke = [
    { x: 205, y: 48 },
    { x: 200, y: 40 },
    { x: 170, y: 40 },
    { x: 130, y: 40 },
    { x: 90, y: 40 },
    { x: 86, y: 32 },
  ];
  const dehooked = removeStrokeEndpointHooks(hookedStroke);
  assert.equal(dehooked.hooksRemoved, 2);
  assert.equal(dehooked.cleaned.length, 4);

  const smoothed = fitStrokeToBezierCurve(dehooked.cleaned);
  assert.ok(smoothed.length > dehooked.cleaned.length);
});
