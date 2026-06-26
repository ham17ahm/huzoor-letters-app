import assert from 'node:assert/strict';
import test from 'node:test';
import {
  mergeLetterAt,
  removeLetterAt,
  resolveSelectedIndex,
  setLetterAt
} from '../lib/ps/letterListOperations.js';
import type { PsLetterRecord } from '../types/ps.js';

test('mergeLetterAt merges pages, prefers existing generated fields, and resequences ids (no note)', () => {
  const change = mergeLetterAt(
    [
      makeLetter({ letter_id: 'L001', source_pages: [2], inquiry: 'First inquiry' }),
      makeLetter({
        letter_id: 'L002',
        source_pages: [1, 3],
        full_name: 'Second Name',
        inquiry: 'Second inquiry'
      }),
      makeLetter({ letter_id: 'L003', source_pages: [4] })
    ],
    0,
    'next'
  );

  assert.ok(change);
  assert.equal(change.selectedIndex, 0);
  assert.deepEqual(
    change.letters.map((letter) => letter.letter_id),
    ['L001', 'L002']
  );
  assert.deepEqual(change.letters[0].source_pages, [1, 2, 3]);
  assert.equal(change.letters[0].full_name, 'Second Name');
  assert.equal(change.letters[0].inquiry, 'First inquiry');
  assert.ok(!('note' in change.letters[0]));
});

test('mergeLetterAt returns null for unavailable merge directions', () => {
  const letters = [makeLetter({ letter_id: 'L001' })];
  assert.equal(mergeLetterAt(letters, 0, 'previous'), null);
  assert.equal(mergeLetterAt(letters, 0, 'next'), null);
});

test('removeLetterAt resequences and keeps selection in range', () => {
  const change = removeLetterAt(
    [
      makeLetter({ letter_id: 'L001' }),
      makeLetter({ letter_id: 'L002' }),
      makeLetter({ letter_id: 'L003' })
    ],
    2
  );

  assert.deepEqual(
    change.letters.map((letter) => letter.letter_id),
    ['L001', 'L002']
  );
  assert.equal(change.selectedIndex, 1);
});

test('setLetterAt updates one letter and preserves selected index bounds', () => {
  const letters = [makeLetter({ letter_id: 'L001' }), makeLetter({ letter_id: 'L002' })];
  const change = setLetterAt(letters, 1, { ...letters[1], inquiry: 'Updated' });

  assert.equal(change.letters[1].inquiry, 'Updated');
  assert.equal(change.selectedIndex, 1);
});

test('resolveSelectedIndex clamps indexes', () => {
  assert.equal(resolveSelectedIndex(-1, 2), 0);
  assert.equal(resolveSelectedIndex(3, 2), 1);
  assert.equal(resolveSelectedIndex(0, 0), 0);
});

function makeLetter(patch: Partial<PsLetterRecord>): PsLetterRecord {
  return {
    letter_id: 'L001',
    source_pages: [1],
    full_name: '',
    location: '',
    inquiry: '',
    prayer_sentence: '',
    ...patch
  };
}
