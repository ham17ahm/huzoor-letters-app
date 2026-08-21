import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeDuaUrduBulkReplies,
  normalizeDuaUrduReply
} from '../lib/duaUrdu/validators.js';

test('normalizeDuaUrduReply preserves Urdu fields and normalizes whitespace', () => {
  const result = normalizeDuaUrduReply({
    full_name: '  احمد   خان ',
    location: ' لندن، برطانیہ ',
    inquiry: 'آپ کا خط موصول ہوا۔',
    prayer_sentence: 'اللہ تعالیٰ آپ کو کامیابی عطا فرمائے۔ آمین۔'
  });

  assert.deepEqual(result, {
    full_name: 'احمد خان',
    location: 'لندن، برطانیہ',
    inquiry: 'آپ کا خط موصول ہوا۔',
    prayer_sentence: 'اللہ تعالیٰ آپ کو کامیابی عطا فرمائے۔ آمین۔'
  });
});

test('normalizeDuaUrduReply accepts Latin-script text for operator review', () => {
  const result = normalizeDuaUrduReply({
    full_name: 'Ahmad Khan',
    location: 'London, UK',
    inquiry: 'Your letter was received.',
    prayer_sentence: 'May Allah bless you.'
  });

  assert.equal(result.full_name, 'Ahmad Khan');
  assert.equal(result.inquiry, 'Your letter was received.');
});

test('normalizeDuaUrduReply uses safe missing-field defaults', () => {
  const result = normalizeDuaUrduReply({});

  assert.equal(result.full_name, 'دستیاب نہیں');
  assert.equal(result.location, 'دستیاب نہیں');
  assert.equal(result.inquiry, '');
  assert.equal(result.prayer_sentence, '');
});

test('normalizeDuaUrduBulkReplies validates completeness and unique requested ids', () => {
  const replies = normalizeDuaUrduBulkReplies(
    [
      {
        letter_id: 'L001',
        full_name: 'احمد',
        location: 'لندن',
        inquiry: 'ابتدائیہ',
        prayer_sentence: 'دعا'
      }
    ],
    ['L001']
  );

  assert.equal(replies[0].letter_id, 'L001');
  assert.throws(() =>
    normalizeDuaUrduBulkReplies(
      [
        { letter_id: 'L001' },
        { letter_id: 'L001' }
      ],
      ['L001']
    )
  );
  assert.throws(() => normalizeDuaUrduBulkReplies([{ letter_id: 'L999' }], ['L001']));
  assert.throws(() => normalizeDuaUrduBulkReplies([], ['L001']));
});
