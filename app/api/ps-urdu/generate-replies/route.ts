import { handleNoteFreeGenerateReplies } from '@/lib/noteFree/serverHandlers';
import { buildPsUrduGenerateRepliesPrompt } from '@/lib/psUrdu/prompts';
import { normalizePsUrduBulkReplies } from '@/lib/psUrdu/validators';

export const runtime = 'nodejs';

export function POST(request: Request) {
  return handleNoteFreeGenerateReplies(request, {
    debugLabel: 'ps-urdu/generate-replies',
    buildPrompt: buildPsUrduGenerateRepliesPrompt,
    normalizeReplies: normalizePsUrduBulkReplies
  });
}
