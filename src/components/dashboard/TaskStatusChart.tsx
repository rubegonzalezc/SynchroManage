'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface Props {
  done: number
  inProgress: number
  review: number
  pending: number
  backlog: number
}

const COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#94a3b8']

export function TaskStatusChart({ done, inProgress, review, pending, backlog }: Props) {
  const data = [
    { name: 'Completadas', value: done },
    { name: 'En Progreso', value: inProgress },
    { name: 'En Revisión', value: review },
    { name: 'Por Hacer', value: pending },
    { name: 'Backlog', value: backlog },
  ].filter(d => d.value > 0)

  if (data.length === 0) return (
    <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
  )

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} strokeWidth={0} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            color: 'hsl(var(--foreground))',
            fontSize: '12px',
          }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: '12px' }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
