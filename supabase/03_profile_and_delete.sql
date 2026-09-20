-- ============================================================
-- CRICCA — profilo personalizzabile + eliminazione eventi/gruppi
-- Esegui questo file in Supabase → SQL Editor DOPO i precedenti
-- (schema.sql e 02_push_notifications.sql).
-- ============================================================

-- ---------- PROFILO: emoji avatar personalizzata + tema scelto ----------
alter table public.profiles add column avatar_emoji text;
alter table public.profiles add column theme text not null default 'bosco';

-- ---------- ELIMINAZIONE EVENTI ----------
-- Chi ha creato l'evento può eliminarlo; anche chi ha creato il gruppo
-- (utile se un giorno vuoi fare pulizia come amministratore del gruppo).
create policy "events_delete_own_or_group_owner"
  on public.events for delete
  using (
    auth.uid() = created_by
    or exists (
      select 1 from public.groups g
      where g.id = events.group_id and g.created_by = auth.uid()
    )
  );

-- Le risposte (event_participants) vanno eliminabili a cascata quando
-- si cancella un evento o un gruppo: senza questa policy, l'eliminazione
-- fallirebbe a metà a causa della Row Level Security sulle righe figlie.
create policy "participants_delete_permitted"
  on public.event_participants for delete
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.events e
      where e.id = event_participants.event_id
        and (
          e.created_by = auth.uid()
          or exists (select 1 from public.groups g where g.id = e.group_id and g.created_by = auth.uid())
        )
    )
  );

-- ---------- ELIMINAZIONE GRUPPI ----------
-- Solo chi ha creato il gruppo può eliminarlo.
create policy "groups_delete_own"
  on public.groups for delete
  using (auth.uid() = created_by);

-- Permette la cancellazione a cascata dei membri quando il gruppo viene eliminato.
create policy "group_members_delete_via_owner_or_self"
  on public.group_members for delete
  using (
    auth.uid() = user_id
    or exists (select 1 from public.groups g where g.id = group_members.group_id and g.created_by = auth.uid())
  );
