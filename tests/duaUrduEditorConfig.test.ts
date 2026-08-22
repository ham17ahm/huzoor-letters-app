import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DUA_URDU_EDITOR_CONFIG,
  DUA_URDU_NAME_AFFIX_BUTTONS
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
  assert.deepEqual(DUA_URDU_EDITOR_CONFIG.visuallyHiddenLabels, [
    'inquiry',
    'prayerSentence'
  ]);
  assert.deepEqual(DUA_URDU_EDITOR_CONFIG.identityFieldOrder, ['location', 'fullName']);
});

test('Dua Urdu provides only male and female full-name honorific buttons', () => {
  assert.deepEqual(DUA_URDU_EDITOR_CONFIG.inquiryPhraseButtons, []);
  assert.deepEqual(
    DUA_URDU_NAME_AFFIX_BUTTONS,
    [
      { id: 'male', label: 'Male', prefix: 'مکرم', suffix: 'صاحب' },
      { id: 'female', label: 'Female', prefix: 'مکرمہ', suffix: 'صاحبہ' }
    ]
  );
  assert.equal(DUA_URDU_EDITOR_CONFIG.fullNameAffixButtons, DUA_URDU_NAME_AFFIX_BUTTONS);
});
