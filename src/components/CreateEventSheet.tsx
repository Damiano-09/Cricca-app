import { useState } from 'react';
import { SPORTS } from '../types';

export default function CreateEventSheet({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (sport: string, startsAtISO: string, seats: number) => Promise<{ error: string | null }>;
}) {
  const [sport, setSport] = useState<string>(SPORTS[0]);
  const [datetime, setDatetime] = useState('');
  const [seats, setSeats] = useState(4);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    if (!datetime) {
      setError('Scegli data e ora');
      return;
    }
    setBusy(true);
    setError(null);
    const iso = new Date(datetime).toISOString();
    const res = await onCreate(sport, iso, seats);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setDatetime('');
    onClose();
  }

  return (
    <div className={`sheet-overlay ${open ? 'open' : ''}`}>
      <div className="sheet">
        <button className="close-x" onClick={onClose}>✕</button>
        <div className="sheet-handle" />
        <h2>Nuovo evento</h2>
        <div className="sub">Bastano pochi tap: il gruppo vede subito e risponde.</div>

        <div className="form-field">
          <label>Attività</label>
          <div className="sport-choices">
            {SPORTS.map((s) => (
              <div key={s} className={`sport-chip ${sport === s ? 'sel' : ''}`} onClick={() => setSport(s)}>
                {s}
              </div>
            ))}
          </div>
        </div>

        <div className="form-field">
          <label>Data e ora</label>
          <input type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} />
        </div>

        <div className="form-field">
          <label>Posti totali</label>
          <input
            type="number"
            value={seats}
            min={2}
            max={30}
            onChange={(e) => setSeats(parseInt(e.target.value) || 2)}
          />
        </div>

        {error && <div className="error-text">{error}</div>}

        <button className="primary-btn" onClick={handleCreate} disabled={busy}>
          {busy ? 'Creazione…' : 'Crea evento'}
        </button>
      </div>
    </div>
  );
}
