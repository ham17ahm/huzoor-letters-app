import type { GenerateReplyResult, LetterBoundary } from '@/types/letter';

export function normalizeBoundaries(value: unknown): LetterBoundary[] {
  if (!Array.isArray(value)) {
    throw new Error('Gemini did not return a JSON array of letter boundaries.');
  }

  return value.map((item: unknown, index: number) => {
    const obj = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
    const rawPages = Array.isArray(obj.source_pages) ? obj.source_pages : [];
    const sourcePages = rawPages
      .map((page) => Number(page))
      .filter((page): page is number => Number.isInteger(page) && page > 0);

    if (!sourcePages.length) {
      throw new Error(`Boundary ${index + 1} is missing source_pages.`);
    }

    return {
      letter_id:
        typeof obj.letter_id === 'string' && obj.letter_id.trim()
          ? obj.letter_id.trim()
          : `L${String(index + 1).padStart(3, '0')}`,
      source_pages: Array.from(new Set(sourcePages)).sort((a, b) => a - b)
    };
  });
}

export function normalizeReply(value: unknown): GenerateReplyResult {
  if (!value || typeof value !== 'object') {
    throw new Error('Gemini did not return a JSON object for the reply.');
  }

  const obj = value as Record<string, unknown>;
  const fullName = cleanText(obj.full_name, 'N/A');
  const location = cleanText(obj.location, 'N/A');
  let inquiry = cleanText(obj.inquiry, 'I have received your letter.');
  let prayer = cleanText(obj.prayer_sentence, 'May Allah Taala bless you in every way. Amin');

  if (!inquiry.startsWith('I have received your letter')) {
    inquiry = `I have received your letter ${lowercaseFirst(inquiry).replace(/^i have received your letter\s*/i, '')}`.trim();
  }
  inquiry = ensureSingleSentence(inquiry);

  if (!prayer.startsWith('May Allah Taala')) {
    prayer = `May Allah Taala ${lowercaseFirst(prayer).replace(/^may allah taala\s*/i, '')}`.trim();
  }
  if (!/\bAmin\.?$/i.test(prayer)) {
    prayer = `${prayer.replace(/[.\s]+$/g, '')}. Amin`;
  }

  return {
    full_name: fullName,
    location,
    inquiry,
    prayer_sentence: prayer
  };
}

function cleanText(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.replace(/\s+/g, ' ').trim();
  return cleaned || fallback;
}

function lowercaseFirst(value: string): string {
  if (!value) return value;
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function ensureSingleSentence(value: string): string {
  const cleaned = value.trim();
  if (!cleaned) return cleaned;
  if (/[.!?]$/.test(cleaned)) return cleaned;
  return `${cleaned}.`;
}
