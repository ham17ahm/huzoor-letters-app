'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { ModelCatalogResponse, ModelOption, ModelTask } from '@/types/modelPresets';

type Props = {
  title?: string;
  subtitle?: string;
  isBusy: boolean;
  hasPdf: boolean;
  hasLetters: boolean;
  onAnalyze: (model: ModelOption) => void;
  onGenerate: (model: ModelOption) => void;
  onPrint: () => void;
  onReset: () => void;
};

const ROUTE_LINKS = [
  { href: '/', label: 'Standard' },
  { href: '/ps', label: 'PS' },
  { href: '/dua-urdu', label: 'Dua Urdu' },
  { href: '/ps-urdu', label: 'PS Urdu' }
] as const;

export function Toolbar({
  title = 'Letters Processor',
  subtitle = 'Upload → Detect PDF → Notes → Generate Replies → Review → Print',
  isBusy,
  hasPdf,
  hasLetters,
  onAnalyze,
  onGenerate,
  onPrint,
  onReset
}: Props) {
  const pathname = usePathname();
  const [catalog, setCatalog] = useState<ModelCatalogResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [selections, setSelections] = useState<Partial<Record<ModelTask, string>>>({});

  useEffect(() => {
    const controller = new AbortController();

    fetchModelCatalog(controller.signal)
      .then(setCatalog)
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setError(error instanceof Error ? error.message : 'Could not load model presets.');
        }
      });

    return () => controller.abort();
  }, [loadAttempt]);

  function getSelected(source: ModelCatalogResponse | null, task: ModelTask): ModelOption | undefined {
    const options = source?.[task];
    return options?.presets.find(({ id }) => id === selections[task])
      ?? options?.presets.find(({ id }) => id === options.defaultPreset);
  }

  // Re-read the presets before each run so an edited model-presets.json is caught here,
  // before the PDF is uploaded, instead of failing on the server.
  async function runTask(task: ModelTask, onRun: (model: ModelOption) => void) {
    const shownId = getSelected(catalog, task)?.id;
    if (!shownId) return;

    setIsChecking(true);
    setNotice(null);
    try {
      const latest = await fetchModelCatalog();
      setCatalog(latest);
      setError(null);
      const model = latest[task].presets.find(({ id }) => id === shownId);
      if (!model) {
        setNotice('The model list changed. Choose a model and press the button again. Your letters were kept.');
        return;
      }
      onRun(model);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not load model presets.');
    } finally {
      setIsChecking(false);
    }
  }

  function taskControl(
    task: ModelTask,
    label: string,
    canRun: boolean,
    onRun: (model: ModelOption) => void
  ) {
    const options = catalog?.[task];
    const selected = getSelected(catalog, task);

    return (
      <div className="modelTask">
        <select
          aria-label={`${label} model`}
          value={selected?.id ?? ''}
          disabled={isBusy || isChecking || !options}
          onChange={(event) => setSelections({ ...selections, [task]: event.target.value })}
        >
          {options ? options.presets.map(({ id, label }) => (
            <option key={id} value={id}>{label}</option>
          )) : <option value="">{error ? 'Models unavailable' : 'Loading models…'}</option>}
        </select>
        <button
          className={task === 'detectPdf' ? 'primaryButton' : undefined}
          disabled={isBusy || isChecking || !canRun || !selected}
          onClick={() => void runTask(task, onRun)}
        >
          {label}
        </button>
      </div>
    );
  }

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
        {taskControl('detectPdf', 'Detect PDF', hasPdf, onAnalyze)}
        {taskControl('generateReplies', 'Generate Replies', hasPdf && hasLetters, onGenerate)}
        <button onClick={onPrint} disabled={isBusy || !hasLetters}>Print / PDF</button>
        <button onClick={onReset} disabled={isBusy}>Reset</button>
        {error ? (
          <div className="modelConfigError">
            <span role="alert">{error}</span>
            <button onClick={() => {
              setError(null);
              setLoadAttempt((attempt) => attempt + 1);
            }}>Retry</button>
          </div>
        ) : null}
        {notice ? (
          <div className="modelConfigError">
            <span role="alert">{notice}</span>
          </div>
        ) : null}
        {catalog?.legacyEnvVars.length ? (
          <div className="modelConfigError">
            <span role="status">
              These .env.local settings are no longer used: {catalog.legacyEnvVars.join(', ')}.
              Move their models into model-presets.json, then remove them from .env.local.
            </span>
          </div>
        ) : null}
      </div>
    </header>
  );
}

async function fetchModelCatalog(signal?: AbortSignal): Promise<ModelCatalogResponse> {
  const response = await fetch('/api/model-presets', { signal, cache: 'no-store' });
  if (!response.ok) {
    const data: { error?: string } = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Could not load model presets.');
  }
  return await response.json() as ModelCatalogResponse;
}
