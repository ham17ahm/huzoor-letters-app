'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { PrintPreview } from '@/components/PrintPreview';
import { readPrintPreviewSession } from '@/lib/printPreviewSession';

export function PrintPageClient() {
  const searchParams = useSearchParams();
  const letters = useMemo(
    () => readPrintPreviewSession(searchParams.get('token')),
    [searchParams]
  );

  if (!letters.length) {
    return (
      <main className="emptyState">
        <h2>No print data found</h2>
        <p>Return to the main page and click Print / PDF again.</p>
      </main>
    );
  }

  return <PrintPreview letters={letters} onClose={() => window.close()} />;
}
