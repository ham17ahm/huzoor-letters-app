import type { ToolbarActionTemplate } from '@/types/toolbar';

export const TOOLBAR_ACTIONS: ToolbarActionTemplate[] = [
  { id: 'analyze', label: 'Gemini Magic', variant: 'primary' },
  { id: 'generate', label: 'Generate Replies' },
  { id: 'print', label: 'Print / PDF' },
  { id: 'reset', label: 'Reset' }
];
