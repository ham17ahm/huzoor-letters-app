import assert from 'node:assert/strict';
import test from 'node:test';
import { appendPhrase } from '../lib/textInsertion.js';

test('appendPhrase fills empty text with the phrase', () => {
  assert.equal(appendPhrase('', 'requesting prayers'), 'requesting prayers');
});

test('appendPhrase appends with one space when existing text has no trailing whitespace', () => {
  assert.equal(
    appendPhrase('I have received your letter', 'requesting prayers'),
    'I have received your letter requesting prayers'
  );
});

test('appendPhrase preserves existing trailing whitespace', () => {
  assert.equal(
    appendPhrase('I have received your letter ', 'requesting prayers'),
    'I have received your letter requesting prayers'
  );
});

test('appendPhrase ignores blank phrases', () => {
  assert.equal(appendPhrase('Existing text', '   '), 'Existing text');
});
