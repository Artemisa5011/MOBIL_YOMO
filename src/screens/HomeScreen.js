import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  TextInput,
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
} from 'react-native'
import { ScreenScroll } from '../components/ScreenScroll'
import { OrnamentDivider } from '../components/OrnamentDivider'
import { useTheme } from '../contexts/ThemeProvider'
import { font } from '../theme/typography'
import { useAuth } from '../contexts/useAuth'
import * as solicitudesApi from '../api/solicitudesApi'
import { toastSuccess, toastError, toastInfo } from '../lib/appToast'
import { supabase } from '../lib/supabase'
import * as lotesApi from '../api/lotesApi'
import {
  SERVICIOS_FUNERARIA,
  COSTO_CAMBIO_LOTE,
  COSTO_AGREGAR_DIFUNTO_RESERVA,
} from '../constants/yomiBusiness'

const LOGO_OSCURO = require('../../assets/logo.jpg')
const LOGO_CLARO = require('../../assets/logo_claro.jpg')

const emptyForm = () => ({ nombre: '', cedula: '', telefono: '', correo: '', mensaje: '' })

const fmt = (n) => Number(n ?? 0).toLocaleString('es-CO')

export default function HomeScreen({ navigation }) {
  const { colors, isDark, setMode } = useTheme()
  const styles = useMemo(() => buildStyles(colors), [colors])
  const { isAuthenticated, isVendedor, isCliente, nombreCompleto, signOut } = useAuth()
  const [form, setForm] = useState(emptyForm)
  const [enviando, setEnviando] = useState(false)
  const [modalServicio, setModalServicio] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lotesCatalogo, setLotesCatalogo] = useState([])
  const [lotesLoading, setLotesLoading] = useState(false)
  const [lotesErrorMsg, setLotesErrorMsg] = useState('')

  const lotesCatalogoUnicos = useMemo(() => {
    const rows = Array.isArray(lotesCatalogo) ? lotesCatalogo : []
    const byNombre = new Map()
    for (const l of rows) {
      const nombre = String(l?.nombre || l?.codigo || 'Lote')
      const valor = Number(l?.valor) || 0
      const prev = byNombre.get(nombre)
      if (!prev) byNombre.set(nombre, { nombre, min: valor, max: valor })
      else byNombre.set(nombre, { nombre, min: Math.min(prev.min, valor), max: Math.max(prev.max, valor) })
    }
    return [...byNombre.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  }, [lotesCatalogo])

  const cargarCatalogoLotes = useCallback(async () => {
    setLotesLoading(true)
    setLotesErrorMsg('')
    try {
      const rows = await lotesApi.listLotes()
      setLotesCatalogo(rows || [])
    } catch (e) {
      setLotesErrorMsg(e?.message || 'No se pudo cargar el catálogo.')
    } finally {
      setLotesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (modalServicio !== 'cementerio') return undefined
    let cancelled = false
    setLotesLoading(true)
    setLotesErrorMsg('')
    lotesApi
      .listLotes()
      .then((rows) => {
        if (!cancelled) setLotesCatalogo(rows || [])
      })
      .catch((e) => {
        if (!cancelled) setLotesErrorMsg(e?.message || 'No se pudo cargar el catálogo.')
      })
      .finally(() => {
        if (!cancelled) setLotesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [modalServicio])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await supabase.auth.getSession()
    } finally {
      setRefreshing(false)
    }
  }, [])

  const cerrarModalServicio = () => setModalServicio(null)

  const irPanelFuneraria = () => {
    cerrarModalServicio()
    navigation.navigate('Panel', { screen: 'Funeraria' })
  }

  const irPanelCementerio = () => {
    cerrarModalServicio()
    navigation.navigate('Panel', { screen: 'Cementerio' })
  }

  const irMisDifuntos = () => {
    cerrarModalServicio()
    navigation.navigate('MiDifuntos')
  }

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const handleContacto = async () => {
    if (!form.nombre?.trim() || !form.cedula?.trim() || !form.correo?.trim() || !form.mensaje?.trim()) {
      toastInfo('Formulario incompleto', 'Completa nombre, cédula, correo y mensaje.')
      return
    }
    setEnviando(true)
    try {
      await solicitudesApi.insertarSolicitud(form)
      toastSuccess('Enviado', 'Mensaje enviado. Te contactaremos pronto.')
      setForm(emptyForm())
    } catch (err) {
      toastError('Error', err.message || 'No se pudo enviar. Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <ScreenScroll
      contentStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
    >
      <View style={styles.hero}>
        <View style={styles.logoRing}>
          <Image
            source={isDark ? LOGO_OSCURO : LOGO_CLARO}
            style={styles.logo}
            accessibilityLabel="Logo Yomi No Hana"
          />
        </View>
        <Text style={styles.brand}>YOMI NO HANA</Text>
        <Text style={styles.tagline}>Templo fúnebre · portal móvil</Text>
        <OrnamentDivider />
        <Text style={styles.quote}>
          «Donde el silencio tiene nombre, y cada sombra guarda un pacto.»
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Umbral</Text>
        <Text style={styles.body}>
          Portal de sombras enlazado al mismo{' '}
          <Text style={styles.emphasis}>corazón de datos</Text> que el proyecto web. Los vendedores y el administrador
          recorren el registro de almas; los clientes contemplan servicios y reservas selladas a su nombre.
        </Text>
      </View>

      <View style={styles.serviciosBox}>
        <Text style={styles.serviciosTitle}>Servicios</Text>
        <Text style={styles.serviciosHint}>Elige destino (misma lógica que la web).</Text>
        <View style={styles.serviciosRow}>
          <Pressable style={styles.servicioBtn} onPress={() => setModalServicio('funeraria')}>
            <Text style={styles.servicioBtnTxt}>Funeraria</Text>
          </Pressable>
          <Pressable style={styles.servicioBtn} onPress={() => setModalServicio('cementerio')}>
            <Text style={styles.servicioBtnTxt}>Cementerio</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.accessBox}>
        {!isAuthenticated ? (
          <>
            <Text style={styles.accessTitle}>Acceso</Text>
            <Text style={styles.accessHint}>Cruza el umbral si ya tienes cuenta, o regístrate como cliente del portal.</Text>
            <View style={styles.accessRow}>
              <Pressable
                style={({ pressed }) => [styles.accessBtnMain, pressed && styles.pressed]}
                onPress={() => navigation.navigate('Login')}
                android_ripple={{ color: colors.accentGlow }}
              >
                <Text style={styles.accessBtnMainTxt}>Iniciar sesión</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.accessBtnOutline, pressed && styles.pressed]}
                onPress={() => navigation.navigate('RegistroCliente')}
                android_ripple={{ color: colors.accentGlow }}
              >
                <Text style={styles.accessBtnOutlineTxt}>Cuenta cliente</Text>
              </Pressable>
            </View>
            <Text style={styles.accessMicro}>Mis difuntos · reservas y servicios a tu nombre</Text>
          </>
        ) : (
          <>
            <Text style={styles.sessionLabel}>Presencia reconocida</Text>
            <Text style={styles.sessionName} selectable>
              {nombreCompleto}
            </Text>
            <Text style={styles.role}>
              {isCliente ? 'Cliente del portal' : isVendedor ? 'Vendedor o administrador' : 'Rol no definido'}
            </Text>
            <View style={styles.sessionDividerWrap}>
              <OrnamentDivider />
            </View>
            <Pressable
              style={({ pressed }) => [styles.btnGhost, pressed && styles.pressed]}
              onPress={() => signOut()}
              android_ripple={{ color: colors.ripple }}
            >
              <Text style={styles.btnGhostText}>Cerrar sesión</Text>
            </Pressable>
          </>
        )}
      </View>

      <View style={styles.themeRow}>
        <Text style={styles.themeLabel}>Tema</Text>
        <View style={styles.themeSegment} accessibilityRole="tablist">
          <Pressable
            onPress={() => setMode('light')}
            style={({ pressed }) => [
              styles.themeSegBtn,
              !isDark && styles.themeSegBtnActive,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: !isDark }}
            accessibilityLabel="Tema claro"
          >
            <Text style={[styles.themeSegTxt, !isDark && styles.themeSegTxtActive]}>Claro</Text>
          </Pressable>
          <Pressable
            onPress={() => setMode('dark')}
            style={({ pressed }) => [
              styles.themeSegBtn,
              isDark && styles.themeSegBtnActive,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: isDark }}
            accessibilityLabel="Tema oscuro"
          >
            <Text style={[styles.themeSegTxt, isDark && styles.themeSegTxtActive]}>Oscuro</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.contactCard}>
        <Text style={styles.contactTitle}>Contacto</Text>
        <Text style={styles.contactIntro}>
          Si deseas pactar, consultar rituales o dejar una petición, escríbenos. Los mismos datos llegan al panel de
          administración que la web.
        </Text>
        <View style={styles.contactLines}>
          <Text style={styles.contactLine}>Camino al Valle Yomi #13, Sector Oscuro</Text>
          <Text style={styles.contactLine}>Tel. +57 300 555 6661</Text>
          <Text style={styles.contactLine}>contactoinfernal@yominohana.com</Text>
        </View>
        <OrnamentDivider />

        <Text style={[styles.label, styles.labelFirst]}>Nombre *</Text>
        <TextInput
          style={styles.input}
          placeholder="Tu nombre"
          placeholderTextColor={colors.muted}
          value={form.nombre}
          onChangeText={(t) => setField('nombre', t)}
        />

        <Text style={styles.label}>Cédula *</Text>
        <TextInput
          style={styles.input}
          placeholder="Tu cédula"
          placeholderTextColor={colors.muted}
          keyboardType="numeric"
          value={form.cedula}
          onChangeText={(t) => setField('cedula', t)}
        />

        <Text style={styles.label}>Teléfono</Text>
        <TextInput
          style={styles.input}
          placeholder="Opcional"
          placeholderTextColor={colors.muted}
          keyboardType="phone-pad"
          value={form.telefono}
          onChangeText={(t) => setField('telefono', t)}
        />

        <Text style={styles.label}>Correo *</Text>
        <TextInput
          style={styles.input}
          placeholder="correo@ejemplo.com"
          placeholderTextColor={colors.muted}
          keyboardType="email-address"
          autoCapitalize="none"
          value={form.correo}
          onChangeText={(t) => setField('correo', t)}
        />

        <Text style={styles.label}>Mensaje *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Escribe tu petición…"
          placeholderTextColor={colors.muted}
          multiline
          textAlignVertical="top"
          value={form.mensaje}
          onChangeText={(t) => setField('mensaje', t)}
        />

        <Pressable
          style={({ pressed }) => [styles.btnEnviar, enviando && styles.btnDisabled, pressed && styles.pressed]}
          onPress={handleContacto}
          disabled={enviando}
          android_ripple={{ color: colors.accentGlow }}
        >
          {enviando ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={styles.btnEnviarText}>Enviar mensaje</Text>
          )}
        </Pressable>
      </View>

      <Modal visible={modalServicio === 'funeraria'} transparent animationType="fade" onRequestClose={cerrarModalServicio}>
        <Pressable style={styles.modalOverlay} onPress={cerrarModalServicio}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalLayout}>
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollInner}>
                <Text style={styles.modalTitle}>Funeraria</Text>
                <Text style={styles.modalBody}>
                  Servicios y precios de referencia (misma base que el panel de venta). Máx. 3 servicios por cliente y día; horas 00:00 u 03:00.
                </Text>
                {SERVICIOS_FUNERARIA.map((s) => (
                  <View key={s.tipo} style={styles.precioRow}>
                    <Text style={styles.precioNombre}>{s.nombre}</Text>
                    <Text style={styles.precioValor}>${fmt(s.valor)}</Text>
                  </View>
                ))}
                {isAuthenticated && isCliente ? (
                  <Pressable style={styles.modalCtaSecondary} onPress={irMisDifuntos}>
                    <Text style={styles.modalCtaSecondaryTxt}>Ver en Mis difuntos</Text>
                  </Pressable>
                ) : null}
              </ScrollView>
              <View style={styles.modalFooter}>
                {isAuthenticated && !isCliente ? (
                  <Pressable style={styles.modalFooterPrimary} onPress={irPanelFuneraria}>
                    <Text style={styles.modalFooterPrimaryTxt}>Vender en Funeraria</Text>
                  </Pressable>
                ) : null}
                <Pressable style={styles.modalCloseBtn} onPress={cerrarModalServicio}>
                  <Text style={styles.modalCloseBtnTxt}>Cerrar</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={modalServicio === 'cementerio'} transparent animationType="fade" onRequestClose={cerrarModalServicio}>
        <Pressable style={styles.modalOverlay} onPress={cerrarModalServicio}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalLayout}>
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollInner}>
                <Text style={styles.modalTitle}>Cementerio</Text>
                <Text style={styles.modalBody}>
                  Lotes según el test del alma; cargos adicionales fijos. Precios de lote según catálogo actual.
                </Text>
                <Text style={styles.modalSubTitle}>Lotes (catálogo)</Text>
                {lotesLoading ? (
                  <ActivityIndicator color={colors.accent} style={styles.modalSpinner} />
                ) : lotesErrorMsg ? (
                  <>
                    <Text style={styles.modalBody}>{lotesErrorMsg}</Text>
                    <Pressable style={styles.modalCtaSecondary} onPress={cargarCatalogoLotes}>
                      <Text style={styles.modalCtaSecondaryTxt}>Reintentar</Text>
                    </Pressable>
                  </>
                ) : lotesCatalogo.length === 0 ? (
                  <Text style={styles.modalBody}>No hay lotes en catálogo por ahora.</Text>
                ) : (
                  lotesCatalogoUnicos.map((l) => (
                    <View key={l.nombre} style={styles.precioRow}>
                      <Text style={styles.precioNombre} numberOfLines={1}>
                        {l.nombre}
                      </Text>
                      <Text style={styles.precioValor}>
                        ${l.min === l.max ? fmt(l.min) : `${fmt(l.min)}–${fmt(l.max)}`}
                      </Text>
                    </View>
                  ))
                )}
                <Text style={styles.modalSubTitle}>Cargos adicionales</Text>
                <View style={styles.precioRow}>
                  <Text style={styles.precioNombre}>Cambio de lote manual</Text>
                  <Text style={styles.precioValor}>${fmt(COSTO_CAMBIO_LOTE)}</Text>
                </View>
                <View style={styles.precioRow}>
                  <Text style={styles.precioNombre}>Reserva sin difunto (cargo adicional)</Text>
                  <Text style={styles.precioValor}>${fmt(COSTO_AGREGAR_DIFUNTO_RESERVA)}</Text>
                </View>
                {isAuthenticated && isCliente ? (
                  <Pressable style={styles.modalCtaSecondary} onPress={irMisDifuntos}>
                    <Text style={styles.modalCtaSecondaryTxt}>Ver en Mis difuntos</Text>
                  </Pressable>
                ) : null}
              </ScrollView>
              <View style={styles.modalFooter}>
                {isAuthenticated && !isCliente ? (
                  <Pressable style={styles.modalFooterPrimary} onPress={irPanelCementerio}>
                    <Text style={styles.modalFooterPrimaryTxt}>Vender en Cementerio</Text>
                  </Pressable>
                ) : null}
                <Pressable style={styles.modalCloseBtn} onPress={cerrarModalServicio}>
                  <Text style={styles.modalCloseBtnTxt}>Cerrar</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenScroll>
  )
}

function buildStyles(colors) {
  return StyleSheet.create({
    scrollContent: { paddingTop: 8 },
    hero: { alignItems: 'center', marginBottom: 8 },
    logoRing: {
      padding: 4,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.goldMuted,
      marginBottom: 18,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.45,
      shadowRadius: 16,
      elevation: 8,
    },
    logo: {
      width: 132,
      height: 132,
      borderRadius: 999,
      resizeMode: 'cover',
    },
    brand: {
      fontFamily: font.displayHeavy,
      fontSize: 26,
      letterSpacing: 3,
      color: colors.text,
      textAlign: 'center',
      textShadowColor: colors.accentGlow,
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 12,
    },
    tagline: {
      fontFamily: font.bodyItalic,
      fontSize: 17,
      color: colors.accent,
      marginTop: 6,
      textAlign: 'center',
    },
    quote: {
      fontFamily: font.bodyItalic,
      fontSize: 15,
      color: colors.textDim,
      textAlign: 'center',
      lineHeight: 24,
      paddingHorizontal: 8,
      marginTop: 4,
    },
    card: {
      marginTop: 12,
      padding: 18,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.homeCard,
      borderLeftWidth: 3,
      borderLeftColor: colors.goldMuted,
    },
    cardTitle: {
      fontFamily: font.displayRegular,
      fontSize: 14,
      letterSpacing: 4,
      color: colors.gold,
      marginBottom: 10,
    },
    body: {
      fontFamily: font.body,
      fontSize: 17,
      lineHeight: 26,
      color: colors.textDim,
      textAlign: 'justify',
    },
    emphasis: {
      fontFamily: font.bodySemi,
      color: colors.text,
    },
    serviciosBox: {
      marginTop: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 4,
      backgroundColor: colors.serviciosBox,
    },
    serviciosTitle: {
      fontFamily: font.displayRegular,
      letterSpacing: 3,
      color: colors.gold,
      marginBottom: 6,
    },
    serviciosHint: { color: colors.muted, fontFamily: font.bodyItalic, marginBottom: 12 },
    serviciosRow: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
    servicioBtn: {
      flex: 1,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.purple,
      backgroundColor: colors.serviciosBtnBg,
      borderRadius: 2,
    },
    servicioBtnTxt: { fontFamily: font.displayRegular, color: colors.text, letterSpacing: 1 },
    accessBox: {
      marginTop: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 4,
      backgroundColor: colors.serviciosBox,
    },
    accessTitle: {
      fontFamily: font.displayRegular,
      fontSize: 13,
      letterSpacing: 2,
      color: colors.gold,
      marginBottom: 4,
    },
    accessHint: {
      color: colors.muted,
      fontFamily: font.bodyItalic,
      fontSize: 12,
      lineHeight: 18,
      marginBottom: 10,
    },
    accessRow: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'stretch',
    },
    accessBtnMain: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 2,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      backgroundColor: colors.accentSoft,
      minHeight: 42,
    },
    accessBtnMainTxt: {
      fontFamily: font.displayRegular,
      fontSize: 12,
      letterSpacing: 0.8,
      color: colors.text,
      textAlign: 'center',
    },
    accessBtnOutline: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 2,
      borderWidth: 1,
      borderColor: colors.purple,
      backgroundColor: colors.serviciosBtnBg,
      minHeight: 42,
    },
    accessBtnOutlineTxt: {
      fontFamily: font.displayRegular,
      fontSize: 11,
      letterSpacing: 0.5,
      color: colors.text,
      textAlign: 'center',
    },
    accessMicro: {
      marginTop: 8,
      textAlign: 'center',
      color: colors.muted,
      fontFamily: font.bodyItalic,
      fontSize: 10,
      lineHeight: 14,
    },
    themeRow: {
      marginTop: 12,
      paddingVertical: 7,
      paddingHorizontal: 11,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.panel,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    themeLabel: {
      fontFamily: font.bodySemi,
      fontSize: 10,
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      color: colors.muted,
    },
    themeSegment: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 999,
      padding: 2,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    themeSegBtn: {
      paddingVertical: 5,
      paddingHorizontal: 12,
      borderRadius: 999,
    },
    themeSegBtnActive: {
      backgroundColor: colors.accentSoft,
    },
    themeSegTxt: {
      fontFamily: font.body,
      fontSize: 11,
      color: colors.muted,
    },
    themeSegTxtActive: {
      fontFamily: font.bodySemi,
      color: colors.text,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.modalScrim,
      justifyContent: 'center',
      padding: 20,
    },
    modalCard: {
      padding: 14,
      borderRadius: 2,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bgElevated,
      maxHeight: '90%',
      width: '100%',
    },
    modalLayout: { height: '100%' },
    modalScroll: { flex: 1 },
    modalScrollInner: { paddingBottom: 12 },
    modalTitle: { fontFamily: font.displayHeavy, fontSize: 18, color: colors.accent, marginBottom: 8, letterSpacing: 0.3 },
    modalBody: { color: colors.textDim, fontFamily: font.body, fontSize: 13, lineHeight: 19, marginBottom: 12, textAlign: 'justify' },
    modalSubTitle: {
      fontFamily: font.bodySemi,
      fontSize: 10,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      color: colors.goldMuted,
      marginTop: 10,
      marginBottom: 6,
    },
    precioRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
      paddingVertical: 6,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    precioNombre: {
      flex: 1,
      fontFamily: font.body,
      fontSize: 13,
      color: colors.textDim,
    },
    precioValor: {
      fontFamily: font.bodySemi,
      fontSize: 13,
      color: colors.accent,
    },
    modalSpinner: { marginVertical: 16 },
    modalCta: {
      backgroundColor: colors.accentSoft,
      paddingVertical: 12,
      paddingHorizontal: 12,
      alignItems: 'center',
      borderRadius: 2,
      marginTop: 10,
      marginBottom: 10,
    },
    modalCtaTxt: { color: colors.text, fontFamily: font.displayRegular, fontSize: 12, letterSpacing: 0.6 },
    modalCtaSecondary: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      alignItems: 'center',
      borderRadius: 2,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    modalCtaSecondaryTxt: { color: colors.accent, fontFamily: font.bodySemi, fontSize: 12, letterSpacing: 0.2 },
    modalFooter: {
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      flexShrink: 0,
    },
    modalFooterPrimary: {
      alignItems: 'center',
      paddingVertical: 11,
      borderRadius: 2,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      backgroundColor: colors.accentSoft,
      marginBottom: 8,
    },
    modalFooterPrimaryTxt: { color: colors.text, fontFamily: font.displayRegular, fontSize: 12, letterSpacing: 0.6 },
    modalCloseBtn: {
      alignItems: 'center',
      paddingVertical: 11,
      borderRadius: 2,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    modalCloseBtnTxt: { color: colors.textDim, fontFamily: font.displayRegular, fontSize: 12, letterSpacing: 0.6 },
    modalClose: { color: colors.muted, textAlign: 'center', marginTop: 8 },
    contactCard: {
      marginTop: 18,
      padding: 18,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.contactSurface,
      borderLeftWidth: 3,
      borderLeftColor: colors.accentSoft,
    },
    contactTitle: {
      fontFamily: font.displayRegular,
      fontSize: 14,
      letterSpacing: 3,
      color: colors.accent,
      marginBottom: 8,
    },
    contactIntro: {
      fontFamily: font.body,
      fontSize: 16,
      lineHeight: 24,
      color: colors.textDim,
      marginBottom: 12,
      textAlign: 'justify',
    },
    contactLines: { marginBottom: 8 },
    contactLine: {
      fontFamily: font.bodyItalic,
      fontSize: 15,
      color: colors.muted,
      marginBottom: 4,
    },
    label: {
      fontFamily: font.bodySemi,
      fontSize: 13,
      color: colors.textDim,
      marginBottom: 6,
      marginTop: 10,
    },
    labelFirst: { marginTop: 4 },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 2,
      padding: 14,
      color: colors.text,
      backgroundColor: colors.inputBg,
      fontFamily: font.body,
      fontSize: 17,
    },
    textArea: { minHeight: 120, paddingTop: 12 },
    btnEnviar: {
      marginTop: 18,
      paddingVertical: 16,
      alignItems: 'center',
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      borderRadius: 2,
    },
    btnEnviarText: {
      fontFamily: font.displayRegular,
      fontSize: 14,
      letterSpacing: 1.5,
      color: colors.text,
    },
    btnDisabled: { opacity: 0.65 },
    pressed: { opacity: 0.88 },
    sessionLabel: {
      fontFamily: font.bodySemi,
      fontSize: 9,
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      color: colors.muted,
      textAlign: 'left',
    },
    sessionName: {
      fontFamily: font.body,
      fontSize: 14,
      lineHeight: 20,
      color: colors.text,
      marginTop: 6,
      textAlign: 'left',
    },
    role: {
      fontFamily: font.bodyItalic,
      fontSize: 12,
      color: colors.accent,
      marginTop: 4,
      textAlign: 'left',
    },
    sessionDividerWrap: { marginVertical: 6, opacity: 0.9 },
    btnGhost: {
      marginTop: 4,
      paddingVertical: 8,
      paddingHorizontal: 12,
      alignItems: 'center',
      alignSelf: 'stretch',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      borderRadius: 2,
    },
    btnGhostText: {
      fontFamily: font.displayRegular,
      fontSize: 12,
      letterSpacing: 0.6,
      color: colors.textDim,
    },
  })
}
