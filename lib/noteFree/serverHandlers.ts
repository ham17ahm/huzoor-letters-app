import { NextResponse } from 'next/server';
import { parseEngine, resolveArgonEngine } from '@/lib/argonEngine';
import { generateWithGeminiPdf, shouldLogGeminiRequests } from '@/lib/gemini';
import { parseJsonFromText } from '@/lib/json';
import { createPdfSession, getPdfSession } from '@/lib/pdfSession';
import { normalizeBoundaries } from '@/lib/validators';
import type {
  NoteFreeBulkGenerateReplyResult,
  NoteFreeLetterRecord
} from '@/types/noteFree';

type AnalyzeConfig = {
  model: string;
  prompt: string;
};

type GenerateConfig = {
  model: string;
  debugLabel: string;
  buildPrompt: (letters: NoteFreeLetterRecord[]) => string;
  normalizeReplies: (
    value: unknown,
    requestedLetterIds: string[]
  ) => NoteFreeBulkGenerateReplyResult[];
};

export async function handleNoteFreeAnalyzePdf(request: Request, config: AnalyzeConfig) {
  try {
    const formData = await request.formData();
    const pdf = formData.get('pdf');

    if (!(pdf instanceof File)) {
      return NextResponse.json({ error: 'Missing PDF file.' }, { status: 400 });
    }

    if (pdf.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Uploaded file must be a PDF.' }, { status: 400 });
    }

    const buffer = Buffer.from(await pdf.arrayBuffer());
    const pdfBase64 = buffer.toString('base64');
    const rawText = await generateWithGeminiPdf({
      pdfBase64,
      prompt: config.prompt,
      model: config.model,
      signal: request.signal
    });

    const parsed = parseJsonFromText<unknown>(rawText);
    const letters: NoteFreeLetterRecord[] = normalizeBoundaries(parsed).map((boundary) => ({
      ...boundary,
      full_name: '',
      location: '',
      inquiry: '',
      prayer_sentence: ''
    }));
    const pdfSessionId = createPdfSession(pdfBase64);

    return NextResponse.json({ letters, pdfSessionId, rawText });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function handleNoteFreeGenerateReplies(request: Request, config: GenerateConfig) {
  try {
    const formData = await request.formData();
    const pdfSessionId = formData.get('pdfSessionId');
    const lettersRaw = formData.get('letters');

    if (typeof pdfSessionId !== 'string' || !pdfSessionId.trim()) {
      return NextResponse.json(
        { error: 'Missing PDF session. Please analyze the PDF again.' },
        { status: 400 }
      );
    }

    if (typeof lettersRaw !== 'string') {
      return NextResponse.json({ error: 'Missing letters payload.' }, { status: 400 });
    }

    let letters: NoteFreeLetterRecord[];
    try {
      letters = JSON.parse(lettersRaw) as NoteFreeLetterRecord[];
    } catch {
      return NextResponse.json({ error: 'Invalid letters payload.' }, { status: 400 });
    }

    if (!Array.isArray(letters) || !letters.length) {
      return NextResponse.json({ error: 'Missing letters to process.' }, { status: 400 });
    }

    const engine = parseEngine(formData.get('engine'));
    if (engine === null) {
      return NextResponse.json({ error: 'Unknown generation engine.' }, { status: 400 });
    }
    const argon = engine ? resolveArgonEngine(engine) : null;

    const prompt = config.buildPrompt(letters);
    if (shouldLogGeminiRequests()) {
      console.log(`[Gemini][${config.debugLabel}] Final constructed prompt:\n`, prompt);
    }

    const pdfBase64 = getPdfSession(pdfSessionId);
    const rawText = await generateWithGeminiPdf({
      pdfBase64,
      prompt,
      model: argon?.model ?? config.model,
      thinkingLevel: argon?.thinkingLevel,
      signal: request.signal
    });

    const parsed = parseJsonFromText<unknown>(rawText);
    const replies = config.normalizeReplies(
      parsed,
      letters.map((letter) => letter.letter_id)
    );

    return NextResponse.json({ replies, rawText });
  } catch (error) {
    return errorResponse(error);
  }
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error.';
  return NextResponse.json({ error: message }, { status: 500 });
}
