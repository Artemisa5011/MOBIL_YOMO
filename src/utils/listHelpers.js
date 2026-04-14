/**
 * Filtra clientes por texto en cédula o nombre (insensible a mayúsculas).
 * @param {Array<Record<string, unknown>>} clientes
 * @param {string} query
 */
export function filterClientesByQuery(clientes, query) {
  const q = (query || '').trim().toLowerCase()
  if (!q) return clientes
  return clientes.filter((c) => {
    const nombre = String(c.nombre_completo || '').toLowerCase()
    const cedula = String(c.cedula || '').toLowerCase()
    return nombre.includes(q) || cedula.includes(q)
  })
}

/**
 * @param {Array<Record<string, unknown>>} clientes
 * @param {'fecha' | 'nombre' | 'cedula'} mode
 */
export function sortClientes(clientes, mode) {
  const copy = [...clientes]
  if (mode === 'nombre') {
    copy.sort((a, b) =>
      String(a.nombre_completo || '').localeCompare(String(b.nombre_completo || ''), 'es')
    )
  } else if (mode === 'cedula') {
    copy.sort((a, b) => String(a.cedula || '').localeCompare(String(b.cedula || ''), 'es'))
  } else {
    copy.sort((a, b) => {
      const ta = new Date(a.created_at || 0).getTime()
      const tb = new Date(b.created_at || 0).getTime()
      return tb - ta
    })
  }
  return copy
}
