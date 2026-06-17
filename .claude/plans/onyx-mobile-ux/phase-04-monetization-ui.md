---
phase: 4
title: "Monetization UI"
status: completed
effort: "5h"
priority: P1
dependencies: [1, 2]
---

# Phase 4: Monetization UI

## Overview

OnlyFans-style bottom sheet paywalls, animated pricing cards, subscription tier upsell, Key purchase flow (simplified -> 2 taps), earnings dashboard, tipping UI, thank-you animations.

## Architecture

```
app/
├── components/
│   ├── PaywallSheet.tsx      NEW: bottom sheet subscribe/unlock overlay
│   ├── TierUpgradeCard.tsx   NEW: animated comparison card + upsell
│   ├── KeyPurchaseFlow.tsx   NEW: 2-tap buy (select → confirm → QR)
│   ├── EarningsDashboard.tsx NEW: creator revenue dashboard
│   ├── TipButton.tsx         NEW: floating tip button with amounts
│   ├── ThankYouAnimation.tsx NEW: confetti/heart burst on purchase
│   ├── SubscriberBadge.tsx   NEW: exclusive badge for subscribers
│   └── CountdownTimer.tsx    NEW: limited-time offer FOMO timer
├── routes/
│   ├── tab-create.tsx        MODIFY: enhanced composer with tier selector
│   ├── checkout.tsx          REWRITE: 3-step modal flow
│   └── tab-profile.tsx       NEW: profile + earnings tab
└── hooks/
    ├── usePaywall.ts         NEW: gate check + unlock flow
    └── useEarnings.ts        NEW: revenue data + charts
```

## Requirements

### Functional
- **PaywallSheet**: bottom sheet slides up khi user taps gated content. Shows: creator avatar + name, content preview (blurred), tier options (Subscribe $X/mo OR Unlock with 1 Key), CTA button, "Maybe later" dismiss. Animation: spring from bottom, backdrop blur.
- **TierUpgradeCard**: 3-tier comparison card (Basic/Pro/Premium). Current tier highlighted green. Feature comparison table. "Upgrade" button. Animated price reveal.
- **KeyPurchaseFlow**: 2-step: (1) confirm purchase → (2) show QR code. No multi-page checkout. Progress indicator (step 1 of 2). Cancel at any step.
- **EarningsDashboard**: total earnings (this month), earnings chart (last 30 days bar chart), recent transactions list, withdraw button. Use dummy chart library or CSS-only bar chart.
- **TipButton**: floating heart/$ button on creator profile and content. Tap → amount picker bottom sheet ($1, $5, $10, $20, custom) → confirm → thank-you animation.
- **ThankYouAnimation**: confetti burst (canvas or CSS particles) + heart scale animation on successful payment/tip. Auto-dismiss after 2s.
- **SubscriberBadge**: small "SUBSCRIBER" pill on subscribed creators' content. Gold color, subtle shine animation.
- **CountdownTimer**: limited-time offer on content ("50% off first month — 2h 34m left"). Ticking seconds. Expired state.

### Non-Functional
- Bottom sheet transition 300ms via CSS `transition: translateY` (no framer-motion)
- Payment flow <3 taps to complete
- **QR code from SePay API** — `<img src={sepayQRUrl}>` (no react-qr-code, 0KB)
- **Confetti via Canvas** — custom `<canvas>` particles (~3KB, no library)
- Earnings chart: CSS-only bar chart (div heights + tailwind) — no chart library
- No additional npm deps in this phase

## Implementation Steps

1. **PaywallSheet component (CSS-only)** — `usePaywall` hook checks gate via `/api/v1/gate/check`. Sheet: `fixed bottom-0`, CSS `transition: translateY` 300ms ease-out, backdrop `bg-black/50`. Content: blurred preview via CSS `filter: blur(8px)`. "Subscribe" calls `/api/v1/payments/checkout`. "Unlock with Key" calls `/api/v1/gate/unlock`. Success → hide sheet + ThankYouAnimation + reveal content. **No framer-motion.**

2. **TierUpgradeCard** — Animated comparison: 3 columns slide in from right with stagger (50ms delay each). Features list with CheckIcon green or XIcon gray. "Save 20% annually" toggle. Current tier has green border + "Current" badge. "Upgrade" button triggers checkout.

3. **KeyPurchaseFlow (2-step)** — Two bottom sheets. Step 1: "Purchase 1 Key — 49,000 VND" (quantity selector +/-). Step 2: QR code image from SePay API (`<img src={qrUrl}>`) + "Scan with banking app". **NO react-qr-code — QR generated server-side.** Poll payment status every 3s. Success → ThankYouAnimation.

4. **EarningsDashboard** — Total card: large number + "% vs last month" green/red. Bar chart: CSS-only using div heights (max 30 bars). Transaction list: date, amount, type (subscription/key/tip). Withdraw button: calls payment API, shows "Processing (2-5 business days)".

5. **ThankYouAnimation (Canvas, ~3KB)** — Custom `<canvas>` confetti: random velocity, rotation, color particles. 2s duration, auto-cleanup canvas element. Heart icon scales up (CSS `scale(1.5)` + opacity fade). **No library, ~3KB total.**

6. **Mobile checkout rewrite** — `app/routes/checkout.tsx`: replace full-page flow with 3-step bottom sheet: (1) Tier select → (2) Payment method → (3) QR + confirmation. Each step slides in from right. Progress dots top. "Back" button returns to previous step.

## Related Code Files

- Create: `app/components/PaywallSheet.tsx`, `app/components/TierUpgradeCard.tsx`, `app/components/KeyPurchaseFlow.tsx`, `app/components/EarningsDashboard.tsx`, `app/components/TipButton.tsx`, `app/components/ThankYouAnimation.tsx`, `app/components/SubscriberBadge.tsx`, `app/components/CountdownTimer.tsx`, `app/routes/tab-profile.tsx`, `app/hooks/usePaywall.ts`, `app/hooks/useEarnings.ts`
- Modify: `app/routes/checkout.tsx`, `app/routes/tab-create.tsx`, `app/components/PaymentQR.tsx` (add QR to bottom sheet), `app/components/TierCard.tsx` (add animation)

## Success Criteria

- [x] PaywallSheet slides up on gated content tap
- [x] Subscribe CTA triggers payment flow in <3 taps
- [x] Key unlock shows QR + auto-confirms on payment
- [x] Earnings dashboard shows total + chart + transactions
- [x] Tip button triggers amount picker → confirm → confetti
- [x] ThankYouAnimation plays confetti + heart on purchase
- [x] Tier upgrade card shows comparison with animation
- [x] Countdown timer ticks in real-time
- [x] Subscriber badge visible on unlocked content
- [x] Bottom sheet accessible: swipe down to dismiss
