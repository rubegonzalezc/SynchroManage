import { describe, expect, it } from 'vitest'
import { isDependencyBlockedMessage, readApiError } from '../api-error'

describe('isDependencyBlockedMessage', () => {
  it('detecta el mensaje estándar de bloqueo por dependencia', () => {
    expect(
      isDependencyBlockedMessage('No puedes avanzar esta tarea hasta completar #56 Configurar impresora')
    ).toBe(true)
  })

  it('no marca otros errores como dependencia', () => {
    expect(isDependencyBlockedMessage('No se pudo guardar la tarea')).toBe(false)
  })
})

describe('readApiError', () => {
  it('lee el campo error del JSON de la API', async () => {
    const response = new Response(
      JSON.stringify({ error: 'No puedes avanzar esta tarea hasta completar #56 Configurar impresora' }),
      { status: 400 }
    )

    await expect(readApiError(response)).resolves.toBe(
      'No puedes avanzar esta tarea hasta completar #56 Configurar impresora'
    )
  })

  it('usa fallback si no hay error legible', async () => {
    const response = new Response('{}', { status: 500 })
    await expect(readApiError(response, 'Fallo genérico')).resolves.toBe('Fallo genérico')
  })
})
