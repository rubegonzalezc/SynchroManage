import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  renderProjectAssignedEmail,
  renderTaskAssignedEmail,
  renderPasswordResetEmail,
  renderUserInvitedEmail,
  wrapInLayout,
  getAssetUrls,
  DEFAULT_SITE_URL,
  type ProjectAssignedData,
  type TaskAssignedData,
  type PasswordResetData,
  type UserInvitedData,
} from '../../../../supabase/functions/send-email/templates'

/**
 * Feature: email-template-redesign, Property 4: templates contain all required fields by type and common structure
 *
 * Validates: Requirements 2.4, 3.3, 5.1, 5.2, 5.3, 5.4
 *
 * For any valid email request with type and data, the generated HTML must contain:
 * (a) the common structure (SynchroManage logo, gradient header, footer with "powered by"), and
 * (b) all type-specific fields.
 */

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Non-empty alphanumeric string that is safe to search for in HTML output. */
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


const passwordResetArb: fc.Arbitrary<PasswordResetData> = fc.record({
  recipientName: safeText,
  code: fc
    .array(fc.integer({ min: 0, max: 9 }), { minLength: 6, maxLength: 6 })
    .map((arr) => arr.join('')),
})

const userInvitedArb: fc.Arbitrary<UserInvitedData> = fc.record({
  recipientName: safeText,
  inviteUrl: safeUrl,
  roles: fc.array(safeText, { minLength: 1, maxLength: 5 }),
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Feature: email-template-redesign, Property 4: templates contain all required fields by type and common structure', () => {
  it('renderProjectAssignedEmail contains branding elements and all project-assigned fields', () => {
    fc.assert(
      fc.property(projectAssignedArb, (data) => {
        const html = renderProjectAssignedEmail(data)

        // Branding: logo image with alt="SynchroManage"
        expect(html).toContain('alt="SynchroManage"')
        expect(html).toContain('/logo/logotipo-v2.png')

        // Branding: gradient header colors
        expect(html).toContain('#0f172a')
        expect(html).toContain('#1e3a5f')

        // Branding: subtitle
        expect(html).toContain('Gestión de Proyectos Inteligente')

        // Branding: "Powered By" image in footer
        expect(html).toContain('alt="Powered By"')
        expect(html).toContain('/logo/powered-by.png')

        // Branding: copyright with current year
        const currentYear = new Date().getFullYear()
        expect(html).toContain(`${currentYear} SynchroManage. Todos los derechos reservados.`)

        // CTA button gradient
        expect(html).toContain('#2563eb')
        expect(html).toContain('#1d4ed8')

        // Type-specific fields
        expect(html).toContain(data.recipientName)
        expect(html).toContain(data.projectName)
        expect(html).toContain(data.projectUrl)

        // At least one role from the roles array must appear
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

        // Branding: logo image with alt="SynchroManage"
        expect(html).toContain('alt="SynchroManage"')
        expect(html).toContain('/logo/logotipo-v2.png')

        // Branding: gradient header colors
        expect(html).toContain('#0f172a')
        expect(html).toContain('#1e3a5f')

        // Branding: subtitle
        expect(html).toContain('Gestión de Proyectos Inteligente')

        // Branding: "Powered By" image in footer
        expect(html).toContain('alt="Powered By"')
        expect(html).toContain('/logo/powered-by.png')

        // Branding: copyright with current year
        const currentYear = new Date().getFullYear()
        expect(html).toContain(`${currentYear} SynchroManage. Todos los derechos reservados.`)

        // CTA button gradient
        expect(html).toContain('#2563eb')
        expect(html).toContain('#1d4ed8')

        // Type-specific fields
        expect(html).toContain(data.recipientName)
        expect(html).toContain(data.taskName)
        expect(html).toContain(data.projectName)
        expect(html).toContain(data.priority)
        expect(html).toContain(data.taskUrl)
      }),
      { numRuns: 100 },
    )
  })

  it('renderPasswordResetEmail contains branding elements, recipient name, code, and 15-minute expiration note', () => {
    fc.assert(
      fc.property(passwordResetArb, (data) => {
        const html = renderPasswordResetEmail(data)

        // Branding: logo image with alt="SynchroManage"
        expect(html).toContain('alt="SynchroManage"')
        expect(html).toContain('/logo/logotipo-v2.png')

        // Branding: gradient header colors
        expect(html).toContain('#0f172a')
        expect(html).toContain('#1e3a5f')

        // Branding: subtitle
        expect(html).toContain('Gestión de Proyectos Inteligente')

        // Branding: "Powered By" image in footer
        expect(html).toContain('alt="Powered By"')
        expect(html).toContain('/logo/powered-by.png')

        // Branding: copyright with current year
        const currentYear = new Date().getFullYear()
        expect(html).toContain(`${currentYear} SynchroManage. Todos los derechos reservados.`)

        // Type-specific fields
        expect(html).toContain(data.recipientName)
        expect(html).toContain(data.code)
        expect(html).toContain('15 minutos')
      }),
      { numRuns: 100 },
    )
  })

  it('renderUserInvitedEmail contains branding elements and all user-invited fields', () => {
    fc.assert(
      fc.property(userInvitedArb, (data) => {
        const html = renderUserInvitedEmail(data)

        // Branding: logo image with alt="SynchroManage"
        expect(html).toContain('alt="SynchroManage"')
        expect(html).toContain('/logo/logotipo-v2.png')

        // Branding: gradient header colors
        expect(html).toContain('#0f172a')
        expect(html).toContain('#1e3a5f')

        // Branding: subtitle
        expect(html).toContain('Gestión de Proyectos Inteligente')

        // Branding: "Powered By" image in footer
        expect(html).toContain('alt="Powered By"')
        expect(html).toContain('/logo/powered-by.png')

        // Branding: copyright with current year
        const currentYear = new Date().getFullYear()
        expect(html).toContain(`${currentYear} SynchroManage. Todos los derechos reservados.`)

        // CTA button gradient
        expect(html).toContain('#2563eb')
        expect(html).toContain('#1d4ed8')

        // Type-specific fields
        expect(html).toContain(data.recipientName)
        expect(html).toContain(data.inviteUrl)
        expect(html).toContain('Aceptar Invitación')
        expect(html).toContain('Si no esperabas esta invitación')

        // At least one role from the roles array must appear
        const hasRole = data.roles.some((role) => html.includes(role))
        expect(hasRole).toBe(true)
      }),
      { numRuns: 100 },
    )
  })
})