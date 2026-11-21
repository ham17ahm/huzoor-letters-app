import { buildDuaUrduAnalyzePdfPrompt } from '@/lib/duaUrdu/prompts';
import { handleNoteFreeAnalyzePdf } from '@/lib/noteFree/serverHandlers';

export const runtime = 'nodejs';

export function POST(request: Request) {
  return handleNoteFreeAnalyzePdf(request, {
    prompt: buildDuaUrduAnalyzePdfPrompt()
  });
}
