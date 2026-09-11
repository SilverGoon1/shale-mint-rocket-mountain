# Style patch — Rotating pizza loader (account/login)
SoT: grok.me Build

## Must
- While account connecting / isPending / OAuth return / “loading account”: show rotating **pepperoni pizza** spinner/glyph (CSS ~1–1.2s/turn) — not plain cheese, not buffalo mark
- Places: header account chip + cream ticket Sign in/OAuth pending + wait-before-Try again
- aria-busy + label “Loading account”
- Clear spinner when session settles

## Must not
- Change auth / Neon / bots / card / POS / zones
- Leave spinner after settle
- Flash staff chrome during pending

## Hints
- Header account isPending
- Cream ticket loading
- Shared Spinner → PizzaSpinner variant

## Acceptance
- Slow load shows pizza ≤100ms
- Settle clears it
- Mobile ≤28px
