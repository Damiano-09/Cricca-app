import { useState } from 'react';
import { useGroups } from '../hooks/useGroups';

export default function JoinGroupSheet({
  open,
  onClose,
  joinGroupByCode,
}: {
  open: boolean;
  onClose: () => void;
  joinGroupByCode: ReturnType<typeof useGroups>['joinGroupByCode'];
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleJoin() {
    if (!code.trim()) return;
    setBusy(true);
    setError(null);
    const res = await joinGroupByCode(code);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setCode('');
    onClose();
  }

  return (
    <div className={`sheet-overlay ${open ? 'open' : ''}`}>
      <div className="sheet">
        <button className="close-x" onClick={onClose}>✕</button>
        <div className="sheet-handle" />
        <h2>Unisciti a un gruppo</h2>
        <div className="sub">Inserisci il codice invito che ti hanno mandato.</div>

        <div className="form-field">
          <label>Codice invito</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="es. TRB-482K"
          />
        </div>

        {error && <div className="error-text">{error}</div>}

        <button className="primary-btn" onClick={handleJoin} disabled={busy}>
          {busy ? 'Verifica…' : 'Entra nel gruppo'}
        </button>
      </div>
    </div>
  );
}
