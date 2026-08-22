'use client';

import { useNoteFreeLetterWorkflow } from '@/hooks/useNoteFreeLetterWorkflow';
import * as apiClient from '@/lib/psUrdu/apiClient';

const PS_URDU_WORKFLOW_CONFIG = {
  apiClient,
  analyzeSuccessMessage: (letterCount: number) =>
    `Gemini detected ${letterCount} letter(s). Review the boundaries, then generate PS Urdu replies.`
};

export function usePsUrduLetterWorkflow() {
  return useNoteFreeLetterWorkflow(PS_URDU_WORKFLOW_CONFIG);
}
