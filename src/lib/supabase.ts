import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  // eslint-disable-next-line no-console
  console.error(
    'Mancano VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copia .env.example in .env e inserisci le tue chiavi Supabase.'
  );
}

export const supabase = createClient(url, anonKey);

/** Genera un codice invito leggibile, es. "TRB-482K" */
export function generateInviteCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const pick = (s: string, n: number) =>
    Array.from({ length: n }, () => s[Math.floor(Math.random() * s.length)]).join('');
  return `${pick(letters, 3)}-${pick(digits, 3)}`;
}
