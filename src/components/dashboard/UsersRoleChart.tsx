'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Box, Typography } from '@mui/material'
import { appleChart, chartTick, getChartTooltipStyle } from '@/theme/chartTheme'
import { useTheme } from '@/components/theme-provider'

const ROLE_COLORS: Record<string, string> = {
  admin: appleChart.red,
  pm: appleChart.blue,
  tech_lead: appleChart.purple,
  developer: appleChart.green,
  stakeholder: appleChart.teal,
}

interface Props {
  data: { role: string; label: string; count: number }[]
}

export function UsersRoleChart({ data }: Props) {
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
    <Box sx={{ width: '100%', minWidth: 0, height: Math.max(160, data.length * 36) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          barSize={14}
          margin={{ top: 4, right: 12, left: 4, bottom: 0 }}
        >
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="label"
            width={118}
            tick={chartTick}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: isDark ? 'rgba(10,132,255,0.08)' : 'rgba(10,132,255,0.06)' }}
            contentStyle={getChartTooltipStyle(isDark)}
            itemStyle={{ color: isDark ? '#F5F5F7' : '#1C1C1E' }}
          />
          <Bar dataKey="count" radius={[0, 8, 8, 0]} name="Usuarios">
            {data.map((entry) => (
              <Cell key={entry.role} fill={ROLE_COLORS[entry.role] || appleChart.gray} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}
