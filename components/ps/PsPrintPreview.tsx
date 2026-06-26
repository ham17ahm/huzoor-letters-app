'use client';

import { useEffect, useState } from 'react';
import type { PsLetterRecord } from '@/types/ps';
import { formatHmDate } from '@/lib/date';
import { PRINT_HEADER_LOCATION, PRINT_TEMPLATE_TEXT } from '@/lib/printConfig';
import styles from '@/components/PrintPreview.module.css';

type Props = {
  letters: PsLetterRecord[];
  onClose: () => void;
};

export function PsPrintPreview({ letters, onClose }: Props) {
  const [hmDate, setHmDate] = useState('');

  useEffect(() => {
    setHmDate(formatHmDate());
  }, []);

  return (
    <div className={styles.screen}>
      <div className={styles.toolbar}>
        <div style={{ font: '12px/1.4 system-ui, sans-serif', color: '#444' }}>
          <strong>{letters.length}</strong> letter(s)
        </div>
        <div className={styles.toolbarControls}>
          <label htmlFor="print-date" style={{ margin: 0, fontWeight: 600 }}>
            {PRINT_TEMPLATE_TEXT.dateLabel}
          </label>
          <input id="print-date" value={hmDate} onChange={(event) => setHmDate(event.target.value)} />
          <button onClick={() => window.print()}>{PRINT_TEMPLATE_TEXT.printButtonLabel}</button>
          <button onClick={onClose}>{PRINT_TEMPLATE_TEXT.closeButtonLabel}</button>
        </div>
      </div>

      {letters.map((letter, index) => (
        <article className={styles.container} aria-label={`Letter ${index + 1}`} key={`${letter.letter_id}-${index}`}>
          <div className={styles.content}>
            <div className={styles.dateLocationCombined}>
              <div>{PRINT_HEADER_LOCATION}</div>
              <div className={styles.date}>{hmDate}</div>
            </div>

            <div className={`${styles.titleFullName} ${styles.text}`}>
              <div className={`${styles.title} ${styles.text}`}>{PRINT_TEMPLATE_TEXT.salutationPrefix}&nbsp;</div>
              <div className={`${styles.fullName} ${styles.text}`}>
                {letter.full_name || PRINT_TEMPLATE_TEXT.fallbackValue},
              </div>
            </div>

            <div className={styles.salam}>{PRINT_TEMPLATE_TEXT.salam}</div>

            <div className={`${styles.introText} ${styles.text}`}>
              {letter.inquiry || PRINT_TEMPLATE_TEXT.defaultInquiry}
            </div>

            <div className={`${styles.mainText} ${styles.text}`} style={{ lineHeight: 1.2 }}>
              <p>{letter.prayer_sentence || PRINT_TEMPLATE_TEXT.defaultPrayer}</p>
            </div>

            <div className={styles.wassalam}>{PRINT_TEMPLATE_TEXT.wassalam}</div>
            <div className={styles.greetingEnd}>{PRINT_TEMPLATE_TEXT.closing}</div>
            <div className={styles.signature}>{PRINT_TEMPLATE_TEXT.signature}</div>
            <div className={styles.signatureTitle}>{PRINT_TEMPLATE_TEXT.signatureTitle}</div>
          </div>

          <div className={styles.footnoteContainer}>
            <div></div>
            <div className={styles.footerLocation}>{letter.location || PRINT_TEMPLATE_TEXT.fallbackValue}</div>
          </div>
        </article>
      ))}
    </div>
  );
}
