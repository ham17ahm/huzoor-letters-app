'use client';

import { NoteFreeLetterFormList } from '@/components/noteFree/NoteFreeLetterFormList';
import { DUA_URDU_EDITOR_CONFIG } from '@/lib/duaUrdu/editorConfig';
import type { PsUrduLetterRecord } from '@/types/psUrdu';

type Props = {
  letters: PsUrduLetterRecord[];
  selectedIndex: number;
  disabled?: boolean;
  onSelectLetter: (index: number) => void;
  onLettersChange: (
    letters: PsUrduLetterRecord[],
    options?: { nextSelectedIndex?: number }
  ) => void;
};

export function PsUrduLetterFormList(props: Props) {
  return <NoteFreeLetterFormList {...props} config={DUA_URDU_EDITOR_CONFIG} />;
}
