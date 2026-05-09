'use client';

type Props = {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
};

export function PdfUploader({ onFileSelected, disabled }: Props) {
  return (
    <div className="uploadBox">
      <h2>Upload PDF packet</h2>
      <p>Select the scanned PDF containing one or more letters.</p>
      <input
        type="file"
        accept="application/pdf"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFileSelected(file);
        }}
      />
    </div>
  );
}
