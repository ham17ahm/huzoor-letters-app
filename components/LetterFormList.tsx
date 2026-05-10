'use client';

import { LetterFormCard } from '@/components/LetterFormCard';
import type { LetterRecord } from '@/types/letter';

type Props = {
  letters: LetterRecord[];
  onLettersChange: (letters: LetterRecord[]) => void;
};

export function LetterFormList({ letters, onLettersChange }: Props) {
  if (!letters.length) {
    return (
      <div className="emptyState">
        <h2>No letters detected yet</h2>
        <p>Upload a PDF, then click Gemini Magic to create forms.</p>
      </div>
    );
  }

  function setLetter(index: number, updated: LetterRecord) {
    const next = [...letters];
    next[index] = updated;
    onLettersChange(resequence(next));
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
    onLettersChange(resequence(next));
  }

  function removeAt(index: number) {
    const next = letters.filter((_, i) => i !== index);
    onLettersChange(resequence(next));
  }

  return (
    <>
      <div className="notice">
        <strong>{letters.length}</strong> letter form(s). Enter one note per letter, then click Generate Replies.
      </div>
      {letters.map((letter, index) => (
        <LetterFormCard
          key={letter.letter_id}
          letter={letter}
          index={index}
          total={letters.length}
          onChange={(updated) => setLetter(index, updated)}
          onMergePrevious={() => mergeAt(index, 'previous')}
          onMergeNext={() => mergeAt(index, 'next')}
          onRemove={() => removeAt(index)}
        />
      ))}
    </>
  );
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
