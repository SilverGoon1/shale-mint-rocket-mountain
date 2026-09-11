# Category carousel — flush arrows, sticky search, click pulse
SoT: grok.me

## Must
1. ≤640px: L/R arrows flush to rail (~4–8px inset), ≥44px hit, no label clip
2. ≥1024px: calmer inset (~12–16px) — not edge-glued
3. Search cell sticky with category rail while menu scrolls
4. Arrow click pulse ~180–220ms (scale/ring); honor prefers-reduced-motion
5. Don’t regress pill scroll/truncation

## Must not
auth/Neon/bots/card/POS/zones; clip category names; cover item CTAs

## Hints
category rail (pills+chevrons+Search); sticky top under header; responsive arrow padding; pulse keyframes on press

## Acceptance
mobile flush + sticky Search; desktop tasteful; pulse on click

## ADD (Silvergoon)
6. When customer scrolls the menu, the **selected/active category pill must shift to the horizontal center** of the sticky rail (smooth). Same after tapping a pill.
7. Use `scrollIntoView({ inline: 'center', behavior: 'smooth' })` on active chip when scroll-spy section changes.
