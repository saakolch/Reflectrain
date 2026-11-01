-- sprint_ai · v0 schema
-- Paste this whole file into Supabase → SQL Editor → Run.
-- Safe to run twice: tables use IF NOT EXISTS, policies are dropped and recreated.

create extension if not exists pgcrypto;

-- raw input, never edited: the audit trail
create table if not exists public.dumps (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind        text not null default 'daily' check (kind in ('daily', 'weekly')),
  raw_text    text not null,
  ai          jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- the ledger: what I believe, and how I test it
create table if not exists public.insights (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  source_dump        uuid references public.dumps (id) on delete set null,
  statement          text not null,
  status             text not null default 'active'
                     check (status in ('seed', 'active', 'practicing', 'embodied', 'retired')),
  practice           text,
  cue                text,
  evidence_question  text,
  evidence           jsonb not null default '[]'::jsonb,
  counter_evidence   jsonb not null default '[]'::jsonb,
  review_at          date,
  created_at         timestamptz not null default now()
);

-- one row per week
create table if not exists public.sprints (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  week_start  date not null,
  goal        text,
  outputs     jsonb not null default '[]'::jsonb,
  experiment  text,
  stop        text,
  protect     text,
  progress    text,
  resistance  text,
  changes     text,
  created_at  timestamptz not null default now(),
  unique (user_id, week_start)
);

-- action
create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title        text not null,
  next_action  text,
  due          date,
  done         boolean not null default false,
  insight_id   uuid references public.insights (id) on delete set null,
  sprint_id    uuid references public.sprints (id) on delete set null,
  source_dump  uuid references public.dumps (id) on delete set null,
  created_at   timestamptz not null default now()
);

-- identity: claim -> actions -> evidence
create table if not exists public.identity (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  claim             text not null,
  status            text not null default 'active' check (status in ('active', 'embodied')),
  confidence        int not null default 0,
  actions           jsonb not null default '[]'::jsonb,
  counter_evidence  jsonb not null default '[]'::jsonb,
  created_at        timestamptz not null default now()
);

-- indexes
create index if not exists dumps_user_created_idx    on public.dumps (user_id, created_at desc);
create index if not exists insights_user_created_idx on public.insights (user_id, created_at desc);
create index if not exists insights_user_status_idx  on public.insights (user_id, status);
create index if not exists tasks_user_done_idx       on public.tasks (user_id, done);
create index if not exists tasks_sprint_idx          on public.tasks (sprint_id);
create index if not exists sprints_user_week_idx     on public.sprints (user_id, week_start desc);

-- row level security: every row belongs to the signed-in user
alter table public.dumps    enable row level security;
alter table public.insights enable row level security;
alter table public.sprints  enable row level security;
alter table public.tasks    enable row level security;
alter table public.identity enable row level security;

drop policy if exists "own rows" on public.dumps;
drop policy if exists "own rows" on public.insights;
drop policy if exists "own rows" on public.sprints;
drop policy if exists "own rows" on public.tasks;
drop policy if exists "own rows" on public.identity;

create policy "own rows" on public.dumps
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own rows" on public.insights
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own rows" on public.sprints
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own rows" on public.tasks
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own rows" on public.identity
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
