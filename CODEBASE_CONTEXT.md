# Huzoor Letters App — Codebase Context

## Purpose

Local Next.js app to process a scanned PDF packet of letters:
1. Detect letter boundaries with Gemini.
2. Let user review/edit each letter form.
3. Generate inquiry + prayer reply fields for all letters.
4. Print one A4 response page per letter.

No DB/auth/persistence. Data is session-local.

There are four parallel workflows:
- `/` — the standard workflow (operator types a per-letter **note** that anchors generation).
- `/ps` — a note-free clone (no note field; replies are generated purely from letter content).
  See "PS Route" below.
- `/dua-urdu` — a note-free Urdu workflow sharing the PS-style workflow core while keeping its
  prompt, validation, model configuration, RTL field presentation, and print view isolated.
- `/ps-urdu` — a duplicate of Dua Urdu with independent route/API paths, model selectors, prompt
  seam, print session, and print component/styles. Its supplied Private Secretary Urdu print
  design and dedicated PS Urdu generation prompt are implemented.

---

## Tech Stack

- Next.js 15 (App Router)
- React 19 + TypeScript
- Server routes under `app/api/*`
- Gemini API via server-side `fetch`

---

## High-Level Architecture

### UI Composition

- `app/page.tsx`
  - Thin composition layer.
  - Binds workflow hook state/actions to UI components.
- `app/print/page.tsx`
  - Dedicated print-preview entry route opened in a new tab.

- `components/*`
  - Presentational/editor components:
    - `Toolbar.tsx`
    - `PdfViewer.tsx`, `PdfUploader.tsx`
    - `LetterFormList.tsx` (single-letter workspace mode)
    - `LetterFormCard.tsx`
    - `LetterSidebar.tsx`
    - `LetterPagination.tsx`
    - `PrintPreview.tsx`

### Client Workflow / Orchestration

- `hooks/useLetterWorkflow.ts`
  - Central state machine for upload/analyze/generate/reset/print.
  - Holds selection state (`selectedIndex`) for one-letter-at-a-time editing.
  - Handles progress state during bulk generation.

### Client API Boundary

- `lib/apiClient.ts`
  - Typed wrappers for `/api/analyze-pdf`, `/api/generate-replies`, `/api/clear-pdf`.
  - Centralized client-side response/error parsing.

### Server / AI Layer

- `app/api/analyze-pdf/route.ts`
  - Accepts PDF, stores temporary PDF session, asks Gemini for boundaries.
  - Uses `getDetectPdfModel()` so PDF detection can run on its own Gemini model.

- `app/api/generate-replies/route.ts`
  - Uses existing PDF session + all letter payloads.
  - Makes one Gemini call for all requested letters.
  - Returns reply records keyed by `letter_id`.
  - Uses `getGenerateRepliesModel()` so reply generation can run on its own Gemini model.
  - Can log the final constructed prompt text when `DEBUG_GEMINI_REQUESTS=true`.

- `app/api/clear-pdf/route.ts`
  - Best-effort cleanup of temporary PDF session.

### Domain/Utility Layer

- `lib/aiModelConfig.ts` — master AI model config and workflow-specific model selectors.
- `lib/gemini.ts` — Gemini call implementation. Uses `streamGenerateContent` over SSE with a
  route-scoped Undici dispatcher so long-running Gemini Pro PDF requests are not cut off by
  Node's default five-minute header/body inactivity timeout.
- `lib/geminiSse.ts` — incrementally decodes UTF-8 SSE chunks and assembles Gemini text deltas
  into the same complete text response expected by the existing JSON parsers and validators.
- `lib/prompts.ts` — boundary + reply prompt builders.
  - Generate Replies prompt uses XML-style sections for role, task, requested letters, note handling, field specifications, examples, edge cases, validation checklist, and output format.
- `lib/validators.ts` — normalization of Gemini output.
- `lib/json.ts` — robust JSON extraction from model text.
- `lib/pageRanges.ts` — parse/format page ranges.
- `lib/pdfSession.ts` — in-memory PDF session cache (2-hour TTL).
- `types/*` — shared app contracts.

---

## Current UX Model (Important)

### Letter editing mode

- **Single selected letter form shown at a time**.
- Left sidebar lists all detected letters with:
  - letter id
  - page range
  - note status
- Prev/Next pagination available.
- Jump-to-letter by sidebar click.
- Main editable text fields are ordered as:
  - Inquiry
  - Note and Prayer sentence side by side, each occupying one half of the form grid
- Textarea default height is controlled globally in `app/globals.css` by the base `textarea` rule. It is currently `min-height: 120px`.
- Inquiry phrase buttons are rendered from `lib/inquiryPhraseButtons.ts` and displayed in a 2-column grid so six buttons fit as three rows.

### Generation mode

- `Generate Replies` runs for **all letters in one bulk Gemini request**.
- The request includes the full PDF plus each letter's `letter_id`, `source_pages`, and user note.
- `source_pages` is converted from `number[]` into a compact string with `formatPageRange`, for example:
  - `5`
  - `1-3`
  - `1, 3-4, 7`
- The Generate Replies prompt is built by `buildGenerateRepliesPrompt(letters)` and includes examples, edge cases, and a validation checklist to keep output consistent.
- The response is merged back into forms by `letter_id`.

### Print mode

- Clicking `Print / PDF` opens `/print` in a **new tab**.
- Prints all letters from that tab.
- Print template now uses Times (`Times New Roman`) instead of Arial fallback.

---

## PS Route (`/ps`)

A fully isolated, note-free clone of the app. Same four-stage pipeline (upload → Detect PDF →
Generate Replies → review → print), with two amendments:

1. **No note field** — removed from the form, sidebar, generation gating, request payload,
   prompt, and print template. Generation is allowed as soon as letters are detected.
2. **Different prompts** — `lib/ps/prompts.ts` refactors the prompt into named, independently
   editable section constants composed at build time (vs. the standard monolithic template
   literal). The only dynamic piece is the injected `<requested_letters>` payload. The section
   bodies now hold the real PS prompt text (e.g. the two-sentence "Huzoor Anwar …" inquiry);
   the `buildPs*` functions do not change when the text is edited.

### Isolation model

- **Reused untouched (shared, safe):** `lib/gemini.ts`, `lib/json.ts`, `lib/pageRanges.ts`,
  `lib/pdfSession.ts`, `lib/date.ts`, `lib/textInsertion.ts`,
  `lib/inquiryPhraseButtons.ts`, `lib/toolbarConfig.ts`, `lib/printConfig.ts`,
  `components/PdfViewer.tsx`, `components/PdfUploader.tsx`, `components/LetterPagination.tsx`,
  `components/PrintPreview.module.css`, and `app/api/clear-pdf/route.ts`.
- **Partially reused:** `lib/validators.ts` — PS reuses `normalizeBoundaries` (analyze route,
  prompt-agnostic), but reply normalization is forked (see `lib/ps/validators.ts` below)
  because the shared `normalizeReply` hardcodes the standard "I have received your letter"
  inquiry prefix, which would corrupt the PS inquiry.
- **Shared files modified (additive only — `/` unaffected):**
  - `lib/aiModelConfig.ts` — added `getPsDetectPdfModel()` / `getPsGenerateRepliesModel()`
    (`GEMINI_PS_DETECT_PDF_MODEL`, `GEMINI_PS_GENERATE_REPLIES_MODEL`).
  - `components/Toolbar.tsx` (+ `.routeNav` styles in `globals.css`) — the `[Standard] [PS]`
    cross-link nav, active route highlighted via `usePathname`.
- **PS-specific files (the fork):**
  - `app/ps/page.tsx`
  - `app/api/ps/analyze-pdf/route.ts`, `app/api/ps/generate-replies/route.ts`
    (no missing-note check)
  - `hooks/usePsLetterWorkflow.ts` (note gating + `preserve-manual-note` processor removed)
  - `components/ps/PsLetterFormCard.tsx`, `PsLetterFormList.tsx`, `PsLetterSidebar.tsx`
  - `lib/ps/prompts.ts`, `lib/ps/apiClient.ts`, `lib/ps/letterListOperations.ts`
    (note merging removed)
  - `lib/ps/validators.ts` — `normalizePsReply` / `normalizePsBulkReplies`. Enforces the PS
    inquiry prefix ("Huzoor Anwar (may Allah be his Helper) has received your letter") and a
    two-sentence inquiry (no single-sentence collapse), keeps the prayer "May Allah Taala … Amin"
    handling and the `letter_id` structural checks. Used by the PS generate route instead of the
    shared `normalizeBulkReplies`.
  - `lib/ps/printDocument.ts` — PS print uses a **different letterhead** (Private Secretary
    template). `openPsPrintPreview(letters)` opens a popup and `document.write`s a full,
    self-contained HTML/CSS document (no `/ps/print` route, no `localStorage` hand-off). It
    maps `full_name`/`inquiry`/`prayer_sentence`/`location` and needs `public/` assets:
    `/fonts/Adobe Naskh Medium.ttf` (Kufi) and `/img/SignPS_English.png` (signature).
  - `types/ps.ts` (`PsLetterRecord = Omit<LetterRecord, 'note'>` + response types)
  - `tests/psLetterListOperations.test.ts`, `tests/psValidators.test.ts`

`PsLetterRecord` reuses the already note-free reply types (`GenerateReplyResult` /
`BulkGenerateReplyResult`), and PS reuses the same in-memory `pdfSession` store and the shared
`/api/clear-pdf` cleanup (sessions are UUID-keyed, so this is safe).

---

## Extension Points

### Dua Urdu route

- `/dua-urdu` shares generic note-free workflow, editor, and list-operation infrastructure with
  `/ps`; Standard remains independent because it requires notes and processors.
- The four reply fields use Urdu labels, `lang="ur"`, RTL direction, and Google Amiri. All other
  controls remain English and LTR.
- `lib/duaUrdu/prompts.ts` contains the route-specific Urdu generation rules and examples.
- `/dua-urdu/print` uses the dedicated Urdu A4 correspondence template and route-specific CSS.
- Dua Urdu has independent `GEMINI_DUA_URDU_*` model environment variables.

### PS Urdu route

- `/ps-urdu` and `/api/ps-urdu/*` reuse the generic note-free workflow and Dua Urdu editor/
  validation behavior.
- `lib/psUrdu/prompts.ts` contains the dedicated PS Urdu generation prompt. It requires inquiry
  to begin with the Huzoor Anwar acknowledgment and end with the fixed "بعد ملاحظہ…" sentence,
  injects requested page ranges at runtime, and contains its own examples, compression rules,
  field rules, constraints, and JSON output contract.
- `lib/psUrdu/validators.ts` recognizes the PS Urdu inquiry prefix independently. Do not route PS
  Urdu through `normalizeDuaUrduReply`, which would prepend the incompatible `آپ کا خط ملا` text.
- `/ps-urdu/print`, `components/ps-urdu/PsUrduPrintPreview.tsx`, and its CSS module form a fully
  separate print path implementing the supplied blue Private Secretary Urdu letterhead. It uses
  `/fonts/Jameel Noori Nastaleeq.ttf`, `/fonts/ArbFONTS-Hasan_Hiba.ttf`, and
  `/fonts/UTHMANTN1B VER09.OTF`.
- `lib/psUrdu/printPreviewSession.ts` uses the isolated
  `huzoor-ps-urdu-print-preview:` local-storage namespace.
- `GEMINI_PS_URDU_*` overrides are independent; when absent, selectors inherit the matching
  `GEMINI_DUA_URDU_*` setting before using the global/default fallback.

### 1) Toolbar config

- `lib/toolbarConfig.ts` + `types/toolbar.ts`
- Add/reorder actions declaratively, then wire handler in `app/page.tsx`.

### 2) Per-letter processor pipeline

- `lib/letterProcessors.ts`
  - `beforeGenerate(letter, context)`
  - `afterGenerate(generatedLetter, context)`
- Default includes `preserve-manual-note`.
- Example processors in `lib/letterProcessorExamples.ts`.
- Hook supports custom injection via:
  - `useLetterWorkflow({ processors: [...] })`

### 3) Inquiry phrase buttons

- `lib/inquiryPhraseButtons.ts`
- Add, remove, rename, or change inserted Inquiry phrases in this single file.
- `LetterFormCard.tsx` maps over `INQUIRY_PHRASE_BUTTONS`, so new entries render automatically.
- Button layout is controlled by `.inquiryPhraseButtons` and `.inquiryPhraseButton` in `app/globals.css`.

### 4) AI model config

- `lib/aiModelConfig.ts`
- Master file for default Gemini models used by:
  - Detect PDF
  - Generate Replies
- Environment variables still override the defaults.

---

## Operational Notes

### Gemini model configuration

Gemini models are configured separately by workflow:

```text
GEMINI_DETECT_PDF_MODEL=gemini-2.5-flash
GEMINI_GENERATE_REPLIES_MODEL=gemini-2.5-flash
GEMINI_PS_DETECT_PDF_MODEL=gemini-2.5-flash
GEMINI_PS_GENERATE_REPLIES_MODEL=gemini-2.5-flash
GEMINI_DUA_URDU_DETECT_PDF_MODEL=gemini-2.5-flash
GEMINI_DUA_URDU_GENERATE_REPLIES_MODEL=gemini-2.5-flash
GEMINI_PS_URDU_DETECT_PDF_MODEL=gemini-2.5-flash
GEMINI_PS_URDU_GENERATE_REPLIES_MODEL=gemini-2.5-flash
GEMINI_REQUEST_TIMEOUT_MS=1200000
```

`GEMINI_MODEL` remains supported as a fallback if a workflow-specific variable is missing. If neither is set, `lib/aiModelConfig.ts` falls back to the built-in default model. The `GEMINI_PS_*` variables configure the `/ps` route independently and use the same fallback chain.

`GEMINI_REQUEST_TIMEOUT_MS` is optional and defaults to 20 minutes. It controls inactivity
while waiting for Gemini response headers or the next streamed response chunk; request aborts
from the browser are still honored immediately. Gemini PDF calls stream internally, but API
routes continue returning one assembled JSON response to the UI after generation completes.

### Gemini debug logging

Gemini request logging is gated by `DEBUG_GEMINI_REQUESTS=true`.

When enabled, `lib/gemini.ts` logs the full `streamGenerateContent` request body before calling Gemini. This includes the full base64 PDF and prompt, so logs can be large and may contain sensitive document data. `app/api/generate-replies/route.ts` also logs the final constructed Generate Replies prompt text.

### Dev/build artifact isolation (critical)

`next.config.ts` separates output into **sibling** directories:
- Dev server output: `.next-dev`
- Build/start output: `.next`

Earlier these were nested (`.next/dev` inside `.next`), which meant `next build` — which
wipes its whole `distDir` (`.next`) — would delete a running dev server's artifacts and break
it with `ENOENT` manifest errors. Using a sibling `.next-dev` prevents that entirely: build and
dev never touch each other's files. Both `.next-dev` and `.next` are gitignored; eslint ignores
both; `next-env.d.ts` references `.next-dev/types` in dev and `.next/types` after a build (it
auto-regenerates — don't hand-maintain it, and the dev/prod flip is cosmetic).

### If dev runtime breaks with chunk/module errors

Run:

```bash
pkill -f "next dev" || true
pkill -f "next start" || true
rm -rf .next-dev
npm run dev
```

---

## Known Constraints

- No database persistence.
- In-memory PDF sessions only (not multi-instance durable).
- Focused pure-logic tests cover page ranges, letter list operations, print note rules, and phrase insertion.
- `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` are the current verification commands.

---

## Where We Are Now

Completed refactors in this phase:
1. Extracted workflow state machine into `useLetterWorkflow`.
2. Added typed API client layer.
3. Made toolbar config-driven.
4. Added plugin-style per-letter processor pipeline.
5. Switched forms UI from stacked list to single-letter workspace with sidebar/pagination.
6. Changed print typography fallback from Arial to Times.
7. Added dev/build artifact isolation in `next.config.ts`.
8. Removed the legacy one-letter generation endpoint; generation is bulk-only through `/api/generate-replies`.
9. Split Gemini model configuration into Detect PDF and Generate Replies env vars.
10. Added server-side Gemini request/prompt logging for debugging, now gated behind `DEBUG_GEMINI_REQUESTS=true`.
11. Reordered the letter form text fields to Inquiry, Note, Prayer sentence.
12. Expanded the Generate Replies prompt into a structured XML-style prompt with examples and validation rules.
13. Added `lib/aiModelConfig.ts` as the master AI model config file for Detect PDF and Generate Replies.
14. Changed Note and Prayer sentence textareas to sit side by side in the existing two-column form grid.
15. Increased the global textarea `min-height` to `120px`.
16. Changed Inquiry phrase buttons to a two-column grid so more buttons can fit without expanding the panel as much.
17. Added an isolated, note-free `/ps` route (clone of the app) with its own pages, API routes, hook, components, prompts (refactored into section constants), print hand-off, and types. Shared pure utilities are reused; only `lib/aiModelConfig.ts` and `components/Toolbar.tsx` were touched additively. A `[Standard] [PS]` cross-link nav was added to the shared header. See "PS Route" above.
18. Replaced the PS print with a distinct Private Secretary letterhead template (`lib/ps/printDocument.ts`, `openPsPrintPreview`) that opens a popup and writes a self-contained HTML/CSS document. Removed the earlier route-based PS print (`app/ps/print/*`, `components/ps/PsPrintPreview.tsx`, `lib/ps/printPreviewSession.ts`). New `public/` assets are required: `/fonts/Adobe Naskh Medium.ttf` and `/img/SignPS_English.png`.
19. Authored the real PS generate prompt (inquiry now a two-sentence "Huzoor Anwar (may Allah be his Helper) has received your letter … Following the perusal …" format) and forked reply normalization into `lib/ps/validators.ts` so the shared `normalizeReply` no longer corrupts the PS inquiry by forcing the standard "I have received your letter" prefix. Added `tests/psValidators.test.ts`.
20. Hardening pass: moved dev output to the sibling `.next-dev` (was nested `.next/dev`) so `next build` can no longer wipe a running dev server — updated `next.config.ts`, `.gitignore`, `eslint.config.mjs`, `tsconfig.json`, `tsconfig.test.json`. Pinned `<base href="${origin}/">` in the PS print popup (`lib/ps/printDocument.ts`) so root-relative font/image URLs always resolve. Verified `.next-dev` survives a build and that the configured Gemini model ids (`gemini-3.1-pro-preview`, `gemini-2.5-flash`) exist via ListModels.
21. Replaced buffered Gemini `generateContent` calls with `streamGenerateContent` SSE assembly and
    added a dedicated Undici dispatcher with a configurable 20-minute inactivity timeout. This
    fixes Dua Urdu bulk generation with `gemini-3.1-pro-preview`, which can take longer than
    Node's default five-minute response timeout for a long Urdu prompt plus inline PDF. Added
    `lib/geminiSse.ts`, `GEMINI_REQUEST_TIMEOUT_MS`, and focused streaming parser tests.
22. Added `/ps-urdu` as a complete Dua Urdu-derived workflow with isolated page/API routes,
    model selectors, prompt module, print-preview session namespace, and print component/styles.
23. Replaced the temporary PS Urdu print copy with the supplied Private Secretary Urdu template,
    including its blue letterhead, addressee/body/footer mapping, editable HM date, print rules,
    and Jameel/Kufi/Usman fonts from `public/fonts/`.
24. Implemented the final dedicated PS Urdu generation prompt with runtime page injection,
    two-sentence Huzoor Anwar inquiry rules, examples, compression guidance, constraints, and JSON
    contract. Forked PS Urdu reply normalization so the Dua Urdu inquiry prefix cannot corrupt it.

The app is currently in a stable, extensible state aligned with these changes.
