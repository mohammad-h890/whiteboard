import React, { useState } from 'react';
import {
  Calculator,
  Atom,
  FlaskConical,
  BookOpen,
  Power,
  RotateCcw,
  Eye,
  EyeOff,
  ArrowLeftRight,
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
import type { StampedBoardWidget } from './SmartWhiteboardCanvas';

export type LabTabId = 'math' | 'physics' | 'chemistry' | 'humanities' | 'konkur';

interface InteractiveLabsPanelProps {
  modules: AppModule[];
  activeTab: LabTabId;
  onChangeTab: (tab: LabTabId) => void;
  onToggleModule: (moduleId: ModuleId, forceState?: boolean) => void;
  usePersianNumerals: boolean;
  onStampToBoard: (
    title: string,
    summary: string,
    badgeColor: string,
    extraProps?: Partial<StampedBoardWidget>
  ) => void;
  stampedWidgets?: StampedBoardWidget[];
  onUpdateStampedWidgets?: React.Dispatch<React.SetStateAction<StampedBoardWidget[]>>;
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
  const [stampNotice, setStampNotice] = useState<string | null>(null);

  const handleStamp = (
    title: string,
    summary: string,
    badgeColor: string,
    extraProps?: Partial<StampedBoardWidget>
  ) => {
    onStampToBoard(title, summary, badgeColor, extraProps);
    setStampNotice(`«${title}» روی تخته سفید قرار گرفت`);
    window.setTimeout(() => setStampNotice(null), 2600);
  };

  // Module 3: Math states
  const [divDividend, setDivDividend] = useState<number>(147);
  const [divDivisor, setDivDivisor] = useState<number>(12);
  const [formulaNumer, setFormulaNumer] = useState<string>('x² + ۲x');
  const [formulaDenom, setFormulaDenom] = useState<string>('x − ۱');
  const [radicand, setRadicand] = useState<string>('a² + b²');
  const [fractionTotal, setFractionTotal] = useState<number>(5);
  const [coloredSlices, setColoredSlices] = useState<boolean[]>([true, true, true, false, false]);
  const [fractionShape, setFractionShape] = useState<'pizza' | 'bar'>('pizza');
  const [fractionFillColor, setFractionFillColor] = useState<string>('#0ea5e9');
  const [fractionDividerColor, setFractionDividerColor] = useState<string>('#f59e0b');
  const [showAutoFractionLabel, setShowAutoFractionLabel] = useState<boolean>(true);
  const [thousandsCount, setThousandsCount] = useState<number>(1);
  const [hundredsCount, setHundredsCount] = useState<number>(2);
  const [tensCount, setTensCount] = useState<number>(3);
  const [onesCount, setOnesCount] = useState<number>(5);
  // Upgraded Number Line (محور اعداد کسری با طول و تقسیم‌بندی دلخواه و چند فلش منحنی)
  const [axisMin, setAxisMin] = useState<number>(0);
  const [axisMax, setAxisMax] = useState<number>(10);
  const [axisSubdivisions, setAxisSubdivisions] = useState<number>(4);
  const [jumpStart, setJumpStart] = useState<number>(1);
  const [jumpStep, setJumpStep] = useState<number>(3);
  const [axisJumps, setAxisJumps] = useState<Array<{ from: number; to: number; color?: string }>>([
    { from: 0, to: 2.5, color: '#f59e0b' },
    { from: 2.5, to: 6, color: '#10b981' },
  ]);
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
  const [r1Ohm] = useState<number>(4);
  const [r2Ohm] = useState<number>(2);
  const [manometerRhoRight, setManometerRhoRight] = useState<number>(2.0);
  const [manometerHLeft] = useState<number>(24);
  // Optics, Snell's Law & Bohr Atom
  const [snellN1] = useState<number>(1.5);
  const [snellN2] = useState<number>(1.0);
  const [snellAngle1, setSnellAngle1] = useState<number>(35);
  const [bohrNi, setBohrNi] = useState<number>(3);
  const [bohrNf, setBohrNf] = useState<number>(2);

  // Module 5: Chemistry states
  const [selectedZ, setSelectedZ] = useState<number>(8);
  const [vseprId, setVseprId] = useState<VseprMoleculeId>('H2O');
  const [organicChainLen, setOrganicChainLen] = useState<number>(5);
  const [numberedCarbons, setNumberedCarbons] = useState<boolean>(true);
  const [galvanicAnode, setGalvanicAnode] = useState<string>('Zn');
  const [galvanicCathode, setGalvanicCathode] = useState<string>('Cu');
  const [stoichCancelUnits, setStoichCancelUnits] = useState<boolean>(true);
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

  const handleFractionTotalChange = (newTotal: number) => {
    const clamped = Math.max(1, Math.min(36, newTotal));
    setFractionTotal(clamped);
    setColoredSlices((prev) => {
      const next = new Array(clamped).fill(false);
      for (let i = 0; i < Math.min(prev.length, clamped); i++) {
        next[i] = prev[i];
      }
      return next;
    });
  };

  const handleFractionColoredCountChange = (newColored: number) => {
    const clamped = Math.max(0, Math.min(fractionTotal, newColored));
    setColoredSlices(
      Array.from({ length: fractionTotal }, (_, i) => i < clamped)
    );
  };

  const toggleSlice = (idx: number) => {
    setColoredSlices((prev) => prev.map((v, i) => (i === idx ? !v : v)));
  };

  const handleAddOneBlock = () => {
    if (onesCount + 1 >= 10) {
      setOnesCount(0);
      if (tensCount + 1 >= 10) {
        setTensCount(0);
        if (hundredsCount + 1 >= 10) {
          setHundredsCount(0);
          setThousandsCount((th) => Math.min(9, th + 1));
        } else {
          setHundredsCount((h) => h + 1);
        }
      } else {
        setTensCount((t) => t + 1);
      }
    } else {
      setOnesCount((o) => o + 1);
    }
  };

  const handleBreakTenBlock = () => {
    if (tensCount > 0) {
      setTensCount((t) => t - 1);
      setOnesCount((o) => Math.min(20, o + 10));
    }
  };

  const handleBreakHundredBlock = () => {
    if (hundredsCount > 0) {
      setHundredsCount((h) => h - 1);
      setTensCount((t) => Math.min(19, t + 10));
    }
  };

  const handleBreakThousandBlock = () => {
    if (thousandsCount > 0) {
      setThousandsCount((th) => th - 1);
      setHundredsCount((h) => Math.min(19, h + 10));
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
              fill={isColored ? fractionFillColor : 'rgba(148,163,184,0.22)'}
              stroke={fractionDividerColor}
              strokeWidth="2.8"
              className="cursor-pointer transition-opacity hover:opacity-90"
            />
          );
        })}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={fractionDividerColor}
          strokeWidth="3"
          pointerEvents="none"
        />
      </svg>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Main 4 Lab Category Tabs */}
      <div className="grid grid-cols-4 gap-1 p-1.5 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
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

      {stampNotice && (
        <div className="mx-3 mt-2 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-between shadow-sm">
          <span>✓ {stampNotice}</span>
        </div>
      )}

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

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <label className="block">
                          <span className="text-[11px] text-slate-500 block mb-0.5">
                            صورت (تعداد رنگی):
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={fractionTotal}
                            value={coloredCount}
                            onChange={(e) =>
                              handleFractionColoredCountChange(Number(e.target.value))
                            }
                            aria-label="صورت کسر دلخواه"
                            className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-bold text-center"
                          />
                        </label>
                        <label className="block">
                          <span className="text-[11px] text-slate-500 block mb-0.5">
                            مخرج (کل تقسیمات):
                          </span>
                          <input
                            type="number"
                            min={1}
                            max={36}
                            value={fractionTotal}
                            onChange={(e) => handleFractionTotalChange(Number(e.target.value))}
                            aria-label="مخرج کسر دلخواه"
                            className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-bold text-center"
                          />
                        </label>
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

                      {/* Distinct Fill Color & Partition Line Color Pickers */}
                      <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px]">
                        <div>
                          <span className="text-slate-500 block mb-1 font-semibold">
                            رنگ داخل کسر:
                          </span>
                          <div className="flex items-center gap-1">
                            {['#0ea5e9', '#10b981', '#a855f7', '#f43f5e', '#3b82f6'].map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setFractionFillColor(c)}
                                style={{ backgroundColor: c }}
                                aria-label={`رنگ داخل کسر ${c}`}
                                className={`w-4 h-4 rounded-full border ${
                                  fractionFillColor === c
                                    ? 'scale-125 border-slate-900 dark:border-white'
                                    : 'border-transparent'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500 block mb-1 font-semibold">
                            رنگ خطوط تقسیم‌بندی:
                          </span>
                          <div className="flex items-center gap-1">
                            {['#f59e0b', '#e11d48', '#0f172a', '#10b981', '#7c3aed'].map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setFractionDividerColor(c)}
                                style={{ backgroundColor: c }}
                                aria-label={`رنگ خطوط تقسیم‌بندی کسر ${c}`}
                                className={`w-4 h-4 rounded-full border ${
                                  fractionDividerColor === c
                                    ? 'scale-125 border-slate-900 dark:border-white'
                                    : 'border-transparent'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleStamp(
                            `ابزارک کسر ${fractionShape === 'bar' ? 'نواری' : 'دایره‌ای'} (${fmt(
                              fractionMetrics.numerator
                            )}/${fmt(fractionMetrics.denominator)})`,
                            `معادل اعشاری: ${fmt(fractionMetrics.decimal)} | معادل درصدی: ${fmt(
                              fractionMetrics.percentage
                            )}٪`,
                            fractionFillColor,
                            {
                              dividerColor: fractionDividerColor,
                            }
                          )
                        }
                        className="w-full py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500 transition-colors"
                      >
                        ارسال شکل کسر به روی تخته سفید
                      </button>
                    </div>

                    <div
                      data-testid="place-value-lab-card"
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          مکعب‌های ارزش مکانی (یکی تا هزارتایی)
                        </h4>
                        <span
                          data-testid="place-value-total-badge"
                          className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 tabular-nums shrink-0"
                        >
                          عدد: {fmt(thousandsCount * 1000 + hundredsCount * 100 + tensCount * 10 + onesCount)}
                        </span>
                      </div>

                      <label className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="text-slate-600 dark:text-slate-300 font-semibold whitespace-nowrap">
                          عدد دلخواه (۰ تا ۹۹۹۹):
                        </span>
                        <input
                          type="number"
                          data-testid="place-value-number-input"
                          min={0}
                          max={9999}
                          value={thousandsCount * 1000 + hundredsCount * 100 + tensCount * 10 + onesCount}
                          onChange={(e) => {
                            const v = Math.max(0, Math.min(9999, Math.floor(Number(e.target.value) || 0)));
                            setThousandsCount(Math.floor(v / 1000));
                            setHundredsCount(Math.floor((v % 1000) / 100));
                            setTensCount(Math.floor((v % 100) / 10));
                            setOnesCount(v % 10);
                          }}
                          aria-label="عدد دلخواه ارزش مکانی"
                          className="w-28 px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-bold text-center"
                        />
                      </label>

                      <div className="grid grid-cols-4 gap-1.5 text-[11px]">
                        <label className="block">
                          <span className="text-violet-600 dark:text-violet-400 font-bold block mb-0.5">هزارتایی:</span>
                          <input
                            type="number"
                            data-testid="place-value-thousands-input"
                            min={0}
                            max={9}
                            value={thousandsCount}
                            onChange={(e) =>
                              setThousandsCount(Math.max(0, Math.min(9, Number(e.target.value) || 0)))
                            }
                            aria-label="تعداد هزارتایی"
                            className="w-full px-1.5 py-1 rounded bg-white dark:bg-slate-900 border border-violet-300 dark:border-violet-700 font-mono font-bold text-center"
                          />
                        </label>
                        <label className="block">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold block mb-0.5">صدتایی:</span>
                          <input
                            type="number"
                            data-testid="place-value-hundreds-input"
                            min={0}
                            max={9}
                            value={hundredsCount}
                            onChange={(e) =>
                              setHundredsCount(Math.max(0, Math.min(9, Number(e.target.value) || 0)))
                            }
                            aria-label="تعداد صدتایی"
                            className="w-full px-1.5 py-1 rounded bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 font-mono font-bold text-center"
                          />
                        </label>
                        <label className="block">
                          <span className="text-amber-600 dark:text-amber-400 font-bold block mb-0.5">ده‌تایی:</span>
                          <input
                            type="number"
                            data-testid="place-value-tens-input"
                            min={0}
                            max={19}
                            value={tensCount}
                            onChange={(e) =>
                              setTensCount(Math.max(0, Math.min(19, Number(e.target.value) || 0)))
                            }
                            aria-label="تعداد ده‌تایی دلخواه"
                            className="w-full px-1.5 py-1 rounded bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 font-mono font-bold text-center"
                          />
                        </label>
                        <label className="block">
                          <span className="text-sky-600 dark:text-sky-400 font-bold block mb-0.5">یکی:</span>
                          <input
                            type="number"
                            data-testid="place-value-ones-input"
                            min={0}
                            max={20}
                            value={onesCount}
                            onChange={(e) =>
                              setOnesCount(Math.max(0, Math.min(20, Number(e.target.value) || 0)))
                            }
                            aria-label="تعداد یکی دلخواه"
                            className="w-full px-1.5 py-1 rounded bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-700 font-mono font-bold text-center"
                          />
                        </label>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={handleAddOneBlock}
                          className="py-1 px-2 text-[10.5px] font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-sky-500 transition-colors"
                        >
                          + افزودن یکی (با انتقال)
                        </button>
                        <button
                          type="button"
                          onClick={handleBreakTenBlock}
                          disabled={tensCount === 0}
                          className="py-1 px-2 text-[10.5px] font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-amber-500 disabled:opacity-40 transition-colors"
                        >
                          شکستن ۱ ده‌تایی ← ۱۰ یکی
                        </button>
                        <button
                          type="button"
                          onClick={handleBreakHundredBlock}
                          disabled={hundredsCount === 0}
                          className="py-1 px-2 text-[10.5px] font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 disabled:opacity-40 transition-colors"
                        >
                          شکستن ۱ صدتایی ← ۱۰ ده‌تایی
                        </button>
                        <button
                          type="button"
                          onClick={handleBreakThousandBlock}
                          disabled={thousandsCount === 0}
                          className="py-1 px-2 text-[10.5px] font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-violet-500 disabled:opacity-40 transition-colors"
                        >
                          شکستن ۱ هزارتایی ← ۱۰ صدتایی
                        </button>
                      </div>

                      <div className="flex flex-wrap items-end gap-2.5 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 min-h-16">
                        {thousandsCount > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {Array.from({ length: thousandsCount }).map((_, i) => (
                              <div
                                key={`th-${i}`}
                                title="مکعب سه‌بعدی هزارتایی (۱۰۰۰)"
                                className="relative w-10 h-10 rounded-xs bg-violet-600 border border-violet-800 text-[9px] font-mono font-extrabold text-white flex items-center justify-center shadow-[3px_-3px_0_#a78bfa]"
                              >
                                {fmt(1000)}
                              </div>
                            ))}
                          </div>
                        )}
                        {hundredsCount > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {Array.from({ length: hundredsCount }).map((_, i) => (
                              <div
                                key={`hu-${i}`}
                                title="صفحه صدتایی (۱۰۰)"
                                className="w-9 h-9 rounded-xs bg-emerald-500 border border-emerald-700 text-[9px] font-mono font-extrabold text-white flex items-center justify-center"
                              >
                                {fmt(100)}
                              </div>
                            ))}
                          </div>
                        )}
                        {tensCount > 0 && (
                          <div className="flex items-center gap-1">
                            {Array.from({ length: tensCount }).map((_, i) => (
                              <div
                                key={`te-${i}`}
                                title="میله ده‌تایی (۱۰)"
                                className="w-2.5 h-10 rounded-xs bg-amber-500 border border-amber-700"
                              />
                            ))}
                          </div>
                        )}
                        {onesCount > 0 && (
                          <div className="flex flex-wrap gap-1 max-w-20">
                            {Array.from({ length: onesCount }).map((_, i) => (
                              <div
                                key={`on-${i}`}
                                title="مکعب یکی (۱)"
                                className="w-3 h-3 rounded-xs bg-sky-500 border border-sky-700"
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        data-testid="stamp-place-value-btn"
                        onClick={() => {
                          const total =
                            thousandsCount * 1000 +
                            hundredsCount * 100 +
                            tensCount * 10 +
                            onesCount;
                          handleStamp(
                            `مکعب ارزش مکانی (${fmt(total)})`,
                            `${fmt(thousandsCount)} هزارتایی، ${fmt(hundredsCount)} صدتایی، ${fmt(tensCount)} ده‌تایی و ${fmt(onesCount)} یکی`,
                            '#f59e0b',
                            {
                              dividerColor: '#0f172a',
                              placeThousands: thousandsCount,
                              placeHundreds: hundredsCount,
                              placeTens: tensCount,
                              placeOnes: onesCount,
                              filled: true,
                            }
                          );
                        }}
                        className="w-full py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500 transition-colors"
                      >
                        افزودن شکل مکعب‌ها به تخته سفید
                      </button>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100">
                          محور اعداد کسری (تعیین طول ۰ تا ۱۰، تقسیم‌بندی واحد و کمان پرش)
                        </h4>
                        <span className="font-mono text-sky-600 dark:text-sky-400 font-bold tabular-nums">
                          [{fmt(axisMin)} تا {fmt(axisMax)}] · هر واحد {fmt(axisSubdivisions)} قسمت
                        </span>
                      </div>

                      {/* Live Subdivided Fractional Number Line SVG Preview */}
                      <svg viewBox="0 0 320 78" direction="ltr" className="w-full h-20 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 px-1">
                        <line
                          x1="16"
                          y1="48"
                          x2="304"
                          y2="48"
                          className="stroke-sky-600 dark:stroke-sky-400"
                          strokeWidth="2.4"
                        />
                        {(() => {
                          const safeMax = Math.max(axisMin + 1, axisMax);
                          const totalU = Math.min(20, safeMax - axisMin);
                          const subdivs = Math.max(1, Math.min(12, axisSubdivisions));
                          const valToX = (v: number) =>
                            22 + ((Math.max(axisMin, Math.min(safeMax, v)) - axisMin) / (safeMax - axisMin)) * 276;

                          return (
                            <>
                              {Array.from({ length: totalU + 1 }).map((_, uIdx) => {
                                const uVal = axisMin + uIdx;
                                const xMaj = valToX(uVal);
                                return (
                                  <g key={`u-${uVal}`}>
                                    <line
                                      x1={xMaj}
                                      y1="39"
                                      x2={xMaj}
                                      y2="57"
                                      className="stroke-sky-700 dark:stroke-sky-300"
                                      strokeWidth="2.2"
                                    />
                                    <text
                                      x={xMaj}
                                      y="70"
                                      textAnchor="middle"
                                      className="fill-slate-800 dark:fill-slate-200 text-[10px] font-mono font-bold"
                                    >
                                      {fmt(uVal)}
                                    </text>
                                    {uIdx < totalU &&
                                      subdivs > 1 &&
                                      Array.from({ length: subdivs - 1 }).map((__, sIdx) => {
                                        const k = sIdx + 1;
                                        const xSub = valToX(uVal + k / subdivs);
                                        return (
                                          <line
                                            key={`s-${uVal}-${k}`}
                                            x1={xSub}
                                            y1="43"
                                            x2={xSub}
                                            y2="53"
                                            stroke="#f59e0b"
                                            strokeWidth="1.4"
                                          />
                                        );
                                      })}
                                  </g>
                                );
                              })}
                              {axisJumps.map((jmp, jIdx) => {
                                const x1 = valToX(jmp.from);
                                const x2 = valToX(jmp.to);
                                const xMid = (x1 + x2) / 2;
                                const col = jmp.color || (jIdx % 2 === 0 ? '#f59e0b' : '#10b981');
                                return (
                                  <g key={jIdx}>
                                    <path
                                      d={`M ${x1} 40 Q ${xMid} ${10 + (jIdx % 2) * 6} ${x2} 40`}
                                      fill="none"
                                      stroke={col}
                                      strokeWidth="2"
                                    />
                                    <circle cx={x1} cy="48" r="2.8" fill={col} />
                                    <circle cx={x2} cy="48" r="3.2" fill={col} />
                                  </g>
                                );
                              })}
                            </>
                          );
                        })()}
                      </svg>

                      {/* Range (شروع و پایان محور مثلاً ۰ تا ۱۰) & Unit Fractional Subdivisions (تقسیم‌بندی هر واحد) */}
                      <div className="grid grid-cols-3 gap-2 text-[11px]">
                        <label className="block">
                          <span className="text-slate-500 block mb-0.5">شروع محور:</span>
                          <input
                            type="number"
                            min={-20}
                            max={50}
                            value={axisMin}
                            onChange={(e) => setAxisMin(Number(e.target.value))}
                            aria-label="شروع محور اعداد"
                            className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-bold text-center"
                          />
                        </label>
                        <label className="block">
                          <span className="text-slate-500 block mb-0.5">پایان محور (مثلاً ۱۰):</span>
                          <input
                            type="number"
                            min={axisMin + 1}
                            max={axisMin + 24}
                            value={axisMax}
                            onChange={(e) =>
                              setAxisMax(Math.max(axisMin + 1, Math.min(axisMin + 24, Number(e.target.value))))
                            }
                            aria-label="پایان محور اعداد"
                            className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-bold text-center"
                          />
                        </label>
                        <label className="block">
                          <span className="text-slate-500 block mb-0.5">تقسیم هر واحد (کسر):</span>
                          <input
                            type="number"
                            min={1}
                            max={12}
                            value={axisSubdivisions}
                            onChange={(e) =>
                              setAxisSubdivisions(Math.max(1, Math.min(12, Number(e.target.value))))
                            }
                            aria-label="تقسیم‌بندی هر واحد محور برای کسر"
                            className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border border-amber-400 dark:border-amber-600 font-mono font-bold text-center text-amber-700 dark:text-amber-300"
                          />
                        </label>
                      </div>

                      {/* Quick Fractional Subdivision Presets */}
                      <div className="flex items-center gap-1 flex-wrap text-[10px]">
                        <span className="text-slate-500">تقسیم سریع هر واحد:</span>
                        {[
                          { v: 1, l: '۱ (صحیح)' },
                          { v: 2, l: '۲ (نصف ۱/۲)' },
                          { v: 3, l: '۳ (ثلث ۱/۳)' },
                          { v: 4, l: '۴ (ربع ۱/۴)' },
                          { v: 5, l: '۵ (۱/۵)' },
                          { v: 10, l: '۱۰ (اعشاری)' },
                        ].map((p) => (
                          <button
                            key={p.v}
                            type="button"
                            onClick={() => setAxisSubdivisions(p.v)}
                            className={`px-1.5 py-0.5 rounded border font-bold ${
                              axisSubdivisions === p.v
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {p.l}
                          </button>
                        ))}
                      </div>

                      {/* Optional Multi-Jump Arrow Builder */}
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-600 dark:text-slate-300">
                            فلش‌های منحنی پرش ({fmt(axisJumps.length)} فلش):
                          </span>
                          {axisJumps.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setAxisJumps([])}
                              className="text-[10px] text-rose-600 dark:text-rose-400 font-bold hover:underline"
                            >
                              حذف فلش‌ها (برای رسم آزاد با قلم)
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 items-end">
                          <label className="block">
                            <span className="text-[10px] text-slate-400 block">از نقطه (حتی اعشاری):</span>
                            <input
                              type="number"
                              step="0.25"
                              value={jumpStart}
                              onChange={(e) => setJumpStart(Number(e.target.value))}
                              aria-label="عدد شروع پرش محور"
                              className="w-full px-1.5 py-1 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-center"
                            />
                          </label>
                          <label className="block">
                            <span className="text-[10px] text-slate-400 block">طول پرش (+):</span>
                            <input
                              type="number"
                              step="0.25"
                              value={jumpStep}
                              onChange={(e) => setJumpStep(Number(e.target.value))}
                              aria-label="طول پرش روی محور"
                              className="w-full px-1.5 py-1 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-center"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setAxisJumps((prev) => [
                                ...prev,
                                {
                                  from: jumpStart,
                                  to: jumpStart + jumpStep,
                                  color: prev.length % 2 === 0 ? '#f59e0b' : '#10b981',
                                },
                              ])
                            }
                            className="py-1 px-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]"
                          >
                            + افزودن فلش منحنی
                          </button>
                        </div>
                      </div>

                      {/* Two Send Buttons: 1) Clean Axis for Freehand Curved Arrows on Board, 2) Axis with Jump Arrows */}
                      <div className="grid grid-cols-1 gap-1.5">
                        <button
                          type="button"
                          data-testid="stamp-number-line-clean-btn"
                          onClick={() =>
                            handleStamp(
                              `محور اعداد (${fmt(axisMin)} تا ${fmt(axisMax)} · واحد ${fmt(axisSubdivisions)} قسمتی)`,
                              `آماده رسم آزاد چند فلش منحنی با قلم روی تخته`,
                              '#0284c7',
                              {
                                axisMin,
                                axisMax,
                                axisSubdivisions,
                                axisJumps: [],
                                showAxisJumps: false,
                              }
                            )
                          }
                          className="w-full py-1.5 text-xs font-bold rounded-lg bg-sky-600 text-white hover:bg-sky-500 transition-colors"
                        >
                          ارسال محور اعداد به تخته (خالی برای رسم آزاد چند فلش منحنی با قلم)
                        </button>
                        <button
                          type="button"
                          data-testid="stamp-number-line-with-jumps-btn"
                          onClick={() =>
                            handleStamp(
                              `محور اعداد (${fmt(axisMin)} تا ${fmt(axisMax)} · با ${fmt(axisJumps.length)} فلش پرش)`,
                              `تقسیم‌بندی هر واحد: ${fmt(axisSubdivisions)} قسمت مساوی`,
                              '#0284c7',
                              {
                                axisMin,
                                axisMax,
                                axisSubdivisions,
                                axisJumps:
                                  axisJumps.length > 0
                                    ? axisJumps
                                    : [{ from: jumpStart, to: jumpStart + jumpStep, color: '#f59e0b' }],
                                showAxisJumps: true,
                              }
                            )
                          }
                          className="w-full py-1.5 text-[11px] font-semibold rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                        >
                          ارسال محور اعداد به همراه فلش‌های منحنی پرش به تخته
                        </button>
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
                      <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                        <label className="block">
                          <span className="text-slate-500 block mb-0.5">ساعت (۱-۱۲):</span>
                          <input
                            type="number"
                            min={1}
                            max={12}
                            value={clockHour}
                            onChange={(e) =>
                              setClockHour(Math.max(1, Math.min(12, Number(e.target.value))))
                            }
                            aria-label="ساعت دلخواه"
                            className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-bold text-center"
                          />
                        </label>
                        <label className="block">
                          <span className="text-slate-500 block mb-0.5">دقیقه (۰-۵۹):</span>
                          <input
                            type="number"
                            min={0}
                            max={59}
                            value={clockMinute}
                            onChange={(e) =>
                              setClockMinute(Math.max(0, Math.min(59, Number(e.target.value))))
                            }
                            aria-label="دقیقه دلخواه"
                            className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-bold text-center"
                          />
                        </label>
                        <label className="block">
                          <span className="text-slate-500 block mb-0.5">تعداد چوب‌خط:</span>
                          <input
                            type="number"
                            min={1}
                            max={35}
                            value={tallyCount}
                            onChange={(e) =>
                              setTallyCount(Math.max(1, Math.min(35, Number(e.target.value))))
                            }
                            aria-label="تعداد چوب‌خط دلخواه"
                            className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-bold text-center"
                          />
                        </label>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                        <div className="flex flex-wrap items-center justify-center gap-1.5 font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                          {Array.from({ length: Math.floor(tallyCount / 5) }).map((_, i) => (
                            <span key={i} className="px-1 rounded bg-amber-500/10 border border-amber-500/30">
                              ||||̸
                            </span>
                          ))}
                          {tallyCount % 5 > 0 && <span>{'|'.repeat(tallyCount % 5)}</span>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleStamp(
                              `ساعت آموزشی (${fmt(clockHour)}/${fmt(clockMinute)})`,
                              `${fmt(String(clockHour).padStart(2, '0'))}:${fmt(
                                String(clockMinute).padStart(2, '0')
                              )}`,
                              '#0284c7'
                            )
                          }
                          className="w-full py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500 transition-colors"
                        >
                          افزودن شکل ساعت به تخته
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleStamp(
                              `چوب‌خط (${fmt(tallyCount)}/5)`,
                              `تعداد چوب‌خط: ${fmt(tallyCount)}`,
                              '#d97706'
                            )
                          }
                          className="w-full py-1.5 text-xs font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-500 transition-colors"
                        >
                          افزودن شکل چوب‌خط به تخته
                        </button>
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
                          handleStamp(
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
                            className="w-full mt-0.5 px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-center"
                          />
                        </label>
                        <label className="block">
                          <span className="text-[11px] text-slate-500">مقسوم‌علیه:</span>
                          <input
                            type="number"
                            value={divDivisor}
                            onChange={(e) => setDivDivisor(Math.max(1, Number(e.target.value)))}
                            className="w-full mt-0.5 px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-center"
                          />
                        </label>
                      </div>

                      {/* Authentic Textbook Iranian Long Division SVG Preview (مقسوم سمت چپ، مقسوم‌علیه و خارج‌قسمت سمت راست چکش) */}
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-center">
                        <svg viewBox="0 0 220 112" direction="ltr" className="w-56 h-28 overflow-visible">
                          <line x1="112" y1="8" x2="112" y2="104" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />
                          <line x1="112" y1="44" x2="204" y2="44" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />
                          {/* Top-Left: Dividend (مقسوم) */}
                          <text x="98" y="33" textAnchor="end" className="fill-slate-900 dark:fill-slate-100 text-xl font-extrabold font-mono">
                            {fmt(divDividend)}
                          </text>
                          {/* Top-Right: Divisor (مقسوم‌علیه) */}
                          <text x="124" y="33" textAnchor="start" className="fill-sky-600 dark:fill-sky-400 text-xl font-extrabold font-mono">
                            {fmt(divDivisor)}
                          </text>
                          {/* Bottom-Right: Quotient (خارج‌قسمت) */}
                          <text x="124" y="75" textAnchor="start" className="fill-amber-600 dark:fill-amber-400 text-xl font-extrabold font-mono">
                            {fmt(divQuotient)}
                          </text>
                          {/* Subtracted Product */}
                          <text x="98" y="63" textAnchor="end" className="fill-rose-600 dark:fill-rose-400 text-lg font-bold font-mono">
                            − {fmt(divProduct)}
                          </text>
                          <line x1="24" y1="73" x2="102" y2="73" stroke="#64748b" strokeWidth="2" />
                          {/* Remainder */}
                          <text x="98" y="97" textAnchor="end" className="fill-emerald-600 dark:fill-emerald-400 text-lg font-extrabold font-mono">
                            {fmt(divRemainder)}
                          </text>
                        </svg>
                      </div>

                      <div className="grid grid-cols-1 gap-1.5">
                        <button
                          type="button"
                          data-testid="stamp-long-division-full-btn"
                          onClick={() =>
                            handleStamp(
                              `تقسیم چکشی ایرانی: ${fmt(divDividend)} ÷ ${fmt(divDivisor)}`,
                              `خارج‌قسمت = ${fmt(divQuotient)} | باقی‌مانده = ${fmt(divRemainder)}`,
                              '#0284c7',
                              {
                                divDividend,
                                divDivisor,
                                hideDivisionSteps: false,
                              }
                            )
                          }
                          className="w-full py-1.5 text-xs font-bold rounded-lg bg-sky-600 text-white hover:bg-sky-500 transition-colors"
                        >
                          ارسال تقسیم چکشی (کامل با مراحل حل) به تخته سفید
                        </button>
                        <button
                          type="button"
                          data-testid="stamp-long-division-blank-btn"
                          onClick={() =>
                            handleStamp(
                              `تقسیم چکشی ایرانی (تمرینی): ${fmt(divDividend)} ÷ ${fmt(divDivisor)}`,
                              `قالب بدون جواب برای حل مرحله‌به‌مرحله با قلم روی تخته`,
                              '#0284c7',
                              {
                                divDividend,
                                divDivisor,
                                hideDivisionSteps: true,
                              }
                            )
                          }
                          className="w-full py-1.5 text-[11px] font-semibold rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                        >
                          ارسال قالب تقسیم چکشی (بدون جواب - برای حل با قلم)
                        </button>
                      </div>
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
                        <span className="whitespace-nowrap">مقدار مجهول (x):</span>
                        <input
                          type="number"
                          min={-20}
                          max={50}
                          value={eqGuessedX}
                          onChange={(e) => setEqGuessedX(Number(e.target.value))}
                          aria-label="مقدار دلخواه مجهول x"
                          className="w-16 px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-bold text-center"
                        />
                        <input
                          type="range"
                          min={1}
                          max={8}
                          value={Math.max(1, Math.min(8, eqGuessedX))}
                          onChange={(e) => setEqGuessedX(Number(e.target.value))}
                          className="w-full accent-sky-600"
                        />
                        <span className="font-mono font-bold whitespace-nowrap">
                          {fmt(2 * eqGuessedX + 3)} vs {fmt(11)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleStamp(
                            `ترازوی معادلات (${fmt(2 * eqGuessedX + 3)}/11)`,
                            `۲x + ۳ = ۱۱ (x = ${fmt(eqGuessedX)})`,
                            '#059669'
                          )
                        }
                        className="w-full py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500 transition-colors"
                      >
                        افزودن شکل ترازو به تخته سفید
                      </button>
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

                      <button
                        type="button"
                        onClick={() =>
                          handleStamp(
                            `نمودار حسابان: مشتق و ${fmt(riemannN)} مستطیل ریمان`,
                            `نقطه مماس x₀=${fmt(tangentX)} | شیب خط مماس f'(x₀)=${fmt(
                              calculusMetrics.derivativeAtX
                            )} | مساحت ریمان ≈ ${fmt(calculusMetrics.riemannArea)}`,
                            '#0284c7'
                          )
                        }
                        className="w-full py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500 transition-colors"
                      >
                        افزودن نمودار مشتق و ریمان به تخته سفید
                      </button>
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

                      <button
                        type="button"
                        onClick={() =>
                          handleStamp(
                            `گسترده مکعب (${fmt(netUnfoldPct)}/100)`,
                            `بازشدگی گسترده مکعب: ${fmt(netUnfoldPct)}٪`,
                            '#d97706'
                          )
                        }
                        className="w-full py-1.5 text-xs font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-500 transition-colors"
                      >
                        افزودن شکل گسترده مکعب به تخته سفید
                      </button>

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

                      <button
                        type="button"
                        onClick={() =>
                          handleStamp(
                            `نمودار ون (${vennExpr})`,
                            `نمایش نواحی مجموعه‌های A, B, C`,
                            '#0284c7'
                          )
                        }
                        className="w-full py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500 transition-colors"
                      >
                        افزودن شکل نمودار ون به تخته سفید
                      </button>
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
                        handleStamp(
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
                        handleStamp(
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
                            handleStamp(
                              'میدان مغناطیسی درون‌سو (⊗) و برون‌سو (⊙)',
                              `قانون دست راست | مدار ${circuitMode === 'series' ? 'سری' : 'موازی'}: I = ${fmt(circuitMetrics.totalCurrentAmp)}A`,
                              '#d97706'
                            )
                          }
                          className="w-full py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500"
                        >
                          افزودن شکل مدار به تخته سفید
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
                      <button
                        type="button"
                        onClick={() =>
                          handleStamp(
                            `مانومتر لوله U شکل (${fmt(manometerHLeft)}/${fmt(Math.round(manometerMetrics.hRightCm))})`,
                            `h₁=${fmt(manometerHLeft)}cm , h₂=${fmt(manometerMetrics.hRightCm)}cm`,
                            '#0284c7'
                          )
                        }
                        className="w-full py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500 transition-colors"
                      >
                        افزودن شکل لوله U شکل به تخته سفید
                      </button>
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
                      <button
                        type="button"
                        onClick={() =>
                          handleStamp(
                            `نمودار P-V ترمودینامیک (${thermoProcess}) و مانومتر`,
                            `فرآیند گاز کامل | ارتفاع ستون دوم لوله U شکل: h₂ = ${fmt(
                              manometerMetrics.hRightCm
                            )} cm`,
                            '#0284c7'
                          )
                        }
                        className="w-full py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500 transition-colors"
                      >
                        افزودن نمودار P-V به تخته سفید
                      </button>
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
                      <button
                        type="button"
                        onClick={() =>
                          handleStamp(
                            `شکست نور اسنل (${fmt(snellAngle1)}/${fmt(Math.round(snellMetrics.refractedAngleDeg ?? 90))})`,
                            `θ₁ = ${fmt(snellAngle1)}°`,
                            '#0284c7'
                          )
                        }
                        className="w-full py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500 transition-colors"
                      >
                        افزودن شکل شکست نور به تخته سفید
                      </button>
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
                      <button
                        type="button"
                        onClick={() =>
                          handleStamp(
                            `اتم بور (${fmt(bohrNi)}/${fmt(bohrNf)})`,
                            `ΔE = ${fmt(bohrMetrics.deltaEnergyEv)} eV | λ ≈ ${fmt(
                              bohrMetrics.wavelengthNm
                            )} nm`,
                            '#0284c7'
                          )
                        }
                        className="w-full py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500 transition-colors"
                      >
                        افزودن شکل مدل اتمی بور به تخته سفید
                      </button>
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
                        handleStamp(
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
                      <button
                        type="button"
                        onClick={() =>
                          handleStamp(
                            `هندسه مولکولی VSEPR (${vseprSpec.formula})`,
                            `${vseprSpec.geometryFa} - ${fmt(vseprSpec.bondAngleDeg)}°`,
                            '#0284c7'
                          )
                        }
                        className="w-full py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500 transition-colors"
                      >
                        افزودن شکل مولکول VSEPR به تخته سفید
                      </button>
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
                          handleStamp(
                            `زنجیره کربنی آلی (${fmt(organicChainLen)}/7)`,
                            `زنجیره ${fmt(organicChainLen)} کربنه آیوپاک`,
                            '#0284c7'
                          )
                        }
                        className="w-full py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500"
                      >
                        افزودن شکل زنجیره آلی به تخته سفید
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
                      <button
                        type="button"
                        onClick={() =>
                          handleStamp(
                            `سلول گالوانی (${galvanicAnode}/${galvanicCathode})`,
                            `ΔE° = +${fmt(galvanicMetrics.cellEmfV)} V`,
                            '#059669'
                          )
                        }
                        className="w-full py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500 transition-colors"
                      >
                        افزودن شکل سلول گالوانی به تخته سفید
                      </button>
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
                      <button
                        type="button"
                        onClick={() =>
                          handleStamp(
                            `تیتراسیون اسید و باز (${fmt(solutionPh)}/14)`,
                            `pH = ${fmt(solutionPh)}`,
                            '#0284c7'
                          )
                        }
                        className="w-full py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500 transition-colors"
                      >
                        افزودن نمودار تیتراسیون به تخته سفید
                      </button>
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
                      <button
                        type="button"
                        onClick={() =>
                          handleStamp(
                            `واکنش هابر (${fmt(chemCoeffN2)}/${fmt(chemCoeffH2)})`,
                            `${chemCoeffN2}N₂ + ${chemCoeffH2}H₂ ⟶ ${chemCoeffNH3}NH₃`,
                            '#059669'
                          )
                        }
                        className="w-full py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500 transition-colors"
                      >
                        افزودن معادله موازنه‌شده به تخته سفید
                      </button>
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
                      <button
                        type="button"
                        onClick={() =>
                          handleStamp(
                            `آناتومی قلب (${showAnatomyLabels ? 1 : 0}/4)`,
                            `اطلس لایه‌ای قلب و رگ‌ها`,
                            '#e11d48'
                          )
                        }
                        className="w-full py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500 transition-colors"
                      >
                        افزودن شکل آناتومی قلب به تخته سفید
                      </button>
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
                          handleStamp(
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
                      <button
                        type="button"
                        onClick={() =>
                          handleStamp(
                            `تقطیع عروضی (${prosodySequence.join(' ')})`,
                            `وزن شعر فارسی: ${prosodySequence.join(' ')}`,
                            '#7c3aed'
                          )
                        }
                        className="w-full py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500 transition-colors"
                      >
                        افزودن علامت‌های عروضی به تخته سفید
                      </button>
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
                      <button
                        type="button"
                        onClick={() =>
                          handleStamp(
                            `اعراب عربی (${arabicWordIndex + 1}/3)`,
                            `حرکت‌گذاری و نقش نحوی عربی`,
                            '#059669'
                          )
                        }
                        className="w-full py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500 transition-colors"
                      >
                        افزودن عبارت عربی به تخته سفید
                      </button>
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
                      <button
                        type="button"
                        onClick={() =>
                          handleStamp(
                            `تقطیع عروضی و جدول صرف عربی (${
                              arabicTense === 'madi' ? 'ماضی' : 'مضارع'
                            })`,
                            `وزن عروضی: ${prosodySequence.join(' ')} | ریشه: ذ-ه-ب`,
                            '#7c3aed'
                          )
                        }
                        className="w-full py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500 transition-colors"
                      >
                        افزودن تقطیع عروضی و جدول صرف به تخته سفید
                      </button>
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
                      <button
                        type="button"
                        onClick={() =>
                          handleStamp(
                            `فلش‌کارت زبان (Ubiquitous)`,
                            `/juːˈbɪk.wɪ.təs/ — فراگیر، حاضر در همه جا`,
                            '#0284c7'
                          )
                        }
                        className="w-full py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500 transition-colors"
                      >
                        افزودن به تخته سفید
                      </button>
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
                        <div className="grid grid-cols-2 divide-x divide-x-reverse divide-slate-800 dark:divide-slate-200 pt-1.5 text-center font-mono gap-2">
                          <div className="px-1">
                            <span className="text-[10px] text-slate-400 block font-sans mb-0.5">بدهکار (ورودی)</span>
                            <input
                              type="number"
                              value={debitTotal}
                              onChange={(e) => setDebitTotal(Math.max(0, Number(e.target.value)))}
                              aria-label="مبلغ بدهکار حساب T"
                              className="w-full px-1.5 py-0.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-emerald-600 text-center"
                            />
                          </div>
                          <div className="px-1">
                            <span className="text-[10px] text-slate-400 block font-sans mb-0.5">بستانکار (خروجی)</span>
                            <input
                              type="number"
                              value={creditTotal}
                              onChange={(e) => setCreditTotal(Math.max(0, Number(e.target.value)))}
                              aria-label="مبلغ بستانکار حساب T"
                              className="w-full px-1.5 py-0.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-rose-600 text-center"
                            />
                          </div>
                        </div>
                        <div className="mt-2 pt-1.5 border-t border-slate-200 dark:border-slate-800 text-center font-bold text-sky-600 dark:text-sky-400">
                          مانده: {fmt(debitTotal - creditTotal)} میلیون ریال
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleStamp(
                            `جدول حساب T (${fmt(debitTotal)}/${fmt(creditTotal)})`,
                            `بدهکار: ${fmt(debitTotal)} | بستانکار: ${fmt(creditTotal)}`,
                            '#0284c7'
                          )
                        }
                        className="w-full py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500 transition-colors"
                      >
                        افزودن شکل حساب T به تخته سفید
                      </button>
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
                            <button
                              type="button"
                              onClick={() =>
                                handleStamp(
                                  `نمودار عرضه و تقاضا (P=${fmt(econTestPrice)}) و حساب T`,
                                  `تعادل بازار: P*=${fmt(eq.equilibriumPrice)}, Q*=${fmt(
                                    eq.equilibriumQuantity
                                  )} | مانده حساب T: ${fmt(debitTotal - creditTotal)}`,
                                  '#0284c7'
                                )
                              }
                              className="w-full mt-1.5 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500 transition-colors"
                            >
                              افزودن نمودار عرضه و تقاضا به تخته سفید
                            </button>
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
