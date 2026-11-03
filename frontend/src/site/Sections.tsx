import { useMemo, useState, type ReactNode } from 'react'
import { Icon } from '../components/Icon'
import { currentJob, experienceLength, highlightParts, stackSize } from '../lib/derived'
import { useLang } from '../lib/lang'
import { SKILL_LEVELS, skillLevel } from '../lib/skills'
import { LANGUAGE_STEPS, levelLabel, levelSteps } from '../lib/languages'
import type { Portfolio, Project, ProjectCategory } from '../types'

const lines = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean)

function SectionHead({ num, eyebrow, title, children }: { num: number; eyebrow: string; title: string; children?: ReactNode }) {
  const head = (
    <div className="section-head">
      <span className="eyebrow">// {String(num).padStart(2, '0')} — {eyebrow}</span>
      <h2>{title}</h2>
    </div>
  )
  return children ? <div className="section-head-row">{head}{children}</div> : head
}

const TONES = ['var(--accent)', 'var(--cyan)', 'var(--lime)', 'var(--pink)']

/** Developer "ID card" next to the About text. */
function ProfileCard({ data }: { data: Portfolio }) {
  const { t, ui } = useLang()
  const { profile } = data
  const job = currentJob(data)
  const study = data.education.find((e) => !e.end_date) ?? data.education[0]
  const languages = profile.languages.map((l) => (l.level === 'native' ? t(l.name) : `${t(l.name)} ${l.level}`)).join(' · ')
  const initials = profile.name.split(' ').map((p) => p[0]).join('').slice(0, 2)

  return (
    <aside className="id-card" data-reveal>
      <div className="id-card-top dots">
        <span className="id-card-label">DEV ID · 001</span>
        {profile.available && (
          <span className="status-pill id-card-status">
            <span className="ping-wrap" style={{ width: 7, height: 7 }}><span className="ping" style={{ background: 'var(--green)' }} /><span style={{ background: 'var(--green)' }} /></span>
            {ui.availableShort}
          </span>
        )}
      </div>
      {profile.photo_url ? (
        <img className="id-card-photo" src={profile.photo_url} alt="" width={88} height={88} />
      ) : (
        <span className="id-card-photo avatar-fallback" aria-hidden="true">{initials}</span>
      )}
      <div className="id-card-name">
        <strong>{profile.name}</strong>
        {job && <span>{t(job.role).split(' — ')[0]} · {job.company}</span>}
      </div>
      <dl className="id-card-facts">
        {profile.location && <div><dt>{ui.facts.base}</dt><dd>{t(profile.location)}</dd></div>}
        {study && <div><dt>{ui.facts.study}</dt><dd>{t(study.title)}<small>{t(study.institution).split(' · ').pop()}</small></dd></div>}
        {languages && <div><dt>{ui.facts.languages}</dt><dd>{languages}</dd></div>}
      </dl>
      <div className="id-card-actions">
        {profile.cv_url && <a className="btn btn-primary" href={profile.cv_url} download><Icon name="download" size={16} />{ui.downloadCv}</a>}
        {profile.github_url && <a className="btn btn-ghost btn-icon" href={profile.github_url} aria-label="GitHub" target="_blank" rel="noreferrer"><Icon name="github" size={18} /></a>}
        {profile.linkedin_url && <a className="btn btn-ghost btn-icon" href={profile.linkedin_url} aria-label="LinkedIn" target="_blank" rel="noreferrer"><Icon name="linkedin" size={18} /></a>}
      </div>
    </aside>
  )
}

export function About({ data, num }: { data: Portfolio; num: number }) {
  const { t, ui } = useLang()
  const headline = t(data.profile.about_headline) || ui.sections.aboutTitle
  const paragraphs = t(data.profile.about).split(/\n\s*\n/).filter(Boolean)
  const experience = experienceLength(data)
  const stats: { value: string; plus: boolean; label: string }[] = []
  if (experience) stats.push({ value: experience.value, plus: experience.value.endsWith('+'), label: experience.years ? ui.stats.years : ui.stats.months })
  if (data.projects.length) stats.push({ value: String(data.projects.length), plus: false, label: ui.stats.projects })
  if (data.certifications.length) stats.push({ value: String(data.certifications.length), plus: false, label: ui.stats.certifications })
  if (stackSize(data)) stats.push({ value: String(stackSize(data)), plus: false, label: ui.stats.stack })

  return (
    <section id="about" className="section section-first">
      <div className="about">
        <ProfileCard data={data} />
        <div className="about-main" data-reveal>
          <span className="eyebrow">// {String(num).padStart(2, '0')} — {ui.sections.about}</span>
          <h2 className="about-headline">
            {highlightParts(headline).map((part, i) => (part.strong ? <span key={i}>{part.text}</span> : part.text))}
          </h2>
          {paragraphs.map((p, i) => <p key={i} className="about-text">{p}</p>)}

          {stats.length > 0 && (
            <dl className="stats">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dt>{stat.label}</dt>
                  <dd>{stat.plus ? <>{stat.value.slice(0, -1)}<span>+</span></> : stat.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {data.profile.highlights.length > 0 && (
            <div className="principles">
              {data.profile.highlights.map((h, i) => (
                <div key={i}>
                  <span className="mono" style={{ color: TONES[i % TONES.length] }}>{String(i + 1).padStart(2, '0')}</span>
                  <h3>{t(h.title)}</h3>
                  <p>{t(h.body)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export function Stack({ data, num }: { data: Portfolio; num: number }) {
  const { t, ui, locale } = useLang()
  if (data.skill_groups.length === 0) return null

  return (
    <section id="stack" className="section">
      <div className="section-head-row" data-reveal>
        <SectionHead num={num} eyebrow={ui.sections.stack} title={ui.sections.stackTitle} />
        <ul className="skill-legend" aria-label={ui.levelsLegend}>
          {SKILL_LEVELS.map((level) => {
            const info = skillLevel(level, locale)
            return <li key={level}><span style={{ background: info.color }} />{info.label}</li>
          })}
        </ul>
      </div>
      <div className="skill-groups" data-reveal>
        {data.skill_groups.map((group) => (
          <div key={group.id} className="card skill-group">
            <div className="skill-group-head">
              <h3><span>[</span> {t(group.name).toLowerCase()} <span>]</span></h3>
              <span>{group.items.length}</span>
            </div>
            <ul>
              {group.items.map((item) => {
                const info = skillLevel(item.level, locale)
                return (
                  <li key={item.name}>
                    <div className="skill-row">
                      <span className="skill-name">{item.name}</span>
                      <span className="skill-level" style={{ color: info.color }}>{info.label}</span>
                    </div>
                    <span className="skill-steps" aria-hidden="true">
                      {[1, 2, 3, 4].map((n) => <span key={n} style={n <= info.steps ? { background: info.color } : undefined} />)}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

function SubCard({ url, children }: { url?: string; children: ReactNode }) {
  if (!url) return <div className="subcard">{children}</div>
  return <a className="subcard subcard-link" href={url} target="_blank" rel="noopener noreferrer">{children}</a>
}

export function Experience({ data, num }: { data: Portfolio; num: number }) {
  const { t, ui, month } = useLang()
  if (data.experiences.length === 0) return null

  return (
    <section id="esperienza" className="section">
      <div data-reveal><SectionHead num={num} eyebrow={ui.sections.experience} title={ui.sections.experienceTitle} /></div>
      {data.experiences.map((job) => {
        const items = lines(t(job.highlights)).map((line) => {
          const url = line.match(/https?:\/\/[^\s)]+/)?.[0]
          const [title, ...body] = line.replace(/\s*\(?https?:\/\/[^\s)]+\)?/, '').split(' — ')
          return { title, body: body.join(' — '), url }
        })
        return (
          <article key={job.id} className="card job" data-reveal>
            <div className="job-main">
              <div className="job-title">
                <span className="icon-tile tone-violet"><Icon name="briefcase" size={26} /></span>
                <div>
                  <h3>{t(job.role)}</h3>
                  <span className="job-company">{job.company}{t(job.employment_type) && ` · ${t(job.employment_type)}`}</span>
                </div>
              </div>
              <div className="meta-pills">
                <span><Icon name="calendar" size={13} />{month(job.start_date)} — {month(job.end_date)}</span>
                {job.location && <span><Icon name="pin" size={13} />{job.location}</span>}
                {job.hours ? <span><Icon name="clock" size={13} />{job.hours} {ui.hours}</span> : null}
              </div>
              {t(job.description) && <p className="muted">{t(job.description)}</p>}
              {job.tech.length > 0 && <div className="tags" style={{ marginTop: 'auto' }}>{job.tech.map((x) => <span key={x}>{x}</span>)}</div>}
            </div>
            {items.length > 0 && (
              <div className="job-side">
                <span className="label">{ui.followedProjects}</span>
                {items.map((item, i) => (
                  <SubCard key={i} url={item.url}>
                    <span className="eyebrow">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <h4>{item.title}</h4>
                      {item.body && <p>{item.body}</p>}
                    </div>
                    {item.url && <span className="subcard-arrow"><Icon name="arrowUpRight" size={18} /></span>}
                  </SubCard>
                ))}
              </div>
            )}
          </article>
        )
      })}
    </section>
  )
}

function ProjectLinks({ project }: { project: Project }) {
  const { ui } = useLang()
  if (!project.repo_url && !project.demo_url && !project.package_url) return null
  return (
    <div className="project-links">
      {project.repo_url && <a href={project.repo_url} target="_blank" rel="noreferrer">{ui.repo}</a>}
      {project.demo_url && <a href={project.demo_url} target="_blank" rel="noreferrer">{ui.demo} ↗</a>}
      {project.package_url && <a href={project.package_url} target="_blank" rel="noreferrer">{ui.package} ↗</a>}
    </div>
  )
}

export function Projects({ data, num }: { data: Portfolio; num: number }) {
  const { t, ui } = useLang()
  const [filter, setFilter] = useState<'all' | ProjectCategory>('all')
  const featured = data.projects.find((p) => p.featured)
  const others = useMemo(() => data.projects.filter((p) => p !== featured), [data.projects, featured])
  const shown = filter === 'all' ? others : others.filter((p) => p.category === filter)
  const categories = (['all', 'app', 'lib', 'infra'] as const).filter((c) => c === 'all' || others.some((p) => p.category === c))

  if (data.projects.length === 0) return null

  return (
    <section id="progetti" className="section">
      <div className="section-head-row" data-reveal>
        <div className="section-head" style={{ maxWidth: 640 }}>
          <span className="eyebrow">// {String(num).padStart(2, '0')} — {ui.sections.projects}</span>
          <h2>{ui.sections.projectsTitle}</h2>
          <p className="section-intro">{ui.projectsIntro}</p>
        </div>
        {data.profile.github_url && (
          <a className="btn btn-ghost" href={data.profile.github_url} target="_blank" rel="noreferrer"><Icon name="github" size={17} />{ui.allRepos} ↗</a>
        )}
      </div>

      {featured && (
        <article className="card featured card-lift" data-reveal>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span className="eyebrow" style={{ fontSize: 12 }}>★ {ui.featured}{t(featured.label) && ` · ${t(featured.label).toUpperCase()}`}</span>
            <h3>{featured.name}</h3>
            <p className="muted">{t(featured.description)}</p>
            <div className="tags">{featured.tech.map((x) => <span key={x}>{x}</span>)}</div>
            <div className="featured-actions">
              {featured.repo_url && <a className="btn btn-primary" href={featured.repo_url} target="_blank" rel="noreferrer"><Icon name="github" />{ui.code}</a>}
              {featured.demo_url && <a className="btn btn-ghost" href={featured.demo_url} target="_blank" rel="noreferrer">{ui.demo} ↗</a>}
              {featured.package_url && <a className="btn btn-ghost" href={featured.package_url} target="_blank" rel="noreferrer">{ui.package} ↗</a>}
            </div>
          </div>
          {lines(t(featured.features)).length > 0 && (
            <div className="featured-panel dots">
              <span style={{ fontSize: 11, color: 'var(--faint)', letterSpacing: '.08em' }}>{ui.features.toUpperCase()}</span>
              <ul>
                {lines(t(featured.features)).map((f) => <li key={f}><span>▸</span><span>{f}</span></li>)}
              </ul>
            </div>
          )}
        </article>
      )}

      {others.length > 0 && (
        <>
          {categories.length > 2 && (
            <div className="filters" role="group" aria-label={ui.filterLabel} data-reveal>
              {categories.map((c) => (
                <button key={c} type="button" aria-pressed={filter === c} onClick={() => setFilter(c)}>
                  {ui.filters[c]}
                  <span className="count">{c === 'all' ? others.length : others.filter((p) => p.category === c).length}</span>
                </button>
              ))}
            </div>
          )}
          <div className="grid grid-3" data-reveal>
            {shown.map((project) => (
              <article key={project.id} className="card card-lift project">
                <div className="project-head">
                  <span className="label">{t(project.label).toUpperCase()}</span>
                  <span className="project-card-arrow"><Icon name="arrowUpRight" size={20} /></span>
                </div>
                <h3>{project.name.replace(/([a-z])([A-Z])/g, '$1\u200b$2')}</h3>
                <p className="muted small">{t(project.description)}</p>
                {project.tech.length > 0 && <div className="tags" style={{ paddingTop: 6 }}>{project.tech.map((x) => <span key={x}>{x}</span>)}</div>}
                <ProjectLinks project={project} />
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

export function Education({ data, num }: { data: Portfolio; num: number }) {
  const { t, ui, month, locale } = useLang()
  const { languages } = data.profile
  if (data.education.length === 0 && languages.length === 0) return null

  return (
    <section id="formazione" className="section">
      <div data-reveal><SectionHead num={num} eyebrow={ui.sections.education} title={ui.sections.educationTitle} /></div>
      <div className="grid grid-3" data-reveal>
        {data.education.map((item) => {
          const live = !item.end_date
          return (
            <article key={item.id} className="card" style={{ padding: 28 }}>
              <div className="edu-top">
                <span className={`icon-tile ${live ? 'tone-cyan' : 'tone-gray'}`} style={{ width: 48, height: 48 }}><Icon name={live ? 'cap' : 'book'} size={24} /></span>
                {live ? (
                  <span className="badge badge-live">
                    <span className="ping-wrap" style={{ width: 7, height: 7 }}><span className="ping" style={{ background: 'var(--cyan)' }} /><span style={{ background: 'var(--cyan)' }} /></span>
                    {ui.inProgress}
                  </span>
                ) : (
                  <span className="badge badge-plain">{ui.completed}</span>
                )}
              </div>
              <span className="label" style={{ fontSize: 13 }}>{month(item.start_date)} — {month(item.end_date)}{item.location && ` · ${item.location}`}</span>
              <h3 style={{ fontSize: 22 }}>{t(item.title)}</h3>
              <p className="muted">{t(item.institution)}{item.grade && ` · ${item.grade}`}</p>
              {item.url && <a href={item.url} target="_blank" rel="noreferrer" style={{ marginTop: 'auto', fontSize: 14 }}>{item.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')} ↗</a>}
            </article>
          )
        })}
        {languages.length > 0 && (
          <article className="card" style={{ padding: 28, gap: 18 }}>
            <div className="edu-top">
              <span className="icon-tile tone-pink" style={{ width: 48, height: 48 }}><Icon name="languages" size={24} /></span>
              <span className="badge badge-plain">{ui.languagesBadge}</span>
            </div>
            <h3 style={{ fontSize: 22 }}>{ui.languages}</h3>
            {languages.map((lang, i) => (
              <div key={i}>
                <div className="skill-row">
                  <span className="skill-name">{t(lang.name)}</span>
                  <span className="skill-level" style={{ color: levelSteps(lang.level).color }}>{levelLabel(lang.level, locale)}</span>
                </div>
                <span className="skill-steps steps-6" aria-hidden="true">
                  {Array.from({ length: LANGUAGE_STEPS }, (_, n) => (
                    <span key={n} style={n < levelSteps(lang.level).steps ? { background: levelSteps(lang.level).color, animationDelay: `${0.1 + i * 0.15}s` } : undefined} />
                  ))}
                </span>
              </div>
            ))}
          </article>
        )}
      </div>
    </section>
  )
}

const CERT_TONES = ['var(--accent)', 'var(--cyan)', 'var(--lime)', 'var(--pink)']

export function Certifications({ data, num }: { data: Portfolio; num: number }) {
  const { t, ui, month } = useLang()
  if (data.certifications.length === 0) return null

  return (
    <section id="certificazioni" className="section">
      <div data-reveal>
        <SectionHead num={num} eyebrow={ui.sections.certifications} title={ui.sections.certificationsTitle}>
          <p className="muted small" style={{ margin: 0, maxWidth: '40ch' }}>{ui.certificationsIntro}</p>
        </SectionHead>
      </div>
      <div className="grid grid-3" data-reveal>
        {data.certifications.map((cert, i) => (
          <article key={cert.id} className="card card-lift" style={{ padding: 26, gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span className="cert-badge" style={{ color: CERT_TONES[i % CERT_TONES.length] }}><Icon name="award" size={24} /></span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="label">{cert.issuer.toUpperCase()}{cert.issued_at && ` · ${month(cert.issued_at)}`}</span>
                <h3>{t(cert.name)}</h3>
              </div>
            </div>
            {t(cert.description) && <p className="muted small">{t(cert.description)}</p>}
            {(cert.credential_id || cert.url) && (
              <div className="cert-foot">
                <span className="label">{cert.credential_id && `${ui.credential} ${cert.credential_id}`}</span>
                {cert.url && <a href={cert.url} target="_blank" rel="noreferrer">{ui.verify}</a>}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
