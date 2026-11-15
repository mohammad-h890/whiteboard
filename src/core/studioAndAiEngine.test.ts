import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AudioSegment,
  calculateTimelineOptimization,
  calculateAudioDuckingGainDb,
  calculateReelsPenFocusCrop,
  recognizeHandwritingAndMath,
  parseTextToFlowchart,
  calculateSupplyDemandEquilibrium,
  serializeProjectSnapshot,
  parseProjectSnapshot,
  generatePrintableClassNotesHtml,
  filterKeyboardShortcuts,
  appendRecentProjectItem,
  INITIAL_RECENT_PROJECTS,
  generateElectronBuildBatScript,
} from './studioAndAiEngine';

const SAMPLE_SEGMENTS: AudioSegment[] = [
  { id: 's1', startSec: 0, endSec: 20, rmsDb: -16, type: 'speech', transcript: 'مقدمه‌ای بر دینامیک' },
  { id: 's2', startSec: 20, endSec: 32, rmsDb: -48, type: 'silence' },
  { id: 's3', startSec: 32, endSec: 36, rmsDb: -22, type: 'filler', transcript: 'اممم...' },
  { id: 's4', startSec: 36, endSec: 76, rmsDb: -42, type: 'writing-only' },
  { id: 's5', startSec: 76, endSec: 100, rmsDb: -14, type: 'speech', transcript: 'نتیجه‌گیری فرمول شتاب' },
];

test('calculateTimelineOptimization cuts silences, removes fillers, and speeds up writing segments', () => {
  const result = calculateTimelineOptimization(SAMPLE_SEGMENTS, {
    cutSilences: true,
    silenceThresholdDb: -40,
    removeFillers: true,
    writingSpeedMultiplier: 4,
  });

  assert.equal(result.originalDurationSec, 100);
  assert.equal(result.removedSilenceCount, 1);
  assert.equal(result.removedFillerCount, 1);
  assert.equal(result.acceleratedWritingCount, 1);
  assert.equal(result.finalDurationSec, 54.2);
  assert.equal(result.savedSeconds, 45.8);
});

test('calculateAudioDuckingGainDb lowers background music when teacher speaks', () => {
  const speaking = calculateAudioDuckingGainDb(-18, -14, -35, 14);
  assert.equal(speaking.isDucked, true);
  assert.equal(speaking.outputMusicDb, -32);

  const silent = calculateAudioDuckingGainDb(-18, -46, -35, 14);
  assert.equal(silent.isDucked, false);
  assert.equal(silent.outputMusicDb, -18);
});

test('calculateReelsPenFocusCrop clamps 9:16 crop window inside 16:9 canvas bounds', () => {
  const nearEdge = calculateReelsPenFocusCrop(1100, 700, 40, 680, 360, 420);
  assert.equal(nearEdge.cropX, 0);
  assert.equal(nearEdge.cropY, 280);
  assert.equal(nearEdge.cropWidth, 360);
  assert.equal(nearEdge.cropHeight, 420);
});

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
  // Qd = 100 - 2P, Qs = 20 + 2P => 4P = 80 => P* = 20, Q* = 60
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
  assert.equal(parsedProjectSnapshotInvalid(), null);

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

test('filterKeyboardShortcuts, appendRecentProjectItem (max 5), and generateElectronBuildBatScript work accurately', () => {
  const recordingHotkeys = filterKeyboardShortcuts('recording', '');
  assert.equal(recordingHotkeys.length, 5);

  const f9Search = filterKeyboardShortcuts('all', 'F9');
  assert.equal(f9Search.length, 1);
  assert.equal(f9Search[0].id, 'rec-toggle');

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
  assert.equal(updatedRecent.length, 5);
  assert.equal(updatedRecent[0].id, 'rec-proj-new');

  const batScript = generateElectronBuildBatScript();
  assert.ok(batScript.includes('electron-builder --win nsis portable'));
  assert.ok(batScript.includes('npm run build'));
});

function parsedProjectSnapshotInvalid() {
  return parseProjectSnapshot('{invalid json');
}

