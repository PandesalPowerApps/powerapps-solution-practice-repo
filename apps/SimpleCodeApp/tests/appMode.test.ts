import assert from 'node:assert/strict'
import { test } from 'node:test'
import { appModeSchemaName, loadSimulationEnabled } from '../src/security/appMode.ts'
import { deniedPermissions } from '../src/security/permissions.ts'
import { simulatePermissions } from '../src/security/roleSimulation.ts'

test('reads App Mode by schema name and enables only development', async () => {
  for (const value of ['development', ' Development ', 'DEVELOPMENT']) {
    assert.equal(await loadSimulationEnabled(async name => {
      assert.equal(name, appModeSchemaName)
      assert.equal(name, 'practmp_AppMode')
      return { success: true, data: { Value: value } }
    }), true)
  }
})

test('non-development modes disable simulation and preserve actual grants', async () => {
  const actual = deniedPermissions()
  actual.products.read = true
  for (const value of ['uat', 'production', 'UAT', ' Production ', '', 'dev', 'role-simulation', undefined, null, true, 1]) {
    const enabled = await loadSimulationEnabled(async () => ({ success: true, data: { Value: value } }))
    assert.equal(enabled, false, String(value))
    assert.deepEqual(simulatePermissions(actual, 'noAccess', enabled), actual)
  }
})

test('failed, empty, and rejected responses disable simulation', async () => {
  assert.equal(await loadSimulationEnabled(async () => ({ success: false, data: { Value: 'development' } })), false)
  assert.equal(await loadSimulationEnabled(async () => ({ success: true })), false)
  assert.equal(await loadSimulationEnabled(async () => ({ success: true, data: {} })), false)
  assert.equal(await loadSimulationEnabled(async () => { throw new Error('Access denied') }), false)
})
