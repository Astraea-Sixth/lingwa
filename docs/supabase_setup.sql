-- Lingwa Hosted — Supabase Schema
-- Run this in Supabase Dashboard → SQL Editor

-- Progress table (stores all user progress)
create table if not exists public.progress (
  user_id uuid references auth.users(id) on delete cascade primary key,
  data jsonb not null default '{}',
  updated_at timestamptz default now()
);

-- API keys table (BYOK — stores encrypted provider keys)
create table if not exists public.api_keys (
  user_id uuid references auth.users(id) on delete cascade primary key,
  provider text not null default 'anthropic',
  encrypted_key text not null,
  updated_at timestamptz default now()
);

-- Feedback table
create table if not exists public.feedback (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  message text not null,
  type text default 'general',
  created_at timestamptz default now()
);

-- Row Level Security
alter table public.progress enable row level security;
alter table public.api_keys enable row level security;
alter table public.feedback enable row level security;

-- RLS Policies — users can only access their own data
create policy "Users own their progress" on public.progress
  for all using (auth.uid() = user_id);

create policy "Users own their api keys" on public.api_keys
  for all using (auth.uid() = user_id);

create policy "Users can insert feedback" on public.feedback
  for insert with check (auth.uid() = user_id);

create policy "Users can read own feedback" on public.feedback
  for select using (auth.uid() = user_id);
