const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export async function generateWithGeminiPdf(params: {
  pdfBase64: string;
  prompt: string;
  signal?: AbortSignal;
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY in .env.local');
  }

  const response = await fetch(`${GEMINI_BASE_URL}/${model}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    signal: params.signal,
    body: JSON.stringify({
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
        temperature: 0.1
      }
    })
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
