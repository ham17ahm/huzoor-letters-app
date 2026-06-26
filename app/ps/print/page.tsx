import { Suspense } from 'react';
import { PsPrintPageClient } from '@/app/ps/print/PsPrintPageClient';

export default function PsPrintPage() {
  return (
    <Suspense fallback={<main className="emptyState">Loading print preview...</main>}>
      <PsPrintPageClient />
    </Suspense>
  );
}
