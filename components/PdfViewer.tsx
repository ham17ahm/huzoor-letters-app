'use client';

import { PdfUploader } from '@/components/PdfUploader';

type Props = {
  pdfUrl: string | null;
  onFileSelected: (file: File) => void;
  disabled?: boolean;
};

export function PdfViewer({ pdfUrl, onFileSelected, disabled }: Props) {
  if (!pdfUrl) {
    return <PdfUploader onFileSelected={onFileSelected} disabled={disabled} />;
  }

  return <iframe className="pdfFrame" src={pdfUrl} title="Uploaded PDF preview" />;
}
