import { buildDuaUrduGenerateRepliesPrompt } from '@/lib/duaUrdu/prompts';
import { normalizeDuaUrduBulkReplies } from '@/lib/duaUrdu/validators';
import { handleNoteFreeGenerateReplies } from '@/lib/noteFree/serverHandlers';

export const runtime = 'nodejs';

export function POST(request: Request) {
  return handleNoteFreeGenerateReplies(request, {
    debugLabel: 'dua-urdu/generate-replies',
    buildPrompt: buildDuaUrduGenerateRepliesPrompt,
    normalizeReplies: normalizeDuaUrduBulkReplies
  });
}
