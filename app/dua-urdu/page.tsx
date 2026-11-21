'use client';

import { DuaUrduLetterFormList } from '@/components/dua-urdu/DuaUrduLetterFormList';
import { PdfViewer } from '@/components/PdfViewer';
import { Toolbar } from '@/components/Toolbar';
import { useDuaUrduLetterWorkflow } from '@/hooks/useDuaUrduLetterWorkflow';
import { openDuaUrduPrintPreviewTab } from '@/lib/duaUrdu/printPreviewSession';

export default function DuaUrduHome() {
  const workflow = useDuaUrduLetterWorkflow();

  return (
    <div className="appShell duaUrduRoute">
      <Toolbar
        subtitle="Upload → Detect PDF → Generate Urdu Replies → Review → Print"
        isBusy={workflow.isBusy}
        hasPdf={workflow.hasPdf}
        hasLetters={workflow.hasLetters}
        onAnalyze={workflow.analyzePdf}
        onGenerate={workflow.generateReplies}
        onPrint={() => openDuaUrduPrintPreviewTab(workflow.letters)}
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

          <DuaUrduLetterFormList
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
