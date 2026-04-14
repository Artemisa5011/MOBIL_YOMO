import { useMemo } from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import ClientesListScreen from '../screens/ClientesListScreen'
import ClienteDetailScreen from '../screens/ClienteDetailScreen'
import ClienteNuevoScreen from '../screens/ClienteNuevoScreen'
import ClienteEditarScreen from '../screens/ClienteEditarScreen'
import { useTheme } from '../contexts/ThemeProvider'
import { font } from '../theme/typography'

const Stack = createNativeStackNavigator()

export default function ClientesStack() {
  const { colors } = useTheme()
  const screenOptions = useMemo(
    () => ({
      headerStyle: {
        backgroundColor: colors.bgElevated,
        borderBottomWidth: 0,
      },
      headerTintColor: colors.gold,
      headerTitleStyle: { fontFamily: font.displayRegular, letterSpacing: 1.5, fontSize: 16 },
      headerShadowVisible: false,
      contentStyle: { backgroundColor: colors.bg },
    }),
    [colors]
  )

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="ClientesList" component={ClientesListScreen} options={{ title: 'Clientes' }} />
      <Stack.Screen name="ClienteDetail" component={ClienteDetailScreen} options={{ title: 'Detalle' }} />
      <Stack.Screen name="ClienteNuevo" component={ClienteNuevoScreen} options={{ title: 'Nuevo cliente' }} />
      <Stack.Screen name="ClienteEditar" component={ClienteEditarScreen} options={{ title: 'Editar contacto' }} />
    </Stack.Navigator>
  )
}
