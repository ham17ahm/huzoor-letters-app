'use client';

import { useState } from 'react';
import styles from '@/components/dua-urdu/DuaUrduPrintPreview.module.css';
import { formatHmDate } from '@/lib/date';
import type { DuaUrduLetterRecord } from '@/types/duaUrdu';

type Props = {
  letters: DuaUrduLetterRecord[];
  onClose: () => void;
};

export function DuaUrduPrintPreview({ letters, onClose }: Props) {
  const [displayDate, setDisplayDate] = useState(() => formatHmDate());

  return (
    <main className={styles.preview}>
      <div className={`${styles.toolbar} no-print`}>
        <span>
          <strong>{letters.length}</strong> letter(s)
        </span>
        <label className={styles.dateControl} htmlFor="dua-urdu-print-date">
          Date
          <input
            id="dua-urdu-print-date"
            value={displayDate}
            onChange={(event) => setDisplayDate(event.target.value)}
          />
        </label>
        <div className={styles.actions}>
          <button onClick={() => window.print()}>Print</button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>

      {letters.map((letter) => (
        <UrduLetter key={letter.letter_id} letter={letter} displayDate={displayDate} />
      ))}
    </main>
  );
}

function UrduLetter({
  letter,
  displayDate
}: {
  letter: DuaUrduLetterRecord;
  displayDate: string;
}) {
  const bodyText = [letter.inquiry, letter.prayer_sentence]
    .map((text) => text.trim())
    .filter(Boolean)
    .join(' ');

  return (
    <article
      className={styles.letterContainer}
      lang="ur"
      dir="rtl"
      aria-label={`Urdu reply ${letter.letter_id}`}
    >
      <div className={styles.letterContent}>
        <div className={styles.dateLocationCombined}>
          <div className={styles.dateLocation}>اسلام آباد۔یوکے</div>
          <div className={styles.date}>{displayDate}</div>
        </div>

        <div className={`${styles.titleFullname} ${styles.text}`}>
          <div className={`${styles.fullName} ${styles.text}`}>{letter.full_name}</div>
        </div>

        <div className={`${styles.salam} ${styles.text}`}>
          السلام علیکم ورحمۃ اللہ وبرکاتہ
        </div>

        <div className={`${styles.mainText} ${styles.text}`}>
          <p>{bodyText}</p>
        </div>

        <div className={styles.wassalam}>والسلام</div>
        <div className={styles.greetingEnd}>خاکسار</div>
        <div className={styles.signatureTitle}>خلیفۃ المسیح الخامس</div>
      </div>

      <div className={styles.footnoteContainer}>{letter.location}</div>
    </article>
  );
}
