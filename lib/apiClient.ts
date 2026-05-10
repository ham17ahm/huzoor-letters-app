import type {
  AnalyzePdfResponse,
  ApiError,
  GenerateRepliesResponse,
  GenerateReplyResponse
} from '@/types/api';
import type { LetterRecord } from '@/types/letter';

export async function analyzePdfRequest(file: File, signal?: AbortSignal): Promise<AnalyzePdfResponse> {
  const formData = new FormData();
  formData.append('pdf', file);

  const response = await fetch('/api/analyze-pdf', {
    method: 'POST',
    body: formData,
    signal
  });

  return parseApiResponse<AnalyzePdfResponse>(response, 'Failed to analyze PDF.');
}

export async function generateReplyRequest(
  pdfSessionId: string,
  letter: LetterRecord,
  signal?: AbortSignal
): Promise<GenerateReplyResponse> {
  const formData = new FormData();
  formData.append('pdfSessionId', pdfSessionId);
  formData.append('letter', JSON.stringify(letter));

  const response = await fetch('/api/generate-reply', {
    method: 'POST',
    body: formData,
    signal
  });

  return parseApiResponse<GenerateReplyResponse>(
    response,
    `Failed to generate reply for ${letter.letter_id}.`
  );
}

export async function generateRepliesRequest(
  pdfSessionId: string,
  letters: LetterRecord[],
  signal?: AbortSignal
): Promise<GenerateRepliesResponse> {
  const formData = new FormData();
  formData.append('pdfSessionId', pdfSessionId);
  formData.append('letters', JSON.stringify(letters));

  const response = await fetch('/api/generate-replies', {
    method: 'POST',
    body: formData,
    signal
  });

  return parseApiResponse<GenerateRepliesResponse>(response, 'Failed to generate replies.');
}

export function clearPdfSessionRequest(pdfSessionId: string | null): Promise<void> {
  if (!pdfSessionId) return Promise.resolve();

  return fetch('/api/clear-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pdfSessionId })
  })
    .then(() => undefined)
    .catch(() => {
      // Best-effort cleanup only. Sessions also expire automatically server-side.
    });
}

async function parseApiResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const data = (await response.json()) as Partial<T> & ApiError;
  if (!response.ok) throw new Error(data.error || fallbackMessage);
  return data as T;
}
