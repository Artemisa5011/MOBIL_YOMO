import { useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  TextInput,
  ActivityIndicator,
  Modal,
  Switch,
} from 'react-native'
import { ScreenScroll } from '../components/ScreenScroll'
import { OrnamentDivider } from '../components/OrnamentDivider'
import { useTheme } from '../contexts/ThemeProvider'
import { font } from '../theme/typography'
import { useAuth } from '../contexts/useAuth'
import * as solicitudesApi from '../api/solicitudesApi'
import { toastSuccess, toastError, toastInfo } from '../lib/appToast'

const LOGO_OSCURO = require('../../assets/logo.jpg')
const LOGO_CLARO = require('../../assets/logo_claro.jpg')

const emptyForm = () => ({ nombre: '', cedula: '', telefono: '', correo: '', mensaje: '' })

export default function HomeScreen({ navigation }) {
  const { colors, isDark, setMode } = useTheme()
  const styles = useMemo(() => buildStyles(colors), [colors])
  const { isAuthenticated, isVendedor, isCliente, nombreCompleto, signOut } = useAuth()
  const [form, setForm] = useState(emptyForm)
  const [enviando, setEnviando] = useState(false)
  const [modalServicio, setModalServicio] = useState(null)

  const irFuneraria = () => {
    setModalServicio(null)
    if (!isAuthenticated) {
      navigation.navigate('Login')
      return
    }
    if (isCliente) {
      navigation.navigate('MiDifuntos')
      return
    }
    navigation.navigate('Panel', { screen: 'Funeraria' })
  }

  const irCementerio = () => {
    setModalServicio(null)
    if (!isAuthenticated) {
      navigation.navigate('Login')
      return
    }
    if (isCliente) {
      navigation.navigate('MiDifuntos')
      return
    }
    navigation.navigate('Panel', { screen: 'Cementerio' })
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
    <ScreenScroll contentStyle={styles.scrollContent}>
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

      <View style={styles.themeRow}>
        <Text style={styles.themeLabel}>Apariencia</Text>
        <View style={styles.themeSwitchWrap}>
          <Text style={styles.themeHint}>{isDark ? 'Oscuro' : 'Claro'}</Text>
          <Switch
            value={isDark}
            onValueChange={(v) => setMode(v ? 'dark' : 'light')}
            trackColor={{ false: colors.border, true: colors.accentSoft }}
            thumbColor={colors.card}
          />
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

      {!isAuthenticated ? (
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.btnPrimary, pressed && styles.pressed]}
            onPress={() => navigation.navigate('Login')}
            android_ripple={{ color: colors.accentGlow }}
          >
            <Text style={styles.btnPrimaryText}>Cruzar el umbral — Iniciar sesión</Text>
          </Pressable>
          <Pressable style={styles.registroBtn} onPress={() => navigation.navigate('RegistroCliente')}>
            <Text style={styles.registroTxt}>Crear cuenta cliente (Mis difuntos)</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.sessionCard}>
          <Text style={styles.sessionLabel}>Presencia reconocida</Text>
          <Text style={styles.sessionName}>{nombreCompleto}</Text>
          <Text style={styles.role}>
            {isCliente ? 'Cliente del portal' : isVendedor ? 'Vendedor o administrador' : 'Rol no definido'}
          </Text>
          <View style={{ marginVertical: 12 }}>
            <OrnamentDivider />
          </View>
          <Pressable
            style={({ pressed }) => [styles.btnGhost, pressed && styles.pressed]}
            onPress={() => signOut()}
            android_ripple={{ color: colors.ripple }}
          >
            <Text style={styles.btnGhostText}>Cerrar sesión</Text>
          </Pressable>
        </View>
      )}

      <Modal visible={modalServicio === 'funeraria'} transparent animationType="fade" onRequestClose={() => setModalServicio(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalServicio(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Funeraria</Text>
            <Text style={styles.modalBody}>
              Rituales, ofrendas y sombras. Venta desde el panel Funeraria (vendedor/admin) o consulta en Mis difuntos si eres cliente.
            </Text>
            <Pressable style={styles.modalCta} onPress={irFuneraria}>
              <Text style={styles.modalCtaTxt}>Continuar</Text>
            </Pressable>
            <Pressable onPress={() => setModalServicio(null)}>
              <Text style={styles.modalClose}>Cerrar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={modalServicio === 'cementerio'} transparent animationType="fade" onRequestClose={() => setModalServicio(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalServicio(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Cementerio</Text>
            <Text style={styles.modalBody}>
              Lotes por pecado, test de la sombra y reserva. Vendedor/admin: pantalla Cementerio. Cliente: Mis difuntos.
            </Text>
            <Pressable style={styles.modalCta} onPress={irCementerio}>
              <Text style={styles.modalCtaTxt}>Continuar</Text>
            </Pressable>
            <Pressable onPress={() => setModalServicio(null)}>
              <Text style={styles.modalClose}>Cerrar</Text>
            </Pressable>
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
    themeRow: {
      marginTop: 14,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.panel,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    themeLabel: { fontFamily: font.bodySemi, fontSize: 15, color: colors.textDim },
    themeSwitchWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    themeHint: { fontFamily: font.bodyItalic, fontSize: 14, color: colors.muted },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.modalScrim,
      justifyContent: 'center',
      padding: 20,
    },
    modalCard: {
      padding: 20,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bgElevated,
    },
    modalTitle: { fontFamily: font.displayHeavy, fontSize: 20, color: colors.accent, marginBottom: 10 },
    modalBody: { color: colors.textDim, lineHeight: 22, marginBottom: 16 },
    modalCta: {
      backgroundColor: colors.accentSoft,
      padding: 14,
      alignItems: 'center',
      borderRadius: 2,
      marginBottom: 10,
    },
    modalCtaTxt: { color: colors.text, fontFamily: font.bodySemi },
    modalClose: { color: colors.muted, textAlign: 'center' },
    registroBtn: { marginTop: 14, alignItems: 'center' },
    registroTxt: { color: colors.accent, fontFamily: font.bodyItalic, fontSize: 15 },
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
    actions: { marginTop: 22 },
    btnPrimary: {
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 2,
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      alignItems: 'center',
    },
    pressed: { opacity: 0.88 },
    btnPrimaryText: {
      fontFamily: font.displayRegular,
      fontSize: 13,
      letterSpacing: 1.5,
      color: colors.text,
    },
    sessionCard: {
      marginTop: 20,
      padding: 20,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.sessionSurface,
    },
    sessionLabel: {
      fontFamily: font.bodyItalic,
      fontSize: 13,
      color: colors.muted,
    },
    sessionName: {
      fontFamily: font.displayRegular,
      fontSize: 20,
      color: colors.text,
      marginTop: 6,
    },
    role: {
      fontFamily: font.body,
      fontSize: 16,
      color: colors.accent,
      marginTop: 6,
    },
    btnGhost: {
      marginTop: 8,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: 'transparent',
    },
    btnGhostText: {
      fontFamily: font.bodySemi,
      fontSize: 16,
      color: colors.textDim,
    },
  })
}
