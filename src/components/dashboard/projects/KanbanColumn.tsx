'use client'

import React, { memo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { ReactNode } from 'react'
import { Box, Typography } from '@mui/material'
import { useTheme } from '@/components/theme-provider'
import { tokens } from '@/theme/designTokens'

const ITEMS_PER_SUBCOL = 10
const INNER_CARD_WIDTH_PX = 272
const CONTENT_PADDING_PX = 16
const GAP_PX = 8

interface KanbanColumnProps {
  id: string
  title: string
  color: string
  count: number
  children: ReactNode
  isDragTarget?: boolean
}

export const KanbanColumn = memo(function KanbanColumn({ id, title, color, count, children, isDragTarget }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const highlighted = isOver || isDragTarget
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const childArray = React.Children.toArray(children)
  const chunks: ReactNode[][] = []
  for (let i = 0; i < childArray.length; i += ITEMS_PER_SUBCOL) {
    chunks.push(childArray.slice(i, i + ITEMS_PER_SUBCOL))
  }
  if (chunks.length === 0) chunks.push([])

  const subColCount = chunks.length
  const totalWidth = CONTENT_PADDING_PX + subColCount * INNER_CARD_WIDTH_PX + (subColCount - 1) * GAP_PX

  return (
    <Box
      ref={setNodeRef}
      sx={{
        width: totalWidth,
        flexShrink: 0,
        borderRadius: '24px',
        overflow: 'hidden',
        bgcolor: highlighted
          ? (isDark ? 'rgba(37, 99, 235, 0.16)' : 'rgba(37, 99, 235, 0.08)')
          : (isDark ? 'rgba(15, 23, 42, 0.55)' : 'rgba(255, 255, 255, 0.58)'),
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        border: highlighted
          ? '1px solid rgba(37, 99, 235, 0.4)'
          : (isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.7)'),
        boxShadow: highlighted
          ? '0 16px 40px rgba(37, 99, 235, 0.16), inset 0 1px 0 rgba(255,255,255,0.2)'
          : (isDark
            ? '0 12px 36px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.08)'
            : '0 12px 36px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255,255,255,0.7)'),
        backgroundImage: isDark
          ? 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 36%)'
          : 'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, transparent 36%)',
        transition: `border-color 280ms ${tokens.ease}, box-shadow 280ms ${tokens.ease}, background-color 280ms ${tokens.ease}`,
      }}
    >
      <Box
        sx={{
          px: 1.75,
          py: 1.4,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(215, 226, 240, 0.7)',
        }}
      >
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, boxShadow: `0 0 0 3px ${color}22` }} />
        <Typography sx={{ fontWeight: 600, fontSize: 13.5, letterSpacing: '-0.02em' }}>
          {title}
        </Typography>
        {subColCount > 1 && (
          <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
            ({subColCount} columnas)
          </Typography>
        )}
        <Box
          sx={{
            ml: 'auto',
            minWidth: 22,
            height: 22,
            px: 0.75,
            borderRadius: 999,
            display: 'grid',
            placeItems: 'center',
            fontSize: 11,
            fontWeight: 650,
            color: 'text.secondary',
            bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15, 23, 42, 0.06)',
          }}
        >
          {count}
        </Box>
      </Box>

      <Box sx={{ p: 1, display: 'flex', gap: 1 }}>
        {chunks.map((chunk, i) => (
          <Box
            key={i}
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              minHeight: 200,
              minWidth: 0,
            }}
          >
            {chunk}
          </Box>
        ))}
      </Box>
    </Box>
  )
})
