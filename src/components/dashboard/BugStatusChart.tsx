'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Box, Typography } from '@mui/material'
import { appleChart, getChartTooltipStyle } from '@/theme/chartTheme'
import { useTheme } from '@/components/theme-provider'

interface Props {
  open: number
  inProgress: number
  resolved: number
  closed: number
}

const COLORS = [appleChart.red, appleChart.blue, appleChart.green, appleChart.gray]

export function BugStatusChart({ open, inProgress, resolved, closed }: Props) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const data = [
    { name: 'Abiertos', value: open },
    { name: 'En Progreso', value: inProgress },
    { name: 'Resueltos', value: resolved },
    { name: 'Cerrados', value: closed },
  ].filter(d => d.value > 0)

  const total = data.reduce((s, d) => s + d.value, 0)

  if (data.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 8 }}>
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
              itemStyle={{ color: isDark ? '#F5F5F7' : '#1C1C1E' }}
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
          <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.25 }}>bugs</Typography>
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
