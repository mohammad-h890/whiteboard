/**
 * Pure domain calculations for Module 4 (Physics), Module 5 (Chemistry),
 * and Module 6 (Biology, Genetics, Literature, Arabic & Accounting).
 */

export interface CircuitMetrics {
  mode: 'series' | 'parallel';
  voltageV: number;
  r1Ohm: number;
  r2Ohm: number;
  equivalentResistanceOhm: number;
  totalCurrentAmp: number;
  totalPowerWatt: number;
  bulbBrightnessPct: number;
}

export function calculateCircuitMetrics(
  mode: 'series' | 'parallel',
  voltageV: number,
  r1Ohm: number,
  r2Ohm: number
): CircuitMetrics {
  const safeR1 = Math.max(1, r1Ohm);
  const safeR2 = Math.max(1, r2Ohm);
  const req =
    mode === 'series'
      ? safeR1 + safeR2
      : (safeR1 * safeR2) / (safeR1 + safeR2);

  const current = voltageV / req;
  const power = voltageV * current;
  const brightness = Math.min(100, Math.round((power / 60) * 100));

  return {
    mode,
    voltageV,
    r1Ohm: safeR1,
    r2Ohm: safeR2,
    equivalentResistanceOhm: Number(req.toFixed(2)),
    totalCurrentAmp: Number(current.toFixed(2)),
    totalPowerWatt: Number(power.toFixed(1)),
    bulbBrightnessPct: brightness,
  };
}

export interface SnellsLawMetrics {
  n1: number;
  n2: number;
  incidentAngleDeg: number;
  refractedAngleDeg: number | null;
  criticalAngleDeg: number | null;
  isTotalInternalReflection: boolean;
}

export function calculateSnellsLaw(
  n1: number,
  n2: number,
  incidentAngleDeg: number
): SnellsLawMetrics {
  const rad1 = (incidentAngleDeg * Math.PI) / 180;
  const sinTheta2 = (n1 / n2) * Math.sin(rad1);
  const criticalAngleDeg =
    n1 > n2 ? Number(((Math.asin(n2 / n1) * 180) / Math.PI).toFixed(1)) : null;

  if (Math.abs(sinTheta2) > 1) {
    return {
      n1,
      n2,
      incidentAngleDeg,
      refractedAngleDeg: null,
      criticalAngleDeg,
      isTotalInternalReflection: true,
    };
  }

  const refractedAngleDeg = Number(((Math.asin(sinTheta2) * 180) / Math.PI).toFixed(1));
  return {
    n1,
    n2,
    incidentAngleDeg,
    refractedAngleDeg,
    criticalAngleDeg,
    isTotalInternalReflection: false,
  };
}

export interface BohrTransitionMetrics {
  nInitial: number;
  nFinal: number;
  deltaEnergyEv: number;
  wavelengthNm: number;
  mode: 'emission' | 'absorption' | 'stationary';
}

export function calculateBohrTransition(
  nInitial: number,
  nFinal: number
): BohrTransitionMetrics {
  const ni = Math.max(1, Math.min(6, Math.round(nInitial)));
  const nf = Math.max(1, Math.min(6, Math.round(nFinal)));
  if (ni === nf) {
    return {
      nInitial: ni,
      nFinal: nf,
      deltaEnergyEv: 0,
      wavelengthNm: 0,
      mode: 'stationary',
    };
  }
  const eInitial = -13.6 / (ni * ni);
  const eFinal = -13.6 / (nf * nf);
  const diff = Math.abs(eInitial - eFinal);
  const wavelengthNm = Math.round(1240 / diff);

  return {
    nInitial: ni,
    nFinal: nf,
    deltaEnergyEv: Number(diff.toFixed(2)),
    wavelengthNm,
    mode: ni > nf ? 'emission' : 'absorption',
  };
}

export interface ManometerMetrics {
  rhoLeftGcm3: number;
  rhoRightGcm3: number;
  hLeftCm: number;
  hRightCm: number;
  pressureBalanceKpa: number;
}

export function calculateManometerEquilibrium(
  rhoLeftGcm3: number,
  rhoRightGcm3: number,
  hLeftCm: number
): ManometerMetrics {
  const safeRightRho = Math.max(0.5, rhoRightGcm3);
  // Hydrostatic equilibrium above isobaric line: rho1 * h1 = rho2 * h2
  const hRightCm = Number(((rhoLeftGcm3 * hLeftCm) / safeRightRho).toFixed(1));
  const pressureBalanceKpa = Number((101.3 + rhoLeftGcm3 * 9.8 * (hLeftCm / 100)).toFixed(2));
  return {
    rhoLeftGcm3,
    rhoRightGcm3: safeRightRho,
    hLeftCm,
    hRightCm,
    pressureBalanceKpa,
  };
}

export type VseprMoleculeId = 'CO2' | 'BF3' | 'CH4' | 'NH3' | 'H2O';

export interface VseprMoleculeSpec {
  id: VseprMoleculeId;
  formula: string;
  nameFa: string;
  geometryFa: string;
  bondAngleDeg: number;
  lonePairsOnCenter: number;
  bondingDomains: number;
  hybridization: string;
}

export const VSEPR_MOLECULES: Record<VseprMoleculeId, VseprMoleculeSpec> = {
  CO2: {
    id: 'CO2',
    formula: 'CO₂',
    nameFa: 'کربن دی‌اکسید',
    geometryFa: 'خطی (Linear)',
    bondAngleDeg: 180,
    lonePairsOnCenter: 0,
    bondingDomains: 2,
    hybridization: 'sp',
  },
  BF3: {
    id: 'BF3',
    formula: 'BF₃',
    nameFa: 'بور تری‌فلوئورید',
    geometryFa: 'مثلث مسطح (Trigonal Planar)',
    bondAngleDeg: 120,
    lonePairsOnCenter: 0,
    bondingDomains: 3,
    hybridization: 'sp²',
  },
  CH4: {
    id: 'CH4',
    formula: 'CH₄',
    nameFa: 'متان',
    geometryFa: 'چهاروجهی منتظم (Tetrahedral)',
    bondAngleDeg: 109.5,
    lonePairsOnCenter: 0,
    bondingDomains: 4,
    hybridization: 'sp³',
  },
  NH3: {
    id: 'NH3',
    formula: 'NH₃',
    nameFa: 'آمونیاک',
    geometryFa: 'هرمی مثلثی (Trigonal Pyramidal)',
    bondAngleDeg: 107,
    lonePairsOnCenter: 1,
    bondingDomains: 3,
    hybridization: 'sp³',
  },
  H2O: {
    id: 'H2O',
    formula: 'H₂O',
    nameFa: 'آب',
    geometryFa: 'خمیده / زاویه‌دار (Bent)',
    bondAngleDeg: 104.5,
    lonePairsOnCenter: 2,
    bondingDomains: 2,
    hybridization: 'sp³',
  },
};

export interface GalvanicCellMetrics {
  anodeSymbol: string;
  cathodeSymbol: string;
  e0AnodeV: number;
  e0CathodeV: number;
  cellEmfV: number;
  reactionText: string;
}

const ELECTRODE_POTENTIALS: Record<string, number> = {
  Mg: -2.37,
  Zn: -0.76,
  Fe: -0.44,
  Cu: 0.34,
  Ag: 0.8,
};

export function calculateGalvanicCell(
  electrodeA: string,
  electrodeB: string
): GalvanicCellMetrics {
  const eA = ELECTRODE_POTENTIALS[electrodeA] ?? -0.76;
  const eB = ELECTRODE_POTENTIALS[electrodeB] ?? 0.34;

  const isAAnode = eA <= eB;
  const anodeSymbol = isAAnode ? electrodeA : electrodeB;
  const cathodeSymbol = isAAnode ? electrodeB : electrodeA;
  const e0AnodeV = isAAnode ? eA : eB;
  const e0CathodeV = isAAnode ? eB : eA;
  const cellEmfV = Number((e0CathodeV - e0AnodeV).toFixed(2));

  return {
    anodeSymbol,
    cathodeSymbol,
    e0AnodeV,
    e0CathodeV,
    cellEmfV,
    reactionText: `${anodeSymbol}(s) + ${cathodeSymbol}²⁺(aq) → ${anodeSymbol}²⁺(aq) + ${cathodeSymbol}(s)`,
  };
}

export interface PunnettSquareResult {
  parent1Alleles: [string, string];
  parent2Alleles: [string, string];
  grid: [[string, string], [string, string]];
  dominantPhenotypePct: number;
  recessivePhenotypePct: number;
  genotypeRatioText: string;
}

export function calculatePunnettSquare(
  parent1: 'AA' | 'Aa' | 'aa',
  parent2: 'AA' | 'Aa' | 'aa'
): PunnettSquareResult {
  const p1: [string, string] = [parent1[0], parent1[1]];
  const p2: [string, string] = [parent2[0], parent2[1]];

  const normalizePair = (a: string, b: string) =>
    a === 'A' || b === 'A' ? (a === 'A' && b === 'A' ? 'AA' : 'Aa') : 'aa';

  const g00 = normalizePair(p1[0], p2[0]);
  const g01 = normalizePair(p1[1], p2[0]);
  const g10 = normalizePair(p1[0], p2[1]);
  const g11 = normalizePair(p1[1], p2[1]);

  const cells = [g00, g01, g10, g11];
  const domCount = cells.filter((c) => c.includes('A')).length;
  const recCount = 4 - domCount;

  const countAA = cells.filter((c) => c === 'AA').length;
  const countAa = cells.filter((c) => c === 'Aa').length;
  const countaa = cells.filter((c) => c === 'aa').length;

  return {
    parent1Alleles: p1,
    parent2Alleles: p2,
    grid: [
      [g00, g01],
      [g10, g11],
    ],
    dominantPhenotypePct: domCount * 25,
    recessivePhenotypePct: recCount * 25,
    genotypeRatioText: `${countAA} AA : ${countAa} Aa : ${countaa} aa`,
  };
}
