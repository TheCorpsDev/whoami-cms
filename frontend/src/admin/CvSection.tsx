import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Icon } from '../components/Icon'
import { ApiError } from '../lib/api'
import type { CvDetails, Locale, Portfolio, Profile } from '../types'
import { ErrorsContext, useAdminApi, useToast } from './context'
import { ChoiceField, DateField, Panel, TextField, Toggle } from './fields'
import type { CvOptions } from './cv/buildCv'

/** Pre-filled in the form until the admin writes their own. */
const DEFAULT_PRIVACY_NOTICE = 'Autorizzo il trattamento dei miei dati personali presenti nel CV ai sensi dell’art. 13 d. lgs. 30 giugno 2003 n. 196 - “Codice in materia di protezione dei dati personali” e dell’art. 13 GDPR 679/16 - “Regolamento europeo sulla protezione dei dati personali”.'

const LOCALES = [
  { value: 'it', label: 'Italiano' },
  { value: 'en', label: 'English' },
]

const GENDERS = [
  { value: 'Maschile', label: 'Maschio' },
  { value: 'Femminile', label: 'Femmina' },
]

const formatSize = (bytes: number) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`)

/**
 * Builds the CV as a PDF from the published content and the private details of the
 * profile. It runs in the browser: the PDF library is loaded only when needed.
 */
export function CvSection() {
  const call = useAdminApi()
  const notify = useToast()
  const [data, setData] = useState<Portfolio | null>(null)
  const [admin, setAdmin] = useState<Profile | null>(null)
  const [locale, setLocale] = useState<Locale>('it')
  const [options, setOptions] = useState<CvOptions>({ photo: true, projects: true, certifications: true })
  const [busy, setBusy] = useState<'preview' | 'download' | 'publish' | null>(null)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [saving, setSaving] = useState(false)
  const loaded = useRef(false)

  useEffect(() => {
    if (loaded.current) return
    loaded.current = true
    Promise.all([call<Portfolio>('/api/portfolio'), call<Profile>('/api/admin/profile')])
      .then(([portfolio, profile]) => {
        setData(portfolio)
        setAdmin({ ...profile, cv_details: { ...profile.cv_details, privacy_notice: profile.cv_details?.privacy_notice || DEFAULT_PRIVACY_NOTICE } })
      })
      .catch((err) => notify(err instanceof Error ? err.message : String(err), true))
  }, [call, notify])

  async function build(): Promise<Blob> {
    if (!data || !admin) throw new Error('Dati non ancora caricati')
    const { buildCv } = await import('./cv/buildCv')
    return buildCv({ data, details: admin.cv_details ?? {}, locale, options })
  }

  const fileName = () => `CV-${(data?.profile.name ?? 'cv').replace(/\s+/g, '-')}-${locale}.pdf`

  async function run(kind: 'preview' | 'download' | 'publish') {
    setBusy(kind)
    // The preview opens a tab: do it now, inside the click, or the browser blocks it.
    const tab = kind === 'preview' ? window.open('', '_blank') : null
    try {
      const blob = await build()
      if (kind === 'publish') {
        const body = new FormData()
        body.append('cv', new File([blob], fileName(), { type: 'application/pdf' }))
        const updated = await call<Profile>('/api/admin/profile/cv', { method: 'POST', body })
        setAdmin((p) => (p ? { ...p, cv_url: updated.cv_url, cv_size: updated.cv_size } : p))
        notify(`CV ${locale === 'it' ? 'in italiano' : 'in inglese'} pubblicato sul sito`)
      } else {
        const url = URL.createObjectURL(blob)
        if (kind === 'preview' && tab) {
          tab.location.href = url
        } else {
          const link = document.createElement('a')
          link.href = url
          link.download = fileName()
          link.click()
          if (tab) tab.close()
        }
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
      }
    } catch (err) {
      tab?.close()
      notify(err instanceof Error ? err.message : String(err), true)
    } finally {
      setBusy(null)
    }
  }

  const setDetail = (key: keyof CvDetails, value: string) => setAdmin((p) => (p ? { ...p, cv_details: { ...p.cv_details, [key]: value } } : p))

  async function saveDetails(e: FormEvent) {
    e.preventDefault()
    if (!admin) return
    setSaving(true)
    setErrors({})
    try {
      const { translation_warning: warning, ...saved } = await call<Profile>('/api/admin/profile', { method: 'PUT', json: admin })
      setAdmin(saved)
      notify(warning ? String(warning) : 'Dati per il CV salvati', !!warning)
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.errors)
      notify(err instanceof Error ? err.message : String(err), true)
    } finally {
      setSaving(false)
    }
  }

  const details = admin?.cv_details ?? {}
  const missing = !details.birth_date && !details.phone && !details.address
  const toggle = (key: keyof CvOptions) => (value: boolean) => setOptions((o) => ({ ...o, [key]: value }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-head">
        <div>
          <span className="eyebrow" style={{ fontSize: 12 }}>// cv</span>
          <h1>CV</h1>
          <p>Genera il CV in PDF con i contenuti pubblicati sul sito e i dati riservati del profilo.</p>
        </div>
      </div>

      <Panel title="Genera" hint="Il PDF nasce nel tuo browser: i dati riservati non lasciano questa pagina finché non pubblichi il file.">
        <div className="cv-options">
          <ChoiceField label="Lingua del CV" value={locale} onChange={(v) => setLocale(v as Locale)} options={LOCALES} clearable={false} />
          <div className="f">
            <span className="f-head">Includi</span>
            <div className="toggles">
              <Toggle label="Foto" checked={options.photo} onChange={toggle('photo')} />
              <Toggle label="Progetti personali" checked={options.projects} onChange={toggle('projects')} />
              <Toggle label="Certificazioni" checked={options.certifications} onChange={toggle('certifications')} />
            </div>
          </div>
        </div>
        {locale === 'en' && <span className="panel-hint">Se un testo inglese manca, nel CV compare quello italiano.</span>}
        {missing && admin && (
          <div className="review-note" style={{ marginTop: 14 }}>
            <span>Nessun dato riservato inserito (data di nascita, telefono, indirizzo): il CV li lascerà fuori. Compilali nel riquadro qui sotto.</span>
          </div>
        )}
        <div className="file-actions" style={{ marginTop: 18 }}>
          <button type="button" className="btn btn-ghost" disabled={!data || busy !== null} onClick={() => run('preview')}>
            <Icon name="fileText" size={16} />{busy === 'preview' ? 'Creo il PDF…' : 'Anteprima'}
          </button>
          <button type="button" className="btn btn-ghost" disabled={!data || busy !== null} onClick={() => run('download')}>
            <Icon name="download" size={16} />{busy === 'download' ? 'Creo il PDF…' : 'Scarica il PDF'}
          </button>
          <button type="button" className="btn btn-primary" disabled={!data || busy !== null} onClick={() => run('publish')}>
            <Icon name="upload" size={16} />{busy === 'publish' ? 'Pubblico…' : 'Pubblica come CV del sito'}
          </button>
        </div>
      </Panel>

      <Panel title="Dati per il CV" hint="Riservati: non compaiono mai nel sito pubblico, servono solo a generare il CV.">
        <form onSubmit={saveDetails} noValidate>
          <ErrorsContext.Provider value={errors}>
            <div className="fields">
              <DateField label="Data di nascita" path="cv_details.birth_date" value={details.birth_date ?? ''} onChange={(v) => setDetail('birth_date', v)} />
              <TextField label="Nazionalità" path="cv_details.nationality" value={details.nationality ?? ''} onChange={(v) => setDetail('nationality', v)} placeholder="Italiana" />
              <ChoiceField label="Sesso" path="cv_details.gender" value={details.gender ?? ''} onChange={(v) => setDetail('gender', v)} options={GENDERS} />
              <TextField label="Telefono" path="cv_details.phone" value={details.phone ?? ''} onChange={(v) => setDetail('phone', v)} placeholder="+39 …" />
              <TextField label="Indirizzo" path="cv_details.address" wide value={details.address ?? ''} onChange={(v) => setDetail('address', v)} placeholder="Via, CAP e città" />
              <TextField label="Patente di guida" path="cv_details.driving_license" value={details.driving_license ?? ''} onChange={(v) => setDetail('driving_license', v)} placeholder="B" />
              <TextField label="Trattamento dei dati (in fondo al CV)" path="cv_details.privacy_notice" wide multiline value={details.privacy_notice ?? ''} onChange={(v) => setDetail('privacy_notice', v)} hint="Facoltativo: per esempio la formula sul consenso al trattamento dei dati personali." />
            </div>
          </ErrorsContext.Provider>
          <div className="file-actions" style={{ marginTop: 18 }}>
            <button type="submit" className="btn btn-primary" disabled={!admin || saving}>{saving ? 'Salvataggio…' : 'Salva i dati'}</button>
            <span className="panel-hint">Il PDF usa quello che vedi qui, anche prima di salvare.</span>
          </div>
        </form>
      </Panel>

      <Panel title="CV pubblicato">
        {admin?.cv_url ? (
          <span className="panel-hint">
            <a href={admin.cv_url} target="_blank" rel="noreferrer">Apri il CV attuale</a>{admin.cv_size ? ` · ${formatSize(admin.cv_size)}` : ''}. «Pubblica» lo sostituisce; puoi sempre caricarne uno tuo da Profilo.
          </span>
        ) : (
          <span className="panel-hint">Nessun CV pubblicato: il pulsante «Scarica il CV» del sito è nascosto.</span>
        )}
      </Panel>
    </div>
  )
}
