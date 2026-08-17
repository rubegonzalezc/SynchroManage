export type InlineMarkdownSegment =
  | { type: 'text'; content: string }
  | { type: 'bold'; content: string }
  | { type: 'italic'; content: string }

const BOLD_MARKERS = ['**', '__'] as const
const ITALIC_MARKERS = ['*', '_'] as const

function findClosingMarker(text: string, marker: string, from: number): number {
  return text.indexOf(marker, from)
}

/**
 * Parsea markdown inline básico: **negrita**, __negrita__, *cursiva*, _cursiva_.
 * Los marcadores sin cierre se muestran como texto literal.
 */
export function parseInlineMarkdown(text: string): InlineMarkdownSegment[] {
  const segments: InlineMarkdownSegment[] = []
  let index = 0

  while (index < text.length) {
    let matched = false

    for (const marker of BOLD_MARKERS) {
      if (!text.startsWith(marker, index)) continue

      const contentStart = index + marker.length
      const closeAt = findClosingMarker(text, marker, contentStart)
      if (closeAt === -1) continue

      segments.push({ type: 'bold', content: text.slice(contentStart, closeAt) })
      index = closeAt + marker.length
      matched = true
      break
    }

    if (matched) continue

    for (const marker of ITALIC_MARKERS) {
      if (!text.startsWith(marker, index)) continue
      if (text.startsWith(marker + marker, index)) continue

      const contentStart = index + marker.length
      const closeAt = findClosingMarker(text, marker, contentStart)
      if (closeAt === -1) continue

      segments.push({ type: 'italic', content: text.slice(contentStart, closeAt) })
      index = closeAt + marker.length
      matched = true
      break
    }

    if (matched) continue

    let literalMarker = false
    for (const marker of BOLD_MARKERS) {
      if (!text.startsWith(marker, index)) continue
      if (findClosingMarker(text, marker, index + marker.length) !== -1) continue

      segments.push({ type: 'text', content: marker })
      index += marker.length
      literalMarker = true
      break
    }
    if (literalMarker) continue

    for (const marker of ITALIC_MARKERS) {
      if (!text.startsWith(marker, index)) continue
      if (text.startsWith(marker + marker, index)) continue
      if (findClosingMarker(text, marker, index + marker.length) !== -1) continue

      segments.push({ type: 'text', content: marker })
      index += marker.length
      literalMarker = true
      break
    }
    if (literalMarker) continue

    const nextSpecial = (() => {
      const candidates = [
        text.indexOf('**', index),
        text.indexOf('__', index),
        text.indexOf('*', index),
        text.indexOf('_', index),
      ].filter((pos) => pos !== -1)

      return candidates.length > 0 ? Math.min(...candidates) : -1
    })()

    const end = nextSpecial === -1 ? text.length : nextSpecial
    if (end > index) {
      segments.push({ type: 'text', content: text.slice(index, end) })
    }
    index = end === index ? index + 1 : end
  }

  return segments
}
