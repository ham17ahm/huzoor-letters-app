import type {
  AnalyzePdfResponse,
  ApiError,
  GenerateRepliesResponse
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
  const bodyText = await response.text();
  let data: Partial<T> & ApiError = {};

  if (bodyText) {
    try {
      data = JSON.parse(bodyText) as Partial<T> & ApiError;
    } catch {
      if (!response.ok) throw new Error(fallbackMessage);
      throw new Error('The server returned an invalid response.');
    }
  }

  if (!response.ok) throw new Error(data.error || fallbackMessage);
  return data as T;
}
