import AsyncStorage from '@react-native-async-storage/async-storage'

const KEY = '@yomi_movil_favoritos_clientes'

async function readIds() {
  try {
    const raw = await AsyncStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function writeIds(ids) {
  await AsyncStorage.setItem(KEY, JSON.stringify(ids))
}

export async function getFavoriteClienteIds() {
  return readIds()
}

export async function isFavoriteCliente(id) {
  const ids = await readIds()
  return ids.includes(id)
}

export async function addFavoriteCliente(id) {
  const ids = await readIds()
  if (ids.includes(id)) return ids
  const next = [id, ...ids]
  await writeIds(next)
  return next
}

export async function removeFavoriteCliente(id) {
  const ids = await readIds()
  const next = ids.filter((x) => x !== id)
  await writeIds(next)
  return next
}

export async function toggleFavoriteCliente(id) {
  const ids = await readIds()
  if (ids.includes(id)) {
    await writeIds(ids.filter((x) => x !== id))
    return false
  }
  await writeIds([id, ...ids])
  return true
}
