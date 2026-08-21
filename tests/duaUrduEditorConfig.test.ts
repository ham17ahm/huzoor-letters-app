import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DUA_URDU_EDITOR_CONFIG,
  DUA_URDU_INQUIRY_PHRASE_BUTTONS
} from '../lib/duaUrdu/editorConfig.js';

test('Dua Urdu editor config localizes only the four reply fields', () => {
  assert.deepEqual(DUA_URDU_EDITOR_CONFIG.labels, {
    fullName: 'مکمل نام',
    location: 'جگہ',
    inquiry: 'ابتدائیہ',
    prayerSentence: 'دعائیہ جواب'
  });
  assert.equal(DUA_URDU_EDITOR_CONFIG.fieldLanguage, 'ur');
  assert.equal(DUA_URDU_EDITOR_CONFIG.fieldDirection, 'rtl');
  assert.equal(DUA_URDU_EDITOR_CONFIG.fieldClassName, 'duaUrduField');
  assert.deepEqual(DUA_URDU_EDITOR_CONFIG.identityFieldOrder, ['location', 'fullName']);
});

test('Dua Urdu inquiry helpers retain English labels and insert Urdu phrases', () => {
  assert.deepEqual(
    DUA_URDU_INQUIRY_PHRASE_BUTTONS.map((button) => button.label),
    ['Hadiyah', 'Gift', 'Condolences', 'Inna Lillah']
  );
  assert.match(DUA_URDU_INQUIRY_PHRASE_BUTTONS[0].phrase, /[\u0600-\u06ff]/u);
  assert.match(DUA_URDU_INQUIRY_PHRASE_BUTTONS[3].phrase, /إِنَّا لِلَّٰهِ/u);
});
