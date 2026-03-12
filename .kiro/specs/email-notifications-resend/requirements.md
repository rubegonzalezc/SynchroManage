# Documento de Requisitos: Notificaciones por Correo con Resend

## Introducción

Esta funcionalidad agrega el envío de correos electrónicos transaccionales al sistema de gestión de proyectos SynchroManage, utilizando el servicio Resend. Se implementará como una Supabase Edge Function que será invocada desde las API routes existentes. Los correos se enviarán cuando se asigne un proyecto o tarea a una persona responsable, y también se implementará un flujo de recuperación de contraseña mediante código de verificación enviado por correo.

## Glosario

- **Sistema**: La aplicación SynchroManage construida con Next.js y Supabase.
- **Servicio_Email**: Supabase Edge Function que se comunica con la API de Resend para enviar correos electrónicos.
- **Resend**: Proveedor externo de envío de correos electrónicos transaccionales.
- **Remitente**: Dirección de correo desde la cual se envían los emails: `no-reply@synchrodev.cl`.
- **Destinatario**: Usuario del sistema que recibe un correo electrónico en su dirección registrada en `profiles.email`.
- **Asignado**: Usuario que ha sido asignado a un proyecto (como PM, Tech Lead o miembro) o a una tarea (a través de `task_assignees`).
- **Código_Verificación**: Código numérico de 6 dígitos generado aleatoriamente, almacenado temporalmente para validar la identidad del usuario durante el flujo de recuperación de contraseña.
- **Tabla_Códigos_Verificación**: Tabla `password_reset_codes` que almacena los códigos de verificación con su fecha de expiración.
- **Plantilla_Email**: Estructura HTML del correo electrónico que incluye el contenido dinámico según el tipo de notificación.

## Requisitos

### Requisito 1: Edge Function para envío de correos con Resend

**Historia de Usuario:** Como sistema, quiero tener un servicio centralizado de envío de correos, para que todas las notificaciones por email se gestionen desde un único punto.

#### Criterios de Aceptación

1. THE Servicio_Email SHALL enviar correos electrónicos utilizando la API de Resend con la clave configurada en la variable de entorno `RESEND_API_KEY`.
2. THE Servicio_Email SHALL utilizar `no-reply@synchrodev.cl` como dirección del Remitente en todos los correos enviados.
3. THE Servicio_Email SHALL aceptar como parámetros: dirección del Destinatario, asunto del correo, tipo de notificación y datos dinámicos para la Plantilla_Email.
4. IF la API de Resend retorna un error, THEN THE Servicio_Email SHALL registrar el error en los logs y retornar un código de estado HTTP 500 con un mensaje descriptivo.
5. IF la dirección del Destinatario está vacía o tiene formato inválido, THEN THE Servicio_Email SHALL retornar un código de estado HTTP 400 sin intentar el envío.
6. THE Servicio_Email SHALL validar que el parámetro de tipo de notificación sea uno de los tipos soportados: `project_assigned`, `task_assigned`, `password_reset`.

### Requisito 2: Notificación por correo al asignar un proyecto

**Historia de Usuario:** Como PM o administrador, quiero que al asignar personas a un proyecto se les envíe un correo electrónico, para que estén informados de su asignación sin depender únicamente de las notificaciones internas.

#### Criterios de Aceptación

1. WHEN se crea un proyecto y se asigna un PM, THE Sistema SHALL invocar al Servicio_Email para enviar un correo al PM Asignado informando de su asignación al proyecto.
2. WHEN se crea un proyecto y se asigna un Tech Lead, THE Sistema SHALL invocar al Servicio_Email para enviar un correo al Tech Lead Asignado informando de su asignación al proyecto.
3. WHEN se crea un proyecto y se agregan miembros (desarrolladores o stakeholders), THE Sistema SHALL invocar al Servicio_Email para enviar un correo a cada miembro Asignado informando de su incorporación al proyecto.
4. THE Sistema SHALL incluir en el correo de asignación de proyecto: el nombre del proyecto, el rol asignado y un enlace directo al proyecto en la aplicación.
5. WHEN el usuario que crea el proyecto se asigna a sí mismo, THE Sistema SHALL omitir el envío de correo a ese usuario.
6. IF un mismo usuario aparece en múltiples roles del proyecto (por ejemplo, como PM y también como miembro debido a que es un usuario multirol), THEN THE Sistema SHALL enviar un único correo a ese usuario, consolidando los roles asignados, para evitar correos duplicados.

### Requisito 3: Notificación por correo al asignar una tarea

**Historia de Usuario:** Como PM, quiero que al asignar una tarea a desarrolladores se les envíe un correo electrónico, para que se enteren de la asignación de forma oportuna.

#### Criterios de Aceptación

1. WHEN se crea una tarea con asignados, THE Sistema SHALL invocar al Servicio_Email para enviar un correo a cada Asignado informando de la nueva tarea.
2. WHEN se actualiza una tarea y se agregan nuevos asignados, THE Sistema SHALL invocar al Servicio_Email para enviar un correo únicamente a los nuevos Asignados.
3. THE Sistema SHALL incluir en el correo de asignación de tarea: el nombre de la tarea, el nombre del proyecto al que pertenece, la prioridad y un enlace directo a la tarea en la aplicación.
4. WHEN el usuario que crea o actualiza la tarea se asigna a sí mismo, THE Sistema SHALL omitir el envío de correo a ese usuario.
5. IF un mismo usuario aparece múltiples veces como asignado (por ejemplo, por tener múltiples roles en el sistema), THEN THE Sistema SHALL enviar un único correo a ese usuario, deduplicando por ID de usuario antes del envío.

### Requisito 4: Recuperación de contraseña con código de verificación

**Historia de Usuario:** Como usuario, quiero poder recuperar mi contraseña mediante un código de verificación enviado a mi correo, para poder acceder a mi cuenta cuando olvide mi contraseña.

#### Criterios de Aceptación

1. WHEN un usuario solicita recuperar su contraseña proporcionando su correo electrónico, THE Sistema SHALL generar un Código_Verificación de 6 dígitos numéricos.
2. WHEN se genera un Código_Verificación, THE Sistema SHALL almacenarlo en la Tabla_Códigos_Verificación con una expiración de 15 minutos.
3. WHEN se genera un Código_Verificación, THE Sistema SHALL invocar al Servicio_Email para enviar el código al correo del usuario.
4. IF el correo proporcionado no corresponde a ningún usuario registrado, THEN THE Sistema SHALL responder con un mensaje genérico de éxito sin revelar si el correo existe o no en el sistema.
5. WHEN un usuario envía un Código_Verificación válido y no expirado, THE Sistema SHALL permitir al usuario establecer una nueva contraseña.
6. IF el Código_Verificación enviado es incorrecto o ha expirado, THEN THE Sistema SHALL retornar un mensaje de error indicando que el código es inválido o ha expirado.
7. WHEN un usuario solicita un nuevo Código_Verificación, THE Sistema SHALL invalidar cualquier código previo para ese usuario.
8. WHEN el usuario establece una nueva contraseña exitosamente, THE Sistema SHALL eliminar el Código_Verificación utilizado de la Tabla_Códigos_Verificación.

### Requisito 5: Plantillas de correo electrónico

**Historia de Usuario:** Como usuario, quiero recibir correos con un diseño profesional y contenido claro, para entender rápidamente la notificación recibida.

#### Criterios de Aceptación

1. THE Servicio_Email SHALL generar correos con contenido HTML que incluya el logotipo de SynchroManage, el contenido de la notificación y un pie de página con el nombre de la empresa.
2. THE Plantilla_Email para asignación de proyecto SHALL incluir: saludo con el nombre del Destinatario, nombre del proyecto, rol asignado y un botón con enlace al proyecto.
3. THE Plantilla_Email para asignación de tarea SHALL incluir: saludo con el nombre del Destinatario, nombre de la tarea, nombre del proyecto, prioridad de la tarea y un botón con enlace a la tarea.
4. THE Plantilla_Email para recuperación de contraseña SHALL incluir: saludo con el nombre del Destinatario, el Código_Verificación en formato destacado y una nota indicando que el código expira en 15 minutos.

### Requisito 6: Interfaz de recuperación de contraseña

**Historia de Usuario:** Como usuario, quiero tener una interfaz clara para solicitar la recuperación de mi contraseña y poder ingresar el código de verificación, para completar el proceso de forma sencilla.

#### Criterios de Aceptación

1. THE Sistema SHALL mostrar un enlace "¿Olvidaste tu contraseña?" en la página de inicio de sesión que dirija al flujo de recuperación.
2. WHEN el usuario accede al flujo de recuperación, THE Sistema SHALL mostrar un formulario solicitando el correo electrónico del usuario.
3. WHEN el usuario envía su correo electrónico, THE Sistema SHALL mostrar un formulario para ingresar el Código_Verificación de 6 dígitos.
4. WHEN el usuario ingresa un Código_Verificación válido, THE Sistema SHALL mostrar un formulario para establecer la nueva contraseña con campo de confirmación.
5. WHEN el usuario establece la nueva contraseña exitosamente, THE Sistema SHALL mostrar un mensaje de éxito y redirigir a la página de inicio de sesión.
6. IF ocurre un error en cualquier paso del flujo, THEN THE Sistema SHALL mostrar un mensaje de error descriptivo y permitir al usuario reintentar.
