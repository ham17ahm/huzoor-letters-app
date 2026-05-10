import type { LetterProcessor } from '@/lib/letterProcessors';

export const trimNoteForRequestProcessor: LetterProcessor = {
  id: 'trim-note-for-request',
  beforeGenerate: (letter) => ({
    ...letter,
    note: letter.note.trim()
  })
};

export const ensureLocationFallbackProcessor: LetterProcessor = {
  id: 'ensure-location-fallback',
  afterGenerate: (generatedLetter) => ({
    ...generatedLetter,
    location: generatedLetter.location.trim() || 'N/A'
  })
};
