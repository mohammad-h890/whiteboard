import React, { useState, useEffect } from 'react';
import { Keyboard, Search, X, Play, Sparkles } from 'lucide-react';
import { toPersianDigits } from '../core/featureEngine';
import {
  KeyboardShortcutCategory,
  KeyboardShortcutSpec,
  filterKeyboardShortcuts,
} from '../core/studioAndAiEngine';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  usePersianNumerals: boolean;
  onTriggerShortcutAction: (shortcutId: string) => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  usePersianNumerals,
  onTriggerShortcutAction,
}) => {
  const [category, setCategory] = useState<KeyboardShortcutCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const fmt = (val: string | number) => toPersianDigits(val, usePersianNumerals);
  const filteredShortcuts: KeyboardShortcutSpec[] = filterKeyboardShortcuts(
    category,
    searchQuery
  );

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-shortcuts-modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[86vh]"
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <div>
              <h3
                id="keyboard-shortcuts-modal-title"
                className="text-sm font-bold text-slate-900 dark:text-slate-100"
              >
                راهنمای کلیدهای میانبر و شورتکات‌ها (Keyboard Shortcuts)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                تعویض سریع ابزارهای قلم، کمند انتخاب و مدیریت لایه‌های تخته بدون نیاز به ماوس
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن پنجره کلیدهای میانبر"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs & Live Search Input */}
        <div className="p-3.5 bg-slate-100/70 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-1 text-xs font-semibold">
            {(
              [
                { id: 'all', label: 'همه میانبرها' },
                { id: 'tools', label: 'ابزارهای قلم و ترسیم' },
                { id: 'layers', label: 'مدیریت لایه‌ها و نما' },
              ] as Array<{ id: KeyboardShortcutCategory; label: string }>
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategory(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  category === tab.id
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی کلید (مثلاً P، V، E) یا عملکرد..."
              aria-label="جستجوی کلید میانبر"
              className="w-full pr-8 pl-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Shortcuts List */}
        <div className="p-4 overflow-y-auto space-y-2 text-xs flex-1">
          {filteredShortcuts.length === 0 ? (
            <div className="py-10 text-center text-slate-500">
              هیچ کلید میانبری مطابق با عبارت جستجو یافت نشد.
            </div>
          ) : (
            filteredShortcuts.map((sc) => (
              <div
                key={sc.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-sky-500/40 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {sc.actionTitle}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-400">
                      {sc.categoryLabel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {sc.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div
                    dir="ltr"
                    className="flex items-center gap-1"
                  >
                    {sc.keys.map((k, idx) => (
                      <React.Fragment key={k}>
                        <kbd className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs font-bold text-sky-600 dark:text-sky-400 shadow-2xs">
                          {k}
                        </kbd>
                        {idx < sc.keys.length - 1 && (
                          <span className="text-slate-400 font-bold">+</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onTriggerShortcutAction(sc.id);
                      onClose();
                    }}
                    title="اجرای فوری این دستور"
                    className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                  >
                    <Play className="w-3 h-3" />
                    <span>اجرا</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>
              تعداد کل میانبرهای فعال: <strong>{fmt(filteredShortcuts.length)}</strong> کلید ترکیبی
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold"
          >
            بستن (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
