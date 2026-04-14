import { useCallback, useMemo, useState } from 'react' // useState: para el estado del formulario, useCallback: para evitar recálculos innecesarios, useMemo: para memoizar el estilo
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native' // useFocusEffect: para escuchar cambios en la navegación
import * as clientesApi from '../api/clientesApi'
import { toastError } from '../lib/appToast' // toast para mostrar mensajes de error
import { filterClientesByQuery, sortClientes } from '../utils/listHelpers' // utils para filtrar y ordenar los clientes
import { getSortMode, setSortMode } from '../data/sortPreferenceStorage' // data para obtener y setear el modo de ordenamiento
import { GothicBackground } from '../components/GothicBackground' // componente para el fondo gótico
import { useTheme } from '../contexts/ThemeProvider' // contexto para el tema global
import { font } from '../theme/typography' // fuentes de la app

// Función para crear el componente ClientesListScreen (ClientesListScreen: función para crear el componente ClientesListScreen)
export default function ClientesListScreen({ navigation }) {
  const { colors } = useTheme()
  const styles = useMemo(() => buildStyles(colors), [colors])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [query, setQuery] = useState('')
  const [sortMode, setSortModeState] = useState('fecha')
// Función para cargar la lista de clientes
  const cargar = async () => {
    try {
      const data = await clientesApi.listClientes()
      setClientes(data)
    } catch (e) {
      toastError('Error', e.message || 'No se pudo cargar la lista')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }
// Función para escuchar cambios en la navegación
  useFocusEffect(
    useCallback(() => {
      let active = true
      ;(async () => {
        const sm = await getSortMode()
        if (active) setSortModeState(sm)
        if (active) setLoading(true)
        try {
          const data = await clientesApi.listClientes()
          if (active) setClientes(data)
        } catch (e) {
          toastError('Error', e.message || 'No se pudo cargar la lista')
        } finally {
          if (active) setLoading(false)
        }
      })()
      return () => {
        active = false
      }
    }, [])
  )
// Función para refrescar la lista de clientes
  const onRefresh = () => {
    setRefreshing(true)
    cargar()
  }
// Función para cambiar el orden de la lista de clientes
  const cambiarOrden = async () => {
    const orden = [
      { key: 'fecha', label: 'Fecha (reciente)' },
      { key: 'nombre', label: 'Nombre (A-Z)' },
      { key: 'cedula', label: 'Cédula' },
    ]
    Alert.alert('Ordenar por', 'Elige un criterio', [
      ...orden.map((o) => ({
        text: o.label,
        onPress: async () => {
          await setSortMode(o.key)
          setSortModeState(o.key)
        },
      })),
      { text: 'Cancelar', style: 'cancel' },
    ])
  }
// Función para filtrar la lista de clientes
  const filtrados = sortClientes(filterClientesByQuery(clientes, query), sortMode)
// Función para renderizar el componente
  if (loading && clientes.length === 0) {
    return (
      <GothicBackground style={styles.fill}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.muted}>Cargando clientes…</Text>
        </View>
      </GothicBackground>
    )
  }

  return (
    <GothicBackground style={styles.fill}>
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <TextInput
          style={styles.search}
          placeholder="Buscar por nombre o cédula"
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
        />
        <Pressable style={styles.sortBtn} onPress={cambiarOrden}>
          <Text style={styles.sortBtnText}>Orden</Text>
        </Pressable>
      </View>
      <Text style={styles.meta}>
        {filtrados.length} cliente{filtrados.length === 1 ? '' : 's'}
        {query.trim() ? ' (filtrado)' : ''}
      </Text>

      <FlatList
        data={filtrados}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListEmptyComponent={
          <Text style={styles.empty}>No hay clientes para mostrar. Crea uno desde el botón +.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate('ClienteDetail', { id: item.id })}
          >
            <Text style={styles.rowTitle}>{item.nombre_completo}</Text>
            <Text style={styles.rowSub}>Cédula {item.cedula}</Text>
            <Text style={styles.rowSub}>Estado: {item.estado}</Text>
          </Pressable>
        )}
      />

      <Pressable style={styles.fab} onPress={() => navigation.navigate('ClienteNuevo')}>
        <Text style={styles.fabText}>+ Nuevo</Text>
      </Pressable>
    </View>
    </GothicBackground>
  )
}
// Función para crear el estilo del componente buildStyles (buildStyles: función para crear el estilo del componente)
function buildStyles(colors) {
  return StyleSheet.create({
    fill: { flex: 1 },
    container: { flex: 1, backgroundColor: 'transparent' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
    muted: { color: colors.muted, fontFamily: font.bodyItalic, fontSize: 15 },
    toolbar: { flexDirection: 'row', padding: 12, gap: 8, alignItems: 'center' },
    search: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 2,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: colors.text,
      backgroundColor: colors.searchBg,
      fontFamily: font.body,
      fontSize: 16,
    },
    sortBtn: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 2,
      borderWidth: 1,
      borderColor: colors.goldMuted,
      backgroundColor: colors.card,
    },
    sortBtnText: { color: colors.gold, fontFamily: font.displayRegular, fontSize: 12, letterSpacing: 1 },
    meta: { paddingHorizontal: 16, color: colors.muted, marginBottom: 4, fontFamily: font.bodyItalic, fontSize: 13 },
    row: {
      marginHorizontal: 12,
      marginBottom: 10,
      padding: 14,
      borderRadius: 2,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 2,
      borderLeftColor: colors.accentSoft,
      backgroundColor: colors.listRow,
    },
    rowTitle: { color: colors.text, fontFamily: font.bodySemi, fontSize: 17 },
    rowSub: { color: colors.muted, marginTop: 4, fontFamily: font.body, fontSize: 15 },
    empty: { color: colors.muted, padding: 24, textAlign: 'center', fontFamily: font.bodyItalic },
    fab: {
      position: 'absolute',
      right: 16,
      bottom: 24,
      backgroundColor: colors.accentSoft,
      paddingVertical: 14,
      paddingHorizontal: 18,
      borderRadius: 2,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      elevation: 6,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
    },
    fabText: { color: colors.text, fontFamily: font.displayRegular, letterSpacing: 1 },
  })
}
