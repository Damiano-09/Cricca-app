import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { isPushSupported, registerServiceWorker, subscribeToPush, unsubscribeFromPush } from '../lib/push';

export function usePushNotifications() {
  const { user } = useAuth();
  const [supported] = useState(isPushSupported());
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!supported) return;
    const registration = await navigator.serviceWorker.ready.catch(() => null);
    if (!registration) return;
    const sub = await registration.pushManager.getSubscription();
    setEnabled(!!sub);
  }, [supported]);

  useEffect(() => {
    if (!supported) return;
    registerServiceWorker()
      .then(() => checkStatus())
      .catch(() => {});
  }, [supported, checkStatus]);

  async function enable() {
    if (!supported || !user) return;
    setBusy(true);
    try {
      if (Notification.permission === 'denied') {
        alert('Le notifiche sono bloccate per questo sito nelle impostazioni del browser o del telefono.');
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      const sub = await subscribeToPush();
      const json = sub.toJSON();

      await supabase.from('push_subscriptions').upsert(
        {
          user_id: user.id,
          endpoint: json.endpoint!,
          p256dh: json.keys?.p256dh ?? '',
          auth: json.keys?.auth ?? '',
        },
        { onConflict: 'endpoint' }
      );
      setEnabled(true);
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    if (!supported || !user) return;
    setBusy(true);
    try {
      const sub = await unsubscribeFromPush();
      if (sub) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      }
      setEnabled(false);
    } finally {
      setBusy(false);
    }
  }

  return { supported, enabled, busy, enable, disable };
}
