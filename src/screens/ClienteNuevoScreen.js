import { useMemo, useState } from 'react' // useState: para el estado del formulario, useMemo: para memoizar el estilo
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator } from 'react-native'
import { ScreenScroll } from '../components/ScreenScroll' // componente para el scroll de la pantalla
import * as clientesApi from '../api/clientesApi' // api para los clientes
import { useAuth } from '../contexts/useAuth' // contexto para el usuario autenticado
import { useTheme } from '../contexts/ThemeProvider' // contexto para el tema global
import { font } from '../theme/typography' // fuentes de la app
import { toastSuccess, toastError, toastInfo } from '../lib/appToast' // toast para mostrar mensajes de éxito, error y información

// Función para crear el estilo del componente Field
function Field({ label, value, onChangeText, error, keyboardType, autoCapitalize, styles, colors }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error && styles.inputErr]}
        placeholderTextColor={colors.muted}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'sentences'}
      />
      {error ? <Text style={styles.errText}>{error}</Text> : null}
    </View>
  )
}

// Función para crear el componente ClienteNuevoScreen
export default function ClienteNuevoScreen({ navigation }) {
  const { colors } = useTheme()
  const styles = useMemo(() => buildStyles(colors), [colors])
  const { user } = useAuth()
  const [form, setForm] = useState({
    cedula: '',
    nombre_completo: '',
    telefono: '',
    correo: '',
    departamento: '',
    ciudad: '',
  }) // form: formulario del cliente
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const setField = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => ({ ...e, [k]: undefined }))
  }
// Función para validar el formulario
  const validate = () => {
    const e = {}
    if (!form.cedula?.trim()) e.cedula = 'La cédula es obligatoria'
    if (!form.nombre_completo?.trim()) e.nombre_completo = 'El nombre es obligatorio'
    setErrors(e)
    return Object.keys(e).length === 0
  }
// Función para enviar el formulario
  const onSubmit = async () => {
    if (!validate()) {
      toastInfo('Revisa el formulario', 'Completa los campos obligatorios marcados.')
      return
    }
    if (!user?.id) {
      toastInfo('Sesión', 'No hay usuario de sesión.')
      return
    }
    setLoading(true)
    try {
      await clientesApi.createCliente({
        user_id: user.id,
        cedula: form.cedula.trim(),
        nombre_completo: form.nombre_completo.trim(),
        telefono: form.telefono?.trim() || null,
        correo: form.correo?.trim() || null,
        departamento: form.departamento?.trim() || null,
        ciudad: form.ciudad?.trim() || null,
        estado: 'activo',
      })
      toastSuccess('Listo', 'Cliente registrado')
      navigation.navigate('ClientesList')
    } catch (err) {
      toastError('Error', err.message || 'No se pudo registrar')
    } finally {
      setLoading(false)
    }
  }
// Función para crear el estilo del componente
  const fieldProps = { styles, colors }
// Función para renderizar el componente
  return (
    <ScreenScroll>
      <Text style={styles.note}>Los campos con * son obligatorios (validación del taller).</Text>

      <Field
        label="Cédula *"
        value={form.cedula}
        onChangeText={(t) => setField('cedula', t)}
        error={errors.cedula}
        keyboardType="numeric"
        {...fieldProps}
      />
      <Field
        label="Nombre completo *"
        value={form.nombre_completo}
        onChangeText={(t) => setField('nombre_completo', t)}
        error={errors.nombre_completo}
        {...fieldProps}
      /> 
      <Field label="Teléfono" value={form.telefono} onChangeText={(t) => setField('telefono', t)} {...fieldProps} />
      <Field
        label="Correo"
        value={form.correo}
        onChangeText={(t) => setField('correo', t)}
        keyboardType="email-address"
        autoCapitalize="none"
        {...fieldProps}
      />
      <Field label="Departamento" value={form.departamento} onChangeText={(t) => setField('departamento', t)} {...fieldProps} />
      <Field label="Ciudad" value={form.ciudad} onChangeText={(t) => setField('ciudad', t)} {...fieldProps} />

      <Pressable style={[styles.btn, loading && styles.btnDisabled]} onPress={onSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.text} /> : <Text style={styles.btnText}>Registrar cliente</Text>}
      </Pressable>
    </ScreenScroll>
  )
}
// Función para crear el estilo del componente buildStyles (buildStyles: función para crear el estilo del componente)
function buildStyles(colors) {
  return StyleSheet.create({
    note: { color: colors.textDim, marginBottom: 16, fontFamily: font.bodyItalic, fontSize: 16, lineHeight: 24 },
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
    inputErr: { borderColor: colors.danger },
    errText: { color: colors.danger, marginTop: 4, fontSize: 12, fontFamily: font.body },
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
