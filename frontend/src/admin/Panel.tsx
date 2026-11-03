import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { api, ApiError } from '../lib/api'
import type { Message } from '../types'
import { BackupSection } from './BackupSection'
import { CallContext, type Call } from './context'
import { ListSection } from './ListSection'
import { LISTS } from './lists'
import { MessagesSection } from './MessagesSection'
import { ProfileSection } from './ProfileSection'
import { SITE } from '../site'

const SECTIONS = [
  { id: 'profilo', label: 'Profilo' },
  { id: 'esperienza', label: 'Esperienza' },
  { id: 'progetti', label: 'Progetti' },
  { id: 'formazione', label: 'Formazione' },
  { id: 'certificazioni', label: 'Certificazioni' },
  { id: 'competenze', label: 'Competenze' },
  { id: 'messaggi', label: 'Messaggi' },
  { id: 'backup', label: 'Backup' },
] as const

type SectionId = (typeof SECTIONS)[number]['id']

export default function Panel({ onLogout, onUnauthorized }: { onLogout: () => void; onUnauthorized: () => void }) {
  const params = useParams()
  const section = (SECTIONS.find((s) => s.id === params['*']?.split('/')[0])?.id ?? 'profilo') as SectionId
  const [unread, setUnread] = useState(0)

  const call = useCallback<Call>(
    async (path, init) => {
      try {
        return await api(path, init)
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) onUnauthorized()
        throw e
      }
    },
    [onUnauthorized],
  )

  const refreshUnread = useCallback(() => {
    call<Message[]>('/api/admin/messages')
      .then((list) => setUnread(list.filter((m) => !m.read_at).length))
      .catch(() => {})
  }, [call])

  useEffect(refreshUnread, [refreshUnread])

  // On a phone the section tabs scroll sideways: keep the active one visible.
  useEffect(() => {
    document.querySelector('.side-link[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [section])

  async function logout() {
    await api('/api/admin/logout', { method: 'POST' }).catch(() => {})
    onLogout()
  }

  return (
    <CallContext.Provider value={call}>
      <header className="admin-top">
        <div className="admin-top-inner">
          <span className="brand"><span className="monogram">{SITE.initials}</span><span>admin</span></span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <a className="btn btn-ghost" href="/" target="_blank" rel="noreferrer">Sito ↗</a>
            <button className="btn btn-ghost" type="button" onClick={logout} style={{ color: 'var(--muted)' }}><Icon name="logout" size={16} />Esci</button>
          </div>
        </div>
      </header>
      <div className="admin-body">
        <aside className="admin-side">
          <span className="side-label">CONTENUTI</span>
          <nav aria-label="Sezioni">
            {SECTIONS.map((s, i) => (
              <Link key={s.id} className="side-link" to={`/admin/${s.id}`} aria-current={s.id === section ? 'page' : undefined}>
                <span><span className="num">{String(i + 1).padStart(2, '0')}</span>{s.label}</span>
                {s.id === 'messaggi' && unread > 0 && <span className="count-badge hot" aria-label={`${unread} non letti`}>{unread}</span>}
              </Link>
            ))}
          </nav>
          <div className="panel" style={{ padding: 14, gap: 6, fontSize: 13, color: 'var(--dim)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />Sito online
            </span>
            <span>Le modifiche salvate sono subito visibili sul portfolio.</span>
          </div>
        </aside>
        <main className="admin-main" key={section}>
          {section === 'profilo' && <ProfileSection />}
          {section === 'esperienza' && <ListSection config={LISTS.experiences} />}
          {section === 'progetti' && <ListSection config={LISTS.projects} />}
          {section === 'formazione' && <ListSection config={LISTS.education} />}
          {section === 'certificazioni' && <ListSection config={LISTS.certifications} />}
          {section === 'competenze' && <ListSection config={LISTS.skillGroups} />}
          {section === 'messaggi' && <MessagesSection onChange={refreshUnread} />}
          {section === 'backup' && <BackupSection />}
        </main>
      </div>
    </CallContext.Provider>
  )
}
