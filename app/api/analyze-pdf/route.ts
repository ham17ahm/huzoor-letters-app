import { NextResponse } from 'next/server';
import { getRequestedModelPreset, InvalidModelPresetError } from '@/lib/modelPresets';
import { generateWithGeminiPdf } from '@/lib/gemini';
import { parseJsonFromText } from '@/lib/json';
import { buildAnalyzePdfPrompt } from '@/lib/prompts';
import { normalizeBoundaries } from '@/lib/validators';
import { createPdfSession } from '@/lib/pdfSession';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const pdf = formData.get('pdf');

    if (!(pdf instanceof File)) {
      return NextResponse.json({ error: 'Missing PDF file.' }, { status: 400 });
    }

    if (pdf.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Uploaded file must be a PDF.' }, { status: 400 });
    }

    const preset = await getRequestedModelPreset('detectPdf', formData);
    const buffer = Buffer.from(await pdf.arrayBuffer());
    const pdfBase64 = buffer.toString('base64');
    const rawText = await generateWithGeminiPdf({
      pdfBase64,
      prompt: buildAnalyzePdfPrompt(),
      preset,
      signal: request.signal
    });

    const parsed = parseJsonFromText<unknown>(rawText);
    const letters = normalizeBoundaries(parsed).map((boundary) => ({
      ...boundary,
      full_name: '',
      location: '',
      note: '',
      inquiry: '',
      prayer_sentence: ''
    }));
    const pdfSessionId = createPdfSession(pdfBase64);

    return NextResponse.json({ letters, pdfSessionId, rawText });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error.';
    return NextResponse.json({ error: message }, { status: error instanceof InvalidModelPresetError ? 400 : 500 });
  }
}
