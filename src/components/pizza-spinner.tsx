/** Pepperoni pizza loader — account / login pending only. */
export type PizzaSpinnerSize = "sm" | "md" | "lg";

export function PizzaSpinner({
  size = "md",
  label = "Loading account",
}: {
  size?: PizzaSpinnerSize;
  label?: string;
}) {
  return (
    <span className={`pizza-spinner pizza-spinner-${size}`} role="status" aria-busy="true" aria-label={label}>
      <svg viewBox="0 0 32 32" width="100%" height="100%" aria-hidden="true" focusable="false">
        <circle cx="16" cy="16" r="15" fill="#c47a2c" />
        <circle cx="16" cy="16" r="12.2" fill="#f4d27a" />
        <circle cx="16" cy="16" r="11.1" fill="#f7e3a1" />
        <circle cx="11" cy="12.2" r="2.15" fill="#b43228" />
        <circle cx="18.6" cy="10.6" r="1.85" fill="#9a221c" />
        <circle cx="21.4" cy="16.4" r="2.05" fill="#b43228" />
        <circle cx="15.2" cy="19.8" r="1.7" fill="#9a221c" />
        <circle cx="10.4" cy="18.6" r="1.55" fill="#c4473a" />
        <circle cx="17.4" cy="14.4" r="1.35" fill="#c4473a" />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function AccountLoading({
  compact,
  label = "Loading account",
}: {
  compact?: boolean;
  label?: string;
}) {
  return (
    <div className={compact ? "account-loading account-loading-compact" : "account-loading"} aria-busy="true">
      <PizzaSpinner size={compact ? "sm" : "md"} label={label} />
      {compact ? null : <p>{label}</p>}
    </div>
  );
}
