export async function readApiError(
  response: Response,
  fallback = 'Ocurrió un error inesperado'
): Promise<string> {
  try {
    const data = await response.json()
    if (typeof data?.error === 'string' && data.error.trim()) {
      return data.error.trim()
    }
  } catch {
    // ignore JSON parse errors
  }

  return fallback
}

export function isDependencyBlockedMessage(message: string): boolean {
  return message.startsWith('No puedes avanzar esta tarea hasta completar')
}
