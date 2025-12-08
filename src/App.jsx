import { useState } from 'react'
import GotaBase from './assets/Gota base.png'
import './App.css'
import { useNavigate } from 'react-router-dom'
import EmergencyForm from './components/EmergencyForm'

/**
 * App
 * Merged component:
 * - Top selector (Emergencia / Reclamo) allows choosing form or navigation
 * - Shows EmergencyForm overlay when 'Emergencia' is selected
 * - Main content shows title, image, and buttons for navigation
 * - Documented and easy to modify
 */
function App() {
  const navigate = useNavigate()
  const [count, setCount] = useState(0)
  const [mode, setMode] = useState('none') // 'none', 'emergencia', 'reclamo'

  function handleEmergencySubmit(data /*, json */) {
    // Called after a successful POST. Currently logs to console.
    console.log('Emergency saved in App:', data)
  }

  function handleCloseForm() {
    setMode('none')
  }

  const isFormVisible = mode === 'emergencia'

  return (
    <>
      {/* Top selector bar: Emergencia or Reclamo */}
      <div className="top-bar">
        <div className="top-bar-inner">
          <div className="selector">
            <label>
              <input
                type="radio"
                name="mode"
                value="emergencia"
                checked={mode === 'emergencia'}
                onChange={() => setMode('emergencia')}
              />
              Emergencia
            </label>
            <label>
              <input
                type="radio"
                name="mode"
                value="reclamo"
                checked={mode === 'reclamo'}
                onChange={() => setMode('reclamo')}
              />
              Reclamo
            </label>
          </div>
        </div>
      </div>

      {/* Emergency form overlay */}
      {isFormVisible && (
        <div className="top-form-wrapper">
          <EmergencyForm onSubmit={handleEmergencySubmit} onClose={handleCloseForm} />
        </div>
      )}

      {/* Main content */}
      <main className={isFormVisible ? 'main with-top-form' : 'main'}>
        <h2 style={{ textAlign: 'center' }}>Chat de asistencia de cooperativa de agua de Graneros</h2>
        <img
          src={GotaBase}
          alt="Gota Base"
          style={{
            position: 'absolute',
            top: '420px',
            left: '250px',
            width: '250px',
            height: '250px',
            display: 'block',
            margin: '0 auto',
          }}
        />
        <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '1.1rem' }}>
          Por favor, seleccione el motivo de contacto
        </p>
        <div className="card" style={{ position: 'relative', height: '400px' }}>
          {/* Emergencia button (left) */}
          <button
            style={{
              width: '180px',
              height: '80px',
              position: 'absolute',
              top: '150px',
              left: '150px',
              cursor: 'pointer',
            }}
            onClick={() => setMode('emergencia')}
          >
            Emergencia
          </button>

          {/* Water account problems button (right) */}
          <button
            style={{
              width: '180px',
              height: '80px',
              position: 'absolute',
              top: '150px',
              right: '150px',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/cuenta')}
          >
            Problemas con cuenta de agua
          </button>
        </div>
      </main>
    </>
  )
}

export default App

