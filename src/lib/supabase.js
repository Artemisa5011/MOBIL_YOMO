import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  Constants.expoConfig?.extra?.supabaseUrl ||
  ''
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  Constants.expoConfig?.extra?.supabaseAnonKey ||
  ''

export const SUPABASE_DEBUG = {
  url: supabaseUrl || 'https://placeholder.supabase.co',
  hasAnonKey: Boolean(supabaseAnonKey),
  source: supabaseUrl
    ? process.env.EXPO_PUBLIC_SUPABASE_URL
      ? 'EXPO_PUBLIC'
      : process.env.VITE_SUPABASE_URL
        ? 'VITE'
        : Constants.expoConfig?.extra?.supabaseUrl
          ? 'expoConfig.extra'
          : 'unknown'
    : 'fallback',
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase: configura EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY (o VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) en un archivo .env en la raíz del proyecto móvil.'
  )
} else {
  console.warn(`Supabase: usando ${supabaseUrl}`)
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)
