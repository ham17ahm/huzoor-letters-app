import { NextResponse } from 'next/server';
import { generateWithGeminiPdf, getGenerateRepliesModel } from '@/lib/gemini';
import { parseJsonFromText } from '@/lib/json';
import { buildGenerateRepliesPrompt } from '@/lib/prompts';
import { normalizeBulkReplies } from '@/lib/validators';
import { getPdfSession } from '@/lib/pdfSession';
import type { LetterRecord } from '@/types/letter';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const pdfSessionId = formData.get('pdfSessionId');
    const lettersRaw = formData.get('letters');

    if (typeof pdfSessionId !== 'string' || !pdfSessionId.trim()) {
      return NextResponse.json({ error: 'Missing PDF session. Please analyze the PDF again.' }, { status: 400 });
    }

    if (typeof lettersRaw !== 'string') {
      return NextResponse.json({ error: 'Missing letters payload.' }, { status: 400 });
    }

    const letters = JSON.parse(lettersRaw) as LetterRecord[];

    if (!Array.isArray(letters) || !letters.length) {
      return NextResponse.json({ error: 'Missing letters to process.' }, { status: 400 });
    }

    const missingNote = letters.find((letter) => !letter.note?.trim());
    if (missingNote) {
      return NextResponse.json({ error: `Missing note for ${missingNote.letter_id}.` }, { status: 400 });
    }

    const prompt = buildGenerateRepliesPrompt(letters);
    console.log('[Gemini][generate-replies] Final constructed prompt:\n', prompt);

    const pdfBase64 = getPdfSession(pdfSessionId);
    const rawText = await generateWithGeminiPdf({
      pdfBase64,
      prompt,
      model: getGenerateRepliesModel(),
      signal: request.signal
    });

    const parsed = parseJsonFromText<unknown>(rawText);
    const replies = normalizeBulkReplies(
      parsed,
      letters.map((letter) => letter.letter_id)
    );

    return NextResponse.json({ replies, rawText });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
