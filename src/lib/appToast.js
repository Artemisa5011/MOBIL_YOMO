import Toast from 'react-native-toast-message'

/** Toasts breves (éxito). Mensajes cortos; no sustituye confirmaciones con `Alert`. */
export function toastSuccess(text1, text2) {
  Toast.show({
    type: 'success',
    text1,
    text2: text2 || undefined,
    visibilityTime: text2 ? 3200 : 2400,
  })
}

/** Errores y validaciones que deben notarse sin bloquear la pantalla. */
export function toastError(text1, text2) {
  Toast.show({
    type: 'error',
    text1,
    text2: text2 || undefined,
    visibilityTime: text2 ? 4200 : 3200,
  })
}

/** Avisos neutros (validación, permisos, “completa el campo”). */
export function toastInfo(text1, text2) {
  Toast.show({
    type: 'info',
    text1,
    text2: text2 || undefined,
    visibilityTime: 3000,
  })
}
