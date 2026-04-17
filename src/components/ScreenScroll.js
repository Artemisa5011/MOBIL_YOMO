import { ScrollView, StyleSheet } from 'react-native'
import { GothicBackground } from './GothicBackground'

export function ScreenScroll({ children, contentStyle, gradientVariant = 'main', refreshControl }) {
  return (
    <GothicBackground variant={gradientVariant} style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.inner, contentStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        {children}
      </ScrollView>
    </GothicBackground>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1, backgroundColor: 'transparent' },
  inner: { padding: 20, paddingBottom: 40 },
})
