# CC-21082026 — Operar sin fricción

**Proyecto:** SynchroManage  
**Control de cambios:** CC-21082026  
**Fecha de apertura:** 21/08/2026  
**Equipo:** Rubén González, José, Sebastián  
**Estado:** Planificado

## Épica

**Operar sin fricción** — Reducir fricción en el día a día del equipo (duplicar, reaccionar, filtrar) y preparar el producto para escala y reporting accionable.

Esta iniciativa continúa el trabajo de los sprints 1–3 ([dependencias](../sprints/sprint-01-dependencias.md), [organización por sprint](../sprints/sprint-02-organizacion-por-sprint.md), [productividad y calidad](../sprints/sprint-03-productividad-y-calidad.md)) sin duplicar lo ya entregado (filtros Kanban básicos, `@Todos`, burndown, búsqueda global, etc.).

## Alcance del control de cambios

| Incluye | Excluye |
|---------|---------|
| Duplicar tareas | Módulo de tickets / helpdesk |
| Reacciones en comentarios | Nuevo módulo de soporte |
| Filtro por fecha límite en Kanban | Rehacer filtros Kanban existentes |
| Paridad `@Todos` en Mis Tareas | |
| Paginación y rendimiento en listas grandes | |
| Export de tareas por sprint/proyecto | |

## Sprints

| Sprint | Tema | Documento | Puntos |
|--------|------|-----------|--------|
| **1** | Madurez operativa | [sprint-01-madurez-operativa.md](./sprint-01-madurez-operativa.md) | ~28 pts |
| **2** | Escala y rendimiento | [sprint-02-escala-y-rendimiento.md](./sprint-02-escala-y-rendimiento.md) | ~31 pts |
| **3** | Reporting accionable | [sprint-03-reporting-accionable.md](./sprint-03-reporting-accionable.md) | ~26 pts |

**Total estimado:** ~85 pts · **3 sprints** (~2 semanas cada uno, 3 desarrolladores).

## Orden de ejecución

1. **Sprint 1** — Valor inmediato para PM y equipo (duplicar, reacciones, filtro fecha).
2. **Sprint 2** — Escala cuando los proyectos crecen (paginación, carga optimizada).
3. **Sprint 3** — Reporting para ceremonias y stakeholders (export tareas, comparativas).

## Definition of Done (global)

- Funcionalidades probadas en roles PM, Tech Lead y Developer.
- Mensajes y etiquetas en español.
- Validación server-side donde aplique reglas de negocio.
- Build sin errores; sin regresiones en Kanban, tareas, bugs y búsqueda.
- Revisión de código entre pares.

## Demo de cierre (CC completo)

1. Duplicar una HU desde el detalle → editar y guardar.
2. Reaccionar con 👍 a un comentario en tarea y en proyecto.
3. Filtrar Kanban por tareas vencidas.
4. Abrir proyecto con 100+ tareas → lista paginada fluida.
5. Exportar CSV del sprint activo desde el proyecto.
