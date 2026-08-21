import type {
  BulkGenerateReplyResult,
  GenerateReplyResult,
  LetterRecord
} from '@/types/letter';

export type NoteFreeLetterRecord = Omit<LetterRecord, 'note'>;

export type NoteFreeLetterBoundary = Pick<NoteFreeLetterRecord, 'letter_id' | 'source_pages'>;

export type NoteFreeGenerateReplyResult = GenerateReplyResult;
export type NoteFreeBulkGenerateReplyResult = BulkGenerateReplyResult;

export type NoteFreeApiError = {
  error?: string;
};

export type NoteFreeAnalyzePdfResponse = {
  letters: NoteFreeLetterRecord[];
  pdfSessionId: string;
  rawText?: string;
};

export type NoteFreeGenerateRepliesResponse = {
  replies: NoteFreeBulkGenerateReplyResult[];
  rawText?: string;
};
