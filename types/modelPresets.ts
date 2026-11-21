export type ModelTask = 'detectPdf' | 'generateReplies';

export type ModelOption = {
  id: string;
  label: string;
};

export type ModelCatalog = Record<ModelTask, {
  defaultPreset: string;
  presets: ModelOption[];
}>;

export type ModelCatalogResponse = ModelCatalog & {
  /** Names (never values) of ignored GEMINI_*MODEL variables still set in .env.local. */
  legacyEnvVars: string[];
};
