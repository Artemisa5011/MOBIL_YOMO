import { supabase } from '../lib/supabase'
import { parseError } from './parseError'

export async function listServiciosConfirmados() {
  const { data, error } = await supabase
    .from('servicios_funerarios')
    .select('*')
    .eq('estado_pago', 'confirmado')
    .order('fecha')
  if (error) throw parseError(error)
  return data || []
}

export async function listServiciosByClienteId(clienteId) {
  if (!clienteId) return []
  const { data, error } = await supabase
    .from('servicios_funerarios')
    .select('*')
    .eq('cliente_id', clienteId)
    .eq('estado_pago', 'confirmado')
    .order('fecha', { ascending: false })
  if (error) throw parseError(error)
  return data || []
}

export async function listMisServicios() {
  const { data, error } = await supabase
    .from('servicios_funerarios')
    .select('*')
    .eq('estado_pago', 'confirmado')
    .order('fecha', { ascending: false })
  if (error) throw parseError(error)
  return data || []
}

export async function createServiciosFunerarios(rows) {
  for (const row of rows) {
    const { error } = await supabase.from('servicios_funerarios').insert(row)
    if (error) {
      throw parseError(error, {
        '23503': 'Error al registrar. Verifica cliente, fecha y hora.',
        '23514': 'Fecha u hora no válidas. Revisa las reglas de negocio.',
      })
    }
  }
}

export function subscribeServiciosFunerariosRealtime(onUpsert, onRemove) {
  const channel = supabase
    .channel('servicios-funerarios-realtime-m')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'servicios_funerarios' },
      (payload) => {
        if (payload.eventType === 'DELETE') onRemove(payload.old?.id)
        else onUpsert(payload.new)
      }
    )
    .subscribe()
  return () => channel.unsubscribe()
}
