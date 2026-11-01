# Your side of the build — 3 steps to a working app

The app is built and compiles. It runs at <http://localhost:3000> (phone on the same Wi-Fi:
`http://192.168.31.176:3000`). Right now it shows a setup screen, because two values are missing.

Total: **~10 minutes.**

---

## Step 1 — create the tables (3 min)

1. Supabase → your project → **SQL Editor** (left rail) → *New query*.
2. Paste the whole of [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql) → **Run**.
3. Expect “Success. No rows returned”. Then **Table Editor** should list:
   `dumps`, `insights`, `sprints`, `tasks`, `identity`.

The script is safe to run twice (tables `if not exists`, policies dropped and recreated).

---

## Step 2 — paste two keys into `.env.local` (5 min)

The file already exists in the project root, with the URL filled in:

```dotenv
DEEPSEEK_API_KEY=              ← your key, sk-…
DEEPSEEK_MODEL=deepseek-chat   ← check the exact id in the DeepSeek dashboard
NEXT_PUBLIC_SUPABASE_ANON_KEY= ← the publishable key
SUPABASE_SERVICE_ROLE_KEY=     ← optional, leave empty for now
```

### Where the Supabase key is

In the dashboard from your screenshot: the **gear icon** at the bottom of the left rail →
**API Keys**. You will see two sections:

- **Publishable key** (`sb_publishable_…`) → this goes into `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Secret keys** → *Reveal* → `sb_secret_…` → `SUPABASE_SERVICE_ROLE_KEY` (not needed yet).

If your project still shows the older page: **Settings → API** → `anon` `public` and `service_role`.

**Do not** paste the secret key into anything that starts with `NEXT_PUBLIC_` — that ships it to the browser.

### Where the DeepSeek key is

<https://platform.deepseek.com> → **API keys** → create → copy once. Balance must be positive.
The model id comes from the same dashboard (usually `deepseek-chat`). A wrong id does not crash — it
silently falls back to the mock — so copy it exactly.

---

## Step 3 — restart, create the account, close the door (2 min)

1. Stop and restart the dev server (`Ctrl+C`, then `npm run dev`) so the new env values load.
2. Open <http://localhost:3000> → you land on **/login** → *create account* with your email + password.
3. If Supabase asks you to confirm the email, confirm it. Faster: turn off
   *Authentication → Sign in / Providers → Email → Confirm email* before creating the account.
4. Then turn off public sign-ups: *Authentication → Sign in / Providers → Email → Allow new users* → off.

You will be the only account. Everything else is row-level-security'd to your user id.

---

## What to check, in order

- [ ] `/dump` opens, the keyboard appears automatically, text survives a phone lock (localStorage draft)
- [ ] Analyze returns a proposal in a few seconds → tick two items → **Save** → the dump appears under *Recent dumps*
- [ ] `/insights` shows the saved statements; *log evidence* adds a dated line
- [ ] `/plan` shows the task; ticking it strikes it through
- [ ] weekly mode → the proposal includes goal, 3 outputs, experiment, stop, protect
- [ ] `/self` → add a claim with 3 actions → add evidence → confidence bar moves

If a step fails, send me the screen and I fix it before we touch Vercel.

---

## After that (not now)

- **GitHub** (when you have access) → private repo `sprint-ai` → I push, you import in Vercel, add the
  same env vars, deploy. Phone: Share → *Add to Home Screen*.
- Until then the app is fully usable on this machine and over the local network.

## Costs

Supabase free (500 MB, pauses after a week of *inactivity* — daily use keeps it awake), Vercel Hobby free,
DeepSeek cents per month. **$0–5 for v0.**
