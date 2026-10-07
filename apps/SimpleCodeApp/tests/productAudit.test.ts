import assert from 'node:assert/strict'
import { test } from 'node:test'
import { auditAccessMessage, parseAuditChanges } from '../src/audit/productAuditFormatting.ts'

test('parses changed product fields and prefers Dataverse formatted values', () => {
  const changes = parseAuditChanges({ AuditDetail: {
    OldValue: { practmp_productname: 'Old name', statecode: 0, 'statecode@OData.Community.Display.V1.FormattedValue': 'Active' },
    NewValue: { practmp_productname: 'New name', statecode: 1, 'statecode@OData.Community.Display.V1.FormattedValue': 'Inactive' },
  } })
  assert.deepEqual(changes, [
    { field: 'practmp_productname', label: 'Product name', oldValue: 'Old name', newValue: 'New name' },
    { field: 'statecode', label: 'Status', oldValue: 'Active', newValue: 'Inactive' },
  ])
})

test('represents created, cleared, and unchanged values correctly', () => {
  const changes = parseAuditChanges({ AuditDetail: {
    OldValue: { practmp_description: 'Previous', practmp_product1id: 'ignored-id' },
    NewValue: { practmp_description: null, practmp_product1id: 'ignored-id', practmp_productname: 'Created' },
  } })
  assert.deepEqual(changes, [
    { field: 'practmp_description', label: 'Description', oldValue: 'Previous', newValue: 'Blank' },
    { field: 'practmp_productname', label: 'Product name', oldValue: 'Blank', newValue: 'Created' },
  ])
})

test('turns Dataverse authorization failures into an actionable message', () => {
  assert.match(auditAccessMessage(new Error('Principal user is missing prvReadAuditSummary privilege')), /View Audit History/)
  assert.equal(auditAccessMessage(new Error('Network unavailable')), 'Network unavailable')
})
