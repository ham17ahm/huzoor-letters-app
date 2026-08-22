import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getPsUrduDetectPdfModel,
  getPsUrduGenerateRepliesModel
} from '../lib/aiModelConfig.js';

test('PS Urdu model settings override and otherwise inherit Dua Urdu settings', () => {
  const names = [
    'GEMINI_PS_URDU_DETECT_PDF_MODEL',
    'GEMINI_PS_URDU_GENERATE_REPLIES_MODEL',
    'GEMINI_DUA_URDU_DETECT_PDF_MODEL',
    'GEMINI_DUA_URDU_GENERATE_REPLIES_MODEL'
  ] as const;
  const saved = new Map(names.map((name) => [name, process.env[name]]));

  try {
    delete process.env.GEMINI_PS_URDU_DETECT_PDF_MODEL;
    delete process.env.GEMINI_PS_URDU_GENERATE_REPLIES_MODEL;
    process.env.GEMINI_DUA_URDU_DETECT_PDF_MODEL = 'dua-detect';
    process.env.GEMINI_DUA_URDU_GENERATE_REPLIES_MODEL = 'dua-generate';

    assert.equal(getPsUrduDetectPdfModel(), 'dua-detect');
    assert.equal(getPsUrduGenerateRepliesModel(), 'dua-generate');

    process.env.GEMINI_PS_URDU_DETECT_PDF_MODEL = 'ps-urdu-detect';
    process.env.GEMINI_PS_URDU_GENERATE_REPLIES_MODEL = 'ps-urdu-generate';

    assert.equal(getPsUrduDetectPdfModel(), 'ps-urdu-detect');
    assert.equal(getPsUrduGenerateRepliesModel(), 'ps-urdu-generate');
  } finally {
    for (const name of names) {
      const value = saved.get(name);
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});
