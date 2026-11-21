import { handleNoteFreeGenerateReplies } from '@/lib/noteFree/serverHandlers';
import { buildPsGenerateRepliesPrompt } from '@/lib/ps/prompts';
import { normalizePsBulkReplies } from '@/lib/ps/validators';

export const runtime = 'nodejs';

export function POST(request: Request) {
  return handleNoteFreeGenerateReplies(request, {
    debugLabel: 'ps/generate-replies',
    buildPrompt: buildPsGenerateRepliesPrompt,
    normalizeReplies: normalizePsBulkReplies
  });
}
