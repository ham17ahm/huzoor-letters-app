'use client';

import { NoteFreeLetterFormList } from '@/components/noteFree/NoteFreeLetterFormList';
import { DUA_URDU_EDITOR_CONFIG } from '@/lib/duaUrdu/editorConfig';
import type { DuaUrduLetterRecord } from '@/types/duaUrdu';

type Props = {
  letters: DuaUrduLetterRecord[];
  selectedIndex: number;
  disabled?: boolean;
  onSelectLetter: (index: number) => void;
  onLettersChange: (
    letters: DuaUrduLetterRecord[],
    options?: { nextSelectedIndex?: number }
  ) => void;
};

export function DuaUrduLetterFormList(props: Props) {
  return <NoteFreeLetterFormList {...props} config={DUA_URDU_EDITOR_CONFIG} />;
}
