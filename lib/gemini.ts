import { Agent, fetch as undiciFetch } from 'undici';
import { collectGeminiSseText } from '@/lib/geminiSse';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_GEMINI_REQUEST_TIMEOUT_MS = 20 * 60 * 1000;

const geminiDispatcher = new Agent({
  headersTimeout: getGeminiRequestTimeoutMs(),
  bodyTimeout: getGeminiRequestTimeoutMs()
});

export function shouldLogGeminiRequests(): boolean {
  return process.env.DEBUG_GEMINI_REQUESTS === 'true';
}

export async function generateWithGeminiPdf(params: {
  pdfBase64: string;
  prompt: string;
  model: string;
  signal?: AbortSignal;
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = params.model;

  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY in .env.local');
  }

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            inline_data: {
              mime_type: 'application/pdf',
              data: params.pdfBase64
            }
          },
          { text: params.prompt }
        ]
      }
    ],
    generationConfig: {
      mediaResolution: 'MEDIA_RESOLUTION_HIGH',
      temperature: 0.1
    }
  };

  if (shouldLogGeminiRequests()) {
    console.log('[Gemini] generateContent request body:', JSON.stringify(requestBody, null, 2));
  }

  let response;
  try {
    response = await undiciFetch(
      `${GEMINI_BASE_URL}/${model}:streamGenerateContent?alt=sse`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        dispatcher: geminiDispatcher,
        signal: params.signal,
        body: JSON.stringify(requestBody)
      }
    );
  } catch (error) {
    throw describeGeminiTransportError(error);
  }

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(`Gemini request failed (${response.status}): ${bodyText}`);
  }

  if (!response.body) {
    throw new Error('Gemini returned a streaming response without a body.');
  }

  try {
    return await collectGeminiSseText(response.body);
  } catch (error) {
    throw describeGeminiTransportError(error);
  }
}

function getGeminiRequestTimeoutMs(): number {
  const configured = Number(process.env.GEMINI_REQUEST_TIMEOUT_MS);
  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_GEMINI_REQUEST_TIMEOUT_MS;
}

function describeGeminiTransportError(error: unknown): Error {
  if (error instanceof Error && error.name === 'AbortError') return error;

  const code = findErrorCode(error);
  if (code === 'UND_ERR_HEADERS_TIMEOUT' || code === 'UND_ERR_BODY_TIMEOUT') {
    return new Error(
      `Gemini did not send data within ${Math.round(
        getGeminiRequestTimeoutMs() / 60000
      )} minutes. The request may be too large or Gemini may be overloaded.`
    );
  }

  return error instanceof Error ? error : new Error('Gemini request failed.');
}

function findErrorCode(error: unknown): string | undefined {
  let current = error;

  for (let depth = 0; depth < 5 && current && typeof current === 'object'; depth += 1) {
    const value = current as { code?: unknown; cause?: unknown };
    if (typeof value.code === 'string') return value.code;
    current = value.cause;
  }

  return undefined;
}
