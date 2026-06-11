export type CompoundNavProps = {
  ariaLabel: string;
  prevLabel?: string;
  nextLabel?: string;
  prevDisabled: boolean;
  nextDisabled: boolean;
  onPrev: () => void;
  onNext: () => void;
  prevTestId?: string;
  nextTestId?: string;
};

export function CompoundNav({
  ariaLabel,
  prevLabel = "Previous",
  nextLabel = "Next",
  prevDisabled,
  nextDisabled,
  onPrev,
  onNext,
  prevTestId,
  nextTestId,
}: CompoundNavProps) {
  return (
    <nav className="lk-compound-nav" aria-label={ariaLabel}>
      <button
        type="button"
        className="lk-button"
        data-testid={prevTestId}
        disabled={prevDisabled}
        onClick={onPrev}
      >
        {prevLabel}
      </button>
      <button
        type="button"
        className="lk-button"
        data-testid={nextTestId}
        disabled={nextDisabled}
        onClick={onNext}
      >
        {nextLabel}
      </button>
    </nav>
  );
}
