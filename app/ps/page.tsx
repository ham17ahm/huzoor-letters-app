'use client';

import { PsLetterFormList } from '@/components/ps/PsLetterFormList';
import { PdfViewer } from '@/components/PdfViewer';
import { Toolbar } from '@/components/Toolbar';
import { usePsLetterWorkflow } from '@/hooks/usePsLetterWorkflow';
import { openPsPrintPreview } from '@/lib/ps/printDocument';
import { TOOLBAR_ACTIONS } from '@/lib/toolbarConfig';
import type { ToolbarAction, ToolbarActionId } from '@/types/toolbar';

export default function PsHome() {
  const workflow = usePsLetterWorkflow();

  const disabledById: Record<ToolbarActionId, boolean> = {
    analyze: !workflow.hasPdf || workflow.isBusy,
    generate: !workflow.hasPdf || !workflow.hasLetters || workflow.isBusy,
    print: !workflow.hasLetters || workflow.isBusy,
    reset: workflow.isBusy
  };

  const handlerById: Record<ToolbarActionId, () => void> = {
    analyze: () => void workflow.analyzePdf(),
    generate: () => void workflow.generateReplies(),
    print: () => openPsPrintPreview(workflow.letters),
    reset: workflow.resetAll
  };

  const toolbarActions: ToolbarAction[] = TOOLBAR_ACTIONS.map((action) => ({
    ...action,
    disabled: disabledById[action.id],
    onClick: handlerById[action.id]
  }));

  return (
    <div className="appShell">
      <Toolbar
        actions={toolbarActions}
        subtitle="Upload → Detect PDF → Generate Replies → Review → Print"
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
