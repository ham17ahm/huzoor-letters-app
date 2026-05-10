import type { GenerateReplyResult, LetterRecord } from '@/types/letter';

export type ApiError = {
  error?: string;
};

export type AnalyzePdfResponse = {
  letters: LetterRecord[];
  pdfSessionId: string;
  rawText?: string;
};

export type GenerateReplyResponse = {
  reply: GenerateReplyResult;
  rawText?: string;
};
