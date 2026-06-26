import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizePsBulkReplies, normalizePsReply } from '../lib/ps/validators.js';

const PS_PREFIX = 'Huzoor Anwar (may Allah be his Helper) has received your letter';

test('normalizePsReply preserves a correct two-sentence PS inquiry unchanged', () => {
  const inquiry = `${PS_PREFIX} requesting prayers regarding your health. Following the perusal of your letter, Huzoor Anwar (aa) has offered his prayers.`;
  const result = normalizePsReply({
    full_name: 'Ahmad Hassan',
    location: 'Toronto, Canada',
    inquiry,
    prayer_sentence: 'May Allah Taala grant you a swift recovery. Amin'
  });

  assert.equal(result.inquiry, inquiry);
  assert.ok(!result.inquiry.startsWith('I have received your letter'));
});

test('normalizePsReply prepends the PS prefix when it is missing', () => {
  const result = normalizePsReply({
    inquiry: 'Requesting prayers for success in exams.',
    prayer_sentence: 'May Allah Taala grant you success. Amin'
  });

  assert.ok(result.inquiry.startsWith(PS_PREFIX));
  assert.equal(result.inquiry, `${PS_PREFIX} requesting prayers for success in exams.`);
});

test('normalizePsReply enforces the prayer prefix and Amin suffix', () => {
  const result = normalizePsReply({
    inquiry: `${PS_PREFIX} mentioning a family matter.`,
    prayer_sentence: 'grant them unity and harmony'
  });

  assert.ok(result.prayer_sentence.startsWith('May Allah Taala'));
  assert.match(result.prayer_sentence, /Amin$/);
});

test('normalizePsReply does not collapse the inquiry to a single sentence', () => {
  const inquiry = `${PS_PREFIX} asking about Taekwondo. Following the perusal of your letter, Huzoor Anwar (aa) has offered his prayers.`;
  const result = normalizePsReply({
    inquiry,
    prayer_sentence: 'May Allah Taala bless you. Amin'
  });

  // Both sentences survive.
  assert.match(result.inquiry, /asking about Taekwondo\./);
  assert.match(result.inquiry, /offered his prayers\.$/);
});

test('normalizePsBulkReplies validates ids and normalizes each reply', () => {
  const replies = normalizePsBulkReplies(
    [
      {
        letter_id: 'L001',
        full_name: 'A',
        location: 'London, UK',
        inquiry: `${PS_PREFIX} requesting guidance.`,
        prayer_sentence: 'May Allah Taala help you. Amin'
      }
    ],
    ['L001']
  );

  assert.equal(replies.length, 1);
  assert.equal(replies[0].letter_id, 'L001');
  assert.ok(replies[0].inquiry.startsWith(PS_PREFIX));
});

test('normalizePsBulkReplies throws on unexpected or missing letter_ids', () => {
  assert.throws(() =>
    normalizePsBulkReplies([{ letter_id: 'L999', inquiry: 'x', prayer_sentence: 'y' }], ['L001'])
  );
  assert.throws(() => normalizePsBulkReplies([], ['L001']));
});
