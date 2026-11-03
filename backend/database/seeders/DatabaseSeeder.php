<?php

namespace Database\Seeders;

use App\Models\Certification;
use App\Models\Education;
use App\Models\Experience;
use App\Models\Profile;
use App\Models\Project;
use App\Models\SkillGroup;
use Illuminate\Database\Seeder;

/**
 * Demo content for a made-up developer, so a fresh install shows a complete
 * site. Replace everything from /admin (or restore a backup): the seeder
 * refuses to run twice so it never overwrites changes made there.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (Profile::query()->exists()) {
            $this->command?->warn('The database already has a profile: seeding skipped.');

            return;
        }

        Profile::query()->create([
            'name' => 'Alex Rossi',
            'role' => ['it' => 'Backend Developer', 'en' => 'Backend Developer'],
            'rotating_words' => [
                'it' => ['API affidabili.', 'interfacce React.', 'pipeline CI/CD.', 'servizi containerizzati.'],
                'en' => ['reliable APIs.', 'React interfaces.', 'CI/CD pipelines.', 'containerised services.'],
            ],
            'hero_bio' => [
                'it' => 'Sviluppo backend con PHP e Laravel in una software house. Nei miei progetti personali costruisco applicazioni full-stack con React e TypeScript e le porto io stesso in produzione.',
                'en' => 'I build backends with PHP and Laravel at a software house. In my own projects I create full-stack applications with React and TypeScript and ship them to production myself.',
            ],
            'about_headline' => [
                'it' => 'Scrivo backend di giorno e metto in produzione *i miei progetti* la notte.',
                'en' => 'I build backends by day and ship *my own projects* by night.',
            ],
            'about' => [
                'it' => "Da marzo 2022 lavoro come Backend Developer in Acme Software. Sviluppo in PHP e Laravel con MySQL e Docker, in team che seguono Scrum.\n\nFuori dal lavoro costruisco i miei progetti personali e li metto in produzione io stesso, dal modello dei dati fino al server su cui girano: test, pipeline di rilascio e log centralizzati fanno parte di ogni progetto.\n\nQuesto è un profilo di esempio: sostituisci ogni testo dal pannello /admin.",
                'en' => "Since March 2022 I have been working as a Backend Developer at Acme Software. I develop in PHP and Laravel with MySQL and Docker, in teams that follow Scrum.\n\nOutside work I build my own projects and ship them to production myself, from the data model to the server they run on: tests, a release pipeline and centralised logs are part of every project.\n\nThis is a sample profile: replace every text from the /admin panel.",
            ],
            'highlights' => [
                [
                    'title' => ['it' => 'Architetture pulite', 'en' => 'Clean architectures'],
                    'body' => ['it' => 'API-first e permessi a ruoli: codice organizzato per crescere senza diventare fragile.', 'en' => 'API-first and role-based permissions: code organised to grow without becoming fragile.'],
                ],
                [
                    'title' => ['it' => 'Rilasci automatici', 'en' => 'Automated releases'],
                    'body' => ['it' => 'Un push su main avvia test e build: le immagini Docker arrivano sul server senza passaggi a mano.', 'en' => 'A push to main runs tests and builds: Docker images reach the server with no manual steps.'],
                ],
                [
                    'title' => ['it' => 'Osservabilità', 'en' => 'Observability'],
                    'body' => ['it' => 'Log strutturati e centralizzati, con dashboard e notifiche di deploy.', 'en' => 'Structured, centralised logs, with dashboards and deploy notifications.'],
                ],
            ],
            'languages' => [
                ['name' => ['it' => 'Italiano', 'en' => 'Italian'], 'level' => 'native'],
                ['name' => ['it' => 'Inglese', 'en' => 'English'], 'level' => 'B2'],
            ],
            'available' => true,
            'location' => ['it' => 'Milano, Italia', 'en' => 'Milan, Italy'],
            'email' => 'alex.rossi@example.com',
            'github_url' => 'https://github.com/example',
            'linkedin_url' => 'https://www.linkedin.com/in/example',
            // Fake data: the CV generator uses these, the public API never returns them.
            'cv_details' => [
                'birth_date' => '1990-01-15',
                'nationality' => 'Italiana',
                'phone' => '+39 000 000 0000',
                'address' => 'Via Esempio 1, 20100 Milano, Italia',
                'driving_license' => 'B',
                'privacy_notice' => 'Autorizzo il trattamento dei dati personali contenuti nel CV ai sensi del Regolamento UE 2016/679 (GDPR).',
            ],
        ]);

        $skills = fn (array $items) => array_map(fn (array $item) => ['name' => $item[0], 'level' => $item[1]], $items);

        $groups = [
            [['it' => 'Backend', 'en' => 'Backend'], [['PHP · Laravel', 'advanced'], ['Node.js · Express', 'intermediate'], ['Go', 'basic'], ['Python', 'intermediate']]],
            [['it' => 'Frontend', 'en' => 'Frontend'], [['TypeScript', 'intermediate'], ['React', 'intermediate'], ['Vite', 'intermediate'], ['HTML · CSS', 'intermediate'], ['PWA', 'basic']]],
            [['it' => 'Dati', 'en' => 'Data'], [['MySQL', 'advanced'], ['PostgreSQL', 'intermediate'], ['Redis', 'intermediate'], ['SQLite', 'intermediate']]],
            [['it' => 'DevOps', 'en' => 'DevOps'], [['Docker · Compose', 'advanced'], ['GitHub Actions', 'advanced'], ['Nginx', 'intermediate'], ['Linux · Bash', 'intermediate'], ['Kubernetes', 'basic']]],
            [['it' => 'API e integrazioni', 'en' => 'APIs & integrations'], [['REST API', 'advanced'], ['Webhook', 'advanced'], ['OAuth2 · JWT', 'intermediate']]],
            [['it' => 'Metodo', 'en' => 'Method'], [['Git', 'advanced'], ['Scrum', 'intermediate'], ['Test automatici', 'advanced']]],
        ];

        foreach ($groups as [$name, $items]) {
            SkillGroup::query()->create(['name' => $name, 'items' => $skills($items)]);
        }

        Experience::query()->create([
            'role' => ['it' => 'Backend Developer', 'en' => 'Backend Developer'],
            'company' => 'Acme Software',
            'employment_type' => ['it' => 'Tempo pieno', 'en' => 'Full-time'],
            'location' => 'Milano',
            'start_date' => '2022-03',
            'end_date' => null,
            'hours' => null,
            'description' => [
                'it' => 'Sviluppo backend in PHP/Laravel per un gestionale SaaS. Mi occupo delle API per i partner, delle integrazioni con servizi esterni e dei pagamenti online, e analizzo i problemi segnalati dai clienti in produzione.',
                'en' => 'Backend development in PHP/Laravel for a SaaS management platform. I work on partner APIs, integrations with external services and online payments, and I investigate issues reported by customers in production.',
            ],
            'highlights' => [
                'it' => 'Northwind Suite (https://example.com) — Piattaforma SaaS di esempio: integrazioni, pagamenti e API per i partner.',
                'en' => 'Northwind Suite (https://example.com) — Sample SaaS platform: integrations, payments and partner APIs.',
            ],
            'tech' => ['PHP', 'Laravel', 'MySQL', 'Redis', 'Docker', 'REST API', 'Webhook', 'GitHub Actions', 'Scrum'],
        ]);

        Experience::query()->create([
            'role' => ['it' => 'Software Developer — Tirocinio', 'en' => 'Software Developer — Internship'],
            'company' => 'Globex Labs',
            'employment_type' => ['it' => 'Tirocinio curriculare', 'en' => 'Curricular internship'],
            'location' => 'Torino',
            'start_date' => '2021-09',
            'end_date' => '2021-11',
            'hours' => 150,
            'description' => [
                'it' => 'Tirocinio nel team di sviluppo di una piccola azienda di software. Ho lavorato a due strumenti interni, dal backend all\'interfaccia, imparando a muovermi in una codebase reale.',
                'en' => 'Internship in the development team of a small software company. I worked on two internal tools, from backend to interface, learning to find my way in a real codebase.',
            ],
            'highlights' => [
                'it' => "Importazione dei listini — Nuovo strumento che carica file CSV e aggiorna il catalogo.\nReport settimanali — Generazione automatica di PDF a partire dai dati del gestionale.",
                'en' => "Price list import — New tool that loads CSV files and updates the catalogue.\nWeekly reports — Automatic PDF generation from the management system data.",
            ],
            'tech' => ['PHP', 'Laravel', 'MySQL', 'Git'],
        ]);

        $projects = [
            [
                'slug' => 'northwind-tasks', 'name' => 'Northwind Tasks', 'category' => 'app', 'featured' => true,
                'label' => ['it' => 'Full-stack · API-first', 'en' => 'Full-stack · API-first'],
                'description' => [
                    'it' => 'Gestione di attività in stile kanban con architettura API-first: backend Laravel, frontend React + TypeScript, permessi a ruoli e test automatici.',
                    'en' => 'Kanban-style task management with an API-first architecture: Laravel backend, React + TypeScript frontend, role-based permissions and automated tests.',
                ],
                'features' => [
                    'it' => "API REST documentata con OpenAPI\nAutenticazione con token\nPermessi a ruoli\nTest automatici con Pest",
                    'en' => "REST API documented with OpenAPI\nToken authentication\nRole-based permissions\nAutomated tests with Pest",
                ],
                'tech' => ['Laravel', 'React', 'TypeScript', 'MySQL', 'Docker'],
                'repo_url' => 'https://github.com/example/northwind-tasks',
            ],
            [
                'slug' => 'pocket-ledger', 'name' => 'Pocket Ledger', 'category' => 'app',
                'label' => ['it' => 'PWA · Open source', 'en' => 'PWA · Open source'],
                'description' => [
                    'it' => 'App mobile-first e installabile per tenere traccia di entrate e uscite, divise in categorie.',
                    'en' => 'Installable, mobile-first app to keep track of income and expenses, grouped by category.',
                ],
                'features' => [
                    'it' => "Installabile come PWA\nCategorie e budget mensili\nImmagini Docker a ogni push su main",
                    'en' => "Installable as a PWA\nCategories and monthly budgets\nDocker images on every push to main",
                ],
                'tech' => ['TypeScript', 'React', 'PostgreSQL', 'PWA', 'Docker'],
                'repo_url' => 'https://github.com/example/pocket-ledger',
            ],
            [
                'slug' => 'cqrs-kit', 'name' => 'cqrs-kit', 'category' => 'lib',
                'label' => ['it' => 'Pacchetto Composer', 'en' => 'Composer package'],
                'description' => [
                    'it' => 'CommandBus e QueryBus per Laravel con pipeline di behavior configurabile, basati su attributi PHP 8.',
                    'en' => 'CommandBus and QueryBus for Laravel with a configurable behaviour pipeline, built on PHP 8 attributes.',
                ],
                'features' => [
                    'it' => "Pipeline: logging, validazione, transazioni\nConfigurazione con attributi PHP 8",
                    'en' => "Pipeline: logging, validation, transactions\nConfiguration through PHP 8 attributes",
                ],
                'tech' => ['PHP 8.2', 'Laravel'],
                'repo_url' => 'https://github.com/example/cqrs-kit',
                'package_url' => 'https://packagist.org/packages/example/cqrs-kit',
            ],
            [
                'slug' => 'deploy-pinger', 'name' => 'deploy-pinger', 'category' => 'infra',
                'label' => ['it' => 'CLI in Go', 'en' => 'Go CLI'],
                'description' => [
                    'it' => 'Controlla lo stato di un servizio dopo un deploy e manda una notifica con l\'esito.',
                    'en' => 'Checks the health of a service after a deploy and sends a notification with the result.',
                ],
                'features' => [
                    'it' => "Binario statico senza dipendenze\nErrori notificati subito",
                    'en' => "Static binary with no dependencies\nFailures notified immediately",
                ],
                'tech' => ['Go', 'Linux'],
                'repo_url' => 'https://github.com/example/deploy-pinger',
            ],
            [
                'slug' => 'logbook-stack', 'name' => 'Logbook Stack', 'category' => 'infra',
                'label' => ['it' => 'Infrastruttura', 'en' => 'Infrastructure'],
                'description' => [
                    'it' => 'Stack di log condiviso da più applicazioni, con una dashboard per ogni progetto.',
                    'en' => 'Logging stack shared by several applications, with a dashboard for each project.',
                ],
                'features' => [
                    'it' => "Log di tutte le app in un unico posto\nDashboard per ogni progetto",
                    'en' => "Logs of every app in one place\nA dashboard for each project",
                ],
                'tech' => ['Grafana', 'Loki', 'Docker'],
            ],
        ];

        foreach ($projects as $project) {
            Project::query()->create($project);
        }

        Education::query()->create([
            'title' => ['it' => 'Laurea Triennale in Informatica', 'en' => 'Bachelor\'s degree in Computer Science'],
            'institution' => ['it' => 'Dipartimento di Informatica · Università di Esempio', 'en' => 'Department of Computer Science · Example University'],
            'location' => 'Milano',
            'start_date' => '2018-09',
            'end_date' => '2021-12',
            'url' => 'https://example.com',
            'grade' => '110/110',
        ]);

        Education::query()->create([
            'title' => ['it' => 'Diploma di Maturità Scientifica', 'en' => 'Scientific high school diploma'],
            'institution' => ['it' => 'Liceo Scientifico Statale', 'en' => 'State Scientific High School'],
            'location' => 'Milano',
            'start_date' => '2013-09',
            'end_date' => '2018-06',
        ]);

        // Hidden entries stay out of the site until switched on from /admin.
        Education::query()->create([
            'title' => ['it' => 'Laurea Magistrale in Ingegneria del Software', 'en' => 'Master\'s degree in Software Engineering'],
            'institution' => ['it' => 'Università di Esempio', 'en' => 'Example University'],
            'location' => 'Milano',
            'start_date' => '2026-09',
            'end_date' => null,
            'visible' => false,
        ]);

        foreach ([
            ['Cloud Fundamentals', 'Example Academy', '2025-06', 'DEMO-0003', 'Corso introduttivo sui servizi cloud: calcolo, storage, reti e sicurezza.', 'Introductory course on cloud services: compute, storage, networking and security.'],
            ['Docker in Practice', 'Example Academy', '2024-03', 'DEMO-0002', 'Container, immagini e orchestrazione con Compose.', 'Containers, images and orchestration with Compose.'],
            ['Clean Code Essentials', 'Example Academy', '2023-01', 'DEMO-0001', 'Scrivere codice leggibile e facile da mantenere.', 'Writing readable, maintainable code.'],
        ] as [$name, $issuer, $issued, $id, $it, $en]) {
            Certification::query()->create([
                'name' => ['it' => $name, 'en' => $name],
                'issuer' => $issuer,
                'issued_at' => $issued,
                'expires_at' => null,
                'credential_id' => $id,
                'url' => 'https://example.com/certificates/'.$id,
                'description' => ['it' => $it, 'en' => $en],
            ]);
        }
    }
}
