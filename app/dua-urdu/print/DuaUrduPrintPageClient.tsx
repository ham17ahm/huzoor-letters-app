'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DuaUrduPrintPreview } from '@/components/dua-urdu/DuaUrduPrintPreview';
import { readDuaUrduPrintPreviewSession } from '@/lib/duaUrdu/printPreviewSession';
import type { DuaUrduLetterRecord } from '@/types/duaUrdu';

export function DuaUrduPrintPageClient() {
  const searchParams = useSearchParams();
  const [isReady, setIsReady] = useState(false);
  const [letters, setLetters] = useState<DuaUrduLetterRecord[]>([]);

  useEffect(() => {
    setLetters(readDuaUrduPrintPreviewSession(searchParams.get('token')));
    setIsReady(true);
  }, [searchParams]);

  if (!isReady) {
    return <main className="emptyState">Loading print preview...</main>;
  }

  if (!letters.length) {
    return (
      <main className="emptyState">
        <h2>No print data found</h2>
        <p>Return to Dua Urdu and click Print / PDF again.</p>
      </main>
    );
  }

  return <DuaUrduPrintPreview letters={letters} onClose={() => window.close()} />;
}
