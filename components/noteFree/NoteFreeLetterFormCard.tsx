'use client';

import { useEffect, useState } from 'react';
import type { NoteFreeEditorConfig } from '@/components/noteFree/editorConfig';
import { applyNameAffix } from '@/lib/nameAffixes';
import { formatPageRange, parsePageRange } from '@/lib/pageRanges';
import { appendPhrase } from '@/lib/textInsertion';
import type { NoteFreeLetterRecord } from '@/types/noteFree';

type Props = {
  letter: NoteFreeLetterRecord;
  index: number;
  total: number;
  config: NoteFreeEditorConfig;
  disabled?: boolean;
  onChange: (updated: NoteFreeLetterRecord) => void;
  onMergePrevious: () => void;
  onMergeNext: () => void;
  onRemove: () => void;
};

export function NoteFreeLetterFormCard({
  letter,
  index,
  total,
  config,
  disabled,
  onChange,
  onMergePrevious,
  onMergeNext,
  onRemove
}: Props) {
  const update = (patch: Partial<NoteFreeLetterRecord>) => onChange({ ...letter, ...patch });
  const [pagesInput, setPagesInput] = useState(formatPageRange(letter.source_pages));
  const [pagesError, setPagesError] = useState<string | null>(null);
  const localizedFieldProps = {
    className: config.fieldClassName,
    dir: config.fieldDirection,
    lang: config.fieldLanguage
  };
  const identityFieldOrder = config.identityFieldOrder ?? ['fullName', 'location'];

  function labelClassName(
    field: 'fullName' | 'location' | 'inquiry' | 'prayerSentence'
  ): string | undefined {
    return [
      config.fieldClassName,
      config.visuallyHiddenLabels?.includes(field) ? 'visuallyHidden' : undefined
    ]
      .filter(Boolean)
      .join(' ') || undefined;
  }

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

  function formatFullName(buttonIndex: number) {
    const buttons = config.fullNameAffixButtons ?? [];
    const selected = buttons[buttonIndex];
    if (!selected) return;

    update({ full_name: applyNameAffix(letter.full_name, selected, buttons) });
  }

  const hasEditorActionButtons = Boolean(
    config.inquiryPhraseButtons.length || config.fullNameAffixButtons?.length
  );

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
        {identityFieldOrder.map((field) =>
          field === 'fullName' ? (
            <div key={field}>
              <label
                htmlFor={`${letter.letter_id}-name`}
                {...localizedFieldProps}
                className={labelClassName('fullName')}
              >
                {config.labels.fullName}
              </label>
              <input
                id={`${letter.letter_id}-name`}
                value={letter.full_name}
                disabled={disabled}
                onChange={(event) => update({ full_name: event.target.value })}
                placeholder={config.placeholders.fullName}
                {...localizedFieldProps}
              />
            </div>
          ) : (
            <div key={field}>
              <label
                htmlFor={`${letter.letter_id}-location`}
                {...localizedFieldProps}
                className={labelClassName('location')}
              >
                {config.labels.location}
              </label>
              <input
                id={`${letter.letter_id}-location`}
                value={letter.location}
                disabled={disabled}
                onChange={(event) => update({ location: event.target.value })}
                placeholder={config.placeholders.location}
                {...localizedFieldProps}
              />
            </div>
          )
        )}

        <div className="fieldFull">
          <label
            htmlFor={`${letter.letter_id}-inquiry`}
            {...localizedFieldProps}
            className={labelClassName('inquiry')}
          >
            {config.labels.inquiry}
          </label>
          <div className={hasEditorActionButtons ? 'inquiryComposer' : undefined}>
            <textarea
              id={`${letter.letter_id}-inquiry`}
              value={letter.inquiry}
              disabled={disabled}
              onChange={(event) => update({ inquiry: event.target.value })}
              placeholder={config.placeholders.inquiry}
              {...localizedFieldProps}
            />
            {hasEditorActionButtons ? (
              <div className="inquiryPhraseButtons" aria-label="Editor actions">
                {config.inquiryPhraseButtons.map((button) => (
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
                {config.fullNameAffixButtons?.map((button, buttonIndex) => (
                  <button
                    key={button.id}
                    type="button"
                    className="inquiryPhraseButton"
                    disabled={disabled}
                    onClick={() => formatFullName(buttonIndex)}
                    title={`${button.prefix} … ${button.suffix}`}
                  >
                    {button.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="fieldFull">
          <label
            htmlFor={`${letter.letter_id}-prayer`}
            {...localizedFieldProps}
            className={labelClassName('prayerSentence')}
          >
            {config.labels.prayerSentence}
          </label>
          <textarea
            id={`${letter.letter_id}-prayer`}
            value={letter.prayer_sentence}
            disabled={disabled}
            onChange={(event) => update({ prayer_sentence: event.target.value })}
            placeholder={config.placeholders.prayerSentence}
            {...localizedFieldProps}
          />
        </div>
      </div>
    </section>
  );
}
