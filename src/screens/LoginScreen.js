import { useMemo, useState } from 'react'
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator, Image } from 'react-native'
import { ScreenScroll } from '../components/ScreenScroll'
import { OrnamentDivider } from '../components/OrnamentDivider'
import { useTheme } from '../contexts/ThemeProvider'
import { font } from '../theme/typography'
import { useAuth } from '../contexts/useAuth'
import { toastError, toastInfo } from '../lib/appToast'

const LOGO_OSCURO = require('../../assets/logo.jpg')
const LOGO_CLARO = require('../../assets/logo_claro.jpg')

export default function LoginScreen({ navigation }) {
  const { colors, isDark } = useTheme()
  const styles = useMemo(() => buildStyles(colors), [colors])
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      toastInfo('Faltan datos', 'Ingresa correo y contraseña.')
      return
    }
    setLoading(true)
    try {
      await signIn(email.trim(), password)
    } catch (e) {
      toastError('Inicio de sesión', e.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScreenScroll gradientVariant="veil">
      <View style={styles.header}>
        <Image
          source={isDark ? LOGO_OSCURO : LOGO_CLARO}
          style={styles.logoSmall}
          accessibilityLabel="Logo"
        />
        <Text style={styles.title}>Iniciar sesión</Text>
        <Text style={styles.sub}>Las mismas credenciales que en la web.</Text>
        <OrnamentDivider />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Correo</Text>
        <TextInput
          style={styles.input}
          placeholder="correo@ejemplo.com"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor={colors.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable
          style={({ pressed }) => [styles.btn, loading && styles.btnDisabled, pressed && styles.pressed]}
          onPress={onSubmit}
          disabled={loading}
          android_ripple={{ color: colors.accentGlow }}
        >
          {loading ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={styles.btnText}>Entrar al templo</Text>
          )}
        </Pressable>
      </View>

      <Pressable style={styles.link} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.linkText}>← Volver al inicio</Text>
      </Pressable>
    </ScreenScroll>
  )
}

function buildStyles(colors) {
  return StyleSheet.create({
    header: { alignItems: 'center', marginBottom: 8 },
    logoSmall: {
      width: 88,
      height: 88,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.goldMuted,
      marginBottom: 16,
      resizeMode: 'cover',
    },
    title: {
      fontFamily: font.displayHeavy,
      fontSize: 22,
      letterSpacing: 2,
      color: colors.text,
      textAlign: 'center',
    },
    sub: {
      fontFamily: font.bodyItalic,
      fontSize: 15,
      color: colors.muted,
      textAlign: 'center',
      marginTop: 8,
    },
    form: {
      marginTop: 8,
      padding: 18,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.panel,
    },
    label: {
      fontFamily: font.bodySemi,
      fontSize: 13,
      color: colors.textDim,
      marginBottom: 6,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 2,
      padding: 14,
      color: colors.text,
      backgroundColor: colors.card,
      marginBottom: 16,
      fontFamily: font.body,
      fontSize: 17,
    },
    btn: {
      marginTop: 4,
      paddingVertical: 16,
      borderRadius: 2,
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      alignItems: 'center',
    },
    btnDisabled: { opacity: 0.65 },
    pressed: { opacity: 0.9 },
    btnText: {
      fontFamily: font.displayRegular,
      fontSize: 14,
      letterSpacing: 2,
      color: colors.text,
    },
    link: { marginTop: 24, alignItems: 'center' },
    linkText: { fontFamily: font.bodyItalic, fontSize: 16, color: colors.accent },
  })
}
