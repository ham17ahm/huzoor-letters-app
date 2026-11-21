'use client';

import { PsUrduLetterFormList } from '@/components/ps-urdu/PsUrduLetterFormList';
import { PdfViewer } from '@/components/PdfViewer';
import { Toolbar } from '@/components/Toolbar';
import { usePsUrduLetterWorkflow } from '@/hooks/usePsUrduLetterWorkflow';
import { openPsUrduPrintPreviewTab } from '@/lib/psUrdu/printPreviewSession';

export default function PsUrduHome() {
  const workflow = usePsUrduLetterWorkflow();

  return (
    <div className="appShell duaUrduRoute psUrduRoute">
      <Toolbar
        subtitle="Upload → Detect PDF → Generate PS Urdu Replies → Review → Print"
        isBusy={workflow.isBusy}
        hasPdf={workflow.hasPdf}
        hasLetters={workflow.hasLetters}
        onAnalyze={workflow.analyzePdf}
        onGenerate={workflow.generateReplies}
        onPrint={() => openPsUrduPrintPreviewTab(workflow.letters)}
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

          <PsUrduLetterFormList
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
