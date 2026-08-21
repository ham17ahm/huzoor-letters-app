'use client';

import styles from '@/components/dua-urdu/DuaUrduPrintPreview.module.css';
import type { DuaUrduLetterRecord } from '@/types/duaUrdu';

type Props = {
  letters: DuaUrduLetterRecord[];
  onClose: () => void;
};

const PRINT_FIELDS = [
  { key: 'location', label: 'جگہ' },
  { key: 'full_name', label: 'مکمل نام' },
  { key: 'inquiry', label: 'ابتدائیہ' },
  { key: 'prayer_sentence', label: 'دعائیہ جواب' }
] as const;

export function DuaUrduPrintPreview({ letters, onClose }: Props) {
  return (
    <main className={styles.preview}>
      <div className={styles.toolbar}>
        <span>
          <strong>{letters.length}</strong> letter(s)
        </span>
        <div className={styles.actions}>
          <button onClick={() => window.print()}>Print</button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>

      {letters.map((letter) => (
        <article
          key={letter.letter_id}
          className={styles.page}
          lang="ur"
          dir="rtl"
          aria-label={`Urdu reply ${letter.letter_id}`}
        >
          {PRINT_FIELDS.map((field) => (
            <section key={field.key} className={styles.field}>
              <h2 className={styles.label}>{field.label}</h2>
              <p className={styles.value}>{letter[field.key]}</p>
            </section>
          ))}
        </article>
      ))}
    </main>
  );
}
