import type { RefObject } from "react";

const NOTE_PLACEHOLDER = "What's happening?";

/** Uncontrolled so typing never remounts or steals focus from the cook note. */
export function CookNoteField({
  id,
  noteRef,
  placeholder = NOTE_PLACEHOLDER,
  rows = 2,
}: {
  id: string;
  noteRef: RefObject<HTMLTextAreaElement | null>;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="ed-field pizza-modal-block pizza-cook-field">
      <label htmlFor={id}>Note for the cook</label>
      <textarea
        id={id}
        ref={noteRef}
        className="ed-input ed-area"
        rows={rows}
        maxLength={160}
        defaultValue=""
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="on"
        spellCheck
        enterKeyHint="done"
        onPointerDown={(e) => e.stopPropagation()}
        onFocus={(e) => {
          const el = e.currentTarget;
          window.requestAnimationFrame(() => el.scrollIntoView({ block: "center", inline: "nearest" }));
        }}
      />
    </div>
  );
}

export function cookNoteValue(ref: RefObject<HTMLTextAreaElement | null>) {
  return (ref.current?.value ?? "").trim().slice(0, 160);
}
