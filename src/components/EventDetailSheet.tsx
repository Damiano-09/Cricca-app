import { useState } from 'react';
import type { EventWithParticipants, ParticipantStatus, Profile } from '../types';
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
}: {
  event: EventWithParticipants | null;
  members: Profile[];
  open: boolean;
  onClose: () => void;
  onSetStatus: (eventId: string, status: ParticipantStatus) => void;
}) {
  const { user } = useAuth();
  const [invited, setInvited] = useState<Set<string>>(new Set());

  if (!event) return <div className={`sheet-overlay ${open ? 'open' : ''}`} />;

  const inCount = Object.values(event.participants).filter((s) => s === 'in').length;
  const missing = event.seats - inCount;
  const { day, time } = formatWhen(event.starts_at);
  const [ico, ...rest] = event.sport.split(' ');
  const candidates = members.filter((m) => !(m.id in event.participants)).slice(0, 3);

  function copyInvite(name: string) {
    const msg = `Vieni a ${rest.join(' ')} ${ico} — ${day} alle ${time}? Rispondi su Cricca!`;
    navigator.clipboard?.writeText(msg).catch(() => {});
    setInvited((prev) => new Set(prev).add(name));
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
            <div className="member-row" key={m.id}>
              <div className="member-left">
                <div className="m-avatar" style={{ background: m.avatar_color }}>
                  {m.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="m-name">
                  {m.name} {isMe && <span className="you">(tu)</span>}
                </div>
              </div>
              <div className="status-toggle">
                <button
                  className={`status-btn ${status === 'in' ? 'sel-in' : ''}`}
                  disabled={!isMe}
                  onClick={() => isMe && onSetStatus(event.id, 'in')}
                >
                  🟢
                </button>
                <button
                  className={`status-btn ${status === 'maybe' ? 'sel-maybe' : ''}`}
                  disabled={!isMe}
                  onClick={() => isMe && onSetStatus(event.id, 'maybe')}
                >
                  🟡
                </button>
                <button
                  className={`status-btn ${status === 'out' ? 'sel-out' : ''}`}
                  disabled={!isMe}
                  onClick={() => isMe && onSetStatus(event.id, 'out')}
                >
                  ⚪
                </button>
              </div>
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
                    {c.name.slice(0, 2).toUpperCase()}
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
      </div>
    </div>
  );
}
