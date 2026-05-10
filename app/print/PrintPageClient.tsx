'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PrintPreview } from '@/components/PrintPreview';
import { readPrintPreviewSession } from '@/lib/printPreviewSession';
import type { LetterRecord } from '@/types/letter';

export function PrintPageClient() {
  const searchParams = useSearchParams();
  const [isReady, setIsReady] = useState(false);
  const [letters, setLetters] = useState<LetterRecord[]>([]);

  useEffect(() => {
    setLetters(readPrintPreviewSession(searchParams.get('token')));
    setIsReady(true);
  }, [searchParams]);

  if (!isReady) {
    return <main className="emptyState">Loading print preview...</main>;
  }

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
