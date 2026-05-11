import assert from 'node:assert/strict';
import test from 'node:test';
import { formatPageRange, parsePageRange } from '../lib/pageRanges.js';

test('parsePageRange accepts single pages, ranges, and non-contiguous groups', () => {
  assert.deepEqual(parsePageRange('1, 3-5, 7'), [1, 3, 4, 5, 7]);
});

test('parsePageRange deduplicates and sorts pages', () => {
  assert.deepEqual(parsePageRange('4, 2, 2, 3'), [2, 3, 4]);
});

test('parsePageRange rejects invalid input', () => {
  assert.throws(() => parsePageRange('3-1'), /Invalid page range/);
  assert.throws(() => parsePageRange('1-2-3'), /Invalid page range/);
  assert.throws(() => parsePageRange('abc'), /Invalid page number/);
  assert.throws(() => parsePageRange(''), /At least one page number/);
});

test('formatPageRange compacts contiguous pages', () => {
  assert.equal(formatPageRange([5, 1, 2, 4, 4, 3, 7]), '1-5, 7');
});

test('formatPageRange returns empty string for empty page lists', () => {
  assert.equal(formatPageRange([]), '');
});
