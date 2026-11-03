# Security

## Reporting a vulnerability

Please do not open a public issue for a security problem. Use GitHub's private reporting instead: the repository's **Security** tab → **Report a vulnerability**. The report stays visible only to you and the maintainer until it is fixed.

If you can, include:

- the affected version or commit;
- the steps to reproduce the problem on a local installation;
- the impact you expect (which data or which account is exposed).

You will get a first reply within a few days. Reports in English or Italian are both welcome. Do not run tests against installations that are not yours.

## What the project already does

- One admin password, stored only as a bcrypt hash in the environment, with a limit of failed attempts per IP address.
- Session cookie with CSRF protection, `noindex` on `/admin`, no link to the admin from the public site.
- Contact form protected by a honeypot field and a per-IP rate limit.
- Security headers (CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`) sent by the Nginx container.

## Segnalare una vulnerabilità

Non aprire una issue pubblica per un problema di sicurezza. Usa la segnalazione privata di GitHub: scheda **Security** del repository → **Report a vulnerability**. La segnalazione resta visibile solo a te e al maintainer finché non viene risolta.

Indica, se puoi:

- la versione o il commit interessato;
- i passi per riprodurre il problema su un'installazione locale;
- l'impatto che ti aspetti (quale dato o quale account è esposto).

Riceverai una prima risposta entro qualche giorno. Non eseguire test su installazioni che non sono tue.
