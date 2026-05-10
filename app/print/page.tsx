import { Suspense } from 'react';
import { PrintPageClient } from '@/app/print/PrintPageClient';

export default function PrintPage() {
  return (
    <Suspense fallback={<main className="emptyState">Loading print preview...</main>}>
      <PrintPageClient />
    </Suspense>
  );
}
