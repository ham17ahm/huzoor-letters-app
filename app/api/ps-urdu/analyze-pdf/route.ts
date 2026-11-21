import { handleNoteFreeAnalyzePdf } from '@/lib/noteFree/serverHandlers';
import { buildPsUrduAnalyzePdfPrompt } from '@/lib/psUrdu/prompts';

export const runtime = 'nodejs';

export function POST(request: Request) {
  return handleNoteFreeAnalyzePdf(request, {
    prompt: buildPsUrduAnalyzePdfPrompt()
  });
}
