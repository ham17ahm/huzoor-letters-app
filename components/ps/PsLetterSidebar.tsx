'use client';

import { NoteFreeLetterSidebar } from '@/components/noteFree/NoteFreeLetterSidebar';
import type { PsLetterRecord } from '@/types/ps';

type Props = {
  letters: PsLetterRecord[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

export function PsLetterSidebar(props: Props) {
  return <NoteFreeLetterSidebar {...props} />;
}
