import { normalizeNoteFreeBulkReplies } from '../noteFree/replyValidation';
import type {
  DuaUrduBulkGenerateReplyResult,
  DuaUrduGenerateReplyResult
} from '@/types/duaUrdu';

export function normalizeDuaUrduReply(value: unknown): DuaUrduGenerateReplyResult {
  if (!value || typeof value !== 'object') {
    throw new Error('Gemini did not return a JSON object for the reply.');
  }

  const obj = value as Record<string, unknown>;
  return {
    full_name: cleanText(obj.full_name, 'دستیاب نہیں'),
    location: cleanText(obj.location, 'دستیاب نہیں'),
    inquiry: cleanText(obj.inquiry, ''),
    prayer_sentence: cleanText(obj.prayer_sentence, '')
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
