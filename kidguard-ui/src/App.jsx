import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'

import Splash from './screens/parent/Splash'
import Register from './screens/parent/Register'
import Login from './screens/parent/Login'
import MFAVerify from './screens/parent/MFAVerify'
import Dashboard from './screens/parent/Dashboard'
import LiveMap from './screens/parent/LiveMap'
import History from './screens/parent/History'
import SafeZones from './screens/parent/SafeZones'
import AddZone from './screens/parent/AddZone'
import Notifications from './screens/parent/Notifications'
import SOSModal from './screens/parent/SOSModal'
import ChildProfile from './screens/parent/ChildProfile'
import Settings from './screens/parent/Settings'
import Offline from './screens/parent/Offline'

import ChildLogin from './screens/child/ChildLogin'
import ChildHome from './screens/child/ChildHome'
import SOSConfirm from './screens/child/SOSConfirm'
import SOSSent from './screens/child/SOSSent'
import SOSQueued from './screens/child/SOSQueued'

import NavIndex from './screens/NavIndex'
import ProtectedRoute from './components/ProtectedRoute'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/mfa" element={<MFAVerify />} />
          <Route path="/dashboard"     element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/map"           element={<ProtectedRoute><LiveMap /></ProtectedRoute>} />
          <Route path="/history"       element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/zones"         element={<ProtectedRoute><SafeZones /></ProtectedRoute>} />
          <Route path="/zones/add"     element={<ProtectedRoute><AddZone /></ProtectedRoute>} />
          <Route path="/zones/edit/:zoneId" element={<ProtectedRoute><AddZone /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/sos-alert"     element={<ProtectedRoute><SOSModal /></ProtectedRoute>} />
          <Route path="/child-profile" element={<ProtectedRoute><ChildProfile /></ProtectedRoute>} />
          <Route path="/settings"      element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/offline" element={<Offline />} />
          <Route path="/child/login" element={<ChildLogin />} />
          <Route path="/child" element={<ChildHome />} />
          <Route path="/child/sos-confirm" element={<SOSConfirm />} />
          <Route path="/child/sos-sent" element={<SOSSent />} />
          <Route path="/child/sos-queued" element={<SOSQueued />} />
          <Route path="/nav" element={<NavIndex />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  )
}
