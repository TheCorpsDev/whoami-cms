import { Fragment, useEffect, useState, type ReactNode } from 'react'
import { Icon } from '../components/Icon'
import { currentJob } from '../lib/derived'
import { useLang } from '../lib/lang'
import type { Portfolio } from '../types'

const WORD_COLORS = ['var(--accent)', 'var(--cyan)', 'var(--lime)', 'var(--pink)']

function Rotator({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0)
  const [animate, setAnimate] = useState(true)

  useEffect(() => {
    if (words.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => setIndex((i) => i + 1), 2500)
    return () => window.clearInterval(timer)
  }, [words.length])

  // The list ends with a copy of the first word: once it is shown, jump back
  // to the real first word without a transition so the loop looks seamless.
  useEffect(() => {
    if (index < words.length) return
    const timer = window.setTimeout(() => {
      setAnimate(false)
      setIndex(0)
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)))
    }, 700)
    return () => window.clearTimeout(timer)
  }, [index, words.length])

  if (words.length === 0) return null
  const list = [...words, words[0]]

  return (
    <span className="rotator-window">
      <span
        className="rotator-list"
        style={{ transform: `translateY(-${index * 1.25}em)`, transition: animate ? 'transform .7s cubic-bezier(.7,0,.2,1)' : 'none' }}
      >
        {list.map((word, i) => (
          <span key={i} style={{ color: WORD_COLORS[i % words.length % WORD_COLORS.length] }} aria-hidden={i !== index % words.length}>
            {word}
          </span>
        ))}
      </span>
    </span>
  )
}

/** Code and terminal side by side under the hero, peeking from the bottom. */
function Console({ data }: { data: Portfolio }) {
  const { t, ui, locale } = useLang()
  const { profile, skill_groups: groups } = data
  const handle = profile.name.split(' ')[0].toLowerCase().normalize('NFD').replace(/[^a-z]/g, '') || 'dev'
  const job = currentJob(data)
  const stack = groups.slice(0, 4).map((g) => g.items[0]?.name.split(' · ')[0]).filter(Boolean)

  const lines: ReactNode[] = [
    <>
      <span className="tok-key">export const</span> <span className="tok-name">{handle}</span>: <span className="tok-type">Developer</span> = {'{'}
    </>,
  ]
  if (job) lines.push(<>  {locale === 'it' ? 'ruolo' : 'role'}: <span className="tok-str">'{t(job.role).split(' — ')[0]} @ {job.company}'</span>,</>)
  if (profile.location) lines.push(<>  base: <span className="tok-str">'{t(profile.location)}'</span>,</>)
  if (stack.length) {
    lines.push(
      <>
        {'  '}stack: [
        {stack.map((item, i) => (
          <Fragment key={item}>
            {i > 0 && ', '}
            <span className="tok-str">'{item}'</span>
          </Fragment>
        ))}
        ],
      </>,
    )
  }
  lines.push(<>  {locale === 'it' ? 'disponibile' : 'available'}: <span className="tok-bool">{String(profile.available)}</span>,</>)
  lines.push(<>{'};'}<span className="caret" /></>)

  return (
    <div className="console fu" style={{ animationDelay: '.7s' }} aria-hidden="true">
      <div className="console-code">
        <div className="editor-tabs">
          <span className="editor-dots"><span /><span /><span /></span>
          <span className="editor-tab active">{handle}.ts</span>
        </div>
        <div className="editor-body">
          <div className="editor-gutter">
            {lines.map((_, i) => <div key={i}>{i + 1}</div>)}
          </div>
          <div className="editor-code">
            {lines.map((line, i) => (
              <div key={i} className="ln" style={{ animationDelay: `${1 + i * 0.1}s` }}>{line}</div>
            ))}
          </div>
        </div>
      </div>
      <div className="editor-term console-term">
        <div className="editor-term-head"><span>{ui.terminal}</span><span>zsh</span></div>
        <div className="ln" style={{ animationDelay: '1.8s' }}><span style={{ color: 'var(--accent)' }}>❯</span> git push origin main</div>
        <div className="ln dim" style={{ animationDelay: '2.3s' }}>  ↳ {ui.deploy[0]}</div>
        <div className="ln dim" style={{ animationDelay: '2.8s' }}>  ↳ {ui.deploy[1]}</div>
        <div className="ln" style={{ color: 'var(--green)', animationDelay: '3.3s' }}>  ✓ {ui.deploy[2]}</div>
      </div>
    </div>
  )
}

export function Hero({ data }: { data: Portfolio }) {
  const { t, ui, locale } = useLang()
  const { profile } = data
  const words = profile.rotating_words[locale].length ? profile.rotating_words[locale] : profile.rotating_words.it
  const initials = profile.name.split(' ').map((p) => p[0]).join('').slice(0, 2)

  return (
    <section className="hero dots">
      <div className="container hero-center">
        <div className="avatar fu" style={{ animationDelay: '.05s' }}>
          <svg width="128" height="128" viewBox="0 0 128 128" aria-hidden="true">
            <circle cx="64" cy="64" r="61" fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="3 9" strokeLinecap="round" />
          </svg>
          {profile.photo_url ? (
            <img src={profile.photo_url} alt={profile.name} width={104} height={104} />
          ) : (
            <span className="avatar-fallback" aria-hidden="true">{initials}</span>
          )}
        </div>

        {profile.available && (
          <span className="status-pill fu" style={{ animationDelay: '.1s' }}>
            <span className="ping-wrap" style={{ width: 8, height: 8 }}><span className="ping" style={{ background: 'var(--green)' }} /><span style={{ background: 'var(--green)' }} /></span>
            {ui.available}
          </span>
        )}

        <h1 className="fu" style={{ animationDelay: '.15s' }}>
          {profile.name}<span className="dot">.</span>
        </h1>

        <p className="rotator fu" style={{ animationDelay: '.3s' }}>
          <span>{t(profile.role)} {ui.creates}</span>
          <Rotator key={locale} words={words} />
        </p>

        <p className="hero-bio fu" style={{ animationDelay: '.45s' }}>{t(profile.hero_bio)}</p>

        <div className="hero-actions fu" style={{ animationDelay: '.6s' }}>
          <a className="btn btn-primary" href="#progetti">{ui.seeProjects}<Icon name="arrowRight" /></a>
          {profile.cv_url && (
            <a className="btn btn-ghost" href={profile.cv_url} download><Icon name="download" size={17} />{ui.downloadCv}</a>
          )}
          {profile.github_url && (
            <a className="btn btn-ghost btn-icon" href={profile.github_url} aria-label="GitHub" target="_blank" rel="noreferrer"><Icon name="github" size={19} /></a>
          )}
          {profile.linkedin_url && (
            <a className="btn btn-ghost btn-icon" href={profile.linkedin_url} aria-label="LinkedIn" target="_blank" rel="noreferrer"><Icon name="linkedin" size={19} /></a>
          )}
        </div>

        <Console data={data} />
      </div>
    </section>
  )
}
