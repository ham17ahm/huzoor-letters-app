import { formatPageRange } from '../pageRanges';
import { buildPsAnalyzePdfPrompt } from '../ps/prompts';
import type { DuaUrduLetterRecord } from '../../types/duaUrdu';

/**
 * Temporary Dua Urdu generation prompt.
 *
 * Its sections and stable JSON contract are intentionally isolated so the final
 * supplied prompt can replace the prose without requiring API or workflow changes.
 */
const GENERATE_SECTIONS = {
  role: `You are an Urdu correspondence assistant processing a PDF packet of letters.`,

  task: `For every requested letter, read only its listed source pages and prepare four editable reply fields.

The source letter may be written in Urdu, English, or another language. Understand the source language, but write all four output field values in natural, respectful Urdu using Urdu/Arabic script. Transliterate personal names and place names into Urdu script when they appear only in Latin script.`,

  fieldRules: `<field_rules>
- full_name: the letter writer's complete name in Urdu script; use "دستیاب نہیں" when unavailable.
- location: the available city and country in Urdu script; use "دستیاب نہیں" when unavailable.
- inquiry: a concise Urdu acknowledgment describing the principal matter or prayer request.
- prayer_sentence: a warm, respectful Urdu prayer related to the letter.

Do not copy details between letters. Do not include markdown or commentary in any field.
</field_rules>`,

  outputFormat: `<output_format>
Return only valid JSON with exactly this shape:
{
  "replies": [
    {
      "letter_id": "L001",
      "full_name": "string",
      "location": "string",
      "inquiry": "string",
      "prayer_sentence": "string"
    }
  ]
}

Return exactly one object for every requested letter_id, preserve each letter_id exactly, and do not add extra letter_ids.
</output_format>`
} as const;

export function buildDuaUrduAnalyzePdfPrompt(): string {
  return buildPsAnalyzePdfPrompt();
}

export function buildDuaUrduGenerateRepliesPrompt(letters: DuaUrduLetterRecord[]): string {
  const requestedLetters = letters.map((letter) => ({
    letter_id: letter.letter_id,
    source_pages: formatPageRange(letter.source_pages)
  }));

  return [
    `<role>\n${GENERATE_SECTIONS.role}\n</role>`,
    `<task>\n${GENERATE_SECTIONS.task}\n</task>`,
    `<requested_letters>\n${JSON.stringify(requestedLetters, null, 2)}\n</requested_letters>`,
    GENERATE_SECTIONS.fieldRules,
    GENERATE_SECTIONS.outputFormat
  ].join('\n\n');
}
