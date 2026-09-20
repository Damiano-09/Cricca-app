import { useState } from 'react';
import { useGroups } from '../hooks/useGroups';
import { useAuth } from '../context/AuthContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import CreateGroupSheet from '../components/CreateGroupSheet';
import JoinGroupSheet from '../components/JoinGroupSheet';

export default function Groups({ onSelectGroup }: { onSelectGroup: (id: string) => void }) {
  const { groups, loading, createGroup, joinGroupByCode } = useGroups();
  const { profile, signOut } = useAuth();
  const { supported, enabled, busy, enable, disable } = usePushNotifications();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  return (
    <div className="app">
      <div className="app-header">
        <div className="group-switch">
          <div className="group-emoji">👋</div>
          <div className="group-name-wrap">
            <h1>Ciao {profile?.name ?? ''}</h1>
            <span>I tuoi gruppi</span>
          </div>
        </div>
        <button className="avatar-me" onClick={signOut} title="Esci">
          {(profile?.name ?? '?').slice(0, 2).toUpperCase()}
        </button>
      </div>

      {loading && <div className="loading-center">Caricamento…</div>}

      {supported && (
        <div className="invite-code-box">
          <div>{enabled ? '🔔 Notifiche attive' : '🔕 Promemoria eventi disattivati'}</div>
          <button className="copy-btn" onClick={enabled ? disable : enable} disabled={busy}>
            {busy ? '…' : enabled ? 'Disattiva' : 'Attiva'}
          </button>
        </div>
      )}

      {!loading && groups.length === 0 && (
        <div className="empty-hist">
          Non fai ancora parte di nessun gruppo.
          <br />
          Creane uno o entra con un codice invito.
        </div>
      )}

      {groups.map((g) => (
        <div key={g.id} className="group-list-item" onClick={() => onSelectGroup(g.id)}>
          <div className="group-emoji">{g.emoji}</div>
          <div>
            <div className="name">{g.name}</div>
            <div className="meta">{g.member_count} amici</div>
          </div>
        </div>
      ))}

      <button className="primary-btn" onClick={() => setCreateOpen(true)}>
        ＋ Nuovo gruppo
      </button>
      <button className="secondary-btn" onClick={() => setJoinOpen(true)}>
        Ho un codice invito
      </button>

      <CreateGroupSheet open={createOpen} onClose={() => setCreateOpen(false)} createGroup={createGroup} />
      <JoinGroupSheet open={joinOpen} onClose={() => setJoinOpen(false)} joinGroupByCode={joinGroupByCode} />
    </div>
  );
}
