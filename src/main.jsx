import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Cuenta from './Cuenta.jsx'

createRoot(document.getElementById('root')).render(
  
<BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/cuenta" element={<Cuenta />} /> 
    </Routes>
  </BrowserRouter>
)

