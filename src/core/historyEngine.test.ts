import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBoardHistory,
  pushBoardHistory,
  undoBoardHistory,
  redoBoardHistory,
  detectUndoRedoKeyAction,
} from './historyEngine';

test('Board history supports multi-step undo, redo, and future clearing on new edit', () => {
  let h = createBoardHistory<string>(3);
  h = pushBoardHistory(h, 's0');
  h = pushBoardHistory(h, 's1');
  h = pushBoardHistory(h, 's2');

  const u1 = undoBoardHistory(h, 's3');
  assert.equal(u1.restored, 's2');
  assert.equal(u1.nextHistory.past.length, 2);
  assert.equal(u1.nextHistory.future.length, 1);

  const u2 = undoBoardHistory(u1.nextHistory, 's2');
  assert.equal(u2.restored, 's1');
  assert.equal(u2.nextHistory.future.length, 2);

  const r1 = redoBoardHistory(u2.nextHistory, 's1');
  assert.equal(r1.restored, 's2');
  assert.equal(r1.nextHistory.future.length, 1);

  // Pushing a new change clears redo future
  const afterEdit = pushBoardHistory(r1.nextHistory, 's2');
  assert.equal(afterEdit.future.length, 0);
  assert.equal(afterEdit.past.length, 3);
});

test('Board history respects maxEntries limit', () => {
  let h = createBoardHistory<number>(2);
  h = pushBoardHistory(h, 1);
  h = pushBoardHistory(h, 2);
  h = pushBoardHistory(h, 3);
  assert.deepEqual(h.past, [2, 3]);
});

test('detectUndoRedoKeyAction recognizes Ctrl+Z, Cmd+Z, Ctrl+Y, Ctrl+Shift+Z on EN and Persian keyboards', () => {
  // English Ctrl+Z
  assert.equal(
    detectUndoRedoKeyAction({
      key: 'z',
      code: 'KeyZ',
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      altKey: false,
    }),
    'undo'
  );
  // Persian layout Ctrl+ظ (KeyZ)
  assert.equal(
    detectUndoRedoKeyAction({
      key: 'ظ',
      code: 'KeyZ',
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      altKey: false,
    }),
    'undo'
  );
  // macOS Cmd+Z
  assert.equal(
    detectUndoRedoKeyAction({
      key: 'z',
      code: 'KeyZ',
      ctrlKey: false,
      metaKey: true,
      shiftKey: false,
      altKey: false,
    }),
    'undo'
  );
  // Ctrl+Shift+Z -> redo
  assert.equal(
    detectUndoRedoKeyAction({
      key: 'Z',
      code: 'KeyZ',
      ctrlKey: true,
      metaKey: false,
      shiftKey: true,
      altKey: false,
    }),
    'redo'
  );
  // Ctrl+Y and Persian Ctrl+غ -> redo
  assert.equal(
    detectUndoRedoKeyAction({
      key: 'y',
      code: 'KeyY',
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      altKey: false,
    }),
    'redo'
  );
  assert.equal(
    detectUndoRedoKeyAction({
      key: 'غ',
      code: 'KeyY',
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      altKey: false,
    }),
    'redo'
  );
  // Plain Z without Ctrl/Meta -> null
  assert.equal(
    detectUndoRedoKeyAction({
      key: 'z',
      code: 'KeyZ',
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      altKey: false,
    }),
    null
  );
});
