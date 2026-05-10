'use client';

import { formatPageRange } from '@/lib/pageRanges';
import type { LetterRecord } from '@/types/letter';

type Props = {
  letters: LetterRecord[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

export function LetterSidebar({ letters, selectedIndex, onSelect }: Props) {
  return (
    <aside className="letterSidebar" aria-label="Letter list">
      <div className="letterSidebarHeader">Letters</div>
      <div className="letterSidebarList">
        {letters.map((letter, index) => {
          const isSelected = index === selectedIndex;
          const hasNote = Boolean(letter.note.trim());
          return (
            <button
              key={letter.letter_id}
              className={`letterSidebarItem ${isSelected ? 'isSelected' : ''}`}
              onClick={() => onSelect(index)}
              aria-current={isSelected ? 'true' : undefined}
            >
              <span className="letterSidebarTitle">{letter.letter_id}</span>
              <span className="letterSidebarMeta">Pages {formatPageRange(letter.source_pages)}</span>
              <span className={`letterSidebarStatus ${hasNote ? 'done' : 'missing'}`}>
                {hasNote ? 'Note added' : 'Note required'}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
