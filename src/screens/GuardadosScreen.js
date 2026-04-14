import { useCallback, useMemo, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import * as clientesApi from '../api/clientesApi'
import { getFavoriteClienteIds, removeFavoriteCliente } from '../data/favoritesStorage'
import { GothicBackground } from '../components/GothicBackground'
import { useTheme } from '../contexts/ThemeProvider'
import { font } from '../theme/typography'
import { toastError } from '../lib/appToast'

export default function GuardadosScreen({ navigation }) {
  const { colors } = useTheme()
  const styles = useMemo(() => buildStyles(colors), [colors])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const cargar = async () => {
    try {
      const ids = await getFavoriteClienteIds()
      const rows = []
      for (const id of ids) {
        try {
          const c = await clientesApi.getClienteById(id)
          rows.push(c)
        } catch {
          await removeFavoriteCliente(id)
        }
      }
      setItems(rows)
    } catch (e) {
      toastError('Error', e.message || 'No se pudo cargar guardados')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      cargar()
    }, [])
  )

  const quitar = async (id) => {
    await removeFavoriteCliente(id)
    setItems((prev) => prev.filter((c) => c.id !== id))
  }

  if (loading && items.length === 0) {
    return (
      <GothicBackground style={styles.fill}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.muted}>Cargando favoritos…</Text>
        </View>
      </GothicBackground>
    )
  }

  return (
    <GothicBackground style={styles.fill}>
      <View style={styles.container}>
        <Text style={styles.intro}>
          Reliquias elegidas: quienes guardaste en el detalle permanecen sellados aquí (AsyncStorage), fuera del juicio
          de la nube.
        </Text>
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargar() }} tintColor={colors.accent} />
          }
          ListEmptyComponent={<Text style={styles.empty}>No hay guardados. Abre un cliente y pulsa guardar.</Text>}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Pressable
                style={styles.rowMain}
                onPress={() =>
                  navigation.navigate('Clientes', {
                    screen: 'ClienteDetail',
                    params: { id: item.id },
                  })
                }
              >
                <Text style={styles.rowTitle}>{item.nombre_completo}</Text>
                <Text style={styles.rowSub}>{item.cedula}</Text>
              </Pressable>
              <Pressable style={styles.quitar} onPress={() => quitar(item.id)}>
                <Text style={styles.quitarText}>Quitar</Text>
              </Pressable>
            </View>
          )}
        />
      </View>
    </GothicBackground>
  )
}

function buildStyles(colors) {
  return StyleSheet.create({
    fill: { flex: 1 },
    container: { flex: 1, backgroundColor: 'transparent' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
    muted: { color: colors.muted, fontFamily: font.bodyItalic, fontSize: 15 },
    intro: {
      color: colors.textDim,
      padding: 14,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: font.bodyItalic,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.goldMuted,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 12,
      marginBottom: 10,
      padding: 12,
      borderRadius: 2,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 2,
      borderLeftColor: colors.goldMuted,
      backgroundColor: colors.panel,
    },
    rowMain: { flex: 1 },
    rowTitle: { color: colors.text, fontFamily: font.bodySemi, fontSize: 17 },
    rowSub: { color: colors.muted, marginTop: 4, fontFamily: font.body },
    quitar: { paddingHorizontal: 10, paddingVertical: 8 },
    quitarText: { color: colors.danger, fontFamily: font.bodySemi },
    empty: { color: colors.muted, padding: 24, textAlign: 'center', fontFamily: font.bodyItalic },
  })
}
