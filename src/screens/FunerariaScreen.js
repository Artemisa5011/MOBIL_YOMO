import { useState, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  FlatList,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { GothicBackground } from '../components/GothicBackground'
import * as clientesApi from '../api/clientesApi'
import * as serviciosFunerariosApi from '../api/serviciosFunerariosApi'
import * as reservasCementerioApi from '../api/reservasCementerioApi'
import { useServiciosFunerariosRealtime } from '../hooks/useServiciosFunerariosRealtime'
import { useAuth } from '../contexts/useAuth'
import { SERVICIOS_FUNERARIA, HORAS_FUNERARIA } from '../constants/yomiBusiness'
import { useTheme } from '../contexts/ThemeProvider'
import { font } from '../theme/typography'
import { toastSuccess, toastError, toastInfo } from '../lib/appToast'

const fmt = (n) => Number(n ?? 0).toLocaleString('es-CO')

export default function FunerariaScreen({ route }) {
  const { colors } = useTheme()
  const styles = useMemo(() => buildStyles(colors), [colors])
  const { user } = useAuth()
  const cedulaParam = route.params?.cedula || ''
  const [cliente, setCliente] = useState(null)
  const [cedula, setCedula] = useState(cedulaParam)
  const [carrito, setCarrito] = useState([])
  const [nombreDifunto, setNombreDifunto] = useState('')
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [metodoPago, setMetodoPago] = useState('')
  const [nombreCondenado, setNombreCondenado] = useState('')
  const [tarjetaNumero, setTarjetaNumero] = useState('')
  const [tarjetaVencimiento, setTarjetaVencimiento] = useState('')
  const [tarjetaCVV, setTarjetaCVV] = useState('')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [mostrarFormPago, setMostrarFormPago] = useState(false)
  const { servicios: calendario, loading: calLoading } = useServiciosFunerariosRealtime()

  useFocusEffect(
    useCallback(() => {
      if (cedulaParam) {
        setCedula(cedulaParam)
        buscarCliente(cedulaParam)
      }
    }, [cedulaParam])
  )

  const buscarCliente = async (ced) => {
    if (!ced?.trim()) return
    try {
      const { data, notFound } = await clientesApi.getClienteByCedula(ced)
      if (notFound) {
        setCliente(null)
        toastInfo('Cliente', 'Cliente no encontrado. Regístralo primero.')
        return
      }
      if (data.estado !== 'activo' && data.estado !== 'verdugo') {
        toastInfo('Cliente', 'El cliente no puede contratar servicios')
        return
      }
      setCliente(data)
    } catch (err) {
      toastError('Error', err.message)
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      if (cedula?.trim()) {
        await buscarCliente(cedula)
      }
    } finally {
      setRefreshing(false)
    }
  }, [cedula])

  const totalCarrito = carrito.reduce((s, i) => s + i.valor * i.cantidad, 0)

  const agregar = (s, cantidad = 1) => {
    const fechaUsar = fecha || new Date().toISOString().slice(0, 10)
    const yaEnDia = carrito.filter((c) => c.fecha === fechaUsar).reduce((a, c) => a + c.cantidad, 0)
    if (yaEnDia + cantidad > 3) {
      toastInfo('Límite', 'Máximo 3 servicios por cliente por día')
      return
    }
    const idx = carrito.findIndex((c) => c.tipo === s.tipo && c.fecha === fechaUsar && c.hora === hora)
    if (idx >= 0) {
      const nuevo = [...carrito]
      nuevo[idx].cantidad += cantidad
      if (nuevo[idx].cantidad > 3) nuevo[idx].cantidad = 3
      setCarrito(nuevo)
    } else {
      setCarrito([...carrito, { ...s, cantidad, fecha: fechaUsar, hora: hora || '00:00' }])
    }
  }

  const quitar = (idx) => setCarrito(carrito.filter((_, i) => i !== idx))

  const confirmarPago = async () => {
    if (!cliente || carrito.length === 0 || !nombreDifunto?.trim()) {
      toastInfo('Faltan datos', 'Selecciona servicios, fecha, hora y nombre del difunto')
      return
    }
    if (!metodoPago) {
      toastInfo('Pago', 'Selecciona método de pago')
      return
    }
    if (metodoPago === 'con_la_vida' && !nombreCondenado?.trim()) {
      toastInfo('Pago', 'Con "con la vida" debes indicar el nombre del condenado')
      return
    }
    if (metodoPago === 'tarjeta') {
      const num = tarjetaNumero.replace(/\s/g, '')
      if (num.length < 16) {
        toastInfo('Tarjeta', 'El número debe tener 16 dígitos')
        return
      }
      if (!tarjetaVencimiento.trim()) {
        toastInfo('Tarjeta', 'Indica vencimiento (MM/AA)')
        return
      }
      if (tarjetaCVV.length < 3) {
        toastInfo('Tarjeta', 'Indica CVV (3 o 4 dígitos)')
        return
      }
    }
    const hoy = new Date().toISOString().slice(0, 10)
    if (carrito.some((c) => c.fecha < hoy)) {
      toastInfo('Fecha', 'La fecha no puede ser en el pasado')
      return
    }
    setLoading(true)
    try {
      if (metodoPago === 'tarjeta') await new Promise((r) => setTimeout(r, 1500))
      const portalUserId = await reservasCementerioApi.getPortalUserIdByCedula(cliente.cedula)
      const rows = carrito.map((item) => ({
        cliente_id: cliente.id,
        user_id: user.id,
        cliente_user_id: portalUserId || undefined,
        tipo: item.tipo,
        nombre_difunto: nombreDifunto.trim(),
        hora: item.hora || '00:00',
        fecha: item.fecha,
        estado_pago: 'confirmado',
        metodo_pago: metodoPago,
        nombre_condenado: metodoPago === 'con_la_vida' ? nombreCondenado.trim() : null,
        valor: item.valor * item.cantidad,
        valor_total: totalCarrito,
      }))
      await serviciosFunerariosApi.createServiciosFunerarios(rows)
      await clientesApi.updateCliente(cliente.id, { estado: 'verdugo' })
      toastSuccess('Éxito', `Pago recibido. Total: $${fmt(totalCarrito)}`)
      setCarrito([])
      setNombreDifunto('')
      setMetodoPago('')
      setNombreCondenado('')
      setTarjetaNumero('')
      setTarjetaVencimiento('')
      setTarjetaCVV('')
      setMostrarFormPago(false)
    } catch (err) {
      toastError('Error', err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePactar = () => {
    if (!cliente) {
      toastInfo('Cliente', 'Busca y valida el cliente primero')
      return
    }
    if (carrito.length === 0) {
      toastInfo('Carrito', 'Agrega al menos un servicio')
      return
    }
    if (!fecha || !hora) {
      toastInfo('Agenda', 'Selecciona fecha y hora')
      return
    }
    if (!nombreDifunto?.trim()) {
      toastInfo('Difunto', 'Indica el nombre del difunto')
      return
    }
    const hoy = new Date().toISOString().slice(0, 10)
    if (fecha < hoy) {
      toastInfo('Fecha', 'La fecha no puede ser en el pasado')
      return
    }
    setMostrarFormPago(true)
  }

  return (
    <GothicBackground style={styles.fill}>
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        <Text style={styles.h1}>Funeraria</Text>
        <Text style={styles.hint}>Máx. 3 servicios por cliente y día. Horas 00:00 u 03:00.</Text>

        <View style={styles.row}>
          <TextInput
            style={styles.inputFlex}
            placeholder="Cédula del cliente"
            placeholderTextColor={colors.muted}
            value={cedula}
            onChangeText={setCedula}
            keyboardType="numeric"
          />
          <Pressable style={styles.btnBuscar} onPress={() => buscarCliente(cedula)}>
            <Text style={styles.btnBuscarTxt}>Buscar</Text>
          </Pressable>
        </View>
        {cliente ? (
          <Text style={styles.ok}>Cliente: {cliente.nombre_completo} ({cliente.estado})</Text>
        ) : null}

        <View style={styles.rowWrap}>
          <TextInput
            style={styles.inputDate}
            placeholder="Fecha AAAA-MM-DD"
            placeholderTextColor={colors.muted}
            value={fecha}
            onChangeText={setFecha}
          />
          <View style={styles.horas}>
            {HORAS_FUNERARIA.map((h) => (
              <Pressable
                key={h.valor}
                style={[styles.chip, hora === h.valor && styles.chipOn]}
                onPress={() => setHora(h.valor)}
              >
                <Text style={styles.chipTxt}>{h.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {SERVICIOS_FUNERARIA.map((s) => (
          <View key={s.tipo} style={styles.servCard}>
            <Text style={styles.servTitle}>{s.nombre}</Text>
            <Text style={styles.servPrecio}>$ {fmt(s.valor)}</Text>
            <Pressable style={styles.btnContratar} onPress={() => agregar(s)}>
              <Text style={styles.btnContratarTxt}>Contratar</Text>
            </Pressable>
          </View>
        ))}

        <Text style={styles.label}>Nombre del difunto *</Text>
        <TextInput
          style={styles.input}
          value={nombreDifunto}
          onChangeText={setNombreDifunto}
          placeholder="Nombre completo"
          placeholderTextColor={colors.muted}
        />

        <Text style={styles.total}>Total: ${fmt(totalCarrito)}</Text>
        {carrito.length > 0 && (
          <View style={styles.carritoBox}>
            {carrito.map((c, i) => (
              <View key={i} style={styles.carritoRow}>
                <Text style={styles.carritoTxt}>
                  {c.nombre} x{c.cantidad} — {c.fecha} {c.hora} — ${fmt(c.valor * c.cantidad)}
                </Text>
                <Pressable onPress={() => quitar(i)}>
                  <Text style={styles.quitar}>Quitar</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {!mostrarFormPago ? (
          <Pressable style={styles.btnPactar} onPress={handlePactar}>
            <Text style={styles.btnPactarTxt}>Pactar</Text>
          </Pressable>
        ) : (
          <View style={styles.pagoBox}>
            <Text style={styles.label}>Método de pago</Text>
            {['efectivo', 'tarjeta', 'con_la_vida'].map((m) => (
              <Pressable
                key={m}
                style={[styles.radioRow, metodoPago === m && styles.radioOn]}
                onPress={() => setMetodoPago(m)}
              >
                <Text style={styles.radioTxt}>
                  {m === 'con_la_vida' ? 'Con la vida' : m === 'tarjeta' ? 'Tarjeta' : 'Efectivo'}
                </Text>
              </Pressable>
            ))}
            {metodoPago === 'con_la_vida' && (
              <TextInput
                style={styles.input}
                placeholder="Nombre del condenado"
                placeholderTextColor={colors.muted}
                value={nombreCondenado}
                onChangeText={setNombreCondenado}
              />
            )}
            {metodoPago === 'tarjeta' && (
              <View>
                <TextInput
                  style={styles.input}
                  placeholder="Número 16 dígitos"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                  value={tarjetaNumero}
                  onChangeText={(t) => setTarjetaNumero(t.replace(/\D/g, '').slice(0, 16))}
                />
                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, styles.flex1]}
                    placeholder="MM/AA"
                    placeholderTextColor={colors.muted}
                    value={tarjetaVencimiento}
                    onChangeText={setTarjetaVencimiento}
                  />
                  <TextInput
                    style={[styles.input, styles.cvv]}
                    placeholder="CVV"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    value={tarjetaCVV}
                    onChangeText={(t) => setTarjetaCVV(t.replace(/\D/g, '').slice(0, 4))}
                  />
                </View>
              </View>
            )}
            <View style={styles.row}>
              <Pressable style={styles.btnConfirm} onPress={confirmarPago} disabled={loading}>
                {loading ? <ActivityIndicator color={colors.text} /> : <Text style={styles.btnConfirmTxt}>Confirmar pago</Text>}
              </Pressable>
              <Pressable onPress={() => setMostrarFormPago(false)}>
                <Text style={styles.cancel}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        )}

        <Text style={[styles.h1, { marginTop: 24 }]}>Calendario (confirmados)</Text>
        {calLoading ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <FlatList
            data={calendario}
            keyExtractor={(item) => String(item.id)}
            scrollEnabled={false}
            ListEmptyComponent={<Text style={styles.muted}>Sin servicios programados</Text>}
            renderItem={({ item }) => (
              <Text style={styles.calRow}>
                {item.fecha} {item.hora} — {item.tipo} — {item.nombre_difunto}
              </Text>
            )}
          />
        )}
      </ScrollView>
    </GothicBackground>
  )
}

function buildStyles(colors) {
  return StyleSheet.create({
    fill: { flex: 1 },
    inner: { padding: 16, paddingBottom: 48 },
    h1: { fontFamily: font.displayHeavy, fontSize: 20, color: colors.text },
    hint: { fontFamily: font.bodyItalic, color: colors.muted, marginBottom: 12, marginTop: 4 },
    row: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
    rowWrap: { flexWrap: 'wrap', flexDirection: 'row', gap: 8, marginBottom: 12 },
    inputFlex: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 2,
      padding: 12,
      color: colors.text,
      backgroundColor: colors.inputBg,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 2,
      padding: 12,
      color: colors.text,
      backgroundColor: colors.inputBg,
      marginBottom: 8,
    },
    inputDate: { minWidth: 140, flex: 1 },
    flex1: { flex: 1 },
    cvv: { width: 80 },
    btnBuscar: { backgroundColor: colors.accentSoft, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 2 },
    btnBuscarTxt: { color: colors.text, fontFamily: font.bodySemi },
    ok: { color: '#4ade80', marginBottom: 8 },
    horas: { flexDirection: 'row', gap: 8 },
    chip: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 2 },
    chipOn: { borderColor: colors.accent, backgroundColor: colors.funerariaChipOn },
    chipTxt: { color: colors.textDim },
    servCard: {
      padding: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.purple,
      backgroundColor: colors.funerariaCal,
      borderRadius: 2,
    },
    servTitle: { fontFamily: font.bodySemi, color: colors.accent, fontSize: 17 },
    servPrecio: { color: colors.textDim, marginVertical: 6 },
    btnContratar: { alignSelf: 'flex-start', backgroundColor: colors.accentSoft, paddingHorizontal: 14, paddingVertical: 8 },
    btnContratarTxt: { color: colors.text },
    label: { fontFamily: font.bodySemi, color: colors.muted, marginTop: 8 },
    total: { fontFamily: font.displayRegular, color: colors.gold, fontSize: 18, marginVertical: 8 },
    carritoBox: { marginBottom: 12 },
    carritoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    carritoTxt: { color: colors.textDim, flex: 1, fontSize: 13 },
    quitar: { color: colors.danger },
    btnPactar: {
      backgroundColor: colors.accentSoft,
      padding: 14,
      alignItems: 'center',
      borderRadius: 2,
      marginTop: 8,
    },
    btnPactarTxt: { fontFamily: font.displayRegular, color: colors.text, letterSpacing: 1 },
    pagoBox: { marginTop: 12, padding: 12, borderWidth: 1, borderColor: colors.border },
    radioRow: { padding: 10, marginBottom: 6, borderWidth: 1, borderColor: colors.border, borderRadius: 2 },
    radioOn: { borderColor: colors.accent },
    radioTxt: { color: colors.text },
    btnConfirm: {
      flex: 1,
      backgroundColor: '#14532d',
      padding: 12,
      alignItems: 'center',
      borderRadius: 2,
    },
    btnConfirmTxt: { color: '#fff', fontWeight: '700' },
    cancel: { color: colors.accent, padding: 12 },
    muted: { color: colors.muted },
    calRow: { color: colors.textDim, marginBottom: 4, fontSize: 14 },
  })
}
