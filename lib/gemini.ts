const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

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

  const response = await fetch(`${GEMINI_BASE_URL}/${model}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    signal: params.signal,
    body: JSON.stringify(requestBody)
  });

  const bodyText = await response.text();

  if (!response.ok) {
    throw new Error(`Gemini request failed (${response.status}): ${bodyText}`);
  }

  let body: GeminiResponse;
  try {
    body = JSON.parse(bodyText) as GeminiResponse;
  } catch {
    throw new Error(`Gemini returned non-JSON response: ${bodyText}`);
  }

  const text = body.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('\n')
    .trim();

  if (!text) {
    throw new Error(`Gemini returned an empty response: ${bodyText}`);
  }

  return text;
}

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};
