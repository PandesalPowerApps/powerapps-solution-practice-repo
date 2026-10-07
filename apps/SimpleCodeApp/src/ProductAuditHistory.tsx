import { useEffect, useState } from 'react'
import { loadProductAudit } from './audit/productAudit'
import { auditAccessMessage } from './audit/productAuditFormatting'
import type { ProductAuditEntry } from './audit/productAuditFormatting'

export default function ProductAuditHistory({ productId }: { productId: string }) {
  const [entries, setEntries] = useState<ProductAuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let active = true
    void loadProductAudit(productId).then(result => {
      if (active) setEntries(result)
    }).catch(reason => {
      if (active) {
        setEntries([])
        setError(auditAccessMessage(reason))
      }
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [productId, reload])

  const refresh = () => {
    setLoading(true)
    setError(null)
    setReload(value => value + 1)
  }

  return <section className="audit-section" aria-labelledby="audit-title">
    <div className="section-title audit-heading"><div><h2 id="audit-title">Change history</h2><p>Latest 50 audited events for this product</p></div>{!loading && <button className="text-button" onClick={refresh}>Refresh history</button>}</div>
    <div className="audit-card">
      {loading ? <div className="audit-loading" role="status">Loading change history…</div>
        : error ? <div className="audit-message" role="status"><strong>History unavailable</strong><p>{error}</p><button className="text-button" onClick={refresh}>Try again</button></div>
          : entries.length === 0 ? <div className="audit-message"><strong>No audited changes yet</strong><p>New changes can take a short time to appear.</p></div>
            : <ol className="audit-list">{entries.map(entry => <li key={entry.id} className="audit-event">
              <div className="audit-marker" aria-hidden="true" />
              <div className="audit-content"><div className="audit-meta"><strong>{entry.action}</strong><span>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(entry.changedOn))}</span></div><p className="audit-user">Changed by {entry.changedBy}</p>
                {entry.changes.length ? <div className="audit-changes">{entry.changes.map(change => <div className="audit-change" key={change.field}><strong>{change.label}</strong><span className="audit-old">{change.oldValue}</span><span aria-hidden="true">→</span><span className="audit-new">{change.newValue}</span></div>)}</div>
                  : <p className="audit-no-details">No field-level values were returned for this event.</p>}
              </div>
            </li>)}</ol>}
    </div>
  </section>
}
