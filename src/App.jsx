import { useState } from 'react'
import GotaBase from './assets/Gota base.png'
import './App.css'
import { useNavigate } from 'react-router-dom'

function App() {
  const navigate = useNavigate();
  const [count, setCount] = useState(0)

  return (
    <>
      
      <h2 style={{textAlign: 'center'}}>Chat de asistencia de coperativa de agua de graneros</h2>
      <img src={GotaBase} alt="Gota Base" style={{position: 'absolute', top: '420px', left: '250px', width: '250px', height: '250px', display: 'block', margin: '0 auto'}} />
      <p>Por favor, seleccione el motivo de contacto </p>
      <div className="card">
        <button style={{width: '180px', height: '80px', position: 'absolute', top: '400px', left: '550px'}} onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        
        <button style={{width: '180px', height: '80px', position: 'absolute', top: '400px', right: '550px'}} onClick={() => navigate('/cuenta')}> Problemas con cuenta de agua </button>

      </div>

    </>
  )
}

export default App
