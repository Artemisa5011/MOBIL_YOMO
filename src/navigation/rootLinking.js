import * as Linking from 'expo-linking'

/**
 * Configuración de deep linking alineada al árbol activo (auth vs tabs).
 * Rutas de ejemplo (con scheme de app.json): yominohana-mobile://login
 */
export function buildRootLinking(isAuthenticated, isCliente) {
  const prefixes = [Linking.createURL('/')]

  if (!isAuthenticated) {
    return {
      prefixes,
      config: {
        screens: {
          Home: '',
          Login: 'login',
          RegistroCliente: 'registro',
        },
      },
    }
  }

  if (isCliente) {
    return {
      prefixes,
      config: {
        screens: {
          Inicio: '',
          MiDifuntos: 'mis-difuntos',
        },
      },
    }
  }

  return {
    prefixes,
    config: {
      screens: {
        Inicio: '',
        Panel: {
          path: 'panel',
          screens: {
            Dashboard: '',
            Funeraria: 'funeraria',
            Cementerio: 'cementerio',
            Admin: 'admin',
          },
        },
        Clientes: {
          path: 'clientes',
          screens: {
            ClientesList: '',
            ClienteDetail: 'detalle/:id',
            ClienteNuevo: 'nuevo',
            ClienteEditar: 'editar/:id',
          },
        },
        Guardados: 'guardados',
      },
    },
  }
}
