# South End Pizza — App transition report
**Date:** 2026-09-11 ~4:43 PM ET  
**Audience:** Silvergoon (CoS)  
**Live site:** https://southendpizza.app (Vercel production, GitHub `shale-mint-rocket-mountain` @ `40bbcb3`)  
**Domain:** Squarespace DNS → Vercel (no Squarespace/Grok HTTP redirect)

---

## Executive summary

Turning South End into an “app” should be done in **two layers**:

| Layer | Who | Form | Goal |
|-------|-----|------|------|
| **Customer app** | Guests | **PWA** (Add to Home Screen) | Icon on phone, order flow, **order-ready push notifications** |
| **Desk / POS shell** | Staff tablets | Same web app (standalone) + later optional Capacitor | Orders, **receipt printer over Wi‑Fi/LAN** (primary), Bluetooth only as fallback |

You do **not** need the App Store / Play Store for v1. The site is already installable as a web app; branding and a real service worker (for push) are the missing pieces.

**Printer reality check:** kitchen/counter printers work best over **Wi‑Fi/LAN (Epson ePOS HTTP 8008 / HTTPS 8043)**, not customer-facing Bluetooth. Web Bluetooth is limited, flaky on iOS, and a poor primary for production receipts. Keep Bluetooth as a secondary/experimental path; buy GO for Epson TM‑m30III LAN remains **HOLD** until you reopen it.

---

## 1. What “app” means here

### Recommended: Progressive Web App (PWA)
- Customer opens `southendpizza.app` in Safari/Chrome → **Add to Home Screen / Install app**
- Opens full-screen (`display: standalone`) like a native app
- Can request **Notifications**, **Geolocation**, and (on supported browsers) **Bluetooth**
- Same codebase you already deploy on Vercel — no separate store review cycle

### Later (only if needed): Capacitor / native wrapper
- Export → wrap in Capacitor → App Store / Play Store
- Needed if you want store listing, deeper Bluetooth stacks, or OS APIs the browser won’t give (esp. reliable iOS Bluetooth printing)
- **Parked** until PWA + LAN printer are boringly solid

---

## 2. Live audit (today)

| Item | Status on `southendpizza.app` |
|------|-------------------------------|
| Serves from Vercel | ✅ HTTP 200, `server: Vercel` |
| Manifest | ✅ `/__grok/manifest.webmanifest` |
| Manifest brand | ❌ Still `"Grok App"` / `"Grok App"` |
| Icons | ⚠️ Only 180×180; Android wants 192 + 512 (+ maskable) |
| Theme | ⚠️ `#000000` (not South End cream/brand) |
| `/install` | ✅ Live (install tutorial route) |
| Service worker | ❌ No `/sw.js` (or equivalent) — **blocks reliable Web Push + weakens Android “Install app”** |
| Permissions-Policy | ✅ `bluetooth=*`, `usb=*`, `serial=*`, `hid=*`, `geolocation=(self)` |
| Notifications in Permissions-Policy | ❌ **Not listed yet** — add `notifications=(self)` before shipping push |
| Apex vs www | Both live, no canonical redirect (per your choice) |

**Bottom line:** the platform chrome for “install me” exists; brand + service worker + notification permission plumbing do not.

---

## 3. Permissions map (what to ask, when, whom)

### Customer (guest PWA)

| Permission | Purpose | When to prompt | Notes |
|------------|---------|----------------|-------|
| **Notifications** | “Your order is ready” / out for delivery | After place-order or on `/install` with clear copy + button | Needs **HTTPS + service worker + user gesture**. iOS 16.4+ supports Web Push for installed PWAs |
| **Geolocation** | “Use my location” for delivery | Only on tap | Already allowed in headers |
| Camera / mic | — | Skip v1 | |
| Bluetooth | — | **Do not** prompt customers | Printer is staff-side |

### Staff / POS (desk tablet)

| Permission | Purpose | When to prompt | Notes |
|------------|---------|----------------|-------|
| **Bluetooth** | Pair BLE printer (fallback) | Admin → Printer settings, explicit “Connect printer” | Web Bluetooth: Chrome/Android OK-ish; **Safari/iOS largely no**. Headers already allow `bluetooth=*` |
| **Wi‑Fi / LAN** (not a browser permission) | Epson ePOS to printer IP | Admin Settings: printer IP + Test print | Primary path. Ports **8008 (HTTP)** / **8043 (HTTPS)**; HTTPS needs printer cert trust runbook |
| Notifications (optional) | New order ping on desk | Staff toggle in Admin | Same SW/push infra as customers, different topics |

**Browser quirk:** Permissions-Policy alone does not show a prompt. The page must call `Notification.requestPermission()` / `navigator.bluetooth.requestDevice()` after a user tap. Headers only stop the browser from blocking the API.

---

## 4. Customer notifications — architecture

**Goal:** customer gets a push when order is **Ready** (and optionally Accepted / Out for delivery).

```
POS marks Ready
    → server writes order status + enqueue push job
    → Web Push (VAPID) to customer's subscription
    → service worker shows notification
    → tap opens /orders/:id (or tracking screen)
```

### Build pieces
1. **Service worker** registered from the app origin (`southendpizza.app`)
2. **Push subscription** stored per logged-in (or order-token) customer
3. **VAPID keys** in Vercel env (never in client bundle secrets beyond public key)
4. **Server sender** on status transition (Ready / Out for delivery)
5. **UX:** “Enable order alerts” after checkout — never on first paint
6. **Fallback:** SMS/email OTP channel already in stack thoughts (Resend) if push denied

### Platform notes
- **Android Chrome:** solid once SW + manifest icons are right
- **iOS Safari:** user must **Add to Home Screen** first; then notifications can work (16.4+)
- Without SW, you cannot do real push — in-app toasts only while the tab is open

---

## 5. Printer — Bluetooth vs Wi‑Fi

### Primary (recommended): Wi‑Fi / LAN — Epson ePOS
- Models already in plan: **Epson TM‑m30 / TM‑m30III**
- Browser talks to printer on local network via **ePOS-Print JS**
- Admin Settings: printer IP + Test print (soft-open already OK to exercise; **hardware buy HOLD**)
- Completes must **never** block on print fail (queue + retry) — existing POS lock
- Stripe / payments stay separate; print ≠ paid

### Secondary: Bluetooth
- **Web Bluetooth** to BLE/SPP-ish printers: possible on Chromium + Android; poor on iPhone
- Fine as “Connect Bluetooth printer” in Admin for a spare Android tablet
- Not the production kitchen path for South End counter

### Wi‑Fi vs Bluetooth decision

| | Wi‑Fi / LAN ePOS | Web Bluetooth |
|--|------------------|---------------|
| Reliability | High on shop LAN | Medium / device-dependent |
| iPad POS | Works (network) | Often blocked |
| Setup | Enter IP once | Pair each device |
| Multi-tablet | Shared printer IP | Per-browser pairing |
| Recommendation | **Ship this** | Fallback / experiment |

**Buy status:** Epson TM‑m30III LAN purchase remains **HOLD** (you skipped buy widgets). Soft-open: configure IP + test print when hardware appears; no auto re-ask.

---

## 6. Phased ship plan

### Phase 0 — Already done
- [x] Custom domain on Vercel (`southendpizza.app` + `www`)
- [x] Squarespace DNS → Vercel A/CNAME
- [x] Manifest + `/install` routes exist
- [x] Permissions-Policy allows bluetooth / geolocation / USB-related

### Phase 1 — “Looks like our app” (Build paste)
1. Manifest: `name` = **South End Pizza**, `short_name` = **South End**
2. Icons: 180 / 192 / 512 (+ maskable)
3. `theme_color` / `background_color` to brand cream (not black unless intentional)
4. Keep `display: standalone`, `start_url: /`
5. Phone smoke: Add to Home Screen shows **South End**, not Grok App

### Phase 2 — Order-ready notifications (customer)
1. Add `notifications=(self)` to Permissions-Policy
2. Ship service worker + Web Push (VAPID) + subscription API
3. Hook POS **Ready** (and optional status) → push
4. `/install` + post-checkout “Enable alerts” copy
5. Test: Android install + iOS A2HS + deny-path fallback

### Phase 3 — Staff printer (Wi‑Fi first)
1. Admin Settings: printer IP, protocol HTTP/HTTPS, Test print
2. ePOS receipt stack (Sub→Discount→Delivery→Tax→Tip→Total); Paid green / Unpaid amber
3. Print queue; Completes independent of print
4. HTTPS 8043 cert install runbook for tablets
5. **Buy GO** for TM‑m30III when you want hardware (widget via CoS)

### Phase 4 — Bluetooth printer (optional)
1. Admin “Connect Bluetooth printer” (Chromium/Android)
2. Feature-detect; hide on unsupported browsers
3. Same receipt payload as LAN path

### Phase 5 — Native stores (parked)
- Capacitor wrapper only if store presence or iOS Bluetooth printing becomes a hard requirement

---

## 7. Security & ops

- All sensitive APIs on HTTPS only; push private key server-side
- Don’t request Bluetooth/Notifications on the marketing homepage
- Staff printer IP is LAN-only; never expose ePOS ports to the public internet
- Desk Admin grants stay as today; printer settings behind authenticated Admin
- PWA updates = normal Vercel deploys; SW needs a sane update strategy (`skipWaiting` carefully)

---

## 8. Effort / sequencing (practical)

| Workstream | Rough effort | Depends on |
|------------|--------------|------------|
| PWA branding (manifest/icons) | Small (1 Build paste) | None — can ship next |
| Service worker + Web Push | Medium | Branding helpful; VAPID env |
| Ready → notify hook | Small–medium | Push infra + stable order status events |
| LAN ePOS Settings + test print | Medium | Soft-open already contemplated |
| Hardware buy + cert runbook | Decision + ops | Your GO (currently HOLD) |
| Bluetooth fallback | Small–medium | LAN path first |
| Capacitor / stores | Large | Only if PWA insufficient |

Suggested order: **Phase 1 → 2 → 3 → 4**. Do not wait on printer buy to brand the customer app or ship notifications.

---

## 9. Acceptance checklist

**Customer app**
- [ ] Home screen name/icon = South End Pizza
- [ ] Opens standalone from icon
- [ ] “Enable order alerts” → permission → test Ready push received
- [ ] Works after kill/reopen of the PWA

**Printer**
- [ ] Admin can save printer IP and Test print on shop Wi‑Fi
- [ ] Accept/Complete never stuck on print failure
- [ ] Bluetooth path labeled fallback; hidden where unsupported

**Headers**
- [ ] `permissions-policy` includes `notifications=(self)` when push ships
- [ ] Bluetooth remains staff-triggered only

---

## 10. CoS recommendation

1. **Approve Phase 1 PWA branding** in the next Build paste (cheap, visible win).
2. **Approve Phase 2 notifications** as the real “app” value for customers.
3. Keep **printer buy HOLD** until you want hardware; continue LAN-first design.
4. Treat **Bluetooth** as POS fallback, not the customer app story.
5. Skip App Store until PWA + push + LAN print are proven in the shop.

---

*Sources: live curl of southendpizza.app (2026-09-11), prior `SOUTHEND_PWA_SETUP.md`, POS/Finance `PRINTER_PAYMENTS_PLAN.md`, Vercel domain config (Squarespace DNS).*
