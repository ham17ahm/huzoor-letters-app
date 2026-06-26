# CLAUDE.md

Guidance for Claude Code when working in this repository. For the full architecture
narrative, see `CODEBASE_CONTEXT.md`; for user-facing usage, see `README.md`.

## What this is

Local, single-session Next.js 15 / React 19 app that turns a scanned PDF packet of letters
into one printable A4 reply per letter, using the Gemini REST API (plain `fetch`, no SDK).
No database, no auth, no persistence — all state is session-local. Only runtime deps are
`next`, `react`, `react-dom`.

## Two parallel workflows

| Route | Purpose | Notes |
|-------|---------|-------|
| `/`   | Standard workflow | Operator types a **note** per letter; the note anchors generation. |
| `/ps` | Note-free clone | **No note field.** Replies are generated purely from letter content. |

`/ps` is an isolated fork. It **reuses** stable, side-effect-free libs and only forks what
embeds note logic or differs. The two shared files it touches are additive only:
`lib/aiModelConfig.ts` (PS model selectors) and `components/Toolbar.tsx` (the `[Standard] [PS]`
cross-link nav). Keep `/` behavior unchanged when editing PS.

## The pipeline (both routes)

Upload → **Detect PDF** (`/api/[ps/]analyze-pdf`, Gemini returns letter boundaries; PDF cached
in an in-memory `pdfSession`, 2h TTL) → [enter notes — `/` only] → **Generate Replies**
(`/api/[ps/]generate-replies`, one bulk Gemini call reusing the cached PDF) → review/edit →
**Print** (opens `/[ps/]print` in a new tab via a `localStorage` hand-off).

## Key seams

- `hooks/useLetterWorkflow.ts` / `hooks/usePsLetterWorkflow.ts` — client state machines
  (upload/analyze/generate/reset, abort + busy guards, object-URL & session cleanup).
- `lib/apiClient.ts` / `lib/ps/apiClient.ts` — the only client↔server boundary.
- `lib/prompts.ts` — standard prompts (single template literal).
- `lib/ps/prompts.ts` — **PS prompts, refactored into named section constants** composed at
  build time. Edit one section in isolation; the only dynamic piece is the injected
  `<requested_letters>` payload. **Section bodies are interim placeholders — replace with the
  final PS prompt text when provided; the `build*` functions stay the same.**
- `lib/validators.ts`, `lib/json.ts`, `lib/pageRanges.ts`, `lib/pdfSession.ts`,
  `lib/gemini.ts` — pure/stable, shared by both routes.
- Config-driven extension points: `lib/toolbarConfig.ts`, `lib/inquiryPhraseButtons.ts`,
  `lib/aiModelConfig.ts`, `lib/printConfig.ts`.

## Conventions / gotchas

- `letter_id` is **positional** — `letterListOperations` auto-resequences to `L001…` after any
  merge/remove/edit. Don't treat it as stable.
- `/` requires a non-empty note before generation (guarded client- and server-side); `/ps` has
  no such gate.
- Print differs by route. `/` uses a `/print` route + `localStorage` hand-off
  (`lib/printPreviewSession.ts`, `components/PrintPreview*`). `/ps` uses a self-contained
  letterhead template in `lib/ps/printDocument.ts` (`openPsPrintPreview`) that opens a popup
  and `document.write`s its own full HTML/CSS document — there is no `/ps/print` route. The PS
  template needs assets in `public/`: `/fonts/Adobe Naskh Medium.ttf` (Kufi) and
  `/img/SignPS_English.png` (signature); `/fonts/_Khat_Manzoor.ttf` already exists.
- `next.config.ts` deliberately splits dev (`.next/dev`) vs build (`.next`) output. Running
  `npm run build` rewrites `next-env.d.ts` to point at `.next/types`; `npm run dev` flips it
  back. Don't commit that flip.
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
GEMINI_DETECT_PDF_MODEL=gemini-2.5-flash
GEMINI_GENERATE_REPLIES_MODEL=gemini-2.5-flash
GEMINI_PS_DETECT_PDF_MODEL=gemini-2.5-flash
GEMINI_PS_GENERATE_REPLIES_MODEL=gemini-2.5-flash
DEBUG_GEMINI_REQUESTS=false
```

`GEMINI_MODEL` is a fallback for any unset workflow-specific model, then the built-in default.
`DEBUG_GEMINI_REQUESTS=true` logs full request bodies (incl. base64 PDF) and the constructed
generate prompt — large and sensitive; keep off by default.
