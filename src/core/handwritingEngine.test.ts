import test from 'node:test';
import assert from 'node:assert/strict';
import {
  recognizeOfflineHandwriting,
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
  // Persian digit ۱ (vertical stroke)
  const digit1 = scaleStroke([
    { x: 0.5, y: 0.1 },
    { x: 0.5, y: 0.35 },
    { x: 0.5, y: 0.65 },
    { x: 0.5, y: 0.9 },
  ]);
  const res1 = recognizeOfflineHandwriting([digit1], 'fa-digits');
  assert.equal(res1.bestMatch, '۱');

  // Persian digit ۲ (top right curve + vertical stem)
  const digit2 = scaleStroke([
    { x: 0.72, y: 0.18 },
    { x: 0.56, y: 0.32 },
    { x: 0.36, y: 0.2 },
    { x: 0.36, y: 0.55 },
    { x: 0.36, y: 0.9 },
  ]);
  const res2 = recognizeOfflineHandwriting([digit2], 'fa-digits');
  assert.equal(res2.bestMatch, '۲');

  // Persian digit ۷ (V shape)
  const digit7 = scaleStroke([
    { x: 0.2, y: 0.16 },
    { x: 0.35, y: 0.5 },
    { x: 0.5, y: 0.88 },
    { x: 0.65, y: 0.5 },
    { x: 0.8, y: 0.16 },
  ]);
  const res7 = recognizeOfflineHandwriting([digit7], 'fa-digits');
  assert.equal(res7.bestMatch, '۷');

  // Persian digit ۸ (inverted V shape)
  const digit8 = scaleStroke([
    { x: 0.2, y: 0.88 },
    { x: 0.35, y: 0.5 },
    { x: 0.5, y: 0.16 },
    { x: 0.65, y: 0.5 },
    { x: 0.8, y: 0.88 },
  ]);
  const res8 = recognizeOfflineHandwriting([digit8], 'fa-digits');
  assert.equal(res8.bestMatch, '۸');

  // Multi-digit Persian number: ۱ on the left and ۷ on the right -> ۱۷
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
  const res0 = recognizeOfflineHandwriting([en0], 'en-digits');
  assert.equal(res0.bestMatch, '0');

  const en7 = scaleStroke([
    { x: 0.2, y: 0.16 },
    { x: 0.5, y: 0.16 },
    { x: 0.82, y: 0.16 },
    { x: 0.6, y: 0.52 },
    { x: 0.38, y: 0.88 },
  ]);
  const res7 = recognizeOfflineHandwriting([en7], 'en-digits');
  assert.equal(res7.bestMatch, '7');
});

test('recognizeOfflineHandwriting distinguishes Persian letters with dots and bars (ب، پ، ت، ک، گ)', () => {
  // Base boat body for ب / پ / ت / ث
  const boatBody = scaleStroke([
    { x: 0.86, y: 0.45 },
    { x: 0.82, y: 0.65 },
    { x: 0.5, y: 0.68 },
    { x: 0.18, y: 0.65 },
    { x: 0.14, y: 0.45 },
  ]);
  const dotBelow1: HandwritingStroke = [
    { x: 100, y: 135 },
    { x: 102, y: 136 },
  ];
  const dotBelow2: HandwritingStroke = [
    { x: 92, y: 135 },
    { x: 94, y: 136 },
  ];
  const dotBelow3: HandwritingStroke = [
    { x: 108, y: 142 },
    { x: 110, y: 143 },
  ];
  const dotAbove1: HandwritingStroke = [
    { x: 95, y: 55 },
    { x: 97, y: 56 },
  ];
  const dotAbove2: HandwritingStroke = [
    { x: 108, y: 55 },
    { x: 110, y: 56 },
  ];

  // ب (1 dot below)
  const resBe = recognizeOfflineHandwriting([boatBody, dotBelow1], 'fa-text');
  assert.equal(resBe.bestMatch, 'ب');

  // پ (3 dots below)
  const resPe = recognizeOfflineHandwriting([boatBody, dotBelow1, dotBelow2, dotBelow3], 'fa-text');
  assert.equal(resPe.bestMatch, 'پ');

  // ت (2 dots above)
  const resTe = recognizeOfflineHandwriting([boatBody, dotAbove1, dotAbove2], 'fa-text');
  assert.equal(resTe.bestMatch, 'ت');

  // ک and گ (with slanted top bar)
  const kafBody = scaleStroke([
    { x: 0.72, y: 0.34 },
    { x: 0.72, y: 0.76 },
    { x: 0.2, y: 0.76 },
  ]);
  const bar1 = scaleStroke([
    { x: 0.88, y: 0.16 },
    { x: 0.65, y: 0.32 },
  ]);
  const bar2 = scaleStroke([
    { x: 0.88, y: 0.08 },
    { x: 0.65, y: 0.24 },
  ]);

  const resKaf = recognizeOfflineHandwriting([kafBody, bar1], 'fa-text');
  assert.equal(resKaf.bestMatch, 'ک');

  const resGaf = recognizeOfflineHandwriting([kafBody, bar1, bar2], 'fa-text');
  assert.equal(resGaf.bestMatch, 'گ');
});

test('recognizeOfflineHandwriting recognizes English letters (L), symbols (+, =), and offline word completions', () => {
  const letterL = scaleStroke([
    { x: 0.25, y: 0.14 },
    { x: 0.25, y: 0.5 },
    { x: 0.25, y: 0.86 },
    { x: 0.52, y: 0.86 },
    { x: 0.78, y: 0.86 },
  ]);
  const resL = recognizeOfflineHandwriting([letterL], 'en-text', 'M');
  assert.equal(resL.bestMatch, 'L');
  assert.ok(resL.wordCompletions.length > 0);

  // Plus sign (+)
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
  const resPlus = recognizeOfflineHandwriting([plusH, plusV], 'symbols');
  assert.equal(resPlus.bestMatch, '+');

  // Equals sign (=)
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
  const resEq = recognizeOfflineHandwriting([eqTop, eqBot], 'symbols');
  assert.equal(resEq.bestMatch, '=');
});
