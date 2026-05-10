'use client';

import type { ToolbarAction } from '@/types/toolbar';

type Props = {
  title?: string;
  subtitle?: string;
  actions: ToolbarAction[];
};

export function Toolbar({
  title = 'Letters Processor',
  subtitle = 'Upload → Gemini Magic → Notes → Generate Replies → Review → Print',
  actions
}: Props) {
  return (
    <header className="appHeader no-print">
      <div>
        <h1 className="appTitle">{title}</h1>
        <p className="appSubtitle">{subtitle}</p>
      </div>
      <div className="headerActions">
        {actions.map((action) => (
          <button
            key={action.id}
            className={buttonClassName(action)}
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {action.label}
          </button>
        ))}
      </div>
    </header>
  );
}

function buttonClassName(action: ToolbarAction): string | undefined {
  if (action.variant === 'primary') return 'primaryButton';
  if (action.variant === 'danger') return 'dangerButton';
  return undefined;
}
