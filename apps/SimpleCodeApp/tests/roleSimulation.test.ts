import assert from 'node:assert/strict'
import { test } from 'node:test'
import { can, deniedPermissions } from '../src/security/permissions.ts'
import type { Action, Entity } from '../src/security/permissions.ts'
import { simulatePermissions, simulationRoles } from '../src/security/roleSimulation.ts'

const full = deniedPermissions()
for (const entity of Object.keys(full) as Entity[]) {
  for (const action of Object.keys(full[entity]) as Action[]) full[entity][action] = true
}

test('simulation matches each role across all pages and mutation actions', () => {
  const managed = {
    actual: ['products', 'locations', 'relationships'],
    admin: ['products', 'locations', 'relationships'],
    productManager: ['products'], locationManager: ['locations'],
    combinedManagers: ['products', 'locations'], readOnly: [], noAccess: [],
  }
  for (const role of Object.keys(simulationRoles) as (keyof typeof simulationRoles)[]) {
    const permissions = simulatePermissions(full, role, true)
    for (const entity of Object.keys(full) as Entity[]) {
      assert.equal(can(permissions, entity, 'read'), role !== 'noAccess', `${role}: ${entity} read`)
      for (const action of ['create', 'write', 'delete'] as const) {
        assert.equal(can(permissions, entity, action), managed[role].includes(entity), `${role}: ${entity} ${action}`)
      }
    }
  }
})

test('simulation cannot elevate actual access or bypass relationship prerequisites', () => {
  for (const role of Object.keys(simulationRoles) as (keyof typeof simulationRoles)[]) {
    assert.deepEqual(simulatePermissions(deniedPermissions(), role, true), deniedPermissions())
  }
  const restricted = structuredClone(full)
  restricted.products.appendTo = false
  restricted.locations.delete = false
  const result = simulatePermissions(restricted, 'admin', true)
  assert.equal(can(result, 'relationships', 'create'), false)
  assert.equal(can(result, 'locations', 'delete'), false)
  assert.deepEqual(restricted, result)
})

test('disabled simulation and returning to actual permissions restore original grants', () => {
  assert.deepEqual(simulatePermissions(full, 'noAccess', false), full)
  simulatePermissions(full, 'noAccess', true)
  assert.equal(can(simulatePermissions(full, 'actual', true), 'relationships', 'write'), true)
})
