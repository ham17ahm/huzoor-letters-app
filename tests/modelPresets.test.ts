import assert from 'node:assert/strict';
import test from 'node:test';
import {
  findLegacyModelEnvVars,
  getModelCatalog,
  InvalidModelPresetError,
  loadModelConfig,
  parseModelConfig,
  resolveModelPreset
} from '../lib/modelPresets.js';

test('the shipped config defaults to Gemini 2.5 Flash detection and Argon Medium generation', async () => {
  const config = await loadModelConfig();
  assert.equal(resolveModelPreset(config, 'detectPdf', null).model, 'gemini-2.5-flash');
  const generate = resolveModelPreset(config, 'generateReplies', null);
  assert.equal(generate.id, 'argon-medium');
  assert.equal(generate.model, 'gemini-4-argon');
  assert.deepEqual(generate.generationConfig?.thinkingConfig, { thinkingLevel: 'medium' });
  assert.equal(Object.hasOwn(generate.generationConfig ?? {}, 'temperature'), false);
});

const preset = {
  id: 'preview',
  label: 'Preview',
  model: 'gemini-new-preview',
  generationConfig: { thinkingConfig: { thinkingBudget: 2048 }, maxOutputTokens: 8000 }
};
const taskConfig = { defaultPreset: preset.id, presets: [preset] };

test('a new preset keeps its provider settings and exposes only its ID and label to the UI', () => {
  const config = parseModelConfig({ detectPdf: taskConfig, generateReplies: taskConfig });
  assert.deepEqual(resolveModelPreset(config, 'detectPdf', 'preview'), preset);
  assert.deepEqual(getModelCatalog(config).detectPdf, {
    defaultPreset: 'preview',
    presets: [{ id: 'preview', label: 'Preview' }]
  });
});

test('a selection must be a preset ID configured for the requested task', async () => {
  const config = await loadModelConfig();
  for (const selection of ['argon-high', 'gemini-4-argon', '', new File(['argon-high'], 'preset.txt')]) {
    assert.throws(
      () => resolveModelPreset(config, 'detectPdf', selection),
      InvalidModelPresetError
    );
  }
  assert.deepEqual(
    resolveModelPreset(config, 'generateReplies', 'argon-high').generationConfig?.thinkingConfig,
    { thinkingLevel: 'high' }
  );
});

test('config errors identify the task and invalid field', () => {
  const invalidTasks = [
    [{ ...taskConfig, presets: [] }, /detectPdf\.presets must contain at least one preset/],
    [{ ...taskConfig, defaultPreset: 'missing' }, /detectPdf\.defaultPreset must match/],
    [{ ...taskConfig, presets: [preset, preset] }, /detectPdf contains duplicate preset ID/],
    [{ ...taskConfig, presets: [{ ...preset, generationConfig: [] }] }, /detectPdf\.presets\[0\]\.generationConfig/]
  ] as const;

  for (const [detectPdf, message] of invalidTasks) {
    assert.throws(() => parseModelConfig({ detectPdf, generateReplies: taskConfig }), message);
  }
});

test('legacy .env.local model variables are reported by name and other settings are ignored', () => {
  assert.deepEqual(
    findLegacyModelEnvVars({
      GEMINI_API_KEY: 'secret',
      GEMINI_REQUEST_TIMEOUT_MS: '1200000',
      DEBUG_GEMINI_REQUESTS: 'false',
      GEMINI_PS_GENERATE_REPLIES_MODEL: 'gemini-2.5-flash',
      GEMINI_MODEL: 'gemini-2.5-flash',
      GEMINI_ARGON_MODEL: 'gemini-4-argon',
      GEMINI_DETECT_PDF_MODEL: '  ',
      GEMINI_DUA_URDU_DETECT_PDF_MODEL: undefined
    }),
    ['GEMINI_ARGON_MODEL', 'GEMINI_MODEL', 'GEMINI_PS_GENERATE_REPLIES_MODEL']
  );
});

test('an unavailable selection explains that the work was kept instead of asking for a reload', async () => {
  const config = await loadModelConfig();
  assert.throws(
    () => resolveModelPreset(config, 'generateReplies', 'removed-preset'),
    (error: unknown) => error instanceof InvalidModelPresetError &&
      /letters and the uploaded PDF were kept/.test(error.message) &&
      !/reload/i.test(error.message)
  );
});
