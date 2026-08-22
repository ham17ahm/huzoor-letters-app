import { normalizeNoteFreeBulkReplies } from '../noteFree/replyValidation';
import type {
  PsUrduBulkGenerateReplyResult,
  PsUrduGenerateReplyResult
} from '@/types/psUrdu';

const INQUIRY_PREFIX = 'آپ کا خط حضورانور ایدہ اللہ تعالیٰ بنصرہ العزیز کی خدمت میں موصول ہوا';
const AMIN_VARIANTS_RE = /(?:آمین|آمین)/u;

export function normalizePsUrduReply(value: unknown): PsUrduGenerateReplyResult {
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

  if (!AMIN_VARIANTS_RE.test(prayer)) {
    prayer = `${prayer.replace(/\s+$/u, '')} آمین`;
  }

  return {
    full_name: fullName,
    location,
    inquiry,
    prayer_sentence: prayer
  };
}

export function normalizePsUrduBulkReplies(
  value: unknown,
  requestedLetterIds: string[]
): PsUrduBulkGenerateReplyResult[] {
  return normalizeNoteFreeBulkReplies(value, requestedLetterIds, normalizePsUrduReply);
}

function cleanText(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.replace(/\s+/g, ' ').trim();
  return cleaned || fallback;
}
