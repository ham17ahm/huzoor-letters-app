'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ToolbarAction } from '@/types/toolbar';

type Props = {
  title?: string;
  subtitle?: string;
  actions: ToolbarAction[];
};

const ROUTE_LINKS = [
  { href: '/', label: 'Standard' },
  { href: '/ps', label: 'PS' }
] as const;

export function Toolbar({
  title = 'Letters Processor',
  subtitle = 'Upload → Detect PDF → Notes → Generate Replies → Review → Print',
  actions
}: Props) {
  const pathname = usePathname();

  return (
    <header className="appHeader no-print">
      <div>
        <h1 className="appTitle">{title}</h1>
        <p className="appSubtitle">{subtitle}</p>
      </div>
      <nav className="routeNav" aria-label="Workflow routes">
        {ROUTE_LINKS.map((routeLink) => {
          const isActive = pathname === routeLink.href;
          return (
            <Link
              key={routeLink.href}
              href={routeLink.href}
              className={`routeNavLink ${isActive ? 'isActive' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {routeLink.label}
            </Link>
          );
        })}
      </nav>
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
