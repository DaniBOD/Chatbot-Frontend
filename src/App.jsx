import { useState } from 'react'
import GotaBase from './assets/Gota base.png'
import './App.css'
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
      text: '¡Hola! Soy el chatbot de la Cooperativa de Agua Potable La Compañía. ¿En qué puedo ayudarte hoy?',
    },
  ])

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
  })

  // Paso actual en el flujo de emergencia (0-6)
  const [emergencyStep, setEmergencyStep] = useState(0)

  // Paso actual en el flujo de boletas (0-2)
  const [boletasStep, setBoletasStep] = useState(0)

  // Estado para manejar la imagen de emergencia
  const [waitingForImage, setWaitingForImage] = useState(false)
  const [emergencyImage, setEmergencyImage] = useState(null)

  // Campos del formulario de emergencia en orden
  const emergencyFields = [
    { key: 'nombreCompleto', label: 'Nombre completo', placeholder: 'Ej: Ana Pérez' },
    { key: 'telefono', label: 'Teléfono', placeholder: 'Ej: +56 9 1234 5678' },
    { key: 'sector', label: 'Sector', placeholder: 'Ej: Centro' },
    { key: 'direccion', label: 'Dirección', placeholder: 'Calle, número' },
    { key: 'tipoEmergencia', label: 'Tipo de emergencia', placeholder: 'Ej: Incendio, Accidente' },
    { key: 'estadoEmergencia', label: 'Estado de emergencia', placeholder: 'Ej: Activa, Contenida' },
    { key: 'descripcion', label: 'Descripción detallada', placeholder: 'Describe lo que ocurre' },
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
  }

  // Inicia flujo de consulta de boletas
  function handleConsultaBoletas() {
    setChatState('boletas')
    setBoletasStep(0)
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: 'Consulta de boletas' },
      {
        role: 'bot',
        text: `Perfecto, voy a ayudarte con tu consulta de boletas. Que es lo que necesito saber:\n 1. Consultar consumo \n 2. Consultar monto a pagar \n 3. Comparar y /o ver boletas`,
      },
    ])
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
    const newData = { ...emergencyData, [currentField.key]: userInput }
    setEmergencyData(newData)

    // Añade respuesta del usuario al chat
    const updatedMessages = [...messages, { role: 'user', text: userInput }]

    // Siguiente pregunta
    const nextField = emergencyFields[emergencyStep + 1]
    updatedMessages.push({
      role: 'bot',
      text: `¿Cuál es tu ${nextField.label.toLowerCase()}?`,
    })
    setMessages(updatedMessages)
    setEmergencyStep(emergencyStep + 1)
  }

  // Procesa respuesta del usuario en flujo de boletas
  function handleBoletasResponse(userInput) {
    if (!userInput.trim()) return

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
      } else if (userInput.trim() === '2') {
        // Usuario seleccionó "Consultar monto a pagar"
        updatedMessages.push({
          role: 'bot',
          text: 'Has seleccionado: Consultar monto a pagar\n\n¿Con qué datos deseas identificarte?\n1. Número de cliente\n2. RUT\n3. Nombre completo',
        })
        setMessages(updatedMessages)
        setBoletasStep(1)
      } else if (userInput.trim() === '3') {
        // Usuario seleccionó "Comparar y/o ver boletas"
        updatedMessages.push({
          role: 'bot',
          text: 'Has seleccionado: Comparar y/o ver boletas\n\n¿Con qué datos deseas identificarte?\n1. Número de cliente\n2. RUT\n3. Nombre completo',
        })
        setMessages(updatedMessages)
        setBoletasStep(1)
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
        // Usuario seleccionó "Número de cliente"
        updatedMessages.push({
          role: 'bot',
          text: '¿Cuál es tu número de cliente? (Ej: 12345)',
        })
        setMessages(updatedMessages)
        setBoletasStep(2)
      } else if (userInput.trim() === '2') {
        // Usuario seleccionó "RUT"
        updatedMessages.push({
          role: 'bot',
          text: '¿Cuál es tu RUT? (Ej: 12345678-9)',
        })
        setMessages(updatedMessages)
        setBoletasStep(2)
      } else if (userInput.trim() === '3') {
        // Usuario seleccionó "Nombre completo"
        updatedMessages.push({
          role: 'bot',
          text: '¿Cuál es tu nombre completo? (Ej: Juan Pérez)',
        })
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
      const newData = { ...boletasData, [boletasData.identificationType]: userInput }
      setBoletasData(newData)
      
      updatedMessages.push({
        role: 'bot',
        text: '✓ Gracias por proporcionar tu información. Consultando tus boletas...',
      })
      setMessages(updatedMessages)
      setChatState('boletas_complete')
      console.log('Boletas data:', newData)
      submitBoletasQuery(newData)
    }
  }

  // Envía datos de emergencia al backend
  function submitEmergency(data) {
    // TODO: Reemplazar con tu URL de backend
    const apiUrl = 'http://localhost:8000/api/emergencias/'
    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then((res) => {
        if (res.ok) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'bot',
              text: '✓ Emergencia enviada correctamente. Nuestro equipo está en camino.',
            },
          ])
        } else {
          throw new Error(`HTTP ${res.status}`)
        }
      })
      .catch((err) => {
        console.error('Error enviando emergencia:', err)
        setMessages((prev) => [
          ...prev,
          {
            role: 'bot',
            text: '⚠ Hubo un error al enviar tu reporte. Por favor, intenta nuevamente.',
          },
        ])
      })
  }

  // Envía consulta de boletas al backend
  function submitBoletasQuery(data) {
    // TODO: Reemplazar con tu URL de backend
    const apiUrl = 'http://localhost:8000/api/boletas/'
    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then((res) => {
        if (res.ok) {
          return res.json()
        } else {
          throw new Error(`HTTP ${res.status}`)
        }
      })
      .then((boletas) => {
        setMessages((prev) => [
          ...prev,
          {
            role: 'bot',
            text: `✓ Consulta realizada correctamente. Aquí están tus boletas: ${JSON.stringify(boletas)}`,
          },
        ])
      })
      .catch((err) => {
        console.error('Error consultando boletas:', err)
        setMessages((prev) => [
          ...prev,
          {
            role: 'bot',
            text: '⚠ Hubo un error al consultar tus boletas. Por favor, intenta nuevamente.',
          },
        ])
      })
  }

  // Botones de opciones principales
  const mainButtons = [
    { label: 'Reportar emergencia', action: handleReportEmergency },
    { label: 'Consulta de boletas', action: handleConsultaBoletas },
  ]

  return (
    <>
      {/* Header */}
      <div style={{ backgroundColor: '#0b63c6', color: '#fff', padding: '1rem', textAlign: 'center' }}>
        <h1>💬 Chatbot - La Compañía</h1>
      </div>

      {/* Main chat area */}
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', minHeight: '80vh', backgroundColor: '#fff', borderRadius: '12px', margin: '2rem auto', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        {chatState === 'main' && (
          <>
            <p style={{ fontSize: '1.1rem', marginBottom: '2rem', textAlign: 'center' }}>
              ¡Hola! Soy el chatbot de la Cooperativa de Agua Potable La Compañía. ¿En qué puedo
              ayudarte hoy? Puedes preguntarme sobre facturación, servicios, pagos, experiencias
              con la cooperativa, etc.
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
          <div style={{ maxHeight: '65vh', overflowY: 'auto', marginBottom: '5rem' }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: '1rem',
                  textAlign: msg.role === 'user' ? 'right' : 'left',
                }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    backgroundColor: msg.role === 'user' ? '#0b63c6' : '#e8e8e8',
                    color: msg.role === 'user' ? '#fff' : '#000',
                    maxWidth: '70%',
                    wordWrap: 'break-word',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        )}

        {chatState === 'emergency_complete' && (
          <div style={{ maxHeight: '65vh', overflowY: 'auto', marginBottom: '5rem' }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: '1rem',
                  textAlign: msg.role === 'user' ? 'right' : 'left',
                }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    backgroundColor: msg.role === 'user' ? '#0b63c6' : '#e8e8e8',
                    color: msg.role === 'user' ? '#fff' : '#000',
                    maxWidth: '70%',
                    wordWrap: 'break-word',
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        )}

        {chatState === 'boletas' && (
          <div style={{ maxHeight: '65vh', overflowY: 'auto', marginBottom: '5rem' }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: '1rem',
                  textAlign: msg.role === 'user' ? 'right' : 'left',
                }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    backgroundColor: msg.role === 'user' ? '#0b63c6' : '#e8e8e8',
                    color: msg.role === 'user' ? '#fff' : '#000',
                    maxWidth: '70%',
                    wordWrap: 'break-word',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        )}

        {chatState === 'boletas_complete' && (
          <div style={{ maxHeight: '65vh', overflowY: 'auto', marginBottom: '5rem' }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: '1rem',
                  textAlign: msg.role === 'user' ? 'right' : 'left',
                }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    backgroundColor: msg.role === 'user' ? '#0b63c6' : '#e8e8e8',
                    color: msg.role === 'user' ? '#fff' : '#000',
                    maxWidth: '70%',
                    wordWrap: 'break-word',
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        )}
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
                if (input.trim() && chatState === 'boletas') {
                  handleBoletasResponse(input)
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
              const input = document.getElementById('boletas-input').value
              if (input.trim() && chatState === 'boletas') {
                handleBoletasResponse(input)
                document.getElementById('boletas-input').value = ''
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

