import type { NoteFreeEditorConfig } from '@/components/noteFree/editorConfig';

export const DUA_URDU_INQUIRY_PHRASE_BUTTONS = [
  {
    id: 'hadiyah',
    label: 'Hadiyah',
    phrase: 'آپ کے محبت بھرے ہدیہ کے لیے بھی جزاکم اللہ۔'
  },
  {
    id: 'gift',
    label: 'Gift',
    phrase: 'آپ کے محبت بھرے تحفے کے لیے بھی جزاکم اللہ۔'
  },
  {
    id: 'condolences',
    label: 'Condolences',
    phrase: 'براہِ کرم اس نقصان پر میری دلی تعزیت قبول فرمائیں۔'
  },
  {
    id: 'innalillah',
    label: 'Inna Lillah',
    phrase: 'إِنَّا لِلَّٰهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ'
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
  inquiryPhraseButtons: DUA_URDU_INQUIRY_PHRASE_BUTTONS,
  identityFieldOrder: ['location', 'fullName'],
  fieldLanguage: 'ur',
  fieldDirection: 'rtl',
  fieldClassName: 'duaUrduField'
};
