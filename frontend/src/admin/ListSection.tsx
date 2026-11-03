import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Icon } from '../components/Icon'
import { ApiError } from '../lib/api'
import { ErrorsContext, ReviewContext, useAdminApi, useToast } from './context'
import type { ListConfig } from './lists'
import { savedMessage } from './messages'

type Review = { auto_translated?: string[]; approved?: string[]; translation_warning?: string | null }
type Item = Review & { id?: number; visible?: boolean }

export function ListSection<T extends Item>({ config }: { config: ListConfig<T> }) {
  const call = useAdminApi()
  const notify = useToast()
  const [items, setItems] = useState<T[] | null>(null)
  const [selected, setSelected] = useState<number | 'new' | null>(null)
  const [draft, setDraft] = useState<T>(config.blank)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [busy, setBusy] = useState(false)

  const editor = useRef<HTMLFormElement>(null)

  // On a phone the form sits below the list: bring it into view on a tap.
  const reveal = () => {
    if (window.matchMedia('(max-width: 760px)').matches) {
      requestAnimationFrame(() => editor.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    }
  }

  const select = useCallback((item: T | 'new') => {
    setErrors({})
    if (item === 'new') {
      setSelected('new')
      setDraft(config.blank())
    } else {
      setSelected(item.id!)
      setDraft(structuredClone(item))
    }
  }, [config])

  // Load the list once per section: later renders must not reset the selection.
  const loaded = useRef(false)
  useEffect(() => {
    if (loaded.current) return
    loaded.current = true
    call<T[]>(config.endpoint).then((list) => {
      setItems(list)
      if (list.length) select(list[0])
      else select('new')
    }).catch((e) => notify(e.message, true))
  }, [call, config.endpoint, notify, select])

  const set = useCallback(<K extends keyof T>(key: K, value: T[K]) => setDraft((d) => ({ ...d, [key]: value })), [])
  const review = useMemo(() => ({
    pending: draft.auto_translated ?? [],
    approve: (path: string) => setDraft((d) => ({
      ...d,
      auto_translated: (d.auto_translated ?? []).filter((p) => p !== path),
      approved: [...new Set([...(d.approved ?? []), path])],
    })),
  }), [draft.auto_translated])

  async function save(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErrors({})
    try {
      const isNew = selected === 'new'
      const { translation_warning: warning, ...saved } = await call<T & Review>(isNew ? config.endpoint : `${config.endpoint}/${selected}`, { method: isNew ? 'POST' : 'PUT', json: draft })
      const item = saved as T
      setItems((list) => (isNew ? [...(list ?? []), item] : (list ?? []).map((x) => (x.id === item.id ? item : x))))
      select(item)
      notify(savedMessage(isNew, warning, (draft.auto_translated ?? []).length, (saved.auto_translated ?? []).length), !!warning)
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.errors)
      notify(err instanceof Error ? err.message : String(err), true)
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (selected === 'new' || selected === null) return
    if (!window.confirm(`Eliminare "${config.itemTitle(draft)}"? L'operazione non si può annullare.`)) return
    try {
      await call(`${config.endpoint}/${selected}`, { method: 'DELETE' })
      const rest = (items ?? []).filter((x) => x.id !== selected)
      setItems(rest)
      if (rest.length) select(rest[0])
      else select('new')
      notify('Voce eliminata')
    } catch (err) {
      notify(err instanceof Error ? err.message : String(err), true)
    }
  }

  async function move(index: number, delta: number) {
    if (!items) return
    const next = [...items]
    const [moved] = next.splice(index, 1)
    next.splice(index + delta, 0, moved)
    setItems(next)
    try {
      setItems(await call<T[]>(`${config.endpoint}/reorder`, { method: 'PUT', json: { ids: next.map((x) => x.id) } }))
    } catch (err) {
      setItems(items)
      notify(err instanceof Error ? err.message : String(err), true)
    }
  }

  const Form = config.Form

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow" style={{ fontSize: 12 }}>{config.path}</span>
          <h1>{config.title}</h1>
          <p>{config.description}</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => { select('new'); reveal() }}><Icon name="plus" size={16} strokeWidth={2.4} />{config.addLabel}</button>
      </div>

      {items === null ? (
        <p className="dim">Caricamento…</p>
      ) : (
        <div className="split">
          <div className="split-list">
            {items.length === 0 ? (
              <div className="empty">
                <span className="icon-tile tone-violet" style={{ borderRadius: '50%' }}><Icon name="plus" /></span>
                <strong style={{ color: 'var(--text)' }}>{config.emptyText}</strong>
                <span className="small">Compila il modulo qui accanto per aggiungerne una.</span>
              </div>
            ) : (
              items.map((item, i) => (
                <div key={item.id} className={`item${item.id === selected ? ' active' : ''}`}>
                  <button type="button" className="item-main" aria-pressed={item.id === selected} onClick={() => { select(item); reveal() }}>
                    <strong>{config.itemTitle(item)} {config.itemBadge?.(item)}</strong>
                    <span>{config.itemSub(item)}</span>
                    {(item.auto_translated ?? []).length > 0 && <span className="review-badge" style={{ marginTop: 6 }}>EN da controllare · {item.auto_translated!.length}</span>}
                  </button>
                  <span className={`state-pill ${item.visible ? 'on' : 'off'}`}>{item.visible ? 'visibile' : 'nascosto'}</span>
                  <div className="item-order">
                    <button type="button" aria-label="Sposta su" disabled={i === 0} onClick={() => move(i, -1)}><Icon name="up" size={16} /></button>
                    <button type="button" aria-label="Sposta giù" disabled={i === items.length - 1} onClick={() => move(i, 1)}><Icon name="down" size={16} /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          <form ref={editor} className="panel split-edit" onSubmit={save} noValidate>
            <div>
              <span className="side-label" style={{ padding: 0 }}>{selected === 'new' ? 'NUOVA VOCE' : 'MODIFICA'}</span>
              <h2 style={{ fontSize: 20 }}>{selected === 'new' ? config.addLabel : config.itemTitle(draft)}</h2>
            </div>
            {(draft.approved ?? []).length > 0 && (draft.auto_translated ?? []).length === 0 && (
              <span className="hint">Traduzioni approvate: salva per confermarle.</span>
            )}
            <ErrorsContext.Provider value={errors}>
              <ReviewContext.Provider value={review}>
                <Form value={draft} set={set} />
              </ReviewContext.Provider>
            </ErrorsContext.Provider>
            <div className="form-actions">
              {selected !== 'new' ? (
                <button type="button" className="btn btn-danger" onClick={remove}><Icon name="trash" size={16} />Elimina</button>
              ) : <span />}
              <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Salvataggio…' : selected === 'new' ? 'Aggiungi' : 'Salva modifiche'}</button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
