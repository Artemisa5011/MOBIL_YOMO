import { useMemo, useState } from 'react'
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator } from 'react-native'
import { useTheme } from '../contexts/ThemeProvider'
import { useAuth } from '../contexts/useAuth'
import { GothicBackground } from '../components/GothicBackground'
import { font } from '../theme/typography'
import { supabase } from '../lib/supabase'
import { toastError, toastInfo, toastSuccess } from '../lib/appToast'

export default function PortalPerfilScreen() {
  const { colors } = useTheme()
  const styles = useMemo(() => buildStyles(colors), [colors])
  const { user } = useAuth()
  const [cedula, setCedula] = useState(String(user?.user_metadata?.cedula || ''))
  const [saving, setSaving] = useState(false)

  const save = async () => {
    const c = String(cedula || '').trim()
    if (!c) {
      toastInfo('Cédula', 'Ingresa tu cédula (sin puntos).')
      return
    }
    if (!/^\d{4,15}$/.test(c)) {
      toastInfo('Cédula', 'Debe ser numérica (sin puntos ni espacios).')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ data: { cedula: c } })
      if (error) throw error
      toastSuccess('Listo', 'Cédula guardada. Pide al admin “Vincular por cédula” si ya tenías compras previas.')
    } catch (e) {
      toastError('Perfil', e?.message || 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <GothicBackground style={styles.fill}>
      <View style={styles.card}>
        <Text style={styles.title}>Perfil portal</Text>
        <Text style={styles.hint}>
          Para ver tus reservas/servicios en “Mis difuntos”, tu cuenta debe tener la misma cédula que usaron al registrarte
          en la venta.
        </Text>

        <Text style={styles.label}>Cédula</Text>
        <TextInput
          style={styles.input}
          value={cedula}
          onChangeText={setCedula}
          placeholder="Sin puntos"
          placeholderTextColor={colors.muted}
          keyboardType="numeric"
        />

        <Pressable style={[styles.btn, saving && styles.disabled]} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.text} /> : <Text style={styles.btnTxt}>Guardar</Text>}
        </Pressable>
      </View>
    </GothicBackground>
  )
}

function buildStyles(colors) {
  return StyleSheet.create({
    fill: { flex: 1 },
    card: {
      margin: 16,
      padding: 16,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.panel,
    },
    title: { fontFamily: font.displayHeavy, color: colors.gold, fontSize: 18, textAlign: 'center' },
    hint: {
      marginTop: 10,
      marginBottom: 12,
      color: colors.muted,
      fontFamily: font.bodyItalic,
      lineHeight: 18,
      textAlign: 'justify',
      fontSize: 12,
    },
    label: { color: colors.textDim, fontFamily: font.bodySemi, marginBottom: 6 },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 2,
      padding: 12,
      color: colors.text,
      backgroundColor: colors.card,
      fontFamily: font.body,
      marginBottom: 12,
    },
    btn: {
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 2,
    },
    btnTxt: { color: colors.text, fontFamily: font.displayRegular, letterSpacing: 1 },
    disabled: { opacity: 0.65 },
  })
}

