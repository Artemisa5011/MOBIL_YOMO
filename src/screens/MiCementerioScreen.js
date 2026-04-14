import { useCallback, useMemo, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import * as reservasCementerioApi from '../api/reservasCementerioApi'
import * as serviciosFunerariosApi from '../api/serviciosFunerariosApi'
import { useAuth } from '../contexts/useAuth'
import { GothicBackground } from '../components/GothicBackground'
import { useTheme } from '../contexts/ThemeProvider'
import { font } from '../theme/typography'
import { toastError } from '../lib/appToast'

const fmt = (n) => Number(n ?? 0).toLocaleString('es-CO')

export default function MiCementerioScreen() {
  const { colors } = useTheme()
  const styles = useMemo(() => buildStyles(colors), [colors])
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [reservas, setReservas] = useState([])
  const [servicios, setServicios] = useState([])

  const cargar = async () => {
    try {
      const [dataReservas, dataServicios] = await Promise.all([
        reservasCementerioApi.listMisReservas(),
        serviciosFunerariosApi.listMisServicios(),
      ])
      setReservas(dataReservas)
      setServicios(dataServicios)
    } catch (e) {
      toastError('Error', e.message || 'No se pudo cargar')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      if (!user) return undefined
      setLoading(true)
      cargar()
      return undefined
    }, [user])
  )

  if (loading && servicios.length === 0 && reservas.length === 0) {
    return (
      <GothicBackground style={styles.fill}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.muted}>Cargando…</Text>
        </View>
      </GothicBackground>
    )
  }

  return (
    <GothicBackground style={styles.fill}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.inner}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargar() }} tintColor={colors.accent} />
        }
      >
        <Text style={styles.h1}>Mis servicios funerarios</Text>
        {servicios.length === 0 ? (
          <Text style={styles.muted}>
            No tienes servicios vinculados. Tu cédula en el portal debe coincidir con la del cliente en la venta web.
          </Text>
        ) : (
          servicios.map((s) => (
            <View key={s.id} style={styles.card}>
              <Text style={styles.cardTitle}>{s.tipo}</Text>
              <Text style={styles.line}>
                {s.fecha} {s.hora ? `· ${s.hora}` : ''}
              </Text>
              <Text style={styles.line}>Difunto: {s.nombre_difunto || '—'}</Text>
              <Text style={styles.line}>${fmt(s.valor)}</Text>
            </View>
          ))
        )}

        <Text style={[styles.h1, { marginTop: 24 }]}>Mis reservas de cementerio</Text>
        {reservas.length === 0 ? (
          <Text style={styles.muted}>No hay reservas confirmadas.</Text>
        ) : (
          reservas.map((r) => (
            <View key={r.id} style={styles.card}>
              <Text style={styles.cardTitle}>{r.lotes?.nombre || r.lotes?.codigo || 'Lote'}</Text>
              <Text style={styles.line}>Pago: {r.estado_pago}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </GothicBackground>
  )
}

function buildStyles(colors) {
  return StyleSheet.create({
    fill: { flex: 1 },
    scroll: { flex: 1, backgroundColor: 'transparent' },
    inner: { padding: 16, paddingBottom: 32 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
    h1: {
      fontFamily: font.displayRegular,
      fontSize: 15,
      letterSpacing: 2,
      color: colors.gold,
      marginBottom: 12,
    },
    muted: { color: colors.muted, lineHeight: 22, fontFamily: font.bodyItalic, fontSize: 16 },
    line: { color: colors.textDim, marginTop: 4, fontFamily: font.body, fontSize: 16 },
    card: {
      padding: 12,
      borderRadius: 2,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 2,
      borderLeftColor: colors.accentSoft,
      backgroundColor: colors.detailBg,
      marginBottom: 10,
    },
    cardTitle: { color: colors.text, fontFamily: font.bodySemi, fontSize: 17 },
  })
}
