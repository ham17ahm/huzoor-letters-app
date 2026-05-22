# Huzoor Letters App — Codebase Context

## Purpose

Local Next.js app to process a scanned PDF packet of letters:
1. Detect letter boundaries with Gemini.
2. Let user review/edit each letter form.
3. Generate inquiry + prayer reply fields for all letters.
4. Print one A4 response page per letter.

No DB/auth/persistence. Data is session-local.

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
- `lib/gemini.ts` — Gemini call implementation.
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

## Extension Points

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
```

`GEMINI_MODEL` remains supported as a fallback if a workflow-specific variable is missing. If neither is set, `lib/aiModelConfig.ts` falls back to the built-in default model.

### Gemini debug logging

Gemini request logging is gated by `DEBUG_GEMINI_REQUESTS=true`.

When enabled, `lib/gemini.ts` logs the full `generateContent` request body before calling Gemini. This includes the full base64 PDF and prompt, so logs can be large and may contain sensitive document data. `app/api/generate-replies/route.ts` also logs the final constructed Generate Replies prompt text.

### Dev/build artifact isolation (critical)

To avoid runtime chunk mismatch issues, `next.config.ts` separates output:
- Dev server output: `.next/dev`
- Build/start output: `.next`

This prevents collisions when `next dev` and `next build` are run at different times.

### If dev runtime breaks with chunk/module errors

Run:

```bash
pkill -f "next dev" || true
pkill -f "next start" || true
rm -rf .next
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

The app is currently in a stable, extensible state aligned with these changes.
