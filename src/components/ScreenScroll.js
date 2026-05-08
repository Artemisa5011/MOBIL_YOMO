import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native'
import { useHeaderHeight } from '@react-navigation/elements'
import { GothicBackground } from './GothicBackground'

export function ScreenScroll({ children, contentStyle, gradientVariant = 'main', refreshControl }) {
  const headerHeight = useHeaderHeight?.() ?? 0
  return (
    <GothicBackground variant={gradientVariant} style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={headerHeight}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.inner, contentStyle]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </GothicBackground>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flex: 1, backgroundColor: 'transparent' },
  inner: { padding: 20, paddingBottom: 40 },
})
