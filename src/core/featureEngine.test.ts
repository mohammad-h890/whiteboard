import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_MODULES,
  applyTeachingProfile,
  toggleModuleMaster,
  toggleSubFeature,
  calculateResourceUsage,
  isSubFeatureActive,
  toPersianDigits,
  calculateFractionMetrics,
  calculateInclinedPlanePhysics,
  generateElectronConfig,
} from './featureEngine';

test('applyTeachingProfile activates only profile sub-features and updates RAM savings', () => {
  const simpleMods = applyTeachingProfile('simple', INITIAL_MODULES);
  const simpleMetrics = calculateResourceUsage(simpleMods);
  assert.equal(simpleMetrics.activeSubFeaturesCount, 4);
  assert.equal(isSubFeatureActive(simpleMods, 'infinite-paginated-canvas'), true);
  assert.equal(isSubFeatureActive(simpleMods, 'handwriting-math-ocr'), false);
  assert.ok(simpleMetrics.savedRamMb > 450, 'Simple profile should save >450MB RAM');

  const fullMods = applyTeachingProfile('full-suite', INITIAL_MODULES);
  const fullMetrics = calculateResourceUsage(fullMods);
  assert.equal(fullMetrics.activeModulesCount, 7);
  assert.equal(fullMetrics.savedRamMb, 0);
});

test('toggleModuleMaster and toggleSubFeature maintain parent-child consistency', () => {
  const disabledCanvas = toggleModuleMaster(INITIAL_MODULES, 'mod-1-canvas', false);
  assert.equal(isSubFeatureActive(disabledCanvas, 'infinite-paginated-canvas'), false);

  const reEnabledSingle = toggleSubFeature(
    disabledCanvas,
    'mod-1-canvas',
    'infinite-paginated-canvas'
  );
  const mod1 = reEnabledSingle.find((m) => m.id === 'mod-1-canvas')!;
  assert.equal(mod1.enabled, true);
  assert.equal(isSubFeatureActive(reEnabledSingle, 'infinite-paginated-canvas'), true);
  assert.equal(isSubFeatureActive(reEnabledSingle, 'photoshop-layers'), false);
});

test('toPersianDigits converts numbers accurately when enabled', () => {
  assert.equal(toPersianDigits('3/5 = 60%', true), '۳/۵ = ۶۰%');
  assert.equal(toPersianDigits('3/5 = 60%', false), '3/5 = 60%');
});

test('calculateFractionMetrics computes fraction, decimal, percentage and simplification', () => {
  const m = calculateFractionMetrics(3, 5);
  assert.equal(m.decimal, 0.6);
  assert.equal(m.percentage, 60);
  assert.equal(m.unitFractionText, '5 تا ۱/5');

  const m2 = calculateFractionMetrics(2, 4);
  assert.equal(m2.simplifiedNumerator, 1);
  assert.equal(m2.simplifiedDenominator, 2);
});

test('calculateInclinedPlanePhysics computes FBD components and sliding state', () => {
  const stationary = calculateInclinedPlanePhysics(5, 15, 0.5, 10);
  assert.equal(stationary.weightN, 50);
  assert.equal(stationary.isSliding, false);
  assert.equal(stationary.accelerationMs2, 0);

  const sliding = calculateInclinedPlanePhysics(5, 37, 0.2, 10);
  assert.equal(sliding.isSliding, true);
  assert.ok(sliding.accelerationMs2 > 4);
});

test('generateElectronConfig follows Aufbau and Hunds rule for Nitrogen (Z=7) and Oxygen (Z=8)', () => {
  const nitrogen = generateElectronConfig(7);
  assert.equal(nitrogen.notation, '1s2 2s2 2p3');
  const pOrbitalsN = nitrogen.orbitals.filter((o) => o.subshell === '2p');
  assert.deepEqual(
    pOrbitalsN.map((o) => o.electrons),
    [1, 1, 1]
  );

  const oxygen = generateElectronConfig(8);
  assert.equal(oxygen.notation, '1s2 2s2 2p4');
  const pOrbitalsO = oxygen.orbitals.filter((o) => o.subshell === '2p');
  assert.deepEqual(
    pOrbitalsO.map((o) => o.electrons),
    [2, 1, 1]
  );
});
