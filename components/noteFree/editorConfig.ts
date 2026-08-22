import type { InquiryPhraseButton } from '@/lib/inquiryPhraseButtons';
import type { NameAffixButton } from '@/lib/nameAffixes';

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
  fullNameAffixButtons?: readonly NameAffixButton[];
  visuallyHiddenLabels?: readonly ('fullName' | 'location' | 'inquiry' | 'prayerSentence')[];
  identityFieldOrder?: readonly ('fullName' | 'location')[];
  fieldLanguage?: string;
  fieldDirection?: 'ltr' | 'rtl';
  fieldClassName?: string;
};
