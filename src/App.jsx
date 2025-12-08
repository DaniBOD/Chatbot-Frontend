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

  // Chat state: 'main' | 'emergency' | 'emergency_complete'
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

  // Paso actual en el flujo de emergencia (0-6)
  const [emergencyStep, setEmergencyStep] = useState(0)

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

  // Procesa respuesta del usuario en flujo de emergencia
  function handleEmergencyResponse(userInput) {
    if (!userInput.trim()) return

    const currentField = emergencyFields[emergencyStep]
    const newData = { ...emergencyData, [currentField.key]: userInput }
    setEmergencyData(newData)

    // Añade respuesta del usuario al chat
    const updatedMessages = [...messages, { role: 'user', text: userInput }]

    // Si es la última pregunta, completa el flujo
    if (emergencyStep === emergencyFields.length - 1) {
      updatedMessages.push({
        role: 'bot',
        text: '✓ Gracias por proporcionar toda la información. Enviando tu reporte de emergencia...',
      })
      setMessages(updatedMessages)
      setChatState('emergency_complete')
      // Aquí se enviaría al backend
      console.log('Emergency data:', newData)
      submitEmergency(newData)
    } else {
      // Siguiente pregunta
      const nextField = emergencyFields[emergencyStep + 1]
      updatedMessages.push({
        role: 'bot',
        text: `¿Cuál es tu ${nextField.label.toLowerCase()}?`,
      })
      setMessages(updatedMessages)
      setEmergencyStep(emergencyStep + 1)
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

  // Botones de opciones principales
  const mainButtons = [
    { label: 'Reportar emergencia', action: handleReportEmergency },
    { label: 'Consulta de boletas', action: () => console.log('consulta boletas') },
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
      </main>

      {/* Input area para flujo de emergencia */}
      {(chatState === 'emergency' || chatState === 'emergency_complete') && (
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
    </>
  )
}

export default App

