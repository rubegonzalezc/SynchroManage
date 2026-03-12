# Documento de Requisitos: Rediseño de Plantillas de Correo Electrónico

## Introducción

SynchroManage utiliza correos electrónicos transaccionales para notificar a los usuarios sobre asignaciones de proyectos, tareas, restablecimiento de contraseñas e invitaciones. Actualmente, las plantillas de correo usan un diseño básico con un encabezado azul (#2563eb) y solo texto "SynchroManage", sin incluir el logotipo del proyecto ni reflejar la identidad visual de la aplicación.

Este rediseño busca alinear las plantillas de correo con el branding y diseño visual de SynchroManage: gradientes slate/blue, esquinas redondeadas, sombras sutiles, logotipo del proyecto y la imagen "powered by". Además, se debe eliminar la duplicación de plantillas que existe entre el lado Next.js (`src/lib/utils/email-templates.ts`) y la Edge Function de Supabase (`supabase/functions/send-email/index.ts`).

## Glosario

- **Edge_Function**: Función serverless de Supabase que ejecuta el envío de correos electrónicos vía la API de Resend. Ubicada en `supabase/functions/send-email/index.ts`.
- **Plantilla_de_Correo**: Código HTML inline que define la estructura visual y contenido de un correo electrónico transaccional.
- **Layout_Común**: Estructura HTML compartida (wrapper) que envuelve el contenido específico de cada tipo de correo, incluyendo encabezado, área de contenido y pie de página.
- **Logotipo**: Imagen del logotipo de SynchroManage ubicada en `/logo/logotipo-v2.png`, que se debe incluir en el encabezado de los correos.
- **Imagen_Powered_By**: Imagen "powered by" ubicada en `/logo/powered-by.png`, que se debe incluir en el pie de página de los correos.
- **URL_Base_Pública**: URL pública del proyecto desde la cual se sirven los assets estáticos (imágenes del logotipo y powered-by) accesibles por los clientes de correo.
- **Paleta_de_Diseño**: Conjunto de colores y estilos visuales del proyecto: gradientes de slate a blue, fondos claros (#f8fafc, #f1f5f9), acentos azules (#2563eb, #3b82f6), textos oscuros (#0f172a, #1e293b), bordes sutiles y esquinas redondeadas.
- **Correo_Transaccional**: Correo enviado automáticamente en respuesta a una acción del usuario (asignación, invitación, restablecimiento de contraseña).
- **Resend**: Servicio externo de envío de correos electrónicos utilizado por la Edge_Function.

## Requisitos

### Requisito 1: Encabezado con logotipo y branding

**Historia de Usuario:** Como usuario de SynchroManage, quiero que los correos electrónicos incluyan el logotipo del proyecto en el encabezado, para que los correos sean fácilmente reconocibles como comunicaciones oficiales de la plataforma.

#### Criterios de Aceptación

1. THE Layout_Común SHALL incluir una imagen del Logotipo en el encabezado del correo, referenciada mediante la URL_Base_Pública, con un ancho máximo de 120px y texto alternativo "SynchroManage".
2. THE Layout_Común SHALL mostrar el texto "SynchroManage" debajo del Logotipo en el encabezado con un tamaño de fuente de 24px, peso bold y color blanco (#ffffff).
3. THE Layout_Común SHALL aplicar un fondo con gradiente de slate oscuro (#0f172a) a azul (#1e3a5f) en el encabezado del correo.
4. THE Layout_Común SHALL mostrar el subtítulo "Gestión de Proyectos Inteligente" debajo del nombre del proyecto en el encabezado con un tamaño de fuente de 13px y color gris claro (#94a3b8).

### Requisito 2: Diseño visual alineado con la identidad del proyecto

**Historia de Usuario:** Como usuario de SynchroManage, quiero que los correos electrónicos reflejen el diseño visual de la aplicación, para tener una experiencia de marca consistente entre la plataforma y las comunicaciones por correo.

#### Criterios de Aceptación

1. THE Layout_Común SHALL usar un fondo exterior de color #f1f5f9 (slate-100) para el cuerpo del correo.
2. THE Layout_Común SHALL usar un contenedor principal de fondo blanco (#ffffff) con esquinas redondeadas de 12px y un borde sutil de color #e2e8f0.
3. THE Layout_Común SHALL aplicar estilos de tipografía con la familia de fuentes 'Segoe UI', Roboto, Arial, sans-serif y colores de texto #0f172a para títulos y #334155 para párrafos.
4. WHEN una Plantilla_de_Correo contiene un botón de acción (CTA), THE Layout_Común SHALL renderizar el botón con fondo gradiente de #2563eb a #1d4ed8, color de texto blanco, esquinas redondeadas de 8px y padding de 14px vertical por 28px horizontal.
5. THE Layout_Común SHALL incluir un separador visual (línea horizontal) de color #e2e8f0 entre el área de contenido y el pie de página.

### Requisito 3: Pie de página con imagen "Powered By" y copyright

**Historia de Usuario:** Como propietario del proyecto, quiero que los correos incluyan la imagen "powered by" y el aviso de copyright en el pie de página, para mantener la atribución de marca consistente.

#### Criterios de Aceptación

1. THE Layout_Común SHALL incluir la Imagen_Powered_By en el pie de página, referenciada mediante la URL_Base_Pública, con un ancho máximo de 100px y texto alternativo "Powered By".
2. THE Layout_Común SHALL mostrar el texto de copyright "© {año_actual} SynchroManage. Todos los derechos reservados." en el pie de página con tamaño de fuente 12px y color #94a3b8.
3. THE Layout_Común SHALL aplicar un fondo de color #f8fafc al pie de página con padding de 24px.

### Requisito 4: Actualización de las cuatro plantillas de correo

**Historia de Usuario:** Como usuario de SynchroManage, quiero que todos los tipos de correo transaccional (asignación de proyecto, asignación de tarea, restablecimiento de contraseña e invitación) utilicen el nuevo diseño, para tener una experiencia visual consistente en todas las comunicaciones.

#### Criterios de Aceptación

1. THE Plantilla_de_Correo de tipo "project_assigned" SHALL usar el nuevo Layout_Común y mantener los campos: nombre del destinatario, nombre del proyecto, roles asignados y botón "Ver Proyecto".
2. THE Plantilla_de_Correo de tipo "task_assigned" SHALL usar el nuevo Layout_Común y mantener los campos: nombre del destinatario, nombre de la tarea, nombre del proyecto, prioridad y botón "Ver Tarea".
3. THE Plantilla_de_Correo de tipo "password_reset" SHALL usar el nuevo Layout_Común y mantener los campos: nombre del destinatario, código de verificación con estilo destacado y texto de expiración.
4. THE Plantilla_de_Correo de tipo "user_invited" SHALL usar el nuevo Layout_Común y mantener los campos: nombre del destinatario, roles asignados, botón "Aceptar Invitación" y texto de descarte.
5. WHEN la Plantilla_de_Correo de tipo "password_reset" muestra el código de verificación, THE Plantilla_de_Correo SHALL renderizar el código con fondo #eff6ff, borde de 2px color #bfdbfe, esquinas redondeadas de 8px, tamaño de fuente 32px, peso bold y espaciado entre letras de 8px.

### Requisito 5: Eliminación de duplicación de plantillas

**Historia de Usuario:** Como desarrollador, quiero que las plantillas de correo existan en un solo lugar dentro de la Edge Function, para evitar inconsistencias y facilitar el mantenimiento.

#### Criterios de Aceptación

1. THE Edge_Function SHALL contener las funciones de renderizado de las cuatro Plantillas_de_Correo con el nuevo diseño como fuente única de verdad.
2. WHEN se actualiza el diseño de las plantillas, THE Edge_Function SHALL ser el único archivo que requiere modificación para los templates HTML.
3. THE archivo `src/lib/utils/email-templates.ts` SHALL ser eliminado o vaciado, dado que la Edge_Function es autocontenida y no comparte código con el lado Next.js.

### Requisito 6: Accesibilidad de imágenes en clientes de correo

**Historia de Usuario:** Como usuario que lee correos en distintos clientes de correo, quiero que los correos se vean correctamente incluso cuando las imágenes no se cargan, para poder entender el contenido del correo en cualquier circunstancia.

#### Criterios de Aceptación

1. WHEN un cliente de correo bloquea la carga de imágenes, THE Layout_Común SHALL mostrar el texto alternativo "SynchroManage" en lugar del Logotipo, manteniendo la legibilidad del encabezado.
2. WHEN un cliente de correo bloquea la carga de imágenes, THE Layout_Común SHALL mostrar el texto alternativo "Powered By" en lugar de la Imagen_Powered_By en el pie de página.
3. THE Layout_Común SHALL usar estilos CSS inline en todos los elementos HTML para garantizar compatibilidad con clientes de correo que no soportan hojas de estilo externas.

### Requisito 7: Configuración de URL base para assets

**Historia de Usuario:** Como desarrollador, quiero que la URL base para los assets de imágenes sea configurable, para poder desplegar en distintos entornos sin modificar el código de las plantillas.

#### Criterios de Aceptación

1. THE Edge_Function SHALL leer la URL_Base_Pública desde una variable de entorno para construir las URLs de las imágenes del Logotipo y la Imagen_Powered_By.
2. IF la variable de entorno de URL_Base_Pública no está configurada, THEN THE Edge_Function SHALL usar una URL por defecto que apunte al dominio de producción de SynchroManage.
3. THE Edge_Function SHALL construir las URLs de imágenes concatenando la URL_Base_Pública con las rutas relativas `/logo/logotipo-v2.png` y `/logo/powered-by.png`.
