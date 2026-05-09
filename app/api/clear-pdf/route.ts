import { NextResponse } from 'next/server';
import { deletePdfSession } from '@/lib/pdfSession';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { pdfSessionId?: string };
    if (body.pdfSessionId) deletePdfSession(body.pdfSessionId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
