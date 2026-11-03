import { useContext, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Icon } from '../components/Icon'
import { SKILL_LEVELS, skillLevel } from '../lib/skills'
import type { Locale, SkillItem, Translated } from '../types'
import { AutoTranslateContext, ErrorsContext, ReviewContext } from './context'

function FieldError({ path }: { path?: string }) {
  const errors = useContext(ErrorsContext)
  if (!path) return null
  const message = errors[path]?.[0] ?? errors[`${path}.it`]?.[0] ?? errors[`${path}.en`]?.[0]
  return message ? <span className="f-error">{message}</span> : null
}

type Common = { label: string; path?: string; wide?: boolean; hint?: string }

export function TextField({
  label, path, wide, hint, value, onChange, type = 'text', placeholder, multiline,
}: Common & { value: string | number | null; onChange: (v: string) => void; type?: string; placeholder?: string; multiline?: boolean }) {
  return (
    <label className={`f${wide ? ' wide' : ''}`}>
      <span className="f-head">{label}</span>
      {multiline ? (
        <textarea rows={4} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type={type} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
      {hint && <span className="hint">{hint}</span>}
      <FieldError path={path} />
    </label>
  )
}

const MONTHS = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
const WEEKDAYS = ['lu', 'ma', 'me', 'gi', 've', 'sa', 'do']

const pad = (n: number) => String(n).padStart(2, '0')
const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** "2026-11-04" → Date, or null when it is not a real calendar date. */
function fromIso(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return toIso(date) === value ? date : null
}

const toDisplay = (value: string) => {
  const date = fromIso(value)
  return date ? `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}` : ''
}

/** "04/11/2026" → "2026-11-04", or '' when incomplete or not a real date. */
function displayToIso(text: string): string {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text)
  if (!match) return ''
  const iso = `${match[3]}-${match[2]}-${match[1]}`
  return fromIso(iso) ? iso : ''
}

/** Digits only, with the slashes added as you type: 04111994 → 04/11/1994. */
const maskDate = (text: string) => {
  const digits = text.replace(/\D/g, '').slice(0, 8)
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join('/')
}

/** Date input with a calendar of our own: the browser's picker can't follow the admin theme. Value is YYYY-MM-DD. */
export function DateField({
  label, path, wide, hint, value, onChange, minYear, maxYear,
}: Common & { value: string; onChange: (v: string) => void; minYear?: number; maxYear?: number }) {
  const [today] = useState(() => new Date())
  const lastYear = maxYear ?? today.getFullYear()
  const firstYear = minYear ?? lastYear - 100
  const selected = fromIso(value)
  // While typing `draft` wins; otherwise the field shows the value, so outside changes (the form loading) need no syncing.
  const [draft, setDraft] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [browsed, setBrowsed] = useState<{ year: number; month: number } | null>(null)
  const view = browsed ?? { year: (selected ?? today).getFullYear(), month: (selected ?? today).getMonth() }
  const text = draft ?? toDisplay(value)
  const box = useRef<HTMLDivElement>(null)
  const labelId = useId()

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }
    const esc = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  const type = (raw: string) => {
    const masked = maskDate(raw)
    setDraft(masked)
    if (masked === '') onChange('')
    else if (masked.length === 10) onChange(displayToIso(masked))
  }

  const pick = (date: Date) => {
    onChange(toIso(date))
    setBrowsed(null)
    setDraft(null)
    setOpen(false)
  }

  const shift = (delta: number) => {
    const next = new Date(view.year, view.month + delta, 1)
    if (next.getFullYear() < firstYear || next.getFullYear() > lastYear) return
    setBrowsed({ year: next.getFullYear(), month: next.getMonth() })
  }

  const offset = (new Date(view.year, view.month, 1).getDay() + 6) % 7
  const cells = Array.from({ length: 42 }, (_, i) => new Date(view.year, view.month, i - offset + 1))
  const years = Array.from({ length: lastYear - firstYear + 1 }, (_, i) => lastYear - i)

  return (
    <div className={`f${wide ? ' wide' : ''}`}>
      <span className="f-head" id={labelId}>{label}</span>
      <div className="dp-wrap" ref={box}>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          aria-labelledby={labelId}
          placeholder="gg/mm/aaaa"
          value={text}
          onChange={(e) => type(e.target.value)}
          onBlur={() => setDraft(null)}
        />
        <button type="button" className="dp-toggle" aria-label="Apri il calendario" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <Icon name="calendar" size={18} />
        </button>
        {open && (
          <div className="dp" role="dialog" aria-label={`Scegli: ${label}`}>
            <div className="dp-head">
              <button type="button" aria-label="Mese precedente" onClick={() => shift(-1)}><Icon name="left" size={16} /></button>
              <select aria-label="Mese" value={view.month} onChange={(e) => setBrowsed({ ...view, month: Number(e.target.value) })}>
                {MONTHS.map((name, i) => <option key={name} value={i}>{name}</option>)}
              </select>
              <select aria-label="Anno" value={view.year} onChange={(e) => setBrowsed({ ...view, year: Number(e.target.value) })}>
                {years.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
              <button type="button" aria-label="Mese successivo" onClick={() => shift(1)}><Icon name="right" size={16} /></button>
            </div>
            <div className="dp-grid">
              {WEEKDAYS.map((day) => <span key={day} className="dp-dow">{day}</span>)}
              {cells.map((date) => {
                const iso = toIso(date)
                const classes = [date.getMonth() !== view.month && 'out', iso === toIso(today) && 'today'].filter(Boolean).join(' ')
                return (
                  <button key={iso} type="button" className={classes} aria-pressed={iso === value} onClick={() => pick(date)}>{date.getDate()}</button>
                )
              })}
            </div>
            <div className="dp-foot">
              <button type="button" onClick={() => { onChange(''); setDraft(null); setOpen(false) }}>Cancella</button>
              <button type="button" onClick={() => pick(today)}>Oggi</button>
            </div>
          </div>
        )}
      </div>
      {hint && <span className="hint">{hint}</span>}
      <FieldError path={path} />
    </div>
  )
}

/** Mutually exclusive choices shown as buttons. Unless `clearable` is off, clicking the selected one clears it so the field can stay empty. */
export function ChoiceField({
  label, path, wide, hint, value, onChange, options, clearable = true,
}: Common & { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; clearable?: boolean }) {
  const labelId = useId()
  return (
    <div className={`f${wide ? ' wide' : ''}`}>
      <span className="f-head" id={labelId}>{label}</span>
      <div className="choice" role="group" aria-labelledby={labelId}>
        {options.map((option) => (
          <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onChange(clearable && value === option.value ? '' : option.value)}>
            {option.label}
          </button>
        ))}
      </div>
      {hint && <span className="hint">{hint}</span>}
      <FieldError path={path} />
    </div>
  )
}

function ReviewNote({ path }: { path: string }) {
  const { approve } = useContext(ReviewContext)
  return (
    <div className="review-note">
      <span>Tradotto in automatico con DeepL: controllalo e correggilo se serve.</span>
      <button type="button" onClick={() => approve(path)}><Icon name="check" size={14} strokeWidth={2.6} />Va bene</button>
    </div>
  )
}

/**
 * One input with IT/EN tabs. English is translated from Italian when the form
 * is saved; until approved or edited by hand it is marked "da controllare".
 */
export function TransField({
  label, path, wide, hint, value, onChange, multiline, placeholder,
}: Common & { value: Translated; onChange: (v: Translated) => void; multiline?: boolean; placeholder?: string }) {
  const [locale, setLocale] = useState<Locale>('it')
  const { pending, approve } = useContext(ReviewContext)
  const autoTranslate = useContext(AutoTranslateContext)
  const toReview = !!path && pending.includes(path)
  const current = value?.[locale] ?? ''
  const set = (v: string) => {
    onChange({ ...{ it: '', en: '' }, ...value, [locale]: v })
    // Rewriting the English text by hand is a review.
    if (locale === 'en' && toReview) approve(path!)
  }

  let note: ReactNode = hint ? <span className="hint">{hint}</span> : null
  if (locale === 'en' && toReview) note = <ReviewNote path={path!} />
  else if (locale === 'en' && !value?.en) note = <span className="hint">{autoTranslate ? 'Vuoto: verrà tradotto in automatico al salvataggio.' : 'Se vuoto, sul sito in inglese compare il testo italiano.'}</span>
  else if (locale === 'it' && autoTranslate && value?.it && !value?.en) note = <span className="hint">{hint ? `${hint} ` : ''}L'inglese verrà tradotto in automatico al salvataggio.</span>

  return (
    <div className={`f${wide ? ' wide' : ''}`}>
      <div className="f-head">
        <label htmlFor={`${path}-${locale}`}>{label}</label>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {toReview && <button type="button" className="review-badge" onClick={() => setLocale('en')}>EN da controllare</button>}
          <span className="loc-tabs" role="group" aria-label={`Lingua di ${label}`}>
            {(['it', 'en'] as const).map((l) => (
              <button key={l} type="button" aria-pressed={locale === l} onClick={() => setLocale(l)}>
                {l.toUpperCase()}{(l === 'en' && toReview) || !value?.[l] ? <span className="miss"> •</span> : null}
              </button>
            ))}
          </span>
        </span>
      </div>
      {multiline ? (
        <textarea id={`${path}-${locale}`} rows={5} value={current} placeholder={locale === 'en' ? value?.it : placeholder} onChange={(e) => set(e.target.value)} />
      ) : (
        <input id={`${path}-${locale}`} type="text" value={current} placeholder={locale === 'en' ? value?.it : placeholder} onChange={(e) => set(e.target.value)} />
      )}
      {note}
      <FieldError path={path} />
    </div>
  )
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} className="switch" onClick={() => onChange(!checked)}>
      <span className="track"><span className="knob" /></span>
      {label}
    </button>
  )
}

export function TagsField({
  label, path, wide, hint, value, onChange, placeholder = 'Scrivi e premi Invio', reviewPath,
}: Common & { value: string[]; onChange: (v: string[]) => void; placeholder?: string; reviewPath?: string }) {
  const [draft, setDraft] = useState('')
  const { pending, approve } = useContext(ReviewContext)
  const toReview = !!reviewPath && pending.includes(reviewPath)

  function change(next: string[]) {
    onChange(next)
    if (toReview) approve(reviewPath!)
  }

  function add() {
    const items = draft.split(',').map((s) => s.trim()).filter(Boolean).filter((s) => !value.includes(s))
    if (items.length) change([...value, ...items])
    setDraft('')
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add()
    } else if (e.key === 'Backspace' && !draft && value.length) {
      change(value.slice(0, -1))
    }
  }

  return (
    <div className={`f${wide ? ' wide' : ''}`}>
      <span className="f-head">{label}{toReview && <span className="review-badge">da controllare</span>}</span>
      <div className="tag-input">
        {value.map((tag) => (
          <span key={tag}>
            {tag}
            <button type="button" aria-label={`Rimuovi ${tag}`} onClick={() => change(value.filter((t) => t !== tag))}><Icon name="x" size={14} /></button>
          </span>
        ))}
        <input aria-label={label} value={draft} placeholder={placeholder} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKey} onBlur={add} />
      </div>
      {toReview ? <ReviewNote path={reviewPath!} /> : hint && <span className="hint">{hint}</span>}
      <FieldError path={path} />
    </div>
  )
}

export function Panel({ title, hint, children, actions }: { title?: string; hint?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="panel">
      {(title || actions) && (
        <div className="page-head" style={{ alignItems: 'center' }}>
          <div>{title && <h2>{title}</h2>}{hint && <span className="panel-hint">{hint}</span>}</div>
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}

/** Technologies of a stack group, each with its knowledge level. */
export function SkillItemsField({ value, onChange }: { value: SkillItem[]; onChange: (v: SkillItem[]) => void }) {
  const [name, setName] = useState('')
  const [level, setLevel] = useState<SkillItem['level']>('intermediate')
  const errors = useContext(ErrorsContext)

  function add() {
    const trimmed = name.trim()
    if (!trimmed || value.some((i) => i.name.toLowerCase() === trimmed.toLowerCase())) return
    onChange([...value, { name: trimmed, level }])
    setName('')
  }

  const update = (index: number, patch: Partial<SkillItem>) => onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  const move = (index: number, delta: number) => {
    const next = [...value]
    const [item] = next.splice(index, 1)
    next.splice(index + delta, 0, item)
    onChange(next)
  }

  return (
    <div className="f wide">
      <span className="f-head">Tecnologie e livello</span>
      <ul className="skill-editor">
        {value.map((item, i) => (
          <li key={i}>
            <input type="text" aria-label="Tecnologia" value={item.name} onChange={(e) => update(i, { name: e.target.value })} />
            <select aria-label={`Livello di ${item.name}`} value={item.level} onChange={(e) => update(i, { level: e.target.value as SkillItem['level'] })}>
              {SKILL_LEVELS.map((l) => <option key={l} value={l}>{skillLevel(l, 'it').label}</option>)}
            </select>
            <span className="skill-steps" aria-hidden="true">
              {[1, 2, 3, 4].map((n) => <span key={n} style={n <= skillLevel(item.level, 'it').steps ? { background: skillLevel(item.level, 'it').color } : undefined} />)}
            </span>
            <span className="skill-editor-actions">
              <button type="button" aria-label="Sposta su" disabled={i === 0} onClick={() => move(i, -1)}><Icon name="up" size={15} /></button>
              <button type="button" aria-label="Sposta giù" disabled={i === value.length - 1} onClick={() => move(i, 1)}><Icon name="down" size={15} /></button>
              <button type="button" aria-label={`Rimuovi ${item.name}`} onClick={() => onChange(value.filter((_, j) => j !== i))}><Icon name="x" size={15} /></button>
            </span>
            {errors[`items.${i}.name`] && <span className="f-error">{errors[`items.${i}.name`][0]}</span>}
          </li>
        ))}
        <li className="skill-editor-new">
          <input type="text" aria-label="Nuova tecnologia" placeholder="Nuova tecnologia" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }} />
          <select aria-label="Livello della nuova tecnologia" value={level} onChange={(e) => setLevel(e.target.value as SkillItem['level'])}>
            {SKILL_LEVELS.map((l) => <option key={l} value={l}>{skillLevel(l, 'it').label}</option>)}
          </select>
          <button type="button" className="btn btn-ghost" onClick={add} disabled={!name.trim()}><Icon name="plus" size={15} />Aggiungi</button>
        </li>
      </ul>
      <span className="hint">La prima tecnologia di ogni gruppo compare nel codice della hero. Tutte finiscono nella fascia che scorre.</span>
    </div>
  )
}
