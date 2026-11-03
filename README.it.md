# whoami-cms

<p align="center"><a href="README.md">English</a> · <strong>Italiano</strong></p>

**Un portfolio personale che possiedi e modifichi da un pannello admin nascosto.** Sito pubblico in italiano e inglese, admin con una sola password su `/admin`, database in un unico file SQLite e immagini Docker pronte da pubblicare. Niente page builder, niente plugin: una piccola API Laravel e un sito React che compili dal browser.

<p align="center">
  <img src="docs/screenshots/site-desktop-home.webp" width="640" alt="Home del sito demo su desktop">
</p>

<p align="center">
  <img src="docs/screenshots/site-mobile-home.webp" width="200" alt="Home su telefono">
  <img src="docs/screenshots/site-mobile-menu.webp" width="200" alt="Menu mobile">
  <img src="docs/screenshots/site-mobile-projects.webp" width="200" alt="Progetti su telefono">
</p>

> I contenuti demo sono quelli di un profilo inventato, *Alex Rossi*. Il sito pubblico esiste in inglese e in italiano; per ora l'**interfaccia dell'admin è solo in italiano**.

## Cosa include

- **Sito a pagina unica** con hero, chi sono, stack con livelli di competenza, esperienza, progetti personali, formazione, certificazioni e modulo contatti.
- **Italiano e inglese** per ogni testo, con cambio lingua dalla pagina e lingua ricordata.
- **Admin nascosto**, raggiungibile solo scrivendo `/admin`: nessun link, `noindex`, una password che imposti nell'ambiente e mai nel database.
- **Tutto modificabile**: profilo, foto e CV, esperienza, progetti, formazione, certificazioni, competenze e lingue (livelli CEFR). Si riordina, si nasconde, si mette un progetto in evidenza e si accende o spegne il badge «aperto a nuove opportunità».
- **Modulo contatti** con campo trappola (honeypot) e limite di richieste. I messaggi restano nell'admin e arrivano anche via email.
- **Backup e ripristino** dell'intero database dall'admin.
- **PWA installabile**, che si apre anche offline con gli ultimi contenuti visti.
- **Traduzione automatica facoltativa** italiano → inglese con DeepL, con il segno «da controllare» finché non approvi ogni testo.
- **Immagini di produzione** per Docker e un workflow GitHub Actions che testa, costruisce e pubblica.

## L'admin

<p align="center">
  <img src="docs/screenshots/admin-projects.webp" width="420" alt="Sezione Progetti dell'admin">
  <img src="docs/screenshots/admin-stack.webp" width="420" alt="Sezione Competenze dell'admin">
</p>

## Altre parti del sito

<p align="center">
  <img src="docs/screenshots/site-desktop-stack.webp" width="420" alt="Sezione stack con i livelli">
  <img src="docs/screenshots/site-desktop-projects.webp" width="420" alt="Sezione progetti">
</p>

## Avvio rapido

Serve solo Docker.

```bash
cp backend/.env.example backend/.env
docker compose up -d
docker compose exec app composer install
docker compose exec app php artisan key:generate
docker compose exec app php artisan migrate --seed
docker compose exec app php artisan storage:link
docker compose exec app php artisan admin:hash-password
```

Incolla in `backend/.env` la riga `ADMIN_PASSWORD_HASH='…'` che viene stampata, poi apri:

- sito: <http://localhost:5174>
- admin: <http://localhost:5174/admin>
- email di prova (Mailpit): <http://localhost:8026>

Il seeder carica il profilo demo e si rifiuta di girare due volte, quindi non sovrascrive mai quello che modifichi. Per partire dai tuoi contenuti apri l'admin e sostituisci ogni testo.

## Rendilo tuo

1. **Contenuti**: modifica tutto da `/admin`.
2. **Nome, titolo e meta tag**: copia `frontend/.env.example` in `frontend/.env` e imposta `VITE_SITE_NAME`, `VITE_SITE_TAGLINE`, `VITE_SITE_DESCRIPTION`, `VITE_SITE_SHORT_NAME` e `VITE_SITE_INITIALS`.
3. **Icone**: sostituisci i file in `frontend/public/icons/` e `frontend/public/favicon.svg`.
4. **Testi fissi** (menu, titoli): `frontend/src/lib/i18n.tsx`.

## Documentazione

- [Guida tecnica](docs/TECHNICAL.it.md): architettura, configurazione, guida all'admin, backup, deploy, test ([English](docs/TECHNICAL.md)).
- [Politica di sicurezza](SECURITY.md).

## Stack

Laravel 13 (PHP 8.4-FPM) · SQLite · React 19 + TypeScript + Vite · Nginx · Docker · GitHub Actions.

## Licenza

[MIT](LICENSE).
