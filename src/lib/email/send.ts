import { sendResendEmail } from './resend'
import { renderEmail, type EmailData, type EmailType } from './templates'

export async function sendTransactionalEmail(params: {
  to: string
  subject: string
  type: EmailType
  data: EmailData
}) {
  const html = renderEmail(params.type, params.data)

  return sendResendEmail({
    to: params.to,
    subject: params.subject,
    html,
  })
}
