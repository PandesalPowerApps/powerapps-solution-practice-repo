import { deniedPermissions } from './permissions.ts'
import type { Action, Entity, Permissions } from './permissions.ts'

export const simulationRoles = {
  actual: 'My actual permissions',
  admin: 'Admin',
  productManager: 'Product Manager',
  locationManager: 'Location Manager',
  combinedManagers: 'Product + Location Managers',
  readOnly: 'Read-only',
  noAccess: 'No access',
} as const
export type SimulationRole = keyof typeof simulationRoles

// Presets mirror the exported solution roles. Intersect with actual grants so
// simulation can only restrict access, even when used by a non-admin account.
export function simulatePermissions(actual: Permissions, role: SimulationRole, enabled: boolean): Permissions {
  if (!enabled || role === 'actual') return actual
  const result = deniedPermissions()
  for (const entity of Object.keys(result) as Entity[]) {
    const manage = role === 'admin'
      || (entity === 'products' && (role === 'productManager' || role === 'combinedManagers'))
      || (entity === 'locations' && (role === 'locationManager' || role === 'combinedManagers'))
    for (const action of Object.keys(result[entity]) as Action[]) {
      result[entity][action] = actual[entity][action] && role !== 'noAccess' && (action === 'read' || manage)
    }
  }
  return result
}
