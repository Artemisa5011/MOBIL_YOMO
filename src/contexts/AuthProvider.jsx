import { useEffect, useState } from 'react'
import { AuthContext } from './authContext'
import { supabase } from '../lib/supabase'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [rol, setRol] = useState(null)
  const [nombreCompleto, setNombreCompleto] = useState('')

  useEffect(() => {
    const cargarPerfil = async (u) => {
      if (!u) {
        setRol(null)
        setNombreCompleto('')
        return
      }
      const { data, error } = await supabase
        .from('user_profiles')
        .select('rol')
        .eq('user_id', u.id)
        .single()
      if (error) {
        await supabase.auth.signOut()
        setUser(null)
        setRol(null)
        setNombreCompleto('')
        setLoading(false)
        return
      }
      setRol(data?.rol ?? 2)

      let nombre = ''
      try {
        const { data: nombreRpc } = await supabase.rpc('get_display_name')
        if (nombreRpc && typeof nombreRpc === 'string' && nombreRpc.trim()) {
          nombre = nombreRpc.trim()
        }
      } catch {
        /* RPC opcional */
      }
      if (data?.rol === 2) {
        const { data: emp } = await supabase
          .from('empleados')
          .select('nombre_completo, estado')
          .eq('user_id', u.id)
          .single()
        if (!emp || emp?.estado === 'inactivo') {
          await supabase.auth.signOut()
          setUser(null)
          setRol(null)
          setNombreCompleto('')
          setLoading(false)
          return
        }
        if (emp?.nombre_completo?.trim()) nombre = emp.nombre_completo.trim()
      }
      if (!nombre && data?.rol === 666) {
        const { data: emp } = await supabase
          .from('empleados')
          .select('nombre_completo')
          .eq('user_id', u.id)
          .single()
        if (emp?.nombre_completo?.trim()) nombre = emp.nombre_completo.trim()
      }
      setNombreCompleto(nombre || u.email || '')
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      await cargarPerfil(u)
      setLoading(false)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      cargarPerfil(u).finally(() => setLoading(false))
    })
    return () => subscription?.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signUp = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = {
    user,
    loading,
    rol,
    nombreCompleto: nombreCompleto || user?.email || '',
    isAdmin: rol === 666,
    isVendedor: rol === 2 || rol === 666,
    isCliente: rol === 3,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
