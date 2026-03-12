// Helper para registrar actividad
export async function logActivity(
  action: string,
  entityType: string,
  entityId?: string,
  entityName?: string,
  details?: Record<string, unknown>
) {
  try {
    await fetch('/api/dashboard/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        details,
      }),
    })
  } catch (error) {
    console.error('Error logging activity:', error)
  }
}

// Helper para registrar actividad de proyecto
export async function logProjectActivity(
  projectId: string,
  action: string,
  entityType: string,
  entityId?: string,
  entityName?: string,
  extraDetails?: Record<string, unknown>
) {
  const details = {
    project_id: projectId,
    ...extraDetails,
  }
  
  await logActivity(action, entityType, entityId, entityName, details)
}

// Tipos de acciones
export const ActivityActions = {
  CREATED: 'created',
  UPDATED: 'updated',
  DELETED: 'deleted',
  ASSIGNED: 'assigned',
  COMMENTED: 'commented',
  COMPLETED: 'completed',
  INVITED: 'invited',
  STATUS_CHANGED: 'status_changed',
} as const

// Tipos de entidades
export const EntityTypes = {
  PROJECT: 'project',
  TASK: 'task',
  COMMENT: 'comment',
  USER: 'user',
  COMPANY: 'company',
  MEMBER: 'member',
} as const
