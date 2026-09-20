import type { EventWithParticipants, Profile } from '../types';

function formatWhen(iso: string) {
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
  const time = new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit' }).format(d);
  return { day: day.charAt(0).toUpperCase() + day.slice(1), time };
}

export default function EventCard({
  event,
  members,
  onOpen,
}: {
  event: EventWithParticipants;
  members: Profile[];
  onOpen: () => void;
}) {
  const inCount = Object.values(event.participants).filter((s) => s === 'in').length;
  const missing = event.seats - inCount;
  const { day, time } = formatWhen(event.starts_at);
  const [ico, ...rest] = event.sport.split(' ');

  const candidates = members.filter((m) => !(m.id in event.participants)).slice(0, 2);

  return (
    <div className="event-card" onClick={onOpen}>
      <div className="event-top">
        <div className="event-title">
          <span className="ico">{ico}</span>
          <div className="event-title-text">
            <div className="sport">{rest.join(' ')}</div>
            <div className="when">{day} · {time}</div>
          </div>
        </div>
        <div className={`seat-pill ${missing > 0 ? 'missing' : 'full'}`}>
          {missing > 0 ? `${missing} post${missing === 1 ? 'o' : 'i'} libero${missing === 1 ? '' : 'i'}` : 'Al completo'}
        </div>
      </div>

      <div className="avatars-row">
        {members
          .filter((m) => m.id in event.participants)
          .map((m) => (
            <div className="dot-participant" key={m.id}>
              <span className={`dot ${event.participants[m.id]}`} />
              {m.name}
            </div>
          ))}
      </div>

      {missing > 0 && candidates.length > 0 && (
        <div className="suggest-row">
          <b>Manca {missing}.</b> Suggerito:{' '}
          <span className="suggest-names">{candidates.map((c) => c.name).join(', ')}</span>
        </div>
      )}
    </div>
  );
}
