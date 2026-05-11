export const PRINT_HEADER_LOCATION = 'Islamabad, UK';

export const PRINT_TEMPLATE_TEXT = {
  dateLabel: 'Date',
  printButtonLabel: 'Print',
  closeButtonLabel: 'Close',
  salutationPrefix: 'Dear',
  salam: 'اَلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللهِ وَبَرَكَاتُه',
  defaultInquiry: 'I have received your letter.',
  defaultPrayer: 'May Allah Taala bless you in every way. Amin',
  wassalam: 'Wassalam',
  closing: 'Yours sincerely,',
  signature: 'MIRZA MASROOR AHMAD',
  signatureTitle: 'Khalifatul-Masih V',
  fallbackValue: 'N/A'
} as const;

export function shouldPrintNote(note: string): boolean {
  const trimmed = note.trim();
  return Boolean(trimmed) && trimmed.toLowerCase() !== 'dua';
}
