import { useMemo } from 'react'
import { StyleSheet } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import HomeScreen from '../screens/HomeScreen'
import PanelStack from './PanelStack'
import ClientesStack from './ClientesStack'
import GuardadosScreen from '../screens/GuardadosScreen'
import MiCementerioScreen from '../screens/MiCementerioScreen'
import { useAuth } from '../contexts/useAuth'
import { useTheme } from '../contexts/ThemeProvider'
import { font } from '../theme/typography'

const Tab = createBottomTabNavigator()

export default function MainTabs() {
  const { isCliente } = useAuth()
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  /** Barra compacta (solo iconos) para diferenciarla de la barra del sistema Android. */
  const tabBarH = 44 + insets.bottom

  const screenOptions = useMemo(
    () => ({
      headerStyle: {
        backgroundColor: colors.bgElevated,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
      },
      headerTintColor: colors.gold,
      headerTitleStyle: { fontFamily: font.displayRegular, fontSize: 16, letterSpacing: 1 },
      tabBarShowLabel: false,
      tabBarStyle: {
        backgroundColor: colors.bgElevated,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.goldMuted,
        paddingTop: 2,
        paddingBottom: Math.max(insets.bottom, 2),
        height: tabBarH,
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      tabBarActiveTintColor: colors.accent,
      tabBarInactiveTintColor: colors.muted,
      tabBarIconStyle: { marginTop: 2 },
      tabBarItemStyle: { paddingVertical: 4 },
      tabBarHideOnKeyboard: true,
    }),
    [colors, insets.bottom, tabBarH]
  )

  const iconSize = 22

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen
        name="Inicio"
        component={HomeScreen}
        options={{
          title: 'Inicio',
          tabBarAccessibilityLabel: 'Inicio',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={iconSize} color={color} />,
        }}
      />
      {isCliente ? (
        <Tab.Screen
          name="MiDifuntos"
          component={MiCementerioScreen}
          options={{
            title: 'Mis difuntos',
            tabBarAccessibilityLabel: 'Mis difuntos',
            tabBarIcon: ({ color }) => <Ionicons name="flower-outline" size={iconSize} color={color} />,
          }}
        />
      ) : (
        <>
          <Tab.Screen
            name="Panel"
            component={PanelStack}
            options={{
              headerShown: false,
              title: 'Panel',
              tabBarAccessibilityLabel: 'Panel',
              tabBarIcon: ({ color }) => <Ionicons name="grid-outline" size={iconSize} color={color} />,
            }}
          />
          <Tab.Screen
            name="Clientes"
            component={ClientesStack}
            options={{
              headerShown: false,
              title: 'Clientes',
              tabBarAccessibilityLabel: 'Clientes',
              tabBarIcon: ({ color }) => <Ionicons name="people-outline" size={iconSize} color={color} />,
            }}
          />
          <Tab.Screen
            name="Guardados"
            component={GuardadosScreen}
            options={{
              title: 'Guardados',
              tabBarAccessibilityLabel: 'Guardados',
              tabBarIcon: ({ color }) => <Ionicons name="bookmark-outline" size={iconSize} color={color} />,
            }}
          />
        </>
      )}
    </Tab.Navigator>
  )
}
