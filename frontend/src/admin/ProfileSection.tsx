import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Icon } from '../components/Icon'
import { ApiError } from '../lib/api'
import { LANGUAGE_LEVELS, LANGUAGE_STEPS, levelLabel, levelSteps, type LanguageLevel } from '../lib/languages'
import type { Profile, Translated } from '../types'
import { ErrorsContext, ReviewContext, useAdminApi, useToast } from './context'
import { Panel, TagsField, TextField, Toggle, TransField } from './fields'
import { savedMessage } from './messages'

const T = (): Translated => ({ it: '', en: '' })

const formatSize = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`)

export function ProfileSection() {
  const call = useAdminApi()
  const notify = useToast()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    call<Profile>('/api/admin/profile').then(setProfile).catch((e) => notify(e.message, true))
  }, [call, notify])

  if (!profile) return <p className="dim">Caricamento…</p>

  const review = {
    pending: profile.auto_translated ?? [],
    approve: (path: string) => setProfile((p) => (p ? {
      ...p,
      auto_translated: (p.auto_translated ?? []).filter((x) => x !== path),
      approved: [...new Set([...(p.approved ?? []), path])],
    } : p)),
  }

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => setProfile((p) => (p ? { ...p, [key]: value } : p))

  async function save(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErrors({})
    try {
      const before = profile?.auto_translated?.length ?? 0
      const { translation_warning: warning, ...saved } = await call<Profile>('/api/admin/profile', { method: 'PUT', json: profile })
      setProfile(saved)
      notify(savedMessage(false, warning, before, saved.auto_translated?.length ?? 0), !!warning)
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.errors)
      notify(err instanceof Error ? err.message : String(err), true)
    } finally {
      setBusy(false)
    }
  }

  async function upload(kind: 'photo' | 'cv', e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const body = new FormData()
    body.append(kind, file)
    try {
      const updated = await call<Profile>(`/api/admin/profile/${kind}`, { method: 'POST', body })
      setProfile((p) => (p ? { ...p, photo_url: updated.photo_url, cv_url: updated.cv_url, cv_size: updated.cv_size } : p))
      notify(kind === 'photo' ? 'Foto aggiornata' : 'CV caricato')
    } catch (err) {
      notify(err instanceof Error ? err.message : String(err), true)
    }
  }

  async function removeFile(kind: 'photo' | 'cv') {
    if (!window.confirm(kind === 'photo' ? 'Rimuovere la foto?' : 'Rimuovere il CV?')) return
    try {
      const updated = await call<Profile>(`/api/admin/profile/${kind}`, { method: 'DELETE' })
      setProfile((p) => (p ? { ...p, photo_url: updated.photo_url, cv_url: updated.cv_url, cv_size: updated.cv_size } : p))
    } catch (err) {
      notify(err instanceof Error ? err.message : String(err), true)
    }
  }

  return (
    <form onSubmit={save} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-head">
        <div>
          <span className="eyebrow" style={{ fontSize: 12 }}>// profilo</span>
          <h1>Profilo</h1>
          <p>Foto, testi della hero, presentazione, lingue e link di contatto.</p>
        </div>
        <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Salvataggio…' : 'Salva modifiche'}</button>
      </div>

      {review.pending.length > 0 && (
        <div className="review-note" style={{ fontSize: 14 }}>
          <span>{review.pending.length === 1 ? '1 testo inglese tradotto' : `${review.pending.length} testi inglesi tradotti`} in automatico da controllare: cerca il badge "EN da controllare".</span>
        </div>
      )}
      <ErrorsContext.Provider value={errors}>
      <ReviewContext.Provider value={review}>
        <Panel>
          <div className="files">
            <div className="file-row">
              {profile.photo_url ? <img src={profile.photo_url} alt="Foto profilo attuale" /> : <span className="file-ph round">foto</span>}
              <div className="file-info">
                <h2>Foto profilo</h2>
                <span className="panel-hint">JPG, PNG o WebP, almeno 200 × 200 px, max 5 MB</span>
                <div className="file-actions">
                  <label className="btn btn-ghost file-btn" style={{ minHeight: 40, fontSize: 14 }}>
                    <Icon name="upload" size={15} />Carica foto
                    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => upload('photo', e)} />
                  </label>
                  {profile.photo_url && <button type="button" className="btn btn-danger" style={{ minHeight: 40, fontSize: 14 }} onClick={() => removeFile('photo')}>Rimuovi</button>}
                </div>
              </div>
            </div>
            <div className="file-row">
              {profile.cv_url ? (
                <a className="file-doc" href={profile.cv_url} target="_blank" rel="noreferrer" aria-label="Apri il CV attuale">
                  <Icon name="fileText" size={26} />
                  <span>PDF</span>
                  <span className="file-ok" aria-hidden="true"><Icon name="check" size={11} strokeWidth={3} /></span>
                </a>
              ) : (
                <span className="file-ph">PDF</span>
              )}
              <div className="file-info">
                <h2>Curriculum</h2>
                <span className="panel-hint">{profile.cv_url ? (
                  <>Caricato{profile.cv_size ? ` · ${formatSize(profile.cv_size)}` : ''} · <a href={profile.cv_url} target="_blank" rel="noreferrer">apri ↗</a></>
                ) : 'Nessun file: il pulsante "Scarica il CV" è nascosto'}</span>
                <div className="file-actions">
                  <label className="btn btn-ghost file-btn" style={{ minHeight: 40, fontSize: 14 }}>
                    <Icon name="upload" size={15} />Carica PDF
                    <input type="file" accept="application/pdf" onChange={(e) => upload('cv', e)} />
                  </label>
                  {profile.cv_url && <button type="button" className="btn btn-danger" style={{ minHeight: 40, fontSize: 14 }} onClick={() => removeFile('cv')}>Rimuovi</button>}
                </div>
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Hero">
          <div className="fields">
            <TextField label="Nome" path="name" value={profile.name} onChange={(v) => set('name', v)} />
            <TransField label="Ruolo" path="role" value={profile.role} onChange={(v) => set('role', v)} />
            <TagsField
              label="Frasi a rotazione (IT)" path="rotating_words.it" wide
              value={profile.rotating_words.it}
              onChange={(v) => set('rotating_words', { ...profile.rotating_words, it: v })}
              hint='Completano "Backend Developer che crea …". Max 8.'
              placeholder="Aggiungi una frase e premi Invio"
            />
            <TagsField
              label="Frasi a rotazione (EN)" path="rotating_words.en" wide
              value={profile.rotating_words.en}
              onChange={(v) => set('rotating_words', { ...profile.rotating_words, en: v })}
              reviewPath="rotating_words"
              hint='Completano "Backend Developer who builds …". Se vuote si usano quelle italiane (o vengono tradotte, se la traduzione automatica è attiva).'
              placeholder="Add a phrase and press Enter"
            />
            <TransField label="Presentazione breve" path="hero_bio" wide multiline value={profile.hero_bio} onChange={(v) => set('hero_bio', v)} />
          </div>
        </Panel>

        <Panel title="About" hint="Separa i paragrafi del testo con una riga vuota. I numeri (anni, progetti, certificazioni, tecnologie) si calcolano da soli.">
          <div className="fields">
            <TransField
              label="Frase d'apertura" path="about_headline" wide
              value={profile.about_headline ?? T()} onChange={(v) => set('about_headline', v)}
              hint="Il titolo grande della sezione. Metti tra *asterischi* le parole da evidenziare in viola."
            />
            <TransField label="Testo" path="about" wide multiline value={profile.about} onChange={(v) => set('about', v)} />
          </div>
          <div className="repeat">
            {profile.highlights.map((h, i) => (
              <div key={i} className="repeat-item">
                <div className="fields">
                  <TransField label={`Punto di forza ${i + 1}`} path={`highlights.${i}.title`} value={h.title} onChange={(v) => set('highlights', profile.highlights.map((x, j) => (j === i ? { ...x, title: v } : x)))} />
                  <TransField label="Descrizione" path={`highlights.${i}.body`} wide multiline value={h.body} onChange={(v) => set('highlights', profile.highlights.map((x, j) => (j === i ? { ...x, body: v } : x)))} />
                </div>
                <button type="button" className="btn btn-danger" style={{ alignSelf: 'flex-start', minHeight: 40, fontSize: 14 }} onClick={() => set('highlights', profile.highlights.filter((_, j) => j !== i))}>Rimuovi</button>
              </div>
            ))}
            {profile.highlights.length < 6 && (
              <button type="button" className="btn btn-ghost" style={{ alignSelf: 'flex-start' }} onClick={() => set('highlights', [...profile.highlights, { title: T(), body: T() }])}><Icon name="plus" size={16} />Aggiungi punto di forza</button>
            )}
          </div>
        </Panel>

        <Panel title="Lingue" hint="Mostrate nella sezione Formazione: le tacche si riempiono in base al livello.">
          <div className="repeat">
            {profile.languages.map((l, i) => {
              const update = (patch: Partial<typeof l>) => set('languages', profile.languages.map((x, j) => (j === i ? { ...x, ...patch } : x)))
              return (
                <div key={i} className="repeat-item">
                  <div className="fields">
                    <TransField label="Lingua" path={`languages.${i}.name`} value={l.name} onChange={(v) => update({ name: v })} />
                    <label className="f">
                      <span className="f-head">Livello</span>
                      <select value={l.level} onChange={(e) => update({ level: e.target.value as LanguageLevel })}>
                        {LANGUAGE_LEVELS.map((code) => <option key={code} value={code}>{levelLabel(code, 'it')}</option>)}
                      </select>
                      <span className="hint">Sul sito: "{levelLabel(l.level, 'en')}" in inglese</span>
                    </label>
                    <div className="f">
                      <span className="f-head">Anteprima</span>
                      <span className="skill-steps steps-6 lang-preview" aria-hidden="true">
                        {Array.from({ length: LANGUAGE_STEPS }, (_, n) => (
                          <span key={n} style={n < levelSteps(l.level).steps ? { background: levelSteps(l.level).color } : undefined} />
                        ))}
                      </span>
                    </div>
                  </div>
                  <button type="button" className="btn btn-danger" style={{ alignSelf: 'flex-start', minHeight: 40, fontSize: 14 }} onClick={() => set('languages', profile.languages.filter((_, j) => j !== i))}>Rimuovi</button>
                </div>
              )
            })}
            <button type="button" className="btn btn-ghost" style={{ alignSelf: 'flex-start' }} onClick={() => set('languages', [...profile.languages, { name: T(), level: 'B1' }])}><Icon name="plus" size={16} />Aggiungi lingua</button>
          </div>
        </Panel>

        <Panel
          title="Stato e contatti"
          hint='Il badge "Aperto a nuove opportunità" compare nella hero solo se attivo.'
          actions={<Toggle label={profile.available ? 'Disponibile' : 'Non disponibile'} checked={profile.available} onChange={(v) => set('available', v)} />}
        >
          <div className="fields">
            <TextField label="Email pubblica" path="email" type="email" value={profile.email} onChange={(v) => set('email', v || null)} />
            <TransField label="Città" path="location" value={profile.location ?? T()} onChange={(v) => set('location', v)} />
            <TextField label="GitHub" path="github_url" type="url" value={profile.github_url} onChange={(v) => set('github_url', v || null)} />
            <TextField label="LinkedIn" path="linkedin_url" type="url" value={profile.linkedin_url} onChange={(v) => set('linkedin_url', v || null)} />
          </div>
        </Panel>
      </ReviewContext.Provider>
      </ErrorsContext.Provider>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Salvataggio…' : 'Salva modifiche'}</button>
      </div>
    </form>
  )
}
