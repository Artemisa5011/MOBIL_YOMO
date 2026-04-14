import { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '../contexts/ThemeProvider'
import { font } from '../theme/typography'

export function OrnamentDivider({ label }) {
  const { colors } = useTheme()
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: { flexDirection: 'row', alignItems: 'center', marginVertical: 14, paddingHorizontal: 4 },
        line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.goldMuted },
        dot: { color: colors.gold, fontFamily: font.bodySemi, fontSize: 14 },
        label: {
          color: colors.muted,
          fontFamily: font.bodyItalic,
          fontSize: 13,
          marginHorizontal: 8,
        },
      }),
    [colors]
  )

  return (
    <View style={styles.row}>
      <View style={styles.line} />
      {label ? (
        <Text style={styles.label}>{label}</Text>
      ) : (
        <Text style={styles.dot}> ✦ </Text>
      )}
      <View style={styles.line} />
    </View>
  )
}
