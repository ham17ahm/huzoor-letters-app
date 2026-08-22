import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GENERATE_SECTIONS,
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
  assert.match(prompt, /Write all four field values in Urdu script/);
  assert.match(prompt, /Transliterate personal and place names into Urdu script/);
  assert.match(prompt, /"full_name"/);
  assert.match(prompt, /"location"/);
  assert.match(prompt, /"inquiry"/);
  assert.match(prompt, /"prayer_sentence"/);
  assert.match(prompt, /<style_rules>/);
  assert.match(prompt, /<compression_examples>/);
  assert.match(prompt, /<examples>/);
  assert.match(prompt, /<example subject="Dream — good">/);
  assert.match(prompt, /follows the linguistic style/);
  assert.match(prompt, /absolute maximum 6/);
  assert.match(prompt, /"N\/A" when unavailable/);
  assert.match(prompt, /<constraints>/);
  assert.equal((prompt.match(/<role>/g) ?? []).length, 1);
  assert.equal((prompt.match(/<task>/g) ?? []).length, 1);
  assert.doesNotMatch(prompt, /L002: page 5/);
  assert.doesNotMatch(prompt, /This block is injected at runtime/);
  assert.equal(GENERATE_SECTIONS.requestedLetters.includes('L002: page 5'), true);
  assert.doesNotMatch(prompt, /"note"/);
});

test('Dua Urdu boundary prompt remains the shared note-free detector', () => {
  const prompt = buildDuaUrduAnalyzePdfPrompt();
  assert.match(prompt, /detect letter boundaries/i);
  assert.match(prompt, /source_pages/);
});
