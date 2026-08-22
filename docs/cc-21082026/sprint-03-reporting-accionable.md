# Sprint 3 — Reporting accionable

**Control de cambios:** CC-21082026  
**Proyecto:** SynchroManage  
**Duración sugerida:** 2 semanas  
**Equipo:** 3 desarrolladores  
**Depende de:** Sprint 2 de CC-21082026 (recomendado para export de listas grandes)

| Desarrollador | Perfil | Rol en el sprint |
|---------------|--------|------------------|
| **Rubén González** | Senior | API export, queries agregadas, revisión |
| **José** | Frontend | UI export, gráficos comparativos |
| **Sebastián** | Fullstack | PDF, pruebas, integración reportes |

## Objetivo del sprint

Permitir **exportar y comparar** el trabajo del sprint para ceremonias, PM y stakeholders, más allá de las estadísticas por usuario que ya ofrece `/dashboard/reports`.

**Épica:** *Operar sin fricción*

---

## Definition of Done (DoD)

- Export CSV descargable con datos correctos del sprint filtrado.
- Permisos: Admin y PM (export); Tech Lead lectura según política actual de reportes.
- Etiquetas y encabezados CSV en español.
- Revisión de código entre pares.

---

## Capacidad estimada

| Desarrollador | Puntos asignados |
|---------------|------------------|
| Rubén González | ~10 pts |
| José | ~8 pts |
| Sebastián | ~8 pts |
| **Total** | **~26 pts** |

---

## Escala de prioridades

| Prioridad | Significado | Criterio |
|-----------|-------------|----------|
| **P0 — Crítica** | Obligatoria | Sin esto el sprint no cumple su objetivo |
| **P1 — Alta** | Muy importante | Core del sprint |
| **P2 — Media** | Importante | Recortable si falta tiempo |
| **P3 — Baja** | Deseable | Stretch goal |

### Resumen de prioridades

| HU | Título | Prioridad | Puntos | Asignado |
|----|--------|-----------|--------|----------|
| HU-01 | API export CSV de tareas por sprint/proyecto | **P0** | 8 | Rubén González |
| HU-02 | Botón export en detalle de proyecto y sprint | **P1** | 5 | José |
| HU-03 | Comparativa de velocity entre sprints | **P1** | 5 | José |
| HU-04 | Export PDF resumen de sprint | **P2** | 5 | Sebastián |
| HU-05 | Documentación de reporting en README | **P2** | 2 | Sebastián |
| HU-06 | Pruebas export y permisos | **P2** | 3 | Sebastián |

---

## Historias de usuario

### HU-01 — API export CSV de tareas por sprint/proyecto

**Como** PM  
**Quiero** descargar un CSV con las tareas de un sprint o proyecto  
**Para** compartir avance fuera del sistema  

**Criterios de aceptación:**
- `GET /api/dashboard/projects/[id]/export/tasks?format=csv&sprint_id=...` (o query equivalente).
- Columnas mínimas: `#global`, `Sprint · HU-N`, título, estado, prioridad, categoría, asignados, fecha límite, carry over.
- Respeta permisos del usuario (solo proyectos visibles).
- Filename sugerido: `{proyecto}-sprint-{n}-tareas.csv`.
- UTF-8 con BOM para Excel en español.

**Puntos:** 8  
**Prioridad:** P0 — Crítica  
**Asignado:** Rubén González

---

### HU-02 — Botón export en detalle de proyecto y sprint

**Como** PM  
**Quiero** un botón visible para exportar el sprint actual  
**Para** no memorizar URLs de API  

**Criterios de aceptación:**
- Botón **Exportar CSV** en header del proyecto o `SprintHeader` (sprint activo/seleccionado).
- Opciones: **Sprint actual** / **Todo el proyecto** (si aplica).
- Feedback: loading + toast éxito/error.
- Visible para roles Admin y PM; Tech Lead si ya tiene acceso a reportes.

**Puntos:** 5  
**Prioridad:** P1 — Alta  
**Asignado:** José  
**Depende de:** HU-01

---

### HU-03 — Comparativa de velocity entre sprints

**Como** Tech Lead  
**Quiero** ver velocity de varios sprints en un mismo gráfico  
**Para** estimar mejor el siguiente sprint  

**Criterios de aceptación:**
- Extender `SprintAnalytics` o vista de proyecto: gráfico de barras con tareas completadas por sprint (últimos N sprints, ej. 6).
- Datos alineados con API `sprints/[id]/analytics` existente.
- Leyenda y tooltips en español.
- Funciona en proyecto con al menos 2 sprints cerrados o activos.

**Puntos:** 5  
**Prioridad:** P1 — Alta  
**Asignado:** José  
**Depende de:** Ninguna (extiende analytics existente)

---

### HU-04 — Export PDF resumen de sprint

**Como** PM  
**Quiero** un PDF con resumen del sprint  
**Para** enviar a stakeholders sin acceso al sistema  

**Criterios de aceptación:**
- PDF incluye: nombre proyecto/sprint, fechas, % completado, conteo por estado, lista breve de tareas pendientes (top 10).
- Generación client-side o server-side (reutilizar patrón de `ReportExportButton` si existe).
- Descarga con un clic desde el mismo menú que CSV.
- Diseño legible en A4, logo/nombre SynchroManage opcional.

**Puntos:** 5  
**Prioridad:** P2 — Media  
**Asignado:** Sebastián  
**Depende de:** HU-01

---

### HU-05 — Documentación de reporting en README

**Como** equipo  
**Quiero** documentar exports y gráficos nuevos  
**Para** soporte y onboarding  

**Criterios de aceptación:**
- Sección en README: cómo exportar CSV/PDF, quién puede, columnas del CSV.
- Referencia a `/dashboard/reports` vs export por proyecto.
- Enlace a `docs/cc-21082026/`.

**Puntos:** 2  
**Prioridad:** P2 — Media  
**Asignado:** Sebastián  
**Depende de:** HU-01, HU-04

---

### HU-06 — Pruebas export y permisos

**Como** equipo  
**Quiero** validar que export respeta permisos y formato  
**Para** no filtrar datos a roles no autorizados  

**Criterios de aceptación:**
- Test: Developer sin acceso recibe 403 en export.
- Test: CSV contiene encabezados esperados y filas del sprint filtrado.
- Test manual documentado: export sprint con carry over y HU-N.

**Puntos:** 3  
**Prioridad:** P2 — Media  
**Asignado:** Sebastián  
**Depende de:** HU-01, HU-02

---

## Orden de ejecución recomendado

| Orden | HU | Responsable |
|-------|-----|-------------|
| 1 | HU-01 | Rubén González |
| 2 | HU-02 | José |
| 3 | HU-03 | José |
| 4 | HU-04 | Sebastián |
| 5 | HU-06 | Sebastián |
| 6 | HU-05 | Sebastián |

---

## Demo del sprint

1. En proyecto activo → **Exportar CSV** del sprint → abrir en Excel con tildes correctos.
2. Ver gráfico de velocity de los últimos sprints.
3. Descargar **PDF resumen** y compartir por email.
4. Developer sin permiso no puede exportar (403).
