'use client';

import { formatPageRange } from '@/lib/pageRanges';
import type { PsLetterRecord } from '@/types/ps';

type Props = {
  letters: PsLetterRecord[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

export function PsLetterSidebar({ letters, selectedIndex, onSelect }: Props) {
  return (
    <aside className="letterSidebar" aria-label="Letter list">
      <div className="letterSidebarHeader">Letters</div>
      <div className="letterSidebarList">
        {letters.map((letter, index) => {
          const isSelected = index === selectedIndex;
          return (
            <button
              key={letter.letter_id}
              className={`letterSidebarItem ${isSelected ? 'isSelected' : ''}`}
              onClick={() => onSelect(index)}
              aria-current={isSelected ? 'true' : undefined}
            >
              <span className="letterSidebarTitle">{letter.letter_id}</span>
              <span className="letterSidebarMeta">Pages {formatPageRange(letter.source_pages)}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
