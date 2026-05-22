# Huzoor Letters App

A local, browser-based Next.js app for processing PDF packets of correspondence letters with Gemini.

## What it does

1. Upload one PDF packet.
2. Preview the PDF on the left.
3. Click **Detect PDF** to detect individual letters and source pages.
4. Enter one note per letter.
5. Click **Generate Replies** to process all letters in one Gemini request, using the already-uploaded temporary PDF session.
6. Review and edit every field. In the letter form, generated/editable text is ordered as Inquiry, Note, then Prayer sentence.
7. Click **Print / PDF** to create one A4 reply page per letter and save through Chrome's print dialog.

## Privacy model

- No database.
- No login.
- No permanent PDF storage.
- Uploaded PDFs are held in a temporary in-memory server session after analysis so generation can reuse the PDF without another browser upload.
- The temporary PDF session is cleared on reset/file change and also expires automatically.
- Extracted records exist only in the current browser session.
- PDFs are sent to Gemini during processing because Gemini must read the document.

## Setup

```bash
npm install
cp .env.example .env.local
# edit .env.local and add your Gemini API key
npm run dev
```

Open:

```text
http://localhost:3000
```

## Font note

The print template references:

```text
/public/fonts/_Khat_Manzoor.ttf
```

The font file is not included. If you have the font, place it at that path. The app falls back to Arial if the font is absent.

## Environment variables

```text
GEMINI_API_KEY=...
GEMINI_DETECT_PDF_MODEL=gemini-2.5-flash
GEMINI_GENERATE_REPLIES_MODEL=gemini-2.5-flash
DEBUG_GEMINI_REQUESTS=false
```

`GEMINI_MODEL` is still supported as a fallback if either workflow-specific model is not set.

Model selection is intentionally route-specific:

- Detect PDF uses `GEMINI_DETECT_PDF_MODEL`.
- Generate Replies uses `GEMINI_GENERATE_REPLIES_MODEL`.
- If one of those is missing, the code falls back to `GEMINI_MODEL`, then to the built-in default.

## Gemini request details

- PDF detection and reply generation both send the PDF as inline base64 data to Gemini.
- Generate Replies builds its prompt in `buildGenerateRepliesPrompt` using each letter's `letter_id`, formatted `source_pages`, and user-entered `note`.
- The Generate Replies prompt is structured with XML-style sections such as role, task, requested letters, note handling, field specifications, examples, edge cases, validation checklist, and output format.
- `source_pages` is formatted by `formatPageRange` as strings like `5`, `1-3`, or `1, 3-4, 7`.
- Gemini request and prompt logging is off by default. Set `DEBUG_GEMINI_REQUESTS=true` to log the constructed request body and Generate Replies prompt while debugging.
- When enabled, Gemini request logging includes the full PDF base64 and can be very large.

## Important v1 limitations

- Letter boundary detection is AI-assisted and can be corrected manually.
- No automatic learning from corrections.
- No source highlighting.
- No OCR review panel.
- No database persistence.

## Architecture (for maintainability)

- `hooks/useLetterWorkflow.ts`
  - Central client workflow state machine (upload/analyze/generate/reset/print mode).
  - This is the main extension point for new UI behavior.
- `lib/apiClient.ts`
  - Typed client-side API functions for `/api/*` calls.
  - Add or adjust request/response logic here first.
- `lib/gemini.ts`
  - Shared Gemini request helper.
  - Accepts the selected model explicitly from each route.
- `lib/aiModelConfig.ts`
  - Master AI model config for Detect PDF and Generate Replies.
  - Exposes `getDetectPdfModel()` and `getGenerateRepliesModel()` with environment variable overrides.
- `lib/letterProcessors.ts`
  - Per-letter plugin pipeline for generation with `beforeGenerate` and `afterGenerate` hooks.
  - Use this for feature additions that need letter-level transformations or policies.
- `lib/toolbarConfig.ts`
  - Declarative toolbar action list (labels/order/variants).
  - To add a new button, define it here and wire behavior in `app/page.tsx`.
- `lib/inquiryPhraseButtons.ts`
  - Declarative list of small buttons that insert preset text into the Inquiry textarea.
  - Add or amend Inquiry phrase buttons here; `LetterFormCard.tsx` renders the list automatically.
- `app/page.tsx`
  - Thin composition layer that binds the workflow hook to presentational components.
- `components/*`
  - UI-only components with minimal business logic.
- `types/*`
  - Shared contracts for letters, API payloads, and toolbar action types.

### Letter Processor Plugin Pattern

`useLetterWorkflow` supports processor plugins via `lib/letterProcessors.ts`.

- `beforeGenerate(letter, context)`
  - Runs before API call per letter.
  - Use for preflight normalization or policy checks.
- `afterGenerate(generatedLetter, context)`
  - Runs after Gemini reply is merged.
  - Use for post-processing and guardrails.

Default behavior uses `DEFAULT_LETTER_PROCESSORS`, currently including manual note preservation.

Example custom processors are in `lib/letterProcessorExamples.ts`.

To extend behavior, pass custom processors to `useLetterWorkflow` in `app/page.tsx`, for example:

```ts
useLetterWorkflow({
  processors: [...DEFAULT_LETTER_PROCESSORS, trimNoteForRequestProcessor]
});
```

## Installation note

This package includes a public-registry `package-lock.json` and `.npmrc`. If `npm install` appears to hang, stop it with `Ctrl+C`, then run:

```bash
rm -rf node_modules
npm cache verify
npm install --registry=https://registry.npmjs.org/ --verbose
```

Use Node 20 LTS if possible. Node 18.18+ is required by Next.js 15.
Avoid Node 24 for this app; it can cause `.next/server` chunk runtime mismatches in local dev.
