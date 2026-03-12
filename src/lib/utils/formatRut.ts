/**
 * Formatea un RUT chileno mientras se escribe
 * Ejemplo: 12345678-9 → 12.345.678-9
 */
export function formatRut(value: string): string {
  // Eliminar todo excepto números y K/k
  let rut = value.replace(/[^0-9kK]/g, '').toUpperCase()
  
  if (rut.length === 0) return ''
  
  // Separar cuerpo y dígito verificador
  let dv = ''
  if (rut.length > 1) {
    dv = rut.slice(-1)
    rut = rut.slice(0, -1)
  }
  
  // Formatear con puntos
  let formatted = ''
  let count = 0
  for (let i = rut.length - 1; i >= 0; i--) {
    formatted = rut[i] + formatted
    count++
    if (count === 3 && i > 0) {
      formatted = '.' + formatted
      count = 0
    }
  }
  
  // Agregar guión y dígito verificador
  if (dv) {
    formatted = formatted + '-' + dv
  }
  
  return formatted
}

/**
 * Limpia el RUT para guardar en BD (sin puntos ni guión)
 */
export function cleanRut(rut: string): string {
  return rut.replace(/[^0-9kK]/g, '').toUpperCase()
}
