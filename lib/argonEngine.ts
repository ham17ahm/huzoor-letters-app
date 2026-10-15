import { getArgonModel } from './aiModelConfig';
import type { GeminiThinkingLevel } from './geminiGenerationConfig';

export type GenerateEngine = 'argon-medium' | 'argon-high';

export const ARGON_ENGINE_LABELS: Record<GenerateEngine, string> = {
  'argon-medium': 'Argon 4 (medium)',
  'argon-high': 'Argon 4 (high)'
};

const ARGON_THINKING_LEVELS: Record<GenerateEngine, GeminiThinkingLevel> = {
  'argon-medium': 'medium',
  'argon-high': 'high'
};

/** Returns undefined for a missing field, null for an unrecognised value. */
export function parseEngine(value: unknown): GenerateEngine | undefined | null {
  if (value === null || value === undefined || value === '') return undefined;
  if (value === 'argon-medium' || value === 'argon-high') return value;
  return null;
}

export function resolveArgonEngine(engine: GenerateEngine): {
  model: string;
  thinkingLevel: GeminiThinkingLevel;
} {
  return { model: getArgonModel(), thinkingLevel: ARGON_THINKING_LEVELS[engine] };
}
