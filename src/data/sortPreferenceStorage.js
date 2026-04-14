import AsyncStorage from '@react-native-async-storage/async-storage'

const KEY = '@yomi_movil_sort_clientes'

/** @typedef {'fecha' | 'nombre' | 'cedula'} SortMode */

/** @returns {Promise<SortMode>} */
export async function getSortMode() {
  try {
    const v = await AsyncStorage.getItem(KEY)
    if (v === 'fecha' || v === 'nombre' || v === 'cedula') return v
  } catch {
    /* ignore */
  }
  return 'fecha'
}

/** @param {SortMode} mode */
export async function setSortMode(mode) {
  await AsyncStorage.setItem(KEY, mode)
}
