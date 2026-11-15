import React, { useState, useEffect } from 'react';
import {
  FileText,
  Smartphone,
  ShieldCheck,
  Wand2,
  Sparkles,
  GitBranch,
  X,
  Download,
  Upload,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { toPersianDigits } from '../core/featureEngine';
import {
  calculateReelsPenFocusCrop,
  recognizeHandwritingAndMath,
  parseTextToFlowchart,
  generatePrintableClassNotesHtml,
  serializeProjectSnapshot,
  parseProjectSnapshot,
} from '../core/studioAndAiEngine';

export type StudioModalMode = 'pdf' | 'video-916' | 'mp4' | 'ai-assistant';

interface SmartExportAndAiModalProps {
  mode: StudioModalMode | null;
  onClose: () => void;
  onSwitchMode: (mode: StudioModalMode) => void;
  usePersianNumerals: boolean;
  watermarkCode: string;
  onChangeWatermarkCode: (code: string) => void;
  floatingWatermark: boolean;
  onToggleWatermark: () => void;
  onStampToBoard: (title: string, summary: string, badgeColor: string) => void;
  onRecordExportedProject?: (
    title: string,
    teacherName: string,
    kind: 'pdf-handout' | 'session-recording'
  ) => void;
}

export const SmartExportAndAiModal: React.FC<SmartExportAndAiModalProps> = ({
  mode,
  onClose,
  onSwitchMode,
  usePersianNumerals,
  watermarkCode,
  onChangeWatermarkCode,
  floatingWatermark,
  onToggleWatermark,
  onStampToBoard,
  onRecordExportedProject,
}) => {
  // PDF Notes Config (Module 9)
  const [teacherName, setTeacherName] = useState<string>('مهندس محمدحسین احمدی');
  const [sessionTopic, setSessionTopic] = useState<string>('دینامیک: سطح شیب‌دار و قوانین نیوتن');
  const [pdfLayerPreset, setPdfLayerPreset] = useState<
    'full-solution' | 'blank-questions' | 'answer-key-only'
  >('full-solution');
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  // 9:16 Reels Smart Pen-Tip Focus (Module 9)
  const [penTipX, setPenTipX] = useState<number>(480);
  const [penTipY, setPenTipY] = useState<number>(310);

  // Offline AI Assistant State (Module 10)
  const [ocrPreset, setOcrPreset] = useState<string>('newton-inclined');
  const [beautifierStrength, setBeautifierStrength] = useState<number>(85);
  const [flowchartPrompt, setFlowchartPrompt] = useState<string>(
    'رسم دیاگرام جسم آزاد (FBD) -> تجزیه بردار وزن روی محور x و y -> نوشتن قانون دوم نیوتن ∑F=ma -> محاسبه شتاب و نیروی اصطکاک'
  );

  useEffect(() => {
    setExportSuccessMsg(null);
  }, [mode]);

  useEffect(() => {
    if (!mode) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mode, onClose]);

  if (!mode) return null;

  const fmt = (val: string | number) => toPersianDigits(val, usePersianNumerals);
  const reelsCrop = calculateReelsPenFocusCrop(1100, 700, penTipX, penTipY, 360, 420);
  const ocrResult = recognizeHandwritingAndMath(ocrPreset);
  const flowchartSpec = parseTextToFlowchart(flowchartPrompt);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="studio-ai-modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
      >
        {/* Top Modal Header & Mode Tabs */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            {mode === 'ai-assistant' ? (
              <Wand2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            ) : (
              <FileText className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            )}
            <h3
              id="studio-ai-modal-title"
              className="text-sm font-bold text-slate-900 dark:text-slate-100"
            >
              {mode === 'ai-assistant'
                ? 'ماژول ۱۰: دستیار هوش مصنوعی آفلاین (OCR فرمول، زیباساز دستخط و فلوچارت‌ساز)'
                : 'ماژول ۹: استودیوی خروجی هوشمند (جزوه PDF، ریلز ۹:۱۶ و امنیت محتوا)'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن پنجره"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Strip between Module 9 & Module 10 Sub-views */}
        <div className="grid grid-cols-3 gap-1 p-1.5 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => onSwitchMode('pdf')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
              mode === 'pdf' || mode === 'mp4'
                ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>جزوه PDF جلسه + واترمارک</span>
          </button>

          <button
            type="button"
            onClick={() => onSwitchMode('video-916')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
              mode === 'video-916'
                ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Smartphone className="w-4 h-4 shrink-0" />
            <span>تبدیل هوشمند ۱۶:۹ به ریلز ۹:۱۶</span>
          </button>

          <button
            type="button"
            onClick={() => onSwitchMode('ai-assistant')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
              mode === 'ai-assistant'
                ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Wand2 className="w-4 h-4 shrink-0" />
            <span>دستیار هوش مصنوعی (OCR)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* =================================================================
              TAB 1: ONE-CLICK CLASS NOTES PDF & ANTI-PIRACY WATERMARK (Module 9)
          ================================================================= */}
          {(mode === 'pdf' || mode === 'mp4') && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-slate-500 font-medium">نام استاد / مدرس در هدر جزوه:</span>
                  <input
                    type="text"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-semibold"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-slate-500 font-medium">عنوان مبحث و جلسه:</span>
                  <input
                    type="text"
                    value={sessionTopic}
                    onChange={(e) => setSessionTopic(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-semibold"
                  />
                </label>
              </div>

              {/* Layer Composition Mode for PDF */}
              <div className="space-y-1.5">
                <span className="text-slate-500 font-medium block">
                  ترکیب لایه‌های تخته در خروجی PDF:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      id: 'full-solution',
                      label: 'جزوه کامل (سوال + دستخط استاد)',
                      desc: 'مناسب مرور پس از کلاس',
                    },
                    {
                      id: 'blank-questions',
                      label: 'جزوه خام (فقط لایه ۱ سوالات)',
                      desc: 'مناسب چاپ قبل از کلاس',
                    },
                    {
                      id: 'answer-key-only',
                      label: 'پاسخنامه کلیدی و تشریحی',
                      desc: 'شامل لایه ۳ پاسخ مخفی',
                    },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() =>
                        setPdfLayerPreset(preset.id as typeof pdfLayerPreset)
                      }
                      className={`p-2.5 rounded-xl border text-right transition-all ${
                        pdfLayerPreset === preset.id
                          ? 'bg-sky-500/10 border-sky-500 text-sky-700 dark:text-sky-300 font-bold'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="text-xs">{preset.label}</div>
                      <div className="text-[10px] opacity-75 mt-0.5">{preset.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Anti-Piracy Watermark Settings */}
              <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-300">
                    <ShieldCheck className="w-4 h-4" />
                    <span>واترمارک امنیتی پویا ضد سرقت (Floating Anti-Piracy Watermark)</span>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleWatermark}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                      floatingWatermark
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {floatingWatermark ? 'فعال روی ویدیو و PDF' : 'غیرفعال'}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 whitespace-nowrap">کد اختصاصی دانش‌پذیر:</span>
                  <input
                    type="text"
                    value={watermarkCode}
                    onChange={(e) => onChangeWatermarkCode(e.target.value)}
                    aria-label="کد واترمارک امنیتی"
                    className="flex-1 px-2.5 py-1 rounded bg-white dark:bg-slate-900 border border-amber-500/30 font-mono text-xs"
                  />
                </div>
              </div>

              {/* Live A4 Sheet Header Preview */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      {sessionTopic}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      مدرس: {teacherName} · کد رهگیری: <span className="font-mono">{watermarkCode}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 tabular-nums">
                    صفحه {fmt(1)} از {fmt(2)} (سایز A4 وکتور)
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  • وضعیت لایه‌ها:{' '}
                  <strong>
                    {pdfLayerPreset === 'full-solution'
                      ? 'ادغام لایه سوالات + دستخط حل استاد + ابزارک‌های آزمایشگاه'
                      : pdfLayerPreset === 'blank-questions'
                      ? 'فقط لایه ۱ (سوالات بدون پاسخ برای تمرین دانش‌آموز)'
                      : 'لایه سوالات + لایه ۳ (پاسخنامه کلیدی و تشریحی)'}
                  </strong>
                </p>
              </div>

              {exportSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{exportSuccessMsg}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const jsonStr = serializeProjectSnapshot({
                        version: '2.0.0',
                        savedAtIso: new Date().toISOString(),
                        activeProfileId: 'full',
                        canvasMode: '16:9',
                        background: 'grid',
                        watermarkCode,
                        stampedWidgetsCount: 2,
                        calloutStamps: [sessionTopic, teacherName],
                      });
                      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'daneshboard-session.json';
                      a.click();
                      URL.revokeObjectURL(url);
                      setExportSuccessMsg(
                        'فایل پروژه کامل جلسه (daneshboard-session.json) با موفقیت ذخیره شد.'
                      );
                    }}
                    className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1.5 text-xs"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-500" />
                    <span>ذخیره پروژه (.json)</span>
                  </button>

                  <label className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1.5 text-xs cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-sky-500" />
                    <span>بارگذاری پروژه</span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          const parsed = parseProjectSnapshot(String(reader.result || ''));
                          if (parsed) {
                            if (parsed.calloutStamps[0]) setSessionTopic(parsed.calloutStamps[0]);
                            if (parsed.calloutStamps[1]) setTeacherName(parsed.calloutStamps[1]);
                            onChangeWatermarkCode(parsed.watermarkCode);
                            setExportSuccessMsg(
                              `پروژه نسخه ${parsed.version} با کد امنیتی ${parsed.watermarkCode} بازیابی شد.`
                            );
                          } else {
                            setExportSuccessMsg('فایل انتخاب‌شده معتبر نیست.');
                          }
                        };
                        reader.readAsText(file);
                      }}
                    />
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                  >
                    بستن
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const presetLabel =
                        pdfLayerPreset === 'full-solution'
                          ? 'جزوه کامل به همراه دستخط استاد'
                          : pdfLayerPreset === 'blank-questions'
                          ? 'سوالات خام جهت حل دانش‌آموز'
                          : 'پاسخنامه کلیدی و تشریحی';
                      const htmlDoc = generatePrintableClassNotesHtml({
                        teacherName,
                        sessionTopic,
                        watermarkCode,
                        presetLabel,
                        stampedWidgets: [
                          {
                            title: sessionTopic,
                            summary: `نسخه خروجی: ${presetLabel}`,
                          },
                        ],
                        calloutStamps: ['نکته کنکوری: تجزیه بردار وزن روی سطح شیب‌دار'],
                      });
                      const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'daneshboard-handout-a4.html';
                      a.click();
                      URL.revokeObjectURL(url);
                      onRecordExportedProject?.(sessionTopic, teacherName, 'pdf-handout');
                      setExportSuccessMsg(
                        `فایل جزوه قابل چاپ A4 «${sessionTopic}» با هدر استاندارد و واترمارک دانلود و در پروژه‌های اخیر ثبت شد.`
                      );
                    }}
                    className="px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-500 font-bold flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>تولید و دانلود جزوه PDF جلسه</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 2: SMART 9:16 VERTICAL REELS & SHORTS CONVERTER (Module 9)
          ================================================================= */}
          {mode === 'video-916' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                {/* Left: Controls for Smart Pen-Tip Auto-Focus */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                    فوکوس هوشمند دنبال‌کننده نوک قلم (Auto-Follow Pen Tip)
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    در تبدیل خودکار ویدیوی افقی ۱۶:۹ به ریلز اینستاگرام و یوتیوب شورتس (۹:۱۶)،{' '}
                    <strong>یک‌سوم بالایی</strong> به وب‌کم استاد اختصاص می‌یابد و{' '}
                    <strong>دوسوم پایینی</strong> به‌صورت خودکار روی مختصات لحظه‌ای نوک قلم قفل می‌شود.
                  </p>

                  <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-500">مختصات افقی نوک قلم (X):</span>
                        <span className="font-mono font-bold tabular-nums">{fmt(penTipX)} px</span>
                      </div>
                      <input
                        type="range"
                        min={100}
                        max={1000}
                        value={penTipX}
                        onChange={(e) => setPenTipX(Number(e.target.value))}
                        aria-label="مختصات افقی نوک قلم"
                        className="w-full accent-sky-600"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-500">مختصات عمودی نوک قلم (Y):</span>
                        <span className="font-mono font-bold tabular-nums">{fmt(penTipY)} px</span>
                      </div>
                      <input
                        type="range"
                        min={100}
                        max={600}
                        value={penTipY}
                        onChange={(e) => setPenTipY(Number(e.target.value))}
                        aria-label="مختصات عمودی نوک قلم"
                        className="w-full accent-sky-600"
                      />
                    </div>

                    <div className="pt-1 border-t border-slate-200 dark:border-slate-800 flex justify-between text-[11px] tabular-nums">
                      <span>
                        پنجره برش: ({fmt(reelsCrop.cropX)}, {fmt(reelsCrop.cropY)})
                      </span>
                      <span className="text-sky-600 dark:text-sky-400 font-bold">
                        بزرگ‌نمایی هوشمند: {fmt(reelsCrop.zoomScale)}×
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Visual 9:16 Phone Frame Preview */}
                <div className="flex justify-center">
                  <div className="w-48 h-80 rounded-2xl border-4 border-slate-800 dark:border-slate-700 bg-slate-950 overflow-hidden flex flex-col shadow-xl">
                    {/* Top 1/3: Teacher Webcam */}
                    <div className="h-1/3 bg-slate-900 border-b border-sky-500/40 flex flex-col items-center justify-center p-2 text-center">
                      <div className="w-9 h-9 rounded-full bg-sky-500/20 border border-sky-400 flex items-center justify-center text-sky-300 font-bold text-[11px]">
                        استاد
                      </div>
                      <span className="text-[10px] text-slate-200 font-semibold mt-1">
                        ۱/۳ بالایی: تصویر وب‌کم مدرس
                      </span>
                    </div>

                    {/* Bottom 2/3: Dynamic Cropped Whiteboard around Pen Tip */}
                    <div className="flex-1 bg-slate-950 relative p-3 flex flex-col justify-between">
                      <div className="text-[9px] text-emerald-400 font-semibold flex items-center justify-between">
                        <span>۲/۳ پایینی: فوکوس خودکار قلم</span>
                        <span className="font-mono">9:16</span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                        <div
                          dir="ltr"
                          className="text-[10px] text-sky-400 font-mono text-left"
                        >
                          ∑F = m·a ⟹ a = 2.78 m/s²
                        </div>
                        <div className="text-[9px] text-slate-400 tabular-nums">
                          ردیابی زنده نوک قلم در ({fmt(penTipX)}, {fmt(penTipY)})
                        </div>
                      </div>

                      <div className="px-2 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] text-center font-bold">
                        زیرنویس خودکار ریلز: «نکته طلایی سطح شیب‌دار!»
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 3: OFFLINE AI ASSISTANT (Persian/Math OCR, Beautifier, Flowchart) (Module 10)
          ================================================================= */}
          {mode === 'ai-assistant' && (
            <div className="space-y-4">
              {/* 10.1: Handwriting & Math OCR */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span>۱. تبدیل دستخط فارسی و ریاضی به فرمول تایپی (Offline Math & Persian OCR)</span>
                  </h4>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                    دقت تشخیص موتور ONNX: {fmt(ocrResult.confidencePct)}٪
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  {[
                    { id: 'newton-inclined', label: 'قانون دوم نیوتن (فیزیک)' },
                    { id: 'quadratic-roots', label: 'معادله درجه دوم و دلتا (ریاضی)' },
                    { id: 'ph-henderson', label: 'رابطه pH و بافر (شیمی)' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setOcrPreset(item.id)}
                      className={`py-1.5 px-2.5 rounded-lg border text-xs font-semibold transition-colors ${
                        ocrPreset === item.id
                          ? 'bg-purple-600 text-white border-purple-500'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="text-[11px] text-slate-500">{ocrResult.recognizedPersianText}</div>
                  <div
                    dir="ltr"
                    className="text-sm font-mono font-bold text-purple-600 dark:text-purple-400 text-left"
                  >
                    {ocrResult.latexFormula}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-[11px] text-slate-500 whitespace-nowrap">
                      زیباسازی و صاف کردن دستخط: {fmt(beautifierStrength)}٪
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={beautifierStrength}
                      onChange={(e) => setBeautifierStrength(Number(e.target.value))}
                      aria-label="درجه زیباسازی دستخط"
                      className="w-28 accent-purple-600"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onStampToBoard(
                        `فرمول استاندارد استخراج‌شده با AI OCR`,
                        `${ocrResult.recognizedPersianText} | ${ocrResult.latexFormula}`,
                        '#9333ea'
                      );
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-500 font-bold text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>درج فرمول تایپی روی تخته</span>
                  </button>
                </div>
              </div>

              {/* 10.2: Text-to-Flowchart Vector Diagram Generator */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <GitBranch className="w-4 h-4 text-sky-500" />
                  <span>۲. تولید خودکار دیاگرام و فلوچارت وکتور از متن (Text-to-Diagram)</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  مراحل علمی یا الگوریتم را با علامت <span className="font-mono">-&gt;</span> یا ویرگول جدا کنید تا فلوچارت وکتور ساخته شود:
                </p>
                <input
                  type="text"
                  value={flowchartPrompt}
                  onChange={(e) => setFlowchartPrompt(e.target.value)}
                  aria-label="متن ورودی برای ساخت فلوچارت"
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                />

                {/* Flowchart Nodes Visual Preview */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {flowchartSpec.nodes.map((node, i) => (
                    <React.Fragment key={node.id}>
                      <div className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-sky-500/40 text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                        <span className="text-sky-500 font-bold ml-1">
                          {fmt(node.stepNumber)}.
                        </span>
                        {node.label}
                      </div>
                      {i < flowchartSpec.nodes.length - 1 && (
                        <span className="text-slate-400 font-bold">←</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onStampToBoard(
                        flowchartSpec.title,
                        flowchartSpec.nodes.map((n) => `${fmt(n.stepNumber)}. ${n.label}`).join(' ⟵ '),
                        '#0284c7'
                      );
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-sky-600 text-white hover:bg-sky-500 font-bold text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>ارسال فلوچارت به تخته سفید</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
