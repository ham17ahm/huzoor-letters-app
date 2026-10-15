import assert from 'node:assert/strict';
import test from 'node:test';
import { getArgonModel } from '../lib/aiModelConfig.js';
import { parseEngine, resolveArgonEngine } from '../lib/argonEngine.js';
import { buildGenerationConfig } from '../lib/geminiGenerationConfig.js';

test('Argon model ignores GEMINI_MODEL and honours GEMINI_ARGON_MODEL', () => {
  const saved = {
    argon: process.env.GEMINI_ARGON_MODEL,
    fallback: process.env.GEMINI_MODEL
  };

  try {
    delete process.env.GEMINI_ARGON_MODEL;
    process.env.GEMINI_MODEL = 'gemini-2.5-flash';
    assert.equal(getArgonModel(), 'gemini-4-argon');

    process.env.GEMINI_ARGON_MODEL = 'custom-argon';
    assert.equal(getArgonModel(), 'custom-argon');
  } finally {
    if (saved.argon === undefined) delete process.env.GEMINI_ARGON_MODEL;
    else process.env.GEMINI_ARGON_MODEL = saved.argon;
    if (saved.fallback === undefined) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = saved.fallback;
  }
});

test('parseEngine accepts only the two Argon engines', () => {
  assert.equal(parseEngine(null), undefined);
  assert.equal(parseEngine(''), undefined);
  assert.equal(parseEngine('argon-medium'), 'argon-medium');
  assert.equal(parseEngine('argon-high'), 'argon-high');
  assert.equal(parseEngine('argon-low'), null);
  assert.equal(parseEngine('gemini-2.5-flash'), null);
});

test('resolveArgonEngine maps each engine to its thinking level', () => {
  assert.equal(resolveArgonEngine('argon-medium').thinkingLevel, 'medium');
  assert.equal(resolveArgonEngine('argon-high').thinkingLevel, 'high');
});

test('buildGenerationConfig keeps the default config and omits temperature for Argon', () => {
  assert.deepEqual(buildGenerationConfig(), {
    mediaResolution: 'MEDIA_RESOLUTION_HIGH',
    temperature: 0.1
  });
  assert.deepEqual(buildGenerationConfig('high'), {
    mediaResolution: 'MEDIA_RESOLUTION_HIGH',
    thinkingConfig: { thinkingLevel: 'high' }
  });
});
