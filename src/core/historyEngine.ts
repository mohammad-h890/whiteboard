export interface BoardHistoryState<T> {
  past: T[];
  future: T[];
  maxEntries: number;
}

export function createBoardHistory<T>(maxEntries = 60): BoardHistoryState<T> {
  return {
    past: [],
    future: [],
    maxEntries: Math.max(1, maxEntries),
  };
}

/**
 * Records the snapshot BEFORE a mutation occurs, clearing any redo future.
 */
export function pushBoardHistory<T>(
  history: BoardHistoryState<T>,
  previousSnapshot: T
): BoardHistoryState<T> {
  const nextPast = [...history.past, previousSnapshot];
  const trimmed =
    nextPast.length > history.maxEntries
      ? nextPast.slice(nextPast.length - history.maxEntries)
      : nextPast;
  return {
    past: trimmed,
    future: [],
    maxEntries: history.maxEntries,
  };
}

/**
 * Pops the latest snapshot from `past` and pushes `currentSnapshot` onto `future`.
 */
export function undoBoardHistory<T>(
  history: BoardHistoryState<T>,
  currentSnapshot: T
): { nextHistory: BoardHistoryState<T>; restored: T | null } {
  if (history.past.length === 0) {
    return { nextHistory: history, restored: null };
  }
  const restored = history.past[history.past.length - 1];
  const nextPast = history.past.slice(0, -1);
  const nextFuture = [...history.future, currentSnapshot];
  return {
    nextHistory: {
      past: nextPast,
      future:
        nextFuture.length > history.maxEntries
          ? nextFuture.slice(nextFuture.length - history.maxEntries)
          : nextFuture,
      maxEntries: history.maxEntries,
    },
    restored,
  };
}

/**
 * Pops the latest snapshot from `future` and pushes `currentSnapshot` onto `past`.
 */
export function redoBoardHistory<T>(
  history: BoardHistoryState<T>,
  currentSnapshot: T
): { nextHistory: BoardHistoryState<T>; restored: T | null } {
  if (history.future.length === 0) {
    return { nextHistory: history, restored: null };
  }
  const restored = history.future[history.future.length - 1];
  const nextFuture = history.future.slice(0, -1);
  const nextPast = [...history.past, currentSnapshot];
  return {
    nextHistory: {
      past:
        nextPast.length > history.maxEntries
          ? nextPast.slice(nextPast.length - history.maxEntries)
          : nextPast,
      future: nextFuture,
      maxEntries: history.maxEntries,
    },
    restored,
  };
}

export type UndoRedoKeyAction = 'undo' | 'redo' | null;

/**
 * Detects Ctrl+Z / Cmd+Z (undo) and Ctrl+Y / Ctrl+Shift+Z / Cmd+Shift+Z (redo).
 * Uses both `code` (KeyZ/KeyY) and `key` so it works identically on Persian (FA) and English (EN) keyboards!
 */
export function detectUndoRedoKeyAction(e: {
  key: string;
  code?: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}): UndoRedoKeyAction {
  if (e.altKey) return null;
  const primaryModifier = e.ctrlKey || e.metaKey;
  if (!primaryModifier) return null;

  const lowerKey = (e.key || '').toLowerCase();
  const isZKey = e.code === 'KeyZ' || lowerKey === 'z' || e.key === 'ظ';
  const isYKey = e.code === 'KeyY' || lowerKey === 'y' || e.key === 'غ';

  if (isZKey) {
    return e.shiftKey ? 'redo' : 'undo';
  }
  if (isYKey && !e.shiftKey) {
    return 'redo';
  }
  return null;
}
