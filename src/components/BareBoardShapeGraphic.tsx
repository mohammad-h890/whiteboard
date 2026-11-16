import React from 'react';
import { toPersianDigits } from '../core/featureEngine';
import {
  GeometricShapePresetId,
  generateGeometricShapeStrokes,
  calculateIranianLongDivision,
} from '../core/canvasAndMathEngine';
import type { StampedBoardWidget } from './SmartWhiteboardCanvas';

interface BareBoardShapeGraphicProps {
  widget: StampedBoardWidget;
  usePersianNumerals: boolean;
}

export const BareBoardShapeGraphic: React.FC<BareBoardShapeGraphicProps> = ({
  widget: w,
  usePersianNumerals,
}) => {
  const fmt = (val: string | number) => toPersianDigits(val, usePersianNumerals);

  const toEn = (s: string) =>
    s.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
  const normText = toEn(`${w.title} ${w.summary}`);
  const divOrFracMatch = normText.match(/(\d+)\s*[÷/:]\s*(\d+)/);
  const num = w.divDividend ?? (divOrFracMatch ? Math.max(0, Number(divOrFracMatch[1])) : 3);
  const den = w.divDivisor ?? (divOrFracMatch ? Math.max(1, Number(divOrFracMatch[2])) : 5);

  // Core visual design:
  // Structural skeleton/axes/dividers are crisp BLACK (#0f172a), inner fills use vibrant colors (w.badgeColor)
  const structColor = w.dividerColor || '#0f172a';
  const innerColor =
    !w.badgeColor || w.badgeColor === '#0f172a' ? '#38bdf8' : w.badgeColor;
  const fillTint = w.filled === false ? `${innerColor}24` : `${innerColor}42`;

  const renderGeoShapeSvg = (
    shapeId: GeometricShapePresetId,
    fillHex: string,
    filled: boolean,
    dashed: boolean,
    sw: number,
    labelText?: string
  ) => {
    if (shapeId === 'fraction-line') {
      const hasCustomNumbers = w.divDividend !== undefined || w.divDivisor !== undefined;
      return (
        <svg
          viewBox="0 0 160 160"
          data-testid="bare-fraction-line-svg"
          className="w-36 h-36 overflow-visible select-none"
        >
          {/* Numerator box */}
          <rect
            x="44"
            y="16"
            width="72"
            height="48"
            rx="10"
            fill={filled ? `${fillHex}30` : 'rgba(255,255,255,0.75)'}
            stroke={structColor}
            strokeWidth="2.2"
            strokeDasharray="6 4"
          />
          {hasCustomNumbers && (
            <text
              x="80"
              y="48"
              textAnchor="middle"
              fill={structColor}
              className="text-2xl font-extrabold font-mono select-none"
            >
              {fmt(w.divDividend ?? 1)}
            </text>
          )}
          {/* Main Crisp Black Fraction Line (خط کسری) */}
          <line
            x1="14"
            y1="80"
            x2="146"
            y2="80"
            stroke={structColor}
            strokeWidth={Math.max(4.5, sw + 1.5)}
            strokeLinecap="round"
          />
          {/* Denominator box */}
          <rect
            x="44"
            y="96"
            width="72"
            height="48"
            rx="10"
            fill={filled ? `${fillHex}30` : 'rgba(255,255,255,0.75)'}
            stroke={structColor}
            strokeWidth="2.2"
            strokeDasharray="6 4"
          />
          {hasCustomNumbers && (
            <text
              x="80"
              y="128"
              textAnchor="middle"
              fill={structColor}
              className="text-2xl font-extrabold font-mono select-none"
            >
              {fmt(w.divDivisor ?? 2)}
            </text>
          )}
          {labelText && !hasCustomNumbers && (
            <text
              x="80"
              y="48"
              textAnchor="middle"
              fill={structColor}
              className="text-lg font-extrabold font-mono select-none"
            >
              {fmt(labelText)}
            </text>
          )}
        </svg>
      );
    }

    const isLineOrAxes =
      shapeId === 'radical-sign' ||
      shapeId === 'arrow' ||
      shapeId === 'axes' ||
      shapeId === 'angle';
    const fillVal = !isLineOrAxes && filled ? `${fillHex}48` : 'none';
    const strokeHex = structColor;
    const dashVal = dashed ? '6 4' : undefined;
    const polylines = generateGeometricShapeStrokes(shapeId, 80, 80, 1, 0);
    return (
      <svg viewBox="0 0 160 160" className="w-36 h-36 overflow-visible select-none">
        {polylines.map((pts, idx) => {
          if (pts.length < 2) return null;
          const d = pts
            .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
            .join(' ');
          return (
            <path
              key={idx}
              d={d}
              fill={idx === 0 ? fillVal : 'none'}
              stroke={strokeHex}
              strokeWidth={sw}
              strokeDasharray={dashVal}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}
        {labelText && (
          <text
            x="80"
            y="85"
            textAnchor="middle"
            fill={structColor}
            className="text-sm font-bold font-mono select-none"
          >
            {fmt(labelText)}
          </text>
        )}
      </svg>
    );
  };

  // 1. Ready-Made Persian Number / Math Symbol
  if (w.widgetKind === 'persian-number') {
    return (
      <div
        style={{
          color: w.badgeColor || '#0284c7',
          WebkitTextStroke: '1.5px #0f172a',
          textShadow: '0 2px 6px rgba(15,23,42,0.12)',
        }}
        className="text-6xl font-extrabold px-2.5 py-1 leading-none tracking-tight select-none"
      >
        {fmt(w.persianText || w.summary || '۰')}
      </div>
    );
  }

  // 2. Ready-Made 2D/3D Geometric Shape or Fraction Line / Radical
  if (w.widgetKind === 'geo-shape' && w.geoShapeId) {
    return renderGeoShapeSvg(
      w.geoShapeId,
      innerColor,
      w.filled ?? true,
      Boolean(w.dashed),
      w.strokeWidthPx ?? 3.2,
      w.persianText
    );
  }

  // 3. Number Line (محور اعداد: MUST be checked BEFORE 'کسر' because its label may include 'محور اعداد کسری'!)
  if (w.title.includes('محور')) {
    const minVal = w.axisMin ?? 0;
    const maxVal = w.axisMax ?? 10;
    const safeMax = Math.max(minVal + 1, maxVal);
    const totalUnits = Math.min(24, Math.max(1, safeMax - minVal));
    const subdivs = Math.max(1, Math.min(12, w.axisSubdivisions ?? 1));
    const jumps =
      w.showAxisJumps === false
        ? []
        : w.axisJumps && w.axisJumps.length > 0
        ? w.axisJumps
        : [];

    const startX = 28;
    const endX = 368;
    const axisWidth = endX - startX;
    const valToX = (v: number) => {
      const clamped = Math.max(minVal, Math.min(safeMax, v));
      return startX + ((clamped - minVal) / (safeMax - minVal)) * axisWidth;
    };

    return (
      <svg
        viewBox="0 0 396 104"
        direction="ltr"
        data-testid="bare-number-line-svg"
        className="w-[410px] h-26 overflow-visible select-none drop-shadow-xs"
      >
        {/* Subtle Card Plate for Contrast on Any Board */}
        <rect
          x="4"
          y="16"
          width="388"
          height="82"
          rx="14"
          fill="rgba(255,255,255,0.88)"
          stroke={structColor}
          strokeOpacity="0.18"
          strokeWidth="1.5"
        />

        {/* Vibrant Inner Highlight Strip along the Number Line */}
        <rect
          x={startX}
          y="47"
          width={axisWidth}
          height="16"
          rx="5"
          fill={`${innerColor}35`}
        />

        {/* Main Horizontal Axis Line with Left/Right Arrowheads in Crisp BLACK */}
        <line
          x1={startX - 12}
          y1="55"
          x2={endX + 12}
          y2="55"
          stroke={structColor}
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <polyline
          points={`${endX + 4},49 ${endX + 14},55 ${endX + 4},61`}
          fill="none"
          stroke={structColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points={`${startX - 4},49 ${startX - 14},55 ${startX - 4},61`}
          fill="none"
          stroke={structColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Unit Ticks & Fractional Subdivision Ticks */}
        {Array.from({ length: totalUnits + 1 }).map((_, unitIdx) => {
          const unitVal = minVal + unitIdx;
          const xMajor = valToX(unitVal);
          const isZero = unitVal === 0;
          return (
            <g key={`unit-${unitVal}`}>
              {/* Major Integer Tick */}
              <line
                x1={xMajor}
                y1={isZero ? 41 : 44}
                x2={xMajor}
                y2={isZero ? 69 : 66}
                stroke={isZero ? '#e11d48' : structColor}
                strokeWidth={isZero ? 3.2 : 2.6}
                strokeLinecap="round"
              />
              <circle
                cx={xMajor}
                cy="55"
                r={isZero ? 3.5 : 2.2}
                fill={isZero ? '#e11d48' : innerColor}
                stroke={structColor}
                strokeWidth="1.2"
              />
              <text
                x={xMajor}
                y="86"
                textAnchor="middle"
                fill={isZero ? '#e11d48' : structColor}
                className="text-xs font-mono font-extrabold"
              >
                {fmt(unitVal)}
              </text>

              {/* Fractional Sub-unit Ticks between unitVal and unitVal + 1 */}
              {unitIdx < totalUnits &&
                subdivs > 1 &&
                Array.from({ length: subdivs - 1 }).map((__, subIdx) => {
                  const k = subIdx + 1;
                  const subVal = unitVal + k / subdivs;
                  const xSub = valToX(subVal);
                  const isHalf = subdivs % 2 === 0 && k === subdivs / 2;
                  return (
                    <line
                      key={`sub-${unitVal}-${k}`}
                      x1={xSub}
                      y1={isHalf ? 48 : 50}
                      x2={xSub}
                      y2={isHalf ? 62 : 60}
                      stroke={structColor}
                      strokeOpacity="0.75"
                      strokeWidth={isHalf ? 2 : 1.4}
                      strokeLinecap="round"
                    />
                  );
                })}
            </g>
          );
        })}

        {/* Optional Curved Jump Arrows on the Number Line */}
        {jumps.map((jmp, jIdx) => {
          const x1 = valToX(jmp.from);
          const x2 = valToX(jmp.to);
          const xMid = (x1 + x2) / 2;
          const dist = Math.abs(x2 - x1);
          const peakY = Math.max(4, 38 - Math.min(28, dist * 0.22) - (jIdx % 2) * 7);
          const arrowColor = jmp.color || (jIdx % 2 === 0 ? innerColor : '#f59e0b');
          const dirSign = x2 >= x1 ? 1 : -1;
          return (
            <g key={`jump-${jIdx}`}>
              <path
                d={`M ${x1} 45 Q ${xMid} ${peakY} ${x2} 45`}
                fill="none"
                stroke={arrowColor}
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              <polyline
                points={`${x2 - dirSign * 7},38 ${x2},45 ${x2 - dirSign * 2},36`}
                fill="none"
                stroke={arrowColor}
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          );
        })}
      </svg>
    );
  }

  // 4. Iranian Textbook Long Division (تقسیم چکشی ایرانی)
  if (w.title.includes('تقسیم چکشی')) {
    const divMetrics = calculateIranianLongDivision(num, den);
    const showSteps = w.hideDivisionSteps
      ? false
      : !w.title.includes('تمرینی') && !w.title.includes('بدون جواب');

    return (
      <svg
        viewBox="0 0 228 124"
        direction="ltr"
        data-testid="bare-iranian-long-division-svg"
        className="w-60 h-32 overflow-visible select-none drop-shadow-xs"
      >
        <rect
          x="6"
          y="4"
          width="216"
          height="114"
          rx="14"
          fill="rgba(255,255,255,0.9)"
          stroke={structColor}
          strokeOpacity="0.18"
          strokeWidth="1.5"
        />
        {/* Inner Highlight Boxes for Divisor & Quotient */}
        <rect
          x="118"
          y="12"
          width="88"
          height="32"
          rx="7"
          fill={`${innerColor}2E`}
        />
        {showSteps && (
          <rect
            x="118"
            y="52"
            width="88"
            height="34"
            rx="7"
            fill="rgba(245, 158, 11, 0.22)"
          />
        )}

        {/* Vertical Hammer Bar (خط عمودی چکش - مشکی) */}
        <line
          x1="112"
          y1="12"
          x2="112"
          y2="110"
          stroke={structColor}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {/* Horizontal Hammer Bar on the Right under Divisor (خط افقی چکش - مشکی) */}
        <line
          x1="112"
          y1="48"
          x2="208"
          y2="48"
          stroke={structColor}
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Top-Left: Dividend (مقسوم) */}
        <text
          x="98"
          y="36"
          textAnchor="end"
          fill={structColor}
          className="text-2xl font-extrabold font-mono"
        >
          {fmt(divMetrics.dividend)}
        </text>

        {/* Top-Right (above horizontal bar): Divisor (مقسوم‌علیه) */}
        <text
          x="128"
          y="36"
          textAnchor="start"
          fill={innerColor}
          className="text-2xl font-extrabold font-mono"
        >
          {fmt(divMetrics.divisor)}
        </text>

        {showSteps && (
          <>
            {/* Bottom-Right (below horizontal bar): Quotient (خارج‌قسمت) */}
            <text
              x="128"
              y="78"
              textAnchor="start"
              fill="#d97706"
              className="text-2xl font-extrabold font-mono"
            >
              {fmt(divMetrics.quotient)}
            </text>

            {/* Left Middle: Subtracted Product */}
            <text
              x="98"
              y="68"
              textAnchor="end"
              fill="#e11d48"
              className="text-xl font-bold font-mono"
            >
              − {fmt(divMetrics.product)}
            </text>

            {/* Subtraction Line on the Left */}
            <line
              x1="22"
              y1="78"
              x2="104"
              y2="78"
              stroke={structColor}
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Bottom-Left: Remainder (باقی‌مانده) */}
            <text
              x="98"
              y="104"
              textAnchor="end"
              fill="#10b981"
              className="text-xl font-extrabold font-mono"
            >
              {fmt(divMetrics.remainder)}
            </text>
          </>
        )}
      </svg>
    );
  }

  // 5. Visual Formula (فرمول بصری کسر و رادیکال)
  if (w.title.includes('فرمول بصری') || w.title.includes('فرمول ریاضی')) {
    return (
      <svg viewBox="0 0 248 92" direction="ltr" className="w-64 h-24 overflow-visible select-none drop-shadow-xs">
        <rect x="4" y="4" width="240" height="84" rx="14" fill="rgba(255,255,255,0.9)" stroke={structColor} strokeOpacity="0.2" strokeWidth="1.5" />
        <rect x="14" y="12" width="90" height="68" rx="8" fill={`${innerColor}24`} />
        <text x="59" y="34" textAnchor="middle" fill={structColor} className="text-base font-bold font-mono">
          {fmt(w.persianText || 'x² + ۲x')}
        </text>
        <line x1="20" y1="45" x2="98" y2="45" stroke={structColor} strokeWidth="3" strokeLinecap="round" />
        <text x="59" y="68" textAnchor="middle" fill={structColor} className="text-base font-bold font-mono">
          {fmt('x − ۱')}
        </text>
        <text x="118" y="50" textAnchor="middle" fill={structColor} className="text-lg font-extrabold font-mono">
          +
        </text>
        <polyline
          points="134,48 141,48 148,66 158,20 232,20"
          fill="none"
          stroke={structColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text x="194" y="52" textAnchor="middle" fill={innerColor} className="text-base font-extrabold font-mono">
          {fmt('a² + b²')}
        </text>
      </svg>
    );
  }

  // 6. Fractions (کسر دایره‌ای و نواری)
  if (w.title.includes('کسر')) {
    const emptySliceFill = 'rgba(248, 250, 252, 0.92)';
    const totalSlices = Math.min(36, Math.max(1, den));

    if (w.title.includes('نواری')) {
      const cellW = 216 / totalSlices;
      return (
        <svg
          viewBox="0 0 280 68"
          data-testid="bare-fraction-bar-svg"
          className="w-72 h-18 overflow-visible select-none drop-shadow-xs"
        >
          {/* Base Frame */}
          <rect
            x="10"
            y="12"
            width="216"
            height="44"
            rx="8"
            fill={emptySliceFill}
            stroke={structColor}
            strokeWidth="3.2"
          />
          {/* Colored Inner Slices */}
          {Array.from({ length: totalSlices }).map((_, i) => (
            <rect
              key={`bar-fill-${i}`}
              x={10 + i * cellW}
              y={12}
              width={Math.max(2, cellW)}
              height={44}
              fill={i < num ? innerColor : 'transparent'}
            />
          ))}
          {/* Black Structural Partition Lines */}
          {Array.from({ length: Math.max(0, totalSlices - 1) }).map((_, i) => {
            const xLine = 10 + (i + 1) * cellW;
            return (
              <line
                key={`bar-div-${i}`}
                x1={xLine}
                y1={12}
                x2={xLine}
                y2={56}
                stroke={structColor}
                strokeWidth="2.8"
                strokeLinecap="round"
              />
            );
          })}
          {/* Crisp Black Outer Border */}
          <rect
            x="10"
            y="12"
            width="216"
            height="44"
            rx="8"
            fill="none"
            stroke={structColor}
            strokeWidth="3.2"
          />
          {/* Fraction Value Pill on Right */}
          <rect
            x="234"
            y="12"
            width="40"
            height="44"
            rx="8"
            fill="rgba(255,255,255,0.94)"
            stroke={structColor}
            strokeWidth="2"
          />
          <text x="254" y="30" textAnchor="middle" fill={innerColor} className="text-xs font-extrabold font-mono">
            {fmt(num)}
          </text>
          <line x1="242" y1="34" x2="266" y2="34" stroke={structColor} strokeWidth="2" />
          <text x="254" y="50" textAnchor="middle" fill={structColor} className="text-xs font-extrabold font-mono">
            {fmt(totalSlices)}
          </text>
        </svg>
      );
    }

    return (
      <svg
        viewBox="0 0 184 144"
        data-testid="bare-fraction-pizza-svg"
        className="w-44 h-36 overflow-visible select-none drop-shadow-xs"
      >
        {/* Base Circle */}
        <circle
          cx="70"
          cy="72"
          r="58"
          fill={totalSlices === 1 && num >= 1 ? innerColor : emptySliceFill}
          stroke={structColor}
          strokeWidth="3.2"
        />

        {/* Colored Inner Wedges */}
        {totalSlices > 1 &&
          Array.from({ length: totalSlices }).map((_, i) => {
            const startAngle = (i * 2 * Math.PI) / totalSlices - Math.PI / 2;
            const endAngle = ((i + 1) * 2 * Math.PI) / totalSlices - Math.PI / 2;
            const x1 = 70 + 58 * Math.cos(startAngle);
            const y1 = 72 + 58 * Math.sin(startAngle);
            const x2 = 70 + 58 * Math.cos(endAngle);
            const y2 = 72 + 58 * Math.sin(endAngle);
            const largeArc = (2 * Math.PI) / totalSlices > Math.PI ? 1 : 0;
            const d = `M 70 72 L ${x1} ${y1} A 58 58 0 ${largeArc} 1 ${x2} ${y2} Z`;
            return (
              <path
                key={`wedge-${i}`}
                d={d}
                fill={i < num ? innerColor : emptySliceFill}
                stroke="none"
              />
            );
          })}

        {/* Crisp Black Radial Division Lines */}
        {totalSlices > 1 &&
          Array.from({ length: totalSlices }).map((_, i) => {
            const angle = (i * 2 * Math.PI) / totalSlices - Math.PI / 2;
            const xEdge = 70 + 58 * Math.cos(angle);
            const yEdge = 72 + 58 * Math.sin(angle);
            return (
              <line
                key={`div-line-${i}`}
                x1="70"
                y1="72"
                x2={xEdge}
                y2={yEdge}
                stroke={structColor}
                strokeWidth="2.8"
                strokeLinecap="round"
              />
            );
          })}

        {/* Crisp Black Outer Ring & Center Hub */}
        <circle
          cx="70"
          cy="72"
          r="58"
          fill="none"
          stroke={structColor}
          strokeWidth="3.2"
        />
        {totalSlices > 1 && <circle cx="70" cy="72" r="3.5" fill={structColor} />}

        {/* Mathematical Fraction Badge next to the Circle */}
        <rect
          x="138"
          y="44"
          width="40"
          height="56"
          rx="10"
          fill="rgba(255,255,255,0.94)"
          stroke={structColor}
          strokeWidth="2.2"
        />
        <text x="158" y="66" textAnchor="middle" fill={innerColor} className="text-sm font-extrabold font-mono">
          {fmt(num)}
        </text>
        <line x1="146" y1="72" x2="170" y2="72" stroke={structColor} strokeWidth="2.2" strokeLinecap="round" />
        <text x="158" y="92" textAnchor="middle" fill={structColor} className="text-sm font-extrabold font-mono">
          {fmt(totalSlices)}
        </text>
      </svg>
    );
  }

  // 7. Place Value Cubes (مکعب ارزش مکانی: ده‌تایی و یکی)
  if (w.title.includes('مکعب ارزش مکانی') || w.title.includes('ارزش مکانی')) {
    const tenColor = innerColor;
    const oneColor = innerColor === '#f59e0b' ? '#38bdf8' : '#f59e0b';
    const tens = Math.min(9, Math.max(0, num));
    const ones = Math.min(20, Math.max(0, den));
    return (
      <svg viewBox="0 0 240 112" className="w-60 h-28 overflow-visible select-none drop-shadow-xs">
        <rect x="4" y="4" width="232" height="104" rx="12" fill="rgba(255,255,255,0.9)" stroke={structColor} strokeOpacity="0.2" strokeWidth="1.5" />
        {Array.from({ length: tens }).map((_, i) => (
          <g key={`ten-${i}`} transform={`translate(${14 + i * 15}, 12)`}>
            <rect width="11" height="70" fill={tenColor} stroke={structColor} strokeWidth="1.6" rx="2" />
            {Array.from({ length: 9 }).map((__, r) => (
              <line key={r} x1="0" y1={(r + 1) * 7} x2="11" y2={(r + 1) * 7} stroke={structColor} strokeWidth="1" />
            ))}
          </g>
        ))}
        {Array.from({ length: ones }).map((_, i) => {
          const col = Math.floor(i / 5);
          const row = i % 5;
          const startX = 24 + tens * 15;
          return (
            <rect
              key={`one-${i}`}
              x={startX + col * 14}
              y={68 - row * 13}
              width="11"
              height="11"
              rx="2"
              fill={oneColor}
              stroke={structColor}
              strokeWidth="1.6"
            />
          );
        })}
        <text x="120" y="100" textAnchor="middle" fill={structColor} className="text-[11px] font-extrabold font-mono">
          {fmt(tens)} ده‌تایی + {fmt(ones)} یکی = {fmt(tens * 10 + ones)}
        </text>
      </svg>
    );
  }

  // 8. Tally Marks (چوب‌خط)
  if (w.title.includes('چوب‌خط')) {
    const count = Math.max(1, Math.min(35, num));
    const groups = Math.floor(count / 5);
    const rem = count % 5;
    return (
      <svg viewBox="0 0 236 74" className="w-56 h-18 overflow-visible select-none drop-shadow-xs">
        <rect x="4" y="6" width="228" height="62" rx="12" fill="rgba(255,255,255,0.9)" stroke={structColor} strokeOpacity="0.2" strokeWidth="1.5" />
        {Array.from({ length: groups }).map((_, g) => {
          const gx = 16 + g * 36;
          return (
            <g key={`g-${g}`}>
              <rect x={gx - 4} y="14" width="26" height="42" rx="5" fill={`${innerColor}28`} />
              {[0, 1, 2, 3].map((l) => (
                <line
                  key={l}
                  x1={gx + l * 6}
                  y1="18"
                  x2={gx + l * 6}
                  y2="50"
                  stroke={structColor}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              ))}
              <line
                x1={gx - 3}
                y1="46"
                x2={gx + 21}
                y2="22"
                stroke="#e11d48"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
            </g>
          );
        })}
        {Array.from({ length: rem }).map((_, r) => {
          const rx = 16 + groups * 36 + r * 6;
          return (
            <line
              key={`r-${r}`}
              x1={rx}
              y1="18"
              x2={rx}
              y2="50"
              stroke={structColor}
              strokeWidth="3"
              strokeLinecap="round"
            />
          );
        })}
      </svg>
    );
  }

  // 9. Analog Clock with 1-12 Persian Numerals & 60 Minute Graduations
  if (w.title.includes('ساعت')) {
    const hAngle = (((num % 12) + den / 60) * 30 * Math.PI) / 180 - Math.PI / 2;
    const mAngle = ((den % 60) * 6 * Math.PI) / 180 - Math.PI / 2;
    const dialFill = `${innerColor}32`;

    return (
      <svg
        viewBox="0 0 180 198"
        data-testid="bare-graduated-clock-svg"
        className="w-44 h-48 overflow-visible select-none drop-shadow-xs"
      >
        {/* Outer Dial Ring */}
        <circle
          cx="90"
          cy="90"
          r="78"
          fill="rgba(255,255,255,0.95)"
          stroke={structColor}
          strokeWidth="3.5"
        />
        <circle
          cx="90"
          cy="90"
          r="73"
          fill={dialFill}
          stroke={structColor}
          strokeOpacity="0.25"
          strokeWidth="1"
        />

        {/* 60 Minute Graduations */}
        {Array.from({ length: 60 }).map((_, m) => {
          const a = (m * 6 * Math.PI) / 180 - Math.PI / 2;
          const isHourMark = m % 5 === 0;
          const rOuter = 76;
          const rInner = isHourMark ? 66 : 71;
          return (
            <line
              key={`min-tick-${m}`}
              x1={90 + rInner * Math.cos(a)}
              y1={90 + rInner * Math.sin(a)}
              x2={90 + rOuter * Math.cos(a)}
              y2={90 + rOuter * Math.sin(a)}
              stroke={structColor}
              strokeWidth={isHourMark ? 2.6 : 1.2}
              strokeLinecap="round"
            />
          );
        })}

        {/* 12 Persian Hour Numbers + Outer 5-Minute Labels */}
        {Array.from({ length: 12 }).map((_, i) => {
          const hourNum = i + 1;
          const minNum = hourNum * 5;
          const a = (hourNum * 30 * Math.PI) / 180 - Math.PI / 2;
          const rHourText = 54;
          const rMinText = 86;
          return (
            <g key={`hour-num-${hourNum}`}>
              <text
                x={90 + rHourText * Math.cos(a)}
                y={90 + rHourText * Math.sin(a) + 4}
                textAnchor="middle"
                fill={structColor}
                className="text-xs font-extrabold font-mono"
              >
                {fmt(hourNum)}
              </text>
              <text
                x={90 + rMinText * Math.cos(a)}
                y={90 + rMinText * Math.sin(a) + 3}
                textAnchor="middle"
                fill={structColor}
                className="text-[8px] font-bold font-mono opacity-75"
              >
                {fmt(minNum)}
              </text>
            </g>
          );
        })}

        {/* Hour Hand (عقربه ساعت‌شمار) */}
        <line
          x1="90"
          y1="90"
          x2={90 + 38 * Math.cos(hAngle)}
          y2={90 + 38 * Math.sin(hAngle)}
          stroke="#e11d48"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Minute Hand (عقربه دقیقه‌شمار) */}
        <line
          x1="90"
          y1="90"
          x2={90 + 60 * Math.cos(mAngle)}
          y2={90 + 60 * Math.sin(mAngle)}
          stroke={structColor}
          strokeWidth="3.4"
          strokeLinecap="round"
        />

        {/* Center Pivot Pin */}
        <circle cx="90" cy="90" r="5" fill="#e11d48" stroke={structColor} strokeWidth="1.8" />

        {/* Digital Readout Pill at Bottom */}
        <rect
          x="52"
          y="174"
          width="76"
          height="22"
          rx="8"
          fill="rgba(255,255,255,0.95)"
          stroke={structColor}
          strokeWidth="1.8"
        />
        <text
          x="90"
          y="189"
          textAnchor="middle"
          fill={structColor}
          className="text-xs font-extrabold font-mono"
        >
          {fmt(String(num).padStart(2, '0'))}:{fmt(String(den).padStart(2, '0'))}
        </text>
      </svg>
    );
  }

  // 10. Balance Scale (ترازوی دوکفه‌ای معادله جبری: ۲x + ۳ = ۱۱)
  if (w.title.includes('ترازو')) {
    return (
      <svg
        viewBox="0 0 240 132"
        data-testid="bare-balance-scale-svg"
        className="w-60 h-32 overflow-visible select-none drop-shadow-xs"
      >
        <rect x="4" y="4" width="232" height="124" rx="14" fill="rgba(255,255,255,0.9)" stroke={structColor} strokeOpacity="0.18" strokeWidth="1.5" />
        {/* Base & Fulcrum Pillar */}
        <rect x="78" y="108" width="84" height="12" rx="5" fill={structColor} />
        <polygon points="104,108 136,108 120,56" fill={fillTint} stroke={structColor} strokeWidth="2.8" strokeLinejoin="round" />
        {/* Equilibrium Pointer */}
        <line x1="120" y1="56" x2="120" y2="38" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
        {/* Horizontal Balance Beam */}
        <line x1="34" y1="56" x2="206" y2="56" stroke={structColor} strokeWidth="3.8" strokeLinecap="round" />
        <circle cx="120" cy="56" r="5" fill="#f59e0b" stroke={structColor} strokeWidth="2" />

        {/* Left Hanger & Pan (2x + 3) */}
        <line x1="42" y1="56" x2="32" y2="84" stroke={structColor} strokeWidth="1.8" />
        <line x1="70" y1="56" x2="80" y2="84" stroke={structColor} strokeWidth="1.8" />
        <path d="M 22 84 Q 56 96 90 84 Z" fill={innerColor} stroke={structColor} strokeWidth="2.4" />
        {/* Left Weights: 2x block and +3 block */}
        <rect x="28" y="64" width="30" height="20" rx="4" fill={innerColor} stroke={structColor} strokeWidth="2" />
        <text x="43" y="78" textAnchor="middle" fill="#fff" className="text-[11px] font-extrabold font-mono">
          {fmt('2x')}
        </text>
        <rect x="61" y="67" width="22" height="17" rx="4" fill="#f59e0b" stroke={structColor} strokeWidth="2" />
        <text x="72" y="79" textAnchor="middle" fill={structColor} className="text-[10px] font-extrabold font-mono">
          +{fmt(3)}
        </text>

        {/* Right Hanger & Pan (11) */}
        <line x1="170" y1="56" x2="160" y2="84" stroke={structColor} strokeWidth="1.8" />
        <line x1="198" y1="56" x2="208" y2="84" stroke={structColor} strokeWidth="1.8" />
        <path d="M 150 84 Q 184 96 218 84 Z" fill="#f59e0b" stroke={structColor} strokeWidth="2.4" />
        {/* Right Weight: 11 block */}
        <rect x="164" y="62" width="40" height="22" rx="5" fill="#10b981" stroke={structColor} strokeWidth="2" />
        <text x="184" y="77" textAnchor="middle" fill="#fff" className="text-xs font-extrabold font-mono">
          {fmt(11)}
        </text>

        {/* Equation Label at Top */}
        <text x="120" y="24" textAnchor="middle" fill={structColor} className="text-xs font-extrabold font-mono">
          {fmt(w.summary || '۲x + ۳ = ۱۱')}
        </text>
      </svg>
    );
  }

  // 11. Cube Net (گسترده مکعب)
  if (w.title.includes('گسترده مکعب')) {
    return (
      <svg viewBox="0 0 190 146" className="w-48 h-36 overflow-visible select-none drop-shadow-xs">
        {[
          { x: 60, y: 10, n: '۱' },
          { x: 20, y: 50, n: '۲' },
          { x: 60, y: 50, n: '۳' },
          { x: 100, y: 50, n: '۴' },
          { x: 140, y: 50, n: '۵' },
          { x: 60, y: 90, n: '۶' },
        ].map((sq, i) => (
          <g key={i}>
            <rect
              x={sq.x}
              y={sq.y}
              width="40"
              height="40"
              rx="4"
              fill={i % 2 === 0 ? fillTint : 'rgba(245,158,11,0.32)'}
              stroke={structColor}
              strokeWidth="2.5"
            />
            <text
              x={sq.x + 20}
              y={sq.y + 25}
              textAnchor="middle"
              fill={structColor}
              className="text-xs font-extrabold font-mono"
            >
              {fmt(sq.n)}
            </text>
          </g>
        ))}
      </svg>
    );
  }

  // 12. Venn Diagram (نمودار ون مجموعه‌ها A, B, C)
  if (w.title.includes('ون')) {
    return (
      <svg
        viewBox="0 0 220 138"
        data-testid="bare-venn-diagram-svg"
        className="w-56 h-34 overflow-visible select-none drop-shadow-xs"
      >
        <rect x="4" y="4" width="212" height="130" rx="14" fill="rgba(255,255,255,0.9)" stroke={structColor} strokeOpacity="0.18" strokeWidth="1.5" />
        <circle cx="84" cy="54" r="34" fill={`${innerColor}48`} stroke={structColor} strokeWidth="2.6" />
        <circle cx="132" cy="54" r="34" fill="rgba(16,185,129,0.35)" stroke={structColor} strokeWidth="2.6" />
        <circle cx="108" cy="88" r="32" fill="rgba(245,158,11,0.35)" stroke={structColor} strokeWidth="2.6" />
        <text x="64" y="42" textAnchor="middle" fill={structColor} className="text-xs font-extrabold font-mono">A</text>
        <text x="152" y="42" textAnchor="middle" fill={structColor} className="text-xs font-extrabold font-mono">B</text>
        <text x="108" y="108" textAnchor="middle" fill={structColor} className="text-xs font-extrabold font-mono">C</text>
        <text x="108" y="20" textAnchor="middle" fill={structColor} className="text-[11px] font-extrabold font-mono">
          {w.summary || '(A ∪ B) − C'}
        </text>
      </svg>
    );
  }

  // 13. Inclined Plane / Free Body Diagram (سطح شیب‌دار و دیاگرام جسم آزاد FBD)
  if (w.title.includes('سطح شیب‌دار') || w.title.includes('FBD') || w.title.includes('جسم آزاد')) {
    return (
      <svg
        viewBox="0 0 236 132"
        data-testid="bare-inclined-plane-svg"
        className="w-60 h-32 overflow-visible select-none drop-shadow-xs"
      >
        <rect x="4" y="4" width="228" height="124" rx="14" fill="rgba(255,255,255,0.9)" stroke={structColor} strokeOpacity="0.18" strokeWidth="1.5" />
        {/* Inclined Ramp Triangle */}
        <polygon points="24,112 204,112 24,32" fill={fillTint} stroke={structColor} strokeWidth="2.8" strokeLinejoin="round" />
        {/* Angle Arc θ at Bottom Right */}
        <path d="M 164 112 A 40 40 0 0 0 168 96" fill="none" stroke={structColor} strokeWidth="2" />
        <text x="152" y="106" textAnchor="middle" fill={structColor} className="text-[11px] font-extrabold font-mono">
          θ=۳۰°
        </text>
        {/* Mass Block m on Ramp */}
        <g transform="translate(96, 54) rotate(24)">
          <rect
            x="-20"
            y="-22"
            width="40"
            height="24"
            rx="4"
            fill={innerColor}
            stroke={structColor}
            strokeWidth="2.4"
          />
          <text x="0" y="-6" textAnchor="middle" fill="#fff" className="text-xs font-extrabold font-mono">
            m
          </text>
        </g>
        {/* Force Vectors from Center of Mass (100, 45) */}
        {/* Weight mg (straight down) */}
        <line x1="100" y1="45" x2="100" y2="96" stroke="#ef4444" strokeWidth="2.8" strokeLinecap="round" />
        <polyline points="95,89 100,97 105,89" fill="none" stroke="#ef4444" strokeWidth="2.6" />
        <text x="114" y="94" fill="#ef4444" className="text-[11px] font-extrabold font-mono">mg</text>

        {/* Normal Force N (perpendicular to ramp) */}
        <line x1="100" y1="45" x2="118" y2="8" stroke="#10b981" strokeWidth="2.8" strokeLinecap="round" />
        <polyline points="111,12 118,7 120,16" fill="none" stroke="#10b981" strokeWidth="2.6" />
        <text x="128" y="16" fill="#10b981" className="text-[11px] font-extrabold font-mono">N</text>

        {/* Friction f_k (up along the ramp) */}
        <line x1="100" y1="45" x2="58" y2="26" stroke="#f59e0b" strokeWidth="2.8" strokeLinecap="round" />
        <polyline points="66,24 57,26 62,33" fill="none" stroke="#f59e0b" strokeWidth="2.6" />
        <text x="48" y="22" fill="#d97706" className="text-[11px] font-extrabold font-mono">f</text>
      </svg>
    );
  }

  // 14. P-V Thermodynamics Diagram (MUST be checked BEFORE Manometer because title can contain both!)
  if (w.title.includes('ترمودینامیک') || w.title.includes('P-V')) {
    return (
      <svg viewBox="0 0 220 130" className="w-56 h-32 overflow-visible select-none drop-shadow-xs">
        <rect x="4" y="4" width="212" height="122" rx="14" fill="rgba(255,255,255,0.9)" stroke={structColor} strokeOpacity="0.18" strokeWidth="1.5" />
        {/* Shaded Area under P-V Curve (Work W) */}
        <path d="M 48 32 Q 95 72 176 84 L 176 104 L 48 104 Z" fill={fillTint} />
        {/* P and V Axes */}
        <line x1="32" y1="104" x2="196" y2="104" stroke={structColor} strokeWidth="2.8" strokeLinecap="round" />
        <line x1="32" y1="16" x2="32" y2="104" stroke={structColor} strokeWidth="2.8" strokeLinecap="round" />
        <text x="20" y="24" fill={structColor} className="text-xs font-extrabold font-mono">P</text>
        <text x="202" y="108" fill={structColor} className="text-xs font-extrabold font-mono">V</text>
        {/* Isotherm Curve */}
        <path d="M 48 32 Q 95 72 176 84" fill="none" stroke={innerColor} strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="48" cy="32" r="4.5" fill="#ef4444" stroke={structColor} strokeWidth="1.5" />
        <circle cx="176" cy="84" r="4.5" fill="#10b981" stroke={structColor} strokeWidth="1.5" />
        <text x="112" y="96" textAnchor="middle" fill={structColor} className="text-[11px] font-extrabold font-mono">
          W = ∫ P dV
        </text>
      </svg>
    );
  }

  // 15. U-Tube Manometer (لوله U / مانومتر)
  if (w.title.includes('لوله U') || w.title.includes('مانومتر')) {
    return (
      <svg viewBox="0 0 180 136" className="w-44 h-34 overflow-visible select-none drop-shadow-xs">
        <rect x="4" y="4" width="172" height="128" rx="14" fill="rgba(255,255,255,0.9)" stroke={structColor} strokeOpacity="0.18" strokeWidth="1.5" />
        <path
          d="M 52 18 L 52 92 Q 52 116 90 116 Q 128 116 128 92 L 128 18"
          fill="none"
          stroke={structColor}
          strokeWidth="16"
          strokeLinecap="round"
        />
        <path
          d="M 52 18 L 52 92 Q 52 116 90 116 Q 128 116 128 92 L 128 18"
          fill="none"
          stroke="#f8fafc"
          strokeWidth="11"
          strokeLinecap="round"
        />
        <path
          d="M 52 46 L 52 92 Q 52 116 90 116 Q 128 116 128 92 L 128 66"
          fill="none"
          stroke={innerColor}
          strokeWidth="11"
        />
        <line x1="28" y1="66" x2="152" y2="66" stroke="#ef4444" strokeWidth="1.8" strokeDasharray="4 3" />
        <text x="34" y="42" fill={structColor} className="text-[10px] font-extrabold font-mono">h₁</text>
        <text x="144" y="62" fill={structColor} className="text-[10px] font-extrabold font-mono">h₂</text>
      </svg>
    );
  }

  // 16. Snell's Law Refraction (شکست نور / اسنل)
  if (w.title.includes('شکست نور') || w.title.includes('اسنل')) {
    return (
      <svg viewBox="0 0 210 128" className="w-52 h-32 overflow-visible select-none drop-shadow-xs">
        <rect x="4" y="4" width="202" height="120" rx="14" fill="rgba(255,255,255,0.9)" stroke={structColor} strokeOpacity="0.18" strokeWidth="1.5" />
        <rect x="14" y="64" width="182" height="52" rx="8" fill={fillTint} />
        <line x1="14" y1="64" x2="196" y2="64" stroke={structColor} strokeWidth="2.8" />
        <line x1="105" y1="12" x2="105" y2="116" stroke={structColor} strokeWidth="1.8" strokeDasharray="4 3" />
        {/* Incident Ray */}
        <line x1="42" y1="18" x2="105" y2="64" stroke="#f59e0b" strokeWidth="3.2" strokeLinecap="round" />
        {/* Refracted Ray */}
        <line x1="105" y1="64" x2="148" y2="112" stroke={innerColor} strokeWidth="3.2" strokeLinecap="round" />
        <text x="88" y="42" fill={structColor} className="text-[11px] font-extrabold font-mono">θ₁</text>
        <text x="120" y="96" fill={structColor} className="text-[11px] font-extrabold font-mono">θ₂</text>
        <text x="28" y="56" fill={structColor} className="text-[10px] font-bold font-mono">n₁</text>
        <text x="28" y="82" fill={structColor} className="text-[10px] font-bold font-mono">n₂</text>
      </svg>
    );
  }

  // 17. Bohr Atom (اتم بور)
  if (w.title.includes('بور') || w.title.includes('اتم')) {
    return (
      <svg viewBox="0 0 150 150" className="w-36 h-36 overflow-visible select-none drop-shadow-xs">
        <circle cx="75" cy="75" r="64" fill="rgba(255,255,255,0.9)" stroke={structColor} strokeWidth="2" strokeDasharray="5 3" />
        <circle cx="75" cy="75" r="46" fill={fillTint} stroke={structColor} strokeWidth="2.2" />
        <circle cx="75" cy="75" r="26" fill="rgba(255,255,255,0.8)" stroke={structColor} strokeWidth="2.4" />
        {/* Nucleus */}
        <circle cx="75" cy="75" r="8" fill="#ef4444" stroke={structColor} strokeWidth="1.8" />
        {/* Orbiting Electron & Transition */}
        <circle cx="75" cy="11" r="5.5" fill={innerColor} stroke={structColor} strokeWidth="1.8" />
        <line x1="75" y1="17" x2="75" y2="46" stroke="#f59e0b" strokeWidth="2.2" strokeDasharray="3 2" />
        <text x="112" y="34" fill="#ef4444" className="text-[11px] font-extrabold font-mono">hν</text>
      </svg>
    );
  }

  // 18. Magnetic Field (میدان مغناطیسی درون‌سو ⊗ و برون‌سو ⊙)
  if (w.title.includes('میدان مغناطیسی') || w.title.includes('مغناطیسی')) {
    return (
      <svg viewBox="0 0 210 120" className="w-52 h-30 overflow-visible select-none drop-shadow-xs">
        <rect x="6" y="6" width="198" height="108" rx="14" fill="rgba(255,255,255,0.9)" stroke={structColor} strokeWidth="2.2" />
        {[40, 80, 120, 160].map((cx) =>
          [34, 78].map((cy) => (
            <g key={`${cx}-${cy}`}>
              <circle cx={cx} cy={cy} r="10" fill={fillTint} stroke={structColor} strokeWidth="1.8" />
              <text x={cx} y={cy + 4} textAnchor="middle" fill={structColor} className="text-xs font-extrabold font-mono">
                ⊗
              </text>
            </g>
          ))
        )}
        {/* Velocity v & Force F vectors */}
        <line x1="45" y1="56" x2="145" y2="56" stroke={innerColor} strokeWidth="3.2" strokeLinecap="round" />
        <text x="155" y="60" fill={innerColor} className="text-xs font-extrabold font-mono">v</text>
        <line x1="95" y1="56" x2="95" y2="16" stroke="#ef4444" strokeWidth="3.2" strokeLinecap="round" />
        <text x="106" y="24" fill="#ef4444" className="text-xs font-extrabold font-mono">F</text>
      </svg>
    );
  }

  // 19. Electric Circuit (مدار الکتریکی: باتری، مقاومت، لامپ و آمپرسنج)
  if (w.title.includes('مدار')) {
    return (
      <svg
        viewBox="0 0 228 128"
        data-testid="bare-electric-circuit-svg"
        className="w-56 h-32 overflow-visible select-none drop-shadow-xs"
      >
        <rect x="4" y="4" width="220" height="120" rx="14" fill="rgba(255,255,255,0.92)" stroke={structColor} strokeOpacity="0.18" strokeWidth="1.5" />
        {/* Main Wire Loop */}
        <rect x="28" y="28" width="172" height="72" fill={fillTint} stroke={structColor} strokeWidth="3" rx="8" />
        {/* Top Resistor Zigzag (R) */}
        <rect x="74" y="18" width="64" height="20" fill="rgba(255,255,255,0.95)" />
        <polyline
          points="74,28 82,18 92,38 102,18 112,38 122,18 130,38 138,28"
          fill="none"
          stroke={structColor}
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text x="106" y="14" textAnchor="middle" fill={structColor} className="text-[11px] font-extrabold font-mono">
          R = ۴Ω
        </text>

        {/* Right Side Lamp Bulb */}
        <circle cx="200" cy="64" r="13" fill="#fef08a" stroke={structColor} strokeWidth="2.5" />
        <path d="M 194 58 L 206 70 M 206 58 L 194 70" stroke="#d97706" strokeWidth="2" />

        {/* Bottom Battery (+ / - 12V) */}
        <rect x="94" y="88" width="26" height="24" fill="rgba(255,255,255,0.95)" />
        <line x1="101" y1="86" x2="101" y2="114" stroke="#ef4444" strokeWidth="3.8" strokeLinecap="round" />
        <line x1="113" y1="92" x2="113" y2="108" stroke={structColor} strokeWidth="3.2" strokeLinecap="round" />
        <text x="90" y="94" fill="#ef4444" className="text-[10px] font-extrabold font-mono">+</text>
        <text x="107" y="82" textAnchor="middle" fill={innerColor} className="text-[11px] font-extrabold font-mono">
          {fmt(w.summary || '۱۲V')}
        </text>
      </svg>
    );
  }

  // 20. Periodic Table Element Card (کارت عنصر جدول تناوبی)
  if (w.title.includes('کارت عنصر') || w.title.includes('عنصر')) {
    const symMatch = w.title.match(/\(([A-Za-z]{1,2})/);
    const sym = symMatch ? symMatch[1] : 'Fe';
    return (
      <svg viewBox="0 0 140 156" className="w-36 h-40 overflow-visible select-none drop-shadow-xs">
        <rect
          x="10"
          y="8"
          width="120"
          height="140"
          rx="16"
          fill="rgba(255,255,255,0.95)"
          stroke={structColor}
          strokeWidth="3.2"
        />
        <rect x="16" y="14" width="108" height="128" rx="12" fill={fillTint} />
        <text x="28" y="36" fill={structColor} className="text-xs font-extrabold font-mono">
          Z={fmt(num)}
        </text>
        <text x="70" y="86" textAnchor="middle" fill={structColor} className="text-4xl font-extrabold font-mono">
          {sym}
        </text>
        <text x="70" y="114" textAnchor="middle" fill={structColor} className="text-xs font-extrabold">
          {w.title.replace(/کارت عنصر|\(.*\)/g, '').trim() || 'عنصر شیمیایی'}
        </text>
        <text x="70" y="132" textAnchor="middle" fill={innerColor} className="text-[10px] font-bold font-mono">
          {w.summary.split('|')[0]?.replace('آرایش الکترونی:', '').trim() || '1s² 2s² 2p⁶'}
        </text>
      </svg>
    );
  }

  // 21. VSEPR Molecule (هندسه مولکولی VSEPR)
  if (w.title.includes('VSEPR') || w.title.includes('مولکول')) {
    return (
      <svg viewBox="0 0 180 124" className="w-44 h-30 overflow-visible select-none drop-shadow-xs">
        <rect x="4" y="4" width="172" height="116" rx="14" fill="rgba(255,255,255,0.9)" stroke={structColor} strokeOpacity="0.18" strokeWidth="1.5" />
        <line x1="90" y1="38" x2="40" y2="92" stroke={structColor} strokeWidth="4.2" strokeLinecap="round" />
        <line x1="90" y1="38" x2="140" y2="92" stroke={structColor} strokeWidth="4.2" strokeLinecap="round" />
        <path d="M 68 62 A 32 32 0 0 0 112 62" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 2" />
        <text x="90" y="78" textAnchor="middle" fill="#ef4444" className="text-[10px] font-extrabold font-mono">
          ۱۰۴.۵°
        </text>
        <circle cx="90" cy="38" r="18" fill={innerColor} stroke={structColor} strokeWidth="2.6" />
        <circle cx="40" cy="92" r="13" fill="#f59e0b" stroke={structColor} strokeWidth="2.4" />
        <circle cx="140" cy="92" r="13" fill="#f59e0b" stroke={structColor} strokeWidth="2.4" />
      </svg>
    );
  }

  // 22. Organic Carbon Chain (زنجیره کربنی آلی)
  if (w.title.includes('زنجیره') || w.title.includes('آلی')) {
    const count = Math.max(3, Math.min(8, num));
    const pts = Array.from({ length: count }).map((_, i) => ({
      x: 24 + i * 28,
      y: i % 2 === 0 ? 64 : 30,
    }));
    return (
      <svg viewBox="0 0 230 92" className="w-56 h-24 overflow-visible select-none drop-shadow-xs">
        <rect x="4" y="4" width="222" height="84" rx="14" fill="rgba(255,255,255,0.9)" stroke={structColor} strokeOpacity="0.18" strokeWidth="1.5" />
        <polyline
          fill="none"
          stroke={structColor}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
        />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="6.5" fill={innerColor} stroke={structColor} strokeWidth="2" />
            <text x={p.x} y={p.y + (i % 2 === 0 ? 18 : -10)} textAnchor="middle" fill={structColor} className="text-[9px] font-extrabold font-mono">
              C{fmt(i + 1)}
            </text>
          </g>
        ))}
      </svg>
    );
  }

  // 23. Acid-Base Titration (تیتراسیون اسید و باز)
  if (w.title.includes('تیتراسیون')) {
    return (
      <svg viewBox="0 0 160 150" className="w-40 h-36 overflow-visible select-none drop-shadow-xs">
        <rect x="4" y="4" width="152" height="142" rx="14" fill="rgba(255,255,255,0.9)" stroke={structColor} strokeOpacity="0.18" strokeWidth="1.5" />
        {/* Burette at Top */}
        <rect x="74" y="12" width="12" height="48" fill={fillTint} stroke={structColor} strokeWidth="2.2" />
        <line x1="68" y1="54" x2="92" y2="54" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
        {/* Falling Drop */}
        <circle cx="80" cy="68" r="3" fill={innerColor} />
        {/* Erlenmeyer Flask at Bottom */}
        <polygon
          points="70,76 90,76 112,130 48,130"
          fill={fillTint}
          stroke={structColor}
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        <text x="80" y="120" textAnchor="middle" fill={structColor} className="text-xs font-extrabold font-mono">
          {fmt(w.summary || 'pH = ۷')}
        </text>
      </svg>
    );
  }

  // 24. Galvanic Cell (سلول گالوانی)
  if (w.title.includes('گالوانی')) {
    return (
      <svg viewBox="0 0 210 124" className="w-52 h-30 overflow-visible select-none drop-shadow-xs">
        <rect x="4" y="4" width="202" height="116" rx="14" fill="rgba(255,255,255,0.9)" stroke={structColor} strokeOpacity="0.18" strokeWidth="1.5" />
        <rect x="22" y="44" width="60" height="66" rx="6" fill={fillTint} stroke={structColor} strokeWidth="2.5" />
        <rect x="128" y="44" width="60" height="66" rx="6" fill="rgba(16,185,129,0.28)" stroke={structColor} strokeWidth="2.5" />
        {/* Salt Bridge */}
        <path d="M 68 56 L 68 28 L 142 28 L 142 56" fill="none" stroke={structColor} strokeWidth="5" strokeLinecap="round" />
        {/* Electrodes */}
        <rect x="34" y="30" width="14" height="62" fill="#94a3b8" stroke={structColor} strokeWidth="1.8" />
        <rect x="162" y="30" width="14" height="62" fill="#f59e0b" stroke={structColor} strokeWidth="1.8" />
        <text x="105" y="20" textAnchor="middle" fill={structColor} className="text-[11px] font-extrabold font-mono">
          {fmt(w.summary || 'ΔE° = +۱.۱۰V')}
        </text>
      </svg>
    );
  }

  // 25. Haber Process / Chemical Reaction (واکنش هابر)
  if (w.title.includes('هابر') || w.title.includes('واکنش')) {
    return (
      <svg viewBox="0 0 230 96" className="w-56 h-24 overflow-visible select-none drop-shadow-xs">
        <rect x="4" y="4" width="222" height="88" rx="14" fill="rgba(255,255,255,0.92)" stroke={structColor} strokeWidth="2" />
        <circle cx="36" cy="42" r="10" fill={innerColor} stroke={structColor} strokeWidth="2" />
        <circle cx="52" cy="42" r="10" fill={innerColor} stroke={structColor} strokeWidth="2" />
        <text x="74" y="47" textAnchor="middle" fill={structColor} className="text-sm font-extrabold font-mono">+</text>
        <circle cx="96" cy="36" r="7" fill="#f59e0b" stroke={structColor} strokeWidth="1.8" />
        <circle cx="108" cy="46" r="7" fill="#f59e0b" stroke={structColor} strokeWidth="1.8" />
        <text x="134" y="47" textAnchor="middle" fill={structColor} className="text-base font-extrabold font-mono">⇌</text>
        <circle cx="176" cy="42" r="11" fill="#10b981" stroke={structColor} strokeWidth="2" />
        <circle cx="164" cy="54" r="6" fill="#f59e0b" stroke={structColor} strokeWidth="1.6" />
        <circle cx="188" cy="54" r="6" fill="#f59e0b" stroke={structColor} strokeWidth="1.6" />
        <text x="115" y="78" textAnchor="middle" fill={structColor} className="text-xs font-extrabold font-mono">
          {w.summary || 'N₂ + 3H₂ ⇌ 2NH₃'}
        </text>
      </svg>
    );
  }

  // 26. Punnett Square (مربع پانت ژنتیک)
  if (w.title.includes('پانت') || w.title.includes('ژنتیک')) {
    return (
      <svg
        viewBox="0 0 184 128"
        data-testid="bare-punnett-square-svg"
        className="w-44 h-32 overflow-visible select-none drop-shadow-xs"
      >
        <rect x="4" y="4" width="176" height="120" rx="14" fill="rgba(255,255,255,0.92)" stroke={structColor} strokeOpacity="0.18" strokeWidth="1.5" />
        {/* Header Gamete Labels */}
        <text x="74" y="22" textAnchor="middle" fill={innerColor} className="text-xs font-extrabold font-mono">A</text>
        <text x="134" y="22" textAnchor="middle" fill={innerColor} className="text-xs font-extrabold font-mono">a</text>
        <text x="26" y="54" textAnchor="middle" fill="#e11d48" className="text-xs font-extrabold font-mono">A</text>
        <text x="26" y="96" textAnchor="middle" fill="#e11d48" className="text-xs font-extrabold font-mono">a</text>
        {/* 4 Offspring Boxes */}
        <rect x="44" y="28" width="60" height="42" rx="4" fill={fillTint} stroke={structColor} strokeWidth="2.4" />
        <rect x="104" y="28" width="60" height="42" rx="4" fill={fillTint} stroke={structColor} strokeWidth="2.4" />
        <rect x="44" y="70" width="60" height="42" rx="4" fill={fillTint} stroke={structColor} strokeWidth="2.4" />
        <rect x="104" y="70" width="60" height="42" rx="4" fill="rgba(245,158,11,0.35)" stroke={structColor} strokeWidth="2.4" />
        <text x="74" y="54" textAnchor="middle" fill={structColor} className="text-sm font-mono font-extrabold">AA</text>
        <text x="134" y="54" textAnchor="middle" fill={structColor} className="text-sm font-mono font-extrabold">Aa</text>
        <text x="74" y="96" textAnchor="middle" fill={structColor} className="text-sm font-mono font-extrabold">Aa</text>
        <text x="134" y="96" textAnchor="middle" fill={structColor} className="text-sm font-mono font-extrabold">aa</text>
      </svg>
    );
  }

  // 27. Heart Anatomy (آناتومی قلب انسان)
  if (w.title.includes('قلب') || w.title.includes('آناتومی')) {
    return (
      <svg
        viewBox="0 0 156 144"
        data-testid="bare-heart-anatomy-svg"
        className="w-38 h-36 overflow-visible select-none drop-shadow-xs"
      >
        <rect x="4" y="4" width="148" height="136" rx="14" fill="rgba(255,255,255,0.9)" stroke={structColor} strokeOpacity="0.18" strokeWidth="1.5" />
        {/* Superior Vena Cava & Aorta */}
        <path d="M 56 32 L 56 14" stroke="#0284c7" strokeWidth="8" strokeLinecap="round" />
        <path d="M 88 32 C 88 12 108 12 108 26" fill="none" stroke="#e11d48" strokeWidth="8" strokeLinecap="round" />
        {/* Main Heart Shape */}
        <path
          d="M 78 124 C 28 92 22 48 50 32 C 64 24 78 36 78 46 C 78 36 92 24 106 32 C 134 48 128 92 78 124 Z"
          fill={fillTint}
          stroke={structColor}
          strokeWidth="3.2"
        />
        {/* Interventricular Septum & Valve Dividers */}
        <line x1="78" y1="44" x2="78" y2="118" stroke={structColor} strokeWidth="2.6" />
        <line x1="38" y1="68" x2="118" y2="68" stroke={structColor} strokeWidth="2.2" strokeDasharray="4 2" />
        <text x="58" y="60" textAnchor="middle" fill="#0369a1" className="text-[9px] font-extrabold">دهلیز R</text>
        <text x="98" y="60" textAnchor="middle" fill="#be123c" className="text-[9px] font-extrabold">دهلیز L</text>
        <text x="60" y="90" textAnchor="middle" fill="#0369a1" className="text-[9px] font-extrabold">بطن R</text>
        <text x="96" y="90" textAnchor="middle" fill="#be123c" className="text-[9px] font-extrabold">بطن L</text>
      </svg>
    );
  }

  // 28. Persian Prosody / Arabic Grammar / Language Flashcard (ادبیات، عروض، عربی و زبان)
  if (
    w.title.includes('عروضی') ||
    w.title.includes('اعراب') ||
    w.title.includes('عربی') ||
    w.title.includes('فلش‌کارت')
  ) {
    return (
      <svg viewBox="0 0 236 96" className="w-60 h-24 overflow-visible select-none drop-shadow-xs">
        <rect
          x="6"
          y="6"
          width="224"
          height="84"
          rx="14"
          fill="rgba(255,255,255,0.95)"
          stroke={structColor}
          strokeWidth="2.6"
        />
        <rect x="12" y="12" width="212" height="32" rx="8" fill={fillTint} />
        <text x="118" y="33" textAnchor="middle" fill={structColor} className="text-xs font-extrabold">
          {w.title}
        </text>
        <text x="118" y="68" textAnchor="middle" fill={innerColor} className="text-sm font-extrabold font-mono">
          {w.summary}
        </text>
      </svg>
    );
  }

  // 29. Supply & Demand Curves (عرضه و تقاضا: checked BEFORE 'حساب T' because combined title contains both!)
  if (w.title.includes('عرضه و تقاضا')) {
    return (
      <svg viewBox="0 0 210 126" className="w-52 h-32 overflow-visible select-none drop-shadow-xs">
        <rect x="4" y="4" width="202" height="118" rx="14" fill="rgba(255,255,255,0.9)" stroke={structColor} strokeOpacity="0.18" strokeWidth="1.5" />
        <line x1="28" y1="102" x2="188" y2="102" stroke={structColor} strokeWidth="2.8" />
        <line x1="28" y1="16" x2="28" y2="102" stroke={structColor} strokeWidth="2.8" />
        {/* Demand D */}
        <line x1="40" y1="24" x2="174" y2="92" stroke={innerColor} strokeWidth="3.2" strokeLinecap="round" />
        <text x="182" y="94" fill={innerColor} className="text-xs font-extrabold font-mono">D</text>
        {/* Supply S */}
        <line x1="40" y1="92" x2="174" y2="24" stroke="#10b981" strokeWidth="3.2" strokeLinecap="round" />
        <text x="182" y="28" fill="#10b981" className="text-xs font-extrabold font-mono">S</text>
        {/* Equilibrium E */}
        <circle cx="107" cy="58" r="5.5" fill="#f59e0b" stroke={structColor} strokeWidth="2" />
      </svg>
    );
  }

  // 30. Accounting T-Account (جدول حساب T)
  if (w.title.includes('حساب T')) {
    return (
      <svg viewBox="0 0 196 112" className="w-48 h-28 overflow-visible select-none drop-shadow-xs">
        <rect x="6" y="6" width="184" height="100" rx="14" fill="rgba(255,255,255,0.92)" stroke={structColor} strokeOpacity="0.2" strokeWidth="1.5" />
        <rect x="18" y="28" width="160" height="68" rx="6" fill={fillTint} />
        <line x1="18" y1="28" x2="178" y2="28" stroke={structColor} strokeWidth="3.5" strokeLinecap="round" />
        <line x1="98" y1="28" x2="98" y2="96" stroke={structColor} strokeWidth="3.5" strokeLinecap="round" />
        <text x="138" y="22" textAnchor="middle" fill={structColor} className="text-[10px] font-extrabold">بدهکار</text>
        <text x="58" y="22" textAnchor="middle" fill={structColor} className="text-[10px] font-extrabold">بستانکار</text>
        <text x="138" y="66" textAnchor="middle" fill={structColor} className="text-sm font-mono font-extrabold">
          {fmt(num)}
        </text>
        <text x="58" y="66" textAnchor="middle" fill="#e11d48" className="text-sm font-mono font-extrabold">
          {fmt(den)}
        </text>
      </svg>
    );
  }

  // 31. Standing Wave (موج ایستاده)
  if (w.title.includes('موج')) {
    return (
      <svg viewBox="0 0 228 96" className="w-56 h-24 overflow-visible select-none drop-shadow-xs">
        <rect x="4" y="4" width="220" height="88" rx="14" fill="rgba(255,255,255,0.9)" stroke={structColor} strokeOpacity="0.18" strokeWidth="1.5" />
        <line x1="14" y1="48" x2="214" y2="48" stroke={structColor} strokeWidth="2" strokeDasharray="4 3" />
        <path
          d="M 14 48 Q 39 8, 64 48 T 114 48 T 164 48 T 214 48"
          fill={fillTint}
          stroke={structColor}
          strokeWidth="3.2"
        />
        <path
          d="M 14 48 Q 39 88, 64 48 T 114 48 T 164 48 T 214 48"
          fill="none"
          stroke={innerColor}
          strokeWidth="2.4"
          strokeDasharray="4 3"
        />
      </svg>
    );
  }

  // Default: Calculus Derivative & Riemann Rectangles
  return (
    <svg viewBox="0 0 220 115" className="w-56 h-28 overflow-visible select-none drop-shadow-xs">
      <rect x="4" y="4" width="212" height="106" rx="14" fill="rgba(255,255,255,0.9)" stroke={structColor} strokeOpacity="0.18" strokeWidth="1.5" />
      <line x1="24" y1="94" x2="198" y2="94" stroke={structColor} strokeWidth="2.8" />
      <line x1="24" y1="14" x2="24" y2="94" stroke={structColor} strokeWidth="2.8" />
      <rect x="38" y="60" width="24" height="34" fill={fillTint} stroke={structColor} strokeWidth="2" />
      <rect x="64" y="44" width="24" height="50" fill={fillTint} stroke={structColor} strokeWidth="2" />
      <rect x="90" y="30" width="24" height="64" fill={fillTint} stroke={structColor} strokeWidth="2" />
      <rect x="116" y="46" width="24" height="48" fill={fillTint} stroke={structColor} strokeWidth="2" />
      <path
        d="M 26 82 Q 94 14, 190 60"
        fill="none"
        stroke={structColor}
        strokeWidth="3.2"
      />
      <line x1="52" y1="74" x2="156" y2="22" stroke="#f43f5e" strokeWidth="2.4" strokeDasharray="4 2" />
    </svg>
  );
};
