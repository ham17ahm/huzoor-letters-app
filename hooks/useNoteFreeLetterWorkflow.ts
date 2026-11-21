'use client';

import { useEffect, useRef, useState } from 'react';
import type { ModelOption } from '@/types/modelPresets';
import type { NoteFreeApiClient } from '@/lib/noteFree/apiClient';
import type { NoteFreeLetterRecord } from '@/types/noteFree';

type WorkflowState = {
  pdfFile: File | null;
  pdfUrl: string | null;
  pdfSessionId: string | null;
  letters: NoteFreeLetterRecord[];
  selectedIndex: number;
  error: string | null;
  success: string | null;
  busyLabel: string | null;
};

export type NoteFreeLetterWorkflow = WorkflowState & {
  isBusy: boolean;
  hasPdf: boolean;
  hasLetters: boolean;
  setLetters: (
    letters: NoteFreeLetterRecord[],
    options?: { nextSelectedIndex?: number }
  ) => void;
  setSelectedIndex: (index: number) => void;
  handleFileSelected: (file: File) => void;
  analyzePdf: (model: ModelOption) => Promise<void>;
  generateReplies: (model: ModelOption) => Promise<void>;
  resetAll: () => void;
};

export type NoteFreeWorkflowConfig = {
  apiClient: NoteFreeApiClient;
  analyzeSuccessMessage: (letterCount: number) => string;
};

const initialState: WorkflowState = {
  pdfFile: null,
  pdfUrl: null,
  pdfSessionId: null,
  letters: [],
  selectedIndex: 0,
  error: null,
  success: null,
  busyLabel: null
};

export function useNoteFreeLetterWorkflow(
  config: NoteFreeWorkflowConfig
): NoteFreeLetterWorkflow {
  const { apiClient } = config;
  const [state, setState] = useState<WorkflowState>(initialState);
  const busyRef = useRef(false);
  const activeRequestRef = useRef<AbortController | null>(null);
  const pdfSessionIdRef = useRef<string | null>(null);
  const pdfUrlRef = useRef<string | null>(null);

  useEffect(() => {
    pdfSessionIdRef.current = state.pdfSessionId;
  }, [state.pdfSessionId]);

  useEffect(() => {
    pdfUrlRef.current = state.pdfUrl;
  }, [state.pdfUrl]);

  useEffect(() => {
    return () => {
      activeRequestRef.current?.abort();
      if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
      void apiClient.clearPdfSessionRequest(pdfSessionIdRef.current);
    };
  }, [apiClient]);

  function beginOperation(label: string): AbortSignal | null {
    if (busyRef.current) return null;

    const controller = new AbortController();
    busyRef.current = true;
    activeRequestRef.current = controller;
    setState((current) => ({ ...current, busyLabel: label }));
    return controller.signal;
  }

  function finishOperation(signal: AbortSignal) {
    if (activeRequestRef.current?.signal !== signal) return;

    activeRequestRef.current = null;
    busyRef.current = false;
    setState((current) => ({ ...current, busyLabel: null }));
  }

  function resetUiState() {
    setState((current) => ({
      ...current,
      pdfSessionId: null,
      letters: [],
      selectedIndex: 0,
      error: null,
      success: null,
      busyLabel: null
    }));
  }

  function handleFileSelected(file: File) {
    activeRequestRef.current?.abort();
    busyRef.current = false;
    void apiClient.clearPdfSessionRequest(pdfSessionIdRef.current);

    setState((current) => {
      if (current.pdfUrl) URL.revokeObjectURL(current.pdfUrl);
      return { ...current, pdfFile: file, pdfUrl: URL.createObjectURL(file) };
    });
    resetUiState();
  }

  async function analyzePdf(model: ModelOption) {
    if (!state.pdfFile) return;

    const signal = beginOperation(`Analyzing PDF with ${model.label}...`);
    if (!signal) return;

    // Keep the current session and letters until detection succeeds, so a failed
    // re-detection never blocks generation for letters the operator already edited.
    const previousSessionId = pdfSessionIdRef.current;
    setState((current) => ({ ...current, error: null, success: null }));

    try {
      const data = await apiClient.analyzePdfRequest(state.pdfFile, signal, model.id);
      setState((current) => ({
        ...current,
        pdfSessionId: data.pdfSessionId,
        letters: data.letters,
        selectedIndex: 0,
        success: config.analyzeSuccessMessage(data.letters.length)
      }));
      if (previousSessionId && previousSessionId !== data.pdfSessionId) {
        void apiClient.clearPdfSessionRequest(previousSessionId);
      }
    } catch (error) {
      if (!isAbortError(error)) {
        setState((current) => ({
          ...current,
          error: error instanceof Error ? error.message : 'Failed to analyze PDF.'
        }));
      }
    } finally {
      finishOperation(signal);
    }
  }

  async function generateReplies(model: ModelOption) {
    if (!state.pdfSessionId || !state.letters.length) {
      setState((current) => ({
        ...current,
        error: 'Please analyze the PDF before generating replies.'
      }));
      return;
    }

    const missingPages = state.letters.filter((letter) => !letter.source_pages.length);
    if (missingPages.length) {
      setState((current) => ({
        ...current,
        error: `Please enter PDF page numbers for ${missingPages.map((letter) => letter.letter_id).join(', ')} before generating replies.`
      }));
      return;
    }

    const signal = beginOperation(`Generating replies with ${model.label}...`);
    if (!signal) return;

    setState((current) => ({ ...current, error: null, success: null }));

    try {
      const data = await apiClient.generateRepliesRequest(
        state.pdfSessionId,
        state.letters,
        signal,
        model.id
      );
      const repliesById = new Map(data.replies.map((reply) => [reply.letter_id, reply]));
      const nextLetters = state.letters.map((letter) => {
        const reply = repliesById.get(letter.letter_id);
        if (!reply) return letter;

        return {
          ...letter,
          full_name: reply.full_name,
          location: reply.location,
          inquiry: reply.inquiry,
          prayer_sentence: reply.prayer_sentence
        };
      });

      setState((current) => ({
        ...current,
        letters: nextLetters,
        success: `Replies generated with ${model.label}. Please review and edit all fields before printing.`
      }));
    } catch (error) {
      if (!isAbortError(error)) {
        setState((current) => ({
          ...current,
          error: error instanceof Error ? error.message : 'Failed to generate replies.'
        }));
      }
    } finally {
      finishOperation(signal);
    }
  }

  function resetAll() {
    activeRequestRef.current?.abort();
    busyRef.current = false;
    void apiClient.clearPdfSessionRequest(pdfSessionIdRef.current);

    setState((current) => {
      if (current.pdfUrl) URL.revokeObjectURL(current.pdfUrl);
      return initialState;
    });
  }

  return {
    ...state,
    isBusy: Boolean(state.busyLabel),
    hasPdf: Boolean(state.pdfFile),
    hasLetters: state.letters.length > 0,
    setLetters: (letters, options) =>
      setState((current) => ({
        ...current,
        letters,
        selectedIndex: resolveSelectedIndex(
          options?.nextSelectedIndex ?? current.selectedIndex,
          letters.length
        )
      })),
    setSelectedIndex: (index) =>
      setState((current) => ({
        ...current,
        selectedIndex: resolveSelectedIndex(index, current.letters.length)
      })),
    handleFileSelected,
    analyzePdf,
    generateReplies,
    resetAll
  };
}

function isAbortError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'name' in error &&
      (error as { name?: unknown }).name === 'AbortError'
  );
}

function resolveSelectedIndex(index: number, letterCount: number): number {
  if (letterCount <= 0) return 0;
  if (index < 0) return 0;
  if (index >= letterCount) return letterCount - 1;
  return index;
}
