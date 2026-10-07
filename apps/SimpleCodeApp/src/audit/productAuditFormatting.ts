export type ProductAuditChange = {
  field: string
  label: string
  oldValue: string
  newValue: string
}

export type ProductAuditEntry = {
  id: string
  action: string
  changedBy: string
  changedOn: string
  changes: ProductAuditChange[]
}

const productFieldLabels: Record<string, string> = {
  ownerid: 'Owner',
  practmp_description: 'Description',
  practmp_productname: 'Product name',
  statecode: 'Status',
  statuscode: 'Status reason',
}

const formattedValueSuffix = '@OData.Community.Display.V1.FormattedValue'

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function fieldName(key: string): string {
  const normalized = key.startsWith('_') && key.endsWith('_value')
    ? key.slice(1, -6)
    : key
  return productFieldLabels[normalized]
    ?? normalized.replace(/^practmp_/, '').replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase())
}

function displayValue(record: Record<string, unknown>, key: string): string {
  const formatted = record[`${key}${formattedValueSuffix}`]
  if (formatted !== undefined && formatted !== null && formatted !== '') return String(formatted)
  const value = record[key]
  if (value === undefined || value === null || value === '') return 'Blank'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function parseAuditChanges(response: unknown): ProductAuditChange[] {
  const detail = asRecord(asRecord(response).AuditDetail)
  const oldValue = asRecord(detail.OldValue)
  const newValue = asRecord(detail.NewValue)
  const keys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)])

  return [...keys]
    .filter(key => !key.startsWith('@') && !key.includes('@') && key !== 'practmp_product1id')
    .map(key => ({
      field: key,
      label: fieldName(key),
      oldValue: displayValue(oldValue, key),
      newValue: displayValue(newValue, key),
    }))
    .filter(change => change.oldValue !== change.newValue)
}

export function auditAccessMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? '')
  if (/privilege|permission|access|authorized/i.test(message)) {
    return 'Audit history is unavailable for your role. Ask an administrator for the View Audit History and View Audit Summary privileges.'
  }
  return message || 'Audit history could not be loaded. Try again.'
}
