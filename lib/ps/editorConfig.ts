import type { NoteFreeEditorConfig } from '@/components/noteFree/editorConfig';
import { INQUIRY_PHRASE_BUTTONS } from '@/lib/inquiryPhraseButtons';

export const PS_EDITOR_CONFIG: NoteFreeEditorConfig = {
  labels: {
    fullName: 'Full name',
    location: 'Location',
    inquiry: 'Inquiry',
    prayerSentence: 'Prayer sentence'
  },
  placeholders: {
    fullName: 'Filled by Gemini',
    location: 'City, Country',
    inquiry: 'Filled by Gemini',
    prayerSentence: 'Filled by Gemini'
  },
  inquiryPhraseButtons: INQUIRY_PHRASE_BUTTONS
};
