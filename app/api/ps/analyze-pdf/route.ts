import { getPsDetectPdfModel } from '@/lib/aiModelConfig';
import { handleNoteFreeAnalyzePdf } from '@/lib/noteFree/serverHandlers';
import { buildPsAnalyzePdfPrompt } from '@/lib/ps/prompts';

export const runtime = 'nodejs';

export function POST(request: Request) {
  return handleNoteFreeAnalyzePdf(request, {
    model: getPsDetectPdfModel(),
    prompt: buildPsAnalyzePdfPrompt()
  });
}
