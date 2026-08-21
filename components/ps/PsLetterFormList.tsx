'use client';

import { NoteFreeLetterFormList } from '@/components/noteFree/NoteFreeLetterFormList';
import { PS_EDITOR_CONFIG } from '@/lib/ps/editorConfig';
import type { PsLetterRecord } from '@/types/ps';

type Props = {
  letters: PsLetterRecord[];
  selectedIndex: number;
  disabled?: boolean;
  onSelectLetter: (index: number) => void;
  onLettersChange: (
    letters: PsLetterRecord[],
    options?: { nextSelectedIndex?: number }
  ) => void;
};

export function PsLetterFormList(props: Props) {
  return <NoteFreeLetterFormList {...props} config={PS_EDITOR_CONFIG} />;
}
