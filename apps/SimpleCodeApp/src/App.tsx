import { useCallback, useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import './App.css'
import Navigation from './Navigation'
import ProductAuditHistory from './ProductAuditHistory'
import { Practmp_product1sService } from './generated/services/Practmp_product1sService'
import { Practmp_locationsService } from './generated/services/Practmp_locationsService'
import { Practmp_productlocationjoinsService } from './generated/services/Practmp_productlocationjoinsService'
import type { Practmp_product1s } from './generated/models/Practmp_product1sModel'
import type { Practmp_locations } from './generated/models/Practmp_locationsModel'
import type { Practmp_productlocationjoins } from './generated/models/Practmp_productlocationjoinsModel'

import { can, deniedPermissions, requireSuccess } from './security/permissions'
import type { Entity, Action } from './security/permissions'
import { loadPermissions } from './security/loadPermissions'
import { simulatePermissions, simulationRoles } from './security/roleSimulation'
import type { SimulationRole } from './security/roleSimulation'
import { loadAppMode } from './security/appMode'
import { RetrieveEnvironmentVariableValueService } from './generated/services/RetrieveEnvironmentVariableValueService'
type Page = 'list' | 'view' | 'create' | 'edit'
type Notice = { kind: 'success' | 'error'; text: string } | null

const entityLabels: Record<Entity, { singular: string; plural: string }> = {
  products: { singular: 'Product', plural: 'Products' },
  locations: { singular: 'Location', plural: 'Locations' },
  relationships: { singular: 'Relationship', plural: 'Relationships' },
}

const Icon = ({ name }: { name: 'box' | 'pin' | 'link' | 'plus' | 'edit' | 'trash' | 'arrow' | 'search' }) => {
  const paths = {
    box: <><path d="M4 7.5 12 3l8 4.5-8 4.5-8-4.5Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9M4 7.5V17l8 4 8-4V7.5"/></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    link: <><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/></>,
    arrow: <path d="m15 18-6-6 6-6"/>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  }
  return <svg className="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function App() {
  const [appMode, setAppMode] = useState<string | null | undefined>(undefined)
  const [simulationEnabled, setSimulationEnabled] = useState(false)
  const [simulationRole, setSimulationRole] = useState<SimulationRole>('actual')
  const [permissions, setPermissions] = useState(deniedPermissions)
  const [permissionStatus, setPermissionStatus] = useState<'checking' | 'ready' | 'error'>('checking')
  const allowed = (target: Entity, action: Action) => !loading && !saving && can(permissions, target, action)
  const guard = (target: Entity, action: Action) => {
    if (allowed(target, action)) return true
    setNotice({ kind: 'error', text: 'You do not have permission to perform this action.' })
    return false
  }
  const [entity, setEntity] = useState<Entity>('products')
  const [page, setPage] = useState<Page>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [products, setProducts] = useState<Practmp_product1s[]>([])
  const [locations, setLocations] = useState<Practmp_locations[]>([])
  const [relationships, setRelationships] = useState<Practmp_productlocationjoins[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState<Notice>(null)
  const [relationshipDefaults, setRelationshipDefaults] = useState<{ productId?: string; locationId?: string }>({})

  const loadData = useCallback(async () => {
    setLoading(true)
    setSimulationEnabled(false)
    setAppMode(undefined)
    setNotice(null)
    setPermissions(deniedPermissions())
    setPermissionStatus('checking')
    setProducts([]); setLocations([]); setRelationships([])
    try {
      const [actualAccess, currentMode] = await Promise.all([loadPermissions().catch(error => {
        setPermissionStatus('error')
        throw error
      }), loadAppMode(schemaName => RetrieveEnvironmentVariableValueService.RetrieveEnvironmentVariableValue(schemaName)).then(mode => {
        setAppMode(mode)
        return mode
      })])
      const enableSimulation = currentMode === 'development'
      setSimulationEnabled(enableSimulation)
      if (!enableSimulation) setSimulationRole('actual')
      const access = simulatePermissions(actualAccess, simulationRole, enableSimulation)
      setPermissionStatus('ready')
      setPermissions(access)
      const [productResult, locationResult, relationshipResult] = await Promise.all([
        access.products.read ? Practmp_product1sService.getAll({ top: 1000, orderBy: ['practmp_productname asc'] }) : Promise.resolve({ success: true, data: [], error: undefined }),
        access.locations.read ? Practmp_locationsService.getAll({ top: 1000, orderBy: ['practmp_locationname asc'] }) : Promise.resolve({ success: true, data: [], error: undefined }),
        access.relationships.read ? Practmp_productlocationjoinsService.getAll({ top: 1000, orderBy: ['practmp_productlocationjoin1 asc'] }) : Promise.resolve({ success: true, data: [], error: undefined }),
      ])
      if (!productResult.success) throw productResult.error ?? new Error('Could not load products.')
      if (!locationResult.success) throw locationResult.error ?? new Error('Could not load locations.')
      if (!relationshipResult.success) throw relationshipResult.error ?? new Error('Could not load relationships.')
      setProducts(productResult.data ?? [])
      setLocations(locationResult.data ?? [])
      setRelationships(relationshipResult.data ?? [])
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'The data could not be loaded.' })
    } finally {
      setLoading(false)
    }
  }, [simulationRole])

  useEffect(() => {
    // Loading Dataverse records is the external synchronization performed here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData()
  }, [loadData])

  const navigate = (nextEntity: Entity, nextPage: Page = 'list', id: string | null = null, defaults: { productId?: string; locationId?: string } = {}) => {
    if (!guard(nextEntity, nextPage === 'create' ? 'create' : nextPage === 'edit' ? 'write' : 'read')) return
    setEntity(nextEntity); setPage(nextPage); setSelectedId(id); setSearch(''); setNotice(null)
    setRelationshipDefaults(defaults)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const selectedProduct = products.find(item => item.practmp_product1id === selectedId)
  const selectedLocation = locations.find(item => item.practmp_locationid === selectedId)
  const selectedRelationship = relationships.find(item => item.practmp_productlocationjoinid === selectedId)
  const productName = (id?: string) => products.find(item => item.practmp_product1id === id)?.practmp_productname ?? 'Unknown product'
  const locationName = (id?: string) => locations.find(item => item.practmp_locationid === id)?.practmp_locationname ?? 'Unknown location'

  const deleteCurrent = async () => {
    if (!guard(entity, 'delete')) return
    const label = entityLabels[entity].singular.toLowerCase()
    if (!selectedId || !window.confirm(`Delete this ${label}? This action cannot be undone.`)) return
    setSaving(true)
    try {
      if (entity === 'products') await Practmp_product1sService.delete(selectedId)
      if (entity === 'locations') await Practmp_locationsService.delete(selectedId)
      if (entity === 'relationships') await Practmp_productlocationjoinsService.delete(selectedId)
      await loadData(); setPage('list'); setSelectedId(null); setNotice({ kind: 'success', text: `${entityLabels[entity].singular} deleted.` })
    } catch (error) { setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Delete failed.' }) }
    finally { setSaving(false) }
  }

  const renderList = () => {
    const query = search.trim().toLowerCase()
    if (entity === 'products') {
      const rows = products.filter(item => `${item.practmp_productname} ${item.practmp_description ?? ''}`.toLowerCase().includes(query))
      return <EntityList rows={rows.map(item => ({ id: item.practmp_product1id, primary: item.practmp_productname, secondary: item.practmp_description, count: relationships.filter(rel => rel._practmp_productid_value === item.practmp_product1id).length }))} empty="No products yet" relationLabel="locations" onOpen={id => navigate('products', 'view', id)} />
    }
    if (entity === 'locations') {
      const rows = locations.filter(item => item.practmp_locationname.toLowerCase().includes(query))
      return <EntityList rows={rows.map(item => ({ id: item.practmp_locationid, primary: item.practmp_locationname, count: relationships.filter(rel => rel._practmp_locationid_value === item.practmp_locationid).length }))} empty="No locations yet" relationLabel="products" onOpen={id => navigate('locations', 'view', id)} />
    }
    const rows = relationships.filter(item => `${item.practmp_productidname ?? ''} ${item.practmp_locationidname ?? ''} ${item.practmp_productlocationjoin1}`.toLowerCase().includes(query))
    return <div className="table-shell"><table><thead><tr><th>Product</th><th>Location</th><th>Relationship name</th><th aria-label="Actions" /></tr></thead><tbody>{rows.map(item => <tr key={item.practmp_productlocationjoinid}><td>{item.practmp_productidname ?? productName(item._practmp_productid_value)}</td><td>{item.practmp_locationidname ?? locationName(item._practmp_locationid_value)}</td><td className="muted-cell">{item.practmp_productlocationjoin1}</td><td><button className="text-button" onClick={() => navigate('relationships', 'view', item.practmp_productlocationjoinid)}>View</button></td></tr>)}</tbody></table>{rows.length === 0 && <EmptyState text="No relationships yet" />}</div>
  }

  const renderForm = () => {
    if (entity === 'products') return <ProductForm product={selectedProduct} saving={saving} onCancel={() => navigate(entity, selectedId ? 'view' : 'list', selectedId)} onSave={async (name, description) => {
      if (!guard(entity, page === 'edit' ? 'write' : 'create')) return
      setSaving(true); try {
        if (page === 'edit' && selectedId) requireSuccess(await Practmp_product1sService.update(selectedId, { practmp_productname: name, practmp_description: description }))
        else requireSuccess(await Practmp_product1sService.create({ practmp_productname: name, practmp_description: description, statecode: 0 }))
        await loadData(); setPage('list'); setSelectedId(null); setNotice({ kind: 'success', text: `Product ${page === 'edit' ? 'updated' : 'created'}.` })
      } catch (error) { setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Save failed.' }) } finally { setSaving(false) }
    }} />
    if (entity === 'locations') return <NameForm label="Location name" initialValue={selectedLocation?.practmp_locationname ?? ''} saving={saving} onCancel={() => navigate(entity, selectedId ? 'view' : 'list', selectedId)} onSave={async name => {
      if (!guard(entity, page === 'edit' ? 'write' : 'create')) return
      setSaving(true); try {
        if (page === 'edit' && selectedId) requireSuccess(await Practmp_locationsService.update(selectedId, { practmp_locationname: name }))
        else requireSuccess(await Practmp_locationsService.create({ practmp_locationname: name, statecode: 0 }))
        await loadData(); setPage('list'); setSelectedId(null); setNotice({ kind: 'success', text: `Location ${page === 'edit' ? 'updated' : 'created'}.` })
      } catch (error) { setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Save failed.' }) } finally { setSaving(false) }
    }} />
    return <RelationshipForm products={products} locations={locations} relationship={selectedRelationship} initialProductId={relationshipDefaults.productId} initialLocationId={relationshipDefaults.locationId} saving={saving} onCancel={() => navigate(entity, selectedId ? 'view' : 'list', selectedId)} onSave={async (productId, locationId) => {
      if (!guard(entity, page === 'edit' ? 'write' : 'create')) return
      setSaving(true); try {
        const generatedName = `${productName(productId)} at ${locationName(locationId)}`
        const fields = { practmp_productlocationjoin1: generatedName, 'practmp_ProductID@odata.bind': `/practmp_product1s(${productId})`, 'practmp_LocationID@odata.bind': `/practmp_locations(${locationId})` }
        if (page === 'edit' && selectedId) requireSuccess(await Practmp_productlocationjoinsService.update(selectedId, fields))
        else requireSuccess(await Practmp_productlocationjoinsService.create({ ...fields, statecode: 0 }))
        await loadData(); setPage('list'); setSelectedId(null); setNotice({ kind: 'success', text: `Relationship ${page === 'edit' ? 'updated' : 'created'}.` })
      } catch (error) { setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Save failed.' }) } finally { setSaving(false) }
    }} />
  }

  const renderView = () => {
    if (entity === 'products' && selectedProduct) {
      const related = relationships.filter(item => item._practmp_productid_value === selectedId)
      return <DetailCard title={selectedProduct.practmp_productname} description={selectedProduct.practmp_description} type="Product" modified={selectedProduct.modifiedon} relationsTitle="Available at" relationsCount={related.length} onEdit={allowed(entity, 'write') ? () => navigate(entity, 'edit', selectedId) : undefined} onDelete={allowed(entity, 'delete') ? deleteCurrent : undefined} saving={saving}><RelatedTable rows={related.map(item => ({ id: item.practmp_productlocationjoinid, name: item.practmp_locationidname ?? locationName(item._practmp_locationid_value), secondary: item.practmp_productlocationjoin1 }))} empty="This product is not assigned to a location." onOpen={id => navigate('relationships', 'view', id)} onAdd={allowed('relationships', 'create') ? () => navigate('relationships', 'create', null, { productId: selectedId ?? undefined }) : undefined} /><ProductAuditHistory key={selectedProduct.practmp_product1id} productId={selectedProduct.practmp_product1id} /></DetailCard>
    }
    if (entity === 'locations' && selectedLocation) {
      const related = relationships.filter(item => item._practmp_locationid_value === selectedId)
      return <DetailCard title={selectedLocation.practmp_locationname} type="Location" modified={selectedLocation.modifiedon} relationsTitle="Products here" relationsCount={related.length} onEdit={allowed(entity, 'write') ? () => navigate(entity, 'edit', selectedId) : undefined} onDelete={allowed(entity, 'delete') ? deleteCurrent : undefined} saving={saving}><RelatedTable rows={related.map(item => ({ id: item.practmp_productlocationjoinid, name: item.practmp_productidname ?? productName(item._practmp_productid_value), secondary: item.practmp_productlocationjoin1 }))} empty="No products are assigned to this location." onOpen={id => navigate('relationships', 'view', id)} onAdd={allowed('relationships', 'create') ? () => navigate('relationships', 'create', null, { locationId: selectedId ?? undefined }) : undefined} /></DetailCard>
    }
    if (entity === 'relationships' && selectedRelationship) {
      return <DetailCard title={selectedRelationship.practmp_productlocationjoin1} type="Relationship" modified={selectedRelationship.modifiedon} onEdit={allowed(entity, 'write') ? () => navigate(entity, 'edit', selectedId) : undefined} onDelete={allowed(entity, 'delete') ? deleteCurrent : undefined} saving={saving}><div className="relationship-pair"><button onClick={() => navigate('products', 'view', selectedRelationship._practmp_productid_value ?? null)}><span className="pair-icon"><Icon name="box" /></span><span><small>Product</small><strong>{selectedRelationship.practmp_productidname ?? productName(selectedRelationship._practmp_productid_value)}</strong></span></button><span className="connector"><Icon name="link" /></span><button onClick={() => navigate('locations', 'view', selectedRelationship._practmp_locationid_value ?? null)}><span className="pair-icon"><Icon name="pin" /></span><span><small>Location</small><strong>{selectedRelationship.practmp_locationidname ?? locationName(selectedRelationship._practmp_locationid_value)}</strong></span></button></div></DetailCard>
    }
    return <EmptyState text={`${entityLabels[entity].singular} not found`} />
  }

  const title = page === 'list' ? entityLabels[entity].plural : page === 'create' ? `New ${entityLabels[entity].singular.toLowerCase()}` : page === 'edit' ? `Edit ${entityLabels[entity].singular.toLowerCase()}` : entityLabels[entity].singular
  const subtitle = page === 'list' ? `Manage ${entityLabels[entity].plural.toLowerCase()} and their connections.` : page === 'create' ? `Add a ${entityLabels[entity].singular.toLowerCase()} to your catalog.` : page === 'edit' ? `Update this ${entityLabels[entity].singular.toLowerCase()}.` : 'Record details and connected data.'

  return <div className="app-shell"><aside className="sidebar"><div className="brand"><span className="brand-mark">SC</span><span><strong>Simple Code</strong><small>Inventory directory</small></span></div><Navigation appMode={appMode} permissions={permissions} status={permissionStatus} entity={entity} busy={loading || saving} onNavigate={navigate} /></aside><main><header className="topbar"><div className="mobile-brand">Simple Code</div><button className="refresh-button" onClick={() => void loadData()} disabled={loading || saving}>Refresh data</button></header><div className="content">{simulationEnabled && <section className="role-simulation" aria-label="Development role simulator">
      <label htmlFor="simulation-role">Development role simulator</label>
      <select id="simulation-role" value={simulationRole} disabled={loading || saving} onChange={event => {
        const role = event.target.value
        if (!simulationEnabled || loading || saving || !Object.hasOwn(simulationRoles, role)) return
        setLoading(true); setPermissions(deniedPermissions()); setPermissionStatus('checking')
        setPage('list'); setSelectedId(null); setSearch(''); setNotice(null); setRelationshipDefaults({})
        setSimulationRole(role as SimulationRole)
      }}>
        {Object.entries(simulationRoles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <p role="status">{simulationRole === 'actual' ? 'Using your actual permissions.' : `Simulating: ${simulationRoles[simulationRole]}.`} This tests app controls and actions. Dataverse still uses your signed-in account; saves and deletes affect real data.</p>
      <small>Switching roles closes any open form and discards unsaved changes. Reloading the app restores your actual permissions.</small>
    </section>}{page !== 'list' && <button className="back-button" onClick={() => navigate(entity)}><Icon name="arrow" />Back to {entityLabels[entity].plural.toLowerCase()}</button>}<section className="page-heading"><div><h1>{title}</h1><p>{subtitle}</p></div>{page === 'list' && allowed(entity, 'create') && <button className="primary-button" onClick={() => navigate(entity, 'create')}><Icon name="plus" />New {entityLabels[entity].singular.toLowerCase()}</button>}</section>{notice && <div className={`notice ${notice.kind}`} role="status">{notice.text}<button onClick={() => setNotice(null)} aria-label="Dismiss">×</button></div>}{page === 'list' && permissionStatus === 'ready' && can(permissions, entity, 'read') && <div className="search-row"><label className="search-box"><Icon name="search" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder={`Search ${entityLabels[entity].plural.toLowerCase()}`} /></label><span>{entity === 'products' ? products.length : entity === 'locations' ? locations.length : relationships.length} total</span></div>}{loading ? <div className="loading"><span /><p>Loading your data…</p></div> : !can(permissions, entity, 'read') ? <EmptyState text="You do not have access to these records." /> : (page === 'create' || page === 'edit') && !can(permissions, entity, page === 'create' ? 'create' : 'write') ? <EmptyState text="You do not have permission to change these records." /> : page === 'list' ? renderList() : page === 'view' ? renderView() : renderForm()}</div></main></div>
}

function EntityList({ rows, empty, relationLabel, onOpen }: { rows: { id: string; primary: string; secondary?: string; count: number }[]; empty: string; relationLabel: string; onOpen: (id: string) => void }) {
  return <div className="table-shell"><table><thead><tr><th>Name</th><th>Relationships</th><th aria-label="Actions" /></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td><button className="record-name" onClick={() => onOpen(row.id)}>{row.primary}</button>{row.secondary && <span className="record-description">{row.secondary}</span>}</td><td><span className="count-pill">{row.count} {relationLabel}</span></td><td><button className="text-button" onClick={() => onOpen(row.id)}>View</button></td></tr>)}</tbody></table>{rows.length === 0 && <EmptyState text={empty} />}</div>
}

function EmptyState({ text }: { text: string }) { return <div className="empty-state"><div className="empty-symbol">○</div><strong>{text}</strong></div> }

function ProductForm({ product, saving, onSave, onCancel }: { product?: Practmp_product1s; saving: boolean; onSave: (name: string, description: string) => Promise<void>; onCancel: () => void }) {
  const [name, setName] = useState(product?.practmp_productname ?? '')
  const [description, setDescription] = useState(product?.practmp_description ?? '')
  return <form className="form-card" onSubmit={event => { event.preventDefault(); void onSave(name.trim(), description.trim()) }}><div className="form-field"><label htmlFor="name">Product name</label><input id="name" autoFocus required maxLength={200} value={name} onChange={event => setName(event.target.value)} placeholder="Enter product name" /><small>This is the name shown throughout the app.</small></div><div className="form-field"><label htmlFor="description">Description</label><textarea id="description" maxLength={100} rows={3} value={description} onChange={event => setDescription(event.target.value)} placeholder="Add a short product description" /><div className="field-meta"><small>Help people identify this product at a glance.</small><small>{description.length}/100</small></div></div><div className="form-actions"><button type="button" className="secondary-button" onClick={onCancel}>Cancel</button><button type="submit" className="primary-button" disabled={saving || !name.trim()}>{saving ? 'Saving…' : 'Save product'}</button></div></form>
}

function NameForm({ label, initialValue, saving, onSave, onCancel }: { label: string; initialValue: string; saving: boolean; onSave: (name: string) => Promise<void>; onCancel: () => void }) {
  const [name, setName] = useState(initialValue)
  return <form className="form-card" onSubmit={event => { event.preventDefault(); void onSave(name.trim()) }}><div className="form-field"><label htmlFor="name">{label}</label><input id="name" autoFocus required maxLength={200} value={name} onChange={event => setName(event.target.value)} placeholder={`Enter ${label.toLowerCase()}`} /><small>This is the name shown throughout the app.</small></div><div className="form-actions"><button type="button" className="secondary-button" onClick={onCancel}>Cancel</button><button type="submit" className="primary-button" disabled={saving || !name.trim()}>{saving ? 'Saving…' : 'Save'}</button></div></form>
}

function RelationshipForm({ products, locations, relationship, initialProductId, initialLocationId, saving, onSave, onCancel }: { products: Practmp_product1s[]; locations: Practmp_locations[]; relationship?: Practmp_productlocationjoins; initialProductId?: string; initialLocationId?: string; saving: boolean; onSave: (productId: string, locationId: string) => Promise<void>; onCancel: () => void }) {
  const [productId, setProductId] = useState(relationship?._practmp_productid_value ?? initialProductId ?? '')
  const [locationId, setLocationId] = useState(relationship?._practmp_locationid_value ?? initialLocationId ?? '')
  const submit = (event: FormEvent) => { event.preventDefault(); void onSave(productId, locationId) }
  return <form className="form-card relationship-form" onSubmit={submit}><div className="form-grid"><div className="form-field"><label htmlFor="product">Product</label><select id="product" autoFocus required value={productId} onChange={event => setProductId(event.target.value)}><option value="">Select a product</option>{products.map(item => <option key={item.practmp_product1id} value={item.practmp_product1id}>{item.practmp_productname}</option>)}</select></div><div className="form-field"><label htmlFor="location">Location</label><select id="location" required value={locationId} onChange={event => setLocationId(event.target.value)}><option value="">Select a location</option>{locations.map(item => <option key={item.practmp_locationid} value={item.practmp_locationid}>{item.practmp_locationname}</option>)}</select></div></div><p className="generated-note">The relationship name is generated automatically from the selected product and location.</p><div className="form-actions"><button type="button" className="secondary-button" onClick={onCancel}>Cancel</button><button type="submit" className="primary-button" disabled={saving || !productId || !locationId}>{saving ? 'Saving…' : 'Save relationship'}</button></div></form>
}

function DetailCard({ title, description, type, modified, relationsTitle, relationsCount, onEdit, onDelete, saving, children }: { title: string; description?: string; type: string; modified?: string; relationsTitle?: string; relationsCount?: number; onEdit?: () => void; onDelete?: () => void; saving: boolean; children: ReactNode }) {
  return <div className="detail-stack"><section className="detail-card"><div className="detail-main"><span className="entity-badge">{type}</span><h2>{title}</h2>{description && <p className="detail-description">{description}</p>}<p>{modified ? `Last updated ${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(modified))}` : 'Active record'}</p></div><div className="detail-actions">{onEdit && <button className="secondary-button" onClick={onEdit}><Icon name="edit" />Edit</button>}{onDelete && <button className="danger-button" onClick={onDelete} disabled={saving}><Icon name="trash" />Delete</button>}</div></section>{relationsTitle && <div className="section-title"><div><h2>{relationsTitle}</h2><p>{relationsCount} connected {relationsCount === 1 ? 'record' : 'records'}</p></div></div>}{children}</div>
}

function RelatedTable({ rows, empty, onOpen, onAdd }: { rows: { id: string; name: string; secondary: string }[]; empty: string; onOpen: (id: string) => void; onAdd?: () => void }) {
  return <div className="table-shell related"><div className="related-toolbar"><span>Connections</span>{onAdd && <button className="text-button" onClick={onAdd}><Icon name="plus" />Add relationship</button>}</div>{rows.length ? <table><thead><tr><th>Name</th><th>Relationship</th><th /></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td>{row.name}</td><td className="muted-cell">{row.secondary}</td><td><button className="text-button" onClick={() => onOpen(row.id)}>View</button></td></tr>)}</tbody></table> : <div className="empty-state compact"><strong>{empty}</strong>{onAdd && <button className="text-button" onClick={onAdd}>Add a relationship</button>}</div>}</div>
}

export default App
