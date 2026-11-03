<h1 align="center">whoami-cms</h1>

<p align="center"><strong>Your portfolio. Your content. One hidden admin.</strong></p>

<p align="center"><strong>English</strong> · <a href="README.it.md">Italiano</a> · <a href="README.technical.md">Technical README</a></p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-a78bfa?style=flat-square&labelColor=0e1018" alt="License: MIT">
  <img src="https://img.shields.io/badge/site-IT%20%C2%B7%20EN-a78bfa?style=flat-square&labelColor=0e1018" alt="Italian and English">
  <img src="https://img.shields.io/badge/PWA-installable-a78bfa?style=flat-square&labelColor=0e1018" alt="Installable PWA">
  <img src="https://img.shields.io/badge/database-one%20SQLite%20file-a78bfa?style=flat-square&labelColor=0e1018" alt="One SQLite file">
</p>

whoami-cms is a personal portfolio for developers that you own and edit from a **hidden admin panel**. The public site is a designed one-page layout in Italian and English; the content (profile, experience, projects, education, certifications, skills) lives in a single SQLite file that you fill in from the browser. No page builder, no plugins, no database server.

<p align="center">
  <img src="docs/screenshots/site-desktop-home.webp" width="760" alt="Home page of the demo site on desktop">
</p>

> The demo content is a made-up developer, *Alex Rossi*. The public site exists in English and Italian; the **admin interface is in Italian** for now.

## Why whoami-cms

- **You own it.** Your server, your data in one file you can download, no hosted service in the middle.
- **A finished design, not a blank canvas.** The layout is fixed and mobile-first: you only write the content, so the result always looks right.
- **Hidden by design.** The admin is reachable only by typing `/admin`: no link anywhere, no search indexing, one password that never touches the database.
- **Bilingual from the start.** Every text has an Italian and an English version, with the visitor's language remembered.

## Features

### The public site

- **Hero** with your name, role, rotating phrases, an "open to new opportunities" badge, photo (or initials), links to GitHub and LinkedIn and a CV download button.
- **About** with a headline, your story and numbers computed from your data: years of experience, side projects, certifications, technologies in your stack.
- **Stack** grouped by area, each skill with a level (basic, intermediate, advanced, expert) shown as steps; **languages** with CEFR levels.
- **Experience** with role, company, dates, description, technologies and the projects you followed, each one a link card.
- **Side projects** with a featured card and a filterable grid (apps, libraries, infrastructure), and links to the repository, a demo or a package page.
- **Education** and **certifications**, with credential ids and verification links. Past entries can be hidden instead of deleted.
- **Contact form** with a honeypot field and a rate limit. Messages are stored in the admin and forwarded to your e-mail.
- **Installable PWA**: add it to the home screen, and it opens offline with the last content seen.

### The hidden admin

- **One password**, set as a hash in the environment, with a lockout after repeated failures.
- **Everything editable** in sections: profile, experience, projects, education, certifications, skills and languages. Reorder with the arrows, hide an item, mark a project as featured, switch the availability badge.
- **Photo and CV upload**; the CV download button shows the file size.
- **CV generator**: from the same content, in Italian or English, it builds a clean two-column PDF right in your browser (nothing leaves it) and can publish it as the site's CV. Private details such as date of birth or address are used only for the PDF and never reach the public site.
- **Italian and English tabs** on every text. With a DeepL key, empty English texts are translated on save and flagged *to review* until you approve them.
- **Messages inbox** for the contact form: mark as read, delete, reply.
- **Backup and restore** of the whole database with two clicks.

### Made to be deployed

- Two production Docker images and a GitHub Actions workflow that tests, builds and publishes them.
- Health checks, JSON logs for a log shipper and strict security headers out of the box.

## Screenshots

### The site

<p align="center">
  <img src="docs/screenshots/site-desktop-stack.webp" width="400" alt="Stack with skill levels">
  <img src="docs/screenshots/site-desktop-experience.webp" width="400" alt="Experience with followed projects">
</p>
<p align="center">
  <img src="docs/screenshots/site-desktop-projects.webp" width="600" alt="Featured project and projects grid">
</p>

### On a phone

<p align="center">
  <img src="docs/screenshots/site-mobile-home.webp" width="200" alt="Home on a phone">
  <img src="docs/screenshots/site-mobile-menu.webp" width="200" alt="Mobile menu">
  <img src="docs/screenshots/site-mobile-projects.webp" width="200" alt="Projects on a phone">
</p>

### The admin

<p align="center">
  <img src="docs/screenshots/admin-login.webp" width="400" alt="Admin login">
  <img src="docs/screenshots/admin-profile.webp" width="400" alt="Profile section">
</p>
<p align="center">
  <img src="docs/screenshots/admin-projects.webp" width="400" alt="Projects section">
  <img src="docs/screenshots/admin-stack.webp" width="400" alt="Skills section">
</p>
<p align="center">
  <img src="docs/screenshots/admin-backup.webp" width="400" alt="Backup and restore">
</p>

## Tech stack

Laravel 13 (PHP 8.4-FPM) · SQLite · React 19 + TypeScript + Vite · Nginx · Docker · GitHub Actions.

## Run it, configure it, deploy it

Local setup, configuration, the admin guide, backup, deployment and tests are in the **[technical README](README.technical.md)**. To report a security problem, see [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE).
