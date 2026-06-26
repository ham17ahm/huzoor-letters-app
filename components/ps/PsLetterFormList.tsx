'use client';

import { PsLetterFormCard } from '@/components/ps/PsLetterFormCard';
import { LetterPagination } from '@/components/LetterPagination';
import { PsLetterSidebar } from '@/components/ps/PsLetterSidebar';
import {
  mergeLetterAt,
  removeLetterAt,
  resolveSelectedIndex,
  setLetterAt
} from '@/lib/ps/letterListOperations';
import type { PsLetterRecord } from '@/types/ps';

type Props = {
  letters: PsLetterRecord[];
  selectedIndex: number;
  disabled?: boolean;
  onSelectLetter: (index: number) => void;
  onLettersChange: (letters: PsLetterRecord[], options?: { nextSelectedIndex?: number }) => void;
};

export function PsLetterFormList({
  letters,
  selectedIndex,
  disabled,
  onSelectLetter,
  onLettersChange
}: Props) {
  if (!letters.length) {
    return (
      <div className="emptyState">
        <h2>No letters detected yet</h2>
        <p>Upload a PDF, then click Detect PDF to create forms.</p>
      </div>
    );
  }

  const activeIndex = resolveSelectedIndex(selectedIndex, letters.length);
  const selectedLetter = letters[activeIndex];

  function setLetter(index: number, updated: PsLetterRecord) {
    const change = setLetterAt(letters, index, updated);
    onLettersChange(change.letters, { nextSelectedIndex: change.selectedIndex });
  }

  function mergeAt(index: number, direction: 'previous' | 'next') {
    const change = mergeLetterAt(letters, index, direction);
    if (!change) return;
    onLettersChange(change.letters, { nextSelectedIndex: change.selectedIndex });
  }

  function removeAt(index: number) {
    const change = removeLetterAt(letters, index);
    onLettersChange(change.letters, { nextSelectedIndex: change.selectedIndex });
  }

  return (
    <div className="letterWorkspace">
      <PsLetterSidebar letters={letters} selectedIndex={activeIndex} onSelect={onSelectLetter} />

      <div className="letterEditor">
        <div className="notice">
          <strong>{letters.length}</strong> letter form(s). Review the boundaries, then click Generate Replies.
        </div>

        <LetterPagination
          currentIndex={activeIndex}
          total={letters.length}
          onPrevious={() => onSelectLetter(activeIndex - 1)}
          onNext={() => onSelectLetter(activeIndex + 1)}
        />

        <PsLetterFormCard
          key={selectedLetter.letter_id}
          letter={selectedLetter}
          index={activeIndex}
          total={letters.length}
          disabled={disabled}
          onChange={(updated) => setLetter(activeIndex, updated)}
          onMergePrevious={() => mergeAt(activeIndex, 'previous')}
          onMergeNext={() => mergeAt(activeIndex, 'next')}
          onRemove={() => removeAt(activeIndex)}
        />
      </div>
    </div>
  );
}
