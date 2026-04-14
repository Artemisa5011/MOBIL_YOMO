import { supabase } from '../lib/supabase'
import { parseError } from './parseError'

export async function listClientes() {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw parseError(error)
  return data || []
}

export async function getClienteByCedula(cedula) {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('cedula', cedula.trim())
    .single()
  if (error && error.code !== 'PGRST116') throw parseError(error)
  return { data, notFound: error?.code === 'PGRST116' }
}

export async function getClienteById(id) {
  const { data, error } = await supabase.from('clientes').select('*').eq('id', id).single()
  if (error) throw parseError(error, { PGRST116: 'Cliente no encontrado' })
  return data
}

export async function createCliente(payload) {
  const { error } = await supabase.from('clientes').insert(payload)
  if (error) throw parseError(error, { '23505': 'Ya existe un cliente con esta cédula' })
}

export async function updateCliente(id, payload) {
  const { error } = await supabase.from('clientes').update(payload).eq('id', id)
  if (error) throw parseError(error)
}

export async function deleteCliente(id) {
  const { error } = await supabase.from('clientes').delete().eq('id', id)
  if (error) {
    throw parseError(error, {
      '23503': 'No se puede eliminar. El cliente tiene servicios o reservas asociados.',
    })
  }
}
