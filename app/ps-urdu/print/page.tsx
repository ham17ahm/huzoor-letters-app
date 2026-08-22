import { Suspense } from 'react';
import { PsUrduPrintPageClient } from '@/app/ps-urdu/print/PsUrduPrintPageClient';

export default function PsUrduPrintPage() {
  return (
    <Suspense fallback={<main className="emptyState">Loading print preview...</main>}>
      <PsUrduPrintPageClient />
    </Suspense>
  );
}
