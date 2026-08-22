import assert from 'node:assert/strict';
import test from 'node:test';
import { collectGeminiSseText } from '../lib/geminiSse';

test('collects Gemini text from SSE events split across arbitrary byte boundaries', async () => {
  const encoder = new TextEncoder();
  const source = [
    'data: {"candidates":[{"content":{"parts":[{"text":"{\\"replies\\":"}]}}]}\n\n',
    'data: {"candidates":[{"content":{"parts":[{"text":"[✓]}"}]},"finishReason":"STOP"}]}\n\n'
  ].join('');
  const bytes = encoder.encode(source);

  const body = chunks([
    bytes.slice(0, 7),
    bytes.slice(7, 61),
    bytes.slice(61, 89),
    bytes.slice(89)
  ]);

  assert.equal(await collectGeminiSseText(body), '{"replies":[✓]}');
});

test('ignores thought parts and reports blocked empty responses', async () => {
  const encoder = new TextEncoder();
  const source = [
    'data: {"candidates":[{"content":{"parts":[{"text":"internal","thought":true},{"text":"answer"}]}}]}\r\n\r\n',
    'data: [DONE]\r\n\r\n'
  ].join('');

  assert.equal(await collectGeminiSseText(chunks([encoder.encode(source)])), 'answer');

  const blocked = encoder.encode(
    'data: {"promptFeedback":{"blockReason":"SAFETY"}}\n\n'
  );
  await assert.rejects(
    collectGeminiSseText(chunks([blocked])),
    /empty streaming response \(prompt blocked: SAFETY\)/
  );
});

async function* chunks(values: Uint8Array[]): AsyncGenerator<Uint8Array> {
  yield* values;
}
