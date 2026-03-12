# Documento de Diseño: Rediseño de Plantillas de Correo Electrónico

## Visión General

Este diseño describe la reestructuración de las plantillas de correo electrónico de SynchroManage para alinearlas con la identidad visual del proyecto (gradientes slate/blue, logotipo, imagen "powered by") y eliminar la duplicación de código entre el lado Next.js y la Edge Function de Supabase.

### Cambios principales

1. Rediseñar el `wrapInLayout()` en la Edge Function con el nuevo branding (gradiente en encabezado, logotipo, subtítulo, pie de página con "powered by" y copyright).
2. Actualizar las 4 funciones de renderizado de plantillas para usar botones con gradiente y estilos alineados a la paleta del proyecto.
3. Agregar lectura de variable de entorno `PUBLIC_SITE_URL` para construir URLs absolutas de imágenes.
4. Eliminar `src/lib/utils/email-templates.ts` (duplicado).
5. Actualizar los tests de propiedad existentes para que importen desde un módulo testeable o validen el HTML generado por la Edge Function.

### Decisiones de diseño

- **Edge Function como fuente única de verdad**: La Edge Function de Supabase (`supabase/functions/send-email/index.ts`) es autocontenida en runtime Deno. No puede importar módulos de `src/`. Por lo tanto, todo el código de plantillas vive exclusivamente ahí.
- **CSS inline obligatorio**: Los clientes de correo no soportan hojas de estilo externas ni `<style>` en `<head>` de forma confiable. Todos los estilos se aplican como atributos `style=""` inline.
- **Imágenes por URL absoluta**: Los clientes de correo no pueden resolver rutas relativas. Las imágenes del logotipo y "powered by" se referencian con URLs absolutas construidas desde `PUBLIC_SITE_URL`.
- **Módulo de plantillas extraído para testing**: Para poder ejecutar tests de propiedad con Vitest (Node.js), se extraerán las funciones puras de renderizado a un archivo separado `supabase/functions/send-email/templates.ts` que se importa tanto desde `index.ts` como desde los tests. Este archivo no tiene dependencias de Deno runtime.

## Arquitectura

```mermaid
graph TD
    subgraph "Supabase Edge Function (Deno)"
        A[index.ts - Handler HTTP] --> B[templates.ts - Funciones de renderizado]
        A --> C[Resend API]
    end

    subgraph "Variables de Entorno"
        D[RESEND_API_KEY]
        E[PUBLIC_SITE_URL]
    end

    subgraph "Assets Públicos"
        F[/logo/logotipo-v2.png]
        G[/logo/powered-by.png]
    end

    E --> B
    D --> A
    B -->|URLs absolutas| F
    B -->|URLs absolutas| G

    subgraph "Tests (Node.js / Vitest)"
        H[emailTemplates.property.test.ts] -->|importa| B
    end
```

### Flujo de renderizado

1. La Edge Function recibe una solicitud con `type` y `data`.
2. `renderEmail()` delega al renderizador específico del tipo.
3. Cada renderizador genera el contenido HTML específico.
4. `wrapInLayout()` envuelve el contenido con el layout común (encabezado con logo + gradiente, área de contenido, separador, pie de página con "powered by" + copyright).
5. El HTML resultante se envía vía Resend API.

## Componentes e Interfaces

### Archivo: `supabase/functions/send-email/templates.ts` (nuevo)

Contiene todas las funciones puras de renderizado. No depende de APIs de Deno.

```typescript
// Constantes de configuración
const DEFAULT_SITE_URL = 'https://synchrodev.cl'

// Función para obtener URLs de assets
function getAssetUrls(baseSiteUrl?: string): { logoUrl: string; poweredByUrl: string }

// Layout común
function wrapInLayout(content: string, baseSiteUrl?: string): string

// Renderizadores por tipo
function renderProjectAssignedEmail(data: ProjectAssignedData, baseSiteUrl?: string): string
function renderTaskAssignedEmail(data: TaskAssignedData, baseSiteUrl?: string): string
function renderPasswordResetEmail(data: PasswordResetData, baseSiteUrl?: string): string
function renderUserInvitedEmail(data: UserInvitedData, baseSiteUrl?: string): string

// Dispatcher
function renderEmail(type: EmailType, data: EmailData, baseSiteUrl?: string): string
```

### Archivo: `supabase/functions/send-email/index.ts` (modificado)

Se simplifica para importar las funciones de renderizado desde `templates.ts` y leer `PUBLIC_SITE_URL` desde `Deno.env`.

```typescript
import { renderEmail } from './templates.ts'

// En el handler:
const PUBLIC_SITE_URL = Deno.env.get('PUBLIC_SITE_URL')
const html = renderEmail(body.type, body.data, PUBLIC_SITE_URL)
```

### Archivo: `src/lib/utils/email-templates.ts` (eliminado)

Se elimina completamente. La Edge Function es la fuente única de verdad.

### Archivo: `src/lib/utils/__tests__/emailTemplates.property.test.ts` (actualizado)

Se actualiza para importar desde `supabase/functions/send-email/templates.ts` y validar el nuevo diseño (logotipo, gradiente, "powered by", etc.).


## Modelos de Datos

### Interfaces de datos (sin cambios funcionales)

Las interfaces de datos para cada tipo de correo se mantienen idénticas. Se mueven a `templates.ts`:

```typescript
interface ProjectAssignedData {
  recipientName: string
  projectName: string
  roles: string[]
  projectUrl: string
}

interface TaskAssignedData {
  recipientName: string
  taskName: string
  projectName: string
  priority: string
  taskUrl: string
}

interface PasswordResetData {
  recipientName: string
  code: string
}

interface UserInvitedData {
  recipientName: string
  inviteUrl: string
  roles: string[]
}

type EmailType = 'project_assigned' | 'task_assigned' | 'password_reset' | 'user_invited'
type EmailData = ProjectAssignedData | TaskAssignedData | PasswordResetData | UserInvitedData
```

### Estructura HTML del Layout Común (nuevo diseño)

```
┌─────────────────────────────────────────────┐
│ Fondo exterior: #f1f5f9                     │
│  ┌─────────────────────────────────────────┐│
│  │ Contenedor: blanco, border-radius: 12px ││
│  │ border: 1px solid #e2e8f0               ││
│  │                                         ││
│  │ ┌─────────────────────────────────────┐ ││
│  │ │ ENCABEZADO                          │ ││
│  │ │ Gradiente: #0f172a → #1e3a5f        │ ││
│  │ │ padding: 32px                       │ ││
│  │ │                                     │ ││
│  │ │   [Logo 120px max-width]            │ ││
│  │ │   "SynchroManage" 24px bold #fff    │ ││
│  │ │   "Gestión de Proyectos             │ ││
│  │ │    Inteligente" 13px #94a3b8        │ ││
│  │ └─────────────────────────────────────┘ ││
│  │                                         ││
│  │ ┌─────────────────────────────────────┐ ││
│  │ │ CONTENIDO                           │ ││
│  │ │ padding: 32px 24px                  │ ││
│  │ │ font-family: Segoe UI, Roboto...    │ ││
│  │ │                                     │ ││
│  │ │ Títulos: #0f172a                    │ ││
│  │ │ Párrafos: #334155                   │ ││
│  │ │                                     │ ││
│  │ │ [Botón CTA si aplica]              │ ││
│  │ │ Gradiente: #2563eb → #1d4ed8       │ ││
│  │ │ border-radius: 8px                 │ ││
│  │ │ padding: 14px 28px                 │ ││
│  │ └─────────────────────────────────────┘ ││
│  │                                         ││
│  │ ─────── separador #e2e8f0 ──────────── ││
│  │                                         ││
│  │ ┌─────────────────────────────────────┐ ││
│  │ │ PIE DE PÁGINA                       │ ││
│  │ │ fondo: #f8fafc, padding: 24px       │ ││
│  │ │                                     │ ││
│  │ │   [Powered By img 100px]            │ ││
│  │ │   "© 2025 SynchroManage.           │ ││
│  │ │    Todos los derechos reservados."  │ ││
│  │ │    12px #94a3b8                     │ ││
│  │ └─────────────────────────────────────┘ ││
│  └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

### Variable de entorno

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `PUBLIC_SITE_URL` | URL base pública para construir URLs de assets | `https://synchrodev.cl` |
| `RESEND_API_KEY` | Clave API de Resend (ya existente) | — |


## Propiedades de Corrección

*Una propiedad es una característica o comportamiento que debe cumplirse en todas las ejecuciones válidas de un sistema — esencialmente, una declaración formal sobre lo que el sistema debe hacer. Las propiedades sirven como puente entre especificaciones legibles por humanos y garantías de corrección verificables por máquina.*

### Propiedad 1: El encabezado contiene todos los elementos de branding

*Para cualquier* contenido y cualquier URL base, el HTML generado por `wrapInLayout()` debe contener en el encabezado: una imagen con `src` apuntando a `{baseSiteUrl}/logo/logotipo-v2.png`, `alt="SynchroManage"` y `max-width` de 120px; el texto "SynchroManage" con tamaño 24px, peso bold y color #ffffff; los colores de gradiente #0f172a y #1e3a5f; y el subtítulo "Gestión de Proyectos Inteligente" con color #94a3b8.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 6.1**

### Propiedad 2: La estructura del layout aplica los estilos de diseño correctos

*Para cualquier* contenido, el HTML generado por `wrapInLayout()` debe contener: fondo exterior #f1f5f9, contenedor principal con fondo #ffffff, border-radius 12px y borde #e2e8f0, font-family incluyendo 'Segoe UI', un separador con color #e2e8f0 entre contenido y pie de página, y fondo de pie de página #f8fafc con padding 24px.

**Validates: Requirements 2.1, 2.2, 2.3, 2.5, 3.3**

### Propiedad 3: El pie de página contiene imagen "Powered By" y copyright

*Para cualquier* URL base, el HTML generado por `wrapInLayout()` debe contener en el pie de página: una imagen con `src` apuntando a `{baseSiteUrl}/logo/powered-by.png`, `alt="Powered By"` y `max-width` de 100px; y el texto "© {año_actual} SynchroManage. Todos los derechos reservados." con tamaño 12px y color #94a3b8.

**Validates: Requirements 3.1, 3.2, 6.2**

### Propiedad 4: La plantilla project_assigned contiene todos los campos requeridos

*Para cualquier* `ProjectAssignedData` válido, el HTML generado debe contener: el nombre del destinatario, el nombre del proyecto, al menos uno de los roles asignados, la URL del proyecto en un enlace, el texto "Ver Proyecto", y un botón CTA con gradiente de #2563eb a #1d4ed8, border-radius 8px y padding 14px 28px.

**Validates: Requirements 4.1, 2.4**

### Propiedad 5: La plantilla task_assigned contiene todos los campos requeridos

*Para cualquier* `TaskAssignedData` válido, el HTML generado debe contener: el nombre del destinatario, el nombre de la tarea, el nombre del proyecto, la prioridad, la URL de la tarea en un enlace, el texto "Ver Tarea", y un botón CTA con gradiente de #2563eb a #1d4ed8, border-radius 8px y padding 14px 28px.

**Validates: Requirements 4.2, 2.4**

### Propiedad 6: La plantilla password_reset contiene campos y estilo de código correcto

*Para cualquier* `PasswordResetData` válido, el HTML generado debe contener: el nombre del destinatario, el código de verificación renderizado con fondo #eff6ff, borde 2px #bfdbfe, border-radius 8px, font-size 32px, font-weight bold, letter-spacing 8px, y el texto de expiración "15 minutos".

**Validates: Requirements 4.3, 4.5**

### Propiedad 7: La plantilla user_invited contiene todos los campos requeridos

*Para cualquier* `UserInvitedData` válido, el HTML generado debe contener: el nombre del destinatario, al menos uno de los roles asignados, la URL de invitación en un enlace, el texto "Aceptar Invitación", el texto de descarte ("Si no esperabas esta invitación"), y un botón CTA con gradiente de #2563eb a #1d4ed8, border-radius 8px y padding 14px 28px.

**Validates: Requirements 4.4, 2.4**

### Propiedad 8: Todo el CSS es inline (sin hojas de estilo externas)

*Para cualquier* tipo de correo y datos válidos, el HTML generado no debe contener etiquetas `<style>` ni `<link rel="stylesheet">`, garantizando compatibilidad con clientes de correo.

**Validates: Requirements 6.3**

### Propiedad 9: La URL base se propaga correctamente a las URLs de imágenes

*Para cualquier* URL base proporcionada, el HTML generado debe contener exactamente `{baseSiteUrl}/logo/logotipo-v2.png` como src del logotipo y `{baseSiteUrl}/logo/powered-by.png` como src de la imagen "powered by".

**Validates: Requirements 7.1, 7.3**

## Manejo de Errores

### Variable de entorno no configurada

- Si `PUBLIC_SITE_URL` no está definida, `getAssetUrls()` usa el valor por defecto `https://synchrodev.cl`. No se lanza error; los correos se envían con las URLs de producción.
- Si `RESEND_API_KEY` no está definida, se retorna HTTP 500 con mensaje descriptivo (comportamiento existente, sin cambios).

### Datos de plantilla inválidos

- El comportamiento existente de validación de `type` y `data` en el handler se mantiene sin cambios.
- Si `data.roles` es un array vacío, `roles.join(', ')` produce una cadena vacía. Esto es aceptable ya que la validación de roles ocurre en capas superiores.

### Imágenes no cargadas

- Los atributos `alt` en las imágenes (`alt="SynchroManage"`, `alt="Powered By"`) garantizan que el contenido sea legible cuando las imágenes están bloqueadas.
- El texto "SynchroManage" aparece tanto como imagen alt como texto explícito en el encabezado, proporcionando redundancia.

## Estrategia de Testing

### Enfoque dual: Tests unitarios + Tests de propiedad

Se utilizan ambos tipos de tests de forma complementaria:

- **Tests de propiedad (fast-check)**: Verifican las 9 propiedades de corrección definidas arriba, generando datos aleatorios para cubrir un amplio espacio de entradas. Mínimo 100 iteraciones por propiedad.
- **Tests unitarios (Vitest)**: Verifican casos específicos, edge cases y condiciones de error.

### Configuración de tests de propiedad

- **Librería**: `fast-check` (ya instalada en el proyecto)
- **Framework**: Vitest
- **Iteraciones**: Mínimo 100 por test (`{ numRuns: 100 }`)
- **Ubicación**: `src/lib/utils/__tests__/emailTemplates.property.test.ts` (actualizado)
- **Importación**: Desde `supabase/functions/send-email/templates.ts` (funciones puras, sin dependencias Deno)
- **Etiquetado**: Cada test debe incluir un comentario con formato: `Feature: email-template-redesign, Property {N}: {descripción}`

### Tests de propiedad planificados

| Test | Propiedad | Descripción |
|---|---|---|
| 1 | Propiedad 1 | Genera contenido aleatorio y URLs base, verifica elementos de branding en encabezado |
| 2 | Propiedad 2 | Genera contenido aleatorio, verifica estilos de layout (colores, bordes, tipografía, separador) |
| 3 | Propiedad 3 | Genera URLs base aleatorias, verifica "powered by" y copyright en pie de página |
| 4 | Propiedad 4 | Genera ProjectAssignedData aleatorio, verifica campos y botón CTA |
| 5 | Propiedad 5 | Genera TaskAssignedData aleatorio, verifica campos y botón CTA |
| 6 | Propiedad 6 | Genera PasswordResetData aleatorio, verifica campos y estilo del código |
| 7 | Propiedad 7 | Genera UserInvitedData aleatorio, verifica campos y botón CTA |
| 8 | Propiedad 8 | Genera HTML para todos los tipos, verifica ausencia de `<style>` y `<link>` |
| 9 | Propiedad 9 | Genera URLs base aleatorias, verifica que las URLs de imágenes usan la base correcta |

### Tests unitarios planificados

| Test | Descripción |
|---|---|
| 1 | URL base por defecto cuando `PUBLIC_SITE_URL` no está configurada (edge case, Req 7.2) |
| 2 | Archivo `src/lib/utils/email-templates.ts` no existe o está vacío (Req 5.3) |
| 3 | Snapshot de HTML para cada tipo de correo con datos fijos (regresión visual) |

### Cada propiedad de corrección DEBE ser implementada por UN SOLO test de propiedad

No se deben dividir las propiedades en múltiples tests. Cada test de propiedad corresponde exactamente a una propiedad del documento de diseño.
