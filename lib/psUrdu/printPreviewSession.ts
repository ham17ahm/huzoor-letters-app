import type { PsUrduLetterRecord } from '@/types/psUrdu';

const STORAGE_KEY_PREFIX = 'huzoor-ps-urdu-print-preview:';
const MAX_AGE_MS = 30 * 60 * 1000;

type PrintPreviewPayload = {
  letters: PsUrduLetterRecord[];
  createdAt: number;
};

export function openPsUrduPrintPreviewTab(letters: PsUrduLetterRecord[]): void {
  if (typeof window === 'undefined') return;

  cleanupOldPreviewSessions();
  const token = crypto.randomUUID();
  const payload: PrintPreviewPayload = { letters, createdAt: Date.now() };
  window.localStorage.setItem(getStorageKey(token), JSON.stringify(payload));
  window.open(
    `/ps-urdu/print?token=${encodeURIComponent(token)}`,
    '_blank',
    'noopener,noreferrer'
  );
}

export function readPsUrduPrintPreviewSession(token: string | null): PsUrduLetterRecord[] {
  if (typeof window === 'undefined' || !token) return [];

  cleanupOldPreviewSessions();
  const raw = window.localStorage.getItem(getStorageKey(token));
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Partial<PrintPreviewPayload>;
    if (!Array.isArray(parsed.letters) || typeof parsed.createdAt !== 'number') return [];
    return parsed.letters as PsUrduLetterRecord[];
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
