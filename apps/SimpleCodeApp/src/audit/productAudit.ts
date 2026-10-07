import { Auditsaction, Auditsoperation } from '../generated/models/AuditsModel.ts'
import type { Audits } from '../generated/models/AuditsModel.ts'
import { AuditsService } from '../generated/services/AuditsService.ts'
import { RetrieveAuditDetailsService } from '../generated/services/RetrieveAuditDetailsService.ts'
import { SystemusersService } from '../generated/services/SystemusersService.ts'
import { requireSuccess } from '../security/permissions.ts'
import { parseAuditChanges } from './productAuditFormatting.ts'
import type { ProductAuditEntry } from './productAuditFormatting.ts'

function actionLabel(audit: Audits): string {
  return audit.actionname
    ?? Auditsaction[audit.action]
    ?? audit.operationname
    ?? Auditsoperation[audit.operation]
    ?? 'Change'
}

async function loadUserNames(audits: Audits[]): Promise<Map<string, string>> {
  const ids = [...new Set(audits.map(audit => audit._userid_value ?? audit._callinguserid_value).filter((id): id is string => Boolean(id)))]
  const results = await Promise.all(ids.map(id => SystemusersService.get(id, { select: ['fullname'] })))
  return new Map(results.flatMap((result, index) => result.success && result.data.fullname
    ? [[ids[index], result.data.fullname] as [string, string]]
    : []))
}

async function loadDetails(audits: Audits[], userNames: Map<string, string>): Promise<ProductAuditEntry[]> {
  const entries: ProductAuditEntry[] = []
  const batchSize = 5
  for (let index = 0; index < audits.length; index += batchSize) {
    const batch = audits.slice(index, index + batchSize)
    const details = await Promise.all(batch.map(audit => RetrieveAuditDetailsService.RetrieveAuditDetails(audit.auditid)))
    const detailData = details.map(detail => requireSuccess(detail))
    entries.push(...batch.map((audit, batchIndex) => ({
      id: audit.auditid,
      action: actionLabel(audit),
      changedBy: audit.useridname
        || userNames.get(audit._userid_value ?? audit._callinguserid_value ?? '')
        || audit.callinguseridname
        || 'Unknown user',
      changedOn: audit.createdon,
      changes: parseAuditChanges(detailData[batchIndex]),
    })))
  }
  return entries
}

export async function loadProductAudit(productId: string): Promise<ProductAuditEntry[]> {
  const result = requireSuccess(await AuditsService.getAll({
    filter: `_objectid_value eq ${productId} and objecttypecode eq 'practmp_product1'`,
    orderBy: ['createdon desc'],
    top: 50,
  }))
  const userNames = await loadUserNames(result)
  return loadDetails(result, userNames)
}
