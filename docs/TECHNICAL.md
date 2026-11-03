# whoami-cms — technical guide

<p><strong>English</strong> · <a href="TECHNICAL.it.md">Italiano</a> · <a href="../README.md">Back to README</a></p>

## Architecture

```
Browser ──► Nginx ──► /            React single-page app (site + lazy admin chunk)
                  ├─► /api/*       PHP-FPM ► Laravel ► SQLite
                  ├─► /healthz     Laravel health check
                  └─► /storage/*   photo and CV uploaded from the admin (read-only volume)
```

| Part | Technology |
|---|---|
| Backend | Laravel 13 on PHP 8.4-FPM, JSON API |
| Database | SQLite, one file in the `storage` volume |
| Frontend | React 19 + TypeScript + Vite; the admin is a separate lazy chunk that visitors never download |
| Web server | Nginx serving the built frontend and proxying `/api` to PHP-FPM |
| Mail | any SMTP server (Mailpit in development) |
| Packaging | two images: `api` (PHP-FPM) and `web` (Nginx + built frontend) |

- **Public API**: `GET /api/portfolio` returns only visible content, in order; `POST /api/contact` receives the contact form (throttled).
- **Admin API**: `/api/admin/*`, session cookie with CSRF token. Without a valid session it answers 401.
- **Translatable fields** are stored as `{ "it": "…", "en": "…" }`. Dates are `YYYY-MM` strings.
- **Content that can be hidden or reordered**: experiences, projects, education, certifications and skill groups have a `position` and a `visible` flag. Hidden items never appear in the public API.

## Requirements

Docker with Compose. Nothing else is needed on the host: PHP, Composer and Node run in containers.

## Run it locally

```bash
cp backend/.env.example backend/.env
docker compose up -d
docker compose exec app composer install
docker compose exec app php artisan key:generate
docker compose exec app php artisan migrate --seed
docker compose exec app php artisan storage:link
docker compose exec app php artisan admin:hash-password   # paste the output in backend/.env
```

| What | Where |
|---|---|
| Site and admin | <http://localhost:5174> and `/admin` (Vite dev server with hot reload) |
| API through Nginx | <http://localhost:8081> |
| Test e-mails (Mailpit) | <http://localhost:8026> |

The ports can be changed with `FRONTEND_PORT`, `API_PORT` and `MAILPIT_PORT`. The `node_modules` folder lives in a named volume, so it never clashes with the host.

### Tests and checks

```bash
docker compose exec app php artisan test            # backend: 30 tests
docker compose exec frontend npx tsc -b --noEmit    # types
docker compose exec frontend npm run lint           # oxlint
docker compose exec frontend npm run build
```

The seeder, the tests and the screenshots all use the made-up profile in `backend/database/seeders/DatabaseSeeder.php`.

## Configuration

### Backend (`backend/.env` in development, the server's `.env` in production)

| Variable | Meaning |
|---|---|
| `APP_KEY` | Laravel key (`php artisan key:generate`; in production `base64:` + `openssl rand -base64 32`). |
| `APP_URL` | Public address of the site. |
| `ADMIN_PASSWORD_HASH` | Bcrypt hash of the admin password, **in single quotes** because it contains `$`. It is the only way to set or change the password. |
| `ADMIN_LOGIN_MAX_ATTEMPTS` / `ADMIN_LOGIN_DECAY_MINUTES` | Failed attempts allowed per IP and how long the block lasts (default 5 / 15 minutes). |
| `CONTACT_NOTIFY_EMAIL` | Where to forward contact messages. Empty = they stay only in the admin. |
| `CONTACT_MAX_PER_HOUR` | Contact messages accepted per IP per hour (default 5). |
| `CONTACT_MAX_GLOBAL_PER_HOUR` | Cap on the whole contact form per hour, whatever the address (default 60). IPv6 clients share one quota per /64 prefix, also for the admin login lockout. |
| `MAIL_*` | SMTP settings for the notification e-mail. |
| `DB_DATABASE` | Path of the SQLite file (in production inside the `storage` volume). |
| `LOG_CHANNEL`, `LOG_STDERR_FORMATTER` | In production use `stderr`; set the formatter to `Monolog\Formatter\JsonFormatter` for JSON logs. |
| `DEEPL_API_KEY`, `DEEPL_TARGET_LANG`, `DEEPL_API_URL` | Optional automatic translation (see below). |

### Frontend (build time)

`VITE_SITE_NAME`, `VITE_SITE_TAGLINE`, `VITE_SITE_DESCRIPTION`, `VITE_SITE_SHORT_NAME`, `VITE_SITE_INITIALS`: title, description, social card, installed-app name (generated manifest) and the logo letters of the admin. Put them in `frontend/.env` or in the environment before `npm run build`. Defaults belong to the demo profile.

Icons are static files in `frontend/public/icons/` and `frontend/public/favicon.svg`.

## The admin

Reach it by typing `/admin`; the public site never links to it and answers `noindex`. Log in with the password whose hash is in `ADMIN_PASSWORD_HASH`. After the maximum number of failed attempts the IP address is blocked for a while.

To change the password run `php artisan admin:hash-password` (at least 12 characters), replace the value in the `.env` and recreate the `app` container.

| Section | What you edit |
|---|---|
| **Profile** | Name, role, hero phrases, short bio, about text and headline, three highlights, languages (CEFR levels), contacts, "open to opportunities" badge, photo and CV. |
| **Experience** | Role, company, dates, description, technologies and "followed projects". A line with a URL in brackets becomes a link. |
| **Projects** | Name, label, category, description, features, technologies, repository, demo and package links. The first "featured" project becomes the large card. |
| **Education** | Title, institution, dates, grade. Hide a past entry instead of deleting it. |
| **Certifications** | Name, issuer, date, credential id and verification link. |
| **Skills** | Groups with items and a level (basic, intermediate, advanced, expert). |
| **Messages** | Contact form messages, with read and delete. |
| **Backup** | Download or restore the database. |

Use the arrows next to each item to reorder it and the visibility switch to hide it. Saved changes are live immediately.

### Italian and English

Every text has an IT and an EN tab. If an English text is empty the site shows the Italian one. With `DEEPL_API_KEY` set, empty English texts are translated on save and flagged "to review" until you approve or correct them; without the key the feature is off and silent. If DeepL is down the save still works and the admin says so.

### Backup and restore

*Backup → Download* gives the whole SQLite file. *Restore* checks that the file is a valid backup, keeps a `*.before-restore` copy of the current database and runs the migrations on the restored data. **Photo and CV are not in the backup**: they live in the storage volume, upload them again after restoring on a new server.

## PWA

The service worker (`frontend/public/sw.js`) is active only in production builds: network-first for the page and `/api/portfolio`, cache-first for built assets, never for `/admin` or `/api/admin`. To force every visitor to refresh the cache change `VERSION` in that file.

## Deploy

### Build and publish the images

`.github/workflows/publish-images.yml` runs on every push to `main`: backend tests, frontend checks, then it builds and pushes two images to Docker Hub:

- `<DOCKERHUB_USERNAME>/<DOCKERHUB_REPOSITORY>:<DOCKERHUB_IMAGE_PREFIX>-api-production`
- `<DOCKERHUB_USERNAME>/<DOCKERHUB_REPOSITORY>:<DOCKERHUB_IMAGE_PREFIX>-web-production`

It also publishes a tag with the commit sha, rebuilds weekly to pick up base-image fixes, and can be started by hand with a git ref for a controlled rollback.

In the repository settings (*Settings → Secrets and variables → Actions*) set:

| Kind | Name | Value |
|---|---|---|
| Secret | `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN` | your Docker Hub user and an access token |
| Secret (optional) | `DOCKERHUB_CLEANUP_TOKEN` | token allowed to delete old tags |
| Variable | `DOCKERHUB_REPOSITORY`, `DOCKERHUB_IMAGE_PREFIX` | repository name and tag prefix of your choice |
| Variables (optional) | `VITE_SITE_*` | name and meta tags of the built site |

### Run it on a server

`deploy/compose.example.yml` and `deploy/.env.example` are the starting point.

```bash
mkdir -p /opt/whoami-cms && cd /opt/whoami-cms
cp compose.example.yml compose.yml
cp .env.example .env                     # fill in the values, mode 600
docker volume create whoami_storage
docker compose pull && docker compose up -d --wait
```

1. Generate `APP_KEY` with `openssl rand -base64 32` and write it as `base64:…`.
2. Generate the admin hash without starting the site:
   `docker run --rm -it --entrypoint php <image>:<prefix>-api-production artisan admin:hash-password`
   and paste the line into `.env` (single quotes), then `docker compose up -d`.
3. Put a reverse proxy with TLS in front of the `web` container (port 80), on the network named by `PROXY_NETWORK`.
4. Open `/admin`, log in and fill in the content, or restore a backup.

On start the `api` container creates the SQLite file, runs the migrations and caches configuration, routes and views. The storage volume is declared `external` on purpose: a typo in its name stops the deploy instead of starting with an empty database.

Health checks: `/healthz` (Laravel) and `/nginx-health` (Nginx only).

### Logs

The `api` container writes to stderr. With `LOG_STDERR_FORMATTER=Monolog\Formatter\JsonFormatter` each line is JSON with `level_name` and `channel`, which a log shipper such as Promtail can turn into labels.

## Security

- Admin password only as a bcrypt hash in the environment; failed attempts are limited per IP.
- Session cookie, CSRF token on every admin write, `noindex` and `X-Robots-Tag` on `/admin`.
- Contact form: honeypot field and a per-IP limit. A mail outage never loses a message: it is saved before the e-mail is sent.
- Nginx sends CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options` and `Referrer-Policy`.
- Uploads are type-checked and served by Nginx from a read-only volume.
- Report problems privately, see [SECURITY.md](../SECURITY.md).

## Regenerate the screenshots

```bash
mkdir /tmp/shots && cd /tmp/shots && npm i --no-save playwright sharp
BASE_URL=http://localhost:5174 ADMIN_PASSWORD='your-dev-password' node /path/to/whoami-cms/scripts/screenshots.mjs
```

It needs a running stack with the demo data and writes into `docs/screenshots/`. Without `ADMIN_PASSWORD` only the public site is captured.

## Project layout

```
backend/    Laravel API (app/, database/seeders/DatabaseSeeder.php, tests/)
frontend/   React app (src/site, src/admin, src/lib) and static files (public/)
docker/     Dockerfiles and Nginx configuration (dev and production)
deploy/     example production Compose file and .env
scripts/    Docker Hub tag cleanup, screenshot generator
docs/       this guide and the screenshots
```
