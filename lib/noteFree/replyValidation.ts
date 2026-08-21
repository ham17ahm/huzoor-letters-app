import type {
  NoteFreeBulkGenerateReplyResult,
  NoteFreeGenerateReplyResult
} from '@/types/noteFree';

export function normalizeNoteFreeBulkReplies(
  value: unknown,
  requestedLetterIds: string[],
  normalizeReply: (value: unknown) => NoteFreeGenerateReplyResult
): NoteFreeBulkGenerateReplyResult[] {
  const replyItems = getBulkReplyItems(value);

  if (!Array.isArray(replyItems)) {
    throw new Error('Gemini did not return a JSON array for the replies.');
  }

  const requestedIds = new Set(requestedLetterIds);
  const seenIds = new Set<string>();
  const replies = replyItems.map((item: unknown, index: number) => {
    const obj = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
    const letterId = typeof obj.letter_id === 'string' ? obj.letter_id.trim() : '';

    if (!letterId) {
      throw new Error(`Reply ${index + 1} is missing letter_id.`);
    }
    if (!requestedIds.has(letterId)) {
      throw new Error(`Gemini returned an unexpected letter_id: ${letterId}.`);
    }
    if (seenIds.has(letterId)) {
      throw new Error(`Gemini returned duplicate letter_id: ${letterId}.`);
    }

    seenIds.add(letterId);
    return { letter_id: letterId, ...normalizeReply(obj) };
  });

  const missingIds = requestedLetterIds.filter((letterId) => !seenIds.has(letterId));
  if (missingIds.length) {
    throw new Error(`Gemini did not return replies for: ${missingIds.join(', ')}.`);
  }

  return replies;
}

function getBulkReplyItems(value: unknown): unknown {
  if (Array.isArray(value)) return value;

  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (Array.isArray(obj.replies)) return obj.replies;
    if (Array.isArray(obj.letters)) return obj.letters;
  }

  return value;
}
