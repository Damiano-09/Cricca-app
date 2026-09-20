import { useMemo, useState } from 'react';
import { useEvents } from '../hooks/useEvents';
import { useGroups } from '../hooks/useGroups';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import EventDetailSheet from '../components/EventDetailSheet';
import CreateEventSheet from '../components/CreateEventSheet';
import type { EventWithParticipants } from '../types';

export default function GroupDetail({ groupId, onBack }: { groupId: string; onBack: () => void }) {
  const { events, members, loading, createEvent, setMyStatus, deleteEvent } = useEvents(groupId);
  const { groups, deleteGroup } = useGroups();
  const { user } = useAuth();
  const group = groups.find((g) => g.id === groupId);
  const isGroupOwner = group?.created_by === user?.id;

  const [tab, setTab] = useState<'eventi' | 'storico'>('eventi');
  const [activeEvent, setActiveEvent] = useState<EventWithParticipants | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteVisible, setInviteVisible] = useState(false);

  const now = Date.now();
  const upcoming = useMemo(
    () => events.filter((e) => new Date(e.starts_at).getTime() >= now),
    [events, now]
  );
  const past = useMemo(
    () => events.filter((e) => new Date(e.starts_at).getTime() < now).reverse(),
    [events, now]
  );

  const hasMissing = upcoming.some((e) => {
    const inCount = Object.values(e.participants).filter((s) => s === 'in').length;
    const missing = e.seats - inCount;
    return missing > 0 && missing <= 2;
  });

  const stats = useMemo(() => {
    const total = past.length;
    const avgPct =
      total === 0
        ? 0
        : Math.round(
            (past.reduce((sum, e) => {
              const inCount = Object.values(e.participants).filter((s) => s === 'in').length;
              return sum + inCount / e.seats;
            }, 0) /
              total) *
              100
          );
    const attendanceByMember: Record<string, number> = {};
    past.forEach((e) => {
      Object.entries(e.participants).forEach(([uid, status]) => {
        if (status === 'in') attendanceByMember[uid] = (attendanceByMember[uid] ?? 0) + 1;
      });
    });
    const topId = Object.entries(attendanceByMember).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topName = members.find((m) => m.id === topId)?.name ?? '—';
    return { total, avgPct, topName };
  }, [past, members]);

  function openDetail(ev: EventWithParticipants) {
    setActiveEvent(ev);
    setDetailOpen(true);
  }

  async function handleDeleteGroup() {
    if (!group) return;
    if (
      window.confirm(
        `Eliminare il gruppo "${group.name}"? Verranno eliminati anche tutti i suoi eventi. L'azione non si può annullare.`
      )
    ) {
      await deleteGroup(group.id);
      onBack();
    }
  }

  // tiene sincronizzato l'evento aperto quando arrivano aggiornamenti realtime
  const liveActiveEvent = activeEvent ? events.find((e) => e.id === activeEvent.id) ?? activeEvent : null;

  return (
    <div className="app">
      <div className="app-header">
        <div className="group-switch">
          <button className="back-btn" onClick={onBack}>←</button>
          <div className="group-emoji">{group?.emoji ?? '🏓'}</div>
          <div className="group-name-wrap">
            <h1>{group?.name ?? 'Gruppo'}</h1>
            <span>{group?.member_count ?? members.length} amici</span>
          </div>
        </div>
        <button className="avatar-me" onClick={() => setInviteVisible((v) => !v)} title="Invita">
          👥
        </button>
      </div>

      {inviteVisible && group && (
        <>
          <div className="invite-code-box">
            <div>
              Codice invito: <span className="code">{group.invite_code}</span>
            </div>
            <button
              className="copy-btn"
              onClick={() => navigator.clipboard?.writeText(group.invite_code)}
            >
              Copia
            </button>
          </div>
          {isGroupOwner && (
            <button className="danger-link" style={{ marginTop: -8, marginBottom: 16 }} onClick={handleDeleteGroup}>
              🗑️ Elimina gruppo
            </button>
          )}
        </>
      )}

      <div className="tabs">
        <button className={`tab ${tab === 'eventi' ? 'active' : ''}`} onClick={() => setTab('eventi')}>
          Eventi
        </button>
        <button className={`tab ${tab === 'storico' ? 'active' : ''}`} onClick={() => setTab('storico')}>
          Storico
        </button>
      </div>

      {tab === 'eventi' && (
        <>
          <div className="legend-row">
            <span>🟢 Ci sono</span>
            <span>🟡 Forse</span>
            <span>🔴 Non vengo</span>
          </div>

          {hasMissing && (
            <div className="banner">
              ⏰ <span><b>Un evento ha ancora posti liberi.</b> Tocca per invitare qualcuno prima che sia tardi.</span>
            </div>
          )}

          {loading && <div className="loading-center">Caricamento…</div>}

          {!loading && upcoming.length === 0 && (
            <div className="empty-hist">Nessun evento in programma. Creane uno con il tasto ＋.</div>
          )}

          {upcoming.map((ev) => (
            <EventCard key={ev.id} event={ev} members={members} onOpen={() => openDetail(ev)} />
          ))}
        </>
      )}

      {tab === 'storico' && (
        <>
          <div className="stats-strip">
            <div className="stat-box">
              <div className="num">{stats.total}</div>
              <div className="lbl">partite giocate</div>
            </div>
            <div className="stat-box">
              <div className="num">{stats.avgPct}%</div>
              <div className="lbl">presenza media</div>
            </div>
            <div className="stat-box">
              <div className="num">{stats.topName}</div>
              <div className="lbl">più presente</div>
            </div>
          </div>

          {past.length === 0 && <div className="empty-hist">Ancora nessun evento passato.</div>}

          {past.map((ev) => {
            const inCount = Object.values(ev.participants).filter((s) => s === 'in').length;
            const [ico, ...rest] = ev.sport.split(' ');
            const day = new Intl.DateTimeFormat('it-IT', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            }).format(new Date(ev.starts_at));
            return (
              <div className="event-card" key={ev.id} style={{ cursor: 'default' }}>
                <div className="event-top" style={{ marginBottom: 0 }}>
                  <div className="event-title">
                    <span className="ico">{ico}</span>
                    <div className="event-title-text">
                      <div className="sport">{rest.join(' ')}</div>
                      <div className="when">{day.charAt(0).toUpperCase() + day.slice(1)}</div>
                    </div>
                  </div>
                  <div className="seat-pill full">{inCount}/{ev.seats} presenti</div>
                </div>
              </div>
            );
          })}
        </>
      )}

      <button className="fab" onClick={() => setCreateOpen(true)}>＋</button>

      <EventDetailSheet
        event={liveActiveEvent}
        members={members}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onSetStatus={setMyStatus}
        onDelete={deleteEvent}
      />

      <CreateEventSheet open={createOpen} onClose={() => setCreateOpen(false)} onCreate={createEvent} />
    </div>
  );
}
