'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { LetterFormList } from '@/components/LetterFormList';
import { PdfViewer } from '@/components/PdfViewer';
import { PrintPreview } from '@/components/PrintPreview';
import { Toolbar } from '@/components/Toolbar';
import type { GenerateReplyResult, GenerationProgress, LetterRecord } from '@/types/letter';

type ApiError = { error?: string };

type AnalyzeResponse = {
  letters: LetterRecord[];
  pdfSessionId: string;
  rawText?: string;
};

type GenerateResponse = {
  reply: GenerateReplyResult;
  rawText?: string;
};

export default function Home() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfSessionId, setPdfSessionId] = useState<string | null>(null);
  const [letters, setLetters] = useState<LetterRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [printMode, setPrintMode] = useState(false);

  const busyRef = useRef(false);
  const activeRequestRef = useRef<AbortController | null>(null);
  const pdfSessionIdRef = useRef<string | null>(null);

  const isBusy = Boolean(busyLabel);
  const missingNotes = useMemo(
    () => letters.filter((letter) => !letter.note.trim()).map((letter) => letter.letter_id),
    [letters]
  );

  useEffect(() => {
    pdfSessionIdRef.current = pdfSessionId;
  }, [pdfSessionId]);

  useEffect(() => {
    return () => {
      activeRequestRef.current?.abort();
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      clearPdfSession(pdfSessionIdRef.current);
    };
  }, [pdfUrl]);

  function beginOperation(label: string): AbortSignal | null {
    if (busyRef.current) return null;

    const controller = new AbortController();
    busyRef.current = true;
    activeRequestRef.current = controller;
    setBusyLabel(label);
    return controller.signal;
  }

  function finishOperation(signal: AbortSignal) {
    if (activeRequestRef.current?.signal === signal) {
      activeRequestRef.current = null;
    }
    busyRef.current = false;
    setBusyLabel(null);
    setProgress(null);
  }

  function handleFileSelected(file: File) {
    activeRequestRef.current?.abort();
    busyRef.current = false;
    clearPdfSession(pdfSessionIdRef.current);

    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfFile(file);
    setPdfUrl(URL.createObjectURL(file));
    setPdfSessionId(null);
    setLetters([]);
    setError(null);
    setSuccess(null);
    setProgress(null);
    setBusyLabel(null);
    setPrintMode(false);
  }

  async function analyzePdf() {
    if (!pdfFile) return;

    const signal = beginOperation('Analyzing PDF with Gemini...');
    if (!signal) return;

    setError(null);
    setSuccess(null);
    setProgress(null);
    clearPdfSession(pdfSessionIdRef.current);
    setPdfSessionId(null);

    try {
      const formData = new FormData();
      formData.append('pdf', pdfFile);

      const response = await fetch('/api/analyze-pdf', {
        method: 'POST',
        body: formData,
        signal
      });

      const data = (await response.json()) as AnalyzeResponse & ApiError;
      if (!response.ok) throw new Error(data.error || 'Failed to analyze PDF.');

      setPdfSessionId(data.pdfSessionId);
      setLetters(data.letters);
      setSuccess(`Gemini detected ${data.letters.length} letter(s). Enter notes, then generate replies.`);
    } catch (err) {
      if (isAbortError(err)) return;
      setError(err instanceof Error ? err.message : 'Failed to analyze PDF.');
    } finally {
      finishOperation(signal);
    }
  }

  async function generateReplies() {
    if (!pdfSessionId || !letters.length) {
      setError('Please analyze the PDF before generating replies.');
      return;
    }

    const signal = beginOperation('Generating replies with Gemini...');
    if (!signal) return;

    setError(null);
    setSuccess(null);

    if (missingNotes.length) {
      setError(`Please enter a note for ${missingNotes.join(', ')} before generating replies. Use "Dua" for prayers only.`);
      finishOperation(signal);
      return;
    }

    const nextLetters = [...letters];

    try {
      for (let index = 0; index < nextLetters.length; index += 1) {
        const letter = nextLetters[index];
        setProgress({ current: index + 1, total: nextLetters.length, label: letter.letter_id });

        const formData = new FormData();
        formData.append('pdfSessionId', pdfSessionId);
        formData.append('letter', JSON.stringify(letter));

        const response = await fetch('/api/generate-reply', {
          method: 'POST',
          body: formData,
          signal
        });

        const data = (await response.json()) as GenerateResponse & ApiError;
        if (!response.ok) throw new Error(data.error || `Failed to generate reply for ${letter.letter_id}.`);

        nextLetters[index] = {
          ...letter,
          ...data.reply,
          note: letter.note
        };
        setLetters([...nextLetters]);
      }

      setSuccess('Replies generated. Please review and edit all fields before printing.');
    } catch (err) {
      if (isAbortError(err)) return;
      setError(err instanceof Error ? err.message : 'Failed to generate replies.');
    } finally {
      finishOperation(signal);
    }
  }

  function resetAll() {
    activeRequestRef.current?.abort();
    busyRef.current = false;
    clearPdfSession(pdfSessionIdRef.current);

    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfFile(null);
    setPdfUrl(null);
    setPdfSessionId(null);
    setLetters([]);
    setError(null);
    setSuccess(null);
    setBusyLabel(null);
    setProgress(null);
    setPrintMode(false);
  }

  if (printMode) {
    return <PrintPreview letters={letters} onClose={() => setPrintMode(false)} />;
  }

  return (
    <div className="appShell">
      <Toolbar
        hasPdf={Boolean(pdfFile)}
        hasLetters={letters.length > 0}
        isBusy={isBusy}
        onAnalyze={analyzePdf}
        onGenerate={generateReplies}
        onPrint={() => setPrintMode(true)}
        onReset={resetAll}
      />

      <main className="mainGrid">
        <section className="pdfPanel">
          <PdfViewer pdfUrl={pdfUrl} onFileSelected={handleFileSelected} disabled={isBusy} />
        </section>

        <section className="formPanel">
          {busyLabel ? (
            <div className="notice">
              <strong>{busyLabel}</strong>
              {progress ? (
                <>
                  <div>
                    {progress.label}: {progress.current} of {progress.total}
                  </div>
                  <div className="progressBar" aria-label="Generation progress">
                    <div style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }} />
                  </div>
                </>
              ) : null}
            </div>
          ) : null}

          {error ? <div className="errorBox">{error}</div> : null}
          {success ? <div className="successBox">{success}</div> : null}

          <LetterFormList letters={letters} onLettersChange={setLetters} />
        </section>
      </main>
    </div>
  );
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function clearPdfSession(pdfSessionId: string | null) {
  if (!pdfSessionId) return;

  void fetch('/api/clear-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pdfSessionId })
  }).catch(() => {
    // Best-effort cleanup only. Sessions also expire automatically server-side.
  });
}
