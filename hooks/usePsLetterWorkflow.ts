'use client';

import { useEffect, useRef, useState } from 'react';
import {
  analyzePdfRequest,
  clearPdfSessionRequest,
  generateRepliesRequest
} from '@/lib/ps/apiClient';
import type { PsLetterRecord } from '@/types/ps';

type WorkflowState = {
  pdfFile: File | null;
  pdfUrl: string | null;
  pdfSessionId: string | null;
  letters: PsLetterRecord[];
  selectedIndex: number;
  error: string | null;
  success: string | null;
  busyLabel: string | null;
};

type WorkflowApi = WorkflowState & {
  isBusy: boolean;
  hasPdf: boolean;
  hasLetters: boolean;
  setLetters: (letters: PsLetterRecord[], options?: { nextSelectedIndex?: number }) => void;
  setSelectedIndex: (index: number) => void;
  handleFileSelected: (file: File) => void;
  analyzePdf: () => Promise<void>;
  generateReplies: () => Promise<void>;
  resetAll: () => void;
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

export function usePsLetterWorkflow(): WorkflowApi {
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
      void clearPdfSessionRequest(pdfSessionIdRef.current);
    };
  }, []);

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
    void clearPdfSessionRequest(pdfSessionIdRef.current);

    setState((current) => {
      if (current.pdfUrl) URL.revokeObjectURL(current.pdfUrl);
      return {
        ...current,
        pdfFile: file,
        pdfUrl: URL.createObjectURL(file)
      };
    });
    resetUiState();
  }

  async function analyzePdf() {
    if (!state.pdfFile) return;

    const signal = beginOperation('Analyzing PDF with Gemini...');
    if (!signal) return;

    setState((current) => ({
      ...current,
      error: null,
      success: null,
      pdfSessionId: null
    }));
    await clearPdfSessionRequest(pdfSessionIdRef.current);

    try {
      const data = await analyzePdfRequest(state.pdfFile, signal);
      setState((current) => ({
        ...current,
        pdfSessionId: data.pdfSessionId,
        letters: data.letters,
        selectedIndex: 0,
        success: `Gemini detected ${data.letters.length} letter(s). Review the boundaries, then generate replies.`
      }));
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

  async function generateReplies() {
    if (!state.pdfSessionId || !state.letters.length) {
      setState((current) => ({ ...current, error: 'Please analyze the PDF before generating replies.' }));
      return;
    }

    const signal = beginOperation('Generating replies with Gemini...');
    if (!signal) return;

    setState((current) => ({ ...current, error: null, success: null }));
    const pdfSessionId = state.pdfSessionId;

    try {
      const data = await generateRepliesRequest(pdfSessionId, state.letters, signal);
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
        success: 'Replies generated. Please review and edit all fields before printing.'
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
    void clearPdfSessionRequest(pdfSessionIdRef.current);

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
