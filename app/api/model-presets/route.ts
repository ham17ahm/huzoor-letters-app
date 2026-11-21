import { NextResponse } from 'next/server';
import { getLegacyModelEnvVars, getModelCatalog, loadModelConfig } from '@/lib/modelPresets';
import type { ModelCatalogResponse } from '@/types/modelPresets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const body: ModelCatalogResponse = {
      ...getModelCatalog(await loadModelConfig()),
      legacyEnvVars: getLegacyModelEnvVars()
    };
    return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load model presets.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
