# Edge Function: send-email

Supabase Edge Function that sends transactional emails via [Resend](https://resend.com) for SynchroManage. Handles project assignment notifications, task assignment notifications, and password reset codes.

## Deployment

1. Deploy the function:

```bash
supabase functions deploy send-email
```

2. Set the Resend API key secret:

```bash
supabase secrets set RESEND_API_KEY=re_RzzWmAy5_4yJASak8q4zwy5bgfQB29ac8
```

## Request Format

`POST` with JSON body:

```json
{
  "to": "user@example.com",
  "subject": "Email subject",
  "type": "project_assigned | task_assigned | password_reset",
  "data": { ... }
}
```

### Notification Types

**`project_assigned`** — sent when a user is assigned to a project:

```json
{
  "to": "user@example.com",
  "subject": "Asignación a proyecto: Mi Proyecto",
  "type": "project_assigned",
  "data": {
    "recipientName": "Juan Pérez",
    "projectName": "Mi Proyecto",
    "roles": ["Project Manager"],
    "projectUrl": "https://app.synchrodev.cl/projects/123"
  }
}
```

**`task_assigned`** — sent when a user is assigned to a task:

```json
{
  "to": "user@example.com",
  "subject": "Nueva tarea asignada: Implementar login",
  "type": "task_assigned",
  "data": {
    "recipientName": "Juan Pérez",
    "taskName": "Implementar login",
    "projectName": "Mi Proyecto",
    "priority": "Alta",
    "taskUrl": "https://app.synchrodev.cl/projects/123/tasks/456"
  }
}
```

**`password_reset`** — sent with a 6-digit verification code:

```json
{
  "to": "user@example.com",
  "subject": "Código de verificación",
  "type": "password_reset",
  "data": {
    "recipientName": "Juan Pérez",
    "code": "482910"
  }
}
```

## Responses

| Status | Body | Description |
|--------|------|-------------|
| 200 | `{ "success": true, "id": "..." }` | Email sent successfully |
| 400 | `{ "error": "..." }` | Invalid input (bad email, unsupported type, missing fields) |
| 500 | `{ "error": "..." }` | Resend API error or missing configuration |

## Invocation from Next.js

```typescript
const { error } = await supabaseAdmin.functions.invoke('send-email', {
  body: { to, subject, type, data }
})
```

Sender address for all emails: `no-reply@synchrodev.cl`
