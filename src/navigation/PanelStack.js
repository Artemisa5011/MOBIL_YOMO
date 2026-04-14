import { useMemo } from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import DashboardScreen from '../screens/DashboardScreen'
import FunerariaScreen from '../screens/FunerariaScreen'
import CementerioScreen from '../screens/CementerioScreen'
import AdminScreen from '../screens/AdminScreen'
import { useTheme } from '../contexts/ThemeProvider'
import { font } from '../theme/typography'

const Stack = createNativeStackNavigator()

export default function PanelStack() {
  const { colors } = useTheme()
  const screenOptions = useMemo(
    () => ({
      headerStyle: { backgroundColor: colors.bgElevated },
      headerTintColor: colors.gold,
      headerTitleStyle: { fontFamily: font.displayRegular, fontSize: 15 },
      headerShadowVisible: false,
      contentStyle: { backgroundColor: colors.bg },
    }),
    [colors]
  )

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Panel' }} />
      <Stack.Screen name="Funeraria" component={FunerariaScreen} options={{ title: 'Funeraria' }} />
      <Stack.Screen name="Cementerio" component={CementerioScreen} options={{ title: 'Cementerio' }} />
      <Stack.Screen name="Admin" component={AdminScreen} options={{ title: 'Administración' }} />
    </Stack.Navigator>
  )
}
