-- ============================================================
-- CRICCA — schema database (Supabase / PostgreSQL)
-- Esegui questo file una sola volta in Supabase → SQL Editor
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- PROFILI ----------
-- Un profilo per ogni utente autenticato (creato automaticamente alla registrazione)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  avatar_color text not null default '#1F5D42',
  created_at timestamptz not null default now()
);

-- ---------- GRUPPI ----------
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text not null default '🏓',
  invite_code text not null unique,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ---------- MEMBRI DEL GRUPPO ----------
create table public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- ---------- EVENTI ----------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  sport text not null,
  starts_at timestamptz not null,
  seats int not null default 4,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ---------- PARTECIPAZIONI ----------
create table public.event_participants (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('in', 'maybe', 'out')),
  responded_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

-- ============================================================
-- Crea automaticamente un profilo quando un utente si registra
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, avatar_color)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_color', '#1F5D42')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.events enable row level security;
alter table public.event_participants enable row level security;

-- PROFILES: leggibili da qualunque utente autenticato (serve per mostrare nomi/avatar
-- nei gruppi); modificabili solo dal proprietario.
create policy "profiles_select_authenticated"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- GROUPS: lettura pubblica per permettere di vedere nome/emoji tramite invite_code
-- prima di essersi uniti (MVP: dato non sensibile). Scrittura solo se sei tu il creatore.
create policy "groups_select_all_authenticated"
  on public.groups for select
  using (auth.role() = 'authenticated');

create policy "groups_insert_own"
  on public.groups for insert
  with check (auth.uid() = created_by);

-- GROUP_MEMBERS: vedi solo i membri dei gruppi di cui fai parte;
-- puoi inserire solo te stesso (join tramite codice invito).
create policy "group_members_select_same_group"
  on public.group_members for select
  using (
    exists (
      select 1 from public.group_members gm2
      where gm2.group_id = group_members.group_id
        and gm2.user_id = auth.uid()
    )
  );

create policy "group_members_insert_self"
  on public.group_members for insert
  with check (auth.uid() = user_id);

-- EVENTS: visibili e creabili solo dai membri del gruppo.
create policy "events_select_members"
  on public.events for select
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = events.group_id and gm.user_id = auth.uid()
    )
  );

create policy "events_insert_members"
  on public.events for insert
  with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.group_members gm
      where gm.group_id = events.group_id and gm.user_id = auth.uid()
    )
  );

-- EVENT_PARTICIPANTS: visibili ai membri del gruppo dell'evento;
-- ogni utente può scrivere/aggiornare solo la propria riga (la propria risposta).
create policy "participants_select_members"
  on public.event_participants for select
  using (
    exists (
      select 1 from public.events e
      join public.group_members gm on gm.group_id = e.group_id
      where e.id = event_participants.event_id and gm.user_id = auth.uid()
    )
  );

create policy "participants_insert_self"
  on public.event_participants for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.events e
      join public.group_members gm on gm.group_id = e.group_id
      where e.id = event_participants.event_id and gm.user_id = auth.uid()
    )
  );

create policy "participants_update_self"
  on public.event_participants for update
  using (auth.uid() = user_id);

-- ============================================================
-- Realtime: attiva la pubblicazione per le tabelle che devono
-- sincronizzarsi live tra i dispositivi del gruppo
-- ============================================================
alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.event_participants;
