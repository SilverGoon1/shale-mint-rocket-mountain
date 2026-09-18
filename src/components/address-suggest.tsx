import { useEffect, useId, useRef, useState } from "react";
import { suggestDeliveryAddresses } from "@/lib/shop-server";
import type { AddressSuggestion } from "@/lib/geo";

export function AddressSuggest({
  street,
  onStreetChange,
  onPick,
  placeholder = "Start typing a street",
  disabled,
  suppress = false,
}: {
  street: string;
  onStreetChange: (value: string) => void;
  onPick: (hit: AddressSuggestion) => void;
  placeholder?: string;
  disabled?: boolean;
  /** When true: close list, clear hits, skip lookups (e.g. after Save / delivery confirm). Parent clears when the user edits the street. */
  suppress?: boolean;
}) {
  const listId = useId();
  const box = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<AddressSuggestion[]>([]);
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);
  const [lookupFail, setLookupFail] = useState(false);
  /** Stay true after pick until the user types again (avoids reopen on programmatic street fills). */
  const skipUntilType = useRef(false);
  /** Monotonic id so stale suggestDeliveryAddresses responses are ignored. */
  const reqGen = useRef(0);
  /** Lookups stay off until the customer clicks the street field. */
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed || suppress || skipUntilType.current) {
      reqGen.current += 1;
      setHits([]);
      setOpen(false);
      setLookupFail(false);
      setBusy(false);
      return;
    }
    const q = street.trim();
    if (disabled || q.length < 3) {
      reqGen.current += 1;
      setHits([]);
      setOpen(false);
      setLookupFail(false);
      setBusy(false);
      return;
    }
    const gen = ++reqGen.current;
    const t = window.setTimeout(() => {
      setBusy(true);
      setLookupFail(false);
      void suggestDeliveryAddresses({ data: { query: q } })
        .then((r) => {
          if (gen !== reqGen.current) return;
          setHits(r.hits);
          setActive(0);
          setOpen(r.hits.length > 0);
          setLookupFail(r.hits.length === 0);
        })
        .catch(() => {
          if (gen !== reqGen.current) return;
          setHits([]);
          setOpen(false);
          setLookupFail(true);
        })
        .finally(() => {
          if (gen !== reqGen.current) return;
          setBusy(false);
        });
    }, 320);
    return () => {
      window.clearTimeout(t);
      // Invalidate in-flight / pending work for this generation.
      if (reqGen.current === gen) reqGen.current += 1;
    };
  }, [street, disabled, suppress, armed]);

  useEffect(() => {
    function hide(e: MouseEvent) {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", hide);
    return () => document.removeEventListener("mousedown", hide);
  }, []);

  function pick(hit: AddressSuggestion) {
    skipUntilType.current = true;
    reqGen.current += 1;
    setHits([]);
    setOpen(false);
    setLookupFail(false);
    setBusy(false);
    onPick(hit);
  }

  return (
    <div className="addr-suggest" ref={box}>
      <input
        className="ed-input"
        value={street}
        disabled={disabled}
        autoComplete="off"
        placeholder={placeholder}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        onChange={(e) => {
          skipUntilType.current = false;
          onStreetChange(e.target.value);
          if (!suppress && armed) setOpen(true);
        }}
        onClick={() => setArmed(true)}
        onFocus={() => {
          setArmed(true);
          if (suppress || skipUntilType.current) return;
          if (hits.length) setOpen(true);
        }}
        onKeyDown={(e) => {
          if (!open || !hits.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((n) => (n + 1) % hits.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((n) => (n - 1 + hits.length) % hits.length);
          } else if (e.key === "Enter" && hits[active]) {
            e.preventDefault();
            pick(hits[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {busy ? <span className="addr-suggest-busy">Looking up streets…</span> : null}
      {!busy && lookupFail ? (
        <p className="addr-suggest-empty ed-sub">Could not look up addresses. Type the street and city or call the shop.</p>
      ) : null}
      {open && hits.length ? (
        <ul className="addr-suggest-list" id={listId} role="listbox">
          {hits.map((hit, i) => (
            <li key={`${hit.lat}-${hit.lng}-${hit.street}`} role="presentation">
              <button
                type="button"
                role="option"
                draggable={false}
                aria-selected={i === active}
                data-on={i === active ? "true" : undefined}
                onMouseEnter={() => setActive(i)}
                onDragStart={(e) => e.preventDefault()}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => pick(hit)}
              >
                <strong>{hit.street || hit.label.split(",")[0]}</strong>
                <em>
                  {[hit.city, hit.county, hit.zip].filter(Boolean).join(" · ")}
                  {hit.deliverable ? " · We deliver" : " · Delivery unavailable"}
                </em>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
