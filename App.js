import { StatusBar } from 'expo-status-bar' // eslint-disable-line no-unused-vars
import { View, ActivityIndicator, StyleSheet } from 'react-native' 
import { useFonts, CinzelDecorative_400Regular, CinzelDecorative_700Bold, CinzelDecorative_900Black } from '@expo-google-fonts/cinzel-decorative'
import {
  Cormorant_400Regular,
  Cormorant_600SemiBold,
  Cormorant_400Regular_Italic,
} from '@expo-google-fonts/cormorant'
import { AuthProvider } from './src/contexts/AuthProvider' 
import { ThemeProvider, useTheme } from './src/contexts/ThemeProvider' 
import RootNavigator from './src/navigation/RootNavigator'
import { ThemedToast } from './src/components/ThemedToast'
import { darkPalette } from './src/theme/colors'

export default function App() {
  const [loaded] = useFonts({
    CinzelDecorative_400Regular,
    CinzelDecorative_700Bold,
    CinzelDecorative_900Black,
    Cormorant_400Regular,
    Cormorant_600SemiBold,
    Cormorant_400Regular_Italic,
  })

  if (!loaded) {
    return (
      <View style={[styles.boot, { backgroundColor: darkPalette.bg }]}>
        <ActivityIndicator size="large" color={darkPalette.accent} />
      </View>
    )
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ThemeProvider>
  )
}

function AppShell() {
  const { isDark } = useTheme()
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator />
      <ThemedToast />
    </>
  )
}

const styles = StyleSheet.create({
  boot: { flex: 1, justifyContent: 'center', alignItems: 'center' },
})
