import type { PsLetterRecord } from '@/types/ps';

/**
 * PS route print template (letterhead variant).
 *
 * This is a faithful port of the provided self-contained print script: it opens
 * a new window and writes a complete HTML document with its own inline CSS, so
 * the styling is fully isolated from the rest of the app. Field mapping is done
 * by `getLetterModel`, which reads the app's `full_name` / `inquiry` /
 * `prayer_sentence` / `location` fields.
 *
 * Assets referenced by the template (place under `public/`):
 *   - /fonts/_Khat_Manzoor.ttf          (already present)
 *   - /fonts/Adobe Naskh Medium.ttf     (Kufi font — add to public/fonts)
 *   - /img/SignPS_English.png           (signature image — add to public/img)
 */

/** Letter shape accepted by the template: app record plus optional overrides. */
type PsPrintLetter = PsLetterRecord & {
  prefixName?: string;
  fullName?: string;
  letterDisplayDate?: Date | string | number;
  preContent?: string;
  mainContent?: string;
  footnote?: string;
  recipientLocation?: string;
};

function escapeHTML(str: unknown): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function toDDMMYYYY(d?: Date | string | number): string {
  const date = d instanceof Date ? d : new Date(d ?? Date.now());
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function getLetterModel(item: PsPrintLetter) {
  return {
    prefixName: item.prefixName ?? 'Dear ',
    fullName: item.fullName ?? item.full_name ?? '',
    letterDisplayDate: item.letterDisplayDate ?? new Date(),

    preContent: item.preContent ?? item.inquiry ?? '',

    mainContent:
      item.mainContent ??
      (item.prayer_sentence ? `<p>${escapeHTML(item.prayer_sentence)}</p>` : ''),

    footnote: item.footnote ?? '',
    recipientLocation: item.recipientLocation ?? item.location ?? ''
  };
}

function letterHTML(item: PsPrintLetter, index: number): string {
  const m = getLetterModel(item);

  const dateStr = `HM – ${toDDMMYYYY(m.letterDisplayDate)}`;
  const prefixNameEsc = escapeHTML(m.prefixName);
  const fullNameEsc = escapeHTML(m.fullName);
  const preContentEsc = escapeHTML(m.preContent);
  const footnoteEsc = escapeHTML(m.footnote);

  return `
  <div class="letter-container" aria-label="Letter ${index + 1}">
    <div class="letter-content">

      <div class="page-head">
        <div class="letterhead-Bismillah">بسم اللّٰہ الرحمٰن الرحیم</div>
        <div class="letterhead-Bismillah">نحمدہٗ ونصلّی علیٰ رسولہ الکریم وعلیٰ عبدہٖ المیسح الموعود</div>
        <div class="letterhead-Bismillah">ھو الناصر</div>
        <div class="letterhead-english">In the Name of <b class="one">Allah</b>, most Gracious, ever Merciful</div>
        <div class="line-1"></div>
        <div class="line-2"></div>
        <div class="letterhead-english">Private Secretary to <b class="one">Hazrat Khalifatul-Masih V</b></div>
        <div class="letterhead-arabic-salutation">ایدہ اللہ تعالیٰ بنصرہ العزیز</div>
      </div>

      <div class="letter-body">
        <div class="date_location_combined">
          <div class="date_location">Islamabad, UK</div>
          <div class="date">${dateStr}</div>
        </div>

        <div class="title_fullname text">
          <div class="title text">${prefixNameEsc}</div>
          <div class="full_name text">${fullNameEsc},</div>
        </div>

        <div class="salam">اَلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللهِ وَبَرَكَاتُه</div>

        <div class="intro_text text">${preContentEsc}</div>

        <div class="main_text text" style="line-height: 1.2">
          ${m.mainContent}
        </div>

        <div class="wassalam">Wassalam</div>
        <div class="greeting_end">Yours faithfully,</div>
        <img src="/img/SignPS_English.png" style="width: 180px;" />
        <div class="signature">Munir Ahmad Javed</div>
        <div class="signature_title">Private Secretary</div>
      </div>

    </div>

    <div class="footnote-container">
      <div class="footnote-text">${footnoteEsc}</div>
      ${m.recipientLocation ? `<div class="footer-location">${escapeHTML(m.recipientLocation)}</div>` : ''}
    </div>
  </div>
  `;
}

export function openPsPrintPreview(data: PsLetterRecord[]): void {
  const w = window.open('', '_blank');
  if (!w) {
    alert('Popup blocked. Please allow popups to view/print letters.');
    return;
  }

  // The popup is an about:blank document, where the base URL for resolving
  // root-relative asset URLs (/fonts/*, /img/*) is not reliably the app origin.
  // Pin it explicitly to the opener's origin so fonts and the signature image
  // always load.
  const baseHref = `${window.location.origin}/`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<base href="${baseHref}" />
<title>Letters — Print Preview</title>
<style>

@font-face {
  font-family: Khat_Manzoor;
  src: url("/fonts/_Khat_Manzoor.ttf");
}
@font-face {
  font-family: Kufi;
  src: url("/fonts/Adobe Naskh Medium.ttf");
}

body {
  margin: 0;
  padding: 0;
  background-color: #f9f9f9;
}

.letter-container {
  position: relative;
  width: 210mm;
  height: 297mm;
  margin: 20px auto;
  background-color: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
  page-break-after: always;
  border: 1px solid #ddd;
  overflow: hidden;
}

.letter-content {
  padding-top: 1.75cm;
  padding-bottom: 2cm;
}

.page-head {
  margin-bottom: 1cm;
  text-align: center;
}

.letterhead-Bismillah {
  font-family: Kufi, Arial, sans-serif;
  font-size: 14pt;
}

.one {
  font-size: 16pt;
}

.letterhead-english {
  font-size: 14pt;
  font-variant: small-caps;
  font-family: "Times New Roman", Times, serif;
}

.line-1 {
  height: 2px;
  background: black;
  border-top: 2px solid black;
  margin-bottom: 3px;
}

.line-2 {
  height: 0.5px;
  background: black;
  border-top: 0.5px solid black;
}

.letterhead-arabic-salutation {
  font-family: Khat_Manzoor, Arial, sans-serif;
  font-size: 11pt;
}

.letter-body {
  margin-left: 3.25cm;
  margin-right: 3cm;
}

.date_location_combined {
  text-align: right;
  font-size: 12pt;
}

.date {
  text-decoration: overline;
}

.title_fullname {
  margin-top: 2mm;
  margin-bottom: 2mm;
}

.title,
.full_name {
  display: inline-block;
}

.salam {
  text-align: center;
  font-family: Khat_Manzoor, Arial, sans-serif;
  font-size: 18pt;
}

.intro_text {
  margin-bottom: 2mm;
}

.intro_text,
.main_text {
  text-align: justify;
}

.wassalam {
  font-style: italic;
  margin-top: 2mm;
  font-size: 16pt;
}

.greeting_end {
  margin-top: 2mm;
  font-size: 16pt;
}

.signature {
  font-weight: bold;
  font-size: 16pt;
}

.signature_title {
  font-weight: bold;
  margin: 0;
  font-size: 15pt;
}

.footnote-container {
  position: absolute;
  bottom: 2cm;
  left: 3.25cm;
  right: 3cm;
  font-size: 12pt;
  white-space: pre-wrap;
}

.footer-location {
  text-align: left;
  font-size: 10pt;
}

.text {
  font-size: 16pt;
}

p {
  margin-top: 2mm;
  margin-bottom: 2mm;
}

@media print {
  @page {
    size: A4 portrait;
    margin: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  body {
    background-color: white;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  .letter-container {
    width: 100%;
    height: 100vh;
    margin: 0;
    box-shadow: none;
    border: none;
    page-break-after: always;
    break-after: page;
    position: relative;
  }

  .letter-content {
    padding-top: 1.75cm;
    padding-bottom: 2cm;
  }

  .line-1,
  .line-2 {
    border-color: black !important;
    background-color: black !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  button,
  input,
  select,
  .no-print {
    display: none !important;
  }
}

.toolbar {
  position: sticky;
  top: 0;
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f3f3f3;
  border-bottom: 1px solid #ddd;
}
.toolbar button {
  padding: 8px 12px;
  font-weight: 600;
  cursor: pointer;
}
@media print {
  .toolbar { display: none !important; }
}

</style>
</head>
<body>
  <div class="toolbar no-print">
    <div style="font: 12px/1.4 system-ui, sans-serif; color: #444"><strong>${data.length}</strong> letter(s)</div>
    <div>
      <button onclick="window.print()">Print</button>
      <button onclick="window.close()">Close</button>
    </div>
  </div>

  ${data.map(letterHTML).join('')}

</body>
</html>`;

  w.document.open();
  w.document.write(html);
  w.document.close();
}
