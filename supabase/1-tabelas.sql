-- Axion — passo 1: tabelas e regras de acesso
-- Cola isto no Supabase: SQL Editor › New query › Run

create table if not exists public.reminders (
  id          text primary key,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data        jsonb not null,
  quando      timestamptz,
  feito       boolean not null default false,
  updated_at  timestamptz not null default now()
);
create index if not exists reminders_user_idx on public.reminders(user_id);
create index if not exists reminders_due_idx  on public.reminders(quando) where feito = false;

create table if not exists public.push_subs (
  endpoint    text primary key,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  sub         jsonb not null,
  created_at  timestamptz not null default now()
);

-- Avisos já enviados (para não repetir). Só o servidor mexe aqui.
create table if not exists public.sent_alerts (
  key      text primary key,
  sent_at  timestamptz not null default now()
);

alter table public.reminders   enable row level security;
alter table public.push_subs   enable row level security;
alter table public.sent_alerts enable row level security;

-- Cada pessoa só vê e mexe nos seus próprios recados e telemóveis.
drop policy if exists "os meus recados" on public.reminders;
create policy "os meus recados" on public.reminders
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "os meus telemoveis" on public.push_subs;
create policy "os meus telemoveis" on public.push_subs
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Sincronização ao vivo entre telemóveis
alter table public.reminders replica identity full;
do $$ begin
  alter publication supabase_realtime add table public.reminders;
exception when duplicate_object then null; end $$;
