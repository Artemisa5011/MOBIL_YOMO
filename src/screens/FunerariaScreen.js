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

export default function FunerariaScreen({ route, navigation }) {
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
  const [cedulaNoRegistrada, setCedulaNoRegistrada] = useState(false)

  const irARegistrarCliente = () => {
    const c = cedula.trim()
    if (!c) return
    navigation.getParent()?.navigate('Clientes', {
      screen: 'ClienteNuevo',
      params: { cedula: c },
    })
  }

  const onCedulaChange = (t) => {
    setCedula(t)
    setCedulaNoRegistrada(false)
  }

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
        setCedulaNoRegistrada(true)
        toastInfo('Cliente', 'No hay registro con esta cédula. Puedes crearlo desde el botón de abajo.')
        return
      }
      setCedulaNoRegistrada(false)
      if (data.estado !== 'activo' && data.estado !== 'verdugo') {
        setCliente(null)
        toastInfo('Cliente', 'El cliente no puede contratar servicios')
        return
      }
      setCliente(data)
    } catch (err) {
      toastError('Error', err.message)
      setCedulaNoRegistrada(false)
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
            onChangeText={onCedulaChange}
            keyboardType="numeric"
          />
          <Pressable style={styles.btnBuscar} onPress={() => buscarCliente(cedula)}>
            <Text style={styles.btnBuscarTxt}>Buscar</Text>
          </Pressable>
        </View>
        {cedulaNoRegistrada ? (
          <View style={styles.notFoundBox}>
            <Text style={styles.notFoundText}>Esta cédula no está en el registro de almas.</Text>
            <Pressable style={styles.notFoundBtn} onPress={irARegistrarCliente}>
              <Text style={styles.notFoundBtnTxt}>Registrar nuevo cliente</Text>
            </Pressable>
          </View>
        ) : null}
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
    inner: { padding: 14, paddingBottom: 44 },
    h1: { fontFamily: font.displayHeavy, fontSize: 19, color: colors.text, letterSpacing: 0.3 },
    hint: { fontFamily: font.bodyItalic, fontSize: 13, lineHeight: 18, color: colors.muted, marginBottom: 10, marginTop: 4, textAlign: 'justify' },
    row: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
    rowWrap: { flexWrap: 'wrap', flexDirection: 'row', gap: 8, marginBottom: 10 },
    inputFlex: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      color: colors.text,
      backgroundColor: colors.inputBg,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      color: colors.text,
      backgroundColor: colors.inputBg,
      marginBottom: 8,
    },
    inputDate: { minWidth: 140, flex: 1 },
    flex1: { flex: 1 },
    cvv: { width: 80 },
    btnBuscar: {
      backgroundColor: colors.accentSoft,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    btnBuscarTxt: { color: colors.text, fontFamily: font.displayRegular, fontSize: 12, letterSpacing: 0.6 },
    notFoundBox: {
      marginBottom: 12,
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.goldMuted,
      backgroundColor: colors.panel,
    },
    notFoundText: {
      color: colors.textDim,
      fontFamily: font.bodyItalic,
      fontSize: 14,
      marginBottom: 10,
    },
    notFoundBtn: {
      alignSelf: 'flex-start',
      backgroundColor: colors.accentSoft,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    notFoundBtnTxt: { color: colors.text, fontFamily: font.bodySemi, fontSize: 14 },
    ok: { color: '#4ade80', marginBottom: 8 },
    horas: { flexDirection: 'row', gap: 8 },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      backgroundColor: colors.card,
    },
    chipOn: { borderColor: colors.accent, backgroundColor: colors.funerariaChipOn },
    chipTxt: { color: colors.textDim },
    servCard: {
      padding: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.purple,
      backgroundColor: colors.funerariaCal,
      borderRadius: 12,
    },
    servTitle: { fontFamily: font.bodySemi, color: colors.accent, fontSize: 17 },
    servPrecio: { color: colors.textDim, marginVertical: 6 },
    btnContratar: {
      alignSelf: 'flex-start',
      backgroundColor: colors.accentSoft,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    btnContratarTxt: { color: colors.text, fontFamily: font.displayRegular, fontSize: 12, letterSpacing: 0.6 },
    label: { fontFamily: font.bodySemi, color: colors.muted, marginTop: 8 },
    total: { fontFamily: font.displayRegular, color: colors.gold, fontSize: 16, marginVertical: 8, letterSpacing: 0.6 },
    carritoBox: { marginBottom: 12 },
    carritoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    carritoTxt: { color: colors.textDim, flex: 1, fontSize: 13 },
    quitar: { color: colors.danger },
    btnPactar: {
      backgroundColor: colors.accentSoft,
      paddingVertical: 12,
      paddingHorizontal: 14,
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      marginTop: 8,
    },
    btnPactarTxt: { fontFamily: font.displayRegular, color: colors.text, fontSize: 12, letterSpacing: 0.9 },
    pagoBox: { marginTop: 12, padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.panel },
    radioRow: { padding: 10, marginBottom: 6, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.card },
    radioOn: { borderColor: colors.accent },
    radioTxt: { color: colors.text },
    btnConfirm: {
      flex: 1,
      backgroundColor: '#14532d',
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 12,
    },
    btnConfirmTxt: { color: '#fff', fontFamily: font.displayRegular, fontSize: 12, letterSpacing: 0.6 },
    cancel: { color: colors.accent, padding: 12 },
    muted: { color: colors.muted },
    calRow: { color: colors.textDim, marginBottom: 4, fontSize: 14 },
  })
}
