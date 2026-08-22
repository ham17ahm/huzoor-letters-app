import {
  buildDuaUrduAnalyzePdfPrompt,
  buildDuaUrduGenerateRepliesPrompt
} from '../duaUrdu/prompts';
import type { PsUrduLetterRecord } from '../../types/psUrdu';

/**
 * PS Urdu currently starts with the Dua Urdu prompts verbatim. Keep this
 * route-specific module as the replacement seam for the final PS Urdu prompt.
 */
export function buildPsUrduAnalyzePdfPrompt(): string {
  return buildDuaUrduAnalyzePdfPrompt();
}

export function buildPsUrduGenerateRepliesPrompt(
  letters: PsUrduLetterRecord[]
): string {
  return buildDuaUrduGenerateRepliesPrompt(letters);
}
