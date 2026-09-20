-- ============================================================
-- CRICCA — pianifica l'invio automatico dei promemoria
-- Esegui in Supabase → SQL Editor SOLO DOPO aver deployato la
-- edge function "send-reminders" (vedi README, sezione notifiche push).
--
-- Sostituisci:
--   <PROJECT_REF>  → il tuo project ref (es. abcdefghijklmnop)
--   <CRON_SECRET>  → lo stesso valore impostato come secret
--                     della edge function (supabase secrets set CRON_SECRET=...)
-- ============================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'cricca-send-reminders',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.functions.supabase.co/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', '<CRON_SECRET>'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Per disattivare in futuro:
-- select cron.unschedule('cricca-send-reminders');

-- Per testare subito senza aspettare il cron, esegui manualmente:
-- select net.http_post(
--   url := 'https://<PROJECT_REF>.functions.supabase.co/send-reminders',
--   headers := jsonb_build_object('Content-Type','application/json','x-cron-secret','<CRON_SECRET>'),
--   body := '{}'::jsonb
-- );
