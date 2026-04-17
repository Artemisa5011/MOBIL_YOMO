/** Misma lógica de negocio que el proyecto web (Funeraria / Cementerio). */

export const SERVICIOS_FUNERARIA = [
  { tipo: 'ritual', nombre: 'Rituales', valor: 300000 },
  { tipo: 'ofrenda', nombre: 'Ofrendas', valor: 500000 },
  { tipo: 'sombra', nombre: 'Sombras', valor: 1000000 },
]

export const HORAS_FUNERARIA = [
  { valor: '00:00', label: '00:00' },
  { valor: '03:00', label: '03:00' },
]

export const COSTO_CAMBIO_LOTE = 1000000
export const COSTO_AGREGAR_DIFUNTO_RESERVA = 120000

export const PREGUNTAS_SOMBRA = [
  {
    id: 'q1',
    peso: 1,
    texto: '1. Cuando alguien es mejor que tú…',
    opciones: [
      { letra: 'A', descripcion: 'Lo subestimo.' },
      { letra: 'B', descripcion: 'Me enfurece.' },
      { letra: 'C', descripcion: 'Lo deseo.' },
      { letra: 'D', descripcion: 'Quiero lo que tiene.' },
      { letra: 'E', descripcion: 'Siento que la vida es injusta.' },
      { letra: 'F', descripcion: 'Me da igual competir.' },
      { letra: 'G', descripcion: 'Pienso cuánto gana.' },
    ],
  },
  {
    id: 'q2',
    peso: 2,
    texto: '2. Tu mayor debilidad es…',
    opciones: [
      { letra: 'A', descripcion: 'El orgullo.' },
      { letra: 'B', descripcion: 'La rabia contenida.' },
      { letra: 'C', descripcion: 'El deseo físico.' },
      { letra: 'D', descripcion: 'El dinero.' },
      { letra: 'E', descripcion: 'La comparación constante.' },
      { letra: 'F', descripcion: 'La falta de acción.' },
      { letra: 'G', descripcion: 'El exceso.' },
    ],
  },
  {
    id: 'q3',
    peso: 3,
    texto: '3. Si pudieras romper una regla sin consecuencias…',
    opciones: [
      { letra: 'A', descripcion: 'Demostraría mi superioridad.' },
      { letra: 'B', descripcion: 'Me vengaría.' },
      { letra: 'C', descripcion: 'Me entregaría al placer.' },
      { letra: 'D', descripcion: 'Tomaría riqueza.' },
      { letra: 'E', descripcion: 'Superaría a alguien que envidio.' },
      { letra: 'F', descripcion: 'No haría nada productivo.' },
      { letra: 'G', descripcion: 'Disfrutaría sin límites.' },
    ],
  },
  {
    id: 'q4',
    peso: 4,
    texto: '4. Lo que más hiere tu ego es…',
    opciones: [
      { letra: 'A', descripcion: 'No ser admirado.' },
      { letra: 'B', descripcion: 'Ser provocado.' },
      { letra: 'C', descripcion: 'Ser rechazado.' },
      { letra: 'D', descripcion: 'Perder dinero.' },
      { letra: 'E', descripcion: 'Que otro tenga más talento.' },
      { letra: 'F', descripcion: 'Tener que esforzarte.' },
      { letra: 'G', descripcion: 'No poder indulgirte.' },
    ],
  },
  {
    id: 'q5',
    peso: 5,
    texto: '5. Tu pensamiento más frecuente…',
    opciones: [
      { letra: 'A', descripcion: '“Soy superior.”' },
      { letra: 'B', descripcion: '“Esto es intolerable.”' },
      { letra: 'C', descripcion: '“Lo quiero.”' },
      { letra: 'D', descripcion: '“Necesito más.”' },
      { letra: 'E', descripcion: '“¿Por qué él y no yo?”' },
      { letra: 'F', descripcion: '“Después lo hago.”' },
      { letra: 'G', descripcion: '“Nunca es suficiente.”' },
    ],
  },
  {
    id: 'q6',
    peso: 6,
    texto: '6. Cuando fallas…',
    opciones: [
      { letra: 'A', descripcion: 'Culpo a otros.' },
      { letra: 'B', descripcion: 'Exploto.' },
      { letra: 'C', descripcion: 'Busco distracción placentera.' },
      { letra: 'D', descripcion: 'Me obsesiono con recuperar lo perdido.' },
      { letra: 'E', descripcion: 'Me comparo.' },
      { letra: 'F', descripcion: 'Lo pospongo.' },
      { letra: 'G', descripcion: 'Compenso con exceso.' },
    ],
  },
  {
    id: 'q7',
    peso: 7,
    texto: '7. En secreto deseas…',
    opciones: [
      { letra: 'A', descripcion: 'Admiración total.' },
      { letra: 'B', descripcion: 'Dominio absoluto.' },
      { letra: 'C', descripcion: 'Satisfacción carnal.' },
      { letra: 'D', descripcion: 'Fortuna ilimitada.' },
      { letra: 'E', descripcion: 'Ser el número uno.' },
      { letra: 'F', descripcion: 'Vida sin esfuerzo.' },
      { letra: 'G', descripcion: 'Placer constante.' },
    ],
  },
]

export const MAPA_PECADO_SOMBRA = {
  A: 'Soberbia',
  B: 'Ira',
  C: 'Lujuria',
  D: 'Avaricia',
  E: 'Envidia',
  F: 'Pereza',
  G: 'Gula',
}

export const ORDEN_PECADOS_SOMBRA = ['Soberbia', 'Ira', 'Lujuria', 'Avaricia', 'Envidia', 'Pereza', 'Gula']

export function calcularResultadoSombra(respuestas) {
  const puntajes = {
    Soberbia: 0,
    Ira: 0,
    Lujuria: 0,
    Avaricia: 0,
    Envidia: 0,
    Pereza: 0,
    Gula: 0,
  }
  PREGUNTAS_SOMBRA.forEach((p) => {
    const letra = respuestas[p.id]
    if (!letra) return
    const pecado = MAPA_PECADO_SOMBRA[letra]
    if (!pecado) return
    puntajes[pecado] += p.peso
  })
  let ganador = null
  let max = -1
  ORDEN_PECADOS_SOMBRA.forEach((pecado) => {
    if (puntajes[pecado] > max) {
      max = puntajes[pecado]
      ganador = pecado
    }
  })
  return { pecado: ganador, puntajes }
}

export const PREGUNTA_PECADO_INICIAL = {
  id: 'pecado',
  texto: '¿Qué pecado representa mejor el alma?',
  opciones: ['Lujuria', 'Gula', 'Avaricia', 'Pereza', 'Ira', 'Envidia', 'Soberbia'],
}
