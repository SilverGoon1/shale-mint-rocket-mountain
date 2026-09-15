import { useEffect, useId, useRef, useState } from "react";
import { suggestDeliveryAddresses } from "@/lib/shop-server";
import type { AddressSuggestion } from "@/lib/geo";

export function AddressSuggest({
  street,
  onStreetChange,
  onPick,
  placeholder = "Start typing a street",
  disabled,
}: {
  street: string;
  onStreetChange: (value: string) => void;
  onPick: (hit: AddressSuggestion) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const listId = useId();
  const box = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<AddressSuggestion[]>([]);
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);
  const skip = useRef(false);

  useEffect(() => {
    if (skip.current) {
      skip.current = false;
      return;
    }
    const q = street.trim();
    if (disabled || q.length < 3) {
      setHits([]);
      setOpen(false);
      return;
    }
    const t = window.setTimeout(() => {
      setBusy(true);
      void suggestDeliveryAddresses({ data: { query: q } })
        .then((r) => {
          setHits(r.hits);
          setActive(0);
          setOpen(r.hits.length > 0);
        })
        .catch(() => {
          setHits([]);
          setOpen(false);
        })
        .finally(() => setBusy(false));
    }, 320);
    return () => window.clearTimeout(t);
  }, [street, disabled]);

  useEffect(() => {
    function hide(e: MouseEvent) {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", hide);
    return () => document.removeEventListener("mousedown", hide);
  }, []);

  function pick(hit: AddressSuggestion) {
    skip.current = true;
    setOpen(false);
    setHits([]);
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
          onStreetChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
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
      {open && hits.length ? (
        <ul className="addr-suggest-list" id={listId} role="listbox">
          {hits.map((hit, i) => (
            <li key={`${hit.lat}-${hit.lng}-${hit.street}`} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={i === active}
                data-on={i === active ? "true" : undefined}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(hit)}
              >
                <strong>{hit.street || hit.label.split(",")[0]}</strong>
                <em>
                  {[hit.city, hit.county, hit.zip].filter(Boolean).join(" · ")}
                  {hit.deliverable ? " · We deliver" : ""}
                </em>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
