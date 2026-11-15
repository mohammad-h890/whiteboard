import React, { useState, useRef, useEffect } from 'react';
import {
  History,
  FileText,
  Video,
  Download,
  RotateCcw,
  Terminal,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { toPersianDigits, TeachingProfileId } from '../core/featureEngine';
import {
  RecentProjectItem,
  generatePrintableClassNotesHtml,
  generateElectronBuildBatScript,
} from '../core/studioAndAiEngine';

interface RecentProjectsMenuProps {
  recentProjects: RecentProjectItem[];
  usePersianNumerals: boolean;
  onRestoreProject: (item: RecentProjectItem) => void;
  onClearHistory: () => void;
}

export const RecentProjectsMenu: React.FC<RecentProjectsMenuProps> = ({
  recentProjects,
  usePersianNumerals,
  onRestoreProject,
  onClearHistory,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const fmt = (val: string | number) => toPersianDigits(val, usePersianNumerals);

  const handleDownloadRecentPdf = (item: RecentProjectItem) => {
    const htmlDoc = generatePrintableClassNotesHtml({
      teacherName: item.teacherName,
      sessionTopic: item.title,
      watermarkCode: item.watermarkCode,
      presetLabel:
        item.kind === 'pdf-handout' ? 'جزوه کامل A4' : 'خلاصه جلسه ضبط‌شده ۴ کاناله',
      stampedWidgets: [
        {
          title: item.title,
          summary: `مدرس: ${item.teacherName} · مشخصات: ${item.durationOrPagesLabel}`,
        },
      ],
      calloutStamps: ['فراخوانی شده از تاریخچه ۵ پروژه اخیر'],
    });
    const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daneshboard-${item.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusBanner(`فایل «${item.title}» مجدداً دانلود شد.`);
  };

  const handleDownloadElectronBat = () => {
    const batContent = generateElectronBuildBatScript();
    const blob = new Blob([batContent], { type: 'application/x-bat;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'build-electron-exe.bat';
    a.click();
    URL.revokeObjectURL(url);
    setStatusBanner(
      'فایل build-electron-exe.bat (ساخت هم‌زمان EXE پرتابل و فایل نصبی Setup با Electron) دانلود شد.'
    );
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setIsOpen((o) => !o);
          setStatusBanner(null);
        }}
        aria-expanded={isOpen}
        aria-label="پروژه‌ها و خروجی‌های اخیر"
        className={`px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap text-xs ${
          isOpen
            ? 'bg-sky-600 text-white border-sky-500'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-sky-500'
        }`}
      >
        <History className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
        <span>پروژه‌های اخیر ({fmt(recentProjects.length)}/۵)</span>
        <ChevronDown className="w-3 h-3 opacity-70" />
      </button>

      {isOpen && (
        <div
          role="region"
          aria-label="فهرست ۵ پروژه و ضبط اخیر"
          className="absolute left-0 mt-2 w-96 max-w-[92vw] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden text-xs"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <History className="w-4 h-4 text-sky-500" />
                <span>۵ جزوه PDF و جلسه ضبط‌شده اخیر</span>
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5">
                دسترسی سریع به آخرین خروجی‌های PDF و جلسات ضبط ۴ کاناله
              </p>
            </div>
            {recentProjects.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                title="پاک کردن تاریخچه"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Items List (Max 5) */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {recentProjects.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                هنوز جزوه PDF یا ضبط جلسه‌ای در تاریخچه ثبت نشده است.
              </div>
            ) : (
              recentProjects.slice(0, 5).map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <div
                        className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                          item.kind === 'pdf-handout'
                            ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {item.kind === 'pdf-handout' ? (
                          <FileText className="w-4 h-4" />
                        ) : (
                          <Video className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100 leading-snug">
                          {fmt(idx + 1)}. {item.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {item.teacherName} · {item.timestampLabel}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${
                        item.kind === 'pdf-handout'
                          ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {item.kind === 'pdf-handout' ? 'جزوه PDF' : 'ضبط استودیو'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pl-1">
                    <span className="text-[10px] text-slate-500 tabular-nums">
                      {item.durationOrPagesLabel} · کد:{' '}
                      <span className="font-mono">{item.watermarkCode}</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onRestoreProject(item);
                          setStatusBanner(`جلسه «${item.title}» روی تخته بازخوانی شد.`);
                        }}
                        className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-700 dark:text-slate-300 font-semibold text-[10px] flex items-center gap-1 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>بازخوانی جلسه</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadRecentPdf(item)}
                        className="px-2 py-1 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 font-semibold text-[10px] flex items-center gap-1 transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        <span>دانلود</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {statusBanner && (
            <div className="px-3.5 py-2 bg-emerald-500/10 border-t border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
              {statusBanner}
            </div>
          )}

          {/* Footer: 1-Click Electron EXE & Setup Installer BAT Script Download */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="text-[10px] text-slate-500">
              خروجی دسکتاپ ویندوز (EXE + Setup):
            </div>
            <button
              type="button"
              onClick={handleDownloadElectronBat}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>دانلود build-electron-exe.bat</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
