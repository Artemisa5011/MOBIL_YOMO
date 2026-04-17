import { useCallback, useMemo, useState } from 'react'
import { View, Text, StyleSheet, SectionList, RefreshControl, ActivityIndicator } from 'react-native'
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

  const sections = useMemo(
    () => [
      {
        key: 'servicios',
        title: 'Mis servicios funerarios',
        emptyHint:
          'No tienes servicios vinculados. Tu cédula en el portal debe coincidir con la del cliente en la venta web.',
        data: servicios.length ? servicios : [{ __empty: true, __key: 'empty-srv' }],
      },
      {
        key: 'reservas',
        title: 'Mis reservas de cementerio',
        emptyHint: 'No hay reservas confirmadas.',
        data: reservas.length ? reservas : [{ __empty: true, __key: 'empty-res' }],
      },
    ],
    [servicios, reservas]
  )

  const renderItem = ({ item, section }) => {
    if (item.__empty) {
      return <Text style={styles.muted}>{section.emptyHint}</Text>
    }
    if (section.key === 'servicios') {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{item.tipo}</Text>
          <Text style={styles.line}>
            {item.fecha} {item.hora ? `· ${item.hora}` : ''}
          </Text>
          <Text style={styles.line}>Difunto: {item.nombre_difunto || '—'}</Text>
          <Text style={styles.line}>${fmt(item.valor)}</Text>
        </View>
      )
    }
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{item.lotes?.nombre || item.lotes?.codigo || 'Lote'}</Text>
        <Text style={styles.line}>Pago: {item.estado_pago}</Text>
      </View>
    )
  }

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
      <SectionList
        style={styles.scroll}
        sections={sections}
        keyExtractor={(item, index) => (item.__empty ? item.__key : String(item.id ?? index))}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.h1, section.key === 'reservas' && styles.h1Spaced]}>{section.title}</Text>
        )}
        renderItem={renderItem}
        contentContainerStyle={styles.inner}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true)
              cargar()
            }}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      />
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
    h1Spaced: { marginTop: 24 },
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
