import type { LetterRecord } from '@/types/letter';
import { formatPageRange } from '@/lib/pageRanges';

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

export function buildGenerateReplyPrompt(letter: LetterRecord): string {
  const note = letter.note.trim();
  const isDua = note.toLowerCase() === 'dua';

  return `You are processing one correspondence letter from a larger PDF packet.

Process ONLY this letter:
- letter_id: ${letter.letter_id}
- source_pages: ${formatPageRange(letter.source_pages)}

The user-entered note for this letter is:
${JSON.stringify(note)}

Critical rules:
- The note is typed by the user in the app. Do NOT extract any handwritten note from the PDF.
- Do NOT rewrite, polish, summarize, or reinterpret the note.
- Use the note only as the anchor for identifying the main issue and constructing the inquiry/prayer.
- If the note is exactly "Dua", treat it as an internal shorthand for prayers only.
- The PDF may contain Urdu summary text. You may use it as supporting context, but do not output Urdu.
- Stay grounded in the actual letter. Do not invent names, places, events, requests, or personal details.
- If the full name or location is not readable or not present, use "N/A".

Fields to produce:
1. full_name
   - Full name of the letter writer.
   - Prefer signature, header, or clear author information.
   - Do not include titles unless clearly part of the name.

2. location
   - City/town/village + country only.
   - Examples: "London, UK", "Toronto, Canada", "Chester Springs, USA", "Gambia".
   - Do not include street, postcode, email, or full address.
   - If only country is available, output only the country.
   - If not readable or not present, output "N/A".

3. inquiry
   - Must be one sentence only.
   - Must start exactly with: "I have received your letter"
   - Must focus on the primary concern/request, especially the concern related to the user note.
   - Use formal, concise, respectful wording.
   - Avoid vague wording like "various matters".
   - Avoid unnecessary background details.

4. prayer_sentence
   - Must start exactly with: "May Allah Taala"
   - Must end with: "Amin"
   - Formal, respectful, warm, compassionate.
   - Directly relate to the inquiry and the note.
   - If the note is specific, usually 1–2 sentences.
   - If the note is "Dua", use a fuller prayer with 2–3 comprehensive phrases/sentences.

${isDua ? 'Since note="Dua", generate a broader prayer and do not include or depend on any printed note text.' : 'Since the note is specific, keep the prayer focused and complementary to the exact note text.'}

Return only valid JSON. No markdown. No explanation.

Schema:
{
  "full_name": "string",
  "location": "string",
  "inquiry": "I have received your letter ...",
  "prayer_sentence": "May Allah Taala ... Amin"
}`;
}
