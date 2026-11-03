import { useEffect, useState } from 'react'
import { Icon } from '../components/Icon'
import type { Message } from '../types'
import { useAdminApi, useToast } from './context'

const when = (iso: string) => new Date(iso).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export function MessagesSection({ onChange }: { onChange: () => void }) {
  const call = useAdminApi()
  const notify = useToast()
  const [messages, setMessages] = useState<Message[] | null>(null)
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    call<Message[]>('/api/admin/messages').then((list) => {
      setMessages(list)
      setSelected(list[0]?.id ?? null)
    }).catch((e) => notify(e.message, true))
  }, [call, notify])

  const current = messages?.find((m) => m.id === selected) ?? null

  // Opening a message marks it as read.
  useEffect(() => {
    if (!current || current.read_at) return
    call<Message>(`/api/admin/messages/${current.id}/read`, { method: 'PUT' })
      .then((updated) => {
        setMessages((list) => list?.map((m) => (m.id === updated.id ? updated : m)) ?? null)
        onChange()
      })
      .catch(() => {})
  }, [current, call, onChange])

  async function remove() {
    if (!current || !window.confirm(`Eliminare il messaggio di ${current.name}?`)) return
    try {
      await call(`/api/admin/messages/${current.id}`, { method: 'DELETE' })
      const rest = (messages ?? []).filter((m) => m.id !== current.id)
      setMessages(rest)
      setSelected(rest[0]?.id ?? null)
      onChange()
      notify('Messaggio eliminato')
    } catch (err) {
      notify(err instanceof Error ? err.message : String(err), true)
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow" style={{ fontSize: 12 }}>// contatti</span>
          <h1>Messaggi</h1>
          <p>I messaggi arrivati dal modulo contatti. Se è configurata l'email, ne ricevi anche una copia.</p>
        </div>
      </div>
      {messages === null ? (
        <p className="dim">Caricamento…</p>
      ) : messages.length === 0 ? (
        <div className="empty">
          <span className="icon-tile tone-violet" style={{ borderRadius: '50%' }}><Icon name="mail" /></span>
          <strong style={{ color: 'var(--text)' }}>Nessun messaggio</strong>
          <span className="small">Quando qualcuno ti scrive dal sito, lo trovi qui.</span>
        </div>
      ) : (
        <div className="split">
          <div className="split-list">
            {messages.map((m) => (
              <div key={m.id} className={`item${m.id === selected ? ' active' : ''}`}>
                <button type="button" className="item-main" aria-pressed={m.id === selected} onClick={() => setSelected(m.id)}>
                  <strong style={{ display: 'flex', width: '100%', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text)', fontSize: 15 }}>
                      {!m.read_at && <span aria-label="Non letto" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />}
                      {m.name}
                    </span>
                    <span className="mono" style={{ fontSize: 12 }}>{new Date(m.created_at).toLocaleDateString('it-IT')}</span>
                  </strong>
                  <span>{m.body}</span>
                </button>
              </div>
            ))}
          </div>
          {current && (
            <article className="panel split-edit">
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '8px 16px', paddingBottom: 16, borderBottom: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 600, fontSize: 17 }}>{current.name}</span>
                  <span className="mono dim" style={{ fontSize: 13 }}>{current.email}</span>
                </div>
                <span className="mono dim" style={{ fontSize: 13 }}>{when(current.created_at)} · {current.locale.toUpperCase()}</span>
              </div>
              <p className="msg-body">{current.body}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, paddingTop: 8 }}>
                <a className="btn btn-primary" href={`mailto:${encodeURIComponent(current.email)}?subject=${encodeURIComponent('Re: il tuo messaggio dal portfolio')}`}><Icon name="mail" size={16} />Rispondi via email</a>
                <button type="button" className="btn btn-danger" onClick={remove}><Icon name="trash" size={16} />Elimina</button>
              </div>
            </article>
          )}
        </div>
      )}
    </>
  )
}
