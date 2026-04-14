import { supabase } from '../lib/supabase'
import { parseError } from './parseError'

export async function getReservaWithLote(id) {
  if (!id) return null
  const { data, error } = await supabase
    .from('reservas_cementerio')
    .select('*, lotes(nombre, codigo)')
    .eq('id', id)
    .single()
  if (error) return null
  return data
}

export async function listReservasConfirmadas() {
  const { data, error } = await supabase
    .from('reservas_cementerio')
    .select('*, lotes(nombre, codigo)')
    .eq('estado_pago', 'confirmado')
  if (error) throw parseError(error)
  return data || []
}

export async function listReservasByClienteId(clienteId) {
  if (!clienteId) return []
  const { data, error } = await supabase
    .from('reservas_cementerio')
    .select('*, lotes(nombre, codigo)')
    .eq('cliente_id', clienteId)
    .eq('estado_pago', 'confirmado')
    .order('created_at', { ascending: false })
  if (error) throw parseError(error)
  return data || []
}

export async function listMisReservas() {
  const { data, error } = await supabase
    .from('reservas_cementerio')
    .select('*, lotes(nombre, codigo)')
    .eq('estado_pago', 'confirmado')
    .order('created_at', { ascending: false })
  if (error) throw parseError(error)
  return data || []
}

export async function getPortalUserIdByCedula(cedula) {
  if (!cedula?.trim()) return null
  try {
    const { data, error } = await supabase.rpc('get_portal_user_id_by_cedula', { p_cedula: cedula })
    if (error) return null
    return data || null
  } catch {
    return null
  }
}

export async function createReserva(payload) {
  const { error } = await supabase.from('reservas_cementerio').insert(payload)
  if (error) {
    throw parseError(error, {
      '23503': 'Error al crear reserva. Verifica cliente y lote.',
      '23514': 'Datos no válidos. Revisa método de pago y nombre del condenado.',
    })
  }
}

export async function updateReserva(id, payload) {
  const { error } = await supabase.from('reservas_cementerio').update(payload).eq('id', id)
  if (error) throw parseError(error)
}

export function subscribeReservasCementerioRealtime(onUpsert, onRemove) {
  const channel = supabase
    .channel('reservas-cementerio-realtime-m')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'reservas_cementerio' },
      (payload) => {
        if (payload.eventType === 'DELETE') onRemove(payload.old?.id)
        else onUpsert(payload.new)
      }
    )
    .subscribe()
  return () => channel.unsubscribe()
}
