# Huzoor Letters App

A local, browser-based Next.js app for processing PDF packets of correspondence letters with Gemini.

## What it does

1. Upload one PDF packet.
2. Preview the PDF on the left.
3. Click **Gemini Magic** to detect individual letters and source pages.
4. Enter one note per letter.
5. Click **Generate Replies** to process each letter one-by-one with Gemini, using the already-uploaded temporary PDF session.
6. Review and edit every field.
7. Click **Print / PDF** to create one A4 reply page per letter and save through Chrome's print dialog.

## Privacy model

- No database.
- No login.
- No permanent PDF storage.
- Uploaded PDFs are held in a temporary in-memory server session after analysis so the same PDF is not re-uploaded for every letter.
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
GEMINI_MODEL=gemini-2.5-flash
```

## Important v1 limitations

- Letter boundary detection is AI-assisted and can be corrected manually.
- No automatic learning from corrections.
- No source highlighting.
- No OCR review panel.
- No database persistence.

## Installation note

This package includes a public-registry `package-lock.json` and `.npmrc`. If `npm install` appears to hang, stop it with `Ctrl+C`, then run:

```bash
rm -rf node_modules
npm cache verify
npm install --registry=https://registry.npmjs.org/ --verbose
```

Use Node 20 LTS if possible. Node 18.18+ is required by Next.js 15.
