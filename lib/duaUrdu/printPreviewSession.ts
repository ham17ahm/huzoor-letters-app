import type { DuaUrduLetterRecord } from '@/types/duaUrdu';

const STORAGE_KEY_PREFIX = 'huzoor-dua-urdu-print-preview:';
const MAX_AGE_MS = 30 * 60 * 1000;

type PrintPreviewPayload = {
  letters: DuaUrduLetterRecord[];
  createdAt: number;
};

export function openDuaUrduPrintPreviewTab(letters: DuaUrduLetterRecord[]): void {
  if (typeof window === 'undefined') return;

  cleanupOldPreviewSessions();
  const token = crypto.randomUUID();
  const payload: PrintPreviewPayload = { letters, createdAt: Date.now() };
  window.localStorage.setItem(getStorageKey(token), JSON.stringify(payload));
  window.open(
    `/dua-urdu/print?token=${encodeURIComponent(token)}`,
    '_blank',
    'noopener,noreferrer'
  );
}

export function readDuaUrduPrintPreviewSession(token: string | null): DuaUrduLetterRecord[] {
  if (typeof window === 'undefined' || !token) return [];

  cleanupOldPreviewSessions();
  const raw = window.localStorage.getItem(getStorageKey(token));
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Partial<PrintPreviewPayload>;
    if (!Array.isArray(parsed.letters) || typeof parsed.createdAt !== 'number') return [];
    return parsed.letters as DuaUrduLetterRecord[];
  } catch {
    return [];
  }
}

function cleanupOldPreviewSessions(): void {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index);
    if (!key || !key.startsWith(STORAGE_KEY_PREFIX)) continue;

    const raw = window.localStorage.getItem(key);
    if (!raw) {
      window.localStorage.removeItem(key);
      continue;
    }

    try {
      const payload = JSON.parse(raw) as Partial<PrintPreviewPayload>;
      if (typeof payload.createdAt !== 'number' || now - payload.createdAt > MAX_AGE_MS) {
        window.localStorage.removeItem(key);
      }
    } catch {
      window.localStorage.removeItem(key);
    }
  }
}

function getStorageKey(token: string): string {
  return `${STORAGE_KEY_PREFIX}${token}`;
}
