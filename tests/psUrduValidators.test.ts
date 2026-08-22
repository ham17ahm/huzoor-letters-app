import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizePsUrduBulkReplies,
  normalizePsUrduReply
} from '../lib/psUrdu/validators.js';

const REQUIRED_PREFIX =
  'آپ کا خط حضورانور ایدہ اللہ تعالیٰ بنصرہ العزیز کی خدمت میں موصول ہوا';

test('PS Urdu validator preserves the required two-sentence inquiry style', () => {
  const inquiry = `${REQUIRED_PREFIX} جس میں آپ نے اپنی علالت کا ذکر کیا ہے۔ بعد ملاحظہ حضورانور نے دعا کی ہے۔`;
  const result = normalizePsUrduReply({
    full_name: ' احمد خان ',
    location: ' لندن، یوکے ',
    inquiry,
    prayer_sentence: 'اللہ تعالیٰ فضل فرمائے۔ آمین'
  });

  assert.equal(result.full_name, 'احمد خان');
  assert.equal(result.location, 'لندن، یوکے');
  assert.equal(result.inquiry, inquiry);
  assert.equal(result.prayer_sentence, 'اللہ تعالیٰ فضل فرمائے۔ آمین');
  assert.doesNotMatch(result.inquiry, /^آپ کا خط ملا/u);
});

test('PS Urdu validator repairs missing boundaries without using the Dua Urdu prefix', () => {
  const result = normalizePsUrduReply({
    inquiry: 'جس میں آپ نے دعا کی درخواست کی ہے۔ بعد ملاحظہ حضورانور نے دعا کی ہے۔',
    prayer_sentence: 'اللہ تعالیٰ فضل فرمائے۔'
  });

  assert.match(result.inquiry, new RegExp(`^${REQUIRED_PREFIX}`));
  assert.match(result.prayer_sentence, /آمین$/u);
  assert.equal(result.full_name, 'N/A');
  assert.equal(result.location, 'N/A');
});

test('PS Urdu bulk validator enforces requested ids and completeness', () => {
  const replies = normalizePsUrduBulkReplies(
    {
      replies: [
        {
          letter_id: 'L001',
          inquiry: `${REQUIRED_PREFIX}۔ بعد ملاحظہ حضورانور نے دعا کی ہے۔`,
          prayer_sentence: 'اللہ تعالیٰ فضل فرمائے۔ آمین'
        }
      ]
    },
    ['L001']
  );

  assert.equal(replies[0].letter_id, 'L001');
  assert.throws(() => normalizePsUrduBulkReplies([], ['L001']));
  assert.throws(() => normalizePsUrduBulkReplies([{ letter_id: 'L999' }], ['L001']));
});
