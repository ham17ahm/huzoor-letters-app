import assert from 'node:assert/strict';
import test from 'node:test';
import {
  openDuaUrduPrintPreviewTab,
  readDuaUrduPrintPreviewSession
} from '../lib/duaUrdu/printPreviewSession.js';
import type { DuaUrduLetterRecord } from '../types/duaUrdu.js';

const STORAGE_PREFIX = 'huzoor-dua-urdu-print-preview:';

test('Dua Urdu print preview stores and reads a workflow-scoped payload', () => {
  const storage = new MemoryStorage();
  let openedUrl = '';
  installWindow(storage, (url) => {
    openedUrl = String(url);
  });

  try {
    const letters = [makeLetter()];
    openDuaUrduPrintPreviewTab(letters);

    assert.match(openedUrl, /^\/dua-urdu\/print\?token=/);
    const token = new URL(openedUrl, 'https://example.test').searchParams.get('token');
    assert.deepEqual(readDuaUrduPrintPreviewSession(token), letters);
  } finally {
    uninstallWindow();
  }
});

test('Dua Urdu print preview rejects missing and expired sessions', () => {
  const storage = new MemoryStorage();
  installWindow(storage, () => undefined);

  try {
    storage.setItem(
      `${STORAGE_PREFIX}expired`,
      JSON.stringify({ letters: [makeLetter()], createdAt: Date.now() - 31 * 60 * 1000 })
    );

    assert.deepEqual(readDuaUrduPrintPreviewSession(null), []);
    assert.deepEqual(readDuaUrduPrintPreviewSession('missing'), []);
    assert.deepEqual(readDuaUrduPrintPreviewSession('expired'), []);
    assert.equal(storage.getItem(`${STORAGE_PREFIX}expired`), null);
  } finally {
    uninstallWindow();
  }
});

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

function installWindow(storage: Storage, open: (url?: string | URL) => void) {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage: storage, open }
  });
}

function uninstallWindow() {
  Reflect.deleteProperty(globalThis, 'window');
}

function makeLetter(): DuaUrduLetterRecord {
  return {
    letter_id: 'L001',
    source_pages: [1],
    full_name: 'احمد خان',
    location: 'لندن',
    inquiry: 'آپ کا خط موصول ہوا۔',
    prayer_sentence: 'اللہ تعالیٰ آپ کو کامیابی عطا فرمائے۔ آمین۔'
  };
}
