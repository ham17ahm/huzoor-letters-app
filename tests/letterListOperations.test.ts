import assert from 'node:assert/strict';
import test from 'node:test';
import {
  combineText,
  mergeLetterAt,
  removeLetterAt,
  resolveSelectedIndex,
  setLetterAt
} from '../lib/letterListOperations.js';
import type { LetterRecord } from '../types/letter.js';

test('mergeLetterAt merges pages, prefers existing generated fields, combines notes, and resequences ids', () => {
  const change = mergeLetterAt(
    [
      makeLetter({ letter_id: 'L001', source_pages: [2], note: 'First note', inquiry: 'First inquiry' }),
      makeLetter({
        letter_id: 'L002',
        source_pages: [1, 3],
        note: 'Second note',
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
  assert.equal(change.letters[0].note, 'First note\nSecond note');
  assert.equal(change.letters[0].full_name, 'Second Name');
  assert.equal(change.letters[0].inquiry, 'First inquiry');
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
  const change = setLetterAt(letters, 1, { ...letters[1], note: 'Updated' });

  assert.equal(change.letters[1].note, 'Updated');
  assert.equal(change.selectedIndex, 1);
});

test('combineText avoids duplicate and blank notes', () => {
  assert.equal(combineText(' Alpha ', 'Beta'), 'Alpha\nBeta');
  assert.equal(combineText('Alpha', 'Alpha'), 'Alpha');
  assert.equal(combineText('', ' Beta '), 'Beta');
});

test('resolveSelectedIndex clamps indexes', () => {
  assert.equal(resolveSelectedIndex(-1, 2), 0);
  assert.equal(resolveSelectedIndex(3, 2), 1);
  assert.equal(resolveSelectedIndex(0, 0), 0);
});

function makeLetter(patch: Partial<LetterRecord>): LetterRecord {
  return {
    letter_id: 'L001',
    source_pages: [1],
    full_name: '',
    location: '',
    note: '',
    inquiry: '',
    prayer_sentence: '',
    ...patch
  };
}
