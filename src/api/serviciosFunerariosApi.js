import { supabase } from '../lib/supabase'
import { parseError } from './parseError'

export async function listServiciosConfirmados() {
  const { data, error } = await supabase
    .from('servicios_funerarios')
    .select('*')
    .in('estado_pago', ['confirmado', 'confirmada', 'pagado', 'pagada'])
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
    .in('estado_pago', ['confirmado', 'confirmada', 'pagado', 'pagada'])
    .order('fecha', { ascending: false })
  if (error) throw parseError(error)
  return data || []
}

export async function listMisServicios() {
  // 1) Intentar por vínculo directo al usuario del portal (cliente_user_id)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const uid = user?.id || null

  if (uid) {
    const { data, error } = await supabase
      .from('servicios_funerarios')
      .select('*')
      .in('estado_pago', ['confirmado', 'confirmada', 'pagado', 'pagada'])
      .eq('cliente_user_id', uid)
      .order('fecha', { ascending: false })
    if (error) throw parseError(error)
    if (Array.isArray(data) && data.length) return data
  }

  // 2) Fallback: resolver el cliente por cédula (si existe) o por correo (si la cuenta fue creada sin metadata)
  const cedula = String(user?.user_metadata?.cedula || '').trim()
  const email = String(user?.email || '').trim()

  let clienteId = null
  if (cedula) {
    const { data: cliente, error: clienteErr } = await supabase
      .from('clientes')
      .select('id')
      .eq('cedula', cedula)
      .single()
    if (!clienteErr) clienteId = cliente?.id || null
  }
  if (!clienteId && email) {
    const { data: cliente, error: clienteErr } = await supabase
      .from('clientes')
      .select('id')
      .ilike('correo', email)
      .single()
    if (!clienteErr) clienteId = cliente?.id || null
  }
  if (!clienteId) return []

  const { data, error } = await supabase
    .from('servicios_funerarios')
    .select('*')
    .in('estado_pago', ['confirmado', 'confirmada', 'pagado', 'pagada'])
    .eq('cliente_id', clienteId)
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
