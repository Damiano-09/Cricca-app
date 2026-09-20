// Supabase Edge Function — invia i promemoria push del gruppo.
// Pensata per essere chiamata ogni 15 minuti da un cron job (vedi ../../cron.sql).
//
// Controlla tre casistiche, una volta sola per evento:
//  - evento tra ~24 ore
//  - evento tra ~2 ore
//  - evento entro 3 ore con posti ancora liberi
//
// Deploy: supabase functions deploy send-reminders --no-verify-jwt
// Secrets richiesti (supabase secrets set ...):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, CRON_SECRET

import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:info@example.com';
const CRON_SECRET = Deno.env.get('CRON_SECRET');

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

Deno.serve(async (req: Request) => {
  if (CRON_SECRET) {
    const provided = req.headers.get('x-cron-secret');
    if (provided !== CRON_SECRET) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  const now = new Date();
  const results = { reminder24h: 0, reminder2h: 0, reminderMissing: 0, errors: 0 };

  async function notifyGroup(groupId: string, title: string, body: string): Promise<boolean> {
    const { data: members } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);

    const userIds = (members ?? []).map((m: any) => m.user_id);
    if (userIds.length === 0) return true;

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .in('user_id', userIds);

    if (!subs || subs.length === 0) return true; // nessuno ha le notifiche attive: niente da inviare

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title, body })
        );
      } catch (err: any) {
        results.errors++;
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        }
      }
    }
    return true;
  }

  // ---- 24h prima ----
  {
    const from = new Date(now.getTime() + 23.5 * 3600 * 1000).toISOString();
    const to = new Date(now.getTime() + 24.5 * 3600 * 1000).toISOString();
    const { data: events } = await supabase
      .from('events')
      .select('id, group_id, sport, starts_at')
      .gte('starts_at', from)
      .lte('starts_at', to)
      .is('reminder_24h_sent_at', null);

    for (const ev of events ?? []) {
      const sent = await notifyGroup(ev.group_id, 'Cricca ⏰', `Domani: ${ev.sport} — controlla chi viene`);
      if (sent) {
        await supabase.from('events').update({ reminder_24h_sent_at: now.toISOString() }).eq('id', ev.id);
        results.reminder24h++;
      }
    }
  }

  // ---- 2h prima ----
  {
    const from = new Date(now.getTime() + 1.5 * 3600 * 1000).toISOString();
    const to = new Date(now.getTime() + 2.5 * 3600 * 1000).toISOString();
    const { data: events } = await supabase
      .from('events')
      .select('id, group_id, sport, starts_at')
      .gte('starts_at', from)
      .lte('starts_at', to)
      .is('reminder_2h_sent_at', null);

    for (const ev of events ?? []) {
      const sent = await notifyGroup(ev.group_id, 'Cricca ⏰', `Tra 2 ore: ${ev.sport}`);
      if (sent) {
        await supabase.from('events').update({ reminder_2h_sent_at: now.toISOString() }).eq('id', ev.id);
        results.reminder2h++;
      }
    }
  }

  // ---- posti scoperti entro 3h ----
  {
    const to = new Date(now.getTime() + 3 * 3600 * 1000).toISOString();
    const { data: events } = await supabase
      .from('events')
      .select('id, group_id, sport, seats, starts_at')
      .gte('starts_at', now.toISOString())
      .lte('starts_at', to)
      .is('reminder_missing_sent_at', null);

    for (const ev of events ?? []) {
      const { count } = await supabase
        .from('event_participants')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', ev.id)
        .eq('status', 'in');

      const missing = ev.seats - (count ?? 0);
      if (missing > 0) {
        const sent = await notifyGroup(
          ev.group_id,
          'Cricca 🟡',
          `Mancano ${missing} post${missing === 1 ? 'o' : 'i'} per ${ev.sport}`
        );
        if (sent) {
          await supabase
            .from('events')
            .update({ reminder_missing_sent_at: now.toISOString() })
            .eq('id', ev.id);
          results.reminderMissing++;
        }
      }
    }
  }

  return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
});
