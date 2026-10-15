---
name: verify
description: Build, launch and drive the Huzoor Letters app in Chrome to verify a change at its real UI surface.
---

# Verify recipe (huzoor-letters-app)

## Launch
```bash
npm run build                      # writes .next (dev uses .next-dev, so a running dev server is safe)
npx next start -p 3057             # run in background; needs GEMINI_API_KEY in .env.local
git checkout next-env.d.ts         # build flips it to .next/types; cosmetic, restore afterwards
```
Override env per server to probe config, e.g. `GEMINI_ARGON_MODEL=bogus npx next start -p 3058`
(use a second port to keep the normal server up).

## Test PDF
Claude-in-Chrome `file_upload` rejects scratchpad files. Instead, in the page via `javascript_tool`:
build a `File` from base64 bytes, put it in `input[type=file]` with `DataTransfer`, and dispatch a
bubbling `change` event. The app's own upload handler runs. A one-page text PDF ("Dear Huzoor, I am
Ahmad Khan from Lahore. Please pray for my health.") is enough. Generate it with a ~20-line node
script that writes a minimal PDF with xref offsets.
- Wait for `input[type=file]` before attaching. After the PDF loads, the uploader is replaced by the
  viewer, so a re-run of the same script throws `Cannot set properties of null`. Guard with a
  `window.__ran` flag.

## Drive
- Toolbar buttons: `.headerActions button`, matched by text (`Detect PDF`, `Generate Replies`,
  `Argon 4 Medium`, `Argon 4 High`, `Print / PDF`, `Reset`).
- Messages: `.errorBox`, `.successBox`; the busy label is the body text `Generating replies with …`.
- To see what a button sends, wrap `window.fetch` and record `opts.body.get('engine')` plus status.
- Routes: `/` (needs a note per letter; the note textarea is required), `/ps`, `/dua-urdu`, `/ps-urdu`.
- Real Gemini calls cost money; one tiny PDF per path is plenty. Detect ≈ 5 s, Flash generate ≈ 10 s,
  Argon high ≈ 45 s on first call.

## Cleanup
Stop servers by port (PowerShell `Get-NetTCPConnection -LocalPort <p>` → `Stop-Process`), close the
Chrome tab, restore `next-env.d.ts`.
