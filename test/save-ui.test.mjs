import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SaveStateManager, createSaveUI } from '../dist/index.js';

// A minimal DOM keeps this regression runnable without browser dependencies.
function element() {
  return { children: [], style: {}, setAttribute() {}, appendChild(child) { this.children.push(child); } };
}

test('a successful first save enables Load and restores the saved state', () => {
  const stored = new Map();
  globalThis.localStorage = {
    getItem: key => stored.get(key) ?? null,
    setItem: (key, value) => stored.set(key, value),
    removeItem: key => stored.delete(key),
  };
  globalThis.document = { createElement: element };
  const manager = new SaveStateManager('test', { showToasts: false });
  let current = { score: 42, items: new Set(['key']), stats: new Map([['lives', 3]]) };
  const buttons = createSaveUI(manager, () => current, saved => { current = saved; }, element());
  assert.equal(buttons.loadBtn.disabled, true);
  buttons.saveBtn.onclick();
  assert.equal(buttons.loadBtn.disabled, false);
  current = { score: 0 };
  buttons.loadBtn.onclick();
  assert.equal(current.score, 42);
  assert.deepEqual(current.items, new Set(['key']));
  assert.deepEqual(current.stats, new Map([['lives', 3]]));
});

test('a failed save keeps Load disabled', () => {
  globalThis.document = { createElement: element };
  const manager = { hasSave: () => false, save: () => false };
  const buttons = createSaveUI(manager, () => ({}), () => {}, element());
  buttons.saveBtn.onclick();
  assert.equal(buttons.loadBtn.disabled, true);
});
