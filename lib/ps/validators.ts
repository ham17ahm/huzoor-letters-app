import type { PsBulkGenerateReplyResult, PsGenerateReplyResult } from '@/types/ps';
import { normalizeNoteFreeBulkReplies } from '../noteFree/replyValidation';

/**
 * PS-specific reply normalization.
 *
 * Mirrors `lib/validators.ts` but enforces the PS route's inquiry convention
 * instead of the standard route's "I have received your letter" prefix. The PS
 * inquiry is two sentences (an acknowledgment beginning with the required prefix
 * below, followed by a fixed "offered his prayers" sentence), so we enforce the
 * prefix and ensure terminal punctuation without collapsing it to one sentence.
 */

const PS_INQUIRY_PREFIX = 'Huzoor Anwar (may Allah be his Helper) has received your letter';
const PS_INQUIRY_PREFIX_RE = /^huzoor anwar \(may allah be his helper\) has received your letter\s*/i;

const PS_INQUIRY_FALLBACK = `${PS_INQUIRY_PREFIX}. Following the perusal of your letter, Huzoor Anwar (aa) has offered his prayers.`;
const PS_PRAYER_FALLBACK = 'May Allah Taala bless you in every way. Amin';

export function normalizePsReply(value: unknown): PsGenerateReplyResult {
  if (!value || typeof value !== 'object') {
    throw new Error('Gemini did not return a JSON object for the reply.');
  }

  const obj = value as Record<string, unknown>;
  const fullName = cleanText(obj.full_name, 'N/A');
  const location = cleanText(obj.location, 'N/A');
  let inquiry = cleanText(obj.inquiry, PS_INQUIRY_FALLBACK);
  let prayer = cleanText(obj.prayer_sentence, PS_PRAYER_FALLBACK);

  // Enforce the PS inquiry prefix. Correct model output already starts with the
  // prefix, so this branch only fixes output that is missing or malforms it.
  if (!inquiry.startsWith(PS_INQUIRY_PREFIX)) {
    inquiry = `${PS_INQUIRY_PREFIX} ${lowercaseFirst(inquiry).replace(PS_INQUIRY_PREFIX_RE, '')}`.trim();
  }
  inquiry = ensureTerminalPunctuation(inquiry);

  if (!prayer.startsWith('May Allah Taala')) {
    prayer = `May Allah Taala ${lowercaseFirst(prayer).replace(/^may allah taala\s*/i, '')}`.trim();
  }
  if (!/\bAmin\.?$/i.test(prayer)) {
    prayer = `${prayer.replace(/[.\s]+$/g, '')}. Amin`;
  }

  return {
    full_name: fullName,
    location,
    inquiry,
    prayer_sentence: prayer
  };
}

export function normalizePsBulkReplies(
  value: unknown,
  requestedLetterIds: string[]
): PsBulkGenerateReplyResult[] {
  return normalizeNoteFreeBulkReplies(value, requestedLetterIds, normalizePsReply);
}

function cleanText(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.replace(/\s+/g, ' ').trim();
  return cleaned || fallback;
}

function lowercaseFirst(value: string): string {
  if (!value) return value;
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function ensureTerminalPunctuation(value: string): string {
  const cleaned = value.trim();
  if (!cleaned) return cleaned;
  if (/[.!?]$/.test(cleaned)) return cleaned;
  return `${cleaned}.`;
}
