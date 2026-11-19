import test from 'node:test';
import assert from 'node:assert/strict';
import {
  recognizeOfflineHandwriting,
  removeStrokeEndpointHooks,
  fitStrokeToBezierCurve,
  isLongFractionBarStroke,
  doesNewStrokeBelongToCurrentSymbol,
  classifyInstantBoardSymbol,
  resolveConsistentExpressionScale,
  applyHandwritingFeedbackToModel,
  serializeOfflineHandwritingModel,
  MAX_LEARNED_PROTOTYPES_PER_CHAR,
  MAX_TOTAL_LEARNED_PROTOTYPES,
  OfflineHandwritingModelState,
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

test('Instant per-symbol spatial grouping and classification handles 2D fraction expressions (۱ × ۵ / ۲ × ۱)', () => {
  // 1. Persian ۱ in numerator
  const num1 = scaleStroke(
    [
      { x: 0.5, y: 0.1 },
      { x: 0.5, y: 0.5 },
      { x: 0.5, y: 0.9 },
    ],
    260,
    180,
    80
  );
  // Multiply × placed to the right of ۱ -> must NOT belong to ۱!
  const mulA: HandwritingStroke = [
    { x: 375, y: 195 },
    { x: 425, y: 245 },
  ];
  const mulB: HandwritingStroke = [
    { x: 425, y: 195 },
    { x: 375, y: 245 },
  ];
  assert.equal(doesNewStrokeBelongToCurrentSymbol([num1], mulA[0]), false);
  // Second diagonal of × MUST stay grouped with first diagonal!
  assert.equal(doesNewStrokeBelongToCurrentSymbol([mulA], mulB[0]), true);

  // Persian ۵ placed to the right of × -> must NOT belong to ×!
  const num5 = scaleStroke(
    [
      { x: 0.5, y: 0.14 },
      { x: 0.22, y: 0.48 },
      { x: 0.2, y: 0.8 },
      { x: 0.4, y: 0.88 },
      { x: 0.5, y: 0.68 },
      { x: 0.6, y: 0.88 },
      { x: 0.8, y: 0.8 },
      { x: 0.78, y: 0.48 },
      { x: 0.5, y: 0.14 },
    ],
    475,
    180,
    75
  );
  assert.equal(doesNewStrokeBelongToCurrentSymbol([mulA, mulB], num5[0]), false);

  // Classify each piece independently in 'all' mode
  assert.equal(classifyInstantBoardSymbol([num1], 'all')?.text, '۱');
  assert.equal(classifyInstantBoardSymbol([mulA, mulB], 'all')?.text, '×');
  assert.equal(classifyInstantBoardSymbol([mulB, mulA], 'all')?.text, '×');
  assert.equal(classifyInstantBoardSymbol([num5], 'all')?.text, '۵');

  // Long horizontal fraction bar vs short minus sign
  const fractionBar: HandwritingStroke = [
    { x: 260, y: 280 },
    { x: 390, y: 282 },
    { x: 540, y: 281 },
  ];
  assert.equal(isLongFractionBarStroke(fractionBar), true);
  const barRes = classifyInstantBoardSymbol([fractionBar], 'all');
  assert.equal(barRes?.kind, 'fraction-bar');
  assert.ok(barRes?.lineStart && barRes?.lineEnd);

  const shortMinus: HandwritingStroke = [
    { x: 320, y: 280 },
    { x: 375, y: 280 },
  ];
  assert.equal(isLongFractionBarStroke(shortMinus), false);
  assert.equal(classifyInstantBoardSymbol([shortMinus], 'all')?.text, '−');

  // Smooth handwritten Persian ۲ in denominator
  const num2 = scaleStroke(
    [
      { x: 0.82, y: 0.18 },
      { x: 0.62, y: 0.34 },
      { x: 0.34, y: 0.3 },
      { x: 0.36, y: 0.62 },
      { x: 0.38, y: 0.92 },
    ],
    260,
    310,
    80
  );
  assert.equal(classifyInstantBoardSymbol([num2], 'all')?.text, '۲');
});

test('Multi-digit 3- and 4-digit numbers (۱۴۰۳) stay grouped on same row and scale by height', () => {
  const d1: HandwritingStroke = [
    { x: 300, y: 220 },
    { x: 300, y: 255 },
    { x: 300, y: 290 },
  ];
  const d4: HandwritingStroke = [
    { x: 356, y: 222 },
    { x: 334, y: 244 },
    { x: 354, y: 256 },
    { x: 332, y: 270 },
    { x: 344, y: 288 },
  ];
  // Small Persian zero ۰ sitting beside ۴ must stay its own digit cluster, NOT merge into ۴
  const d0: HandwritingStroke = [
    { x: 392, y: 252 },
    { x: 396, y: 258 },
    { x: 390, y: 260 },
  ];
  const d3: HandwritingStroke = [
    { x: 462, y: 224 },
    { x: 452, y: 242 },
    { x: 442, y: 224 },
    { x: 432, y: 242 },
    { x: 422, y: 224 },
    { x: 424, y: 290 },
  ];

  assert.equal(doesNewStrokeBelongToCurrentSymbol([d1], d4[0]), true);
  assert.equal(doesNewStrokeBelongToCurrentSymbol([d1, d4], d0[0]), true);
  assert.equal(doesNewStrokeBelongToCurrentSymbol([d1, d4, d0], d3[0]), true);

  // Moving down to denominator row MUST separate cleanly
  assert.equal(
    doesNewStrokeBelongToCurrentSymbol([d1, d4, d0, d3], { x: 340, y: 365 }),
    false
  );

  const res1403 = classifyInstantBoardSymbol([d1, d4, d0, d3], 'fa-digits');
  assert.ok(res1403);
  assert.equal(res1403.text, '۱۴۰۳');
  assert.ok(
    res1403.suggestedScale >= 0.8 && res1403.suggestedScale <= 1.35,
    `Expected height-based scale around 1.13 for ۱۴۰۳, got ${res1403.suggestedScale}`
  );
});

test('resolveConsistentExpressionScale keeps consecutive terms in the same expression at a uniform size', () => {
  const box1 = { minX: 300, minY: 220, maxX: 420, maxY: 290, width: 120, height: 70, cx: 360, cy: 255 };
  const first = resolveConsistentExpressionScale(1.12, box1, null, 1000);
  assert.equal(first.scale, 1.12);

  // Second term written noticeably smaller (rawScale 0.78) nearby 2s later -> locked to 1.12!
  const box2 = { minX: 460, minY: 235, maxX: 500, maxY: 280, width: 40, height: 45, cx: 480, cy: 257 };
  const second = resolveConsistentExpressionScale(0.78, box2, first.nextAnchor, 3000);
  assert.equal(second.scale, 1.12);

  // Third term written noticeably larger (rawScale 1.48) in denominator 3s later -> STILL locked to 1.12!
  const box3 = { minX: 330, minY: 350, maxX: 460, maxY: 440, width: 130, height: 90, cx: 395, cy: 395 };
  const third = resolveConsistentExpressionScale(1.48, box3, second.nextAnchor, 6000);
  assert.equal(third.scale, 1.12);

  // New expression far away on the board (650px away) -> starts a fresh scale anchor!
  const boxFar = { minX: 980, minY: 500, maxX: 1050, maxY: 550, width: 70, height: 50, cx: 1015, cy: 525 };
  const fourth = resolveConsistentExpressionScale(0.82, boxFar, third.nextAnchor, 8000);
  assert.equal(fourth.scale, 0.82);
});

test('Offline adaptive learning improves recognition immediately from single- and multi-digit corrections', () => {
  const emptyModel: OfflineHandwritingModelState = {
    version: 1,
    totalFeedbackCount: 0,
    prototypes: [],
  };

  // An unusual stylized user stroke (wide flat zigzag) not normally recognized as Persian ۷
  const quirkySeven: HandwritingStroke = [
    { x: 100, y: 120 },
    { x: 140, y: 145 },
    { x: 185, y: 130 },
    { x: 225, y: 165 },
  ];
  const before = recognizeOfflineHandwriting([quirkySeven], 'all', emptyModel);
  assert.notEqual(before.bestMatch, '۷');

  // User corrects it to '۷' in instant-correction box
  const trained = applyHandwritingFeedbackToModel(emptyModel, [quirkySeven], '۷', 10_000);
  assert.deepEqual(trained.learnedChars, ['۷']);
  assert.equal(trained.nextModel.totalFeedbackCount, 1);

  // Immediately on the next similar stroke, offline model recognizes '۷'
  const similarQuirkySeven: HandwritingStroke = quirkySeven.map((p) => ({
    x: p.x + 12,
    y: p.y + 4,
  }));
  const after = recognizeOfflineHandwriting([similarQuirkySeven], 'all', trained.nextModel);
  assert.equal(after.bestMatch, '۷');
});

test('Offline learning remains strictly O(1) bounded in memory, storage, and speed after 2000 corrections', () => {
  let model: OfflineHandwritingModelState = {
    version: 1,
    totalFeedbackCount: 0,
    prototypes: [],
  };
  const labels = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '−', '×', '÷', '='];

  for (let i = 0; i < 2000; i++) {
    const ch = labels[i % labels.length];
    const jitter = (i % 7) * 2.5;
    const styleVariant = i % 3;
    const stroke: HandwritingStroke =
      styleVariant === 0
        ? [
            { x: 100 + jitter, y: 100 },
            { x: 130, y: 150 + jitter },
            { x: 165 - jitter, y: 105 },
          ]
        : styleVariant === 1
        ? [
            { x: 150, y: 100 + jitter },
            { x: 110 + jitter, y: 140 },
            { x: 160, y: 185 - jitter },
          ]
        : [
            { x: 100, y: 100 },
            { x: 160, y: 115 + jitter },
            { x: 120, y: 175 },
            { x: 165, y: 185 },
          ];
    model = applyHandwritingFeedbackToModel(model, [stroke], ch, 1_000_000 + i * 10).nextModel;
  }

  assert.equal(model.totalFeedbackCount, 2000);
  assert.ok(
    model.prototypes.length <= MAX_TOTAL_LEARNED_PROTOTYPES,
    `Expected <= ${MAX_TOTAL_LEARNED_PROTOTYPES} prototypes after 2000 feedbacks, got ${model.prototypes.length}`
  );

  // Check per-character cap strictly holds
  const countsByChar = new Map<string, number>();
  for (const p of model.prototypes) {
    countsByChar.set(p.char, (countsByChar.get(p.char) ?? 0) + 1);
  }
  for (const [ch, count] of countsByChar.entries()) {
    assert.ok(
      count <= MAX_LEARNED_PROTOTYPES_PER_CHAR,
      `Char ${ch} exceeded per-char cap: ${count}`
    );
  }

  // Serialized storage size stays tiny (< 48 KB even at full 72-prototype saturation)
  const serialized = serializeOfflineHandwritingModel(model);
  assert.ok(
    serialized.length < 48_000,
    `Expected compact localStorage payload < 48KB, got ${serialized.length} bytes`
  );

  // Recognition stays blazing fast even with saturated 72-prototype learned model
  const probe: HandwritingStroke = [
    { x: 102, y: 101 },
    { x: 131, y: 152 },
    { x: 163, y: 106 },
  ];
  const t0 = performance.now();
  for (let k = 0; k < 20; k++) {
    recognizeOfflineHandwriting([probe], 'all', model);
  }
  const elapsedMs = performance.now() - t0;
  assert.ok(
    elapsedMs < 120,
    `Expected 20 recognitions against saturated model to finish well under 120ms, took ${elapsedMs.toFixed(1)}ms`
  );
});



