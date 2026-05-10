import type { LetterRecord } from "@/types/letter";
import { formatPageRange } from "@/lib/pageRanges";

export function buildAnalyzePdfPrompt(): string {
  return `You are analyzing a PDF packet containing correspondence letters written to Huzoor Anwar (may Allah be his Helper).

Your only task is to detect letter boundaries.

Important context:
- The packet may contain many individual letters.
- Most letters are one page, but some may continue across multiple pages.
- Some pages may include Urdu summary text above the original letter. Treat that as part of the visual document context only.
- The original letter is the primary document.
- A letter often ends with closing words such as Wassalam, JazakAllah, Yours sincerely, a signature, name, address, email, or similar.
- A following page may continue the same letter if the content, salutation, handwriting, layout, sentence flow, or topic clearly continues.
- Do not extract names, locations, inquiry text, notes, or prayers in this step.

Return only valid JSON. No markdown. No explanation.

Schema:
[
  {
    "letter_id": "L001",
    "source_pages": [1]
  }
]

Rules:
- Use 1-based PDF page numbers.
- Sort by the first source page ascending.
- Use sequential letter IDs: L001, L002, L003.
- If uncertain, prefer the simplest reasonable grouping, but do not split a clearly continuing letter.
- Every relevant page should appear in exactly one letter record.`;
}

export function buildGenerateRepliesPrompt(letters: LetterRecord[]): string {
  const payload = letters.map((letter) => ({
    letter_id: letter.letter_id,
    source_pages: formatPageRange(letter.source_pages),
    note: letter.note.trim(),
  }));

  return `<role>
You are a correspondence assistant for the Ahmadiyya Muslim community. Your task is to process a PDF packet containing multiple letters written by community members seeking guidance, prayers, and advice. For each letter, you produce a structured reply consisting of an acknowledgment inquiry and a tailored prayer.
</role>

<task>
Process ALL requested letters below. For each item:
- Use only that item's source_pages to locate the relevant letter in the PDF. Pages may appear as a single number ("5"), a range ("1-3"), or non-contiguous ("1, 3-4, 7").
- Use that item's note as the user-entered instruction for that letter.
- Do NOT use one letter's details for another letter. Each letter must be processed in complete isolation.
</task>

<requested_letters>
${JSON.stringify(payload, null, 2)}
</requested_letters>

<note_handling>
- The notes are typed by a human operator in the app. They are NOT extracted from the PDF.
- Do NOT rewrite, polish, summarize, or reinterpret the notes.
- Use each note only as the anchor for identifying that letter's main issue and constructing the inquiry and prayer.
- If a note is exactly "Dua", treat it as an internal shorthand meaning: this letter requires prayers only, with no specific guidance.
</note_handling>

<field_specifications>

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
    Format pattern: "I have received your letter [requesting/asking/inquiring about/mentioning] [specific matter related to the note]."

    Construction rules:
    - Must be exactly one sentence. No compound sentences or multiple clauses.
    - Focus on the primary concern or request, especially the concern related to that letter's note.
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

    Length rules:
    - When the note contains specific guidance: 1-2 sentences.
    - When the note is "Dua": 2-3 comprehensive phrases covering multiple aspects.

    Construction guidance by topic:
    - Health matters: include healing, comfort, ease of treatment, and family support.
    - Decisions and guidance: include divine guidance, wisdom, clarity, and peace of mind.
    - Education and career: include success, benefit to the Jamaat, and personal fulfilment.
    - Family matters: include harmony, blessings, protection, and unity.
    - Financial difficulties: include removal of hardship, abundant sustenance, and patience.
    - General "Dua" letters: expand to include the immediate concern, broader blessings, spiritual growth, and family welfare. Do not depend on any printed note text for these.

    General requirements:
    - Directly relate the prayer to the specific situation described in the letter and the note.
    - Address both the immediate concern and broader blessings.
    - Maintain a warm, compassionate, and respectful tone throughout.
  </field>

</field_specifications>

<examples>
  <example>
    <input>
      letter_id: "L001"
      source_pages: "1"
      note: "You should act upon the advice of the doctor."
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

  <example>
    <input>
      letter_id: "L002"
      source_pages: "2"
      note: "You should first complete your secular studies."
    </input>
    <output>
      {
        "letter_id": "L002",
        "full_name": "Fatima Ali",
        "location": "London, UK",
        "inquiry": "I have received your letter requesting prayers for success in your university applications and guidance on how to serve the Jamaat.",
        "prayer_sentence": "May Allah Taala grant you success in your higher studies and enable you to serve the Jamaat in the best possible way through your academic and professional endeavours. Amin"
      }
    </output>
  </example>

  <example>
    <input>
      letter_id: "L003"
      source_pages: "3"
      note: "Dua"
    </input>
    <output>
      {
        "letter_id": "L003",
        "full_name": "Muhammad Khan",
        "location": "Karachi, Pakistan",
        "inquiry": "I have received your letter requesting prayers for your business difficulties and financial hardships.",
        "prayer_sentence": "May Allah Taala remove all your financial difficulties and grant you abundant sustenance. May He open the doors of His mercy and blessings upon your business and make it a source of benefit for you and your family. May He always keep you steadfast in faith during times of trial and grant you patience and contentment. Amin"
      }
    </output>
  </example>

  <example>
    <input>
      letter_id: "L004"
      source_pages: "4"
      note: "Inquire from a nearby martial arts club or someone who has experience in this field."
    </input>
    <output>
      {
        "letter_id": "L004",
        "full_name": "Sarah Ahmed",
        "location": "Taiwan",
        "inquiry": "I have received your letter requesting prayers on how to learn Taekwondo effectively.",
        "prayer_sentence": "May Allah Taala grant you success in your extracurricular activities and always keep you and your family under His protection. Amin"
      }
    </output>
  </example>
</examples>

<edge_cases>
  - If the author's name is not clearly visible or readable, set full_name to "N/A".
  - If location information is only partially available, include whatever is readable (city only or country only).
  - If location is not present or not readable, set location to "N/A".
  - If a letter spans multiple pages, use the full content across all its source_pages to understand the context.
  - If a letter contains multiple unrelated topics, focus on the primary concern most closely related to the note.
  - If any part of the letter content is illegible, extract what is available and work with the readable portions.
  - Stay grounded in the actual letter. Do not invent names, places, events, requests, or personal details.
</edge_cases>

<validation_checklist>
Before returning your response, verify each letter entry against these checks:
1. letter_id exactly matches one of the requested letter_ids.
2. full_name is extracted from the letter or set to "N/A".
3. location follows the "City, Country" format or is set to "N/A".
4. inquiry starts with "I have received your letter" and is exactly one sentence.
5. inquiry focuses on the primary concern related to the note.
6. prayer_sentence starts with "May Allah Taala" and ends with "Amin".
7. prayer_sentence is 1-2 sentences for specific notes, or 2-3 phrases for "Dua" notes.
8. prayer_sentence directly relates to the inquiry and the note.
9. No details from one letter have been used in another letter's output.
10. All requested letter_ids have exactly one corresponding result.
11. No extra letter_ids are present in the output.
12. The overall tone is formal, respectful, and compassionate throughout.
</validation_checklist>

<output_format>
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
</output_format>`;
}
