'use client';

import { useNoteFreeLetterWorkflow } from '@/hooks/useNoteFreeLetterWorkflow';
import * as apiClient from '@/lib/ps/apiClient';

const PS_WORKFLOW_CONFIG = {
  apiClient,
  analyzeSuccessMessage: (letterCount: number) =>
    `Gemini detected ${letterCount} letter(s). Review the boundaries, then generate replies.`
};

export function usePsLetterWorkflow() {
  return useNoteFreeLetterWorkflow(PS_WORKFLOW_CONFIG);
}
