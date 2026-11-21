# Huzoor Letters App

A local, browser-based Next.js app for processing PDF packets of correspondence letters with Gemini.

The app provides four workflows: Standard (`/`), Private Secretary (`/ps`), Dua Urdu
(`/dua-urdu`), and PS Urdu (`/ps-urdu`).

## What it does

1. Upload one PDF packet.
2. Preview the PDF on the left.
3. Choose a detection model, then click **Detect PDF** to detect individual letters and source pages.
4. In Standard, enter one note per letter.
5. Choose a reply model, then click **Generate Replies** to process all letters in one Gemini request, using the already-uploaded temporary PDF session.
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
GEMINI_REQUEST_TIMEOUT_MS=1200000
DEBUG_GEMINI_REQUESTS=false
```

`GEMINI_REQUEST_TIMEOUT_MS` is optional and defaults to 20 minutes of inactivity while waiting
for Gemini response headers or streamed output.

## Dua Urdu workflow

- Uses the same note-free upload, boundary review, bulk generation, and editing flow as PS.
- Only Full Name, Location, Inquiry, and Prayer sentence are localized, RTL, and rendered in
  Google Amiri; the rest of the application remains English and LTR.
- Its Generate Replies prompt is isolated in `lib/duaUrdu/prompts.ts` so its detailed Urdu
  correspondence rules and examples can evolve without changing the workflow or API contract.
- Its `/dua-urdu/print` view uses the dedicated Urdu A4 correspondence template, with an editable
  display date and an isolated print stylesheet.

## PS Urdu workflow

- `/ps-urdu` is a functional duplicate of Dua Urdu with independent API routes,
  prompt seam, print-preview session, and print component/styles.
- Its dedicated `lib/psUrdu/prompts.ts` implements the PS Urdu two-sentence inquiry style:
  acknowledgment to Huzoor Anwar followed by the fixed post-perusal prayer sentence.
- Its `/ps-urdu/print` view uses the supplied Private Secretary Urdu letterhead, isolated under
  `components/ps-urdu/`. It uses the Jameel, Hasan Hiba (Kufi), and Usman font files in
  `public/fonts/`.
## Choose and configure models

Each workflow has a model dropdown next to **Detect PDF** and **Generate Replies**. Choose a
preset, then press the task button to run it. The defaults are **Gemini 2.5 Flash** for detection
and **Argon 4 Medium** for replies.

Edit [model-presets.json](model-presets.json) in the project root to change the options on all
four routes. Use the `detectPdf` section for detection and `generateReplies` for replies.

- **Add a preset** by copying an object in `presets` and editing its fields.
- **Change a preset** by editing its `label`, `model`, or `generationConfig`. Give each preset
  a unique `id` within its task. Multiple presets can use the same model with different settings.
- **Change the default** by setting `defaultPreset` to the desired preset's `id`.
- **Remove a preset** by deleting its object. If it was the default, choose another default.
  Keep at least one preset in each task.

For example, this is a complete preset entry for the `generateReplies.presets` list.

```json
{
  "id": "argon-medium",
  "label": "Argon 4 Medium",
  "model": "gemini-4-argon",
  "generationConfig": {
    "mediaResolution": "MEDIA_RESOLUTION_HIGH",
    "thinkingConfig": { "thinkingLevel": "medium" }
  }
}
```

`generationConfig` is optional and passed through to Gemini as written. Use fields and values
supported by that model. Save the file and refresh the workflow page to see the new options.
The running server reads the file at request time, so edits require no restart or rebuild.
Refresh before uploading a packet, since reloading the page clears the editor state. If the file
changes while a page is open, pressing a task button re-reads the list first. When the selected
preset was removed, the button stops before uploading anything and asks you to choose again.
A failed Detect PDF keeps the current letters and uploaded PDF, so you can still generate replies.

### Migrating model settings from `.env.local`

The app no longer reads `GEMINI_*MODEL` variables. While any are still set, the toolbar and the
server console name them (never their values). Move each one into `model-presets.json`, then
delete it from `.env.local`. Keep your API key and any timeout or debug settings in `.env.local`.

| Old variable | Where it goes now |
|---|---|
| `GEMINI_DETECT_PDF_MODEL`, `GEMINI_PS_DETECT_PDF_MODEL`, `GEMINI_DUA_URDU_DETECT_PDF_MODEL`, `GEMINI_PS_URDU_DETECT_PDF_MODEL` | A preset in `detectPdf.presets`. Set `detectPdf.defaultPreset` to use it by default. |
| `GEMINI_GENERATE_REPLIES_MODEL`, `GEMINI_PS_GENERATE_REPLIES_MODEL`, `GEMINI_DUA_URDU_GENERATE_REPLIES_MODEL`, `GEMINI_PS_URDU_GENERATE_REPLIES_MODEL` | A preset in `generateReplies.presets`. Set `generateReplies.defaultPreset` to use it by default. |
| `GEMINI_ARGON_MODEL` | The `model` field of the `argon-medium` and `argon-high` presets. |
| `GEMINI_MODEL` | The `model` field of whichever presets should use it. |

Defaults now apply to all four routes. A route can no longer have its own default model, so
choose a different model from the dropdown on that route when needed.

## Gemini request details

- PDF detection and reply generation both send the PDF as inline base64 data to Gemini.
- Gemini responses use the SSE `streamGenerateContent` endpoint internally, then are assembled
  into one complete response before validation and return to the browser. This supports slower
  Gemini Pro requests without changing the UI workflow.
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
- `model-presets.json` and `lib/modelPresets.ts`
  - Shared preset configuration, validation, and task-specific model lookup.
- `lib/letterProcessors.ts`
  - Per-letter plugin pipeline for generation with `beforeGenerate` and `afterGenerate` hooks.
  - Use this for feature additions that need letter-level transformations or policies.
- `components/Toolbar.tsx`
  - Shared task buttons and model selectors.
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
