import type { LetterRecord } from '@/types/letter';

const STORAGE_KEY_PREFIX = 'huzoor-print-preview:';
const MAX_AGE_MS = 30 * 60 * 1000;

type PrintPreviewPayload = {
  letters: LetterRecord[];
  createdAt: number;
};

export function openPrintPreviewTab(letters: LetterRecord[]): void {
  if (typeof window === 'undefined') return;

  const token = crypto.randomUUID();
  const key = getStorageKey(token);
  const payload: PrintPreviewPayload = {
    letters,
    createdAt: Date.now()
  };

  window.localStorage.setItem(key, JSON.stringify(payload));
  window.open(`/print?token=${encodeURIComponent(token)}`, '_blank', 'noopener,noreferrer');
}

export function readPrintPreviewSession(token: string | null): LetterRecord[] {
  if (typeof window === 'undefined' || !token) return [];

  cleanupOldPreviewSessions();
  const raw = window.localStorage.getItem(getStorageKey(token));
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Partial<PrintPreviewPayload>;
    if (!Array.isArray(parsed.letters)) return [];
    return parsed.letters as LetterRecord[];
  } catch {
    return [];
  }
}

function cleanupOldPreviewSessions(): void {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  for (let i = window.localStorage.length - 1; i >= 0; i -= 1) {
    const key = window.localStorage.key(i);
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
