'use client';

import { NoteFreeLetterFormCard } from '@/components/noteFree/NoteFreeLetterFormCard';
import { PS_EDITOR_CONFIG } from '@/lib/ps/editorConfig';
import type { PsLetterRecord } from '@/types/ps';

type Props = {
  letter: PsLetterRecord;
  index: number;
  total: number;
  disabled?: boolean;
  onChange: (updated: PsLetterRecord) => void;
  onMergePrevious: () => void;
  onMergeNext: () => void;
  onAddNew: () => void;
  onRemove: () => void;
};

export function PsLetterFormCard(props: Props) {
  return <NoteFreeLetterFormCard {...props} config={PS_EDITOR_CONFIG} />;
}
