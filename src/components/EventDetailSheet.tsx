import { useState } from 'react';
import type { EventWithParticipants, ParticipantStatus, Profile } from '../types';
import { STATUS_LABEL } from '../types';
import { useAuth } from '../context/AuthContext';

function formatWhen(iso: string) {
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
  const time = new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit' }).format(d);
  return { day: day.charAt(0).toUpperCase() + day.slice(1), time };
}

export default function EventDetailSheet({
  event,
  members,
  open,
  onClose,
  onSetStatus,
  onDelete,
}: {
  event: EventWithParticipants | null;
  members: Profile[];
  open: boolean;
  onClose: () => void;
  onSetStatus: (eventId: string, status: ParticipantStatus) => void;
  onDelete: (eventId: string) => void;
}) {
  const { user } = useAuth();
  const [invited, setInvited] = useState<Set<string>>(new Set());

  if (!event) return <div className={`sheet-overlay ${open ? 'open' : ''}`} />;

  const inCount = Object.values(event.participants).filter((s) => s === 'in').length;
  const missing = event.seats - inCount;
  const { day, time } = formatWhen(event.starts_at);
  const [ico, ...rest] = event.sport.split(' ');
  const candidates = members.filter((m) => !(m.id in event.participants)).slice(0, 3);
  const canDelete = event.created_by === user?.id;

  function copyInvite(name: string) {
    const msg = `Vieni a ${rest.join(' ')} ${ico} — ${day} alle ${time}? Rispondi su Cricca!`;
    navigator.clipboard?.writeText(msg).catch(() => {});
    setInvited((prev) => new Set(prev).add(name));
  }

  function handleDelete() {
    if (!event) return;
    if (window.confirm('Eliminare questo evento? L\'azione non si può annullare.')) {
      onDelete(event.id);
      onClose();
    }
  }

  return (
    <div className={`sheet-overlay ${open ? 'open' : ''}`}>
      <div className="sheet">
        <button className="close-x" onClick={onClose}>✕</button>
        <div className="sheet-handle" />
        <h2>{rest.join(' ')} {ico}</h2>
        <div className="sub">{day} · {time} · {inCount}/{event.seats} confermati</div>

        {members.map((m) => {
          const status = event.participants[m.id];
          const isMe = m.id === user?.id;
          return (
            <div className={`member-row ${isMe ? 'me' : ''}`} key={m.id}>
              <div className="member-left">
                <div className="m-avatar" style={{ background: m.avatar_color }}>
                  {m.avatar_emoji ?? m.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="m-name">
                    {m.name} {isMe && <span className="you">(tu)</span>}
                  </div>
                  {!isMe && (
                    <div className="status-caption">
                      {status ? STATUS_LABEL[status] : 'Non ha ancora risposto'}
                    </div>
                  )}
                </div>
              </div>

              {isMe ? (
                <div className="status-pill-row">
                  <button
                    className={`status-pill ${status === 'in' ? 'sel-in' : ''}`}
                    onClick={() => onSetStatus(event.id, 'in')}
                  >
                    🟢 Ci sono
                  </button>
                  <button
                    className={`status-pill ${status === 'maybe' ? 'sel-maybe' : ''}`}
                    onClick={() => onSetStatus(event.id, 'maybe')}
                  >
                    🟡 Forse
                  </button>
                  <button
                    className={`status-pill ${status === 'out' ? 'sel-out' : ''}`}
                    onClick={() => onSetStatus(event.id, 'out')}
                  >
                    🔴 Non vengo
                  </button>
                </div>
              ) : (
                <span className={`dot ${status ?? 'pending'}`} />
              )}
            </div>
          );
        })}

        {missing > 0 && candidates.length > 0 && (
          <div className="invite-box">
            <div className="head">
              Mancano {missing} post{missing === 1 ? 'o' : 'i'} — chi inviteresti?
            </div>
            {candidates.map((c) => (
              <div className="invite-candidate" key={c.id}>
                <div className="member-left">
                  <div className="m-avatar" style={{ background: c.avatar_color }}>
                    {c.avatar_emoji ?? c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="m-name">{c.name}</div>
                </div>
                <button
                  className={`invite-btn ${invited.has(c.name) ? 'done' : ''}`}
                  onClick={() => copyInvite(c.name)}
                >
                  {invited.has(c.name) ? 'Copiato ✓' : 'Invita'}
                </button>
              </div>
            ))}
          </div>
        )}

        {canDelete && (
          <button className="danger-link" onClick={handleDelete}>
            🗑️ Elimina evento
          </button>
        )}
      </div>
    </div>
  );
}
