export function parseError(error, customMessages = {}) {
  const map = {
    PGRST116: 'Registro no encontrado',
    '23505': 'Ya existe un registro con estos datos',
    '23503': 'No se puede realizar la operación. Existen registros relacionados.',
    '42501': 'No tienes permiso para realizar esta acción',
    ...customMessages,
  }
  const msg = map[error?.code] || error?.message || 'Error al procesar la solicitud'
  const err = new Error(msg)
  if (error?.code) err.code = error.code
  return err
}
