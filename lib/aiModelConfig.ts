export const AI_MODEL_CONFIG = {
  detectPdf: {
    defaultModel: 'gemini-2.5-flash',
    envVar: 'GEMINI_DETECT_PDF_MODEL'
  },
  generateReplies: {
    defaultModel: 'gemini-2.5-flash',
    envVar: 'GEMINI_GENERATE_REPLIES_MODEL'
  },
  // PS workflow models, configured independently of the standard workflow.
  psDetectPdf: {
    defaultModel: 'gemini-2.5-flash',
    envVar: 'GEMINI_PS_DETECT_PDF_MODEL'
  },
  psGenerateReplies: {
    defaultModel: 'gemini-2.5-flash',
    envVar: 'GEMINI_PS_GENERATE_REPLIES_MODEL'
  },
  fallbackEnvVar: 'GEMINI_MODEL'
} as const;

export function getDetectPdfModel(): string {
  return getConfiguredModel(AI_MODEL_CONFIG.detectPdf);
}

export function getGenerateRepliesModel(): string {
  return getConfiguredModel(AI_MODEL_CONFIG.generateReplies);
}

export function getPsDetectPdfModel(): string {
  return getConfiguredModel(AI_MODEL_CONFIG.psDetectPdf);
}

export function getPsGenerateRepliesModel(): string {
  return getConfiguredModel(AI_MODEL_CONFIG.psGenerateReplies);
}

function getConfiguredModel(workflow: { defaultModel: string; envVar: string }): string {
  return process.env[workflow.envVar] || process.env[AI_MODEL_CONFIG.fallbackEnvVar] || workflow.defaultModel;
}
