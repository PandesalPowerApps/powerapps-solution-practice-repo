import { WhoAmIService } from '../generated/services/WhoAmIService'
import { RetrieveUserPrivilegesService } from '../generated/services/RetrieveUserPrivilegesService'
import { Practmp_product1sService } from '../generated/services/Practmp_product1sService'
import { Practmp_locationsService } from '../generated/services/Practmp_locationsService'
import { Practmp_productlocationjoinsService } from '../generated/services/Practmp_productlocationjoinsService'
import { requireSuccess, resolvePermissions } from './permissions'

export async function loadPermissions() {
  const identity = requireSuccess(await WhoAmIService.WhoAmI())
  if (typeof identity?.UserId !== 'string') throw new Error('Could not identify the signed-in Dataverse user.')
  const privileges = requireSuccess(await RetrieveUserPrivilegesService.RetrieveUserPrivileges(identity.UserId))
  const results = await Promise.all([
    Practmp_product1sService.getMetadata({ metadata: ['Privileges'] }),
    Practmp_locationsService.getMetadata({ metadata: ['Privileges'] }),
    Practmp_productlocationjoinsService.getMetadata({ metadata: ['Privileges'] }),
  ])
  const metadata = results.map(result => {
    const data = requireSuccess(result)
    if (!Array.isArray(data?.Privileges)) throw new Error('Could not load table permissions. Try refreshing.')
    return data.Privileges
  })
  return resolvePermissions({ products: metadata[0], locations: metadata[1], relationships: metadata[2] }, privileges.RolePrivileges)
}
