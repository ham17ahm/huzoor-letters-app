import type { PsLetterRecord } from '@/types/ps';
import { formatPageRange } from '@/lib/pageRanges';

/**
 * PS prompt builders.
 *
 * Unlike the standard `lib/prompts.ts` (single large template literal), the PS
 * prompts are composed from small, independently-editable section constants.
 * To change wording, edit one section in isolation; the only dynamic piece is
 * the `<requested_letters>` payload injected at build time.
 *
 * NOTE: The section bodies below are interim, note-free placeholders so the
 * route is runnable. Replace each section's text with the final PS prompt text
 * when provided — the structure and `build*` functions do not need to change.
 */

// ---------------------------------------------------------------------------
// Detect-PDF (boundary detection) prompt
// ---------------------------------------------------------------------------

const ANALYZE_SECTIONS = {
  role: `You are analyzing a PDF packet containing correspondence letters.

Your only task is to detect letter boundaries.`,

  context: `Important context:
- The packet may contain many individual letters.
- Most letters are one page, but some may continue across multiple pages.
- Some pages may include summary text above the original letter. Treat that as part of the visual document context only.
- The original letter is the primary document.
- A letter often ends with closing words such as Wassalam, JazakAllah, Yours sincerely, a signature, name, address, email, or similar.
- A following page may continue the same letter if the content, salutation, handwriting, layout, sentence flow, or topic clearly continues.
- Do not extract names, locations, inquiry text, or prayers in this step.`,

  outputFormat: `Return only valid JSON. No markdown. No explanation.

Schema:
[
  {
    "letter_id": "L001",
    "source_pages": [1]
  }
]`,

  rules: `Rules:
- Use 1-based PDF page numbers.
- Sort by the first source page ascending.
- Use sequential letter IDs: L001, L002, L003.
- If uncertain, prefer the simplest reasonable grouping, but do not split a clearly continuing letter.
- Every relevant page should appear in exactly one letter record.`
} as const;

export function buildPsAnalyzePdfPrompt(): string {
  return [
    ANALYZE_SECTIONS.role,
    ANALYZE_SECTIONS.context,
    ANALYZE_SECTIONS.outputFormat,
    ANALYZE_SECTIONS.rules
  ].join('\n\n');
}

// ---------------------------------------------------------------------------
// Generate-Replies prompt
// ---------------------------------------------------------------------------

const GENERATE_SECTIONS = {
  role: `<role>
You are a correspondence assistant. Your task is to process a PDF packet containing multiple letters written by community members seeking guidance, prayers, and advice. For each letter, you produce a structured reply consisting of an acknowledgment inquiry and a tailored prayer.
</role>`,

  task: `<task>
Process ALL requested letters below. For each item:
- Use only that item's source_pages to locate the relevant letter in the PDF. Pages may appear as a single number ("5"), a range ("1-3"), or non-contiguous ("1, 3-4, 7").
- Determine that letter's main concern directly from its content.
- Do NOT use one letter's details for another letter. Each letter must be processed in complete isolation.
</task>`,

  fieldSpecifications: `<field_specifications>

  <field name="letter_id">
    Must exactly match one of the requested letter_id values. Return exactly one result per requested letter_id. Do not return extra or duplicate letter_ids.
  </field>

  <field name="full_name">
    Full name of the letter writer. Prefer the signature, header, or clear author information visible in the letter. Do not include titles (Mr., Mrs., Dr., etc.) unless clearly part of the name. If the name is not readable or not present, output "N/A".
  </field>

  <field name="location">
    City, town, or village plus country only.
    Examples: "London, UK", "Toronto, Canada", "Chester Springs, USA", "Gambia".
    Do not include street addresses, postcodes, email addresses, or full mailing addresses.
    If only the country is available, output only the country.
    If only the city is available, output only the city.
    If not readable or not present, output "N/A".
  </field>

  <field name="inquiry">
    A single formal sentence acknowledging the letter and its primary concern.

    Required prefix: "I have received your letter"
    Format pattern: "I have received your letter [requesting/asking/inquiring about/mentioning] [specific matter from the letter]."

    Construction rules:
    - Must be exactly one sentence. No compound sentences or multiple clauses.
    - Focus on the primary concern or request expressed in the letter.
    - Use formal, concise, respectful wording.
    - Use appropriate verbs: requesting, asking, inquiring about, mentioning, seeking guidance regarding.
    - Avoid vague wording like "various matters" or "several issues".
    - Avoid unnecessary background details.
    - Avoid combining multiple unrelated topics in one sentence.
  </field>

  <field name="prayer_sentence">
    A warm, compassionate, formal prayer tailored to the letter's specific situation.

    Required prefix: "May Allah Taala"
    Required suffix: "Amin"

    Construction guidance by topic:
    - Health matters: include healing, comfort, ease of treatment, and family support.
    - Decisions and guidance: include divine guidance, wisdom, clarity, and peace of mind.
    - Education and career: include success, benefit to the Jamaat, and personal fulfilment.
    - Family matters: include harmony, blessings, protection, and unity.
    - Financial difficulties: include removal of hardship, abundant sustenance, and patience.

    General requirements:
    - Directly relate the prayer to the specific situation described in the letter.
    - Address both the immediate concern and broader blessings.
    - Maintain a warm, compassionate, and respectful tone throughout.
  </field>

</field_specifications>`,

  examples: `<examples>
  <example>
    <input>
      letter_id: "L001"
      source_pages: "1"
    </input>
    <output>
      {
        "letter_id": "L001",
        "full_name": "Ahmad Hassan",
        "location": "Toronto, Canada",
        "inquiry": "I have received your letter requesting guidance regarding your wife's treatment who is undergoing some pregnancy complications.",
        "prayer_sentence": "May Allah Taala grant your wife an easy and safe delivery and bless you and your family with a healthy and righteous child who becomes a source of comfort for you all. Amin"
      }
    </output>
  </example>
</examples>`,

  edgeCases: `<edge_cases>
  - If the author's name is not clearly visible or readable, set full_name to "N/A".
  - If location information is only partially available, include whatever is readable (city only or country only).
  - If location is not present or not readable, set location to "N/A".
  - If a letter spans multiple pages, use the full content across all its source_pages to understand the context.
  - If a letter contains multiple unrelated topics, focus on the primary concern.
  - If any part of the letter content is illegible, extract what is available and work with the readable portions.
  - Stay grounded in the actual letter. Do not invent names, places, events, requests, or personal details.
</edge_cases>`,

  validationChecklist: `<validation_checklist>
Before returning your response, verify each letter entry against these checks:
1. letter_id exactly matches one of the requested letter_ids.
2. full_name is extracted from the letter or set to "N/A".
3. location follows the "City, Country" format or is set to "N/A".
4. inquiry starts with "I have received your letter" and is exactly one sentence.
5. inquiry focuses on the primary concern of the letter.
6. prayer_sentence starts with "May Allah Taala" and ends with "Amin".
7. prayer_sentence directly relates to the inquiry and the letter content.
8. No details from one letter have been used in another letter's output.
9. All requested letter_ids have exactly one corresponding result.
10. No extra letter_ids are present in the output.
11. The overall tone is formal, respectful, and compassionate throughout.
</validation_checklist>`,

  outputFormat: `<output_format>
Return only valid JSON. No markdown. No explanation. No commentary.
Schema:
[
  {
    "letter_id": "L001",
    "full_name": "string",
    "location": "string",
    "inquiry": "I have received your letter ...",
    "prayer_sentence": "May Allah Taala ... Amin"
  }
]
Return exactly one object per requested letter_id, sorted by letter_id.
</output_format>`
} as const;

function buildRequestedLettersSection(letters: PsLetterRecord[]): string {
  const payload = letters.map((letter) => ({
    letter_id: letter.letter_id,
    source_pages: formatPageRange(letter.source_pages)
  }));

  return `<requested_letters>
${JSON.stringify(payload, null, 2)}
</requested_letters>`;
}

export function buildPsGenerateRepliesPrompt(letters: PsLetterRecord[]): string {
  return [
    GENERATE_SECTIONS.role,
    GENERATE_SECTIONS.task,
    buildRequestedLettersSection(letters),
    GENERATE_SECTIONS.fieldSpecifications,
    GENERATE_SECTIONS.examples,
    GENERATE_SECTIONS.edgeCases,
    GENERATE_SECTIONS.validationChecklist,
    GENERATE_SECTIONS.outputFormat
  ].join('\n\n');
}
