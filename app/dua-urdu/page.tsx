'use client';

import { DuaUrduLetterFormList } from '@/components/dua-urdu/DuaUrduLetterFormList';
import { PdfViewer } from '@/components/PdfViewer';
import { Toolbar } from '@/components/Toolbar';
import { useDuaUrduLetterWorkflow } from '@/hooks/useDuaUrduLetterWorkflow';
import { openDuaUrduPrintPreviewTab } from '@/lib/duaUrdu/printPreviewSession';
import { TOOLBAR_ACTIONS } from '@/lib/toolbarConfig';
import type { ToolbarAction, ToolbarActionId } from '@/types/toolbar';

export default function DuaUrduHome() {
  const workflow = useDuaUrduLetterWorkflow();

  const disabledById: Record<ToolbarActionId, boolean> = {
    analyze: !workflow.hasPdf || workflow.isBusy,
    generate: !workflow.hasPdf || !workflow.hasLetters || workflow.isBusy,
    print: !workflow.hasLetters || workflow.isBusy,
    reset: workflow.isBusy
  };

  const handlerById: Record<ToolbarActionId, () => void> = {
    analyze: () => void workflow.analyzePdf(),
    generate: () => void workflow.generateReplies(),
    print: () => openDuaUrduPrintPreviewTab(workflow.letters),
    reset: workflow.resetAll
  };

  const toolbarActions: ToolbarAction[] = TOOLBAR_ACTIONS.map((action) => ({
    ...action,
    disabled: disabledById[action.id],
    onClick: handlerById[action.id]
  }));

  return (
    <div className="appShell duaUrduRoute">
      <Toolbar
        actions={toolbarActions}
        subtitle="Upload → Detect PDF → Generate Urdu Replies → Review → Print"
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
