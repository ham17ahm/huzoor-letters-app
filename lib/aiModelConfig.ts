export const AI_MODEL_CONFIG = {
  detectPdf: {
    defaultModel: 'gemini-2.5-flash',
    envVar: 'GEMINI_DETECT_PDF_MODEL'
  },
  generateReplies: {
    defaultModel: 'gemini-2.5-flash',
    envVar: 'GEMINI_GENERATE_REPLIES_MODEL'
  },
  fallbackEnvVar: 'GEMINI_MODEL'
} as const;

export function getDetectPdfModel(): string {
  return getConfiguredModel(AI_MODEL_CONFIG.detectPdf);
}

export function getGenerateRepliesModel(): string {
  return getConfiguredModel(AI_MODEL_CONFIG.generateReplies);
}

function getConfiguredModel(workflow: { defaultModel: string; envVar: string }): string {
  return process.env[workflow.envVar] || process.env[AI_MODEL_CONFIG.fallbackEnvVar] || workflow.defaultModel;
}
