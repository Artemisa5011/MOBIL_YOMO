import { useState, useCallback, useMemo } from 'react' // useState: para el estado de la cédula, useCallback: para evitar recálculos innecesarios, useMemo: para memoizar el estilo
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native' // useFocusEffect: para escuchar cambios en la navegación
import { GothicBackground } from '../components/GothicBackground'
import * as solicitudesApi from '../api/solicitudesApi' // api para las solicitudes de contacto
import * as adminApi from '../api/adminApi' // api para el vinculo de servicios/reservas por cédula
import { useAuth } from '../contexts/useAuth'
import { useTheme } from '../contexts/ThemeProvider' // contexto para el tema global
import { font } from '../theme/typography' // fuentes de la app
import { toastSuccess, toastError, toastInfo } from '../lib/appToast'

export default function AdminScreen() {
  const { colors } = useTheme() // colors: colores del tema global
  const styles = useMemo(() => buildStyles(colors), [colors])
  const { isAdmin } = useAuth() // isAdmin: si el usuario es administrador    
  const [cedula, setCedula] = useState('') // cedula: cédula del cliente
  const [loadingVin, setLoadingVin] = useState(false) // loadingVin: si se está cargando el vinculo de servicios/reservas por cédula
  const [solicitudes, setSolicitudes] = useState([]) // solicitudes: lista de solicitudes de contacto
  const [loadingSol, setLoadingSol] = useState(true) // loadingSol: si se está cargando la lista de solicitudes de contacto
  const [refreshing, setRefreshing] = useState(false)

  const cargar = async (isRefresh = false) => {
    if (!isAdmin) {
      setLoadingSol(false)
      return
    }
    if (isRefresh) setRefreshing(true)
    else setLoadingSol(true)
    try {
      const data = await solicitudesApi.listarSolicitudesAdmin()
      setSolicitudes(data)
    } catch (e) {
      toastError('Solicitudes', e.message || 'Sin permiso o error de red')
    } finally {
      setLoadingSol(false)
      setRefreshing(false)
    }
  }

  useFocusEffect( // useFocusEffect: para escuchar cambios en la navegación
    useCallback(() => {
      cargar()
    }, [isAdmin])
  )

  const vincular = async () => { // vincular: función para vincular servicios/reservas por cédula
    if (!cedula.trim()) {
      toastInfo('Cédula', 'Ingresa la cédula del cliente')
      return
    }
    if (!isAdmin) {
      toastInfo('Permiso', 'Solo administradores.')
      return
    }
    setLoadingVin(true)
    try {
      const { servicios, reservas } = await adminApi.vincularServiciosPorCedula(cedula)
      toastSuccess('Vinculación', `Servicios: ${servicios}, reservas: ${reservas}`)
      setCedula('') // resetear la cédula
    } catch (e) {
      toastError('Error', e.message)
    } finally {
      setLoadingVin(false) // desactivar el loading
    }
  }

  if (!isAdmin) { // si el usuario no es administrador, mostrar un mensaje
    return (
      <GothicBackground style={styles.fill}>
        <View style={styles.center}>
          <Text style={styles.muted}>Esta sección es solo para administradores (rol 666).</Text>
          <Text style={styles.muted}>Gestión de empleados y borrado de cuentas sigue disponible en la web.</Text>
        </View>
      </GothicBackground>
    )
  }

  const header = (
    <View style={styles.headerBlock}>
      <Text style={styles.h1}>Administración</Text>
      <Text style={styles.hint}>Solicitudes de contacto y vínculo portal por cédula (RPC como en la web).</Text>

      <Text style={styles.label}>Vincular servicios/reservas por cédula</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Cédula"
          placeholderTextColor={colors.muted}
          value={cedula}
          onChangeText={setCedula}
          keyboardType="numeric"
        />
        <Pressable style={styles.btn} onPress={vincular} disabled={loadingVin}>
          {loadingVin ? <ActivityIndicator color={colors.text} /> : <Text style={styles.btnTxt}>Vincular</Text>}
        </Pressable>
      </View>

      <Text style={[styles.h2, { marginTop: 20 }]}>Solicitudes de contacto</Text>
    </View>
  )

  return (
    <GothicBackground style={styles.fill}>
      <FlatList
        data={solicitudes}
        keyExtractor={(item, i) => String(item.id ?? i)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={header}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => cargar(true)}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        ListEmptyComponent={
          loadingSol ? (
            <ActivityIndicator color={colors.accent} style={styles.listSpinner} size="large" />
          ) : (
            <Text style={styles.muted}>No hay solicitudes.</Text>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.solCard}>
            <Text style={styles.solName}>{item.nombre || item.correo}</Text>
            <Text style={styles.solMeta}>
              {item.cedula} · {item.correo}
            </Text>
            <Text style={styles.solMsg} numberOfLines={4}>
              {item.mensaje}
            </Text>
            <Text style={styles.solEst}>{item.estado || '—'}</Text>
          </View>
        )}
      />
    </GothicBackground>
  )
}
// Función para crear el estilo del componente
function buildStyles(colors) {
  return StyleSheet.create({
    fill: { flex: 1 },
    center: { flex: 1, padding: 24, justifyContent: 'center' },
    headerBlock: { paddingHorizontal: 16, paddingTop: 16 },
    listContent: { paddingHorizontal: 16, paddingBottom: 40 },
    listSpinner: { marginVertical: 28 },
    h1: { fontFamily: font.displayHeavy, fontSize: 22, color: colors.text },
    h2: { fontFamily: font.displayRegular, color: colors.gold },
    hint: { color: colors.muted, marginVertical: 10, fontFamily: font.bodyItalic },
    label: { color: colors.muted, marginBottom: 6 },
    row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      color: colors.text,
      borderRadius: 2,
      backgroundColor: colors.inputBg,
    },
    btn: { backgroundColor: colors.accentSoft, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 2 },
    btnTxt: { color: colors.text, fontWeight: '700' },
    muted: { color: colors.muted, marginBottom: 8 },
    solCard: {
      padding: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 2,
      backgroundColor: colors.panel,
    },
    solName: { fontFamily: font.bodySemi, color: colors.text, fontSize: 16 },
    solMeta: { color: colors.muted, fontSize: 13, marginTop: 4 },
    solMsg: { color: colors.textDim, marginTop: 8, fontSize: 14 },
    solEst: { color: colors.accent, marginTop: 6, fontSize: 12 },
  })
}
