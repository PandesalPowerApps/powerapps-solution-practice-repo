import { can } from './permissions'
import type { Entity, Permissions } from './permissions'

export function pageAccess(permissions: Permissions, entity: Entity) {
  if (!can(permissions, entity, 'read')) return 'No access'
  if (['create', 'write', 'delete'].some(action => can(permissions, entity, action as 'create' | 'write' | 'delete'))) return 'Can manage'
  return 'Read only'
}

export function accessSummary(permissions: Permissions) {
  const entities: Entity[] = ['products', 'locations', 'relationships']
  const managed = entities.filter(entity => pageAccess(permissions, entity) === 'Can manage')
  if (managed.length === 3) return 'Can manage all pages'
  if (managed.length) return `Can manage ${managed.join(' and ')}`
  return entities.some(entity => permissions[entity].read) ? 'Read-only access' : 'No page access'
}
