import { useState, useEffect } from 'react'
import * as api from '../api/serviciosFunerariosApi'

function mergeById(list, item) {
  if (!item) return list
  if (item.estado_pago !== 'confirmado') return list.filter((s) => s.id !== item.id)
  const idx = list.findIndex((s) => s.id === item.id)
  const next = [...list]
  if (idx >= 0) next[idx] = item
  else next.push(item)
  return next.sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''))
}

function removeById(list, id) {
  return list.filter((s) => s.id !== id)
}

export function useServiciosFunerariosRealtime() {
  const [servicios, setServicios] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    api
      .listServiciosConfirmados()
      .then((data) => {
        if (mounted) {
          setServicios(data)
          setLoading(false)
        }
      })
      .catch(() => {
        if (mounted) setLoading(false)
      })
    const unsub = api.subscribeServiciosFunerariosRealtime(
      (row) => setServicios((prev) => mergeById(prev, row)),
      (id) => setServicios((prev) => removeById(prev, id))
    )
    return () => {
      mounted = false
      unsub()
    }
  }, [])

  return { servicios, loading }
}
