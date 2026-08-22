'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PsUrduPrintPreview } from '@/components/ps-urdu/PsUrduPrintPreview';
import { readPsUrduPrintPreviewSession } from '@/lib/psUrdu/printPreviewSession';
import type { PsUrduLetterRecord } from '@/types/psUrdu';

export function PsUrduPrintPageClient() {
  const searchParams = useSearchParams();
  const [isReady, setIsReady] = useState(false);
  const [letters, setLetters] = useState<PsUrduLetterRecord[]>([]);

  useEffect(() => {
    setLetters(readPsUrduPrintPreviewSession(searchParams.get('token')));
    setIsReady(true);
  }, [searchParams]);

  if (!isReady) {
    return <main className="emptyState">Loading print preview...</main>;
  }

  if (!letters.length) {
    return (
      <main className="emptyState">
        <h2>No print data found</h2>
        <p>Return to PS Urdu and click Print / PDF again.</p>
      </main>
    );
  }

  return <PsUrduPrintPreview letters={letters} onClose={() => window.close()} />;
}
