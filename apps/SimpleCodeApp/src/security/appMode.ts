export const appModeSchemaName = 'practmp_AppMode'

export async function loadAppMode(
  retrieve: (schemaName: string) => Promise<{ success: boolean; data?: Record<string, unknown> }>,
): Promise<string | null> {
  try {
    const result = await retrieve(appModeSchemaName)
    const value = result.data?.Value
    if (!result.success) return null
    return typeof value === 'string' ? value.trim().toLowerCase() : ''
  } catch {
    return null
  }
}

// Only an explicitly configured development environment enables simulation.
export async function loadSimulationEnabled(retrieve: Parameters<typeof loadAppMode>[0]): Promise<boolean> {
  return await loadAppMode(retrieve) === 'development'
}
