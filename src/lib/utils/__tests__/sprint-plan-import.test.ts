import { describe, expect, it } from 'vitest'
import {
  buildSprintPlanExport,
  fillMissingSprintOrders,
  matchPlanTasks,
  prepareSprintPlan,
  resolvePerson,
  type ImportPerson,
} from '../sprint-plan-import'

const people: ImportPerson[] = [
  { id: '1', full_name: 'José Huerta', email: 'jose@example.com' },
  { id: '2', full_name: 'Sebastián Mardones', email: 'sebas@example.com' },
  { id: '3', full_name: 'Ruben Gonzalez', email: 'ruben@example.com' },
  { id: '4', full_name: 'Ruben Prueba', email: 'prueba@example.com' },
]

const sprint = {
  name: 'Sprint 1',
  goal: 'Cerrar el login',
  start_date: '2026-11-09',
  end_date: '2026-11-20',
}

describe('fillMissingSprintOrders', () => {
  it('completa huecos sin repetir órdenes ocupados', () => {
    const filled = fillMissingSprintOrders([
      { key: 'a', sprintOrder: 1 },
      { key: 'b', sprintOrder: null },
      { key: 'c', sprintOrder: 3 },
    ], [2])

    expect(filled.map((task) => task.sprintOrder)).toEqual([1, 4, 3])
  })
})

describe('resolvePerson', () => {
  it('acepta nombre completo, email y nombre de pila único', () => {
    expect(resolvePerson('José Huerta', people).person?.id).toBe('1')
    expect(resolvePerson('jose@example.com', people).person?.id).toBe('1')
    expect(resolvePerson('Sebastián', people).person?.id).toBe('2')
  })

  it('rechaza un nombre de pila repetido', () => {
    expect(resolvePerson('Ruben', people).error).toMatch(/ambiguo/)
  })
})

describe('prepareSprintPlan', () => {
  it('conserva el markdown de la descripción', () => {
    const description = '**Objetivo**\nHacer login.\n\n*Nota:* sin HTML.'
    const result = prepareSprintPlan({
      project: 'SynchroManage',
      sprint,
      tasks: [{
        key: 'HU-01',
        title: 'Login',
        description,
        assignees: ['José'],
        reviewer: 'Sebastián Mardones',
        complexity: 5,
        sprint_order: 1,
        depends_on: [],
      }],
    }, people)

    expect(result.errors).toEqual([])
    expect(result.plan?.tasks[0]?.description).toBe(description)
    expect(result.plan?.tasks[0]?.assigneeNames).toEqual(['José Huerta'])
    expect(result.plan?.tasks[0]?.reviewerName).toBe('Sebastián Mardones')
  })

  it('explica que points no existe', () => {
    const result = prepareSprintPlan({
      sprint,
      tasks: [{ key: 'HU-01', title: 'Login', points: 5 }],
    }, people)

    expect(result.plan).toBeNull()
    expect(result.errors.some((issue) => issue.path.endsWith('points') && issue.message.includes('complexity'))).toBe(true)
  })

  it('detecta dependencias que no están en el plan y ciclos', () => {
    const missing = prepareSprintPlan({
      sprint,
      tasks: [{ key: 'HU-02', title: 'Middleware', depends_on: ['HU-01'] }],
    }, people)
    expect(missing.errors.some((issue) => issue.message.includes('HU-01'))).toBe(true)

    const cycle = prepareSprintPlan({
      sprint,
      tasks: [
        { key: 'HU-01', title: 'A', depends_on: ['HU-02'] },
        { key: 'HU-02', title: 'B', depends_on: ['HU-01'] },
      ],
    }, people)
    expect(cycle.errors.some((issue) => issue.message.includes('circular'))).toBe(true)
  })

  it('rechaza orden de sprint repetido y fechas invertidas', () => {
    const result = prepareSprintPlan({
      sprint: { ...sprint, end_date: '2026-11-01' },
      tasks: [
        { key: 'HU-01', title: 'A', sprint_order: 1 },
        { key: 'HU-02', title: 'B', sprint_order: 1 },
      ],
    }, people)

    expect(result.errors.some((issue) => issue.path === 'sprint.end_date')).toBe(true)
    expect(result.errors.some((issue) => issue.message.includes('orden 1'))).toBe(true)
  })
})

describe('matchPlanTasks', () => {
  it('actualiza por plan_key aunque cambie el título', () => {
    const result = matchPlanTasks(
      [{ key: 'HU-01', title: 'Login nuevo' }],
      [{ id: 'task-1', title: 'Login viejo', planKey: 'HU-01', sprintOrder: 1 }]
    )

    expect(result.errors).toEqual([])
    expect(result.matches[0]).toEqual({ action: 'update', existingId: 'task-1' })
  })

  it('usa el título solo cuando la tarea vieja no tiene clave', () => {
    const result = matchPlanTasks(
      [{ key: 'HU-04', title: 'Descargar plan' }],
      [{ id: 'task-4', title: 'Descargar plan', planKey: null, sprintOrder: 4 }]
    )

    expect(result.matches[0]).toEqual({ action: 'update', existingId: 'task-4' })
  })

  it('crea la tarea si la clave no está en el sprint', () => {
    const result = matchPlanTasks(
      [{ key: 'HU-05', title: 'Reimportar' }],
      [{ id: 'task-1', title: 'Otra', planKey: 'HU-01', sprintOrder: 1 }]
    )

    expect(result.matches[0]).toEqual({ action: 'create', existingId: null })
  })
})

describe('buildSprintPlanExport', () => {
  it('devuelve un JSON que el importador acepta y conserva el markdown', () => {
    const description = '**Objetivo**\nCerrar el acceso.\n\n*Nota:* sin HTML.'
    const document = buildSprintPlanExport({
      projectName: 'SynchroManaha - Security',
      sprint: {
        name: 'Seguridad y plan',
        goal: 'Dejar la base cerrada',
        startDate: '2026-11-09',
        endDate: '2026-11-20',
        status: 'planning',
      },
      people,
      tasks: [
        {
          id: 'a',
          title: 'RLS de categorías',
          description,
          category: 'feature',
          priority: 'high',
          status: 'todo',
          complexity: 3,
          sprintOrder: 1,
          taskNumber: 10,
          planKey: null,
          dueDate: '2026-11-13',
          branchName: null,
          assigneeIds: ['2'],
          reviewerId: '3',
          dependencyIds: [],
        },
        {
          id: 'b',
          title: 'Reimportar',
          description: 'Actualiza por clave.',
          category: 'feature',
          priority: 'high',
          status: 'todo',
          complexity: 8,
          sprintOrder: 2,
          taskNumber: 11,
          planKey: 'HU-05',
          dueDate: null,
          branchName: 'feature/reimportar',
          assigneeIds: ['3'],
          reviewerId: '1',
          dependencyIds: ['a'],
        },
      ],
    })

    const prepared = prepareSprintPlan(document, people)
    expect(prepared.errors).toEqual([])
    expect(prepared.plan?.projectName).toBe('SynchroManaha - Security')
    expect(prepared.plan?.tasks[0]?.description).toBe(description)
    expect(prepared.plan?.tasks[0]?.key).toBe('HU-1')
    expect(prepared.plan?.tasks[1]?.key).toBe('HU-05')
    expect(prepared.plan?.tasks[1]?.dependsOnKeys).toEqual(['HU-1'])
    expect(prepared.plan?.tasks[1]?.branchName).toBe('feature/reimportar')
  })
})
