import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ModelCatalog, ModelOption, ModelTask } from '../types/modelPresets';

export type ModelPreset = ModelOption & {
  model: string;
  generationConfig?: Record<string, unknown>;
};

type TaskPresets = {
  defaultPreset: string;
  presets: ModelPreset[];
};

type ModelConfig = Record<ModelTask, TaskPresets>;

const CONFIG_FILE = 'model-presets.json';

export class InvalidModelPresetError extends Error {}

export async function loadModelConfig(): Promise<ModelConfig> {
  try {
    const source = await readFile(join(process.cwd(), CONFIG_FILE), 'utf8');
    return parseModelConfig(JSON.parse(source.replace(/^\uFEFF/, '')));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error.';
    throw new Error(`Could not load ${CONFIG_FILE}. ${message}`);
  }
}

export function parseModelConfig(value: unknown): ModelConfig {
  if (!isObject(value)) throw new Error('Expected an object with detectPdf and generateReplies.');

  return {
    detectPdf: parseTask(value.detectPdf, 'detectPdf'),
    generateReplies: parseTask(value.generateReplies, 'generateReplies')
  };
}

export function getModelCatalog(config: ModelConfig): ModelCatalog {
  return {
    detectPdf: getTaskOptions(config.detectPdf),
    generateReplies: getTaskOptions(config.generateReplies)
  };
}

export async function getRequestedModelPreset(task: ModelTask, formData: FormData): Promise<ModelPreset> {
  const selection = formData.get('modelPreset')
    ?? (task === 'generateReplies' ? formData.get('engine') : null);
  return resolveModelPreset(await loadModelConfig(), task, selection);
}

export function resolveModelPreset(
  config: ModelConfig,
  task: ModelTask,
  selection: FormDataEntryValue | null
): ModelPreset {
  const { defaultPreset, presets } = config[task];
  const preset = presets.find(({ id }) => id === (selection ?? defaultPreset));
  if (!preset) {
    throw new InvalidModelPresetError(
      'The selected model is no longer available for this task. Choose a model from the list and try again. Your letters and the uploaded PDF were kept.'
    );
  }
  return preset;
}

// Model variables that earlier versions read from .env.local. They are now ignored in favor of
// model-presets.json, so name them (never their values) to make the migration visible.
const LEGACY_MODEL_ENV_PATTERN = /^GEMINI_(?:[A-Z0-9_]+_)?MODEL$/;

export function findLegacyModelEnvVars(env: Record<string, string | undefined>): string[] {
  return Object.keys(env)
    .filter((name) => LEGACY_MODEL_ENV_PATTERN.test(name) && Boolean(env[name]?.trim()))
    .sort();
}

let legacyEnvWarningLogged = false;

export function getLegacyModelEnvVars(): string[] {
  const names = findLegacyModelEnvVars(process.env);
  if (names.length && !legacyEnvWarningLogged) {
    legacyEnvWarningLogged = true;
    console.warn(
      `[model-presets] These .env.local variables are no longer used: ${names.join(', ')}. ` +
      `Move their models into ${CONFIG_FILE}, then remove them from .env.local.`
    );
  }
  return names;
}

function parseTask(value: unknown, task: ModelTask): TaskPresets {
  if (!isObject(value) || !Array.isArray(value.presets) || !value.presets.length) {
    throw new Error(`${task}.presets must contain at least one preset.`);
  }

  const ids = new Set<string>();
  const presets = value.presets.map((entry: unknown, index: number): ModelPreset => {
    const path = `${task}.presets[${index}]`;
    if (!isObject(entry) || typeof entry.id !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(entry.id)) {
      throw new Error(`${path}.id must use letters, numbers, dots, underscores, or hyphens and start with a letter or number.`);
    }
    if (ids.has(entry.id)) throw new Error(`${task} contains duplicate preset ID "${entry.id}".`);
    if (typeof entry.label !== 'string' || !entry.label.trim()) {
      throw new Error(`${path}.label must be a non-empty display name.`);
    }
    if (typeof entry.model !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(entry.model)) {
      throw new Error(`${path}.model must be a Gemini model ID, such as gemini-2.5-flash.`);
    }
    if (entry.generationConfig !== undefined && !isObject(entry.generationConfig)) {
      throw new Error(`${path}.generationConfig must be an object when provided.`);
    }

    ids.add(entry.id);
    return {
      id: entry.id,
      label: entry.label.trim(),
      model: entry.model,
      generationConfig: entry.generationConfig
    };
  });

  if (typeof value.defaultPreset !== 'string' || !ids.has(value.defaultPreset)) {
    throw new Error(`${task}.defaultPreset must match an ID in ${task}.presets.`);
  }
  return { defaultPreset: value.defaultPreset, presets };
}

function getTaskOptions({ defaultPreset, presets }: TaskPresets) {
  return { defaultPreset, presets: presets.map(({ id, label }) => ({ id, label })) };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
