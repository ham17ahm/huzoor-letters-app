import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';

export default function nextConfig(phase: string): NextConfig {
  return {
    // Keep dev artifacts separate from production build artifacts.
    // This avoids .next collisions when build/dev run at different times.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next/dev' : '.next'
  };
}
