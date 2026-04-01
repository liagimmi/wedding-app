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
- un service account con chiave JSON
- una cartella Google Drive condivisa con il service account

## Setup Google Drive

1. Crea un progetto in Google Cloud.
2. Abilita la **Google Drive API**.
3. Crea un **Service Account**.
4. Genera una chiave JSON.
5. Crea la cartella Drive dove salvare i file.
6. Condividi la cartella con l'indirizzo email del service account come editor.
7. Copia l'ID della cartella dall'URL di Google Drive.

## Configurazione

Copia `.env.example` in `.env.local` e compila i valori:

```bash
cp .env.example .env.local
```

Variabili:

- `GOOGLE_CLIENT_EMAIL`: email del service account
- `GOOGLE_PRIVATE_KEY`: chiave privata del service account
- `GOOGLE_DRIVE_FOLDER_ID`: ID della cartella Drive
- `UPLOAD_MAX_MB`: limite dimensione file
- `APP_NAME`: titolo dell'app

Per mostrare il nome nel frontend, aggiungi anche:

```bash
NEXT_PUBLIC_APP_NAME="Il Matrimonio di Marco e Sara"
```

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
