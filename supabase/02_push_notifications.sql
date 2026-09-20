-- ============================================================
-- CRICCA — notifiche push (migrazione incrementale)
-- Esegui questo file in Supabase → SQL Editor DOPO aver già
-- eseguito schema.sql una volta.
-- ============================================================

-- ---------- SOTTOSCRIZIONI PUSH ----------
-- Una riga per ogni dispositivo/browser su cui un utente ha attivato le notifiche
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions_select_own"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

create policy "push_subscriptions_insert_own"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "push_subscriptions_update_own"
  on public.push_subscriptions for update
  using (auth.uid() = user_id);

create policy "push_subscriptions_delete_own"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);

-- ---------- TRACCIAMENTO PROMEMORIA GIÀ INVIATI ----------
-- Evita di mandare due volte lo stesso promemoria per lo stesso evento
alter table public.events add column reminder_24h_sent_at timestamptz;
alter table public.events add column reminder_2h_sent_at timestamptz;
alter table public.events add column reminder_missing_sent_at timestamptz;
