import { describe, expect, it } from 'vitest'
import { fillMissingSprintOrders, prepareSprintPlan, resolvePerson, type ImportPerson } from '../sprint-plan-import'

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
