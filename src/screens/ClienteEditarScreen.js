import { useCallback, useMemo, useState } from 'react'
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { ScreenScroll } from '../components/ScreenScroll'
import { GothicBackground } from '../components/GothicBackground'
import * as clientesApi from '../api/clientesApi'
import { useTheme } from '../contexts/ThemeProvider'
import { toastSuccess, toastError } from '../lib/appToast'
import { font } from '../theme/typography'

// Función para crear el estilo del componente Field
function Field({ label, value, onChangeText, keyboardType, autoCapitalize, styles, colors }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.muted}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'sentences'}
      />
    </View>
  )
}
// Función para crear el componente ClienteEditarScreen
export default function ClienteEditarScreen({ route, navigation }) {
  const { colors } = useTheme()
  const styles = useMemo(() => buildStyles(colors), [colors])
  const { id } = route.params
  const [form, setForm] = useState({ telefono: '', correo: '', departamento: '', ciudad: '' })
  const [original, setOriginal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useFocusEffect( // useFocusEffect: para escuchar cambios en la navegación
    useCallback(() => {
      let cancelled = false
      ;(async () => {
        try {
          const data = await clientesApi.getClienteById(id)
          const initial = {
            telefono: data.telefono || '',
            correo: data.correo || '',
            departamento: data.departamento || '',
            ciudad: data.ciudad || '',
          }
          if (!cancelled) {
            setForm(initial)
            setOriginal(initial)
          }
        } catch (e) {
          toastError('Error', e.message)
          navigation.goBack()
        } finally {
          if (!cancelled) setLoading(false)
        }
      })()
      return () => {
        cancelled = true
      }
    }, [id])
  )
// Función para setear el campo del formulario
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))
// Función para enviar el formulario
  const onSubmit = async () => {
    setSaving(true)
    try {
      await clientesApi.updateCliente(id, {
        telefono: form.telefono?.trim() || null,
        correo: form.correo?.trim() || null,
        departamento: form.departamento?.trim() || null,
        ciudad: form.ciudad?.trim() || null,
      })
      toastSuccess('Guardado', 'Datos actualizados')
      navigation.navigate('ClienteDetail', { id })
    } catch {
      if (original) setForm({ ...original })
      toastError('Error', 'No se pudo guardar. Cambios revertidos.')
    } finally {
      setSaving(false)
    }
  }
// Función para crear el estilo del componente
  const fp = { styles, colors }
// Función para renderizar el componente
  if (loading) {
    return (
      <GothicBackground style={styles.fill}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </GothicBackground>
    )
  }
// renderizar el componente
  return (
    <ScreenScroll>
      <Text style={styles.hint}>Actualiza teléfono, correo y ubicación (misma lógica que la web).</Text>
      <Field label="Teléfono" value={form.telefono} onChangeText={(t) => setField('telefono', t)} {...fp} />
      <Field
        label="Correo"
        value={form.correo}
        onChangeText={(t) => setField('correo', t)}
        keyboardType="email-address"
        autoCapitalize="none"
        {...fp}
      />
      <Field label="Departamento" value={form.departamento} onChangeText={(t) => setField('departamento', t)} {...fp} />
      <Field label="Ciudad" value={form.ciudad} onChangeText={(t) => setField('ciudad', t)} {...fp} />

      <Pressable style={[styles.btn, saving && styles.btnDisabled]} onPress={onSubmit} disabled={saving}>
        {saving ? <ActivityIndicator color={colors.text} /> : <Text style={styles.btnText}>Guardar cambios</Text>}
      </Pressable>
    </ScreenScroll>
  )
}

// Función para crear el estilo del componente buildStyles (buildStyles: función para crear el estilo del componente)
function buildStyles(colors) { // buildStyles: función para crear el estilo del componente
  return StyleSheet.create({
    fill: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    hint: { color: colors.textDim, marginBottom: 16, fontFamily: font.bodyItalic, fontSize: 16, lineHeight: 24 },
    field: { marginBottom: 12 },
    label: { color: colors.muted, marginBottom: 6, fontSize: 13, fontFamily: font.bodySemi },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 2,
      padding: 14,
      color: colors.text,
      backgroundColor: colors.inputBg,
      fontFamily: font.body,
      fontSize: 17,
    },
    btn: {
      backgroundColor: colors.accentSoft,
      paddingVertical: 16,
      borderRadius: 2,
      alignItems: 'center',
      marginTop: 12,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    btnDisabled: { opacity: 0.7 },
    btnText: { color: colors.text, fontFamily: font.displayRegular, fontSize: 14, letterSpacing: 1 },
  })
}
