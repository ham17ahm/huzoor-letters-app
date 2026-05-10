import type { GenerateReplyResult, LetterRecord } from '@/types/letter';

export type LetterProcessorContext = {
  index: number;
  total: number;
  pdfSessionId: string;
};

export type LetterProcessor = {
  id: string;
  beforeGenerate?: (letter: LetterRecord, context: LetterProcessorContext) => LetterRecord;
  afterGenerate?: (
    generatedLetter: LetterRecord,
    context: LetterProcessorContext & {
      originalLetter: LetterRecord;
      requestLetter: LetterRecord;
      reply: GenerateReplyResult;
    }
  ) => LetterRecord;
};

const preserveManualNoteProcessor: LetterProcessor = {
  id: 'preserve-manual-note',
  afterGenerate: (generatedLetter, context) => ({
    ...generatedLetter,
    note: context.originalLetter.note
  })
};

export const DEFAULT_LETTER_PROCESSORS: LetterProcessor[] = [preserveManualNoteProcessor];

export function applyBeforeGenerateProcessors(
  letter: LetterRecord,
  processors: LetterProcessor[],
  context: LetterProcessorContext
): LetterRecord {
  return processors.reduce((currentLetter, processor) => {
    if (!processor.beforeGenerate) return currentLetter;
    try {
      return processor.beforeGenerate(currentLetter, context);
    } catch (error) {
      throw new Error(formatProcessorError(processor.id, 'beforeGenerate', error));
    }
  }, letter);
}

export function applyAfterGenerateProcessors(
  generatedLetter: LetterRecord,
  processors: LetterProcessor[],
  context: LetterProcessorContext & {
    originalLetter: LetterRecord;
    requestLetter: LetterRecord;
    reply: GenerateReplyResult;
  }
): LetterRecord {
  return processors.reduce((currentLetter, processor) => {
    if (!processor.afterGenerate) return currentLetter;
    try {
      return processor.afterGenerate(currentLetter, context);
    } catch (error) {
      throw new Error(formatProcessorError(processor.id, 'afterGenerate', error));
    }
  }, generatedLetter);
}

function formatProcessorError(
  processorId: string,
  phase: 'beforeGenerate' | 'afterGenerate',
  error: unknown
): string {
  if (error instanceof Error && error.message) {
    return `Processor "${processorId}" failed during ${phase}: ${error.message}`;
  }
  return `Processor "${processorId}" failed during ${phase}.`;
}
