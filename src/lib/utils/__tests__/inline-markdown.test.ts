import { describe, expect, it } from 'vitest'
import { parseInlineMarkdown } from '../inline-markdown'

describe('parseInlineMarkdown', () => {
  it('parsea negrita con **', () => {
    expect(parseInlineMarkdown('Hola **mundo**')).toEqual([
      { type: 'text', content: 'Hola ' },
      { type: 'bold', content: 'mundo' },
    ])
  })

  it('parsea negrita con __', () => {
    expect(parseInlineMarkdown('__Importante__')).toEqual([
      { type: 'bold', content: 'Importante' },
    ])
  })

  it('parsea cursiva con *', () => {
    expect(parseInlineMarkdown('Texto *énfasis* final')).toEqual([
      { type: 'text', content: 'Texto ' },
      { type: 'italic', content: 'énfasis' },
      { type: 'text', content: ' final' },
    ])
  })

  it('deja marcadores sin cierre como texto', () => {
    const segments = parseInlineMarkdown('sin cerrar **negrita')
    expect(segments.map((segment) => segment.content).join('')).toBe('sin cerrar **negrita')
  })

  it('soporta múltiples estilos en la misma línea', () => {
    expect(parseInlineMarkdown('**Título**: *detalle*')).toEqual([
      { type: 'bold', content: 'Título' },
      { type: 'text', content: ': ' },
      { type: 'italic', content: 'detalle' },
    ])
  })
})
