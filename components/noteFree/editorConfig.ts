import type { InquiryPhraseButton } from '@/lib/inquiryPhraseButtons';

export type NoteFreeEditorConfig = {
  labels: {
    fullName: string;
    location: string;
    inquiry: string;
    prayerSentence: string;
  };
  placeholders: {
    fullName: string;
    location: string;
    inquiry: string;
    prayerSentence: string;
  };
  inquiryPhraseButtons: readonly InquiryPhraseButton[];
  visuallyHiddenLabels?: readonly ('fullName' | 'location' | 'inquiry' | 'prayerSentence')[];
  identityFieldOrder?: readonly ('fullName' | 'location')[];
  fieldLanguage?: string;
  fieldDirection?: 'ltr' | 'rtl';
  fieldClassName?: string;
};
