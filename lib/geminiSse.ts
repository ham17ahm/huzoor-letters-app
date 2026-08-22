type GeminiStreamResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        thought?: boolean;
      }>;
    };
    finishReason?: string;
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
};

type SseBody = AsyncIterable<Uint8Array>;

/**
 * Collect the text deltas returned by Gemini's streamGenerateContent SSE endpoint.
 * SSE events may be split at arbitrary byte boundaries, including inside UTF-8 text.
 */
export async function collectGeminiSseText(body: SseBody): Promise<string> {
  const decoder = new TextDecoder();
  let pending = '';
  let output = '';
  let diagnostic = '';

  for await (const chunk of body) {
    pending += decoder.decode(chunk, { stream: true });
    const split = takeCompleteSseEvents(pending);
    pending = split.remainder;

    for (const event of split.events) {
      const parsed = parseGeminiSseEvent(event);
      if (!parsed) continue;
      output += extractText(parsed);
      diagnostic = extractDiagnostic(parsed) || diagnostic;
    }
  }

  pending += decoder.decode();
  if (pending.trim()) {
    const parsed = parseGeminiSseEvent(pending);
    if (parsed) {
      output += extractText(parsed);
      diagnostic = extractDiagnostic(parsed) || diagnostic;
    }
  }

  const text = output.trim();
  if (!text) {
    const detail = diagnostic ? ` (${diagnostic})` : '';
    throw new Error(`Gemini returned an empty streaming response${detail}.`);
  }

  return text;
}

function takeCompleteSseEvents(value: string): {
  events: string[];
  remainder: string;
} {
  const events: string[] = [];
  const separator = /\r\n\r\n|\n\n|\r\r/g;
  let eventStart = 0;
  let match: RegExpExecArray | null;

  while ((match = separator.exec(value)) !== null) {
    events.push(value.slice(eventStart, match.index));
    eventStart = match.index + match[0].length;
  }

  return { events, remainder: value.slice(eventStart) };
}

function parseGeminiSseEvent(event: string): GeminiStreamResponse | null {
  const data = event
    .split(/\r\n|\n|\r/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).replace(/^ /, ''))
    .join('\n')
    .trim();

  if (!data || data === '[DONE]') return null;

  try {
    return JSON.parse(data) as GeminiStreamResponse;
  } catch {
    const preview = data.length > 500 ? `${data.slice(0, 500)}...` : data;
    throw new Error(`Gemini returned malformed streaming data: ${preview}`);
  }
}

function extractText(response: GeminiStreamResponse): string {
  return (
    response.candidates?.[0]?.content?.parts
      ?.filter((part) => part.thought !== true)
      .map((part) => part.text || '')
      .join('') || ''
  );
}

function extractDiagnostic(response: GeminiStreamResponse): string {
  const blockReason = response.promptFeedback?.blockReason;
  if (blockReason) return `prompt blocked: ${blockReason}`;

  const finishReason = response.candidates?.[0]?.finishReason;
  if (finishReason && finishReason !== 'STOP') return `finish reason: ${finishReason}`;

  return '';
}
