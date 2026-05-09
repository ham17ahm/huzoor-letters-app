'use client';

type Props = {
  hasPdf: boolean;
  hasLetters: boolean;
  isBusy: boolean;
  onAnalyze: () => void;
  onGenerate: () => void;
  onPrint: () => void;
  onReset: () => void;
};

export function Toolbar({
  hasPdf,
  hasLetters,
  isBusy,
  onAnalyze,
  onGenerate,
  onPrint,
  onReset
}: Props) {
  return (
    <header className="appHeader no-print">
      <div>
        <h1 className="appTitle">Letters Processor</h1>
        <p className="appSubtitle">Upload → Gemini Magic → Notes → Generate Replies → Review → Print</p>
      </div>
      <div className="headerActions">
        <button className="primaryButton" onClick={onAnalyze} disabled={!hasPdf || isBusy}>
          Gemini Magic
        </button>
        <button onClick={onGenerate} disabled={!hasPdf || !hasLetters || isBusy}>
          Generate Replies
        </button>
        <button onClick={onPrint} disabled={!hasLetters || isBusy}>
          Print / PDF
        </button>
        <button onClick={onReset} disabled={isBusy}>
          Reset
        </button>
      </div>
    </header>
  );
}
