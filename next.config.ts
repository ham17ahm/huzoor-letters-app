import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';

export default function nextConfig(phase: string): NextConfig {
  return {
    // Keep dev artifacts in a SIBLING directory of the production build dir.
    // `next build` wipes its whole distDir (`.next`), so nesting dev output at
    // `.next/dev` meant a build would delete a running dev server's artifacts.
    // Using `.next-dev` (a sibling, not a child) keeps build and dev isolated.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next'
  };
}
