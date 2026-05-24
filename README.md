# Lagoon App

Expo + Supabase app with guest/host flows, maps, notifications, and Stripe Connect payments.

## Prerequisites

- Node.js 20+
- npm
- Expo CLI (`npx expo`)
- Supabase project
- Stripe account (test mode for setup)

## Local setup

1. Install deps:

```bash
npm install
```

2. Create `.env` from `.env.example` and fill values:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Maps keys (`EXPO_PUBLIC_GOOGLE_*`) if you use maps/search

3. (Android push) put `google-services.json` in project root.

4. Start app:

```bash
npx expo start
```

## Stripe integration status

Implemented in repo:

- Guest payment sheet (native): `app/(tabs)/guest/Payment.tsx`
- Web fallback (card disabled): `lib/useStripeClient.web.ts`
- Host onboarding UI: `app/(host)/profile.tsx`
- Supabase Edge Functions:
  - `stripe-create-connected-account`
  - `stripe-create-account-link`
  - `stripe-create-payment-intent`
  - `stripe-webhook`
  - `stripe-return`
- DB migration: `supabase/migrations/20260403090000_stripe_connect.sql`

## What must be configured outside the app

### 1) Supabase secrets for Edge Functions

Set these in Supabase project secrets:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- Optional: `STRIPE_WEBHOOK_SECRET_CONNECT`
- Optional: `PLATFORM_FEE_PERCENT` (default 20)

### 2) Deploy functions

Deploy all Stripe functions to Supabase.

### 3) Stripe webhooks

Create webhook endpoint for your deployed `stripe-webhook` function and subscribe at least to:

- `account.updated`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

Copy webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

### 4) Expo/EAS public env

Set `EXPO_PUBLIC_*` variables for builds (do not store keys in `eas.json`).

## Quick verification flow

1. Host opens profile and activates payments (Stripe onboarding).
2. Guest books and pays by card.
3. Booking row stores `payment_intent_id` and status updates to `paid`.
4. Webhook updates payment status for success/failure events.

## Notes

- Card payments are intentionally disabled on web in current implementation.
- Keep `.env` and credentials out of git.
