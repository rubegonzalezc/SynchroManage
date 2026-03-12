import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  renderProjectAssignedEmail,
  renderTaskAssignedEmail,
  renderPasswordResetEmail,
  type ProjectAssignedData,
  type TaskAssignedData,
  type PasswordResetData,
} from '../email-templates'

/**
 * Feature: email-notifications-resend, Property 4: templates contain all required fields by type and common structure
 *
 * Validates: Requirements 2.4, 3.3, 5.1, 5.2, 5.3, 5.4
 *
 * For any valid email request with type and data, the generated HTML must contain:
 * (a) the common structure (SynchroManage logo, footer), and
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Feature: email-notifications-resend, Property 4: templates contain all required fields by type and common structure', () => {
  it('renderProjectAssignedEmail contains common structure and all project-assigned fields', () => {
    fc.assert(
      fc.property(projectAssignedArb, (data) => {
        const html = renderProjectAssignedEmail(data)

        // Common structure
        expect(html).toContain('SynchroManage')
        expect(html).toContain('Todos los derechos reservados')

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

  it('renderTaskAssignedEmail contains common structure and all task-assigned fields', () => {
    fc.assert(
      fc.property(taskAssignedArb, (data) => {
        const html = renderTaskAssignedEmail(data)

        // Common structure
        expect(html).toContain('SynchroManage')
        expect(html).toContain('Todos los derechos reservados')

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

  it('renderPasswordResetEmail contains common structure, recipient name, code, and 15-minute expiration note', () => {
    fc.assert(
      fc.property(passwordResetArb, (data) => {
        const html = renderPasswordResetEmail(data)

        // Common structure
        expect(html).toContain('SynchroManage')
        expect(html).toContain('Todos los derechos reservados')

        // Type-specific fields
        expect(html).toContain(data.recipientName)
        expect(html).toContain(data.code)
        expect(html).toContain('15 minutos')
      }),
      { numRuns: 100 },
    )
  })
})
