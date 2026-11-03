import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces'
import { levelLabel } from '../../lib/languages'
import { skillLevel } from '../../lib/skills'
import type { CvDetails, Locale, Portfolio, Translated } from '../../types'
import { circlePhoto } from './photo'

export type CvOptions = { photo: boolean; projects: boolean; certifications: boolean }

type Params = { data: Portfolio; details: CvDetails; locale: Locale; options: CvOptions }

const PAGE_HEIGHT = 841.89
const SIDEBAR = 180
const MARGIN_LEFT = SIDEBAR + 26
const DARK = '#14172a'
const ACCENT = '#6d5bd0'
const LIGHT = '#b9aef8'
const TEXT = '#2b2e3b'
const MUTED = '#6b7080'

const LABELS = {
  it: {
    work: 'Esperienza lavorativa', education: 'Istruzione e formazione', projects: 'Progetti personali',
    certifications: 'Certificazioni', skills: 'Competenze informatiche', contacts: 'Contatti', details: 'Dati personali',
    genders: { Maschile: 'Maschile', Femminile: 'Femminile' } as Record<string, string>,
    languages: 'Lingue', birth: 'Data di nascita', nationality: 'Nazionalità', gender: 'Sesso', license: 'Patente',
    present: 'Attuale', technologies: 'Tecnologie', followed: 'Progetto seguito', hours: 'ore', scale: 'Livello: da 1 punto (base) a 4 (esperto)',
    credential: 'ID credenziale', online: 'Online',
  },
  en: {
    work: 'Work experience', education: 'Education and training', projects: 'Personal projects',
    certifications: 'Certifications', skills: 'Technical skills', contacts: 'Contacts', details: 'Personal details',
    genders: { Maschile: 'Male', Femminile: 'Female' } as Record<string, string>,
    languages: 'Languages', birth: 'Date of birth', nationality: 'Nationality', gender: 'Gender', license: 'Driving licence',
    present: 'Present', technologies: 'Technologies', followed: 'Project followed', hours: 'hours', scale: 'Level: 1 dot (basic) to 4 (expert)',
    credential: 'Credential ID', online: 'Online',
  },
} as const

const ICONS: Record<string, string> = {
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  github: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
  linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>',
}

const icon = (name: string): Content => ({
  svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${LIGHT}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`,
  width: 10,
  height: 10,
  margin: [0, 1, 0, 0],
})

const stripProtocol = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '')

function month(value: string | null, present: string): string {
  if (!value) return present
  const [year, mm] = value.split('-')
  return `${mm}/${year}`
}

function birthDate(value: string, locale: Locale): string {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(locale === 'it' ? 'it-IT' : 'en-GB', { day: 'numeric', month: locale === 'it' ? '2-digit' : 'long', year: 'numeric' }).format(date)
}

/** Builds the CV from the published content and the private details; returns the PDF. */
export async function buildCv({ data, details, locale, options }: Params): Promise<Blob> {
  const [pdfMakeModule, fonts] = await Promise.all([import('pdfmake/build/pdfmake'), import('pdfmake/build/vfs_fonts')])
  // CommonJS package: the dev server exposes it under `default`, the production build on the module itself.
  const pdfMake = pdfMakeModule.default ?? pdfMakeModule
  pdfMake.addVirtualFileSystem(fonts.default as never)

  const T = LABELS[locale]
  const t = (value: Translated | null | undefined) => (value?.[locale] || value?.it || '').trim()
  const { profile } = data
  const initials = profile.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()

  const section = (title: string): Content => ({
    stack: [
      { text: title.toUpperCase(), fontSize: 10.5, bold: true, color: ACCENT, characterSpacing: 0.6 },
      { canvas: [{ type: 'line', x1: 0, y1: 2, x2: 40, y2: 2, lineWidth: 1.6, lineColor: ACCENT }] },
    ],
    margin: [0, 12, 0, 6],
    unbreakable: true,
  })

  /** One timeline item: a coloured rule on the left, one table row per paragraph so long items can split across pages (short ones are kept whole). */
  const entry = (rows: Content[], keepTogether = false): Content => {
    const item: Content = {
      table: { widths: ['*'], body: rows.map((row) => [row]) },
      layout: {
        hLineWidth: () => 0,
        vLineWidth: (i: number) => (i === 0 ? 2 : 0),
        vLineColor: () => ACCENT,
        paddingLeft: () => 10, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0,
      },
      margin: [2, 0, 0, 9],
    }
    return keepTogether ? { stack: [item], unbreakable: true } : item
  }

  const when = (text: string): Content => ({ text, bold: true, fontSize: 8.4, color: MUTED, margin: [0, 0, 0, 1] })
  const link = (url: string): Content => ({ text: stripProtocol(url), link: url, color: ACCENT, fontSize: 8.2 })

  // ---------- Sidebar
  const sideText = (text: string, extra: Record<string, unknown> = {}): Content => ({ text, fontSize: 8.4, color: '#e8eaf5', ...extra })
  const sideTitle = (title: string): Content => ({ text: title.toUpperCase(), fontSize: 9, bold: true, color: LIGHT, characterSpacing: 0.6, margin: [0, 14, 0, 6] })
  const contactRow = (iconName: string, text: string, url?: string): Content => ({
    columns: [icon(iconName), sideText(text, url ? { link: url } : {})],
    columnGap: 7, margin: [0, 0, 0, 5],
  })

  const contacts: Content[] = []
  if (details.address) contacts.push(contactRow('pin', details.address))
  if (profile.email) contacts.push(contactRow('mail', profile.email, `mailto:${profile.email}`))
  if (details.phone) contacts.push(contactRow('phone', details.phone, `tel:${details.phone.replace(/\s+/g, '')}`))
  contacts.push(contactRow('globe', window.location.host, `${window.location.origin}/`))
  if (profile.github_url) contacts.push(contactRow('github', stripProtocol(profile.github_url), profile.github_url))
  if (profile.linkedin_url) contacts.push(contactRow('linkedin', stripProtocol(profile.linkedin_url).replace(/^www\./, ''), profile.linkedin_url))

  const personal: Content[] = []
  const personalRow = (label: string, value?: string) => {
    if (value) personal.push({ text: [{ text: `${label}: `, bold: true }, value], fontSize: 8.4, color: '#e8eaf5', margin: [0, 0, 0, 4] })
  }
  personalRow(T.birth, details.birth_date ? birthDate(details.birth_date, locale) : undefined)
  personalRow(T.nationality, details.nationality)
  personalRow(T.gender, details.gender && (T.genders[details.gender] ?? details.gender))
  personalRow(T.license, details.driving_license)

  const languages: Content[] = profile.languages.map((language) => ({
    text: [{ text: `${t(language.name)}  `, bold: true }, levelLabel(language.level, locale)],
    fontSize: 8.4, color: '#e8eaf5', margin: [0, 0, 0, 4],
  }))

  const sidebar: Content[] = []
  if (options.photo) {
    sidebar.push({ image: await circlePhoto(profile.photo_url, initials, DARK), width: 104, alignment: 'center', margin: [0, 0, 0, 10] })
  }
  sidebar.push({ text: profile.name, fontSize: 16, bold: true, color: '#ffffff', alignment: 'center' })
  sidebar.push({ text: t(profile.role), fontSize: 9.2, color: LIGHT, alignment: 'center', margin: [0, 2, 0, 0] })
  sidebar.push(sideTitle(T.contacts), ...contacts)
  if (personal.length) sidebar.push(sideTitle(T.details), ...personal)
  if (languages.length) sidebar.push(sideTitle(T.languages), ...languages)

  // ---------- Main column
  const main: Content[] = []
  main.push(section(T.work))
  for (const job of data.experiences) {
    const rows: Content[] = [
      when(`${month(job.start_date, '')} – ${month(job.end_date, T.present)}${job.location ? ` · ${job.location}` : ''}${job.hours ? ` · ${job.hours} ${T.hours}` : ''}`),
      { text: [{ text: t(job.role), bold: true, fontSize: 10.2 }, { text: `  ${job.company}`, color: MUTED }], margin: [0, 0, 0, 2] },
    ]
    if (t(job.description)) rows.push({ text: t(job.description), margin: [0, 0, 0, 3] })
    if (job.tech.length) rows.push({ text: [{ text: `${T.technologies}: `, bold: true }, job.tech.join(', ')], fontSize: 8.4, color: MUTED, margin: [0, 0, 0, 2] })
    for (const line of t(job.highlights).split('\n').map((l) => l.trim()).filter(Boolean)) {
      const [title, ...rest] = line.replace(/\s*\(https?:\/\/[^)]*\)/, '').split(' — ')
      rows.push({ text: [{ text: `${T.followed}: `, bold: true }, title + (rest.length ? ` — ${rest.join(' — ')}` : '')], fontSize: 8.4, color: MUTED, margin: [0, 0, 0, 2] })
    }
    main.push(entry(rows))
  }

  main.push(section(T.education))
  for (const item of data.education) {
    const rows: Content[] = [
      when(`${month(item.start_date, '')} – ${month(item.end_date, T.present)}${item.location ? ` · ${item.location === 'Online' ? T.online : item.location}` : ''}`),
      { text: [{ text: t(item.title), bold: true, fontSize: 10.2 }], margin: [0, 0, 0, 1] },
      { text: t(item.institution), color: MUTED, margin: [0, 0, 0, 2] },
    ]
    if (item.grade) rows.push({ text: item.grade, fontSize: 8.4, color: MUTED })
    if (item.url) rows.push(link(item.url))
    main.push(entry(rows))
  }

  if (options.projects && data.projects.length) {
    main.push(section(T.projects))
    for (const project of data.projects) {
      const rows: Content[] = [
        { text: [{ text: project.name, bold: true, fontSize: 10 }, { text: `  ${t(project.label)}`, color: MUTED, fontSize: 8.2 }], margin: [0, 0, 0, 1] },
        { text: t(project.description), margin: [0, 0, 0, 1] },
      ]
      if (project.repo_url) rows.push(link(project.repo_url))
      main.push(entry(rows, true))
    }
  }

  if (options.certifications && data.certifications.length) {
    main.push(section(T.certifications))
    for (const cert of data.certifications) {
      const rows: Content[] = [
        { text: [{ text: t(cert.name), bold: true }, { text: `  ${cert.issuer} · ${month(cert.issued_at, '')}`, color: MUTED, fontSize: 8.4 }] },
      ]
      if (cert.credential_id) rows.push({ text: `${T.credential}: ${cert.credential_id}`, fontSize: 7.6, color: MUTED })
      main.push(entry(rows, true))
    }
  }

  if (data.skill_groups.length) {
    main.push(section(T.skills))
    const groupBlock = (group: Portfolio['skill_groups'][number]): Content => ({
      stack: [
        { text: t(group.name), bold: true, fontSize: 8.8, color: ACCENT, margin: [0, 0, 0, 2] },
        ...group.items.map((item): Content => ({
          columns: [
            { text: item.name, fontSize: 8.2, width: '*' },
            {
              canvas: Array.from({ length: 4 }, (_, i) => ({
                type: 'ellipse' as const, x: 2 + i * 6.4, y: 4.6, r1: 1.8, r2: 1.8,
                color: i < skillLevel(item.level, locale).steps ? ACCENT : '#d5d7e2',
              })),
              width: 26,
            },
          ],
          columnGap: 3, margin: [0, 0, 0, 1.5],
        })),
      ],
      margin: [0, 0, 0, 8],
    })
    const rows: Content[][] = []
    for (let i = 0; i < data.skill_groups.length; i += 2) {
      const pair = data.skill_groups.slice(i, i + 2).map(groupBlock)
      rows.push(pair.length === 2 ? pair : [pair[0], { text: '' }])
    }
    main.push({
      table: { widths: ['*', '*'], body: rows },
      layout: { hLineWidth: () => 0, vLineWidth: () => 0, paddingLeft: () => 0, paddingRight: (i: number) => (i === 0 ? 14 : 0), paddingTop: () => 0, paddingBottom: () => 0 },
    })
    main.push({ text: T.scale, fontSize: 7.4, italics: true, color: MUTED, margin: [0, 0, 0, 2] })
  }

  if (details.privacy_notice) {
    main.push({ text: details.privacy_notice, fontSize: 7.4, italics: true, color: MUTED, margin: [0, 14, 0, 0] })
  }

  const doc: TDocumentDefinitions = {
    info: { title: `CV — ${profile.name}`, author: profile.name },
    pageSize: 'A4',
    pageMargins: [MARGIN_LEFT, 34, 28, 36],
    background: () => ({ canvas: [{ type: 'rect', x: 0, y: 0, w: SIDEBAR, h: PAGE_HEIGHT, color: DARK }] }),
    defaultStyle: { font: 'Roboto', fontSize: 9, lineHeight: 1.22, color: TEXT },
    content: [{ columns: [{ width: SIDEBAR - 30, stack: sidebar }], absolutePosition: { x: 15, y: 32 } }, ...main],
  }

  return pdfMake.createPdf(doc).getBlob()
}
