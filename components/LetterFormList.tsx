'use client';

import { LetterFormCard } from '@/components/LetterFormCard';
import { LetterPagination } from '@/components/LetterPagination';
import { LetterSidebar } from '@/components/LetterSidebar';
import type { LetterRecord } from '@/types/letter';

type Props = {
  letters: LetterRecord[];
  selectedIndex: number;
  onSelectLetter: (index: number) => void;
  onLettersChange: (letters: LetterRecord[], options?: { nextSelectedIndex?: number }) => void;
};

export function LetterFormList({ letters, selectedIndex, onSelectLetter, onLettersChange }: Props) {
  if (!letters.length) {
    return (
      <div className="emptyState">
        <h2>No letters detected yet</h2>
        <p>Upload a PDF, then click Gemini Magic to create forms.</p>
      </div>
    );
  }

  const activeIndex = resolveIndex(selectedIndex, letters.length);
  const selectedLetter = letters[activeIndex];

  function setLetter(index: number, updated: LetterRecord) {
    const next = [...letters];
    next[index] = updated;
    onLettersChange(resequence(next), { nextSelectedIndex: index });
  }

  function mergeAt(index: number, direction: 'previous' | 'next') {
    const targetIndex = direction === 'previous' ? index - 1 : index;
    const nextIndex = targetIndex + 1;
    if (targetIndex < 0 || nextIndex >= letters.length) return;

    const mergedPages = Array.from(
      new Set([...letters[targetIndex].source_pages, ...letters[nextIndex].source_pages])
    ).sort((a, b) => a - b);

    const merged: LetterRecord = {
      ...letters[targetIndex],
      source_pages: mergedPages,
      note: combineText(letters[targetIndex].note, letters[nextIndex].note),
      full_name: letters[targetIndex].full_name || letters[nextIndex].full_name,
      location: letters[targetIndex].location || letters[nextIndex].location,
      inquiry: letters[targetIndex].inquiry || letters[nextIndex].inquiry,
      prayer_sentence: letters[targetIndex].prayer_sentence || letters[nextIndex].prayer_sentence
    };

    const next = [...letters];
    next.splice(targetIndex, 2, merged);
    onLettersChange(resequence(next), { nextSelectedIndex: targetIndex });
  }

  function removeAt(index: number) {
    const next = letters.filter((_, i) => i !== index);
    const nextSelectedIndex = Math.min(index, Math.max(next.length - 1, 0));
    onLettersChange(resequence(next), { nextSelectedIndex });
  }

  return (
    <div className="letterWorkspace">
      <LetterSidebar letters={letters} selectedIndex={activeIndex} onSelect={onSelectLetter} />

      <div className="letterEditor">
        <div className="notice">
          <strong>{letters.length}</strong> letter form(s). Enter one note per letter, then click Generate Replies.
        </div>

        <LetterPagination
          currentIndex={activeIndex}
          total={letters.length}
          onPrevious={() => onSelectLetter(activeIndex - 1)}
          onNext={() => onSelectLetter(activeIndex + 1)}
        />

        <LetterFormCard
          key={selectedLetter.letter_id}
          letter={selectedLetter}
          index={activeIndex}
          total={letters.length}
          onChange={(updated) => setLetter(activeIndex, updated)}
          onMergePrevious={() => mergeAt(activeIndex, 'previous')}
          onMergeNext={() => mergeAt(activeIndex, 'next')}
          onRemove={() => removeAt(activeIndex)}
        />
      </div>
    </div>
  );
}

function resolveIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  if (index < 0) return 0;
  if (index >= length) return length - 1;
  return index;
}

function resequence(letters: LetterRecord[]): LetterRecord[] {
  return letters.map((letter, index) => ({
    ...letter,
    letter_id: `L${String(index + 1).padStart(3, '0')}`
  }));
}

function combineText(a: string, b: string): string {
  const first = a.trim();
  const second = b.trim();
  if (first && second && first !== second) return `${first}\n${second}`;
  return first || second;
}
