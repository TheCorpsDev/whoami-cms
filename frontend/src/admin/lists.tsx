import type { ReactNode } from 'react'
import type { Certification, Education, Experience, Project, SkillGroup, Translated } from '../types'
import { SkillItemsField, TagsField, TextField, Toggle, TransField } from './fields'

const noText = (): Translated => ({ it: '', en: '' })

export type FormProps<T> = { value: T; set: <K extends keyof T>(key: K, v: T[K]) => void }

export type ListConfig<T extends { id?: number; visible?: boolean }> = {
  endpoint: string
  title: string
  path: string
  description: string
  addLabel: string
  emptyText: string
  blank: () => T
  itemTitle: (item: T) => string
  itemSub: (item: T) => string
  itemBadge?: (item: T) => ReactNode
  Form: (props: FormProps<T>) => ReactNode
}

const month = (v: string | null) => v ?? 'oggi'

const experiences: ListConfig<Experience> = {
  endpoint: '/api/admin/experiences',
  title: 'Esperienza',
  path: '// esperienza',
  description: 'Le esperienze lavorative mostrate nella sezione Esperienza.',
  addLabel: 'Nuova esperienza',
  emptyText: 'Nessuna esperienza',
  blank: () => ({ id: 0, role: noText(), company: '', employment_type: noText(), location: '', start_date: '', end_date: null, hours: null, description: noText(), highlights: noText(), tech: [], visible: true }),
  itemTitle: (x) => x.role.it || 'Senza titolo',
  itemSub: (x) => `${x.company} · ${month(x.start_date)} — ${month(x.end_date)}`,
  Form: ({ value: x, set }) => (
    <>
      <div className="fields">
        <TransField label="Ruolo" path="role" value={x.role} onChange={(v) => set('role', v)} />
        <TextField label="Azienda" path="company" value={x.company} onChange={(v) => set('company', v)} />
        <TransField label="Tipo di contratto" path="employment_type" value={x.employment_type} onChange={(v) => set('employment_type', v)} placeholder="Tempo pieno, stage, freelance…" />
        <TextField label="Luogo" path="location" value={x.location} onChange={(v) => set('location', v)} />
        <TextField label="Inizio" path="start_date" type="month" value={x.start_date} onChange={(v) => set('start_date', v)} />
        <TextField label="Fine" path="end_date" type="month" value={x.end_date} onChange={(v) => set('end_date', v || null)} hint="Vuoto = in corso" />
        <TextField label="Ore" path="hours" type="number" value={x.hours} onChange={(v) => set('hours', v ? Number(v) : null)} hint="Facoltativo" />
        <TagsField label="Tecnologie" path="tech" wide value={x.tech} onChange={(v) => set('tech', v)} />
        <TransField label="Descrizione" path="description" wide multiline value={x.description} onChange={(v) => set('description', v)} />
        <TransField label="Progetti seguiti" path="highlights" wide multiline value={x.highlights} onChange={(v) => set('highlights', v)} hint='Uno per riga, nel formato "Titolo — descrizione".' />
      </div>
      <div className="toggles"><Toggle label="Visibile sul sito" checked={!!x.visible} onChange={(v) => set('visible', v)} /></div>
    </>
  ),
}

const projects: ListConfig<Project> = {
  endpoint: '/api/admin/projects',
  title: 'Progetti',
  path: '// progetti',
  description: 'Ordine, visibilità e contenuto delle card dei progetti. Il primo "in evidenza" diventa la card grande.',
  addLabel: 'Nuovo progetto',
  emptyText: 'Nessun progetto',
  blank: () => ({ id: 0, slug: '', name: '', label: noText(), category: 'app', description: noText(), features: noText(), tech: [], repo_url: null, demo_url: null, package_url: null, featured: false, visible: true }),
  itemTitle: (x) => x.name || 'Senza nome',
  itemSub: (x) => `${x.label.it || x.category} · ${x.tech.slice(0, 3).join(', ')}`,
  itemBadge: (x) => (x.featured ? <span aria-label="In evidenza" style={{ color: 'var(--amber)' }}>★</span> : null),
  Form: ({ value: x, set }) => (
    <>
      <div className="fields">
        <TextField label="Nome" path="name" value={x.name} onChange={(v) => {
          set('name', v)
          if (!x.id) set('slug', v.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
        }} />
        <TextField label="Slug" path="slug" value={x.slug} onChange={(v) => set('slug', v)} hint="Minuscole e trattini, unico" />
        <TransField label="Etichetta" path="label" value={x.label} onChange={(v) => set('label', v)} placeholder="Es. Full-stack · Realtime" />
        <label className="f">
          <span className="f-head">Categoria</span>
          <select value={x.category} onChange={(e) => set('category', e.target.value as Project['category'])}>
            <option value="app">App</option>
            <option value="lib">Libreria</option>
            <option value="infra">Infrastruttura</option>
          </select>
        </label>
        <TagsField label="Tecnologie" path="tech" wide value={x.tech} onChange={(v) => set('tech', v)} />
        <TransField label="Descrizione" path="description" wide multiline value={x.description} onChange={(v) => set('description', v)} />
        <TransField label="Funzionalità" path="features" wide multiline value={x.features} onChange={(v) => set('features', v)} hint="Una per riga. Compaiono nella card grande se il progetto è in evidenza." />
        <TextField label="Repository" path="repo_url" type="url" value={x.repo_url} onChange={(v) => set('repo_url', v || null)} placeholder="https://github.com/…" />
        <TextField label="Demo" path="demo_url" type="url" value={x.demo_url} onChange={(v) => set('demo_url', v || null)} placeholder="https://…" />
        <TextField label="Pacchetto (Packagist, npm…)" path="package_url" type="url" value={x.package_url} onChange={(v) => set('package_url', v || null)} placeholder="https://packagist.org/packages/…" />
      </div>
      <div className="toggles">
        <Toggle label="Visibile sul sito" checked={!!x.visible} onChange={(v) => set('visible', v)} />
        <Toggle label="In evidenza nella home" checked={x.featured} onChange={(v) => set('featured', v)} />
      </div>
    </>
  ),
}

const education: ListConfig<Education> = {
  endpoint: '/api/admin/education',
  title: 'Formazione',
  path: '// formazione',
  description: 'Titoli di studio mostrati nella sezione Formazione.',
  addLabel: 'Nuovo titolo',
  emptyText: 'Nessun titolo',
  blank: () => ({ id: 0, title: noText(), institution: noText(), location: '', start_date: '', end_date: null, url: null, grade: null, visible: true }),
  itemTitle: (x) => x.title.it || 'Senza titolo',
  itemSub: (x) => `${x.institution.it} · ${month(x.start_date)} — ${month(x.end_date)}`,
  Form: ({ value: x, set }) => (
    <>
      <div className="fields">
        <TransField label="Titolo" path="title" wide value={x.title} onChange={(v) => set('title', v)} />
        <TransField label="Istituto" path="institution" wide value={x.institution} onChange={(v) => set('institution', v)} />
        <TextField label="Luogo" path="location" value={x.location} onChange={(v) => set('location', v)} />
        <TextField label="Sito" path="url" type="url" value={x.url} onChange={(v) => set('url', v || null)} placeholder="https://…" />
        <TextField label="Inizio" path="start_date" type="month" value={x.start_date} onChange={(v) => set('start_date', v)} />
        <TextField label="Fine" path="end_date" type="month" value={x.end_date} onChange={(v) => set('end_date', v || null)} hint="Vuoto = in corso" />
        <TextField label="Voto finale" path="grade" value={x.grade} onChange={(v) => set('grade', v || null)} placeholder="Es. 110/110" />
      </div>
      <div className="toggles"><Toggle label="Visibile sul sito" checked={!!x.visible} onChange={(v) => set('visible', v)} /></div>
    </>
  ),
}

const certifications: ListConfig<Certification> = {
  endpoint: '/api/admin/certifications',
  title: 'Certificazioni',
  path: '// certificazioni',
  description: 'Attestati con il link per verificarli. La sezione compare sul sito solo se ce n’è almeno uno visibile.',
  addLabel: 'Nuova certificazione',
  emptyText: 'Nessuna certificazione ancora',
  blank: () => ({ id: 0, name: noText(), issuer: '', issued_at: null, expires_at: null, credential_id: null, url: null, description: noText(), visible: true }),
  itemTitle: (x) => x.name.it || 'Senza nome',
  itemSub: (x) => `${x.issuer}${x.issued_at ? ` · ${x.issued_at}` : ''}`,
  Form: ({ value: x, set }) => (
    <>
      <div className="fields">
        <TransField label="Nome" path="name" wide value={x.name} onChange={(v) => set('name', v)} placeholder="Es. AWS Certified Cloud Practitioner" />
        <TextField label="Ente" path="issuer" value={x.issuer} onChange={(v) => set('issuer', v)} />
        <TextField label="ID credenziale" path="credential_id" value={x.credential_id} onChange={(v) => set('credential_id', v || null)} />
        <TextField label="Data di rilascio" path="issued_at" type="month" value={x.issued_at} onChange={(v) => set('issued_at', v || null)} />
        <TextField label="Scadenza" path="expires_at" type="month" value={x.expires_at} onChange={(v) => set('expires_at', v || null)} hint="Vuoto = nessuna" />
        <TextField label="Link di verifica" path="url" type="url" wide value={x.url} onChange={(v) => set('url', v || null)} placeholder="https://…" />
        <TransField label="Descrizione" path="description" wide multiline value={x.description} onChange={(v) => set('description', v)} />
      </div>
      <div className="toggles"><Toggle label="Visibile sul sito" checked={!!x.visible} onChange={(v) => set('visible', v)} /></div>
    </>
  ),
}

const skillGroups: ListConfig<SkillGroup> = {
  endpoint: '/api/admin/skill-groups',
  title: 'Competenze',
  path: '// stack',
  description: 'Gruppi di tecnologie mostrati nello stack, nella fascia scorrevole e nel codice della hero. Le lingue si modificano nel Profilo.',
  addLabel: 'Nuovo gruppo',
  emptyText: 'Nessun gruppo',
  blank: () => ({ id: 0, name: noText(), items: [], visible: true }),
  itemTitle: (x) => x.name.it || 'Senza nome',
  itemSub: (x) => x.items.map((i) => i.name).join(', '),
  Form: ({ value: x, set }) => (
    <>
      <div className="fields">
        <TransField label="Nome del gruppo" path="name" wide value={x.name} onChange={(v) => set('name', v)} placeholder="Es. Backend" />
        <SkillItemsField value={x.items} onChange={(v) => set('items', v)} />
      </div>
      <div className="toggles"><Toggle label="Visibile sul sito" checked={!!x.visible} onChange={(v) => set('visible', v)} /></div>
    </>
  ),
}

export const LISTS = { experiences, projects, education, certifications, skillGroups }
