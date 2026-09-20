import { FormEvent, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Auth() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const result =
      mode === 'login' ? await signIn(email, password) : await signUp(email, password, name);
    setBusy(false);
    if (result) setError(result);
  }

  return (
    <div className="auth-wrap">
      <div className="auth-brand">🏓 Cricca</div>
      <div className="auth-sub">
        {mode === 'login'
          ? 'Bentornato. Accedi per vedere i tuoi gruppi.'
          : 'Crea il tuo account per iniziare a organizzare.'}
      </div>

      <form onSubmit={handleSubmit}>
        {mode === 'signup' && (
          <div className="form-field">
            <label>Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Come ti chiami"
              required
            />
          </div>
        )}
        <div className="form-field">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@esempio.it"
            required
          />
        </div>
        <div className="form-field">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Almeno 6 caratteri"
            minLength={6}
            required
          />
        </div>

        {error && <div className="error-text">{error}</div>}

        <button className="primary-btn" type="submit" disabled={busy}>
          {busy ? 'Un attimo…' : mode === 'login' ? 'Accedi' : 'Crea account'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--ink-soft)' }}>
        {mode === 'login' ? (
          <>
            Non hai un account?{' '}
            <span className="link-text" onClick={() => setMode('signup')}>
              Registrati
            </span>
          </>
        ) : (
          <>
            Hai già un account?{' '}
            <span className="link-text" onClick={() => setMode('login')}>
              Accedi
            </span>
          </>
        )}
      </div>
    </div>
  );
}
