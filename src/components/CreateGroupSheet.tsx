import { useState } from 'react';
import { useGroups } from '../hooks/useGroups';

const EMOJI_CHOICES = ['🏓', '⚽', '🎾', '🍝', '🎉', '🏀'];

export default function CreateGroupSheet({
  open,
  onClose,
  createGroup,
}: {
  open: boolean;
  onClose: () => void;
  createGroup: ReturnType<typeof useGroups>['createGroup'];
}) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🏓');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    if (!name.trim()) {
      setError('Dai un nome al gruppo');
      return;
    }
    setBusy(true);
    setError(null);
    const res = await createGroup(name.trim(), emoji);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setName('');
    onClose();
  }

  return (
    <div className={`sheet-overlay ${open ? 'open' : ''}`}>
      <div className="sheet">
        <button className="close-x" onClick={onClose}>✕</button>
        <div className="sheet-handle" />
        <h2>Nuovo gruppo</h2>
        <div className="sub">Crea il gruppo, poi condividi il codice invito con gli amici.</div>

        <div className="form-field">
          <label>Icona</label>
          <div className="sport-choices">
            {EMOJI_CHOICES.map((e) => (
              <div
                key={e}
                className={`sport-chip ${emoji === e ? 'sel' : ''}`}
                onClick={() => setEmoji(e)}
              >
                {e}
              </div>
            ))}
          </div>
        </div>

        <div className="form-field">
          <label>Nome del gruppo</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="es. I Terribili"
          />
        </div>

        {error && <div className="error-text">{error}</div>}

        <button className="primary-btn" onClick={handleCreate} disabled={busy}>
          {busy ? 'Creazione…' : 'Crea gruppo'}
        </button>
      </div>
    </div>
  );
}
