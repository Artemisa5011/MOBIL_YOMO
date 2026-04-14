import { useState, useMemo } from 'react' // useState: para el estado del nombre del difunto, useMemo: para memoizar el estilo
import { View, Text, StyleSheet, TextInput, Pressable, FlatList, ActivityIndicator } from 'react-native'
import * as reservasCementerioApi from '../api/reservasCementerioApi' // api para las reservas del cementerio
import { useReservasCementerioRealtime } from '../hooks/useReservasCementerioRealtime' // hook para las reservas del cementerio en tiempo real
import {
  COSTO_AGREGAR_DIFUNTO_RESERVA as COSTO_AGREGAR_DIFUNTO,
} from '../constants/yomiBusiness' // constantes de la app
import { useTheme } from '../contexts/ThemeProvider'
import { toastSuccess, toastError, toastInfo } from '../lib/appToast'
import { font } from '../theme/typography' // fuentes de la app

export function CementerioReservasBlock() { // componente para las reservas del cementerio
  const { colors } = useTheme()
  const styles = useMemo(() => buildStyles(colors), [colors])
  const { reservas, loading } = useReservasCementerioRealtime()
  const sinDifunto = reservas.filter((r) => r.estado === 'reservado_sin_difunto')

  const pasarAOcupado = async (r, nombre) => { // pasarAOcupado: función para pasar una reserva a ocupada
    if (!nombre?.trim()) { // si el nombre del difunto no es válido, mostrar un mensaje
      toastInfo('Difunto', 'Indica el nombre del difunto')
      return
    }
    try {
      await reservasCementerioApi.updateReserva(r.id, { // actualizar la reserva
        estado: 'ocupado',
        nombre_difunto: nombre.trim(),
        valor_adicional: (r.valor_adicional || 0) + COSTO_AGREGAR_DIFUNTO, // agregar el costo adicional
      })
      toastSuccess('Listo', `Pasado a ocupado. Cargo adicional: $${COSTO_AGREGAR_DIFUNTO}`)
    } catch (err) {
      toastError('Error', err.message)
    }
  }

  return ( // renderizar el componente
    <View style={styles.wrap}>
      <Text style={styles.h2}>Reservas sin difunto (+${COSTO_AGREGAR_DIFUNTO})</Text>
      {sinDifunto.map((r) => ( // renderizar las reservas sin difunto como filas
        <SinDifuntoRow key={r.id} reserva={r} onConfirm={pasarAOcupado} styles={styles} colors={colors} />
      ))}
      <Text style={[styles.h2, { marginTop: 16 }]}>Todas las reservas confirmadas</Text>
      {loading ? ( // si se está cargando, mostrar un indicador de carga
        <ActivityIndicator color={colors.accent} />
      ) : (
        <FlatList
          data={reservas} // lista de reservas
          keyExtractor={(item) => String(item.id)}
          scrollEnabled={false} // desactivar el scroll horizontal
          ListEmptyComponent={<Text style={styles.muted}>Sin reservas</Text>} // si no hay reservas, mostrar un mensaje
          renderItem={({ item }) => ( // renderizar cada reserva como una fila
            <Text style={styles.row}>
              {item.lotes?.nombre || '-'} | {item.estado} | {item.nombre_difunto || '-'} | {item.sombra_pecado || '-'}
            </Text>
          )}
        />
      )}
    </View>
  )
}

function SinDifuntoRow({ reserva, onConfirm, styles, colors }) { // componente para una fila de reserva sin difunto
  const [nombre, setNombre] = useState('')
  return ( // renderizar el componente
    <View style={styles.sdRow}>
      <Text style={styles.sdTxt}>{reserva.lotes?.nombre} — {reserva.estado}</Text>
      <TextInput
        style={styles.input} // estilo del input
        placeholder="Nombre del difunto"
        placeholderTextColor={colors.muted} // color del placeholder
        value={nombre}
        onChangeText={setNombre} // función para actualizar el nombre del difunto
      />
      <Pressable style={styles.btnSd} onPress={() => onConfirm(reserva, nombre)}>
        <Text style={styles.btnSdTxt}>Pasar a ocupado</Text>
      </Pressable>
    </View>
  )
}
// Función para crear el estilo del componente
function buildStyles(colors) {
  return StyleSheet.create({
    wrap: { marginTop: 20 },
    h2: { fontFamily: font.displayRegular, color: colors.gold, marginBottom: 8 },
    muted: { color: colors.muted },
    row: { color: colors.textDim, fontSize: 13, marginBottom: 4 },
    sdRow: {
      padding: 10,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.goldMuted,
      borderRadius: 2,
      backgroundColor: colors.reservaHighlight,
    },
    sdTxt: { color: colors.text, marginBottom: 6 },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      padding: 8,
      color: colors.text,
      marginBottom: 8,
      borderRadius: 2,
      backgroundColor: colors.inputBg,
    },
    btnSd: { backgroundColor: '#14532d', padding: 10, alignItems: 'center', borderRadius: 2 },
    btnSdTxt: { color: '#fff', fontWeight: '700' },
  })
}
