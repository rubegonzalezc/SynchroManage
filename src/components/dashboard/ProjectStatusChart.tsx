'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Box, Typography } from '@mui/material'
import { appleChart, chartTick, getChartTooltipStyle } from '@/theme/chartTheme'
import { useTheme } from '@/components/theme-provider'

interface Props {
  data: { name: string; count: number; color: string }[]
}

const FALLBACK = [appleChart.gray, appleChart.blue, appleChart.orange, appleChart.green, appleChart.red]

export function ProjectStatusChart({ data }: Props) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  if (!data.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 8, textAlign: 'center' }}>
        Sin datos
      </Typography>
    )
  }

  return (
    <Box sx={{ width: '100%', minWidth: 0, height: 180 }}>
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} barSize={26} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <XAxis dataKey="name" tick={chartTick} axisLine={false} tickLine={false} />
        <YAxis tick={chartTick} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: isDark ? 'rgba(10,132,255,0.08)' : 'rgba(10,132,255,0.06)' }}
          contentStyle={getChartTooltipStyle(isDark)}
          itemStyle={{ color: isDark ? '#F5F5F7' : '#1C1C1E' }}
        />
        <Bar dataKey="count" radius={[10, 10, 6, 6]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color || FALLBACK[i % FALLBACK.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
    </Box>
  )
}
