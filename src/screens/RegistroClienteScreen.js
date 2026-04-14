import { useMemo, useState } from 'react'
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator, Image } from 'react-native'
import { ScreenScroll } from '../components/ScreenScroll'
import { useTheme } from '../contexts/ThemeProvider'
import { font } from '../theme/typography'
import { useAuth } from '../contexts/useAuth'
import { supabase } from '../lib/supabase'
import { toastSuccess, toastError, toastInfo } from '../lib/appToast'

const LOGO_OSCURO = require('../../assets/logo.jpg')
const LOGO_CLARO = require('../../assets/logo_claro.jpg')

function validarPassword(pwd) {
  if (!pwd || pwd.length < 6) return { ok: false, msg: 'Mínimo 6 caracteres' }
  if (!/[a-z]/.test(pwd)) return { ok: false, msg: 'Al menos una letra minúscula' }
  if (!/[A-Z]/.test(pwd)) return { ok: false, msg: 'Al menos una letra mayúscula' }
  if (!/[0-9]/.test(pwd)) return { ok: false, msg: 'Al menos un número' }
  if (!/[!@#$%^&*()_+\-=[\]{};':"|,.<>/?~`]/.test(pwd)) return { ok: false, msg: 'Al menos un símbolo' }
  return { ok: true }
}

export default function RegistroClienteScreen({ navigation }) {
  const { colors, isDark } = useTheme()
  const styles = useMemo(() => buildStyles(colors), [colors])
  const { signUp } = useAuth()
  const [form, setForm] = useState({ cedula: '', correo: '', password: '' })
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!form.cedula || !form.correo || !form.password) {
      toastInfo('Datos', 'Completa cédula, correo y contraseña')
      return
    }
    const pwdCheck = validarPassword(form.password)
    if (!pwdCheck.ok) {
      toastInfo('Contraseña', pwdCheck.msg)
      return
    }
    setLoading(true)
    try {
      const { data: yaExiste } = await supabase.rpc('cedula_ya_registrada', { p_cedula: form.cedula.trim() })
      if (yaExiste) {
        toastInfo('Cédula', 'Esta cédula ya está registrada. Inicia sesión.')
        setLoading(false)
        return
      }
      await signUp(form.correo.trim(), form.password, {
        registro_tipo: 'cliente',
        cedula: form.cedula.trim(),
      })
      toastSuccess('Listo', 'Registro completado. Inicia sesión.')
      navigation.navigate('Login')
    } catch (err) {
      const msg = err?.message || ''
      if (msg.includes('already registered') || msg.includes('already exists')) {
        toastInfo('Correo', 'Este correo ya tiene cuenta.')
      } else {
        toastError('Error', msg || 'Error al registrarse')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScreenScroll gradientVariant="veil">
      <View style={styles.header}>
        <Image source={isDark ? LOGO_OSCURO : LOGO_CLARO} style={styles.logo} />
        <Text style={styles.title}>Registro cliente</Text>
        <Text style={styles.sub}>Portal «Mis difuntos»</Text>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Cédula"
        placeholderTextColor={colors.muted}
        keyboardType="numeric"
        value={form.cedula}
        onChangeText={(t) => setForm((f) => ({ ...f, cedula: t }))}
      />
      <TextInput
        style={styles.input}
        placeholder="Correo"
        placeholderTextColor={colors.muted}
        keyboardType="email-address"
        autoCapitalize="none"
        value={form.correo}
        onChangeText={(t) => setForm((f) => ({ ...f, correo: t }))}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor={colors.muted}
        secureTextEntry
        value={form.password}
        onChangeText={(t) => setForm((f) => ({ ...f, password: t }))}
      />
      <Text style={styles.hint}>Mín. 6 caracteres: mayúscula, minúscula, número y símbolo.</Text>
      <Pressable style={[styles.btn, loading && styles.disabled]} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.text} /> : <Text style={styles.btnTxt}>Registrarme</Text>}
      </Pressable>
      <Pressable style={styles.link} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.linkTxt}>Ya tengo cuenta</Text>
      </Pressable>
    </ScreenScroll>
  )
}

function buildStyles(colors) {
  return StyleSheet.create({
    header: { alignItems: 'center', marginBottom: 16 },
    logo: { width: 72, height: 72, borderRadius: 999, borderWidth: 1, borderColor: colors.goldMuted, marginBottom: 12 },
    title: { fontFamily: font.displayHeavy, fontSize: 20, color: colors.accent },
    sub: { fontFamily: font.bodyItalic, color: colors.muted, marginTop: 4 },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 2,
      padding: 14,
      color: colors.text,
      marginBottom: 12,
      backgroundColor: colors.inputBg,
      fontFamily: font.body,
      fontSize: 17,
    },
    hint: { color: colors.muted, fontSize: 12, marginBottom: 12 },
    btn: { backgroundColor: colors.accentSoft, padding: 16, alignItems: 'center', borderRadius: 2 },
    disabled: { opacity: 0.6 },
    btnTxt: { color: colors.text, fontFamily: font.displayRegular, letterSpacing: 1 },
    link: { marginTop: 20, alignItems: 'center' },
    linkTxt: { color: colors.accent, fontFamily: font.bodyItalic },
  })
}
