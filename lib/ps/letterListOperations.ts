import type { PsLetterRecord } from '@/types/ps';

export type MergeDirection = 'previous' | 'next';

export type PsLetterListChange = {
  letters: PsLetterRecord[];
  selectedIndex: number;
};

export function setLetterAt(
  letters: PsLetterRecord[],
  index: number,
  updated: PsLetterRecord
): PsLetterListChange {
  const next = [...letters];
  next[index] = updated;
  return {
    letters: resequenceLetters(next),
    selectedIndex: resolveSelectedIndex(index, next.length)
  };
}

export function mergeLetterAt(
  letters: PsLetterRecord[],
  index: number,
  direction: MergeDirection
): PsLetterListChange | null {
  const targetIndex = direction === 'previous' ? index - 1 : index;
  const nextIndex = targetIndex + 1;
  if (targetIndex < 0 || nextIndex >= letters.length) return null;

  const merged: PsLetterRecord = {
    ...letters[targetIndex],
    source_pages: mergePages(letters[targetIndex].source_pages, letters[nextIndex].source_pages),
    full_name: letters[targetIndex].full_name || letters[nextIndex].full_name,
    location: letters[targetIndex].location || letters[nextIndex].location,
    inquiry: letters[targetIndex].inquiry || letters[nextIndex].inquiry,
    prayer_sentence: letters[targetIndex].prayer_sentence || letters[nextIndex].prayer_sentence
  };

  const next = [...letters];
  next.splice(targetIndex, 2, merged);

  return {
    letters: resequenceLetters(next),
    selectedIndex: targetIndex
  };
}

export function removeLetterAt(letters: PsLetterRecord[], index: number): PsLetterListChange {
  const next = letters.filter((_, i) => i !== index);
  return {
    letters: resequenceLetters(next),
    selectedIndex: resolveSelectedIndex(index, next.length)
  };
}

export function resequenceLetters(letters: PsLetterRecord[]): PsLetterRecord[] {
  return letters.map((letter, index) => ({
    ...letter,
    letter_id: `L${String(index + 1).padStart(3, '0')}`
  }));
}

export function resolveSelectedIndex(index: number, letterCount: number): number {
  if (letterCount <= 0) return 0;
  if (index < 0) return 0;
  if (index >= letterCount) return letterCount - 1;
  return index;
}

function mergePages(a: number[], b: number[]): number[] {
  return Array.from(new Set([...a, ...b])).sort((x, y) => x - y);
}
