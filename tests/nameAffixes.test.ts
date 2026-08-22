import assert from 'node:assert/strict';
import test from 'node:test';
import { DUA_URDU_NAME_AFFIX_BUTTONS } from '../lib/duaUrdu/editorConfig.js';
import { applyNameAffix } from '../lib/nameAffixes.js';

const [male, female] = DUA_URDU_NAME_AFFIX_BUTTONS;

test('applies male and female Urdu honorifics around a name', () => {
  assert.equal(
    applyNameAffix('احمد علی', male, DUA_URDU_NAME_AFFIX_BUTTONS),
    'مکرم احمد علی صاحب'
  );
  assert.equal(
    applyNameAffix('فاطمہ احمد', female, DUA_URDU_NAME_AFFIX_BUTTONS),
    'مکرمہ فاطمہ احمد صاحبہ'
  );
});

test('replaces existing configured honorifics without nesting them', () => {
  const maleName = applyNameAffix('احمد علی', male, DUA_URDU_NAME_AFFIX_BUTTONS);
  assert.equal(applyNameAffix(maleName, male, DUA_URDU_NAME_AFFIX_BUTTONS), maleName);
  assert.equal(
    applyNameAffix(maleName, female, DUA_URDU_NAME_AFFIX_BUTTONS),
    'مکرمہ احمد علی صاحبہ'
  );
});

test('leaves blank and N/A names unchanged', () => {
  assert.equal(applyNameAffix('', male, DUA_URDU_NAME_AFFIX_BUTTONS), '');
  assert.equal(applyNameAffix('  ', male, DUA_URDU_NAME_AFFIX_BUTTONS), '  ');
  assert.equal(applyNameAffix('N/A', female, DUA_URDU_NAME_AFFIX_BUTTONS), 'N/A');
});
