export type Entity = 'products' | 'locations' | 'relationships'
export type Action = 'read' | 'create' | 'write' | 'delete' | 'append' | 'appendTo'
export type Permissions = Record<Entity, Record<Action, boolean>>
export const deniedPermissions = (): Permissions => Object.fromEntries(
  ['products', 'locations', 'relationships'].map(entity => [entity,
    { read: false, create: false, write: false, delete: false, append: false, appendTo: false }]),
) as Permissions

type Privilege = { PrivilegeId: string; PrivilegeType: number | string }
const types: Record<Action, number> = { create: 1, read: 2, write: 3, delete: 4, append: 7, appendTo: 8 }
const typeNames: Record<Action, string> = { create: 'Create', read: 'Read', write: 'Write', delete: 'Delete', append: 'Append', appendTo: 'AppendTo' }
const normalize = (id: string) => id.replace(/[{}]/g, '').toLowerCase()

export function resolvePermissions(metadata: Record<Entity, Privilege[]>, userPrivileges: unknown): Permissions {
  if (!Array.isArray(userPrivileges) || userPrivileges.some(p => !p || typeof p.PrivilegeId !== 'string')) {
    throw new Error('Dataverse returned an invalid permission response.')
  }
  // Presence means a granted privilege, including Basic (depth 0).
  // Record-level access is still checked by Dataverse when an operation runs.
  const granted = new Set(userPrivileges.map(p => normalize(p.PrivilegeId)))
  const result = deniedPermissions()
  for (const entity of Object.keys(result) as Entity[]) {
    for (const action of Object.keys(types) as Action[]) {
      // The Power Apps host can return enum names despite the SDK's numeric typing.
      result[entity][action] = metadata[entity].some(p =>
        (p.PrivilegeType === types[action] || p.PrivilegeType === typeNames[action])
        && granted.has(normalize(p.PrivilegeId)))
    }
  }
  return result
}

export function can(permissions: Permissions, entity: Entity, action: Action): boolean {
  if (!permissions[entity].read || !permissions[entity][action]) return false
  if (entity === 'relationships' && (action === 'create' || action === 'write')) {
    return permissions.relationships.append && permissions.products.read && permissions.locations.read
      && permissions.products.appendTo && permissions.locations.appendTo
  }
  return true
}

export function requireSuccess<T>(result: { success: boolean; data: T; error?: unknown }): T {
  if (!result.success) {
    const error = result.error
    throw new Error(error && typeof error === 'object' && 'message' in error
      ? String(error.message) : 'Dataverse rejected the operation. Check your permissions and try again.')
  }
  return result.data
}
