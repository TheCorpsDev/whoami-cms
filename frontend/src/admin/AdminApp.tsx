import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Icon } from '../components/Icon'
import { api, ApiError } from '../lib/api'
import '../site/site.css'
import './admin.css'
import { AutoTranslateContext, ToastContext } from './context'
import Panel from './Panel'
import { SITE } from '../site'

type Toast = { text: string; error?: boolean } | null

function Login({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api('/api/admin/login', { method: 'POST', json: { password } })
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setPassword('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-wrap dots">
      <header className="admin-top-inner" style={{ maxWidth: 1200, width: '100%', margin: '0 auto' }}>
        <span className="brand"><span className="monogram">{SITE.initials}</span><span>admin</span></span>
        <a className="btn btn-ghost" href="/" style={{ minHeight: 40, fontSize: 14 }}>← Torna al sito</a>
      </header>
      <main style={{ flex: '1 1 auto', display: 'grid', placeItems: 'center', padding: '48px 24px 96px' }}>
        <div className="login-card fu">
          <div className="login-term"><span style={{ color: 'var(--accent)' }}>❯</span> sudo login admin<span className="caret" /></div>
          <form onSubmit={submit} style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14 }}>
              <span className="icon-tile tone-violet" style={{ width: 52, height: 52 }}><Icon name="lock" size={24} /></span>
              <div>
                <h1 style={{ margin: 0, fontSize: 28, letterSpacing: '-.02em' }}>Area riservata</h1>
                <p className="muted" style={{ margin: '6px 0 0', fontSize: 15 }}>Inserisci la password per gestire i contenuti del portfolio.</p>
              </div>
            </div>
            <label className="f">
              Password
              <span className="pw">
                <input type={show ? 'text' : 'password'} autoComplete="current-password" required autoFocus value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" aria-label={show ? 'Nascondi la password' : 'Mostra la password'} onClick={() => setShow(!show)}><Icon name={show ? 'eyeOff' : 'eye'} /></button>
              </span>
              {error && <span className="f-error" role="alert">{error}</span>}
            </label>
            <button className="btn btn-primary" type="submit" disabled={busy || !password} style={{ minHeight: 50 }}>
              {busy ? 'Verifica…' : 'Accedi'}<Icon name="arrowRight" />
            </button>
            <p className="dim" style={{ margin: 0, display: 'flex', gap: 10, fontSize: 13 }}>
              <Icon name="shield" size={16} />Dopo 5 tentativi errati l'accesso viene bloccato per 15 minuti.
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}

export default function AdminApp() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [autoTranslate, setAutoTranslate] = useState(false)
  const [toast, setToast] = useState<Toast>(null)

  useEffect(() => {
    // Keep the admin out of search engines even if the URL leaks.
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    document.title = 'Admin — Portfolio'
    return () => meta.remove()
  }, [])

  const check = useCallback(() => {
    api<{ authenticated: boolean; auto_translate?: boolean }>('/api/admin/me')
      .then((r) => {
        setAutoTranslate(!!r.auto_translate)
        setAuthed(r.authenticated)
      })
      .catch(() => setAuthed(false))
  }, [])

  useEffect(check, [check])

  // Stable on purpose: the panel's API helper depends on it, and a new function
  // on every render (e.g. when a toast appears) would reload the open section.
  const signOut = useCallback(() => setAuthed(false), [])

  const notify = useCallback((text: string, error = false) => {
    setToast({ text, error })
    window.setTimeout(() => setToast(null), 3000)
  }, [])

  // Any 401 (expired session) sends the admin back to the login form.
  useEffect(() => {
    const onRejection = (e: PromiseRejectionEvent) => {
      if (e.reason instanceof ApiError && e.reason.status === 401) setAuthed(false)
    }
    window.addEventListener('unhandledrejection', onRejection)
    return () => window.removeEventListener('unhandledrejection', onRejection)
  }, [])

  return (
    <ToastContext.Provider value={notify}>
      <AutoTranslateContext.Provider value={autoTranslate}>
      <div className="admin">
        {authed === null ? null : authed ? <Panel onLogout={signOut} onUnauthorized={signOut} /> : <Login onDone={check} />}
        {toast && (
          <div className={`toast${toast.error ? ' error' : ''}`} role="status">
            <span className="dot"><Icon name={toast.error ? 'x' : 'check'} size={13} strokeWidth={3} /></span>{toast.text}
          </div>
        )}
      </div>
      </AutoTranslateContext.Provider>
    </ToastContext.Provider>
  )
}
