# Secret Club

Browser-first PWA for private BestieVault / SquadVault clubs: emoji passcodes, locked drops, printable Club IDs, and a $4.99 lifetime VIP Club Key.

## Quick start

```bash
npm install
cp .env.example .env.local
# set PASSCODE_PEPPER + AUTH_SECRET (auto-generated if you ran vercel link)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Local data persists to `.data/store.json` when `DATABASE_URL` is unset. Neon schema lives in `src/db/schema.ts` (`npm run db:push` when linked).

## Stripe VIP

Set `STRIPE_SECRET_KEY`, `STRIPE_PRICE_VIP`, `STRIPE_WEBHOOK_SECRET`, and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. Without keys, non-production checkout grants VIP in-dev for smoke tests.
