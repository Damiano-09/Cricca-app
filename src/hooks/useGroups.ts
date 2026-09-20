import { useCallback, useEffect, useState } from 'react';
import { supabase, generateInviteCode } from '../lib/supabase';
import type { Group } from '../types';
import { useAuth } from '../context/AuthContext';

export function useGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<(Group & { member_count: number })[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id);

    const groupIds = (memberships ?? []).map((m) => m.group_id);
    if (groupIds.length === 0) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const { data: groupsData } = await supabase.from('groups').select('*').in('id', groupIds);
    const { data: counts } = await supabase.from('group_members').select('group_id').in('group_id', groupIds);

    const countMap: Record<string, number> = {};
    (counts ?? []).forEach((c) => {
      countMap[c.group_id] = (countMap[c.group_id] ?? 0) + 1;
    });

    setGroups(
      (groupsData ?? []).map((g) => ({ ...(g as Group), member_count: countMap[g.id] ?? 1 }))
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function createGroup(name: string, emoji: string) {
    if (!user) return { error: 'Devi essere autenticato' };
    const invite_code = generateInviteCode();

    const { data: group, error } = await supabase
      .from('groups')
      .insert({ name, emoji, invite_code, created_by: user.id })
      .select()
      .single();

    if (error || !group) return { error: error?.message ?? 'Errore nella creazione del gruppo' };

    const { error: memberError } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: user.id });

    if (memberError) return { error: memberError.message };

    await refresh();
    return { error: null, group: group as Group };
  }

  async function joinGroupByCode(code: string) {
    if (!user) return { error: 'Devi essere autenticato' };
    const cleanCode = code.trim().toUpperCase();

    const { data: group, error } = await supabase
      .from('groups')
      .select('*')
      .eq('invite_code', cleanCode)
      .single();

    if (error || !group) return { error: 'Codice invito non valido' };

    const { error: joinError } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: user.id });

    if (joinError) {
      if (joinError.code === '23505') return { error: 'Fai già parte di questo gruppo' };
      return { error: joinError.message };
    }

    await refresh();
    return { error: null, group: group as Group };
  }

  async function deleteGroup(groupId: string) {
    const { error } = await supabase.from('groups').delete().eq('id', groupId);
    if (!error) await refresh();
    return { error: error ? error.message : null };
  }

  return { groups, loading, createGroup, joinGroupByCode, deleteGroup, refresh };
}
