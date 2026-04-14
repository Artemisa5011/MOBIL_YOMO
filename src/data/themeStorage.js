import AsyncStorage from '@react-native-async-storage/async-storage'

const KEY = '@yomi_theme_mode'

export async function getThemeMode() {
  try {
    const v = await AsyncStorage.getItem(KEY)
    if (v === 'light' || v === 'dark') return v
  } catch {
    /* ignore */
  }
  return 'dark'
}

export async function setThemeMode(mode) {
  if (mode !== 'light' && mode !== 'dark') return
  try {
    await AsyncStorage.setItem(KEY, mode)
  } catch {
    /* ignore */
  }
}
