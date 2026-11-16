import test from 'node:test';
import assert from 'node:assert/strict';
import {
  recognizeHandwritingAndMath,
  parseTextToFlowchart,
  calculateSupplyDemandEquilibrium,
  serializeProjectSnapshot,
  parseProjectSnapshot,
  generatePrintableClassNotesHtml,
  filterKeyboardShortcuts,
  appendRecentProjectItem,
  INITIAL_RECENT_PROJECTS,
} from './studioAndAiEngine';

test('recognizeHandwritingAndMath and parseTextToFlowchart produce structured outputs', () => {
  const ocr = recognizeHandwritingAndMath('newton-inclined');
  assert.equal(ocr.category, 'physics');
  assert.ok(ocr.latexFormula.includes('sin(θ)'));

  const flowchart = parseTextToFlowchart('مشاهده پدیده -> طرح فرضیه -> آزمایش کنترلی -> نظریه علمی');
  assert.equal(flowchart.nodes.length, 4);
  assert.equal(flowchart.nodes[0].label, 'مشاهده پدیده');
  assert.equal(flowchart.nodes[3].stepNumber, 4);
});

test('calculateSupplyDemandEquilibrium computes P*, Q*, surplus, and shortage accurately', () => {
  const eq = calculateSupplyDemandEquilibrium(100, 20, 2, 2);
  assert.equal(eq.equilibriumPrice, 20);
  assert.equal(eq.equilibriumQuantity, 60);

  const atHighPrice = eq.surplusOrShortageAtPrice(30);
  assert.equal(atHighPrice.status, 'surplus');
  assert.equal(atHighPrice.qd, 40);
  assert.equal(atHighPrice.qs, 80);
});

test('serializeProjectSnapshot, parseProjectSnapshot, and generatePrintableClassNotesHtml roundtrip cleanly', () => {
  const json = serializeProjectSnapshot({
    version: '1.0.0',
    savedAtIso: '2026-11-14T22:00:00Z',
    activeProfileId: 'physics-lab',
    canvasMode: 'infinite',
    background: 'grid',
    watermarkCode: 'DB-98421',
    stampedWidgetsCount: 2,
    calloutStamps: ['نکته کنکوری مهم!'],
  });
  const parsed = parseProjectSnapshot(json);
  assert.ok(parsed);
  assert.equal(parsed.activeProfileId, 'physics-lab');
  assert.equal(parseProjectSnapshot('{invalid json'), null);

  const html = generatePrintableClassNotesHtml({
    teacherName: 'استاد احمدی',
    sessionTopic: 'دینامیک و قوانین نیوتن',
    watermarkCode: 'DB-98421',
    presetLabel: 'جزوه کامل',
    stampedWidgets: [{ title: 'سطح شیب‌دار', summary: 'a = 2.78 m/s²' }],
    calloutStamps: ['دام آموزشی!'],
  });
  assert.ok(html.includes('دینامیک و قوانین نیوتن'));
  assert.ok(html.includes('DB-98421'));
});

test('filterKeyboardShortcuts and appendRecentProjectItem work accurately', () => {
  const layerHotkeys = filterKeyboardShortcuts('layers', '');
  assert.equal(layerHotkeys.length, 6);

  const lassoSearch = filterKeyboardShortcuts('all', 'V');
  assert.ok(lassoSearch.some((s) => s.id === 'tool-lasso'));

  const updatedRecent = appendRecentProjectItem(
    INITIAL_RECENT_PROJECTS,
    {
      id: 'rec-proj-new',
      title: 'جلسه جدید نوسان و موج (فیزیک ۳)',
      teacherName: 'مهندس محمدحسین احمدی',
      kind: 'pdf-handout',
      timestampLabel: 'همین الان',
      durationOrPagesLabel: '۳ صفحه A4 وکتور',
      profileId: 'physics-lab',
      watermarkCode: 'DB-98421',
    },
    5
  );
  assert.equal(updatedRecent[0].id, 'rec-proj-new');
});
