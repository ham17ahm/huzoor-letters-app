import {
  normalizeDuaUrduBulkReplies,
  normalizeDuaUrduReply
} from '../duaUrdu/validators';
import type {
  PsUrduBulkGenerateReplyResult,
  PsUrduGenerateReplyResult
} from '@/types/psUrdu';

export function normalizePsUrduReply(value: unknown): PsUrduGenerateReplyResult {
  return normalizeDuaUrduReply(value);
}

export function normalizePsUrduBulkReplies(
  value: unknown,
  requestedLetterIds: string[]
): PsUrduBulkGenerateReplyResult[] {
  return normalizeDuaUrduBulkReplies(value, requestedLetterIds);
}
