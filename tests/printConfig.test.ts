import assert from 'node:assert/strict';
import test from 'node:test';
import { PRINT_TEMPLATE_TEXT, shouldPrintNote } from '../lib/printConfig.js';

test('shouldPrintNote hides blank and Dua-only notes', () => {
  assert.equal(shouldPrintNote(''), false);
  assert.equal(shouldPrintNote('   '), false);
  assert.equal(shouldPrintNote('Dua'), false);
  assert.equal(shouldPrintNote(' dua '), false);
});

test('shouldPrintNote shows specific operator notes', () => {
  assert.equal(shouldPrintNote('Please advise according to the doctor.'), true);
});

test('print template exposes default fallback text used by the print preview', () => {
  assert.equal(PRINT_TEMPLATE_TEXT.defaultInquiry, 'I have received your letter.');
  assert.equal(PRINT_TEMPLATE_TEXT.defaultPrayer, 'May Allah Taala bless you in every way. Amin');
  assert.equal(PRINT_TEMPLATE_TEXT.fallbackValue, 'N/A');
});
