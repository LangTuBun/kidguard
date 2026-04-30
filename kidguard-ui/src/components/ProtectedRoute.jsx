import { Navigate } from 'react-router-dom'
import { isTokenValid, clearToken } from '../utils/auth'

export default function ProtectedRoute({ children }) {
  if (!isTokenValid()) {
    clearToken()
    return <Navigate to="/login" replace />
  }
  return children
}
