import { clearPdfSessionRequest } from '@/lib/apiClient';
import type {
  NoteFreeAnalyzePdfResponse,
  NoteFreeApiError,
  NoteFreeGenerateRepliesResponse,
  NoteFreeLetterRecord
} from '@/types/noteFree';

export type NoteFreeApiClient = {
  analyzePdfRequest: (file: File, signal?: AbortSignal) => Promise<NoteFreeAnalyzePdfResponse>;
  generateRepliesRequest: (
    pdfSessionId: string,
    letters: NoteFreeLetterRecord[],
    signal?: AbortSignal
  ) => Promise<NoteFreeGenerateRepliesResponse>;
  clearPdfSessionRequest: typeof clearPdfSessionRequest;
};

export function createNoteFreeApiClient(apiBasePath: string): NoteFreeApiClient {
  return {
    async analyzePdfRequest(file, signal) {
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await fetch(`${apiBasePath}/analyze-pdf`, {
        method: 'POST',
        body: formData,
        signal
      });

      return parseApiResponse<NoteFreeAnalyzePdfResponse>(response, 'Failed to analyze PDF.');
    },

    async generateRepliesRequest(pdfSessionId, letters, signal) {
      const formData = new FormData();
      formData.append('pdfSessionId', pdfSessionId);
      formData.append('letters', JSON.stringify(letters));

      const response = await fetch(`${apiBasePath}/generate-replies`, {
        method: 'POST',
        body: formData,
        signal
      });

      return parseApiResponse<NoteFreeGenerateRepliesResponse>(
        response,
        'Failed to generate replies.'
      );
    },

    clearPdfSessionRequest
  };
}

async function parseApiResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const bodyText = await response.text();
  let data: Partial<T> & NoteFreeApiError = {};

  if (bodyText) {
    try {
      data = JSON.parse(bodyText) as Partial<T> & NoteFreeApiError;
    } catch {
      if (!response.ok) throw new Error(fallbackMessage);
      throw new Error('The server returned an invalid response.');
    }
  }

  if (!response.ok) throw new Error(data.error || fallbackMessage);
  return data as T;
}
