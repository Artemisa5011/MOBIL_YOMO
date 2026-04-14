import { useMemo } from 'react'
import { StyleSheet } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
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

  const screenOptions = useMemo(
    () => ({
      headerStyle: {
        backgroundColor: colors.bgElevated,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
      },
      headerTintColor: colors.gold,
      headerTitleStyle: { fontFamily: font.displayRegular, fontSize: 16, letterSpacing: 1 },
      tabBarStyle: {
        backgroundColor: colors.bgElevated,
        borderTopColor: colors.border,
        borderTopWidth: 1,
        paddingTop: 4,
        height: 58,
      },
      tabBarActiveTintColor: colors.accent,
      tabBarInactiveTintColor: colors.muted,
      tabBarLabelStyle: { fontFamily: font.bodySemi, fontSize: 11, letterSpacing: 0.3 },
      tabBarHideOnKeyboard: true,
    }),
    [colors]
  )

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen
        name="Inicio"
        component={HomeScreen}
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      {isCliente ? (
        <Tab.Screen
          name="MiDifuntos"
          component={MiCementerioScreen}
          options={{
            title: 'Mis difuntos',
            tabBarIcon: ({ color, size }) => <Ionicons name="flower-outline" size={size} color={color} />,
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
              tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
            }}
          />
          <Tab.Screen
            name="Clientes"
            component={ClientesStack}
            options={{
              headerShown: false,
              title: 'Clientes',
              tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
            }}
          />
          <Tab.Screen
            name="Guardados"
            component={GuardadosScreen}
            options={{
              title: 'Guardados',
              tabBarIcon: ({ color, size }) => <Ionicons name="bookmark-outline" size={size} color={color} />,
            }}
          />
        </>
      )}
    </Tab.Navigator>
  )
}
