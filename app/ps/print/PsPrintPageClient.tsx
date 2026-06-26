'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PsPrintPreview } from '@/components/ps/PsPrintPreview';
import { readPrintPreviewSession } from '@/lib/ps/printPreviewSession';
import type { PsLetterRecord } from '@/types/ps';

export function PsPrintPageClient() {
  const searchParams = useSearchParams();
  const [isReady, setIsReady] = useState(false);
  const [letters, setLetters] = useState<PsLetterRecord[]>([]);

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

  return <PsPrintPreview letters={letters} onClose={() => window.close()} />;
}
