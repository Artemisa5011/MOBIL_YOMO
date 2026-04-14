import { useMemo } from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import HomeScreen from '../screens/HomeScreen'
import LoginScreen from '../screens/LoginScreen'
import RegistroClienteScreen from '../screens/RegistroClienteScreen'
import { useTheme } from '../contexts/ThemeProvider'
import { font } from '../theme/typography'

const Stack = createNativeStackNavigator()

export default function AuthStack() {
  const { colors } = useTheme()
  const screenOptions = useMemo(
    () => ({
      headerStyle: {
        backgroundColor: colors.bgElevated,
        borderBottomWidth: 0,
      },
      headerTintColor: colors.gold,
      headerTitleStyle: { fontFamily: font.displayRegular, letterSpacing: 2, fontSize: 15 },
      headerShadowVisible: false,
      contentStyle: { backgroundColor: colors.bg },
    }),
    [colors]
  )

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Yomi No Hana' }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Iniciar sesión' }} />
      <Stack.Screen name="RegistroCliente" component={RegistroClienteScreen} options={{ title: 'Registro cliente' }} />
    </Stack.Navigator>
  )
}
