'use client';

import type { NoteFreeEditorConfig } from '@/components/noteFree/editorConfig';
import { NoteFreeLetterFormCard } from '@/components/noteFree/NoteFreeLetterFormCard';
import { NoteFreeLetterSidebar } from '@/components/noteFree/NoteFreeLetterSidebar';
import { LetterPagination } from '@/components/LetterPagination';
import {
  mergeLetterAt,
  removeLetterAt,
  resolveSelectedIndex,
  setLetterAt
} from '@/lib/noteFree/letterListOperations';
import type { NoteFreeLetterRecord } from '@/types/noteFree';

type Props = {
  letters: NoteFreeLetterRecord[];
  selectedIndex: number;
  config: NoteFreeEditorConfig;
  disabled?: boolean;
  onSelectLetter: (index: number) => void;
  onLettersChange: (
    letters: NoteFreeLetterRecord[],
    options?: { nextSelectedIndex?: number }
  ) => void;
};

export function NoteFreeLetterFormList({
  letters,
  selectedIndex,
  config,
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

  function setLetter(index: number, updated: NoteFreeLetterRecord) {
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
      <NoteFreeLetterSidebar
        letters={letters}
        selectedIndex={activeIndex}
        onSelect={onSelectLetter}
      />

      <div className="letterEditor">
        <div className="notice">
          <strong>{letters.length}</strong> letter form(s). Review the boundaries, then click
          Generate Replies.
        </div>

        <LetterPagination
          currentIndex={activeIndex}
          total={letters.length}
          onPrevious={() => onSelectLetter(activeIndex - 1)}
          onNext={() => onSelectLetter(activeIndex + 1)}
        />

        <NoteFreeLetterFormCard
          key={selectedLetter.letter_id}
          letter={selectedLetter}
          index={activeIndex}
          total={letters.length}
          config={config}
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
