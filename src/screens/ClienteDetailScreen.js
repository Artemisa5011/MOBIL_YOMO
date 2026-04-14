import { useCallback, useMemo, useState } from 'react'
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, ScrollView } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import * as clientesApi from '../api/clientesApi'
import * as serviciosFunerariosApi from '../api/serviciosFunerariosApi'
import * as reservasCementerioApi from '../api/reservasCementerioApi'
import { toggleFavoriteCliente, isFavoriteCliente } from '../data/favoritesStorage'
import { toastSuccess, toastError } from '../lib/appToast'
import { GothicBackground } from '../components/GothicBackground'
import { useTheme } from '../contexts/ThemeProvider'
import { font } from '../theme/typography'

const fmt = (n) => Number(n ?? 0).toLocaleString('es-CO')
// Función para crear el estilo del componente
export default function ClienteDetailScreen({ route, navigation }) { // componente para el detalle de un cliente
  const { colors } = useTheme() // colors: colores del tema global
  const styles = useMemo(() => buildStyles(colors), [colors]) // styles: estilo del componente
  const { id } = route.params // id: id del cliente parámetro de la ruta
  const [cliente, setCliente] = useState(null) // cliente: cliente del detalle
  const [servicios, setServicios] = useState([]) // servicios: servicios del cliente
  const [reservas, setReservas] = useState([]) // reservas: reservas del cliente
  const [loading, setLoading] = useState(true) // loading: si se está cargando el detalle
  const [fav, setFav] = useState(false) // fav: si el cliente es favorito

  // cargar: función para cargar el detalle del cliente
  const cargar = async () => { 
    try {
      const [cli, srv, res] = await Promise.all([
        clientesApi.getClienteById(id),
        serviciosFunerariosApi.listServiciosByClienteId(id),
        reservasCementerioApi.listReservasByClienteId(id),
      ])
      setCliente(cli)
      setServicios(srv)
      setReservas(res)
      const f = await isFavoriteCliente(id)
      setFav(f)
    } catch (e) {
      toastError('Error', e.message || 'No se pudo cargar')
      navigation.goBack()
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect( // useFocusEffect: para escuchar cambios en la navegación
    useCallback(() => {
      setLoading(true)
      cargar()
    }, [id])
  )

  const onToggleFav = async () => { // onToggleFav: función para togglear el favorito del cliente
    const next = await toggleFavoriteCliente(id)
    setFav(next) // setear el favorito del cliente
  }

  const onDelete = () => { // función para eliminar el cliente
    if (!cliente) return
    Alert.alert(
      'Eliminar cliente',
      `¿Eliminar a "${cliente.nombre_completo}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await clientesApi.deleteCliente(id)
              toastSuccess('Listo', 'Cliente eliminado')
              navigation.navigate('ClientesList')
            } catch (e) {
              toastError('No se pudo eliminar', e.message || 'Error')
            }
          },
        },
      ]
    )
  }

  if (loading || !cliente) { // si se está cargando el detalle o no hay cliente, mostrar un indicador de carga
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
    <GothicBackground style={styles.fill}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.inner}>
        <View style={styles.actions}>
          <Pressable style={[styles.chip, fav && styles.chipOn]} onPress={onToggleFav}>
            <Text style={styles.chipText}>{fav ? 'Quitar de guardados' : 'Guardar en favoritos'}</Text>
          </Pressable>
          <Pressable style={styles.chip} onPress={() => navigation.navigate('ClienteEditar', { id })}>
            <Text style={styles.chipText}>Editar contacto</Text>
          </Pressable>
        </View>
        <View style={styles.ventasRow}>
          <Pressable
            style={styles.chipVentas}
            onPress={() =>
              navigation.getParent()?.navigate('Panel', {
                screen: 'Funeraria',
                params: { cedula: cliente.cedula },
              })
            }
          >
            <Text style={styles.chipText}>Vender funeraria</Text>
          </Pressable>
          <Pressable
            style={styles.chipVentas}
            onPress={() =>
              navigation.getParent()?.navigate('Panel', {
                screen: 'Cementerio',
                params: { cedula: cliente.cedula },
              })
            }
          >
            <Text style={styles.chipText}>Vender cementerio</Text>
          </Pressable>
        </View>

        <Text style={styles.h1}>{cliente.nombre_completo}</Text>
        <Text style={styles.line}>Cédula: {cliente.cedula}</Text>
        <Text style={styles.line}>Estado: {cliente.estado}</Text>
        <Text style={styles.line}>Teléfono: {cliente.telefono || '—'}</Text>
        <Text style={styles.line}>Correo: {cliente.correo || '—'}</Text>
        <Text style={styles.line}>
          Ubicación: {cliente.ciudad ? `${cliente.ciudad}, ${cliente.departamento || ''}` : '—'}
        </Text>

        <Text style={styles.section}>Servicios funerarios</Text>
        {servicios.length === 0 ? (
          <Text style={styles.muted}>No tiene servicios confirmados.</Text>
        ) : (
          servicios.map((s) => (
            <View key={s.id} style={styles.card}>
              <Text style={styles.cardTitle}>{s.tipo}</Text>
              <Text style={styles.muted}>
                {s.fecha} {s.hora ? `· ${s.hora}` : ''} · Difunto: {s.nombre_difunto || '—'}
              </Text>
              <Text style={styles.line}>${fmt(s.valor)}</Text>
            </View>
          ))
        )}

        <Text style={styles.section}>Reservas de cementerio</Text>
        {reservas.length === 0 ? (
          <Text style={styles.muted}>No tiene reservas confirmadas.</Text>
        ) : (
          reservas.map((r) => (
            <View key={r.id} style={styles.card}>
              <Text style={styles.cardTitle}>{r.lotes?.nombre || r.lotes?.codigo || 'Lote'}</Text>
              <Text style={styles.muted}>Estado pago: {r.estado_pago}</Text>
            </View>
          ))
        )}

        <Pressable style={styles.danger} onPress={onDelete}>
          <Text style={styles.dangerText}>Eliminar cliente</Text>
        </Pressable>
      </ScrollView>
    </GothicBackground>
  )
}

// Función para crear el estilo del componente
function buildStyles(colors) { // buildStyles: función para crear el estilo del componente
  return StyleSheet.create({
    fill: { flex: 1 },
    scroll: { flex: 1, backgroundColor: 'transparent' },
    inner: { padding: 16, paddingBottom: 40 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    ventasRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    chipVentas: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 2,
      borderWidth: 1,
      borderColor: colors.accentSoft,
      backgroundColor: colors.chipVentas,
    },
    chip: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 2,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.chipVentasBorder,
    },
    chipOn: { borderColor: colors.accent, backgroundColor: colors.chipOn },
    chipText: { color: colors.textDim, fontFamily: font.displayRegular, fontSize: 12, letterSpacing: 0.5 },
    h1: { fontFamily: font.displayHeavy, fontSize: 22, color: colors.text, marginBottom: 12, letterSpacing: 0.5 },
    line: { color: colors.textDim, marginBottom: 6, fontFamily: font.body, fontSize: 17 },
    section: {
      marginTop: 20,
      marginBottom: 8,
      fontFamily: font.displayRegular,
      fontSize: 14,
      letterSpacing: 2,
      color: colors.gold,
    },
    muted: { color: colors.muted, fontFamily: font.bodyItalic, fontSize: 15 },
    card: {
      padding: 12,
      borderRadius: 2,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 2,
      borderLeftColor: colors.accentSoft,
      backgroundColor: colors.detailBg,
      marginBottom: 8,
    },
    cardTitle: { color: colors.text, fontFamily: font.bodySemi, fontSize: 16 },
    danger: {
      marginTop: 24,
      padding: 14,
      borderRadius: 2,
      borderWidth: 1,
      borderColor: colors.danger,
      alignItems: 'center',
      backgroundColor: colors.detailRowAlt,
    },
    dangerText: { color: colors.danger, fontFamily: font.bodySemi, fontSize: 16 },
  })
}
