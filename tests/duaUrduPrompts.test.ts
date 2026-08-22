import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildDuaUrduAnalyzePdfPrompt,
  buildDuaUrduGenerateRepliesPrompt
} from '../lib/duaUrdu/prompts.js';

test('Dua Urdu generation prompt preserves ids, formats pages, and requests Urdu fields', () => {
  const prompt = buildDuaUrduGenerateRepliesPrompt([
    {
      letter_id: 'L001',
      source_pages: [1, 3, 4],
      full_name: '',
      location: '',
      inquiry: '',
      prayer_sentence: ''
    }
  ]);

  assert.match(prompt, /"letter_id": "L001"/);
  assert.match(prompt, /"source_pages": "1, 3-4"/);
  assert.match(prompt, /Urdu\/Arabic script/);
  assert.match(prompt, /Transliterate personal names and place names/);
  assert.match(prompt, /"full_name"/);
  assert.match(prompt, /"location"/);
  assert.match(prompt, /"inquiry"/);
  assert.match(prompt, /"prayer_sentence"/);
  assert.match(prompt, /<style_rules>/);
  assert.match(prompt, /<compression_examples>/);
  assert.match(prompt, /<examples>/);
  assert.match(prompt, /\[Dream — good\]/);
  assert.match(prompt, /closely follows the linguistic style/);
  assert.match(prompt, /absolute maximum of 6/);
  assert.match(prompt, /use "N\/A" when unavailable/);
  assert.doesNotMatch(prompt, /"note"/);
});

test('Dua Urdu boundary prompt remains the shared note-free detector', () => {
  const prompt = buildDuaUrduAnalyzePdfPrompt();
  assert.match(prompt, /detect letter boundaries/i);
  assert.match(prompt, /source_pages/);
});
