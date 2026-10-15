import type { ToolbarActionTemplate } from '@/types/toolbar';

export const TOOLBAR_ACTIONS: ToolbarActionTemplate[] = [
  { id: 'analyze', label: 'Detect PDF', variant: 'primary' },
  { id: 'generate', label: 'Generate Replies' },
  { id: 'argonMedium', label: 'Argon 4 Medium', variant: 'argon' },
  { id: 'argonHigh', label: 'Argon 4 High', variant: 'argon' },
  { id: 'print', label: 'Print / PDF' },
  { id: 'reset', label: 'Reset' }
];
