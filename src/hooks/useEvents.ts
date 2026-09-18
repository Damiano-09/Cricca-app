import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { EventWithParticipants, ParticipantStatus, Profile } from '../types';
import { useAuth } from '../context/AuthContext';

export function useEvents(groupId: string | null) {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventWithParticipants[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);

    const { data: memberRows } = await supabase
      .from('group_members')
      .select('user_id, profiles(id, name, avatar_color)')
      .eq('group_id', groupId);

    const memberProfiles: Profile[] = (memberRows ?? [])
      .map((r: any) => r.profiles)
      .filter(Boolean);
    setMembers(memberProfiles);

    const { data: eventRows } = await supabase
      .from('events')
      .select('*')
      .eq('group_id', groupId)
      .order('starts_at', { ascending: true });

    const eventIds = (eventRows ?? []).map((e) => e.id);

    let participantRows: any[] = [];
    if (eventIds.length > 0) {
      const { data } = await supabase
        .from('event_participants')
        .select('event_id, user_id, status')
        .in('event_id', eventIds);
      participantRows = data ?? [];
    }

    const withParticipants: EventWithParticipants[] = (eventRows ?? []).map((ev) => {
      const participants: Record<string, ParticipantStatus> = {};
      participantRows
        .filter((p) => p.event_id === ev.id)
        .forEach((p) => {
          participants[p.user_id] = p.status;
        });
      return { ...ev, participants };
    });

    setEvents(withParticipants);
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    refresh();
    if (!groupId) return;

    // Sincronizzazione realtime: qualsiasi cambio su eventi o risposte
    // in questo gruppo aggiorna la vista di tutti i membri connessi.
    const channel = supabase
      .channel(`group-${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events', filter: `group_id=eq.${groupId}` },
        () => refresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_participants' },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, refresh]);

  async function createEvent(sport: string, startsAtISO: string, seats: number) {
    if (!user || !groupId) return { error: 'Contesto non valido' };

    const { data: event, error } = await supabase
      .from('events')
      .insert({ group_id: groupId, sport, starts_at: startsAtISO, seats, created_by: user.id })
      .select()
      .single();

    if (error || !event) return { error: error?.message ?? 'Errore nella creazione evento' };

    // il creatore si conferma automaticamente
    await supabase.from('event_participants').insert({
      event_id: event.id,
      user_id: user.id,
      status: 'in',
    });

    await refresh();
    return { error: null };
  }

  async function setMyStatus(eventId: string, status: ParticipantStatus) {
    if (!user) return;
    await supabase.from('event_participants').upsert(
      { event_id: eventId, user_id: user.id, status, responded_at: new Date().toISOString() },
      { onConflict: 'event_id,user_id' }
    );
    await refresh();
  }

  return { events, members, loading, createEvent, setMyStatus, refresh };
}
