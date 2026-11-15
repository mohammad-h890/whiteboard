import React, { useState, useMemo } from 'react';
import {
  Video,
  Mic,
  Monitor,
  Volume2,
  EyeOff,
  FileText,
  Sparkles,
  Scissors,
  FastForward,
  Subtitles,
  Smartphone,
  ShieldCheck,
  ChevronUp,
  ChevronDown,
  Circle,
  Square,
  Stamp,
  Sun,
  Wand2,
  Sliders,
  Music,
  Maximize2,
} from 'lucide-react';
import { AppModule, isSubFeatureActive, toPersianDigits } from '../core/featureEngine';
import {
  AudioSegment,
  calculateTimelineOptimization,
  calculateAudioDuckingGainDb,
} from '../core/studioAndAiEngine';

export type WebcamKeyframeMode = 'bubble-left' | 'fullscreen-talk' | 'hidden-writing';

const INITIAL_TIMELINE_SEGMENTS: AudioSegment[] = [
  {
    id: 'seg-1',
    startSec: 0,
    endSec: 45,
    rmsDb: -15,
    type: 'speech',
    transcript: 'سلام بچه‌ها! در این جلسه به سراغ تحلیل کامل سطح شیب‌دار و قوانین نیوتن می‌رویم.',
  },
  {
    id: 'seg-2',
    startSec: 45,
    endSec: 62,
    rmsDb: -48,
    type: 'silence',
  },
  {
    id: 'seg-3',
    startSec: 62,
    endSec: 70,
    rmsDb: -24,
    type: 'filler',
    transcript: 'اممم... آآآ... بذارید صفحه بعد رو باز کنم...',
  },
  {
    id: 'seg-4',
    startSec: 70,
    endSec: 150,
    rmsDb: -44,
    type: 'writing-only',
    transcript: '[نوشتن فرمول تجزیه بردارها روی تخته]',
  },
  {
    id: 'seg-5',
    startSec: 150,
    endSec: 235,
    rmsDb: -14,
    type: 'speech',
    transcript: 'دقت کنید در کنکور تجربی دام آموزشی دقیقاً جابه‌جایی سینوس و کسینوس زاویه است!',
  },
  {
    id: 'seg-6',
    startSec: 235,
    endSec: 255,
    rmsDb: -51,
    type: 'silence',
  },
  {
    id: 'seg-7',
    startSec: 255,
    endSec: 315,
    rmsDb: -41,
    type: 'writing-only',
    transcript: '[حل تشریحی تست سراسری ۱۴۰۳]',
  },
  {
    id: 'seg-8',
    startSec: 315,
    endSec: 360,
    rmsDb: -13,
    type: 'speech',
    transcript: 'پس گزینه ۳ به سادگی در کمتر از ۳۰ ثانیه به دست می‌آید.',
  },
];

interface StudioTimelineDockProps {
  modules: AppModule[];
  usePersianNumerals: boolean;
  isRecording: boolean;
  recordingSeconds: number;
  onToggleRecording: () => void;
  webcamEnabled: boolean;
  onToggleWebcam: () => void;
  webcamKeyframeMode?: WebcamKeyframeMode;
  onChangeWebcamKeyframeMode?: (mode: WebcamKeyframeMode) => void;
  invisibleUiMode: boolean;
  onToggleInvisibleUi: () => void;
  teleprompterOpen: boolean;
  onToggleTeleprompter: () => void;
  spotlightActive: boolean;
  onToggleSpotlight: () => void;
  floatingWatermark: boolean;
  onToggleWatermark: () => void;
  reelsPreviewMode: boolean;
  onToggleReelsPreview: () => void;
  onAddCalloutStamp: (label: string) => void;
  onTriggerExportModal: (exportType: 'pdf' | 'video-916' | 'mp4') => void;
  onOpenAiStudioModal?: () => void;
}

export const StudioTimelineDock: React.FC<StudioTimelineDockProps> = ({
  modules,
  usePersianNumerals,
  isRecording,
  recordingSeconds,
  onToggleRecording,
  webcamEnabled,
  onToggleWebcam,
  webcamKeyframeMode = 'bubble-left',
  onChangeWebcamKeyframeMode,
  invisibleUiMode,
  onToggleInvisibleUi,
  teleprompterOpen,
  onToggleTeleprompter,
  spotlightActive,
  onToggleSpotlight,
  floatingWatermark,
  onToggleWatermark,
  reelsPreviewMode,
  onToggleReelsPreview,
  onAddCalloutStamp,
  onTriggerExportModal,
  onOpenAiStudioModal,
}) => {
  const [timelineExpanded, setTimelineExpanded] = useState<boolean>(false);
  const [micEnabled, setMicEnabled] = useState<boolean>(true);
  const [sysAudioEnabled, setSysAudioEnabled] = useState<boolean>(true);
  const [screenChannelEnabled, setScreenChannelEnabled] = useState<boolean>(true);

  // Module 8 NLE Smart Editing Controls
  const [silenceCutApplied, setSilenceCutApplied] = useState<boolean>(true);
  const [silenceThresholdDb, setSilenceThresholdDb] = useState<number>(-40);
  const [removeFillers, setRemoveFillers] = useState<boolean>(true);
  const [writingSpeedMultiplier, setWritingSpeedMultiplier] = useState<1 | 2 | 4>(2);
  const [captionsGenerated, setCaptionsGenerated] = useState<boolean>(true);
  const [activeCaptionText, setActiveCaptionText] = useState<string>(
    'در سطح شیب‌دار مؤلفه موازی وزن برابر mg·sinθ و نیروی عمودی تکیه‌گاه mg·cosθ است.'
  );
  const [audioDuckingActive, setAudioDuckingActive] = useState<boolean>(true);
  const [teacherSpeakingSim, setTeacherSpeakingSim] = useState<boolean>(true);
  const [playheadPct, setPlayheadPct] = useState<number>(38);

  const fmt = (val: string | number) => toPersianDigits(val, usePersianNumerals);

  const recorderModEnabled = modules.find((m) => m.id === 'mod-7-recorder')?.enabled ?? false;
  const editorModEnabled = modules.find((m) => m.id === 'mod-8-editor')?.enabled ?? false;
  const exportModEnabled = modules.find((m) => m.id === 'mod-9-export')?.enabled ?? false;

  const optimizationMetrics = useMemo(
    () =>
      calculateTimelineOptimization(INITIAL_TIMELINE_SEGMENTS, {
        cutSilences: silenceCutApplied,
        silenceThresholdDb,
        removeFillers,
        writingSpeedMultiplier,
      }),
    [silenceCutApplied, silenceThresholdDb, removeFillers, writingSpeedMultiplier]
  );

  const duckingMetrics = useMemo(
    () =>
      calculateAudioDuckingGainDb(
        -18,
        audioDuckingActive && teacherSpeakingSim ? -14 : -48,
        -35,
        14
      ),
    [audioDuckingActive, teacherSpeakingSim]
  );

  if (!recorderModEnabled && !editorModEnabled && !exportModEnabled) {
    return null;
  }

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = Math.round(sec % 60);
    return `${fmt(String(mins).padStart(2, '0'))}:${fmt(String(rem).padStart(2, '0'))}`;
  };

  return (
    <div className="border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md select-none z-20">
      {/* Ultra-Clean Single-Row Studio & Export Bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-1.5">
        <div className="flex items-center gap-2">
          {recorderModEnabled && (
            <button
              type="button"
              onClick={onToggleRecording}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                isRecording
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-900 dark:bg-sky-600 text-white hover:opacity-90'
              }`}
            >
              {isRecording ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>توقف ضبط ({formatTime(recordingSeconds)})</span>
                </>
              ) : (
                <>
                  <Circle className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                  <span>شروع ضبط ۴ کاناله</span>
                </>
              )}
            </button>
          )}

          {(editorModEnabled || recorderModEnabled) && (
            <button
              type="button"
              onClick={() => setTimelineExpanded((v) => !v)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>تنظیمات ضبط و تایم‌لاین تدوین (۴ کانال)</span>
              {timelineExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>

        {/* Right: Quick Export & AI OCR */}
        <div className="flex items-center gap-2">
          {onOpenAiStudioModal && (
            <button
              type="button"
              onClick={onOpenAiStudioModal}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30 hover:bg-purple-500/20 transition-colors flex items-center gap-1 whitespace-nowrap"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>دستیار هوش مصنوعی (OCR)</span>
            </button>
          )}

          {exportModEnabled && (
            <button
              type="button"
              onClick={() => onTriggerExportModal('pdf')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-600/10 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 hover:bg-sky-600/20 transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>خروجی جزوه PDF جلسه</span>
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Multi-Track Studio & Video Editor Drawer (Modules 7 & 8) */}
      {(editorModEnabled || recorderModEnabled) && timelineExpanded && (
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2.5">
          {/* Row 0: 4 Isolated Recording Channels & Studio Helpers */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-1.5">
              <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800/90 text-[11px]">
                <button
                  type="button"
                  onClick={() => setScreenChannelEnabled((v) => !v)}
                  className={`px-2 py-1 rounded flex items-center gap-1 transition-colors whitespace-nowrap ${
                    screenChannelEnabled
                      ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 font-semibold shadow-2xs'
                      : 'text-slate-400'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>بوم</span>
                </button>
                <button
                  type="button"
                  onClick={onToggleWebcam}
                  className={`px-2 py-1 rounded flex items-center gap-1 transition-colors whitespace-nowrap ${
                    webcamEnabled
                      ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 font-semibold shadow-2xs'
                      : 'text-slate-400'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>وب‌کم</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMicEnabled((v) => !v)}
                  className={`px-2 py-1 rounded flex items-center gap-1 transition-colors whitespace-nowrap ${
                    micEnabled
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 font-semibold shadow-2xs'
                      : 'text-slate-400'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>میکروفون (AI)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSysAudioEnabled((v) => !v)}
                  className={`px-2 py-1 rounded flex items-center gap-1 transition-colors whitespace-nowrap ${
                    sysAudioEnabled
                      ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 font-semibold shadow-2xs'
                      : 'text-slate-400'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>صدای سیستم</span>
                </button>
              </div>

              {isSubFeatureActive(modules, 'invisible-ui-recording') && (
                <button
                  type="button"
                  onClick={onToggleInvisibleUi}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border flex items-center gap-1 transition-colors whitespace-nowrap ${
                    invisibleUiMode
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>ضبط نامرئی منوها: {invisibleUiMode ? 'فعال' : 'غیرفعال'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={onToggleTeleprompter}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border flex items-center gap-1 transition-colors whitespace-nowrap ${
                  teleprompterOpen
                    ? 'bg-sky-500/10 border-sky-500/40 text-sky-700 dark:text-sky-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>تله‌پرامپتر مخفی</span>
              </button>

              <button
                type="button"
                onClick={onToggleSpotlight}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border flex items-center gap-1 transition-colors whitespace-nowrap ${
                  spotlightActive
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>نورافکن تمرکز</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  onToggleReelsPreview();
                  onTriggerExportModal('video-916');
                }}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 whitespace-nowrap"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>تبدیل ریلز ۹:۱۶</span>
              </button>

              <button
                type="button"
                onClick={onToggleWatermark}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1 whitespace-nowrap ${
                  floatingWatermark
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>واترمارک پویا</span>
              </button>
            </div>
          </div>
          {/* Smart Video Editing Actions Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSilenceCutApplied((s) => !s)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 border transition-colors whitespace-nowrap ${
                  silenceCutApplied
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>
                  {silenceCutApplied
                    ? `حذف سکوت‌ها: فعال (${fmt(optimizationMetrics.removedSilenceCount)} برش)`
                    : 'حذف خودکار سکوت‌ها (Auto-Cut Silences)'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRemoveFillers((f) => !f)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 border transition-colors whitespace-nowrap ${
                  removeFillers
                    ? 'bg-teal-600 text-white border-teal-500'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {removeFillers
                    ? `تپق‌گیر هوشمند («اممم/آآآ»): فعال`
                    : 'حذف تپق و مکث‌های کلامی'}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setWritingSpeedMultiplier((m) => (m === 1 ? 2 : m === 2 ? 4 : 1))
                }
                className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 border transition-colors whitespace-nowrap ${
                  writingSpeedMultiplier > 1
                    ? 'bg-sky-600 text-white border-sky-500'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>تند کردن هوشمند نوشتن: {fmt(writingSpeedMultiplier)}×</span>
              </button>

              <button
                type="button"
                onClick={() => setAudioDuckingActive((d) => !d)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 border transition-colors whitespace-nowrap ${
                  audioDuckingActive
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                <span>
                  Audio Ducking موزیک:{' '}
                  {duckingMetrics.isDucked
                    ? `${fmt(duckingMetrics.outputMusicDb)} dB (کاهش خودکار)`
                    : `${fmt(duckingMetrics.outputMusicDb)} dB`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCaptionsGenerated((c) => !c)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 border transition-colors whitespace-nowrap ${
                  captionsGenerated
                    ? 'bg-amber-600 text-white border-amber-500'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Subtitles className="w-3.5 h-3.5" />
                <span>
                  {captionsGenerated ? 'زیرنویس فارسی: فعال' : 'تولید زیرنویس خودکار فارسی'}
                </span>
              </button>
            </div>

            {/* Real-time Compression Summary & Callouts */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-[11px] text-slate-600 dark:text-slate-400 tabular-nums">
                <span>زمان خام: {formatTime(optimizationMetrics.originalDurationSec)}</span>
                <span className="mx-1.5">←</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  پس از تدوین هوشمند: {formatTime(optimizationMetrics.finalDurationSec)} (
                  {fmt(optimizationMetrics.savedPercent)}٪ کوتاه‌تر)
                </span>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Stamp className="w-3.5 h-3.5" /> مهرها:
                </span>
                {['نکته کنکوری مهم!', 'دام آموزشی!', 'فرمول طلایی!'].map((callout) => (
                  <button
                    key={callout}
                    type="button"
                    onClick={() => onAddCalloutStamp(callout)}
                    className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-colors whitespace-nowrap"
                  >
                    + {callout}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4-Track Visual Timeline */}
          <div className="relative rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 tabular-nums pb-1 border-b border-slate-100 dark:border-slate-800">
              <span>{fmt('00:00')} (شروع جلسه)</span>
              <span>{fmt('01:10')} (ترسیم بردارهای سطح شیب‌دار)</span>
              <span>{fmt('02:30')} (نکته دام کنکور)</span>
              <span>{fmt('04:15')} (حل تست سراسری)</span>
              <span>{formatTime(optimizationMetrics.finalDurationSec)} (پایان)</span>
            </div>

            {/* Track 1: Canvas */}
            <div className="flex items-center gap-2 text-xs">
              <span className="w-36 text-[11px] font-semibold text-slate-600 dark:text-slate-400 truncate">
                ۱. کانال بوم (بدون UI)
              </span>
              <div
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = Math.round(((rect.right - e.clientX) / rect.width) * 100);
                  setPlayheadPct(Math.max(5, Math.min(95, pct)));
                }}
                className="flex-1 h-6 rounded bg-sky-500/15 border border-sky-500/30 flex items-center justify-between px-3 cursor-pointer relative overflow-hidden"
              >
                <span className="text-[10px] text-sky-700 dark:text-sky-300 font-medium">
                  پارت ۱: تدریس تخته تمیز ({fmt(writingSpeedMultiplier)}× سرعت نوشتن در بخش‌های سکوت)
                </span>
                <span className="text-[10px] text-sky-600 dark:text-sky-400 font-mono">
                  Playhead: {fmt(playheadPct)}%
                </span>
              </div>
            </div>

            {/* Track 2: Isolated Webcam Keyframe Switcher */}
            <div className="flex items-center gap-2 text-xs">
              <span className="w-36 text-[11px] font-semibold text-slate-600 dark:text-slate-400 truncate">
                ۲. کانال وب‌کم مستقل
              </span>
              <div className="flex-1 h-7 rounded bg-purple-500/10 border border-purple-500/30 flex items-center justify-between px-2">
                <span className="text-[10px] text-purple-700 dark:text-purple-300 font-medium">
                  تغییر چیدمان وب‌کم پس از ضبط (Keyframe):
                </span>
                <div className="flex items-center gap-1">
                  {(
                    [
                      { id: 'bubble-left', label: 'حباب دایره‌ای گوشه چپ' },
                      { id: 'fullscreen-talk', label: 'بزرگ‌نمایی موقع صحبت' },
                      { id: 'hidden-writing', label: 'مخفی موقع نوشتن فرمول' },
                    ] as Array<{ id: WebcamKeyframeMode; label: string }>
                  ).map((kf) => (
                    <button
                      key={kf.id}
                      type="button"
                      onClick={() => onChangeWebcamKeyframeMode?.(kf.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors whitespace-nowrap ${
                        webcamKeyframeMode === kf.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-purple-500/20'
                      }`}
                    >
                      {kf.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Track 3: Mic + Auto-Cut Silences & Threshold Slider */}
            <div className="flex items-center gap-2 text-xs">
              <span className="w-36 text-[11px] font-semibold text-slate-600 dark:text-slate-400 truncate">
                ۳. میکروفون (RNNoise)
              </span>
              <div className="flex-1 h-7 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between px-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium">
                    موج صدای نویزگیری‌شده استاد
                  </span>
                  {silenceCutApplied && (
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
                      [{fmt(optimizationMetrics.savedSeconds)} ثانیه سکوت و مکث حذف شد]
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 tabular-nums">
                    آستانه سکوت: {fmt(silenceThresholdDb)} dB
                  </span>
                  <input
                    type="range"
                    min={-55}
                    max={-25}
                    value={silenceThresholdDb}
                    onChange={(e) => setSilenceThresholdDb(Number(e.target.value))}
                    aria-label="آستانه تشخیص سکوت"
                    className="w-20 accent-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* Track 4: Editable Auto-Captions & SFX */}
            <div className="flex items-center gap-2 text-xs">
              <span className="w-36 text-[11px] font-semibold text-slate-600 dark:text-slate-400 truncate">
                ۴. زیرنویس و صداگذاری
              </span>
              <div className="flex-1 h-7 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2 px-2">
                {captionsGenerated ? (
                  <>
                    <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold whitespace-nowrap">
                      ویرایش زیرنویس لحظه‌ای:
                    </span>
                    <input
                      type="text"
                      value={activeCaptionText}
                      onChange={(e) => setActiveCaptionText(e.target.value)}
                      aria-label="متن زیرنویس خودکار فارسی"
                      className="flex-1 px-2 py-0.5 rounded bg-white dark:bg-slate-950 border border-amber-500/30 text-[11px] text-slate-800 dark:text-slate-200"
                    />
                  </>
                ) : (
                  <span className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">
                    مهر کنکوری + موزیک پس‌زمینه با Audio Ducking خودکار
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
