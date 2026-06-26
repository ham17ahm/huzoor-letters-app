import { NextResponse } from 'next/server';
import { getPsGenerateRepliesModel } from '@/lib/aiModelConfig';
import { generateWithGeminiPdf, shouldLogGeminiRequests } from '@/lib/gemini';
import { parseJsonFromText } from '@/lib/json';
import { buildPsGenerateRepliesPrompt } from '@/lib/ps/prompts';
import { normalizePsBulkReplies } from '@/lib/ps/validators';
import { getPdfSession } from '@/lib/pdfSession';
import type { PsLetterRecord } from '@/types/ps';

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

    let letters: PsLetterRecord[];
    try {
      letters = JSON.parse(lettersRaw) as PsLetterRecord[];
    } catch {
      return NextResponse.json({ error: 'Invalid letters payload.' }, { status: 400 });
    }

    if (!Array.isArray(letters) || !letters.length) {
      return NextResponse.json({ error: 'Missing letters to process.' }, { status: 400 });
    }

    const prompt = buildPsGenerateRepliesPrompt(letters);
    if (shouldLogGeminiRequests()) {
      console.log('[Gemini][ps/generate-replies] Final constructed prompt:\n', prompt);
    }

    const pdfBase64 = getPdfSession(pdfSessionId);
    const rawText = await generateWithGeminiPdf({
      pdfBase64,
      prompt,
      model: getPsGenerateRepliesModel(),
      signal: request.signal
    });

    const parsed = parseJsonFromText<unknown>(rawText);
    const replies = normalizePsBulkReplies(
      parsed,
      letters.map((letter) => letter.letter_id)
    );

    return NextResponse.json({ replies, rawText });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
