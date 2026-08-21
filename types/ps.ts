import type {
  NoteFreeAnalyzePdfResponse,
  NoteFreeApiError,
  NoteFreeBulkGenerateReplyResult,
  NoteFreeGenerateRepliesResponse,
  NoteFreeGenerateReplyResult,
  NoteFreeLetterBoundary,
  NoteFreeLetterRecord
} from '@/types/noteFree';

/**
 * PS workflow letter record.
 *
 * Identical to the standard {@link LetterRecord} but without the `note` field:
 * the PS route generates replies purely from the letter content, with no
 * operator-entered note anchor.
 */
export type PsLetterRecord = NoteFreeLetterRecord;

export type PsLetterBoundary = NoteFreeLetterBoundary;

/**
 * Reply result shapes are note-free already, so they are shared with the
 * standard workflow.
 */
export type PsGenerateReplyResult = NoteFreeGenerateReplyResult;
export type PsBulkGenerateReplyResult = NoteFreeBulkGenerateReplyResult;

export type PsApiError = NoteFreeApiError;
export type PsAnalyzePdfResponse = NoteFreeAnalyzePdfResponse;
export type PsGenerateRepliesResponse = NoteFreeGenerateRepliesResponse;
