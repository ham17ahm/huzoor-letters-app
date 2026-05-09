const PDF_SESSION_TTL_MS = 2 * 60 * 60 * 1000;

type PdfSession = {
  pdfBase64: string;
  createdAt: number;
  expiresAt: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __huzoorPdfSessions: Map<string, PdfSession> | undefined;
}

const sessions = globalThis.__huzoorPdfSessions ?? new Map<string, PdfSession>();
globalThis.__huzoorPdfSessions = sessions;

export function createPdfSession(pdfBase64: string): string {
  cleanupExpiredPdfSessions();
  const id = crypto.randomUUID();
  const now = Date.now();

  sessions.set(id, {
    pdfBase64,
    createdAt: now,
    expiresAt: now + PDF_SESSION_TTL_MS
  });

  return id;
}

export function getPdfSession(id: string): string {
  cleanupExpiredPdfSessions();
  const session = sessions.get(id);

  if (!session) {
    throw new Error('PDF session expired or was not found. Please upload and analyze the PDF again.');
  }

  return session.pdfBase64;
}

export function deletePdfSession(id: string): void {
  sessions.delete(id);
}

export function cleanupExpiredPdfSessions(): void {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (session.expiresAt <= now) sessions.delete(id);
  }
}
