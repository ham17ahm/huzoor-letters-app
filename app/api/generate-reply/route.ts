import { NextResponse } from 'next/server';
import { generateWithGeminiPdf } from '@/lib/gemini';
import { parseJsonFromText } from '@/lib/json';
import { buildGenerateReplyPrompt } from '@/lib/prompts';
import { normalizeReply } from '@/lib/validators';
import { getPdfSession } from '@/lib/pdfSession';
import type { LetterRecord } from '@/types/letter';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const pdfSessionId = formData.get('pdfSessionId');
    const letterRaw = formData.get('letter');

    if (typeof pdfSessionId !== 'string' || !pdfSessionId.trim()) {
      return NextResponse.json({ error: 'Missing PDF session. Please analyze the PDF again.' }, { status: 400 });
    }

    if (typeof letterRaw !== 'string') {
      return NextResponse.json({ error: 'Missing letter payload.' }, { status: 400 });
    }

    const letter = JSON.parse(letterRaw) as LetterRecord;

    if (!letter.note?.trim()) {
      return NextResponse.json({ error: `Missing note for ${letter.letter_id}.` }, { status: 400 });
    }

    const pdfBase64 = getPdfSession(pdfSessionId);
    const rawText = await generateWithGeminiPdf({
      pdfBase64,
      prompt: buildGenerateReplyPrompt(letter),
      signal: request.signal
    });

    const parsed = parseJsonFromText<unknown>(rawText);
    const reply = normalizeReply(parsed);

    return NextResponse.json({ reply, rawText });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
