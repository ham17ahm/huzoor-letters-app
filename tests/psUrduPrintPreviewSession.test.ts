import assert from 'node:assert/strict';
import test from 'node:test';
import {
  openPsUrduPrintPreviewTab,
  readPsUrduPrintPreviewSession
} from '../lib/psUrdu/printPreviewSession.js';
import type { PsUrduLetterRecord } from '../types/psUrdu.js';

const STORAGE_PREFIX = 'huzoor-ps-urdu-print-preview:';

test('PS Urdu print preview uses its isolated route and storage namespace', () => {
  const storage = new MemoryStorage();
  let openedUrl = '';
  installWindow(storage, (url) => {
    openedUrl = String(url);
  });

  try {
    const letters = [makeLetter()];
    openPsUrduPrintPreviewTab(letters);

    assert.match(openedUrl, /^\/ps-urdu\/print\?token=/);
    const token = new URL(openedUrl, 'https://example.test').searchParams.get('token');
    assert.deepEqual(readPsUrduPrintPreviewSession(token), letters);
    assert.equal(storage.length, 1);
    assert.match(storage.key(0) || '', new RegExp(`^${STORAGE_PREFIX}`));
  } finally {
    uninstallWindow();
  }
});

test('PS Urdu print preview rejects missing and expired sessions', () => {
  const storage = new MemoryStorage();
  installWindow(storage, () => undefined);

  try {
    storage.setItem(
      `${STORAGE_PREFIX}expired`,
      JSON.stringify({ letters: [makeLetter()], createdAt: Date.now() - 31 * 60 * 1000 })
    );

    assert.deepEqual(readPsUrduPrintPreviewSession(null), []);
    assert.deepEqual(readPsUrduPrintPreviewSession('missing'), []);
    assert.deepEqual(readPsUrduPrintPreviewSession('expired'), []);
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

function makeLetter(): PsUrduLetterRecord {
  return {
    letter_id: 'L001',
    source_pages: [1],
    full_name: 'مکرم احمد خان صاحب',
    location: 'لندن',
    inquiry: 'آپ کا خط ملا۔',
    prayer_sentence: 'اللہ تعالیٰ آپ کو کامیابی عطا فرمائے۔ آمین'
  };
}
