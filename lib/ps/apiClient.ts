import type {
  PsAnalyzePdfResponse,
  PsApiError,
  PsGenerateRepliesResponse,
  PsLetterRecord
} from '@/types/ps';

export { clearPdfSessionRequest } from '@/lib/apiClient';

export async function analyzePdfRequest(
  file: File,
  signal?: AbortSignal
): Promise<PsAnalyzePdfResponse> {
  const formData = new FormData();
  formData.append('pdf', file);

  const response = await fetch('/api/ps/analyze-pdf', {
    method: 'POST',
    body: formData,
    signal
  });

  return parseApiResponse<PsAnalyzePdfResponse>(response, 'Failed to analyze PDF.');
}

export async function generateRepliesRequest(
  pdfSessionId: string,
  letters: PsLetterRecord[],
  signal?: AbortSignal
): Promise<PsGenerateRepliesResponse> {
  const formData = new FormData();
  formData.append('pdfSessionId', pdfSessionId);
  formData.append('letters', JSON.stringify(letters));

  const response = await fetch('/api/ps/generate-replies', {
    method: 'POST',
    body: formData,
    signal
  });

  return parseApiResponse<PsGenerateRepliesResponse>(response, 'Failed to generate replies.');
}

async function parseApiResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const bodyText = await response.text();
  let data: Partial<T> & PsApiError = {};

  if (bodyText) {
    try {
      data = JSON.parse(bodyText) as Partial<T> & PsApiError;
    } catch {
      if (!response.ok) throw new Error(fallbackMessage);
      throw new Error('The server returned an invalid response.');
    }
  }

  if (!response.ok) throw new Error(data.error || fallbackMessage);
  return data as T;
}
