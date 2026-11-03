import { useEffect, useState, type FormEvent } from 'react'
import { Icon } from '../components/Icon'
import { api } from '../lib/api'
import { useLang } from '../lib/lang'
import type { Portfolio } from '../types'
import { Hero } from './Hero'
import { About, Certifications, Education, Experience, Projects, Stack } from './Sections'
import './site.css'

const YEAR = new Date().getFullYear()

function useReveal(ready: boolean) {
  useEffect(() => {
    if (!ready) return
    document.documentElement.classList.add('js')
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in')
            observer.unobserve(entry.target)
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    document.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [ready])
}

function Nav({ data }: { data: Portfolio }) {
  const { ui, locale, setLocale } = useLang()
  const [open, setOpen] = useState(false)
  const initials = data.profile.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
  const close = () => setOpen(false)

  // Close the mobile menu with Escape, and whenever the screen gets wide again.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const wide = window.matchMedia('(min-width: 861px)')
    const onWide = () => wide.matches && setOpen(false)
    window.addEventListener('keydown', onKey)
    wide.addEventListener('change', onWide)
    return () => {
      window.removeEventListener('keydown', onKey)
      wide.removeEventListener('change', onWide)
    }
  }, [open])

  const links = (
    <>
      <a href="#about" onClick={close}>{ui.nav.about}</a>
      {data.experiences.length > 0 && <a href="#esperienza" onClick={close}>{ui.nav.experience}</a>}
      {data.projects.length > 0 && <a href="#progetti" onClick={close}>{ui.nav.projects}</a>}
      <a href="#formazione" onClick={close}>{ui.nav.education}</a>
      {data.certifications.length > 0 && <a href="#certificazioni" onClick={close}>{ui.nav.certifications}</a>}
    </>
  )

  return (
    <header className={`nav${open ? ' nav-open' : ''}`}>
      <nav className="nav-inner" aria-label="Principale">
        <a href="#top" className="brand" onClick={close}>
          <span className="monogram">{initials}</span>
          <span>{data.profile.name.split(' ')[0].toLowerCase()}<span style={{ color: 'var(--faint)' }}>.dev</span></span>
        </a>
        <div className="nav-links">{links}</div>
        <div className="nav-actions">
          <div className="lang" role="group" aria-label={ui.langLabel}>
            {(['it', 'en'] as const).map((l) => (
              <button key={l} type="button" aria-pressed={locale === l} onClick={() => setLocale(l)}>{l.toUpperCase()}</button>
            ))}
          </div>
          <a className="btn btn-primary nav-cta" href="#contatti">{ui.nav.contact}</a>
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? ui.menuClose : ui.menuOpen}
            onClick={() => setOpen(!open)}
          >
            <Icon name={open ? 'x' : 'menu'} size={22} />
          </button>
        </div>
      </nav>
      <div id="mobile-menu" className="mobile-menu" hidden={!open}>
        {links}
        <a className="btn btn-primary" href="#contatti" onClick={close}>{ui.nav.contact}</a>
      </div>
    </header>
  )
}

function Marquee({ data }: { data: Portfolio }) {
  const items = data.skill_groups.flatMap((g) => g.items.map((i) => i.name))
  if (items.length === 0) return null
  // Two identical rows: the track scrolls by half its width and loops.
  const row = (copy: number) =>
    items.flatMap((item, i) => [<span key={`${copy}i${i}`}>{item}</span>, <span key={`${copy}s${i}`} className="sep">◆</span>])

  return (
    <section className="marquee" aria-label="Tecnologie">
      <div className="marquee-track" aria-hidden="true">{row(0)}{row(1)}</div>
      <p className="sr-only">{items.join(', ')}</p>
    </section>
  )
}

function Contact({ data, num }: { data: Portfolio; num: number }) {
  const { ui, locale } = useLang()
  const { profile } = data
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const fields = new FormData(form)
    setStatus('sending')
    try {
      await api('/api/contact', {
        method: 'POST',
        json: {
          name: fields.get('name'),
          email: fields.get('email'),
          body: fields.get('body'),
          website: fields.get('website'),
          locale,
        },
      })
      form.reset()
      setStatus('sent')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setStatus('error')
    }
  }

  return (
    <section id="contatti" className="contact" data-reveal>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 20 }}>
        <span className="eyebrow">// {String(num).padStart(2, '0')} — {ui.sections.contact}</span>
        <h2>{ui.sections.contactTitle}</h2>
        <p className="muted" style={{ margin: 0, maxWidth: '44ch', fontSize: 17 }}>{ui.contactIntro}</p>
        <div className="contact-links">
          {profile.email && <a href={`mailto:${profile.email}`}><span className="icon-tile"><Icon name="mail" /></span>{profile.email}</a>}
          {profile.linkedin_url && <a href={profile.linkedin_url} target="_blank" rel="noreferrer"><span className="icon-tile"><Icon name="linkedin" /></span>{profile.linkedin_url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</a>}
          {profile.github_url && <a href={profile.github_url} target="_blank" rel="noreferrer"><span className="icon-tile"><Icon name="github" /></span>{profile.github_url.replace(/^https?:\/\/(www\.)?/, '')}</a>}
          {profile.cv_url && <a href={profile.cv_url} download><span className="icon-tile"><Icon name="download" /></span>{ui.cv}</a>}
        </div>
      </div>
      <form className="form" onSubmit={submit}>
        <div className="form-row">
          <label className="field">{ui.form.name}<input name="name" required maxLength={120} autoComplete="name" placeholder={ui.form.namePh} /></label>
          <label className="field">{ui.form.email}<input name="email" type="email" required maxLength={255} autoComplete="email" placeholder={ui.form.emailPh} /></label>
        </div>
        <label className="field">{ui.form.message}<textarea name="body" rows={6} required minLength={10} maxLength={5000} placeholder={ui.form.messagePh} /></label>
        <div className="honeypot" aria-hidden="true">
          <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
        </div>
        {status === 'sent' && <p className="notice notice-ok" role="status">{ui.form.sent}</p>}
        {status === 'error' && <p className="notice notice-error" role="alert">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={status === 'sending'} style={{ alignSelf: 'flex-start' }}>
          {status === 'sending' ? ui.form.sending : ui.form.send}<Icon name="send" size={17} />
        </button>
      </form>
    </section>
  )
}

export default function Site() {
  const { t, ui } = useLang()
  const [data, setData] = useState<Portfolio | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    api<Portfolio>('/api/portfolio').then(setData).catch(() => setFailed(true))
  }, [])

  useEffect(() => {
    if (data) document.title = `${data.profile.name} — ${data.profile.role.it}`
  }, [data])

  useReveal(data !== null)

  if (failed) return <div className="state">{ui.loadError}</div>
  if (!data) return <div className="state" aria-busy="true">{ui.loading}</div>

  // Section numbers follow the sections that are actually shown.
  let n = 0
  const next = () => ++n
  const nums = {
    about: next(),
    stack: data.skill_groups.length ? next() : 0,
    experience: data.experiences.length ? next() : 0,
    projects: data.projects.length ? next() : 0,
    education: data.education.length || data.profile.languages.length ? next() : 0,
    certifications: data.certifications.length ? next() : 0,
    contact: next(),
  }

  return (
    <>
      <Nav data={data} />
      <main id="top">
        <Hero data={data} />
        <Marquee data={data} />
        <div className="container">
          <About data={data} num={nums.about} />
          <Stack data={data} num={nums.stack} />
          <Experience data={data} num={nums.experience} />
          <Projects data={data} num={nums.projects} />
          <Education data={data} num={nums.education} />
          <Certifications data={data} num={nums.certifications} />
          <Contact data={data} num={nums.contact} />
        </div>
      </main>
      <footer className="footer">
        <div className="footer-inner">
          <span>© {YEAR} {data.profile.name}{data.profile.location && ` · ${t(data.profile.location)}`}</span>
          <span className="mono" style={{ fontSize: 13 }}>Laravel + React · {ui.footer} <span style={{ color: 'var(--green)' }}>●</span></span>
        </div>
      </footer>
    </>
  )
}
