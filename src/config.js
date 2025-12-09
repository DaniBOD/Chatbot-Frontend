// Frontend configuration for API integration.
// Set `VITE_API_BASE` in your environment (eg. `.env`) to point to the
// backend base URL used by your teammates. Example: VITE_API_BASE=http://localhost:8000

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

// Default path that the EmergencyForm will POST to. Change this if your
// backend expects a different route (for example '/api/incidents/').
// Note: the backend mounts the module at `/api/emergencias/` and the router
// registers the viewset under `emergencias`, so the full list/create path
// becomes `/api/emergencias/emergencias/`.
export const EMERGENCY_PATH = '/api/emergencias/emergencias/'

// Full URL helper
export function emergencyUrl() {
  return `${API_BASE.replace(/\/$/, '')}${EMERGENCY_PATH}`
}
