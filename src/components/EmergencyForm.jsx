import { useState } from 'react'
import { emergencyUrl } from '../config'

/**
 * EmergencyForm with client-side validation and ARIA accessibility.
 * - All fields are required (adjust `requiredFields` to change this)
 * - Basic phone pattern validation is applied
 * - Shows inline error messages and disables submit while sending
 * - Posts to backend using `emergencyUrl()` or `apiPath` prop override
 */
export default function EmergencyForm({ onSubmit = () => {}, onClose = () => {}, apiPath }) {
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [telefono, setTelefono] = useState('')
  const [sector, setSector] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [tipoEmergencia, setTipoEmergencia] = useState('')
  const [estadoEmergencia, setEstadoEmergencia] = useState('')
  const [direccion, setDireccion] = useState('')
  const [fotografia, setFotografia] = useState(null)

  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)
  const [errors, setErrors] = useState({})

  // Define which fields are required and friendly labels for messages
  const requiredFields = {
    nombreCompleto: 'Nombre completo',
    telefono: 'Teléfono',
    sector: 'Sector',
    tipoEmergencia: 'Tipo de emergencia',
    estadoEmergencia: 'Estado de emergencia',
    direccion: 'Dirección',
  }

  // Simple phone validation: allow digits, spaces, + and - and parentheses
  function validatePhone(phone) {
    if (!phone) return false
    const p = phone.trim()
    return /^[0-9+()\-\s]{6,20}$/.test(p)
  }

  function validate() {
    const next = {}
    // Check required fields
    for (const key of Object.keys(requiredFields)) {
      if (!eval(key) || String(eval(key)).trim() === '') {
        next[key] = `${requiredFields[key]} es obligatorio.`
      }
    }

    // Phone specific
    if (!next.telefono && !validatePhone(telefono)) {
      next.telefono = 'Introduce un teléfono válido (ej: +56 9 1234 5678).'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage(null)
    if (!validate()) return

    // Cuando hay una fotografía, usamos FormData para enviar multipart/form-data
    let body = null
    let headers = { }
    if (fotografia) {
      const fd = new FormData()
      fd.append('nombre_usuario', nombreCompleto)
      fd.append('telefono', normalizePhone(telefono))
      fd.append('sector', sector)
      fd.append('descripcion', descripcion)
      fd.append('tipo_emergencia', tipoEmergencia)
      fd.append('estado_emergencia', estadoEmergencia)
      fd.append('direccion', direccion)
      fd.append('fotografia', fotografia)
      body = fd
      // DO NOT set Content-Type header; browser will set multipart boundary
    } else {
      const data = {
        nombre_usuario: nombreCompleto,
        telefono: normalizePhone(telefono),
        sector,
        descripcion,
        tipo_emergencia: tipoEmergencia,
        estado_emergencia: estadoEmergencia,
        direccion,
      }
      body = JSON.stringify(data)
      headers['Content-Type'] = 'application/json'
    }

    const url = apiPath || emergencyUrl()
    setSubmitting(true)

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body,
      })
      if (!res.ok) {
        // Intentar obtener detalle del error desde la API (JSON), si falla, leer texto
        let errMsg = null
        try {
          const errJson = await res.json()
          // DRF suele devolver detalles en formato {field: [errors]} o {detail: '...'}
          if (errJson.detail) errMsg = errJson.detail
          else if (typeof errJson === 'object') {
            // Concatenar mensajes de campos
            errMsg = Object.entries(errJson)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
              .join(' | ')
          } else {
            errMsg = String(errJson)
          }
        } catch (ex) {
          errMsg = await res.text().catch(() => `HTTP ${res.status}`)
        }
        throw new Error(errMsg || `HTTP ${res.status}`)
      }
      const json = await res.json().catch(() => ({}))
      setMessage({ type: 'success', text: 'Emergencia enviada correctamente.' })
      onSubmit({ nombreCompleto, telefono: normalizePhone(telefono), sector, descripcion, tipoEmergencia, estadoEmergencia, direccion, fotografia: fotografia ? fotografia.name : null }, json)
      // reset fields after success
      setNombreCompleto('')
      setTelefono('')
      setSector('')
      setDescripcion('')
      setTipoEmergencia('')
      setEstadoEmergencia('')
      setDireccion('')
      setErrors({})
    } catch (err) {
      console.error(err)
      const text = err && err.message ? err.message : 'No se pudo enviar. Verifica la conexión.'
      setMessage({ type: 'error', text })
    } finally {
      setSubmitting(false)
    }
  }

  // Normalize phone to digits with optional leading +
  function normalizePhone(phone) {
    if (!phone) return ''
    let p = String(phone).trim()
    // Preserve leading + if present, then remove all non-digits
    const hasPlus = p.startsWith('+')
    p = p.replace(/[^0-9]/g, '')
    if (hasPlus) p = '+' + p
    return p
  }

  // Helper to render input fields with ARIA and inline errors
  function renderField({ id, label, value, setValue, placeholder, type = 'text' }) {
    const err = errors[id]
    return (
      <div className="emergency-form-row">
        <label htmlFor={id}>{label}</label>
        {type === 'textarea' ? (
          <textarea
            id={id}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            aria-required={requiredFields[id] ? 'true' : 'false'}
            aria-invalid={err ? 'true' : 'false'}
            aria-describedby={err ? `${id}-error` : undefined}
          />
        ) : (
          <input
            id={id}
            type={type}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            aria-required={requiredFields[id] ? 'true' : 'false'}
            aria-invalid={err ? 'true' : 'false'}
            aria-describedby={err ? `${id}-error` : undefined}
          />
        )}
        {err && (
          <div id={`${id}-error`} role="alert" style={{ color: '#7f1d1d', fontWeight: 700 }}>
            {err}
          </div>
        )}
      </div>
    )
  }

  return (
    <form className="emergency-form" onSubmit={handleSubmit} aria-live="polite">
      {renderField({ id: 'nombreCompleto', label: 'Nombre completo', value: nombreCompleto, setValue: setNombreCompleto, placeholder: 'Ej: Ana Pérez' })}

      {renderField({ id: 'telefono', label: 'Teléfono', value: telefono, setValue: setTelefono, placeholder: 'Ej: +56 9 1234 5678' })}

      {renderField({ id: 'sector', label: 'Sector', value: sector, setValue: setSector, placeholder: 'Ej: Centro' })}

      {renderField({ id: 'direccion', label: 'Dirección', value: direccion, setValue: setDireccion, placeholder: 'Calle, número, referencia' })}

      {renderField({ id: 'tipoEmergencia', label: 'Tipo de emergencia', value: tipoEmergencia, setValue: setTipoEmergencia, placeholder: 'Ej: Incendio, Accidente' })}

      {renderField({ id: 'estadoEmergencia', label: 'Estado de emergencia', value: estadoEmergencia, setValue: setEstadoEmergencia, placeholder: 'Ej: Activa, Contenida' })}

      {renderField({ id: 'descripcion', label: 'Descripción', value: descripcion, setValue: setDescripcion, placeholder: 'Describe lo que está ocurriendo...', type: 'textarea' })}

      <div className="emergency-form-row">
        <label htmlFor="fotografia">Fotografía (opcional)</label>
        <input
          id="fotografia"
          type="file"
          accept="image/*"
          onChange={(e) => setFotografia(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
          aria-describedby={errors.fotografia ? 'fotografia-error' : undefined}
        />
        {fotografia && (
          <div style={{ fontSize: 12, color: '#333', marginTop: 6 }}>
            Archivo seleccionado: {fotografia.name}
          </div>
        )}
      </div>

      <div className="emergency-form-actions">
        <button type="button" className="btn secondary" onClick={onClose} disabled={submitting} aria-disabled={submitting}>Cancelar</button>
        <button type="submit" className="btn primary" disabled={submitting} aria-disabled={submitting}>{submitting ? 'Enviando...' : 'Enviar emergencia'}</button>
      </div>

      {message && (
        <div role="status" className={`form-message ${message.type}`}>{message.text}</div>
      )}
    </form>
  )
}
