import { supabase } from '../lib/supabase'
import { parseError } from './parseError'

export async function listLotes() {
  const { data, error } = await supabase.from('lotes').select('*')
  if (error) throw parseError(error)
  return data || []
}
