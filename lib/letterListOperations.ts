import type { LetterRecord } from '@/types/letter';

export type MergeDirection = 'previous' | 'next';

export type LetterListChange = {
  letters: LetterRecord[];
  selectedIndex: number;
};

export function setLetterAt(
  letters: LetterRecord[],
  index: number,
  updated: LetterRecord
): LetterListChange {
  const next = [...letters];
  next[index] = updated;
  return {
    letters: resequenceLetters(next),
    selectedIndex: resolveSelectedIndex(index, next.length)
  };
}

export function mergeLetterAt(
  letters: LetterRecord[],
  index: number,
  direction: MergeDirection
): LetterListChange | null {
  const targetIndex = direction === 'previous' ? index - 1 : index;
  const nextIndex = targetIndex + 1;
  if (targetIndex < 0 || nextIndex >= letters.length) return null;

  const merged: LetterRecord = {
    ...letters[targetIndex],
    source_pages: mergePages(letters[targetIndex].source_pages, letters[nextIndex].source_pages),
    note: combineText(letters[targetIndex].note, letters[nextIndex].note),
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

export function removeLetterAt(letters: LetterRecord[], index: number): LetterListChange {
  const next = letters.filter((_, i) => i !== index);
  return {
    letters: resequenceLetters(next),
    selectedIndex: resolveSelectedIndex(index, next.length)
  };
}

export function resequenceLetters(letters: LetterRecord[]): LetterRecord[] {
  return letters.map((letter, index) => ({
    ...letter,
    letter_id: `L${String(index + 1).padStart(3, '0')}`
  }));
}

export function combineText(a: string, b: string): string {
  const first = a.trim();
  const second = b.trim();
  if (first && second && first !== second) return `${first}\n${second}`;
  return first || second;
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
