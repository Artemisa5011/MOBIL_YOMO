import { NavigationContainer, DefaultTheme } from '@react-navigation/native'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { useMemo } from 'react'
import { useAuth } from '../contexts/useAuth'
import { useTheme } from '../contexts/ThemeProvider'
import AuthStack from './AuthStack'
import MainTabs from './MainTabs'
import { navigationRef } from './navigationRef'
import { buildRootLinking } from './rootLinking'

export default function RootNavigator() {
  const { loading, isAuthenticated, isCliente } = useAuth()
  const { colors } = useTheme()

  const navTheme = useMemo(
    () => ({
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        background: colors.bg,
        card: colors.bg,
        text: colors.text,
        border: colors.border,
        primary: colors.accent,
      },
    }),
    [colors]
  )

  const linking = useMemo(
    () => buildRootLinking(isAuthenticated, isCliente),
    [isAuthenticated, isCliente]
  )

  if (loading) {
    return (
      <View style={[styles.splash, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    )
  }

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme} linking={linking}>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  splash: { flex: 1, justifyContent: 'center', alignItems: 'center' },
})
