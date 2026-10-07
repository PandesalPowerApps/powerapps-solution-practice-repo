import assert from 'node:assert/strict'
import { test } from 'node:test'
import { can, deniedPermissions, requireSuccess, resolvePermissions } from '../src/security/permissions.ts'

const tables = ['products', 'locations', 'relationships'] as const
const metadata = Object.fromEntries(tables.map(table => [table,
  [1, 2, 3, 4, 7, 8].map(type => ({ PrivilegeId: `${table}-${type}`, PrivilegeType: type })),
])) as Parameters<typeof resolvePermissions>[0]
const grants = (full: readonly string[]) => tables.flatMap(table =>
  (full.includes(table) ? [1, 2, 3, 4, 7, 8] : [2]).map(type => ({ PrivilegeId: `${table}-${type}`, Depth: 3 })))

test('exported role policies: managers edit their table; only Admin changes relationships', () => {
  for (const full of [['products'], ['locations'], [...tables]]) {
    const permissions = resolvePermissions(metadata, grants(full))
    for (const table of tables) {
      assert.equal(can(permissions, table, 'read'), true)
      for (const action of ['create', 'write', 'delete'] as const) {
        assert.equal(can(permissions, table, action), full.includes(table))
      }
    }
  }
})

test('combined manager grants do not grant relationship writes', () => {
  const permissions = resolvePermissions(metadata, [...grants(['products']), ...grants(['locations'])])
  assert.equal(can(permissions, 'products', 'write'), true)
  assert.equal(can(permissions, 'locations', 'write'), true)
  assert.equal(can(permissions, 'relationships', 'create'), false)
})

test('Power Apps runtime enum names resolve the same grants as numeric metadata', () => {
  const names: Record<number, string> = { 1: 'Create', 2: 'Read', 3: 'Write', 4: 'Delete', 7: 'Append', 8: 'AppendTo' }
  const runtimeMetadata = Object.fromEntries(tables.map(table => [table,
    metadata[table].map(p => ({ ...p, PrivilegeType: names[Number(p.PrivilegeType)] })),
  ])) as Parameters<typeof resolvePermissions>[0]
  for (const full of [[], ['locations'], ['products'], [...tables]]) {
    assert.deepEqual(resolvePermissions(runtimeMetadata, grants(full)), resolvePermissions(metadata, grants(full)))
  }
  assert.deepEqual(resolvePermissions(runtimeMetadata, []), deniedPermissions())
  const unknown = { products: [{ PrivilegeId: 'products-2', PrivilegeType: 'Unknown' }], locations: [], relationships: [] }
  assert.deepEqual(resolvePermissions(unknown, grants(tables)), deniedPermissions())
})

test('relationship saves require Append and both Append To privileges', () => {
  for (const missing of ['relationships-7', 'products-8', 'locations-8']) {
    const permissions = resolvePermissions(metadata, grants(tables).filter(p => p.PrivilegeId !== missing))
    assert.equal(can(permissions, 'relationships', 'create'), false)
    assert.equal(can(permissions, 'relationships', 'write'), false)
    assert.equal(can(permissions, 'relationships', 'delete'), true)
  }
})

test('missing access fails closed; Basic grants and GUID casing are handled', () => {
  assert.equal(can(deniedPermissions(), 'products', 'create'), false)
  assert.equal(can(resolvePermissions(metadata, []), 'products', 'read'), false)
  assert.throws(() => resolvePermissions(metadata, undefined))
  const permissions = resolvePermissions(metadata, [{ PrivilegeId: '{PRODUCTS-2}', Depth: 0 }])
  assert.equal(can(permissions, 'products', 'read'), true)
  assert.equal(can(permissions, 'products', 'write'), false)
})

test('failed Dataverse results cannot be treated as successful saves', () => {
  assert.throws(() => requireSuccess({ success: false, data: null, error: { message: 'Access denied' } }), /Access denied/)
  assert.deepEqual(requireSuccess({ success: true, data: { id: 'saved' } }), { id: 'saved' })
})
