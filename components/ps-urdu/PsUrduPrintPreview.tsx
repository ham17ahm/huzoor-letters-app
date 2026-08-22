'use client';

import { useState } from 'react';
import styles from '@/components/ps-urdu/PsUrduPrintPreview.module.css';
import type { PsUrduLetterRecord } from '@/types/psUrdu';

type Props = {
  letters: PsUrduLetterRecord[];
  onClose: () => void;
};

export function PsUrduPrintPreview({ letters, onClose }: Props) {
  const [displayDate, setDisplayDate] = useState(() => formatDate());

  return (
    <main className={styles.preview}>
      <div className={`${styles.toolbar} no-print`}>
        <span>
          <strong>{letters.length}</strong> letter(s)
        </span>
        <label className={styles.dateControl} htmlFor="ps-urdu-print-date">
          Date
          <input
            id="ps-urdu-print-date"
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
        <PsUrduLetter key={letter.letter_id} letter={letter} displayDate={displayDate} />
      ))}
    </main>
  );
}

function PsUrduLetter({
  letter,
  displayDate
}: {
  letter: PsUrduLetterRecord;
  displayDate: string;
}) {
  const paragraphs = [letter.inquiry, letter.prayer_sentence].flatMap((text) =>
    text
      .split(/\r?\n+/u)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
  );

  return (
    <article
      className={styles.letterContainer}
      lang="ur"
      dir="rtl"
      aria-label={`PS Urdu reply ${letter.letter_id}`}
    >
      <div className={styles.pageHead}>
        <div className={`${styles.letterheadBismillah} ${styles.htc}`}>
          بِسْمِ اللہِ الرَّحْمٰنِ الرَّحِیْمِ ––– نَحْمَدُہ وَنُصَلِّی عَلیٰ رَسُوْلِەِ الْکَرِیْم
        </div>
        <div className={`${styles.letterheadBismillah} ${styles.htc}`}>
          وَعَلیٰ عَبْدِہِ الْمَسِیْح الْمَوْعُوْد
        </div>
        <div className={`${styles.letterheadHeading} ${styles.htc}`}>پرائیویٹ سیکرٹری</div>
        <div className={`${styles.letterheadHeading} ${styles.htc}`}>
          حضرت خلیفۃ المسیح الخامس
        </div>
        <div className={`${styles.letterheadHeadingSmall} ${styles.htc}`}>
          ایدہ اللہ تعالیٰ بنصرہ العزیز
        </div>
        <div className={`${styles.letterheadHeadingIslamabad} ${styles.htc}`}>
          اسلام آباد۔یوکے –– HM – {displayDate}
        </div>
      </div>

      <div className={styles.topPage}>
        <div className={`${styles.titleFullname} ${styles.text}`}>
          <div className={`${styles.fullName} ${styles.text}`}>{letter.full_name}</div>
        </div>

        <div className={styles.salam}>السلام علیکم ورحمۃ اللہ وبرکاتہ</div>

        <div className={`${styles.mainText} ${styles.text}`}>
          {paragraphs.map((paragraph, index) => (
            <p key={`${letter.letter_id}-paragraph-${index}`}>{paragraph}</p>
          ))}
        </div>

        <div className={styles.wassalam}>والسلام</div>
        <div className={styles.greetingEnd}>خاکسار</div>
        <div className={styles.signatureTitle}>پرائیویٹ سیکرٹری</div>
      </div>

      <div className={styles.footnoteContainer}>{letter.location}</div>
    </article>
  );
}

function formatDate(date = new Date()): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${date.getFullYear()}`;
}
