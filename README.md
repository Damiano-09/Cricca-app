# 🏓 Cricca — MVP full-stack

App multi-utente per organizzare eventi di gruppo (padel, calcetto, tennis...).
Stack: **React + TypeScript + Vite**, backend **Supabase** (Postgres + Auth + Realtime), deploy su **Vercel**.

Flusso implementato: registrazione/login → creazione gruppo → invito amici via codice →
creazione evento → conferma partecipazione (🟢/🟡/⚪) → tutto sincronizzato in tempo reale
tra i dispositivi del gruppo.

---

## 1. Crea il progetto Supabase (backend)

1. Vai su [supabase.com](https://supabase.com) → crea un account gratuito → **New project**.
2. Scegli nome, password del database e regione (es. Frankfurt per l'Italia). Attendi ~2 minuti.
3. Nel menu a sinistra apri **SQL Editor** → **New query**.
4. Copia **tutto** il contenuto del file `supabase/schema.sql` di questo progetto, incollalo
   ed esegui (**Run**). Questo crea tabelle, permessi (RLS) e trigger automatici.
5. Vai su **Project Settings → API**: copia `Project URL` e la chiave `anon public`.
   Ti serviranno tra un minuto.
6. (Facoltativo ma consigliato) In **Authentication → Providers → Email**, disattiva
   "Confirm email" durante lo sviluppo, così puoi registrarti e accedere subito senza
   dover configurare un server SMTP. Per la produzione riattivala e configura l'invio email.

## 2. Avvia il progetto in locale

Requisito: [Node.js](https://nodejs.org) 18 o superiore installato.

```bash
cd cricca-app
npm install
cp .env.example .env
```

Apri `.env` e incolla i valori copiati dal punto 1.5:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=la-tua-anon-key
```

Avvia il server di sviluppo:

```bash
npm run dev
```

Apri il link mostrato in console (di solito `http://localhost:5173`). Registra un utente,
crea un gruppo, copia il codice invito e prova ad accedere con un secondo account
(es. da una finestra in incognito) per vedere la sincronizzazione in tempo reale.

## 3. Pubblica online su Vercel

**Opzione A — dashboard Vercel (più semplice):**
1. Carica la cartella `cricca-app` come repository su GitHub (o GitLab/Bitbucket).
2. Vai su [vercel.com](https://vercel.com) → **Add New → Project** → importa il repository.
3. Vercel riconosce automaticamente **Vite**: non serve cambiare nulla nel build.
4. In **Environment Variables** aggiungi le stesse due variabili del file `.env`:
   `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
5. Clicca **Deploy**. In circa un minuto avrai un URL pubblico tipo `cricca-app.vercel.app`.

**Opzione B — CLI, senza GitHub:**
```bash
npm install -g vercel
cd cricca-app
vercel
```
Segui le domande a schermo, poi imposta le variabili d'ambiente quando richiesto
(o dopo, da `vercel env add`), infine `vercel --prod` per la versione definitiva.

## 4. Come funziona il "core" implementato

- **Auth**: Supabase Auth (email + password). Alla registrazione un trigger SQL crea
  automaticamente la riga in `profiles`.
- **Gruppi**: ogni gruppo ha un `invite_code` generato casualmente (es. `TRB-482K`).
  Chi lo inserisce entra a far parte del gruppo (`group_members`).
- **Eventi**: creati dentro un gruppo con sport, data/ora, numero posti.
- **RSVP**: ogni utente scrive solo la propria riga in `event_participants`
  (🟢 confermato / 🟡 forse / ⚪ non vengo) — protetto da Row Level Security,
  nessuno può rispondere per un altro.
- **Realtime**: le modifiche a eventi e RSVP vengono trasmesse via Supabase Realtime
  a tutti i membri del gruppo connessi, senza bisogno di ricaricare la pagina.
- **Suggerimento inviti**: quando mancano posti, l'app propone i membri del gruppo
  non ancora coinvolti nell'evento e prepara un messaggio pronto da incollare
  (copiato negli appunti) — non scrive per conto di altri utenti, per rispetto dei permessi.

## 5. Sicurezza (Row Level Security)

Tutte le tabelle hanno RLS attiva (vedi `supabase/schema.sql`):
- un utente vede solo i gruppi di cui è membro e gli eventi di quei gruppi;
- può scrivere solo la propria risposta a un evento;
- solo chi appartiene al gruppo può crearvi eventi.

La lettura dei gruppi è volutamente permissiva (qualunque utente autenticato può leggere
nome/emoji di un gruppo) per permettere di vedere l'anteprima tramite codice invito prima
di entrare — nessun dato sensibile è esposto. Per un'app in produzione con più utenti reali,
valuta di spostare la verifica del codice invito in una funzione Postgres dedicata.

## 6. Prossimi passi naturali (fuori dall'MVP)

- Notifiche push reali (reminder T-24h / T-2h) via servizio esterno (es. OneSignal) o
  Supabase Edge Functions + cron.
- Lista d'attesa quando i posti sono esauriti.
- Spese condivise per evento.
- Estensione a cene/weekend con più campi (luogo, note).
- Onboarding con invito via link diretto (deep link) invece del solo codice.
