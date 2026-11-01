# sprint_ai

Personal insight loop: **dump → AI structures → you tick → store → practice → evidence → weekly review**.

Next.js 15 (App Router) · Supabase (Postgres + auth) · DeepSeek API · no UI framework, one stylesheet.

## Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. Without keys it still boots: `Dump` shows a setup notice and the AI
falls back to a local mock.

## Make it work

1. **Supabase** — create a project, then paste `supabase/migrations/0001_init.sql` into
   *SQL Editor → New query → Run*. It creates five tables with row-level security.
2. **Keys** — put these in `.env.local`:

   ```
   OPENROUTER_API_KEY=sk-or-…           # or DEEPSEEK_API_KEY=sk-… (OpenRouter wins if both set)
   OPENROUTER_MODEL=deepseek/deepseek-v4-flash
   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=…       # Project Settings → API Keys → Publishable key
   SUPABASE_SERVICE_ROLE_KEY=…           # optional, server only, never NEXT_PUBLIC_
   ```

   Harness-style ids (`openrouter/deepseek/deepseek-v4-flash`) are accepted — the `openrouter/`
   prefix is stripped before the request. With no key at all the app still runs on a labelled mock.

3. **Account** — open `/login`, *create account*, sign in. Then turn off sign-ups in
   *Authentication → Providers → Email → Allow new users*.

## Deploy

Push to GitHub → import in Vercel → add the same five variables → deploy. Open on iPhone,
Share → *Add to Home Screen*. It reads as a full-screen app.

## Structure

```
app/(app)/dump      capture + confirm proposal      app/api/analyze   DeepSeek call
app/(app)/insights  the ledger, evidence, archive   lib/ai.ts         prompt + JSON normalisation
app/(app)/plan      sprint, outputs, tasks          lib/prompts.ts    system prompt
app/(app)/self      claims → actions → evidence     supabase/migrations
```

## Design rules the code follows

- The AI never writes to the database — it returns a proposal, you tick, then `saveProposal` writes.
- `dumps.raw_text` is immutable, so a bad structure can be re-run on the original.
- Evidence is `jsonb` on the row; confidence on a claim moves only when evidence exists.
- No caps enforced yet (deliberate: test the loop first), but the UI reports counts.
