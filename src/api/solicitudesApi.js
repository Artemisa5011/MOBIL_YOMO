import { supabase } from '../lib/supabase'
import { parseError } from './parseError'

/** Insertar solicitud de contacto (público; no requiere sesión). Misma tabla que el web. */
export async function insertarSolicitud(payload) {
  const { error } = await supabase.from('solicitudes_contacto').insert({
    nombre: payload.nombre?.trim() || '',
    cedula: payload.cedula?.trim() || '',
    telefono: payload.telefono?.trim() || null,
    correo: payload.correo?.trim() || '',
    mensaje: payload.mensaje?.trim() || '',
  })
  if (error) throw parseError(error)
}

export async function listarSolicitudesAdmin() {
  const { data, error } = await supabase.rpc('admin_listar_solicitudes_contacto')
  if (error) throw parseError(error)
  return data || []
}
