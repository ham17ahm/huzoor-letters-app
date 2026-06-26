import type {
  BulkGenerateReplyResult,
  GenerateReplyResult,
  LetterRecord
} from '@/types/letter';

/**
 * PS workflow letter record.
 *
 * Identical to the standard {@link LetterRecord} but without the `note` field:
 * the PS route generates replies purely from the letter content, with no
 * operator-entered note anchor.
 */
export type PsLetterRecord = Omit<LetterRecord, 'note'>;

export type PsLetterBoundary = Pick<PsLetterRecord, 'letter_id' | 'source_pages'>;

/**
 * Reply result shapes are note-free already, so they are shared with the
 * standard workflow.
 */
export type PsGenerateReplyResult = GenerateReplyResult;
export type PsBulkGenerateReplyResult = BulkGenerateReplyResult;

export type PsApiError = {
  error?: string;
};

export type PsAnalyzePdfResponse = {
  letters: PsLetterRecord[];
  pdfSessionId: string;
  rawText?: string;
};

export type PsGenerateRepliesResponse = {
  replies: PsBulkGenerateReplyResult[];
  rawText?: string;
};
