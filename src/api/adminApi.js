import { supabase } from '../lib/supabase'
import { parseError } from './parseError'

export async function vincularServiciosPorCedula(cedula) {
  const { data, error } = await supabase.rpc('vincular_servicios_y_reservas_por_cedula', {
    p_cedula: String(cedula || '').trim(),
  })
  if (error) throw parseError(error)
  const row = Array.isArray(data) ? data[0] : data
  return { servicios: row?.servicios_vinculados ?? 0, reservas: row?.reservas_vinculadas ?? 0 }
}
