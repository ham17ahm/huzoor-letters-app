export type LetterRecord = {
  letter_id: string;
  source_pages: number[];
  full_name: string;
  location: string;
  note: string;
  inquiry: string;
  prayer_sentence: string;
};

export type LetterBoundary = Pick<LetterRecord, 'letter_id' | 'source_pages'>;

export type GenerateReplyResult = Pick<
  LetterRecord,
  'full_name' | 'location' | 'inquiry' | 'prayer_sentence'
>;

export type BulkGenerateReplyResult = GenerateReplyResult & Pick<LetterRecord, 'letter_id'>;
