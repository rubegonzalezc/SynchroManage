# CC-07112026 — Base sólida

**Proyecto:** SynchroManage  
**Control de cambios:** CC-07112026  
**Fecha de apertura:** 07/11/2026  
**Versión objetivo del producto:** `0.2.6`  
**Equipo:** Rubén González, José, Sebastián  
**Estado:** Planificado

## Épica

**Base sólida** — Cerrar los avisos de seguridad que ya vimos en Supabase y hacer que el plan de sprint en JSON se pueda sacar y volver a cargar, no solo crear.

## Qué queda fuera

Esto ya tiene su propio control de cambios:

| Tema | Dónde está |
|------|------------|
| Duplicar tarea, reacciones, filtro por fecha, `@Todos`, paginación, README | [CC-21082026](../cc-21082026/) |
| Rama y PR desde la tarea | [CC-22082026](../cc-22082026/) |
| Better Auth | [CC-23082026](../cc-23082026/), cerrado en `0.2.5` |
| Crear sprint pegando JSON | Hecho. Guía en [importar-sprint.md](../importar-sprint.md) |

## Relación con otros CC

| CC | Épica | Versión | Orden |
|----|-------|---------|-------|
| [CC-21082026](../cc-21082026/) | Operar sin fricción | `0.2.0` | En paralelo |
| **CC-07112026** | Base sólida | `0.2.6` | Este sprint |
| [CC-22082026](../cc-22082026/) | Conectar con Git | `0.3.0` | Después, sin bloqueo de este CC |

## Alcance

| Incluye | Excluye |
|---------|---------|
| RLS en `task_categories` | Reescribir todas las políticas del proyecto |
| Quitar ejecución pública de funciones sensibles | Volver a Supabase Auth |
| Ajustar políticas abiertas de sprints, bugs y `profiles` | Módulo nuevo de reportes |
| Descargar el sprint al mismo JSON del importador | Crear el PR desde SynchroManage |
| Reimportar y actualizar tareas ya cargadas | Paginación de tareas |

## Sprint

| Sprint | Tema | Documento | Puntos |
|--------|------|-----------|--------|
| **1** | Seguridad y plan de ida y vuelta | [sprint-01-seguridad-y-plan.md](./sprint-01-seguridad-y-plan.md) | ~29 pts |

## Demo de cierre

1. Un usuario anónimo no puede leer ni editar `task_categories` ni llamar `is_admin()`.
2. Un PM sigue viendo sus sprints y un developer sigue viendo sus tareas.
3. En el proyecto, **Descargar plan** genera el JSON.
4. Se cambia una descripción en ese JSON, se vuelve a importar y la tarea se actualiza, sin duplicarse.
