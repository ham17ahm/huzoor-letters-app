import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Amiri } from 'next/font/google';
import './globals.css';

const amiri = Amiri({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-amiri',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'Letters — Processor',
  description: 'Local correspondence letter processing app'
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className={amiri.variable}>{children}</body>
    </html>
  );
}
