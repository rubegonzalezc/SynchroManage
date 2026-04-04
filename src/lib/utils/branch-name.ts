/**
 * Genera el nombre de rama de git a partir de los datos de una tarea.
 * Formato: {categoría}/{slug-del-título}-{número}
 * Ej: docs/agregar-edge-functions-de-email-al-repositorio-7
 */
export function getBranchName(task: {
  task_number: number | null
  title: string
  category?: string
}): string {
  const cat = task.category || 'task'
  const slug = task.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar tildes
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
  const num = task.task_number ?? ''
  return `${cat}/${slug}-${num}`
}
