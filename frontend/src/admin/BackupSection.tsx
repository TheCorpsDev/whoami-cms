import { useEffect, useState, type ChangeEvent } from 'react'
import { Icon } from '../components/Icon'
import { useAdminApi, useToast } from './context'
import { Panel } from './fields'

type Info = { size: number; modified_at: string | null }

export function BackupSection() {
  const call = useAdminApi()
  const notify = useToast()
  const [info, setInfo] = useState<Info | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    call<Info>('/api/admin/backup').then(setInfo).catch(() => {})
  }, [call])

  async function restore(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!window.confirm(`Ripristinare "${file.name}"? Tutti i contenuti attuali verranno sostituiti da quelli del backup.`)) return
    const body = new FormData()
    body.append('backup', file)
    setBusy(true)
    try {
      await call('/api/admin/backup/restore', { method: 'POST', body })
      notify('Database ripristinato: ricarico la pagina')
      window.setTimeout(() => window.location.reload(), 1200)
    } catch (err) {
      notify(err instanceof Error ? err.message : String(err), true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow" style={{ fontSize: 12 }}>// backup</span>
          <h1>Backup</h1>
          <p>Scarica o ripristina il database con tutti i contenuti del portfolio.</p>
        </div>
      </div>

      <Panel title="Scarica una copia" hint="Un file .sqlite con profilo, esperienze, progetti, formazione, certificazioni, competenze e messaggi.">
        <div className="mono dim" style={{ fontSize: 13, display: 'flex', flexWrap: 'wrap', gap: '6px 24px' }}>
          <span>portfolio.sqlite</span>
          {info && <span>{(info.size / 1024).toFixed(0)} KB</span>}
          {info?.modified_at && <span>ultima modifica {new Date(info.modified_at).toLocaleString('it-IT')}</span>}
        </div>
        <a className="btn btn-primary" href="/api/admin/backup/download" style={{ alignSelf: 'flex-start' }}><Icon name="download" size={16} />Scarica backup</a>
        <span className="panel-hint">Foto e CV non sono nel backup: restano nel volume del server.</span>
      </Panel>

      <Panel title="Ripristina" hint="Sostituisce tutti i contenuti con quelli del file. Prima viene salvata una copia del database attuale sul server.">
        <label className="btn btn-danger file-btn" style={{ alignSelf: 'flex-start' }} aria-disabled={busy}>
          <Icon name="database" size={16} />{busy ? 'Ripristino…' : 'Carica un backup .sqlite'}
          <input type="file" accept=".sqlite,.db,application/vnd.sqlite3,application/octet-stream" onChange={restore} disabled={busy} />
        </label>
      </Panel>
    </>
  )
}
