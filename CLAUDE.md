# CLAUDE.md

Guidance for Claude Code when working in this repository. For the full architecture
narrative, see `CODEBASE_CONTEXT.md`; for user-facing usage, see `README.md`.

## What this is

Local, single-session Next.js 15 / React 19 app that turns a scanned PDF packet of letters
into one printable A4 reply per letter, using the Gemini REST API (plain `fetch`, no SDK).
No database, no auth, no persistence — all state is session-local. Runtime dependencies are
`next`, `react`, `react-dom`, and `undici` (for scoped long-running Gemini transport settings).

## Four parallel workflows

| Route | Purpose | Notes |
|-------|---------|-------|
| `/`   | Standard workflow | Operator types a **note** per letter; the note anchors generation. |
| `/ps` | Note-free clone | **No note field.** Replies are generated purely from letter content. |
| `/dua-urdu` | Urdu reply workflow | Note-free Urdu generation and dedicated Urdu print view. |
| `/ps-urdu` | PS Urdu workflow | Dua Urdu duplicate with isolated prompt and print replacement seams. |

The three note-free workflows share the editor, workflow hook, and server handlers.
Each route keeps its own generation prompt, reply validator, and print view.

## The pipeline

Upload → **Detect PDF** (route-specific analyze API; Gemini returns letter boundaries; PDF cached
in an in-memory `pdfSession`, 2h TTL) → [enter notes — `/` only] → **Generate Replies**
(route-specific generate API; one bulk Gemini call reusing the cached PDF) → review/edit → print.

## Key seams

- `hooks/useLetterWorkflow.ts` / `hooks/usePsLetterWorkflow.ts` — client state machines
  (upload/analyze/generate/reset, abort + busy guards, object-URL & session cleanup).
- `lib/apiClient.ts` / `lib/ps/apiClient.ts` — the only client↔server boundary.
- `lib/prompts.ts` — standard prompts (single template literal).
- `lib/ps/prompts.ts` — **PS prompts, refactored into named section constants** composed at
  build time. Edit one section in isolation; the only dynamic piece is the injected
  `<requested_letters>` payload. **Section bodies are interim placeholders — replace with the
  final PS prompt text when provided; the `build*` functions stay the same.**
- `lib/duaUrdu/prompts.ts` — XML-section Dua Urdu prompt with runtime requested-page injection.
  Compose the stored sections directly: do not wrap tagged `role`/`task` sections again, omit
  `<constraints>`, or include the static `requestedLetters` example in the runtime prompt.
- `lib/psUrdu/prompts.ts` — dedicated PS Urdu prompt with runtime requested-page injection and the
  required two-sentence Huzoor Anwar acknowledgment/post-perusal inquiry style.
- `lib/psUrdu/validators.ts` — PS Urdu-specific normalization. It must not reuse the Dua Urdu
  normalizer because that enforces the incompatible `آپ کا خط ملا` prefix.
- `components/ps-urdu/PsUrduPrintPreview.tsx` and its CSS module — isolated supplied Private
  Secretary Urdu print template. It maps full name, inquiry/prayer paragraphs, location, and an
  editable date, and uses the Jameel, Hasan Hiba (Kufi), and Usman fonts in `public/fonts/`.
- `lib/validators.ts`, `lib/json.ts`, `lib/pageRanges.ts`, `lib/pdfSession.ts`,
  `lib/gemini.ts` — shared Gemini transport using `streamGenerateContent` SSE and a configurable
  long-running Undici dispatcher. `lib/geminiSse.ts` assembles streamed UTF-8 text for the
  existing JSON parsers and validators.
- `model-presets.json` defines the model dropdowns and defaults for both tasks on all routes.
  `lib/modelPresets.ts` validates the file at request time and resolves the submitted
  `modelPreset` ID. The toolbar gets IDs and labels from `/api/model-presets`. The server
  passes the selected preset's optional `generationConfig` through to Gemini.
  The toolbar re-reads `/api/model-presets` on each task-button press and stops before any
  task request if the shown preset was removed. Detect PDF keeps the existing PDF session and
  letters until a new detection succeeds, then clears the old session; never clear it first.
  `/api/model-presets` also returns `legacyEnvVars` (names only) for ignored `GEMINI_*MODEL`
  variables, shown as a toolbar migration notice and logged once on the server.
- Config-driven extension points: `model-presets.json`, `lib/inquiryPhraseButtons.ts`, and
  `lib/printConfig.ts`.

## Add new form (confirmed behavior)

- All four routes provide **Add new** alongside Merge previous, Merge next, and Remove.
- Insert and select a **blank form immediately after the current form**, never automatically
  at the end. Preserve existing content and resequence positional letter IDs.
- The added letter always exists in the uploaded PDF; standalone letters without a PDF are
  outside this feature's scope. Leave source pages blank for the operator to enter explicitly.
- Preserve each route's fields, phrase/name buttons, language/direction, generation, and print
  behavior. Standard includes a blank required note; the three note-free routes omit notes.
- `addLetterAfter` lives in `lib/letterListOperations.ts` and
  `lib/noteFree/letterListOperations.ts`; `lib/ps/letterListOperations.ts` re-exports the latter.
  The standard and shared note-free form cards/lists wire the button and selection update.
- Disable Add new while busy. Both workflow hooks block all generation engines until every
  form has source pages; Standard still requires notes. New forms join the existing bulk request.
- Verification on 2026-10-17: 64 tests passed; production build, TypeScript, and lint passed.
  Local production-browser checks passed for all four routes: insertion, blank fields,
  validation, request payloads, busy state, reply mapping, printing, merge/remove, and reset.
  AI responses were simulated; live Gemini was not exercised in this verification.

## Conventions / gotchas

- `letter_id` is **positional** — `letterListOperations` auto-resequences to `L001…` after any
  add/merge/remove/edit. Don't treat it as stable.
- `/` requires a non-empty note before generation (guarded client- and server-side); `/ps` has
  no such gate.
- Print differs by route. `/` uses a `/print` route + `localStorage` hand-off
  (`lib/printPreviewSession.ts`, `components/PrintPreview*`). `/ps` uses a self-contained
  letterhead template in `lib/ps/printDocument.ts` (`openPsPrintPreview`) that opens a popup
  and `document.write`s its own full HTML/CSS document — there is no `/ps/print` route. The PS
  template needs assets in `public/`: `/fonts/Adobe Naskh Medium.ttf` (Kufi) and
  `/img/SignPS_English.png` (signature); `/fonts/_Khat_Manzoor.ttf` already exists. The popup
  pins `<base href="${origin}/">` so root-relative asset URLs always resolve.
- `next.config.ts` outputs dev to the **sibling** dir `.next-dev` and build to `.next` (both
  gitignored + eslint-ignored). They no longer nest, so `npm run build` can't wipe a running dev
  server. `next-env.d.ts` references `.next-dev/types` in dev and `.next/types` after a build;
  it auto-regenerates and the flip is cosmetic.
- Use Node 20 LTS (`engines: >=20 <23`); avoid Node 24 (chunk runtime mismatches).

## Verification (run before declaring done)

```bash
npm run lint        # eslint .
npm run typecheck   # tsc --noEmit
npm test            # tsc -p tsconfig.test.json + node --test
npm run build       # next build
```

Tests are pure-logic only (`tests/*.test.ts`): page ranges, letter list ops (standard + PS),
print note rules, phrase insertion. Add focused logic tests alongside these; don't add UI/E2E
harness.

## Environment

```text
GEMINI_API_KEY=...
GEMINI_REQUEST_TIMEOUT_MS=1200000
DEBUG_GEMINI_REQUESTS=false
```

Both task defaults and all selectable Gemini models are configured in `model-presets.json`.
`GEMINI_REQUEST_TIMEOUT_MS` is optional and defaults to a 20-minute response-header/chunk
inactivity timeout. Browser aborts still cancel the upstream Gemini request immediately.
`DEBUG_GEMINI_REQUESTS=true` logs full request bodies (incl. base64 PDF) and the constructed
generate prompt — large and sensitive; keep off by default.
