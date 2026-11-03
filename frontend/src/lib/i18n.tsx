import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Locale } from '../types'
import { LangContext, type LangContextValue } from './lang'

const ui = {
  it: {
    nav: { about: 'About', experience: 'Esperienza', projects: 'Progetti', education: 'Formazione', certifications: 'Certificazioni', contact: 'Contattami' },
    langLabel: 'Lingua',
    menuOpen: 'Apri il menu',
    menuClose: 'Chiudi il menu',
    hello: 'Ciao, sono',
    available: 'Aperto a nuove opportunità',
    availableShort: 'Disponibile',
    levelsLegend: 'Livelli di conoscenza',
    facts: { base: 'Base', study: 'Studio', languages: 'Lingue' },
    stats: { years: 'anni di esperienza', months: 'mesi di esperienza', projects: 'progetti personali', certifications: 'certificazioni', stack: 'tecnologie nello stack' },
    projectsIntro: 'Applicazioni e strumenti che progetto, sviluppo e metto in produzione nel tempo libero.',
    creates: 'che crea',
    seeProjects: 'Guarda i progetti',
    downloadCv: 'Scarica il CV',
    terminal: 'TERMINALE',
    deploy: ['CI: test, build e push delle immagini', 'Server: aggiornamento dei container', 'online, log centralizzati'],
    sections: {
      about: 'about', aboutTitle: 'Dal codice alla produzione.',
      stack: 'stack', stackTitle: 'Con cosa lavoro',
      experience: 'esperienza', experienceTitle: 'Esperienza lavorativa',
      projects: 'side projects', projectsTitle: 'Progetti personali',
      education: 'formazione', educationTitle: 'Studi',
      certifications: 'certificazioni', certificationsTitle: 'Certificazioni',
      contact: 'contatti', contactTitle: 'Hai un progetto in mente?',
    },
    present: 'oggi',
    inProgress: 'In corso',
    completed: 'Conseguito',
    hours: 'ore',
    followedProjects: 'PROGETTI SEGUITI',
    allRepos: 'Tutti i repository su GitHub',
    featured: 'IN EVIDENZA',
    features: 'Funzionalità',
    code: 'Codice',
    demo: 'Demo',
    package: 'Pacchetto',
    repo: 'Vedi il repository ↗',
    filters: { all: 'Tutti', app: 'App', lib: 'Librerie', infra: 'Infrastruttura' },
    filterLabel: 'Filtra i progetti',
    languages: 'Competenze linguistiche',
    languagesBadge: 'Lingue',
    certificationsIntro: "Ogni attestato ha il link per verificare la credenziale presso l'ente che l'ha rilasciata.",
    verify: 'Verifica ↗',
    credential: 'ID',
    contactIntro: 'Per collaborazioni, posizioni aperte o anche solo due chiacchiere sul codice, scrivimi.',
    form: { name: 'Nome', email: 'Email', message: 'Messaggio', namePh: 'Il tuo nome', emailPh: 'nome@esempio.it', messagePh: 'Raccontami del progetto o della posizione', send: 'Invia messaggio', sending: 'Invio…', sent: 'Messaggio inviato, ti risponderò il prima possibile.' },
    cv: 'Scarica il CV (PDF)',
    loading: 'Caricamento…',
    loadError: 'Non è stato possibile caricare il portfolio. Riprova tra poco.',
    footer: 'deploy con GitHub Actions',
  },
  en: {
    nav: { about: 'About', experience: 'Experience', projects: 'Projects', education: 'Education', certifications: 'Certifications', contact: 'Contact me' },
    langLabel: 'Language',
    menuOpen: 'Open menu',
    menuClose: 'Close menu',
    hello: "Hi, I'm",
    available: 'Open to new opportunities',
    availableShort: 'Available',
    levelsLegend: 'Skill levels',
    facts: { base: 'Based in', study: 'Education', languages: 'Languages' },
    stats: { years: 'years of experience', months: 'months of experience', projects: 'side projects', certifications: 'certifications', stack: 'technologies in my stack' },
    projectsIntro: 'Apps and tools I design, build and run in production in my spare time.',
    creates: 'who builds',
    seeProjects: 'See my projects',
    downloadCv: 'Download CV',
    terminal: 'TERMINAL',
    deploy: ['CI: tests, build and image push', 'Server: containers updated', 'online, centralised logs'],
    sections: {
      about: 'about', aboutTitle: 'From code to production.',
      stack: 'stack', stackTitle: 'What I work with',
      experience: 'experience', experienceTitle: 'Work experience',
      projects: 'side projects', projectsTitle: 'Side projects',
      education: 'education', educationTitle: 'Education',
      certifications: 'certifications', certificationsTitle: 'Certifications',
      contact: 'contact', contactTitle: 'Got a project in mind?',
    },
    present: 'present',
    inProgress: 'In progress',
    completed: 'Completed',
    hours: 'hours',
    followedProjects: 'PROJECTS',
    allRepos: 'All repositories on GitHub',
    featured: 'FEATURED',
    features: 'Features',
    code: 'Code',
    demo: 'Demo',
    package: 'Package',
    repo: 'View repository ↗',
    filters: { all: 'All', app: 'Apps', lib: 'Libraries', infra: 'Infrastructure' },
    filterLabel: 'Filter projects',
    languages: 'Languages',
    languagesBadge: 'Languages',
    certificationsIntro: 'Every certificate links to the issuer so the credential can be verified.',
    verify: 'Verify ↗',
    credential: 'ID',
    contactIntro: 'For collaborations, open positions or just a chat about code, drop me a line.',
    form: { name: 'Name', email: 'Email', message: 'Message', namePh: 'Your name', emailPh: 'name@example.com', messagePh: 'Tell me about the project or the role', send: 'Send message', sending: 'Sending…', sent: 'Message sent, I will get back to you soon.' },
    cv: 'Download CV (PDF)',
    loading: 'Loading…',
    loadError: 'The portfolio could not be loaded. Please try again shortly.',
    footer: 'deployed with GitHub Actions',
  },
} as const

export type Ui = (typeof ui)[Locale]

function initialLocale(): Locale {
  try {
    const saved = localStorage.getItem('locale')
    if (saved === 'it' || saved === 'en') return saved
  } catch {
    // Storage can be blocked: fall back to the browser language.
  }
  return navigator.language.toLowerCase().startsWith('it') ? 'it' : 'en'
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    try {
      localStorage.setItem('locale', next)
    } catch {
      // Not persisted: the choice still applies to this visit.
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const value = useMemo<LangContextValue>(() => {
    const formatter = new Intl.DateTimeFormat(locale === 'it' ? 'it-IT' : 'en-GB', { month: 'short', year: 'numeric' })
    return {
      locale,
      setLocale,
      ui: ui[locale],
      t: (v) => (v ? v[locale] || v.it || '' : ''),
      month: (v) => {
        if (!v) return ui[locale].present
        const [year, month] = v.split('-').map(Number)
        return formatter.format(new Date(year, month - 1, 1))
      },
    }
  }, [locale, setLocale])

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}
