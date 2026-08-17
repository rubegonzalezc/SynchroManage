import type { ReactNode } from 'react'
import { parseInlineMarkdown } from '@/lib/utils/inline-markdown'
import { cn } from '@/lib/utils'

interface FormattedTextProps {
  children: string | null | undefined
  className?: string
  boldClassName?: string
  italicClassName?: string
}

function renderSegments(
  text: string,
  keyPrefix: string,
  boldClassName: string,
  italicClassName: string,
): ReactNode[] {
  return parseInlineMarkdown(text).map((segment, index) => {
    const key = `${keyPrefix}-${index}`

    if (segment.type === 'bold') {
      return (
        <strong key={key} className={boldClassName}>
          {renderSegments(segment.content, key, boldClassName, italicClassName)}
        </strong>
      )
    }

    if (segment.type === 'italic') {
      return (
        <em key={key} className={italicClassName}>
          {renderSegments(segment.content, key, boldClassName, italicClassName)}
        </em>
      )
    }

    return <span key={key}>{segment.content}</span>
  })
}

export function FormattedText({
  children,
  className,
  boldClassName = 'font-semibold text-foreground',
  italicClassName = 'italic',
}: FormattedTextProps) {
  if (!children) return null

  return (
    <span className={cn('whitespace-pre-wrap', className)}>
      {renderSegments(children, 'root', boldClassName, italicClassName)}
    </span>
  )
}
