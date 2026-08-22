import { normalizeNoteFreeBulkReplies } from '../noteFree/replyValidation';
import type {
  DuaUrduBulkGenerateReplyResult,
  DuaUrduGenerateReplyResult
} from '@/types/duaUrdu';

const INQUIRY_PREFIX = 'آپ کا خط ملا';
const AMIN_VARIANTS_RE = /(?:آمین|آمین)/u;

export function normalizeDuaUrduReply(value: unknown): DuaUrduGenerateReplyResult {
  if (!value || typeof value !== 'object') {
    throw new Error('Gemini did not return a JSON object for the reply.');
  }

  const obj = value as Record<string, unknown>;
  const fullName = cleanText(obj.full_name, 'N/A');
  const location = cleanText(obj.location, 'N/A');
  let inquiry = cleanText(obj.inquiry, '');
  let prayer = cleanText(obj.prayer_sentence, '');

  if (!inquiry) {
    throw new Error('Gemini returned an empty inquiry.');
  }
  if (!prayer) {
    throw new Error('Gemini returned an empty prayer_sentence.');
  }

  if (!inquiry.startsWith(INQUIRY_PREFIX)) {
    inquiry = `${INQUIRY_PREFIX} ${inquiry}`.trim();
  }

  // Treat common Unicode spellings of Amin permissively. Append the requested
  // form only when no Amin is present, avoiding rigid rewrites and duplicates.
  if (!AMIN_VARIANTS_RE.test(prayer)) {
    prayer = `${prayer.replace(/\s+$/u, '')} آمین`;
  }

  return {
    full_name: fullName,
    location,
    inquiry,
    prayer_sentence: prayer
  };
}

export function normalizeDuaUrduBulkReplies(
  value: unknown,
  requestedLetterIds: string[]
): DuaUrduBulkGenerateReplyResult[] {
  return normalizeNoteFreeBulkReplies(value, requestedLetterIds, normalizeDuaUrduReply);
}

function cleanText(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.replace(/\s+/g, ' ').trim();
  return cleaned || fallback;
}
