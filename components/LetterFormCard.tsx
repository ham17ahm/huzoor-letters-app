'use client';

import { useEffect, useState } from 'react';
import { INQUIRY_PHRASE_BUTTONS } from '@/lib/inquiryPhraseButtons';
import { appendPhrase } from '@/lib/textInsertion';
import type { LetterRecord } from '@/types/letter';
import { formatPageRange, parsePageRange } from '@/lib/pageRanges';

type Props = {
  letter: LetterRecord;
  index: number;
  total: number;
  disabled?: boolean;
  onChange: (updated: LetterRecord) => void;
  onMergePrevious: () => void;
  onMergeNext: () => void;
  onRemove: () => void;
};

export function LetterFormCard({
  letter,
  index,
  total,
  disabled,
  onChange,
  onMergePrevious,
  onMergeNext,
  onRemove
}: Props) {
  const update = (patch: Partial<LetterRecord>) => onChange({ ...letter, ...patch });
  const missingNote = !letter.note.trim();
  const [pagesInput, setPagesInput] = useState(formatPageRange(letter.source_pages));
  const [pagesError, setPagesError] = useState<string | null>(null);

  useEffect(() => {
    setPagesInput(formatPageRange(letter.source_pages));
    setPagesError(null);
  }, [letter.source_pages]);

  function commitPages(value: string) {
    try {
      const pages = parsePageRange(value);
      setPagesError(null);
      setPagesInput(formatPageRange(pages));
      update({ source_pages: pages });
    } catch (error) {
      setPagesError(error instanceof Error ? error.message : 'Invalid page range.');
    }
  }

  function insertInquiryPhrase(phrase: string) {
    update({ inquiry: appendPhrase(letter.inquiry, phrase) });
  }

  return (
    <section className="letterCard">
      <div className="letterCardHeader">
        <div className="letterMetaRow">
          <h3 className="letterTitle">{letter.letter_id}</h3>
          <span className="pagePill">Pages</span>
          <input
            id={`${letter.letter_id}-pages`}
            className="pageInlineInput"
            value={pagesInput}
            aria-label={`Source pages for ${letter.letter_id}`}
            aria-invalid={Boolean(pagesError)}
            disabled={disabled}
            onChange={(event) => {
              setPagesInput(event.target.value);
              if (pagesError) setPagesError(null);
            }}
            onBlur={(event) => commitPages(event.target.value)}
            placeholder="1 or 1-3"
          />
          {pagesError ? <div className="fieldError">{pagesError}</div> : null}
        </div>
        <div className="cardActions">
          <button
            onClick={onMergePrevious}
            disabled={disabled || index === 0}
            title="Merge this letter into the previous one"
          >
            Merge previous
          </button>
          <button
            onClick={onMergeNext}
            disabled={disabled || index === total - 1}
            title="Merge this letter with the next one"
          >
            Merge next
          </button>
          <button className="dangerButton" onClick={onRemove} disabled={disabled || total <= 1}>
            Remove
          </button>
        </div>
      </div>

      <div className="formGrid">
        <div>
          <label htmlFor={`${letter.letter_id}-name`}>Full name</label>
          <input
            id={`${letter.letter_id}-name`}
            value={letter.full_name}
            disabled={disabled}
            onChange={(event) => update({ full_name: event.target.value })}
            placeholder="Filled by Gemini"
          />
        </div>

        <div>
          <label htmlFor={`${letter.letter_id}-location`}>Location</label>
          <input
            id={`${letter.letter_id}-location`}
            value={letter.location}
            disabled={disabled}
            onChange={(event) => update({ location: event.target.value })}
            placeholder="City, Country"
          />
        </div>

        <div className="fieldFull">
          <label htmlFor={`${letter.letter_id}-inquiry`}>Inquiry</label>
          <div className="inquiryComposer">
            <textarea
              id={`${letter.letter_id}-inquiry`}
              value={letter.inquiry}
              disabled={disabled}
              onChange={(event) => update({ inquiry: event.target.value })}
              placeholder="Filled by Gemini after notes are entered"
            />
            <div className="inquiryPhraseButtons" aria-label="Insert inquiry phrases">
              {INQUIRY_PHRASE_BUTTONS.map((button) => (
                <button
                  key={button.id}
                  type="button"
                  className="inquiryPhraseButton"
                  disabled={disabled}
                  onClick={() => insertInquiryPhrase(button.phrase)}
                  title={button.phrase}
                >
                  {button.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label htmlFor={`${letter.letter_id}-note`}>Note {missingNote ? '(required)' : ''}</label>
          <textarea
            id={`${letter.letter_id}-note`}
            className={missingNote ? 'noteRequired' : ''}
            autoFocus
            value={letter.note}
            disabled={disabled}
            onChange={(event) => update({ note: event.target.value })}
            placeholder="Type exact note here. Use Dua for prayers only."
          />
        </div>

        <div>
          <label htmlFor={`${letter.letter_id}-prayer`}>Prayer sentence</label>
          <textarea
            id={`${letter.letter_id}-prayer`}
            value={letter.prayer_sentence}
            disabled={disabled}
            onChange={(event) => update({ prayer_sentence: event.target.value })}
            placeholder="Filled by Gemini after notes are entered"
          />
        </div>
      </div>
    </section>
  );
}
