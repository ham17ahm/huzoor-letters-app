import assert from 'node:assert/strict';
import test from 'node:test';
import { buildDuaUrduAnalyzePdfPrompt } from '../lib/duaUrdu/prompts.js';
import {
  GENERATE_SECTIONS,
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

test('PS Urdu keeps the shared Urdu boundary detector', () => {
  assert.equal(buildPsUrduAnalyzePdfPrompt(), buildDuaUrduAnalyzePdfPrompt());
});

test('PS Urdu generation prompt injects requested pages into its dedicated prompt', () => {
  const prompt = buildPsUrduGenerateRepliesPrompt(letters);
  assert.match(prompt, /"letter_id": "L001"/);
  assert.match(prompt, /"source_pages": "1, 3-4"/);
  assert.doesNotMatch(prompt, /L002: page 5/);
  assert.doesNotMatch(prompt, /This block is injected at runtime/);
});

test('PS Urdu prompt enforces the supplied inquiry style and JSON contract', () => {
  const prompt = buildPsUrduGenerateRepliesPrompt(letters);
  assert.match(
    prompt,
    /آپ کا خط حضورانور ایدہ اللہ تعالیٰ بنصرہ العزیز کی خدمت میں موصول ہوا/
  );
  assert.match(prompt, /بعد ملاحظہ حضورانور نے دعا کی ہے۔/);
  assert.match(prompt, /Exactly two sentences/);
  assert.match(prompt, /absolute maximum 7/);
  assert.match(prompt, /<compression_examples>/);
  assert.match(prompt, /<constraints>/);
  assert.match(prompt, /"prayer_sentence"/);
  assert.doesNotMatch(prompt, /"note"/);
  assert.equal(GENERATE_SECTIONS.requestedLetters.includes('L002: page 5'), true);
});
