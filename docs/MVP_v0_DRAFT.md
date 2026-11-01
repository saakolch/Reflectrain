# MVP v0 — design draft

**One-line definition:** a phone-first web app where you dump raw thoughts, the AI turns them into
insights / tasks / friction, everything is stored, and one card a day keeps turning insight into evidence.

**The loop everything must serve:**

```
   dump  →  structure  →  you confirm  →  store  →  practice  →  evidence  →  weekly review
     ↑                                                                          │
     └──────────────────────  updated self-image  ←─────────────────────────────┘
```

Status: draft for your review. Nothing is built yet.

---

## 0. Design principles (the tie-breakers)

1. **Capture beats structure.** Typing must start in ≤2 taps. Structure is the AI's problem, not yours.
2. **AI proposes, you confirm.** Nothing enters the database that you did not tick. This kills
   hallucinated "insights" and note-hoarding in one move.
3. **Max 5 active insights.** A cap is a feature. 40 insights = 0 insights.
4. **Every insight carries a practice, a cue and an evidence question.** No practice → it is a note, and
   notes go to the archive.
5. **Evidence over motivation.** The AI asks "what did you actually do?" never "you've got this!".
6. **One card a day, not reminders all day.** Constant pings become wallpaper within a week.

---

## 1. The four screens

I kept your three (Capture / Insights / Plan) and added a fourth, **Self**, because the
self-image loop needs a surface where evidence is *visible*. If you want strictly three tabs,
Self becomes a filter inside Insights — but I recommend the fourth tab; it is the part that is yours alone.

### 1.1 Dump (default screen)

```
┌───────────────────────────────┐
│ Dump                     ⚙︎    │
│ Tue 3 Nov · 21:14             │
│ ┌───────────────────────────┐ │
│ │ today i noticed i postpone│ │
│ │ the CV every time i open  │ │
│ │ the site. maybe it's ...  │ │
│ │                     🎙    │ │
│ └───────────────────────────┘ │
│  daily  ▸ weekly              │
│  [      Analyze       ]       │
│                               │
│  AI found: 2 insights · 1 task│
│ ┌───────────────────────────┐ │
│ │ ☑ "control, not decay"    │ │
│ │   practice: 10-min rest   │ │
│ │ ☑ task: rewrite CV summary│ │
│ │ ☐ friction: navigation    │ │
│ └───────────────────────────┘ │
│  [  Save 2 items  ]  [ Dismiss]│
│                               │
│  Dump   Insights  Plan   Self │
└───────────────────────────────┘
```

Behaviour:
- Textarea autofocuses; keyboard opens immediately. Draft text is kept in `localStorage` so a dead
  battery or an accidental back-swipe never costs you a dump.
- Mic button = browser Web Speech API. **Caveat:** on iPhone the keyboard's own dictation mic is more
  reliable for long speech; the in-app mic is a convenience, not the primary path. Both send text, so
  nothing downstream changes.
- Toggle `daily / weekly` decides which AI mode runs (`weekly` also fills the sprint block).
- After Analyze: a **proposal card** with checkboxes, edit-in-place on each line, then Save.
  Save writes: `dumps` row + selected `insights` / `tasks` rows, linked to the dump.
- Below the fold: "last 5 dumps" as one-liners, tap to expand (audit trail, no editing).

### 1.2 Insights (the hub)

```
┌───────────────────────────────┐
│ Insights              ⌕       │
│ [active 3/5] [practicing] [all]│
│ ┌───────────────────────────┐ │
│ │ ● active                  │ │
│ │ "If I loosen control,     │ │
│ │  nothing decays."         │ │
│ │ practice: 10-min rest     │ │
│ │ cue: after lunch          │ │
│ │ evidence: 2/3             │ │
│ │ [Log evidence] [Practice] │ │
│ └───────────────────────────┘ │
│ ┌───────────────────────────┐ │
│ │ ● practicing              │ │
│ │ "Rumination is a signal   │ │
│ │  to shrink the task."     │ │
│ │ ...                       │ │
│ └───────────────────────────┘ │
│  + new insight manually       │
└───────────────────────────────┘
```

Each card: statement, practice, cue, evidence count, status badge
(`seed → active → practicing → embodied → retired`), and three actions:
- **Log evidence** → sheet: one line + "what actually happened" + rating 1–5 → appends to `evidence`.
- **Make practice** → creates a `task` with the practice text, `insight_id` set, due this week.
- **⋯** → edit, change cue, archive, "this contradicted my insight" (counter-evidence).

Cap: adding a 6th active insight forces you to retire one. That friction is intentional.

### 1.3 Plan & Execution

```
┌───────────────────────────────┐
│ Plan            week 45 · 3–9 Nov│
│ Goal: CV v2 sent + 5 HK roles  │
│                               │
│ OUTPUTS                       │
│ ☑ CV PDF v1                   │
│ ☐ 5 roles logged w/ fit score │
│ ☐ 2 emails sent + tracked     │
│                               │
│ EXPERIMENT 2-min action card  │
│ STOP    scrolling after 23:00 │
│ PROTECT 2 meditation blocks   │
│                               │
│ TODAY                         │
│ ☐ 10-min rest after lunch     │
│ ☐ rewrite CV summary (15 min) │
│                               │
│ [ Start weekly review ]       │
└───────────────────────────────┘
```

- Week view = current `sprint` row. Outputs are checkboxes backed by `tasks`.
- "Start weekly review" opens Dump pre-set to `weekly` with a short placeholder that mirrors your format.
- Small, deliberately boring. No Gantt, no tags, no priorities matrix.

### 1.4 Self (identity evidence)

```
┌───────────────────────────────┐
│ Self                          │
│ Claim                         │
│ "I am someone who acts before │
│  feeling ready."              │
│ confidence ▓▓▓▓▓▓░░░░ 60%     │
│                               │
│ Decomposition                 │
│ ☑ send email before polishing │
│   evidence 12 Nov "sent HKUST │
│   mail with 2 typos" ✅        │
│ ☑ ask one question in class   │
│   evidence —                  │
│ ☐ publish one rough note      │
│   evidence —                  │
│                               │
│ [ Add evidence ] [ New claim ]│
│ Counter-evidence:             │
│ "3 days I re-polished CV"     │
└───────────────────────────────┘
```

This is the mechanism you described, made explicit:

1. **Claim** — the identity you want ("more proactive", "calmer under load").
2. **Decompose into 3 observable actions** — behaviour, not feelings. "Send the email before polishing it"
   is observable; "be confident" is not.
3. **Do the smallest one this week** — it arrives in Plan as a task, so the loop closes without extra effort.
4. **Log evidence** — date + one line + "what actually happened". Optional counter-evidence field; it is the
   honesty valve that keeps the model from inflating.
5. **Confidence moves only on evidence** — `confidence = f(number of distinct contexts with evidence)`, capped,
   shown as a bar. No evidence, no movement.
6. **Embodied** — after ~3 evidences in different contexts, the claim flips to `embodied`, the daily card
   stops nagging, and you can promote the next claim.

Anti-fake rules: no evidence from intention ("I plan to"), only from action ("I did"); one claim active at a time.

---

## 2. Data model (5 tables)

Postgres via Supabase. `user_id` on every row + row-level security `auth.uid() = user_id`.
Single-user app: one account, sign-ups disabled after you register.

```sql
-- raw input, never edited (the audit trail)
dumps(id uuid pk, user_id uuid, kind text check in ('daily','weekly'),
      raw_text text, ai jsonb, created_at timestamptz default now())

-- the ledger: what I believe and how I test it
insights(id uuid pk, user_id uuid, statement text,
         source_dump uuid null references dumps,
         status text default 'seed',        -- seed|active|practicing|embodied|retired
         practice text, cue text, evidence_question text,
         evidence jsonb default '[]',       -- [{date, note, rating}]
         counter_evidence jsonb default '[]',
         review_at date, created_at timestamptz default now())

-- action: outputs and practices
tasks(id uuid pk, user_id uuid, title text, next_action text,
      due date, done bool default false,
      insight_id uuid null, sprint_id uuid null,
      created_at timestamptz default now())

-- one row per week
sprints(id uuid pk, user_id uuid, week_start date unique,
        goal text, outputs jsonb, experiment text, stop text, protect text,
        progress text, resistance text, changes text,
        ai jsonb, created_at timestamptz default now())

-- identity: claim -> actions -> evidence
identity(id uuid pk, user_id uuid, claim text, status text default 'active',
         confidence int default 0,        -- 0..100, evidence-driven only
         actions jsonb default '[]',      -- [{text, evidence:[{date,note}]}]
         counter_evidence jsonb default '[]',
         created_at timestamptz default now())
```

Why `evidence` is `jsonb` and not its own table: v0 has one user and a handful of rows per insight;
a join buys nothing and costs three screens of code. Promote it to a table when you need charts.

Why `dumps.raw_text` is immutable: when the AI misreads you, you can re-run structure on the original
instead of on its own summary (error compounding).

---

## 3. AI contract

One endpoint, `POST /api/analyze`, body `{ text: string, mode: 'daily' | 'weekly', lang: 'ru' | 'en' }`.
Server-side only; the key never reaches the browser. DeepSeek is OpenAI-compatible:

```ts
const client = new OpenAI({ baseURL: 'https://api.deepseek.com', apiKey: process.env.DEEPSEEK_API_KEY });
const r = await client.chat.completions.create({
  model: process.env.DEEPSEEK_MODEL,          // copy the exact id from your dashboard (e.g. deepseek-chat)
  response_format: { type: 'json_object' },   // DeepSeek JSON mode: the prompt must contain the word "json"
  temperature: 0.3,
  messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: text }],
});
const proposal = JSON.parse(r.choices[0].message.content);
```

Response shape (validated with zod before it touches the UI):

```json
{
  "summary": "one line, neutral",
  "insights": [{ "statement": "", "practice": "", "cue": "", "evidence_question": "", "confidence": 0.6 }],
  "tasks":    [{ "title": "", "next_action": "", "due_hint": "this week" }],
  "friction": [{ "text": "", "tag": "cognitive|emotional|environmental|relational" }],
  "energy":   { "note": "", "pattern": "" },
  "identity_signals": [{ "claim": "", "evidence": "" }],
  "sprint":   { "goal": "", "outputs": ["", "", ""], "experiment": "", "stop": "", "protect": "",
                "progress": "", "resistance": "", "changes": "" },
  "question": "one clarifying question, or null"
}
```

`sprint` is `null` in daily mode. Max 3 insights per dump, max 5 tasks; if the text does not support an
insight, return `[]` — the prompt says that explicitly, so the model is allowed to return nothing.

Draft system prompt (short version; the real one ships in `lib/prompts.ts`):

```
You are the structuring layer of one person's second brain. You do not motivate, you do not flatter.
Input: a raw brain dump. Output: strict json, no prose outside the json.

Rules:
- Extract only what the text supports. If nothing qualifies, return empty arrays. Never invent a pattern.
- An insight is a belief that predicts behaviour and can be tested. Max 3, ranked by how much it changes action.
  Each needs: a practice (one concrete action), a cue (when/where), an evidence_question (how the person
  will know it happened, answered by fact not feeling).
- A task needs a next_action that is physical and startable in 2 minutes.
- Tag each friction: cognitive (overthinking, no navigation, vague plan), emotional (fear, tension, control),
  environmental (no block, too many tabs), relational (boundaries with people).
- weekly mode: fill `sprint` using the person's own format: Progress / Resistance / Changes / Next sprint
  (goal + exactly 3 outputs + experiment + stop + protect).
- Mention drive/foundations/joy only if the text does; do not impose a framework.
- At most one clarifying question, only if it changes what to store.
```

Draft weekly prompt (user message wrapper):

```
MODE: weekly sprint review.
Structure my dump into: progress with evidence, resistance tagged, energy pattern,
where drive invaded rest, self-image evidence (prove/contradict), then next sprint:
3 concrete outputs, 1 experiment, 1 thing to stop, 1 thing to protect.
Return the json schema. Keep it concrete; no motivational language.
My dump:
---
{text}
```

---

## 4. Two rhythms

**Daily (≈3 min).** Evening dump → tick the proposal → one card "today's practice" appears next morning →
one tap "log evidence" at night. That is the whole daily cost.

**Weekly (≈25 min).** Saturday: mode `weekly`, dump freely for 15 min → review the structured sprint →
AI proposes ledger updates (retire emboldened, activate one new, flag contradictions) → you approve →
3 outputs land in Plan, one becomes a Self action.

**Failure modes the design already answers:** dumped but not structured (Save is one tap), structured but
not stored (server writes in the same request), stored but never revisited (one card/day + weekly review),
too much stored (cap of 5 active + archive).

---

## 5. Scope

**In v0:** phone web app + PWA install; text + optional voice; DeepSeek structuring; Supabase persistence;
4 tabs; daily card; weekly sprint; Self claims with evidence; single user with login; deployed on Vercel.

**Out of v0:** push notifications; native iOS app; vector search / embeddings; multi-user; two-way Obsidian
sync (later: one-way Markdown export, plus a one-time import script for your existing vault); charts/analytics;
sharing.

**Obsidian, concretely:** Supabase is the source of truth. Obsidian stays your deep-writing surface on the
computer. v0.5 adds "export this week as .md" — a button that writes a Markdown file you drop into the vault.
Reading the vault into the app is a one-time Python/Node script over `*.md` → `insights`, run once, not a sync.

---

## 6. Build order (≈7 milestones, each independently testable)

| # | Milestone | Done when |
|---|-----------|-----------|
| M0 | Next.js + Supabase template, deployed empty to Vercel | your URL loads on the phone |
| M1 | Schema + RLS + login | you can log in and see an empty list |
| M2 | `/api/analyze` with mock JSON, then real DeepSeek | curl returns a valid proposal |
| M3 | Dump screen + confirm + save | a dump round-trips to the DB |
| M4 | Insights hub (status, evidence, cap) | a card can move seed → active |
| M5 | Plan + weekly sprint | one full weekly review is stored |
| M6 | Self tab | one claim with 2 evidence rows |
| M7 | PWA polish (icon, manifest, safe-area, dark) | opens fullscreen from home screen |

Paste-ready instructions for a coding agent (Cursor/Claude Code), in order — one per milestone:

1. `Create a Next.js 15 App Router project in TypeScript with Tailwind using the official Supabase starter template. Add a mobile-first layout with a bottom tab bar: Dump, Insights, Plan, Self. No auth UI changes yet.`
2. `Add SQL migrations for tables dumps, insights, tasks, sprints, identity with RLS policies user_id = auth.uid(). Generate TypeScript types with supabase gen types.`
3. `Create app/api/analyze/route.ts: POST {text, mode, lang}, call DeepSeek (baseURL https://api.deepseek.com, response_format json_object), validate with zod using this schema [paste], return the object. Never expose the key client-side.`
4. `Build the Dump page: autofocus textarea, localStorage draft, mode toggle, Analyze button, proposal card with editable checkboxes, Save writes dumps + selected insights/tasks, then clears.`
5. `Build the Insights page: list by status with a 5-active cap, detail sheet with practice/cue/evidence question, Log evidence (note + rating) appending to jsonb, Make practice creating a task, archive/retire.`
6. `Build the Plan page: current sprint with goal, 3 outputs as checkboxes, experiment/stop/protect, today's tasks, and a "weekly review" button that opens Dump in weekly mode.`
7. `Build the Self page: claims with confidence bar, 3 actions each with evidence list, add evidence, add counter-evidence, promote to embodied after 3 evidences.`

---

## 7. Main risks and the guardrail for each

| Risk | Guardrail |
|---|---|
| Reminder noise | one card/day; cue triggers only at 3 moments (after lunch, before CV work, before bed) |
| Insight hoarding | hard cap 5 active; 6th forces a retire |
| AI invents patterns | confirm-before-save; evidence question required; counter-evidence field; temperature 0.3 |
| Maintenance burden | capture ≤2 taps; one inbox; AI does the structuring; no tag system |
| False digital twin | the model stores what you *did*, not what it *infers*; you approve every self-image change |
| It dies in week 3 | weekly review is 25 min and produces 3 outputs — the loop pays for itself in the first week |

---

## 8. What v1 looks like after v0 proves the loop

Push reminders (installed PWA on iOS 16.4+), voice memos transcribed server-side, evidence charts,
"blind spot" report from 4 weeks of friction tags, Markdown export to Obsidian, shared "mentor" view,
and — only then — any multi-user or agentic layer.
