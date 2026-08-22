import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildDuaUrduAnalyzePdfPrompt,
  buildDuaUrduGenerateRepliesPrompt
} from '../lib/duaUrdu/prompts.js';
import {
  buildPsUrduAnalyzePdfPrompt,
  buildPsUrduGenerateRepliesPrompt
} from '../lib/psUrdu/prompts.js';

const letters = [
  {
    letter_id: 'L001',
    source_pages: [1, 3, 4],
    full_name: '',
    location: '',
    inquiry: '',
    prayer_sentence: ''
  }
];

test('PS Urdu temporarily uses the current Dua Urdu prompts through its own seam', () => {
  assert.equal(buildPsUrduAnalyzePdfPrompt(), buildDuaUrduAnalyzePdfPrompt());
  assert.equal(
    buildPsUrduGenerateRepliesPrompt(letters),
    buildDuaUrduGenerateRepliesPrompt(letters)
  );
});

test('PS Urdu generation prompt preserves the note-free Urdu JSON contract', () => {
  const prompt = buildPsUrduGenerateRepliesPrompt(letters);
  assert.match(prompt, /"letter_id": "L001"/);
  assert.match(prompt, /"source_pages": "1, 3-4"/);
  assert.match(prompt, /Urdu\/Arabic script/);
  assert.match(prompt, /"prayer_sentence"/);
  assert.doesNotMatch(prompt, /"note"/);
});
