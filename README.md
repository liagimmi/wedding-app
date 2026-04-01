# Wedding Memories App

Web app mobile-first per il matrimonio. Gli ospiti aprono il link, scattano foto o registrano video e li caricano in una cartella Google Drive.

## Cosa fa

- anteprima fotocamera dal browser
- scatto foto
- registrazione video breve
- upload verso backend Next.js
- salvataggio finale in Google Drive
- supporto anche al caricamento da galleria del telefono

## Requisiti

- Node.js 18+
- un progetto Google Cloud
- Google Drive API abilitata
- credenziali OAuth 2.0 di tipo Web application
- una cartella Google Drive di tua proprietà

## Setup Google Drive con OAuth (consigliato per Drive personale)

Questa versione usa OAuth 2.0 del tuo account Google personale. È la scelta giusta per salvare i file nel tuo My Drive, perché i service account non hanno quota storage e Google consiglia Shared Drives oppure OAuth per conto di un utente umano.

### 1. Crea le credenziali OAuth 2.0

1. Vai su Google Cloud Console.
2. Seleziona il progetto.
3. Abilita la **Google Drive API**.
4. Vai su **APIs & Services → Credentials**.
5. Crea un client OAuth 2.0 di tipo **Web application**.
6. Per ottenere il refresh token in modo semplice puoi usare OAuth Playground.

### 2. Ottieni un refresh token

Metodo semplice:

1. Apri OAuth Playground.
2. Clicca l'icona ingranaggio in alto a destra.
3. Attiva **Use your own OAuth credentials**.
4. Inserisci il tuo `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`.
5. Nello scope inserisci:
   - `https://www.googleapis.com/auth/drive.file`
6. Autorizza il tuo account Google.
7. Scambia il codice per i token.
8. Copia il `refresh_token`.

### 3. Crea o scegli la cartella Drive

1. Crea la cartella Drive dove salvare i file.
2. Copia l'ID della cartella dall'URL.

## Configurazione

Copia `.env.example` in `.env.local` e compila i valori:

```bash
cp .env.example .env.local
```

Variabili:

- `GOOGLE_CLIENT_ID`: client ID OAuth Google
- `GOOGLE_CLIENT_SECRET`: client secret OAuth Google
- `GOOGLE_REFRESH_TOKEN`: refresh token del tuo account Google
- `GOOGLE_DRIVE_FOLDER_ID`: ID della cartella Drive
- `UPLOAD_MAX_MB`: limite dimensione file
- `NEXT_PUBLIC_APP_NAME`: titolo dell'app nel frontend

## Avvio locale

```bash
npm install
npm run dev
```

Poi apri:

```text
http://localhost:3000
```

Per test da smartphone sulla stessa rete:

```bash
npm run dev -- --hostname 0.0.0.0
```

## Deploy consigliato

Puoi deployare su:

- Vercel
- Railway
- Render
- Google Cloud Run

Ricordati di impostare le stesse variabili ambiente del file `.env.local` nella piattaforma di hosting.

## Note importanti

- Su iPhone e alcuni browser, la registrazione video può avere differenze di formato.
- Per un evento reale, conviene testare prima su iPhone Safari e Chrome Android.
- Se vuoi evitare abusi, puoi aggiungere una password iniziale o un codice evento.
- Se il matrimonio avrà molti ospiti, potresti aggiungere compressione lato client e barra di progresso.

## Possibili miglioramenti

- schermata iniziale con nomi degli sposi
- QR code stampabile
- password evento
- moderazione admin
- galleria privata
- supporto multi-cartella per tavoli o momenti diversi
