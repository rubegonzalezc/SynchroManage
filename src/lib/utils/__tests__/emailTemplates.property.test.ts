import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  renderProjectAssignedEmail,
  renderTaskAssignedEmail,
  renderUserInvitedEmail,
  type ProjectAssignedData,
  type TaskAssignedData,
  type UserInvitedData,
} from '@/lib/email/templates'

const safeText = fc
  .lorem({ maxCount: 3 })
  .filter((s) => s.trim().length > 0)

const safeUrl = fc.webUrl()

const projectAssignedArb: fc.Arbitrary<ProjectAssignedData> = fc.record({
  recipientName: safeText,
  projectName: safeText,
  roles: fc.array(safeText, { minLength: 1, maxLength: 5 }),
  projectUrl: safeUrl,
})

const taskAssignedArb: fc.Arbitrary<TaskAssignedData> = fc.record({
  recipientName: safeText,
  taskName: safeText,
  projectName: safeText,
  priority: safeText,
  taskUrl: safeUrl,
})

const userInvitedArb: fc.Arbitrary<UserInvitedData> = fc.record({
  recipientName: safeText,
  inviteUrl: safeUrl,
  roles: fc.array(safeText, { minLength: 1, maxLength: 5 }),
})

function expectCommonBranding(html: string) {
  expect(html).toContain('alt="SynchroManage"')
  expect(html).toContain('cid:sm-logo')
  expect(html).toContain('#0f172a')
  expect(html).toContain('#1e3a5f')
  expect(html).toContain('#1d4ed8')
  expect(html).toContain('Gestión de Proyectos Inteligente')
  expect(html).toContain('cid:sm-icon')
  expect(html).toContain('cid:sm-powered-by')
  expect(html).toContain('Powered by SynchroDev')

  const currentYear = new Date().getFullYear()
  expect(html).toContain(`${currentYear} SynchroManage. Todos los derechos reservados.`)
}

function expectCtaGradient(html: string) {
  expect(html).toContain('#2563eb')
  expect(html).toContain('#1d4ed8')
}

describe('Feature: email-template-redesign, Property 4: templates contain all required fields by type and common structure', () => {
  it('renderProjectAssignedEmail contains branding elements and all project-assigned fields', () => {
    fc.assert(
      fc.property(projectAssignedArb, (data) => {
        const html = renderProjectAssignedEmail(data)
        expectCommonBranding(html)
        expectCtaGradient(html)
        expect(html).toContain(data.recipientName)
        expect(html).toContain(data.projectName)
        expect(html).toContain(data.projectUrl)
        expect(html).toContain('Ver Proyecto')
        const hasRole = data.roles.some((role) => html.includes(role))
        expect(hasRole).toBe(true)
      }),
      { numRuns: 100 },
    )
  })

  it('renderTaskAssignedEmail contains branding elements and all task-assigned fields', () => {
    fc.assert(
      fc.property(taskAssignedArb, (data) => {
        const html = renderTaskAssignedEmail(data)
        expectCommonBranding(html)
        expectCtaGradient(html)
        expect(html).toContain(data.recipientName)
        expect(html).toContain(data.taskName)
        expect(html).toContain(data.projectName)
        expect(html).toContain(data.priority)
        expect(html).toContain(data.taskUrl)
        expect(html).toContain('Ver Tarea')
      }),
      { numRuns: 100 },
    )
  })

  it('renderUserInvitedEmail contains branding elements and all user-invited fields', () => {
    fc.assert(
      fc.property(userInvitedArb, (data) => {
        const html = renderUserInvitedEmail(data)
        expectCommonBranding(html)
        expectCtaGradient(html)
        expect(html).toContain(data.recipientName)
        expect(html).toContain(data.inviteUrl)
        expect(html).toContain('Aceptar Invitación')
        expect(html).toContain('Si no esperabas esta invitación')
        const hasRole = data.roles.some((role) => html.includes(role))
        expect(hasRole).toBe(true)
      }),
      { numRuns: 100 },
    )
  })
})
