import type { NoteFreeEditorConfig } from '@/components/noteFree/editorConfig';

export const DUA_URDU_NAME_AFFIX_BUTTONS = [
  {
    id: 'male',
    label: 'Male',
    prefix: 'مکرم',
    suffix: 'صاحب'
  },
  {
    id: 'female',
    label: 'Female',
    prefix: 'مکرمہ',
    suffix: 'صاحبہ'
  }
] as const;

export const DUA_URDU_EDITOR_CONFIG: NoteFreeEditorConfig = {
  labels: {
    fullName: 'مکمل نام',
    location: 'جگہ',
    inquiry: 'ابتدائیہ',
    prayerSentence: 'دعائیہ جواب'
  },
  placeholders: {
    fullName: 'Gemini مکمل کرے گا',
    location: 'شہر، ملک',
    inquiry: 'Gemini مکمل کرے گا',
    prayerSentence: 'Gemini مکمل کرے گا'
  },
  inquiryPhraseButtons: [],
  fullNameAffixButtons: DUA_URDU_NAME_AFFIX_BUTTONS,
  visuallyHiddenLabels: ['inquiry', 'prayerSentence'],
  identityFieldOrder: ['location', 'fullName'],
  fieldLanguage: 'ur',
  fieldDirection: 'rtl',
  fieldClassName: 'duaUrduField'
};
