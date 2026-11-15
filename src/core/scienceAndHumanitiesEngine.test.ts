import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCircuitMetrics,
  calculateSnellsLaw,
  calculateBohrTransition,
  calculateManometerEquilibrium,
  calculateGalvanicCell,
  calculatePunnettSquare,
  VSEPR_MOLECULES,
} from './scienceAndHumanitiesEngine';

test('calculateCircuitMetrics computes series and parallel equivalent resistance and current', () => {
  const series = calculateCircuitMetrics('series', 12, 4, 2);
  assert.equal(series.equivalentResistanceOhm, 6);
  assert.equal(series.totalCurrentAmp, 2);
  assert.equal(series.totalPowerWatt, 24);

  const parallel = calculateCircuitMetrics('parallel', 12, 6, 3);
  assert.equal(parallel.equivalentResistanceOhm, 2);
  assert.equal(parallel.totalCurrentAmp, 6);
});

test('calculateSnellsLaw detects refraction angle and total internal reflection above critical angle', () => {
  const normalRefraction = calculateSnellsLaw(1.0, 1.5, 30);
  assert.equal(normalRefraction.isTotalInternalReflection, false);
  assert.ok(normalRefraction.refractedAngleDeg! > 19 && normalRefraction.refractedAngleDeg! < 20);

  const totalInternal = calculateSnellsLaw(1.5, 1.0, 50);
  assert.equal(totalInternal.isTotalInternalReflection, true);
  assert.equal(totalInternal.refractedAngleDeg, null);
  assert.equal(totalInternal.criticalAngleDeg, 41.8);
});

test('calculateBohrTransition computes photon energy and wavelength for Balmer H-alpha (3 -> 2)', () => {
  const balmerAlpha = calculateBohrTransition(3, 2);
  assert.equal(balmerAlpha.mode, 'emission');
  assert.equal(balmerAlpha.deltaEnergyEv, 1.89);
  assert.ok(balmerAlpha.wavelengthNm >= 655 && balmerAlpha.wavelengthNm <= 657);
});

test('calculateManometerEquilibrium balances hydrostatic pressure in U-tube', () => {
  const m = calculateManometerEquilibrium(1.0, 2.0, 20);
  assert.equal(m.hRightCm, 10);
});

test('calculateGalvanicCell computes standard Daniell cell EMF (Zn/Cu = 1.10 V) and VSEPR specs', () => {
  const daniell = calculateGalvanicCell('Zn', 'Cu');
  assert.equal(daniell.anodeSymbol, 'Zn');
  assert.equal(daniell.cathodeSymbol, 'Cu');
  assert.equal(daniell.cellEmfV, 1.1);

  assert.equal(VSEPR_MOLECULES.H2O.bondAngleDeg, 104.5);
  assert.equal(VSEPR_MOLECULES.H2O.lonePairsOnCenter, 2);
});

test('calculatePunnettSquare computes Mendelian monohybrid cross (Aa x Aa -> 75% dominant)', () => {
  const cross = calculatePunnettSquare('Aa', 'Aa');
  assert.equal(cross.dominantPhenotypePct, 75);
  assert.equal(cross.recessivePhenotypePct, 25);
  assert.equal(cross.genotypeRatioText, '1 AA : 2 Aa : 1 aa');
});
