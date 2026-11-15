import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Atom,
  FlaskConical,
  BookOpen,
  CheckSquare,
  Power,
  Plus,
  Minus,
  Play,
  RotateCcw,
  Eye,
  EyeOff,
  Check,
  X,
  ArrowLeftRight,
  Sparkles,
  Box,
  TrendingUp,
  Zap,
  Waves,
  RefreshCw,
} from 'lucide-react';
import {
  AppModule,
  ModuleId,
  calculateFractionMetrics,
  calculateInclinedPlanePhysics,
  generateElectronConfig,
  toPersianDigits,
} from '../core/featureEngine';
import {
  MathFunctionId,
  calculateRiemannAndDerivative,
  VennExpressionId,
  evaluateVennRegion,
  computeCleanedDocumentPixel,
} from '../core/canvasAndMathEngine';
import {
  calculateCircuitMetrics,
  calculateSnellsLaw,
  calculateBohrTransition,
  calculateManometerEquilibrium,
  calculateGalvanicCell,
  calculatePunnettSquare,
  VSEPR_MOLECULES,
  VseprMoleculeId,
} from '../core/scienceAndHumanitiesEngine';
import { calculateSupplyDemandEquilibrium } from '../core/studioAndAiEngine';

export type LabTabId = 'math' | 'physics' | 'chemistry' | 'humanities' | 'konkur';

interface InteractiveLabsPanelProps {
  modules: AppModule[];
  activeTab: LabTabId;
  onChangeTab: (tab: LabTabId) => void;
  onToggleModule: (moduleId: ModuleId, forceState?: boolean) => void;
  usePersianNumerals: boolean;
  onStampToBoard: (title: string, summary: string, badgeColor: string) => void;
}

const SAMPLE_ELEMENTS: Array<{
  z: number;
  symbol: string;
  name: string;
  group: string;
  electronegativity: string;
}> = [
  { z: 6, symbol: 'C', name: 'کربن', group: 'نافلز گروه ۱۴', electronegativity: '2.55' },
  { z: 7, symbol: 'N', name: 'نیتروژن', group: 'نافلز گروه ۱۵', electronegativity: '3.04' },
  { z: 8, symbol: 'O', name: 'اکسیژن', group: 'نافلز گروه ۱۶', electronegativity: '3.44' },
  { z: 11, symbol: 'Na', name: 'سدیم', group: 'فلز قلیایی', electronegativity: '0.93' },
  { z: 17, symbol: 'Cl', name: 'کلر', group: 'هالوژن گروه ۱۷', electronegativity: '3.16' },
  { z: 26, symbol: 'Fe', name: 'آهن', group: 'فلز واسطه دوره ۴', electronegativity: '1.83' },
];

export const InteractiveLabsPanel: React.FC<InteractiveLabsPanelProps> = ({
  modules,
  activeTab,
  onChangeTab,
  onToggleModule,
  usePersianNumerals,
  onStampToBoard,
}) => {
  const fmt = (val: string | number) => toPersianDigits(val, usePersianNumerals);

  //Sub-section states for each STEM & Humanities Lab
  const [mathSection, setMathSection] = useState<
    'elementary-fractions' | 'visual-formula' | 'calculus-3d'
  >('elementary-fractions');
  const [physicsSection, setPhysicsSection] = useState<
    'mechanics' | 'waves' | 'circuits-fluids' | 'optics-bohr'
  >('mechanics');
  const [chemSection, setChemSection] = useState<
    'periodic-hund' | 'vsepr-organic' | 'galvanic-stoich'
  >('periodic-hund');
  const [humanitiesSection, setHumanitiesSection] = useState<
    'bio-genetics' | 'lit-arabic' | 'eng-accounting'
  >('bio-genetics');

  // Module 3: Math states
  const [divDividend, setDivDividend] = useState<number>(147);
  const [divDivisor, setDivDivisor] = useState<number>(12);
  const [formulaNumer, setFormulaNumer] = useState<string>('x² + ۲x');
  const [formulaDenom, setFormulaDenom] = useState<string>('x − ۱');
  const [radicand, setRadicand] = useState<string>('a² + b²');
  const [fractionTotal, setFractionTotal] = useState<number>(5);
  const [coloredSlices, setColoredSlices] = useState<boolean[]>([true, true, true, false, false]);
  const [fractionShape, setFractionShape] = useState<'pizza' | 'bar'>('pizza');
  const [showAutoFractionLabel, setShowAutoFractionLabel] = useState<boolean>(true);
  const [onesCount, setOnesCount] = useState<number>(8);
  const [tensCount, setTensCount] = useState<number>(2);
  const [jumpStart, setJumpStart] = useState<number>(1);
  const [jumpStep, setJumpStep] = useState<number>(4);
  const [calcFn, setCalcFn] = useState<MathFunctionId>('parabola');
  const [tangentX, setTangentX] = useState<number>(2);
  const [riemannN, setRiemannN] = useState<number>(8);
  const [netUnfoldPct, setNetUnfoldPct] = useState<number>(65);
  const [vennExpr, setVennExpr] = useState<VennExpressionId>('A_union_B_minus_C');

  // Module 4: Physics states
  const [angleDeg, setAngleDeg] = useState<number>(30);
  const [massKg, setMassKg] = useState<number>(5);
  const [frictionMu, setFrictionMu] = useState<number>(0.25);
  const [showFbdVectors, setShowFbdVectors] = useState<boolean>(true);
  // Waves & Harmonic Oscillator
  const [waveAmp, setWaveAmp] = useState<number>(24);
  const [waveFreq, setWaveFreq] = useState<number>(3);
  const [standingWaveMode, setStandingWaveMode] = useState<boolean>(true);
  // Circuit & U-Tube Manometer
  const [circuitMode, setCircuitMode] = useState<'series' | 'parallel'>('series');
  const [circuitVoltage, setCircuitVoltage] = useState<number>(12);
  const [r1Ohm, setR1Ohm] = useState<number>(4);
  const [r2Ohm, setR2Ohm] = useState<number>(2);
  const [manometerRhoRight, setManometerRhoRight] = useState<number>(2.0);
  const [manometerHLeft, setManometerHLeft] = useState<number>(24);
  // Optics, Snell's Law & Bohr Atom
  const [opticsObjectDist, setOpticsObjectDist] = useState<number>(45);
  const [opticsFocalLen, setOpticsFocalLen] = useState<number>(22);
  const [snellN1, setSnellN1] = useState<number>(1.5);
  const [snellN2, setSnellN2] = useState<number>(1.0);
  const [snellAngle1, setSnellAngle1] = useState<number>(35);
  const [bohrNi, setBohrNi] = useState<number>(3);
  const [bohrNf, setBohrNf] = useState<number>(2);

  // Module 5: Chemistry states
  const [selectedZ, setSelectedZ] = useState<number>(8);
  const [vseprId, setVseprId] = useState<VseprMoleculeId>('H2O');
  const [organicChainLen, setOrganicChainLen] = useState<number>(5);
  const [organicGroup, setOrganicGroup] = useState<string>('الکل (-OH) → پنتانول');
  const [numberedCarbons, setNumberedCarbons] = useState<boolean>(true);
  const [galvanicAnode, setGalvanicAnode] = useState<string>('Zn');
  const [galvanicCathode, setGalvanicCathode] = useState<string>('Cu');
  const [stoichCancelUnits, setStoichCancelUnits] = useState<boolean>(true);
  const [catalystActive, setCatalystActive] = useState<boolean>(false);
  const [solutionPh, setSolutionPh] = useState<number>(7);

  // Module 6: Biology, Literature, Arabic, English & Accounting states
  const [showAnatomyLabels, setShowAnatomyLabels] = useState<boolean>(true);
  const [parent1Geno, setParent1Geno] = useState<'AA' | 'Aa' | 'aa'>('Aa');
  const [parent2Geno, setParent2Geno] = useState<'AA' | 'Aa' | 'aa'>('Aa');
  const [prosodySequence, setProsodySequence] = useState<string[]>(['∪', '−', '−', '∪', '−', '−']);
  const [arabicWordIndex, setArabicWordIndex] = useState<number>(0);
  const [arabicTense, setArabicTense] = useState<'madi' | 'mudari'>('mudari');
  const [flashcardFlipped, setFlashcardFlipped] = useState<boolean>(false);
  const [debitTotal, setDebitTotal] = useState<number>(450);
  const [creditTotal, setCreditTotal] = useState<number>(320);
  const [showIranMapLabels, setShowIranMapLabels] = useState<boolean>(true);
  const [econTestPrice, setEconTestPrice] = useState<number>(20);

  // Additional Elementary, Algebra, Thermo & Chemistry Balancer states
  const [clockHour, setClockHour] = useState<number>(3);
  const [clockMinute, setClockMinute] = useState<number>(30);
  const [tallyCount, setTallyCount] = useState<number>(12);
  const [eqGuessedX, setEqGuessedX] = useState<number>(4);
  const [thermoProcess, setThermoProcess] = useState<'isothermal' | 'adiabatic' | 'isobaric' | 'isochoric'>('isothermal');
  const [chemCoeffN2, setChemCoeffN2] = useState<number>(1);
  const [chemCoeffH2, setChemCoeffH2] = useState<number>(3);
  const [chemCoeffNH3, setChemCoeffNH3] = useState<number>(2);

  // Module 2: Konkur Test Studio & Document Scanner Cleaner state
  const [optionStates, setOptionStates] = useState<
    Record<number, 'none' | 'eliminated' | 'correct'>
  >({ 1: 'eliminated', 2: 'none', 3: 'correct', 4: 'eliminated' });
  const [shadeRevealPercent, setShadeRevealPercent] = useState<number>(45);
  const [examTimerSec, setExamTimerSec] = useState<number>(75);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [scannerSensitivity, setScannerSensitivity] = useState<number>(0.84);
  const [scannerCleaned, setScannerCleaned] = useState<boolean>(true);
  const [uploadedScanName, setUploadedScanName] = useState<string | null>(null);

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setExamTimerSec((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  const handleFractionTotalChange = (newTotal: number) => {
    const clamped = Math.max(2, Math.min(10, newTotal));
    setFractionTotal(clamped);
    setColoredSlices((prev) => {
      const next = new Array(clamped).fill(false);
      for (let i = 0; i < Math.min(prev.length, clamped); i++) {
        next[i] = prev[i];
      }
      return next;
    });
  };

  const toggleSlice = (idx: number) => {
    setColoredSlices((prev) => prev.map((v, i) => (i === idx ? !v : v)));
  };

  const handleAddOneBlock = () => {
    if (onesCount + 1 >= 10) {
      setOnesCount(0);
      setTensCount((t) => t + 1);
    } else {
      setOnesCount((o) => o + 1);
    }
  };

  const handleBreakTenBlock = () => {
    if (tensCount > 0) {
      setTensCount((t) => t - 1);
      setOnesCount((o) => o + 10);
    }
  };

  const isModEnabled = (id: ModuleId) => modules.find((m) => m.id === id)?.enabled ?? false;

  const coloredCount = coloredSlices.filter(Boolean).length;
  const fractionMetrics = calculateFractionMetrics(coloredCount, fractionTotal);
  const physicsMetrics = calculateInclinedPlanePhysics(massKg, angleDeg, frictionMu);
  const circuitMetrics = calculateCircuitMetrics(circuitMode, circuitVoltage, r1Ohm, r2Ohm);
  const snellMetrics = calculateSnellsLaw(snellN1, snellN2, snellAngle1);
  const bohrMetrics = calculateBohrTransition(bohrNi, bohrNf);
  const manometerMetrics = calculateManometerEquilibrium(1.0, manometerRhoRight, manometerHLeft);
  const electronConfig = generateElectronConfig(selectedZ);
  const vseprSpec = VSEPR_MOLECULES[vseprId];
  const galvanicMetrics = calculateGalvanicCell(galvanicAnode, galvanicCathode);
  const punnettMetrics = calculatePunnettSquare(parent1Geno, parent2Geno);
  const calculusMetrics = calculateRiemannAndDerivative(calcFn, tangentX, riemannN);

  const divQuotient = Math.floor(divDividend / Math.max(1, divDivisor));
  const divProduct = divQuotient * Math.max(1, divDivisor);
  const divRemainder = divDividend - divProduct;

  const currentElement =
    SAMPLE_ELEMENTS.find((el) => el.z === selectedZ) ?? {
      z: selectedZ,
      symbol: `E${selectedZ}`,
      name: `عنصر با عدد اتمی ${selectedZ}`,
      group: 'جدول تناوبی',
      electronegativity: '2.10',
    };

  const tabs: Array<{
    id: LabTabId;
    label: string;
    modId: ModuleId;
    icon: React.ReactNode;
  }> = [
    {
      id: 'math',
      label: 'ریاضی',
      modId: 'mod-3-math',
      icon: <Calculator className="w-3.5 h-3.5" />,
    },
    {
      id: 'physics',
      label: 'فیزیک',
      modId: 'mod-4-physics',
      icon: <Atom className="w-3.5 h-3.5" />,
    },
    {
      id: 'chemistry',
      label: 'شیمی',
      modId: 'mod-5-chemistry',
      icon: <FlaskConical className="w-3.5 h-3.5" />,
    },
    {
      id: 'humanities',
      label: 'زیست/ادبیات',
      modId: 'mod-6-bio-lit',
      icon: <BookOpen className="w-3.5 h-3.5" />,
    },
    {
      id: 'konkur',
      label: 'تست/اسکن',
      modId: 'mod-2-pdf-test',
      icon: <CheckSquare className="w-3.5 h-3.5" />,
    },
  ];

  const renderPizzaSvg = () => {
    const cx = 80;
    const cy = 80;
    const r = 68;
    return (
      <svg viewBox="0 0 160 160" className="w-32 h-32 mx-auto select-none">
        {coloredSlices.map((isColored, idx) => {
          const startAngle = (idx * 2 * Math.PI) / fractionTotal - Math.PI / 2;
          const endAngle = ((idx + 1) * 2 * Math.PI) / fractionTotal - Math.PI / 2;
          const x1 = cx + r * Math.cos(startAngle);
          const y1 = cy + r * Math.sin(startAngle);
          const x2 = cx + r * Math.cos(endAngle);
          const y2 = cy + r * Math.sin(endAngle);
          const largeArc = 2 * Math.PI / fractionTotal > Math.PI ? 1 : 0;
          const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
          return (
            <path
              key={idx}
              d={d}
              onClick={() => toggleSlice(idx)}
              className={`cursor-pointer transition-colors stroke-white dark:stroke-slate-900 stroke-2 ${
                isColored
                  ? 'fill-sky-500 hover:fill-sky-400'
                  : 'fill-slate-200 dark:fill-slate-800 hover:fill-slate-300 dark:hover:fill-slate-700'
              }`}
            />
          );
        })}
      </svg>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Main 5 Lab Category Tabs */}
      <div className="grid grid-cols-5 gap-1 p-1.5 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        {tabs.map((t) => {
          const active = activeTab === t.id;
          const enabled = isModEnabled(t.modId);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChangeTab(t.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-[11px] font-medium transition-all relative ${
                active
                  ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {t.icon}
              <span className="mt-0.5 truncate w-full text-center">{t.label}</span>
              {!enabled && (
                <span
                  className="text-[9px] text-slate-400 dark:text-slate-500"
                  title="ماژول غیرفعال است"
                >
                  (خاموش)
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* ================= MODULE 3: MATH, FORMULA, GEOMETRY & CALCULUS LAB ================= */}
        {activeTab === 'math' && (
          <>
            {!isModEnabled('mod-3-math') ? (
              <DisabledModuleNotice
                title="ماژول ۳: آزمایشگاه ریاضی و هندسه غیرفعال است"
                description="برای جلوگیری از مصرف RAM، این ماژول توسط شما یا پروفایل تدریس خاموش شده است."
                onEnable={() => onToggleModule('mod-3-math', true)}
              />
            ) : (
              <>
                <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-medium">
                  <button
                    type="button"
                    onClick={() => setMathSection('elementary-fractions')}
                    className={`py-1.5 px-1 rounded-md transition-colors truncate ${
                      mathSection === 'elementary-fractions'
                        ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 font-bold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    کسر و دبستان
                  </button>
                  <button
                    type="button"
                    onClick={() => setMathSection('visual-formula')}
                    className={`py-1.5 px-1 rounded-md transition-colors truncate ${
                      mathSection === 'visual-formula'
                        ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 font-bold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    فرمول و تقسیم چکشی
                  </button>
                  <button
                    type="button"
                    onClick={() => setMathSection('calculus-3d')}
                    className={`py-1.5 px-1 rounded-md transition-colors truncate ${
                      mathSection === 'calculus-3d'
                        ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 font-bold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    حسابان، ۳بعدی و ون
                  </button>
                </div>

                {mathSection === 'elementary-fractions' && (
                  <>
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          ابزارک هوشمند کسر، اعشار و درصد
                        </h4>
                        <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-md text-[11px]">
                          <button
                            type="button"
                            onClick={() => setFractionShape('pizza')}
                            className={`px-2 py-0.5 rounded ${
                              fractionShape === 'pizza'
                                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold'
                                : 'text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            دایره‌ای
                          </button>
                          <button
                            type="button"
                            onClick={() => setFractionShape('bar')}
                            className={`px-2 py-0.5 rounded ${
                              fractionShape === 'bar'
                                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold'
                                : 'text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            نواری
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-400">تعداد تقسیمات مساوی:</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-label="کاهش تقسیمات کسر"
                            onClick={() => handleFractionTotalChange(fractionTotal - 1)}
                            className="w-6 h-6 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-mono font-bold text-sm w-6 text-center tabular-nums">
                            {fmt(fractionTotal)}
                          </span>
                          <button
                            type="button"
                            aria-label="افزایش تقسیمات کسر"
                            onClick={() => handleFractionTotalChange(fractionTotal + 1)}
                            className="w-6 h-6 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="py-1">
                        {fractionShape === 'pizza' ? (
                          renderPizzaSvg()
                        ) : (
                          <div className="grid grid-flow-col auto-cols-fr gap-1 h-12 p-1 rounded-lg bg-slate-200 dark:bg-slate-800">
                            {coloredSlices.map((isColored, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => toggleSlice(idx)}
                                aria-label={`قطعه کسری ${idx + 1}`}
                                className={`rounded transition-colors ${
                                  isColored
                                    ? 'bg-sky-500 hover:bg-sky-400'
                                    : 'bg-white dark:bg-slate-900 hover:bg-slate-100'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                        <span className="text-slate-600 dark:text-slate-400">نمایشگر خودکار کسر و درصد:</span>
                        <button
                          type="button"
                          onClick={() => setShowAutoFractionLabel((v) => !v)}
                          className="text-sky-600 dark:text-sky-400 font-medium flex items-center gap-1"
                        >
                          {showAutoFractionLabel ? (
                            <>
                              <Eye className="w-3.5 h-3.5" /> روشن
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" /> مخفی
                            </>
                          )}
                        </button>
                      </div>

                      {showAutoFractionLabel && (
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                            شکل به{' '}
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {fmt(fractionTotal)} تا یک‌{fmt(fractionTotal)}م ({fmt(1)}/{fmt(fractionTotal)})
                            </span>{' '}
                            مساوی تقسیم شده است
                          </div>
                          <div className="flex items-center justify-around pt-1">
                            <div className="text-center">
                              <span className="text-[10px] text-slate-400 block">کسر</span>
                              <div className="inline-flex flex-col items-center font-bold text-sm text-sky-600 dark:text-sky-400 leading-tight tabular-nums">
                                <span>{fmt(fractionMetrics.numerator)}</span>
                                <span className="w-5 h-0.5 bg-sky-600 dark:bg-sky-400 my-0.5" />
                                <span>{fmt(fractionMetrics.denominator)}</span>
                              </div>
                            </div>
                            <span className="text-slate-400 font-bold">=</span>
                            <div className="text-center">
                              <span className="text-[10px] text-slate-400 block">اعشار</span>
                              <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100 tabular-nums">
                                {fmt(fractionMetrics.decimal)}
                              </span>
                            </div>
                            <span className="text-slate-400 font-bold">=</span>
                            <div className="text-center">
                              <span className="text-[10px] text-slate-400 block">درصد</span>
                              <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 tabular-nums">
                                {fmt(fractionMetrics.percentage)}٪
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          onStampToBoard(
                            `ابزارک کسر ${fractionShape === 'bar' ? 'نواری' : 'دایره‌ای'} (${fmt(
                              fractionMetrics.numerator
                            )}/${fmt(fractionMetrics.denominator)})`,
                            `معادل اعشاری: ${fmt(fractionMetrics.decimal)} | معادل درصدی: ${fmt(
                              fractionMetrics.percentage
                            )}٪`,
                            '#0284c7'
                          )
                        }
                        className="w-full py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500 transition-colors"
                      >
                        ارسال شکل کسر به روی تخته سفید
                      </button>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          مکعب‌های ارزش مکانی دبستان (یکی و ده‌تایی)
                        </h4>
                        <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                          عدد: {fmt(tensCount * 10 + onesCount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleAddOneBlock}
                          className="flex-1 py-1.5 px-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-sky-500 transition-colors"
                        >
                          + افزودن مکعب یکی ({fmt(onesCount)}/۱۰)
                        </button>
                        <button
                          type="button"
                          onClick={handleBreakTenBlock}
                          disabled={tensCount === 0}
                          className="flex-1 py-1.5 px-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-amber-500 disabled:opacity-40 transition-colors"
                        >
                          شکستن ۱ ده‌تایی به ۱۰ یکی
                        </button>
                      </div>
                      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 min-h-14">
                        <div className="flex items-center gap-1.5">
                          {Array.from({ length: tensCount }).map((_, i) => (
                            <div
                              key={i}
                              title="میله ده‌تایی"
                              className="w-3 h-11 rounded-xs bg-amber-500 border border-amber-600"
                            />
                          ))}
                        </div>
                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
                        <div className="flex flex-wrap gap-1">
                          {Array.from({ length: onesCount }).map((_, i) => (
                            <div
                              key={i}
                              title="مکعب یکی"
                              className="w-3.5 h-3.5 rounded-xs bg-sky-500 border border-sky-600"
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100">
                          محور اعداد هوشمند با کمان پرش
                        </h4>
                        <span className="font-mono text-sky-600 dark:text-sky-400 tabular-nums">
                          {fmt(jumpStart)} + {fmt(jumpStep)} = {fmt(jumpStart + jumpStep)}
                        </span>
                      </div>
                      <svg viewBox="0 0 260 65" className="w-full h-16">
                        <line
                          x1="15"
                          y1="45"
                          x2="245"
                          y2="45"
                          className="stroke-slate-700 dark:stroke-slate-300"
                          strokeWidth="2"
                        />
                        {Array.from({ length: 9 }).map((_, idx) => {
                          const x = 20 + idx * 27.5;
                          return (
                            <g key={idx}>
                              <line
                                x1={x}
                                y1="40"
                                x2={x}
                                y2="50"
                                className="stroke-slate-700 dark:stroke-slate-300"
                                strokeWidth="1.5"
                              />
                              <text
                                x={x}
                                y="61"
                                textAnchor="middle"
                                className="fill-slate-600 dark:fill-slate-400 text-[9px] font-mono"
                              >
                                {fmt(idx)}
                              </text>
                            </g>
                          );
                        })}
                        <path
                          d={`M ${20 + jumpStart * 27.5} 40 Q ${
                            20 + (jumpStart + jumpStep / 2) * 27.5
                          } 5 ${20 + Math.min(8, jumpStart + jumpStep) * 27.5} 40`}
                          fill="none"
                          stroke="#0284c7"
                          strokeWidth="2"
                          strokeDasharray="3 2"
                        />
                        <text
                          x={20 + (jumpStart + jumpStep / 2) * 27.5}
                          y="16"
                          textAnchor="middle"
                          className="fill-sky-600 dark:fill-sky-400 text-[10px] font-bold"
                        >
                          +{fmt(jumpStep)}
                        </text>
                      </svg>
                      <div className="flex items-center gap-2 text-[11px]">
                        <label className="flex items-center gap-1 flex-1">
                          <span>شروع:</span>
                          <input
                            type="range"
                            min={0}
                            max={4}
                            value={jumpStart}
                            onChange={(e) => setJumpStart(Number(e.target.value))}
                            className="w-full accent-sky-600"
                          />
                        </label>
                        <label className="flex items-center gap-1 flex-1">
                          <span>پرش:</span>
                          <input
                            type="range"
                            min={1}
                            max={4}
                            value={jumpStep}
                            onChange={(e) => setJumpStep(Number(e.target.value))}
                            className="w-full accent-sky-600"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Elementary Teaching Clock & Tally Marks (ساعت آموزشی و چوب‌خط دبستان) */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100">
                          ساعت آموزشی عقربه‌دار و چوب‌خط (ویژه دبستان)
                        </h4>
                        <span className="font-mono font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                          {fmt(String(clockHour).padStart(2, '0'))}:{fmt(String(clockMinute).padStart(2, '0'))}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 items-center">
                        <div className="space-y-1.5 text-[11px]">
                          <label className="block">
                            <span className="text-slate-500">ساعت ({fmt(clockHour)}):</span>
                            <input
                              type="range"
                              min={1}
                              max={12}
                              value={clockHour}
                              onChange={(e) => setClockHour(Number(e.target.value))}
                              className="w-full accent-sky-600"
                            />
                          </label>
                          <label className="block">
                            <span className="text-slate-500">دقیقه ({fmt(clockMinute)}):</span>
                            <input
                              type="range"
                              min={0}
                              max={55}
                              step={5}
                              value={clockMinute}
                              onChange={(e) => setClockMinute(Number(e.target.value))}
                              className="w-full accent-sky-600"
                            />
                          </label>
                        </div>
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-1">
                          <span className="text-[10px] text-slate-400 block">
                            چوب‌خط پنج‌تایی ({fmt(tallyCount)})
                          </span>
                          <div className="flex items-center justify-center gap-1.5 font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                            {Array.from({ length: Math.floor(tallyCount / 5) }).map((_, i) => (
                              <span key={i} className="px-1 rounded bg-amber-500/10 border border-amber-500/30">
                                ||||̸
                              </span>
                            ))}
                            {tallyCount % 5 > 0 && (
                              <span>{'|'.repeat(tallyCount % 5)}</span>
                            )}
                          </div>
                          <div className="flex justify-center gap-1 pt-0.5">
                            <button
                              type="button"
                              onClick={() => setTallyCount((c) => Math.max(1, c - 1))}
                              className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px]"
                            >
                              −
                            </button>
                            <button
                              type="button"
                              onClick={() => setTallyCount((c) => Math.min(25, c + 1))}
                              className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px]"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {mathSection === 'visual-formula' && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        فرمول‌ساز بصری (Visual Math Builder بدون کدنویسی)
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center gap-1">
                          <span className="text-[10px] text-slate-400">ساختار صورت و مخرج (□□)</span>
                          <input
                            type="text"
                            value={formulaNumer}
                            onChange={(e) => setFormulaNumer(e.target.value)}
                            aria-label="صورت کسر"
                            className="w-24 text-center text-xs font-mono py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                          />
                          <div className="w-24 h-0.5 bg-slate-800 dark:bg-slate-200" />
                          <input
                            type="text"
                            value={formulaDenom}
                            onChange={(e) => setFormulaDenom(e.target.value)}
                            aria-label="مخرج کسر"
                            className="w-24 text-center text-xs font-mono py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                          />
                        </div>

                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between items-center">
                          <span className="text-[10px] text-slate-400">رادیکال و انتگرال</span>
                          <div className="flex items-center gap-1 font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
                            <span className="text-base">√</span>
                            <input
                              type="text"
                              value={radicand}
                              onChange={(e) => setRadicand(e.target.value)}
                              aria-label="عبارت زیر رادیکال"
                              className="w-20 text-center text-xs font-mono py-0.5 rounded bg-slate-100 dark:bg-slate-800 border-t-2 border-slate-700 dark:border-slate-300"
                            />
                          </div>
                          <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                            ∫₀⁴ ({formulaNumer}) dx
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          onStampToBoard(
                            `فرمول ریاضی: (${formulaNumer}) / (${formulaDenom})`,
                            `رادیکال: √(${radicand}) | انتگرال معین روی بازه [۰, ۴]`,
                            '#0284c7'
                          )
                        }
                        className="w-full py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500"
                      >
                        درج فرمول بصری روی تخته سفید
                      </button>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        ابزار اختصاصی تقسیم چکشی ایرانی (سبک کتاب درسی)
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <label className="block">
                          <span className="text-[11px] text-slate-500">مقسوم:</span>
                          <input
                            type="number"
                            value={divDividend}
                            onChange={(e) => setDivDividend(Math.max(1, Number(e.target.value)))}
                            className="w-full mt-0.5 px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                          />
                        </label>
                        <label className="block">
                          <span className="text-[11px] text-slate-500">مقسوم‌علیه:</span>
                          <input
                            type="number"
                            value={divDivisor}
                            onChange={(e) => setDivDivisor(Math.max(1, Number(e.target.value)))}
                            className="w-full mt-0.5 px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                          />
                        </label>
                      </div>

                      <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs">
                        <div className="grid grid-cols-2 items-start">
                          <div className="pl-3 space-y-1 text-left">
                            <div className="font-bold text-slate-900 dark:text-slate-100">
                              {fmt(divDividend)}
                            </div>
                            <div className="text-rose-600 dark:text-rose-400 border-b border-slate-300 dark:border-slate-700 pb-0.5">
                              − {fmt(divProduct)}
                            </div>
                            <div className="font-bold text-emerald-600 dark:text-emerald-400">
                              باقی‌مانده: {fmt(divRemainder)}
                            </div>
                          </div>
                          <div className="border-r-2 border-slate-800 dark:border-slate-200 pr-3 space-y-1">
                            <div className="border-b-2 border-slate-800 dark:border-slate-200 pb-1 font-bold text-sky-600 dark:text-sky-400">
                              {fmt(divDivisor)} (مقسوم‌علیه)
                            </div>
                            <div className="pt-1 font-bold text-amber-600 dark:text-amber-400">
                              {fmt(divQuotient)} (خارج‌قسمت)
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          onStampToBoard(
                            `تقسیم چکشی ایرانی: ${fmt(divDividend)} ÷ ${fmt(divDivisor)}`,
                            `خارج‌قسمت = ${fmt(divQuotient)} | باقی‌مانده = ${fmt(divRemainder)}`,
                            '#d97706'
                          )
                        }
                        className="w-full py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500"
                      >
                        ارسال تقسیم چکشی به تخته سفید
                      </button>
                    </div>

                    {/* Two-Pan Equation Balance Scale (ترازوی معادلات جبری) */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100">
                          ترازوی دوکفه‌ای معادلات (۲x + ۳ = ۱۱)
                        </h4>
                        <span
                          className={`font-bold ${
                            2 * eqGuessedX + 3 === 11
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {2 * eqGuessedX + 3 === 11
                            ? 'ترازو در تعادل کامل! (x = ۴)'
                            : 2 * eqGuessedX + 3 > 11
                            ? 'کفه چپ سنگین‌تر است'
                            : 'کفه راست سنگین‌تر است'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="whitespace-nowrap">مقدار مجهول (x = {fmt(eqGuessedX)}):</span>
                        <input
                          type="range"
                          min={1}
                          max={8}
                          value={eqGuessedX}
                          onChange={(e) => setEqGuessedX(Number(e.target.value))}
                          className="w-full accent-sky-600"
                        />
                        <span className="font-mono font-bold whitespace-nowrap">
                          {fmt(2 * eqGuessedX + 3)} vs {fmt(11)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {mathSection === 'calculus-3d' && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                          <span>حسابان بصری: خط مماس مشتق و مستطیل‌های ریمان</span>
                        </h4>
                        <select
                          value={calcFn}
                          onChange={(e) => setCalcFn(e.target.value as MathFunctionId)}
                          aria-label="انتخاب تابع ریاضی"
                          className="w-full text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                        >
                          <option value="parabola">f(x) = 0.5x² + 0.5</option>
                          <option value="sine">f(x) = 2sin(x) + 2.5</option>
                          <option value="cubic">f(x) = 0.15x³ − 0.3x² + x + 1</option>
                        </select>
                      </div>

                      <svg viewBox="0 0 240 130" className="w-full h-32 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1">
                        <line x1="25" y1="110" x2="225" y2="110" stroke="#64748b" strokeWidth="1.5" />
                        <line x1="25" y1="10" x2="25" y2="110" stroke="#64748b" strokeWidth="1.5" />

                        {calculusMetrics.rectangles.map((rect, idx) => {
                          const rx = 25 + (rect.x / 4) * 190;
                          const rw = (rect.width / 4) * 190;
                          const rh = Math.min(95, (rect.height / 9) * 95);
                          return (
                            <rect
                              key={idx}
                              x={rx}
                              y={110 - rh}
                              width={Math.max(1, rw - 1)}
                              height={rh}
                              className="fill-sky-500/25 stroke-sky-500/60"
                              strokeWidth="1"
                            />
                          );
                        })}

                        {(() => {
                          const px = 25 + (tangentX / 4) * 190;
                          const py = 110 - (calculusMetrics.valueAtX / 9) * 95;
                          const slope = calculusMetrics.derivativeAtX;
                          const dxPx = 35;
                          const dyPx = slope * (95 / 9) * (dxPx / (190 / 4));
                          return (
                            <g>
                              <line
                                x1={px - dxPx}
                                y1={py + dyPx}
                                x2={px + dxPx}
                                y2={py - dyPx}
                                stroke="#ef4444"
                                strokeWidth="2"
                              />
                              <circle cx={px} cy={py} r="4" className="fill-rose-500" />
                            </g>
                          );
                        })()}
                      </svg>

                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-500">نقطه خط مماس (مشتق): x₀ = {fmt(tangentX)}</span>
                          <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                            f'(x₀) = {fmt(calculusMetrics.derivativeAtX)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0.5}
                          max={3.5}
                          step={0.25}
                          value={tangentX}
                          onChange={(e) => setTangentX(Number(e.target.value))}
                          aria-label="نقطه مماس مشتق"
                          className="w-full accent-rose-500"
                        />

                        <div className="flex justify-between">
                          <span className="text-slate-500">تعداد مستطیل‌های ریمان: N = {fmt(riemannN)}</span>
                          <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                            مساحت ≈ {fmt(calculusMetrics.riemannArea)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={2}
                          max={24}
                          value={riemannN}
                          onChange={(e) => setRiemannN(Number(e.target.value))}
                          aria-label="تعداد مستطیل‌های ریمان"
                          className="w-full accent-sky-600"
                        />
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                          <Box className="w-3.5 h-3.5 text-amber-500" />
                          <span>گسترده اشکال سه‌بعدی (3D Net) و نمودار ون</span>
                        </h4>
                        <span className="font-mono text-amber-600 dark:text-amber-400">
                          بازشدگی مکعب: {fmt(netUnfoldPct)}٪
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={netUnfoldPct}
                        onChange={(e) => setNetUnfoldPct(Number(e.target.value))}
                        aria-label="میزان باز شدن گسترده سه‌بعدی مکعب"
                        className="w-full accent-amber-500"
                      />

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-400">عبارت نمودار ون:</span>
                          <select
                            value={vennExpr}
                            onChange={(e) => setVennExpr(e.target.value as VennExpressionId)}
                            aria-label="عبارت مجموعه‌ای نمودار ون"
                            className="text-[11px] px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                          >
                            <option value="A_union_B_minus_C">(A ∪ B) − C</option>
                            <option value="A_intersect_B">A ∩ B</option>
                            <option value="A_minus_B">A − B</option>
                            <option value="A_intersect_B_intersect_C">A ∩ B ∩ C</option>
                          </select>
                        </div>
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] flex items-center justify-around">
                          <span
                            className={
                              evaluateVennRegion(vennExpr, true, false, false)
                                ? 'font-bold text-sky-600 dark:text-sky-400'
                                : 'text-slate-400'
                            }
                          >
                            فقط A: {evaluateVennRegion(vennExpr, true, false, false) ? 'هاشورخورده' : 'خالی'}
                          </span>
                          <span
                            className={
                              evaluateVennRegion(vennExpr, true, true, false)
                                ? 'font-bold text-sky-600 dark:text-sky-400'
                                : 'text-slate-400'
                            }
                          >
                            A∩B−C: {evaluateVennRegion(vennExpr, true, true, false) ? 'هاشورخورده' : 'خالی'}
                          </span>
                          <span
                            className={
                              evaluateVennRegion(vennExpr, true, true, true)
                                ? 'font-bold text-sky-600 dark:text-sky-400'
                                : 'text-slate-400'
                            }
                          >
                            A∩B∩C: {evaluateVennRegion(vennExpr, true, true, true) ? 'هاشورخورده' : 'خالی'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ================= MODULE 4: COMPREHENSIVE PHYSICS LAB (100% COVERAGE) ================= */}
        {activeTab === 'physics' && (
          <>
            {!isModEnabled('mod-4-physics') ? (
              <DisabledModuleNotice
                title="ماژول ۴: آزمایشگاه جامع فیزیک غیرفعال است"
                description="برای استفاده از سطح شیب‌دار، موج و نوسان، مدار الکتریکی، مانومتر و اپتیک/بور، این ماژول را روشن کنید."
                onEnable={() => onToggleModule('mod-4-physics', true)}
              />
            ) : (
              <div className="space-y-3">
                {/* Physics 4-Zone Sub-navigation */}
                <div className="grid grid-cols-4 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-medium">
                  {[
                    { id: 'mechanics', label: 'مکانیک/FBD' },
                    { id: 'waves', label: 'موج و نوسان' },
                    { id: 'circuits-fluids', label: 'مدار و فشار' },
                    { id: 'optics-bohr', label: 'اپتیک و بور' },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setPhysicsSection(sub.id as typeof physicsSection)}
                      className={`py-1.5 px-1 rounded-md transition-colors truncate ${
                        physicsSection === sub.id
                          ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 font-bold shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>

                {/* 4.1: Mechanics & Inclined Plane FBD */}
                {physicsSection === 'mechanics' && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        سطح شیب‌دار هوشمند و دیاگرام جسم آزاد (FBD)
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowFbdVectors((v) => !v)}
                        className="text-[11px] font-medium text-sky-600 dark:text-sky-400"
                      >
                        {showFbdVectors ? 'مخفی کردن بردارها' : 'نمایش بردارهای نیرو'}
                      </button>
                    </div>

                    <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2">
                      <svg viewBox="0 0 260 155" className="w-full h-36">
                        <line x1="20" y1="135" x2="240" y2="135" stroke="#64748b" strokeWidth="2" />
                        {(() => {
                          const rad = (angleDeg * Math.PI) / 180;
                          const rampLen = 175;
                          const xTop = 30 + rampLen * Math.cos(rad);
                          const yTop = 135 - rampLen * Math.sin(rad);
                          const bx = 30 + 95 * Math.cos(rad);
                          const by = 135 - 95 * Math.sin(rad);
                          return (
                            <g>
                              <polygon
                                points={`30,135 ${xTop},${yTop} ${xTop},135`}
                                className="fill-slate-100 dark:fill-slate-800/80 stroke-slate-400 dark:stroke-slate-600"
                                strokeWidth="1.5"
                              />
                              <text
                                x="62"
                                y="130"
                                className="fill-amber-600 dark:fill-amber-400 text-[10px] font-bold"
                              >
                                θ={fmt(angleDeg)}°
                              </text>
                              <g transform={`translate(${bx}, ${by}) rotate(${-angleDeg})`}>
                                <rect
                                  x="-18"
                                  y="-28"
                                  width="36"
                                  height="28"
                                  rx="4"
                                  className="fill-sky-600 stroke-sky-800"
                                />
                                <text
                                  x="0"
                                  y="-11"
                                  textAnchor="middle"
                                  className="fill-white text-[9px] font-bold"
                                >
                                  {fmt(massKg)}kg
                                </text>
                                {showFbdVectors && (
                                  <>
                                    <line x1="0" y1="-14" x2="0" y2="-56" stroke="#10b981" strokeWidth="2" />
                                    <text x="6" y="-48" className="fill-emerald-600 dark:fill-emerald-400 text-[9px] font-bold">
                                      N
                                    </text>
                                    <line x1="0" y1="-14" x2="-46" y2="-14" stroke="#ef4444" strokeWidth="2" />
                                    <text x="-44" y="-20" className="fill-rose-600 dark:fill-rose-400 text-[8px] font-bold">
                                      mg·sinθ
                                    </text>
                                    <line x1="0" y1="-14" x2="34" y2="-14" stroke="#f59e0b" strokeWidth="2" />
                                    <text x="28" y="-20" className="fill-amber-600 dark:fill-amber-400 text-[8px] font-bold">
                                      f
                                    </text>
                                    <line
                                      x1="0"
                                      y1="-14"
                                      x2="0"
                                      y2="24"
                                      stroke="#94a3b8"
                                      strokeWidth="1.5"
                                      strokeDasharray="3 2"
                                    />
                                  </>
                                )}
                              </g>
                            </g>
                          );
                        })()}
                      </svg>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="flex justify-between mb-0.5">
                          <span className="text-slate-600 dark:text-slate-400">زاویه شیب (θ):</span>
                          <span className="font-mono font-bold tabular-nums">{fmt(angleDeg)}°</span>
                        </div>
                        <input
                          type="range"
                          min={10}
                          max={55}
                          value={angleDeg}
                          onChange={(e) => setAngleDeg(Number(e.target.value))}
                          aria-label="زاویه سطح شیب‌دار"
                          className="w-full accent-sky-600"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-0.5">
                          <span className="text-slate-600 dark:text-slate-400">جرم جسم (m):</span>
                          <span className="font-mono font-bold tabular-nums">{fmt(massKg)} kg</span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={15}
                          value={massKg}
                          onChange={(e) => setMassKg(Number(e.target.value))}
                          aria-label="جرم جسم"
                          className="w-full accent-sky-600"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-0.5">
                          <span className="text-slate-600 dark:text-slate-400">ضریب اصطکاک (μ):</span>
                          <span className="font-mono font-bold tabular-nums">{fmt(frictionMu)}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={0.6}
                          step={0.05}
                          value={frictionMu}
                          onChange={(e) => setFrictionMu(Number(e.target.value))}
                          aria-label="ضریب اصطکاک"
                          className="w-full accent-sky-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono tabular-nums">
                      <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-400 block font-sans">مؤلفه موازی (mg·sinθ)</span>
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          {fmt(physicsMetrics.mgSinTheta)} N
                        </span>
                      </div>
                      <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-400 block font-sans">نیروی عمودی (mg·cosθ)</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {fmt(physicsMetrics.normalForceN)} N
                        </span>
                      </div>
                      <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-400 block font-sans">شتاب حرکت (a)</span>
                        <span className="font-bold text-sky-600 dark:text-sky-400">
                          {fmt(physicsMetrics.accelerationMs2)} m/s²
                        </span>
                      </div>
                      <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-400 block font-sans">وضعیت دینامیکی</span>
                        <span
                          className={`font-sans font-bold ${
                            physicsMetrics.isSliding
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {physicsMetrics.isSliding ? 'در حال لغزش' : 'در حال تعادل (ساکن)'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onStampToBoard(
                          `دیاگرام جسم آزاد (θ=${fmt(angleDeg)}°, m=${fmt(massKg)}kg)`,
                          `mg·sinθ = ${fmt(physicsMetrics.mgSinTheta)}N | N = ${fmt(physicsMetrics.normalForceN)}N | a = ${fmt(physicsMetrics.accelerationMs2)} m/s²`,
                          '#059669'
                        )
                      }
                      className="w-full py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500 transition-colors"
                    >
                      افزودن دیاگرام FBD به تخته سفید
                    </button>
                  </div>
                )}

                {/* 4.2: Waves & Harmonic Oscillator (گره و شکم موج ایستاده + نمودار x-t) */}
                {physicsSection === 'waves' && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                        <Waves className="w-3.5 h-3.5 text-sky-500" />
                        <span>مولد موج زنده و ایستاده (گره و شکم)</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => setStandingWaveMode((s) => !s)}
                        className="text-[10px] px-2 py-0.5 rounded bg-sky-500/15 text-sky-600 dark:text-sky-400 font-semibold"
                      >
                        {standingWaveMode ? 'موج ایستاده' : 'موج پیش‌رونده'}
                      </button>
                    </div>

                    <svg viewBox="0 0 240 100" className="w-full h-24 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <line x1="10" y1="50" x2="230" y2="50" stroke="#94a3b8" strokeDasharray="3 3" />
                      {(() => {
                        const pts: string[] = [];
                        const mirrorPts: string[] = [];
                        for (let x = 10; x <= 230; x += 3) {
                          const norm = (x - 10) / 220;
                          const yOffset = waveAmp * Math.sin(norm * waveFreq * Math.PI);
                          pts.push(`${x},${50 - yOffset}`);
                          mirrorPts.push(`${x},${50 + yOffset}`);
                        }
                        return (
                          <>
                            <polyline
                              fill="none"
                              stroke="#0284c7"
                              strokeWidth="2.5"
                              points={pts.join(' ')}
                            />
                            {standingWaveMode && (
                              <polyline
                                fill="none"
                                stroke="#38bdf8"
                                strokeWidth="1.5"
                                strokeDasharray="3 2"
                                points={mirrorPts.join(' ')}
                              />
                            )}
                          </>
                        );
                      })()}
                    </svg>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">دامنه نوسان (A):</span>
                        <span className="font-mono font-bold">{fmt(waveAmp)} mm</span>
                      </div>
                      <input
                        type="range"
                        min={8}
                        max={40}
                        value={waveAmp}
                        onChange={(e) => setWaveAmp(Number(e.target.value))}
                        aria-label="دامنه موج"
                        className="w-full accent-sky-600"
                      />

                      <div className="flex justify-between">
                        <span className="text-slate-500">هماهنگ / بسامد (n):</span>
                        <span className="font-mono font-bold">
                          هماهنگ {fmt(waveFreq)} ({fmt(waveFreq + 1)} گره و {fmt(waveFreq)} شکم)
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={6}
                        value={waveFreq}
                        onChange={(e) => setWaveFreq(Number(e.target.value))}
                        aria-label="بسامد موج ایستاده"
                        className="w-full accent-sky-600"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onStampToBoard(
                          `موج ایستاده (هماهنگ ${fmt(waveFreq)})`,
                          `تعداد گره‌ها: ${fmt(waveFreq + 1)} | تعداد شکم‌ها: ${fmt(waveFreq)} | دامنه A = ${fmt(waveAmp)}mm`,
                          '#0284c7'
                        )
                      }
                      className="w-full py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500"
                    >
                      ارسال نمودار موج و نوسان به تخته
                    </button>
                  </div>
                )}

                {/* 4.3: DC Circuits (Series/Parallel) & U-Tube Manometer */}
                {physicsSection === 'circuits-fluids' && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          <span>شبیه‌ساز مدار الکتریکی و مغناطیس</span>
                        </h4>
                        <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded text-[10px]">
                          <button
                            type="button"
                            onClick={() => setCircuitMode('series')}
                            className={`px-2 py-0.5 rounded ${
                              circuitMode === 'series'
                                ? 'bg-white dark:bg-slate-900 font-bold text-sky-600'
                                : 'text-slate-500'
                            }`}
                          >
                            مدار سری
                          </button>
                          <button
                            type="button"
                            onClick={() => setCircuitMode('parallel')}
                            className={`px-2 py-0.5 rounded ${
                              circuitMode === 'parallel'
                                ? 'bg-white dark:bg-slate-900 font-bold text-sky-600'
                                : 'text-slate-500'
                            }`}
                          >
                            مدار موازی
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-[11px]">
                        <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-sans">مقاومت معادل</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {fmt(circuitMetrics.equivalentResistanceOhm)} Ω
                          </span>
                        </div>
                        <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-sans">آمپرسنج (I)</span>
                          <span className="font-bold text-sky-600 dark:text-sky-400">
                            {fmt(circuitMetrics.totalCurrentAmp)} A
                          </span>
                        </div>
                        <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-sans">توان لامپ (P)</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            {fmt(circuitMetrics.totalPowerWatt)} W
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-500">ولتاژ باتری (V = {fmt(circuitVoltage)}V):</span>
                          <span className="text-slate-500">
                            R₁={fmt(r1Ohm)}Ω , R₂={fmt(r2Ohm)}Ω
                          </span>
                        </div>
                        <input
                          type="range"
                          min={6}
                          max={24}
                          value={circuitVoltage}
                          onChange={(e) => setCircuitVoltage(Number(e.target.value))}
                          aria-label="ولتاژ باتری مدار"
                          className="w-full accent-amber-500"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            onStampToBoard(
                              'میدان مغناطیسی درون‌سو (⊗) و برون‌سو (⊙)',
                              `قانون دست راست | مدار ${circuitMode === 'series' ? 'سری' : 'موازی'}: I = ${fmt(circuitMetrics.totalCurrentAmp)}A`,
                              '#d97706'
                            )
                          }
                          className="w-full py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500"
                        >
                          درج مدار و مهرهای میدان (⊗ / ⊙) روی تخته
                        </button>
                      </div>
                    </div>

                    {/* U-Tube Manometer */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100">
                          لوله U شکل (مانومتر دو مایع و خط هم‌فشار)
                        </h4>
                        <span className="font-mono text-sky-600 dark:text-sky-400">
                          h₂ = {fmt(manometerMetrics.hRightCm)} cm
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        تعادل هیدرواستاتیکی بالای خط تراز: ρ₁·h₁ = ρ₂·h₂ (با ρ₁ = ۱ g/cm³ و h₁ = {fmt(manometerHLeft)}cm)
                      </div>
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="whitespace-nowrap">چگالی مایع دوم (ρ₂ = {fmt(manometerRhoRight)}):</span>
                        <input
                          type="range"
                          min={0.8}
                          max={4.0}
                          step={0.2}
                          value={manometerRhoRight}
                          onChange={(e) => setManometerRhoRight(Number(e.target.value))}
                          aria-label="چگالی مایع دوم در لوله U شکل"
                          className="w-full accent-sky-600"
                        />
                      </div>
                    </div>

                    {/* Thermodynamics P-V Diagram & Gas Laws */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100">
                          نمودار P-V ترمودینامیک و فرآیندهای گاز کامل
                        </h4>
                        <select
                          value={thermoProcess}
                          onChange={(e) =>
                            setThermoProcess(
                              e.target.value as
                                | 'isothermal'
                                | 'adiabatic'
                                | 'isobaric'
                                | 'isochoric'
                            )
                          }
                          className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px]"
                        >
                          <option value="isothermal">هم‌دما (ΔU = 0)</option>
                          <option value="adiabatic">بی‌دررو (Q = 0)</option>
                          <option value="isobaric">هم‌فشار (W = P·ΔV)</option>
                          <option value="isochoric">هم‌حجم (W = 0)</option>
                        </select>
                      </div>
                      <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                        {thermoProcess === 'isothermal' &&
                          'فرآیند هم‌دما (P·V = cte): دمای گاز ثابت مانده و تمام گرمای دریافتی به کار تبدیل می‌شود.'}
                        {thermoProcess === 'adiabatic' &&
                          'فرآیند بی‌دررو (P·V^γ = cte): مبادله گرما با محیط صفر است و شیب منحنی تندتر از هم‌دماست.'}
                        {thermoProcess === 'isobaric' &&
                          'فرآیند هم‌فشار: خط افقی در نمودار P-V؛ کار برابر سطح زیر نمودار (PΔV) است.'}
                        {thermoProcess === 'isochoric' &&
                          'فرآیند هم‌حجم: خط عمودی در نمودار P-V؛ کار انجام‌شده صفر است (Q = ΔU).'}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4.4: Optics Bench, Snell's Law & Bohr Atomic Energy Levels */}
                {physicsSection === 'optics-bohr' && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100">
                          شکست نور اسنل و زاویه حد (n₁·sinθ₁ = n₂·sinθ₂)
                        </h4>
                        <span className="font-mono text-sky-600 dark:text-sky-400">
                          θ₁ = {fmt(snellAngle1)}°
                        </span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={75}
                        value={snellAngle1}
                        onChange={(e) => setSnellAngle1(Number(e.target.value))}
                        aria-label="زاویه تابش در قانون اسنل"
                        className="w-full accent-sky-600"
                      />
                      <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] flex justify-between">
                        <span>وضعیت پرتو در مرز محیط (n₁=۱.۵ به n₂=۱):</span>
                        <span
                          className={`font-bold ${
                            snellMetrics.isTotalInternalReflection
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {snellMetrics.isTotalInternalReflection
                            ? `بازتاب کلی داخلی! (θc = ${fmt(snellMetrics.criticalAngleDeg!)}°)`
                            : `شکست نور (θ₂ = ${fmt(snellMetrics.refractedAngleDeg!)}°)`}
                        </span>
                      </div>
                    </div>

                    {/* Bohr Atomic Levels */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        ترازهای انرژی اتمی بور و جهش الکترون
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <label className="block">
                          <span className="text-[11px] text-slate-500">تراز اولیه (nᵢ):</span>
                          <select
                            value={bohrNi}
                            onChange={(e) => setBohrNi(Number(e.target.value))}
                            className="w-full mt-0.5 px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                          >
                            {[1, 2, 3, 4, 5].map((n) => (
                              <option key={n} value={n}>
                                n = {n}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <span className="text-[11px] text-slate-500">تراز نهایی (n_f):</span>
                          <select
                            value={bohrNf}
                            onChange={(e) => setBohrNf(Number(e.target.value))}
                            className="w-full mt-0.5 px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                          >
                            {[1, 2, 3, 4, 5].map((n) => (
                              <option key={n} value={n}>
                                n = {n}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">نوع گذار کوانتومی:</span>
                          <span className="font-bold text-sky-600 dark:text-sky-400">
                            {bohrMetrics.mode === 'emission'
                              ? 'تابش فوتون (نشر خطی)'
                              : bohrMetrics.mode === 'absorption'
                              ? 'جذب فوتون'
                              : 'بدون جهش'}
                          </span>
                        </div>
                        <div className="flex justify-between font-mono">
                          <span>ΔE = {fmt(bohrMetrics.deltaEnergyEv)} eV</span>
                          <span>λ ≈ {fmt(bohrMetrics.wavelengthNm)} nm</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ================= MODULE 5: COMPREHENSIVE CHEMISTRY LAB (100% COVERAGE) ================= */}
        {activeTab === 'chemistry' && (
          <>
            {!isModEnabled('mod-5-chemistry') ? (
              <DisabledModuleNotice
                title="ماژول ۵: آزمایشگاه جامع شیمی غیرفعال است"
                description="جدول تناوبی، آرایش الکترونی هوند، لوویس/VSEPR، شیمی آلی و سلول گالوانی در حال حاضر خاموش هستند."
                onEnable={() => onToggleModule('mod-5-chemistry', true)}
              />
            ) : (
              <div className="space-y-3">
                {/* Chemistry 3-Zone Sub-navigation */}
                <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-medium">
                  {[
                    { id: 'periodic-hund', label: 'تناوبی و هوند' },
                    { id: 'vsepr-organic', label: 'VSEPR و شیمی آلی' },
                    { id: 'galvanic-stoich', label: 'گالوانی و تیتراسیون' },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setChemSection(sub.id as typeof chemSection)}
                      className={`py-1.5 px-1 rounded-md transition-colors truncate ${
                        chemSection === sub.id
                          ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 font-bold shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>

                {/* 5.1: Periodic Table & Hund's Rule */}
                {chemSection === 'periodic-hund' && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      جدول تناوبی و آرایش الکترونی اوربیتالی (قاعده هوند)
                    </h4>

                    <div className="grid grid-cols-6 gap-1.5">
                      {SAMPLE_ELEMENTS.map((el) => (
                        <button
                          key={el.z}
                          type="button"
                          onClick={() => setSelectedZ(el.z)}
                          className={`p-1.5 rounded-lg border text-center transition-all ${
                            selectedZ === el.z
                              ? 'bg-sky-600 text-white border-sky-500 font-bold'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="text-[10px] block opacity-75 font-mono">{fmt(el.z)}</span>
                          <span className="text-xs font-mono font-bold">{el.symbol}</span>
                        </button>
                      ))}
                    </div>

                    <div className="text-xs">
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-600 dark:text-slate-400">
                          انتخاب عدد اتمی (Z): {currentElement.name}
                        </span>
                        <span className="font-mono font-bold tabular-nums">Z = {fmt(selectedZ)}</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={26}
                        value={selectedZ}
                        onChange={(e) => setSelectedZ(Number(e.target.value))}
                        aria-label="عدد اتمی عنصر"
                        className="w-full accent-sky-600"
                      />
                    </div>

                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="text-[11px] text-slate-400 mb-1">آرایش الکترونی زیرلایه‌ای:</div>
                      <div
                        dir="ltr"
                        className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400 text-left"
                      >
                        {electronConfig.notation}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        آرایش مربعی (اوربیتالی) طبق قاعده هوند:
                      </div>
                      <div
                        dir="ltr"
                        className="flex flex-wrap gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                      >
                        {electronConfig.orbitals.map((orb, idx) => (
                          <div key={idx} className="flex flex-col items-center">
                            <div className="w-7 h-7 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                              {orb.electrons === 1 ? '↑' : orb.electrons === 2 ? '↑↓' : ''}
                            </div>
                            <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                              {orb.subshell}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onStampToBoard(
                          `کارت عنصر ${currentElement.name} (${currentElement.symbol} - Z=${fmt(selectedZ)})`,
                          `آرایش الکترونی: ${electronConfig.notation} | الکترونگاتیوی پاولینگ: ${fmt(currentElement.electronegativity)}`,
                          '#7c3aed'
                        )
                      }
                      className="w-full py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500 transition-colors"
                    >
                      قرار دادن کارت عنصر و اوربیتال روی تخته
                    </button>
                  </div>
                )}

                {/* 5.2: Lewis, 3D VSEPR & Organic Chemistry IUPAC Numbering */}
                {chemSection === 'vsepr-organic' && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        ساختار لوویس و هندسه فضایی مولکول (VSEPR)
                      </h4>
                      <div className="grid grid-cols-5 gap-1">
                        {(['CO2', 'BF3', 'CH4', 'NH3', 'H2O'] as VseprMoleculeId[]).map((id) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setVseprId(id)}
                            className={`py-1 rounded text-xs font-mono font-bold border ${
                              vseprId === id
                                ? 'bg-sky-600 text-white border-sky-500'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            {VSEPR_MOLECULES[id].formula}
                          </button>
                        ))}
                      </div>
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">شکل فضایی VSEPR:</span>
                          <span className="font-bold text-sky-600 dark:text-sky-400">
                            {vseprSpec.geometryFa}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">زاویه پیوندی استاندارد:</span>
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                            {fmt(vseprSpec.bondAngleDeg)}°
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">جفت‌الکترون ناپیوندی اتم مرکزی:</span>
                          <span className="font-mono font-bold">
                            {fmt(vseprSpec.lonePairsOnCenter)} جفت (هیبرید {vseprSpec.hybridization})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Organic Chemistry Skeletal Chain & IUPAC Carbon Numbering */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          کیت شیمی آلی و شماره‌گذاری آیوپاک (IUPAC)
                        </h4>
                        <button
                          type="button"
                          onClick={() => setNumberedCarbons((n) => !n)}
                          className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold"
                        >
                          {numberedCarbons ? 'مخفی کردن شماره‌ها' : 'شماره‌گذاری کربن‌ها'}
                        </button>
                      </div>

                      <svg viewBox="0 0 240 70" className="w-full h-16 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        {(() => {
                          const pts: Array<{ x: number; y: number }> = [];
                          for (let i = 0; i < organicChainLen; i++) {
                            pts.push({
                              x: 30 + i * 32,
                              y: i % 2 === 0 ? 46 : 24,
                            });
                          }
                          return (
                            <>
                              <polyline
                                fill="none"
                                stroke="#0284c7"
                                strokeWidth="2.5"
                                points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
                              />
                              {pts.map((p, idx) => (
                                <g key={idx}>
                                  <circle cx={p.x} cy={p.y} r="4.5" className="fill-sky-600" />
                                  {numberedCarbons && (
                                    <text
                                      x={p.x}
                                      y={idx % 2 === 0 ? p.y + 15 : p.y - 8}
                                      textAnchor="middle"
                                      className="fill-rose-600 dark:fill-rose-400 text-[10px] font-mono font-bold"
                                    >
                                      C{fmt(idx + 1)}
                                    </text>
                                  )}
                                </g>
                              ))}
                            </>
                          );
                        })()}
                      </svg>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500 whitespace-nowrap">طول زنجیره: {fmt(organicChainLen)} کربن</span>
                        <input
                          type="range"
                          min={3}
                          max={7}
                          value={organicChainLen}
                          onChange={(e) => setOrganicChainLen(Number(e.target.value))}
                          aria-label="طول زنجیره کربنی"
                          className="w-full accent-sky-600"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          onStampToBoard(
                            `مولکول ${vseprSpec.nameFa} (${vseprSpec.formula}) و زنجیره ${fmt(organicChainLen)} کربنه`,
                            `زاویه پیوندی: ${fmt(vseprSpec.bondAngleDeg)}° | گروه عاملی: ${organicGroup}`,
                            '#0284c7'
                          )
                        }
                        className="w-full py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500"
                      >
                        ارسال ساختار VSEPR و زنجیره آلی به تخته
                      </button>
                    </div>
                  </div>
                )}

                {/* 5.3: Galvanic Cell, Stoichiometry Chain & Titration pH */}
                {chemSection === 'galvanic-stoich' && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          کیت سلول گالوانی (آند، کاتد، پل نمکی و EMF)
                        </h4>
                        <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          ΔE° = +{fmt(galvanicMetrics.cellEmfV)} V
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <label className="block">
                          <span className="text-[10px] text-slate-500">تیغه اول:</span>
                          <select
                            value={galvanicAnode}
                            onChange={(e) => setGalvanicAnode(e.target.value)}
                            className="w-full mt-0.5 px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                          >
                            <option value="Mg">منیزیم (Mg: -2.37V)</option>
                            <option value="Zn">روی (Zn: -0.76V)</option>
                            <option value="Fe">آهن (Fe: -0.44V)</option>
                          </select>
                        </label>
                        <label className="block">
                          <span className="text-[10px] text-slate-500">تیغه دوم:</span>
                          <select
                            value={galvanicCathode}
                            onChange={(e) => setGalvanicCathode(e.target.value)}
                            className="w-full mt-0.5 px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                          >
                            <option value="Cu">مس (Cu: +0.34V)</option>
                            <option value="Ag">نقره (Ag: +0.80V)</option>
                          </select>
                        </label>
                      </div>

                      <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-center" dir="ltr">
                        {galvanicMetrics.reactionText}
                      </div>
                    </div>

                    {/* Stoichiometry Chain & Titration pH */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100">
                          کسر تبدیل استوکیومتری و تیتراسیون (pH = {fmt(solutionPh)})
                        </h4>
                        <button
                          type="button"
                          onClick={() => setStoichCancelUnits((u) => !u)}
                          className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold"
                        >
                          {stoichCancelUnits ? 'حذف خط ساده‌سازی' : 'خط زدن واحدهای مشابه'}
                        </button>
                      </div>

                      <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono flex items-center justify-center gap-1.5" dir="ltr">
                        <span>36g H₂O ×</span>
                        <span className={stoichCancelUnits ? 'line-through text-rose-500' : ''}>
                          (1 mol / 18g)
                        </span>
                        <span>= 2.0 mol H₂O</span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="whitespace-nowrap">تنظیم pH تیتراسیون:</span>
                        <input
                          type="range"
                          min={1}
                          max={14}
                          value={solutionPh}
                          onChange={(e) => setSolutionPh(Number(e.target.value))}
                          aria-label="تنظیم pH محلول"
                          className="w-full accent-sky-600"
                        />
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] whitespace-nowrap ${
                            solutionPh < 7
                              ? 'bg-rose-500/15 text-rose-600'
                              : solutionPh === 7
                              ? 'bg-emerald-500/15 text-emerald-600'
                              : 'bg-sky-500/15 text-sky-600'
                          }`}
                        >
                          {solutionPh < 7 ? 'اسیدی' : solutionPh === 7 ? 'خنثی' : 'بازی'}
                        </span>
                      </div>
                    </div>

                    {/* Interactive Chemical Equation Balancer (موازنه‌گر تعاملی معادلات شیمیایی) */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100">
                          موازنه‌گر تعاملی معادله شیمیایی (فرایند هابر)
                        </h4>
                        <span
                          className={`text-[10px] font-bold ${
                            chemCoeffN2 * 2 === chemCoeffNH3 &&
                            chemCoeffH2 * 2 === chemCoeffNH3 * 3
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {chemCoeffN2 * 2 === chemCoeffNH3 &&
                          chemCoeffH2 * 2 === chemCoeffNH3 * 3
                            ? '✓ معادله کاملاً موازنه است'
                            : '× ناموازنه (ضرایب را تنظیم کنید)'}
                        </span>
                      </div>
                      <div
                        dir="ltr"
                        className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 font-mono text-xs"
                      >
                        <input
                          type="number"
                          min={1}
                          max={6}
                          value={chemCoeffN2}
                          onChange={(e) => setChemCoeffN2(Math.max(1, Number(e.target.value)))}
                          className="w-10 text-center rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        />
                        <span>N₂ +</span>
                        <input
                          type="number"
                          min={1}
                          max={6}
                          value={chemCoeffH2}
                          onChange={(e) => setChemCoeffH2(Math.max(1, Number(e.target.value)))}
                          className="w-10 text-center rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        />
                        <span>H₂ ⟶</span>
                        <input
                          type="number"
                          min={1}
                          max={6}
                          value={chemCoeffNH3}
                          onChange={(e) => setChemCoeffNH3(Math.max(1, Number(e.target.value)))}
                          className="w-10 text-center rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        />
                        <span>NH₃</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ================= MODULE 6: BIO, LITERATURE, ARABIC, ENGLISH & ACCOUNTING ================= */}
        {activeTab === 'humanities' && (
          <>
            {!isModEnabled('mod-6-bio-lit') ? (
              <DisabledModuleNotice
                title="ماژول ۶: زیست، ادبیات، عربی و دروس عمومی غیرفعال است"
                description="اطلس لایه‌ای زیست، مربع پانت، تقطیع عروضی، حرکت‌گذاری عربی و حساب T در حال حاضر خاموش هستند."
                onEnable={() => onToggleModule('mod-6-bio-lit', true)}
              />
            ) : (
              <div className="space-y-3">
                {/* Humanities 3-Zone Sub-navigation */}
                <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-medium">
                  {[
                    { id: 'bio-genetics', label: 'زیست و ژنتیک' },
                    { id: 'lit-arabic', label: 'ادبیات و عربی' },
                    { id: 'eng-accounting', label: 'زبان و حسابداری' },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setHumanitiesSection(sub.id as typeof humanitiesSection)}
                      className={`py-1.5 px-1 rounded-md transition-colors truncate ${
                        humanitiesSection === sub.id
                          ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 font-bold shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>

                {/* 6.1: Biology Layered Atlas & Punnett Square Genetics */}
                {humanitiesSection === 'bio-genetics' && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          اطلس لایه‌ای زیست (آناتومی قلب)
                        </h4>
                        <button
                          type="button"
                          onClick={() => setShowAnatomyLabels((v) => !v)}
                          className="text-xs text-sky-600 dark:text-sky-400 font-medium whitespace-nowrap"
                        >
                          {showAnatomyLabels ? 'مخفی کردن برچسب‌ها' : 'نمایش نام بخش‌ها'}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-xs">
                        {['بطن چپ قلب', 'دریچه میترال (دولختی)', 'سرخرگ آئورت', 'گره سینوسی-دهلیزی'].map(
                          (part, idx) => (
                            <div
                              key={idx}
                              className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                            >
                              <span className="text-slate-400 tabular-nums">{fmt(idx + 1)}.</span>
                              <span
                                className={`font-medium transition-all ${
                                  showAnatomyLabels
                                    ? 'text-slate-800 dark:text-slate-200'
                                    : 'blur-xs select-none text-slate-400'
                                }`}
                              >
                                {part}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Punnett Square Builder */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        مربع پانت هوشمند (Punnett Square ژنتیک)
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <label className="block">
                          <span className="text-[10px] text-slate-500">ژنوتیپ والد ۱:</span>
                          <select
                            value={parent1Geno}
                            onChange={(e) => setParent1Geno(e.target.value as 'AA' | 'Aa' | 'aa')}
                            className="w-full mt-0.5 px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium"
                          >
                            <option value="AA">AA (خالص غالب)</option>
                            <option value="Aa">Aa (ناخالص)</option>
                            <option value="aa">aa (مغلوب)</option>
                          </select>
                        </label>
                        <label className="block">
                          <span className="text-[10px] text-slate-500">ژنوتیپ والد ۲:</span>
                          <select
                            value={parent2Geno}
                            onChange={(e) => setParent2Geno(e.target.value as 'AA' | 'Aa' | 'aa')}
                            className="w-full mt-0.5 px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium"
                          >
                            <option value="AA">AA (خالص غالب)</option>
                            <option value="Aa">Aa (ناخالص)</option>
                            <option value="aa">aa (مغلوب)</option>
                          </select>
                        </label>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 text-center font-mono text-xs">
                        {punnettMetrics.grid.flat().map((cell, idx) => (
                          <div
                            key={idx}
                            className={`p-2 rounded border font-bold ${
                              cell.includes('A')
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                                : 'bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-300'
                            }`}
                          >
                            {cell}
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400">
                        <span>فنوتیپ غالب: {fmt(punnettMetrics.dominantPhenotypePct)}٪</span>
                        <span>فنوتیپ مغلوب: {fmt(punnettMetrics.recessivePhenotypePct)}٪</span>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          onStampToBoard(
                            `مربع پانت ژنتیک (${parent1Geno} × ${parent2Geno})`,
                            `نسبت ژنوتیپی: ${punnettMetrics.genotypeRatioText} | فنوتیپ غالب: ${fmt(punnettMetrics.dominantPhenotypePct)}٪`,
                            '#059669'
                          )
                        }
                        className="w-full py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500"
                      >
                        ارسال مربع پانت به تخته سفید
                      </button>
                    </div>
                  </div>
                )}

                {/* 6.2: Persian Literature Prosody & Arabic Colored Harakat */}
                {humanitiesSection === 'lit-arabic' && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        کیبورد تقطیع عروضی و وزن شعر فارسی
                      </h4>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setProsodySequence((s) => [...s, '∪'])}
                          className="flex-1 py-1.5 text-xs font-bold rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-sky-500"
                        >
                          ∪ (هجای کوتاه)
                        </button>
                        <button
                          type="button"
                          onClick={() => setProsodySequence((s) => [...s, '−'])}
                          className="flex-1 py-1.5 text-xs font-bold rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-sky-500"
                        >
                          − (هجای بلند)
                        </button>
                        <button
                          type="button"
                          onClick={() => setProsodySequence((s) => [...s, '−∪'])}
                          className="flex-1 py-1.5 text-xs font-bold rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-sky-500"
                        >
                          −∪ (کشیده)
                        </button>
                        <button
                          type="button"
                          aria-label="پاک کردن تقطیع"
                          onClick={() => setProsodySequence([])}
                          className="p-1.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center font-mono text-sm tracking-widest text-sky-600 dark:text-sky-400 min-h-9">
                        {prosodySequence.length > 0
                          ? prosodySequence.join(' ')
                          : 'علامت‌های هجا را وارد کنید'}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          حرکت‌گذاری درشت و رنگی عربی (اعراب)
                        </h4>
                        <button
                          type="button"
                          onClick={() => setArabicWordIndex((i) => (i + 1) % 3)}
                          className="text-[11px] text-sky-600 dark:text-sky-400 flex items-center gap-1"
                        >
                          <ArrowLeftRight className="w-3 h-3" /> نمونه بعدی
                        </button>
                      </div>
                      <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                        {arabicWordIndex === 0 && (
                          <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                            يَنْصُرُ{' '}
                            <span className="text-emerald-600 dark:text-emerald-400">الْمُؤْمِنُ</span>{' '}
                            (فاعل مرفوع به ضمه)
                          </div>
                        )}
                        {arabicWordIndex === 1 && (
                          <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                            إِنَّ <span className="text-rose-600 dark:text-rose-400">اللَّهَ</span> غَفُورٌ
                            (اسم إنَّ منصوب به فتحه)
                          </div>
                        )}
                        {arabicWordIndex === 2 && (
                          <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                            فِي <span className="text-sky-600 dark:text-sky-400">الْمَدْرَسَةِ</span>{' '}
                            (مجرور به کسره)
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Arabic 14-Form Verb Conjugation Table (جدول ۱۴ صیغه فعل عربی) */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          جدول صرف ۱۴ صیغه فعل عربی (ریشه: ذ-ه-ب)
                        </h4>
                        <div className="flex gap-1 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setArabicTense('madi')}
                            className={`px-2 py-0.5 rounded ${
                              arabicTense === 'madi'
                                ? 'bg-sky-600 text-white font-bold'
                                : 'bg-white dark:bg-slate-900'
                            }`}
                          >
                            ماضی
                          </button>
                          <button
                            type="button"
                            onClick={() => setArabicTense('mudari')}
                            className={`px-2 py-0.5 rounded ${
                              arabicTense === 'mudari'
                                ? 'bg-sky-600 text-white font-bold'
                                : 'bg-white dark:bg-slate-900'
                            }`}
                          >
                            مضارع
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-[11px] text-center">
                        {(arabicTense === 'madi'
                          ? ['ذَهَبَ (مفرد مذکر غایب)', 'ذَهَبَا (مثنی مذکر)', 'ذَهَبُوا (جمع مذکر)', 'ذَهَبَتْ (مفرد مؤنث)', 'ذَهَبْتَ (مخاطب)', 'ذَهَبْتُ (متکلم وحده)']
                          : ['يَذْهَبُ (مفرد مذکر غایب)', 'يَذْهَبَانِ (مثنی مذکر)', 'يَذْهَبُونَ (جمع مذکر)', 'تَذْهَبُ (مفرد مؤنث)', 'تَذْهَبِينَ (مخاطبه)', 'أَذْهَبُ (متکلم وحده)']
                        ).map((conj, idx) => (
                          <div
                            key={idx}
                            className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold"
                          >
                            {conj}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 6.3: English IPA Flashcard, Accounting T-Account, Iran Map & Economics */}
                {humanitiesSection === 'eng-accounting' && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          فلش‌کارت دوطرفه زبان انگلیسی و فونتیک (IPA)
                        </h4>
                        <button
                          type="button"
                          onClick={() => setFlashcardFlipped((f) => !f)}
                          className="text-[11px] text-sky-600 dark:text-sky-400 flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" /> برگرداندن کارت
                        </button>
                      </div>
                      <div
                        onClick={() => setFlashcardFlipped((f) => !f)}
                        className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center cursor-pointer select-none space-y-1"
                      >
                        {!flashcardFlipped ? (
                          <>
                            <div className="text-sm font-bold text-slate-900 dark:text-slate-100" dir="ltr">
                              Ubiquitous · /juːˈbɪk.wɪ.təs/
                            </div>
                            <div className="text-[11px] text-slate-400">
                              روی کارت کلیک کنید تا معنی فارسی نمایش داده شود
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                              فراگیر، حاضر در همه جا (Adjective)
                            </div>
                            <div className="text-[11px] text-slate-400" dir="ltr">
                              Example: Smartphones have become ubiquitous in daily life.
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Accounting T-Account */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        جدول آماده «حساب T» حسابداری (صندوق / بانک)
                      </h4>
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                        <div className="text-center font-bold border-b-2 border-slate-800 dark:border-slate-200 pb-1">
                          حساب وجه نقد و بانک
                        </div>
                        <div className="grid grid-cols-2 divide-x divide-x-reverse divide-slate-800 dark:divide-slate-200 pt-1.5 text-center font-mono">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-sans">بدهکار (ورودی)</span>
                            <span className="font-bold text-emerald-600">{fmt(debitTotal)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-sans">بستانکار (خروجی)</span>
                            <span className="font-bold text-rose-600">{fmt(creditTotal)}</span>
                          </div>
                        </div>
                        <div className="mt-2 pt-1.5 border-t border-slate-200 dark:border-slate-800 text-center font-bold text-sky-600 dark:text-sky-400">
                          مانده بدهکار: {fmt(debitTotal - creditTotal)} میلیون ریال
                        </div>
                      </div>
                    </div>

                    {/* Silent Province Map of Iran & Economics Supply/Demand Equilibrium */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          نقشه لال استان‌های ایران و تعادل عرضه/تقاضا
                        </h4>
                        <button
                          type="button"
                          onClick={() => setShowIranMapLabels((v) => !v)}
                          className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold"
                        >
                          {showIranMapLabels ? 'حالت نقشه لال (کوییز)' : 'نمایش نام استان‌ها'}
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-[11px] text-center">
                        {['خراسان رضوی', 'فارس', 'اصفهان', 'آذربایجان شرقی', 'خوزستان', 'مازندران'].map(
                          (prov, idx) => (
                            <div
                              key={idx}
                              className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                            >
                              <span className="text-slate-400 tabular-nums ml-1">{fmt(idx + 1)}.</span>
                              <span className={showIranMapLabels ? 'font-semibold' : 'blur-xs select-none'}>
                                {prov}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                      {(() => {
                        const eq = calculateSupplyDemandEquilibrium(100, 20, 2, 2);
                        const atPrice = eq.surplusOrShortageAtPrice(econTestPrice);
                        return (
                          <div className="pt-1 border-t border-slate-200 dark:border-slate-800 space-y-1 text-[11px]">
                            <div className="flex justify-between">
                              <span className="text-slate-500">
                                قیمت آزمایشی بازار (P = {fmt(econTestPrice)}):
                              </span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {atPrice.status === 'equilibrium'
                                  ? `نقطه تعادل بازار (Q* = ${fmt(eq.equilibriumQuantity)})`
                                  : atPrice.status === 'surplus'
                                  ? `مازاد عرضه (Qs=${fmt(atPrice.qs)} > Qd=${fmt(atPrice.qd)})`
                                  : `کمبود عرضه (Qd=${fmt(atPrice.qd)} > Qs=${fmt(atPrice.qs)})`}
                              </span>
                            </div>
                            <input
                              type="range"
                              min={10}
                              max={35}
                              value={econTestPrice}
                              onChange={(e) => setEconTestPrice(Number(e.target.value))}
                              aria-label="قیمت آزمایشی عرضه و تقاضا"
                              className="w-full accent-sky-600"
                            />
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ================= MODULE 2: KONKUR TEST STUDIO & DOCUMENT SCANNER CLEANER ================= */}
        {activeTab === 'konkur' && (
          <>
            {!isModEnabled('mod-2-pdf-test') ? (
              <DisabledModuleNotice
                title="ماژول ۲: استودیوی حل تست و اسکنر PDF غیرفعال است"
                description="برای استفاده از رد گزینه، پرده مخفی‌کننده پاسخ، تمیزکننده اسکن موبایل و تایمر کنکور، این ماژول را فعال کنید."
                onEnable={() => onToggleModule('mod-2-pdf-test', true)}
              />
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                      تایمر معکوس حل تست کنکور
                    </span>
                    <span className="text-[11px] text-slate-500">زمان استاندارد هر تست: ۷۵ ثانیه</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                      {fmt(Math.floor(examTimerSec / 60))}:
                      {fmt(String(examTimerSec % 60).padStart(2, '0'))}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTimerRunning((r) => !r)}
                      aria-label={timerRunning ? 'توقف تایمر تست' : 'شروع تایمر تست'}
                      className="p-1.5 rounded-lg bg-sky-600 text-white hover:bg-sky-500"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTimerRunning(false);
                        setExamTimerSec(75);
                      }}
                      aria-label="ریست تایمر تست"
                      className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                      <span>تمیزکننده اسکن موبایل (Document Cleaner)</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setScannerCleaned((c) => !c)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        scannerCleaned
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {scannerCleaned ? 'پس‌زمینه سفید و تمیز' : 'عکس خام سایه‌دار موبایل'}
                    </button>
                  </div>

                  <div
                    style={{
                      backgroundColor:
                        scannerCleaned &&
                        computeCleanedDocumentPixel(135, 145, scannerSensitivity) === 255
                          ? '#ffffff'
                          : '#94a3b8',
                    }}
                    className="p-3 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors text-xs text-slate-900 space-y-1"
                  >
                    <div className="text-[10px] text-slate-500 flex justify-between">
                      <span>برگه امتحانی ارسالی با موبایل</span>
                      <span>کنتراست تطبیقی: {fmt(Math.round(scannerSensitivity * 100))}٪</span>
                    </div>
                    <p className="font-bold">
                      سوال ۴: معادله درجه دوم x² − ۵x + ۶ = ۰ را به روش تجزیه حل کنید.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-slate-500 whitespace-nowrap">آستانه حذف سایه:</span>
                    <input
                      type="range"
                      min={0.7}
                      max={0.95}
                      step={0.02}
                      value={scannerSensitivity}
                      onChange={(e) => setScannerSensitivity(Number(e.target.value))}
                      aria-label="آستانه حذف سایه اسکن"
                      className="w-full accent-sky-600"
                    />
                  </div>

                  {/* Real File Input to Upload Exam Image from User Computer */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <label className="flex-1 py-1.5 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 cursor-pointer hover:border-sky-500 text-center truncate">
                      <span>
                        {uploadedScanName
                          ? `فایل بارگذاری شد: ${uploadedScanName}`
                          : 'بارگذاری عکس سوال یا اسکن از کامپیوتر...'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setUploadedScanName(file.name);
                            setScannerCleaned(true);
                          }
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        onStampToBoard(
                          `برش سوال اسکن‌شده (${uploadedScanName ?? 'سوال ۴ معادله درجه دوم'})`,
                          `پس‌زمینه با فیلتر تطبیقی (${fmt(Math.round(scannerSensitivity * 100))}٪) سفیدسازی شد`,
                          '#0284c7'
                        )
                      }
                      className="py-1.5 px-3 rounded-lg bg-sky-600 text-white hover:bg-sky-500 text-[11px] font-bold whitespace-nowrap"
                    >
                      ارسال به تخته
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    ابزار رد گزینه و انتخاب گزینه صحیح کنکور
                  </h4>
                  <div className="space-y-1.5">
                    {[
                      { num: 1, text: '۱) شتاب حرکت همواره ثابت و برابر g است' },
                      { num: 2, text: '۲) نیروی اصطکاک در خلاف جهت بردار سرعت تغییر نمی‌کند' },
                      { num: 3, text: '۳) برآیند نیروهای وارد بر جسم برابر m·a در راستای سطح است' },
                      { num: 4, text: '۴) اندازه نیروی عمودی سطح برابر وزن جسم (mg) است' },
                    ].map((opt) => {
                      const st = optionStates[opt.num] ?? 'none';
                      return (
                        <div
                          key={opt.num}
                          className={`p-2 rounded-lg border flex items-center justify-between gap-2 text-xs transition-all ${
                            st === 'eliminated'
                              ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300/50 dark:border-rose-900/50 opacity-50 line-through'
                              : st === 'correct'
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 font-bold text-emerald-900 dark:text-emerald-200'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <span className="truncate">{opt.text}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              aria-label={`رد گزینه ${opt.num}`}
                              onClick={() =>
                                setOptionStates((prev) => ({
                                  ...prev,
                                  [opt.num]: prev[opt.num] === 'eliminated' ? 'none' : 'eliminated',
                                }))
                              }
                              className="w-6 h-6 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center hover:bg-rose-500 hover:text-white"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label={`تایید گزینه ${opt.num}`}
                              onClick={() =>
                                setOptionStates((prev) => ({
                                  ...prev,
                                  [opt.num]: prev[opt.num] === 'correct' ? 'none' : 'correct',
                                }))
                              }
                              className="w-6 h-6 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-500 hover:text-white"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">
                      پرده مخفی‌کننده پاسخ (Screen Shade)
                    </h4>
                    <span className="font-mono text-slate-500 tabular-nums">
                      باز شدن پرده: {fmt(shadeRevealPercent)}٪
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={shadeRevealPercent}
                    onChange={(e) => setShadeRevealPercent(Number(e.target.value))}
                    aria-label="میزان باز شدن پرده پاسخ تشریحی"
                    className="w-full accent-sky-600"
                  />
                  <div className="relative rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 text-xs space-y-1.5 overflow-hidden">
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong>گام اول:</strong> تجزیه بردار وزن به دو مؤلفه موازی و عمود بر سطح شیب‌دار.
                    </p>
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong>گام دوم:</strong> نوشتن قانون دوم نیوتن: ∑F = mg·sinθ − f_k = m·a
                    </p>
                    <p className="text-emerald-600 dark:text-emerald-400 font-bold">
                      <strong>نتیجه نهایی:</strong> گزینه (۳) صحیح است.
                    </p>
                    {shadeRevealPercent < 100 && (
                      <div
                        style={{ height: `${100 - shadeRevealPercent}%` }}
                        className="absolute bottom-0 inset-x-0 bg-slate-800/95 text-white flex items-center justify-center text-[11px] font-medium transition-all"
                      >
                        پرده مخفی‌کننده پاسخ تشریحی (اسلایدر را بکشید)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

interface DisabledModuleNoticeProps {
  title: string;
  description: string;
  onEnable: () => void;
}

const DisabledModuleNotice: React.FC<DisabledModuleNoticeProps> = ({
  title,
  description,
  onEnable,
}) => (
  <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center space-y-3 my-4">
    <div className="w-10 h-10 rounded-full bg-slate-200/70 dark:bg-slate-800 mx-auto flex items-center justify-center text-slate-500">
      <Power className="w-5 h-5" />
    </div>
    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{title}</h4>
    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
    <button
      type="button"
      onClick={onEnable}
      className="px-4 py-2 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500 transition-colors"
    >
      روشن کردن فوری این ماژول
    </button>
  </div>
);
