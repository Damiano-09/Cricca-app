import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AVATAR_COLORS } from '../types';
import { THEMES, applyTheme } from '../lib/themes';

const AVATAR_EMOJIS = ['😀', '😎', '🔥', '⭐', '🏓', '🎾', '⚽', '🎉', '🐱', '🐶', '🦁', '🌵', '🍕', '🚀', '🎸', '🏆'];

export default function ProfileSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, updateProfile, signOut } = useAuth();
  const [name, setName] = useState(profile?.name ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!profile) return <div className={`sheet-overlay ${open ? 'open' : ''}`} />;

  async function saveName() {
    if (!name.trim()) {
      setError('Il nome non può essere vuoto');
      return;
    }
    setBusy(true);
    setError(null);
    const res = await updateProfile({ name: name.trim() });
    setBusy(false);
    if (res.error) setError(res.error);
  }

  return (
    <div className={`sheet-overlay ${open ? 'open' : ''}`}>
      <div className="sheet">
        <button className="close-x" onClick={onClose}>✕</button>
        <div className="sheet-handle" />
        <h2>Il tuo profilo</h2>
        <div className="sub">Personalizza come ti vedono gli amici del gruppo.</div>

        <div className="profile-avatar-preview" style={{ background: profile.avatar_color }}>
          {profile.avatar_emoji ?? profile.name.slice(0, 2).toUpperCase()}
        </div>

        <div className="form-field">
          <label>Nome</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        {error && <div className="error-text">{error}</div>}
        <button className="secondary-btn" onClick={saveName} disabled={busy} style={{ marginTop: 0 }}>
          {busy ? 'Salvataggio…' : 'Salva nome'}
        </button>

        <div className="form-field" style={{ marginTop: 22 }}>
          <label>Colore avatar</label>
          <div className="swatch-row">
            {AVATAR_COLORS.map((c) => (
              <button
                key={c}
                className={`swatch ${profile.avatar_color === c ? 'sel' : ''}`}
                style={{ background: c }}
                onClick={() => updateProfile({ avatar_color: c })}
              />
            ))}
          </div>
        </div>

        <div className="form-field">
          <label>Emoji avatar (opzionale)</label>
          <div className="emoji-row">
            <button
              className={`emoji-choice ${!profile.avatar_emoji ? 'sel' : ''}`}
              onClick={() => updateProfile({ avatar_emoji: null })}
            >
              Aa
            </button>
            {AVATAR_EMOJIS.map((e) => (
              <button
                key={e}
                className={`emoji-choice ${profile.avatar_emoji === e ? 'sel' : ''}`}
                onClick={() => updateProfile({ avatar_emoji: e })}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="form-field">
          <label>Tema dell'app</label>
          <div className="theme-grid">
            {THEMES.map((t) => (
              <button
                key={t.id}
                className={`theme-choice ${profile.theme === t.id ? 'sel' : ''}`}
                onClick={() => {
                  applyTheme(t.id);
                  updateProfile({ theme: t.id });
                }}
              >
                <span className="theme-swatch">
                  {t.swatch.map((c, i) => (
                    <i key={i} style={{ background: c }} />
                  ))}
                </span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <button className="danger-link" onClick={signOut}>
          Esci dall'account
        </button>
      </div>
    </div>
  );
}
