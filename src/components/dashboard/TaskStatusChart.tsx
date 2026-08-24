'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Box, Typography } from '@mui/material'
import { appleChart, getChartItemStyle, getChartTooltipStyle } from '@/theme/chartTheme'
import { useTheme } from '@/components/theme-provider'

interface Props {
  done: number
  inProgress: number
  review: number
  pending: number
  backlog: number
}

const COLORS = [appleChart.green, appleChart.blue, appleChart.purple, appleChart.orange, appleChart.gray]

export function TaskStatusChart({ done, inProgress, review, pending, backlog }: Props) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const data = [
    { name: 'Completadas', value: done },
    { name: 'En Progreso', value: inProgress },
    { name: 'En Revisión', value: review },
    { name: 'Por Hacer', value: pending },
    { name: 'Backlog', value: backlog },
  ].filter(d => d.value > 0)

  const total = data.reduce((s, d) => s + d.value, 0)

  if (data.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 8, textAlign: 'center' }}>
        Sin datos
      </Typography>
    )
  }

  return (
    <Box>
      <Box sx={{ position: 'relative', height: 210, width: '100%', minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={88}
              paddingAngle={4}
              cornerRadius={6}
              dataKey="value"
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={getChartTooltipStyle(isDark)}
              itemStyle={getChartItemStyle(isDark)}
              cursor={false}
            />
          </PieChart>
        </ResponsiveContainer>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography sx={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1 }}>
            {total}
          </Typography>
          <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.25 }}>tareas</Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1.25, mt: 0.5 }}>
        {data.map((d, i) => (
          <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: COLORS[i % COLORS.length] }} />
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{d.name}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
