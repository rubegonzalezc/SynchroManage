export const BLOCKING_BUG_STATUSES = ['open', 'in_progress'] as const

export type BlockingBugStatus = (typeof BLOCKING_BUG_STATUSES)[number]

export interface BlockingBugRef {
  id: string
  title: string
  status: string
  project_id: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAdmin = any

export function isBlockingBugStatus(status: string): status is BlockingBugStatus {
  return (BLOCKING_BUG_STATUSES as readonly string[]).includes(status)
}

export async function fetchBlockingBugsForTask(
  supabaseAdmin: SupabaseAdmin,
  taskId: string
): Promise<BlockingBugRef[]> {
  const { data, error } = await supabaseAdmin
    .from('bugs')
    .select('id, title, status, project_id')
    .eq('task_id', taskId)
    .in('status', [...BLOCKING_BUG_STATUSES])
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data as BlockingBugRef[]
}

export function formatBlockedByOpenBugsMessage(
  blockingBugs: Array<Pick<BlockingBugRef, 'title'>>
): string {
  if (blockingBugs.length === 0) {
    return 'No puedes completar esta tarea mientras tenga bugs abiertos o en progreso'
  }

  const titles = blockingBugs.map((bug) => bug.title).join(', ')
  return `No puedes completar esta tarea mientras tenga bugs abiertos o en progreso: ${titles}`
}

export function getOpenBugsBlockedMessageForStatus(
  blockingBugs: BlockingBugRef[],
  newStatus: string
): string | null {
  if (newStatus !== 'done' || blockingBugs.length === 0) return null
  return formatBlockedByOpenBugsMessage(blockingBugs)
}

export async function assertTaskNotBlockedByOpenBugs(
  supabaseAdmin: SupabaseAdmin,
  options: {
    taskId: string
    newStatus: string
  }
): Promise<BlockingBugRef[] | null> {
  if (options.newStatus !== 'done') return null

  const blockingBugs = await fetchBlockingBugsForTask(supabaseAdmin, options.taskId)
  return blockingBugs.length > 0 ? blockingBugs : null
}

export function groupBlockingBugsByTaskId(
  bugs: Array<{
    id: string
    title: string
    status: string
    task_id?: string | null
    project_id: string
  }>
): Record<string, BlockingBugRef[]> {
  const grouped: Record<string, BlockingBugRef[]> = {}

  for (const bug of bugs) {
    if (!bug.task_id || !isBlockingBugStatus(bug.status)) continue

    if (!grouped[bug.task_id]) grouped[bug.task_id] = []
    grouped[bug.task_id].push({
      id: bug.id,
      title: bug.title,
      status: bug.status,
      project_id: bug.project_id,
    })
  }

  return grouped
}
