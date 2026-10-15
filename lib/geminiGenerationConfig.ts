export type GeminiThinkingLevel = 'low' | 'medium' | 'high';

export type GeminiGenerationConfig = {
  mediaResolution: 'MEDIA_RESOLUTION_HIGH';
  temperature?: number;
  thinkingConfig?: { thinkingLevel: GeminiThinkingLevel };
};

/**
 * Default calls keep the existing low-temperature config. When a thinking level is requested
 * (Gemini 4 Argon), temperature is omitted because Argon ignores sampling parameters.
 */
export function buildGenerationConfig(thinkingLevel?: GeminiThinkingLevel): GeminiGenerationConfig {
  if (!thinkingLevel) {
    return { mediaResolution: 'MEDIA_RESOLUTION_HIGH', temperature: 0.1 };
  }

  return { mediaResolution: 'MEDIA_RESOLUTION_HIGH', thinkingConfig: { thinkingLevel } };
}
