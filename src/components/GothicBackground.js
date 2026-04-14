import { StyleSheet, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useTheme } from '../contexts/ThemeProvider'

/** Fondo degradado + velo sutil para atmósfera sin recargar. */
export function GothicBackground({ children, variant = 'main', style }) {
  const { colors } = useTheme()
  const grad = variant === 'veil' ? colors.gradientVeil : colors.gradientMain
  return (
    <View style={[styles.root, style]}>
      <LinearGradient
        colors={grad}
        style={styles.fill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.85, y: 1 }}
      >
        <View style={[styles.veil, { backgroundColor: colors.veilOverlay }]} pointerEvents="none" />
        {children}
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  fill: { flex: 1 },
  veil: {
    ...StyleSheet.absoluteFillObject,
  },
})
