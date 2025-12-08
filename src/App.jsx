import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import EmergencyForm from './components/EmergencyForm'

/**
 * App
 * Main app with a top selector (Emergencia / Reclamo). When 'Emergencia'
 * is selected the `EmergencyForm` is shown above the main content.
 * The component is documented and simple to modify.
 */
function App() {
  const [count, setCount] = useState(0)

  // mode: 'none' | 'emergencia' | 'reclamo'
  const [mode, setMode] = useState('emergencia')

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
      <div className="top-bar">
        <div className="top-bar-inner">
          <div className="selector">
            <label>
              <input type="radio" name="mode" value="emergencia" checked={mode === 'emergencia'} onChange={() => setMode('emergencia')} />
              Emergencia
            </label>
            <label>
              <input type="radio" name="mode" value="reclamo" checked={mode === 'reclamo'} onChange={() => setMode('reclamo')} />
              Reclamo
            </label>
          </div>

          <div className="logos">
            <a href="https://vite.dev" target="_blank" rel="noreferrer">
              <img src={viteLogo} className="logo" alt="Vite logo" />
            </a>
            <a href="https://react.dev" target="_blank" rel="noreferrer">
              <img src={reactLogo} className="logo react" alt="React logo" />
            </a>
          </div>
        </div>
      </div>

      {isFormVisible && (
        <div className="top-form-wrapper">
          <EmergencyForm onSubmit={handleEmergencySubmit} onClose={handleCloseForm} />
        </div>
      )}

      <main className={isFormVisible ? 'main with-top-form' : 'main'}>
        <h1>Vite + React</h1>
        <div className="card">
          <button onClick={() => setCount((c) => c + 1)}>
            count is {count}
          </button>
          <p>
            Edit <code>src/App.jsx</code> and save to test HMR
          </p>
        </div>
        <p className="read-the-docs">
          Click on the Vite and React logos to learn more
        </p>
      </main>
    </>
  )
}

export default App

