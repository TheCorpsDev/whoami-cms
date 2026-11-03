# whoami-cms — README tecnico

<p><a href="README.technical.md">English</a> · <strong>Italiano</strong> · <a href="README.it.md">Torna alla presentazione</a></p>

Guida per eseguire, verificare, configurare e distribuire whoami-cms. Per cosa è e cosa fa l'app consulta la [presentazione](README.it.md).

## Architettura

```
Browser ──► Nginx ──► /            app React a pagina singola (sito + blocco admin caricato a richiesta)
                  ├─► /api/*       PHP-FPM ► Laravel ► SQLite
                  ├─► /healthz     controllo di salute di Laravel
                  └─► /storage/*   foto e CV caricati dall'admin (volume in sola lettura)
```

| Parte | Tecnologia |
|---|---|
| Backend | Laravel 13 su PHP 8.4-FPM, API JSON |
| Database | SQLite, un solo file nel volume `storage` |
| Frontend | React 19 + TypeScript + Vite; l'admin è un blocco separato che i visitatori non scaricano mai |
| Web server | Nginx, che serve il frontend compilato e inoltra `/api` a PHP-FPM |
| Email | qualsiasi server SMTP (Mailpit in sviluppo) |
| Pacchetto | due immagini: `api` (PHP-FPM) e `web` (Nginx + frontend compilato) |

- **API pubblica**: `GET /api/portfolio` restituisce solo i contenuti visibili, in ordine; `POST /api/contact` riceve il modulo contatti (con limite di richieste).
- **API admin**: `/api/admin/*`, cookie di sessione con token CSRF. Senza sessione valida risponde 401.
- **Campi traducibili** salvati come `{ "it": "…", "en": "…" }`. Le date sono stringhe `AAAA-MM`.
- **Contenuti nascondibili e riordinabili**: esperienze, progetti, formazione, certificazioni e gruppi di competenze hanno una `position` e un flag `visible`. Quelli nascosti non compaiono mai nell'API pubblica.

## Requisiti

Docker con Compose. Sul computer non serve altro: PHP, Composer e Node girano nei container.

## Avvio in locale

```bash
cp backend/.env.example backend/.env
docker compose up -d
docker compose exec app composer install
docker compose exec app php artisan key:generate
docker compose exec app php artisan migrate --seed
docker compose exec app php artisan storage:link
docker compose exec app php artisan admin:hash-password   # incolla il risultato in backend/.env
```

| Cosa | Dove |
|---|---|
| Sito e admin | <http://localhost:5174> e `/admin` (server di sviluppo Vite con ricarica a caldo) |
| API tramite Nginx | <http://localhost:8081> |
| Email di prova (Mailpit) | <http://localhost:8026> |

Le porte si cambiano con `FRONTEND_PORT`, `API_PORT` e `MAILPIT_PORT`. La cartella `node_modules` sta in un volume con nome, così non entra in conflitto con quella del computer.

### Test e controlli

```bash
docker compose exec app php artisan test            # backend: 30 test
docker compose exec frontend npx tsc -b --noEmit    # tipi
docker compose exec frontend npm run lint           # oxlint
docker compose exec frontend npm run build
```

Seeder, test e screenshot usano tutti il profilo inventato in `backend/database/seeders/DatabaseSeeder.php`.

## Rendilo tuo

1. **Contenuti**: modifica tutto da `/admin`.
2. **Nome, titolo e meta tag**: copia `frontend/.env.example` in `frontend/.env` e imposta le variabili `VITE_SITE_*` (vedi sotto).
3. **Icone**: imposta `VITE_SITE_INITIALS` e la build disegna favicon e icone della schermata home con quelle lettere. Per una grafica tua lascia la variabile vuota e sostituisci i file in `frontend/public/icons/` e `frontend/public/favicon.svg`.
4. **Testi fissi** (menu, titoli): `frontend/src/lib/i18n.tsx`.

## Configurazione

### Backend (`backend/.env` in sviluppo, il `.env` del server in produzione)

| Variabile | Significato |
|---|---|
| `APP_KEY` | Chiave di Laravel (`php artisan key:generate`; in produzione `base64:` + `openssl rand -base64 32`). |
| `APP_URL` | Indirizzo pubblico del sito. |
| `ADMIN_PASSWORD_HASH` | Hash bcrypt della password admin, **tra apici singoli** perché contiene `$`. È l'unico modo per impostare o cambiare la password. |
| `ADMIN_LOGIN_MAX_ATTEMPTS` / `ADMIN_LOGIN_DECAY_MINUTES` | Tentativi falliti consentiti per IP e durata del blocco (predefiniti 5 / 15 minuti). |
| `CONTACT_NOTIFY_EMAIL` | Dove inoltrare i messaggi del modulo. Vuoto = restano solo nell'admin. |
| `CONTACT_MAX_PER_HOUR` | Messaggi accettati per IP all'ora (predefinito 5). |
| `CONTACT_MAX_GLOBAL_PER_HOUR` | Tetto orario sull'intero modulo contatti, qualunque sia l'indirizzo (predefinito 60). I client IPv6 condividono una quota per prefisso /64, anche per il blocco del login admin. |
| `MAIL_*` | Impostazioni SMTP per l'email di notifica. |
| `DB_DATABASE` | Percorso del file SQLite (in produzione dentro il volume `storage`). |
| `LOG_CHANNEL`, `LOG_STDERR_FORMATTER` | In produzione `stderr`; con il formatter `Monolog\Formatter\JsonFormatter` i log sono in JSON. |
| `DEEPL_API_KEY`, `DEEPL_TARGET_LANG`, `DEEPL_API_URL` | Traduzione automatica facoltativa (vedi sotto). |

### Frontend (in fase di build)

`VITE_SITE_NAME`, `VITE_SITE_TAGLINE`, `VITE_SITE_DESCRIPTION`, `VITE_SITE_SHORT_NAME`, `VITE_SITE_INITIALS`: titolo, descrizione, anteprima social, nome dell'app installata (manifest generato), lettere del logo nell'admin e di favicon e icone della schermata home. Si mettono in `frontend/.env` o nell'ambiente prima di `npm run build`. I valori predefiniti sono quelli del profilo demo.

Se `VITE_SITE_INITIALS` è impostata, `npm run build` disegna favicon e icone PWA da quelle lettere (`frontend/build/siteIcons.ts`, con resvg e un font monospazio incluso, quindi non servono font di sistema) e sostituiscono i file in `dist`. Senza, si usano così come sono i file statici in `frontend/public/icons/` e `frontend/public/favicon.svg`.

## L'admin

Si raggiunge scrivendo `/admin`; il sito pubblico non lo linka mai e risponde `noindex`. Si entra con la password di cui `ADMIN_PASSWORD_HASH` contiene l'hash. Dopo il numero massimo di tentativi falliti l'indirizzo IP resta bloccato per un po'.

Per cambiare la password: `php artisan admin:hash-password` (almeno 12 caratteri), sostituisci il valore nel `.env` e ricrea il container `app`.

| Sezione | Cosa modifichi |
|---|---|
| **Profilo** | Nome, ruolo, frasi della hero, presentazione breve, testo e frase d'apertura dell'About, tre punti di forza, lingue (livelli CEFR), contatti, badge «aperto a nuove opportunità», foto e CV. |
| **Esperienza** | Ruolo, azienda, date, descrizione, tecnologie e «progetti seguiti». Una riga con un indirizzo tra parentesi diventa un link. |
| **Progetti** | Nome, etichetta, categoria, descrizione, caratteristiche, tecnologie, link a repository, demo e pacchetto. Il primo progetto «in evidenza» diventa la card grande. |
| **Formazione** | Titolo, istituto, date, voto. Un percorso passato si nasconde invece di eliminarlo. |
| **Certificazioni** | Nome, ente, data, codice credenziale e link di verifica. |
| **Competenze** | Gruppi con voci e un livello (base, intermedio, avanzato, esperto). |
| **CV** | Genera il CV in PDF dai contenuti del sito, in italiano o in inglese. Vedi sotto. |
| **Messaggi** | Messaggi del modulo contatti, da segnare come letti o eliminare. |
| **Backup** | Scarica o ripristina il database. |

Le frecce accanto a ogni voce la spostano, l'interruttore di visibilità la nasconde. Le modifiche salvate sono subito online.

### Italiano e inglese

Ogni testo ha le schede IT e EN. Se un testo inglese è vuoto il sito mostra quello italiano. Con `DEEPL_API_KEY` impostata, i testi inglesi vuoti vengono tradotti al salvataggio e segnati «da controllare» finché non li approvi o li correggi; senza la chiave la funzione è spenta e silenziosa. Se DeepL non risponde il salvataggio funziona lo stesso e l'admin lo segnala.

### Generatore di CV

La sezione **CV** crea un PDF dai contenuti pubblicati (profilo, esperienza, formazione e, se vuoi, progetti e certificazioni) nella lingua scelta. Gira interamente nel browser con [pdfmake](https://pdfmake.github.io/docs/) caricato su richiesta: non c'è nessun componente server e il pannello scarica la libreria solo quando apri la sezione. Puoi vedere l'anteprima, scaricarlo o pubblicarlo come CV del sito (sostituisce il file caricato e attiva il pulsante di download; il file è in una sola lingua, quindi ripubblicalo quando vuoi cambiarla).

Il riquadro **Dati per il CV**, nella stessa sezione, contiene ciò che serve a un CV ma non va mostrato su un sito pubblico: data di nascita, nazionalità, sesso, indirizzo, telefono, patente e la formula sul trattamento dei dati. Sono salvati in `profiles.cv_details`, restituiti solo da `/api/admin/*` e mai da `/api/portfolio`; un test lo verifica. La foto viene ritagliata a cerchio nel browser e inserita come JPEG (un PNG farebbe avviare a pdfmake un Web Worker da blob, che la CSP di produzione `script-src 'self'` blocca).

### Backup e ripristino

*Backup → Scarica* restituisce l'intero file SQLite. *Ripristina* controlla che il file sia un backup valido, conserva una copia `*.before-restore` del database attuale ed esegue le migrazioni sui dati ripristinati. **Foto e CV non sono nel backup**: stanno nel volume `storage`, quindi vanno ricaricati dopo un ripristino su un nuovo server.

## PWA

Il service worker (`frontend/public/sw.js`) è attivo solo nelle build di produzione: prima la rete per la pagina e `/api/portfolio`, prima la cache per i file compilati, mai per `/admin` e `/api/admin`. Per costringere tutti i visitatori ad aggiornare la cache si cambia `VERSION` in quel file.

## Deploy

### Costruire e pubblicare le immagini

`.github/workflows/publish-images.yml` parte a ogni push su `main`: test del backend, controlli del frontend, poi costruisce e pubblica su Docker Hub due immagini:

- `<DOCKERHUB_USERNAME>/<DOCKERHUB_REPOSITORY>:<DOCKERHUB_IMAGE_PREFIX>-api-production`
- `<DOCKERHUB_USERNAME>/<DOCKERHUB_REPOSITORY>:<DOCKERHUB_IMAGE_PREFIX>-web-production`

Il lavoro di pubblicazione parte solo se la variabile `DOCKERHUB_REPOSITORY` è impostata: senza (un fork o un clone nuovo) girano solo test e controlli. Pubblica anche un tag con lo sha del commit, si ricostruisce ogni settimana per raccogliere le correzioni delle immagini di base e si può avviare a mano indicando un riferimento git, per un ripristino controllato.

Nelle impostazioni del repository (*Settings → Secrets and variables → Actions*) imposta:

| Tipo | Nome | Valore |
|---|---|---|
| Secret | `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN` | utente Docker Hub e token di accesso |
| Secret (facoltativo) | `DOCKERHUB_CLEANUP_TOKEN` | token con il permesso di cancellare i vecchi tag |
| Variable | `DOCKERHUB_REPOSITORY`, `DOCKERHUB_IMAGE_PREFIX` | nome del repository e prefisso dei tag, a tua scelta |
| Variable (facoltative) | `VITE_SITE_*` | nome e meta tag del sito compilato |

### Eseguirlo su un server

`deploy/compose.example.yml` e `deploy/.env.example` sono il punto di partenza.

```bash
mkdir -p /opt/whoami-cms && cd /opt/whoami-cms
cp compose.example.yml compose.yml
cp .env.example .env                     # compila i valori, permessi 600
docker volume create whoami_storage
docker compose pull && docker compose up -d --wait
```

1. Genera `APP_KEY` con `openssl rand -base64 32` e scrivila come `base64:…`.
2. Genera l'hash dell'admin senza avviare il sito:
   `docker run --rm -it --entrypoint php <immagine>:<prefisso>-api-production artisan admin:hash-password`
   e incolla la riga nel `.env` (apici singoli), poi `docker compose up -d`.
3. Metti davanti al container `web` (porta 80) un reverse proxy con TLS, sulla rete indicata da `PROXY_NETWORK`.
4. Apri `/admin`, accedi e compila i contenuti, oppure ripristina un backup.

All'avvio il container `api` crea il file SQLite, esegue le migrazioni e mette in cache configurazione, rotte e viste. Il volume `storage` è dichiarato `external` di proposito: un errore di battitura nel nome ferma il deploy invece di partire con un database vuoto.

Controlli di salute: `/healthz` (Laravel) e `/nginx-health` (solo Nginx).

### Log

Il container `api` scrive su stderr. Con `LOG_STDERR_FORMATTER=Monolog\Formatter\JsonFormatter` ogni riga è un JSON con `level_name` e `channel`, da cui uno strumento come Promtail ricava le etichette.

## Sicurezza

- Password admin solo come hash bcrypt nell'ambiente; i tentativi falliti sono limitati per IP.
- Cookie di sessione, token CSRF su ogni scrittura dell'admin, `noindex` e `X-Robots-Tag` su `/admin`.
- Modulo contatti: campo trappola e limite per IP. Un guasto della posta non fa perdere nessun messaggio: viene salvato prima di inviare l'email.
- Nginx invia CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options` e `Referrer-Policy`.
- Gli upload sono controllati per tipo e serviti da Nginx da un volume in sola lettura.
- I problemi si segnalano in privato, vedi [SECURITY.md](SECURITY.md).

## Rigenerare gli screenshot

```bash
mkdir /tmp/shots && cd /tmp/shots && npm i --no-save playwright sharp
BASE_URL=http://localhost:5174 ADMIN_PASSWORD='la-tua-password-di-sviluppo' node /percorso/di/whoami-cms/scripts/screenshots.mjs
```

Serve uno stack in esecuzione con i dati demo; le immagini finiscono in `docs/screenshots/`. Senza `ADMIN_PASSWORD` vengono catturate solo le pagine pubbliche.

## Struttura del progetto

```
backend/    API Laravel (app/, database/seeders/DatabaseSeeder.php, tests/)
frontend/   app React (src/site, src/admin, src/lib) e file statici (public/)
docker/     Dockerfile e configurazione Nginx (sviluppo e produzione)
deploy/     esempio di Compose e .env di produzione
scripts/    pulizia dei tag Docker Hub, generatore di screenshot
docs/       screenshot usati dai README
```
