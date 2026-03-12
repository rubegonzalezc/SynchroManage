# Plan de Implementación: Rediseño de Plantillas de Correo Electrónico

## Visión General

Extraer las funciones de renderizado de plantillas a un módulo independiente (`templates.ts`), rediseñar el layout y las 4 plantillas con el nuevo branding (gradiente, logotipo, "powered by"), eliminar el archivo duplicado en `src/`, y actualizar los tests de propiedad para importar desde la nueva ubicación.

## Tareas

- [x] 1. Crear módulo de plantillas con interfaces y layout común
  - [x] 1.1 Crear `supabase/functions/send-email/templates.ts` con interfaces de datos y constantes
    - Definir las interfaces `ProjectAssignedData`, `TaskAssignedData`, `PasswordResetData`, `UserInvitedData`, `EmailType`, `EmailData`
    - Definir la constante `DEFAULT_SITE_URL = 'https://synchrodev.cl'`
    - Implementar `getAssetUrls(baseSiteUrl?: string)` que retorna `logoUrl` y `poweredByUrl` usando la URL base o el valor por defecto
    - Exportar todas las interfaces y funciones
    - _Requisitos: 7.1, 7.2, 7.3_

  - [x] 1.2 Implementar `wrapInLayout()` con el nuevo diseño de branding
    - Fondo exterior `#f1f5f9`, contenedor blanco con `border-radius: 12px` y borde `#e2e8f0`
    - Encabezado con gradiente `#0f172a → #1e3a5f`, imagen del logotipo (120px max-width, `alt="SynchroManage"`), texto "SynchroManage" (24px, bold, `#ffffff`), subtítulo "Gestión de Proyectos Inteligente" (13px, `#94a3b8`)
    - Área de contenido con `font-family: 'Segoe UI', Roboto, Arial, sans-serif`, títulos `#0f172a`, párrafos `#334155`
    - Separador `#e2e8f0` entre contenido y pie de página
    - Pie de página con fondo `#f8fafc`, padding 24px, imagen "Powered By" (100px max-width, `alt="Powered By"`), copyright dinámico con año actual (12px, `#94a3b8`)
    - Todo CSS inline, sin etiquetas `<style>` ni `<link>`
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.5, 3.1, 3.2, 3.3, 6.1, 6.2, 6.3_

  - [ ]* 1.3 Escribir test de propiedad para el encabezado del layout
    - **Propiedad 1: El encabezado contiene todos los elementos de branding**
    - **Valida: Requisitos 1.1, 1.2, 1.3, 1.4, 6.1**

  - [ ]* 1.4 Escribir test de propiedad para la estructura del layout
    - **Propiedad 2: La estructura del layout aplica los estilos de diseño correctos**
    - **Valida: Requisitos 2.1, 2.2, 2.3, 2.5, 3.3**

  - [ ]* 1.5 Escribir test de propiedad para el pie de página
    - **Propiedad 3: El pie de página contiene imagen "Powered By" y copyright**
    - **Valida: Requisitos 3.1, 3.2, 6.2**

- [x] 2. Implementar las cuatro plantillas de correo con nuevo diseño
  - [x] 2.1 Implementar `renderProjectAssignedEmail()` con botón CTA gradiente
    - Mantener campos: nombre del destinatario, nombre del proyecto, roles, botón "Ver Proyecto"
    - Botón con gradiente `#2563eb → #1d4ed8`, `border-radius: 8px`, padding `14px 28px`
    - _Requisitos: 4.1, 2.4_

  - [x] 2.2 Implementar `renderTaskAssignedEmail()` con botón CTA gradiente
    - Mantener campos: nombre del destinatario, nombre de la tarea, nombre del proyecto, prioridad, botón "Ver Tarea"
    - Botón con gradiente `#2563eb → #1d4ed8`, `border-radius: 8px`, padding `14px 28px`
    - _Requisitos: 4.2, 2.4_

  - [x] 2.3 Implementar `renderPasswordResetEmail()` con estilo de código actualizado
    - Mantener campos: nombre del destinatario, código de verificación, texto de expiración "15 minutos"
    - Código con fondo `#eff6ff`, borde `2px #bfdbfe`, `border-radius: 8px`, `font-size: 32px`, `font-weight: bold`, `letter-spacing: 8px`
    - _Requisitos: 4.3, 4.5_

  - [x] 2.4 Implementar `renderUserInvitedEmail()` con botón CTA gradiente
    - Mantener campos: nombre del destinatario, roles, botón "Aceptar Invitación", texto de descarte
    - Botón con gradiente `#2563eb → #1d4ed8`, `border-radius: 8px`, padding `14px 28px`
    - _Requisitos: 4.4, 2.4_

  - [x] 2.5 Implementar `renderEmail()` como dispatcher de tipos
    - Recibir `type`, `data` y `baseSiteUrl` opcional
    - Delegar al renderizador correspondiente según el tipo
    - Exportar la función
    - _Requisitos: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 2.6 Escribir test de propiedad para plantilla project_assigned
    - **Propiedad 4: La plantilla project_assigned contiene todos los campos requeridos**
    - **Valida: Requisitos 4.1, 2.4**

  - [ ]* 2.7 Escribir test de propiedad para plantilla task_assigned
    - **Propiedad 5: La plantilla task_assigned contiene todos los campos requeridos**
    - **Valida: Requisitos 4.2, 2.4**

  - [ ]* 2.8 Escribir test de propiedad para plantilla password_reset
    - **Propiedad 6: La plantilla password_reset contiene campos y estilo de código correcto**
    - **Valida: Requisitos 4.3, 4.5**

  - [ ]* 2.9 Escribir test de propiedad para plantilla user_invited
    - **Propiedad 7: La plantilla user_invited contiene todos los campos requeridos**
    - **Valida: Requisitos 4.4, 2.4**

- [x] 3. Checkpoint - Verificar que el módulo de plantillas está completo
  - Asegurarse de que todos los tests pasan, preguntar al usuario si surgen dudas.

- [x] 4. Integrar módulo de plantillas en la Edge Function y eliminar duplicado
  - [x] 4.1 Actualizar `supabase/functions/send-email/index.ts` para importar desde `templates.ts`
    - Importar `renderEmail` desde `./templates.ts`
    - Leer `PUBLIC_SITE_URL` desde `Deno.env.get('PUBLIC_SITE_URL')`
    - Pasar `PUBLIC_SITE_URL` a `renderEmail()`
    - Eliminar las funciones de renderizado, interfaces y `wrapInLayout()` del archivo `index.ts`
    - Mantener la lógica del handler HTTP, validación y llamada a Resend API
    - _Requisitos: 5.1, 5.2, 7.1_

  - [x] 4.2 Eliminar `src/lib/utils/email-templates.ts`
    - Borrar el archivo duplicado
    - _Requisitos: 5.3_

  - [ ]* 4.3 Escribir test de propiedad para CSS inline
    - **Propiedad 8: Todo el CSS es inline (sin hojas de estilo externas)**
    - **Valida: Requisitos 6.3**

  - [ ]* 4.4 Escribir test de propiedad para propagación de URL base
    - **Propiedad 9: La URL base se propaga correctamente a las URLs de imágenes**
    - **Valida: Requisitos 7.1, 7.3**

- [x] 5. Actualizar tests de propiedad existentes
  - [x] 5.1 Actualizar imports en `src/lib/utils/__tests__/emailTemplates.property.test.ts`
    - Cambiar imports de `../email-templates` a `../../../../supabase/functions/send-email/templates`
    - Agregar import de `renderUserInvitedEmail` y `UserInvitedData` (faltaba en los tests originales)
    - Agregar import de `wrapInLayout` para los tests de layout
    - Actualizar las aserciones existentes para verificar los nuevos elementos de branding (logotipo, gradiente, "powered by")
    - _Requisitos: 5.2, 5.3_

  - [ ]* 5.2 Escribir tests unitarios para edge cases
    - Test: URL base por defecto cuando `baseSiteUrl` es `undefined`
    - Test: Verificar que `src/lib/utils/email-templates.ts` no existe (Req 5.3)
    - _Requisitos: 7.2, 5.3_

- [x] 6. Checkpoint final - Verificar integración completa
  - Asegurarse de que todos los tests pasan, preguntar al usuario si surgen dudas.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Los tests de propiedad validan propiedades universales de corrección
- Los tests unitarios validan ejemplos específicos y edge cases
