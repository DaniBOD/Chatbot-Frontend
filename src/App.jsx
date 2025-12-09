import { useState, useRef, useEffect } from 'react'
import { emergencyUrl } from './config'
import GotaBase from './assets/Gota base.png'
import GotaMecanico from './assets/Gota mecanico.png'
import GotaLentes from './assets/Gota lentes.png'
import './App.css'
import CooperativaLogo from './assets/Cooperativa logo.png'
import { useNavigate } from 'react-router-dom'

/**
 * App - Chatbot para Cooperativa de Agua
 * 
 * Flujo conversacional:
 * 1. Usuario ve opciones de botones (Reportar emergencia, Problemas con cuenta, etc.)
 * 2. Si selecciona "Reportar emergencia", el chatbot inicia un flujo de preguntas
 * 3. Cada respuesta se captura en el chat y se muestra el siguiente paso
 * 4. Al final, se envían todos los datos al backend
 * 
 * Estados del chat:
 * - 'main': pantalla principal con opciones
 * - 'emergency': en proceso de reporte de emergencia
 * - 'emergency_complete': emergencia completada
 */
function App() {
  const navigate = useNavigate()

  // Chat state: 'main' | 'emergency' | 'emergency_complete' | 'boletas' | 'boletas_complete'
  const [chatState, setChatState] = useState('main')

  // Mensajes del chat (array de {role: 'user'|'bot', text: string})
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: '¡Hola! Soy GotinBot, el asistente de la Cooperativa La Compañía. Estoy aquí para ayudarte con preguntas generales sobre servicios, facturación y atención. Puedes preguntar de forma anónima y con gusto te responderé.',
    },
  ])

  // Chat libre en pantalla principal
  const [mainChatInput, setMainChatInput] = useState('')
  const [mainChatMessages, setMainChatMessages] = useState([])

  // Datos del formulario de emergencia recopilados en el chat
  const [emergencyData, setEmergencyData] = useState({
    nombreCompleto: '',
    telefono: '',
    sector: '',
    direccion: '',
    tipoEmergencia: '',
    estadoEmergencia: '',
    descripcion: '',
  })

  // Datos de consulta de boletas
  const [boletasData, setBoletasData] = useState({
    nombreCompleto: '',
    rut: '',
    numeroCliente: '',
    // queryType: 'consumo' | 'pago' | 'comparar'
    queryType: null,
  })

  // Paso actual en el flujo de emergencia (0-6)
  const [emergencyStep, setEmergencyStep] = useState(0)

  // Paso actual en el flujo de boletas (0-2)
  const [boletasStep, setBoletasStep] = useState(0)

  // Estado para manejar la imagen de emergencia
  const [waitingForImage, setWaitingForImage] = useState(false)
  const [emergencyImage, setEmergencyImage] = useState(null)

  // Estado para manejar "Otro" en tipo de emergencia
  const [waitingForOtherEmergency, setWaitingForOtherEmergency] = useState(false)

  // Resultados de consulta de boletas (para mostrar tarjetas en la UI)
  const [boletasResults, setBoletasResults] = useState(null)
  const [compareCandidates, setCompareCandidates] = useState(null)
  const [awaitingCompareSelection, setAwaitingCompareSelection] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesContainerRef = useRef(null)
  const mainMessagesRef = useRef(null)
  // Chat session id for backend conversational service
  const [chatSessionId, setChatSessionId] = useState(null)

  // Campos del formulario de emergencia en orden
  const emergencyFields = [
    { key: 'nombreCompleto', label: 'Nombre completo', placeholder: 'Ej: Ana Pérez' },
    { key: 'telefono', label: 'Teléfono', placeholder: 'Ej: +56 9 1234 5678' },
    { key: 'sector', label: 'Sector', placeholder: 'Ej: Centro' },
    { key: 'direccion', label: 'Dirección', placeholder: 'Calle, número' },
    { key: 'tipoEmergencia', label: 'Tipo de emergencia', placeholder: 'Ej: Incendio, Accidente' },
    { key: 'estadoEmergencia', label: 'El Estado de emergencia', placeholder: 'Ej: Activa, Contenida' },
    { key: 'descripcion', label: 'Descripción detallada del problema', placeholder: 'Describe lo que ocurre' },
  ]

  // Campos del formulario de consulta de boletas
  const boletasFields = [
    { key: 'nombreCompleto', label: 'Nombre completo', placeholder: 'Ej: Juan Pérez' },
    { key: 'rut', label: 'RUT', placeholder: 'Ej: 12345678-9' },
    { key: 'numeroCliente', label: 'Número de cliente', placeholder: 'Ej: 12345' },
  ]

  // Inicia flujo de emergencia
  function handleReportEmergency() {
    setChatState('emergency')
    setEmergencyStep(0)
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: 'Reportar emergencia' },
      {
        role: 'bot',
        text: `Entendido, voy a recopilar información sobre tu emergencia. Comenzamos:\n\n¿Cuál es tu ${emergencyFields[0].label.toLowerCase()}?`,
      },
    ])
    setMainChatMessages([])
    setMainChatInput('')
  }

  // Reinicia el chat
  function handleRestartChat() {
    // Reseteamos el estado según la pantalla actual
    if (chatState === 'emergency' || chatState === 'emergency_complete') {
      // Reiniciar protocolo de emergencia automáticamente
      setChatState('emergency')
      setEmergencyStep(0)
      setWaitingForImage(false)
      setEmergencyImage(null)
      setWaitingForOtherEmergency(false)
      setEmergencyData({
        nombreCompleto: '',
        telefono: '',
        sector: '',
        direccion: '',
        tipoEmergencia: '',
        estadoEmergencia: '',
        descripcion: '',
      })
      setMessages([
        {
          role: 'user',
          text: 'Reportar emergencia',
        },
        {
          role: 'bot',
          text: `Entendido, voy a recopilar información sobre tu emergencia. Comenzamos:\n\n¿Cuál es tu nombre completo?`,
        },
      ])
    } else if (chatState === 'boletas' || chatState === 'boletas_complete') {
      // Reiniciar protocolo de boletas automáticamente
      setChatState('boletas')
      setBoletasStep(0)
      setBoletasData({
        nombreCompleto: '',
        rut: '',
        numeroCliente: '',
      })
      setMessages([
        {
          role: 'user',
          text: 'Consulta de boletas',
        },
        {
          role: 'bot',
          text: `Perfecto, voy a ayudarte con tu consulta de boletas. Que es lo que necesito saber:\n 1. Consultar consumo \n 2. Consultar monto a pagar \n 3. Comparar boletas`,
        },
      ])
    } else {
      // Pantalla principal
      setMessages([
        {
          role: 'bot',
          text: '¡Hola! Soy GotinBot, el asistente de la Cooperativa La Compañía. Estoy aquí para ayudarte con preguntas generales sobre servicios, facturación y atención. Puedes preguntar de forma anónima y con gusto te responderé.',
        },
      ])
      setMainChatMessages([])
      setMainChatInput('')
    }
  }

  // Vuelve a la página de inicio (pantalla principal del chat)
  function handleGoHome() {
    setChatState('main')
    setEmergencyStep(0)
    setBoletasStep(0)
    setWaitingForImage(false)
    setEmergencyImage(null)
    setWaitingForOtherEmergency(false)
    setMessages([
      {
        role: 'bot',
        text: '¡Hola! Soy GotinBot, el asistente de la Cooperativa La Compañía. Estoy aquí para ayudarte con preguntas generales sobre servicios, facturación y atención. Puedes preguntar de forma anónima y con gusto te responderé.',
      },
    ])
    setEmergencyData({
      nombreCompleto: '',
      telefono: '',
      sector: '',
      direccion: '',
      tipoEmergencia: '',
      estadoEmergencia: '',
      descripcion: '',
    })
    setBoletasData({
      nombreCompleto: '',
      rut: '',
      numeroCliente: '',
    })
    setMainChatMessages([])
    setMainChatInput('')
  }

  // Inicia flujo de consulta de boletas
  function handleConsultaBoletas() {
    setChatState('boletas')
    setBoletasStep(0)
    // Initialize backend chat session for boletas context
    const initApi = 'http://localhost:8000/api/boletas/chat/init/'
    fetch(initApi, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
      .then(async (res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        if (data && data.session_id) setChatSessionId(data.session_id)
      })
      .catch((err) => console.debug('No se pudo iniciar sesión de chat (opcional):', err))
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: 'Consulta de boletas' },
      {
        role: 'bot',
        text: `Perfecto, voy a ayudarte con tu consulta de boletas. Que es lo que necesito saber:\n 1. Consultar consumo \n 2. Consultar monto a pagar \n 3. Comparar boletas`,
      },
    ])
    setMainChatMessages([])
    setMainChatInput('')
  }

  // Maneja la carga de imagen para emergencia
  function handleEmergencyImageUpload(event) {
    const file = event.target.files[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setEmergencyImage(e.target.result)
        setWaitingForImage(false)
        
        // Añadir mensaje de confirmación
        setMessages((prev) => [
          ...prev,
          {
            role: 'bot',
            text: '✓ Imagen recibida. Gracias por proporcionar toda la información. Enviando tu reporte de emergencia...',
          },
        ])
        
        // Completar el flujo
        setChatState('emergency_complete')
        const dataWithImage = { ...emergencyData, image: e.target.result }
        console.log('Emergency data with image:', dataWithImage)
        submitEmergency(dataWithImage)
      }
      reader.readAsDataURL(file)
    }
  }

  // Procesa respuesta del usuario en flujo de emergencia
  function handleEmergencyResponse(userInput) {
    if (!userInput.trim()) return

    // Si es la última pregunta (descripción), preguntar por la foto
    if (emergencyStep === emergencyFields.length - 1) {
      const currentField = emergencyFields[emergencyStep]
      const newData = { ...emergencyData, [currentField.key]: userInput }
      setEmergencyData(newData)
      
      const updatedMessages = [...messages, { role: 'user', text: userInput }]
      updatedMessages.push({
        role: 'bot',
        text: '¿Puedes fotografiar la emergencia?\n1. Sí\n2. No',
      })
      setMessages(updatedMessages)
      setEmergencyStep(emergencyStep + 1)
      return
    }

    // Si es la pregunta de la foto (paso después del último campo)
    if (emergencyStep === emergencyFields.length) {
      const updatedMessages = [...messages, { role: 'user', text: userInput }]
      
      if (userInput.trim() === '1') {
        // Usuario dijo que SÍ puede fotografiar
        updatedMessages.push({
          role: 'bot',
          text: 'Por favor, carga la imagen de la emergencia usando el botón de abajo.',
        })
        setMessages(updatedMessages)
        setWaitingForImage(true)
      } else if (userInput.trim() === '2') {
        // Usuario dijo que NO puede fotografiar
        updatedMessages.push({
          role: 'bot',
          text: '✓ Gracias por proporcionar toda la información. Enviando tu reporte de emergencia...',
        })
        setMessages(updatedMessages)
        setChatState('emergency_complete')
        console.log('Emergency data:', emergencyData)
        submitEmergency(emergencyData)
      } else {
        updatedMessages.push({
          role: 'bot',
          text: 'Por favor, selecciona una opción válida (1 para Sí, 2 para No).',
        })
        setMessages(updatedMessages)
      }
      return
    }

    // Preguntas normales del formulario
    const currentField = emergencyFields[emergencyStep]
    
    // Manejo especial para "tipo de emergencia - Otro"
    if (waitingForOtherEmergency) {
      const newData = { ...emergencyData, tipoEmergencia: `Otro: ${userInput}` }
      setEmergencyData(newData)
      setWaitingForOtherEmergency(false)
      
      const updatedMessages = [...messages, { role: 'user', text: userInput }]
      
      // Siguiente pregunta (después de tipoEmergencia)
      const nextField = emergencyFields[emergencyStep + 1]
      if (nextField.key === 'estadoEmergencia') {
        // Mostrar opciones de estado si corresponde
        updatedMessages.push({
          role: 'bot',
          text: '¿Cuál es el estado de la emergencia?\n1. Baja\n2. Media\n3. Alta\n4. Critica',
        })
      } else {
        updatedMessages.push({
          role: 'bot',
          text: `¿Cuál es tu ${nextField.label.toLowerCase()}?`,
        })
      }
      setMessages(updatedMessages)
      setEmergencyStep(emergencyStep + 1)
      return
    }
    
    // Manejo especial para el campo "tipoEmergencia"
    if (currentField.key === 'tipoEmergencia') {
      const updatedMessages = [...messages, { role: 'user', text: userInput }]
      const tipoOptions = [
        'Rotura de matriz',
        'Baja presion',
        'Fuga agua',
        'Cañeria rota',
        'Agua contaminada',
        'Falta de agua',
        'Otro'
      ]
      
      const tipoNumber = parseInt(userInput.trim())
      if (tipoNumber >= 1 && tipoNumber <= 7) {
        const selectedTipo = tipoOptions[tipoNumber - 1]
        
        if (tipoNumber === 7) {
          // Usuario seleccionó "Otro"
          updatedMessages.push({
            role: 'bot',
            text: 'Has seleccionado: Otro\n\nPor favor, especifica el tipo de emergencia:',
          })
          setMessages(updatedMessages)
          setWaitingForOtherEmergency(true)
        } else {
          // Usuario seleccionó una opción predefinida
          const newData = { ...emergencyData, tipoEmergencia: selectedTipo }
          setEmergencyData(newData)
          
          // Siguiente pregunta
          const nextField = emergencyFields[emergencyStep + 1]
          
          // Si el siguiente campo es "estadoEmergencia", mostrar las opciones
          if (nextField.key === 'estadoEmergencia') {
            updatedMessages.push({
              role: 'bot',
              text: `Has seleccionado: ${selectedTipo}\n\n¿Cuál es el estado de la emergencia?\n1. Baja\n2. Media\n3. Alta\n4. Critica`,
            })
          } else {
            updatedMessages.push({
              role: 'bot',
              text: `Has seleccionado: ${selectedTipo}\n\n¿Cuál es tu ${nextField.label.toLowerCase()}?`,
            })
          }
          setMessages(updatedMessages)
          setEmergencyStep(emergencyStep + 1)
        }
      } else {
        // Opción inválida
        updatedMessages.push({
          role: 'bot',
          text: 'Por favor, selecciona un número válido del 1 al 7.',
        })
        setMessages(updatedMessages)
      }
      return
    }
    
    // Manejo especial para el campo "sector"
    if (currentField.key === 'sector') {
      const updatedMessages = [...messages, { role: 'user', text: userInput }]
      const sectorOptions = [
        'Anibana',
        'El molino',
        'La compañia',
        'El maiten 1',
        'El maiten 2',
        'La morena',
        'Santa margarita'
      ]
      
      const sectorNumber = parseInt(userInput.trim())
      if (sectorNumber >= 1 && sectorNumber <= 7) {
        const selectedSector = sectorOptions[sectorNumber - 1]
        const newData = { ...emergencyData, sector: selectedSector }
        setEmergencyData(newData)
        
        // Siguiente pregunta
        const nextField = emergencyFields[emergencyStep + 1]
        updatedMessages.push({
          role: 'bot',
          text: `Has seleccionado: ${selectedSector}\n\n¿Cuál es tu ${nextField.label.toLowerCase()}?`,
        })
        setMessages(updatedMessages)
        setEmergencyStep(emergencyStep + 1)
      } else {
        // Opción inválida
        updatedMessages.push({
          role: 'bot',
          text: 'Por favor, selecciona un número válido del 1 al 7.',
        })
        setMessages(updatedMessages)
      }
      return
    }
    
    // Manejo especial para el campo "estadoEmergencia"
    if (currentField.key === 'estadoEmergencia') {
      const updatedMessages = [...messages, { role: 'user', text: userInput }]
      const estadoOptions = [
        'Baja',
        'Media',
        'Alta',
        'Critica'
      ]
      
      const estadoNumber = parseInt(userInput.trim())
      if (estadoNumber >= 1 && estadoNumber <= 4) {
        const selectedEstado = estadoOptions[estadoNumber - 1]
        const newData = { ...emergencyData, estadoEmergencia: selectedEstado }
        setEmergencyData(newData)
        
        // Siguiente pregunta
        const nextField = emergencyFields[emergencyStep + 1]
        updatedMessages.push({
          role: 'bot',
          text: `Has seleccionado: ${selectedEstado}\n\n¿Cuál es tu ${nextField.label.toLowerCase()}?`,
        })
        setMessages(updatedMessages)
        setEmergencyStep(emergencyStep + 1)
      } else {
        // Opción inválida
        updatedMessages.push({
          role: 'bot',
          text: 'Por favor, selecciona un número válido del 1 al 4.',
        })
        setMessages(updatedMessages)
      }
      return
    }
    
    // Para otros campos, procesamiento normal
    const newData = { ...emergencyData, [currentField.key]: userInput }
    setEmergencyData(newData)

    // Añade respuesta del usuario al chat
    const updatedMessages = [...messages, { role: 'user', text: userInput }]

    // Siguiente pregunta
    const nextField = emergencyFields[emergencyStep + 1]
    
    // Si el siguiente campo es "tipoEmergencia", mostrar las opciones
    if (nextField.key === 'tipoEmergencia') {
      updatedMessages.push({
        role: 'bot',
        text: `¿Qué tipo de emergencia es?\n1. Rotura de matriz\n2. Baja presion\n3. Fuga agua\n4. Cañeria rota\n5. Agua contaminada\n6. Falta de agua\n7. Otro`,
      })
    }
    // Si el siguiente campo es "estadoEmergencia", mostrar las opciones
    else if (nextField.key === 'estadoEmergencia') {
      updatedMessages.push({
        role: 'bot',
        text: `¿Cuál es el estado de la emergencia?\n1. Baja\n2. Media\n3. Alta\n4. Critica`,
      })
    }
    // Si el siguiente campo es "sector", mostrar las opciones
    else if (nextField.key === 'sector') {
      updatedMessages.push({
        role: 'bot',
        text: `¿En qué sector te encuentras?\n1. Anibana\n2. El molino\n3. La compañia\n4. El maiten 1\n5. El maiten 2\n6. La morena\n7. Santa margarita`,
      })
    } else {
      updatedMessages.push({
        role: 'bot',
        text: `¿Cuál es tu ${nextField.label.toLowerCase()}?`,
      })
    }
    
    setMessages(updatedMessages)
    setEmergencyStep(emergencyStep + 1)
  }

  // Procesa respuesta del usuario en flujo de boletas
  function handleBoletasResponse(userInput) {
    if (!userInput.trim()) return

    // Si estamos esperando selección múltiple para comparar
    if (awaitingCompareSelection && compareCandidates && compareCandidates.length > 0) {
      const updatedMessages = [...messages, { role: 'user', text: userInput }]
      // Parsear números separados por comas
      const nums = userInput.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n))
      if (nums.length === 0) {
        updatedMessages.push({ role: 'bot', text: 'No entendí tu selección. Por favor responde con números separados por comas (ej: 1,3).' })
        setMessages(updatedMessages)
        return
      }
      // Obtener ids
      const ids = nums.map(n => (compareCandidates[n-1] && (compareCandidates[n-1].id_boleta || compareCandidates[n-1].id)) ? (compareCandidates[n-1].id_boleta || compareCandidates[n-1].id) : null).filter(Boolean)
      if (ids.length === 0) {
        updatedMessages.push({ role: 'bot', text: 'Selección inválida. Revisa los números disponibles e inténtalo de nuevo.' })
        setMessages(updatedMessages)
        return
      }
      updatedMessages.push({ role: 'bot', text: '✓ Recibido. Comparando las boletas seleccionadas...' })
      setMessages(updatedMessages)
      setAwaitingCompareSelection(false)
      // Enviar petición de comparación
      submitCompare(ids)
      return
    }

    // Si es el primer paso (selección de opción)
    if (boletasStep === 0) {
      const updatedMessages = [...messages, { role: 'user', text: userInput }]
      
      if (userInput.trim() === '1') {
        // Usuario seleccionó "Consultar consumo"
        updatedMessages.push({
          role: 'bot',
          text: 'Has seleccionado: Consultar consumo\n\n¿Con qué datos deseas identificarte?\n1. Número de cliente\n2. RUT\n3. Nombre completo',
        })
        setMessages(updatedMessages)
        setBoletasStep(1)
        setBoletasData((prev) => ({ ...prev, queryType: 'consumo' }))
      } else if (userInput.trim() === '2') {
        // Usuario seleccionó "Consultar monto a pagar"
        updatedMessages.push({
          role: 'bot',
          text: 'Has seleccionado: Consultar monto a pagar\n\n¿Con qué datos deseas identificarte?\n1. Número de cliente\n2. RUT\n3. Nombre completo',
        })
        setMessages(updatedMessages)
        setBoletasStep(1)
        setBoletasData((prev) => ({ ...prev, queryType: 'pago' }))
      } else if (userInput.trim() === '3') {
        // Usuario seleccionó "Comparar boletas"
        updatedMessages.push({
          role: 'bot',
          text: 'Has seleccionado: Comparar boletas\n\n¿Con qué datos deseas identificarte?\n1. Número de cliente\n2. RUT\n3. Nombre completo',
        })
        setMessages(updatedMessages)
        setBoletasStep(1)
        setBoletasData((prev) => ({ ...prev, queryType: 'comparar' }))
      } else {
        // Opción inválida
        updatedMessages.push({
          role: 'bot',
          text: 'Por favor, selecciona una opción válida (1, 2 o 3).',
        })
        setMessages(updatedMessages)
      }
      return
    }

    // Si es el segundo paso (selección de tipo de identificación)
    if (boletasStep === 1) {
      const updatedMessages = [...messages, { role: 'user', text: userInput }]
      
      if (userInput.trim() === '1') {
        // Usuario seleccionó "Número de cliente" - actualmente no soportado directamente
        updatedMessages.push({
          role: 'bot',
          text: 'Actualmente la consulta por número de cliente no está disponible. Por favor proporciona tu RUT para continuar. (Ej: 12345678-9)'
        })
        // Guardar que vamos a identificar por RUT
        setBoletasData((prev) => ({ ...prev, identificationType: 'rut' }))
        setMessages(updatedMessages)
        setBoletasStep(2)
      } else if (userInput.trim() === '2') {
        // Usuario seleccionó "RUT"
        updatedMessages.push({
          role: 'bot',
          text: '¿Cuál es tu RUT? (Ej: 12345678-9)',
        })
        setBoletasData((prev) => ({ ...prev, identificationType: 'rut' }))
        setMessages(updatedMessages)
        setBoletasStep(2)
      } else if (userInput.trim() === '3') {
        // Usuario seleccionó "Nombre completo" - ahora soportado
        updatedMessages.push({
          role: 'bot',
          text: '¿Cuál es tu nombre completo? (Ej: Juan Pérez)'
        })
        // Guardar que vamos a identificar por nombreCompleto
        setBoletasData((prev) => ({ ...prev, identificationType: 'nombreCompleto' }))
        setMessages(updatedMessages)
        setBoletasStep(2)
      } else {
        // Opción inválida
        updatedMessages.push({
          role: 'bot',
          text: 'Por favor, selecciona una opción válida (1, 2 o 3).',
        })
        setMessages(updatedMessages)
      }
      return
    }

    // Para pasos siguientes, continuar con el flujo normal
    const updatedMessages = [...messages, { role: 'user', text: userInput }]

    // Si es paso 2, guardar los datos y completar
    if (boletasStep === 2) {
      // Determinar si el input parece un RUT; si no, asumir nombre completo
      const rutLike = /^\d{1,2}\.??\d{3}\.??\d{3}-[\dkKk]$|^\d{7,8}-[\dkKk]$/.test(userInput.trim())
      const newData = rutLike
        ? { ...boletasData, rut: userInput.trim() }
        : { ...boletasData, nombreCompleto: userInput.trim() }
      // Actualizar el estado de manera funcional
      setBoletasData((prev) => ({ ...prev, ...newData }))

      updatedMessages.push({
        role: 'bot',
        text: '✓ Gracias por proporcionar tu información. Consultando tus boletas...',
      })
      setMessages(updatedMessages)
      // If comparing, keep in 'boletas' state so user can select multiple items
      if (newData.queryType === 'comparar') {
        setAwaitingCompareSelection(false) // will be set true after candidates arrive
      } else {
        setChatState('boletas_complete')
      }
      console.log('Boletas data (final):', newData)
      // If user asked for monto a pagar, request only the vigente pendiente
      const payload = { ...newData }
      if (newData.queryType === 'pago') {
        payload.solo_vigente = true
        // also suggest filtering by pending state
        payload.estado_pago = 'pendiente'
      }
      submitBoletasQuery(payload)
    }
  }

  // Envía datos de emergencia al backend
  function submitEmergency(data) {
    const apiUrl = emergencyUrl()

    // Mapas para convertir etiquetas visibles del chat a las claves esperadas por el backend
    // Mapas base (etiqueta visible -> clave en backend)
    const sectorMap = {
      'Anibana': 'anibana',
      'El Molino': 'el_molino',
      'La Compañía': 'la_compania',
      'El Maitén 1': 'el_maiten_1',
      'La Morera': 'la_morera',
      'El Maitén 2': 'el_maiten_2',
      'Santa Margarita': 'santa_margarita',
    }

    const tipoEmergenciaMap = {
      'Rotura de Matriz': 'rotura_matriz',
      'Baja Presión': 'baja_presion',
      'Fuga de Agua': 'fuga_agua',
      'Cañería Rota': 'caneria_rota',
      'Agua Contaminada': 'agua_contaminada',
      'Sin Agua': 'sin_agua',
      'Otro': 'otro',
      // also allow some lowercase/alternate forms
      'Rotura de matriz': 'rotura_matriz',
      'Baja presion': 'baja_presion',
      'Agua contaminada': 'agua_contaminada',
    }

    const nivelPrioridadMap = {
      'Baja': 'baja',
      'Media': 'media',
      'Alta': 'alta',
      'Critica': 'critica',
    }

    // Normaliza una etiqueta: elimina acentos, signos y pasa a minúsculas
    function normalizeLabel(s) {
      if (!s && s !== 0) return ''
      return String(s)
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^\w\s]/g, '')
        .trim()
        .toLowerCase()
    }

    // Construye un mapa normalizado para búsquedas insensibles a acentos/mayúsculas
    function buildNormalizedMap(m) {
      const nm = {}
      Object.entries(m).forEach(([k, v]) => {
        nm[normalizeLabel(k)] = v
      })
      return nm
    }

    const normSectorMap = buildNormalizedMap(sectorMap)
    const normTipoMap = buildNormalizedMap(tipoEmergenciaMap)
    const normNivelMap = buildNormalizedMap(nivelPrioridadMap)

    // Si viene image (data URL), convertir a Blob y enviar como multipart/form-data
    const send = async () => {
      try {
        let res
        if (data.image) {
          // convertir data:image/...;base64,... a Blob
          const dataURLtoBlob = (dataURL) => {
            const parts = dataURL.split(',')
            const m = parts[0].match(/:(.*?);/)
            const mime = m ? m[1] : 'application/octet-stream'
            const byteString = atob(parts[1])
            const ab = new ArrayBuffer(byteString.length)
            const ia = new Uint8Array(ab)
            for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i)
            return new Blob([ab], { type: mime })
          }

          const fd = new FormData()
          // Mapear campos al nombre esperado por el backend
          fd.append('nombre_usuario', data.nombreCompleto || '')
          fd.append('telefono', data.telefono || '')
          // Mapear etiquetas a claves esperadas por el backend
          fd.append('sector', normSectorMap[normalizeLabel(data.sector)] || sectorMap[data.sector] || data.sector || '')
          fd.append('direccion', data.direccion || '')
          fd.append('descripcion', data.descripcion || '')
          fd.append('tipo_emergencia', normTipoMap[normalizeLabel(data.tipoEmergencia)] || tipoEmergenciaMap[data.tipoEmergencia] || data.tipoEmergencia || '')
          // Si el usuario respondió con nivel de prioridad (Baja/Media/Alta/Critica), enviarlo como nivel_prioridad
          if (normNivelMap[normalizeLabel(data.estadoEmergencia)]) {
            fd.append('nivel_prioridad', normNivelMap[normalizeLabel(data.estadoEmergencia)])
          } else {
            fd.append('estado_emergencia', data.estadoEmergencia || '')
          }
          const blob = dataURLtoBlob(data.image)
          fd.append('fotografia', blob, 'photo.jpg')

          res = await fetch(apiUrl, { method: 'POST', body: fd })
        } else {
          // Enviar JSON mapeando campos
          const payload = {
            nombre_usuario: data.nombreCompleto || '',
            telefono: data.telefono || '',
            direccion: data.direccion || '',
            descripcion: data.descripcion || '',
            sector: normSectorMap[normalizeLabel(data.sector)] || sectorMap[data.sector] || data.sector || '',
            tipo_emergencia: normTipoMap[normalizeLabel(data.tipoEmergencia)] || tipoEmergenciaMap[data.tipoEmergencia] || data.tipoEmergencia || '',
          }
          if (normNivelMap[normalizeLabel(data.estadoEmergencia)]) payload.nivel_prioridad = normNivelMap[normalizeLabel(data.estadoEmergencia)]
          else payload.estado_emergencia = data.estadoEmergencia || ''
          res = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        }

        if (res.ok) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'bot',
              text: '✓ Emergencia enviada correctamente. Nuestro equipo está en camino.',
            },
          ])
        } else {
          const txt = await res.text().catch(() => null)
          throw new Error(txt || `HTTP ${res.status}`)
        }
      } catch (err) {
        console.error('Error enviando emergencia:', err)
        setMessages((prev) => [
          ...prev,
          {
            role: 'bot',
            text: `⚠ Hubo un error al enviar tu reporte. ${err && err.message ? err.message : ''}`,
          },
        ])
      }
    }

    send()
  }

  // Envía consulta de boletas al backend
  function submitBoletasQuery(data) {
    // Validación básica de RUT si está presente
    if (data.rut) {
      const rut = data.rut.trim()
      const cleanRutRegex = /^\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]$|^\d{7,8}-[\dkK]$/
      if (!cleanRutRegex.test(rut)) {
        setMessages((prev) => [
          ...prev,
          { role: 'bot', text: 'Formato de RUT inválido. Por favor use 12345678-9 o 12.345.678-9' },
        ])
        return
      }
    }

    // TODO: Reemplazar con tu URL de backend
    const apiUrl = 'http://localhost:8000/api/boletas/consultar/'
    // Remove empty keys to avoid backend filtering by empty strings
    const payload = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== '' && v !== null && v !== undefined))
    console.debug('Enviar consulta boletas payload:', payload)
    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        const text = await res.text()
        let parsed = null
        try {
          parsed = text ? JSON.parse(text) : null
        } catch (err) {
          // no-op
        }
        console.debug('Boletas response raw:', parsed)
        if (res.ok) return parsed
        // If server returned errors in JSON, show them to user
        const errMsg = parsed && (parsed.detail || parsed.non_field_errors || parsed[Object.keys(parsed)[0]]) ? parsed : { detail: text || `HTTP ${res.status}` }
        console.error('Error respuesta boletas:', res.status, errMsg)
        // show server message if available
        const display = parsed && (parsed.detail || parsed.error) ? (parsed.detail || parsed.error) : 'Hubo un error al consultar tus boletas. Por favor, intenta nuevamente.'
        setMessages((prev) => [
          ...prev,
          { role: 'bot', text: `⚠ ${display}` },
        ])
        throw new Error(`HTTP ${res.status}`)
      })
        .then((respData) => {
            console.debug('Boletas response parsed:', respData)
            // Normalizar lista (puede venir paginada) o un objeto único
            const list = respData && respData.results ? respData.results : respData

            // Si la petición solicitó solo la boleta vigente, manejar ausencia de pendientes
            if (data && data.solo_vigente) {
              if (!respData || (Array.isArray(respData) && respData.length === 0)) {
                setBoletasResults([])
                setMessages((prev) => [
                  ...prev,
                  { role: 'bot', text: '✓ No se encontraron boletas pendientes. Todas tus boletas están pagadas.' },
                ])
                return
              }

              const vigente = Array.isArray(respData) ? respData[0] : respData
              setBoletasResults([vigente])
              setMessages((prev) => [
                ...prev,
                { role: 'bot', text: '✓ Boleta vigente encontrada. Aquí está la boleta a pagar:' },
              ])
              return
            }

            // Si es una comparación, en lugar de mostrar inmediatamente, pedir selección múltiple
            if (data && data.queryType === 'comparar') {
              const candidates = Array.isArray(list) ? list : (list ? [list] : [])
              if (!candidates || candidates.length === 0) {
                setMessages((prev) => [
                  ...prev,
                  { role: 'bot', text: '✓ No se encontraron boletas para comparar.' },
                ])
                return
              }
              setCompareCandidates(candidates)
              setAwaitingCompareSelection(true)
              // Mostrar opciones numeradas al usuario
              const lines = candidates.map((b, i) => `${i+1}. ${b.periodo_facturacion} - ${b.fecha_emision} - ${b.monto}`)
              setMessages((prev) => [
                ...prev,
                { role: 'bot', text: 'Por favor selecciona las boletas a comparar respondiendo con los números separados por comas (ej: 1,3):' },
                { role: 'bot', text: lines.join('\n') },
              ])
              return
            }

            setBoletasResults(list)
            setMessages((prev) => [
              ...prev,
              { role: 'bot', text: '✓ Consulta realizada correctamente. Aquí están tus boletas:' },
            ])
        })
      .catch((err) => {
        console.error('Error consultando boletas:', err)
        // if we already pushed a server error message above, avoid duplicating
        if (!messages.some((m) => m.text && m.text.includes('Hubo un error al consultar tus boletas'))) {
          setMessages((prev) => [
            ...prev,
            { role: 'bot', text: '⚠ Hubo un error al consultar tus boletas. Por favor, intenta nuevamente.' },
          ])
        }
      })
  }

  // Enviar petición de comparación al backend con boletas_ids
  function submitCompare(boletas_ids) {
    const apiUrl = 'http://localhost:8000/api/boletas/comparar/'
    const payload = { boletas_ids }
    console.debug('Enviar comparar payload:', payload)
    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        const text = await res.text()
        let parsed = null
        try { parsed = text ? JSON.parse(text) : null } catch (e) {}
        if (res.ok) return parsed
        const display = parsed && (parsed.detail || parsed.error) ? (parsed.detail || parsed.error) : 'Hubo un error al comparar tus boletas.'
        setMessages((prev) => [
          ...prev,
          { role: 'bot', text: `⚠ ${display}` },
        ])
        throw new Error(`HTTP ${res.status}`)
      })
      .then((resp) => {
        console.debug('Comparar response:', resp)
        if (!resp || !resp.boletas) {
          setMessages((prev) => [
            ...prev,
            { role: 'bot', text: '⚠ No se pudo obtener la comparación de boletas.' },
          ])
          return
        }
        // Mostrar resumen y detalles
        const stats = resp.estadisticas || resp.statistics || {}
        setBoletasResults(resp.boletas)
        setCompareCandidates(null)
        setMessages((prev) => [
          ...prev,
          { role: 'bot', text: `✓ Comparación lista. Cantidad: ${resp.boletas.length}. Consumo total: ${stats.consumo_total || '-'} m³. Monto total: ${stats.monto_total || '-'}.` },
        ])
        setChatState('boletas_complete')
        // Send the selected boletas to the conversational backend so the assistant can generate a textual analysis
        try {
          const chatPayload = {
            session_id: chatSessionId || undefined,
            message: 'Por favor, analiza y comenta las boletas seleccionadas para el usuario.',
            boletas_ids: resp.boletas.map((b) => b.id_boleta || b.id).filter(Boolean)
          }
          const chatApi = 'http://localhost:8000/api/boletas/chat/message/'
          setIsTyping(true)
          fetch(chatApi, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(chatPayload),
          })
            .then(async (r) => {
              const t = await r.text()
              let parsed = null
              try { parsed = t ? JSON.parse(t) : null } catch (e) { parsed = null }
              if (!r.ok) {
                const display = parsed && (parsed.detail || parsed.error) ? (parsed.detail || parsed.error) : `HTTP ${r.status}`
                setIsTyping(false)
                setMessages((prev) => [...prev, { role: 'bot', text: `⚠ ${display}` }])
                throw new Error(`HTTP ${r.status}`)
              }
              return parsed
            })
            .then((chatResp) => {
              setIsTyping(false)
              if (chatResp && chatResp.message) setMessages((prev) => [...prev, { role: 'bot', text: chatResp.message }])
              if (chatResp && chatResp.session_id) setChatSessionId(chatResp.session_id)
            })
            .catch((err) => { setIsTyping(false); console.error('Error generando análisis conversacional:', err) })
        } catch (e) {
          console.debug('No se pudo enviar boletas al chat backend:', e)
        }
      })
      .catch((err) => {
        console.error('Error comparando boletas:', err)
      })
  }

  // Botones de opciones principales
  const mainButtons = [
    { label: 'Reportar emergencia', action: handleReportEmergency },
    { label: 'Consulta de boletas', action: handleConsultaBoletas },
  ]

  // Respuesta rápida en chat principal
  function handleMainQuestionSubmit() {
    const trimmed = mainChatInput.trim()
    if (!trimmed) return

    const userMsg = { role: 'user', text: trimmed }
    setMainChatMessages((prev) => [...prev, userMsg])
    setMainChatInput('')

    // Send to public anonymous backend endpoint (RAG-only)
    const apiUrl = 'http://localhost:8000/api/public/chat/message/'
    setIsTyping(true)
    const payload = { session_id: chatSessionId || undefined, message: trimmed, anonymous: chatState === 'main' }
    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        const textRes = await res.text()
        let parsed = null
        try { parsed = textRes ? JSON.parse(textRes) : null } catch (e) { parsed = null }
        if (!res.ok) {
          const display = parsed && (parsed.detail || parsed.error) ? (parsed.detail || parsed.error) : `HTTP ${res.status}`
          setMainChatMessages((prev) => [...prev, { role: 'bot', text: `⚠ ${display}` }])
          setIsTyping(false)
          throw new Error(`HTTP ${res.status}`)
        }
        setIsTyping(false)
        const botText = (parsed && (parsed.message || parsed.answer || parsed.response)) ? (parsed.message || parsed.answer || parsed.response) : 'He recibido tu pregunta y la estoy procesando.'
        if (parsed && parsed.session_id) setChatSessionId(parsed.session_id)

        // Si estamos en la sección principal (anónima) y el asistente responde solicitando datos personales,
        // intentamos una segunda petición automática solicitando que responda sin pedir PII.
        if (chatState === 'main' && /(RUT|rut|identif|documento|dni|cedula|identific)/i.test(botText)) {
          // Intentar una segunda petición para obtener una respuesta anónima antes de mostrar orientación
          try {
            setIsTyping(true)
            const followupPayload = { session_id: chatSessionId || undefined, message: `Por favor responde de forma anónima y sin solicitar datos personales. Responde a la siguiente pregunta: ${trimmed}` }
            const followRes = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(followupPayload),
            })
            const followText = await followRes.text()
            let followParsed = null
            try { followParsed = followText ? JSON.parse(followText) : null } catch (e) { followParsed = null }
            setIsTyping(false)
            if (followRes.ok) {
              const followBotText = (followParsed && (followParsed.message || followParsed.answer || followParsed.response)) ? (followParsed.message || followParsed.answer || followParsed.response) : null
              if (followBotText && !/(RUT|rut|identif|documento|dni|cedula|identific)/i.test(followBotText)) {
                setMainChatMessages((prev) => [...prev, { role: 'bot', text: followBotText }])
                if (followParsed && followParsed.session_id) setChatSessionId(followParsed.session_id)
                return
              }
            }

            // Si la segunda respuesta tampoco sirve, mostrar mensaje de orientación y aviso final
            const anonReplacement = 'Puedes consultar aquí de forma anónima sobre servicios, horarios y trámites generales. Para consultas que requieran datos personales, por favor usa "Consulta de boletas".'
            setMainChatMessages((prev) => [...prev, { role: 'bot', text: anonReplacement }])
            setMainChatMessages((prev) => [...prev, { role: 'bot', text: 'Lo siento, no puedo acceder a información privada desde esta sección. Si necesitas consultas que requieran datos personales, por favor selecciona "Consulta de boletas".' }])
          } catch (e) {
            console.error('Error en followup anónimo:', e)
            setIsTyping(false)
            setMainChatMessages((prev) => [...prev, { role: 'bot', text: 'Ocurrió un error al procesar la petición. Por favor intenta nuevamente.' }])
          }
        } else {
          setMainChatMessages((prev) => [...prev, { role: 'bot', text: botText }])
        }
      })
      .catch((err) => {
        console.error('Error enviando pregunta general al backend:', err)
        // Asegurar que el indicador de escritura se apague en caso de fallo de red
        setIsTyping(false)
      })
  }

  // Permite continuar la conversación con el asistente después de una consulta de boletas
  function handleContinueConversationFromBoletas(text) {
    const trimmed = text.trim()
    if (!trimmed) return
    // Añadir mensaje de usuario al hilo de boletas
    setMessages((prev) => [...prev, { role: 'user', text: trimmed }])

    // Prepare payload for chat message endpoint
    const payload = { session_id: chatSessionId || undefined, message: trimmed }
    // If we have boletasResults, include their ids to provide context
    try {
      if (boletasResults && Array.isArray(boletasResults) && boletasResults.length > 0) {
        payload.boletas_ids = boletasResults.map((b) => b.id_boleta || b.id).filter(Boolean)
      }
    } catch (e) {
      // ignore
    }

    const apiUrl = 'http://localhost:8000/api/boletas/chat/message/'
    setIsTyping(true)
    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        const textRes = await res.text()
        let parsed = null
        try { parsed = textRes ? JSON.parse(textRes) : null } catch (e) { parsed = null }
        if (!res.ok) {
          const display = parsed && (parsed.detail || parsed.error) ? (parsed.detail || parsed.error) : `HTTP ${res.status}`
          setMessages((prev) => [...prev, { role: 'bot', text: `⚠ ${display}` }])
          setIsTyping(false)
          throw new Error(`HTTP ${res.status}`)
        }
        setIsTyping(false)
        if (!parsed) {
          setMessages((prev) => [...prev, { role: 'bot', text: '⚠ No se recibió respuesta del asistente.' }])
          return
        }
        // Save session_id if backend returned/confirmed it
        if (parsed.session_id) setChatSessionId(parsed.session_id)
        // Show assistant message
        if (parsed.message) {
          setMessages((prev) => [...prev, { role: 'bot', text: parsed.message }])
        } else {
          setMessages((prev) => [...prev, { role: 'bot', text: 'He recibido tu pregunta y la estoy procesando.' }])
        }
      })
      .catch((err) => {
        setIsTyping(false)
        console.error('Error enviando pregunta al chat backend:', err)
      })
    }

      // Auto-scroll messages container to bottom when messages change
      useEffect(() => {
        try {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
          }
        } catch (e) { /* ignore */ }
      }, [messages, boletasResults, isTyping])

      // Auto-scroll for main chat area
      useEffect(() => {
        try {
          if (mainMessagesRef.current) {
            mainMessagesRef.current.scrollTop = mainMessagesRef.current.scrollHeight
          }
        } catch (e) { /* ignore */ }
      }, [mainChatMessages, isTyping])

      // Helper: choose avatar image for bot messages based on message content
      const getBotAvatarSrc = (text) => {
        // Prefer chatState when applicable
        if (chatState === 'boletas') return GotaLentes
        if (chatState === 'emergency' || chatState === 'emergency_complete') return GotaMecanico
        if (!text) return GotaBase
        if (/boleta|boletas/i.test(text)) return GotaLentes
        if (/emergenc/i.test(text)) return GotaMecanico
        return GotaBase
      }

      // Render a single message with avatar
      const renderMessage = (msg, idx) => {
        const isUser = msg.role === 'user'
        const botSrc = !isUser ? getBotAvatarSrc(msg.text) : null
        const avatarStyle = { width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid #0b63c6', boxShadow: '0 2px 6px rgba(0,0,0,0.12)' }
        return (
          <div key={idx} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: '1rem', alignItems: 'flex-end' }}>
            {!isUser && (
              <img src={botSrc} alt="bot-avatar" style={{ ...avatarStyle, marginRight: '0.75rem' }} />
            )}
            <div style={{ display: 'inline-block', padding: '0.6rem 0.85rem', borderRadius: '10px', backgroundColor: isUser ? '#0b63c6' : '#e8e8e8', color: isUser ? '#fff' : '#000', maxWidth: '60%', wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
              {msg.text}
            </div>
            {isUser && (
              <div style={{ marginLeft: '0.75rem', display: 'flex', alignItems: 'center' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: '50%', background: '#fff', border: '2px solid #0b63c6', boxShadow: '0 2px 6px rgba(0,0,0,0.12)' }}>
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" fill="#0b63c6" />
                  <path d="M4 20c0-2.21 3.58-4 8-4s8 1.79 8 4v1H4v-1z" fill="#0b63c6" />
                </svg>
              </div>
            )}
          </div>
        )
      }

      return (
        <>
      {/* Header with title and controls */}
      <header style={{ position: 'fixed', top: '12px', left: '50%', transform: 'translateX(-50%)', zIndex: 90, width: 'min(100%, 1200px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.97)', borderRadius: '12px', boxShadow: '0 6px 18px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src={GotaBase} alt="Mascota" style={{ width: '56px', height: '56px', objectFit: 'contain', borderRadius: '50%', border: '2px solid #0b63c6', boxShadow: '0 2px 6px rgba(0,0,0,0.12)' }} />
          <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#0b1720' }}>GotinBot</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleRestartChat} title="Reiniciar conversación" style={{ padding: '0.4rem 0.65rem', borderRadius: '20px', border: 'none', cursor: 'pointer', background: '#0b63c6', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M12 6V3L8 7l4 4V8c2.76 0 5 2.24 5 5a5 5 0 0 1-5 5 5 5 0 0 1-5-5H5a7 7 0 0 0 7 7 7 7 0 0 0 7-7c0-3.87-3.13-7-7-7z"/></svg>
            <span>Reiniciar</span>
          </button>
          <button onClick={handleGoHome} title="Volver al inicio" style={{ padding: '0.4rem 0.65rem', borderRadius: '20px', border: 'none', cursor: 'pointer', background: '#fff', color: '#0b63c6', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
            <span>Inicio</span>
          </button>
        </div>
      </header>

      {/* Main chat area */}
      <main style={{ position: 'relative', padding: '2rem', paddingTop: '5rem', maxWidth: '1200px', minHeight: '80vh', backgroundColor: '#fff', borderRadius: '12px', margin: '2rem auto', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        {/* Background logo (semi-transparent, centered) */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none', zIndex: 0 }}>
          <img src={CooperativaLogo} alt="Cooperativa logo" style={{ width: '320px', opacity: 0.06, filter: 'grayscale(100%)' }} />
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
        {chatState === 'main' && (
          <>
            <p style={{ fontSize: '1.1rem', marginBottom: '2rem', textAlign: 'center' }}>
              ¡Hola! Soy GotinBot, el asistente de la Cooperativa La Compañía. Estoy aquí para
              ayudarte con preguntas generales sobre servicios, facturación, pagos y atención.
              Puedes preguntar de forma anónima; si necesitas trámites específicos sobre boletas,
              selecciona "Consulta de boletas".
            </p>

            {/* Botones de opciones principales */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.75rem',
                justifyContent: 'center',
                marginBottom: '3rem',
              }}
            >
              {mainButtons.map((btn, idx) => (
                <button
                  key={idx}
                  onClick={btn.action}
                  style={{
                    padding: '0.75rem 1.25rem',
                    backgroundColor: '#0b63c6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '25px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Chat libre en pantalla principal */}
            <div
              style={{
                maxWidth: '900px',
                margin: '0 auto 2rem',
                backgroundColor: '#f7f9fc',
                border: '1px solid #e0e6f0',
                borderRadius: '12px',
                padding: '1.25rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}
            >
              <div
                ref={mainMessagesRef}
                style={{
                    maxHeight: '340px',
                  overflowY: 'auto',
                  padding: '0.5rem',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                {mainChatMessages.length === 0 && (
                  <div style={{ color: '#6c7a89', fontSize: '0.95rem', textAlign: 'center' }}>
                    Escribe tu pregunta y te responderé aquí.
                  </div>
                )}
                {mainChatMessages.map((msg, idx) => renderMessage(msg, idx))}
                {isTyping && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1rem', alignItems: 'flex-end' }}>
                    <img src={getBotAvatarSrc()} alt="bot-avatar" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid #0b63c6', boxShadow: '0 2px 6px rgba(0,0,0,0.12)', marginRight: '0.75rem' }} />
                    <div style={{ display: 'inline-block', padding: '0.6rem 0.85rem', borderRadius: '10px', backgroundColor: '#e8e8e8', color: '#000', maxWidth: '60%' }}>
                      <em>Escribiendo...</em>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={mainChatInput}
                  onChange={(e) => setMainChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleMainQuestionSubmit()
                  }}
                  placeholder="Escribe tu pregunta aquí (ej: horarios, pagos, servicios...)"
                  style={{
                    flex: 1,
                    padding: '1.05rem 1.25rem',
                    borderRadius: '12px',
                    border: '1px solid #cfd8e3',
                    fontSize: '1.05rem',
                    outline: 'none',
                    minHeight: '48px',
                  }}
                />
                <button
                  onClick={handleMainQuestionSubmit}
                  style={{
                    padding: '0.85rem 1.25rem',
                    backgroundColor: '#0b63c6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  Enviar
                </button>
              </div>
            </div>

            {/* Imagen de la gota */}
            <img
              src={GotaBase}
              alt="Gota Base"
              style={{
                display: 'block',
                margin: '0 auto',
                width: '200px',
                height: '200px',
              }}
            />
          </>
        )}

        {chatState === 'emergency' && (
          <div ref={messagesContainerRef} style={{ maxHeight: '65vh', overflowY: 'auto', marginBottom: '5rem' }}>
            {messages.map((msg, idx) => renderMessage(msg, idx))}
            {isTyping && (
              <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
                <div style={{ display: 'inline-block', padding: '0.5rem 0.75rem', borderRadius: '10px', backgroundColor: '#e8e8e8', color: '#000' }}>
                  escribiendo...
                </div>
              </div>
            )}
          </div>
        )}

        {chatState === 'emergency_complete' && (
          <div style={{ maxHeight: '65vh', overflowY: 'auto', marginBottom: '5rem' }}>
            {messages.map((msg, idx) => renderMessage(msg, idx))}
          </div>
        )}

        {chatState === 'boletas' && (
          <div ref={messagesContainerRef} style={{ maxHeight: '65vh', overflowY: 'auto', marginBottom: '5rem' }}>
            {messages.map((msg, idx) => renderMessage(msg, idx))}
            {isTyping && (
              <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
                <div style={{ display: 'inline-block', padding: '0.5rem 0.75rem', borderRadius: '10px', backgroundColor: '#e8e8e8', color: '#000' }}>
                  escribiendo...
                </div>
              </div>
            )}
          </div>
        )}

        {chatState === 'boletas_complete' && (
          <>
            <div ref={messagesContainerRef} style={{ maxHeight: '55vh', overflowY: 'auto', marginBottom: '6.5rem' }}>
              {messages.map((msg, idx) => renderMessage(msg, idx))}
              {isTyping && (
                <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
                  <div style={{ display: 'inline-block', padding: '0.5rem 0.75rem', borderRadius: '10px', backgroundColor: '#e8e8e8', color: '#000' }}>
                    escribiendo...
                  </div>
                </div>
              )}
            </div>

            {/* Fixed panel above input to keep boletas visible */}
            {boletasResults && (
              <div style={{ position: 'fixed', bottom: '86px', left: '50%', transform: 'translateX(-50%)', width: 'min(100%, 1200px)', maxWidth: 'calc(100% - 4rem)', background: '#fff', padding: '0.75rem', borderRadius: '10px', boxShadow: '0 6px 18px rgba(0,0,0,0.08)', maxHeight: '180px', overflowY: 'auto', zIndex: 60 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {boletasResults.map((b) => (
                    <div key={b.id_boleta || b.id} style={{ border: '1px solid #e0e0e0', padding: '0.5rem', borderRadius: '6px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{b.nombre} <span style={{ fontWeight: 400, marginLeft: '0.5rem', color: '#666' }}>{b.rut}</span></div>
                        <div style={{ fontSize: '0.85rem', color: '#444' }}>{b.periodo_facturacion} • Consumo: {b.consumo} m³ • ${b.monto}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        </div>
      </main>

      {/* Input area para flujo de emergencia */}
      {(chatState === 'emergency' || chatState === 'emergency_complete') && !waitingForImage && (
        <div
          style={{
            position: 'fixed',
            bottom: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(100%, 1200px)',
            maxWidth: 'calc(100% - 4rem)',
            backgroundColor: '#0b63c6',
            borderTop: '2px solid #084f9a',
            padding: '1rem',
            display: 'flex',
            gap: '0.75rem',
            boxShadow: '0 -4px 12px rgba(11, 99, 198, 0.2)',
            borderRadius: '12px 12px 0 0',
          }}
        >
          
          <input
            type="text"
            id="emergency-input"
            placeholder="Escribe tu respuesta aquí..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const input = e.target.value
                if (input.trim() && chatState === 'emergency') {
                  handleEmergencyResponse(input)
                  e.target.value = ''
                }
              }
            }}
            style={{
              flex: '1',
              padding: '0.75rem 1rem',
              fontSize: '1rem',
              border: 'none',
              borderRadius: '25px',
              outline: 'none',
              backgroundColor: '#fff',
              color: '#0b1720',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
            }}
          />
          <button
            onClick={() => {
              const input = document.getElementById('emergency-input').value
              if (input.trim() && chatState === 'emergency') {
                handleEmergencyResponse(input)
                document.getElementById('emergency-input').value = ''
              }
            }}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#fff',
              color: '#0b63c6',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '1rem',
              transition: 'all 200ms',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e8f2ff'
              e.target.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#fff'
              e.target.style.transform = 'scale(1)'
            }}
          >
            Enviar
          </button>
        </div>
      )}

      {/* Botón para cargar imagen de emergencia */}
      {waitingForImage && chatState === 'emergency' && (
        <div
          style={{
            position: 'fixed',
            bottom: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(100%, 1200px)',
            maxWidth: 'calc(100% - 4rem)',
            backgroundColor: '#0b63c6',
            borderTop: '2px solid #084f9a',
            padding: '1.5rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: '0 -4px 12px rgba(11, 99, 198, 0.2)',
            borderRadius: '12px 12px 0 0',
          }}
        >
          
          <input
            type="file"
            accept="image/*"
            onChange={handleEmergencyImageUpload}
            style={{ display: 'none' }}
            id="emergency-image-upload"
          />
          <label
            htmlFor="emergency-image-upload"
            style={{
              display: 'inline-block',
              padding: '1rem 2rem',
              backgroundColor: '#28a745',
              color: 'white',
              borderRadius: '25px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              transition: 'all 200ms',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#218838'
              e.target.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#28a745'
              e.target.style.transform = 'scale(1)'
            }}
          >
            📷 Cargar imagen de la emergencia
          </label>
        </div>
      )}

      {/* Input area para flujo de boletas */}
      {(chatState === 'boletas' || chatState === 'boletas_complete') && (
        <div
          style={{
            position: 'fixed',
            bottom: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(100%, 1200px)',
            maxWidth: 'calc(100% - 4rem)',
            backgroundColor: '#0b63c6',
            borderTop: '2px solid #084f9a',
            padding: '1rem',
            display: 'flex',
            gap: '0.75rem',
            boxShadow: '0 -4px 12px rgba(11, 99, 198, 0.2)',
            borderRadius: '12px 12px 0 0',
          }}
        >
          
          <input
            type="text"
            id="boletas-input"
            placeholder="Escribe tu respuesta aquí..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const input = e.target.value
                if (input.trim()) {
                  // Si estamos en selección para comparar, o en el flujo de boletas
                  if (awaitingCompareSelection && compareCandidates && compareCandidates.length > 0) {
                    handleBoletasResponse(input)
                    e.target.value = ''
                  } else if (chatState === 'boletas') {
                    handleBoletasResponse(input)
                    e.target.value = ''
                  } else if (chatState === 'boletas_complete') {
                    // Permitir seguir conversando con la IA
                    handleContinueConversationFromBoletas(input)
                    e.target.value = ''
                  }
                }
              }
            }}
            style={{
              flex: '1',
              padding: '0.75rem 1rem',
              fontSize: '1rem',
              border: 'none',
              borderRadius: '25px',
              outline: 'none',
              backgroundColor: '#fff',
              color: '#0b1720',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
            }}
          />
          <button
            onClick={() => {
              const input = document.getElementById('boletas-input').value
              if (input.trim()) {
                if (awaitingCompareSelection && compareCandidates && compareCandidates.length > 0) {
                  handleBoletasResponse(input)
                  document.getElementById('boletas-input').value = ''
                } else if (chatState === 'boletas') {
                  handleBoletasResponse(input)
                  document.getElementById('boletas-input').value = ''
                } else if (chatState === 'boletas_complete') {
                  handleContinueConversationFromBoletas(input)
                  document.getElementById('boletas-input').value = ''
                }
              }
            }}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#fff',
              color: '#0b63c6',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '1rem',
              transition: 'all 200ms',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e8f2ff'
              e.target.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#fff'
              e.target.style.transform = 'scale(1)'
            }}
          >
            Enviar
          </button>
        </div>
      )}
    </>
  )
}

export default App

