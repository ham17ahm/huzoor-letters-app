import { getDuaUrduDetectPdfModel } from '@/lib/aiModelConfig';
import { buildDuaUrduAnalyzePdfPrompt } from '@/lib/duaUrdu/prompts';
import { handleNoteFreeAnalyzePdf } from '@/lib/noteFree/serverHandlers';

export const runtime = 'nodejs';

export function POST(request: Request) {
  return handleNoteFreeAnalyzePdf(request, {
    model: getDuaUrduDetectPdfModel(),
    prompt: buildDuaUrduAnalyzePdfPrompt()
  });
}
