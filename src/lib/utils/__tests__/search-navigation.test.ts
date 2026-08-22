import { describe, expect, it } from 'vitest'
import {
  getBugSearchHref,
  getProjectSearchHref,
  getTaskSearchHref,
  getUserSearchHref,
} from '@/lib/utils/search-navigation'

describe('getTaskSearchHref', () => {
  it('apunta al proyecto con task en query', () => {
    expect(getTaskSearchHref({ id: 'task-1', project_id: 'proj-1' })).toBe(
      '/projects/proj-1?task=task-1'
    )
  })
})

describe('getProjectSearchHref', () => {
  it('apunta a proyecto estándar', () => {
    expect(getProjectSearchHref({ id: 'proj-1', type: 'project' })).toBe('/projects/proj-1')
  })

  it('apunta a control de cambios', () => {
    expect(getProjectSearchHref({ id: 'cc-1', type: 'change_control' })).toBe(
      '/change-controls/cc-1'
    )
  })
})

describe('getBugSearchHref', () => {
  it('apunta al tab de bugs con id en query', () => {
    expect(getBugSearchHref({ id: 'bug-1', project_id: 'proj-1' })).toBe(
      '/projects/proj-1?tab=bugs&bug=bug-1'
    )
  })

  it('usa vista global si no hay proyecto', () => {
    expect(getBugSearchHref({ id: 'bug-1', project_id: '' })).toBe('/dashboard/bugs?bug=bug-1')
  })
})

describe('getUserSearchHref', () => {
  it('apunta al perfil propio', () => {
    expect(getUserSearchHref({ id: 'user-1' }, 'user-1')).toBe('/profile')
  })

  it('apunta a la lista de usuarios para otros', () => {
    expect(getUserSearchHref({ id: 'user-2' }, 'user-1')).toBe('/dashboard/users?user=user-2')
    expect(getUserSearchHref({ id: 'user-2' })).toBe('/dashboard/users?user=user-2')
  })
})
