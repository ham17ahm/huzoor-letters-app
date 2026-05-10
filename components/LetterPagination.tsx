'use client';

type Props = {
  currentIndex: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
};

export function LetterPagination({ currentIndex, total, onPrevious, onNext }: Props) {
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < total - 1;

  return (
    <div className="letterPagination" aria-label="Letter navigation">
      <button onClick={onPrevious} disabled={!canGoPrevious}>
        Previous
      </button>
      <div className="letterPaginationLabel">
        Letter {currentIndex + 1} of {total}
      </div>
      <button onClick={onNext} disabled={!canGoNext}>
        Next
      </button>
    </div>
  );
}
