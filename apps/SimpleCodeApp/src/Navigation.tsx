import { useEffect, useState } from 'react'
import { getContext } from '@microsoft/power-apps/app'
import type { Entity, Permissions } from './security/permissions'
import { accessSummary, pageAccess } from './security/accessSummary'

export default function Navigation({ permissions, status, entity, busy, appMode, onNavigate }: {
  permissions: Permissions
  status: 'checking' | 'ready' | 'error'
  entity: Entity
  busy: boolean
  appMode: string | null | undefined
  onNavigate: (entity: Entity) => void
}) {
  const [user, setUser] = useState<{ name: string; email?: string }>({ name: 'Loading user…' })
  useEffect(() => {
    let active = true
    void getContext().then(({ user }) => {
      if (active) setUser({ name: user.fullName || user.userPrincipalName || 'Signed-in user', email: user.userPrincipalName })
    }).catch(() => { if (active) setUser({ name: 'User details unavailable' }) })
    return () => { active = false }
  }, [])

  return <>
    <section className="user-panel" aria-label="Signed-in user">
      <small>Signed in as</small><strong>{user.name}</strong>
      {user.email && user.email !== user.name && <span>{user.email}</span>}
      <small>App access</small>
      <span aria-live="polite">{status === 'checking' ? 'Checking permissions…' : status === 'error' ? 'Permissions unavailable' : accessSummary(permissions)}</span>
      {appMode !== undefined && appMode !== 'production' && <>
        <small>App Mode</small>
        <span aria-live="polite">{appMode === null ? 'Unavailable' : appMode === '' ? 'Not configured' : appMode === 'uat' ? 'UAT' : appMode[0].toUpperCase() + appMode.slice(1)}</span>
      </>}
    </section>
    <nav aria-label="Main navigation">{(['products', 'locations', 'relationships'] as Entity[]).map(item => {
      const access = status === 'checking' ? 'Checking…' : status === 'error' ? 'Access unknown' : pageAccess(permissions, item)
      const unavailable = status !== 'ready' || !permissions[item].read
      return <button key={item} className={`${entity === item && !unavailable ? 'active' : ''} ${unavailable ? 'nav-unavailable' : ''}`} aria-current={entity === item ? 'page' : undefined} aria-disabled={unavailable || busy} onClick={() => { if (!unavailable && !busy) onNavigate(item) }} title={unavailable ? `${item}: ${access}` : undefined}>
        <span className="nav-label">{item[0].toUpperCase() + item.slice(1)}</span>
        <span className="nav-access">{unavailable && status === 'ready' && <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>}{access}</span>
      </button>
    })}</nav>
  </>
}
