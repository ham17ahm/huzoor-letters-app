'use client';

import { LetterFormList } from '@/components/LetterFormList';
import { PdfViewer } from '@/components/PdfViewer';
import { Toolbar } from '@/components/Toolbar';
import { useLetterWorkflow } from '@/hooks/useLetterWorkflow';
import { openPrintPreviewTab } from '@/lib/printPreviewSession';

export default function Home() {
  const workflow = useLetterWorkflow();

  return (
    <div className="appShell">
      <Toolbar
        isBusy={workflow.isBusy}
        hasPdf={workflow.hasPdf}
        hasLetters={workflow.hasLetters}
        onAnalyze={workflow.analyzePdf}
        onGenerate={workflow.generateReplies}
        onPrint={() => openPrintPreviewTab(workflow.letters)}
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

          <LetterFormList
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
