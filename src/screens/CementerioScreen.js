import { useState, useCallback, useMemo } from 'react' // useState: para el estado de la cédula, useCallback: para evitar recálculos innecesarios, useMemo: para memoizar el estilo
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native' // React Native: para el UI
import { useFocusEffect } from '@react-navigation/native' // useFocusEffect: para escuchar cambios en la navegación
import { GothicBackground } from '../components/GothicBackground'
import { CementerioReservasBlock } from './CementerioReservasBlock' // componente para las reservas del cementerio
import * as clientesApi from '../api/clientesApi'
import * as lotesApi from '../api/lotesApi' // api para los lotes
import * as reservasCementerioApi from '../api/reservasCementerioApi' // api para las reservas del cementerio en tiempo real 
import { useAuth } from '../contexts/useAuth' // contexto para el usuario autenticado
import {
  PREGUNTAS_SOMBRA,
  PREGUNTA_PECADO_INICIAL,
  calcularResultadoSombra, // función para calcular el resultado del test de la sombra
  COSTO_CAMBIO_LOTE, // costo para cambiar de lote
} from '../constants/yomiBusiness' // constantes de la app
import { useTheme } from '../contexts/ThemeProvider' // contexto para el tema global
import { toastSuccess, toastError, toastInfo } from '../lib/appToast' // funciones para mostrar mensajes de éxito, error y información
import { font } from '../theme/typography' // fuentes de la app

const fmt = (n) => Number(n ?? 0).toLocaleString('es-CO') // función para formatear un número como una cadena de texto

export default function CementerioScreen({ route, navigation }) {
  const { colors } = useTheme() 
  const styles = useMemo(() => buildStyles(colors), [colors])
  const { user } = useAuth()
  const cedulaParam = route.params?.cedula || '' // cedulaParam: cédula del cliente parámetro de la ruta (si existe)  
  const [paso, setPaso] = useState(1) // paso: paso actual del proceso  
  const [respuestas, setRespuestas] = useState({}) // respuestas: respuestas del test de la sombra
  const [cliente, setCliente] = useState(null) // cliente: cliente del cementerio
  const [cedula, setCedula] = useState(cedulaParam) // cedula: cédula del cliente
  const [lotes, setLotes] = useState([]) // lotes: lotes del cementerio
  const [lotesLoading, setLotesLoading] = useState(true) // lotesLoading: si se está cargando la lista de lotes
  const [loteAsignado, setLoteAsignado] = useState(null) // loteAsignado: lote asignado al cliente
  const [loteSeleccionado, setLoteSeleccionado] = useState(null) // loteSeleccionado: lote seleccionado por el cliente  
  const [cambioManual, setCambioManual] = useState(false) // cambioManual: si se está cambiando manualmente el lote
  const [reservaTipo, setReservaTipo] = useState('') // reservaTipo: tipo de reserva
  const [nombreDifunto, setNombreDifunto] = useState('') // nombreDifunto: nombre del difunto
  const [metodoPago, setMetodoPago] = useState('') // metodoPago: método de pago
  const [nombreCondenado, setNombreCondenado] = useState('') // nombreCondenado: nombre del condenado
  const [tarjetaNumero, setTarjetaNumero] = useState('') // tarjetaNumero: número de la tarjeta
  const [tarjetaVencimiento, setTarjetaVencimiento] = useState('') // tarjetaVencimiento: vencimiento de la tarjeta
  const [tarjetaCVV, setTarjetaCVV] = useState('') // tarjetaCVV: CVV de la tarjeta
  const [loading, setLoading] = useState(false) // loading: si se está cargando el proceso
  const [respuestasSombra, setRespuestasSombra] = useState({}) // respuestasSombra: respuestas del test de la sombra
  const [reservarAlmasInocentes, setReservarAlmasInocentes] = useState(false) // reservarAlmasInocentes: si se está reservando almas inocentes
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

  const cargarLotes = async () => { // cargarLotes: función para cargar la lista de lotes 
    setLotesLoading(true) // activar el loading 
    try {
      const data = await lotesApi.listLotes() // lista de lotes
      setLotes(data) // actualizar la lista de lotes
    } finally {
      setLotesLoading(false) // desactivar el loading
    }
  }

  useFocusEffect( // useFocusEffect: para escuchar cambios en la navegación
    useCallback(() => {
      cargarLotes()
      if (cedulaParam) { // si existe un cédulaParam, setear la cédula y buscar el cliente
        setCedula(cedulaParam) // setear la cédula
        buscarCliente(cedulaParam) // buscar el cliente
      }
    }, [cedulaParam])
  )

  const buscarCliente = async (ced) => { // buscarCliente: función para buscar un cliente por cédula
    if (!ced?.trim()) return // si la cédula no es válida, retornar
    try {
      const { data, notFound } = await clientesApi.getClienteByCedula(ced) // buscar el cliente por cédula
      if (notFound) {
        setCliente(null)
        setCedulaNoRegistrada(true)
        toastInfo('Cliente', 'No hay registro con esta cédula. Puedes crearlo desde el botón de abajo.')
        return
      }
      setCedulaNoRegistrada(false)
      setCliente(data) // setear el cliente como el cliente encontrado
    } catch (err) {
      toastError('Error', err.message)
      setCedulaNoRegistrada(false)
    }
  }

  const asignarLote = () => { // asignarLote: función para asignar un lote al cliente
    if (lotes.length === 0) return null // si no hay lotes, retornar null si no hay respuestas, retornar null
    const pecado = respuestas.pecado?.toLowerCase() || 'ira'
    const mapaPecado = {
      lujuria: 'LUJURIA',
      gula: 'GULA',
      avaricia: 'AVARICIA',
      pereza: 'PEREZA',
      ira: 'IRA',
      envidia: 'ENVIDIA',
      soberbia: 'SOBERBIA',
    }
    const nombreBuscado = mapaPecado[pecado] || 'IRA'
    const disponibles = lotes.filter((l) => l.nombre === nombreBuscado && l.capacidad_ocupada < l.capacidad_total)
    if (disponibles.length === 0) {
      const cualquiera = lotes.find((l) => l.capacidad_ocupada < l.capacidad_total)
      return cualquiera || null
    }
    return disponibles[0]
  }

  const handleAsignarLote = () => { // handleAsignarLote: función para asignar un lote al cliente
    if (!cliente) {
      toastInfo('Cliente', 'Busca y valida el cliente primero') // mostrar un mensaje de error
      return
    }
    if (lotesLoading) {
      toastInfo('Lotes', 'Espera a que carguen los lotes') // mostrar un mensaje de error
      return
    }
    const lote = asignarLote()
    if (!lote) {
      toastInfo('Lotes', 'No hay lotes disponibles.') // mostrar un mensaje de error
      return
    }
    setLoteAsignado(lote)
    setPaso(2) // pasar al paso 2
  }

  const loteEfectivo = () => { // loteEfectivo: función para obtener el lote efectivo
    if (reservarAlmasInocentes) {
      const almas = lotes.find((l) => l.nombre === 'ALMAS INOCENTES' && l.capacidad_ocupada < l.capacidad_total)
      return almas || null // si hay almas inocentes, retornar el lote de almas inocentes, si no, retornar null
    }
    return loteSeleccionado || loteAsignado // si hay un lote seleccionado, retornar el lote seleccionado, si no, retornar el lote asignado
  }

  const valorTotal = () => { // valorTotal: función para calcular el valor total de la reserva
    const lote = loteEfectivo()
    if (!lote) return 0 // si no hay lote, retornar 0 si no hay lote, retornar 0
    let valorLote = Number(lote.valor) || 0 // valor del lote
    let valorExcedente = 0 // valor excedente
    if (reservarAlmasInocentes && !loteSeleccionado) { // si se está reservando almas inocentes y no hay lote seleccionado, agregar el valor del lote asignado
      valorExcedente += Number(loteAsignado?.valor) || 0 // agregar el valor del lote asignado
      valorExcedente += COSTO_CAMBIO_LOTE // agregar el costo de cambio de lote
    }
    if (cambioManual) valorExcedente += COSTO_CAMBIO_LOTE // si se está cambiando manualmente el lote, agregar el costo de cambio de lote
    return valorLote + valorExcedente // retornar el valor total de la reserva
  }

  const confirmarReserva = async () => { // confirmarReserva: función para confirmar la reserva
    if (!cliente) {
      toastInfo('Cliente', 'Busca y valida el cliente primero')
      return
    }
    const lote = loteEfectivo() // obtener el lote efectivo
    if (!lote) {
      toastInfo('Lote', 'Asigna un lote o verifica Almas Inocentes') // mostrar un mensaje de error
      return
    }
    if (reservarAlmasInocentes && !lotes.find((l) => l.nombre === 'ALMAS INOCENTES' && l.capacidad_ocupada < l.capacidad_total)) {
      toastInfo('Lote', 'No hay capacidad en Almas Inocentes') // mostrar un mensaje de error
      return
    }
    if (cambioManual && reservarAlmasInocentes && !loteSeleccionado) {
      toastInfo('Lote', 'Selecciona un lote de la lista al cambiar manualmente') // mostrar un mensaje de error 
      return
    }
    if (!reservaTipo) {
      toastInfo('Reserva', 'Indica con o sin difunto')
      return
    }
    if (reservaTipo === 'reservado_con_difunto' && !nombreDifunto?.trim()) {
      toastInfo('Difunto', 'Indica el nombre del difunto')
      return
    }
    if (!metodoPago) {
      toastInfo('Pago', 'Selecciona método de pago')
      return
    }
    if (metodoPago === 'con_la_vida' && !nombreCondenado?.trim()) {
      toastInfo('Pago', 'Indica el nombre del condenado')
      return
    }
    if (metodoPago === 'tarjeta') {
      const num = tarjetaNumero.replace(/\s/g, '')
      if (num.length < 16) {
        toastInfo('Tarjeta', '16 dígitos')
        return
      }
      if (!tarjetaVencimiento.trim() || tarjetaCVV.length < 3) {
        toastInfo('Tarjeta', 'Completa datos de tarjeta')
        return
      }
    }
    const resultadoSombra = calcularResultadoSombra(respuestasSombra)
    if (!resultadoSombra.pecado) {
      toastInfo('Test', 'Responde todas las preguntas del Test de la Sombra')
      return
    }
    setLoading(true)
    try {
      if (metodoPago === 'tarjeta') await new Promise((r) => setTimeout(r, 1500))
      const portalUserId = await reservasCementerioApi.getPortalUserIdByCedula(cliente?.cedula)
      await reservasCementerioApi.createReserva({
        cliente_id: cliente.id,
        lote_id: lote.id,
        user_id: user.id,
        cliente_user_id: portalUserId,
        estado: reservaTipo,
        nombre_difunto: reservaTipo === 'reservado_con_difunto' ? nombreDifunto.trim() : null,
        cambio_manual: cambioManual,
        metodo_pago: metodoPago,
        nombre_condenado: metodoPago === 'con_la_vida' ? nombreCondenado.trim() : null,
        valor_base: lote.valor,
        valor_adicional:
          (reservarAlmasInocentes && !loteSeleccionado ? (Number(loteAsignado?.valor) || 0) + COSTO_CAMBIO_LOTE : 0) +
          (cambioManual ? COSTO_CAMBIO_LOTE : 0),
        valor_total: valorTotal(),
        estado_pago: 'confirmado',
        sombra_pecado: resultadoSombra.pecado,
        sombra_puntajes: resultadoSombra.puntajes,
        sombra_bloqueado: true,
      })
      await clientesApi.updateCliente(cliente.id, { estado: 'verdugo' })
      toastSuccess('Éxito', 'Reserva confirmada. Pago recibido.')
      setPaso(1)
      setLoteAsignado(null)
      setLoteSeleccionado(null)
      setRespuestas({})
      setReservaTipo('')
      setNombreDifunto('')
      setMetodoPago('')
      setNombreCondenado('')
      setTarjetaNumero('')
      setTarjetaVencimiento('')
      setTarjetaCVV('')
      setCambioManual(false)
      setReservarAlmasInocentes(false)
      setRespuestasSombra({})
      cargarLotes()
    } catch (err) {
      toastError('Error', err.message)
    } finally {
      setLoading(false)
    }
  }

  const p = PREGUNTA_PECADO_INICIAL
  const resultadoLive = calcularResultadoSombra(respuestasSombra)
  const lotesOrdenados = useMemo(() => {
    const rows = Array.isArray(lotes) ? [...lotes] : []
    return rows.sort((a, b) => {
      const na = String(a?.nombre || '').localeCompare(String(b?.nombre || ''), 'es')
      if (na !== 0) return na
      return String(a?.codigo || '').localeCompare(String(b?.codigo || ''), 'es')
    })
  }, [lotes])

  return (
    <GothicBackground style={styles.fill}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.h1}>Cementerio</Text>
        <Text style={styles.hint}>Asignación de lotes y test de la sombra (misma lógica que la web).</Text>

        <View style={styles.row}>
          <TextInput
            style={styles.inputFlex}
            placeholder="Cédula"
            placeholderTextColor={colors.muted}
            value={cedula}
            onChangeText={onCedulaChange}
            keyboardType="numeric"
          />
          <Pressable style={styles.btnSm} onPress={() => buscarCliente(cedula)}>
            <Text style={styles.btnSmTxt}>Buscar</Text>
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
        {cliente ? <Text style={styles.ok}>Cliente: {cliente.nombre_completo}</Text> : null}

        <View style={styles.catalogoBox}>
          <View style={styles.catalogoHead}>
            <Text style={styles.catalogoTitle}>Catálogo de lotes</Text>
            <Pressable style={styles.catalogoReload} onPress={cargarLotes} disabled={lotesLoading}>
              <Text style={styles.catalogoReloadTxt}>{lotesLoading ? 'Cargando…' : 'Actualizar'}</Text>
            </Pressable>
          </View>
          {lotesLoading ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: 8 }} />
          ) : lotesOrdenados.length === 0 ? (
            <Text style={styles.muted}>No hay lotes para mostrar (catálogo vacío o sin permisos).</Text>
          ) : (
            <ScrollView style={styles.catalogoList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {lotesOrdenados.map((l) => (
                <View key={String(l.id)} style={styles.catalogoRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.catalogoName} numberOfLines={1}>
                      {l.nombre || 'Lote'}
                    </Text>
                    <Text style={styles.catalogoMeta} numberOfLines={1}>
                      {l.codigo ? `Código ${l.codigo}` : '—'} · Ocupación {l.capacidad_ocupada ?? 0}/{l.capacidad_total ?? 0}
                    </Text>
                  </View>
                  <Text style={styles.catalogoPrice}>${fmt(l.valor)}</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {paso === 1 && (
          <View>
            <Text style={styles.label}>{p.texto}</Text>
            <View style={styles.wrap}>
              {p.opciones.map((o) => (
                <Pressable
                  key={o}
                  style={[styles.opt, respuestas[p.id] === o && styles.optOn]}
                  onPress={() => setRespuestas({ ...respuestas, [p.id]: o })}
                >
                  <Text style={styles.optTxt}>{o}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              style={[styles.btnMain, (!cliente || lotesLoading) && styles.disabled]}
              onPress={handleAsignarLote}
              disabled={lotesLoading || !cliente}
            >
              <Text style={styles.btnMainTxt}>{lotesLoading ? 'Cargando lotes…' : 'Asignar lote'}</Text>
            </Pressable>
          </View>
        )}

        {paso === 2 && (
          <View>
            {loteEfectivo() ? (
              <View style={styles.boxLote}>
                <Text style={styles.loteTitle}>
                  Lote: {loteSeleccionado ? loteSeleccionado.nombre : loteEfectivo()?.nombre}
                </Text>
                <Text style={styles.dim}>Código: {loteEfectivo()?.codigo}</Text>
                <Text style={styles.dim}>
                  Valor: ${fmt(loteEfectivo()?.valor || 0)}
                  {reservarAlmasInocentes && !loteSeleccionado
                    ? ` + $${fmt(loteAsignado?.valor || 0)} + $${fmt(COSTO_CAMBIO_LOTE)}`
                    : ''}
                  {cambioManual ? ` + $${fmt(COSTO_CAMBIO_LOTE)} (manual)` : ''}
                </Text>
                {!cambioManual && reservarAlmasInocentes && (
                  <Pressable onPress={() => setCambioManual(true)}>
                    <Text style={styles.link}>Cambiar lote manualmente (+$1.000.000)</Text>
                  </Pressable>
                )}
              </View>
            ) : null}

            {cambioManual && (
              <View style={styles.manualBox}>
                <Text style={styles.label}>Elegir otro lote</Text>
                <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled>
                  {lotes
                    .filter((l) => l.capacidad_ocupada < l.capacidad_total && l.nombre !== 'ALMAS INOCENTES')
                    .map((l) => (
                      <Pressable
                        key={l.id}
                        style={[styles.lotePick, loteSeleccionado?.id === l.id && styles.lotePickOn]}
                        onPress={() => setLoteSeleccionado(loteSeleccionado?.id === l.id ? null : l)}
                      >
                        <Text style={styles.dim}>
                          {l.nombre} — ${fmt(l.valor)} (disp: {l.capacidad_total - l.capacidad_ocupada})
                        </Text>
                      </Pressable>
                    ))}
                </ScrollView>
              </View>
            )}

            <Text style={styles.label}>¿Reserva con difunto?</Text>
            <View style={styles.row}>
              <Pressable
                style={[styles.radio, reservaTipo === 'reservado_sin_difunto' && styles.radioOn]}
                onPress={() => setReservaTipo('reservado_sin_difunto')}
              >
                <Text style={styles.optTxt}>Sin difunto</Text>
              </Pressable>
              <Pressable
                style={[styles.radio, reservaTipo === 'reservado_con_difunto' && styles.radioOn]}
                onPress={() => setReservaTipo('reservado_con_difunto')}
              >
                <Text style={styles.optTxt}>Con difunto</Text>
              </Pressable>
            </View>
            {reservaTipo === 'reservado_con_difunto' && (
              <TextInput
                style={styles.input}
                placeholder="Nombre del difunto"
                placeholderTextColor={colors.muted}
                value={nombreDifunto}
                onChangeText={setNombreDifunto}
              />
            )}

            <Text style={styles.h2}>Test de la sombra</Text>
            {PREGUNTAS_SOMBRA.map((q) => (
              <View key={q.id} style={styles.qBox}>
                <Text style={styles.qTxt}>{q.texto}</Text>
                {q.opciones.map((o) => (
                  <Pressable
                    key={o.letra}
                    style={[styles.qOpt, respuestasSombra[q.id] === o.letra && styles.qOptOn]}
                    onPress={() => setRespuestasSombra({ ...respuestasSombra, [q.id]: o.letra })}
                  >
                    <Text style={styles.qOptTxt}>
                      {o.letra}) {o.descripcion}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ))}
            {PREGUNTAS_SOMBRA.every((x) => respuestasSombra[x.id]) && (
              <Text style={styles.resultado}>Resultado: {resultadoLive.pecado}</Text>
            )}

            <Text style={styles.label}>Valor a pagar: ${fmt(valorTotal())}</Text>
            <Pressable
              style={styles.checkRow}
              onPress={() => {
                setReservarAlmasInocentes((v) => !v)
                if (!reservarAlmasInocentes) {
                  setCambioManual(false)
                  setLoteSeleccionado(null)
                }
              }}
            >
              <Text style={styles.checkTxt}>
                {reservarAlmasInocentes ? '☑' : '☐'} Reservar en Almas Inocentes (costos extra como en web)
              </Text>
            </Pressable>

            <Text style={styles.label}>Método de pago</Text>
            {['efectivo', 'tarjeta', 'con_la_vida'].map((m) => (
              <Pressable
                key={m}
                style={[styles.radioRow, metodoPago === m && styles.radioOn]}
                onPress={() => setMetodoPago(m)}
              >
                <Text style={styles.optTxt}>
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
                  placeholder="Tarjeta 16 dígitos"
                  keyboardType="numeric"
                  value={tarjetaNumero}
                  onChangeText={(t) => setTarjetaNumero(t.replace(/\D/g, '').slice(0, 16))}
                />
                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="MM/AA"
                    value={tarjetaVencimiento}
                    onChangeText={setTarjetaVencimiento}
                  />
                  <TextInput
                    style={[styles.input, { width: 72 }]}
                    placeholder="CVV"
                    keyboardType="numeric"
                    value={tarjetaCVV}
                    onChangeText={(t) => setTarjetaCVV(t.replace(/\D/g, '').slice(0, 4))}
                  />
                </View>
              </View>
            )}

            <View style={styles.row}>
              <Pressable style={styles.btnBack} onPress={() => setPaso(1)}>
                <Text style={styles.link}>Atrás</Text>
              </Pressable>
              <Pressable
                style={[styles.btnSell, (!cliente || loading) && styles.disabled]}
                onPress={confirmarReserva}
                disabled={loading || !cliente}
              >
                {loading ? (
                  <ActivityIndicator color={colors.text} />
                ) : (
                  <Text style={styles.btnSellTxt}>Sellar destino</Text>
                )}
              </Pressable>
            </View>
          </View>
        )}

        <CementerioReservasBlock />
      </ScrollView>
    </GothicBackground>
  )
}

function buildStyles(colors) {
  return StyleSheet.create({
    fill: { flex: 1 },
    inner: { padding: 16, paddingBottom: 48 },
    h1: { fontFamily: font.displayHeavy, fontSize: 22, color: colors.text },
    h2: { fontFamily: font.displayRegular, color: colors.gold, marginTop: 12, marginBottom: 8 },
    hint: { color: colors.muted, fontFamily: font.bodyItalic, marginVertical: 8, textAlign: 'justify' },
    row: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
    inputFlex: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 10,
      color: colors.text,
      borderRadius: 2,
      backgroundColor: colors.inputBg,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      padding: 10,
      color: colors.text,
      marginBottom: 8,
      borderRadius: 2,
      backgroundColor: colors.inputBg,
    },
    btnSm: { backgroundColor: colors.accentSoft, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 2 },
    btnSmTxt: { color: colors.text },
    notFoundBox: {
      marginBottom: 12,
      padding: 12,
      borderRadius: 2,
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
      borderRadius: 2,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    notFoundBtnTxt: { color: colors.text, fontFamily: font.bodySemi, fontSize: 14 },
    ok: { color: '#4ade80', marginBottom: 8 },
    catalogoBox: {
      marginTop: 10,
      marginBottom: 10,
      padding: 12,
      borderRadius: 2,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.panel,
    },
    catalogoHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    catalogoTitle: { fontFamily: font.displayRegular, color: colors.gold, letterSpacing: 1.2 },
    catalogoReload: {
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 2,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    catalogoReloadTxt: { color: colors.textDim, fontFamily: font.bodySemi, fontSize: 12 },
    catalogoList: { maxHeight: 220, marginTop: 10 },
    catalogoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    catalogoName: { color: colors.text, fontFamily: font.bodySemi, fontSize: 14 },
    catalogoMeta: { color: colors.muted, fontFamily: font.bodyItalic, fontSize: 12, marginTop: 2 },
    catalogoPrice: { color: colors.accent, fontFamily: font.bodySemi, fontSize: 14 },
    label: { color: colors.muted, fontFamily: font.bodySemi, marginTop: 8, marginBottom: 4 },
    wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    opt: { padding: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 16 },
    optOn: { backgroundColor: colors.cementerioOptOn, borderColor: colors.accent },
    optTxt: { color: colors.textDim, fontSize: 13 },
    btnMain: { marginTop: 12, backgroundColor: colors.accentSoft, padding: 14, alignItems: 'center', borderRadius: 2 },
    btnMainTxt: { color: colors.text, fontWeight: '700' },
    disabled: { opacity: 0.5 },
    boxLote: {
      padding: 12,
      borderWidth: 1,
      borderColor: colors.accent,
      marginBottom: 12,
      borderRadius: 2,
      backgroundColor: colors.cementerioLoteBox,
    },
    loteTitle: { color: colors.accent, fontFamily: font.bodySemi, fontSize: 16 },
    dim: { color: colors.textDim, marginTop: 4, fontSize: 13 },
    link: { color: colors.gold, marginTop: 8 },
    manualBox: { marginBottom: 12 },
    lotePick: { padding: 8, borderWidth: 1, borderColor: colors.border, marginBottom: 4, borderRadius: 2 },
    lotePickOn: { borderColor: colors.accent, backgroundColor: colors.cementerioLoteOn },
    radio: { padding: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 2 },
    radioOn: { borderColor: colors.accent },
    radioRow: { padding: 10, marginBottom: 6, borderWidth: 1, borderColor: colors.border, borderRadius: 2 },
    qBox: { marginBottom: 12, padding: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 2 },
    qTxt: { color: colors.accent, marginBottom: 6, fontSize: 13 },
    qOpt: { padding: 8, marginBottom: 4, borderWidth: 1, borderColor: colors.border, borderRadius: 2 },
    qOptOn: { borderColor: colors.accent, backgroundColor: colors.cementerioQOn },
    qOptTxt: { color: colors.textDim, fontSize: 12 },
    resultado: { color: colors.gold, fontFamily: font.bodySemi, marginVertical: 8 },
    checkRow: { padding: 10, marginVertical: 8 },
    checkTxt: { color: colors.textDim, fontSize: 13 },
    btnBack: { padding: 12 },
    btnSell: { flex: 1, backgroundColor: '#14532d', padding: 14, alignItems: 'center', borderRadius: 2 },
    btnSellTxt: { color: '#fff', fontWeight: '800' },
  })
}
