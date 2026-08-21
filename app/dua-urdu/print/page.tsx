import { Suspense } from 'react';
import { DuaUrduPrintPageClient } from '@/app/dua-urdu/print/DuaUrduPrintPageClient';

export default function DuaUrduPrintPage() {
  return (
    <Suspense fallback={<main className="emptyState">Loading print preview...</main>}>
      <DuaUrduPrintPageClient />
    </Suspense>
  );
}
