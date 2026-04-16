import { useMemo } from 'react' // useState: para el estado del formulario, useMemo: para memoizar el estilo
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native'
import { GothicBackground } from '../components/GothicBackground' // componente para el fondo gótico
import { useTheme } from '../contexts/ThemeProvider' // contexto para el tema global
import { font } from '../theme/typography' // fuentes de la app
// Función para crear el componente DashboardScreen
export default function DashboardScreen({ navigation }) {
  const { colors } = useTheme()
  const styles = useMemo(() => buildStyles(colors), [colors])
// renderizar el componente
  return (
    <GothicBackground style={styles.fill}>
      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        <Text style={styles.h1}>Panel del vendedor</Text>
        <Text style={styles.sub}>Mismas rutas de negocio que la web: funeraria, cementerio y clientes.</Text>

        <Pressable style={styles.card} onPress={() => navigation.navigate('Funeraria')}>
          <Text style={styles.cardTitle}>Funeraria</Text>
          <Text style={styles.cardDesc}>Servicios fúnebres, carrito, pago y calendario en vivo.</Text>
        </Pressable>

        <Pressable style={styles.card} onPress={() => navigation.navigate('Cementerio')}>
          <Text style={styles.cardTitle}>Cementerio</Text>
          <Text style={styles.cardDesc}>Test del alma, lotes, reserva y sellado de destino.</Text>
        </Pressable>

        <Pressable
          style={styles.card}
          onPress={() =>
            navigation.getParent()?.navigate('Clientes', { screen: 'ClientesList' })
          }
        >
          <Text style={styles.cardTitle}>Clientes</Text>
          <Text style={styles.cardDesc}>Lista, búsqueda, detalle y altas.</Text>
        </Pressable>

        <Pressable
          style={styles.card}
          onPress={() => navigation.getParent()?.navigate('Clientes', { screen: 'ClienteNuevo' })}
        >
          <Text style={styles.cardTitle}>Nuevo cliente</Text>
          <Text style={styles.cardDesc}>Registrar alma en el sistema.</Text>
        </Pressable>

        <Pressable style={styles.cardMuted} onPress={() => navigation.navigate('Admin')}>
          <Text style={styles.cardTitle}>Administración</Text>
          <Text style={styles.cardDesc}>Solicitudes de contacto y vínculos (rol admin).</Text>
        </Pressable>
      </ScrollView>
    </GothicBackground>
  )
}
// Función para crear el estilo del componente buildStyles (buildStyles: función para crear el estilo del componente)
function buildStyles(colors) {
  return StyleSheet.create({
    fill: { flex: 1 },
    inner: { padding: 16, paddingBottom: 40 },
    h1: { fontFamily: font.displayHeavy, fontSize: 22, color: colors.text, marginBottom: 8 },
    sub: { fontFamily: font.bodyItalic, color: colors.muted, marginBottom: 20, fontSize: 16 },
    card: {
      padding: 16,
      marginBottom: 12,
      borderRadius: 2,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 3,
      borderLeftColor: colors.accent,
      backgroundColor: colors.dashboardTile,
    },
    cardMuted: {
      padding: 16,
      marginBottom: 12,
      borderRadius: 2,
      borderWidth: 1,
      borderColor: colors.goldMuted,
      backgroundColor: colors.dashboardTile2,
    },
    cardTitle: { fontFamily: font.displayRegular, fontSize: 16, letterSpacing: 1, color: colors.gold },
    cardDesc: { fontFamily: font.body, color: colors.textDim, marginTop: 6, fontSize: 15 },
  })
}
