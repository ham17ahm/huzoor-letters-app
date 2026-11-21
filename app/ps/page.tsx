'use client';

import { PsLetterFormList } from '@/components/ps/PsLetterFormList';
import { PdfViewer } from '@/components/PdfViewer';
import { Toolbar } from '@/components/Toolbar';
import { usePsLetterWorkflow } from '@/hooks/usePsLetterWorkflow';
import { openPsPrintPreview } from '@/lib/ps/printDocument';

export default function PsHome() {
  const workflow = usePsLetterWorkflow();

  return (
    <div className="appShell psRoute">
      <Toolbar
        subtitle="Upload → Detect PDF → Generate Replies → Review → Print"
        isBusy={workflow.isBusy}
        hasPdf={workflow.hasPdf}
        hasLetters={workflow.hasLetters}
        onAnalyze={workflow.analyzePdf}
        onGenerate={workflow.generateReplies}
        onPrint={() => openPsPrintPreview(workflow.letters)}
        onReset={workflow.resetAll}
      />

      <main className="mainGrid">
        <section className="pdfPanel">
          <PdfViewer
            pdfUrl={workflow.pdfUrl}
            onFileSelected={workflow.handleFileSelected}
            disabled={workflow.isBusy}
          />
        </section>

        <section className="formPanel">
          {workflow.busyLabel ? (
            <div className="notice">
              <strong>{workflow.busyLabel}</strong>
            </div>
          ) : null}

          {workflow.error ? <div className="errorBox">{workflow.error}</div> : null}
          {workflow.success ? <div className="successBox">{workflow.success}</div> : null}

          <PsLetterFormList
            letters={workflow.letters}
            selectedIndex={workflow.selectedIndex}
            disabled={workflow.isBusy}
            onSelectLetter={workflow.setSelectedIndex}
            onLettersChange={workflow.setLetters}
          />
        </section>
      </main>
    </div>
  );
}
