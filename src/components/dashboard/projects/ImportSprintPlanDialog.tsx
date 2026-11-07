'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, FileJson, Loader2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FormattedText } from '@/components/ui/formatted-text'

interface Person {
  full_name: string
  email: string | null
  role: string | null
}

interface PreviewTask {
  key: string
  title: string
  previous_title?: string | null
  description: string | null
  action: 'create' | 'update' | 'skip'
  assignees: string[]
  reviewer: string | null
  sprint_order: number | null
  depends_on: string[]
}

interface Preview {
  sprint: {
    name: string
    action: 'create' | 'reuse'
    start_date: string
    end_date: string
    status: string
  }
  tasks: PreviewTask[]
  summary: { to_create: number; to_update?: number; to_skip: number }
}

interface ImportResponse {
  error?: string
  errors?: { path: string; message: string }[]
  warnings?: string[]
  people?: Person[]
  preview?: Preview
  applied?: { sprint_id: string; created: number; updated?: number; skipped: number }
}

interface ImportSprintPlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  onImported: (sprintId: string) => void
}

export function ImportSprintPlanDialog({
  open,
  onOpenChange,
  projectId,
  onImported,
}: ImportSprintPlanDialogProps) {
  const [jsonText, setJsonText] = useState('')
  const [people, setPeople] = useState<Person[]>([])
  const [loadingContext, setLoadingContext] = useState(false)
  const [loading, setLoading] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportResponse | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoadingContext(true)
    fetch(`/api/dashboard/projects/${projectId}/import`)
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'No se pudo cargar el importador')
        if (cancelled) return
        setPeople(data.people || [])
        setJsonText((current) => current || data.template || '')
      })
      .catch((error: unknown) => {
        if (!cancelled) setParseError(error instanceof Error ? error.message : 'No se pudo cargar el importador')
      })
      .finally(() => {
        if (!cancelled) setLoadingContext(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, projectId])

  const selectedTask = result?.preview?.tasks.find((task) => task.key === selectedKey) ?? result?.preview?.tasks[0]

  const submit = async (dryRun: boolean) => {
    setParseError(null)
    setResult(null)
    let plan: unknown
    try {
      plan = JSON.parse(jsonText)
    } catch {
      setParseError('El texto no es un JSON válido')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/dashboard/projects/${projectId}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, dry_run: dryRun }),
      })
      const data = (await response.json()) as ImportResponse
      if (data.people) setPeople(data.people)
      if (!response.ok && !data.errors) {
        setParseError(data.error || 'No se pudo importar el plan')
        return
      }
      setResult(data)
      if (data.preview?.tasks[0]) setSelectedKey(data.preview.tasks[0].key)
      if (!dryRun && data.applied) {
        onImported(data.applied.sprint_id)
        onOpenChange(false)
        setResult(null)
      }
    } catch {
      setParseError('No se pudo importar el plan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="w-5 h-5" /> Importar sprint
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <p className="text-sm text-muted-foreground">
            Pega el JSON del plan. La descripción admite saltos de línea, **negrita** y *cursiva*, igual que en el detalle de la tarea.
          </p>

          {people.length > 0 && (
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
              <p className="font-medium text-foreground mb-1">Personas disponibles</p>
              <ul className="text-muted-foreground space-y-0.5">
                {people.map((person) => (
                  <li key={person.email || person.full_name}>
                    {person.full_name}
                    {person.role ? ` · ${person.role}` : ''}
                    {person.email ? ` · ${person.email}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Textarea
            value={jsonText}
            onChange={(event) => {
              setJsonText(event.target.value)
              setResult(null)
            }}
            rows={12}
            disabled={loadingContext}
            placeholder='{ "sprint": { "name": "..." }, "tasks": [] }'
            className="font-mono text-xs"
          />

          {parseError && (
            <div className="bg-red-50 border border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {parseError}
            </div>
          )}

          {result?.errors && result.errors.length > 0 && (
            <ul className="bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 px-4 py-3 rounded-lg text-sm space-y-1">
              {result.errors.map((issue) => (
                <li key={`${issue.path}-${issue.message}`}>
                  <span className="font-medium">{issue.path}:</span> {issue.message}
                </li>
              ))}
            </ul>
          )}

          {result?.warnings && result.warnings.length > 0 && (
            <ul className="bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200 px-4 py-3 rounded-lg text-sm space-y-1">
              {result.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}

          {result?.preview && result.errors?.length === 0 && (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {result.preview.sprint.action === 'create' ? 'Sprint nuevo' : 'Sprint existente'}: {result.preview.sprint.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {result.preview.summary.to_create} por crear · {result.preview.summary.to_update ?? 0} por actualizar
                </p>
                <ul className="space-y-1">
                  {result.preview.tasks.map((task) => (
                    <li key={task.key}>
                      <button
                        type="button"
                        onClick={() => setSelectedKey(task.key)}
                        className={`w-full text-left rounded-md px-2 py-1.5 text-sm hover:bg-muted ${selectedTask?.key === task.key ? 'bg-muted' : ''}`}
                      >
                        <span className="font-medium">{task.key}</span> {task.title}
                        <span className="block text-xs text-muted-foreground">
                          {task.action === 'create'
                            ? 'Se creará'
                            : task.action === 'update'
                              ? `Se actualizará${task.previous_title ? ` (antes «${task.previous_title}»)` : ''}`
                              : 'Ya existe, se omite'}
                          {task.assignees.length > 0 ? ` · ${task.assignees.join(', ')}` : ''}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-border p-3 text-sm">
                <p className="font-medium mb-2">Descripción</p>
                {selectedTask?.description ? (
                  <FormattedText>{selectedTask.description}</FormattedText>
                ) : (
                  <p className="text-muted-foreground">Esta tarea no trae descripción.</p>
                )}
              </div>
            </div>
          )}

          {result?.applied && (
            <div className="bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Sprint importado: {result.applied.created} tareas nuevas
              {(result.applied.updated ?? 0) > 0 ? `, ${result.applied.updated} actualizadas` : ''}.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => submit(true)} disabled={loading || !jsonText.trim()}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Vista previa'}
          </Button>
          <Button
            type="button"
            onClick={() => submit(false)}
            disabled={loading || !result?.preview || (result.errors?.length ?? 0) > 0}
          >
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
