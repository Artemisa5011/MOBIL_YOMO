import { useMemo } from 'react'
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message'
import { useTheme } from '../contexts/ThemeProvider'
import { font } from '../theme/typography'

const baseText1 = { fontSize: 16, fontFamily: font.bodySemi }
const baseText2 = { fontSize: 14, fontFamily: font.body, marginTop: 2 }

export function ThemedToast() {
  const { colors } = useTheme()

  const config = useMemo(
    () => ({
      success: (props) => (
        <BaseToast
          {...props}
          style={{
            borderLeftColor: colors.gold,
            backgroundColor: colors.bgElevated,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 4,
            minHeight: 58,
            paddingVertical: 6,
          }}
          contentContainerStyle={{ paddingHorizontal: 14 }}
          text1Style={{ ...baseText1, color: colors.text }}
          text2Style={{ ...baseText2, color: colors.muted }}
        />
      ),
      error: (props) => (
        <ErrorToast
          {...props}
          style={{
            borderLeftColor: colors.danger,
            backgroundColor: colors.bgElevated,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 4,
            minHeight: 58,
            paddingVertical: 6,
          }}
          contentContainerStyle={{ paddingHorizontal: 14 }}
          text1Style={{ ...baseText1, color: colors.text }}
          text2Style={{ ...baseText2, color: colors.muted }}
        />
      ),
      info: (props) => (
        <BaseToast
          {...props}
          style={{
            borderLeftColor: colors.accent,
            backgroundColor: colors.bgElevated,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 4,
            minHeight: 58,
            paddingVertical: 6,
          }}
          contentContainerStyle={{ paddingHorizontal: 14 }}
          text1Style={{ ...baseText1, color: colors.text }}
          text2Style={{ ...baseText2, color: colors.muted }}
        />
      ),
    }),
    [colors]
  )

  return <Toast config={config} position="top" topOffset={52} />
}
