'use client';

import { useState } from 'react';
import type { LetterRecord } from '@/types/letter';
import { formatHmDate } from '@/lib/date';
import { PRINT_HEADER_LOCATION } from '@/lib/printConfig';
import styles from './PrintPreview.module.css';

type Props = {
  letters: LetterRecord[];
  onClose: () => void;
};

export function PrintPreview({ letters, onClose }: Props) {
  const [hmDate, setHmDate] = useState(formatHmDate());

  return (
    <div className={styles.screen}>
      <div className={styles.toolbar}>
        <div style={{ font: '12px/1.4 system-ui, sans-serif', color: '#444' }}>
          <strong>{letters.length}</strong> letter(s)
        </div>
        <div className={styles.toolbarControls}>
          <label htmlFor="print-date" style={{ margin: 0, fontWeight: 600 }}>
            Date
          </label>
          <input id="print-date" value={hmDate} onChange={(event) => setHmDate(event.target.value)} />
          <button onClick={() => window.print()}>Print</button>
          <button onClick={onClose}>Close</button>
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
              <div className={`${styles.title} ${styles.text}`}>Dear&nbsp;</div>
              <div className={`${styles.fullName} ${styles.text}`}>{letter.full_name || 'N/A'},</div>
            </div>

            <div className={styles.salam}>اَلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللهِ وَبَرَكَاتُه</div>

            <div className={`${styles.introText} ${styles.text}`}>{letter.inquiry || 'I have received your letter.'}</div>

            {letter.note.trim().toLowerCase() !== 'dua' && letter.note.trim() ? (
              <div className={`${styles.noteText} ${styles.text}`}>{letter.note}</div>
            ) : null}

            <div className={`${styles.mainText} ${styles.text}`} style={{ lineHeight: 1.2 }}>
              <p>{letter.prayer_sentence || 'May Allah Taala bless you in every way. Amin'}</p>
            </div>

            <div className={styles.wassalam}>Wassalam</div>
            <div className={styles.greetingEnd}>Yours sincerely,</div>
            <div className={styles.signature}>MIRZA MASROOR AHMAD</div>
            <div className={styles.signatureTitle}>Khalifatul-Masih V</div>
          </div>

          <div className={styles.footnoteContainer}>
            <div></div>
            <div className={styles.footerLocation}>{letter.location || 'N/A'}</div>
          </div>
        </article>
      ))}
    </div>
  );
}
