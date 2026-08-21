'use client';

import { useNoteFreeLetterWorkflow } from '@/hooks/useNoteFreeLetterWorkflow';
import * as apiClient from '@/lib/duaUrdu/apiClient';

const DUA_URDU_WORKFLOW_CONFIG = {
  apiClient,
  analyzeSuccessMessage: (letterCount: number) =>
    `Gemini detected ${letterCount} letter(s). Review the boundaries, then generate Urdu replies.`
};

export function useDuaUrduLetterWorkflow() {
  return useNoteFreeLetterWorkflow(DUA_URDU_WORKFLOW_CONFIG);
}
