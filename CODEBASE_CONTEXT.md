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
  - Typed wrappers for `/api/analyze-pdf`, `/api/generate-reply`, `/api/clear-pdf`.
  - Centralized client-side response/error parsing.

### Server / AI Layer

- `app/api/analyze-pdf/route.ts`
  - Accepts PDF, stores temporary PDF session, asks Gemini for boundaries.

- `app/api/generate-reply/route.ts`
  - Uses existing PDF session + one letter payload.
  - Asks Gemini for `full_name`, `location`, `inquiry`, `prayer_sentence`.

- `app/api/clear-pdf/route.ts`
  - Best-effort cleanup of temporary PDF session.

### Domain/Utility Layer

- `lib/gemini.ts` — Gemini call implementation.
- `lib/prompts.ts` — boundary + reply prompt builders.
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

### Generation mode

- `Generate Replies` still runs for **all letters sequentially**.
- During generation, selection auto-focuses the current letter.

### Print mode

- Prints all letters.
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

---

## Operational Notes

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
- No automated tests yet.
- Lint script currently triggers interactive Next lint migration prompt.

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

The app is currently in a stable, extensible state aligned with these changes.
