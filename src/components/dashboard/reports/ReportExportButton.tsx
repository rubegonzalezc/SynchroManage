'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDown, FileText, Loader2 } from 'lucide-react'

interface UserStat {
  user: { id: string; full_name: string; role: string }
  done: number; pending: number; in_progress: number
  review: number; backlog: number; carry_over: number; total: number
  bugs_open: number; bugs_in_progress: number; bugs_resolved: number; bugs_total: number
}

interface GlobalTotals {
  done: number; in_progress: number; review: number
  pending: number; backlog: number; carry_over: number
}

interface BugTotals {
  open: number; in_progress: number; resolved: number; closed: number; total: number
}

interface ReportExportButtonProps {
  stats: UserStat[]
  globalTotals: GlobalTotals
  bugTotals: BugTotals
  dateFrom?: string
  dateTo?: string
}

const roleLabels: Record<string, string> = {
  admin: 'Admin', pm: 'PM', tech_lead: 'Tech Lead',
  developer: 'Developer', stakeholder: 'Stakeholder',
}

export function ReportExportButton({ stats, globalTotals, bugTotals, dateFrom, dateTo }: ReportExportButtonProps) {
  const [loadingCsv, setLoadingCsv] = useState(false)
  const [loadingPdf, setLoadingPdf] = useState(false)

  const dateLabel = dateFrom && dateTo
    ? `${dateFrom} al ${dateTo}`
    : dateFrom ? `desde ${dateFrom}` : dateTo ? `hasta ${dateTo}` : 'Todo el período'

  function exportCSV() {
    setLoadingCsv(true)
    try {
      const headers = ['Usuario', 'Rol', 'Total', 'Hechas', 'En Progreso', 'Revisión', 'Por Hacer', 'Backlog', 'Carry Over', 'Bugs Abiertos', 'Bugs En Curso', 'Bugs Resueltos', 'Total Bugs']
      const rows = stats.map(s => [
        s.user.full_name,
        roleLabels[s.user.role] || s.user.role,
        s.total,
        s.done,
        s.in_progress,
        s.review,
        s.pending,
        s.backlog,
        s.carry_over,
        s.bugs_open,
        s.bugs_in_progress,
        s.bugs_resolved,
        s.bugs_total,
      ])

      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n')

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte-tareas-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoadingCsv(false)
    }
  }

  async function exportPDF() {
    setLoadingPdf(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

      // Header
      doc.setFontSize(18)
      doc.setTextColor(30, 30, 30)
      doc.text('Reporte General del Sistema', 14, 18)

      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(`Período: ${dateLabel}`, 14, 26)
      doc.text(`Generado: ${new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}`, 14, 32)

      // Global task summary
      doc.setFontSize(12)
      doc.setTextColor(30, 30, 30)
      doc.text('Resumen Global de Tareas', 14, 42)

      autoTable(doc, {
        startY: 46,
        head: [['Completadas', 'En Progreso', 'En Revisión', 'Por Hacer', 'Backlog', 'Carry Over']],
        body: [[
          globalTotals.done,
          globalTotals.in_progress,
          globalTotals.review,
          globalTotals.pending,
          globalTotals.backlog,
          globalTotals.carry_over,
        ]],
        styles: { fontSize: 10, halign: 'center' },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        margin: { left: 14, right: 14 },
      })

      // Bug summary
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const afterTaskSummary = (doc as any).lastAutoTable.finalY + 8

      doc.setFontSize(12)
      doc.text('Resumen de Bugs', 14, afterTaskSummary)

      autoTable(doc, {
        startY: afterTaskSummary + 4,
        head: [['Abiertos', 'En Progreso', 'Resueltos', 'Cerrados', 'Total']],
        body: [[bugTotals.open, bugTotals.in_progress, bugTotals.resolved, bugTotals.closed, bugTotals.total]],
        styles: { fontSize: 10, halign: 'center' },
        headStyles: { fillColor: [239, 68, 68], textColor: 255 },
        margin: { left: 14, right: 14 },
      })

      // Per-user detail
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const afterBugSummary = (doc as any).lastAutoTable.finalY + 8

      doc.setFontSize(12)
      doc.text('Detalle por Usuario', 14, afterBugSummary)

      autoTable(doc, {
        startY: afterBugSummary + 4,
        head: [['Usuario', 'Rol', 'Total', 'Hechas', 'En Progreso', 'Revisión', 'Por Hacer', 'Backlog', 'Carry Over', 'Bugs']],
        body: stats.map(s => [
          s.user.full_name,
          roleLabels[s.user.role] || s.user.role,
          s.total,
          s.done,
          s.in_progress,
          s.review,
          s.pending,
          s.backlog,
          s.carry_over,
          s.bugs_total,
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 30, 30], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: { 0: { cellWidth: 45 }, 1: { cellWidth: 22 } },
        margin: { left: 14, right: 14 },
      })

      doc.save(`reporte-general-${new Date().toISOString().slice(0, 10)}.pdf`)
    } finally {
      setLoadingPdf(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={exportCSV}
        disabled={loadingCsv || stats.length === 0}
        className="gap-1.5"
      >
        {loadingCsv ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
        CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={exportPDF}
        disabled={loadingPdf || stats.length === 0}
        className="gap-1.5"
      >
        {loadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
        PDF
      </Button>
    </div>
  )
}
